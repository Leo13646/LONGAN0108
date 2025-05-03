// Firebase v9 Modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

const form = document.getElementById("financeForm");
const historyList = document.getElementById("history");
const profitDisplay = document.getElementById("netProfit");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const type = document.getElementById("type").value;
  const amount = parseInt(document.getElementById("amount").value);
  const date = document.getElementById("date").value;

  if (!amount || !date) return;

  await addDoc(collection(db, "financeHistory"), {
    type,
    amount,
    date,
    timestamp: Date.now()
  });

  form.reset();
});

function renderHistory(snapshotDocs) {
  historyList.innerHTML = "";
  let total = 0;

  snapshotDocs.forEach(doc => {
    const { type, amount, date } = doc.data();
    const item = document.createElement("div");
    item.className = `history-item ${type}`;
    item.innerHTML = `<span>${date}</span><span>${type === 'income' ? '+' : '-'}$${amount}</span>`;
    historyList.appendChild(item);
    total += type === 'income' ? amount : -amount;
  });

  profitDisplay.textContent = `淨利：$${total}`;
  profitDisplay.className = `net-profit ${total >= 0 ? 'positive' : 'negative'}`;
}

onSnapshot(collection(db, "financeHistory"), (snapshot) => {
  const docs = snapshot.docs.sort((a, b) => a.data().timestamp - b.data().timestamp);
  renderHistory(docs);
});
