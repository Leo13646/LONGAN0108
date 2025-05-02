/* ---------- 快捷 ---------- */
const $=q=>document.querySelector(q), $$=q=>document.querySelectorAll(q), id=i=>document.getElementById(i);

/* ---------- Firebase ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_t-Yfmxfy8uAqGgQMb3AZarNrzYocByM",
  authDomain: "longan-aef50.firebaseapp.com",
  projectId: "longan-aef50",
  storageBucket: "longan-aef50.appspot.com",
  messagingSenderId: "632631753622",
  appId: "1:632631753622:web:395d077de61b86f9053bb7",
  measurementId: "G-MLN3B4NZ83"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ---------- 分頁切換（手機修復） ---------- */
function show(t){
  $$(".tab").forEach(e=>e.style.display="none");
  id(t).style.display="block";
  if(t==="kol"  && id("kolTable").rows.length===1)   addKolRow();
  if(t==="stock"&& id("stockTable").rows.length===1) addStockRow();
  if(t==="order"&& id("orderTable").rows.length===1) addOrderRow();
}

/* ---------- 財務 ---------- */
const keys = ["capital","income","sellCost","prCost","kolCost","opsCost"];
const saveFin = () => {
  const data = Object.fromEntries(keys.map(k => [k, id(k).value]));
  setDoc(doc(db, "data", "fin"), data);
};
const loadFin = () => {
  onSnapshot(doc(db, "data", "fin"), snap => {
    if (!snap.exists()) return;
    for (const [k, v] of Object.entries(snap.data())) {
      if (id(k)) id(k).value = v;
    }
    calc();
  });
};

/* ---------- 圖表 ---------- */
let pie, line;
let hist = [];
const loadHist = () => {
  onSnapshot(doc(db, "data", "hist"), snap => {
    hist = snap.exists() ? snap.data().rows || [] : [];
    calc();
  });
};
const saveHist = () => setDoc(doc(db, "data", "hist"), { rows: hist });

function rebuildCharts(arr, profit){
  pie?.destroy();
  pie = new Chart(id("pie"), {
    type: "pie",
    data: {
      labels: ["銷售", "公關", "KOL", "營運"],
      datasets: [{ data: arr, backgroundColor: ["#333","#555","#777","#999"] }]
    },
    options: { animation: false, plugins: { legend: { labels: { color: "#ccc" } } } }
  });

  const today = new Date().toLocaleDateString();
  if (!hist.length || hist.at(-1).x !== today) {
    hist.push({ x: today, y: profit });
    saveHist();
  }

  line?.destroy();
  line = new Chart(id("line"), {
    type: "line",
    data: {
      labels: hist.map(d => d.x),
      datasets: [{
        label: "淨利",
        data: hist.map(d => d.y),
        borderColor: "#fff",
        backgroundColor: "rgba(255,255,255,.15)",
        fill: true, tension: .35
      }]
    },
    options: {
      animation: false,
      scales: { x: { ticks: { color: "#bbb" } }, y: { ticks: { color: "#bbb" } } },
      plugins: { legend: { labels: { color: "#ccc" } } }
    }
  });
}

/* ---------- 計算 ---------- */
let t;
function debouncedCalc() { clearTimeout(t); t = setTimeout(calc, 150); }
function calc(){
  const n = k => +id(k).value || 0;
  const p = n("income") - n("sellCost") - n("prCost") - n("kolCost") - n("opsCost");
  id("netProfit").textContent = p.toFixed(0);
  saveFin();
  rebuildCharts([n("sellCost"), n("prCost"), n("kolCost"), n("opsCost")], p);
}

/* ---------- 表格儲存 ---------- */
const saveTable = (key, tableId) => {
  const data = [...id(tableId).rows].slice(1).map(r =>
    [...r.querySelectorAll("input,select")].map(e => e.value)
  );
  setDoc(doc(db, "data", key), { rows: data });
};
const loadTable = (key, addFunc, tableId) => {
  onSnapshot(doc(db, "data", key), snap => {
    const rows = snap.exists() ? snap.data().rows : [];
    while (id(tableId).rows.length > 1) id(tableId).deleteRow(1);
    if (rows.length === 0) addFunc();
    else rows.forEach(r => addFunc(r));
  });
};

