import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type BlogPostRow = {
  id: string;
  title: string;
  excerpt: string | null;
  body: string;
  author_id: string;
  author_name: string;
  status: string;
  published_at: string | null;
  created_at: string;
};

type Database = {
  public: {
    Tables: {
      blog_posts: {
        Row: BlogPostRow;
        Insert: {
          id?: string;
          title: string;
          excerpt?: string | null;
          body: string;
          author_id: string;
          author_name: string;
          status: string;
          published_at?: string | null;
          created_at?: string;
        };
        Update: Partial<BlogPostRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let client: SupabaseClient<Database> | null = null;

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (!client) client = createClient<Database>(url, anonKey);
  return client;
}
