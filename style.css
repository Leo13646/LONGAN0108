
/* ---------- 快捷 ---------- */
const $=q=>document.querySelector(q), $$=q=>document.querySelectorAll(q), id=i=>document.getElementById(i);

/* ---------- 分頁 ---------- */
function show(t){$$(".tab").forEach(e=>e.style.display="none");id(t).style.display="block";
  if(t==="kol"  && id("kolTable").rows.length===1)   addKolRow();
  if(t==="stock"&& id("stockTable").rows.length===1) addStockRow();
  if(t==="order"&& id("orderTable").rows.length===1) addOrderRow();}

/* ---------- 財務 ---------- */
const keys=["capital","income","sellCost","prCost","kolCost","opsCost"];
const loadFin=_=>{Object.entries(JSON.parse(localStorage.getItem("fin")||"{}")).forEach(([k,v])=>id(k).value=v)};
const saveFin=_=>localStorage.setItem("fin",JSON.stringify(Object.fromEntries(keys.map(k=>[k,id(k).value]))));

let pie,line;
let hist=JSON.parse(localStorage.getItem("hist")||"[]");

function rebuildCharts(arr,profit){
  /* pie */
  pie?.destroy();
  pie=new Chart(id("pie"),{type:"pie",data:{labels:["銷售","公關","KOL","營運"],datasets:[{data:arr,backgroundColor:["#333","#555","#777","#999"]}]},
    options:{animation:false,plugins:{legend:{labels:{color:"#ccc"}}}}});
  /* line */
  const today=new Date().toLocaleDateString();
  if(!hist.length||hist.at(-1).x!==today){hist.push({x:today,y:profit});localStorage.setItem("hist",JSON.stringify(hist));}
  line?.destroy();
  line=new Chart(id("line"),{type:"line",
    data:{labels:hist.map(d=>d.x),datasets:[{label:"淨利",data:hist.map(d=>d.y),borderColor:"#fff",backgroundColor:"rgba(255,255,255,.15)",fill:true,tension:.35}]},
    options:{animation:false,scales:{x:{ticks:{color:"#bbb"}},y:{ticks:{color:"#bbb"}}},plugins:{legend:{labels:{color:"#ccc"}}}}});
}

let t;function debouncedCalc(){clearTimeout(t);t=setTimeout(calc,150);}
function calc(){const n=k=>+id(k).value||0;const p=n("income")-n("sellCost")-n("prCost")-n("kolCost")-n("opsCost");
  id("netProfit").textContent=p.toFixed(0);saveFin();rebuildCharts([n("sellCost"),n("prCost"),n("kolCost"),n("opsCost")],p);}

/* ---------- 本地存表 ---------- */
const saveTable=(k,tid)=>localStorage.setItem(k,JSON.stringify([...id(tid).rows].slice(1).map(r=>[...r.querySelectorAll("input,select")].map(e=>e.value))));
const loadTable=(k,add)=>JSON.parse(localStorage.getItem(k)||"[]").forEach(add);

/* ---------- KOL ---------- */
function addKolRow(d=null){const st=["未寄出","已寄出"];const r=id("kolTable").insertRow();
  for(let i=0;i<8;i++){const c=r.insertCell();let el;
    if(i===7){el=btn(()=>{r.remove();sumKOL();saveTable("kol","kolTable");});}
    else if(i===6){el=sel(st);}
    else{el=input([2,3,4,5].includes(i),i===4?30:"");}
    c.appendChild(el);}
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value=d[i]||"");
  r.addEventListener("input",()=>{sumKOL();saveTable("kol","kolTable");});
  r.addEventListener("change",()=>{sumKOL();saveTable("kol","kolTable");});
  sumKOL();}
function sumKOL(){let s=0;$$("#kolTable tr").forEach((r,i)=>{if(!i)return;const [,,p,q,rp,amt]=r.querySelectorAll("input");
  const v=(p.value&&q.value&&rp.value)?(+p.value)*(+q.value)*(+rp.value)/100:(+amt.value||0);amt.value=v.toFixed(0);s+=v;});
  id("kolCost").value=s.toFixed(0);debouncedCalc();}

