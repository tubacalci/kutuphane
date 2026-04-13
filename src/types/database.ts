export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          google_books_id: string | null;
          isbn: string | null;
          title: string;
          author: string | null;
          cover_image_url: string | null;
          page_count: number | null;
        };
        Insert: {
          id?: string;
          google_books_id?: string | null;
          isbn?: string | null;
          title: string;
          author?: string | null;
          cover_image_url?: string | null;
          page_count?: number | null;
        };
        Update: {
          id?: string;
          google_books_id?: string | null;
          isbn?: string | null;
          title?: string;
          author?: string | null;
          cover_image_url?: string | null;
          page_count?: number | null;
        };
        Relationships: [];
      };
      user_books: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          status: "to-read" | "reading" | "finished";
          current_page: number;
          rating: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          status: "to-read" | "reading" | "finished";
          current_page?: number;
          rating?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          status?: "to-read" | "reading" | "finished";
          current_page?: number;
          rating?: number | null;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
        };
        Update: {
          group_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
