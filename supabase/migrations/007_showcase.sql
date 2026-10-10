begin;
alter table public.storefront_versions alter column storefront_id drop not null;
alter table public.storefront_versions add column project_id uuid references public.projects;
alter table public.storefront_versions add column slug uuid not null unique default gen_random_uuid();
alter table public.storefront_versions add constraint version_scope check(storefront_id is not null or project_id is not null);
create index showcase_project on storefront_versions(project_id,created_at desc);
create policy showcase_version_read on storefront_versions for select to authenticated using(project_id is not null and can_project(project_id));
create policy showcase_product_read on storefront_products for select to authenticated using(exists(select 1 from storefront_versions where id=version_id and can_project(project_id)));
create function public.can_review_project(project uuid) returns boolean language sql stable security definer set search_path=public as $$
select exists(select 1 from projects p join profiles reviewer on reviewer.id=auth.uid() where p.id=project and reviewer.role='PARENT' and reviewer.status='active' and (
 (p.owner_id=auth.uid() and p.learner_id is null) or guards_learner(p.learner_id) or (p.organization_id is not null and (org_role(p.organization_id,array['ORG_OWNER','ORG_ADMIN']) or exists(select 1 from group_members gm join groups g on g.id=gm.group_id where gm.learner_id=p.learner_id and g.organization_id=p.organization_id and teaches_group(g.id)))))
) $$;
create function public.submit_showcase(project uuid, showcase_title text, showcase_description text, products jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid;number integer;product jsonb;begin
if not can_project(project,true) or jsonb_array_length(products) not between 1 and 10 then raise exception 'forbidden';end if;
perform pg_advisory_xact_lock(hashtext(project::text));select coalesce(max(revision),0)+1 into number from storefront_versions where project_id=project;
insert into storefront_versions(project_id,revision,title,description,status) values(project,number,showcase_title,showcase_description,'IN_REVIEW') returning id into result;
for product in select * from jsonb_array_elements(products) loop
insert into storefront_products(version_id,name,description,price,available,image_path) values(result,product->>'name',coalesce(product->>'description',''),(product->>'price')::bigint,coalesce((product->>'available')::boolean,true),product->>'image_path');end loop;
return result;end $$;
create function public.review_showcase(version uuid, decision text, explanation text default '') returns void language plpgsql security definer set search_path=public as $$
declare v storefront_versions;begin select * into v from storefront_versions where id=version for update;
if v.id is null or not can_review_project(v.project_id) then raise exception 'forbidden';end if;
if decision='APPROVED' and v.status='IN_REVIEW' then update storefront_versions set status='APPROVED',reviewed_by=auth.uid(),approved_at=now(),reason=explanation where id=version;
elsif decision='CHANGES_REQUESTED' and v.status='IN_REVIEW' and length(trim(explanation))>=2 then update storefront_versions set status=decision,reviewed_by=auth.uid(),reason=explanation where id=version;
elsif decision='PUBLISHED' and v.status='APPROVED' then
perform pg_advisory_xact_lock(hashtext(v.project_id::text));update storefront_versions set status='UNPUBLISHED' where project_id=v.project_id and status='PUBLISHED';update storefront_versions set status='PUBLISHED' where id=version;
elsif decision='UNPUBLISHED' and v.status='PUBLISHED' then update storefront_versions set status='UNPUBLISHED',reason=explanation where id=version;
else raise exception 'invalid_transition';end if;
insert into notifications(owner_id,title,path,event_key) select owner_id,decision,'/showcase','showcase:'||version||':'||decision from projects where id=v.project_id on conflict do nothing;
insert into audit_logs(actor_id,action,entity,object_id,reason) values(auth.uid(),decision,'storefront_versions',version::text,explanation);
end $$;
create function public.moderate_showcase(version uuid, explanation text) returns void language plpgsql security definer set search_path=public as $$
begin if not is_platform_admin() or length(trim(explanation))<2 then raise exception 'forbidden';end if;
update storefront_versions set status='UNPUBLISHED',reason=explanation where id=version and status='PUBLISHED';if not found then raise exception 'invalid_transition';end if;
insert into audit_logs(actor_id,action,entity,object_id,reason) values(auth.uid(),'moderator_unpublish','storefront_versions',version::text,explanation);end $$;
create policy showcase_moderator_read on storefront_versions for select to authenticated using(is_platform_admin());
create policy product_moderator_read on storefront_products for select to authenticated using(is_platform_admin());
do $$ declare f record;begin for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('can_review_project','submit_showcase','review_showcase','moderate_showcase') loop
execute format('revoke all on function %s from public,anon',f.signature);execute format('grant execute on function %s to authenticated',f.signature);end loop;end $$;
commit;
