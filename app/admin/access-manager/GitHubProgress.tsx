"use client";

import { useEffect, useState } from "react";
import styles from "./operations.module.css";

type Progress = {
  checkedAt: string;
  sha: string;
  message: string;
  committedAt: string | null;
  commitUrl: string;
  checks: { name: string; status: string; conclusion: string | null }[] | null;
  pullRequests: { number: number; title: string; state: string; url: string }[] | null;
};

const toronto = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/Toronto",
});

export default function GitHubProgress({ token, tool }: { token: string; tool: string }) {
  const [data, setData] = useState<Progress | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let running = false;
    async function refresh() {
      if (running || document.visibilityState === "hidden") return;
      running = true;
      setBusy(true);
      try {
        const response = await fetch(`/api/admin/access-manager/github-progress?tool=${encodeURIComponent(tool)}`, {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, cache: "no-store",
        });
        if (!response.ok) throw new Error("GitHub progress unavailable");
        const result: Progress = await response.json();
        if (!controller.signal.aborted) {
          setData(result);
          setError(false);
        }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        running = false;
        if (!controller.signal.aborted) setBusy(false);
      }
    }
    void refresh();
    const timer = window.setInterval(refresh, 300_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [token, tool, revision]);

  return <section className={styles.panel} aria-label="پیشرفت GitHub">
    <h4>پیشرفت از GitHub</h4>
    <p className={styles.muted}>به‌روزرسانی هر پنج دقیقه هنگام باز بودن صفحه. CI مربوط به همین کامیت است. تأیید مهندسی و استقرار جداگانه ثبت می‌شوند.</p>
    <button type="button" disabled={busy} onClick={() => setRevision(value => value + 1)}>بررسی دوباره</button>
    {!data && !error && <p role="status">در حال خواندن GitHub…</p>}
    {error && <p role="status">{data ? "به‌روزرسانی ناموفق بود. آخرین دریافت موفق در پایین است." : "دادهٔ GitHub در دسترس نیست. دسترسی مخزن یا محدودیت درخواست‌ها را بررسی کنید."}</p>}
    {data && <>
      <p>آخرین بررسی · {toronto.format(new Date(data.checkedAt))}</p>
      <p><a href={data.commitUrl}><bdi>{data.sha.slice(0, 7)} · {data.message}</bdi></a>
        {data.committedAt && <> · {toronto.format(new Date(data.committedAt))}</>}</p>
      <strong>PR مرتبط</strong>
      {data.pullRequests?.length ? <ul>{data.pullRequests.map(pr =>
        <li key={pr.number}><a href={pr.url}><bdi>#{pr.number} · {pr.title}</bdi></a> · <bdi>{pr.state}</bdi></li>)}</ul>
        : <p>{data.pullRequests === null ? "وضعیت PR در دسترس نیست." : "PR مرتبط با این کامیت ثبت نشده است."}</p>}
      <strong>بررسی‌های CI</strong>
      {data.checks?.length ? <ul>{data.checks.map((check, index) =>
        <li key={index}><bdi>{check.name} · {check.conclusion ?? check.status}</bdi></li>)}</ul>
        : <p>{data.checks === null ? "وضعیت CI در دسترس نیست." : "برای این کامیت بررسی CI پیدا نشد."}</p>}
    </>}
  </section>;
}
