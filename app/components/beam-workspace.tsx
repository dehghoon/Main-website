"use client";
import {useState,type ReactNode} from "react";
import styles from "./beam-workspace.module.css";
type Tab="model"|"input"|"results"|"report";
export default function BeamWorkspace({model,input,results,report}:{model:ReactNode;input:ReactNode;results:ReactNode;report:ReactNode}){
 const [tab,setTab]=useState<Tab>("input");const [desktop,setDesktop]=useState("workspace");
 return <div className={styles.workspace} data-desktop={desktop} data-mobile={tab}>
 <nav className={styles.desktopTabs} aria-label="Desktop workspace">{["workspace","report"].map(x=><button key={x} type="button" aria-pressed={desktop===x} onClick={()=>setDesktop(x)}>{x==="workspace"?"Model · Inputs · Results":"Calculation report"}</button>)}</nav>
 <nav className={styles.mobileTabs} aria-label="Mobile workspace">{(["model","input","results","report"] as Tab[]).map(x=><button key={x} type="button" aria-pressed={tab===x} onClick={()=>setTab(x)}>{x==="input"?"Inputs":x[0].toUpperCase()+x.slice(1)}</button>)}</nav>
 <div className={styles.grid}>
 <section className={styles.model} aria-label="Member model">{model}</section>
 <section className={styles.input} aria-label="Member inputs">{input}</section>
 <section className={styles.results} aria-label="Component results">{results||<div className={styles.empty}><h2>Results</h2><p>Enter project inputs and run the component checks. Results will appear here.</p></div>}</section>
 </div><section className={styles.report} aria-label="Calculation report">{report}</section>
 </div>;
}
export function BeamReport({title,result,inputs}:{title:string;result:unknown;inputs?:Record<string,unknown>|null}){
 function rows(value:unknown,prefix=""):Array<[string,string]>{
  if(value===null||value===undefined)return [];
  if(typeof value!=="object")return [[prefix,typeof value==="number"?value.toLocaleString("en-CA",{maximumFractionDigits:5}):String(value)]];
  return Object.entries(value).flatMap(([k,v])=>rows(v,prefix?`${prefix} / ${k}`:k));
 }
 return <div className={styles.calcReport}><div className={styles.actions}><button type="button" disabled={!result} onClick={()=>window.print()}>Print / Save PDF · Beta draft</button></div>
 <article className={styles.calcPage}><header className={styles.docHeader}><div><strong>Linkoteq</strong><span>Engineering Technology</span></div><div><strong>{title}</strong><span>Component calculation · Beta draft</span></div><div>Engineer review required<br/>Whole member: not checked</div></header>
 <p className={styles.notice}>Evaluation only. This report preserves the inputs and server response of the displayed calculation. A passing component is not a complete design approval.</p>
 {!result?<p>Run a calculation to prepare the report.</p>:<>{[["01 · Project inputs",inputs],["02 · Calculation results, factors and limitations",result]].map(([label,value])=><section key={String(label)}><h2>{String(label)}</h2><div className={styles.dataTable}>{rows(value).map(([k,v])=><div key={k}><span>{k.replaceAll("_"," ")}</span><strong>{v}</strong></div>)}</div></section>)}</>}
 </article></div>;
}
