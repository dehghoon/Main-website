'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase-browser';
import { levels } from '@/lib/learning/catalog';
import { articleFields, type LearningArticle, type LearningCategory, type LearningSubtopic } from '@/lib/learning/workspace-types';

const loginUrl = '/blog/login?returnTo=%2Flearning%23resources-workspace';
const emptyArticle: Omit<LearningArticle, 'id'> = {
  title: '', summary: '', body: '', category_id: '', subtopic_id: '',
  keywords: [], level: 'Intermediate', published_at: null,
};

export default function ResourcesWorkspace() {
  const [access, setAccess] = useState<
    'loading' | 'signed-out' | 'denied' | 'error' | { userId: string; canPublish: boolean }
  >('loading');

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      setAccess('error');
      return;
    }

    let revision = 0;
    let previousUser: string | undefined;
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      const userId = session?.user.id;
      if (event === 'TOKEN_REFRESHED' && userId === previousUser) return;
      const check = ++revision;
      if (!userId || userId !== previousUser) setAccess(userId ? 'loading' : 'signed-out');
      previousUser = userId;
      if (!userId) return;
      // Supabase authentication callbacks must return before starting another request.
      setTimeout(async () => {
        if (check !== revision) return;
        try {
          const [edit, publish] = await Promise.all([
            client.rpc('learning_can_edit'), client.rpc('learning_can_publish'),
          ]);
          if (check !== revision) return;
          if (edit.error || publish.error) setAccess('error');
          else if (!edit.data) setAccess('denied');
          else setAccess({ userId, canPublish: Boolean(publish.data) });
        } catch {
          if (check === revision) setAccess('error');
        }
      }, 0);
    });

    return () => {
      ++revision;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <section id="resources-workspace" aria-labelledby="resources-workspace-title" className="cmsDashboard learningWorkspace">
      <div className="dashboardTop">
        <h2 id="resources-workspace-title">Resources Workspace</h2>
        {typeof access === 'object' && <div className="cmsTopActions"><Link href="/blog/dashboard">Content Studio</Link></div>}
      </div>
      {access === 'loading' && <p role="status">Checking employee access…</p>}
      {access === 'signed-out' && <p><Link className="secondaryButton" href={loginUrl}>Employee Sign In</Link></p>}
      {access === 'denied' && <p role="status">Your account does not have employee access to this workspace. <Link href={loginUrl}>Employee Sign In</Link></p>}
      {access === 'error' && <p role="alert">Could not verify workspace access. Refresh to try again.</p>}
      {typeof access === 'object' && <WorkspaceEditor key={access.userId} canPublish={access.canPublish} />}
    </section>
  );
}

