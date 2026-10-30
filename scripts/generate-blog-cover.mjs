#!/usr/bin/env node
// Dependency-free, deterministic Linkoteq editorial SVG cover generator.
// Usage: node scripts/generate-blog-cover.mjs --slug article-slug --title "Article title" --subtitle "Short description"
// This creates an original vector illustration, not an OpenAI image API request.
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
const args=process.argv.slice(2);
const flag=n=>{const i=args.indexOf("--"+n);return i<0?"":args[i+1]||""};
const slug=flag("slug"), title=flag("title"), subtitle=flag("subtitle");
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!title||title.length>180||subtitle.length>180){console.error("Provide --slug, --title (max 180 chars), optional --subtitle (max 180 chars)");process.exit(2);}
const escape=s=>s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");
function lines(s,max=22,limit=4){const words=s.split(/\s+/);const out=[];let line="";for(const word of words){if((line+" "+word).trim().length>max&&line){out.push(line);line=word;}else line=(line+" "+word).trim();}if(line)out.push(line);if(out.length>limit)throw Error("Title too long for cover; shorten title");return out;}
const titleLines=lines(title.toUpperCase(),24,4);
const titleSvg=titleLines.map((s,i)=>`<text x="65" y="${200+i*66}" font-size="49" fill="#ffffff" font-weight="bold">${escape(s)}</text>`).join("");
const subtitleY=Math.max(475,225+titleLines.length*66);
const grid=Array.from({length:10},(_,i)=>`<path d="M${620+i*55} 70V560"/>`).join("")+Array.from({length:8},(_,i)=>`<path d="M610 ${95+i*64}H1170"/>`).join("");
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#07172b"/><stop offset="1" stop-color="#164b71"/></linearGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><g stroke="#63d8ff" stroke-width="2" opacity=".18">${grid}</g><g fill="none" stroke="#7de3f6" stroke-width="6" stroke-linejoin="round"><path d="M700 505V170L820 105L940 170V505M820 105V445M700 170L820 225L940 170M700 280L820 335L940 280M700 390L820 445L940 390M700 505L820 560L940 505M940 170L1050 230V555L940 505M940 280L1050 340M940 390L1050 450"/></g><g font-family="Arial,Helvetica,sans-serif"><text x="65" y="91" font-size="30" fill="#6bdcf6" font-weight="bold">LINKOTEQ / ENGINEERING INSIGHTS</text>${titleSvg}<text x="65" y="${Math.min(subtitleY,545)}" font-size="22" fill="#b9e7f4">${escape(subtitle)}</text></g><rect x="65" y="570" width="320" height="7" fill="#58d7f5"/></svg>\n`;
const output=resolve("public/blog/covers",slug+".svg");await mkdir(resolve("public/blog/covers"),{recursive:true});await writeFile(output,svg,{flag:"wx"});console.log(output);
