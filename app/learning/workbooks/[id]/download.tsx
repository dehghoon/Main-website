'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getSupabase } from '@/lib/supabase-browser';

export default function WorkbookDownload({ id, available }: { id: string; available: boolean }) {
  const [status, setStatus] = useState('');
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [busy, setBusy] = useState(false);

  async function download() {
    if (busy) return;
    setBusy(true);
    setStatus('');
    setNeedsSignIn(false);
    try {
      const session = await getSupabase()?.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token) {
        setNeedsSignIn(true);
        setStatus('Sign in with an authorized client account to download.');
        return;
      }
      const response = await fetch(`/api/learning/workbooks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      });
      if (response.status === 401) {
        setNeedsSignIn(true);
        setStatus('Your session has expired. Sign in again.');
        return;
      }
      if (response.status === 403) {
        setStatus('This account does not have workbook download access.');
        return;
      }
      const filename = response.headers.get('Content-Disposition')?.match(/filename="([a-z0-9.-]+)"/)?.[1];
      if (!response.ok || !filename) {
        setStatus('Download is currently unavailable.');
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setStatus('Workbook download started.');
    } catch {
      setStatus('Download failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!available) return <p>Workbook download is unavailable for this entry.</p>;

  return <>
    <button type="button" className="primaryButton" onClick={download} disabled={busy}>
      {busy ? 'Checking access…' : 'Download Excel'}
    </button>
    <p role="status">{status}</p>
    {needsSignIn && <Link href="/customer-login">Client Sign In</Link>}
  </>;
}
