// Firebase 初始化
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
const entriesRef = collection(db, "finance_entries");

// 快捷
const $ = q => document.querySelector(q);
const id = i => document.getElementById(i);

// 新增紀錄
id("addBtn").onclick = async () => {
  const type = id("type").value;
  const amount = +id("amount").value;
  const note = id("note").value;
  if (!amount || isNaN(amount)) return alert("請輸入正確金額");
  await addDoc(entriesRef, {
    type,
    amount,
    note,
    time: serverTimestamp()
  });
  id("amount").value = "";
  id("note").value = "";
};

// 即時同步
onSnapshot(entriesRef, snap => {
  const tbody = id("history");
  tbody.innerHTML = "";
  let total = 0;
  snap.forEach(doc => {
    const d = doc.data();
    const tr = document.createElement("tr");
    const amt = d.type === "income" ? d.amount : -d.amount;
    total += amt;
    tr.innerHTML = `
      <td>${d.type === "income" ? "收入" : "支出"}</td>
      <td>${d.amount}</td>
      <td>${d.note || ""}</td>
    `;
    tr.style.color = d.type === "income" ? "#3c6" : "#c44";
    tbody.appendChild(tr);
  });
  id("netProfit").textContent = total.toFixed(0);
});
