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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      assignment_corrections: {
        Row: {
          comments: string | null
          corrected_at: string | null
          corrected_by: string
          created_at: string
          id: string
          is_corrected: boolean | null
          max_score: number | null
          published_at: string | null
          score: number | null
          submission_id: string
          updated_at: string
        }
        Insert: {
          comments?: string | null
          corrected_at?: string | null
          corrected_by: string
          created_at?: string
          id?: string
          is_corrected?: boolean | null
          max_score?: number | null
          published_at?: string | null
          score?: number | null
          submission_id: string
          updated_at?: string
        }
        Update: {
          comments?: string | null
          corrected_at?: string | null
          corrected_by?: string
          created_at?: string
          id?: string
          is_corrected?: boolean | null
          max_score?: number | null
          published_at?: string | null
          score?: number | null
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_corrections_corrected_by_fkey"
            columns: ["corrected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_corrections_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "assignment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_files: {
        Row: {
          assignment_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_files_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "module_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          id: string
          student_id: string
          submission_text: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          id?: string
          student_id: string
          submission_text?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          id?: string
          student_id?: string
          submission_text?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "module_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_audit_log: {
        Row: {
          action: string
          attendance_sheet_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          attendance_sheet_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          attendance_sheet_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_audit_log_attendance_sheet_id_fkey"
            columns: ["attendance_sheet_id"]
            isOneToOne: false
            referencedRelation: "attendance_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "fk_attendance_sheets_formation"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attendance_sheets_instructor"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attendance_sheets_schedule_slot"
            columns: ["schedule_slot_id"]
            isOneToOne: true
            referencedRelation: "schedule_slots"
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
            foreignKeyName: "fk_attendance_signatures_sheet"
            columns: ["attendance_sheet_id"]
            isOneToOne: false
            referencedRelation: "attendance_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attendance_signatures_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string
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
          {
            foreignKeyName: "chat_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_groups: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          establishment_id: string
          formation_id: string | null
          group_type: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          establishment_id: string
          formation_id?: string | null
          group_type: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          establishment_id?: string
          formation_id?: string | null
          group_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
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
          {
            foreignKeyName: "chat_groups_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_attachments: {
        Row: {
          content_type: string | null
          created_at: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          group_id: string
          id: string
          is_deleted: boolean | null
          message_type: string
          replied_to_message_id: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id: string
          id?: string
          is_deleted?: boolean | null
          message_type?: string
          replied_to_message_id?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string
          id?: string
          is_deleted?: boolean | null
          message_type?: string
          replied_to_message_id?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_replied_to_message_id_fkey"
            columns: ["replied_to_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_safe_file_permissions: {
        Row: {
          created_at: string
          file_id: string
          granted_by: string
          id: string
          permission_type: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          file_id: string
          granted_by: string
          id?: string
          permission_type?: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          file_id?: string
          granted_by?: string
          id?: string
          permission_type?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_safe_file_permissions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "digital_safe_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_safe_file_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_safe_files: {
        Row: {
          content_type: string
          created_at: string
          establishment_id: string
          file_path: string
          file_size: number
          file_url: string
          folder_id: string | null
          id: string
          is_shared: boolean | null
          name: string
          original_name: string
          shared_with_roles: string[] | null
          shared_with_users: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type: string
          created_at?: string
          establishment_id: string
          file_path: string
          file_size: number
          file_url: string
          folder_id?: string | null
          id?: string
          is_shared?: boolean | null
          name: string
          original_name: string
          shared_with_roles?: string[] | null
          shared_with_users?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string
          establishment_id?: string
          file_path?: string
          file_size?: number
          file_url?: string
          folder_id?: string | null
          id?: string
          is_shared?: boolean | null
          name?: string
          original_name?: string
          shared_with_roles?: string[] | null
          shared_with_users?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_safe_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "digital_safe_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_safe_folders: {
        Row: {
          created_at: string
          establishment_id: string
          id: string
          name: string
          parent_folder_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          establishment_id: string
          id?: string
          name: string
          parent_folder_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          establishment_id?: string
          id?: string
          name?: string
          parent_folder_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_safe_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "digital_safe_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_creation_attempts: {
        Row: {
          attempted_at: string | null
          email: string
          id: string
          ip_address: string
          success: boolean | null
        }
        Insert: {
          attempted_at?: string | null
          email: string
          id?: string
          ip_address: string
          success?: boolean | null
        }
        Update: {
          attempted_at?: string | null
          email?: string
          id?: string
          ip_address?: string
          success?: boolean | null
        }
        Relationships: []
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
      event_registrations: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          status: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          status?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          end_time: string | null
          establishment_id: string
          id: string
          image_url: string | null
          location: string | null
          max_participants: number | null
          start_date: string
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          establishment_id: string
          id?: string
          image_url?: string | null
          location?: string | null
          max_participants?: number | null
          start_date: string
          start_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          establishment_id?: string
          id?: string
          image_url?: string | null
          location?: string | null
          max_participants?: number | null
          start_date?: string
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
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
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
          is_archived: boolean | null
          is_deleted: boolean | null
          is_favorite: boolean | null
          is_read: boolean | null
          message_id: string
          read_at: string | null
          recipient_id: string | null
          recipient_type: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_deleted?: boolean | null
          is_favorite?: boolean | null
          is_read?: boolean | null
          message_id: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_type: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_deleted?: boolean | null
          is_favorite?: boolean | null
          is_read?: boolean | null
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
          attachment_count: number | null
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
          attachment_count?: number | null
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
          attachment_count?: number | null
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
          assignment_type: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_published: boolean | null
          max_points: number | null
          module_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assignment_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          max_points?: number | null
          module_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assignment_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          max_points?: number | null
          module_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "formation_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_contents: {
        Row: {
          content_type: string
          created_at: string
          created_by: string | null
          description: string | null
          file_name: string | null
          file_url: string | null
          id: string
          module_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          module_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          module_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_contents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "formation_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_documents: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          module_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          module_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          module_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_documents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "formation_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_instructors: {
        Row: {
          assigned_at: string
          id: string
          instructor_id: string
          module_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          instructor_id: string
          module_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          instructor_id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_instructors_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "formation_modules"
            referencedColumns: ["id"]
          },
        ]
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
      qr_validation_attempts: {
        Row: {
          attempted_at: string | null
          id: string
          ip_address: string | null
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          attempted_at?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          attempted_at?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_id?: string | null
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
          academic_year: string
          created_at: string
          created_by: string | null
          formation_id: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          academic_year?: string
          created_at?: string
          created_by?: string | null
          formation_id: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          created_by?: string | null
          formation_id?: string
          id?: string
          status?: string
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
      student_formations: {
        Row: {
          enrolled_at: string
          formation_id: string
          id: string
          student_id: string
        }
        Insert: {
          enrolled_at?: string
          formation_id: string
          id?: string
          student_id: string
        }
        Update: {
          enrolled_at?: string
          formation_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_formations_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_formations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_files: {
        Row: {
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          submission_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          submission_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          submission_id?: string
          uploaded_at?: string
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
          content: string | null
          created_at: string
          date: string
          end_time: string
          homework: string | null
          id: string
          instructor_id: string | null
          start_time: string
          subject_matter: string
          text_book_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          date: string
          end_time: string
          homework?: string | null
          id?: string
          instructor_id?: string | null
          start_time: string
          subject_matter: string
          text_book_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          date?: string
          end_time?: string
          homework?: string | null
          id?: string
          instructor_id?: string | null
          start_time?: string
          subject_matter?: string
          text_book_id?: string
          updated_at?: string
        }
        Relationships: [
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
          content_type: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          text_book_entry_id: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          text_book_entry_id: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          text_book_entry_id?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_text_book_entry_files_text_book_entry_id"
            columns: ["text_book_entry_id"]
            isOneToOne: false
            referencedRelation: "text_book_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      text_books: {
        Row: {
          academic_year: string
          created_at: string
          created_by: string | null
          formation_id: string
          id: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          created_by?: string | null
          formation_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          created_by?: string | null
          formation_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
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
          contract_end_date: string | null
          contract_start_date: string | null
          contract_type: string | null
          id: string
          is_active: boolean | null
          student_id: string
          tutor_id: string
        }
        Insert: {
          assigned_at?: string
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_type?: string | null
          id?: string
          is_active?: boolean | null
          student_id: string
          tutor_id: string
        }
        Update: {
          assigned_at?: string
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_type?: string | null
          id?: string
          is_active?: boolean | null
          student_id?: string
          tutor_id?: string
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
            referencedRelation: "tutor_students_view"
            referencedColumns: ["tutor_id"]
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
          company_address: string | null
          company_name: string
          created_at: string
          email: string
          establishment_id: string
          first_name: string
          id: string
          is_activated: boolean | null
          last_name: string
          phone: string | null
          position: string | null
          profile_photo_url: string | null
          updated_at: string
        }
        Insert: {
          company_address?: string | null
          company_name: string
          created_at?: string
          email: string
          establishment_id: string
          first_name: string
          id?: string
          is_activated?: boolean | null
          last_name: string
          phone?: string | null
          position?: string | null
          profile_photo_url?: string | null
          updated_at?: string
        }
        Update: {
          company_address?: string | null
          company_name?: string
          created_at?: string
          email?: string
          establishment_id?: string
          first_name?: string
          id?: string
          is_activated?: boolean | null
          last_name?: string
          phone?: string | null
          position?: string | null
          profile_photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
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
          expires_at?: string
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
        Relationships: [
          {
            foreignKeyName: "user_activation_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          invitation_sent_at: string | null
          is_activated: boolean | null
          last_name: string
          phone: string | null
          profile_photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          temp_password_hash: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          establishment_id: string
          first_name: string
          id?: string
          invitation_sent_at?: string | null
          is_activated?: boolean | null
          last_name: string
          phone?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          temp_password_hash?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          establishment_id?: string
          first_name?: string
          id?: string
          invitation_sent_at?: string | null
          is_activated?: boolean | null
          last_name?: string
          phone?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          temp_password_hash?: string | null
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
      virtual_class_materials: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          title: string
          uploaded_by: string | null
          virtual_class_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          title: string
          uploaded_by?: string | null
          virtual_class_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          title?: string
          uploaded_by?: string | null
          virtual_class_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_class_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_class_materials_virtual_class_id_fkey"
            columns: ["virtual_class_id"]
            isOneToOne: false
            referencedRelation: "virtual_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_class_participants: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          left_at: string | null
          status: string
          user_id: string
          virtual_class_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          status?: string
          user_id: string
          virtual_class_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          status?: string
          user_id?: string
          virtual_class_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_class_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_class_participants_virtual_class_id_fkey"
            columns: ["virtual_class_id"]
            isOneToOne: false
            referencedRelation: "virtual_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_classes: {
        Row: {
          created_at: string
          created_by: string | null
          current_participants: number
          date: string
          description: string | null
          end_time: string
          establishment_id: string
          formation_id: string | null
          id: string
          instructor_id: string | null
          materials: Json | null
          max_participants: number
          meeting_room_id: string | null
          module_id: string | null
          recording_enabled: boolean
          recording_url: string | null
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_participants?: number
          date: string
          description?: string | null
          end_time: string
          establishment_id: string
          formation_id?: string | null
          id?: string
          instructor_id?: string | null
          materials?: Json | null
          max_participants?: number
          meeting_room_id?: string | null
          module_id?: string | null
          recording_enabled?: boolean
          recording_url?: string | null
          start_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_participants?: number
          date?: string
          description?: string | null
          end_time?: string
          establishment_id?: string
          formation_id?: string | null
          id?: string
          instructor_id?: string | null
          materials?: Json | null
          max_participants?: number
          meeting_room_id?: string | null
          module_id?: string | null
          recording_enabled?: boolean
          recording_url?: string | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_classes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_classes_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_classes_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_classes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_classes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "formation_modules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      tutor_students_view: {
        Row: {
          assignment_active: boolean | null
          assignment_id: string | null
          company_name: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          contract_type: string | null
          formation_id: string | null
          formation_level: string | null
          formation_title: string | null
          is_activated: boolean | null
          is_active: boolean | null
          position: string | null
          student_email: string | null
          student_first_name: string | null
          student_id: string | null
          student_last_name: string | null
          tutor_email: string | null
          tutor_establishment_id: string | null
          tutor_first_name: string | null
          tutor_id: string | null
          tutor_last_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_formations_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_student_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation: {
        Args: { token_param: string; user_id_param: string }
        Returns: boolean
      }
      can_access_file: {
        Args: { _file_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_tutor_details: { Args: { p_tutor_id: string }; Returns: boolean }
      check_establishment_rate_limit: {
        Args: { p_email: string; p_ip_address: string }
        Returns: {
          allowed: boolean
          retry_after_seconds: number
        }[]
      }
      check_qr_rate_limit: {
        Args: { ip_address_param: string; user_id_param: string }
        Returns: {
          allowed: boolean
          remaining_attempts: number
          retry_after_seconds: number
        }[]
      }
      create_establishment_public: {
        Args: {
          p_address?: string
          p_director?: string
          p_email: string
          p_name: string
          p_number_of_instructors?: string
          p_number_of_students?: string
          p_phone?: string
          p_siret?: string
          p_type: string
          p_website?: string
        }
        Returns: string
      }
      expire_old_invitations: { Args: never; Returns: number }
      generate_attendance_qr_code: {
        Args: { attendance_sheet_id_param: string }
        Returns: string
      }
      generate_invitation_token: { Args: never; Returns: string }
      generate_signature_token: { Args: never; Returns: string }
      get_attendance_stats: {
        Args: { sheet_id: string }
        Returns: {
          attendance_rate: number
          total_absent: number
          total_expected: number
          total_present: number
          total_signed: number
        }[]
      }
      get_attendance_status: {
        Args: { current_status: string; sheet_date: string; start_time: string }
        Returns: string
      }
      get_current_user_establishment: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_event_stats: {
        Args: { event_id_param: string }
        Returns: {
          available_spots: number
          registered_count: number
        }[]
      }
      get_my_context: { Args: never; Returns: Json }
      get_tutor_apprentice_formations: { Args: never; Returns: Json }
      get_tutor_students: { Args: { _tutor_id: string }; Returns: string[] }
      is_attendance_open: {
        Args: { sheet_date: string; start_time: string }
        Returns: boolean
      }
      is_attendance_open_for_time: {
        Args: { sheet_date: string; start_time: string }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_instructor_for_formation: {
        Args: { _formation_id: string; _user_id: string }
        Returns: boolean
      }
      is_message_recipient: { Args: { msg_id: string }; Returns: boolean }
      log_attendance_action: {
        Args: {
          action_type: string
          ip_addr?: string
          meta?: Json
          sheet_id: string
          user_agent_val?: string
          user_id: string
        }
        Returns: undefined
      }
      log_establishment_creation_attempt: {
        Args: { p_email: string; p_ip_address: string; p_success: boolean }
        Returns: undefined
      }
      tutor_in_current_establishment: {
        Args: { _tutor_id: string }
        Returns: boolean
      }
      validate_invitation_token: {
        Args: { token_param: string }
        Returns: {
          email: string
          error_message: string
          establishment_id: string
          establishment_name: string
          first_name: string
          invitation_id: string
          is_valid: boolean
          last_name: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      validate_qr_code: {
        Args: { code_param: string }
        Returns: {
          date: string
          end_time: string
          formation_title: string
          is_valid: boolean
          sheet_id: string
          start_time: string
        }[]
      }
      validate_qr_code_secure: {
        Args: { code_param: string; user_id_param: string }
        Returns: {
          error_message: string
          formation_title: string
          is_valid: boolean
          sheet_id: string
        }[]
      }
      validate_signature_token: {
        Args: { token_param: string }
        Returns: {
          date: string
          end_time: string
          expires_at: string
          formation_id: string
          formation_title: string
          is_valid: boolean
          session_type: string
          sheet_id: string
          start_time: string
        }[]
      }
    }
    Enums: {
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      user_role:
        | "Admin"
        | "Formateur"
        | "Étudiant"
        | "AdminPrincipal"
        | "Tuteur"
      user_status: "Actif" | "Inactif" | "En attente"
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
      user_role: ["Admin", "Formateur", "Étudiant", "AdminPrincipal", "Tuteur"],
      user_status: ["Actif", "Inactif", "En attente"],
    },
  },
} as const
