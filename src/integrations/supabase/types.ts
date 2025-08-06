export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_setup: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          is_completed: boolean | null
          setup_token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          is_completed?: boolean | null
          setup_token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          is_completed?: boolean | null
          setup_token?: string
        }
        Relationships: []
      }
      avatar_backgrounds: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      competitions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          start_date: string | null
          type: Database["public"]["Enums"]["competition_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          start_date?: string | null
          type: Database["public"]["Enums"]["competition_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string | null
          type?: Database["public"]["Enums"]["competition_type"]
          updated_at?: string
        }
        Relationships: []
      }
      custom_formations: {
        Row: {
          created_at: string
          created_by: string | null
          defenders: number
          forwards: number
          id: string
          midfielders: number
          name: string
          positions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          defenders?: number
          forwards?: number
          id?: string
          midfielders?: number
          name: string
          positions: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          defenders?: number
          forwards?: number
          id?: string
          midfielders?: number
          name?: string
          positions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      jersey_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string
          is_default: boolean | null
          name: string
          png_field_lines_color: string | null
          png_jersey_numbers_color: string | null
          png_name_box_color: string | null
          png_name_text_color: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_default?: boolean | null
          name: string
          png_field_lines_color?: string | null
          png_jersey_numbers_color?: string | null
          png_name_box_color?: string | null
          png_name_text_color?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_default?: boolean | null
          name?: string
          png_field_lines_color?: string | null
          png_jersey_numbers_color?: string | null
          png_name_box_color?: string | null
          png_name_text_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      match_attendance: {
        Row: {
          arrival_time: string | null
          created_at: string
          id: string
          match_id: string
          notes: string | null
          player_id: string
          status: string
        }
        Insert: {
          arrival_time?: string | null
          created_at?: string
          id?: string
          match_id: string
          notes?: string | null
          player_id: string
          status?: string
        }
        Update: {
          arrival_time?: string | null
          created_at?: string
          id?: string
          match_id?: string
          notes?: string | null
          player_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_attendance_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          competition_id: string | null
          created_at: string
          created_by: string | null
          home_away: string | null
          id: string
          location: string | null
          match_date: string
          match_time: string
          notes: string | null
          opponent_name: string
          opponent_score: number | null
          our_score: number | null
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
        }
        Insert: {
          competition_id?: string | null
          created_at?: string
          created_by?: string | null
          home_away?: string | null
          id?: string
          location?: string | null
          match_date: string
          match_time: string
          notes?: string | null
          opponent_name: string
          opponent_score?: number | null
          our_score?: number | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Update: {
          competition_id?: string | null
          created_at?: string
          created_by?: string | null
          home_away?: string | null
          id?: string
          location?: string | null
          match_date?: string
          match_time?: string
          notes?: string | null
          opponent_name?: string
          opponent_score?: number | null
          our_score?: number | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      player_statistics: {
        Row: {
          assists: number | null
          created_at: string
          goals: number | null
          id: string
          matches_played: number | null
          player_id: string
          red_cards: number | null
          season: string | null
          training_attendance_rate: number | null
          updated_at: string
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          created_at?: string
          goals?: number | null
          id?: string
          matches_played?: number | null
          player_id: string
          red_cards?: number | null
          season?: string | null
          training_attendance_rate?: number | null
          updated_at?: string
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          created_at?: string
          goals?: number | null
          id?: string
          matches_played?: number | null
          player_id?: string
          red_cards?: number | null
          season?: string | null
          training_attendance_rate?: number | null
          updated_at?: string
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_statistics_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          created_by: string | null
          ea_sport_id: string | null
          email: string | null
          esperienza: string | null
          first_name: string
          gaming_platform: string | null
          id: string
          is_captain: boolean | null
          jersey_number: number | null
          last_name: string
          notes: string | null
          phone: string | null
          platform_id: string | null
          position: string | null
          status: Database["public"]["Enums"]["player_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          ea_sport_id?: string | null
          email?: string | null
          esperienza?: string | null
          first_name: string
          gaming_platform?: string | null
          id?: string
          is_captain?: boolean | null
          jersey_number?: number | null
          last_name: string
          notes?: string | null
          phone?: string | null
          platform_id?: string | null
          position?: string | null
          status?: Database["public"]["Enums"]["player_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          ea_sport_id?: string | null
          email?: string | null
          esperienza?: string | null
          first_name?: string
          gaming_platform?: string | null
          id?: string
          is_captain?: boolean | null
          jersey_number?: number | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          platform_id?: string | null
          position?: string | null
          status?: Database["public"]["Enums"]["player_status"]
          updated_at?: string
        }
        Relationships: []
      }
      png_export_settings: {
        Row: {
          avatar_background_color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          field_lines_color: string | null
          field_lines_thickness: number | null
          id: string
          is_default: boolean | null
          jersey_numbers_color: string | null
          jersey_numbers_shadow: string | null
          name: string
          name_box_color: string | null
          name_text_color: string | null
          updated_at: string | null
          use_player_avatars: boolean | null
        }
        Insert: {
          avatar_background_color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          field_lines_color?: string | null
          field_lines_thickness?: number | null
          id?: string
          is_default?: boolean | null
          jersey_numbers_color?: string | null
          jersey_numbers_shadow?: string | null
          name: string
          name_box_color?: string | null
          name_text_color?: string | null
          updated_at?: string | null
          use_player_avatars?: boolean | null
        }
        Update: {
          avatar_background_color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          field_lines_color?: string | null
          field_lines_thickness?: number | null
          id?: string
          is_default?: boolean | null
          jersey_numbers_color?: string | null
          jersey_numbers_shadow?: string | null
          name?: string
          name_box_color?: string | null
          name_text_color?: string | null
          updated_at?: string | null
          use_player_avatars?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          status: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      training_attendance: {
        Row: {
          arrival_time: string | null
          coach_confirmation_status: string | null
          created_at: string
          id: string
          notes: string | null
          player_id: string
          registration_time: string | null
          self_registered: boolean | null
          session_id: string
          status: string
        }
        Insert: {
          arrival_time?: string | null
          coach_confirmation_status?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          player_id: string
          registration_time?: string | null
          self_registered?: boolean | null
          session_id: string
          status?: string
        }
        Update: {
          arrival_time?: string | null
          coach_confirmation_status?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          player_id?: string
          registration_time?: string | null
          self_registered?: boolean | null
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_convocati: {
        Row: {
          confirmed: boolean | null
          created_at: string | null
          id: string
          notes: string | null
          player_id: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          confirmed?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          player_id: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          confirmed?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          player_id?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_convocati_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_convocati_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_lineups: {
        Row: {
          created_at: string
          formation: string
          id: string
          players_data: Json | null
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          formation: string
          id?: string
          players_data?: Json | null
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          formation?: string
          id?: string
          players_data?: Json | null
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_lineups_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          allow_responses_until: string | null
          communication_details: string | null
          communication_type: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string
          id: string
          is_closed: boolean | null
          max_participants: number | null
          public_link_token: string | null
          session_date: string
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_responses_until?: string | null
          communication_details?: string | null
          communication_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_closed?: boolean | null
          max_participants?: number | null
          public_link_token?: string | null
          session_date: string
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          allow_responses_until?: string | null
          communication_details?: string | null
          communication_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_closed?: boolean | null
          max_participants?: number | null
          public_link_token?: string | null
          session_date?: string
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      trial_evaluations: {
        Row: {
          attitude_score: number | null
          created_at: string
          evaluation_date: string
          evaluator_id: string | null
          id: string
          notes: string | null
          overall_rating: number | null
          physical_score: number | null
          tactical_score: number | null
          technical_score: number | null
          trialist_id: string
        }
        Insert: {
          attitude_score?: number | null
          created_at?: string
          evaluation_date?: string
          evaluator_id?: string | null
          id?: string
          notes?: string | null
          overall_rating?: number | null
          physical_score?: number | null
          tactical_score?: number | null
          technical_score?: number | null
          trialist_id: string
        }
        Update: {
          attitude_score?: number | null
          created_at?: string
          evaluation_date?: string
          evaluator_id?: string | null
          id?: string
          notes?: string | null
          overall_rating?: number | null
          physical_score?: number | null
          tactical_score?: number | null
          technical_score?: number | null
          trialist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_evaluations_trialist_id_fkey"
            columns: ["trialist_id"]
            isOneToOne: false
            referencedRelation: "trialists"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_trial_evaluations: {
        Row: {
          id: string
          trialist_id: string
          session_id: string | null
          evaluation_date: string
          personality_ratings: number[]
          ability_ratings: number[]
          flexibility_ratings: number[]
          final_decision: Database["public"]["Enums"]["trial_status"]
          notes: string | null
          evaluator_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trialist_id: string
          session_id?: string | null
          evaluation_date?: string
          personality_ratings?: number[]
          ability_ratings?: number[]
          flexibility_ratings?: number[]
          final_decision?: Database["public"]["Enums"]["trial_status"]
          notes?: string | null
          evaluator_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trialist_id?: string
          session_id?: string | null
          evaluation_date?: string
          personality_ratings?: number[]
          ability_ratings?: number[]
          flexibility_ratings?: number[]
          final_decision?: Database["public"]["Enums"]["trial_status"]
          notes?: string | null
          evaluator_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_trial_evaluations_trialist_id_fkey"
            columns: ["trialist_id"]
            isOneToOne: false
            referencedRelation: "trialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_trial_evaluations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      trialists: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          created_by: string | null
          ea_sport_id: string | null
          email: string | null
          esperienza: string | null
          first_name: string
          gaming_platform: string | null
          id: string
          is_captain: boolean | null
          jersey_number: number | null
          last_name: string
          notes: string | null
          phone: string | null
          platform_id: string | null
          position: string | null
          status: Database["public"]["Enums"]["trial_status"]
          trial_start_date: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          ea_sport_id?: string | null
          email?: string | null
          esperienza?: string | null
          first_name: string
          gaming_platform?: string | null
          id?: string
          is_captain?: boolean | null
          jersey_number?: number | null
          last_name: string
          notes?: string | null
          phone?: string | null
          platform_id?: string | null
          position?: string | null
          status?: Database["public"]["Enums"]["trial_status"]
          trial_start_date?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          ea_sport_id?: string | null
          email?: string | null
          esperienza?: string | null
          first_name?: string
          gaming_platform?: string | null
          id?: string
          is_captain?: boolean | null
          jersey_number?: number | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          platform_id?: string | null
          position?: string | null
          status?: Database["public"]["Enums"]["trial_status"]
          trial_start_date?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_response_deadline: {
        Args: { session_date: string; start_time: string }
        Returns: string
      }
      complete_admin_setup: {
        Args: { _setup_token: string; _user_id: string }
        Returns: boolean
      }
      create_avatar_backgrounds_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_fake_user: {
        Args: { _email: string; _password: string; _username: string }
        Returns: string
      }
      generate_public_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      initialize_admin_setup: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_user_active: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "superadmin" | "admin" | "coach" | "player"
      competition_type: "championship" | "tournament" | "friendly"
      match_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "postponed"
      player_status: "active" | "inactive" | "injured" | "suspended"
      trial_status: "in_prova" | "promosso" | "archiviato"
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
      app_role: ["superadmin", "admin", "coach", "player"],
      competition_type: ["championship", "tournament", "friendly"],
      match_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "postponed",
      ],
      player_status: ["active", "inactive", "injured", "suspended"],
      trial_status: ["in_prova", "promosso", "archiviato"],
    },
  },
} as const
