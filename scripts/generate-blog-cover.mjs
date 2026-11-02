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
const topic=(title+" "+subtitle).toLowerCase();
const kind=/joist|bay|area.assignment/.test(topic)?"joist":/import|convert|etabs|sap2000|staad/.test(topic)?"import":/verification|section|capacity|steel design/.test(topic)?"verify":/load|force|deflection/.test(topic)?"load":"model";
const art={
 joist:`<g stroke="#8ce7fa" stroke-width="5" fill="none" stroke-linejoin="round"><path d="M680 245L865 155L1080 260L895 355Z M680 245V440L895 550V355M895 550L1080 445V260"/><path d="M710 260L925 365M745 243L960 348M780 225L995 330M815 208L1030 313" stroke="#f4bd68" stroke-width="4"/><path d="M710 260l25 -31 25 55 25 -31 25 56 25 -32 25 56 25 -30 25 57" stroke="#f4bd68" stroke-width="3"/></g>`,
 import:`<g fill="none" stroke-width="4" stroke-linejoin="round"><rect x="685" y="145" width="150" height="280" rx="12" stroke="#8ce7fa"/><rect x="945" y="145" width="150" height="280" rx="12" stroke="#f4bd68"/><path d="M730 205h60m-60 45h60m-60 45h60m-60 45h60M990 205h60m-60 45h60m-60 45h60m-60 45h60" stroke="#8ce7fa"/><path d="M845 285h90m-30 -25 30 25-30 25" stroke="#ffffff" stroke-width="7"/></g>`,
 verify:`<g fill="none" stroke="#8ce7fa" stroke-width="8" stroke-linejoin="round"><path d="M740 165h280v42H905v245h115v42H740v-42h115V207H740Z"/><circle cx="1040" cy="215" r="55" stroke="#f4bd68" stroke-width="6"/><path d="m1015 215 18 18 33 -42" stroke="#f4bd68" stroke-width="7"/></g>`,
 load:`<g fill="none" stroke="#8ce7fa" stroke-width="7"><path d="M700 450h380M730 450V260m320 190V260"/><path d="M790 150v170m-15 -20 15 20 15 -20M890 150v170m-15 -20 15 20 15 -20M990 150v170m-15 -20 15 20 15 -20" stroke="#f4bd68" stroke-width="6"/></g>`,
 model:`<g fill="none" stroke="#8ce7fa" stroke-width="5"><path d="M700 505V170L820 105L940 170V505M820 105V445M700 170L820 225L940 170M700 280L820 335L940 280M700 390L820 445L940 390M700 505L820 560L940 505M940 170L1050 230V555L940 505M940 280L1050 340M940 390L1050 450"/></g>`
};
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#07172b"/><stop offset="1" stop-color="#164b71"/></linearGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><g opacity=".14" stroke="#63d8ff" stroke-width="2">${Array.from({length:9},(_,i)=>`<path d="M${650+i*55} 80V555"/>`).join("")}</g>${art[kind]}<g font-family="Arial,Helvetica,sans-serif"><text x="65" y="91" font-size="30" fill="#6bdcf6" font-weight="bold">LINKOTEQ / ENGINEERING INSIGHTS</text>${titleSvg}<text x="65" y="${Math.min(subtitleY,545)}" font-size="22" fill="#b9e7f4">${escape(subtitle)}</text></g><rect x="65" y="570" width="320" height="7" fill="#58d7f5"/></svg>\n`;
const output=resolve("public/blog/covers",slug+".svg");await mkdir(resolve("public/blog/covers"),{recursive:true});await writeFile(output,svg,{flag:"wx"});console.log(output);
