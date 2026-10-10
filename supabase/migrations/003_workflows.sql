begin;
create table public.lesson_versions (
 id bigint generated always as identity primary key, lesson_id uuid not null references public.lessons,
 revision integer not null, title_uz text not null, title_ru text not null, body_uz text not null, body_ru text not null,
 created_at timestamptz not null default now(), unique(lesson_id,revision)
);
alter table public.lesson_versions enable row level security;
grant select on public.lesson_versions to authenticated;
create policy lesson_history_admin on lesson_versions for select to authenticated using(is_platform_admin());
create function public.version_lesson() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into lesson_versions(lesson_id,revision,title_uz,title_ru,body_uz,body_ru) values(old.id,old.revision,old.title_uz,old.title_ru,old.body_uz,old.body_ru);new.revision:=old.revision+1;return new;end $$;
create trigger lesson_version before update on lessons for each row execute function version_lesson();

create function public.start_simulation(kind text, random_seed integer) returns public.simulation_sessions language plpgsql security definer set search_path=public as $$
declare result simulation_sessions;begin
if not exists(select 1 from profiles where id=auth.uid() and status='active') or random_seed not between 0 and 1000000 then raise exception 'forbidden';end if;
insert into simulation_sessions(owner_id,scenario,seed,cash) values(auth.uid(),kind,random_seed,case when kind='cards' then 40000 else 50000 end) returning * into result; return result;end $$;
create function public.play_simulation(session uuid, expected_revision integer, quantity integer, price bigint) returns jsonb language plpgsql security definer set search_path=public as $$
declare s simulation_sessions; base_cost bigint; reference_price bigint; demand integer; event_code integer; event_name text; unit_cost bigint; total_cost bigint; sold integer; available integer; revenue bigint; event_row simulation_events;
begin
select * into s from simulation_sessions where id=session and owner_id=auth.uid() for update;
if s.id is null then raise exception 'forbidden';end if;
if s.revision<>expected_revision or s.completed then raise exception 'conflict';end if;
if quantity not between 0 and 100 or price not between 1 and 100000 then raise exception 'invalid_round';end if;
base_cost:=case s.scenario when 'bracelet' then 3500 when 'books' then 6000 else 2000 end;
reference_price:=case s.scenario when 'bracelet' then 6500 when 'books' then 3000 else 4500 end;
demand:=case s.scenario when 'bracelet' then 9 when 'books' then 8 else 12 end;
event_code:=mod(mod(s.seed::bigint*48271+(s.round+1)::bigint*69621,2147483647),5);
event_name:=(array['normal','materialsRise','lowDemand','limitedSupply','return'])[event_code+1];
unit_cost:=case when event_code=1 then ceil(base_cost*1.2) else base_cost end;
if event_code=3 and quantity>5 then raise exception 'limited_supply';end if;
total_cost:=quantity*unit_cost+case when s.scenario='books' then s.stock*300 else 0 end;
if total_cost>s.cash then raise exception 'insufficient_cash';end if;
available:=s.stock+quantity;
demand:=greatest(0,demand+case when event_code=2 then -4 else 0 end-floor(greatest(0,price-reference_price)/1000.0)::integer);
sold:=least(available,demand);if event_code=4 and sold>0 then sold:=sold-1;end if;
revenue:=sold*price;
insert into simulation_events(session_id,round,quantity,price,sold,cost,revenue,event) values(s.id,s.round+1,quantity,price,sold,total_cost,revenue,event_name) returning * into event_row;
update simulation_sessions set cash=cash-total_cost+revenue,stock=case when scenario='books' then available else available-sold end,round=round+1,revision=revision+1,completed=round+1>=5 where id=s.id returning * into s;
if s.completed then insert into user_achievements values(auth.uid(),'simulation:'||s.id,20,now()) on conflict do nothing;end if;
return jsonb_build_object('data',to_jsonb(s),'event',to_jsonb(event_row));end $$;
-- Simulation state cannot be rewritten via direct API; only checked rounds change it.
drop policy own_create on simulation_sessions;
drop policy own_update on simulation_sessions;

