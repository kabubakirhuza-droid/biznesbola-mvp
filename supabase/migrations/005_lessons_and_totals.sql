begin;
create table public.lesson_attempts (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles,
 lesson_id uuid not null references public.lessons, correct boolean not null, created_at timestamptz not null default now()
);
alter table public.lesson_attempts enable row level security;grant select on lesson_attempts to authenticated;
create policy own_attempts on lesson_attempts for select to authenticated using(owner_id=auth.uid() and profile_active());
create function public.check_lesson(lesson uuid, provided_answer text, lang text) returns jsonb language plpgsql security definer set search_path=public as $$
declare l lessons;correct boolean;begin if not profile_active() or lang not in ('uz','ru') then raise exception 'forbidden';end if;
select * into l from lessons where id=lesson and status='published';if l.id is null then raise exception 'forbidden';end if;
correct:=replace(lower(trim(provided_answer)),' ','')=replace(lower(trim(case when lang='uz' then l.answer_uz else l.answer_ru end)),' ','');
insert into lesson_attempts(owner_id,lesson_id,correct) values(auth.uid(),l.id,correct);
if correct then insert into user_achievements values(auth.uid(),'lesson:'||l.id,10,now()) on conflict do nothing;end if;
return jsonb_build_object('correct',correct,'explanation',case when lang='uz' then l.explanation_uz else l.explanation_ru end);end $$;
revoke all on function check_lesson(uuid,text,text) from public,anon;grant execute on function check_lesson(uuid,text,text) to authenticated;
create function public.ledger_totals(project uuid) returns jsonb language sql stable security invoker set search_path=public as $$
with source as (select * from ledger_entries where project_id=project),effective as (
 select e.kind,coalesce(c.amount,e.amount) amount,coalesce(c.cost,e.cost) cost from source e left join lateral(select amount,cost from source where kind='correction' and original_id=e.id order by created_at desc,id desc limit 1)c on true where e.kind in ('capital','revenue','expense')
),totals as(select coalesce(sum(amount) filter(where kind='revenue'),0) revenue,coalesce(sum(case when kind='expense' then amount when kind='revenue' then cost else 0 end),0) expenses,coalesce(sum(amount) filter(where kind='capital'),0) capital from effective),refund as(select coalesce(sum(amount) filter(where kind='refund'),0) refunds,coalesce(sum(amount) filter(where kind='allocation'),0) allocated from source)
select jsonb_build_object('revenue',revenue,'expenses',expenses,'capital',capital,'refunds',refunds,'allocated',allocated,'profit',revenue-expenses-refunds,'balance',capital+revenue-expenses-refunds) from totals cross join refund $$;
revoke all on function ledger_totals(uuid) from public,anon;grant execute on function ledger_totals(uuid) to authenticated;

create or replace function public.correct_ledger(original uuid, new_amount bigint, new_cost bigint, explanation text, operation_key uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare item ledger_entries; result uuid; refunded bigint; begin select * into item from ledger_entries where id=original for update;
if item.id is null or not can_project(item.project_id,true) or item.kind not in ('capital','revenue','expense') or length(trim(explanation))<2 then raise exception 'forbidden'; end if;
select coalesce(sum(amount),0) into refunded from ledger_entries where original_id=original and kind='refund';if item.kind='revenue' and new_amount<refunded then raise exception 'refund_exceeds_revenue';end if;
insert into ledger_entries(project_id,author_id,kind,mode,amount,cost,note,original_id,idempotency_key)
values(item.project_id,auth.uid(),'correction',item.mode,new_amount,new_cost,explanation,original,operation_key)
on conflict(author_id,idempotency_key) do update set id=ledger_entries.id returning id into result; return result; end $$;
create or replace function public.request_refund(original uuid, refund_amount bigint, explanation text, operation_key uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare item ledger_entries;result uuid;refunded bigint;actual_amount bigint;begin
select * into item from ledger_entries where id=original for update;
if item.id is null or item.kind<>'revenue' or not can_project(item.project_id,true) or length(trim(explanation))<2 then raise exception 'forbidden';end if;
select id into result from ledger_entries where author_id=auth.uid() and idempotency_key=operation_key;if result is not null then return result;end if;
select amount into actual_amount from ledger_entries where original_id=original and kind='correction' order by created_at desc,id desc limit 1;actual_amount:=coalesce(actual_amount,item.amount);
select coalesce(sum(amount),0) into refunded from ledger_entries where original_id=original and kind='refund';
if refund_amount<1 or refunded+refund_amount>actual_amount then raise exception 'invalid_refund';end if;
insert into ledger_entries(project_id,author_id,kind,mode,amount,note,original_id,idempotency_key) values(item.project_id,auth.uid(),'refund',item.mode,refund_amount,explanation,original,operation_key) returning id into result;return result;end $$;
-- Account linkage is issued only by the service-only attach RPC.
create function public.guard_learner_identity() returns trigger language plpgsql set search_path=public as $$
begin if current_user not in ('postgres','supabase_admin','service_role') and new.user_id is distinct from old.user_id then raise exception 'identity_change_denied';end if;return new;end $$;
create trigger learner_identity before update on learner_profiles for each row execute function guard_learner_identity();
commit;
