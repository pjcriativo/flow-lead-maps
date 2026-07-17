export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          list_id: string | null;
          user_id: string;
          place_id: string | null;
          business_name: string;
          address: string | null;
          bairro: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          phone: string | null;
          whatsapp: string | null;
          website: string | null;
          category: string | null;
          rating: number | null;
          review_count: number | null;
          has_website: boolean | null;
          has_photos: boolean | null;
          has_hours: boolean | null;
          has_phone: boolean | null;
          email: string | null;
          facebook_url: string | null;
          instagram_url: string | null;
          linkedin_url: string | null;
          owner_name: string | null;
          score: number;
          score_breakdown: Json | null;
          status: string;
          last_contacted_at: string | null;
          enriched_at: string | null;
          latitude: number | null;
          longitude: number | null;
          notes: string | null;
          motivo_perda: string | null;
          motivo_perda_nota: string | null;
          perda_em: string | null;
          created_at: string;
          updated_at: string;
          email_opt_out: boolean;
          email_opt_out_em: string | null;
          opt_out_token: string | null;
          sem_contato: boolean;
        };
        Insert: {
          id?: string;
          list_id?: string | null;
          user_id: string;
          place_id?: string | null;
          business_name: string;
          address?: string | null;
          bairro?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          website?: string | null;
          category?: string | null;
          rating?: number | null;
          review_count?: number | null;
          has_website?: boolean | null;
          has_photos?: boolean | null;
          has_hours?: boolean | null;
          has_phone?: boolean | null;
          email?: string | null;
          facebook_url?: string | null;
          instagram_url?: string | null;
          linkedin_url?: string | null;
          owner_name?: string | null;
          score?: number;
          score_breakdown?: Json | null;
          status?: string;
          last_contacted_at?: string | null;
          enriched_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          notes?: string | null;
          motivo_perda?: string | null;
          motivo_perda_nota?: string | null;
          perda_em?: string | null;
          created_at?: string;
          updated_at?: string;
          email_opt_out?: boolean;
          email_opt_out_em?: string | null;
          opt_out_token?: string | null;
          sem_contato?: boolean;
        };
        Update: {
          id?: string;
          list_id?: string | null;
          user_id?: string;
          place_id?: string | null;
          business_name?: string;
          address?: string | null;
          bairro?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          website?: string | null;
          category?: string | null;
          rating?: number | null;
          review_count?: number | null;
          has_website?: boolean | null;
          has_photos?: boolean | null;
          has_hours?: boolean | null;
          has_phone?: boolean | null;
          email?: string | null;
          facebook_url?: string | null;
          instagram_url?: string | null;
          linkedin_url?: string | null;
          owner_name?: string | null;
          score?: number;
          score_breakdown?: Json | null;
          status?: string;
          last_contacted_at?: string | null;
          enriched_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          notes?: string | null;
          motivo_perda?: string | null;
          motivo_perda_nota?: string | null;
          perda_em?: string | null;
          created_at?: string;
          updated_at?: string;
          email_opt_out?: boolean;
          email_opt_out_em?: string | null;
          opt_out_token?: string | null;
          sem_contato?: boolean;
        };
        Relationships: [];
      };
      automacao_receitas: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          ativa: boolean;
          nicho: string;
          cidade: string;
          uf: string | null;
          fonte: string;
          score_minimo: number;
          exigir_contato: boolean;
          canal: string;
          wa_config: Json | null;
          leads_por_rodada: number;
          frequencia: string;
          max_leads_rodada: number;
          max_leads_mes: number;
          max_usd_rodada: number;
          max_usd_mes: number;
          custo_lead_usd: number;
          mes_ref: string | null;
          leads_mes: number;
          gasto_mes_usd: number;
          ultima_rodada_em: string | null;
          criada_em: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          nome: string;
          ativa?: boolean;
          nicho: string;
          cidade: string;
          uf?: string | null;
          fonte?: string;
          score_minimo?: number;
          exigir_contato?: boolean;
          canal?: string;
          wa_config?: Json | null;
          leads_por_rodada?: number;
          frequencia?: string;
          max_leads_rodada?: number;
          max_leads_mes?: number;
          max_usd_rodada?: number;
          max_usd_mes?: number;
          custo_lead_usd?: number;
          mes_ref?: string | null;
          leads_mes?: number;
          gasto_mes_usd?: number;
          ultima_rodada_em?: string | null;
          criada_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["automacao_receitas"]["Insert"]>;
        Relationships: [];
      };
      automacao_rodadas: {
        Row: {
          id: string;
          user_id: string;
          receita_id: string;
          iniciada_em: string;
          concluida_em: string | null;
          leads_buscados: number;
          leads_qualificados: number;
          leads_descartados: number;
          leads_preparados: number;
          custo_usd: number;
          campanha_id: string | null;
          status: string;
          detalhe: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          receita_id: string;
          iniciada_em?: string;
          concluida_em?: string | null;
          leads_buscados?: number;
          leads_qualificados?: number;
          leads_descartados?: number;
          leads_preparados?: number;
          custo_usd?: number;
          campanha_id?: string | null;
          status?: string;
          detalhe?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["automacao_rodadas"]["Insert"]>;
        Relationships: [];
      };
      // Só os campos que o app usa. `full_name` = {remetente} que assina os e-mails
      // (ver src/services/perfil.ts). RLS: SELECT/UPDATE do próprio; sem INSERT (a linha
      // nasce do trigger on_auth_user_created) — por isso Insert não é exposto aqui.
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          company_name: string | null;
          /** Reply-To dos e-mails da org — onde a resposta do lead chega. NÃO é o From. */
          reply_to_email: string | null;
          updated_at: string | null;
        };
        Insert: never;
        Update: {
          full_name?: string | null;
          company_name?: string | null;
          reply_to_email?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      lead_lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          city: string;
          niche: string;
          radius: number;
          total_leads: number;
          enriched_count: number;
          contacted_count: number;
          created_at: string;
          uf: string | null;
          fonte: string | null;
          follow_up_ativo: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          city: string;
          niche: string;
          radius?: number;
          total_leads?: number;
          enriched_count?: number;
          contacted_count?: number;
          created_at?: string;
          uf?: string | null;
          fonte?: string | null;
          follow_up_ativo?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          city?: string;
          niche?: string;
          radius?: number;
          total_leads?: number;
          enriched_count?: number;
          contacted_count?: number;
          created_at?: string;
          uf?: string | null;
          fonte?: string | null;
          follow_up_ativo?: boolean;
        };
        Relationships: [];
      };
      redesigns: {
        Row: {
          id: string;
          user_id: string;
          lead_id: string;
          site_original_url: string | null;
          html_gerado: string | null;
          html_editado: string | null;
          status: string;
          modelo: string | null;
          custo_usd: number | null;
          observacoes: string | null;
          criado_em: string;
          gerado_em: string | null;
          updated_at: string;
          expira_em: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          lead_id: string;
          site_original_url?: string | null;
          html_gerado?: string | null;
          html_editado?: string | null;
          status?: string;
          modelo?: string | null;
          custo_usd?: number | null;
          observacoes?: string | null;
          criado_em?: string;
          gerado_em?: string | null;
          updated_at?: string;
          expira_em?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          lead_id?: string;
          site_original_url?: string | null;
          html_gerado?: string | null;
          html_editado?: string | null;
          status?: string;
          modelo?: string | null;
          custo_usd?: number | null;
          observacoes?: string | null;
          criado_em?: string;
          gerado_em?: string | null;
          updated_at?: string;
          expira_em?: string | null;
        };
        Relationships: [];
      };
      wa_alertas: {
        Row: {
          id: string;
          user_id: string;
          tipo: string;
          mensagem: string;
          lido: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          tipo: string;
          mensagem: string;
          lido?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tipo?: string;
          mensagem?: string;
          lido?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
      lead_contatos: {
        Row: {
          id: string;
          user_id: string;
          lead_id: string;
          canal: string;
          anotacao: string | null;
          contatado_em: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          lead_id: string;
          canal: string;
          anotacao?: string | null;
          contatado_em?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lead_id?: string;
          canal?: string;
          anotacao?: string | null;
          contatado_em?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      propostas: {
        Row: {
          id: string;
          user_id: string;
          lead_id: string;
          site_id: string | null;
          assunto: string;
          corpo: string;
          valor: number | null;
          status: string;
          criada_em: string;
          enviada_em: string | null;
          respondida_em: string | null;
          aprovada_em: string | null;
          email_message_id: string | null;
          email_para: string | null;
          follow_up_enviado_em: string | null;
          follow_up_count: number;
          follow_up_message_id: string | null;
          campanha_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          lead_id: string;
          site_id?: string | null;
          assunto: string;
          corpo: string;
          valor?: number | null;
          status?: string;
          criada_em?: string;
          enviada_em?: string | null;
          respondida_em?: string | null;
          aprovada_em?: string | null;
          email_message_id?: string | null;
          email_para?: string | null;
          follow_up_enviado_em?: string | null;
          follow_up_count?: number;
          follow_up_message_id?: string | null;
          campanha_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          lead_id?: string;
          site_id?: string | null;
          assunto?: string;
          corpo?: string;
          valor?: number | null;
          status?: string;
          criada_em?: string;
          enviada_em?: string | null;
          respondida_em?: string | null;
          aprovada_em?: string | null;
          email_message_id?: string | null;
          email_para?: string | null;
          follow_up_enviado_em?: string | null;
          follow_up_count?: number;
          follow_up_message_id?: string | null;
          campanha_id?: string | null;
        };
        Relationships: [];
      };
      campanhas: {
        Row: {
          id: string;
          user_id: string;
          list_id: string | null;
          nome: string;
          status: string;
          criada_em: string;
          canal: string;
          wa_config: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          list_id?: string | null;
          nome: string;
          status?: string;
          criada_em?: string;
          canal?: string;
          wa_config?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          list_id?: string | null;
          nome?: string;
          status?: string;
          criada_em?: string;
          canal?: string;
          wa_config?: Json | null;
        };
        Relationships: [];
      };
      wa_scripts: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          tipo: string;
          mensagem: string | null;
          media_url: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          nome: string;
          tipo?: string;
          mensagem?: string | null;
          media_url?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          tipo?: string;
          mensagem?: string | null;
          media_url?: string | null;
          criado_em?: string;
        };
        Relationships: [];
      };
      wa_mensagens: {
        Row: {
          id: string;
          user_id: string;
          instancia_id: string | null;
          numero: string;
          lead_id: string | null;
          nome_contato: string | null;
          direcao: string;
          tipo: string;
          texto: string | null;
          media_url: string | null;
          externo_id: string | null;
          lida: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          instancia_id?: string | null;
          numero: string;
          lead_id?: string | null;
          nome_contato?: string | null;
          direcao: string;
          tipo?: string;
          texto?: string | null;
          media_url?: string | null;
          externo_id?: string | null;
          lida?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          instancia_id?: string | null;
          numero?: string;
          lead_id?: string | null;
          nome_contato?: string | null;
          direcao?: string;
          tipo?: string;
          texto?: string | null;
          media_url?: string | null;
          externo_id?: string | null;
          lida?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
      wa_envios: {
        Row: {
          id: string;
          user_id: string;
          lead_id: string;
          instancia_id: string;
          campanha_id: string | null;
          enviado_em: string;
          variacao_id: string | null;
          mensagem: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          lead_id: string;
          instancia_id: string;
          campanha_id?: string | null;
          enviado_em?: string;
          variacao_id?: string | null;
          mensagem?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          lead_id?: string;
          instancia_id?: string;
          campanha_id?: string | null;
          enviado_em?: string;
          variacao_id?: string | null;
          mensagem?: string | null;
        };
        Relationships: [];
      };
      campanha_leads: {
        Row: {
          id: string;
          campanha_id: string;
          lead_id: string;
          user_id: string;
          estado: string;
          redesign_id: string | null;
          proposta_id: string | null;
          motivo_descarte: string | null;
          erro: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          campanha_id: string;
          lead_id: string;
          user_id: string;
          estado?: string;
          redesign_id?: string | null;
          proposta_id?: string | null;
          motivo_descarte?: string | null;
          erro?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          campanha_id?: string;
          lead_id?: string;
          user_id?: string;
          estado?: string;
          redesign_id?: string | null;
          proposta_id?: string | null;
          motivo_descarte?: string | null;
          erro?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Relationships: [];
      };
      sites_publicados: {
        Row: {
          id: string;
          user_id: string;
          lead_id: string;
          redesign_id: string;
          slug: string;
          url_publica: string;
          status: string;
          publicado_em: string;
          expira_em: string;
          arquivos_removidos: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          lead_id: string;
          redesign_id: string;
          slug: string;
          url_publica: string;
          status?: string;
          publicado_em?: string;
          expira_em?: string;
          arquivos_removidos?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          lead_id?: string;
          redesign_id?: string;
          slug?: string;
          url_publica?: string;
          status?: string;
          publicado_em?: string;
          expira_em?: string;
          arquivos_removidos?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      email_rampa_status: {
        Args: Record<PropertyKey, never>;
        Returns: {
          ativa: boolean;
          dia: number;
          teto: number;
          enviados_hoje: number;
          restante: number;
        }[];
      };
      registrar_contato_manual: {
        Args: {
          p_lead_id: string;
          p_canal: string;
          p_anotacao: string | null;
          p_contatado_em: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
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
    Enums: {},
  },
} as const;
