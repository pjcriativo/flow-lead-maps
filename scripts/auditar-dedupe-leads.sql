-- Auditoria somente leitura da deduplicacao de leads em todas as contas.
with exact_duplicate_groups as (
  select org_id, place_id
  from public.leads
  where org_id is not null and place_id is not null
  group by org_id, place_id
  having count(*) > 1
),
business_duplicate_groups as (
  select
    org_id,
    public.lead_business_identity(business_name, address) as business_key
  from public.leads
  where org_id is not null
    and public.lead_business_identity(business_name, address) is not null
  group by org_id, public.lead_business_identity(business_name, address)
  having count(*) > 1
),
unregistered_leads as (
  select lead.id
  from public.leads lead
  left join public.lead_seen_registry registry
    on registry.org_id = lead.org_id
   and registry.place_id = lead.place_id
  where lead.org_id is not null
    and lead.place_id is not null
    and registry.place_id is null
)
select
  (select count(*) from public.leads) as leads_total,
  (select count(*) from public.lead_seen_registry) as registry_total,
  (select count(*) from exact_duplicate_groups) as exact_duplicate_groups,
  (select count(*) from business_duplicate_groups) as business_duplicate_groups,
  (select count(*) from unregistered_leads) as unregistered_leads,
  (select count(*) from public.leads where org_id is null) as leads_without_org,
  (
    select count(*)
    from public.profiles profile
    where not coalesce(profile.is_super_admin, false)
      and not exists (
        select 1
        from public.memberships membership
        where membership.user_id = profile.id
      )
  ) as profiles_without_org;