/* ---------- STOCK ---------- */
function addStockRow(d=null){const cat=["電子產品","美妝","居家","服飾","3C配件","其他"];const r=id("stockTable").insertRow();
  for(let i=0;i<8;i++){const c=r.insertCell();let el;
    if(i===7){el=btn(()=>{r.remove();sumStock();saveTable("stock","stockTable");});}
    else if(i===1){el=sel(cat);}
    else{el=input([2,3,5].includes(i));if([2,3].includes(i)) el.oninput=sumStock;if(i===4){el.readOnly=true;}}
    c.appendChild(el);}
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value=d[i]||"");
  r.addEventListener("input",()=>{sumStock();saveTable("stock","stockTable");});
  r.addEventListener("change",()=>{sumStock();saveTable("stock","stockTable");});
  sumStock();}
function sumStock(){$$("#stockTable tr").forEach((r,i)=>{if(!i)return;
  const cost=+r.cells[2].firstChild.value||0,qty=+r.cells[3].firstChild.value||0;r.cells[4].firstChild.value=(cost*qty).toFixed(0);});}

/* ---------- ORDER ---------- */
function addOrderRow(d=null){const st=["未出貨","已出貨","退貨"];const r=id("orderTable").insertRow();
  for(let i=0;i<7;i++){const c=r.insertCell();let el;
    if(i===6){el=btn(()=>{r.remove();saveTable("order","orderTable");});}
    else if(i===2){el=input(true,1);}
    else if(i===4){el=sel(st);}
    else if(i===5){el=input(false,new Date().toISOString().split("T")[0]);el.type="date";}
    else{el=input(i===3);}
    c.appendChild(el);}
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value=d[i]||"");
  r.addEventListener("input",()=>saveTable("order","orderTable"));
  r.addEventListener("change",()=>saveTable("order","orderTable"));}

/* ---------- 啟動 ---------- */
window.addEventListener("DOMContentLoaded",()=>{
  loadFin();calc();
  loadTable("kol",addKolRow);   if(id("kolTable").rows.length===1)   addKolRow();
  loadTable("stock",addStockRow);if(id("stockTable").rows.length===1) addStockRow();
  loadTable("order",addOrderRow);if(id("orderTable").rows.length===1) addOrderRow();
  show("finance");
});

/* ---------- 小元件 ---------- */
const input=(n=false,v="")=>{const e=document.createElement("input");if(n)e.type="number";e.value=v;return e;}
const sel=a=>{const s=document.createElement("select");a.forEach(o=>s.add(new Option(o,o)));return s;}
const btn=f=>{const b=document.createElement("button");b.textContent="🗑";b.onclick=f;return b;}
/* ---------- 快捷 ---------- */
const $=q=>document.querySelector(q), $$=q=>document.querySelectorAll(q), id=i=>document.getElementById(i);

/* ---------- 分頁 ---------- */
function show(t){$$(".tab").forEach(e=>e.style.display="none");id(t).style.display="block";
  if(t==="kol"  && id("kolTable").rows.length===1)   addKolRow();
  if(t==="stock"&& id("stockTable").rows.length===1) addStockRow();
  if(t==="order"&& id("orderTable").rows.length===1) addOrderRow();}

/* ---------- 財務 ---------- */
const keys=["capital","income","sellCost","prCost","kolCost","opsCost"];
const loadFin=_=>{Object.entries(JSON.parse(localStorage.getItem("fin")||"{}")).forEach(([k,v])=>id(k).value=v)};
const saveFin=_=>localStorage.setItem("fin",JSON.stringify(Object.fromEntries(keys.map(k=>[k,id(k).value]))));

let pie,line;
let hist=JSON.parse(localStorage.getItem("hist")||"[]");

function rebuildCharts(arr,profit){
  /* pie */
  pie?.destroy();
  pie=new Chart(id("pie"),{type:"pie",data:{labels:["銷售","公關","KOL","營運"],datasets:[{data:arr,backgroundColor:["#333","#555","#777","#999"]}]},
    options:{animation:false,plugins:{legend:{labels:{color:"#ccc"}}}}});
  /* line */
  const today=new Date().toLocaleDateString();
  if(!hist.length||hist.at(-1).x!==today){hist.push({x:today,y:profit});localStorage.setItem("hist",JSON.stringify(hist));}
  line?.destroy();
  line=new Chart(id("line"),{type:"line",
    data:{labels:hist.map(d=>d.x),datasets:[{label:"淨利",data:hist.map(d=>d.y),borderColor:"#fff",backgroundColor:"rgba(255,255,255,.15)",fill:true,tension:.35}]},
    options:{animation:false,scales:{x:{ticks:{color:"#bbb"}},y:{ticks:{color:"#bbb"}}},plugins:{legend:{labels:{color:"#ccc"}}}}});
}

