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

/* ---------- 分頁 ---------- */
function show(tab) {
  $$(".tab").forEach(e => e.style.display = "none");
  id(tab).style.display = "block";
  if (tab === "kol" && id("kolTable").rows.length === 1) addKolRow();
  if (tab === "stock" && id("stockTable").rows.length === 1) addStockRow();
  if (tab === "order" && id("orderTable").rows.length === 1) addOrderRow();
}

/* ---------- 財務 ---------- */
const finKeys = ["capital", "income", "sellCost", "prCost", "kolCost", "opsCost"];
function saveFin() {
  const data = Object.fromEntries(finKeys.map(k => [k, id(k).value]));
  setDoc(doc(db, "finance", "fin"), data).catch(console.error);
}
function loadFin() {
  onSnapshot(doc(db, "finance", "fin"), snap => {
    if (!snap.exists()) return;
    Object.entries(snap.data()).forEach(([k, v]) => id(k).value = v);
    calc();
  });
}

let pie, line, hist = [];
function loadHist() {
  onSnapshot(doc(db, "finance", "hist"), snap => {
    hist = snap.exists() ? snap.data().rows : [];
    rebuildCharts();
  });
}
function saveHist() {
  setDoc(doc(db, "finance", "hist"), { rows: hist }).catch(console.error);
}

function rebuildCharts() {
  const n = k => +id(k).value || 0;
  const p = n("income") - n("sellCost") - n("prCost") - n("kolCost") - n("opsCost");

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
    hist.push({ x: today, y: p });
    saveHist();
  }

  line?.destroy();
  line = new Chart(id("line"), {
    type: "line",
    data: {
      labels: hist.map(d => d.x),
      datasets: [{ label: "淨利", data: hist.map(d => d.y), borderColor: "#fff", backgroundColor: "rgba(255,255,255,.15)", fill: true, tension: .35 }]
    },
    options: { animation: false, scales: { x: { ticks: { color: "#bbb" } }, y: { ticks: { color: "#bbb" } } }, plugins: { legend: { labels: { color: "#ccc" } } } }
  });

  id("netProfit").textContent = p.toFixed(0);
}

let t;
function debouncedCalc() {
  clearTimeout(t);
  t = setTimeout(() => { saveFin(); rebuildCharts(); }, 300);
}

/* ---------- 表格儲存 ---------- */
function saveTable(key, tableId) {
  const rows = [...id(tableId).rows].slice(1).map(r => [...r.querySelectorAll("input,select")].map(e => e.value));
  setDoc(doc(db, "tables", key), { rows }).catch(console.error);
}

function loadTable(key, addRow, tableId) {
  onSnapshot(doc(db, "tables", key), snap => {
    const data = snap.exists() ? snap.data().rows : [];
    while (id(tableId).rows.length > 1) id(tableId).deleteRow(1);
    if (data.length === 0) {
      addRow();
      saveTable(key, tableId);
    } else {
      data.forEach(addRow);
    }
  });
}

/* ---------- 模組欄位 ---------- */
function addKolRow(d = null) {
  const r = id("kolTable").insertRow();
  const status = ["未寄出", "已寄出"];
  for (let i = 0; i < 8; i++) {
    const c = r.insertCell();
    let el = i === 7 ? btn(() => { r.remove(); sumKOL(); saveTable("kol", "kolTable"); })
           : i === 6 ? sel(status)
           : input([2,3,4,5].includes(i), i === 4 ? 30 : "");
    c.appendChild(el);
  }
  if (d) [...r.cells].forEach((c, i) => c.firstChild.value = d[i] || "");
  r.addEventListener("input", () => { sumKOL(); saveTable("kol", "kolTable"); });
  r.addEventListener("change", () => { sumKOL(); saveTable("kol", "kolTable"); });
  sumKOL();
}
function sumKOL() {
  let s = 0;
  $$("#kolTable tr").forEach((r, i) => {
    if (!i) return;
    const [,, p, q, rp, amt] = r.querySelectorAll("input");
    const v = (p.value && q.value && rp.value) ? (+p.value) * (+q.value) * (+rp.value) / 100 : (+amt.value || 0);
    amt.value = v.toFixed(0);
    s += v;
  });
  id("kolCost").value = s.toFixed(0);
  debouncedCalc();
}

function addStockRow(d = null) {
  const r = id("stockTable").insertRow();
  const cat = ["電子產品", "美妝", "居家", "服飾", "3C配件", "其他"];
  for (let i = 0; i < 8; i++) {
    const c = r.insertCell();
    let el = i === 7 ? btn(() => { r.remove(); sumStock(); saveTable("stock", "stockTable"); })
           : i === 1 ? sel(cat)
           : input([2,3,5].includes(i));
    if (i === 4) el.readOnly = true;
    if ([2,3].includes(i)) el.oninput = () => sumStock();
    c.appendChild(el);
  }
  if (d) [...r.cells].forEach((c, i) => c.firstChild.value = d[i] || "");
  r.addEventListener("input", () => { sumStock(); saveTable("stock", "stockTable"); });
  r.addEventListener("change", () => { sumStock(); saveTable("stock", "stockTable"); });
  sumStock();
}
function sumStock() {
  $$("#stockTable tr").forEach((r, i) => {
    if (!i) return;
    const cost = +r.cells[2].firstChild.value || 0;
    const qty = +r.cells[3].firstChild.value || 0;
    r.cells[4].firstChild.value = (cost * qty).toFixed(0);
  });
}

function addOrderRow(d = null) {
  const r = id("orderTable").insertRow();
  const status = ["未出貨", "已出貨", "退貨"];
  for (let i = 0; i < 7; i++) {
    const c = r.insertCell();
    let el = i === 6 ? btn(() => { r.remove(); saveTable("order", "orderTable"); })
           : i === 2 ? input(true, 1)
           : i === 4 ? sel(status)
           : i === 5 ? (() => { const e = input(false, new Date().toISOString().split("T")[0]); e.type = "date"; return e; })()
           : input(i === 3);
    c.appendChild(el);
  }
  if (d) [...r.cells].forEach((c, i) => c.firstChild.value = d[i] || "");
  r.addEventListener("input", () => saveTable("order", "orderTable"));
  r.addEventListener("change", () => saveTable("order", "orderTable"));
}

/* ---------- 啟動 ---------- */
window.addEventListener("DOMContentLoaded", () => {
  loadFin(); loadHist();
  loadTable("kol", addKolRow, "kolTable");
  loadTable("stock", addStockRow, "stockTable");
  loadTable("order", addOrderRow, "orderTable");
  show("finance");
});

/* ---------- 工具 ---------- */
const input = (isNum = false, val = "") => { const e = document.createElement("input"); if (isNum) e.type = "number"; e.value = val; return e; };
const sel = arr => { const s = document.createElement("select"); arr.forEach(opt => s.add(new Option(opt, opt))); return s; };
const btn = f => { const b = document.createElement("button"); b.textContent = "🗑"; b.onclick = f; return b; };

window.show = show;
window.addKolRow = addKolRow;
window.addStockRow = addStockRow;
window.addOrderRow = addOrderRow;
window.debouncedCalc = debouncedCalc;
