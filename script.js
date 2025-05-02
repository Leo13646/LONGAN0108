/***** DOM 快捷 *****/
const $=q=>document.querySelector(q);
const id=i=>document.getElementById(i);

/***** 常量 *****/
const FIELDS=["capital","income","sellCost","prCost","kolCost","opsCost"];
const KEY_MAIN="es-main",KEY_HIST="es-hist",KEY_TAB=n=>`es-${n}`;

/***** 狀態 *****/
let pie=null,line=null,history=[];

/***** 首次載入 *****/
window.addEventListener("DOMContentLoaded",()=>{
  loadMain();
  loadHist();
  ["kol","stock","order"].forEach(loadTab);
  ensureOneRow("kol"); ensureOneRow("stock"); ensureOneRow("order");
  drawPie([0,0,0,0]); drawLine(); show("finance");
});

/***** 分頁顯示 *****/
function show(tab){document.querySelectorAll(".tab").forEach(e=>e.style.display="none"); id(tab).style.display="block";}

/***** Main *****/
function loadMain(){const data=JSON.parse(localStorage.getItem(KEY_MAIN)||"{}"); FIELDS.forEach(k=>id(k).value=data[k]||0); recalc(); }
function saveMain(){localStorage.setItem(KEY_MAIN,JSON.stringify(Object.fromEntries(FIELDS.map(k=>[k,id(k).value]))));}

/***** History *****/
function loadHist(){history=JSON.parse(localStorage.getItem(KEY_HIST)||"[]");}
function saveHist(){localStorage.setItem(KEY_HIST,JSON.stringify(history));}

/***** Tab *****/
function loadTab(name){(JSON.parse(localStorage.getItem(KEY_TAB(name))||"[]")).forEach(r=>addRow(name,r));}
function saveTab(name){const rows=[...id(name+"Table").rows].slice(1).map(r=>[...r.querySelectorAll("input,select")].map(e=>e.value)); localStorage.setItem(KEY_TAB(name),JSON.stringify(rows));}
function ensureOneRow(name){if(id(name+"Table").rows.length===1) addRow(name);}

/***** 計算與圖表 *****/
let timer; function debCalc(){clearTimeout(timer); timer=setTimeout(recalc,100);}  
function recalc(){saveMain(); const v=k=>+id
