// Original, deterministic, no-cost vector editorial scenes shared by blog and AI news.
import {createHash} from "node:crypto";
export const themes=[
 ["construction",/construction|site|worker|crane|build|field|project|schedule|progress/],
 ["robotics",/robot|automation|machine|fabricat|drone/],
 ["documents",/document|drawing|blueprint|pdf|rfi|scan|contract|report/],
 ["digital",/ai|software|data|digital|bim|model|algorithm|computer|platform|import|convert/],
 ["structure",/steel|beam|column|joist|frame|structur|design|load|core/],
 ["safety",/safety|hazard|inspect|risk|quality|verify/],
 ["materials",/material|concrete|supply|delivery|logistic|carbon|waste/]
];
export function chooseTheme(text){const s=String(text).toLowerCase();return themes.find(([,r])=>r.test(s))?.[0]||"structure";}
export function artScene(theme,seed="",accent="#64e7ee",warm="#ffb96c"){
 const n=parseInt(createHash("sha256").update(seed).digest("hex").slice(0,4),16);
 const offset=n%47, tilt=(n%3)-1;
 const line=`stroke="${accent}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"`;
 const gold=`stroke="${warm}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"`;
 const building=`<g ${line} fill="none"><path d="M300 555V190L555 80L820 200V560L555 680Z M555 80V680M300 190L555 310L820 200M300 310L555 430L820 310M300 430L555 550L820 430M300 555L555 680L820 560"/><path d="M360 220V560M450 175V615M645 120V630M750 175V590" opacity=".6"/></g><g ${gold} fill="none"><path d="M300 310L555 550L820 310M300 430L555 680L820 430" opacity=".8"/></g>`;
 const scenes={
 construction:`<g><path d="M130 610H1040" ${gold}/><path d="M210 610V190M190 190H850L960 280M410 190L290 600" ${line} fill="none"/><path d="M470 190V410M450 410H490V475H450Z" ${gold} fill="none"/><g transform="translate(260 105) scale(.64)">${building}</g><path d="M100 590l120 -65 130 65" ${gold} fill="none"/></g>`,
 robotics:`<g ${line} fill="none"><path d="M250 610h690M390 590V455l135 -85 120 40 115 -130"/><circle cx="390" cy="455" r="45"/><circle cx="525" cy="370" r="42"/><circle cx="645" cy="410" r="36"/><path d="M760 280l80 -35 60 65 -55 60 -85 -35Z"/><path d="M850 370l45 100 65 25"/></g><g ${gold} fill="none"><path d="M195 605V300l110 -55 110 55M195 410h215M195 520h215"/><path d="M740 170l60 -70 75 60"/></g>`,
 documents:`<g transform="translate(75 0)"><path d="M230 140h490l140 140v420H230Z" fill="#143b60" stroke="${accent}" stroke-width="9"/><path d="M720 140v140h140" ${gold} fill="none"/><path d="M310 360h450M310 435h370M310 510h420M310 585h290" ${line} opacity=".75"/><rect x="580" y="410" width="370" height="220" rx="22" fill="#1b5272" stroke="${warm}" stroke-width="8"/><path d="M650 545l80 -75 70 60 75 -95" ${gold} fill="none"/></g>`,
 digital:`<g><path d="M190 170h790v450H190Z" fill="#123956" stroke="${accent}" stroke-width="9"/><path d="M170 640h830M540 620v55" ${gold} fill="none"/><g transform="translate(40 70) scale(.7)">${building}</g><rect x="690" y="255" width="210" height="220" rx="16" fill="#215b78" stroke="${warm}" stroke-width="7"/><path d="M720 300h140M720 345h100M720 390h145" ${line} fill="none"/></g>`,
 structure:building,
 safety:`<g><g transform="translate(45 30) scale(.78)">${building}</g><path d="M825 170L1040 560H610Z" fill="#4b3651" stroke="${warm}" stroke-width="11"/><path d="M825 290v125" ${gold}/><circle cx="825" cy="480" r="13" fill="${warm}"/><path d="M690 610l95 60 160 -150" ${line} fill="none"/></g>`,
 materials:`<g><path d="M155 540l210 -110 210 110 -210 120Z M155 540v100l210 110 210 -110V540M365 660V750" fill="#244b69" stroke="${accent}" stroke-width="8"/><path d="M560 400l200 -100 200 100 -200 110Z M560 400v100l200 110 200 -110V400M760 510V610" fill="#4b405d" stroke="${warm}" stroke-width="8"/><path d="M275 300h390m-30 -25 30 25-30 25" ${gold} fill="none"/></g>`
 };
 return `<g transform="translate(${offset-22} ${tilt*8})"><circle cx="610" cy="385" r="310" fill="${warm}" opacity=".07"/>${scenes[theme]||scenes.structure}</g>`;
}
