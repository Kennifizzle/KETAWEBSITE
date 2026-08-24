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
          actor: string | null
          created_at: string
          event: string
          id: string
          level: string
          message: string | null
          meta: Json
          reference: string | null
        }
        Insert: {
          actor?: string | null
          created_at?: string
          event: string
          id?: string
          level?: string
          message?: string | null
          meta?: Json
          reference?: string | null
        }
        Update: {
          actor?: string | null
          created_at?: string
          event?: string
          id?: string
          level?: string
          message?: string | null
          meta?: Json
          reference?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount: number
          amount_currency: string
          asset: string
          bank_name: string | null
          bvn: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          kind: Database["public"]["Enums"]["order_kind"]
          network: string | null
          note: string | null
          paid_at: string | null
          payment_expires_at: string | null
          payment_provider: string | null
          payment_provider_ref: string | null
          payment_status: string
          phone: string | null
          reference: string
          side: Database["public"]["Enums"]["order_side"]
          status: string
          updated_at: string
          usd_amount: number | null
          usd_rate: number | null
          verification_provider: string | null
          verification_ref: string | null
          verification_required: boolean
          verification_status: string
          verification_url: string | null
          verified_at: string | null
          virtual_account_bank: string | null
          virtual_account_name: string | null
          virtual_account_number: string | null
          wallet_address: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount: number
          amount_currency?: string
          asset: string
          bank_name?: string | null
          bvn?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          kind?: Database["public"]["Enums"]["order_kind"]
          network?: string | null
          note?: string | null
          paid_at?: string | null
          payment_expires_at?: string | null
          payment_provider?: string | null
          payment_provider_ref?: string | null
          payment_status?: string
          phone?: string | null
          reference?: string
          side: Database["public"]["Enums"]["order_side"]
          status?: string
          updated_at?: string
          usd_amount?: number | null
          usd_rate?: number | null
          verification_provider?: string | null
          verification_ref?: string | null
          verification_required?: boolean
          verification_status?: string
          verification_url?: string | null
          verified_at?: string | null
          virtual_account_bank?: string | null
          virtual_account_name?: string | null
          virtual_account_number?: string | null
          wallet_address?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount?: number
          amount_currency?: string
          asset?: string
          bank_name?: string | null
          bvn?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          kind?: Database["public"]["Enums"]["order_kind"]
          network?: string | null
          note?: string | null
          paid_at?: string | null
          payment_expires_at?: string | null
          payment_provider?: string | null
          payment_provider_ref?: string | null
          payment_status?: string
          phone?: string | null
          reference?: string
          side?: Database["public"]["Enums"]["order_side"]
          status?: string
          updated_at?: string
          usd_amount?: number | null
          usd_rate?: number | null
          verification_provider?: string | null
          verification_ref?: string | null
          verification_required?: boolean
          verification_status?: string
          verification_url?: string | null
          verified_at?: string | null
          virtual_account_bank?: string | null
          virtual_account_name?: string | null
          virtual_account_number?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      rate_settings: {
        Row: {
          buy_spread: number
          created_at: string
          id: string
          manual_prices: Json
          manual_usd_ngn: number | null
          scope: string
          sell_spread: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          buy_spread?: number
          created_at?: string
          id?: string
          manual_prices?: Json
          manual_usd_ngn?: number | null
          scope: string
          sell_spread?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          buy_spread?: number
          created_at?: string
          id?: string
          manual_prices?: Json
          manual_usd_ngn?: number | null
          scope?: string
          sell_spread?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          country: string | null
          created_at: string
          email: string
          id: string
          kind: Database["public"]["Enums"]["waitlist_kind"]
          name: string
          note: string | null
          phone: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          id?: string
          kind?: Database["public"]["Enums"]["waitlist_kind"]
          name: string
          note?: string | null
          phone?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          kind?: Database["public"]["Enums"]["waitlist_kind"]
          name?: string
          note?: string | null
          phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff"
      order_kind: "crypto" | "giftcard"
      order_side: "buy" | "sell"
      waitlist_kind: "trader" | "vendor"
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
      app_role: ["admin", "staff"],
      order_kind: ["crypto", "giftcard"],
      order_side: ["buy", "sell"],
      waitlist_kind: ["trader", "vendor"],
    },
  },
} as const
