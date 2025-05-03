// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

const $ = q => document.querySelector(q);
const $$ = q => document.querySelectorAll(q);
const id = i => document.getElementById(i);

const incomeInput = id("income");
const costInput = id("cost");
const typeSelect = id("type");
const noteInput = id("note");
const historyList = id("history");
const netProfit = id("netProfit");
const pieCanvas = id("pie");
const lineCanvas = id("line");

let pieChart, lineChart;
let historyData = [];

async function saveRecord() {
  const income = parseInt(incomeInput.value || 0);
  const cost = parseInt(costInput.value || 0);
  const type = typeSelect.value;
  const note = noteInput.value;
  const time = new Date().toLocaleString();
  if (!income && !cost) return;

  await addDoc(collection(db, "records"), {
    income,
    cost,
    type,
    note,
    time
  });

  incomeInput.value = "";
  costInput.value = "";
  noteInput.value = "";
}

function updateCharts() {
  let totalIncome = 0, totalCost = 0;
  const lineData = [];
  const pieMap = { "銷售": 0, "營運": 0, "公關": 0, "KOL": 0 };

  historyData.forEach(entry => {
    totalIncome += entry.income;
    totalCost += entry.cost;
    lineData.push({ x: entry.time, y: entry.income - entry.cost });
    pieMap[entry.type] = (pieMap[entry.type] || 0) + entry.cost;
  });

  const net = totalIncome - totalCost;
  netProfit.textContent = net;
  netProfit.style.color = net >= 0 ? "#3f0" : "#f33";

  pieChart?.destroy();
  pieChart = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: Object.keys(pieMap),
      datasets: [{
        data: Object.values(pieMap),
        backgroundColor: ["#444", "#666", "#888", "#aaa"]
      }]
    },
    options: { animation: false, plugins: { legend: { labels: { color: "#ccc" } } } }
  });

  lineChart?.destroy();
  lineChart = new Chart(lineCanvas, {
    type: "line",
    data: {
      labels: lineData.map(d => d.x),
      datasets: [{
        label: "淨利",
        data: lineData.map(d => d.y),
        fill: true,
        borderColor: "#0f0",
        backgroundColor: "rgba(0,255,0,0.2)",
        tension: 0.3
      }]
    },
    options: { animation: false, scales: { x: { ticks: { color: "#ccc" } }, y: { ticks: { color: "#ccc" } } }, plugins: { legend: { labels: { color: "#ccc" } } } }
  });
}

function renderHistory() {
  historyList.innerHTML = "";
  historyData.slice().reverse().forEach(entry => {
    const item = document.createElement("li");
    item.innerHTML = `<b>${entry.type}</b> | 收入：${entry.income}，支出：${entry.cost} | ${entry.note} <span style="opacity:.5">(${entry.time})</span>`;
    historyList.appendChild(item);
  });
}

onSnapshot(collection(db, "records"), snap => {
  historyData = [];
  snap.forEach(doc => historyData.push(doc.data()));
  updateCharts();
  renderHistory();
});

id("addBtn").onclick = saveRecord;
