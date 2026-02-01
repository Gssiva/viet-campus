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
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          priority: string
          target_audience: string
          target_department_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          target_audience: string
          target_department_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          target_audience?: string
          target_department_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_target_department_id_fkey"
            columns: ["target_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assignment_type: string
          created_at: string
          description: string | null
          due_date: string | null
          faculty_id: string
          file_url: string | null
          id: string
          is_ai_evaluation_enabled: boolean
          max_marks: number
          model_answer_url: string | null
          subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assignment_type: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          faculty_id: string
          file_url?: string | null
          id?: string
          is_ai_evaluation_enabled?: boolean
          max_marks?: number
          model_answer_url?: string | null
          subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assignment_type?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          faculty_id?: string
          file_url?: string | null
          id?: string
          is_ai_evaluation_enabled?: boolean
          max_marks?: number
          model_answer_url?: string | null
          subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          faculty_id: string
          id: string
          remarks: string | null
          status: string
          student_id: string
          subject_id: string
        }
        Insert: {
          created_at?: string
          date: string
          faculty_id: string
          id?: string
          remarks?: string | null
          status: string
          student_id: string
          subject_id: string
        }
        Update: {
          created_at?: string
          date?: string
          faculty_id?: string
          id?: string
          remarks?: string | null
          status?: string
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_notification_logs: {
        Row: {
          attendance_date: string
          id: string
          notification_sent_at: string
          parent_id: string | null
          status: string
          student_id: string
        }
        Insert: {
          attendance_date: string
          id?: string
          notification_sent_at?: string
          parent_id?: string | null
          status: string
          student_id: string
        }
        Update: {
          attendance_date?: string
          id?: string
          notification_sent_at?: string
          parent_id?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_notification_logs_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_notification_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          code: string
          created_at: string
          department_id: string
          description: string | null
          duration_years: number
          id: string
          name: string
          total_semesters: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          department_id: string
          description?: string | null
          duration_years?: number
          id?: string
          name: string
          total_semesters?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          department_id?: string
          description?: string | null
          duration_years?: number
          id?: string
          name?: string
          total_semesters?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          ai_feedback: string | null
          ai_similarity_score: number | null
          ai_suggested_marks: number | null
          created_at: string
          evaluated_at: string | null
          faculty_id: string | null
          feedback: string | null
          id: string
          is_ai_evaluated: boolean
          is_faculty_approved: boolean
          marks_obtained: number | null
          submission_id: string
          updated_at: string
        }
        Insert: {
          ai_feedback?: string | null
          ai_similarity_score?: number | null
          ai_suggested_marks?: number | null
          created_at?: string
          evaluated_at?: string | null
          faculty_id?: string | null
          feedback?: string | null
          id?: string
          is_ai_evaluated?: boolean
          is_faculty_approved?: boolean
          marks_obtained?: number | null
          submission_id: string
          updated_at?: string
        }
        Update: {
          ai_feedback?: string | null
          ai_similarity_score?: number | null
          ai_suggested_marks?: number | null
          created_at?: string
          evaluated_at?: string | null
          faculty_id?: string | null
          feedback?: string | null
          id?: string
          is_ai_evaluated?: boolean
          is_faculty_approved?: boolean
          marks_obtained?: number | null
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          academic_year: string
          created_at: string
          exam_type: string
          grade: string | null
          id: string
          marks_obtained: number | null
          max_marks: number
          semester: number
          student_id: string
          subject_id: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          exam_type: string
          grade?: string | null
          id?: string
          marks_obtained?: number | null
          max_marks: number
          semester: number
          student_id: string
          subject_id: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          exam_type?: string
          grade?: string | null
          id?: string
          marks_obtained?: number | null
          max_marks?: number
          semester?: number
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_roles: {
        Row: {
          assigned_at: string
          department_id: string | null
          id: string
          role: Database["public"]["Enums"]["faculty_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          department_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["faculty_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          department_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["faculty_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_roles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_subjects: {
        Row: {
          academic_year: string
          created_at: string
          faculty_id: string
          id: string
          is_active: boolean
          section: string | null
          subject_id: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          faculty_id: string
          id?: string
          is_active?: boolean
          section?: string | null
          subject_id: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          faculty_id?: string
          id?: string
          is_active?: boolean
          section?: string | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_subjects_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          amount_paid: number
          created_at: string
          fee_structure_id: string
          id: string
          payment_date: string
          payment_method: string | null
          receipt_number: string | null
          remarks: string | null
          status: string
          student_id: string
          transaction_id: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string
          fee_structure_id: string
          id?: string
          payment_date?: string
          payment_method?: string | null
          receipt_number?: string | null
          remarks?: string | null
          status?: string
          student_id: string
          transaction_id?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          fee_structure_id?: string
          id?: string
          payment_date?: string
          payment_method?: string | null
          receipt_number?: string | null
          remarks?: string | null
          status?: string
          student_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year: string
          amount: number
          course_id: string
          created_at: string
          description: string | null
          due_date: string | null
          fee_type: string
          id: string
        }
        Insert: {
          academic_year: string
          amount: number
          course_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          fee_type: string
          id?: string
        }
        Update: {
          academic_year?: string
          amount?: number
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          fee_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          is_sent: boolean
          message: string
          notification_type: string
          reference_id: string | null
          sent_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          is_sent?: boolean
          message: string
          notification_type: string
          reference_id?: string | null
          sent_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          is_sent?: boolean
          message?: string
          notification_type?: string
          reference_id?: string | null
          sent_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          batch_year: number | null
          course_id: string | null
          created_at: string
          current_semester: number | null
          department_id: string | null
          email: string
          employee_id: string | null
          first_name: string
          id: string
          is_active: boolean
          is_first_login: boolean
          last_name: string
          linked_student_id: string | null
          phone: string | null
          roll_number: string | null
          section: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          batch_year?: number | null
          course_id?: string | null
          created_at?: string
          current_semester?: number | null
          department_id?: string | null
          email: string
          employee_id?: string | null
          first_name: string
          id?: string
          is_active?: boolean
          is_first_login?: boolean
          last_name: string
          linked_student_id?: string | null
          phone?: string | null
          roll_number?: string | null
          section?: string | null
          updated_at?: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          batch_year?: number | null
          course_id?: string | null
          created_at?: string
          current_semester?: number | null
          department_id?: string | null
          email?: string
          employee_id?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          is_first_login?: boolean
          last_name?: string
          linked_student_id?: string | null
          phone?: string | null
          roll_number?: string | null
          section?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_linked_student_id_fkey"
            columns: ["linked_student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_materials: {
        Row: {
          created_at: string
          description: string | null
          faculty_id: string
          file_type: string | null
          file_url: string
          id: string
          subject_id: string
          title: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          faculty_id: string
          file_type?: string | null
          file_url: string
          id?: string
          subject_id: string
          title: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          faculty_id?: string
          file_type?: string | null
          file_url?: string
          id?: string
          subject_id?: string
          title?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          course_id: string
          created_at: string
          credits: number
          id: string
          is_lab: boolean
          name: string
          semester: number
          updated_at: string
        }
        Insert: {
          code: string
          course_id: string
          created_at?: string
          credits?: number
          id?: string
          is_lab?: boolean
          name: string
          semester: number
          updated_at?: string
        }
        Update: {
          code?: string
          course_id?: string
          created_at?: string
          credits?: number
          id?: string
          is_lab?: boolean
          name?: string
          semester?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string
          file_url: string | null
          id: string
          status: string
          student_id: string
          submitted_at: string
          submitted_text: string | null
        }
        Insert: {
          assignment_id: string
          file_url?: string | null
          id?: string
          status?: string
          student_id: string
          submitted_at?: string
          submitted_text?: string | null
        }
        Update: {
          assignment_id?: string
          file_url?: string | null
          id?: string
          status?: string
          student_id?: string
          submitted_at?: string
          submitted_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_slots: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          faculty_id: string | null
          id: string
          room_number: string | null
          slot_type: string
          start_time: string
          subject_id: string | null
          timetable_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          faculty_id?: string | null
          id?: string
          room_number?: string | null
          slot_type?: string
          start_time: string
          subject_id?: string | null
          timetable_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          faculty_id?: string | null
          id?: string
          room_number?: string | null
          slot_type?: string
          start_time?: string
          subject_id?: string | null
          timetable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_slots_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "timetables"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          academic_year: string
          course_id: string
          created_at: string
          generated_by: string | null
          id: string
          is_active: boolean
          section: string | null
          semester: number
          updated_at: string
        }
        Insert: {
          academic_year: string
          course_id: string
          created_at?: string
          generated_by?: string | null
          id?: string
          is_active?: boolean
          section?: string | null
          semester: number
          updated_at?: string
        }
        Update: {
          academic_year?: string
          course_id?: string
          created_at?: string
          generated_by?: string | null
          id?: string
          is_active?: boolean
          section?: string | null
          semester?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetables_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_enrollments: {
        Row: {
          academic_year: string
          created_at: string
          id: string
          is_active: boolean
          route_id: string
          stop_name: string
          student_id: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          id?: string
          is_active?: boolean
          route_id: string
          stop_name: string
          student_id: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          id?: string
          is_active?: boolean
          route_id?: string
          stop_name?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_enrollments_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_routes: {
        Row: {
          created_at: string
          fee_per_semester: number
          id: string
          is_active: boolean
          route_name: string
          route_number: string
          stops: Json
        }
        Insert: {
          created_at?: string
          fee_per_semester: number
          id?: string
          is_active?: boolean
          route_name: string
          route_number: string
          stops?: Json
        }
        Update: {
          created_at?: string
          fee_per_semester?: number
          id?: string
          is_active?: boolean
          route_name?: string
          route_number?: string
          stops?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_linked_student_id: { Args: { _user_id: string }; Returns: string }
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      get_user_course_id: { Args: { _user_id: string }; Returns: string }
      get_user_current_semester: { Args: { _user_id: string }; Returns: number }
      get_user_type: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_type"]
      }
      has_faculty_role: {
        Args: {
          _role: Database["public"]["Enums"]["faculty_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_hod: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      faculty_role:
        | "administration"
        | "accounts"
        | "hod"
        | "teaching"
        | "non_teaching"
      user_type: "student" | "faculty" | "parent"
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
      faculty_role: [
        "administration",
        "accounts",
        "hod",
        "teaching",
        "non_teaching",
      ],
      user_type: ["student", "faculty", "parent"],
    },
  },
} as const
