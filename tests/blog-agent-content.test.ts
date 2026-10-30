import test from "node:test";
import assert from "node:assert/strict";
import { toSafeBlogHtml } from "../lib/blog-agent-content.ts";

test("escapes HTML-sensitive characters", () => {
  assert.equal(toSafeBlogHtml(`A & B "quote" 'single'`), "<p>A &amp; B &quot;quote&quot; &#39;single&#39;</p>");
});
test("preserves paragraphs and line breaks without raw HTML", () => {
  assert.equal(toSafeBlogHtml("first\nline\n\nsecond"), "<p>first<br>line</p><p>second</p>");
});
test("rejects tags and less-than or greater-than characters", () => {
  for (const text of ["<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "1 < 2", "x > y"]) {
    assert.throws(() => toSafeBlogHtml(text), /Markup is not permitted/);
  }
});
test("does not interpret entity input as markup", () => {
  assert.equal(toSafeBlogHtml("&lt;script&gt;"), "<p>&amp;lt;script&amp;gt;</p>");
});
