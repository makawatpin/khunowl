// Generated via `supabase gen types typescript` (Supabase MCP generate_typescript_types).
// Do not edit by hand — regenerate after every new migration.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          archived: boolean
          bank: string | null
          created_at: string
          id: string
          last4: string | null
          name: string
          opening_balance: number
          pinned: boolean
          sort: number
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          bank?: string | null
          created_at?: string
          id?: string
          last4?: string | null
          name: string
          opening_balance?: number
          pinned?: boolean
          sort?: number
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          bank?: string | null
          created_at?: string
          id?: string
          last4?: string | null
          name?: string
          opening_balance?: number
          pinned?: boolean
          sort?: number
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          image_path: string | null
          kind: string | null
          model: string | null
          name: string
          note: string | null
          price: number | null
          purchase_txn_id: string | null
          purchased_on: string | null
          receipt_path: string | null
          serial: string | null
          sold: boolean
          store: string | null
          updated_at: string
          user_id: string
          warranty_until: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          kind?: string | null
          model?: string | null
          name: string
          note?: string | null
          price?: number | null
          purchase_txn_id?: string | null
          purchased_on?: string | null
          receipt_path?: string | null
          serial?: string | null
          sold?: boolean
          store?: string | null
          updated_at?: string
          user_id?: string
          warranty_until?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          kind?: string | null
          model?: string | null
          name?: string
          note?: string | null
          price?: number | null
          purchase_txn_id?: string | null
          purchased_on?: string | null
          receipt_path?: string | null
          serial?: string | null
          sold?: boolean
          store?: string | null
          updated_at?: string
          user_id?: string
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_purchase_txn_id_fkey"
            columns: ["purchase_txn_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          account_id: string | null
          amount: number
          auto_debit: boolean
          created_at: string
          cycle: Database["public"]["Enums"]["cycle_t"]
          domain: string | null
          id: string
          last_paid: string | null
          name: string
          next_due: string
          remind_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          auto_debit?: boolean
          created_at?: string
          cycle?: Database["public"]["Enums"]["cycle_t"]
          domain?: string | null
          id?: string
          last_paid?: string | null
          name: string
          next_due: string
          remind_days?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          auto_debit?: boolean
          created_at?: string
          cycle?: Database["public"]["Enums"]["cycle_t"]
          domain?: string | null
          id?: string
          last_paid?: string | null
          name?: string
          next_due?: string
          remind_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          category: string
          monthly_limit: number
          user_id: string
        }
        Insert: {
          category: string
          monthly_limit: number
          user_id?: string
        }
        Update: {
          category?: string
          monthly_limit?: number
          user_id?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          archived: boolean
          bank: string | null
          created_at: string
          credit_limit: number
          due_date: string | null
          id: string
          last4: string | null
          min_payment: number
          name: string
          network: string | null
          opening_used: number
          pinned: boolean
          sort: number
          statement_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          bank?: string | null
          created_at?: string
          credit_limit?: number
          due_date?: string | null
          id?: string
          last4?: string | null
          min_payment?: number
          name: string
          network?: string | null
          opening_used?: number
          pinned?: boolean
          sort?: number
          statement_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          bank?: string | null
          created_at?: string
          credit_limit?: number
          due_date?: string | null
          id?: string
          last4?: string | null
          min_payment?: number
          name?: string
          network?: string | null
          opening_used?: number
          pinned?: boolean
          sort?: number
          statement_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          expiry: string | null
          file_path: string | null
          id: string
          name: string
          note: string | null
          related: string | null
          related_asset_id: string | null
          related_vehicle_id: string | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expiry?: string | null
          file_path?: string | null
          id?: string
          name: string
          note?: string | null
          related?: string | null
          related_asset_id?: string | null
          related_vehicle_id?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          expiry?: string | null
          file_path?: string | null
          id?: string
          name?: string
          note?: string | null
          related?: string | null
          related_asset_id?: string | null
          related_vehicle_id?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_related_asset_id_fkey"
            columns: ["related_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_related_vehicle_id_fkey"
            columns: ["related_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          color: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          color?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      fuel_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          liters: number
          mileage: number
          price_per_l: number | null
          total: number
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          liters: number
          mileage: number
          price_per_l?: number | null
          total: number
          user_id?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          liters?: number
          mileage?: number
          price_per_l?: number | null
          total?: number
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      home_tasks: {
        Row: {
          cost: number | null
          created_at: string
          every_months: number
          id: string
          last_done: string | null
          name: string
          next_due: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          every_months?: number
          id?: string
          last_done?: string | null
          name: string
          next_due: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          every_months?: number
          id?: string
          last_done?: string | null
          name?: string
          next_due?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      installment_plans: {
        Row: {
          card_id: string | null
          created_at: string
          id: string
          months: number
          name: string
          paid_months: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id?: string | null
          created_at?: string
          id?: string
          months: number
          name: string
          paid_months?: number
          total: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          card_id?: string | null
          created_at?: string
          id?: string
          months?: number
          name?: string
          paid_months?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_usage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_acks: {
        Row: {
          acked_on: string
          noti_id: string
          user_id: string
        }
        Insert: {
          acked_on?: string
          noti_id: string
          user_id?: string
        }
        Update: {
          acked_on?: string
          noti_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          prefs: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          prefs?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          prefs?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_bills: {
        Row: {
          attachment_path: string | null
          created_at: string
          date: string
          id: string
          items: Json
          note: string | null
          phase: string | null
          project_id: string
          shop: string | null
          user_id: string
        }
        Insert: {
          attachment_path?: string | null
          created_at?: string
          date: string
          id?: string
          items?: Json
          note?: string | null
          phase?: string | null
          project_id: string
          shop?: string | null
          user_id?: string
        }
        Update: {
          attachment_path?: string | null
          created_at?: string
          date?: string
          id?: string
          items?: Json
          note?: string | null
          phase?: string | null
          project_id?: string
          shop?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_bills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          created_at: string
          end_on: string | null
          id: string
          kind: string | null
          name: string
          note: string | null
          phases: string[]
          start_on: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          end_on?: string | null
          id?: string
          kind?: string | null
          name: string
          note?: string | null
          phases?: string[]
          start_on?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          end_on?: string | null
          id?: string
          kind?: string | null
          name?: string
          note?: string | null
          phases?: string[]
          start_on?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          created_at: string
          id: string
          kind: string | null
          monthly_rent: number | null
          name: string
          since: string | null
          size: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string | null
          monthly_rent?: number | null
          name: string
          since?: string | null
          size?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string | null
          monthly_rent?: number | null
          name?: string
          since?: string | null
          size?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_income: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          day_of_month: number
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          day_of_month: number
          id?: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          day_of_month?: number
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_income_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_income_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          account_id: string | null
          active: boolean
          cancel_url: string | null
          card_id: string | null
          created_at: string
          cycle: Database["public"]["Enums"]["cycle_t"]
          domain: string | null
          id: string
          name: string
          next_billing: string
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          active?: boolean
          cancel_url?: string | null
          card_id?: string | null
          created_at?: string
          cycle?: Database["public"]["Enums"]["cycle_t"]
          domain?: string | null
          id?: string
          name: string
          next_billing: string
          price: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_id?: string | null
          active?: boolean
          cancel_url?: string | null
          card_id?: string | null
          created_at?: string
          cycle?: Database["public"]["Enums"]["cycle_t"]
          domain?: string | null
          id?: string
          name?: string
          next_billing?: string
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_usage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          done: boolean
          done_at: string | null
          due: string | null
          id: string
          name: string
          priority: Database["public"]["Enums"]["task_pri"]
          related: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          done_at?: string | null
          due?: string | null
          id?: string
          name: string
          priority?: Database["public"]["Enums"]["task_pri"]
          related?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          done_at?: string | null
          due?: string | null
          id?: string
          name?: string
          priority?: Database["public"]["Enums"]["task_pri"]
          related?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          attachment_path: string | null
          category: string | null
          created_at: string
          date: string
          id: string
          name: string
          note: string | null
          ref: string | null
          src_account_id: string | null
          src_card_id: string | null
          tags: string[]
          time: string | null
          to_account_id: string | null
          to_card_id: string | null
          type: Database["public"]["Enums"]["txn_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          attachment_path?: string | null
          category?: string | null
          created_at?: string
          date?: string
          id?: string
          name: string
          note?: string | null
          ref?: string | null
          src_account_id?: string | null
          src_card_id?: string | null
          tags?: string[]
          time?: string | null
          to_account_id?: string | null
          to_card_id?: string | null
          type: Database["public"]["Enums"]["txn_type"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          attachment_path?: string | null
          category?: string | null
          created_at?: string
          date?: string
          id?: string
          name?: string
          note?: string | null
          ref?: string | null
          src_account_id?: string | null
          src_card_id?: string | null
          tags?: string[]
          time?: string | null
          to_account_id?: string | null
          to_card_id?: string | null
          type?: Database["public"]["Enums"]["txn_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_src_account_id_fkey"
            columns: ["src_account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_src_account_id_fkey"
            columns: ["src_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_src_card_id_fkey"
            columns: ["src_card_id"]
            isOneToOne: false
            referencedRelation: "card_usage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_src_card_id_fkey"
            columns: ["src_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_card_id_fkey"
            columns: ["to_card_id"]
            isOneToOne: false
            referencedRelation: "card_usage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_card_id_fkey"
            columns: ["to_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expense_items: {
        Row: {
          expense_id: string
          id: string
          name: string
          people: string[]
          price: number
          user_id: string
        }
        Insert: {
          expense_id: string
          id?: string
          name: string
          people?: string[]
          price: number
          user_id?: string
        }
        Update: {
          expense_id?: string
          id?: string
          name?: string
          people?: string[]
          price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expense_items_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "trip_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expense_shares: {
        Row: {
          amount: number
          expense_id: string
          member_id: string
          user_id: string
        }
        Insert: {
          amount: number
          expense_id: string
          member_id: string
          user_id?: string
        }
        Update: {
          amount?: number
          expense_id?: string
          member_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expense_shares_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "trip_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expense_shares_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "trip_members"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string | null
          id: string
          paid_by: string
          split_mode: Database["public"]["Enums"]["split_mode"]
          title: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          date?: string | null
          id?: string
          paid_by: string
          split_mode?: Database["public"]["Enums"]["split_mode"]
          title: string
          trip_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string | null
          id?: string
          paid_by?: string
          split_mode?: Database["public"]["Enums"]["split_mode"]
          title?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "trip_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          friend_id: string | null
          id: string
          trip_id: string
          user_id: string
        }
        Insert: {
          friend_id?: string | null
          id?: string
          trip_id: string
          user_id?: string
        }
        Update: {
          friend_id?: string | null
          id?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "friends"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_settlements: {
        Row: {
          amount: number
          date: string
          from_member: string
          id: string
          to_member: string
          trip_id: string
          txn_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          date: string
          from_member: string
          id?: string
          to_member: string
          trip_id: string
          txn_id?: string | null
          user_id?: string
        }
        Update: {
          amount?: number
          date?: string
          from_member?: string
          id?: string
          to_member?: string
          trip_id?: string
          txn_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_settlements_from_member_fkey"
            columns: ["from_member"]
            isOneToOne: false
            referencedRelation: "trip_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_settlements_to_member_fkey"
            columns: ["to_member"]
            isOneToOne: false
            referencedRelation: "trip_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_settlements_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_settlements_txn_id_fkey"
            columns: ["txn_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string
          currency: string
          end_on: string | null
          id: string
          name: string
          rate: number
          start_on: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          end_on?: string | null
          id?: string
          name: string
          rate?: number
          start_on?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          currency?: string
          end_on?: string | null
          id?: string
          name?: string
          rate?: number
          start_on?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicle_services: {
        Row: {
          category: string | null
          cost: number
          created_at: string
          date: string
          id: string
          items: Json
          mileage: number | null
          name: string
          note: string | null
          provider: string | null
          receipt_path: string | null
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          category?: string | null
          cost?: number
          created_at?: string
          date: string
          id?: string
          items?: Json
          mileage?: number | null
          name: string
          note?: string | null
          provider?: string | null
          receipt_path?: string | null
          updated_at?: string
          user_id?: string
          vehicle_id: string
        }
        Update: {
          category?: string | null
          cost?: number
          created_at?: string
          date?: string
          id?: string
          items?: Json
          mileage?: number | null
          name?: string
          note?: string | null
          provider?: string | null
          receipt_path?: string | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_services_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string | null
          color: string | null
          created_at: string
          id: string
          insurance_company: string | null
          insurance_expiry: string | null
          insurance_policy: string | null
          insurance_premium: number | null
          kind: Database["public"]["Enums"]["vehicle_kind"]
          mileage: number
          model: string | null
          plate: string | null
          prb_expiry: string | null
          prb_premium: number | null
          price: number | null
          purchased_on: string | null
          service_every_km: number
          tax_expiry: string | null
          tax_premium: number | null
          updated_at: string
          user_id: string
          vin: string | null
          year: number | null
        }
        Insert: {
          brand?: string | null
          color?: string | null
          created_at?: string
          id?: string
          insurance_company?: string | null
          insurance_expiry?: string | null
          insurance_policy?: string | null
          insurance_premium?: number | null
          kind?: Database["public"]["Enums"]["vehicle_kind"]
          mileage?: number
          model?: string | null
          plate?: string | null
          prb_expiry?: string | null
          prb_premium?: number | null
          price?: number | null
          purchased_on?: string | null
          service_every_km?: number
          tax_expiry?: string | null
          tax_premium?: number | null
          updated_at?: string
          user_id?: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          brand?: string | null
          color?: string | null
          created_at?: string
          id?: string
          insurance_company?: string | null
          insurance_expiry?: string | null
          insurance_policy?: string | null
          insurance_premium?: number | null
          kind?: Database["public"]["Enums"]["vehicle_kind"]
          mileage?: number
          model?: string | null
          plate?: string | null
          prb_expiry?: string | null
          prb_premium?: number | null
          price?: number | null
          purchased_on?: string | null
          service_every_km?: number
          tax_expiry?: string | null
          tax_premium?: number | null
          updated_at?: string
          user_id?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      account_balances: {
        Row: {
          archived: boolean | null
          balance: number | null
          bank: string | null
          created_at: string | null
          id: string | null
          last4: string | null
          name: string | null
          opening_balance: number | null
          pinned: boolean | null
          sort: number | null
          type: Database["public"]["Enums"]["account_type"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          archived?: boolean | null
          balance?: never
          bank?: string | null
          created_at?: string | null
          id?: string | null
          last4?: string | null
          name?: string | null
          opening_balance?: number | null
          pinned?: boolean | null
          sort?: number | null
          type?: Database["public"]["Enums"]["account_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          archived?: boolean | null
          balance?: never
          bank?: string | null
          created_at?: string | null
          id?: string | null
          last4?: string | null
          name?: string | null
          opening_balance?: number | null
          pinned?: boolean | null
          sort?: number | null
          type?: Database["public"]["Enums"]["account_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      card_usage: {
        Row: {
          archived: boolean | null
          bank: string | null
          created_at: string | null
          credit_limit: number | null
          due_date: string | null
          id: string | null
          last4: string | null
          min_payment: number | null
          name: string | null
          network: string | null
          opening_used: number | null
          pinned: boolean | null
          sort: number | null
          statement_date: string | null
          updated_at: string | null
          used: number | null
          user_id: string | null
        }
        Insert: {
          archived?: boolean | null
          bank?: string | null
          created_at?: string | null
          credit_limit?: number | null
          due_date?: string | null
          id?: string | null
          last4?: string | null
          min_payment?: number | null
          name?: string | null
          network?: string | null
          opening_used?: number | null
          pinned?: boolean | null
          sort?: number | null
          statement_date?: string | null
          updated_at?: string | null
          used?: never
          user_id?: string | null
        }
        Update: {
          archived?: boolean | null
          bank?: string | null
          created_at?: string | null
          credit_limit?: number | null
          due_date?: string | null
          id?: string | null
          last4?: string | null
          min_payment?: number | null
          name?: string | null
          network?: string | null
          opening_used?: number | null
          pinned?: boolean | null
          sort?: number | null
          statement_date?: string | null
          updated_at?: string | null
          used?: never
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_type: "cash" | "savings" | "checking" | "ewallet" | "investment"
      cycle_t: "monthly" | "quarterly" | "semiannual" | "yearly"
      split_mode: "equal" | "items" | "custom"
      task_pri: "high" | "medium" | "low"
      txn_type: "expense" | "income" | "transfer"
      vehicle_kind: "car" | "motorcycle"
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
      account_type: ["cash", "savings", "checking", "ewallet", "investment"],
      cycle_t: ["monthly", "quarterly", "semiannual", "yearly"],
      split_mode: ["equal", "items", "custom"],
      task_pri: ["high", "medium", "low"],
      txn_type: ["expense", "income", "transfer"],
      vehicle_kind: ["car", "motorcycle"],
    },
  },
} as const
