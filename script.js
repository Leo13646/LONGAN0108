/* ---------- 快捷 ---------- */
const $ = q => document.querySelector(q);
const $$ = q => document.querySelectorAll(q);
const id = i => document.getElementById(i);

/* ---------- Firebase 初始化 ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_t-Yfmxfy8uAqGgQMb3AZarNrzYocByM",
  authDomain: "longan-aef50.firebaseapp.com",
  projectId: "longan-aef50",
  storageBucket: "longan-aef50.appspot.com",
  messagingSenderId: "632631753622",
  appId: "1:632631753622:web:395d077de61b86f9053bb7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ---------- 功能 ---------- */
const form = id("recordForm");
const table = id("recordTable");
const totalDisplay = id("netProfit");

form.addEventListener("submit", async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  data.timestamp = serverTimestamp();
  data.amount = parseInt(data.amount);
  data.type = data.type || "收入";
  await addDoc(collection(db, "records"), data);
  form.reset();
});

onSnapshot(collection(db, "records"), snap => {
  let total = 0;
  table.innerHTML = "";
  snap.forEach(doc => {
    const d = doc.data();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${d.category || "--"}</td>
      <td>${d.type}</td>
      <td class="amt" style="color:${d.amount>=0?'#0f0':'#f44'}">${d.amount}</td>
      <td>${d.note || ""}</td>
    `;
    table.appendChild(row);
    total += d.amount;
  });
  totalDisplay.textContent = total;
  totalDisplay.style.color = total >= 0 ? "#0f0" : "#f44";
});
