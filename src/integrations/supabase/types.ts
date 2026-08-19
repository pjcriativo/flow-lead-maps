export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          org_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      api_consumption_logs: {
        Row: {
          action: string
          cost_brl: number
          cost_usd: number
          created_at: string
          external_id: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          quantity: number
          service: string
          user_id: string | null
        }
        Insert: {
          action: string
          cost_brl?: number
          cost_usd?: number
          created_at?: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          quantity?: number
          service: string
          user_id?: string | null
        }
        Update: {
          action?: string
          cost_brl?: number
          cost_usd?: number
          created_at?: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          quantity?: number
          service?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_consumption_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_consumption_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      apify_chaves: {
        Row: {
          apelido: string
          atualizado_em: string
          credito_estimado: number | null
          criado_em: string
          criado_por: string | null
          esgotada_em: string | null
          id: string
          ordem: number
          status: string
          testada_em: string | null
          teste_detalhe: string | null
          teste_ok: boolean | null
          ultimo_uso: string | null
          ultimos4: string
          valor_cifrado: string
        }
        Insert: {
          apelido: string
          atualizado_em?: string
          credito_estimado?: number | null
          criado_em?: string
          criado_por?: string | null
          esgotada_em?: string | null
          id?: string
          ordem?: number
          status?: string
          testada_em?: string | null
          teste_detalhe?: string | null
          teste_ok?: boolean | null
          ultimo_uso?: string | null
          ultimos4: string
          valor_cifrado: string
        }
        Update: {
          apelido?: string
          atualizado_em?: string
          credito_estimado?: number | null
          criado_em?: string
          criado_por?: string | null
          esgotada_em?: string | null
          id?: string
          ordem?: number
          status?: string
          testada_em?: string | null
          teste_detalhe?: string | null
          teste_ok?: boolean | null
          ultimo_uso?: string | null
          ultimos4?: string
          valor_cifrado?: string
        }
        Relationships: []
      }
      apify_chaves_auditoria: {
        Row: {
          acao: string
          alterado_em: string
          alterado_por: string | null
          apelido: string
          id: string
        }
        Insert: {
          acao: string
          alterado_em?: string
          alterado_por?: string | null
          apelido: string
          id?: string
        }
        Update: {
          acao?: string
          alterado_em?: string
          alterado_por?: string | null
          apelido?: string
          id?: string
        }
        Relationships: []
      }
      apify_search_cache: {
        Row: {
          exhausted: boolean
          items: Json
          query_key: string
          refreshed_at: string | null
          refreshing_until: string | null
          requested_depth: number
          searched_depth: number
          updated_at: string
        }
        Insert: {
          exhausted?: boolean
          items?: Json
          query_key: string
          refreshed_at?: string | null
          refreshing_until?: string | null
          requested_depth?: number
          searched_depth?: number
          updated_at?: string
        }
        Update: {
          exhausted?: boolean
          items?: Json
          query_key?: string
          refreshed_at?: string | null
          refreshing_until?: string | null
          requested_depth?: number
          searched_depth?: number
          updated_at?: string
        }
        Relationships: []
      }
      assinantes: {
        Row: {
          criado_em: string
          criado_por: string | null
          email: string
          id: string
          nome: string | null
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          email: string
          id?: string
          nome?: string | null
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          email?: string
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      automacao_receitas: {
        Row: {
          ativa: boolean
          canal: string
          cidade: string
          criada_em: string
          custo_lead_usd: number
          exigir_contato: boolean
          fonte: string
          frequencia: string
          gasto_mes_usd: number
          id: string
          leads_mes: number
          leads_por_rodada: number
          max_leads_mes: number
          max_leads_rodada: number
          max_usd_mes: number
          max_usd_rodada: number
          mes_ref: string | null
          nicho: string
          nome: string
          org_id: string | null
          score_minimo: number
          uf: string | null
          ultima_rodada_em: string | null
          user_id: string
          wa_config: Json | null
        }
        Insert: {
          ativa?: boolean
          canal?: string
          cidade: string
          criada_em?: string
          custo_lead_usd?: number
          exigir_contato?: boolean
          fonte?: string
          frequencia?: string
          gasto_mes_usd?: number
          id?: string
          leads_mes?: number
          leads_por_rodada?: number
          max_leads_mes?: number
          max_leads_rodada?: number
          max_usd_mes?: number
          max_usd_rodada?: number
          mes_ref?: string | null
          nicho: string
          nome: string
          org_id?: string | null
          score_minimo?: number
          uf?: string | null
          ultima_rodada_em?: string | null
          user_id?: string
          wa_config?: Json | null
        }
        Update: {
          ativa?: boolean
          canal?: string
          cidade?: string
          criada_em?: string
          custo_lead_usd?: number
          exigir_contato?: boolean
          fonte?: string
          frequencia?: string
          gasto_mes_usd?: number
          id?: string
          leads_mes?: number
          leads_por_rodada?: number
          max_leads_mes?: number
          max_leads_rodada?: number
          max_usd_mes?: number
          max_usd_rodada?: number
          mes_ref?: string | null
          nicho?: string
          nome?: string
          org_id?: string | null
          score_minimo?: number
          uf?: string | null
          ultima_rodada_em?: string | null
          user_id?: string
          wa_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automacao_receitas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      automacao_rodadas: {
        Row: {
          campanha_id: string | null
          concluida_em: string | null
          custo_usd: number
          detalhe: string | null
          id: string
          iniciada_em: string
          leads_buscados: number
          leads_descartados: number
          leads_preparados: number
          leads_qualificados: number
          org_id: string | null
          receita_id: string
          status: string
          user_id: string
        }
        Insert: {
          campanha_id?: string | null
          concluida_em?: string | null
          custo_usd?: number
          detalhe?: string | null
          id?: string
          iniciada_em?: string
          leads_buscados?: number
          leads_descartados?: number
          leads_preparados?: number
          leads_qualificados?: number
          org_id?: string | null
          receita_id: string
          status?: string
          user_id?: string
        }
        Update: {
          campanha_id?: string | null
          concluida_em?: string | null
          custo_usd?: number
          detalhe?: string | null
          id?: string
          iniciada_em?: string
          leads_buscados?: number
          leads_descartados?: number
          leads_preparados?: number
          leads_qualificados?: number
          org_id?: string | null
          receita_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automacao_rodadas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automacao_rodadas_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "automacao_receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      campanha_leads: {
        Row: {
          atualizado_em: string
          campanha_id: string
          criado_em: string
          erro: string | null
          estado: string
          id: string
          lead_id: string
          motivo_descarte: string | null
          org_id: string | null
          proposta_id: string | null
          redesign_id: string | null
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          campanha_id: string
          criado_em?: string
          erro?: string | null
          estado?: string
          id?: string
          lead_id: string
          motivo_descarte?: string | null
          org_id?: string | null
          proposta_id?: string | null
          redesign_id?: string | null
          user_id: string
        }
        Update: {
          atualizado_em?: string
          campanha_id?: string
          criado_em?: string
          erro?: string | null
          estado?: string
          id?: string
          lead_id?: string
          motivo_descarte?: string | null
          org_id?: string | null
          proposta_id?: string | null
          redesign_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanha_leads_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_leads_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_leads_redesign_id_fkey"
            columns: ["redesign_id"]
            isOneToOne: false
            referencedRelation: "redesigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas: {
        Row: {
          canal: string
          criada_em: string
          id: string
          ig_config: Json | null
          list_id: string | null
          nome: string
          org_id: string | null
          status: string
          user_id: string
          wa_config: Json | null
        }
        Insert: {
          canal?: string
          criada_em?: string
          id?: string
          ig_config?: Json | null
          list_id?: string | null
          nome: string
          org_id?: string | null
          status?: string
          user_id: string
          wa_config?: Json | null
        }
        Update: {
          canal?: string
          criada_em?: string
          id?: string
          ig_config?: Json | null
          list_id?: string | null
          nome?: string
          org_id?: string | null
          status?: string
          user_id?: string
          wa_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lead_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      config_chaves: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          id: string
          nome: string
          ultimos4: string
          valor_cifrado: string
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          id?: string
          nome: string
          ultimos4: string
          valor_cifrado: string
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          id?: string
          nome?: string
          ultimos4?: string
          valor_cifrado?: string
        }
        Relationships: []
      }
      config_chaves_auditoria: {
        Row: {
          alterado_em: string
          alterado_por: string | null
          id: string
          nome: string
        }
        Insert: {
          alterado_em?: string
          alterado_por?: string | null
          id?: string
          nome: string
        }
        Update: {
          alterado_em?: string
          alterado_por?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      config_plataforma: {
        Row: {
          atualizado_em: string
          cadastro_usuario_ativo: boolean
          cor_base: string | null
          cor_secundaria: string | null
          css_personalizado: string | null
          dias_validade_site: number | null
          favicon_url: string | null
          fonte_leads_padrao: string | null
          fuso_horario: string | null
          gdpr_texto: string | null
          id: boolean
          intervalo_disparo_max_seg: number | null
          intervalo_disparo_min_seg: number | null
          logo_url: string | null
          max_leads_busca: number | null
          modelo_ia: string | null
          modelo_openai: string | null
          modo_manutencao_ativo: boolean
          moeda: string | null
          nome_plataforma: string | null
          remetente_email_padrao: string | null
          remetente_nome_padrao: string | null
          seo_descricao: string | null
          seo_titulo: string | null
          simbolo_moeda: string | null
          termos_condicoes_ativo: boolean
          teto_mes_usd: number | null
          teto_redes_mes_usd: number | null
          teto_redes_rodada_usd: number | null
          teto_rodada_usd: number | null
        }
        Insert: {
          atualizado_em?: string
          cadastro_usuario_ativo?: boolean
          cor_base?: string | null
          cor_secundaria?: string | null
          css_personalizado?: string | null
          dias_validade_site?: number | null
          favicon_url?: string | null
          fonte_leads_padrao?: string | null
          fuso_horario?: string | null
          gdpr_texto?: string | null
          id?: boolean
          intervalo_disparo_max_seg?: number | null
          intervalo_disparo_min_seg?: number | null
          logo_url?: string | null
          max_leads_busca?: number | null
          modelo_ia?: string | null
          modelo_openai?: string | null
          modo_manutencao_ativo?: boolean
          moeda?: string | null
          nome_plataforma?: string | null
          remetente_email_padrao?: string | null
          remetente_nome_padrao?: string | null
          seo_descricao?: string | null
          seo_titulo?: string | null
          simbolo_moeda?: string | null
          termos_condicoes_ativo?: boolean
          teto_mes_usd?: number | null
          teto_redes_mes_usd?: number | null
          teto_redes_rodada_usd?: number | null
          teto_rodada_usd?: number | null
        }
        Update: {
          atualizado_em?: string
          cadastro_usuario_ativo?: boolean
          cor_base?: string | null
          cor_secundaria?: string | null
          css_personalizado?: string | null
          dias_validade_site?: number | null
          favicon_url?: string | null
          fonte_leads_padrao?: string | null
          fuso_horario?: string | null
          gdpr_texto?: string | null
          id?: boolean
          intervalo_disparo_max_seg?: number | null
          intervalo_disparo_min_seg?: number | null
          logo_url?: string | null
          max_leads_busca?: number | null
          modelo_ia?: string | null
          modelo_openai?: string | null
          modo_manutencao_ativo?: boolean
          moeda?: string | null
          nome_plataforma?: string | null
          remetente_email_padrao?: string | null
          remetente_nome_padrao?: string | null
          seo_descricao?: string | null
          seo_titulo?: string | null
          simbolo_moeda?: string | null
          termos_condicoes_ativo?: boolean
          teto_mes_usd?: number | null
          teto_redes_mes_usd?: number | null
          teto_redes_rodada_usd?: number | null
          teto_rodada_usd?: number | null
        }
        Relationships: []
      }
      consumo_org: {
        Row: {
          atualizado_em: string
          campanhas: number
          leads: number
          mensagens: number
          mes_ref: string
          org_id: string
          sites: number
        }
        Insert: {
          atualizado_em?: string
          campanhas?: number
          leads?: number
          mensagens?: number
          mes_ref: string
          org_id: string
          sites?: number
        }
        Update: {
          atualizado_em?: string
          campanhas?: number
          leads?: number
          mensagens?: number
          mes_ref?: string
          org_id?: string
          sites?: number
        }
        Relationships: [
          {
            foreignKeyName: "consumo_org_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_config: {
        Row: {
          org_id: string | null
          ramp_max: number
          ramp_start: string | null
          ramp_tiers: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          org_id?: string | null
          ramp_max?: number
          ramp_start?: string | null
          ramp_tiers?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          org_id?: string | null
          ramp_max?: number
          ramp_start?: string | null
          ramp_tiers?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_uso: {
        Row: {
          criado_em: string
          funcao: string
          id: string
          modelo: string | null
          org_id: string | null
          user_id: string
        }
        Insert: {
          criado_em?: string
          funcao: string
          id?: string
          modelo?: string | null
          org_id?: string | null
          user_id: string
        }
        Update: {
          criado_em?: string
          funcao?: string
          id?: string
          modelo?: string | null
          org_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ia_uso_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_outreach_tasks: {
        Row: {
          assigned_to: string | null
          campanha_id: string
          created_at: string
          id: string
          lead_id: string
          message_text: string
          opened_at: string | null
          org_id: string
          replied_at: string | null
          sent_at: string | null
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          campanha_id: string
          created_at?: string
          id?: string
          lead_id: string
          message_text: string
          opened_at?: string | null
          org_id: string
          replied_at?: string | null
          sent_at?: string | null
          state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          campanha_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          message_text?: string
          opened_at?: string | null
          org_id?: string
          replied_at?: string | null
          sent_at?: string | null
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_outreach_tasks_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_outreach_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_outreach_tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_profiles: {
        Row: {
          account_type: string | null
          activity_score: number | null
          authenticity_score: number | null
          avg_comments: number | null
          avg_likes: number | null
          bio_links: Json
          biography: string | null
          business_address: Json | null
          business_category: string | null
          business_email: string | null
          business_phone: string | null
          collected_at: string
          content_score: number | null
          content_signals: Json
          discovery_source: string
          engagement_rate: number | null
          external_url: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          fit_score: number | null
          instagram_user_id: string | null
          intent_score: number | null
          last_active_at: string | null
          last_post_at: string | null
          lead_id: string
          lead_score: number | null
          org_id: string
          posts_count: number | null
          private: boolean
          professional: boolean
          profile_pic_url: string | null
          raw_payload: Json | null
          recent_posts: Json
          related_profiles: Json
          score_v2: Json
          updated_at: string
          user_id: string
          username: string
          verified: boolean
        }
        Insert: {
          account_type?: string | null
          activity_score?: number | null
          authenticity_score?: number | null
          avg_comments?: number | null
          avg_likes?: number | null
          bio_links?: Json
          biography?: string | null
          business_address?: Json | null
          business_category?: string | null
          business_email?: string | null
          business_phone?: string | null
          collected_at?: string
          content_score?: number | null
          content_signals?: Json
          discovery_source?: string
          engagement_rate?: number | null
          external_url?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          fit_score?: number | null
          instagram_user_id?: string | null
          intent_score?: number | null
          last_active_at?: string | null
          last_post_at?: string | null
          lead_id: string
          lead_score?: number | null
          org_id: string
          posts_count?: number | null
          private?: boolean
          professional?: boolean
          profile_pic_url?: string | null
          raw_payload?: Json | null
          recent_posts?: Json
          related_profiles?: Json
          score_v2?: Json
          updated_at?: string
          user_id: string
          username: string
          verified?: boolean
        }
        Update: {
          account_type?: string | null
          activity_score?: number | null
          authenticity_score?: number | null
          avg_comments?: number | null
          avg_likes?: number | null
          bio_links?: Json
          biography?: string | null
          business_address?: Json | null
          business_category?: string | null
          business_email?: string | null
          business_phone?: string | null
          collected_at?: string
          content_score?: number | null
          content_signals?: Json
          discovery_source?: string
          engagement_rate?: number | null
          external_url?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          fit_score?: number | null
          instagram_user_id?: string | null
          intent_score?: number | null
          last_active_at?: string | null
          last_post_at?: string | null
          lead_id?: string
          lead_score?: number | null
          org_id?: string
          posts_count?: number | null
          private?: boolean
          professional?: boolean
          profile_pic_url?: string | null
          raw_payload?: Json | null
          recent_posts?: Json
          related_profiles?: Json
          score_v2?: Json
          updated_at?: string
          user_id?: string
          username?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "instagram_profiles_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_search_results: {
        Row: {
          activity_score: number | null
          authenticity_score: number | null
          created_at: string
          decision: string
          id: string
          is_new: boolean
          fit_score: number | null
          intent_score: number | null
          lead_id: string | null
          org_id: string
          profile_snapshot: Json
          rank: number
          rejection_reason: string | null
          score: number | null
          score_v2: Json
          search_id: string
          user_id: string
          username: string
        }
        Insert: {
          activity_score?: number | null
          authenticity_score?: number | null
          created_at?: string
          decision: string
          id?: string
          is_new?: boolean
          fit_score?: number | null
          intent_score?: number | null
          lead_id?: string | null
          org_id: string
          profile_snapshot?: Json
          rank?: number
          rejection_reason?: string | null
          score?: number | null
          score_v2?: Json
          search_id: string
          user_id: string
          username: string
        }
        Update: {
          activity_score?: number | null
          authenticity_score?: number | null
          created_at?: string
          decision?: string
          id?: string
          is_new?: boolean
          fit_score?: number | null
          intent_score?: number | null
          lead_id?: string | null
          org_id?: string
          profile_snapshot?: Json
          rank?: number
          rejection_reason?: string | null
          score?: number | null
          score_v2?: Json
          search_id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_search_results_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_search_results_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_search_results_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "redes_buscas"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          api_key_encrypted: string | null
          created_at: string
          id: string
          is_connected: boolean
          last_synced_at: string | null
          name: string
          org_id: string | null
          provider: string
          settings: Json | null
          user_id: string
        }
        Insert: {
          api_key_encrypted?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean
          last_synced_at?: string | null
          name: string
          org_id?: string | null
          provider: string
          settings?: Json | null
          user_id: string
        }
        Update: {
          api_key_encrypted?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean
          last_synced_at?: string | null
          name?: string
          org_id?: string | null
          provider?: string
          settings?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          org_id: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string
          stripe_invoice_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          org_id?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_invoice_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          org_id?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_invoice_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_atribuicoes: {
        Row: {
          criado_em: string
          de_user_id: string | null
          id: string
          lead_id: string
          motivo: string | null
          org_id: string | null
          para_user_id: string
          por_user_id: string | null
        }
        Insert: {
          criado_em?: string
          de_user_id?: string | null
          id?: string
          lead_id: string
          motivo?: string | null
          org_id?: string | null
          para_user_id: string
          por_user_id?: string | null
        }
        Update: {
          criado_em?: string
          de_user_id?: string | null
          id?: string
          lead_id?: string
          motivo?: string | null
          org_id?: string | null
          para_user_id?: string
          por_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_atribuicoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_atribuicoes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_contatos: {
        Row: {
          anotacao: string | null
          canal: string
          contatado_em: string
          created_at: string
          id: string
          lead_id: string
          org_id: string | null
          user_id: string
        }
        Insert: {
          anotacao?: string | null
          canal: string
          contatado_em?: string
          created_at?: string
          id?: string
          lead_id: string
          org_id?: string | null
          user_id?: string
        }
        Update: {
          anotacao?: string | null
          canal?: string
          contatado_em?: string
          created_at?: string
          id?: string
          lead_id?: string
          org_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_contatos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_contatos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_lists: {
        Row: {
          city: string
          contacted_count: number
          created_at: string
          description: string | null
          enriched_count: number
          follow_up_ativo: boolean
          fonte: string | null
          id: string
          name: string
          niche: string
          org_id: string | null
          radius: number
          total_leads: number
          uf: string | null
          user_id: string
        }
        Insert: {
          city: string
          contacted_count?: number
          created_at?: string
          description?: string | null
          enriched_count?: number
          follow_up_ativo?: boolean
          fonte?: string | null
          id?: string
          name: string
          niche: string
          org_id?: string | null
          radius?: number
          total_leads?: number
          uf?: string | null
          user_id: string
        }
        Update: {
          city?: string
          contacted_count?: number
          created_at?: string
          description?: string | null
          enriched_count?: number
          follow_up_ativo?: boolean
          fonte?: string | null
          id?: string
          name?: string
          niche?: string
          org_id?: string | null
          radius?: number
          total_leads?: number
          uf?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_lists_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_reviews: {
        Row: {
          author_name: string | null
          author_photo: string | null
          fetched_at: string
          id: string
          lead_id: string
          org_id: string | null
          rating: number | null
          review_url: string | null
          source: string
          text: string | null
          user_id: string
          when_label: string | null
        }
        Insert: {
          author_name?: string | null
          author_photo?: string | null
          fetched_at?: string
          id?: string
          lead_id: string
          org_id?: string | null
          rating?: number | null
          review_url?: string | null
          source?: string
          text?: string | null
          user_id: string
          when_label?: string | null
        }
        Update: {
          author_name?: string | null
          author_photo?: string | null
          fetched_at?: string
          id?: string
          lead_id?: string
          org_id?: string | null
          rating?: number | null
          review_url?: string | null
          source?: string
          text?: string | null
          user_id?: string
          when_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_reviews_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_reviews_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_seen_registry: {
        Row: {
          business_key: string | null
          first_seen_at: string
          first_user_id: string | null
          org_id: string
          place_id: string
        }
        Insert: {
          business_key?: string | null
          first_seen_at?: string
          first_user_id?: string | null
          org_id: string
          place_id: string
        }
        Update: {
          business_key?: string | null
          first_seen_at?: string
          first_user_id?: string | null
          org_id?: string
          place_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_seen_registry_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          bairro: string | null
          business_name: string
          cargo: string | null
          category: string | null
          city: string | null
          created_at: string
          email: string | null
          email_opt_out: boolean
          email_opt_out_em: string | null
          enriched_at: string | null
          facebook_url: string | null
          has_hours: boolean | null
          has_phone: boolean | null
          has_photos: boolean | null
          has_website: boolean | null
          id: string
          instagram_url: string | null
          last_contacted_at: string | null
          latitude: number | null
          linkedin_url: string | null
          list_id: string | null
          longitude: number | null
          motivo_perda: string | null
          motivo_perda_nota: string | null
          notes: string | null
          opt_out_token: string | null
          org_id: string | null
          origem_estrategia: string | null
          origem_fonte: string | null
          owner_name: string | null
          perda_em: string | null
          phone: string | null
          place_id: string | null
          rating: number | null
          review_count: number | null
          score: number
          score_breakdown: Json | null
          seguidores: number | null
          sem_contato: boolean
          state: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
          whatsapp: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          bairro?: string | null
          business_name: string
          cargo?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          email_opt_out?: boolean
          email_opt_out_em?: string | null
          enriched_at?: string | null
          facebook_url?: string | null
          has_hours?: boolean | null
          has_phone?: boolean | null
          has_photos?: boolean | null
          has_website?: boolean | null
          id?: string
          instagram_url?: string | null
          last_contacted_at?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          list_id?: string | null
          longitude?: number | null
          motivo_perda?: string | null
          motivo_perda_nota?: string | null
          notes?: string | null
          opt_out_token?: string | null
          org_id?: string | null
          origem_estrategia?: string | null
          origem_fonte?: string | null
          owner_name?: string | null
          perda_em?: string | null
          phone?: string | null
          place_id?: string | null
          rating?: number | null
          review_count?: number | null
          score?: number
          score_breakdown?: Json | null
          seguidores?: number | null
          sem_contato?: boolean
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
          whatsapp?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          bairro?: string | null
          business_name?: string
          cargo?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          email_opt_out?: boolean
          email_opt_out_em?: string | null
          enriched_at?: string | null
          facebook_url?: string | null
          has_hours?: boolean | null
          has_phone?: boolean | null
          has_photos?: boolean | null
          has_website?: boolean | null
          id?: string
          instagram_url?: string | null
          last_contacted_at?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          list_id?: string | null
          longitude?: number | null
          motivo_perda?: string | null
          motivo_perda_nota?: string | null
          notes?: string | null
          opt_out_token?: string | null
          org_id?: string | null
          origem_estrategia?: string | null
          origem_fonte?: string | null
          owner_name?: string | null
          perda_em?: string | null
          phone?: string | null
          place_id?: string | null
          rating?: number | null
          review_count?: number | null
          score?: number
          score_breakdown?: Json | null
          seguidores?: number | null
          sem_contato?: boolean
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lead_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          criada_em: string
          id: string
          org_id: string
          papel: Database["public"]["Enums"]["papel_org"]
          user_id: string
        }
        Insert: {
          criada_em?: string
          id?: string
          org_id: string
          papel?: Database["public"]["Enums"]["papel_org"]
          user_id: string
        }
        Update: {
          criada_em?: string
          id?: string
          org_id?: string
          papel?: Database["public"]["Enums"]["papel_org"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacao_destinatarios: {
        Row: {
          enviado_em: string
          id: string
          lida_em: string | null
          notificacao_id: string
          user_id: string
        }
        Insert: {
          enviado_em?: string
          id?: string
          lida_em?: string | null
          notificacao_id: string
          user_id: string
        }
        Update: {
          enviado_em?: string
          id?: string
          lida_em?: string | null
          notificacao_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacao_destinatarios_notificacao_id_fkey"
            columns: ["notificacao_id"]
            isOneToOne: false
            referencedRelation: "notificacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          criado_em: string
          criado_por: string | null
          id: string
          mensagem: string
          titulo: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          mensagem: string
          titulo: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          mensagem?: string
          titulo?: string
        }
        Relationships: []
      }
      org_papeis: {
        Row: {
          ativo: boolean
          org_id: string
          papel: Database["public"]["Enums"]["papel_org"]
        }
        Insert: {
          ativo?: boolean
          org_id: string
          papel: Database["public"]["Enums"]["papel_org"]
        }
        Update: {
          ativo?: boolean
          org_id?: string
          papel?: Database["public"]["Enums"]["papel_org"]
        }
        Relationships: [
          {
            foreignKeyName: "org_papeis_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          criada_em: string
          dono_user_id: string
          id: string
          limite_leads_override: number | null
          limite_sites_override: number | null
          nome: string
          plano_id: string | null
          sites_bonus: number
        }
        Insert: {
          criada_em?: string
          dono_user_id: string
          id?: string
          limite_leads_override?: number | null
          limite_sites_override?: number | null
          nome: string
          plano_id?: string | null
          sites_bonus?: number
        }
        Update: {
          criada_em?: string
          dono_user_id?: string
          id?: string
          limite_leads_override?: number | null
          limite_sites_override?: number | null
          nome?: string
          plano_id?: string | null
          sites_bonus?: number
        }
        Relationships: [
          {
            foreignKeyName: "orgs_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean
          criado_em: string
          descricao: string | null
          has_contratos: boolean | null
          has_financeiro: boolean | null
          has_instagram_search: boolean | null
          has_linkedin_search: boolean | null
          has_propostas: boolean | null
          has_publicar: boolean | null
          has_redesign: boolean | null
          has_whatsapp: boolean | null
          id: string
          limite_campanhas: number | null
          limite_leads: number | null
          limite_mensagens: number | null
          limite_segmentos: number | null
          limite_sites: number | null
          limite_templates: number | null
          limite_whatsapp: number | null
          nome: string
          ordem: number
          periodo: string
          preco: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          has_contratos?: boolean | null
          has_financeiro?: boolean | null
          has_instagram_search?: boolean | null
          has_linkedin_search?: boolean | null
          has_propostas?: boolean | null
          has_publicar?: boolean | null
          has_redesign?: boolean | null
          has_whatsapp?: boolean | null
          id?: string
          limite_campanhas?: number | null
          limite_leads?: number | null
          limite_mensagens?: number | null
          limite_segmentos?: number | null
          limite_sites?: number | null
          limite_templates?: number | null
          limite_whatsapp?: number | null
          nome: string
          ordem?: number
          periodo?: string
          preco?: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          has_contratos?: boolean | null
          has_financeiro?: boolean | null
          has_instagram_search?: boolean | null
          has_linkedin_search?: boolean | null
          has_propostas?: boolean | null
          has_publicar?: boolean | null
          has_redesign?: boolean | null
          has_whatsapp?: boolean | null
          id?: string
          limite_campanhas?: number | null
          limite_leads?: number | null
          limite_mensagens?: number | null
          limite_segmentos?: number | null
          limite_sites?: number | null
          limite_templates?: number | null
          limite_whatsapp?: number | null
          nome?: string
          ordem?: number
          periodo?: string
          preco?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          acesso_liberado: boolean
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string
          emails_sent_monthly: number
          full_name: string | null
          id: string
          integration_limit: number
          integrations_connected: number
          is_super_admin: boolean
          leads_used_monthly: number
          monthly_email_limit: number
          monthly_lead_limit: number
          phone: string | null
          plan: string
          plan_status: string
          reply_to_email: string | null
          site_credito: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          acesso_liberado?: boolean
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          emails_sent_monthly?: number
          full_name?: string | null
          id: string
          integration_limit?: number
          integrations_connected?: number
          is_super_admin?: boolean
          leads_used_monthly?: number
          monthly_email_limit?: number
          monthly_lead_limit?: number
          phone?: string | null
          plan?: string
          plan_status?: string
          reply_to_email?: string | null
          site_credito?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          acesso_liberado?: boolean
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          emails_sent_monthly?: number
          full_name?: string | null
          id?: string
          integration_limit?: number
          integrations_connected?: number
          is_super_admin?: boolean
          leads_used_monthly?: number
          monthly_email_limit?: number
          monthly_lead_limit?: number
          phone?: string | null
          plan?: string
          plan_status?: string
          reply_to_email?: string | null
          site_credito?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      propostas: {
        Row: {
          aberta_em: string | null
          aprovada_em: string | null
          assunto: string
          bounced_at: string | null
          campanha_id: string | null
          clicada_em: string | null
          corpo: string
          criada_em: string
          email_message_id: string | null
          email_para: string | null
          enviada_em: string | null
          follow_up_count: number
          follow_up_enviado_em: string | null
          follow_up_message_id: string | null
          id: string
          lead_id: string
          org_id: string | null
          respondida_em: string | null
          site_id: string | null
          status: string
          user_id: string
          valor: number | null
        }
        Insert: {
          aberta_em?: string | null
          aprovada_em?: string | null
          assunto: string
          bounced_at?: string | null
          campanha_id?: string | null
          clicada_em?: string | null
          corpo: string
          criada_em?: string
          email_message_id?: string | null
          email_para?: string | null
          enviada_em?: string | null
          follow_up_count?: number
          follow_up_enviado_em?: string | null
          follow_up_message_id?: string | null
          id?: string
          lead_id: string
          org_id?: string | null
          respondida_em?: string | null
          site_id?: string | null
          status?: string
          user_id: string
          valor?: number | null
        }
        Update: {
          aberta_em?: string | null
          aprovada_em?: string | null
          assunto?: string
          bounced_at?: string | null
          campanha_id?: string | null
          clicada_em?: string | null
          corpo?: string
          criada_em?: string
          email_message_id?: string | null
          email_para?: string | null
          enviada_em?: string | null
          follow_up_count?: number
          follow_up_enviado_em?: string | null
          follow_up_message_id?: string | null
          id?: string
          lead_id?: string
          org_id?: string | null
          respondida_em?: string | null
          site_id?: string | null
          status?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "propostas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites_publicados"
            referencedColumns: ["id"]
          },
        ]
      }
      redes_buscas: {
        Row: {
          apify_chave_id: string | null
          apify_dataset_id: string | null
          apify_run_id: string | null
          cache_key: string | null
          candidatos_solicitados: number | null
          chave_apelido: string | null
          concluida_em: string | null
          consultas: Json
          criado_em: string
          custo_usd: number
          detalhe: string | null
          encontrados: number
          estrategia: string
          fonte: string
          id: string
          inseridos: number
          limite: number
          mes_ref: string
          meta_qualificados: number | null
          motivo_parada: string | null
          org_id: string | null
          pedido: Json
          request_id: string | null
          resultado: Json | null
          status: string
          user_id: string
        }
        Insert: {
          apify_chave_id?: string | null
          apify_dataset_id?: string | null
          apify_run_id?: string | null
          cache_key?: string | null
          candidatos_solicitados?: number | null
          chave_apelido?: string | null
          concluida_em?: string | null
          consultas?: Json
          criado_em?: string
          custo_usd?: number
          detalhe?: string | null
          encontrados?: number
          estrategia: string
          fonte: string
          id?: string
          inseridos?: number
          limite?: number
          mes_ref: string
          meta_qualificados?: number | null
          motivo_parada?: string | null
          org_id?: string | null
          pedido?: Json
          request_id?: string | null
          resultado?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          apify_chave_id?: string | null
          apify_dataset_id?: string | null
          apify_run_id?: string | null
          cache_key?: string | null
          candidatos_solicitados?: number | null
          chave_apelido?: string | null
          concluida_em?: string | null
          consultas?: Json
          criado_em?: string
          custo_usd?: number
          detalhe?: string | null
          encontrados?: number
          estrategia?: string
          fonte?: string
          id?: string
          inseridos?: number
          limite?: number
          mes_ref?: string
          meta_qualificados?: number | null
          motivo_parada?: string | null
          org_id?: string | null
          pedido?: Json
          request_id?: string | null
          resultado?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redes_buscas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      redesigns: {
        Row: {
          criado_em: string
          custo_usd: number | null
          expira_em: string | null
          gerado_em: string | null
          html_editado: string | null
          html_gerado: string | null
          id: string
          lead_id: string
          modelo: string | null
          observacoes: string | null
          org_id: string | null
          site_original_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          custo_usd?: number | null
          expira_em?: string | null
          gerado_em?: string | null
          html_editado?: string | null
          html_gerado?: string | null
          id?: string
          lead_id: string
          modelo?: string | null
          observacoes?: string | null
          org_id?: string | null
          site_original_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          criado_em?: string
          custo_usd?: number | null
          expira_em?: string | null
          gerado_em?: string | null
          html_editado?: string | null
          html_gerado?: string | null
          id?: string
          lead_id?: string
          modelo?: string | null
          observacoes?: string | null
          org_id?: string | null
          site_original_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redesigns_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redesigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_sugestoes: {
        Row: {
          alertas: Json
          criado_em: string
          custo_usd: number
          decidido_em: string | null
          dia_ref: string
          estado: string
          id: string
          lead_id: string | null
          mensagem_id: string | null
          mes_ref: string
          numero: string
          org_id: string | null
          texto: string
          user_id: string
        }
        Insert: {
          alertas?: Json
          criado_em?: string
          custo_usd?: number
          decidido_em?: string | null
          dia_ref: string
          estado?: string
          id?: string
          lead_id?: string | null
          mensagem_id?: string | null
          mes_ref: string
          numero: string
          org_id?: string | null
          texto: string
          user_id: string
        }
        Update: {
          alertas?: Json
          criado_em?: string
          custo_usd?: number
          decidido_em?: string | null
          dia_ref?: string
          estado?: string
          id?: string
          lead_id?: string | null
          mensagem_id?: string | null
          mes_ref?: string
          numero?: string
          org_id?: string | null
          texto?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sdr_sugestoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_sugestoes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_steps: {
        Row: {
          body: string
          created_at: string
          delay_days: number
          id: string
          sequence_id: string
          step_order: number
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          delay_days?: number
          id?: string
          sequence_id: string
          step_order: number
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          delay_days?: number
          id?: string
          sequence_id?: string
          step_order?: number
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      site_conteudo: {
        Row: {
          atualizado_em: string
          cta_final_botao: string | null
          cta_final_subtitulo: string | null
          cta_final_titulo: string | null
          features_subtitulo: string | null
          features_titulo: string | null
          footer_texto: string | null
          hero_badge: string | null
          hero_cta_primario: string | null
          hero_cta_secundario: string | null
          hero_disclaimer: string | null
          hero_subtitulo: string | null
          hero_titulo: string | null
          hero_titulo_destaque: string | null
          id: boolean
          planos_json: Json | null
        }
        Insert: {
          atualizado_em?: string
          cta_final_botao?: string | null
          cta_final_subtitulo?: string | null
          cta_final_titulo?: string | null
          features_subtitulo?: string | null
          features_titulo?: string | null
          footer_texto?: string | null
          hero_badge?: string | null
          hero_cta_primario?: string | null
          hero_cta_secundario?: string | null
          hero_disclaimer?: string | null
          hero_subtitulo?: string | null
          hero_titulo?: string | null
          hero_titulo_destaque?: string | null
          id?: boolean
          planos_json?: Json | null
        }
        Update: {
          atualizado_em?: string
          cta_final_botao?: string | null
          cta_final_subtitulo?: string | null
          cta_final_titulo?: string | null
          features_subtitulo?: string | null
          features_titulo?: string | null
          footer_texto?: string | null
          hero_badge?: string | null
          hero_cta_primario?: string | null
          hero_cta_secundario?: string | null
          hero_disclaimer?: string | null
          hero_subtitulo?: string | null
          hero_titulo?: string | null
          hero_titulo_destaque?: string | null
          id?: boolean
          planos_json?: Json | null
        }
        Relationships: []
      }
      sites_publicados: {
        Row: {
          arquivos_removidos: boolean
          expira_em: string
          id: string
          lead_id: string
          org_id: string | null
          publicado_em: string
          redesign_id: string
          slug: string
          status: string
          url_publica: string
          user_id: string
        }
        Insert: {
          arquivos_removidos?: boolean
          expira_em?: string
          id?: string
          lead_id: string
          org_id?: string | null
          publicado_em?: string
          redesign_id: string
          slug: string
          status?: string
          url_publica: string
          user_id: string
        }
        Update: {
          arquivos_removidos?: boolean
          expira_em?: string
          id?: string
          lead_id?: string
          org_id?: string | null
          publicado_em?: string
          redesign_id?: string
          slug?: string
          status?: string
          url_publica?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_publicados_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_publicados_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_publicados_redesign_id_fkey"
            columns: ["redesign_id"]
            isOneToOne: false
            referencedRelation: "redesigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_respostas: {
        Row: {
          autor_user_id: string
          criado_em: string
          eh_admin: boolean
          id: string
          texto: string
          ticket_id: string
        }
        Insert: {
          autor_user_id: string
          criado_em?: string
          eh_admin?: boolean
          id?: string
          texto: string
          ticket_id: string
        }
        Update: {
          autor_user_id?: string
          criado_em?: string
          eh_admin?: boolean
          id?: string
          texto?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_respostas_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assunto: string
          atualizado_em: string
          autor_user_id: string
          criado_em: string
          id: string
          mensagem: string
          org_id: string | null
          prioridade: Database["public"]["Enums"]["ticket_prioridade"]
          status: Database["public"]["Enums"]["ticket_status"]
        }
        Insert: {
          assunto: string
          atualizado_em?: string
          autor_user_id: string
          criado_em?: string
          id?: string
          mensagem: string
          org_id?: string | null
          prioridade?: Database["public"]["Enums"]["ticket_prioridade"]
          status?: Database["public"]["Enums"]["ticket_status"]
        }
        Update: {
          assunto?: string
          atualizado_em?: string
          autor_user_id?: string
          criado_em?: string
          id?: string
          mensagem?: string
          org_id?: string | null
          prioridade?: Database["public"]["Enums"]["ticket_prioridade"]
          status?: Database["public"]["Enums"]["ticket_status"]
        }
        Relationships: [
          {
            foreignKeyName: "tickets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_alertas: {
        Row: {
          criado_em: string
          id: string
          lido: boolean
          mensagem: string
          org_id: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          lido?: boolean
          mensagem: string
          org_id?: string | null
          tipo: string
          user_id?: string
        }
        Update: {
          criado_em?: string
          id?: string
          lido?: boolean
          mensagem?: string
          org_id?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_alertas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_envios: {
        Row: {
          campanha_id: string | null
          enviado_em: string
          id: string
          instancia_id: string
          lead_id: string
          mensagem: string | null
          org_id: string | null
          user_id: string
          variacao_id: string | null
        }
        Insert: {
          campanha_id?: string | null
          enviado_em?: string
          id?: string
          instancia_id: string
          lead_id: string
          mensagem?: string | null
          org_id?: string | null
          user_id?: string
          variacao_id?: string | null
        }
        Update: {
          campanha_id?: string | null
          enviado_em?: string
          id?: string
          instancia_id?: string
          lead_id?: string
          mensagem?: string | null
          org_id?: string | null
          user_id?: string
          variacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_envios_instancia_id_fkey"
            columns: ["instancia_id"]
            isOneToOne: false
            referencedRelation: "wa_instancias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_envios_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_envios_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_instancia_tokens: {
        Row: {
          atualizado_em: string
          instancia_id: string
          token: string
        }
        Insert: {
          atualizado_em?: string
          instancia_id: string
          token: string
        }
        Update: {
          atualizado_em?: string
          instancia_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_instancia_tokens_instancia_id_fkey"
            columns: ["instancia_id"]
            isOneToOne: true
            referencedRelation: "wa_instancias"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_instancias: {
        Row: {
          atualizado_em: string
          criada_em: string
          falhas_login: number
          funcao: string
          id: string
          nome: string
          numero: string | null
          ordem: number
          org_id: string | null
          status: string
          ultima_checagem_em: string | null
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criada_em?: string
          falhas_login?: number
          funcao?: string
          id?: string
          nome: string
          numero?: string | null
          ordem?: number
          org_id?: string | null
          status?: string
          ultima_checagem_em?: string | null
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criada_em?: string
          falhas_login?: number
          funcao?: string
          id?: string
          nome?: string
          numero?: string | null
          ordem?: number
          org_id?: string | null
          status?: string
          ultima_checagem_em?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_instancias_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_mensagens: {
        Row: {
          criado_em: string
          direcao: string
          externo_id: string | null
          id: string
          instancia_id: string | null
          lead_id: string | null
          lida: boolean
          media_url: string | null
          nome_contato: string | null
          numero: string
          org_id: string | null
          texto: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          direcao: string
          externo_id?: string | null
          id?: string
          instancia_id?: string | null
          lead_id?: string | null
          lida?: boolean
          media_url?: string | null
          nome_contato?: string | null
          numero: string
          org_id?: string | null
          texto?: string | null
          tipo?: string
          user_id?: string
        }
        Update: {
          criado_em?: string
          direcao?: string
          externo_id?: string | null
          id?: string
          instancia_id?: string | null
          lead_id?: string | null
          lida?: boolean
          media_url?: string | null
          nome_contato?: string | null
          numero?: string
          org_id?: string | null
          texto?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_mensagens_instancia_id_fkey"
            columns: ["instancia_id"]
            isOneToOne: false
            referencedRelation: "wa_instancias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_mensagens_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_mensagens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_scripts: {
        Row: {
          criado_em: string
          id: string
          media_url: string | null
          mensagem: string | null
          nome: string
          org_id: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          media_url?: string | null
          mensagem?: string | null
          nome: string
          org_id?: string | null
          tipo?: string
          user_id?: string
        }
        Update: {
          criado_em?: string
          id?: string
          media_url?: string | null
          mensagem?: string | null
          nome?: string
          org_id?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_scripts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _col_consumo: { Args: { p_recurso: string }; Returns: string }
      _col_limite: { Args: { p_recurso: string }; Returns: string }
      acesso_ferramenta_liberado: { Args: never; Returns: boolean }
      admin_api_lead_counts: {
        Args: { p_since: string }
        Returns: {
          apify_leads_period: number
          leads_month: number
          leads_period: number
          user_id: string
        }[]
      }
      admin_set_org_leads_override: {
        Args: { p_leads: number; p_user: string }
        Returns: Json
      }
      admin_set_org_sites_bonus: {
        Args: { p_bonus: number; p_user: string }
        Returns: Json
      }
      admin_set_org_sites_override: {
        Args: { p_sites: number; p_user: string }
        Returns: Json
      }
      admin_set_user_plan:
        | { Args: { p_plan: string; p_user: string }; Returns: Json }
        | {
            Args: { p_plan?: string; p_plano_id?: string; p_user: string }
            Returns: Json
          }
      claim_apify_search_cache: {
        Args: { p_query_key: string; p_target_depth: number }
        Returns: Json
      }
      claim_apify_search_cache_v2: {
        Args: {
          p_query_key: string
          p_target_depth: number
          p_ttl_hours?: number
        }
        Returns: Json
      }
      claim_apify_search_cache_v3: {
        Args: {
          p_query_key: string
          p_target_depth: number
          p_ttl_hours?: number
        }
        Returns: Json
      }
      consumir_ou_bloquear: {
        Args: { p_n?: number; p_org: string; p_recurso: string }
        Returns: Json
      }
      eh_super_admin: { Args: never; Returns: boolean }
      email_rampa_status: {
        Args: { p_user_id?: string }
        Returns: {
          ativa: boolean
          dia: number
          enviados_hoje: number
          restante: number
          teto: number
        }[]
      }
      estado_consumo: {
        Args: { p_org: string; p_recurso: string }
        Returns: Json
      }
      is_authentic_email: { Args: { p_email: string }; Returns: boolean }
      lead_business_identity: {
        Args: { p_address: string; p_name: string }
        Returns: string
      }
      limite_plano: {
        Args: { p_org: string; p_recurso: string }
        Returns: number
      }
      meu_estado_consumo: { Args: { p_recurso: string }; Returns: Json }
      normalize_lead_identity_part: {
        Args: { p_value: string }
        Returns: string
      }
      org_do_usuario: { Args: { p_user: string }; Returns: string }
      papel_do_usuario: { Args: { p_org: string }; Returns: string }
      pertence_a_org: { Args: { p_org: string }; Returns: boolean }
      plano_id_por_slug: { Args: { p_plan: string }; Returns: string }
      pode_ver_lead: {
        Args: { p_assigned: string; p_org: string }
        Returns: boolean
      }
      pode_ver_ticket: {
        Args: { p_autor: string; p_org: string }
        Returns: boolean
      }
      registrar_contato_manual: {
        Args: {
          p_anotacao: string
          p_canal: string
          p_contatado_em: string
          p_lead_id: string
        }
        Returns: string
      }
      release_apify_search_cache: {
        Args: { p_query_key: string }
        Returns: undefined
      }
      store_apify_search_cache: {
        Args: { p_items: Json; p_query_key: string; p_searched_depth: number }
        Returns: undefined
      }
      store_apify_search_cache_v3: {
        Args: { p_items: Json; p_query_key: string; p_requested_depth: number }
        Returns: undefined
      }
    }
    Enums: {
      papel_org:
        | "super_admin"
        | "admin"
        | "gerente"
        | "vendedor"
        | "sdr"
        | "suporte"
      ticket_prioridade: "baixa" | "media" | "alta"
      ticket_status: "aberto" | "em_andamento" | "resolvido" | "fechado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      papel_org: [
        "super_admin",
        "admin",
        "gerente",
        "vendedor",
        "sdr",
        "suporte",
      ],
      ticket_prioridade: ["baixa", "media", "alta"],
      ticket_status: ["aberto", "em_andamento", "resolvido", "fechado"],
    },
  },
} as const
