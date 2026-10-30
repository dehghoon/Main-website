#!/usr/bin/env node
// Convert a Linkoteq blog SVG cover into a first-party JPEG for social channels.
// Usage: node scripts/render-blog-cover-jpeg.mjs article-slug
import {readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createCanvas,loadImage} from "@napi-rs/canvas";
const slug=process.argv[2]||"";
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){console.error("Provide a safe article slug");process.exit(2);}
const path=resolve("public/blog/covers",slug+".svg");
const raw=await readFile(path);
if(raw.length>1024*1024||!raw.toString("utf8").includes("<svg"))throw Error("Invalid or oversized SVG");
const image=await loadImage(raw);
const canvas=createCanvas(1200,630);
const ctx=canvas.getContext("2d");
ctx.fillStyle="#07172b";ctx.fillRect(0,0,1200,630);
ctx.drawImage(image,0,0,1200,630);
const jpeg=canvas.toBuffer("image/jpeg",90);
if(jpeg.length<1024||jpeg[0]!==255||jpeg[1]!==216)throw Error("JPEG encoding failed");
const output=resolve("public/blog/covers",slug+".jpg");
await writeFile(output,jpeg,{flag:"wx"});
console.log(JSON.stringify({output,bytes:jpeg.length,width:1200,height:630}));
