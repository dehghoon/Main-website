#!/usr/bin/env node
import './validate-blog-contract.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {blogSvg} from './editorial-media.mjs';
const args=process.argv.slice(2),flag=n=>{const i=args.indexOf('--'+n);return i<0?'':args[i+1]||'';};
const slug=flag('slug'),title=flag('title'),subtitle=flag('subtitle');
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!title||title.length>180||subtitle.length>180)throw Error('Provide safe slug, title and subtitle (max 180 characters)');
const body=flag('content-file')?await readFile(flag('content-file'),'utf8'):'';
const {svg,plan}=blogSvg({title,subtitle,body,visual:flag('visual'),scene:flag('scene')||undefined,seed:slug});
const dir=resolve('public/blog/covers');await mkdir(dir,{recursive:true});const output=resolve(dir,slug+'.svg');
await writeFile(output,svg);console.log(JSON.stringify({output,scene:plan.signature}));
