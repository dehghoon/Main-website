import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { LearningArticle, LearningCategory, LearningSubtopic } from './learning/workspace-types';

type Table<Row, Insert> = { Row: Row; Insert: Insert; Update: Partial<Insert>; Relationships: [] };

type BlogPostRow = {
  id: string; title: string; excerpt: string | null; body: string; author_id: string; author_name: string | null; show_author_name: boolean; status: string;
  published_at: string | null; created_at: string; slug: string | null; cover_image_url: string | null; video_url: string | null;
  cover_image_alt:string|null; cover_image_title:string|null; cover_image_caption:string|null; cover_image_meta:string|null; cover_image_position:string|null; cover_image_size:string|null;
  video_title:string|null; video_caption:string|null; video_thumbnail_url:string|null; video_meta:string|null;
  tags: string[]; seo_title: string | null; seo_description: string | null; calculator_name: string | null; calculator_url: string | null;
  linkedin_copy: string | null; scheduled_at: string | null;
};

type BlogPostInsert = {
  id?: string; title: string; excerpt?: string | null; body: string; author_id: string; author_name?: string | null; show_author_name?: boolean; status: string;
  published_at?: string | null; created_at?: string; slug?: string | null; cover_image_url?: string | null; video_url?: string | null;
  cover_image_alt?:string|null; cover_image_title?:string|null; cover_image_caption?:string|null; cover_image_meta?:string|null; cover_image_position?:string|null; cover_image_size?:string|null;
  video_title?:string|null; video_caption?:string|null; video_thumbnail_url?:string|null; video_meta?:string|null;
  tags?: string[]; seo_title?: string | null; seo_description?: string | null; calculator_name?: string | null; calculator_url?: string | null;
  linkedin_copy?: string | null; scheduled_at?: string | null;
};

type BlogAiSettingsRow = { id:string; brand_prompt:string; provider:string; model:string; updated_at:string; updated_by:string|null };
type BlogAiSettingsInsert = { id?:string; brand_prompt:string; provider?:string; model?:string; updated_at?:string; updated_by?:string|null };

type Database = { public: { Tables: {
  learning_categories: Table<LearningCategory, Omit<LearningCategory, 'id'>>;
  learning_subtopics: Table<LearningSubtopic, Omit<LearningSubtopic, 'id'>>;
  learning_articles: Table<LearningArticle, Omit<LearningArticle, 'id'>>;
  blog_posts: { Row: BlogPostRow; Insert: BlogPostInsert; Update: Partial<BlogPostRow>; Relationships: [] };
  blog_ai_settings: { Row: BlogAiSettingsRow; Insert: BlogAiSettingsInsert; Update: Partial<BlogAiSettingsRow>; Relationships: [] };
}; Views: Record<string, never>; Functions: {
  platform_my_permissions: { Args: Record<never, never>; Returns: string[] };
  platform_access_is_owner: { Args: Record<never, never>; Returns: boolean };
  learning_can_edit: { Args: Record<never, never>; Returns: boolean };
  learning_can_publish: { Args: Record<never, never>; Returns: boolean };
}; Enums: Record<string, never>; CompositeTypes: Record<string, never> } };

let client: SupabaseClient<Database> | null = null;
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (!client) client = createClient<Database>(url, anonKey);
  return client;
}
