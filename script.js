/* ---------- 快捷 ---------- */
const $=q=>document.querySelector(q), $$=q=>document.querySelectorAll(q), id=i=>document.getElementById(i);

/* ---------- Firebase ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

/* ---------- 分頁切換（修復手機 Safari） ---------- */
function show(t){
  $$(".tab").forEach(e=>e.style.display="none");
  id(t).style.display="block";
  if(t==="kol"  && id("kolTable").rows.length===1)   addKolRow();
  if(t==="stock"&& id("stockTable").rows.length===1) addStockRow();
  if(t==="order"&& id("orderTable").rows.length===1) addOrderRow();
}

// 手機支援點擊綁定
window.addEventListener("DOMContentLoaded", () => {
  ["finance", "kol", "stock", "order"].forEach(page => {
    const btn = id("btn-" + page);
    if (btn) {
      btn.addEventListener("click", () => show(page));
      btn.addEventListener("touchstart", () => show(page));
    }
  });
});

/* ---------- 其他功能略（與你原本的一樣） ---------- */
// 若你要我把完整 js 整段貼上來，我也可以幫你補齊後面
/* ---------- 公開給 HTML 用 ---------- */
/* ---------- 啟動 ---------- */
window.addEventListener("DOMContentLoaded", ()=>{
  loadFin(); loadHist();
  loadTable("kol",   addKolRow,   "kolTable");
  loadTable("stock", addStockRow, "stockTable");
  loadTable("order", addOrderRow, "orderTable");
  show("finance");
});

/* ---------- 公開給 HTML 使用 ---------- */
window.show = show;
window.addKolRow = addKolRow;
window.addStockRow = addStockRow;
window.addOrderRow = addOrderRow;
window.debouncedCalc = debouncedCalc;

