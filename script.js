// 初始化 Firebase（將以下配置替換為您的 Firebase 專案設定）:contentReference[oaicite:0]{index=0}
const firebaseConfig = {
  apiKey: "YOUR-API-KEY",                   // ←填入您的 API Key
  authDomain: "your-project-id.firebaseapp.com", // ←填入您的 Auth 網域
  projectId: "your-project-id",             // ←填入您的 Project ID
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR-SENDER-ID",
  appId: "YOUR-APP-ID"
};
firebase.initializeApp(firebaseConfig);
// 取得 Firestore 資料庫引用
const db = firebase.firestore();

// 全域變數：紀錄正在編輯的文件 ID（用於更新操作）
let editingFinanceId = null;
let editingKolId = null;
let editingInventoryId = null;
let editingOrdersId = null;

// 監聽 Firestore 資料的即時更新:contentReference[oaicite:1]{index=1}
// 財務資料集合即時監聽
db.collection("finances").orderBy("createdAt").onSnapshot(snapshot => {
  const financeListEl = document.getElementById("finance-list");
  financeListEl.innerHTML = ""; // 清空現有列表
  let sumsByCategory = {};      // 用於累積各類別的金額 (供圖表使用)
  snapshot.forEach(doc => {
    const data = doc.data();
    const id = doc.id;
    // 累計各類別金額
    if (data.category && data.amount !== undefined) {
      sumsByCategory[data.category] = (sumsByCategory[data.category] || 0) + data.amount;
    }
    // 建立列表項目 (含編輯、刪除按鈕)
    const li = document.createElement("li");
    li.dataset.id = id;
    if (data.category !== undefined) li.dataset.category = data.category;
    if (data.amount !== undefined) li.dataset.amount = data.amount;
    li.innerHTML = `
      ${data.category ? data.category : ""} ${data.amount !== undefined ? ": $" + data.amount : ""}
      <button class="edit-finance">編輯</button>
      <button class="delete-finance">刪除</button>
    `;
    financeListEl.appendChild(li);
  });
  // 更新財務圖表
  updateFinanceChart(sumsByCategory);
});

// KOL 資料集合即時監聽
db.collection("kols").orderBy("createdAt").onSnapshot(snapshot => {
  const kolListEl = document.getElementById("kol-list");
  kolListEl.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    const id = doc.id;
    const li = document.createElement("li");
    li.dataset.id = id;
    if (data.name !== undefined) li.dataset.name = data.name;
    li.innerHTML = `
      ${data.name ? data.name : ""}
      <button class="edit-kol">編輯</button>
      <button class="delete-kol">刪除</button>
    `;
    kolListEl.appendChild(li);
  });
});

// 庫存資料集合即時監聽
db.collection("inventory").orderBy("createdAt").onSnapshot(snapshot => {
  const invListEl = document.getElementById("inventory-list");
  invListEl.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    const id = doc.id;
    const li = document.createElement("li");
    li.dataset.id = id;
    if (data.name !== undefined) li.dataset.name = data.name;
    if (data.quantity !== undefined) li.dataset.quantity = data.quantity;
    li.innerHTML = `
      ${data.name ? data.name : ""} ${data.quantity !== undefined ? "（數量: " + data.quantity + "）" : ""}
      <button class="edit-inventory">編輯</button>
      <button class="delete-inventory">刪除</button>
    `;
    invListEl.appendChild(li);
  });
});

// 訂單資料集合即時監聽
db.collection("orders").orderBy("createdAt").onSnapshot(snapshot => {
  const orderListEl = document.getElementById("orders-list");
  orderListEl.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    const id = doc.id;
    const li = document.createElement("li");
    li.dataset.id = id;
    if (data.name !== undefined) li.dataset.name = data.name;
    if (data.quantity !== undefined) li.dataset.quantity = data.quantity;
    li.innerHTML = `
      ${data.name ? data.name : ""} ${data.quantity !== undefined ? "（數量: " + data.quantity + "）" : ""}
      <button class="edit-orders">編輯</button>
      <button class="delete-orders">刪除</button>
    `;
    orderListEl.appendChild(li);
  });
});

