/* Linkoteq canonical navigation v1.0.0. Framework-neutral; one source for all apps. */
(()=>{"use strict";
const base="https://linkoteq.com";
const tools=[["3D Structural Model","https://3dmodel.linkoteq.com/","Beta"],["W-Section","https://wsection.linkoteq.com/","Trial"],["Snow Load","https://snow.linkoteq.com/","Trial"]];
const links=[["Home",base+"/"],["Pricing",base+"/pricing"],["Knowledge Center",base+"/knowledge/documentation"],["Blog",base+"/blog"],["Contact",base+"/contact"],["Employee Sign In","https://timesheet.linkoteq.com/"],["Client Plans & Access",base+"/pricing"]];
class LinkoteqHeader extends HTMLElement{
 static get observedAttributes(){return ["account-name"];}
 attributeChangedCallback(){this.updateAccount();}
 updateAccount(){if(!this.accountArea)return;const name=this.getAttribute("account-name");this.accountArea.replaceChildren();if(this.mobileAccount){this.mobileAccount.textContent=name?"Hi, "+name:"";if(this.mobileSignOut)this.mobileSignOut.hidden=!name;}if(name){const label=document.createElement("span");label.textContent="Hello "+name;const button=document.createElement("button");button.type="button";button.textContent="Sign Out";button.addEventListener("click",()=>this.dispatchEvent(new CustomEvent("linkoteq-signout",{bubbles:true})));this.accountArea.append(label,button)}else{const a=document.createElement("a");a.href=base+"/pricing";a.textContent="Client Plans & Access";this.accountArea.append(a)}}
 connectedCallback(){
  if(this.shadowRoot)return;
  const root=this.attachShadow({mode:"open"});
  const style=document.createElement("style");
  style.textContent=`:host{display:block;position:relative;z-index:1250;font-family:Inter,system-ui,Arial,sans-serif;color:#102b49}*{box-sizing:border-box}header{background:#fff;border-bottom:1px solid #dce6ee;box-shadow:0 4px 18px #102b4912}nav{display:flex;align-items:center;flex-wrap:wrap;gap:0 18px;max-width:1450px;margin:auto;padding:12px 24px 0;min-height:72px}a{color:inherit;text-decoration:none;font-size:14px;font-weight:600}a:hover{text-decoration:underline}img{width:auto;height:43px;max-width:170px;object-fit:contain}.brand{display:flex;align-items:center;margin-right:auto}button{background:#fff;border:1px solid #dce6ee;border-radius:8px;padding:10px 12px;color:inherit;font:inherit;cursor:pointer}button:focus-visible,a:focus-visible{outline:3px solid #14a9b4;outline-offset:3px}.desktop{display:flex;align-items:center;justify-content:center;gap:clamp(10px,1.6vw,24px);order:4;flex-basis:100%;width:100%;padding:12px 0;border-top:1px solid #e7eef4;margin-top:12px}.account{order:2;margin-left:auto}.account{display:flex;align-items:center;gap:8px}.account span{font-size:12px}.tools{position:relative}.tool-list{display:none;position:absolute;top:100%;right:0;min-width:230px;background:white;padding:8px;border:1px solid #dce6ee;border-radius:10px;box-shadow:0 12px 28px #102b4922}.tools:focus-within .tool-list,.tools:hover .tool-list{display:grid}.tool-list a,.mobile a{padding:10px;display:block}.status{font-size:11px;color:#1765bb;margin-left:8px}.toggle{display:none}.mobile{display:none;padding:8px 18px 18px;border-top:1px solid #dce6ee}.mobile[open]{display:grid}.mobile a{min-height:42px}.mobile button[hidden]{display:none}@media(max-width:900px){nav{min-height:62px;padding:9px 16px;flex-wrap:nowrap}.desktop,.account{display:none}.mobile-account{display:block;margin-left:auto}.toggle{display:block}img{height:37px;max-width:145px}} `;
  const header=document.createElement("header");
  const nav=document.createElement("nav");nav.setAttribute("aria-label","Linkoteq global navigation");
  const brand=document.createElement("a");brand.className="brand";brand.href=base+"/";brand.setAttribute("aria-label","Linkoteq Home");
  const logo=document.createElement("img");logo.src=base+"/linko-logo-final.svg";logo.alt="Linkoteq";brand.append(logo);nav.append(brand);
  const desktop=document.createElement("div");desktop.className="desktop";
  links.forEach(([name,url])=>{const a=document.createElement("a");a.href=url;a.textContent=name;desktop.append(a)});
  const toolsWrap=document.createElement("div");toolsWrap.className="tools";
  const toolButton=document.createElement("button");toolButton.type="button";toolButton.textContent="Engineering Tools ▾";toolButton.setAttribute("aria-label","Engineering tools");
  const toolList=document.createElement("div");toolList.className="tool-list";
  tools.forEach(([name,url,status])=>{const a=document.createElement("a");a.href=url;a.textContent=name;const badge=document.createElement("span");badge.className="status";badge.textContent=status;a.append(badge);toolList.append(a)});
  toolsWrap.append(toolButton,toolList);desktop.append(toolsWrap);const account=document.createElement("div");account.className="account";nav.append(account);this.accountArea=account;nav.append(desktop);this.updateAccount();
  const mobileAccount=document.createElement("span");mobileAccount.className="mobile-account";mobileAccount.setAttribute("aria-live","polite");this.mobileAccount=mobileAccount;nav.append(mobileAccount);this.updateAccount();
  const toggle=document.createElement("button");toggle.className="toggle";toggle.type="button";toggle.textContent="Menu";toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-controls","linkoteq-menu");nav.append(toggle);
  const mobile=document.createElement("div");mobile.className="mobile";mobile.id="linkoteq-menu";
  [...links,...tools.map(t=>[t[0]+" · "+t[2],t[1]])].forEach(([name,url])=>{const a=document.createElement("a");a.href=url;a.textContent=name;mobile.append(a)});
  const mobileSignOut=document.createElement("button");mobileSignOut.type="button";mobileSignOut.textContent="Sign Out";mobileSignOut.hidden=!this.hasAttribute("account-name");this.mobileSignOut=mobileSignOut;mobileSignOut.addEventListener("click",()=>this.dispatchEvent(new CustomEvent("linkoteq-signout",{bubbles:true})));mobile.append(mobileSignOut);
  toggle.addEventListener("click",()=>{const open=!mobile.hasAttribute("open");mobile.toggleAttribute("open",open);toggle.setAttribute("aria-expanded",String(open));toggle.textContent=open?"Close":"Menu"});
  header.append(nav,mobile);root.append(style,header);
 }
}
if(!customElements.get("linkoteq-header"))customElements.define("linkoteq-header",LinkoteqHeader);
})();