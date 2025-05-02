// （原始的 Firebase 配置與初始化）
const firebaseConfig = { 
  // ...Firebase 專案設定 
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 原有的全域變數資料結構（初始化保持原樣）
let fin = {}, hist = {}, kol = {}, stock = {}, order = {}; 
// ...假設 fin, hist, kol, stock, order 原本是物件或陣列，這裡保持原始定義

// **修正1: 設置 Firestore 即時監聽** 
// 監聽 Firestore 中 "appData" 集合的 "sharedData" 文件（此名稱需與實際設計相符）
db.collection("appData").doc("sharedData")
  .onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      // 更新本地資料變數
      fin   = data.fin;
      hist  = data.hist;
      kol   = data.kol;
      stock = data.stock;
      order = data.order;
      console.log("Firestore資料已同步更新");  // 除錯用，可移除
      // 調用既有函式更新UI（根據原始程式邏輯，這可能是重新渲染表格或刷新欄位的函式）
      updateUI();
    }
});

// 原本載入資料的流程（如果有使用 .get() 讀取，可移除，因為 onSnapshot 已涵蓋初始讀取與後續更新）

// 原本儲存/更新資料至 Firestore 的函式
function saveDataToCloud() {
  // 將本地變數資料寫回 Firestore（集合和文件名稱與上方監聽相同）
  db.collection("appData").doc("sharedData").set({
    fin:   fin,
    hist:  hist,
    kol:   kol,
    stock: stock,
    order: order
  })
  .then(() => {
    console.log("資料已儲存到雲端");
  })
  .catch((error) => {
    console.error("儲存失敗:", error);
  });
}

// ...（此處保留使用者原有的其他功能程式碼，比如處理財務計算、庫存更新等邏輯）...

// 分頁切換函式（原始已有）
function show(page) {
  // 隱藏所有分頁內容區
  document.getElementById("financeSection").style.display = "none";
  document.getElementById("histSection").style.display    = "none";
  document.getElementById("kolSection").style.display     = "none";
  document.getElementById("stockSection").style.display   = "none";
  document.getElementById("orderSection").style.display   = "none";
  // 顯示指定的分頁內容區
  document.getElementById(page + "Section").style.display = "block";
}

// **修正2: Safari 分頁按鈕點擊支援** 
// 為分頁按鈕新增適當的事件監聽（包含觸控支援）
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const clickEvent = isTouchDevice ? "touchstart" : "click";

// 綁定導航列按鈕的事件監聽（假設HTML中有對應的按鈕或超連結元素）
document.getElementById("btnFinance").addEventListener(clickEvent, () => show("finance"));
document.getElementById("btnHist").addEventListener(clickEvent, () => show("hist"));
document.getElementById("btnKol").addEventListener(clickEvent, () => show("kol"));
document.getElementById("btnStock").addEventListener(clickEvent, () => show("stock"));
document.getElementById("btnOrder").addEventListener(clickEvent, () => show("order"));

// （附加說明：確保上述元素存在，且對應分頁區塊的ID為 financeSection, histSection 等等）

// 建議在CSS中加入： .tab-button { cursor: pointer; } 以確保Safari將自訂元素識別為可點擊元素
// 並確認若使用 <a> 標籤作為按鈕時，添加 href 屬性，例如 <a href="javascript:void(0)" id="btnKol">Kol</a>
