// Firebase + 財務報表：改為記錄每一筆收入/支出的明細
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

const addEntry = async (type) => {
  const table = document.getElementById("logTable");
  const row = table.insertRow();

  const descCell = row.insertCell();
  const amountCell = row.insertCell();
  const typeCell = row.insertCell();
  const dateCell = row.insertCell();

  const descInput = document.createElement("input");
  const amountInput = document.createElement("input");
  amountInput.type = "number";
  const typeSpan = document.createElement("span");
  typeSpan.textContent = type === "income" ? "收入" : "支出";
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.value = new Date().toISOString().split("T")[0];

  descCell.appendChild(descInput);
  amountCell.appendChild(amountInput);
  typeCell.appendChild(typeSpan);
  dateCell.appendChild(dateInput);

  // 自動儲存這筆紀錄
  row.addEventListener("change", async () => {
    const record = {
      desc: descInput.value,
      amount: +amountInput.value,
      type,
      date: dateInput.value,
      createdAt: Date.now()
    };
    await addDoc(collection(db, "records"), record);
  });
};

const loadEntries = () => {
  const table = document.getElementById("logTable");
  onSnapshot(collection(db, "records"), snap => {
    while (table.rows.length > 1) table.deleteRow(1);
    let profit = 0;
    snap.forEach(doc => {
      const d = doc.data();
      const row = table.insertRow();
      row.insertCell().textContent = d.desc;
      row.insertCell().textContent = d.amount;
      row.insertCell().textContent = d.type === "income" ? "收入" : "支出";
      row.insertCell().textContent = d.date;
      if (d.type === "income") profit += d.amount;
      else profit -= d.amount;
    });
    const np = document.getElementById("netProfit");
    np.textContent = profit;
    np.style.color = profit >= 0 ? "#0f0" : "#f33";
  });
};

window.addEventListener("DOMContentLoaded", () => {
  $(`#addIncome`).onclick = () => addEntry("income");
  $(`#addExpense`).onclick = () => addEntry("expense");
  loadEntries();
});
