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
      leads: {
        Row: {
          id: string
          list_id: string | null
          user_id: string
          place_id: string | null
          business_name: string
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          phone: string | null
          whatsapp: string | null
          website: string | null
          category: string | null
          rating: number | null
          review_count: number | null
          has_website: boolean | null
          has_photos: boolean | null
          has_hours: boolean | null
          has_phone: boolean | null
          email: string | null
          facebook_url: string | null
          instagram_url: string | null
          linkedin_url: string | null
          owner_name: string | null
          score: number
          score_breakdown: Json | null
          status: string
          last_contacted_at: string | null
          enriched_at: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id?: string | null
          user_id: string
          place_id?: string | null
          business_name: string
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          phone?: string | null
          whatsapp?: string | null
          website?: string | null
          category?: string | null
          rating?: number | null
          review_count?: number | null
          has_website?: boolean | null
          has_photos?: boolean | null
          has_hours?: boolean | null
          has_phone?: boolean | null
          email?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          owner_name?: string | null
          score?: number
          score_breakdown?: Json | null
          status?: string
          last_contacted_at?: string | null
          enriched_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string | null
          user_id?: string
          place_id?: string | null
          business_name?: string
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          phone?: string | null
          whatsapp?: string | null
          website?: string | null
          category?: string | null
          rating?: number | null
          review_count?: number | null
          has_website?: boolean | null
          has_photos?: boolean | null
          has_hours?: boolean | null
          has_phone?: boolean | null
          email?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          owner_name?: string | null
          score?: number
          score_breakdown?: Json | null
          status?: string
          last_contacted_at?: string | null
          enriched_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          city: string
          niche: string
          radius: number
          total_leads: number
          enriched_count: number
          contacted_count: number
          created_at: string
          uf: string | null
          fonte: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          city: string
          niche: string
          radius?: number
          total_leads?: number
          enriched_count?: number
          contacted_count?: number
          created_at?: string
          uf?: string | null
          fonte?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          city?: string
          niche?: string
          radius?: number
          total_leads?: number
          enriched_count?: number
          contacted_count?: number
          created_at?: string
          uf?: string | null
          fonte?: string | null
        }
        Relationships: []
      }
      redesigns: {
        Row: {
          id: string
          user_id: string
          lead_id: string
          site_original_url: string | null
          html_gerado: string | null
          html_editado: string | null
          status: string
          modelo: string | null
          custo_usd: number | null
          observacoes: string | null
          criado_em: string
          gerado_em: string | null
          updated_at: string
          expira_em: string | null
        }
        Insert: {
          id?: string
          user_id: string
          lead_id: string
          site_original_url?: string | null
          html_gerado?: string | null
          html_editado?: string | null
          status?: string
          modelo?: string | null
          custo_usd?: number | null
          observacoes?: string | null
          criado_em?: string
          gerado_em?: string | null
          updated_at?: string
          expira_em?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          lead_id?: string
          site_original_url?: string | null
          html_gerado?: string | null
          html_editado?: string | null
          status?: string
          modelo?: string | null
          custo_usd?: number | null
          observacoes?: string | null
          criado_em?: string
          gerado_em?: string | null
          updated_at?: string
          expira_em?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
