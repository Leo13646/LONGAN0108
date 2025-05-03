/* ---------- 快捷 ---------- */
const $ = q => document.querySelector(q);
const $$ = q => document.querySelectorAll(q);
const id = i => document.getElementById(i);

/* ---------- Firebase 初始化 ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
const dataRef = doc(db, "main", "data");

/* ---------- 共用變數 ---------- */
let pie, line, hist = [], debounceTimer;

/* ---------- 資料載入 ---------- */
function loadData() {
  onSnapshot(dataRef, snap => {
    if (!snap.exists()) return;
    const data = snap.data();

    // 財務
    if (data.finance) {
      Object.entries(data.finance).forEach(([k, v]) => {
        if (document.activeElement !== id(k)) id(k).value = v || "";
      });
    }

    // 圖表
    hist = data.hist || [];
    updateCharts();

    // 表格
    renderTable("kol", data.kol || [], addKolRow, "kolTable");
    renderTable("stock", data.stock || [], addStockRow, "stockTable");
    renderTable("order", data.order || [], addOrderRow, "orderTable");
  });
}

function saveData(key, value) {
  setDoc(dataRef, { [key]: value }, { merge: true });
}

/* ---------- 圖表與計算 ---------- */
function updateCharts() {
  const n = k => +id(k).value || 0;
  const profit = n("income") - n("sellCost") - n("prCost") - n("kolCost") - n("opsCost");
  id("netProfit").textContent = profit.toFixed(0);

  pie?.destroy();
  pie = new Chart(id("pie"), {
    type: "pie",
    data: {
      labels: ["銷售", "公關", "KOL", "營運"],
      datasets: [{ data: [n("sellCost"), n("prCost"), n("kolCost"), n("opsCost")], backgroundColor: ["#333", "#555", "#777", "#999"] }]
    },
    options: { animation: false, plugins: { legend: { labels: { color: "#ccc" } } } }
  });

  const today = new Date().toLocaleDateString();
  if (!hist.length || hist.at(-1).x !== today) {
    hist.push({ x: today, y: profit });
    saveData("hist", hist);
  }

  line?.destroy();
  line = new Chart(id("line"), {
    type: "line",
    data: {
      labels: hist.map(d => d.x),
      datasets: [{ label: "淨利", data: hist.map(d => d.y), borderColor: "#fff", backgroundColor: "rgba(255,255,255,.2)", fill: true, tension: .35 }]
    },
    options: { animation: false, scales: { x: { ticks: { color: "#bbb" } }, y: { ticks: { color: "#bbb" } } }, plugins: { legend: { labels: { color: "#ccc" } } } }
  });
}

function debouncedCalc() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const finance = Object.fromEntries(["capital", "income", "sellCost", "prCost", "kolCost", "opsCost"].map(k => [k, id(k).value]));
    saveData("finance", finance);
    updateCharts();
  }, 500);
}

/* ---------- 表格處理 ---------- */
function renderTable(key, rows, addFn, tableId) {
  const table = id(tableId);
  while (table.rows.length > 1) table.deleteRow(1);
  (rows.length ? rows : [[]]).forEach(row => addFn(row));
}

function saveTableData(key, tableId) {
  const rows = [...id(tableId).rows].slice(1).map(r => [...r.querySelectorAll("input,select")].map(e => e.value));
  saveData(key, rows);
}

/* ---------- 通用元件 ---------- */
const input = (n = false, v = "") => { const e = document.createElement("input"); if (n) e.type = "number"; e.value = v; return e; };
const sel = a => { const s = document.createElement("select"); a.forEach(o => s.add(new Option(o, o))); return s; };
const btn = f => { const b = document.createElement("button"); b.textContent = "🗑"; b.onclick = f; return b; };

/* ---------- 模組：KOL ---------- */
function addKolRow(d = []) {
  const r = id("kolTable").insertRow();
  const st = ["未寄出", "已寄出"];
  const data = ["", "", "", "", "30", "", st[0]];
  for (let i = 0; i < 8; i++) {
    const c = r.insertCell();
    let el;
    if (i === 7) el = btn(() => { r.remove(); sumKOL(); saveTableData("kol", "kolTable"); });
    else if (i === 6) el = sel(st);
    else el = input([2,3,4,5].includes(i), d[i] || data[i]);
    c.appendChild(el);
  }
  r.addEventListener("input", () => { sumKOL(); saveTableData("kol", "kolTable"); });
  r.addEventListener("change", () => { sumKOL(); saveTableData("kol", "kolTable"); });
  sumKOL();
}
function sumKOL() {
  let s = 0;
  $$("#kolTable tr").forEach((r,i)=>{
    if (!i) return;
    const [,,p,q,rp,amt] = r.querySelectorAll("input");
    const v = (p.value && q.value && rp.value) ? (+p.value)*(+q.value)*(+rp.value)/100 : (+amt.value||0);
    amt.value = v.toFixed(0);
    s += v;
  });
  id("kolCost").value = s.toFixed(0);
  debouncedCalc();
}

/* ---------- 模組：庫存 ---------- */
function addStockRow(d = []) {
  const r = id("stockTable").insertRow();
  const cat = ["電子產品", "美妝", "居家", "服飾", "3C配件", "其他"];
  for (let i = 0; i < 8; i++) {
    const c = r.insertCell();
    let el;
    if (i === 7) el = btn(() => { r.remove(); sumStock(); saveTableData("stock", "stockTable"); });
    else if (i === 1) el = sel(cat);
    else {
      el = input([2,3,5].includes(i), d[i] || "");
      if ([2,3].includes(i)) el.oninput = () => sumStock();
      if (i === 4) el.readOnly = true;
    }
    c.appendChild(el);
  }
  r.addEventListener("input", () => { sumStock(); saveTableData("stock", "stockTable"); });
  r.addEventListener("change", () => { sumStock(); saveTableData("stock", "stockTable"); });
  sumStock();
}
function sumStock() {
  $$("#stockTable tr").forEach((r,i)=>{
    if (!i) return;
    const cost = +r.cells[2].firstChild.value || 0;
    const qty = +r.cells[3].firstChild.value || 0;
    r.cells[4].firstChild.value = (cost * qty).toFixed(0);
  });
}

/* ---------- 模組：訂單 ---------- */
function addOrderRow(d = []) {
  const r = id("orderTable").insertRow();
  const st = ["未出貨", "已出貨", "退貨"];
  for (let i = 0; i < 7; i++) {
    const c = r.insertCell();
    let el;
    if (i === 6) el = btn(() => { r.remove(); saveTableData("order", "orderTable"); });
    else if (i === 4) el = sel(st);
    else if (i === 5) { el = input(false, new Date().toISOString().split("T")[0]); el.type = "date"; }
    else el = input(i === 2, d[i] || "");
    c.appendChild(el);
  }
  r.addEventListener("input", () => saveTableData("order", "orderTable"));
  r.addEventListener("change", () => saveTableData("order", "orderTable"));
}

/* ---------- 啟動 ---------- */
window.addEventListener("DOMContentLoaded", () => {
  loadData();
  show("finance");
});

function show(t){$$(".tab").forEach(e=>e.style.display="none");id(t).style.display="block";
  if(t==="kol"&&id("kolTable").rows.length===1)addKolRow();
  if(t==="stock"&&id("stockTable").rows.length===1)addStockRow();
  if(t==="order"&&id("orderTable").rows.length===1)addOrderRow();}

/* ---------- 公開函式 ---------- */
window.show = show;
window.addKolRow = addKolRow;
window.addStockRow = addStockRow;
window.addOrderRow = addOrderRow;
window.debouncedCalc = debouncedCalc;
