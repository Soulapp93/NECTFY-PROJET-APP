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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assignment_corrections: {
        Row: {
          corrector_id: string
          created_at: string | null
          feedback: string | null
          grade: number | null
          id: string
          published_at: string | null
          submission_id: string
          updated_at: string | null
        }
        Insert: {
          corrector_id: string
          created_at?: string | null
          feedback?: string | null
          grade?: number | null
          id?: string
          published_at?: string | null
          submission_id: string
          updated_at?: string | null
        }
        Update: {
          corrector_id?: string
          created_at?: string | null
          feedback?: string | null
          grade?: number | null
          id?: string
          published_at?: string | null
          submission_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_corrections_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_files: {
        Row: {
          assignment_id: string
          created_at: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          content: string | null
          created_at: string | null
          id: string
          status: string | null
          student_id: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          student_id: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          student_id?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance_sheets: {
        Row: {
          closed_at: string | null
          created_at: string
          date: string
          end_time: string
          formation_id: string
          generated_at: string
          id: string
          instructor_id: string | null
          is_open_for_signing: boolean | null
          opened_at: string | null
          qr_code: string | null
          room: string | null
          schedule_slot_id: string
          session_type: string | null
          signature_link_expires_at: string | null
          signature_link_sent_at: string | null
          signature_link_token: string | null
          start_time: string
          status: string
          title: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          date: string
          end_time: string
          formation_id: string
          generated_at?: string
          id?: string
          instructor_id?: string | null
          is_open_for_signing?: boolean | null
          opened_at?: string | null
          qr_code?: string | null
          room?: string | null
          schedule_slot_id: string
          session_type?: string | null
          signature_link_expires_at?: string | null
          signature_link_sent_at?: string | null
          signature_link_token?: string | null
          start_time: string
          status?: string
          title: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          date?: string
          end_time?: string
          formation_id?: string
          generated_at?: string
          id?: string
          instructor_id?: string | null
          is_open_for_signing?: boolean | null
          opened_at?: string | null
          qr_code?: string | null
          room?: string | null
          schedule_slot_id?: string
          session_type?: string | null
          signature_link_expires_at?: string | null
          signature_link_sent_at?: string | null
          signature_link_token?: string | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sheets_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sheets_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sheets_schedule_slot_id_fkey"
            columns: ["schedule_slot_id"]
            isOneToOne: true
            referencedRelation: "schedule_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sheets_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_signatures: {
        Row: {
          absence_reason: string | null
          absence_reason_type: string | null
          attendance_sheet_id: string
          created_at: string
          id: string
          present: boolean
          signature_data: string | null
          signed_at: string
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          absence_reason?: string | null
          absence_reason_type?: string | null
          attendance_sheet_id: string
          created_at?: string
          id?: string
          present?: boolean
          signature_data?: string | null
          signed_at?: string
          updated_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          absence_reason?: string | null
          absence_reason_type?: string | null
          attendance_sheet_id?: string
          created_at?: string
          id?: string
          present?: boolean
          signature_data?: string | null
          signed_at?: string
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_signatures_attendance_sheet_id_fkey"
            columns: ["attendance_sheet_id"]
            isOneToOne: false
            referencedRelation: "attendance_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          establishment_id: string
          group_type: string | null
          id: string
          is_private: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          establishment_id: string
          group_type?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          establishment_id?: string
          group_type?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_groups_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string | null
          created_at: string
          group_id: string
          id: string
          is_edited: boolean | null
          message_type: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          group_id: string
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          group_id?: string
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      establishments: {
        Row: {
          address: string | null
          created_at: string
          director: string | null
          email: string
          id: string
          logo_url: string | null
          name: string
          number_of_instructors: string | null
          number_of_students: string | null
          phone: string | null
          siret: string | null
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          director?: string | null
          email: string
          id?: string
          logo_url?: string | null
          name: string
          number_of_instructors?: string | null
          number_of_students?: string | null
          phone?: string | null
          siret?: string | null
          type: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          director?: string | null
          email?: string
          id?: string
          logo_url?: string | null
          name?: string
          number_of_instructors?: string | null
          number_of_students?: string | null
          phone?: string | null
          siret?: string | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      formation_modules: {
        Row: {
          created_at: string
          description: string | null
          duration_hours: number
          formation_id: string
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_hours?: number
          formation_id: string
          id?: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_hours?: number
          formation_id?: string
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formation_modules_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      formations: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          duration: number
          end_date: string
          establishment_id: string
          id: string
          level: string
          max_students: number
          price: number | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          duration: number
          end_date: string
          establishment_id: string
          id?: string
          level: string
          max_students?: number
          price?: number | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          end_date?: string
          establishment_id?: string
          id?: string
          level?: string
          max_students?: number
          price?: number | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formations_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          email: string
          establishment_id: string
          expires_at: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          establishment_id: string
          expires_at: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          establishment_id?: string
          expires_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          content_type: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_recipients: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_archived: boolean
          is_deleted: boolean
          is_favorite: boolean
          is_read: boolean
          message_id: string
          read_at: string | null
          recipient_id: string | null
          recipient_type: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_archived?: boolean
          is_deleted?: boolean
          is_favorite?: boolean
          is_read?: boolean
          message_id: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_type?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_archived?: boolean
          is_deleted?: boolean
          is_favorite?: boolean
          is_read?: boolean
          message_id?: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_recipients_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_count: number
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean | null
          is_draft: boolean
          scheduled_for: string | null
          sender_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          attachment_count?: number
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_draft?: boolean
          scheduled_for?: string | null
          sender_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          attachment_count?: number
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_draft?: boolean
          scheduled_for?: string | null
          sender_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      module_assignments: {
        Row: {
          assignment_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_published: boolean | null
          max_points: number | null
          module_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignment_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          max_points?: number | null
          module_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assignment_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          max_points?: number | null
          module_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_slots: {
        Row: {
          color: string | null
          created_at: string
          date: string
          end_time: string
          id: string
          instructor_id: string | null
          module_id: string | null
          notes: string | null
          room: string | null
          schedule_id: string
          session_type: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          date: string
          end_time: string
          id?: string
          instructor_id?: string | null
          module_id?: string | null
          notes?: string | null
          room?: string | null
          schedule_id: string
          session_type?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          instructor_id?: string | null
          module_id?: string | null
          notes?: string | null
          room?: string | null
          schedule_id?: string
          session_type?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_slots_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_slots_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "formation_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_slots_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          description: string | null
          formation_id: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          formation_id: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          formation_id?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          submission_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          submission_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_files_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      text_book_entries: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          date: string
          end_time: string | null
          homework: string | null
          id: string
          instructor_id: string | null
          objectives: string | null
          schedule_slot_id: string | null
          start_time: string | null
          subject_matter: string | null
          text_book_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          date: string
          end_time?: string | null
          homework?: string | null
          id?: string
          instructor_id?: string | null
          objectives?: string | null
          schedule_slot_id?: string | null
          start_time?: string | null
          subject_matter?: string | null
          text_book_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          date?: string
          end_time?: string | null
          homework?: string | null
          id?: string
          instructor_id?: string | null
          objectives?: string | null
          schedule_slot_id?: string | null
          start_time?: string | null
          subject_matter?: string | null
          text_book_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "text_book_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "text_book_entries_schedule_slot_id_fkey"
            columns: ["schedule_slot_id"]
            isOneToOne: false
            referencedRelation: "schedule_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "text_book_entries_text_book_id_fkey"
            columns: ["text_book_id"]
            isOneToOne: false
            referencedRelation: "text_books"
            referencedColumns: ["id"]
          },
        ]
      }
      text_book_entry_files: {
        Row: {
          created_at: string | null
          entry_id: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
        }
        Insert: {
          created_at?: string | null
          entry_id: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
        }
        Update: {
          created_at?: string | null
          entry_id?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
        }
        Relationships: []
      }
      text_books: {
        Row: {
          academic_year: string | null
          created_at: string
          created_by: string | null
          description: string | null
          formation_id: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          formation_id: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          formation_id?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "text_books_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "text_books_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_student_assignments: {
        Row: {
          assigned_at: string
          id: string
          is_active: boolean
          student_id: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          is_active?: boolean
          student_id: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          id?: string
          is_active?: boolean
          student_id?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_student_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_student_assignments_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      tutors: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          establishment_id: string
          first_name: string
          id: string
          is_activated: boolean
          last_name: string
          phone: string | null
          position: string | null
          profile_photo_url: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          establishment_id: string
          first_name: string
          id?: string
          is_activated?: boolean
          last_name: string
          phone?: string | null
          position?: string | null
          profile_photo_url?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          establishment_id?: string
          first_name?: string
          id?: string
          is_activated?: boolean
          last_name?: string
          phone?: string | null
          position?: string | null
          profile_photo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutors_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activation_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_formation_assignments: {
        Row: {
          assigned_at: string
          formation_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          formation_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          formation_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_formation_assignments_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_formation_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_signatures: {
        Row: {
          created_at: string
          id: string
          signature_data: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signature_data: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signature_data?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          establishment_id: string
          first_name: string
          id: string
          is_activated: boolean
          last_name: string
          phone: string | null
          profile_photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          establishment_id: string
          first_name: string
          id?: string
          is_activated?: boolean
          last_name: string
          phone?: string | null
          profile_photo_url?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          establishment_id?: string
          first_name?: string
          id?: string
          is_activated?: boolean
          last_name?: string
          phone?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      tutor_students_view: {
        Row: {
          assigned_at: string | null
          id: string | null
          is_active: boolean | null
          student_email: string | null
          student_first_name: string | null
          student_id: string | null
          student_last_name: string | null
          student_photo: string | null
          tutor_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutor_student_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_student_assignments_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_message: { Args: { _message_id: string }; Returns: boolean }
      generate_signature_token: { Args: { sheet_id: string }; Returns: string }
      get_current_user_establishment: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_establishment_group_id: {
        Args: { _establishment_id: string }
        Returns: string
      }
      get_my_context: { Args: never; Returns: Json }
      get_my_profile: { Args: never; Returns: Json }
      get_tutor_apprentice_formations: {
        Args: never
        Returns: {
          formation_id: string
          formation_level: string
          formation_status: string
          formation_title: string
          student_id: string
          student_name: string
        }[]
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_group_admin: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_member_of_group: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_message_sender: { Args: { _message_id: string }; Returns: boolean }
      validate_signature_token: {
        Args: { token_param: string }
        Returns: {
          error_message: string
          is_valid: boolean
          sheet_id: string
        }[]
      }
    }
    Enums: {
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      user_role: "AdminPrincipal" | "Admin" | "Formateur" | "Étudiant"
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
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      user_role: ["AdminPrincipal", "Admin", "Formateur", "Étudiant"],
    },
  },
} as const
