export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          nik: string | null
          role: string | null
          selly_preferences: any | null
          last_selly_interaction: string | null
          selly_conversation_count: number | null
          selly_user_preferences: any | null
        }
        Insert: {
          id: string
          name?: string | null
          nik?: string | null
          role?: string | null
          selly_preferences?: any | null
          last_selly_interaction?: string | null
          selly_conversation_count?: number | null
          selly_user_preferences?: any | null
        }
        Update: {
          id?: string
          name?: string | null
          nik?: string | null
          role?: string | null
          selly_preferences?: any | null
          last_selly_interaction?: string | null
          selly_conversation_count?: number | null
          selly_user_preferences?: any | null
        }
      }
      selly_chat_sessions: {
        Row: {
          id: string
          user_id: string | null
          guest_uuid: string | null
          session_type: 'authenticated' | 'guest'
          created_at: string
          updated_at: string
          last_interaction: string
          expires_at: string
          conversation_context: any
          user_preferences: any
          session_metadata: any
          message_count: number
          total_processing_time: number
          average_response_time: number
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_uuid?: string | null
          session_type: 'authenticated' | 'guest'
          created_at?: string
          updated_at?: string
          last_interaction?: string
          expires_at?: string
          conversation_context?: any
          user_preferences?: any
          session_metadata?: any
          message_count?: number
          total_processing_time?: number
          average_response_time?: number
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_uuid?: string | null
          session_type?: 'authenticated' | 'guest'
          created_at?: string
          updated_at?: string
          last_interaction?: string
          expires_at?: string
          conversation_context?: any
          user_preferences?: any
          session_metadata?: any
          message_count?: number
          total_processing_time?: number
          average_response_time?: number
        }
      }
      selly_chat_messages: {
        Row: {
          id: string
          session_id: string
          message_type: 'user' | 'assistant'
          content: string
          timestamp: string
          response_metadata: any
          processing_time_ms: number | null
          confidence_score: number | null
          enhancement_layers: string[] | null
          user_feedback: any | null
          feedback_timestamp: string | null
          feedback_rating: number | null
          anonymized_at: string | null
          scheduled_deletion_at: string | null
          content_classification: 'general' | 'sensitive' | 'administrative' | 'personal'
        }
        Insert: {
          id?: string
          session_id: string
          message_type: 'user' | 'assistant'
          content: string
          timestamp?: string
          response_metadata?: any
          processing_time_ms?: number | null
          confidence_score?: number | null
          enhancement_layers?: string[] | null
          user_feedback?: any | null
          feedback_timestamp?: string | null
          feedback_rating?: number | null
          anonymized_at?: string | null
          scheduled_deletion_at?: string | null
          content_classification?: 'general' | 'sensitive' | 'administrative' | 'personal'
        }
        Update: {
          id?: string
          session_id?: string
          message_type?: 'user' | 'assistant'
          content?: string
          timestamp?: string
          response_metadata?: any
          processing_time_ms?: number | null
          confidence_score?: number | null
          enhancement_layers?: string[] | null
          user_feedback?: any | null
          feedback_timestamp?: string | null
          feedback_rating?: number | null
          anonymized_at?: string | null
          scheduled_deletion_at?: string | null
          content_classification?: 'general' | 'sensitive' | 'administrative' | 'personal'
        }
      }
      aktivitas_siak: {
        Row: {
          id: string
          tanggal: string
          aktivitas: string
          status: string
          keterangan: string | null
          created_by: string
          created_at: string
        }
      }
      pengaduan_bulanan: {
        Row: {
          id: string
          tanggal: string
          masalah: string
          status: string
          tindakan: string | null
          created_by: string
          created_at: string
        }
      }
      dokumentasi: {
        Row: {
          id: string
          tanggal: string
          foto: string | null
          judul: string
          keterangan: string
          created_by: string
          created_at: string
        }
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
  }
}