create function public.create_invitation(org uuid, invited_role text, hash text, team uuid default null, project uuid default null) returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid; begin
if invited_role not in ('TEACHER','STUDENT') or not org_role(org,array['ORG_OWNER','ORG_ADMIN']) or length(hash)<>64 then raise exception 'forbidden';end if;
if team is not null and not exists(select 1 from groups where id=team and organization_id=org) then raise exception 'forbidden';end if;
if project is not null and not exists(select 1 from projects where id=project and organization_id=org and owner_id=auth.uid()) then raise exception 'forbidden';end if;
insert into invitations(organization_id,group_id,project_id,role,token_hash,created_by,expires_at) values(org,team,project,invited_role,hash,auth.uid(),now()+interval '72 hours') returning id into result;return result;end $$;
create function public.accept_invitation(hash text) returns uuid language plpgsql security definer set search_path=public as $$
declare invite invitations;learner uuid;begin
if not exists(select 1 from profiles where id=auth.uid() and status='active') then raise exception 'forbidden';end if;
select * into invite from invitations where token_hash=hash and revoked_at is null and used_by is null and expires_at>now() for update;
if invite.id is null then raise exception 'invalid_invitation';end if;
if invite.project_id is not null then insert into project_members values(invite.project_id,auth.uid(),'editor') on conflict do nothing;
else
insert into organization_members values(invite.organization_id,auth.uid(),invite.role,true) on conflict do nothing;
if invite.group_id is not null then select id into learner from learner_profiles where user_id=auth.uid();if learner is null then raise exception 'learner_required';end if;insert into group_members values(invite.group_id,learner) on conflict do nothing;end if;
end if;
update invitations set used_by=auth.uid() where id=invite.id;return invite.organization_id;end $$;
create function public.revoke_invitation(invite_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin update invitations set revoked_at=now() where id=invite_id and org_role(organization_id,array['ORG_OWNER','ORG_ADMIN']);if not found then raise exception 'forbidden';end if;end $$;
create policy invite_read on invitations for select to authenticated using(org_role(organization_id,array['ORG_OWNER','ORG_ADMIN']));

create function public.admin_role(target uuid, new_role text, explanation text) returns void language plpgsql security definer set search_path=public as $$
begin
if not is_platform_admin() or new_role not in ('PARENT','STUDENT','PLATFORM_ADMIN') or length(explanation)<3 then raise exception 'forbidden';end if;
perform pg_advisory_xact_lock(781234);
if exists(select 1 from profiles where id=target and role='PLATFORM_ADMIN' and status='active') and new_role<>'PLATFORM_ADMIN' and (select count(*) from profiles where role='PLATFORM_ADMIN' and status='active')<=1 then raise exception 'last_admin_protected';end if;
update profiles set role=new_role where id=target;
insert into audit_logs(actor_id,action,entity,object_id,reason) values(auth.uid(),'role_change','profiles',target::text,explanation);
end $$;
create function public.last_admin_guard() returns trigger language plpgsql security definer set search_path=public as $$
begin if old.role='PLATFORM_ADMIN' and old.status='active' and (new.role<>'PLATFORM_ADMIN' or new.status<>'active') then
perform pg_advisory_xact_lock(781234);if(select count(*) from profiles where role='PLATFORM_ADMIN' and status='active')<=1 then raise exception 'last_admin_protected';end if;end if;return new;end $$;
create trigger last_admin before update on profiles for each row execute function last_admin_guard();
create function public.project_award() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into user_achievements values(new.owner_id,'project:'||new.id||':stage:'||new.stage,case when new.stage=7 then 30 else 10 end,now()) on conflict do nothing;return new;end $$;
create trigger project_achievement after insert or update on projects for each row execute function project_award();

create function public.request_refund(original uuid, refund_amount bigint, explanation text, operation_key uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare item ledger_entries;result uuid;refunded bigint;begin
select * into item from ledger_entries where id=original for update;
if item.id is null or item.kind<>'revenue' or not can_project(item.project_id,true) then raise exception 'forbidden';end if;
select id into result from ledger_entries where author_id=auth.uid() and idempotency_key=operation_key;if result is not null then return result;end if;
select coalesce(sum(amount),0) into refunded from ledger_entries where original_id=original and kind='refund';
if refund_amount<1 or refunded+refund_amount>item.amount then raise exception 'invalid_refund';end if;
insert into ledger_entries(project_id,author_id,kind,mode,amount,note,original_id,idempotency_key) values(item.project_id,auth.uid(),'refund',item.mode,refund_amount,explanation,original,operation_key) returning id into result;return result;end $$;

do $$ declare f record;begin for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('start_simulation','play_simulation','create_invitation','accept_invitation','revoke_invitation','admin_role','request_refund') loop
execute format('revoke all on function %s from public,anon',f.signature);execute format('grant execute on function %s to authenticated',f.signature);end loop;end $$;
commit;
