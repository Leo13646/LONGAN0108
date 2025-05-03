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
  $$('.tab').forEach(el => el.style.display = 'none');
  id(tab).style.display = 'block';
}

/* ---------- 財務 ---------- */
const financeKeys = ["capital", "income", "sellCost", "prCost", "kolCost", "opsCost"];
const saveFinance = () => {
  const data = Object.fromEntries(financeKeys.map(k => [k, id(k).value]));
  setDoc(doc(db, "finance", "values"), data);
};
const loadFinance = () => {
  onSnapshot(doc(db, "finance", "values"), snap => {
    if (!snap.exists()) return;
    for (const [k, v] of Object.entries(snap.data())) {
      id(k).value = v;
    }
    calcNetProfit();
  });
};

function calcNetProfit() {
  const n = k => +id(k).value || 0;
  const net = n("income") - n("sellCost") - n("prCost") - n("kolCost") - n("opsCost");
  id("netProfit").textContent = net.toFixed(0);
}

financeKeys.forEach(k => {
  id(k)?.addEventListener("input", () => {
    saveFinance();
    calcNetProfit();
  });
});

/* ---------- 表格 ---------- */
function saveTable(name, tableId) {
  const rows = [...id(tableId).rows].slice(1).map(r =>
    [...r.querySelectorAll("input, select")].map(el => el.value)
  );
  setDoc(doc(db, "tables", name), { rows });
}
function loadTable(name, tableId, addRow) {
  onSnapshot(doc(db, "tables", name), snap => {
    if (!snap.exists()) return;
    const data = snap.data().rows || [];
    while (id(tableId).rows.length > 1) id(tableId).deleteRow(1);
    if (data.length === 0) addRow();
    else data.forEach(addRow);
  });
}

function inputCell(isNumber = false, value = "") {
  const el = document.createElement("input");
  if (isNumber) el.type = "number";
  el.value = value;
  return el;
}
function selectCell(options, value = "") {
  const s = document.createElement("select");
  options.forEach(opt => s.add(new Option(opt, opt)));
  s.value = value;
  return s;
}
function deleteBtn(onClick) {
  const btn = document.createElement("button");
  btn.textContent = "🗑";
  btn.onclick = onClick;
  return btn;
}

/* ---------- KOL ---------- */
function addKolRow(data = []) {
  const r = id("kolTable").insertRow();
  const st = ["未寄出", "已寄出"];
  ["", "", "", "", "", "", "", ""].forEach((_, i) => {
    const c = r.insertCell();
    let el;
    if (i === 6) el = selectCell(st, data[i]);
    else if (i === 7) el = deleteBtn(() => { r.remove(); saveTable("kol", "kolTable"); });
    else el = inputCell(i > 1 && i < 6, data[i] || "");
    c.appendChild(el);
  });
  r.addEventListener("input", () => saveTable("kol", "kolTable"));
  r.addEventListener("change", () => saveTable("kol", "kolTable"));
}

/* ---------- STOCK ---------- */
function addStockRow(data = []) {
  const r = id("stockTable").insertRow();
  const cat = ["電子產品", "美妝", "居家", "服飾", "3C配件", "其他"];
  ["", "", "", "", "", "", "", ""].forEach((_, i) => {
    const c = r.insertCell();
    let el;
    if (i === 1) el = selectCell(cat, data[i]);
    else if (i === 7) el = deleteBtn(() => { r.remove(); saveTable("stock", "stockTable"); });
    else el = inputCell(i === 2 || i === 3 || i === 5, data[i] || "");
    c.appendChild(el);
  });
  r.addEventListener("input", () => saveTable("stock", "stockTable"));
  r.addEventListener("change", () => saveTable("stock", "stockTable"));
}

/* ---------- ORDER ---------- */
function addOrderRow(data = []) {
  const r = id("orderTable").insertRow();
  const st = ["未出貨", "已出貨", "退貨"];
  ["", "", "", "", "", "", ""].forEach((_, i) => {
    const c = r.insertCell();
    let el;
    if (i === 4) el = selectCell(st, data[i]);
    else if (i === 5) { el = inputCell(false, data[i] || new Date().toISOString().split("T")[0]); el.type = "date"; }
    else if (i === 6) el = deleteBtn(() => { r.remove(); saveTable("order", "orderTable"); });
    else el = inputCell(i === 2 || i === 3, data[i] || "");
    c.appendChild(el);
  });
  r.addEventListener("input", () => saveTable("order", "orderTable"));
  r.addEventListener("change", () => saveTable("order", "orderTable"));
}

/* ---------- 啟動 ---------- */
window.addEventListener("DOMContentLoaded", () => {
  show("finance");
  loadFinance();
  loadTable("kol", addKolRow, "kolTable");
  loadTable("stock", addStockRow, "stockTable");
  loadTable("order", addOrderRow, "orderTable");
});

/* ---------- 導出 ---------- */
window.show = show;
window.addKolRow = addKolRow;
window.addStockRow = addStockRow;
window.addOrderRow = addOrderRow;
