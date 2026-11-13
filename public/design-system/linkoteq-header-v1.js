/* Linkoteq shared header: classic two-tier navigation, mobile drawer. */
(()=>{"use strict";
if(customElements.get("linkoteq-header"))return;
const base="https://linkoteq.com";
const tools=[["3D Structural Model","https://3dmodel.linkoteq.com/","Beta"],["W-Section","https://wsection.linkoteq.com/","Trial"],["Snow Load","https://snow.linkoteq.com/","Trial"]];
class LinkoteqHeader extends HTMLElement{
static get observedAttributes(){return ["account-name"];}
attributeChangedCallback(){this.renderAccount();}
connectedCallback(){if(this.shadowRoot)return;const root=this.attachShadow({mode:"open"});
const style=document.createElement("style");style.textContent=`
:host{display:block;position:relative;z-index:1250;font-family:Inter,system-ui,Arial,sans-serif;color:#17324a}*{box-sizing:border-box}a{color:inherit;text-decoration:none}button{font:inherit;cursor:pointer}a:focus-visible,button:focus-visible{outline:3px solid #15a5bb;outline-offset:3px}header{background:#fff;box-shadow:0 8px 24px #0715250a;border-bottom:1px solid #dbe5ed}.top{display:flex;align-items:center;gap:14px;min-height:72px;padding:8px 3vw}.brand{margin-right:auto;flex-shrink:0}.brand img{display:block;width:210px;max-width:100%;height:auto}.utility{display:flex;align-items:center;gap:clamp(12px,1.4vw,22px);font-size:14px;font-weight:650}.drop{position:relative}.drop>button{border:0;background:none;color:inherit;padding:12px 0;font-weight:650}.submenu{display:none;position:absolute;top:100%;left:0;min-width:210px;padding:9px;background:white;border:1px solid #dbe5ed;border-radius:12px;box-shadow:0 15px 35px #102b4925;z-index:5}.drop:hover .submenu,.drop:focus-within .submenu{display:grid}.submenu a{display:block;padding:10px;border-radius:8px}.submenu a:hover{background:#edf5fa}.account{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:650}.account button,.sign{border:0;border-radius:999px;background:#071525;color:white;padding:11px 17px;font-weight:750;white-space:nowrap}.sign-drop .submenu{left:auto;right:0}.second{min-height:46px;display:flex;align-items:center;justify-content:center;gap:clamp(20px,3vw,42px);padding:0 3vw;background:#f8fbfd;border-top:1px solid #e7edf3;font-size:14px;font-weight:650}.second a:hover,.utility a:hover{text-decoration:underline}.menu-toggle,.mobile-name,.drawer{display:none}.tag{font-size:12px;color:#476d8d;background:#edf5fb;border-radius:20px;padding:3px 9px;margin-left:auto}
@media(max-width:900px){.top{min-height:72px;padding:10px 18px;gap:8px}.brand img{width:210px}.utility,.second,.account{display:none}.mobile-name{display:block;margin-left:auto;font-size:13px;font-weight:700;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.menu-toggle{display:block;border:1px solid #d9e2e8;background:#fff;border-radius:13px;padding:12px 15px;font-weight:750}.sign-drop{display:block}.sign{padding:13px 18px}.drawer[open]{display:block;padding:22px 7vw 30px;border-top:1px solid #e0e8ee}.drawer a{display:flex;align-items:center;gap:12px;min-height:58px;font-size:19px;font-weight:700}.group{font-size:15px;color:#637c90;font-weight:800;letter-spacing:.05em;text-transform:uppercase;margin:24px 0 10px}.drawer .signout{border:0;background:none;padding:12px 0;font-size:18px;font-weight:700;color:#17324a}.sign-drop .submenu{right:0;left:auto}}
@media(max-width:460px){.top{padding:10px 12px;gap:6px}.brand img{width:150px}.mobile-name{max-width:90px;font-size:11px}.menu-toggle{padding:10px 12px}.sign{padding:11px 13px;font-size:13px}}
`;
const header=document.createElement("header");const top=document.createElement("div");top.className="top";const brand=document.createElement("a");brand.className="brand";brand.href=base+"/";brand.setAttribute("aria-label","Linkoteq home");const logo=document.createElement("img");logo.src=base+"/linko-logo-final.svg";logo.alt="LinkoTech Engineering Technology";brand.append(logo);top.append(brand);
const utility=document.createElement("nav");utility.className="utility";utility.setAttribute("aria-label","Company navigation");
const link=(label,url,parent)=>{const a=document.createElement("a");a.textContent=label;a.href=url;parent.append(a);return a};
const drop=(label,items,parent)=>{const box=document.createElement("div");box.className="drop";const btn=document.createElement("button");btn.type="button";btn.textContent=label+" ⌄";btn.setAttribute("aria-haspopup","true");const list=document.createElement("div");list.className="submenu";items.forEach(([name,url])=>link(name,url,list));box.append(btn,list);parent.append(box);return box};
link("Home",base+"/",utility);drop("Contact",[["Contact Us",base+"/contact"],["Customer Discovery","https://discovery.linkoteq.com/"],["Support",base+"/contact/support"]],utility);drop("About",[["About Linko",base+"/about"],["Team Timesheet","https://timesheet.linkoteq.com/"]],utility);link("Pricing",base+"/pricing",utility);drop("Calculators",tools.map(t=>[t[0],t[1]]),utility);top.append(utility);
const account=document.createElement("div");account.className="account";top.append(account);this.accountArea=account;
const mobileName=document.createElement("span");mobileName.className="mobile-name";mobileName.setAttribute("aria-live","polite");top.append(mobileName);this.mobileName=mobileName;
const toggle=document.createElement("button");toggle.className="menu-toggle";toggle.type="button";toggle.textContent="Menu ☰";toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-controls","linkoteq-mobile");top.append(toggle);
const signDrop=drop("Sign In",[["Employee Sign In","https://timesheet.linkoteq.com/"],["Client Sign In",base+"/customer-login"]],top);signDrop.classList.add("sign-drop");signDrop.querySelector("button").className="sign";this.signDrop=signDrop;
const second=document.createElement("nav");second.className="second";second.setAttribute("aria-label","Platform navigation");link("Home",base+"/",second);link("AI Platform",base+"/#platform",second);link("Roadmap",base+"/#roadmap",second);drop("Knowledge Center",[["Documentation",base+"/knowledge/documentation"],["Structural Labeling",base+"/structural-labeling"],["RegionKit",base+"/structural-labeling/regionkit"]],second);link("Blog",base+"/blog",second);
const drawer=document.createElement("nav");drawer.className="drawer";drawer.id="linkoteq-mobile";drawer.setAttribute("aria-label","Mobile navigation");link("Home",base+"/",drawer);const group=(name)=>{const e=document.createElement("div");e.className="group";e.textContent=name;drawer.append(e)};group("Engineering Software");tools.forEach(([name,url,status])=>{const a=link(name,url,drawer);const badge=document.createElement("span");badge.className="tag";badge.textContent=status;a.append(badge)});group("Explore");[["Blog",base+"/blog"],["Documentation",base+"/knowledge/documentation"],["Pricing",base+"/pricing"],["About",base+"/about"],["Contact",base+"/contact"],["Client Sign In",base+"/customer-login"]].forEach(([n,u])=>link(n,u,drawer));const out=document.createElement("button");out.className="signout";out.textContent="Sign Out";out.hidden=true;out.addEventListener("click",()=>this.dispatchEvent(new CustomEvent("linkoteq-signout",{bubbles:true})));drawer.append(out);this.mobileSignOut=out;
toggle.addEventListener("click",()=>{const open=!drawer.hasAttribute("open");drawer.toggleAttribute("open",open);toggle.setAttribute("aria-expanded",String(open));toggle.textContent=open?"Close ×":"Menu ☰"});header.append(top,second,drawer);root.append(style,header);this.renderAccount();
if(location.hostname!=="linkoteq.com"){
 const frame=document.createElement("iframe");
 frame.title="Linkoteq account status";frame.setAttribute("aria-hidden","true");
 frame.tabIndex=-1;frame.style.cssText="position:absolute;width:0;height:0;border:0;visibility:hidden";
 frame.src=base+"/header-session-bridge";
 this._authFrame=frame;
 const request=()=>{if(frame.contentWindow)frame.contentWindow.postMessage({type:"linkoteq:auth-request:v1"},base)};
 const receive=(event)=>{if(event.origin!==base||event.source!==frame.contentWindow||event.data?.type!=="linkoteq:auth-state:v1")return;
 const name=typeof event.data.name==="string"?event.data.name.trim().slice(0,80):"";
 if(name)this.setAttribute("account-name",name);else this.removeAttribute("account-name");
 };
 window.addEventListener("message",receive);
 frame.addEventListener("load",request);
 this._authCleanup=()=>window.removeEventListener("message",receive);
 this.addEventListener("linkoteq-signout",()=>{frame.contentWindow?.postMessage({type:"linkoteq:signout:v1"},base)});
 root.append(frame);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)request()});
 window.addEventListener("focus",request);
}
}
disconnectedCallback(){this._authCleanup?.();}
renderAccount(){if(!this.accountArea)return;const name=this.getAttribute("account-name");this.accountArea.replaceChildren();this.mobileName.textContent=name?"Hi, "+name:"";this.mobileSignOut.hidden=!name;this.signDrop.style.display=name?"none":"";if(name){const label=document.createElement("span");label.textContent="Hello "+name;const out=document.createElement("button");out.type="button";out.textContent="Sign Out";out.addEventListener("click",()=>this.dispatchEvent(new CustomEvent("linkoteq-signout",{bubbles:true})));this.accountArea.append(label,out)}}
}
customElements.define("linkoteq-header",LinkoteqHeader);
})();