// 財務圖表初始化與更新函式 (使用 Chart.js)
let financeChart = null;
function updateFinanceChart(sumsByCategory) {
  const ctx = document.getElementById("financeChart").getContext("2d");
  const categories = Object.keys(sumsByCategory);
  const amounts = Object.values(sumsByCategory);
  if (!financeChart) {
    // 初始化圖表
    financeChart = new Chart(ctx, {
      type: "pie",  // 使用圓餅圖呈現各類別比例
      data: {
        labels: categories,
        datasets: [{
          data: amounts,
          backgroundColor: categories.map((_, i) => {
            // 隨機生成顏色
            const r = Math.floor(Math.random()*255);
            const g = Math.floor(Math.random()*255);
            const b = Math.floor(Math.random()*255);
            return `rgba(${r}, ${g}, ${b}, 0.7)`;
          })
        }]
      },
      options: {
        plugins: {
          legend: { position: "bottom" }
        },
        maintainAspectRatio: false
      }
    });
  } else {
    // 更新現有圖表資料
    financeChart.data.labels = categories;
    financeChart.data.datasets[0].data = amounts;
    financeChart.update();
  }
}

// 新增資料函式（財務、KOL、庫存、訂單共用）:contentReference[oaicite:2]{index=2}
function addDocument(collection, data) {
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  return db.collection(collection).add(data)  // 使用 add 新增文件（由系統自動產生 ID）
    .catch(err => console.error("新增資料錯誤：", err));
}

// 更新資料函式（根據集合名稱與文件ID）
function updateDocument(collection, docId, data) {
  return db.collection(collection).doc(docId).update(data)  // 使用 update 更新文件
    .catch(err => console.error("更新資料錯誤：", err));
}

// 刪除資料函式（根據集合名稱與文件ID）
function deleteDocument(collection, docId) {
  return db.collection(collection).doc(docId).delete()      // 使用 delete 刪除文件
    .catch(err => console.error("刪除資料錯誤：", err));
}

// 表單送出事件處理 - 財務資料
document.getElementById("finance-form").addEventListener("submit", e => {
  e.preventDefault();
  const category = document.getElementById("finance-category").value;
  const amount = parseFloat(document.getElementById("finance-amount").value);
  if (editingFinanceId) {
    // 更新模式
    updateDocument("finances", editingFinanceId, { category, amount });
  } else {
    // 新增模式
    addDocument("finances", { category, amount });
  }
  // 重置表單狀態
  document.getElementById("finance-form").reset();
  editingFinanceId = null;
  document.getElementById("finance-add-btn").style.display = "inline-block";
  document.getElementById("finance-update-btn").style.display = "none";
  document.getElementById("finance-cancel-btn").style.display = "none";
});

// 表單送出事件處理 - KOL
document.getElementById("kol-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("kol-name").value;
  if (editingKolId) {
    updateDocument("kols", editingKolId, { name });
  } else {
    addDocument("kols", { name });
  }
  document.getElementById("kol-form").reset();
  editingKolId = null;
  document.getElementById("kol-add-btn").style.display = "inline-block";
  document.getElementById("kol-update-btn").style.display = "none";
  document.getElementById("kol-cancel-btn").style.display = "none";
});

// 表單送出事件處理 - 庫存
document.getElementById("inventory-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("inventory-name").value;
  const quantity = parseFloat(document.getElementById("inventory-quantity").value);
  if (editingInventoryId) {
    updateDocument("inventory", editingInventoryId, { name, quantity });
  } else {
    addDocument("inventory", { name, quantity });
  }
  document.getElementById("inventory-form").reset();
  editingInventoryId = null;
  document.getElementById("inventory-add-btn").style.display = "inline-block";
  document.getElementById("inventory-update-btn").style.display = "none";
  document.getElementById("inventory-cancel-btn").style.display = "none";
});

// 表單送出事件處理 - 訂單
document.getElementById("orders-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("orders-name").value;
  const quantity = parseFloat(document.getElementById("orders-quantity").value);
  if (editingOrdersId) {
    updateDocument("orders", editingOrdersId, { name, quantity });
  } else {
    addDocument("orders", { name, quantity });
  }
  document.getElementById("orders-form").reset();
  editingOrdersId = null;
  document.getElementById("orders-add-btn").style.display = "inline-block";
  document.getElementById("orders-update-btn").style.display = "none";
  document.getElementById("orders-cancel-btn").style.display = "none";
});