/* ---------- 模組：KOL ---------- */
function addKolRow(d=null){
  const st = ["未寄出","已寄出"];
  const r = id("kolTable").insertRow();
  for(let i=0;i<8;i++){
    const c = r.insertCell(); let el;
    if(i===7){ el=btn(()=>{ r.remove(); sumKOL(); saveTable("kol","kolTable"); }); }
    else if(i===6){ el=sel(st); }
    else{ el=input([2,3,4,5].includes(i), i===4?30:""); }
    c.appendChild(el);
  }
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value=d[i]||"");
  r.addEventListener("input", ()=>{ sumKOL(); saveTable("kol","kolTable"); });
  r.addEventListener("change",()=>{ sumKOL(); saveTable("kol","kolTable"); });
  sumKOL();
}
function sumKOL(){
  let s=0;
  $$("#kolTable tr").forEach((r,i)=>{
    if(!i) return;
    const [,,p,q,rp,amt] = r.querySelectorAll("input");
    const v = (p.value&&q.value&&rp.value) ? (+p.value)*(+q.value)*(+rp.value)/100 : (+amt.value||0);
    amt.value = v.toFixed(0);
    s += v;
  });
  id("kolCost").value = s.toFixed(0);
  debouncedCalc();
}

/* ---------- 模組：STOCK ---------- */
function addStockRow(d=null){
  const cat=["電子產品","美妝","居家","服飾","3C配件","其他"];
  const r=id("stockTable").insertRow();
  for(let i=0;i<8;i++){
    const c=r.insertCell(); let el;
    if(i===7){ el=btn(()=>{ r.remove(); sumStock(); saveTable("stock","stockTable"); }); }
    else if(i===1){ el=sel(cat); }
    else{ el=input([2,3,5].includes(i)); if([2,3].includes(i)) el.oninput=sumStock; if(i===4) el.readOnly=true; }
    c.appendChild(el);
  }
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value=d[i]||"");
  r.addEventListener("input", ()=>{ sumStock(); saveTable("stock","stockTable"); });
  r.addEventListener("change",()=>{ sumStock(); saveTable("stock","stockTable"); });
  sumStock();
}
function sumStock(){
  $$("#stockTable tr").forEach((r,i)=>{
    if(!i) return;
    const cost=+r.cells[2].firstChild.value||0,
          qty =+r.cells[3].firstChild.value||0;
    r.cells[4].firstChild.value = (cost*qty).toFixed(0);
  });
}

/* ---------- 模組：ORDER ---------- */
function addOrderRow(d=null){
  const st=["未出貨","已出貨","退貨"];
  const r=id("orderTable").insertRow();
  for(let i=0;i<7;i++){
    const c=r.insertCell(); let el;
    if(i===6){ el=btn(()=>{ r.remove(); saveTable("order","orderTable"); }); }
    else if(i===2){ el=input(true,1); }
    else if(i===4){ el=sel(st); }
    else if(i===5){ el=input(false,new Date().toISOString().split("T")[0]); el.type="date"; }
    else{ el=input(i===3); }
    c.appendChild(el);
  }
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value=d[i]||"");
  r.addEventListener("input", ()=>saveTable("order","orderTable"));
  r.addEventListener("change",()=>saveTable("order","orderTable"));
}

/* ---------- 啟動 ---------- */
window.addEventListener("DOMContentLoaded", ()=>{
  loadFin(); loadHist();
  loadTable("kol",   addKolRow,   "kolTable");
  loadTable("stock", addStockRow, "stockTable");
  loadTable("order", addOrderRow, "orderTable");
  show("finance");

  ["finance", "kol", "stock", "order"].forEach(page => {
    const btn = id("btn-" + page);
    if (btn) {
      btn.addEventListener("click", () => show(page));
      btn.addEventListener("touchstart", () => show(page));
    }
  });
});

/* ---------- 小元件 ---------- */
const input = (n=false,v="") => {
  const e=document.createElement("input");
  if(n) e.type="number";
  e.value=v;
  return e;
};
const sel = a => {
  const s=document.createElement("select");
  a.forEach(o=>s.add(new Option(o,o)));
  return s;
};
const btn = f => {
  const b=document.createElement("button");
  b.textContent="🗑";
  b.onclick=f;
  return b;
};
