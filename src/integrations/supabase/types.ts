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
      avatar_backgrounds: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_default: boolean
          name: string
          type: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_default?: boolean
          name: string
          type: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_default?: boolean
          name?: string
          type?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_backgrounds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "competitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_formations: {
        Row: {
          created_at: string
          created_by: string
          formation_data: Json
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          formation_data: Json
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          formation_data?: Json
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_formations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jersey_templates: {
        Row: {
          created_at: string
          created_by: string
          field_lines_thickness: number | null
          id: string
          jersey_numbers_shadow: boolean | null
          name: string
          template_data: Json
          updated_at: string
          use_player_avatars: boolean | null
        }
        Insert: {
          created_at?: string
          created_by: string
          field_lines_thickness?: number | null
          id?: string
          jersey_numbers_shadow?: boolean | null
          name: string
          template_data: Json
          updated_at?: string
          use_player_avatars?: boolean | null
        }
        Update: {
          created_at?: string
          created_by?: string
          field_lines_thickness?: number | null
          id?: string
          jersey_numbers_shadow?: boolean | null
          name?: string
          template_data?: Json
          updated_at?: string
          use_player_avatars?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "jersey_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          home_team: string
          id: string
          is_home: boolean
          location: string | null
          opponent: string
          time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          home_team: string
          id?: string
          is_home?: boolean
          location?: string | null
          opponent: string
          time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          home_team?: string
          id?: string
          is_home?: boolean
          location?: string | null
          opponent?: string
          time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          created_at: string
          id: string
          match_id: string | null
          player_id: string
          stat_type: Database["public"]["Enums"]["stat_type"]
          stat_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id?: string | null
          player_id: string
          stat_type: Database["public"]["Enums"]["stat_type"]
          stat_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string | null
          player_id?: string
          stat_type?: Database["public"]["Enums"]["stat_type"]
          stat_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      png_export_settings: {
        Row: {
          background_color: string
          border_color: string
          created_at: string
          created_by: string
          field_color: string
          id: string
          lines_color: string
          numbers_color: string
          updated_at: string
          use_player_avatars: boolean
        }
        Insert: {
          background_color?: string
          border_color?: string
          created_at?: string
          created_by: string
          field_color?: string
          id?: string
          lines_color?: string
          numbers_color?: string
          updated_at?: string
          use_player_avatars?: boolean
        }
        Update: {
          background_color?: string
          border_color?: string
          created_at?: string
          created_by?: string
          field_color?: string
          id?: string
          lines_color?: string
          numbers_color?: string
          updated_at?: string
          use_player_avatars?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "png_export_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          id: string
          jersey_number: number | null
          last_name: string | null
          position: Database["public"]["Enums"]["player_position"] | null
          preferred_foot: Database["public"]["Enums"]["foot_preference"] | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          jersey_number?: number | null
          last_name?: string | null
          position?: Database["public"]["Enums"]["player_position"] | null
          preferred_foot?: Database["public"]["Enums"]["foot_preference"] | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          jersey_number?: number | null
          last_name?: string | null
          position?: Database["public"]["Enums"]["player_position"] | null
          preferred_foot?: Database["public"]["Enums"]["foot_preference"] | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      training_attendance: {
        Row: {
          attended: boolean | null
          created_at: string
          id: string
          notes: string | null
          player_id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          attended?: boolean | null
          created_at?: string
          id?: string
          notes?: string | null
          player_id: string
          session_id: string
          updated_at?: string
        }
        Update: {
          attended?: boolean | null
          created_at?: string
          id?: string
          notes?: string | null
          player_id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      training_sessions: {
        Row: {
          allow_responses_until: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string
          id: string
          is_closed: boolean | null
          communication_type: 'party' | 'discord' | 'altro' | null
          communication_details: string | null
          max_participants: number | null
          public_link_token: string | null
          session_date: string
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_responses_until?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_closed?: boolean | null
          communication_type?: 'party' | 'discord' | 'altro' | null
          communication_details?: string | null
          max_participants?: number | null
          public_link_token?: string | null
          session_date: string
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          allow_responses_until?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_closed?: boolean | null
          communication_type?: 'party' | 'discord' | 'altro' | null
          communication_details?: string | null
          max_participants?: number | null
          public_link_token?: string | null
          session_date?: string
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trialists: {
        Row: {
          created_at: string
          date_of_birth: string | null
          email: string | null
          evaluation: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          position: Database["public"]["Enums"]["player_position"] | null
          status: Database["public"]["Enums"]["trialist_status"]
          trial_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          evaluation?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          position?: Database["public"]["Enums"]["player_position"] | null
          status?: Database["public"]["Enums"]["trialist_status"]
          trial_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          evaluation?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          position?: Database["public"]["Enums"]["player_position"] | null
          status?: Database["public"]["Enums"]["trialist_status"]
          trial_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_response_deadline: {
        Args: {
          session_date: string
          start_time: string
        }
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
      is_user_active: {
        Args: {
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "player" | "coach" | "admin" | "superadmin"
      competition_type: "league" | "cup" | "friendly" | "tournament"
      foot_preference: "left" | "right" | "both"
      player_position: 
        | "goalkeeper"
        | "center_back"
        | "left_back"
        | "right_back"
        | "defensive_midfielder"
        | "central_midfielder"
        | "attacking_midfielder"
        | "left_winger"
        | "right_winger"
        | "striker"
        | "center_forward"
      stat_type: "goals" | "assists" | "yellow_cards" | "red_cards" | "minutes_played"
      trialist_status: "pending" | "accepted" | "rejected" | "trial_scheduled"
      user_status: "active" | "inactive" | "pending"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}