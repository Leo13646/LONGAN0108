/* ---------- 快捷 ---------- */
const $ = q => document.querySelector(q);
const $$ = q => document.querySelectorAll(q);
const id = i => document.getElementById(i);

/* ---------- Firebase 初始化 ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

/* ---------- 顯示數字與更新圖表 ---------- */
let pie, line, hist = [];

function updateCharts() {
  const costs = ["sell", "pr", "kol", "ops"].map(idName => +id(idName).value || 0);
  const income = +id("income").value || 0;
  const profit = income - costs.reduce((a, b) => a + b, 0);
  id("profit").textContent = profit.toFixed(0);
  id("profit").style.color = profit >= 0 ? "#4caf50" : "#f44336";

  pie?.destroy();
  pie = new Chart(id("pie"), {
    type: "pie",
    data: {
      labels: ["銷售支出", "公關贈送", "KOL 分潤", "營運支出"],
      datasets: [{ data: costs, backgroundColor: ["#333", "#555", "#777", "#999"] }]
    },
    options: { plugins: { legend: { labels: { color: "#ccc" } } } }
  });

  line?.destroy();
  line = new Chart(id("line"), {
    type: "line",
    data: {
      labels: hist.map(d => d.date),
      datasets: [{ label: "淨利", data: hist.map(d => d.profit), borderColor: "#fff", backgroundColor: "rgba(255,255,255,0.1)", fill: true, tension: 0.3 }]
    },
    options: { scales: { x: { ticks: { color: "#ccc" } }, y: { ticks: { color: "#ccc" } } }, plugins: { legend: { labels: { color: "#ccc" } } } }
  });
}

/* ---------- 載入與儲存 ---------- */
async function loadData() {
  const snap = await getDoc(doc(db, "finance", "data"));
  if (snap.exists()) {
    const d = snap.data();
    ["income", "sell", "pr", "kol", "ops"].forEach(k => id(k).value = d[k] || "");
    updateCharts();
  }

  onSnapshot(doc(db, "finance", "hist"), snap => {
    hist = snap.exists() ? snap.data().list || [] : [];
    updateCharts();
  });
}

async function saveData() {
  const data = Object.fromEntries(["income", "sell", "pr", "kol", "ops"].map(k => [k, id(k).value]));
  await setDoc(doc(db, "finance", "data"), data);
  updateCharts();
}

async function addRecord() {
  const today = new Date().toLocaleDateString();
  const profit = +id("income").value - +id("sell").value - +id("pr").value - +id("kol").value - +id("ops").value;
  hist.push({ date: today, profit });
  await setDoc(doc(db, "finance", "hist"), { list: hist });
  updateCharts();
}

/* ---------- 綁定 ---------- */
id("saveBtn").onclick = saveData;
id("addBtn").onclick = addRecord;

["income", "sell", "pr", "kol", "ops"].forEach(idName => {
  id(idName).oninput = () => updateCharts();
});

loadData();
