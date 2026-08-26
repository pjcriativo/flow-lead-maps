export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json | null;
          org_id: string | null;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json | null;
          org_id?: string | null;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json | null;
          org_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_log_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      api_consumption_logs: {
        Row: {
          action: string;
          cost_brl: number;
          cost_usd: number;
          created_at: string;
          external_id: string | null;
          id: string;
          metadata: Json | null;
          org_id: string | null;
          quantity: number;
          service: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          cost_brl?: number;
          cost_usd?: number;
          created_at?: string;
          external_id?: string | null;
          id?: string;
          metadata?: Json | null;
          org_id?: string | null;
          quantity?: number;
          service: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          cost_brl?: number;
          cost_usd?: number;
          created_at?: string;
          external_id?: string | null;
          id?: string;
          metadata?: Json | null;
          org_id?: string | null;
          quantity?: number;
          service?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "api_consumption_logs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "api_consumption_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      apify_chaves: {
        Row: {
          apelido: string;
          atualizado_em: string;
          credito_estimado: number | null;
          criado_em: string;
          criado_por: string | null;
          esgotada_em: string | null;
          id: string;
          ordem: number;
          status: string;
          testada_em: string | null;
          teste_detalhe: string | null;
          teste_ok: boolean | null;
          ultimo_uso: string | null;
          ultimos4: string;
          valor_cifrado: string;
        };
        Insert: {
          apelido: string;
          atualizado_em?: string;
          credito_estimado?: number | null;
          criado_em?: string;
          criado_por?: string | null;
          esgotada_em?: string | null;
          id?: string;
          ordem?: number;
          status?: string;
          testada_em?: string | null;
          teste_detalhe?: string | null;
          teste_ok?: boolean | null;
          ultimo_uso?: string | null;
          ultimos4: string;
          valor_cifrado: string;
        };
        Update: {
          apelido?: string;
          atualizado_em?: string;
          credito_estimado?: number | null;
          criado_em?: string;
          criado_por?: string | null;
          esgotada_em?: string | null;
          id?: string;
          ordem?: number;
          status?: string;
          testada_em?: string | null;
          teste_detalhe?: string | null;
          teste_ok?: boolean | null;
          ultimo_uso?: string | null;
          ultimos4?: string;
          valor_cifrado?: string;
        };
        Relationships: [];
      };
      apify_chaves_auditoria: {
        Row: {
          acao: string;
          alterado_em: string;
          alterado_por: string | null;
          apelido: string;
          id: string;
        };
        Insert: {
          acao: string;
          alterado_em?: string;
          alterado_por?: string | null;
          apelido: string;
          id?: string;
        };
        Update: {
          acao?: string;
          alterado_em?: string;
          alterado_por?: string | null;
          apelido?: string;
          id?: string;
        };
        Relationships: [];
      };
      apify_search_cache: {
        Row: {
          exhausted: boolean;
          items: Json;
          query_key: string;
          refreshed_at: string | null;
          refreshing_until: string | null;
          requested_depth: number;
          searched_depth: number;
          updated_at: string;
        };
        Insert: {
          exhausted?: boolean;
          items?: Json;
          query_key: string;
          refreshed_at?: string | null;
          refreshing_until?: string | null;
          requested_depth?: number;
          searched_depth?: number;
          updated_at?: string;
        };
        Update: {
          exhausted?: boolean;
          items?: Json;
          query_key?: string;
          refreshed_at?: string | null;
          refreshing_until?: string | null;
          requested_depth?: number;
          searched_depth?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      assinantes: {
        Row: {
          criado_em: string;
          criado_por: string | null;
          email: string;
          id: string;
          nome: string | null;
        };
        Insert: {
          criado_em?: string;
          criado_por?: string | null;
          email: string;
          id?: string;
          nome?: string | null;
        };
        Update: {
          criado_em?: string;
          criado_por?: string | null;
          email?: string;
          id?: string;
          nome?: string | null;
        };
        Relationships: [];
      };
      automacao_receitas: {
        Row: {
          ativa: boolean;
          canal: string;
          cidade: string;
          criada_em: string;
          custo_lead_usd: number;
          exigir_contato: boolean;
          fonte: string;
          frequencia: string;
          gasto_mes_usd: number;
          id: string;
          leads_mes: number;
          leads_por_rodada: number;
          max_leads_mes: number;
          max_leads_rodada: number;
          max_usd_mes: number;
          max_usd_rodada: number;
          mes_ref: string | null;
          nicho: string;
          nome: string;
          org_id: string | null;
          score_minimo: number;
          uf: string | null;
          ultima_rodada_em: string | null;
          user_id: string;
          wa_config: Json | null;
        };
        Insert: {
          ativa?: boolean;
          canal?: string;
          cidade: string;
          criada_em?: string;
          custo_lead_usd?: number;
          exigir_contato?: boolean;
          fonte?: string;
          frequencia?: string;
          gasto_mes_usd?: number;
          id?: string;
          leads_mes?: number;
          leads_por_rodada?: number;
          max_leads_mes?: number;
          max_leads_rodada?: number;
          max_usd_mes?: number;
          max_usd_rodada?: number;
          mes_ref?: string | null;
          nicho: string;
          nome: string;
          org_id?: string | null;
          score_minimo?: number;
          uf?: string | null;
          ultima_rodada_em?: string | null;
          user_id?: string;
          wa_config?: Json | null;
        };
        Update: {
          ativa?: boolean;
          canal?: string;
          cidade?: string;
          criada_em?: string;
          custo_lead_usd?: number;
          exigir_contato?: boolean;
          fonte?: string;
          frequencia?: string;
          gasto_mes_usd?: number;
          id?: string;
          leads_mes?: number;
          leads_por_rodada?: number;
          max_leads_mes?: number;
          max_leads_rodada?: number;
          max_usd_mes?: number;
          max_usd_rodada?: number;
          mes_ref?: string | null;
          nicho?: string;
          nome?: string;
          org_id?: string | null;
          score_minimo?: number;
          uf?: string | null;
          ultima_rodada_em?: string | null;
          user_id?: string;
          wa_config?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "automacao_receitas_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      automacao_rodadas: {
        Row: {
          campanha_id: string | null;
          concluida_em: string | null;
          custo_usd: number;
          detalhe: string | null;
          id: string;
          iniciada_em: string;
          leads_buscados: number;
          leads_descartados: number;
          leads_preparados: number;
          leads_qualificados: number;
          org_id: string | null;
          receita_id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          campanha_id?: string | null;
          concluida_em?: string | null;
          custo_usd?: number;
          detalhe?: string | null;
          id?: string;
          iniciada_em?: string;
          leads_buscados?: number;
          leads_descartados?: number;
          leads_preparados?: number;
          leads_qualificados?: number;
          org_id?: string | null;
          receita_id: string;
          status?: string;
          user_id?: string;
        };
        Update: {
          campanha_id?: string | null;
          concluida_em?: string | null;
          custo_usd?: number;
          detalhe?: string | null;
          id?: string;
          iniciada_em?: string;
          leads_buscados?: number;
          leads_descartados?: number;
          leads_preparados?: number;
          leads_qualificados?: number;
          org_id?: string | null;
          receita_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automacao_rodadas_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automacao_rodadas_receita_id_fkey";
            columns: ["receita_id"];
            isOneToOne: false;
            referencedRelation: "automacao_receitas";
            referencedColumns: ["id"];
          },
        ];
      };
      campanha_leads: {
        Row: {
          atualizado_em: string;
          campanha_id: string;
          criado_em: string;
          erro: string | null;
          estado: string;
          id: string;
          lead_id: string;
          motivo_descarte: string | null;
          org_id: string | null;
          proposta_id: string | null;
          redesign_id: string | null;
          user_id: string;
        };
        Insert: {
          atualizado_em?: string;
          campanha_id: string;
          criado_em?: string;
          erro?: string | null;
          estado?: string;
          id?: string;
          lead_id: string;
          motivo_descarte?: string | null;
          org_id?: string | null;
          proposta_id?: string | null;
          redesign_id?: string | null;
          user_id: string;
        };
        Update: {
          atualizado_em?: string;
          campanha_id?: string;
          criado_em?: string;
          erro?: string | null;
          estado?: string;
          id?: string;
          lead_id?: string;
          motivo_descarte?: string | null;
          org_id?: string | null;
          proposta_id?: string | null;
          redesign_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campanha_leads_campanha_id_fkey";
            columns: ["campanha_id"];
            isOneToOne: false;
            referencedRelation: "campanhas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campanha_leads_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campanha_leads_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campanha_leads_proposta_id_fkey";
            columns: ["proposta_id"];
            isOneToOne: false;
            referencedRelation: "propostas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campanha_leads_redesign_id_fkey";
            columns: ["redesign_id"];
            isOneToOne: false;
            referencedRelation: "redesigns";
            referencedColumns: ["id"];
          },
        ];
      };
      campanhas: {
        Row: {
          canal: string;
          criada_em: string;
          id: string;
          ig_config: Json | null;
          list_id: string | null;
          nome: string;
          org_id: string | null;
          status: string;
          user_id: string;
          wa_config: Json | null;
        };
        Insert: {
          canal?: string;
          criada_em?: string;
          id?: string;
          ig_config?: Json | null;
          list_id?: string | null;
          nome: string;
          org_id?: string | null;
          status?: string;
          user_id: string;
          wa_config?: Json | null;
        };
        Update: {
          canal?: string;
          criada_em?: string;
          id?: string;
          ig_config?: Json | null;
          list_id?: string | null;
          nome?: string;
          org_id?: string | null;
          status?: string;
          user_id?: string;
          wa_config?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "campanhas_list_id_fkey";
            columns: ["list_id"];
            isOneToOne: false;
            referencedRelation: "lead_lists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campanhas_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      config_chaves: {
        Row: {
          atualizado_em: string;
          atualizado_por: string | null;
          id: string;
          nome: string;
          ultimos4: string;
          valor_cifrado: string;
        };
        Insert: {
          atualizado_em?: string;
          atualizado_por?: string | null;
          id?: string;
          nome: string;
          ultimos4: string;
          valor_cifrado: string;
        };
        Update: {
          atualizado_em?: string;
          atualizado_por?: string | null;
          id?: string;
          nome?: string;
          ultimos4?: string;
          valor_cifrado?: string;
        };
        Relationships: [];
      };
      config_chaves_auditoria: {
        Row: {
          alterado_em: string;
          alterado_por: string | null;
          id: string;
          nome: string;
        };
        Insert: {
          alterado_em?: string;
          alterado_por?: string | null;
          id?: string;
          nome: string;
        };
        Update: {
          alterado_em?: string;
          alterado_por?: string | null;
          id?: string;
          nome?: string;
        };
        Relationships: [];
      };
      config_plataforma: {
        Row: {
          atualizado_em: string;
          cadastro_usuario_ativo: boolean;
          cor_base: string | null;
          cor_secundaria: string | null;
          css_personalizado: string | null;
          dias_validade_site: number | null;
          favicon_url: string | null;
          fonte_leads_padrao: string | null;
          fuso_horario: string | null;
          gdpr_texto: string | null;
          id: boolean;
          intervalo_disparo_max_seg: number | null;
          intervalo_disparo_min_seg: number | null;
          logo_url: string | null;
          max_leads_busca: number | null;
          modelo_ia: string | null;
          modelo_openai: string | null;
          modo_manutencao_ativo: boolean;
          moeda: string | null;
          nome_plataforma: string | null;
          remetente_email_padrao: string | null;
          remetente_nome_padrao: string | null;
          seo_descricao: string | null;
          seo_titulo: string | null;
          simbolo_moeda: string | null;
          termos_condicoes_ativo: boolean;
          teto_mes_usd: number | null;
          teto_redes_mes_usd: number | null;
          teto_redes_rodada_usd: number | null;
          teto_rodada_usd: number | null;
        };
        Insert: {
          atualizado_em?: string;
          cadastro_usuario_ativo?: boolean;
          cor_base?: string | null;
          cor_secundaria?: string | null;
          css_personalizado?: string | null;
          dias_validade_site?: number | null;
          favicon_url?: string | null;
          fonte_leads_padrao?: string | null;
          fuso_horario?: string | null;
          gdpr_texto?: string | null;
          id?: boolean;
          intervalo_disparo_max_seg?: number | null;
          intervalo_disparo_min_seg?: number | null;
          logo_url?: string | null;
          max_leads_busca?: number | null;
          modelo_ia?: string | null;
          modelo_openai?: string | null;
          modo_manutencao_ativo?: boolean;
          moeda?: string | null;
          nome_plataforma?: string | null;
          remetente_email_padrao?: string | null;
          remetente_nome_padrao?: string | null;
          seo_descricao?: string | null;
          seo_titulo?: string | null;
          simbolo_moeda?: string | null;
          termos_condicoes_ativo?: boolean;
          teto_mes_usd?: number | null;
          teto_redes_mes_usd?: number | null;
          teto_redes_rodada_usd?: number | null;
          teto_rodada_usd?: number | null;
        };
        Update: {
          atualizado_em?: string;
          cadastro_usuario_ativo?: boolean;
          cor_base?: string | null;
          cor_secundaria?: string | null;
          css_personalizado?: string | null;
          dias_validade_site?: number | null;
          favicon_url?: string | null;
          fonte_leads_padrao?: string | null;
          fuso_horario?: string | null;
          gdpr_texto?: string | null;
          id?: boolean;
          intervalo_disparo_max_seg?: number | null;
          intervalo_disparo_min_seg?: number | null;
          logo_url?: string | null;
          max_leads_busca?: number | null;
          modelo_ia?: string | null;
          modelo_openai?: string | null;
          modo_manutencao_ativo?: boolean;
          moeda?: string | null;
          nome_plataforma?: string | null;
          remetente_email_padrao?: string | null;
          remetente_nome_padrao?: string | null;
          seo_descricao?: string | null;
          seo_titulo?: string | null;
          simbolo_moeda?: string | null;
          termos_condicoes_ativo?: boolean;
          teto_mes_usd?: number | null;
          teto_redes_mes_usd?: number | null;
          teto_redes_rodada_usd?: number | null;
          teto_rodada_usd?: number | null;
        };
        Relationships: [];
      };
      consumo_org: {
        Row: {
          atualizado_em: string;
          campanhas: number;
          leads: number;
          mensagens: number;
          mes_ref: string;
          org_id: string;
          sites: number;
        };
        Insert: {
          atualizado_em?: string;
          campanhas?: number;
          leads?: number;
          mensagens?: number;
          mes_ref: string;
          org_id: string;
          sites?: number;
        };
        Update: {
          atualizado_em?: string;
          campanhas?: number;
          leads?: number;
          mensagens?: number;
          mes_ref?: string;
          org_id?: string;
          sites?: number;
        };
        Relationships: [
          {
            foreignKeyName: "consumo_org_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      email_config: {
        Row: {
          org_id: string | null;
          ramp_max: number;
          ramp_start: string | null;
          ramp_tiers: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          org_id?: string | null;
          ramp_max?: number;
          ramp_start?: string | null;
          ramp_tiers?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          org_id?: string | null;
          ramp_max?: number;
          ramp_start?: string | null;
          ramp_tiers?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_config_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      ia_uso: {
        Row: {
          criado_em: string;
          funcao: string;
          id: string;
          modelo: string | null;
          org_id: string | null;
          user_id: string;
        };
        Insert: {
          criado_em?: string;
          funcao: string;
          id?: string;
          modelo?: string | null;
          org_id?: string | null;
          user_id: string;
        };
        Update: {
          criado_em?: string;
          funcao?: string;
          id?: string;
          modelo?: string | null;
          org_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ia_uso_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      ig_automacoes: {
        Row: {
          atualizado_em: string;
          criado_em: string;
          id: string;
          instancia_id: string;
          is_active: boolean;
          keywords: string[] | null;
          name: string;
          org_id: string;
          reply_text: string;
          trigger_type: string;
        };
        Insert: {
          atualizado_em?: string;
          criado_em?: string;
          id?: string;
          instancia_id: string;
          is_active?: boolean;
          keywords?: string[] | null;
          name: string;
          org_id: string;
          reply_text: string;
          trigger_type?: string;
        };
        Update: {
          atualizado_em?: string;
          criado_em?: string;
          id?: string;
          instancia_id?: string;
          is_active?: boolean;
          keywords?: string[] | null;
          name?: string;
          org_id?: string;
          reply_text?: string;
          trigger_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ig_automacoes_instancia_id_fkey";
            columns: ["instancia_id"];
            isOneToOne: false;
            referencedRelation: "ig_instancias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ig_automacoes_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      ig_conversas: {
        Row: {
          assigned_to: string | null;
          atualizado_em: string;
          criado_em: string;
          external_contact_avatar: string | null;
          external_contact_id: string;
          external_contact_name: string | null;
          id: string;
          instancia_id: string;
          last_inbound_at: string | null;
          last_message_at: string;
          last_message_text: string | null;
          last_outbound_at: string | null;
          lead_id: string | null;
          messaging_window_expires_at: string | null;
          org_id: string;
          source: string | null;
          status: string;
          tags: string[];
          unread_count: number;
        };
        Insert: {
          assigned_to?: string | null;
          atualizado_em?: string;
          criado_em?: string;
          external_contact_avatar?: string | null;
          external_contact_id: string;
          external_contact_name?: string | null;
          id?: string;
          instancia_id: string;
          last_inbound_at?: string | null;
          last_message_at?: string;
          last_message_text?: string | null;
          last_outbound_at?: string | null;
          lead_id?: string | null;
          messaging_window_expires_at?: string | null;
          org_id: string;
          source?: string | null;
          status?: string;
          tags?: string[];
          unread_count?: number;
        };
        Update: {
          assigned_to?: string | null;
          atualizado_em?: string;
          criado_em?: string;
          external_contact_avatar?: string | null;
          external_contact_id?: string;
          external_contact_name?: string | null;
          id?: string;
          instancia_id?: string;
          last_inbound_at?: string | null;
          last_message_at?: string;
          last_message_text?: string | null;
          last_outbound_at?: string | null;
          lead_id?: string | null;
          messaging_window_expires_at?: string | null;
          org_id?: string;
          source?: string | null;
          status?: string;
          tags?: string[];
          unread_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ig_conversas_instancia_id_fkey";
            columns: ["instancia_id"];
            isOneToOne: false;
            referencedRelation: "ig_instancias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ig_conversas_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ig_conversas_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      ig_instancia_tokens: {
        Row: {
          access_token_ciphertext: string | null;
          atualizado_em: string;
          expires_at: string | null;
          instancia_id: string;
          refresh_token_ciphertext: string | null;
          scopes: string[];
          token: string | null;
        };
        Insert: {
          access_token_ciphertext?: string | null;
          atualizado_em?: string;
          expires_at?: string | null;
          instancia_id: string;
          refresh_token_ciphertext?: string | null;
          scopes?: string[];
          token?: string | null;
        };
        Update: {
          access_token_ciphertext?: string | null;
          atualizado_em?: string;
          expires_at?: string | null;
          instancia_id?: string;
          refresh_token_ciphertext?: string | null;
          scopes?: string[];
          token?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ig_instancia_tokens_instancia_id_fkey";
            columns: ["instancia_id"];
            isOneToOne: true;
            referencedRelation: "ig_instancias";
            referencedColumns: ["id"];
          },
        ];
      };
      ig_instancias: {
        Row: {
          account_type: string | null;
          atualizado_em: string;
          connected_at: string | null;
          connected_by: string | null;
          criada_em: string;
          error_message: string | null;
          external_account_id: string | null;
          id: string;
          last_webhook_at: string | null;
          meta_ig_user_id: string | null;
          nome: string;
          org_id: string;
          permissions: string[];
          profile_picture_url: string | null;
          provider: string;
          status: string;
          token_expires_at: string | null;
          username_ig: string | null;
        };
        Insert: {
          account_type?: string | null;
          atualizado_em?: string;
          connected_at?: string | null;
          connected_by?: string | null;
          criada_em?: string;
          error_message?: string | null;
          external_account_id?: string | null;
          id?: string;
          last_webhook_at?: string | null;
          meta_ig_user_id?: string | null;
          nome: string;
          org_id: string;
          permissions?: string[];
          profile_picture_url?: string | null;
          provider?: string;
          status?: string;
          token_expires_at?: string | null;
          username_ig?: string | null;
        };
        Update: {
          account_type?: string | null;
          atualizado_em?: string;
          connected_at?: string | null;
          connected_by?: string | null;
          criada_em?: string;
          error_message?: string | null;
          external_account_id?: string | null;
          id?: string;
          last_webhook_at?: string | null;
          meta_ig_user_id?: string | null;
          nome?: string;
          org_id?: string;
          permissions?: string[];
          profile_picture_url?: string | null;
          provider?: string;
          status?: string;
          token_expires_at?: string | null;
          username_ig?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ig_instancias_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      ig_mensagens: {
        Row: {
          conversa_id: string;
          criado_em: string;
          delivery_status: string;
          direction: string;
          external_message_id: string | null;
          id: string;
          is_read: boolean;
          media_url: string | null;
          message_type: string;
          metadata: Json;
          org_id: string;
          text: string | null;
          timestamp: string;
        };
        Insert: {
          conversa_id: string;
          criado_em?: string;
          delivery_status?: string;
          direction: string;
          external_message_id?: string | null;
          id?: string;
          is_read?: boolean;
          media_url?: string | null;
          message_type?: string;
          metadata?: Json;
          org_id: string;
          text?: string | null;
          timestamp?: string;
        };
        Update: {
          conversa_id?: string;
          criado_em?: string;
          delivery_status?: string;
          direction?: string;
          external_message_id?: string | null;
          id?: string;
          is_read?: boolean;
          media_url?: string | null;
          message_type?: string;
          metadata?: Json;
          org_id?: string;
          text?: string | null;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ig_mensagens_conversa_id_fkey";
            columns: ["conversa_id"];
            isOneToOne: false;
            referencedRelation: "ig_conversas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ig_mensagens_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_audience_memberships: {
        Row: {
          first_seen_at: string;
          id: string;
          last_seen_at: string;
          member_identity_key: string;
          relationship: string;
          source_collected_at: string;
          source_username: string;
        };
        Insert: {
          first_seen_at?: string;
          id?: string;
          last_seen_at?: string;
          member_identity_key: string;
          relationship: string;
          source_collected_at?: string;
          source_username: string;
        };
        Update: {
          first_seen_at?: string;
          id?: string;
          last_seen_at?: string;
          member_identity_key?: string;
          relationship?: string;
          source_collected_at?: string;
          source_username?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_audience_memberships_member_identity_key_fkey";
            columns: ["member_identity_key"];
            isOneToOne: false;
            referencedRelation: "instagram_profile_catalog";
            referencedColumns: ["identity_key"];
          },
        ];
      };
      instagram_cadence_enrollments: {
        Row: {
          cadence_id: string;
          card_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          org_id: string;
          started_at: string;
          status: string;
        };
        Insert: {
          cadence_id: string;
          card_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          org_id: string;
          started_at?: string;
          status?: string;
        };
        Update: {
          cadence_id?: string;
          card_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          org_id?: string;
          started_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_cadence_enrollments_cadence_id_fkey";
            columns: ["cadence_id"];
            isOneToOne: false;
            referencedRelation: "instagram_cadences";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_cadence_enrollments_cadence_org_fkey";
            columns: ["org_id", "cadence_id"];
            isOneToOne: false;
            referencedRelation: "instagram_cadences";
            referencedColumns: ["org_id", "id"];
          },
          {
            foreignKeyName: "instagram_cadence_enrollments_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "instagram_crm_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_cadence_enrollments_card_org_fkey";
            columns: ["org_id", "card_id"];
            isOneToOne: false;
            referencedRelation: "instagram_crm_cards";
            referencedColumns: ["org_id", "id"];
          },
          {
            foreignKeyName: "instagram_cadence_enrollments_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_cadence_steps: {
        Row: {
          action_type: string;
          cadence_id: string;
          created_at: string;
          day_offset: number;
          id: string;
          instructions: string | null;
          is_manual: boolean;
          org_id: string;
          position: number;
          title: string;
        };
        Insert: {
          action_type: string;
          cadence_id: string;
          created_at?: string;
          day_offset?: number;
          id?: string;
          instructions?: string | null;
          is_manual?: boolean;
          org_id: string;
          position: number;
          title: string;
        };
        Update: {
          action_type?: string;
          cadence_id?: string;
          created_at?: string;
          day_offset?: number;
          id?: string;
          instructions?: string | null;
          is_manual?: boolean;
          org_id?: string;
          position?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_cadence_steps_cadence_id_fkey";
            columns: ["cadence_id"];
            isOneToOne: false;
            referencedRelation: "instagram_cadences";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_cadence_steps_cadence_org_fkey";
            columns: ["org_id", "cadence_id"];
            isOneToOne: false;
            referencedRelation: "instagram_cadences";
            referencedColumns: ["org_id", "id"];
          },
          {
            foreignKeyName: "instagram_cadence_steps_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_cadences: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          is_system: boolean;
          name: string;
          org_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          name: string;
          org_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          name?: string;
          org_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_cadences_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_competitor_alerts: {
        Row: {
          alert_type: string;
          competitor_id: string;
          created_at: string;
          data: Json;
          description: string;
          id: string;
          org_id: string;
          read_at: string | null;
          score: number;
          severity: string;
          snapshot_id: string | null;
          title: string;
        };
        Insert: {
          alert_type: string;
          competitor_id: string;
          created_at?: string;
          data?: Json;
          description: string;
          id?: string;
          org_id: string;
          read_at?: string | null;
          score?: number;
          severity: string;
          snapshot_id?: string | null;
          title: string;
        };
        Update: {
          alert_type?: string;
          competitor_id?: string;
          created_at?: string;
          data?: Json;
          description?: string;
          id?: string;
          org_id?: string;
          read_at?: string | null;
          score?: number;
          severity?: string;
          snapshot_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_competitor_alerts_competitor_id_fkey";
            columns: ["competitor_id"];
            isOneToOne: false;
            referencedRelation: "instagram_competitors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_competitor_alerts_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_competitor_alerts_snapshot_id_fkey";
            columns: ["snapshot_id"];
            isOneToOne: false;
            referencedRelation: "instagram_competitor_snapshots";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_competitor_insights: {
        Row: {
          competitor_id: string;
          data: Json;
          evidence: string | null;
          id: string;
          insight_type: string;
          job_id: string | null;
          key: string;
          observed_at: string;
          occurrences: number;
          org_id: string;
          score: number;
          snapshot_id: string | null;
          title: string;
        };
        Insert: {
          competitor_id: string;
          data?: Json;
          evidence?: string | null;
          id?: string;
          insight_type: string;
          job_id?: string | null;
          key: string;
          observed_at?: string;
          occurrences?: number;
          org_id: string;
          score?: number;
          snapshot_id?: string | null;
          title: string;
        };
        Update: {
          competitor_id?: string;
          data?: Json;
          evidence?: string | null;
          id?: string;
          insight_type?: string;
          job_id?: string | null;
          key?: string;
          observed_at?: string;
          occurrences?: number;
          org_id?: string;
          score?: number;
          snapshot_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_competitor_insights_competitor_id_fkey";
            columns: ["competitor_id"];
            isOneToOne: false;
            referencedRelation: "instagram_competitors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_competitor_insights_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "instagram_discovery_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_competitor_insights_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_competitor_insights_snapshot_id_fkey";
            columns: ["snapshot_id"];
            isOneToOne: false;
            referencedRelation: "instagram_competitor_snapshots";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_competitor_snapshots: {
        Row: {
          average_comments: number;
          average_likes: number;
          biography: string | null;
          business_category: string | null;
          captured_at: string;
          comment_summary: Json;
          competitor_id: string;
          content_score: number;
          engagement_delta: number;
          engagement_rate: number;
          follower_delta: number;
          follower_growth_percent: number;
          followers_count: number;
          following_count: number;
          format_counts: Json;
          full_name: string | null;
          hashtags: Json;
          id: string;
          job_id: string | null;
          locations: Json;
          median_comments: number;
          median_likes: number;
          org_id: string;
          posting_frequency_weekly: number;
          posts_count: number;
          posts_delta: number;
          profile_pic_url: string | null;
          profile_snapshot: Json | null;
          top_posts: Json;
          user_id: string;
        };
        Insert: {
          average_comments?: number;
          average_likes?: number;
          biography?: string | null;
          business_category?: string | null;
          captured_at?: string;
          comment_summary?: Json;
          competitor_id: string;
          content_score?: number;
          engagement_delta?: number;
          engagement_rate?: number;
          follower_delta?: number;
          follower_growth_percent?: number;
          followers_count?: number;
          following_count?: number;
          format_counts?: Json;
          full_name?: string | null;
          hashtags?: Json;
          id?: string;
          job_id?: string | null;
          locations?: Json;
          median_comments?: number;
          median_likes?: number;
          org_id: string;
          posting_frequency_weekly?: number;
          posts_count?: number;
          posts_delta?: number;
          profile_pic_url?: string | null;
          profile_snapshot?: Json | null;
          top_posts?: Json;
          user_id: string;
        };
        Update: {
          average_comments?: number;
          average_likes?: number;
          biography?: string | null;
          business_category?: string | null;
          captured_at?: string;
          comment_summary?: Json;
          competitor_id?: string;
          content_score?: number;
          engagement_delta?: number;
          engagement_rate?: number;
          follower_delta?: number;
          follower_growth_percent?: number;
          followers_count?: number;
          following_count?: number;
          format_counts?: Json;
          full_name?: string | null;
          hashtags?: Json;
          id?: string;
          job_id?: string | null;
          locations?: Json;
          median_comments?: number;
          median_likes?: number;
          org_id?: string;
          posting_frequency_weekly?: number;
          posts_count?: number;
          posts_delta?: number;
          profile_pic_url?: string | null;
          profile_snapshot?: Json | null;
          top_posts?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_competitor_snapshots_competitor_id_fkey";
            columns: ["competitor_id"];
            isOneToOne: false;
            referencedRelation: "instagram_competitors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_competitor_snapshots_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "instagram_discovery_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_competitor_snapshots_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_competitors: {
        Row: {
          city: string | null;
          created_at: string;
          id: string;
          label: string | null;
          last_analyzed_at: string | null;
          monitoring_interval_hours: number;
          next_analysis_at: string | null;
          niche: string;
          org_id: string;
          source_id: string | null;
          state: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          username: string;
        };
        Insert: {
          city?: string | null;
          created_at?: string;
          id?: string;
          label?: string | null;
          last_analyzed_at?: string | null;
          monitoring_interval_hours?: number;
          next_analysis_at?: string | null;
          niche: string;
          org_id: string;
          source_id?: string | null;
          state?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          username: string;
        };
        Update: {
          city?: string | null;
          created_at?: string;
          id?: string;
          label?: string | null;
          last_analyzed_at?: string | null;
          monitoring_interval_hours?: number;
          next_analysis_at?: string | null;
          niche?: string;
          org_id?: string;
          source_id?: string | null;
          state?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_competitors_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_competitors_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "instagram_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_contents: {
        Row: {
          caption: string | null;
          collected_at: string;
          content_type: string;
          id: string;
          instagram_content_id: string | null;
          job_id: string | null;
          location: Json | null;
          metrics: Json;
          org_id: string;
          owner_username: string;
          posted_at: string | null;
          raw_payload: Json | null;
          shortcode: string | null;
          source_id: string | null;
          updated_at: string;
          url: string;
          user_id: string;
        };
        Insert: {
          caption?: string | null;
          collected_at?: string;
          content_type: string;
          id?: string;
          instagram_content_id?: string | null;
          job_id?: string | null;
          location?: Json | null;
          metrics?: Json;
          org_id: string;
          owner_username: string;
          posted_at?: string | null;
          raw_payload?: Json | null;
          shortcode?: string | null;
          source_id?: string | null;
          updated_at?: string;
          url: string;
          user_id: string;
        };
        Update: {
          caption?: string | null;
          collected_at?: string;
          content_type?: string;
          id?: string;
          instagram_content_id?: string | null;
          job_id?: string | null;
          location?: Json | null;
          metrics?: Json;
          org_id?: string;
          owner_username?: string;
          posted_at?: string | null;
          raw_payload?: Json | null;
          shortcode?: string | null;
          source_id?: string | null;
          updated_at?: string;
          url?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_contents_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "instagram_discovery_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_contents_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_contents_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "instagram_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_crm_activities: {
        Row: {
          activity_type: string;
          actor_user_id: string | null;
          card_id: string;
          created_at: string;
          detail: string | null;
          id: string;
          metadata: Json;
          occurred_at: string;
          org_id: string;
          title: string;
        };
        Insert: {
          activity_type: string;
          actor_user_id?: string | null;
          card_id: string;
          created_at?: string;
          detail?: string | null;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
          org_id: string;
          title: string;
        };
        Update: {
          activity_type?: string;
          actor_user_id?: string | null;
          card_id?: string;
          created_at?: string;
          detail?: string | null;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
          org_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_crm_activities_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "instagram_crm_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_crm_activities_card_org_fkey";
            columns: ["org_id", "card_id"];
            isOneToOne: false;
            referencedRelation: "instagram_crm_cards";
            referencedColumns: ["org_id", "id"];
          },
          {
            foreignKeyName: "instagram_crm_activities_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_crm_cards: {
        Row: {
          assigned_to: string | null;
          created_at: string;
          id: string;
          last_contact_at: string | null;
          lead_id: string;
          loss_reason: string | null;
          lost_at: string | null;
          next_action_at: string | null;
          next_action_type: string | null;
          org_id: string;
          source: string | null;
          stage: string;
          summary: string | null;
          tags: string[];
          temperature: string;
          updated_at: string;
          won_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string;
          id?: string;
          last_contact_at?: string | null;
          lead_id: string;
          loss_reason?: string | null;
          lost_at?: string | null;
          next_action_at?: string | null;
          next_action_type?: string | null;
          org_id: string;
          source?: string | null;
          stage?: string;
          summary?: string | null;
          tags?: string[];
          temperature?: string;
          updated_at?: string;
          won_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string;
          id?: string;
          last_contact_at?: string | null;
          lead_id?: string;
          loss_reason?: string | null;
          lost_at?: string | null;
          next_action_at?: string | null;
          next_action_type?: string | null;
          org_id?: string;
          source?: string | null;
          stage?: string;
          summary?: string | null;
          tags?: string[];
          temperature?: string;
          updated_at?: string;
          won_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_crm_cards_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_crm_cards_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_crm_tasks: {
        Row: {
          action_type: string;
          assigned_to: string | null;
          cadence_step_id: string | null;
          card_id: string;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          due_at: string;
          enrollment_id: string | null;
          id: string;
          instructions: string | null;
          org_id: string;
          outcome: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          action_type: string;
          assigned_to?: string | null;
          cadence_step_id?: string | null;
          card_id: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          due_at: string;
          enrollment_id?: string | null;
          id?: string;
          instructions?: string | null;
          org_id: string;
          outcome?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          action_type?: string;
          assigned_to?: string | null;
          cadence_step_id?: string | null;
          card_id?: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          due_at?: string;
          enrollment_id?: string | null;
          id?: string;
          instructions?: string | null;
          org_id?: string;
          outcome?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_crm_tasks_cadence_step_id_fkey";
            columns: ["cadence_step_id"];
            isOneToOne: false;
            referencedRelation: "instagram_cadence_steps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_crm_tasks_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "instagram_crm_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_crm_tasks_card_org_fkey";
            columns: ["org_id", "card_id"];
            isOneToOne: false;
            referencedRelation: "instagram_crm_cards";
            referencedColumns: ["org_id", "id"];
          },
          {
            foreignKeyName: "instagram_crm_tasks_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "instagram_cadence_enrollments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_crm_tasks_enrollment_org_fkey";
            columns: ["org_id", "enrollment_id"];
            isOneToOne: false;
            referencedRelation: "instagram_cadence_enrollments";
            referencedColumns: ["org_id", "id"];
          },
          {
            foreignKeyName: "instagram_crm_tasks_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_discovery_jobs: {
        Row: {
          actual_cost_usd: number;
          completed_at: string | null;
          created_at: string;
          error: string | null;
          estimated_cost_usd: number;
          id: string;
          input: Json;
          mode: string;
          month_ref: string;
          org_id: string;
          request_id: string;
          result: Json | null;
          source_id: string | null;
          started_at: string | null;
          stats: Json;
          status: string;
          stop_reason: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          actual_cost_usd?: number;
          completed_at?: string | null;
          created_at?: string;
          error?: string | null;
          estimated_cost_usd?: number;
          id?: string;
          input?: Json;
          mode: string;
          month_ref: string;
          org_id: string;
          request_id: string;
          result?: Json | null;
          source_id?: string | null;
          started_at?: string | null;
          stats?: Json;
          status?: string;
          stop_reason?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          actual_cost_usd?: number;
          completed_at?: string | null;
          created_at?: string;
          error?: string | null;
          estimated_cost_usd?: number;
          id?: string;
          input?: Json;
          mode?: string;
          month_ref?: string;
          org_id?: string;
          request_id?: string;
          result?: Json | null;
          source_id?: string | null;
          started_at?: string | null;
          stats?: Json;
          status?: string;
          stop_reason?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_discovery_jobs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_discovery_jobs_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "instagram_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_engagement_events: {
        Row: {
          actor_avatar_url: string | null;
          actor_full_name: string | null;
          actor_instagram_id: string | null;
          actor_username: string;
          content_id: string | null;
          created_at: string;
          event_type: string;
          id: string;
          instagram_event_id: string | null;
          intent_label: string;
          intent_score: number;
          intent_signals: Json;
          is_spam: boolean;
          job_id: string | null;
          likes_count: number;
          occurred_at: string | null;
          org_id: string;
          raw_payload: Json | null;
          replies_count: number;
          source_id: string | null;
          text: string;
          user_id: string;
        };
        Insert: {
          actor_avatar_url?: string | null;
          actor_full_name?: string | null;
          actor_instagram_id?: string | null;
          actor_username: string;
          content_id?: string | null;
          created_at?: string;
          event_type: string;
          id?: string;
          instagram_event_id?: string | null;
          intent_label: string;
          intent_score: number;
          intent_signals?: Json;
          is_spam?: boolean;
          job_id?: string | null;
          likes_count?: number;
          occurred_at?: string | null;
          org_id: string;
          raw_payload?: Json | null;
          replies_count?: number;
          source_id?: string | null;
          text: string;
          user_id: string;
        };
        Update: {
          actor_avatar_url?: string | null;
          actor_full_name?: string | null;
          actor_instagram_id?: string | null;
          actor_username?: string;
          content_id?: string | null;
          created_at?: string;
          event_type?: string;
          id?: string;
          instagram_event_id?: string | null;
          intent_label?: string;
          intent_score?: number;
          intent_signals?: Json;
          is_spam?: boolean;
          job_id?: string | null;
          likes_count?: number;
          occurred_at?: string | null;
          org_id?: string;
          raw_payload?: Json | null;
          replies_count?: number;
          source_id?: string | null;
          text?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_engagement_events_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "instagram_contents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_engagement_events_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "instagram_discovery_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_engagement_events_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_engagement_events_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "instagram_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_flow_edges: {
        Row: {
          created_at: string;
          flow_id: string;
          id: string;
          org_id: string;
          source_handle: string;
          source_node_id: string;
          target_node_id: string;
        };
        Insert: {
          created_at?: string;
          flow_id: string;
          id?: string;
          org_id: string;
          source_handle?: string;
          source_node_id: string;
          target_node_id: string;
        };
        Update: {
          created_at?: string;
          flow_id?: string;
          id?: string;
          org_id?: string;
          source_handle?: string;
          source_node_id?: string;
          target_node_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_flow_edges_flow_id_fkey";
            columns: ["flow_id"];
            isOneToOne: false;
            referencedRelation: "instagram_flows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_flow_edges_flow_org_fkey";
            columns: ["org_id", "flow_id"];
            isOneToOne: false;
            referencedRelation: "instagram_flows";
            referencedColumns: ["org_id", "id"];
          },
          {
            foreignKeyName: "instagram_flow_edges_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_flow_edges_source_node_id_fkey";
            columns: ["source_node_id"];
            isOneToOne: false;
            referencedRelation: "instagram_flow_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_flow_edges_source_org_fkey";
            columns: ["org_id", "source_node_id"];
            isOneToOne: false;
            referencedRelation: "instagram_flow_nodes";
            referencedColumns: ["org_id", "id"];
          },
          {
            foreignKeyName: "instagram_flow_edges_target_node_id_fkey";
            columns: ["target_node_id"];
            isOneToOne: false;
            referencedRelation: "instagram_flow_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_flow_edges_target_org_fkey";
            columns: ["org_id", "target_node_id"];
            isOneToOne: false;
            referencedRelation: "instagram_flow_nodes";
            referencedColumns: ["org_id", "id"];
          },
        ];
      };
      instagram_flow_nodes: {
        Row: {
          config: Json;
          created_at: string;
          flow_id: string;
          id: string;
          label: string;
          node_type: string;
          org_id: string;
          position_x: number;
          position_y: number;
          subtype: string;
          updated_at: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          flow_id: string;
          id?: string;
          label: string;
          node_type: string;
          org_id: string;
          position_x?: number;
          position_y?: number;
          subtype: string;
          updated_at?: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          flow_id?: string;
          id?: string;
          label?: string;
          node_type?: string;
          org_id?: string;
          position_x?: number;
          position_y?: number;
          subtype?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_flow_nodes_flow_id_fkey";
            columns: ["flow_id"];
            isOneToOne: false;
            referencedRelation: "instagram_flows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_flow_nodes_flow_org_fkey";
            columns: ["org_id", "flow_id"];
            isOneToOne: false;
            referencedRelation: "instagram_flows";
            referencedColumns: ["org_id", "id"];
          },
          {
            foreignKeyName: "instagram_flow_nodes_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_flow_runs: {
        Row: {
          card_id: string | null;
          completed_at: string | null;
          context: Json;
          conversation_id: string | null;
          current_node_id: string | null;
          error_message: string | null;
          flow_id: string;
          id: string;
          org_id: string;
          started_at: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          card_id?: string | null;
          completed_at?: string | null;
          context?: Json;
          conversation_id?: string | null;
          current_node_id?: string | null;
          error_message?: string | null;
          flow_id: string;
          id?: string;
          org_id: string;
          started_at?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          card_id?: string | null;
          completed_at?: string | null;
          context?: Json;
          conversation_id?: string | null;
          current_node_id?: string | null;
          error_message?: string | null;
          flow_id?: string;
          id?: string;
          org_id?: string;
          started_at?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_flow_runs_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "instagram_crm_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_flow_runs_card_org_fkey";
            columns: ["org_id", "card_id"];
            isOneToOne: false;
            referencedRelation: "instagram_crm_cards";
            referencedColumns: ["org_id", "id"];
          },
          {
            foreignKeyName: "instagram_flow_runs_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "ig_conversas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_flow_runs_current_node_id_fkey";
            columns: ["current_node_id"];
            isOneToOne: false;
            referencedRelation: "instagram_flow_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_flow_runs_flow_id_fkey";
            columns: ["flow_id"];
            isOneToOne: false;
            referencedRelation: "instagram_flows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_flow_runs_flow_org_fkey";
            columns: ["org_id", "flow_id"];
            isOneToOne: false;
            referencedRelation: "instagram_flows";
            referencedColumns: ["org_id", "id"];
          },
          {
            foreignKeyName: "instagram_flow_runs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_flows: {
        Row: {
          account_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          org_id: string;
          published_at: string | null;
          status: string;
          trigger_config: Json;
          trigger_type: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          account_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          org_id: string;
          published_at?: string | null;
          status?: string;
          trigger_config?: Json;
          trigger_type?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          account_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          org_id?: string;
          published_at?: string | null;
          status?: string;
          trigger_config?: Json;
          trigger_type?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_flows_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "ig_instancias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_flows_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_job_steps: {
        Row: {
          actor_id: string | null;
          apify_dataset_id: string | null;
          apify_run_id: string | null;
          completed_at: string | null;
          cost_usd: number;
          created_at: string;
          error: string | null;
          id: string;
          input: Json;
          job_id: string;
          org_id: string;
          requested_count: number;
          returned_count: number;
          started_at: string | null;
          status: string;
          step_type: string;
        };
        Insert: {
          actor_id?: string | null;
          apify_dataset_id?: string | null;
          apify_run_id?: string | null;
          completed_at?: string | null;
          cost_usd?: number;
          created_at?: string;
          error?: string | null;
          id?: string;
          input?: Json;
          job_id: string;
          org_id: string;
          requested_count?: number;
          returned_count?: number;
          started_at?: string | null;
          status?: string;
          step_type: string;
        };
        Update: {
          actor_id?: string | null;
          apify_dataset_id?: string | null;
          apify_run_id?: string | null;
          completed_at?: string | null;
          cost_usd?: number;
          created_at?: string;
          error?: string | null;
          id?: string;
          input?: Json;
          job_id?: string;
          org_id?: string;
          requested_count?: number;
          returned_count?: number;
          started_at?: string | null;
          status?: string;
          step_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_job_steps_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "instagram_discovery_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_job_steps_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_oauth_states: {
        Row: {
          created_at: string;
          expires_at: string;
          org_id: string;
          provider: string;
          redirect_to: string;
          state: string;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string;
          org_id: string;
          provider?: string;
          redirect_to?: string;
          state: string;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          org_id?: string;
          provider?: string;
          redirect_to?: string;
          state?: string;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_oauth_states_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_opportunities: {
        Row: {
          evidence: Json;
          first_seen_at: string;
          id: string;
          last_seen_at: string;
          lead_id: string | null;
          org_id: string;
          profile_identity_key: string;
          reasons: Json;
          score: number;
          sources: Json;
          status: string;
          suggested_approach: string | null;
          temperature: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          evidence?: Json;
          first_seen_at?: string;
          id?: string;
          last_seen_at?: string;
          lead_id?: string | null;
          org_id: string;
          profile_identity_key: string;
          reasons?: Json;
          score?: number;
          sources?: Json;
          status?: string;
          suggested_approach?: string | null;
          temperature?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          evidence?: Json;
          first_seen_at?: string;
          id?: string;
          last_seen_at?: string;
          lead_id?: string | null;
          org_id?: string;
          profile_identity_key?: string;
          reasons?: Json;
          score?: number;
          sources?: Json;
          status?: string;
          suggested_approach?: string | null;
          temperature?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_opportunities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_opportunities_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_opportunities_profile_identity_key_fkey";
            columns: ["profile_identity_key"];
            isOneToOne: false;
            referencedRelation: "instagram_profile_catalog";
            referencedColumns: ["identity_key"];
          },
        ];
      };
      instagram_outreach_tasks: {
        Row: {
          assigned_to: string | null;
          campanha_id: string;
          created_at: string;
          id: string;
          lead_id: string;
          message_text: string;
          opened_at: string | null;
          org_id: string;
          replied_at: string | null;
          sent_at: string | null;
          state: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assigned_to?: string | null;
          campanha_id: string;
          created_at?: string;
          id?: string;
          lead_id: string;
          message_text: string;
          opened_at?: string | null;
          org_id: string;
          replied_at?: string | null;
          sent_at?: string | null;
          state?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_to?: string | null;
          campanha_id?: string;
          created_at?: string;
          id?: string;
          lead_id?: string;
          message_text?: string;
          opened_at?: string | null;
          org_id?: string;
          replied_at?: string | null;
          sent_at?: string | null;
          state?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_outreach_tasks_campanha_id_fkey";
            columns: ["campanha_id"];
            isOneToOne: false;
            referencedRelation: "campanhas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_outreach_tasks_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_outreach_tasks_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_plan_usage: {
        Row: {
          audience_profiles: number;
          brands: number;
          competitors: number;
          cost_usd: number;
          enrichments: number;
          hunts: number;
          leads: number;
          month_ref: string;
          org_id: string;
          overlap_runs: number;
          updated_at: string;
        };
        Insert: {
          audience_profiles?: number;
          brands?: number;
          competitors?: number;
          cost_usd?: number;
          enrichments?: number;
          hunts?: number;
          leads?: number;
          month_ref: string;
          org_id: string;
          overlap_runs?: number;
          updated_at?: string;
        };
        Update: {
          audience_profiles?: number;
          brands?: number;
          competitors?: number;
          cost_usd?: number;
          enrichments?: number;
          hunts?: number;
          leads?: number;
          month_ref?: string;
          org_id?: string;
          overlap_runs?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_plan_usage_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_profile_catalog: {
        Row: {
          biography: string | null;
          business_category: string | null;
          collected_at: string;
          external_url: string | null;
          followers_count: number | null;
          following_count: number | null;
          full_name: string | null;
          id: string;
          identity_key: string;
          instagram_user_id: string | null;
          posts_count: number | null;
          professional: boolean | null;
          profile_pic_url: string | null;
          public_payload: Json;
          updated_at: string;
          username: string;
        };
        Insert: {
          biography?: string | null;
          business_category?: string | null;
          collected_at?: string;
          external_url?: string | null;
          followers_count?: number | null;
          following_count?: number | null;
          full_name?: string | null;
          id?: string;
          identity_key: string;
          instagram_user_id?: string | null;
          posts_count?: number | null;
          professional?: boolean | null;
          profile_pic_url?: string | null;
          public_payload?: Json;
          updated_at?: string;
          username: string;
        };
        Update: {
          biography?: string | null;
          business_category?: string | null;
          collected_at?: string;
          external_url?: string | null;
          followers_count?: number | null;
          following_count?: number | null;
          full_name?: string | null;
          id?: string;
          identity_key?: string;
          instagram_user_id?: string | null;
          posts_count?: number | null;
          professional?: boolean | null;
          profile_pic_url?: string | null;
          public_payload?: Json;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      instagram_profile_evidence: {
        Row: {
          activity_score: number | null;
          authenticity_score: number | null;
          content_id: string | null;
          content_score: number | null;
          created_at: string;
          decision: string;
          event_id: string | null;
          evidence_type: string;
          excerpt: string;
          fit_score: number | null;
          id: string;
          intent_label: string | null;
          intent_score: number | null;
          job_id: string | null;
          lead_id: string | null;
          lead_score: number | null;
          observed_at: string | null;
          org_id: string;
          profile_snapshot: Json | null;
          rejection_reason: string | null;
          score_v2: Json;
          signal_data: Json;
          source_url: string | null;
          user_id: string;
          username: string;
        };
        Insert: {
          activity_score?: number | null;
          authenticity_score?: number | null;
          content_id?: string | null;
          content_score?: number | null;
          created_at?: string;
          decision: string;
          event_id?: string | null;
          evidence_type: string;
          excerpt: string;
          fit_score?: number | null;
          id?: string;
          intent_label?: string | null;
          intent_score?: number | null;
          job_id?: string | null;
          lead_id?: string | null;
          lead_score?: number | null;
          observed_at?: string | null;
          org_id: string;
          profile_snapshot?: Json | null;
          rejection_reason?: string | null;
          score_v2?: Json;
          signal_data?: Json;
          source_url?: string | null;
          user_id: string;
          username: string;
        };
        Update: {
          activity_score?: number | null;
          authenticity_score?: number | null;
          content_id?: string | null;
          content_score?: number | null;
          created_at?: string;
          decision?: string;
          event_id?: string | null;
          evidence_type?: string;
          excerpt?: string;
          fit_score?: number | null;
          id?: string;
          intent_label?: string | null;
          intent_score?: number | null;
          job_id?: string | null;
          lead_id?: string | null;
          lead_score?: number | null;
          observed_at?: string | null;
          org_id?: string;
          profile_snapshot?: Json | null;
          rejection_reason?: string | null;
          score_v2?: Json;
          signal_data?: Json;
          source_url?: string | null;
          user_id?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_profile_evidence_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "instagram_contents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_profile_evidence_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "instagram_engagement_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_profile_evidence_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "instagram_discovery_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_profile_evidence_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_profile_evidence_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_profiles: {
        Row: {
          account_type: string | null;
          activity_score: number | null;
          authenticity_score: number | null;
          avg_comments: number | null;
          avg_likes: number | null;
          bio_links: Json;
          biography: string | null;
          business_address: Json | null;
          business_category: string | null;
          business_email: string | null;
          business_phone: string | null;
          collected_at: string;
          content_score: number | null;
          content_signals: Json;
          discovery_source: string;
          engagement_rate: number | null;
          external_url: string | null;
          fit_score: number | null;
          followers_count: number | null;
          following_count: number | null;
          full_name: string | null;
          instagram_user_id: string | null;
          intent_score: number | null;
          last_active_at: string | null;
          last_post_at: string | null;
          lead_id: string;
          lead_score: number | null;
          org_id: string;
          posts_count: number | null;
          private: boolean;
          professional: boolean;
          profile_pic_url: string | null;
          raw_payload: Json | null;
          recent_posts: Json;
          related_profiles: Json;
          score_v2: Json;
          updated_at: string;
          user_id: string;
          username: string;
          verified: boolean;
        };
        Insert: {
          account_type?: string | null;
          activity_score?: number | null;
          authenticity_score?: number | null;
          avg_comments?: number | null;
          avg_likes?: number | null;
          bio_links?: Json;
          biography?: string | null;
          business_address?: Json | null;
          business_category?: string | null;
          business_email?: string | null;
          business_phone?: string | null;
          collected_at?: string;
          content_score?: number | null;
          content_signals?: Json;
          discovery_source?: string;
          engagement_rate?: number | null;
          external_url?: string | null;
          fit_score?: number | null;
          followers_count?: number | null;
          following_count?: number | null;
          full_name?: string | null;
          instagram_user_id?: string | null;
          intent_score?: number | null;
          last_active_at?: string | null;
          last_post_at?: string | null;
          lead_id: string;
          lead_score?: number | null;
          org_id: string;
          posts_count?: number | null;
          private?: boolean;
          professional?: boolean;
          profile_pic_url?: string | null;
          raw_payload?: Json | null;
          recent_posts?: Json;
          related_profiles?: Json;
          score_v2?: Json;
          updated_at?: string;
          user_id: string;
          username: string;
          verified?: boolean;
        };
        Update: {
          account_type?: string | null;
          activity_score?: number | null;
          authenticity_score?: number | null;
          avg_comments?: number | null;
          avg_likes?: number | null;
          bio_links?: Json;
          biography?: string | null;
          business_address?: Json | null;
          business_category?: string | null;
          business_email?: string | null;
          business_phone?: string | null;
          collected_at?: string;
          content_score?: number | null;
          content_signals?: Json;
          discovery_source?: string;
          engagement_rate?: number | null;
          external_url?: string | null;
          fit_score?: number | null;
          followers_count?: number | null;
          following_count?: number | null;
          full_name?: string | null;
          instagram_user_id?: string | null;
          intent_score?: number | null;
          last_active_at?: string | null;
          last_post_at?: string | null;
          lead_id?: string;
          lead_score?: number | null;
          org_id?: string;
          posts_count?: number | null;
          private?: boolean;
          professional?: boolean;
          profile_pic_url?: string | null;
          raw_payload?: Json | null;
          recent_posts?: Json;
          related_profiles?: Json;
          score_v2?: Json;
          updated_at?: string;
          user_id?: string;
          username?: string;
          verified?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_profiles_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: true;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_profiles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_search_results: {
        Row: {
          activity_score: number | null;
          authenticity_score: number | null;
          created_at: string;
          decision: string;
          fit_score: number | null;
          id: string;
          intent_score: number | null;
          is_new: boolean;
          lead_id: string | null;
          org_id: string;
          profile_snapshot: Json;
          rank: number;
          rejection_reason: string | null;
          score: number | null;
          score_v2: Json;
          search_id: string;
          user_id: string;
          username: string;
        };
        Insert: {
          activity_score?: number | null;
          authenticity_score?: number | null;
          created_at?: string;
          decision: string;
          fit_score?: number | null;
          id?: string;
          intent_score?: number | null;
          is_new?: boolean;
          lead_id?: string | null;
          org_id: string;
          profile_snapshot?: Json;
          rank?: number;
          rejection_reason?: string | null;
          score?: number | null;
          score_v2?: Json;
          search_id: string;
          user_id: string;
          username: string;
        };
        Update: {
          activity_score?: number | null;
          authenticity_score?: number | null;
          created_at?: string;
          decision?: string;
          fit_score?: number | null;
          id?: string;
          intent_score?: number | null;
          is_new?: boolean;
          lead_id?: string | null;
          org_id?: string;
          profile_snapshot?: Json;
          rank?: number;
          rejection_reason?: string | null;
          score?: number | null;
          score_v2?: Json;
          search_id?: string;
          user_id?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_search_results_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_search_results_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_search_results_search_id_fkey";
            columns: ["search_id"];
            isOneToOne: false;
            referencedRelation: "redes_buscas";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_sources: {
        Row: {
          config: Json;
          created_at: string;
          id: string;
          name: string;
          org_id: string;
          source_type: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          id?: string;
          name: string;
          org_id: string;
          source_type: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          id?: string;
          name?: string;
          org_id?: string;
          source_type?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_sources_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_usage_reservations: {
        Row: {
          action: string;
          actual: Json | null;
          created_at: string;
          finalized_at: string | null;
          id: string;
          month_ref: string;
          org_id: string;
          request_id: string;
          reserved: Json;
          status: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          actual?: Json | null;
          created_at?: string;
          finalized_at?: string | null;
          id?: string;
          month_ref: string;
          org_id: string;
          request_id: string;
          reserved?: Json;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          actual?: Json | null;
          created_at?: string;
          finalized_at?: string | null;
          id?: string;
          month_ref?: string;
          org_id?: string;
          request_id?: string;
          reserved?: Json;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_usage_reservations_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      integrations: {
        Row: {
          api_key_encrypted: string | null;
          created_at: string;
          id: string;
          is_connected: boolean;
          last_synced_at: string | null;
          name: string;
          org_id: string | null;
          provider: string;
          settings: Json | null;
          user_id: string;
        };
        Insert: {
          api_key_encrypted?: string | null;
          created_at?: string;
          id?: string;
          is_connected?: boolean;
          last_synced_at?: string | null;
          name: string;
          org_id?: string | null;
          provider: string;
          settings?: Json | null;
          user_id: string;
        };
        Update: {
          api_key_encrypted?: string | null;
          created_at?: string;
          id?: string;
          is_connected?: boolean;
          last_synced_at?: string | null;
          name?: string;
          org_id?: string | null;
          provider?: string;
          settings?: Json | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integrations_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          description: string | null;
          id: string;
          org_id: string | null;
          paid_at: string | null;
          period_end: string | null;
          period_start: string | null;
          status: string;
          stripe_invoice_id: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          org_id?: string | null;
          paid_at?: string | null;
          period_end?: string | null;
          period_start?: string | null;
          status?: string;
          stripe_invoice_id?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          org_id?: string | null;
          paid_at?: string | null;
          period_end?: string | null;
          period_start?: string | null;
          status?: string;
          stripe_invoice_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_atribuicoes: {
        Row: {
          criado_em: string;
          de_user_id: string | null;
          id: string;
          lead_id: string;
          motivo: string | null;
          org_id: string | null;
          para_user_id: string;
          por_user_id: string | null;
        };
        Insert: {
          criado_em?: string;
          de_user_id?: string | null;
          id?: string;
          lead_id: string;
          motivo?: string | null;
          org_id?: string | null;
          para_user_id: string;
          por_user_id?: string | null;
        };
        Update: {
          criado_em?: string;
          de_user_id?: string | null;
          id?: string;
          lead_id?: string;
          motivo?: string | null;
          org_id?: string | null;
          para_user_id?: string;
          por_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_atribuicoes_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_atribuicoes_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_catalog: {
        Row: {
          address: string | null;
          business_key: string | null;
          category: string | null;
          facebook: string | null;
          first_seen_at: string;
          instagram: string | null;
          last_seen_at: string;
          latitude: number | null;
          longitude: number | null;
          name: string;
          phone: string | null;
          place_id: string;
          rating: number | null;
          review_count: number | null;
          source: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          business_key?: string | null;
          category?: string | null;
          facebook?: string | null;
          first_seen_at?: string;
          instagram?: string | null;
          last_seen_at?: string;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          phone?: string | null;
          place_id: string;
          rating?: number | null;
          review_count?: number | null;
          source: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          business_key?: string | null;
          category?: string | null;
          facebook?: string | null;
          first_seen_at?: string;
          instagram?: string | null;
          last_seen_at?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          phone?: string | null;
          place_id?: string;
          rating?: number | null;
          review_count?: number | null;
          source?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      lead_catalog_hits: {
        Row: {
          area_kind: string;
          center_lat: number | null;
          center_lng: number | null;
          city_key: string;
          first_seen_at: string;
          last_seen_at: string;
          niche_family: string;
          place_id: string;
          query_key: string;
          radius_km: number | null;
          result_rank: number;
          state_key: string;
        };
        Insert: {
          area_kind: string;
          center_lat?: number | null;
          center_lng?: number | null;
          city_key?: string;
          first_seen_at?: string;
          last_seen_at?: string;
          niche_family: string;
          place_id: string;
          query_key: string;
          radius_km?: number | null;
          result_rank?: number;
          state_key?: string;
        };
        Update: {
          area_kind?: string;
          center_lat?: number | null;
          center_lng?: number | null;
          city_key?: string;
          first_seen_at?: string;
          last_seen_at?: string;
          niche_family?: string;
          place_id?: string;
          query_key?: string;
          radius_km?: number | null;
          result_rank?: number;
          state_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_catalog_hits_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "lead_catalog";
            referencedColumns: ["place_id"];
          },
        ];
      };
      lead_contatos: {
        Row: {
          anotacao: string | null;
          canal: string;
          contatado_em: string;
          created_at: string;
          id: string;
          lead_id: string;
          org_id: string | null;
          user_id: string;
        };
        Insert: {
          anotacao?: string | null;
          canal: string;
          contatado_em?: string;
          created_at?: string;
          id?: string;
          lead_id: string;
          org_id?: string | null;
          user_id?: string;
        };
        Update: {
          anotacao?: string | null;
          canal?: string;
          contatado_em?: string;
          created_at?: string;
          id?: string;
          lead_id?: string;
          org_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_contatos_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_contatos_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_lists: {
        Row: {
          city: string;
          contacted_count: number;
          created_at: string;
          description: string | null;
          enriched_count: number;
          follow_up_ativo: boolean;
          fonte: string | null;
          id: string;
          name: string;
          niche: string;
          org_id: string | null;
          radius: number;
          total_leads: number;
          uf: string | null;
          user_id: string;
        };
        Insert: {
          city: string;
          contacted_count?: number;
          created_at?: string;
          description?: string | null;
          enriched_count?: number;
          follow_up_ativo?: boolean;
          fonte?: string | null;
          id?: string;
          name: string;
          niche: string;
          org_id?: string | null;
          radius?: number;
          total_leads?: number;
          uf?: string | null;
          user_id: string;
        };
        Update: {
          city?: string;
          contacted_count?: number;
          created_at?: string;
          description?: string | null;
          enriched_count?: number;
          follow_up_ativo?: boolean;
          fonte?: string | null;
          id?: string;
          name?: string;
          niche?: string;
          org_id?: string | null;
          radius?: number;
          total_leads?: number;
          uf?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_lists_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_niche_aliases: {
        Row: {
          alias_key: string;
          created_at: string;
          family_key: string;
          family_label: string;
        };
        Insert: {
          alias_key: string;
          created_at?: string;
          family_key: string;
          family_label: string;
        };
        Update: {
          alias_key?: string;
          created_at?: string;
          family_key?: string;
          family_label?: string;
        };
        Relationships: [];
      };
      lead_reviews: {
        Row: {
          author_name: string | null;
          author_photo: string | null;
          fetched_at: string;
          id: string;
          lead_id: string;
          org_id: string | null;
          rating: number | null;
          review_url: string | null;
          source: string;
          text: string | null;
          user_id: string;
          when_label: string | null;
        };
        Insert: {
          author_name?: string | null;
          author_photo?: string | null;
          fetched_at?: string;
          id?: string;
          lead_id: string;
          org_id?: string | null;
          rating?: number | null;
          review_url?: string | null;
          source?: string;
          text?: string | null;
          user_id: string;
          when_label?: string | null;
        };
        Update: {
          author_name?: string | null;
          author_photo?: string | null;
          fetched_at?: string;
          id?: string;
          lead_id?: string;
          org_id?: string | null;
          rating?: number | null;
          review_url?: string | null;
          source?: string;
          text?: string | null;
          user_id?: string;
          when_label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_reviews_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_reviews_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_search_events: {
        Row: {
          cache_returned: number;
          catalog_returned: number;
          city: string | null;
          created_at: string;
          duplicates_avoided: number;
          id: string;
          niche: string;
          org_id: string;
          paid_run_started: boolean;
          provider_returned: number;
          query_key: string;
          reason: string;
          requested: number;
          returned_candidates: number;
          state: string | null;
          user_id: string | null;
        };
        Insert: {
          cache_returned?: number;
          catalog_returned?: number;
          city?: string | null;
          created_at?: string;
          duplicates_avoided?: number;
          id?: string;
          niche: string;
          org_id: string;
          paid_run_started?: boolean;
          provider_returned?: number;
          query_key: string;
          reason: string;
          requested: number;
          returned_candidates?: number;
          state?: string | null;
          user_id?: string | null;
        };
        Update: {
          cache_returned?: number;
          catalog_returned?: number;
          city?: string | null;
          created_at?: string;
          duplicates_avoided?: number;
          id?: string;
          niche?: string;
          org_id?: string;
          paid_run_started?: boolean;
          provider_returned?: number;
          query_key?: string;
          reason?: string;
          requested?: number;
          returned_candidates?: number;
          state?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_search_events_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_seen_registry: {
        Row: {
          business_key: string | null;
          first_seen_at: string;
          first_user_id: string | null;
          org_id: string;
          place_id: string;
        };
        Insert: {
          business_key?: string | null;
          first_seen_at?: string;
          first_user_id?: string | null;
          org_id: string;
          place_id: string;
        };
        Update: {
          business_key?: string | null;
          first_seen_at?: string;
          first_user_id?: string | null;
          org_id?: string;
          place_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_seen_registry_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          address: string | null;
          assigned_to: string | null;
          bairro: string | null;
          business_name: string;
          cargo: string | null;
          category: string | null;
          city: string | null;
          created_at: string;
          email: string | null;
          email_opt_out: boolean;
          email_opt_out_em: string | null;
          enriched_at: string | null;
          facebook_url: string | null;
          has_hours: boolean | null;
          has_phone: boolean | null;
          has_photos: boolean | null;
          has_website: boolean | null;
          id: string;
          instagram_url: string | null;
          last_contacted_at: string | null;
          latitude: number | null;
          linkedin_url: string | null;
          list_id: string | null;
          longitude: number | null;
          motivo_perda: string | null;
          motivo_perda_nota: string | null;
          notes: string | null;
          opt_out_token: string | null;
          org_id: string | null;
          origem_estrategia: string | null;
          origem_fonte: string | null;
          owner_name: string | null;
          perda_em: string | null;
          phone: string | null;
          place_id: string | null;
          rating: number | null;
          review_count: number | null;
          score: number;
          score_breakdown: Json | null;
          seguidores: number | null;
          sem_contato: boolean;
          state: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          website: string | null;
          whatsapp: string | null;
          zip: string | null;
        };
        Insert: {
          address?: string | null;
          assigned_to?: string | null;
          bairro?: string | null;
          business_name: string;
          cargo?: string | null;
          category?: string | null;
          city?: string | null;
          created_at?: string;
          email?: string | null;
          email_opt_out?: boolean;
          email_opt_out_em?: string | null;
          enriched_at?: string | null;
          facebook_url?: string | null;
          has_hours?: boolean | null;
          has_phone?: boolean | null;
          has_photos?: boolean | null;
          has_website?: boolean | null;
          id?: string;
          instagram_url?: string | null;
          last_contacted_at?: string | null;
          latitude?: number | null;
          linkedin_url?: string | null;
          list_id?: string | null;
          longitude?: number | null;
          motivo_perda?: string | null;
          motivo_perda_nota?: string | null;
          notes?: string | null;
          opt_out_token?: string | null;
          org_id?: string | null;
          origem_estrategia?: string | null;
          origem_fonte?: string | null;
          owner_name?: string | null;
          perda_em?: string | null;
          phone?: string | null;
          place_id?: string | null;
          rating?: number | null;
          review_count?: number | null;
          score?: number;
          score_breakdown?: Json | null;
          seguidores?: number | null;
          sem_contato?: boolean;
          state?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          website?: string | null;
          whatsapp?: string | null;
          zip?: string | null;
        };
        Update: {
          address?: string | null;
          assigned_to?: string | null;
          bairro?: string | null;
          business_name?: string;
          cargo?: string | null;
          category?: string | null;
          city?: string | null;
          created_at?: string;
          email?: string | null;
          email_opt_out?: boolean;
          email_opt_out_em?: string | null;
          enriched_at?: string | null;
          facebook_url?: string | null;
          has_hours?: boolean | null;
          has_phone?: boolean | null;
          has_photos?: boolean | null;
          has_website?: boolean | null;
          id?: string;
          instagram_url?: string | null;
          last_contacted_at?: string | null;
          latitude?: number | null;
          linkedin_url?: string | null;
          list_id?: string | null;
          longitude?: number | null;
          motivo_perda?: string | null;
          motivo_perda_nota?: string | null;
          notes?: string | null;
          opt_out_token?: string | null;
          org_id?: string | null;
          origem_estrategia?: string | null;
          origem_fonte?: string | null;
          owner_name?: string | null;
          perda_em?: string | null;
          phone?: string | null;
          place_id?: string | null;
          rating?: number | null;
          review_count?: number | null;
          score?: number;
          score_breakdown?: Json | null;
          seguidores?: number | null;
          sem_contato?: boolean;
          state?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          website?: string | null;
          whatsapp?: string | null;
          zip?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_list_id_fkey";
            columns: ["list_id"];
            isOneToOne: false;
            referencedRelation: "lead_lists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      memberships: {
        Row: {
          criada_em: string;
          id: string;
          org_id: string;
          papel: Database["public"]["Enums"]["papel_org"];
          user_id: string;
        };
        Insert: {
          criada_em?: string;
          id?: string;
          org_id: string;
          papel?: Database["public"]["Enums"]["papel_org"];
          user_id: string;
        };
        Update: {
          criada_em?: string;
          id?: string;
          org_id?: string;
          papel?: Database["public"]["Enums"]["papel_org"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      notificacao_destinatarios: {
        Row: {
          enviado_em: string;
          id: string;
          lida_em: string | null;
          notificacao_id: string;
          user_id: string;
        };
        Insert: {
          enviado_em?: string;
          id?: string;
          lida_em?: string | null;
          notificacao_id: string;
          user_id: string;
        };
        Update: {
          enviado_em?: string;
          id?: string;
          lida_em?: string | null;
          notificacao_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notificacao_destinatarios_notificacao_id_fkey";
            columns: ["notificacao_id"];
            isOneToOne: false;
            referencedRelation: "notificacoes";
            referencedColumns: ["id"];
          },
        ];
      };
      notificacoes: {
        Row: {
          criado_em: string;
          criado_por: string | null;
          id: string;
          mensagem: string;
          titulo: string;
        };
        Insert: {
          criado_em?: string;
          criado_por?: string | null;
          id?: string;
          mensagem: string;
          titulo: string;
        };
        Update: {
          criado_em?: string;
          criado_por?: string | null;
          id?: string;
          mensagem?: string;
          titulo?: string;
        };
        Relationships: [];
      };
      org_papeis: {
        Row: {
          ativo: boolean;
          org_id: string;
          papel: Database["public"]["Enums"]["papel_org"];
        };
        Insert: {
          ativo?: boolean;
          org_id: string;
          papel: Database["public"]["Enums"]["papel_org"];
        };
        Update: {
          ativo?: boolean;
          org_id?: string;
          papel?: Database["public"]["Enums"]["papel_org"];
        };
        Relationships: [
          {
            foreignKeyName: "org_papeis_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      orgs: {
        Row: {
          criada_em: string;
          dono_user_id: string;
          id: string;
          limite_leads_override: number | null;
          limite_sites_override: number | null;
          nome: string;
          plano_id: string | null;
          sites_bonus: number;
        };
        Insert: {
          criada_em?: string;
          dono_user_id: string;
          id?: string;
          limite_leads_override?: number | null;
          limite_sites_override?: number | null;
          nome: string;
          plano_id?: string | null;
          sites_bonus?: number;
        };
        Update: {
          criada_em?: string;
          dono_user_id?: string;
          id?: string;
          limite_leads_override?: number | null;
          limite_sites_override?: number | null;
          nome?: string;
          plano_id?: string | null;
          sites_bonus?: number;
        };
        Relationships: [
          {
            foreignKeyName: "orgs_plano_id_fkey";
            columns: ["plano_id"];
            isOneToOne: false;
            referencedRelation: "planos";
            referencedColumns: ["id"];
          },
        ];
      };
      planos: {
        Row: {
          ativo: boolean;
          criado_em: string;
          descricao: string | null;
          has_contratos: boolean | null;
          has_financeiro: boolean | null;
          has_instagram_search: boolean | null;
          has_linkedin_search: boolean | null;
          has_propostas: boolean | null;
          has_publicar: boolean | null;
          has_redesign: boolean | null;
          has_whatsapp: boolean | null;
          id: string;
          instagram_nivel: string;
          limite_campanhas: number | null;
          limite_flow_business_cadencias: number;
          limite_flow_business_contas: number;
          limite_flow_business_crm: number;
          limite_flow_business_fluxos: number;
          limite_instagram_audiencia: number;
          limite_instagram_cacadas: number;
          limite_instagram_concorrentes: number;
          limite_instagram_cruzamentos: number;
          limite_instagram_enriquecimentos: number;
          limite_instagram_leads: number;
          limite_instagram_marcas: number;
          limite_leads: number | null;
          limite_mensagens: number | null;
          limite_segmentos: number | null;
          limite_sites: number | null;
          limite_templates: number | null;
          limite_whatsapp: number | null;
          monitoramento_instagram: string;
          nome: string;
          ordem: number;
          periodo: string;
          preco: number;
          teto_instagram_usd: number;
        };
        Insert: {
          ativo?: boolean;
          criado_em?: string;
          descricao?: string | null;
          has_contratos?: boolean | null;
          has_financeiro?: boolean | null;
          has_instagram_search?: boolean | null;
          has_linkedin_search?: boolean | null;
          has_propostas?: boolean | null;
          has_publicar?: boolean | null;
          has_redesign?: boolean | null;
          has_whatsapp?: boolean | null;
          id?: string;
          instagram_nivel?: string;
          limite_campanhas?: number | null;
          limite_flow_business_cadencias?: number;
          limite_flow_business_contas?: number;
          limite_flow_business_crm?: number;
          limite_flow_business_fluxos?: number;
          limite_instagram_audiencia?: number;
          limite_instagram_cacadas?: number;
          limite_instagram_concorrentes?: number;
          limite_instagram_cruzamentos?: number;
          limite_instagram_enriquecimentos?: number;
          limite_instagram_leads?: number;
          limite_instagram_marcas?: number;
          limite_leads?: number | null;
          limite_mensagens?: number | null;
          limite_segmentos?: number | null;
          limite_sites?: number | null;
          limite_templates?: number | null;
          limite_whatsapp?: number | null;
          monitoramento_instagram?: string;
          nome: string;
          ordem?: number;
          periodo?: string;
          preco?: number;
          teto_instagram_usd?: number;
        };
        Update: {
          ativo?: boolean;
          criado_em?: string;
          descricao?: string | null;
          has_contratos?: boolean | null;
          has_financeiro?: boolean | null;
          has_instagram_search?: boolean | null;
          has_linkedin_search?: boolean | null;
          has_propostas?: boolean | null;
          has_publicar?: boolean | null;
          has_redesign?: boolean | null;
          has_whatsapp?: boolean | null;
          id?: string;
          instagram_nivel?: string;
          limite_campanhas?: number | null;
          limite_flow_business_cadencias?: number;
          limite_flow_business_contas?: number;
          limite_flow_business_crm?: number;
          limite_flow_business_fluxos?: number;
          limite_instagram_audiencia?: number;
          limite_instagram_cacadas?: number;
          limite_instagram_concorrentes?: number;
          limite_instagram_cruzamentos?: number;
          limite_instagram_enriquecimentos?: number;
          limite_instagram_leads?: number;
          limite_instagram_marcas?: number;
          limite_leads?: number | null;
          limite_mensagens?: number | null;
          limite_segmentos?: number | null;
          limite_sites?: number | null;
          limite_templates?: number | null;
          limite_whatsapp?: number | null;
          monitoramento_instagram?: string;
          nome?: string;
          ordem?: number;
          periodo?: string;
          preco?: number;
          teto_instagram_usd?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          acesso_liberado: boolean;
          avatar_url: string | null;
          company_name: string | null;
          created_at: string;
          email: string;
          emails_sent_monthly: number;
          full_name: string | null;
          id: string;
          integration_limit: number;
          integrations_connected: number;
          is_super_admin: boolean;
          leads_used_monthly: number;
          monthly_email_limit: number;
          monthly_lead_limit: number;
          phone: string | null;
          plan: string;
          plan_status: string;
          reply_to_email: string | null;
          site_credito: string | null;
          trial_ends_at: string | null;
          updated_at: string;
        };
        Insert: {
          acesso_liberado?: boolean;
          avatar_url?: string | null;
          company_name?: string | null;
          created_at?: string;
          email: string;
          emails_sent_monthly?: number;
          full_name?: string | null;
          id: string;
          integration_limit?: number;
          integrations_connected?: number;
          is_super_admin?: boolean;
          leads_used_monthly?: number;
          monthly_email_limit?: number;
          monthly_lead_limit?: number;
          phone?: string | null;
          plan?: string;
          plan_status?: string;
          reply_to_email?: string | null;
          site_credito?: string | null;
          trial_ends_at?: string | null;
          updated_at?: string;
        };
        Update: {
          acesso_liberado?: boolean;
          avatar_url?: string | null;
          company_name?: string | null;
          created_at?: string;
          email?: string;
          emails_sent_monthly?: number;
          full_name?: string | null;
          id?: string;
          integration_limit?: number;
          integrations_connected?: number;
          is_super_admin?: boolean;
          leads_used_monthly?: number;
          monthly_email_limit?: number;
          monthly_lead_limit?: number;
          phone?: string | null;
          plan?: string;
          plan_status?: string;
          reply_to_email?: string | null;
          site_credito?: string | null;
          trial_ends_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      propostas: {
        Row: {
          aberta_em: string | null;
          aprovada_em: string | null;
          assunto: string;
          bounced_at: string | null;
          campanha_id: string | null;
          clicada_em: string | null;
          corpo: string;
          criada_em: string;
          email_message_id: string | null;
          email_para: string | null;
          enviada_em: string | null;
          follow_up_count: number;
          follow_up_enviado_em: string | null;
          follow_up_message_id: string | null;
          id: string;
          lead_id: string;
          org_id: string | null;
          respondida_em: string | null;
          site_id: string | null;
          status: string;
          user_id: string;
          valor: number | null;
        };
        Insert: {
          aberta_em?: string | null;
          aprovada_em?: string | null;
          assunto: string;
          bounced_at?: string | null;
          campanha_id?: string | null;
          clicada_em?: string | null;
          corpo: string;
          criada_em?: string;
          email_message_id?: string | null;
          email_para?: string | null;
          enviada_em?: string | null;
          follow_up_count?: number;
          follow_up_enviado_em?: string | null;
          follow_up_message_id?: string | null;
          id?: string;
          lead_id: string;
          org_id?: string | null;
          respondida_em?: string | null;
          site_id?: string | null;
          status?: string;
          user_id: string;
          valor?: number | null;
        };
        Update: {
          aberta_em?: string | null;
          aprovada_em?: string | null;
          assunto?: string;
          bounced_at?: string | null;
          campanha_id?: string | null;
          clicada_em?: string | null;
          corpo?: string;
          criada_em?: string;
          email_message_id?: string | null;
          email_para?: string | null;
          enviada_em?: string | null;
          follow_up_count?: number;
          follow_up_enviado_em?: string | null;
          follow_up_message_id?: string | null;
          id?: string;
          lead_id?: string;
          org_id?: string | null;
          respondida_em?: string | null;
          site_id?: string | null;
          status?: string;
          user_id?: string;
          valor?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "propostas_campanha_id_fkey";
            columns: ["campanha_id"];
            isOneToOne: false;
            referencedRelation: "campanhas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "propostas_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "propostas_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "propostas_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites_publicados";
            referencedColumns: ["id"];
          },
        ];
      };
      redes_buscas: {
        Row: {
          apify_chave_id: string | null;
          apify_dataset_id: string | null;
          apify_run_id: string | null;
          cache_key: string | null;
          candidatos_solicitados: number | null;
          chave_apelido: string | null;
          concluida_em: string | null;
          consultas: Json;
          criado_em: string;
          custo_usd: number;
          detalhe: string | null;
          encontrados: number;
          estrategia: string;
          fonte: string;
          id: string;
          inseridos: number;
          limite: number;
          mes_ref: string;
          meta_qualificados: number | null;
          motivo_parada: string | null;
          org_id: string | null;
          pedido: Json;
          request_id: string | null;
          resultado: Json | null;
          status: string;
          user_id: string;
        };
        Insert: {
          apify_chave_id?: string | null;
          apify_dataset_id?: string | null;
          apify_run_id?: string | null;
          cache_key?: string | null;
          candidatos_solicitados?: number | null;
          chave_apelido?: string | null;
          concluida_em?: string | null;
          consultas?: Json;
          criado_em?: string;
          custo_usd?: number;
          detalhe?: string | null;
          encontrados?: number;
          estrategia: string;
          fonte: string;
          id?: string;
          inseridos?: number;
          limite?: number;
          mes_ref: string;
          meta_qualificados?: number | null;
          motivo_parada?: string | null;
          org_id?: string | null;
          pedido?: Json;
          request_id?: string | null;
          resultado?: Json | null;
          status?: string;
          user_id: string;
        };
        Update: {
          apify_chave_id?: string | null;
          apify_dataset_id?: string | null;
          apify_run_id?: string | null;
          cache_key?: string | null;
          candidatos_solicitados?: number | null;
          chave_apelido?: string | null;
          concluida_em?: string | null;
          consultas?: Json;
          criado_em?: string;
          custo_usd?: number;
          detalhe?: string | null;
          encontrados?: number;
          estrategia?: string;
          fonte?: string;
          id?: string;
          inseridos?: number;
          limite?: number;
          mes_ref?: string;
          meta_qualificados?: number | null;
          motivo_parada?: string | null;
          org_id?: string | null;
          pedido?: Json;
          request_id?: string | null;
          resultado?: Json | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "redes_buscas_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      redesigns: {
        Row: {
          criado_em: string;
          custo_usd: number | null;
          expira_em: string | null;
          gerado_em: string | null;
          html_editado: string | null;
          html_gerado: string | null;
          id: string;
          lead_id: string;
          modelo: string | null;
          observacoes: string | null;
          org_id: string | null;
          site_original_url: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          criado_em?: string;
          custo_usd?: number | null;
          expira_em?: string | null;
          gerado_em?: string | null;
          html_editado?: string | null;
          html_gerado?: string | null;
          id?: string;
          lead_id: string;
          modelo?: string | null;
          observacoes?: string | null;
          org_id?: string | null;
          site_original_url?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          criado_em?: string;
          custo_usd?: number | null;
          expira_em?: string | null;
          gerado_em?: string | null;
          html_editado?: string | null;
          html_gerado?: string | null;
          id?: string;
          lead_id?: string;
          modelo?: string | null;
          observacoes?: string | null;
          org_id?: string | null;
          site_original_url?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "redesigns_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "redesigns_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      sdr_sugestoes: {
        Row: {
          alertas: Json;
          criado_em: string;
          custo_usd: number;
          decidido_em: string | null;
          dia_ref: string;
          estado: string;
          id: string;
          lead_id: string | null;
          mensagem_id: string | null;
          mes_ref: string;
          numero: string;
          org_id: string | null;
          texto: string;
          user_id: string;
        };
        Insert: {
          alertas?: Json;
          criado_em?: string;
          custo_usd?: number;
          decidido_em?: string | null;
          dia_ref: string;
          estado?: string;
          id?: string;
          lead_id?: string | null;
          mensagem_id?: string | null;
          mes_ref: string;
          numero: string;
          org_id?: string | null;
          texto: string;
          user_id: string;
        };
        Update: {
          alertas?: Json;
          criado_em?: string;
          custo_usd?: number;
          decidido_em?: string | null;
          dia_ref?: string;
          estado?: string;
          id?: string;
          lead_id?: string | null;
          mensagem_id?: string | null;
          mes_ref?: string;
          numero?: string;
          org_id?: string | null;
          texto?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sdr_sugestoes_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sdr_sugestoes_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      sequence_steps: {
        Row: {
          body: string;
          created_at: string;
          delay_days: number;
          id: string;
          sequence_id: string;
          step_order: number;
          subject: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          delay_days?: number;
          id?: string;
          sequence_id: string;
          step_order: number;
          subject: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          delay_days?: number;
          id?: string;
          sequence_id?: string;
          step_order?: number;
          subject?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sequence_steps_sequence_id_fkey";
            columns: ["sequence_id"];
            isOneToOne: false;
            referencedRelation: "sequences";
            referencedColumns: ["id"];
          },
        ];
      };
      sequences: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          org_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          org_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          org_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sequences_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      site_conteudo: {
        Row: {
          atualizado_em: string;
          cta_final_botao: string | null;
          cta_final_subtitulo: string | null;
          cta_final_titulo: string | null;
          features_subtitulo: string | null;
          features_titulo: string | null;
          footer_texto: string | null;
          hero_badge: string | null;
          hero_cta_primario: string | null;
          hero_cta_secundario: string | null;
          hero_disclaimer: string | null;
          hero_subtitulo: string | null;
          hero_titulo: string | null;
          hero_titulo_destaque: string | null;
          id: boolean;
          planos_json: Json | null;
        };
        Insert: {
          atualizado_em?: string;
          cta_final_botao?: string | null;
          cta_final_subtitulo?: string | null;
          cta_final_titulo?: string | null;
          features_subtitulo?: string | null;
          features_titulo?: string | null;
          footer_texto?: string | null;
          hero_badge?: string | null;
          hero_cta_primario?: string | null;
          hero_cta_secundario?: string | null;
          hero_disclaimer?: string | null;
          hero_subtitulo?: string | null;
          hero_titulo?: string | null;
          hero_titulo_destaque?: string | null;
          id?: boolean;
          planos_json?: Json | null;
        };
        Update: {
          atualizado_em?: string;
          cta_final_botao?: string | null;
          cta_final_subtitulo?: string | null;
          cta_final_titulo?: string | null;
          features_subtitulo?: string | null;
          features_titulo?: string | null;
          footer_texto?: string | null;
          hero_badge?: string | null;
          hero_cta_primario?: string | null;
          hero_cta_secundario?: string | null;
          hero_disclaimer?: string | null;
          hero_subtitulo?: string | null;
          hero_titulo?: string | null;
          hero_titulo_destaque?: string | null;
          id?: boolean;
          planos_json?: Json | null;
        };
        Relationships: [];
      };
      sites_publicados: {
        Row: {
          arquivos_removidos: boolean;
          expira_em: string;
          id: string;
          lead_id: string;
          org_id: string | null;
          publicado_em: string;
          redesign_id: string;
          slug: string;
          status: string;
          url_publica: string;
          user_id: string;
        };
        Insert: {
          arquivos_removidos?: boolean;
          expira_em?: string;
          id?: string;
          lead_id: string;
          org_id?: string | null;
          publicado_em?: string;
          redesign_id: string;
          slug: string;
          status?: string;
          url_publica: string;
          user_id: string;
        };
        Update: {
          arquivos_removidos?: boolean;
          expira_em?: string;
          id?: string;
          lead_id?: string;
          org_id?: string | null;
          publicado_em?: string;
          redesign_id?: string;
          slug?: string;
          status?: string;
          url_publica?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sites_publicados_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sites_publicados_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sites_publicados_redesign_id_fkey";
            columns: ["redesign_id"];
            isOneToOne: false;
            referencedRelation: "redesigns";
            referencedColumns: ["id"];
          },
        ];
      };
      ticket_respostas: {
        Row: {
          autor_user_id: string;
          criado_em: string;
          eh_admin: boolean;
          id: string;
          texto: string;
          ticket_id: string;
        };
        Insert: {
          autor_user_id: string;
          criado_em?: string;
          eh_admin?: boolean;
          id?: string;
          texto: string;
          ticket_id: string;
        };
        Update: {
          autor_user_id?: string;
          criado_em?: string;
          eh_admin?: boolean;
          id?: string;
          texto?: string;
          ticket_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_respostas_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      tickets: {
        Row: {
          assunto: string;
          atualizado_em: string;
          autor_user_id: string;
          criado_em: string;
          id: string;
          mensagem: string;
          org_id: string | null;
          prioridade: Database["public"]["Enums"]["ticket_prioridade"];
          status: Database["public"]["Enums"]["ticket_status"];
        };
        Insert: {
          assunto: string;
          atualizado_em?: string;
          autor_user_id: string;
          criado_em?: string;
          id?: string;
          mensagem: string;
          org_id?: string | null;
          prioridade?: Database["public"]["Enums"]["ticket_prioridade"];
          status?: Database["public"]["Enums"]["ticket_status"];
        };
        Update: {
          assunto?: string;
          atualizado_em?: string;
          autor_user_id?: string;
          criado_em?: string;
          id?: string;
          mensagem?: string;
          org_id?: string | null;
          prioridade?: Database["public"]["Enums"]["ticket_prioridade"];
          status?: Database["public"]["Enums"]["ticket_status"];
        };
        Relationships: [
          {
            foreignKeyName: "tickets_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      wa_alertas: {
        Row: {
          criado_em: string;
          id: string;
          lido: boolean;
          mensagem: string;
          org_id: string | null;
          tipo: string;
          user_id: string;
        };
        Insert: {
          criado_em?: string;
          id?: string;
          lido?: boolean;
          mensagem: string;
          org_id?: string | null;
          tipo: string;
          user_id?: string;
        };
        Update: {
          criado_em?: string;
          id?: string;
          lido?: boolean;
          mensagem?: string;
          org_id?: string | null;
          tipo?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wa_alertas_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      wa_envios: {
        Row: {
          campanha_id: string | null;
          enviado_em: string;
          id: string;
          instancia_id: string;
          lead_id: string;
          mensagem: string | null;
          org_id: string | null;
          user_id: string;
          variacao_id: string | null;
        };
        Insert: {
          campanha_id?: string | null;
          enviado_em?: string;
          id?: string;
          instancia_id: string;
          lead_id: string;
          mensagem?: string | null;
          org_id?: string | null;
          user_id?: string;
          variacao_id?: string | null;
        };
        Update: {
          campanha_id?: string | null;
          enviado_em?: string;
          id?: string;
          instancia_id?: string;
          lead_id?: string;
          mensagem?: string | null;
          org_id?: string | null;
          user_id?: string;
          variacao_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wa_envios_instancia_id_fkey";
            columns: ["instancia_id"];
            isOneToOne: false;
            referencedRelation: "wa_instancias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wa_envios_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wa_envios_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      wa_instancia_tokens: {
        Row: {
          atualizado_em: string;
          instancia_id: string;
          token: string;
        };
        Insert: {
          atualizado_em?: string;
          instancia_id: string;
          token: string;
        };
        Update: {
          atualizado_em?: string;
          instancia_id?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wa_instancia_tokens_instancia_id_fkey";
            columns: ["instancia_id"];
            isOneToOne: true;
            referencedRelation: "wa_instancias";
            referencedColumns: ["id"];
          },
        ];
      };
      wa_instancias: {
        Row: {
          atualizado_em: string;
          criada_em: string;
          falhas_login: number;
          funcao: string;
          id: string;
          nome: string;
          numero: string | null;
          ordem: number;
          org_id: string | null;
          status: string;
          ultima_checagem_em: string | null;
          user_id: string;
        };
        Insert: {
          atualizado_em?: string;
          criada_em?: string;
          falhas_login?: number;
          funcao?: string;
          id?: string;
          nome: string;
          numero?: string | null;
          ordem?: number;
          org_id?: string | null;
          status?: string;
          ultima_checagem_em?: string | null;
          user_id: string;
        };
        Update: {
          atualizado_em?: string;
          criada_em?: string;
          falhas_login?: number;
          funcao?: string;
          id?: string;
          nome?: string;
          numero?: string | null;
          ordem?: number;
          org_id?: string | null;
          status?: string;
          ultima_checagem_em?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wa_instancias_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      wa_mensagens: {
        Row: {
          criado_em: string;
          direcao: string;
          externo_id: string | null;
          id: string;
          instancia_id: string | null;
          lead_id: string | null;
          lida: boolean;
          media_url: string | null;
          nome_contato: string | null;
          numero: string;
          org_id: string | null;
          texto: string | null;
          tipo: string;
          user_id: string;
        };
        Insert: {
          criado_em?: string;
          direcao: string;
          externo_id?: string | null;
          id?: string;
          instancia_id?: string | null;
          lead_id?: string | null;
          lida?: boolean;
          media_url?: string | null;
          nome_contato?: string | null;
          numero: string;
          org_id?: string | null;
          texto?: string | null;
          tipo?: string;
          user_id?: string;
        };
        Update: {
          criado_em?: string;
          direcao?: string;
          externo_id?: string | null;
          id?: string;
          instancia_id?: string | null;
          lead_id?: string | null;
          lida?: boolean;
          media_url?: string | null;
          nome_contato?: string | null;
          numero?: string;
          org_id?: string | null;
          texto?: string | null;
          tipo?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wa_mensagens_instancia_id_fkey";
            columns: ["instancia_id"];
            isOneToOne: false;
            referencedRelation: "wa_instancias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wa_mensagens_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wa_mensagens_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      wa_scripts: {
        Row: {
          criado_em: string;
          id: string;
          media_url: string | null;
          mensagem: string | null;
          nome: string;
          org_id: string | null;
          tipo: string;
          user_id: string;
        };
        Insert: {
          criado_em?: string;
          id?: string;
          media_url?: string | null;
          mensagem?: string | null;
          nome: string;
          org_id?: string | null;
          tipo?: string;
          user_id?: string;
        };
        Update: {
          criado_em?: string;
          id?: string;
          media_url?: string | null;
          mensagem?: string | null;
          nome?: string;
          org_id?: string | null;
          tipo?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wa_scripts_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      _col_consumo: { Args: { p_recurso: string }; Returns: string };
      _col_limite: { Args: { p_recurso: string }; Returns: string };
      acesso_ferramenta_liberado: { Args: never; Returns: boolean };
      admin_api_lead_counts: {
        Args: { p_since: string };
        Returns: {
          apify_leads_period: number;
          leads_month: number;
          leads_period: number;
          user_id: string;
        }[];
      };
      admin_delete_pending_users: {
        Args: { p_actor_id: string; p_user_ids: string[] };
        Returns: Json;
      };
      admin_set_org_leads_override: {
        Args: { p_leads: number; p_user: string };
        Returns: Json;
      };
      admin_set_org_sites_bonus: {
        Args: { p_bonus: number; p_user: string };
        Returns: Json;
      };
      admin_set_org_sites_override: {
        Args: { p_sites: number; p_user: string };
        Returns: Json;
      };
      admin_set_user_plan:
        | { Args: { p_plan: string; p_user: string }; Returns: Json }
        | {
            Args: { p_plan?: string; p_plano_id?: string; p_user: string };
            Returns: Json;
          };
      canonical_lead_niche_key: { Args: { p_value: string }; Returns: string };
      claim_apify_search_cache: {
        Args: { p_query_key: string; p_target_depth: number };
        Returns: Json;
      };
      claim_apify_search_cache_v2: {
        Args: {
          p_query_key: string;
          p_target_depth: number;
          p_ttl_hours?: number;
        };
        Returns: Json;
      };
      claim_apify_search_cache_v3: {
        Args: {
          p_query_key: string;
          p_target_depth: number;
          p_ttl_hours?: number;
        };
        Returns: Json;
      };
      consumir_ou_bloquear: {
        Args: { p_n?: number; p_org: string; p_recurso: string };
        Returns: Json;
      };
      eh_super_admin: { Args: never; Returns: boolean };
      email_rampa_status: {
        Args: { p_user_id?: string };
        Returns: {
          ativa: boolean;
          dia: number;
          enviados_hoje: number;
          restante: number;
          teto: number;
        }[];
      };
      estado_consumo: {
        Args: { p_org: string; p_recurso: string };
        Returns: Json;
      };
      flow_business_add_lead_to_crm: {
        Args: { p_lead_id: string };
        Returns: string;
      };
      flow_business_complete_task: {
        Args: { p_outcome?: string; p_task_id: string };
        Returns: Json;
      };
      flow_business_automation_snapshot: { Args: never; Returns: Json };
      flow_business_create_cadence: {
        Args: { p_description: string; p_name: string; p_steps: Json };
        Returns: string;
      };
      flow_business_ingest_meta_event: {
        Args: {
          p_external_contact_id: string;
          p_external_contact_name: string;
          p_external_event_id: string;
          p_message_type?: string;
          p_meta_account_id: string;
          p_metadata?: Json;
          p_occurred_at?: string;
          p_source?: string;
          p_text: string;
          p_window_hours?: number;
        };
        Returns: Json;
      };
      flow_business_ingest_unipile_message: {
        Args: {
          p_account_id: string;
          p_chat_id: string;
          p_direction: string;
          p_external_message_id: string;
          p_metadata?: Json;
          p_occurred_at: string;
          p_sender_id: string;
          p_sender_name: string;
          p_text: string;
        };
        Returns: Json;
      };
      flow_business_move_card: {
        Args: { p_card_id: string; p_reason?: string; p_stage: string };
        Returns: undefined;
      };
      flow_business_plan_snapshot: { Args: { p_org: string }; Returns: Json };
      flow_business_publish_flow: {
        Args: { p_flow_id: string };
        Returns: undefined;
      };
      flow_business_set_session_automation: {
        Args: { p_enabled: boolean; p_instance_id: string };
        Returns: Json;
      };
      flow_business_save_flow: {
        Args: {
          p_account_id: string;
          p_description: string;
          p_flow_id: string;
          p_name: string;
          p_nodes: Json;
          p_trigger_config: Json;
          p_trigger_type: string;
        };
        Returns: string;
      };
      flow_business_save_flow_draft: {
        Args: {
          p_account_id: string;
          p_description: string;
          p_flow_id: string;
          p_name: string;
          p_nodes: Json;
          p_trigger_config: Json;
          p_trigger_type: string;
        };
        Returns: string;
      };
      flow_business_start_cadence: {
        Args: { p_cadence_id: string; p_card_id: string };
        Returns: string;
      };
      flow_business_workspace_snapshot: {
        Args: { p_card_limit?: number };
        Returns: Json;
      };
      instagram_dashboard_advanced_v1: {
        Args: { p_days?: number };
        Returns: Json;
      };
      instagram_dashboard_v1: { Args: { p_days?: number }; Returns: Json };
      instagram_finalize_usage: {
        Args: {
          p_audience_profiles?: number;
          p_brands?: number;
          p_competitors?: number;
          p_cost_usd?: number;
          p_enrichments?: number;
          p_hunts?: number;
          p_leads?: number;
          p_org: string;
          p_overlaps?: number;
          p_request_id: string;
          p_status: string;
        };
        Returns: Json;
      };
      instagram_plan_status: { Args: { p_org: string }; Returns: Json };
      instagram_release_competitor: {
        Args: { p_org: string };
        Returns: undefined;
      };
      instagram_reserve_usage: {
        Args: {
          p_action: string;
          p_audience_profiles?: number;
          p_brands?: number;
          p_competitors?: number;
          p_cost_usd?: number;
          p_enrichments?: number;
          p_hunts?: number;
          p_leads?: number;
          p_org: string;
          p_overlaps?: number;
          p_request_id: string;
          p_user: string;
        };
        Returns: Json;
      };
      is_authentic_email: { Args: { p_email: string }; Returns: boolean };
      lead_business_identity: {
        Args: { p_address: string; p_name: string };
        Returns: string;
      };
      limite_plano: {
        Args: { p_org: string; p_recurso: string };
        Returns: number;
      };
      meu_estado_consumo: { Args: { p_recurso: string }; Returns: Json };
      normalize_lead_identity_part: {
        Args: { p_value: string };
        Returns: string;
      };
      normalize_search_term: { Args: { p_value: string }; Returns: string };
      org_do_usuario: { Args: { p_user: string }; Returns: string };
      papel_do_usuario: { Args: { p_org: string }; Returns: string };
      pertence_a_org: { Args: { p_org: string }; Returns: boolean };
      plano_id_por_slug: { Args: { p_plan: string }; Returns: string };
      pode_ver_lead: {
        Args: { p_assigned: string; p_org: string };
        Returns: boolean;
      };
      pode_ver_ticket: {
        Args: { p_autor: string; p_org: string };
        Returns: boolean;
      };
      registrar_contato_manual: {
        Args: {
          p_anotacao: string;
          p_canal: string;
          p_contatado_em: string;
          p_lead_id: string;
        };
        Returns: string;
      };
      release_apify_search_cache: {
        Args: { p_query_key: string };
        Returns: undefined;
      };
      search_shared_lead_catalog: {
        Args: {
          p_city: string;
          p_lat: number;
          p_limit: number;
          p_lng: number;
          p_max_age_days?: number;
          p_niche: string;
          p_org_id: string;
          p_radius_km: number;
          p_state: string;
          p_use_map: boolean;
        };
        Returns: {
          address: string;
          category: string;
          facebook: string;
          instagram: string;
          lat: number;
          lng: number;
          name: string;
          phone: string;
          rating: number;
          review_count: number;
          source: string;
          source_id: string;
          website: string;
        }[];
      };
      store_apify_search_cache: {
        Args: { p_items: Json; p_query_key: string; p_searched_depth: number };
        Returns: undefined;
      };
      store_apify_search_cache_v3: {
        Args: { p_items: Json; p_query_key: string; p_requested_depth: number };
        Returns: undefined;
      };
      store_shared_lead_catalog: {
        Args: {
          p_area_kind: string;
          p_center_lat: number;
          p_center_lng: number;
          p_city: string;
          p_items: Json;
          p_niche: string;
          p_query_key: string;
          p_radius_km: number;
          p_state: string;
        };
        Returns: number;
      };
    };
    Enums: {
      papel_org: "super_admin" | "admin" | "gerente" | "vendedor" | "sdr" | "suporte";
      ticket_prioridade: "baixa" | "media" | "alta";
      ticket_status: "aberto" | "em_andamento" | "resolvido" | "fechado";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      papel_org: ["super_admin", "admin", "gerente", "vendedor", "sdr", "suporte"],
      ticket_prioridade: ["baixa", "media", "alta"],
      ticket_status: ["aberto", "em_andamento", "resolvido", "fechado"],
    },
  },
} as const;
