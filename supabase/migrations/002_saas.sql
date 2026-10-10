begin;
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 alias text not null check(length(alias) between 1 and 60),
 role text not null default 'PARENT' check(role in ('STUDENT','PARENT','PLATFORM_ADMIN')),
 language text not null default 'uz' check(language in ('uz','ru')),
 status text not null default 'active' check(status in ('active','blocked','archived')),
 created_at timestamptz not null default now()
);
create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 100),
 owner_id uuid not null references public.profiles, status text not null default 'active' check(status in ('active','blocked','archived')),
 resource_limit integer not null default 100 check(resource_limit between 1 and 10000), created_at timestamptz not null default now()
);
create table public.organization_members (
 organization_id uuid references public.organizations on delete cascade, user_id uuid references public.profiles on delete cascade,
 role text not null check(role in ('ORG_OWNER','ORG_ADMIN','TEACHER','STUDENT')), active boolean not null default true,
 primary key(organization_id,user_id)
);
create table public.learner_profiles (
 id uuid primary key default gen_random_uuid(), user_id uuid unique references public.profiles on delete cascade,
 alias text not null check(length(alias) between 2 and 60), age_group text not null check(age_group in ('8–10','11–13','14–16')),
 avatar text not null default '🌱', language text not null default 'uz' check(language in ('uz','ru')),
 created_by uuid not null references public.profiles, archived boolean not null default false, created_at timestamptz not null default now()
);
create table public.guardian_links (
 guardian_id uuid references public.profiles on delete cascade, learner_id uuid references public.learner_profiles on delete cascade,
 confirmed_at timestamptz not null default now(), primary key(guardian_id,learner_id)
);
create table public.groups (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations,
 name text not null check(length(name) between 2 and 80), teacher_id uuid not null references public.profiles,
 archived boolean not null default false, created_at timestamptz not null default now()
);
create table public.group_members (
 group_id uuid references public.groups on delete cascade, learner_id uuid references public.learner_profiles on delete cascade,
 primary key(group_id,learner_id)
);
create table public.invitations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations,
 group_id uuid references public.groups, project_id uuid, role text not null check(role in ('TEACHER','STUDENT')),
 token_hash text not null unique, created_by uuid not null references public.profiles,
 expires_at timestamptz not null, used_by uuid references public.profiles, revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.projects (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references public.profiles,
 organization_id uuid references public.organizations, learner_id uuid references public.learner_profiles,
 title text not null check(length(title) between 2 and 100), description text not null default '' check(length(description)<=2000),
 category text not null default 'own', mode text not null default 'practice' check(mode in ('practice','real')),
 stage integer not null default 0 check(stage between 0 and 7), audience text not null default '',
 goal text not null default '', budget bigint not null default 0 check(budget between 0 and 1000000000),
 notes text not null default '', results text not null default '', reflection text not null default '',
 archived boolean not null default false, revision integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.invitations add foreign key(project_id) references public.projects;
create table public.project_members (
 project_id uuid references public.projects on delete cascade, user_id uuid references public.profiles on delete cascade,
 role text not null check(role in ('editor','viewer')), primary key(project_id,user_id)
);
create table public.project_tasks (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects on delete cascade,
 title text not null check(length(title) between 1 and 160), assigned_to uuid references public.profiles,
 due_date date, completed boolean not null default false, created_by uuid not null default auth.uid() references public.profiles,
 created_at timestamptz not null default now()
);
create table public.project_stages (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects on delete cascade,
 stage integer not null check(stage between 0 and 7), actor_id uuid not null default auth.uid() references public.profiles,
 created_at timestamptz not null default now()
);
create table public.demand_responses (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects on delete cascade,
 kind text not null check(kind in ('opinion','intent','purchase')), interested boolean not null,
 acceptable_price bigint not null default 0 check(acceptable_price between 0 and 1000000000),
 comment text not null default '' check(length(comment)<=500), created_at timestamptz not null default now()
);
create table public.calculations (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects on delete cascade,
 model text not null check(model in ('sale','rental')), units integer not null check(units>0), planned_sales integer not null check(planned_sales>=0),
 total_cost bigint not null check(total_cost>=0), unit_price bigint not null check(unit_price>=0),
 fixed_cost bigint not null default 0 check(fixed_cost>=0), author_id uuid not null default auth.uid() references public.profiles,
 created_at timestamptz not null default now(), constraint sale_inventory check(model='rental' or planned_sales<=units)
);
create table public.ledger_entries (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects,
 author_id uuid not null default auth.uid() references public.profiles,
 kind text not null check(kind in ('capital','revenue','expense','refund','correction','allocation')),
 mode text not null check(mode in ('practice','real')), amount bigint not null check(amount between 0 and 1000000000),
 cost bigint not null default 0 check(cost between 0 and 1000000000), category text not null default '', note text not null default '' check(length(note)<=500),
 original_id uuid references public.ledger_entries, idempotency_key uuid not null,
 occurred_at timestamptz not null default now(), created_at timestamptz not null default now(),
 unique(author_id,idempotency_key), constraint related_entry check(kind not in ('refund','correction') or original_id is not null)
);
create table public.savings_goals (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references public.profiles,
 title text not null check(length(title) between 2 and 100), target bigint not null check(target between 1 and 1000000000),
 allocated bigint not null default 0 check(allocated>=0), created_at timestamptz not null default now()
);
create table public.allocations (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references public.profiles,
 amount bigint not null check(amount>=0), working integer not null, dream integer not null, personal integer not null,
 created_at timestamptz not null default now(), check(working>=0 and dream>=0 and personal>=0 and working+dream+personal=100)
);
create table public.lessons (
 id uuid primary key default gen_random_uuid(), title_uz text not null, title_ru text not null,
 body_uz text not null, body_ru text not null, question_uz text not null, question_ru text not null,
 answer_uz text not null, answer_ru text not null, explanation_uz text not null, explanation_ru text not null,
 age_group text not null default 'all' check(age_group in ('all','8–10','11–13','14–16')),
 status text not null default 'draft' check(status in ('draft','published')), revision integer not null default 1,
 created_at timestamptz not null default now()
);
create table public.assignments (
 id uuid primary key default gen_random_uuid(), group_id uuid not null references public.groups,
 lesson_id uuid references public.lessons, title text not null check(length(title) between 2 and 160),
 instructions text not null check(length(instructions)<=2000), due_at timestamptz,
 created_by uuid not null default auth.uid() references public.profiles, created_at timestamptz not null default now()
);
create table public.submissions (
 id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.assignments,
 learner_id uuid not null references public.learner_profiles, body text not null check(length(body) between 1 and 4000),
 status text not null default 'submitted' check(status in ('submitted','reviewed')), submitted_at timestamptz not null default now(),
 unique(assignment_id,learner_id)
);
create table public.feedback (
 id uuid primary key default gen_random_uuid(), submission_id uuid not null references public.submissions,
 author_id uuid not null default auth.uid() references public.profiles, body text not null check(length(body) between 1 and 2000),
 clarity smallint check(clarity between 1 and 5), reasoning smallint check(reasoning between 1 and 5), reflection smallint check(reflection between 1 and 5),
 created_at timestamptz not null default now()
);
create table public.simulation_sessions (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references public.profiles,
 scenario text not null check(scenario in ('bracelet','books','cards')), seed integer not null, round integer not null default 0,
 cash bigint not null, stock integer not null default 0, revision integer not null default 1,
 completed boolean not null default false, created_at timestamptz not null default now()
);
create table public.simulation_events (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.simulation_sessions,
 round integer not null, quantity integer not null, price bigint not null, sold integer not null,
 cost bigint not null, revenue bigint not null, event text not null, unique(session_id,round)
);
create table public.user_achievements (
 owner_id uuid references public.profiles on delete cascade, event_key text not null, points integer not null check(points between 0 and 100),
 created_at timestamptz not null default now(), primary key(owner_id,event_key)
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles,
 title text not null, path text not null check(path like '/%' and path not like '//%'), read_at timestamptz,
 event_key text not null, created_at timestamptz not null default now(), unique(owner_id,event_key)
);
create table public.support_tickets (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references public.profiles,
 subject text not null check(length(subject) between 2 and 120), category text not null default 'help',
 priority text not null default 'normal' check(priority in ('normal','urgent')), status text not null default 'open' check(status in ('open','answered','closed')),
 created_at timestamptz not null default now()
);
create table public.support_messages (
 id uuid primary key default gen_random_uuid(), ticket_id uuid not null references public.support_tickets,
 author_id uuid not null default auth.uid() references public.profiles, body text not null check(length(body) between 1 and 3000),
 internal boolean not null default false, created_at timestamptz not null default now()
);
create table public.moderation_reports (
 id uuid primary key default gen_random_uuid(), reporter_id uuid not null default auth.uid() references public.profiles,
 storefront_id uuid references public.storefronts, reason text not null check(length(reason) between 2 and 1000),
 status text not null default 'open' check(status in ('open','resolved')), decision text not null default '', created_at timestamptz not null default now()
);
create table public.feature_flags (
 key text primary key, enabled boolean not null default false, description text not null default '', updated_at timestamptz not null default now()
);
create table public.audit_logs (
 id bigint generated always as identity primary key, actor_id uuid references public.profiles, organization_id uuid references public.organizations,
 action text not null, entity text not null, object_id text not null, reason text not null default '',
 changed_fields text[] not null default '{}', created_at timestamptz not null default now()
);
create table public.ai_usage (
 id uuid primary key default gen_random_uuid(), owner_id uuid references public.profiles, organization_id uuid references public.organizations,
 request_key uuid not null unique, model text not null, input_tokens integer not null default 0, output_tokens integer not null default 0,
 status text not null, created_at timestamptz not null default now()
);
create table public.storefront_versions (
 id uuid primary key default gen_random_uuid(), storefront_id uuid not null references public.storefronts,
 revision integer not null, title text not null, description text not null,
 status text not null default 'DRAFT' check(status in ('DRAFT','IN_REVIEW','CHANGES_REQUESTED','APPROVED','PUBLISHED','UNPUBLISHED')),
 reviewed_by uuid references public.profiles, reason text not null default '', approved_at timestamptz,
 created_at timestamptz not null default now(), unique(storefront_id,revision), check(status not in ('APPROVED','PUBLISHED') or approved_at is not null)
);
create table public.storefront_products (
 id uuid primary key default gen_random_uuid(), version_id uuid not null references public.storefront_versions,
 name text not null, description text not null default '', price bigint not null check(price between 0 and 1000000000),
 available boolean not null default true, image_path text
);

create function public.is_platform_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles where id=auth.uid() and role='PLATFORM_ADMIN' and status='active') $$;
create function public.org_role(org uuid, roles text[]) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from organization_members m join organizations o on o.id=m.organization_id
 join profiles p on p.id=m.user_id where m.organization_id=org and m.user_id=auth.uid() and m.active and m.role=any(roles) and o.status='active' and p.status='active') $$;
