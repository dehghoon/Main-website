"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Boxes, GitPullRequest, Layers3, Megaphone, Network } from "lucide-react";
import BlogReports from "./BlogReports";
import NewsReports from "./NewsReports";
import styles from "./operations.module.css";

type Tool = {
  tool: string;
  repository: string;
  commit: string | null;
  currentCore: string;
  targetCore: string;
  evidencePath: string | null;
};
type Snapshot = { inspectedAt: string; latestAvailableVersion: string; tools: Tool[] };
type View = "coordination" | "tools" | "marketing";

const steps = [
  ["GPT-1", "مشخصات مهندسی", "آیین‌نامه، فرضیات و معیار پذیرش"],
  ["GPT-2", "موتور و تست", "پیاده‌سازی محاسبات و شواهد عددی"],
  ["GPT-3", "اپ و یکپارچه‌سازی", "رابط، API و پیش‌نمایش"],
  ["GPT-3 / GPT-4", "ساخت نسخهٔ آزمایشی و تست", "پیش‌نمایش، نمونهٔ مهندسی مرجع و ثبت نتیجه"],
  ["GPT-5", "بازبینی امنیت", "یافته‌ها، اصلاح و تست مجدد"],
  ["GPT-4", "آمادگی انتشار", "تطبیق Core و مرور شواهد و بازگشت نسخه"],
  ["Owner", "تأیید انتشار", "ثبت تصمیم مالک برای نسخهٔ مشخص"],
  ["GPT-3 / GPT-4", "استقرار و آزمون نهایی", "استقرار مصوب و آزمون نماینده در محیط اصلی"],
] as const;

const toolEvidence: Record<string, { stage: number; observation: string; next: string; owner: string; statusPath?: string }> = {
  "3D Model": { stage: 2, observation: "مهاجرت ویرایشگر به Core 0.6 در مخزن ثبت شده است. گزارش پروژه، بررسی اجرایی پس از تغییر ویرایشگر را باز گذاشته است.", next: "تست واردکردن، ویرایش و خروجی گرفتن را روی نسخهٔ فعلی ثبت کن.", owner: "GPT-3 / GPT-4", statusPath: "project-status.json" },
  "SAP2000 Importer": { stage: 2, observation: "تحویل مشخصات GPT-1 به GPT-2 و فایل پیاده‌سازی تحویل به مدل در مخزن ثبت شده‌اند. هم‌ارزی تحلیلی نیاز به شاهد مستقل دارد.", next: "حفظ داده‌های منبع و نگاشت به 3D Model را روی فایل‌های مرجع بررسی کن.", owner: "GPT-2 / GPT-3", statusPath: "handoffs/gpt1-to-gpt2.md" },
  "Snow Load": { stage: 7, observation: "آزمون نمایندهٔ تولید برای Core 0.5 ثبت شده است. مرز 0.6 در کد دیده شده و به آزمون مجدد نیاز دارد.", next: "بار برف و فشار سطحی را در نسخهٔ 0.6 با مرجع مقایسه کن.", owner: "GPT-2 / GPT-4", statusPath: "project-status.json" },
  "Wind Load": { stage: 2, observation: "کاتالوگ اقلیمی در کد پین شده است. قرارداد بار خروجی برای Core هنوز در این مرور تأیید نشده است.", next: "سازگاری کاتالوگ و قرارداد خروجی بار را بررسی کن.", owner: "GPT-1 / GPT-2" },
  "Seismic": { stage: 2, observation: "تحویل استاتیکی نسخه‌دار در کد وجود دارد. نگاشت آن به قالب استاندارد Core تأیید نشده است.", next: "نگاشت و آزمون نمونهٔ تحویل استاتیکی به Core را ثبت کن.", owner: "GPT-2 / GPT-4" },
  "W-Section": { stage: 7, observation: "مخزن آزمون تولید را برای Core 0.5 گزارش می‌کند. سازگاری اجرای فعلی 0.6 جداگانه بررسی می‌شود.", next: "نتایج مقاطع مرجع و برابری خروجی Core 0.6 را دوباره بررسی کن.", owner: "GPT-2 / GPT-4", statusPath: "project-status.json" },
  "Wood Design": { stage: 1, observation: "کد ابزار مشاهده شده است. اتصال اجرایی استاندارد به Core در مرور مخزن پیدا نشد.", next: "مرز موتور و وابستگی‌های Core را مستند کن.", owner: "GPT-2 / GPT-4" },
  "Concrete Beam": { stage: -1, observation: "شاهدی از کد یا تست در مرور مخزن در دسترس نبود.", next: "دسترسی خواندن مخزن و شواهد مراحل را بررسی کن.", owner: "GPT-4" },
};

