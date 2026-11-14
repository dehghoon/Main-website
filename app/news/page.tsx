import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getNewsFeed, platformLabels } from "@/lib/news-feed";
import { SITE_ORIGIN } from "@/lib/tool-discovery";
import styles from "./news.module.css";

const title = "News & Updates | Linkoteq";
const description = "Engineering, BIM and construction technology news from Linkoteq, with original sources and links to our social posts.";
const canonical = `${SITE_ORIGIN}/news`;
const dateFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "short", day: "numeric", timeZone: "America/Toronto" });

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { type: "website", title, description, url: canonical },
  twitter: { card: "summary", title, description },
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const cards = await getNewsFeed();

  return (
    <main className={styles.shell}>
      <header className={styles.intro}>
        <h1>News &amp; Updates</h1>
        <p>Read the latest on AI in engineering, BIM and construction, and find the original sources and Linkoteq posts.</p>
      </header>
      {cards === null ? (
        <p className={styles.state}>News is temporarily unavailable. Please try again later.</p>
      ) : cards.length === 0 ? (
        <p className={styles.state}>News will appear here as it is published.</p>
      ) : (
        <div className={styles.grid}>
          {cards.map(card => (
            <article className={styles.card} key={card.slug} id={card.slug}>
              <img className={styles.image} src={card.imageUrl} alt={card.imageAlt} loading="lazy" decoding="async" />
              <div className={styles.copy}>
                <time dateTime={card.date}>{dateFormat.format(new Date(card.date))}</time>
                <h2>{card.title}</h2>
                <p>{card.summary}</p>
                <div className={styles.links}>
                  <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer">Original source <ArrowUpRight size={15} aria-hidden="true" /></a>
                  {card.links.map(({ platform, url }) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer">
                      {platformLabels[platform]} <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