create function public.owns_learner(learner uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from learner_profiles where id=learner and user_id=auth.uid()) $$;
create function public.guards_learner(learner uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from guardian_links where learner_id=learner and guardian_id=auth.uid()) $$;
create function public.teaches_group(g uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from groups where id=g and not archived and (teacher_id=auth.uid() and org_role(organization_id,array['TEACHER','ORG_OWNER','ORG_ADMIN']) or org_role(organization_id,array['ORG_OWNER','ORG_ADMIN']))) $$;
create function public.sees_learner(learner uuid) returns boolean language sql stable security definer set search_path=public as $$
 select owns_learner(learner) or guards_learner(learner) or exists(select 1 from group_members where learner_id=learner and teaches_group(group_id)) $$;
create function public.can_project(project uuid, editing boolean default false) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from projects p join profiles u on u.id=auth.uid() where p.id=project and u.status='active' and (
 p.owner_id=auth.uid() or guards_learner(p.learner_id) or
 exists(select 1 from project_members m where m.project_id=p.id and m.user_id=auth.uid() and (not editing or m.role='editor')) or
 (not editing and p.organization_id is not null and org_role(p.organization_id,array['ORG_OWNER','ORG_ADMIN'])) or
 (not editing and p.organization_id is not null and exists(select 1 from group_members gm join groups g on g.id=gm.group_id where gm.learner_id=p.learner_id and g.organization_id=p.organization_id and teaches_group(g.id)))
 )) $$;

