"use client";

import { useEffect, useRef } from "react";
import { getSupabase } from "@/lib/supabase-browser";

type Props={value:string;onChange:(html:string)=>void;onStatus:(msg:string)=>void};

export default function RichEditor({value,onChange,onStatus}:Props){
  const editorRef=useRef<HTMLDivElement>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const syncing=useRef(false);

  useEffect(()=>{
    const el=editorRef.current;
    if(!el||syncing.current)return;
    if(el.innerHTML!==value)el.innerHTML=value||"<p><br></p>";
  },[value]);

  function emit(){const el=editorRef.current;if(!el)return;syncing.current=true;onChange(el.innerHTML);queueMicrotask(()=>{syncing.current=false;});}
  function cmd(command:string,arg?:string){editorRef.current?.focus();document.execCommand(command,false,arg);emit();}
  function block(tag:string){cmd("formatBlock",tag);}
  function insertHtml(html:string){editorRef.current?.focus();document.execCommand("insertHTML",false,html);emit();}
  function askLink(){const url=window.prompt("Paste URL");if(url)cmd("createLink",url);}
  function insertFormula(){const f=window.prompt("Enter formula (example: M_r = φ F_y Z_x)");if(f)insertHtml(`<div class="formulaBlock">${f.replace(/[<>]/g,"")}</div><p><br></p>`);}
  function insertTable(){insertHtml('<table><thead><tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr></thead><tbody><tr><td>Value</td><td>Value</td><td>Value</td></tr><tr><td>Value</td><td>Value</td><td>Value</td></tr></tbody></table><p><br></p>');}
  function insertVideo(){const url=window.prompt("Paste YouTube/Vimeo/video URL");if(!url)return;insertHtml(`<p><a href="${url}" target="_blank" rel="noreferrer">Watch video</a></p>`);}

  async function upload(file:File){
    const s=getSupabase();if(!s)return onStatus("Supabase is not configured.");
    const ext=(file.name.split(".").pop()||"jpg").replace(/[^a-zA-Z0-9]/g,"");
    const path=`${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    onStatus("Uploading image…");
    const {error}=await s.storage.from("blog-media").upload(path,file,{upsert:false,contentType:file.type});
    if(error)return onStatus(error.message);
    const {data}=s.storage.from("blog-media").getPublicUrl(path);
    insertHtml(`<img src="${data.publicUrl}" alt="${file.name.replace(/[<>\"]/g,"")}" /><p><br></p>`);
    onStatus("Image added.");
  }

  return <div className="wordEditorShell">
    <div className="wordToolbar" role="toolbar" aria-label="Article formatting">
      <button type="button" onClick={()=>cmd("undo")}>↶</button><button type="button" onClick={()=>cmd("redo")}>↷</button>
      <select defaultValue="p" onChange={e=>block(e.target.value)}><option value="p">Normal</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option></select>
      <button type="button" onClick={()=>cmd("bold")}><b>B</b></button><button type="button" onClick={()=>cmd("italic")}><i>I</i></button><button type="button" onClick={()=>cmd("underline")}><u>U</u></button><button type="button" onClick={()=>cmd("strikeThrough")}><s>S</s></button>
      <button type="button" onClick={()=>cmd("insertUnorderedList")}>• List</button><button type="button" onClick={()=>cmd("insertOrderedList")}>1. List</button><button type="button" onClick={()=>block("blockquote")}>❝ Quote</button>
      <button type="button" onClick={()=>cmd("justifyLeft")}>Left</button><button type="button" onClick={()=>cmd("justifyCenter")}>Center</button><button type="button" onClick={()=>cmd("justifyRight")}>Right</button>
      <button type="button" onClick={askLink}>🔗 Link</button><button type="button" onClick={()=>fileRef.current?.click()}>🖼 Upload Image</button><button type="button" onClick={()=>{const url=window.prompt("Image URL");if(url)insertHtml(`<img src="${url}" alt="Article image" /><p><br></p>`);}}>Image URL</button>
      <button type="button" onClick={insertVideo}>▶ Video</button><button type="button" onClick={insertTable}>▦ Table</button><button type="button" onClick={insertFormula}>∑ Formula</button><button type="button" onClick={()=>insertHtml("<hr><p><br></p>")}>— Divider</button><button type="button" onClick={()=>insertHtml("<pre><code>code</code></pre><p><br></p>")}>{"</>"}</button>
    </div>
    <input ref={fileRef} type="file" accept="image/*" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.currentTarget.value="";}} />
    <div ref={editorRef} className="tiptapEditorContent" contentEditable suppressContentEditableWarning onInput={emit} onBlur={emit} data-placeholder="Start writing your article…" />
  </div>;
}
