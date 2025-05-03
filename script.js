import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase 設定
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

// DOM 快捷
const id = i => document.getElementById(i);
const keys = ["capital", "income", "sellCost", "prCost", "kolCost", "opsCost"];
let pie, line, hist = [];
let debounceTimer;

function saveData() {
  const data = Object.fromEntries(keys.map(k => [k, id(k).value]));
  setDoc(doc(db, "finance", "fin"), data);
}

function loadData() {
  onSnapshot(doc(db, "finance", "fin"), snap => {
    if (!snap.exists()) return;
    const data = snap.data();
    keys.forEach(k => {
      if (document.activeElement !== id(k)) {
        id(k).value = data[k] || "";
      }
    });
    updateCharts();
  });

  onSnapshot(doc(db, "finance", "hist"), snap => {
    hist = snap.exists() ? snap.data().rows || [] : [];
    updateCharts();
  });
}

function saveHist() {
  setDoc(doc(db, "finance", "hist"), { rows: hist });
}

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
    saveHist();
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

window.debouncedCalc = function () {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    saveData();
    updateCharts();
  }, 300);
};

window.addEventListener("DOMContentLoaded", () => {
  loadData();
});