create function public.new_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id,alias) values(new.id,coalesce(nullif(left(new.raw_user_meta_data->>'alias',60),''),'Learner')); return new; end $$;
create trigger auth_profile after insert on auth.users for each row execute function public.new_profile();
insert into profiles(id,alias) select id,coalesce(nullif(left(raw_user_meta_data->>'alias',60),''),'Learner') from auth.users on conflict do nothing;
create function public.protect_profile() returns trigger language plpgsql set search_path=public as $$
begin if current_user not in ('postgres','supabase_admin','service_role') and not is_platform_admin() and (new.role<>old.role or new.status<>old.status or new.id<>old.id) then raise exception 'role_change_denied'; end if; return new; end $$;
create trigger profile_privileges before update on public.profiles for each row execute function public.protect_profile();
create function public.project_revision() returns trigger language plpgsql set search_path=public as $$
begin if new.owner_id<>old.owner_id or new.organization_id is distinct from old.organization_id or new.learner_id is distinct from old.learner_id then raise exception 'scope_change_denied'; end if;
new.revision:=old.revision+1; new.updated_at:=now(); if new.stage<>old.stage then insert into project_stages(project_id,stage) values(new.id,new.stage); end if; return new; end $$;
create trigger project_version before update on public.projects for each row execute function public.project_revision();
create function public.log_mutation() returns trigger language plpgsql security definer set search_path=public as $$
declare fields text[]; obj jsonb; org uuid;
begin obj:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
select array_agg(key) into fields from jsonb_each(obj) where tg_op<>'UPDATE' or value is distinct from to_jsonb(old)->key;
org:=nullif(obj->>'organization_id','')::uuid;
insert into audit_logs(actor_id,organization_id,action,entity,object_id,changed_fields) values(auth.uid(),org,tg_op,tg_table_name,coalesce(obj->>'id',obj->>'key',obj->>'user_id',obj->>'learner_id',obj->>'group_id',obj->>'project_id','scope'),coalesce(fields,'{}'));
return coalesce(new,old); end $$;

