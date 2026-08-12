"use client";

import { useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { getSupabase } from "@/lib/supabase-browser";

type Props={value:string;onChange:(html:string)=>void;onStatus:(msg:string)=>void};

export default function RichEditor({value,onChange,onStatus}:Props){
  const fileRef=useRef<HTMLInputElement>(null);
  const editor=useEditor({
    immediatelyRender:false,
    extensions:[StarterKit,Underline,Highlight,Link.configure({openOnClick:false}),Image,TextAlign.configure({types:["heading","paragraph"]}),Table.configure({resizable:true}),TableRow,TableHeader,TableCell],
    content:value||"<p></p>",
    editorProps:{attributes:{class:"tiptapEditorContent"}},
    onUpdate:({editor})=>onChange(editor.getHTML())
  });
  if(!editor)return null;
  async function upload(file:File){
    const s=getSupabase(); if(!s)return onStatus("Supabase is not configured.");
    const ext=file.name.split(".").pop()||"jpg"; const path=`${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    onStatus("Uploading image…");
    const {error}=await s.storage.from("blog-media").upload(path,file,{upsert:false,contentType:file.type});
    if(error)return onStatus(error.message);
    const {data}=s.storage.from("blog-media").getPublicUrl(path);
    editor.chain().focus().setImage({src:data.publicUrl,alt:file.name}).run(); onStatus("Image added.");
  }
  function askLink(){const url=window.prompt("Paste URL");if(url)editor.chain().focus().extendMarkRange("link").setLink({href:url}).run();}
  function insertFormula(){const formula=window.prompt("Enter formula (for example: M_r = φ F_y Z_x)");if(formula)editor.chain().focus().insertContent(`<p class="formulaBlock">${formula}</p>`).run();}
  return <div className="wordEditorShell">
    <div className="wordToolbar">
      <button type="button" onClick={()=>editor.chain().focus().undo().run()}>↶</button><button type="button" onClick={()=>editor.chain().focus().redo().run()}>↷</button>
      <select value={editor.isActive("heading",{level:1})?"h1":editor.isActive("heading",{level:2})?"h2":editor.isActive("heading",{level:3})?"h3":"p"} onChange={e=>{const v=e.target.value;if(v==="p")editor.chain().focus().setParagraph().run();else editor.chain().focus().toggleHeading({level:Number(v.slice(1)) as 1|2|3}).run();}}><option value="p">Normal</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option></select>
      <button type="button" className={editor.isActive("bold")?"active":""} onClick={()=>editor.chain().focus().toggleBold().run()}><b>B</b></button><button type="button" className={editor.isActive("italic")?"active":""} onClick={()=>editor.chain().focus().toggleItalic().run()}><i>I</i></button><button type="button" className={editor.isActive("underline")?"active":""} onClick={()=>editor.chain().focus().toggleUnderline().run()}><u>U</u></button><button type="button" onClick={()=>editor.chain().focus().toggleStrike().run()}><s>S</s></button><button type="button" onClick={()=>editor.chain().focus().toggleHighlight().run()}>Highlight</button>
      <button type="button" onClick={()=>editor.chain().focus().toggleBulletList().run()}>• List</button><button type="button" onClick={()=>editor.chain().focus().toggleOrderedList().run()}>1. List</button><button type="button" onClick={()=>editor.chain().focus().toggleBlockquote().run()}>❝ Quote</button><button type="button" onClick={()=>editor.chain().focus().toggleCodeBlock().run()}>{"</>"}</button>
      <button type="button" onClick={()=>editor.chain().focus().setTextAlign("left").run()}>Left</button><button type="button" onClick={()=>editor.chain().focus().setTextAlign("center").run()}>Center</button><button type="button" onClick={()=>editor.chain().focus().setTextAlign("right").run()}>Right</button>
      <button type="button" onClick={askLink}>🔗 Link</button><button type="button" onClick={()=>fileRef.current?.click()}>🖼 Upload Image</button><button type="button" onClick={()=>{const url=window.prompt("Image URL");if(url)editor.chain().focus().setImage({src:url}).run();}}>Image URL</button>
      <button type="button" onClick={()=>editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run()}>▦ Table</button><button type="button" onClick={()=>editor.chain().focus().addColumnAfter().run()}>+ Column</button><button type="button" onClick={()=>editor.chain().focus().addRowAfter().run()}>+ Row</button><button type="button" onClick={()=>editor.chain().focus().deleteTable().run()}>Delete Table</button><button type="button" onClick={insertFormula}>∑ Formula</button><button type="button" onClick={()=>editor.chain().focus().setHorizontalRule().run()}>— Divider</button>
    </div>
    <input ref={fileRef} type="file" accept="image/*" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.currentTarget.value="";}} />
    <EditorContent editor={editor} />
  </div>;
}
