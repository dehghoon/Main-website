'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase-browser';

export default function WorkbookDownload({ id, available }: { id: string; available: boolean }) {
  const [token, setToken] = useState<string | null>();
  const [authorized, setAuthorized] = useState<{ token: string; id: string }>();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const endpoint = `/api/learning/workbooks/${id}`;
  const canDownload = Boolean(token && authorized?.token === token && authorized.id === id);

  useEffect(() => {
    if (!available) return;
    const client = getSupabase();
    if (!client) {
      setToken(null);
      return;
    }
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);
    });
    return () => subscription.unsubscribe();
  }, [available]);

  useEffect(() => {
    setAuthorized(undefined);
    setStatus('');
    if (!available || !token) return;
    const controller = new AbortController();
    fetch(endpoint, {
      method: 'HEAD', headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store', signal: controller.signal,
    }).then((response) => {
      if (controller.signal.aborted) return;
      if (response.ok) setAuthorized({ token, id });
      else if (response.status === 401) setToken(null);
      else if (response.status === 403) setStatus('This account does not have workbook download access.');
      else setStatus('Download is currently unavailable.');
    }).catch(() => {
      if (!controller.signal.aborted) setStatus('Download is currently unavailable.');
    });
    return () => controller.abort();
  }, [available, endpoint, id, token]);

  async function download() {
    if (!token || !canDownload || busy) return;
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      });
      if (response.status === 401) {
        setToken(null);
        return;
      }
      if (response.status === 403) {
        setAuthorized(undefined);
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
    {canDownload && <button type="button" className="primaryButton" onClick={download} disabled={busy}>
      {busy ? 'Downloading…' : 'Download Excel'}
    </button>}
    <p role="status">{status || (token === undefined || (token && !canDownload) ? 'Checking download access…' : '')}</p>
    {token === null && <Link href="/customer-login">Sign in to check download access</Link>}
  </>;
}