do $$ declare t text; begin
foreach t in array array['profiles','organizations','organization_members','learner_profiles','guardian_links','groups','group_members','invitations','projects','project_members','project_tasks','project_stages','demand_responses','calculations','ledger_entries','savings_goals','allocations','lessons','assignments','submissions','feedback','simulation_sessions','simulation_events','user_achievements','notifications','support_tickets','support_messages','moderation_reports','feature_flags','audit_logs','ai_usage','storefront_versions','storefront_products'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 if t not in ('audit_logs','ai_usage','project_stages','simulation_events','user_achievements','notifications') then
 execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function public.log_mutation()',t); end if;
end loop; end $$;
create policy profile_read on profiles for select to authenticated using(id=auth.uid() or is_platform_admin() or exists(select 1 from organization_members m where m.user_id=profiles.id and org_role(m.organization_id,array['ORG_OWNER','ORG_ADMIN'])));
create policy profile_edit on profiles for update to authenticated using(id=auth.uid() or is_platform_admin()) with check(id=auth.uid() or is_platform_admin());
create policy org_read on organizations for select to authenticated using(org_role(id,array['ORG_OWNER','ORG_ADMIN','TEACHER','STUDENT']) or is_platform_admin());
create policy org_admin on organizations for update to authenticated using(org_role(id,array['ORG_OWNER','ORG_ADMIN']) or is_platform_admin());
create policy members_read on organization_members for select to authenticated using(user_id=auth.uid() or org_role(organization_id,array['ORG_OWNER','ORG_ADMIN']));
-- Membership writes, guardian links and invitations are RPC-only; no client role escalation.
create policy learner_read on learner_profiles for select to authenticated using(sees_learner(id));
create policy learner_edit on learner_profiles for update to authenticated using(guards_learner(id)) with check(guards_learner(id));
create policy guardian_read on guardian_links for select to authenticated using(guardian_id=auth.uid() or owns_learner(learner_id));
create policy groups_read on groups for select to authenticated using(teaches_group(id) or exists(select 1 from group_members where group_id=groups.id and owns_learner(learner_id)));
create policy groups_create on groups for insert to authenticated with check(org_role(organization_id,array['ORG_OWNER','ORG_ADMIN']) and exists(select 1 from organization_members where organization_id=groups.organization_id and user_id=teacher_id and active and role in ('TEACHER','ORG_OWNER','ORG_ADMIN')));
create policy groups_update on groups for update to authenticated using(org_role(organization_id,array['ORG_OWNER','ORG_ADMIN'])) with check(org_role(organization_id,array['ORG_OWNER','ORG_ADMIN']));
create policy group_member_read on group_members for select to authenticated using(teaches_group(group_id) or sees_learner(learner_id));
create policy project_read on projects for select to authenticated using(owner_id=auth.uid() or can_project(id));
create policy project_create on projects for insert to authenticated with check(owner_id=auth.uid() and (organization_id is null or org_role(organization_id,array['STUDENT','TEACHER','ORG_OWNER','ORG_ADMIN'])) and (learner_id is null or owns_learner(learner_id) or guards_learner(learner_id)));
create policy project_edit on projects for update to authenticated using(can_project(id,true)) with check(can_project(id,true));
create policy project_remove on projects for delete to authenticated using(owner_id=auth.uid());
create policy project_members_read on project_members for select to authenticated using(can_project(project_id));
do $$ declare t text; begin foreach t in array array['project_tasks','demand_responses','calculations'] loop
execute format('create policy child_read on %I for select to authenticated using(can_project(project_id))',t);
execute format('create policy child_create on %I for insert to authenticated with check(can_project(project_id,true))',t);
execute format('create policy child_edit on %I for update to authenticated using(can_project(project_id,true)) with check(can_project(project_id,true))',t);
execute format('create policy child_remove on %I for delete to authenticated using(can_project(project_id,true))',t); end loop; end $$;
create policy stages_read on project_stages for select to authenticated using(can_project(project_id));
create policy stages_create on project_stages for insert to authenticated with check(can_project(project_id,true) and actor_id=auth.uid());
create policy ledger_read on ledger_entries for select to authenticated using(exists(select 1 from projects p where p.id=project_id and (p.owner_id=auth.uid() or guards_learner(p.learner_id) or (ledger_entries.mode='practice' and can_project(p.id)))));
-- Immutable append-only ledger. Corrections and refunds use validated RPCs.
create policy ledger_create on ledger_entries for insert to authenticated with check(author_id=auth.uid() and can_project(project_id,true) and kind in ('capital','revenue','expense','allocation') and original_id is null and exists(select 1 from projects where id=project_id and projects.mode=ledger_entries.mode));
do $$ declare t text; begin foreach t in array array['savings_goals','allocations','simulation_sessions'] loop
execute format('create policy own_read on %I for select to authenticated using(owner_id=auth.uid())',t);
execute format('create policy own_create on %I for insert to authenticated with check(owner_id=auth.uid())',t);
execute format('create policy own_update on %I for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid())',t); end loop; end $$;
create policy simulation_events_read on simulation_events for select to authenticated using(exists(select 1 from simulation_sessions where id=session_id and owner_id=auth.uid()));
create policy lessons_read on lessons for select to authenticated using(status='published' or is_platform_admin());
create policy lessons_admin on lessons for all to authenticated using(is_platform_admin()) with check(is_platform_admin());
create policy assignments_read on assignments for select to authenticated using(teaches_group(group_id) or exists(select 1 from group_members where group_id=assignments.group_id and sees_learner(learner_id)));
create policy assignments_manage on assignments for all to authenticated using(teaches_group(group_id)) with check(teaches_group(group_id) and created_by=auth.uid());
create policy submission_read on submissions for select to authenticated using(sees_learner(learner_id) or exists(select 1 from assignments where id=assignment_id and teaches_group(group_id)));
create policy submission_create on submissions for insert to authenticated with check(owns_learner(learner_id) and exists(select 1 from assignments a join group_members gm on gm.group_id=a.group_id where a.id=assignment_id and gm.learner_id=submissions.learner_id));
create policy submission_update on submissions for update to authenticated using(owns_learner(learner_id) or exists(select 1 from assignments where id=assignment_id and teaches_group(group_id)));
create policy feedback_read on feedback for select to authenticated using(exists(select 1 from submissions where id=submission_id and sees_learner(learner_id)) or exists(select 1 from submissions s join assignments a on a.id=s.assignment_id where s.id=submission_id and teaches_group(a.group_id)));
create policy feedback_create on feedback for insert to authenticated with check(author_id=auth.uid() and exists(select 1 from submissions s join assignments a on a.id=s.assignment_id where s.id=submission_id and teaches_group(a.group_id)));
create policy achievements_read on user_achievements for select to authenticated using(owner_id=auth.uid());
create policy notifications_read on notifications for select to authenticated using(owner_id=auth.uid());
create policy notifications_update on notifications for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy ticket_read on support_tickets for select to authenticated using(owner_id=auth.uid() or is_platform_admin());
create policy ticket_create on support_tickets for insert to authenticated with check(owner_id=auth.uid());
create policy ticket_admin on support_tickets for update to authenticated using(is_platform_admin());
create policy message_read on support_messages for select to authenticated using((not internal and exists(select 1 from support_tickets where id=ticket_id and owner_id=auth.uid())) or is_platform_admin());
create policy message_create on support_messages for insert to authenticated with check(author_id=auth.uid() and (is_platform_admin() or (not internal and exists(select 1 from support_tickets where id=ticket_id and owner_id=auth.uid()))));
create policy reports_read on moderation_reports for select to authenticated using(reporter_id=auth.uid() or is_platform_admin());
create policy reports_create on moderation_reports for insert to authenticated with check(reporter_id=auth.uid());
create policy reports_admin on moderation_reports for update to authenticated using(is_platform_admin());
create policy flags_read on feature_flags for select to authenticated using(true);
create policy flags_admin on feature_flags for all to authenticated using(is_platform_admin()) with check(is_platform_admin());
create policy audit_read on audit_logs for select to authenticated using(is_platform_admin() or org_role(organization_id,array['ORG_OWNER','ORG_ADMIN']));
create policy usage_read on ai_usage for select to authenticated using(owner_id=auth.uid() or is_platform_admin());
-- Legacy storefront tables remain inaccessible to browser roles. Server-reviewed snapshots remain immutable.

create function public.create_organization(org_name text) returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid; begin if not exists(select 1 from profiles where id=auth.uid() and role='PARENT' and status='active') then raise exception 'forbidden'; end if;
insert into organizations(name,owner_id) values(org_name,auth.uid()) returning id into result;
insert into organization_members values(result,auth.uid(),'ORG_OWNER',true); return result; end $$;
create function public.create_learner(nickname text, age text, lang text default 'uz') returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid; begin if not exists(select 1 from profiles where id=auth.uid() and role='PARENT' and status='active') then raise exception 'forbidden'; end if;
insert into learner_profiles(alias,age_group,language,created_by) values(nickname,age,lang,auth.uid()) returning id into result;
insert into guardian_links(guardian_id,learner_id) values(auth.uid(),result); return result; end $$;
create function public.add_group_learner(g uuid, learner uuid) returns void language plpgsql security definer set search_path=public as $$
begin if not teaches_group(g) or not guards_learner(learner) then raise exception 'forbidden'; end if;
insert into group_members values(g,learner) on conflict do nothing; end $$;
create function public.set_member_role(org uuid, target uuid, new_role text) returns void language plpgsql security definer set search_path=public as $$
begin if not org_role(org,array['ORG_OWNER','ORG_ADMIN']) or new_role not in ('ORG_ADMIN','TEACHER','STUDENT') then raise exception 'forbidden'; end if;
if exists(select 1 from organization_members where organization_id=org and user_id=target and role='ORG_OWNER') then raise exception 'owner_protected'; end if;
update organization_members set role=new_role where organization_id=org and user_id=target; end $$;
create function public.correct_ledger(original uuid, new_amount bigint, new_cost bigint, explanation text, operation_key uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare item ledger_entries; result uuid; begin select * into item from ledger_entries where id=original for update;
if item.id is null or not can_project(item.project_id,true) or item.kind not in ('capital','revenue','expense') then raise exception 'forbidden'; end if;
insert into ledger_entries(project_id,author_id,kind,mode,amount,cost,note,original_id,idempotency_key)
values(item.project_id,auth.uid(),'correction',item.mode,new_amount,new_cost,explanation,original,operation_key)
on conflict(author_id,idempotency_key) do update set id=ledger_entries.id returning id into result; return result; end $$;

create index membership_user on organization_members(user_id);
create index projects_scope on projects(organization_id,owner_id,updated_at desc);
create index learners_creator on learner_profiles(created_by);
create index tasks_project on project_tasks(project_id,due_date);
create index ledger_project on ledger_entries(project_id,occurred_at desc);
create index groups_tenant on groups(organization_id,teacher_id);
create index ticket_owner on support_tickets(owner_id,created_at desc);
create index notifications_owner on notifications(owner_id,read_at);
create index audit_time on audit_logs(created_at desc);
create index demand_project on demand_responses(project_id);
create index submission_assignment on submissions(assignment_id);

-- Security-definer functions are callable only with verified authenticated identities.
do $$ declare f record; begin for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('is_platform_admin','org_role','owns_learner','guards_learner','teaches_group','sees_learner','can_project','create_organization','create_learner','add_group_learner','set_member_role','correct_ledger') loop
execute format('revoke all on function %s from public,anon',f.signature); execute format('grant execute on function %s to authenticated',f.signature); end loop; end $$;
commit;