// 列表按鈕點擊事件代理 - 財務資料清單
document.getElementById("finance-list").addEventListener("click", e => {
  const target = e.target;
  const li = target.closest("li");
  if (!li) return;
  const docId = li.dataset.id;
  if (target.classList.contains("edit-finance")) {
    // 編輯按鈕：載入資料到表單
    document.getElementById("finance-category").value = li.dataset.category || "";
    document.getElementById("finance-amount").value = li.dataset.amount || "";
    editingFinanceId = docId;
    document.getElementById("finance-add-btn").style.display = "none";
    document.getElementById("finance-update-btn").style.display = "inline-block";
    document.getElementById("finance-cancel-btn").style.display = "inline-block";
  } else if (target.classList.contains("delete-finance")) {
    // 刪除按鈕：從 Firestore 刪除該文件
    deleteDocument("finances", docId);
    // 若正在編輯同一筆資料，取消編輯狀態
    if (editingFinanceId === docId) {
      document.getElementById("finance-form").reset();
      editingFinanceId = null;
      document.getElementById("finance-add-btn").style.display = "inline-block";
      document.getElementById("finance-update-btn").style.display = "none";
      document.getElementById("finance-cancel-btn").style.display = "none";
    }
  }
});

// 列表按鈕點擊事件代理 - KOL 清單
document.getElementById("kol-list").addEventListener("click", e => {
  const target = e.target;
  const li = target.closest("li");
  if (!li) return;
  const docId = li.dataset.id;
  if (target.classList.contains("edit-kol")) {
    document.getElementById("kol-name").value = li.dataset.name || "";
    editingKolId = docId;
    document.getElementById("kol-add-btn").style.display = "none";
    document.getElementById("kol-update-btn").style.display = "inline-block";
    document.getElementById("kol-cancel-btn").style.display = "inline-block";
  } else if (target.classList.contains("delete-kol")) {
    deleteDocument("kols", docId);
    if (editingKolId === docId) {
      document.getElementById("kol-form").reset();
      editingKolId = null;
      document.getElementById("kol-add-btn").style.display = "inline-block";
      document.getElementById("kol-update-btn").style.display = "none";
      document.getElementById("kol-cancel-btn").style.display = "none";
    }
  }
});

// 列表按鈕點擊事件代理 - 庫存清單
document.getElementById("inventory-list").addEventListener("click", e => {
  const target = e.target;
  const li = target.closest("li");
  if (!li) return;
  const docId = li.dataset.id;
  if (target.classList.contains("edit-inventory")) {
    document.getElementById("inventory-name").value = li.dataset.name || "";
    document.getElementById("inventory-quantity").value = li.dataset.quantity || "";
    editingInventoryId = docId;
    document.getElementById("inventory-add-btn").style.display = "none";
    document.getElementById("inventory-update-btn").style.display = "inline-block";
    document.getElementById("inventory-cancel-btn").style.display = "inline-block";
  } else if (target.classList.contains("delete-inventory")) {
    deleteDocument("inventory", docId);
    if (editingInventoryId === docId) {
      document.getElementById("inventory-form").reset();
      editingInventoryId = null;
      document.getElementById("inventory-add-btn").style.display = "inline-block";
      document.getElementById("inventory-update-btn").style.display = "none";
      document.getElementById("inventory-cancel-btn").style.display = "none";
    }
  }
});

// 列表按鈕點擊事件代理 - 訂單清單
document.getElementById("orders-list").addEventListener("click", e => {
  const target = e.target;
  const li = target.closest("li");
  if (!li) return;
  const docId = li.dataset.id;
  if (target.classList.contains("edit-orders")) {
    document.getElementById("orders-name").value = li.dataset.name || "";
    document.getElementById("orders-quantity").value = li.dataset.quantity || "";
    editingOrdersId = docId;
    document.getElementById("orders-add-btn").style.display = "none";
    document.getElementById("orders-update-btn").style.display = "inline-block";
    document.getElementById("orders-cancel-btn").style.display = "inline-block";
  } else if (target.classList.contains("delete-orders")) {
    deleteDocument("orders", docId);
    if (editingOrdersId === docId) {
      document.getElementById("orders-form").reset();
      editingOrdersId = null;
      document.getElementById("orders-add-btn").style.display = "inline-block";
      document.getElementById("orders-update-btn").style.display = "none";
      document.getElementById("orders-cancel-btn").style.display = "none";
    }
  }
});
