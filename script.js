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

/* ---------- 分頁切換 ---------- */
function show(t) {
  $$(".tab").forEach(e => e.style.display = "none");
  id(t).style.display = "block";
  if (t === "kol" && id("kolTable").rows.length === 1) addKolRow();
  if (t === "stock" && id("stockTable").rows.length === 1) addStockRow();
  if (t === "order" && id("orderTable").rows.length === 1) addOrderRow();
}

/* ---------- 財務模組 ---------- */
const keys = ["capital", "income", "sellCost", "prCost", "kolCost", "opsCost"];
const saveFin = () => {
  const data = Object.fromEntries(keys.map(k => [k, id(k).value]));
  setDoc(doc(db, "finance", "fin"), data);
};

const loadFin = () => {
  onSnapshot(doc(db, "finance", "fin"), snap => {
    if (!snap.exists()) return;
    Object.entries(snap.data()).forEach(([k, v]) => id(k).value = v);
    calc();
  });
};

let pie, line, hist = [];
const loadHist = () => {
  onSnapshot(doc(db, "finance", "hist"), snap => {
    hist = snap.exists() ? snap.data().rows || [] : [];
    rebuildCharts();
  });
};
const saveHist = () => setDoc(doc(db, "finance", "hist"), { rows: hist });

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
const saveTable = (key, tableId) => {
  const rows = [...id(tableId).rows].slice(1).map(r => [...r.querySelectorAll("input,select")].map(e => e.value));
  setDoc(doc(db, "tables", key), { rows });
};

const loadTable = (key, addRow, tableId) => {
  onSnapshot(doc(db, "tables", key), snap => {
    const data = snap.exists() ? snap.data().rows : [];
    while (id(tableId).rows.length > 1) id(tableId).deleteRow(1);
    if (data.length === 0) {
      addRow();
      saveTable(key, tableId);
    } else data.forEach(addRow);
  });
};

/* ---------- KOL ---------- */
function addKolRow(d = null) {
  const st = ["未寄出", "已寄出"];
  const r = id("kolTable").insertRow();
  for (let i = 0; i < 8; i++) {
    const c = r.insertCell();
    let el;
    if (i === 7) el = btn(() => { r.remove(); sumKOL(); saveTable("kol", "kolTable"); });
    else if (i === 6) el = sel(st);
    else el = input([2, 3, 4, 5].includes(i), i === 4 ? 30 : "");
    c.appendChild(el);
  }
  if (d) [...r.cells].forEach((c, i) => c.firstChild.value = d[i] || "");
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

/* ---------- STOCK ---------- */
function addStockRow(d = null) {
  const cat = ["電子產品", "美妝", "居家", "服飾", "3C配件", "其他"];
  const r = id("stockTable").insertRow();
  for (let i = 0; i < 8; i++) {
    const c = r.insertCell();
    let el;
    if (i === 7) el = btn(() => { r.remove(); sumStock(); saveTable("stock", "stockTable"); });
    else if (i === 1) el = sel(cat);
    else {
      el = input([2, 3, 5].includes(i));
      if ([2, 3].includes(i)) el.oninput = () => sumStock();
      if (i === 4) el.readOnly = true;
    }
    c.appendChild(el);
  }
  if (d) [...r.cells].forEach((c, i) => c.firstChild.value = d[i] || "");
  sumStock();
}
function sumStock() {
  $$("#stockTable tr").forEach((r, i) => {
    if (!i) return;
    const cost = +r.cells[2].firstChild.value || 0,
          qty = +r.cells[3].firstChild.value || 0;
    r.cells[4].firstChild.value = (cost * qty).toFixed(0);
  });
}

/* ---------- ORDER ---------- */
function addOrderRow(d = null) {
  const st = ["未出貨", "已出貨", "退貨"];
  const r = id("orderTable").insertRow();
  for (let i = 0; i < 7; i++) {
    const c = r.insertCell();
    let el;
    if (i === 6) el = btn(() => { r.remove(); saveTable("order", "orderTable"); });
    else if (i === 2) el = input(true, 1);
    else if (i === 4) el = sel(st);
    else if (i === 5) { el = input(false, new Date().toISOString().split("T")[0]); el.type = "date"; }
    else el = input(i === 3);
    c.appendChild(el);
  }
  if (d) [...r.cells].forEach((c, i) => c.firstChild.value = d[i] || "");
}

/* ---------- 啟動 ---------- */
window.addEventListener("DOMContentLoaded", () => {
  loadFin(); loadHist();
  loadTable("kol", addKolRow, "kolTable");
  loadTable("stock", addStockRow, "stockTable");
  loadTable("order", addOrderRow, "orderTable");
  show("finance");

  id("kolTable").addEventListener("input", () => saveTable("kol", "kolTable"));
  id("stockTable").addEventListener("input", () => saveTable("stock", "stockTable"));
  id("orderTable").addEventListener("input", () => saveTable("order", "orderTable"));
});

/* ---------- 小元件 ---------- */
const input = (n = false, v = "") => { const e = document.createElement("input"); if (n) e.type = "number"; e.value = v; return e; };
const sel = a => { const s = document.createElement("select"); a.forEach(o => s.add(new Option(o, o))); return s; };
const btn = f => { const b = document.createElement("button"); b.textContent = "🗑"; b.onclick = f; return b; };

/* ---------- 公開給 HTML ---------- */
window.show = show;
window.addKolRow = addKolRow;
window.addStockRow = addStockRow;
window.addOrderRow = addOrderRow;
window.debouncedCalc = debouncedCalc;
