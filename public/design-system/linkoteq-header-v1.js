/* Linkoteq shared header: classic two-tier navigation, mobile drawer. */
(()=>{"use strict";
if(customElements.get("linkoteq-header"))return;
const base="https://linkoteq.com";
const tools=[
 ["Snow Load","https://snow.linkoteq.com/","30-day Trial","/tools/snow-load"],
 ["W-Section","https://wsection.linkoteq.com/","30-day Trial","/tools/w-section"],
 ["3D Structural Model","https://3dmodel.linkoteq.com/","Beta","/tools/3d-model"],
];
const accountOrigin = "https://www.linkoteq.com";
const toolOrigins = tools.map(([, url]) => new URL(url).origin);
const contactLinks = [
 ["Contact Us", base + "/contact"],
 ["Customer Discovery", "https://discovery.linkoteq.com/"],
 ["Support", base + "/contact/support"],
];
const aboutLinks = [
 ["About Linko", base + "/about"],
 ["Team Timesheet", "https://timesheet.linkoteq.com/"],
];
const knowledgeLinks = [
 ["News & Updates", accountOrigin + "/news"],
 ["Documentation", base + "/knowledge/documentation"],
 ["Structural Labeling", base + "/structural-labeling"],
 ["RegionKit", base + "/structural-labeling/regionkit"],
];
const platformLinks = [
 ["AI Platform", base + "/#platform"],
 ["Roadmap", base + "/#roadmap"],
];

function connectToolAccount(header) {
 if (!toolOrigins.includes(window.location.origin)) return;

 const frame = document.createElement("iframe");
 frame.hidden = true;
 frame.tabIndex = -1;
 frame.title = "Linkoteq account session";
 frame.src = `${accountOrigin}/account/header-session`;

 function send(type) {
  frame.contentWindow?.postMessage({ type }, accountOrigin);
 }
 function receive(event) {
  if (event.origin !== accountOrigin || event.source !== frame.contentWindow) return;
  const data = event.data;
  if (data?.type === "linkoteq:header-ready") {
   send("linkoteq:header-connect");
  } else if (data?.type === "linkoteq:header-account" &&
    typeof data.name === "string" && typeof data.internalTools === "boolean") {
   header.toggleAttribute("internal-tools", Boolean(data.name) && data.internalTools);
   if (data.name) header.setAttribute("account-name", data.name);
   else header.removeAttribute("account-name");
  } else if (data?.type === "linkoteq:header-signout-result" && data.ok === false) {
   header.showSignOutError();
  }
 }
 const connect = () => send("linkoteq:header-connect");
 const signOut = () => {
  header.clearSignOutError();
  send("linkoteq:header-signout");
 };
 window.addEventListener("message", receive);
 window.addEventListener("pageshow", connect);
 frame.addEventListener("load", connect);
 header.addEventListener("linkoteq-signout", signOut);
 header.shadowRoot.append(frame);
 return () => {
  window.removeEventListener("message", receive);
  window.removeEventListener("pageshow", connect);
  header.removeEventListener("linkoteq-signout", signOut);
  frame.remove();
 };
}

class LinkoteqHeader extends HTMLElement{
static get observedAttributes(){return ["account-name","internal-tools"];}
attributeChangedCallback(name){if(name==="account-name")this.renderAccount();else this.updateToolLinks();}
connectedCallback(){if(this.shadowRoot){this.disconnectAccount=connectToolAccount(this);return;}const root=this.attachShadow({mode:"open"});
const style=document.createElement("style");style.textContent=`
:host{display:block;position:relative;z-index:1250;font-family:var(--linkoteq-header-font-body,Inter,system-ui,Arial,sans-serif);color:var(--linkoteq-header-ink,#17324a)}*{box-sizing:border-box}a{color:inherit;text-decoration:none}button{font:inherit;cursor:pointer}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid var(--linkoteq-header-accent,#15a5bb);outline-offset:3px}header{background:var(--linkoteq-header-surface,#fff);box-shadow:0 8px 24px #0715250a;border-bottom:1px solid var(--linkoteq-header-line,#dbe5ed)}.top{display:flex;align-items:center;gap:14px;min-height:72px;padding:8px 3vw}.brand{margin-right:auto;flex-shrink:0}.brand img{display:block;width:210px;max-width:100%;height:auto}.utility{display:flex;align-items:center;gap:clamp(12px,1.4vw,22px);font-size:14px;font-weight:650}.drop{position:relative}.drop>button{border:0;background:none;color:inherit;padding:12px 0;font-weight:650}.submenu{display:none;position:absolute;top:100%;left:0;min-width:210px;padding:9px;background:var(--linkoteq-header-surface,white);border:1px solid var(--linkoteq-header-line,#dbe5ed);border-radius:12px;box-shadow:0 15px 35px #102b4925;z-index:5}.drop:hover .submenu,.drop:focus-within .submenu{display:grid}.submenu a{display:block;padding:10px;border-radius:8px}.submenu a:hover{background:var(--linkoteq-header-sage,#edf5fa)}.account{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:650}.account button,.sign{border:0;border-radius:999px;background:var(--linkoteq-header-ink,#071525);color:white;padding:11px 17px;font-weight:750;white-space:nowrap}.sign-drop .submenu{left:auto;right:0}.second{min-height:46px;display:flex;align-items:center;justify-content:center;gap:clamp(20px,3vw,42px);padding:0 3vw;background:var(--linkoteq-header-paper,#f8fbfd);border-top:1px solid var(--linkoteq-header-line,#e7edf3);font-size:14px;font-weight:650}.second a:hover,.utility a:hover{text-decoration:underline}.menu-toggle,.mobile-name,.drawer{display:none}.tag{font-size:12px;color:var(--linkoteq-header-ink-soft,#476d8d);background:var(--linkoteq-header-sage,#edf5fb);border-radius:20px;padding:3px 9px;margin-left:auto}
@media(max-width:900px){.top{min-height:72px;padding:10px 18px;gap:8px}.brand{flex:0 1 auto;min-width:0}.brand img{width:210px;max-height:52px;object-fit:contain}.utility,.second,.account{display:none}.mobile-name{display:block;margin-left:auto;font-size:13px;font-weight:700;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mobile-name:empty{display:none}.menu-toggle{display:block;flex-shrink:0;border:1px solid var(--linkoteq-header-line,#d9e2e8);background:var(--linkoteq-header-surface,#fff);color:inherit;border-radius:13px;padding:12px 15px;font-weight:750}.sign-drop{display:block}.sign{padding:13px 18px}.drawer[open]{display:block;position:absolute;inset:100% 0 auto;max-height:calc(100dvh - var(--drawer-top, 73px));overflow-y:auto;overscroll-behavior-y:contain;touch-action:pan-y;padding:8px 5vw max(12px,env(safe-area-inset-bottom));background:var(--linkoteq-header-surface,#fff);border-block:1px solid var(--linkoteq-header-line,#e0e8ee);box-shadow:0 8px 24px #0715251a}
.drawer a,.drawer summary,.drawer .signout{display:flex;align-items:center;gap:10px;min-height:46px;padding:8px 10px;font-size:16px;font-weight:700}
.drawer a:hover,.drawer summary:hover{background:var(--linkoteq-header-sage,#edf5fa);border-radius:8px}
.drawer summary{justify-content:space-between;cursor:pointer;list-style:none}
.drawer summary::-webkit-details-marker{display:none}
.drawer summary::after{content:"";width:7px;height:7px;margin-right:4px;border:solid currentColor;border-width:0 2px 2px 0;transform:rotate(45deg)}
.drawer details[open]>summary::after{transform:rotate(225deg)}
.drawer-links{margin:0 0 4px 10px;padding-left:8px;border-left:2px solid var(--linkoteq-header-line,#e0e8ee)}
.drawer-links a{font-size:15px;font-weight:650}
.drawer .signout{width:100%;border:0;border-bottom:1px solid var(--linkoteq-header-line,#e0e8ee);background:var(--linkoteq-header-surface,#fff);color:var(--linkoteq-header-ink,#17324a);position:sticky;top:0;z-index:1}
.drawer .signout[hidden]{display:none}.sign-drop .submenu{right:0;left:auto}}
@media(max-width:460px){.top{padding:10px 12px;gap:6px}.brand img{width:150px}.mobile-name{max-width:90px;font-size:11px}.menu-toggle{padding:10px 12px}.sign{padding:11px 13px;font-size:13px}}
`;
const header=document.createElement("header");const top=document.createElement("div");top.className="top";const brand=document.createElement("a");brand.className="brand";brand.href=base+"/";brand.setAttribute("aria-label","Linkoteq home");const logo=document.createElement("img");logo.src=base+"/linko-logo-final.svg";logo.alt="LinkoTech Engineering Technology";brand.append(logo);top.append(brand);
const utility=document.createElement("nav");utility.className="utility";utility.setAttribute("aria-label","Company navigation");
const link=(label,url,parent)=>{const a=document.createElement("a");a.textContent=label;a.href=url;parent.append(a);return a};
const drop=(label,items,parent)=>{const box=document.createElement("div");box.className="drop";const btn=document.createElement("button");btn.type="button";btn.textContent=label+" ⌄";btn.setAttribute("aria-haspopup","true");const list=document.createElement("div");list.className="submenu";items.forEach(([name,url])=>link(name,url,list));box.append(btn,list);parent.append(box);return box};
link("Home", base + "/", utility);
drop("Contact", contactLinks, utility);
drop("About", aboutLinks, utility);
link("Pricing", base + "/pricing", utility);
const publicPreviews=this.hasAttribute("public-tool-previews");
const toolMenu=drop("Calculators",[],utility).querySelector(".submenu");
this.toolLinks=[];
const addToolLinks=(parent)=>{
 tools.forEach(([name,url,status,preview])=>{
  const anchor=link(name,url,parent);
  const badge=document.createElement("span");
  badge.className="tag";
  badge.textContent=status;
  anchor.append(" ",badge);
  if(publicPreviews || toolOrigins.includes(window.location.origin))this.toolLinks.push({anchor,url,preview:publicPreviews?preview:accountOrigin+preview});
 });
 if(publicPreviews)link("All engineering tools","/tools",parent);
};
addToolLinks(toolMenu);
top.append(utility);
const account=document.createElement("div");account.className="account";top.append(account);this.accountArea=account;
const mobileName=document.createElement("span");mobileName.className="mobile-name";mobileName.setAttribute("aria-live","polite");top.append(mobileName);this.mobileName=mobileName;
const toggle=document.createElement("button");toggle.className="menu-toggle";toggle.type="button";toggle.textContent="Menu ☰";toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-controls","linkoteq-mobile");top.append(toggle);
const signDrop=drop("Sign In",[["Employee Sign In",accountOrigin+"/blog/login"],["Client Sign In",base+"/customer-login"]],top);signDrop.classList.add("sign-drop");signDrop.querySelector("button").className="sign";this.signDrop=signDrop;
const second = document.createElement("nav");
second.className = "second";
second.setAttribute("aria-label", "Platform navigation");
link("Home", base + "/", second);
for (const [label, url] of platformLinks) link(label, url, second);
drop("Knowledge Center", knowledgeLinks, second);
link("Blog", base + "/blog", second);

const drawer = document.createElement("nav");
drawer.className = "drawer";
drawer.id = "linkoteq-mobile";
drawer.setAttribute("aria-label", "Mobile navigation");
const out = document.createElement("button");
out.type = "button";
out.className = "signout";
out.textContent = "Sign Out";
out.hidden = true;
out.addEventListener("click", () => this.dispatchEvent(new CustomEvent("linkoteq-signout", { bubbles: true })));
drawer.append(out);
this.mobileSignOut = out;

const drawerGroup = (label, items = []) => {
 const details = document.createElement("details");
 const summary = document.createElement("summary");
 summary.textContent = label;
 const list = document.createElement("div");
 list.className = "drawer-links";
 for (const [name, url] of items) link(name, url, list);
 details.append(summary, list);
 drawer.append(details);
 return list;
};
link("Home", base + "/", drawer);
const mobileToolLinks = drawerGroup("All Engineering Tools");
addToolLinks(mobileToolLinks);
if (!publicPreviews) link("Browse all tools", accountOrigin + "/tools", mobileToolLinks);
for (const [label, url] of platformLinks) link(label, url, drawer);
drawerGroup("Knowledge Center", knowledgeLinks);
link("Blog", base + "/blog", drawer);
link("Pricing", base + "/pricing", drawer);
drawerGroup("About", aboutLinks);
drawerGroup("Contact", contactLinks);
link("Client Sign In", base + "/customer-login", drawer);

const sizeDrawer = () => {
 drawer.style.setProperty("--drawer-top", `${Math.ceil(header.getBoundingClientRect().bottom)}px`);
};
const setDrawerOpen = (open) => {
 if (open) sizeDrawer();
 drawer.toggleAttribute("open", open);
 toggle.setAttribute("aria-expanded", String(open));
 toggle.textContent = open ? "Close ×" : "Menu ☰";
};
toggle.addEventListener("click", () => setDrawerOpen(!drawer.hasAttribute("open")));
new ResizeObserver(() => {
 if (drawer.hasAttribute("open")) sizeDrawer();
}).observe(top);
drawer.addEventListener("click", (event) => {
 if (event.target.closest("a")) {
  setDrawerOpen(false);
  toggle.focus();
 }
});
header.addEventListener("keydown", (event) => {
 if (event.key === "Escape" && drawer.hasAttribute("open")) {
  setDrawerOpen(false);
  toggle.focus();
 }
});
header.append(top, second, drawer);
this.signOutError=document.createElement("p");this.signOutError.setAttribute("role","alert");this.signOutError.hidden=true;header.append(this.signOutError);root.append(style,header);this.updateToolLinks();this.renderAccount();this.disconnectAccount=connectToolAccount(this);}
disconnectedCallback(){this.disconnectAccount?.();this.disconnectAccount=undefined;}
showSignOutError(){this.signOutError.textContent="Sign-out could not be completed. Please try again.";this.signOutError.hidden=false;}
clearSignOutError(){this.signOutError.textContent="";this.signOutError.hidden=true;}
updateToolLinks(){for(const {anchor,url,preview} of this.toolLinks??[])anchor.href=this.hasAttribute("internal-tools")?url:preview;}
renderAccount(){if(!this.accountArea)return;const name=this.getAttribute("account-name");this.accountArea.replaceChildren();this.mobileName.textContent=name?"Hi, "+name:"";this.mobileSignOut.hidden=!name;this.signDrop.style.display=name?"none":"";if(name){const label=document.createElement("span");label.textContent="Hello "+name;const out=document.createElement("button");out.type="button";out.textContent="Sign Out";out.addEventListener("click",()=>this.dispatchEvent(new CustomEvent("linkoteq-signout",{bubbles:true})));this.accountArea.append(label,out)}}
}
customElements.define("linkoteq-header",LinkoteqHeader);
})();
