-- Atualiza a snapshot do workspace para incluir pendingChallengeMode nas contas.
-- Necessário para que o frontend detecte challenges pendentes entre sessões.

create or replace function public.flow_business_workspace_snapshot(p_card_limit int default 300)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.org_do_usuario(auth.uid());
begin
  if auth.uid() is null or v_org is null then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'plan', public.flow_business_plan_snapshot(v_org),
    'cards', coalesce((
      select jsonb_agg(row_data order by row_data->>'updatedAt' desc)
      from (
        select jsonb_build_object(
          'id', c.id, 'leadId', c.lead_id, 'stage', c.stage,
          'temperature', c.temperature, 'tags', c.tags, 'summary', c.summary,
          'source', c.source, 'nextActionType', c.next_action_type,
          'nextActionAt', c.next_action_at, 'updatedAt', c.updated_at,
          'businessName', l.business_name, 'category', l.category, 'city', l.city,
          'state', l.state, 'score', l.score, 'instagramUrl', l.instagram_url,
          'username', ip.username, 'fullName', ip.full_name,
          'profilePictureUrl', ip.profile_pic_url, 'followersCount', ip.followers_count
        ) as row_data
        from public.instagram_crm_cards c
        join public.leads l on l.id = c.lead_id
        left join public.instagram_profiles ip on ip.lead_id = c.lead_id
        where c.org_id = v_org
        order by c.updated_at desc
        limit least(greatest(coalesce(p_card_limit, 300), 1), 1000)
      ) limited_cards
    ), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'cardId', t.card_id, 'actionType', t.action_type,
        'title', t.title, 'instructions', t.instructions, 'dueAt', t.due_at,
        'status', t.status, 'outcome', t.outcome,
        'businessName', l.business_name, 'instagramUrl', l.instagram_url,
        'username', ip.username
      ) order by t.due_at)
      from public.instagram_crm_tasks t
      join public.instagram_crm_cards c on c.id = t.card_id
      join public.leads l on l.id = c.lead_id
      left join public.instagram_profiles ip on ip.lead_id = c.lead_id
      where t.org_id = v_org and t.status = 'pending'
    ), '[]'::jsonb),
    'cadences', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'description', c.description,
        'isActive', c.is_active, 'isSystem', c.is_system,
        'steps', coalesce((select jsonb_agg(jsonb_build_object(
          'id', s.id, 'position', s.position, 'dayOffset', s.day_offset,
          'actionType', s.action_type, 'title', s.title,
          'instructions', s.instructions, 'isManual', s.is_manual
        ) order by s.position) from public.instagram_cadence_steps s where s.cadence_id = c.id), '[]'::jsonb)
      ) order by c.is_system desc, c.name)
      from public.instagram_cadences c where c.org_id = v_org
    ), '[]'::jsonb),
    'accounts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'name', i.nome, 'username', i.username_ig,
        'provider', i.provider, 'status', i.status, 'accountType', i.account_type,
        'profilePictureUrl', i.profile_picture_url, 'permissions', i.permissions,
        'connectedAt', i.connected_at, 'lastWebhookAt', i.last_webhook_at,
        'errorMessage', i.error_message,
        'pendingChallengeMode', i.pending_challenge_mode
      ) order by i.criada_em desc)
      from public.ig_instancias i where i.org_id = v_org
    ), '[]'::jsonb),
    'flows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id, 'accountId', f.account_id, 'name', f.name,
        'description', f.description, 'triggerType', f.trigger_type,
        'triggerConfig', f.trigger_config, 'status', f.status,
        'version', f.version, 'publishedAt', f.published_at,
        'updatedAt', f.updated_at,
        'nodes', coalesce((select jsonb_agg(jsonb_build_object(
          'id', n.id, 'nodeType', n.node_type, 'subtype', n.subtype,
          'label', n.label, 'config', n.config,
          'positionX', n.position_x, 'positionY', n.position_y
        ) order by n.position_y, n.position_x) from public.instagram_flow_nodes n
          where n.flow_id = f.id and n.node_type <> 'trigger'), '[]'::jsonb)
      ) order by f.updated_at desc)
      from public.instagram_flows f where f.org_id = v_org
    ), '[]'::jsonb)
  );
end;
$$;
