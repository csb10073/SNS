// Supabase MCP generate_typescript_types 결과 (스키마 변경 시 재생성)
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      comments: {
        Row: { content: string; created_at: string; id: string; post_id: string; updated_at: string; user_id: string };
        Insert: { content: string; created_at?: string; id?: string; post_id: string; updated_at?: string; user_id: string };
        Update: { content?: string; created_at?: string; id?: string; post_id?: string; updated_at?: string; user_id?: string };
        Relationships: [
          { foreignKeyName: "comments_post_id_fkey"; columns: ["post_id"]; isOneToOne: false; referencedRelation: "posts"; referencedColumns: ["id"] },
          { foreignKeyName: "comments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      likes: {
        Row: { created_at: string; post_id: string; user_id: string };
        Insert: { created_at?: string; post_id: string; user_id: string };
        Update: { created_at?: string; post_id?: string; user_id?: string };
        Relationships: [
          { foreignKeyName: "likes_post_id_fkey"; columns: ["post_id"]; isOneToOne: false; referencedRelation: "posts"; referencedColumns: ["id"] },
          { foreignKeyName: "likes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      posts: {
        Row: { content: string | null; created_at: string; id: string; image_url: string | null; updated_at: string; user_id: string };
        Insert: { content?: string | null; created_at?: string; id?: string; image_url?: string | null; updated_at?: string; user_id: string };
        Update: { content?: string | null; created_at?: string; id?: string; image_url?: string | null; updated_at?: string; user_id?: string };
        Relationships: [
          { foreignKeyName: "posts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      profiles: {
        Row: { avatar_url: string | null; bio: string | null; created_at: string; display_name: string | null; id: string; username: string };
        Insert: { avatar_url?: string | null; bio?: string | null; created_at?: string; display_name?: string | null; id: string; username: string };
        Update: { avatar_url?: string | null; bio?: string | null; created_at?: string; display_name?: string | null; id?: string; username?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      username_available: { Args: { p_username: string }; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