const core = "https://github.com/dehghoon/linkoteq-structural-core";
const canonical = `${core}/blob/c628d25982760936ff0e652047d0c1440d5a004b`;
const tabs = [
  { id: "coordination", label: "هماهنگی GPTها", icon: Network },
  { id: "tools", label: "توسعهٔ ابزارها", icon: Boxes },
  { id: "marketing", label: "بازاریابی", icon: Megaphone },
] as const;

export default function OperationsWorkspace({ token }: { token: string }) {
  const [view, setView] = useState<View>("coordination");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState("3D Model");
  const [marketing, setMarketing] = useState<"blog" | "news" | "video">("blog");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/access-manager/core", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      cache: "no-store",
    }).then(async response => {
      if (!response.ok) throw new Error("Evidence unavailable");
      const data = await response.json();
      if (!controller.signal.aborted) setSnapshot(data.snapshot);
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [token]);

  const tool = snapshot?.tools.find(item => item.tool === selected);
  const evidence = toolEvidence[selected];
  return <section className={styles.workspace} dir="rtl" lang="fa" aria-label="محیط کاری لینکوتک">
    <header className={styles.hero}>
      <div className={styles.heroIcon}><Layers3 aria-hidden="true" /></div>
      <div><span>LINKOTEQ COMMAND CENTER</span><h1>محیط کاری لینکوتک</h1>
        <p>هماهنگی عامل‌ها، توسعهٔ ابزارهای مهندسی و بازاریابی</p></div>
    </header>

    <nav className={styles.tabs} aria-label="نماهای محیط کاری">
      {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>
        <Icon size={18} aria-hidden="true" />{label}
      </button>)}
    </nav>

    {view === "coordination" && <>
      <div className={styles.panel}>
        <div className={styles.title}><Network aria-hidden="true" /><h2>نقشهٔ تحویل کار بین GPTها</h2></div>
        <div className={styles.orchestrator}><b dir="ltr">GPT-4</b><div><strong>هماهنگ‌کننده</strong>
          <p>وابستگی‌ها و نسخهٔ Core را تطبیق می‌دهد، مسئول مرحلهٔ بعد را مشخص می‌کند و شواهد تست، امنیت و استقرار را جداگانه بررسی می‌کند.</p></div></div>
        <ol className={styles.flow}>{steps.map(([agent, name, output]) => <li key={name}>
          <span className={styles.agent} dir="ltr">{agent}</span><strong>{name}</strong><small>{output}</small>
        </li>)}</ol>
        <div className={styles.aux}>
          <p><b dir="ltr">GPT-7 → GPT-6 → GPT-3</b><br />شواهد تشخیص → بازسازی و اعتبارسنجی هندسه → اتصال به برنامه</p>
          <p><b dir="ltr">GPT-4 ↔ GPT-5</b><br />درخواست بازبینی امنیت → ارجاع اصلاح → بررسی مجدد</p>
          <p><b dir="ltr">GPT-4 → GPT-8</b><br />شواهد قابلیت و نسخهٔ تأییدشده برای تهیهٔ محتوا</p>
        </div>
        <a href={`${canonical}/orchestration/AGENT_HANDOFF_WORKFLOW.md`}>قرارداد تحویل کار در GitHub <ArrowUpRight size={15} /></a>
      </div>
      <div className={styles.panel}>
        <div className={styles.title}><GitPullRequest aria-hidden="true" /><h2>پیگیری هماهنگی از روی شواهد</h2></div>
        <div className={styles.aux}>
          <div><b>Importer · تحویل مشخصات</b><p>تحویل GPT-1 به GPT-2 مستند شده. شاهد قدیمی است و از آن وضعیت اجرای فعلی استنباط نمی‌شود.</p><a href="https://github.com/dehghoon/linkoteq-structural-importer/blob/main/handoffs/gpt1-to-gpt2.md">پروندهٔ تحویل در GitHub</a></div>
          <div><b>Core · تطبیق نسخه</b><p>{snapshot ? <span dir="ltr">{snapshot.latestAvailableVersion}</span> : "نسخه از سوابق Core خوانده می‌شود."} · ماتریس مهاجرت و موانع هر ابزار</p><a href={`${canonical}/orchestration/core-v06-migration/matrix-2026-11-13.md`}>ماتریس مهاجرت</a></div>
          <div><b>پروندهٔ هر ابزار</b><p>شاهد ثبت‌شده، بازبینی بعدی و نقش مسئول را در نمای توسعه ببینید.</p><button type="button" onClick={() => setView("tools")}>باز کردن توسعهٔ ابزارها</button></div>
        </div>
      </div>
    </>}

    {view === "tools" && <div className={styles.panel}>
      <div className={styles.title}><Boxes aria-hidden="true" /><h2>مراحل توسعهٔ ابزارها</h2></div>
      {failed ? <p role="alert">سوابق مخزن در دسترس نیست. صفحه را دوباره بارگذاری کنید.</p> : !snapshot ? <p role="status">در حال خواندن سوابق ابزارها…</p> : <>
        <p className={styles.muted}>نمای شواهد مخزن تا <bdi>{snapshot.inspectedAt}</bdi>. مرحلهٔ برجسته محل شاهد ثبت‌شده را نشان می‌دهد. نتیجهٔ تست آزمایشی، تأیید مالک و آزمون محیط اصلی جداگانه ثبت می‌شوند.</p>
        <div className={styles.toolPicker} aria-label="انتخاب ابزار">
          {snapshot.tools.map(item => <button key={item.tool} type="button" dir="ltr" aria-pressed={selected === item.tool} onClick={() => setSelected(item.tool)}>{item.tool}</button>)}
        </div>
        {tool && evidence && <article className={styles.record}>
          <div className={styles.recordTop}><h3 dir="ltr">{tool.tool}</h3><a dir="ltr" href={`https://github.com/${tool.repository}`}>GitHub <ArrowUpRight size={15}/></a></div>
          <ol className={styles.flow}>{steps.map(([agent, name], index) => <li key={name} data-evidence={evidence.stage === index}>
            <span className={styles.agent} dir="ltr">{agent}</span><strong>{name}</strong><small>{evidence.stage === index ? "شاهد ثبت‌شده" : "نیازمند بررسی این مرحله"}</small>
          </li>)}</ol>
          <p>{evidence.observation}</p>
          <dl className={styles.facts}>
            <div><dt>مرز فعلی Core</dt><dd dir="ltr">{tool.currentCore}</dd></div>
            <div><dt>هدف مهاجرت</dt><dd dir="ltr">{tool.targetCore}</dd></div>
            <div><dt>مسئول پیشنهادی بازبینی</dt><dd dir="ltr">{evidence.owner}</dd></div>
          </dl>
          <p className={styles.next}><strong>اقدام بعدی</strong><br />{evidence.next}</p>
          <div className={styles.links}>
            {tool.commit && tool.evidencePath && <a href={`https://github.com/${tool.repository}/blob/${tool.commit}/${tool.evidencePath}`}>شاهد کد · <bdi>{tool.commit.slice(0, 7)}</bdi></a>}
            {evidence.statusPath && <a href={`https://github.com/${tool.repository}/blob/main/${evidence.statusPath}`}>پروندهٔ وضعیت یا تحویل</a>}
          </div>
        </article>}
      </>}
    </div>}

    {view === "marketing" && <div className={styles.panel}>
      <div className={styles.title}><Megaphone aria-hidden="true" /><h2>گردش‌کار بازاریابی <bdi>GPT-8</bdi></h2></div>
      <div className={styles.toolPicker} aria-label="انتخاب گردش‌کار بازاریابی">
        <button type="button" aria-pressed={marketing === "blog"} onClick={() => setMarketing("blog")}>وبلاگ و شبکه‌های اجتماعی</button>
        <button type="button" aria-pressed={marketing === "news"} onClick={() => setMarketing("news")}>اخبار فناوری</button>
        <button type="button" aria-pressed={marketing === "video"} onClick={() => setMarketing("video")}>ویدیو و آموزش</button>
      </div>
      {marketing === "blog" && <>
        <ol className={styles.flow}>{["پیش‌نویس · دوشنبه و چهارشنبه ۹ صبح تورنتو", "بازبینی و انتشار دستی توسط مالک", "صف شبکه‌های اجتماعی · سه ساعت پس از انتشار", "Windsor.ai · بررسی نتیجه و لینک هر شبکه"].map(item => <li key={item}>{item}</li>)}</ol>
        <div dir="ltr" lang="en" className={styles.report}><BlogReports token={token}/></div>
      </>}
      {marketing === "news" && <>
        <ol className={styles.flow}>{["خبر و منبع اولیه", "پیش‌نویس کپشن و طرح تصویر", "بازبینی و دستور انتشار مالک", "ثبت لینک پست و ویدیو"].map(item => <li key={item}>{item}</li>)}</ol>
        <div dir="ltr" lang="en" className={styles.report}><NewsReports token={token}/></div>
      </>}
      {marketing === "video" && <>
        <ol className={styles.flow}>{["انتخاب موضوع و تهیهٔ سناریو", "تحویل سناریو به Muse / Google Flow", "بازبینی پیش‌نمایش", "ثبت لینک خروجی یا آموزش"].map(item => <li key={item}>{item}</li>)}</ol>
        <p>وضعیت اتصال: اجرای خودکار Muse و Flow در این محیط تأیید نشده است. لینک‌های ثبت‌شدهٔ ویدیو در بخش اخبار قابل مشاهده‌اند.</p>
        <button type="button" onClick={() => setMarketing("news")}>نمایش لینک‌های ویدیو در اخبار</button>
      </>}
      <a href={`${canonical}/knowledge/gpt8/SCHEDULE_AND_APPROVALS.md`}>تقویم و قواعد انتشار <ArrowUpRight size={15} /></a>
    </div>}
  </section>;
}