let t;function debouncedCalc(){clearTimeout(t);t=setTimeout(calc,150);}
function calc(){const n=k=>+id(k).value||0;const p=n("income")-n("sellCost")-n("prCost")-n("kolCost")-n("opsCost");
  id("netProfit").textContent=p.toFixed(0);saveFin();rebuildCharts([n("sellCost"),n("prCost"),n("kolCost"),n("opsCost")],p);}

/* ---------- 本地存表 ---------- */
const saveTable=(k,tid)=>localStorage.setItem(k,JSON.stringify([...id(tid).rows].slice(1).map(r=>[...r.querySelectorAll("input,select")].map(e=>e.value))));
const loadTable=(k,add)=>JSON.parse(localStorage.getItem(k)||"[]").forEach(add);

/* ---------- KOL ---------- */
function addKolRow(d=null){const st=["未寄出","已寄出"];const r=id("kolTable").insertRow();
  for(let i=0;i<8;i++){const c=r.insertCell();let el;
    if(i===7){el=btn(()=>{r.remove();sumKOL();saveTable("kol","kolTable");});}
    else if(i===6){el=sel(st);}
    else{el=input([2,3,4,5].includes(i),i===4?30:"");}
    c.appendChild(el);}
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value=d[i]||"");
  r.addEventListener("input",()=>{sumKOL();saveTable("kol","kolTable");});
  r.addEventListener("change",()=>{sumKOL();saveTable("kol","kolTable");});
  sumKOL();}
function sumKOL(){let s=0;$$("#kolTable tr").forEach((r,i)=>{if(!i)return;const [,,p,q,rp,amt]=r.querySelectorAll("input");
  const v=(p.value&&q.value&&rp.value)?(+p.value)*(+q.value)*(+rp.value)/100:(+amt.value||0);amt.value=v.toFixed(0);s+=v;});
  id("kolCost").value=s.toFixed(0);debouncedCalc();}

/* ---------- STOCK ---------- */
function addStockRow(d=null){const cat=["電子產品","美妝","居家","服飾","3C配件","其他"];const r=id("stockTable").insertRow();
  for(let i=0;i<8;i++){const c=r.insertCell();let el;
    if(i===7){el=btn(()=>{r.remove();sumStock();saveTable("stock","stockTable");});}
    else if(i===1){el=sel(cat);}
    else{el=input([2,3,5].includes(i));if([2,3].includes(i)) el.oninput=sumStock;if(i===4){el.readOnly=true;}}
    c.appendChild(el);}
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value=d[i]||"");
  r.addEventListener("input",()=>{sumStock();saveTable("stock","stockTable");});
  r.addEventListener("change",()=>{sumStock();saveTable("stock","stockTable");});
  sumStock();}
function sumStock(){$$("#stockTable tr").forEach((r,i)=>{if(!i)return;
  const cost=+r.cells[2].firstChild.value||0,qty=+r.cells[3].firstChild.value||0;r.cells[4].firstChild.value=(cost*qty).toFixed(0);});}

/* ---------- ORDER ---------- */
function addOrderRow(d=null){const st=["未出貨","已出貨","退貨"];const r=id("orderTable").insertRow();
  for(let i=0;i<7;i++){const c=r.insertCell();let el;
    if(i===6){el=btn(()=>{r.remove();saveTable("order","orderTable");});}
    else if(i===2){el=input(true,1);}
    else if(i===4){el=sel(st);}
    else if(i===5){el=input(false,new Date().toISOString().split("T")[0]);el.type="date";}
    else{el=input(i===3);}
    c.appendChild(el);}
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value=d[i]||"");
  r.addEventListener("input",()=>saveTable("order","orderTable"));
  r.addEventListener("change",()=>saveTable("order","orderTable"));}

/* ---------- 啟動 ---------- */
window.addEventListener("DOMContentLoaded",()=>{
  loadFin();calc();
  loadTable("kol",addKolRow);   if(id("kolTable").rows.length===1)   addKolRow();
  loadTable("stock",addStockRow);if(id("stockTable").rows.length===1) addStockRow();
  loadTable("order",addOrderRow);if(id("orderTable").rows.length===1) addOrderRow();
  show("finance");
});

/* ---------- 小元件 ---------- */
const input=(n=false,v="")=>{const e=document.createElement("input");if(n)e.type="number";e.value=v;return e;}
const sel=a=>{const s=document.createElement("select");a.forEach(o=>s.add(new Option(o,o)));return s;}
const btn=f=>{const b=document.createElement("button");b.textContent="🗑";b.onclick=f;return b;}
