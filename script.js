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
function show(tab) {
  $$(".tab").forEach(e => e.style.display = "none");
  id(tab).style.display = "block";
}

/* ---------- 財務模組 ---------- */
const finKeys = ["capital","income","sellCost","prCost","kolCost","opsCost"];
const loadFin = () => {
  onSnapshot(doc(db, "finance", "data"), snap => {
    if (snap.exists()) {
      const data = snap.data();
      finKeys.forEach(k => id(k).value = data[k] || "");
      updateFinance();
    }
  });
};
const saveFin = () => {
  const data = Object.fromEntries(finKeys.map(k => [k, id(k).value]));
  setDoc(doc(db, "finance", "data"), data);
};
function updateFinance() {
  const n = k => +id(k).value || 0;
  const profit = n("income") - n("sellCost") - n("prCost") - n("kolCost") - n("opsCost");
  id("netProfit").textContent = profit;
}

/* ---------- 表格存取 (共用) ---------- */
function loadTable(name, tableId, addRowFn) {
  onSnapshot(doc(db, "tables", name), snap => {
    const data = snap.exists() ? snap.data().rows : [];
    while (id(tableId).rows.length > 1) id(tableId).deleteRow(1);
    if (!data.length) addRowFn();
    else data.forEach(addRowFn);
  });
}
function saveTable(name, tableId) {
  const rows = [...id(tableId).rows].slice(1).map(r =>
    [...r.querySelectorAll("input,select")].map(e => e.value)
  );
  setDoc(doc(db, "tables", name), { rows });
}

/* ---------- KOL ---------- */
function addKolRow(data = []) {
  const row = id("kolTable").insertRow();
  const status = ["未寄出", "已寄出"];
  const cells = ["text", "text", "number", "number", "number", "number", "select", "button"];
  cells.forEach((type, i) => {
    const cell = row.insertCell();
    let el;
    if (type === "select") {
      el = sel(status);
    } else if (type === "button") {
      el = btn(() => { row.remove(); sumKOL(); saveTable("kol", "kolTable"); });
    } else {
      el = input(type === "number", data[i] || "");
    }
    if (data[i]) el.value = data[i];
    cell.appendChild(el);
  });
  row.addEventListener("input", () => { sumKOL(); saveTable("kol", "kolTable"); });
  row.addEventListener("change", () => { sumKOL(); saveTable("kol", "kolTable"); });
  sumKOL();
}
function sumKOL() {
  let total = 0;
  $$("#kolTable tr").forEach((r, i) => {
    if (!i) return;
    const [,, p, q, rp, amt] = r.querySelectorAll("input");
    const val = (+p.value) * (+q.value) * (+rp.value) / 100;
    amt.value = isNaN(val) ? 0 : val.toFixed(0);
    total += +amt.value;
  });
  id("kolCost").value = total;
  saveFin(); updateFinance();
}

/* ---------- 庫存 ---------- */
function addStockRow(data = []) {
  const cats = ["電子產品","美妝","居家","服飾","3C配件","其他"];
  const row = id("stockTable").insertRow();
  for (let i = 0; i < 8; i++) {
    const cell = row.insertCell();
    let el;
    if (i === 1) el = sel(cats);
    else if (i === 7) el = btn(() => { row.remove(); saveTable("stock", "stockTable"); });
    else el = input([2,3,5].includes(i), data[i] || "");
    if (i === 4) el.readOnly = true;
    if (data[i]) el.value = data[i];
    cell.appendChild(el);
  }
  row.addEventListener("input", () => { sumStock(); saveTable("stock", "stockTable"); });
  row.addEventListener("change", () => { sumStock(); saveTable("stock", "stockTable"); });
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

/* ---------- 訂單 ---------- */
function addOrderRow(data = []) {
  const st = ["未出貨", "已出貨", "退貨"];
  const row = id("orderTable").insertRow();
  for (let i = 0; i < 7; i++) {
    const cell = row.insertCell();
    let el;
    if (i === 4) el = sel(st);
    else if (i === 6) el = btn(() => { row.remove(); saveTable("order", "orderTable"); });
    else el = input(i === 2 || i === 3, data[i] || "");
    if (i === 5) el.type = "date";
    cell.appendChild(el);
  }
  row.addEventListener("input", () => saveTable("order", "orderTable"));
  row.addEventListener("change", () => saveTable("order", "orderTable"));
}

/* ---------- 小元件 ---------- */
const input = (num = false, v = "") => { const e = document.createElement("input"); if (num) e.type = "number"; e.value = v; return e; };
const sel = arr => { const s = document.createElement("select"); arr.forEach(opt => s.add(new Option(opt, opt))); return s; };
const btn = f => { const b = document.createElement("button"); b.textContent = "🗑"; b.onclick = f; return b; };

/* ---------- 啟動 ---------- */
window.addEventListener("DOMContentLoaded", () => {
  show("finance");
  loadFin(); loadHist();
  loadTable("kol", addKolRow, "kolTable");
  loadTable("stock", addStockRow, "stockTable");
  loadTable("order", addOrderRow, "orderTable");
});

/* ---------- 公開 ---------- */
window.show = show;
window.addKolRow = addKolRow;
window.addStockRow = addStockRow;
window.addOrderRow = addOrderRow;