function WorkspaceEditor({ canPublish }: { canPublish: boolean }) {
  const router = useRouter();
  const [categories, setCategories] = useState<LearningCategory[]>([]);
  const [subtopics, setSubtopics] = useState<LearningSubtopic[]>([]);
  const [articles, setArticles] = useState<LearningArticle[]>([]);
  const [form, setForm] = useState(emptyArticle);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [keywords, setKeywords] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSubtopic, setNewSubtopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const visibleSubtopics = subtopics.filter((item) => item.category_id === form.category_id);

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;
    let active = true;
    async function load() {
      if (!client) return;
      try {
        const [topicRows, subtopicRows, articleRows] = await Promise.all([
          client.from('learning_categories').select('id,title').order('title'),
          client.from('learning_subtopics').select('id,category_id,title').order('title'),
          client.from('learning_articles').select(articleFields)
            .order('published_at', { ascending: false, nullsFirst: true }).order('title'),
        ]);
        if (!active) return;
        if (topicRows.error || subtopicRows.error || articleRows.error) {
          setMessage('Could not load the workspace. Refresh to try again.');
          return;
        }
        setCategories(topicRows.data);
        setSubtopics(subtopicRows.data);
        setArticles(articleRows.data);
        setReady(true);
      } catch {
        if (active) setMessage('Could not load the workspace. Refresh to try again.');
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  function openArticle(article?: LearningArticle) {
    setEditingId(article?.id ?? null);
    setForm(article ?? emptyArticle);
    setKeywords(article?.keywords.join(', ') ?? '');
    setPreview(false);
    setMessage('');
  }

  async function addCategory(event: FormEvent) {
    event.preventDefault();
    const client = getSupabase();
    if (!client || busy || !newCategory.trim()) return;
    setBusy(true);
    const { data, error } = await client.from('learning_categories')
      .insert({ title: newCategory.trim() }).select('id,title').single();
    setBusy(false);
    if (error) return setMessage(error.code === '23505' ? 'That topic already exists.' : 'Could not create the topic.');
    setCategories((items) => [...items, data].sort((a, b) => a.title.localeCompare(b.title)));
    setForm((value) => ({ ...value, category_id: data.id, subtopic_id: '' }));
    setNewCategory('');
    setMessage('Topic added. Add a subtopic to start writing.');
  }

  async function addSubtopic(event: FormEvent) {
    event.preventDefault();
    const client = getSupabase();
    if (!client || busy || !form.category_id || !newSubtopic.trim()) return;
    setBusy(true);
    const { data, error } = await client.from('learning_subtopics')
      .insert({ category_id: form.category_id, title: newSubtopic.trim() })
      .select('id,category_id,title').single();
    setBusy(false);
    if (error) return setMessage(error.code === '23505' ? 'That subtopic already exists.' : 'Could not create the subtopic.');
    setSubtopics((items) => [...items, data].sort((a, b) => a.title.localeCompare(b.title)));
    setForm((value) => ({ ...value, subtopic_id: data.id }));
    setNewSubtopic('');
    setMessage('Subtopic added.');
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabase();
    if (!client || busy) return;
    const publish = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'publish';
    const tags = [...new Set(keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean))];
    if (!form.title.trim() || !form.summary.trim() || !form.body.trim() || tags.length > 20) {
      return setMessage('Enter a title, summary and article body. Use up to 20 search keywords.');
    }
    const payload = {
      category_id: form.category_id, subtopic_id: form.subtopic_id, level: form.level,
      title: form.title.trim(), summary: form.summary.trim(), body: form.body.trim(), keywords: tags,
      published_at: form.published_at ?? (publish && canPublish ? new Date().toISOString() : null),
    };
    setBusy(true);
    const query = editingId
      ? client.from('learning_articles').update(payload).eq('id', editingId)
      : client.from('learning_articles').insert(payload);
    const { data, error } = await query.select(articleFields).single();
    setBusy(false);
    if (error) return setMessage('The article could not be saved. Check your access and try again.');
    setArticles((items) => [data, ...items.filter(({ id }) => id !== data.id)]);
    setForm(data);
    setEditingId(data.id);
    setMessage(data.published_at ? 'Article published in Resources & Learning.' : 'Draft saved.');
    if (data.published_at) router.refresh();
  }

  if (!ready) return <p role="status">{message || 'Loading topics and drafts…'}</p>;

  return (
    <>
        <p role="status">{message}</p>
        <div className="cmsLayout">
          <section className="dashboardPanel cmsEditor">
            <div className="cmsHeading">
              <h2>{editingId ? 'Edit article' : 'New article'}</h2>
              <button type="button" disabled={busy} onClick={() => openArticle()}>New article</button>
            </div>
            <form id="resource-article" className="authForm" onSubmit={save}>
              <fieldset disabled={busy} className="authForm">
                <label>Topic
                  <select required value={form.category_id} onChange={(event) => {
                    setForm({ ...form, category_id: event.target.value, subtopic_id: '' });
                  }}>
                    <option value="">Choose a topic</option>
                    {categories.map(({ id, title }) => <option key={id} value={id}>{title}</option>)}
                  </select>
                </label>
                <label>Subtopic
                  <select required value={form.subtopic_id} onChange={(event) => setForm({ ...form, subtopic_id: event.target.value })}>
                    <option value="">Choose a subtopic</option>
                    {visibleSubtopics.map(({ id, title }) => <option key={id} value={id}>{title}</option>)}
                  </select>
                </label>
                <label>Title<input required maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
                <label>Summary<textarea required maxLength={320} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></label>
                <label>Article body<textarea required rows={12} maxLength={50000} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></label>
                <label>Keywords<input value={keywords} maxLength={700} placeholder="e.g. SAP2000, load combinations" onChange={(event) => setKeywords(event.target.value)} /></label>
                <label>Difficulty<select value={form.level} onChange={(event) => {
                  const level = levels.find((item) => item === event.target.value);
                  if (level) setForm({ ...form, level });
                }}>{levels.map((level) => <option key={level}>{level}</option>)}</select></label>
                <div className="cmsButtonRow">
                  {!form.published_at && <button type="submit" value="draft">Save draft</button>}
                  {canPublish && <button type="submit" value="publish">{form.published_at ? 'Update published article' : 'Publish'}</button>}
                  <button type="button" onClick={() => setPreview((value) => !value)} aria-expanded={preview}>Preview</button>
                </div>
              </fieldset>
            </form>
            {preview && <article className="articlePreview">
              <h3>{form.title || 'Untitled article'}</h3>
              <p>{form.summary}</p>
              <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{form.body}</div>
            </article>}
          </section>

          <aside className="dashboardPanel cmsLibrary">
            <h2>Topics and subtopics</h2>
            <form className="authForm" onSubmit={addCategory}>
              <label>New topic<input value={newCategory} required maxLength={100} onChange={(event) => setNewCategory(event.target.value)} /></label>
              <button disabled={busy}>Add topic</button>
            </form>
            <form className="authForm" onSubmit={addSubtopic}>
              <label>New subtopic under {categories.find(({ id }) => id === form.category_id)?.title ?? 'the selected topic'}
                <input value={newSubtopic} required maxLength={150} onChange={(event) => setNewSubtopic(event.target.value)} />
              </label>
              <button disabled={busy || !form.category_id}>Add subtopic</button>
            </form>
            <h2>Articles</h2>
            {!articles.length && <p>No articles yet.</p>}
            <div className="postList">{articles.map((article) => (
              <article className="postRow" key={article.id}>
                <strong>{article.title}</strong>
                <div className="postActions">
                  {(!article.published_at || canPublish) && <button type="button" disabled={busy} onClick={() => openArticle(article)}>Edit</button>}
                  {article.published_at
                    ? <Link href={`/learning/resources/${article.id}`}>View published article</Link>
                    : <span>Draft</span>}
                </div>
              </article>
            ))}</div>
          </aside>
        </div>
    </>
  );
}
