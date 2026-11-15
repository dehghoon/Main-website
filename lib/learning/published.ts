import { type LearningResource } from './catalog';
import { articleFields, type LearningArticle, type LearningCategory, type LearningSubtopic } from './workspace-types';

export type PublishedLearningCard = LearningResource & {
  category: string;
  subtopic: string;
};

async function publicRows<Row>(table: string, query: Record<string, string>): Promise<Row[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const response = await fetch(`${url}/rest/v1/${table}?${new URLSearchParams(query)}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(3500),
    });
    return response.ok ? await response.json() as Row[] : [];
  } catch {
    return [];
  }
}

export async function publishedLearningCards(): Promise<PublishedLearningCard[]> {
  const [articles, categories, subtopics] = await Promise.all([
    publicRows<Omit<LearningArticle, 'body'>>('learning_articles', {
      select: 'id,category_id,subtopic_id,title,summary,keywords,level',
      published_at: 'not.is.null', order: 'published_at.desc,id.desc',
    }),
    publicRows<LearningCategory>('learning_categories', { select: 'id,title' }),
    publicRows<LearningSubtopic>('learning_subtopics', { select: 'id,category_id,title' }),
  ]);

  const categoryById = new Map(categories.map(({ id, title }) => [id, title]));
  const subtopicById = new Map(subtopics.map(({ id, title }) => [id, title]));
  return articles.flatMap((article) => {
    const category = categoryById.get(article.category_id);
    const subtopic = subtopicById.get(article.subtopic_id);
    return category && subtopic ? [{
      id: `resource-${article.id}`,
      title: article.title,
      summary: article.summary,
      level: article.level,
      keywords: article.keywords,
      references: [],
      guideHref: `/learning/resources/${article.id}`,
      category,
      subtopic,
    }] : [];
  });
}

export async function publishedLearningArticle(id: string) {
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) return null;
  const [article] = await publicRows<LearningArticle>('learning_articles', {
    select: articleFields, id: `eq.${id}`, published_at: 'not.is.null', limit: '1',
  });
  if (!article) return null;

  const [[category], [subtopic]] = await Promise.all([
    publicRows<LearningCategory>('learning_categories', { select: 'id,title', id: `eq.${article.category_id}` }),
    publicRows<LearningSubtopic>('learning_subtopics', { select: 'id,category_id,title', id: `eq.${article.subtopic_id}` }),
  ]);
  return { ...article, category: category?.title, subtopic: subtopic?.title };
}
