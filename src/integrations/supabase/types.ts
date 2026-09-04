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
      api_keys: {
        Row: {
          created_at: string
          id: string
          key: string
          last_used_at: string | null
          name: string
          permissions: string[]
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          last_used_at?: string | null
          name: string
          permissions?: string[]
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[]
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          bucket: string
          count: number
          id: string
          window_start: string
        }
        Insert: {
          bucket: string
          count?: number
          id?: string
          window_start: string
        }
        Update: {
          bucket?: string
          count?: number
          id?: string
          window_start?: string
        }
        Relationships: []
      }
      auth_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          purpose: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          purpose: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          purpose?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          coin: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          due_date: string | null
          id: string
          number: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          coin?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          due_date?: string | null
          id?: string
          number: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          coin?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          due_date?: string | null
          id?: string
          number?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      merchant_accounts: {
        Row: {
          business_name: string | null
          created_at: string
          payout_address: string | null
          payout_chain: string | null
          plan: string
          plan_expires_at: string | null
          plan_status: string
          support_email: string | null
          suspended: boolean
          updated_at: string
          user_id: string
          webhook_secret: string
          webhook_url: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          payout_address?: string | null
          payout_chain?: string | null
          plan?: string
          plan_expires_at?: string | null
          plan_status?: string
          support_email?: string | null
          suspended?: boolean
          updated_at?: string
          user_id: string
          webhook_secret?: string
          webhook_url?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          payout_address?: string | null
          payout_chain?: string | null
          plan?: string
          plan_expires_at?: string | null
          plan_status?: string
          support_email?: string | null
          suspended?: boolean
          updated_at?: string
          user_id?: string
          webhook_secret?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_usd: number
          chain: string
          coin: string
          confirmations: number
          created_at: string
          crypto_amount: number | null
          customer_email: string | null
          deposit_address: string
          description: string | null
          expires_at: string
          fee_percent: number
          fee_usd: number
          id: string
          metadata: Json
          net_usd: number
          paid_at: string | null
          reference: string
          status: string
          tx_hash: string | null
          user_id: string
        }
        Insert: {
          amount_usd: number
          chain: string
          coin: string
          confirmations?: number
          created_at?: string
          crypto_amount?: number | null
          customer_email?: string | null
          deposit_address: string
          description?: string | null
          expires_at?: string
          fee_percent: number
          fee_usd?: number
          id?: string
          metadata?: Json
          net_usd?: number
          paid_at?: string | null
          reference: string
          status?: string
          tx_hash?: string | null
          user_id: string
        }
        Update: {
          amount_usd?: number
          chain?: string
          coin?: string
          confirmations?: number
          created_at?: string
          crypto_amount?: number | null
          customer_email?: string | null
          deposit_address?: string
          description?: string | null
          expires_at?: string
          fee_percent?: number
          fee_usd?: number
          id?: string
          metadata?: Json
          net_usd?: number
          paid_at?: string | null
          reference?: string
          status?: string
          tx_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plan_payments: {
        Row: {
          chain: string
          coin: string
          created_at: string
          deposit_address: string
          expires_at: string
          id: string
          paid_at: string | null
          plan: string
          price_usd: number
          status: string
          tx_hash: string | null
          user_id: string
        }
        Insert: {
          chain: string
          coin: string
          created_at?: string
          deposit_address: string
          expires_at?: string
          id?: string
          paid_at?: string | null
          plan: string
          price_usd: number
          status?: string
          tx_hash?: string | null
          user_id: string
        }
        Update: {
          chain?: string
          coin?: string
          created_at?: string
          deposit_address?: string
          expires_at?: string
          id?: string
          paid_at?: string | null
          plan?: string
          price_usd?: number
          status?: string
          tx_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plan_settings: {
        Row: {
          api_keys: number
          created_at: string
          fee_percent: number
          max_payment_usd: number
          min_withdraw_usd: number
          monthly_volume_usd: number
          plan: string
          price_usd: number
          updated_at: string
          withdraw_fee_percent: number
        }
        Insert: {
          api_keys?: number
          created_at?: string
          fee_percent?: number
          max_payment_usd?: number
          min_withdraw_usd?: number
          monthly_volume_usd?: number
          plan: string
          price_usd?: number
          updated_at?: string
          withdraw_fee_percent?: number
        }
        Update: {
          api_keys?: number
          created_at?: string
          fee_percent?: number
          max_payment_usd?: number
          min_withdraw_usd?: number
          monthly_volume_usd?: number
          plan?: string
          price_usd?: number
          updated_at?: string
          withdraw_fee_percent?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: string
          block_number: number | null
          chain: string
          coin: string
          confirmed_at: string | null
          created_at: string
          direction: string
          fee: string | null
          from_address: string | null
          id: string
          status: string
          to_address: string | null
          tx_hash: string
          usd_value: number | null
          user_id: string
        }
        Insert: {
          amount: string
          block_number?: number | null
          chain: string
          coin: string
          confirmed_at?: string | null
          created_at?: string
          direction?: string
          fee?: string | null
          from_address?: string | null
          id?: string
          status?: string
          to_address?: string | null
          tx_hash: string
          usd_value?: number | null
          user_id: string
        }
        Update: {
          amount?: string
          block_number?: number | null
          chain?: string
          coin?: string
          confirmed_at?: string | null
          created_at?: string
          direction?: string
          fee?: string | null
          from_address?: string | null
          id?: string
          status?: string
          to_address?: string | null
          tx_hash?: string
          usd_value?: number | null
          user_id?: string
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
      wallets: {
        Row: {
          address: string
          chain: string
          coin: string
          created_at: string
          id: string
          label: string | null
          user_id: string
        }
        Insert: {
          address: string
          chain: string
          coin: string
          created_at?: string
          id?: string
          label?: string | null
          user_id: string
        }
        Update: {
          address?: string
          chain?: string
          coin?: string
          created_at?: string
          id?: string
          label?: string | null
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount_usd: number
          chain: string
          coin: string
          created_at: string
          fee_percent: number
          fee_usd: number
          id: string
          net_usd: number
          processed_at: string | null
          status: string
          to_address: string
          tx_hash: string | null
          user_id: string
        }
        Insert: {
          amount_usd: number
          chain: string
          coin: string
          created_at?: string
          fee_percent: number
          fee_usd?: number
          id?: string
          net_usd?: number
          processed_at?: string | null
          status?: string
          to_address: string
          tx_hash?: string | null
          user_id: string
        }
        Update: {
          amount_usd?: number
          chain?: string
          coin?: string
          created_at?: string
          fee_percent?: number
          fee_usd?: number
          id?: string
          net_usd?: number
          processed_at?: string | null
          status?: string
          to_address?: string
          tx_hash?: string | null
          user_id?: string
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
      monthly_volume_usd: { Args: { _user_id: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "merchant"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "merchant"],
    },
  },
} as const
