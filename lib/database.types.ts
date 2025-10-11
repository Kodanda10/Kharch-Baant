export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          currency: string
          group_type: string
          trip_start_date: string | null
          trip_end_date: string | null
          created_at: string
          updated_at: string
          is_archived: boolean
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          currency: string
          group_type: string
          trip_start_date?: string | null
          trip_end_date?: string | null
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          currency?: string
          group_type?: string
          trip_start_date?: string | null
          trip_end_date?: string | null
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          created_by?: string | null
        }
        Relationships: []
      }
      people: {
        Row: {
          id: string
          name: string
          avatar_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          avatar_url: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          person_id: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          person_id: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          person_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          group_id: string
          description: string
          amount: number
          paid_by_id: string
          date: string
          tag: string
          payment_source_id: string | null
          comment: string | null
          split_mode: string
          split_participants: Json
          type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          description: string
          amount: number
          paid_by_id: string
          date: string
          tag: string
          payment_source_id?: string | null
          comment?: string | null
          split_mode: string
          split_participants: Json
          type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          description?: string
          amount?: number
          paid_by_id?: string
          date?: string
          tag?: string
          payment_source_id?: string | null
          comment?: string | null
          split_mode?: string
          split_participants?: Json
          type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_paid_by_id_fkey"
            columns: ["paid_by_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_source_id_fkey"
            columns: ["payment_source_id"]
            isOneToOne: false
            referencedRelation: "payment_sources"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_sources: {
        Row: {
          id: string
          name: string
          type: string
          details: Json | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          details?: Json | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          details?: Json | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
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
