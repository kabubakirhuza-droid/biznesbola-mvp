begin;
create function public.attach_learner_account(learner uuid, account uuid, guardian uuid) returns void language plpgsql security definer set search_path=public as $$
begin if not exists(select 1 from guardian_links where learner_id=learner and guardian_id=guardian) or exists(select 1 from learner_profiles where id=learner and user_id is not null) then raise exception 'forbidden';end if;
update profiles set role='STUDENT' where id=account;
update learner_profiles set user_id=account where id=learner;
end $$;
revoke all on function attach_learner_account(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function attach_learner_account(uuid,uuid,uuid) to service_role;

-- Immutable actor/scope fields prevent an editor from moving children into another tenant.
create function public.protect_scope() returns trigger language plpgsql set search_path=public as $$
declare field text;begin foreach field in array tg_argv loop
if to_jsonb(new)->field is distinct from to_jsonb(old)->field then raise exception 'scope_change_denied';end if;end loop;return new;end $$;
create trigger task_scope before update on project_tasks for each row execute function protect_scope('project_id','created_by');
create trigger group_scope before update on groups for each row execute function protect_scope('organization_id');
create trigger assignment_scope before update on assignments for each row execute function protect_scope('group_id','created_by');
create trigger submission_scope before update on submissions for each row execute function protect_scope('assignment_id','learner_id');
create trigger learner_scope before update on learner_profiles for each row execute function protect_scope('id','created_by');
create trigger org_scope before update on organizations for each row execute function protect_scope('id','owner_id');
create trigger ticket_scope before update on support_tickets for each row execute function protect_scope('owner_id');
create trigger notification_scope before update on notifications for each row execute function protect_scope('owner_id','title','path','event_key');

create function public.validate_stage() returns trigger language plpgsql set search_path=public as $$
begin
if tg_op='INSERT' and new.stage<>0 then raise exception 'invalid_stage';end if;
if tg_op='UPDATE' and new.stage<>old.stage then
if new.stage<>old.stage+1 then raise exception 'invalid_stage';end if;
if old.stage=0 and length(trim(new.description))<2 or old.stage=1 and length(trim(new.audience))<2 or old.stage=2 and not exists(select 1 from demand_responses where project_id=new.id) or old.stage=3 and not exists(select 1 from project_tasks where project_id=new.id) or old.stage=4 and new.budget<=0 or old.stage=5 and not exists(select 1 from project_tasks where project_id=new.id and completed) or old.stage=6 and length(trim(new.results))<2 then raise exception 'stage_requirements';end if;
end if;return new;end $$;
create trigger stage_validation before insert or update on projects for each row execute function validate_stage();
-- User-facing achievement progression comes from validated database events, not client XP input.
create function public.profile_active() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and status='active') $$;
-- Blocked accounts cannot keep reading protected data with an old token.
do $$ declare t text;begin foreach t in array array['profiles','organizations','organization_members','learner_profiles','guardian_links','groups','group_members','projects','project_members','project_tasks','project_stages','demand_responses','calculations','ledger_entries','savings_goals','allocations','lessons','assignments','submissions','feedback','simulation_sessions','simulation_events','user_achievements','notifications','support_tickets','support_messages','moderation_reports','feature_flags','audit_logs','ai_usage','storefront_versions','storefront_products','invitations'] loop
execute format('create policy active_identity on %I as restrictive for all to authenticated using(profile_active()) with check(profile_active())',t);end loop;end $$;
revoke all on function profile_active() from public,anon;grant execute on function profile_active() to authenticated;

alter table public.projects add column guest_source_id uuid;
create unique index guest_import_once on projects(owner_id,guest_source_id) where guest_source_id is not null;
create function public.import_guest_project(source_id uuid, project_title text, project_description text, project_category text, target_audience text, project_goal text, task_titles text[]) returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid; task text;begin if not profile_active() then raise exception 'forbidden';end if;
select id into result from projects where owner_id=auth.uid() and guest_source_id=source_id;if result is not null then return result;end if;
insert into projects(owner_id,title,description,category,audience,goal,guest_source_id) values(auth.uid(),project_title,project_description,project_category,target_audience,project_goal,source_id) on conflict(owner_id,guest_source_id) where guest_source_id is not null do nothing returning id into result;
if result is null then select id into result from projects where owner_id=auth.uid() and guest_source_id=source_id;return result;end if;
foreach task in array task_titles loop insert into project_tasks(project_id,title,created_by) values(result,task,auth.uid());end loop;return result;end $$;
revoke all on function import_guest_project(uuid,text,text,text,text,text,text[]) from public,anon;grant execute on function import_guest_project(uuid,text,text,text,text,text,text[]) to authenticated;
commit;
