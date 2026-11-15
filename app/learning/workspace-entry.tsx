'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase-browser';
import styles from './learning.module.css';

export default function WorkspaceEntry() {
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;

    let revision = 0;
    let accountId: string | undefined;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      const nextAccountId = session?.user.id;
      const check = ++revision;
      if (!nextAccountId || nextAccountId !== accountId) setCanEdit(false);
      accountId = nextAccountId;
      if (!nextAccountId) return;

      // Leave the auth callback before starting a request that uses the session.
      setTimeout(async () => {
        if (check !== revision) return;
        try {
          const { data, error } = await client.rpc('learning_can_edit');
          if (check === revision) setCanEdit(!error && data === true);
        } catch {
          if (check === revision) setCanEdit(false);
        }
      }, 0);
    });

    return () => {
      ++revision;
      subscription.unsubscribe();
    };
  }, []);

  if (!canEdit) return null;

  return (
    <section className={styles.workspaceEntry} aria-labelledby="resources-workspace">
      <div>
        <h2 id="resources-workspace">Resources Workspace</h2>
        <p>Write learning articles and organize them by topic and subtopic.</p>
      </div>
      <Link className="secondaryButton" href="/employee/resources">Open Resources Workspace</Link>
    </section>
  );
}
