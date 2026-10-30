/** Convert untrusted plain text to the only HTML permitted for agent drafts. */
export function toSafeBlogHtml(input: string): string {
  if (/[<>]/.test(input)) throw new Error("Markup is not permitted");
  const escaped = input.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  return escaped.split(/\n\s*\n/).map(paragraph => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`).join("");
}
