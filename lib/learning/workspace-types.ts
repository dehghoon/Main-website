import type { Level } from './catalog';

export type LearningCategory = { id: string; title: string };
export type LearningSubtopic = LearningCategory & { category_id: string };
export type LearningArticle = {
  id: string;
  category_id: string;
  subtopic_id: string;
  title: string;
  summary: string;
  body: string;
  keywords: string[];
  level: Level;
  published_at: string | null;
};

export const articleFields = 'id,category_id,subtopic_id,title,summary,body,keywords,level,published_at';
