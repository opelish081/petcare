// types/supabase.ts — Database type definitions สำหรับ Supabase
// ใช้ร่วมกับ Supabase CLI: npx supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          avatar_url: string | null
          locale: string
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          avatar_url?: string | null
          locale?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          avatar_url?: string | null
          locale?: string
          created_at?: string
        }
      }
      pets: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          breed: string | null
          birthdate: string | null
          gender: string | null
          image_url: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          breed?: string | null
          birthdate?: string | null
          gender?: string | null
          image_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          breed?: string | null
          birthdate?: string | null
          gender?: string | null
          image_url?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          pet_id: string
          user_id: string
          type: string
          title: string
          appointment_date: string
          location: string | null
          status: string
          notes: string | null
          notify_days: number[]
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          user_id: string
          type: string
          title: string
          appointment_date: string
          location?: string | null
          status?: string
          notes?: string | null
          notify_days?: number[]
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          user_id?: string
          type?: string
          title?: string
          appointment_date?: string
          location?: string | null
          status?: string
          notes?: string | null
          notify_days?: number[]
          created_at?: string
        }
      }
      health_records: {
        Row: {
          id: string
          pet_id: string
          appointment_id: string | null
          type: string
          title: string
          record_date: string
          details: string | null
          next_due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          appointment_id?: string | null
          type: string
          title: string
          record_date: string
          details?: string | null
          next_due_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          appointment_id?: string | null
          type?: string
          title?: string
          record_date?: string
          details?: string | null
          next_due_date?: string | null
          created_at?: string
        }
      }
      email_logs: {
        Row: {
          id: string
          appointment_id: string
          days_before: number
          sent_at: string
          status: string
        }
        Insert: {
          id?: string
          appointment_id: string
          days_before: number
          sent_at?: string
          status: string
        }
        Update: {
          id?: string
          appointment_id?: string
          days_before?: number
          sent_at?: string
          status?: string
        }
      }
    }
  }
}
