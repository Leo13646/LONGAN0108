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
const recordsRef = collection(db, "records");

const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const addBtn = document.getElementById("addRecord");
const historyTable = document.getElementById("historyTable");
const netProfitSpan = document.getElementById("netProfit");

addBtn.onclick = async () => {
  const type = typeInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const date = dateInput.value;

  if (!type || isNaN(amount) || !date) return alert("請輸入所有欄位");

  await addDoc(recordsRef, { type, amount, date });
  typeInput.value = "";
  amountInput.value = "";
  dateInput.value = "";
};

onSnapshot(recordsRef, snap => {
  const rows = [];
  let total = 0;
  snap.forEach(doc => {
    const { type, amount, date } = doc.data();
    total += amount;
    rows.push(`<tr><td>${type}</td><td>${amount}</td><td>${date}</td></tr>`);
  });
  historyTable.innerHTML = rows.join("");
  netProfitSpan.textContent = total.toFixed(0);
  netProfitSpan.className = total >= 0 ? "positive" : "negative";
});
