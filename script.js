// Firebase 初始化
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

const form = document.getElementById("recordForm");
const list = document.getElementById("historyList");
const netProfit = document.getElementById("netProfit");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const type = form.type.value;
  const amount = parseFloat(form.amount.value);
  const date = form.date.value;
  if (!type || !amount || !date) return alert("請填寫完整欄位");

  await addDoc(collection(db, "records"), {
    type,
    amount,
    date,
    createdAt: serverTimestamp()
  });
  form.reset();
});

function render(data) {
  list.innerHTML = "";
  let total = 0;
  data.forEach(docSnap => {
    const r = docSnap.data();
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${r.date}</span>
      <span>${r.type}</span>
      <span>${r.amount}</span>
      <button data-id="${docSnap.id}" class="del">🗑</button>
    `;
    list.appendChild(li);
    total += (r.type === "收入" ? r.amount : -r.amount);
  });
  netProfit.textContent = total;
  netProfit.style.color = total >= 0 ? "#0f0" : "#f44";
}

onSnapshot(collection(db, "records"), (snap) => {
  const docs = snap.docs.sort((a,b)=> (a.data().date || "") > (b.data().date || "") ? 1 : -1);
  render(docs);
});

list.addEventListener("click", async (e) => {
  if (e.target.classList.contains("del")) {
    const id = e.target.dataset.id;
    await deleteDoc(doc(db, "records", id));
  }
});
