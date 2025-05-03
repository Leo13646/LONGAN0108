// 初始化 Firebase (使用 v11 模組語法匯入 SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, doc, getDocs, getDoc,
         addDoc, setDoc, updateDoc, deleteDoc, onSnapshot } 
       from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// TODO: 在此處填入您的 Firebase 專案設定
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
// 初始化 Firebase App 與 Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 頁籤切換函式：顯示指定的區塊，隱藏其它區塊
function show(tabName) {
    document.querySelectorAll('.tab').forEach(sec => {
        sec.style.display = (sec.id === tabName ? 'block' : 'none');
    });
}

// ** 財務模組 (Finance) **

// 取得財務集合下的文件參考
const finDocRef  = doc(db, "finance", "fin");
const histDocRef = doc(db, "finance", "hist");

// 預設的財務數據（若首次使用沒有資料時初始化用）
const defaultFinData = {
    capital: 0,
    income: 0,
    salesExpense: 0,
    prExpense: 0,
    kolExpense: 0
};
// 預設的歷史數據結構
const defaultHistData = {
    netHistory: []  // 用於儲存歷史淨利等數據的陣列（初始為空）
};

// 檢查並初始化財務資料
getDoc(finDocRef).then((docSnap) => {
    if (!docSnap.exists()) {
        // 若 finance/fin 不存在，建立預設文件
        setDoc(finDocRef, defaultFinData);
    }
});
getDoc(histDocRef).then((docSnap) => {
    if (!docSnap.exists()) {
        // 若 finance/hist 不存在，建立預設歷史記錄文件
        setDoc(histDocRef, defaultHistData);
    }
});

// 財務欄位對應的 DOM 元素取得
const capitalInput     = document.getElementById('capital');
const incomeInput      = document.getElementById('income');
const salesInput       = document.getElementById('sales');     // 假設 HTML 中 id="sales" 對應「銷售支出」
const prInput          = document.getElementById('pr');        // 假設 id="pr" 對應「公關贈送」
const kolExpInput      = document.getElementById('kol');       // 假設 id="kol" 對應「KOL 分潤」
// **注意**：以上 input 的 id 名稱需與 HTML 中財務欄位對應。如果實際 id 不同，請調整為正確的值。

// 防抖計時器變數
let financeDebounceTimers = {};

// 通用的防抖儲存函式：在停止輸入一段時間後更新財務文件指定欄位
function debounceUpdateFin(field, value) {
    // 清除先前的計時器
    if (financeDebounceTimers[field]) {
        clearTimeout(financeDebounceTimers[field]);
    }
    // 設定新的計時器，在延遲後執行更新
    financeDebounceTimers[field] = setTimeout(() => {
        // 更新 Firestore 文件的對應欄位值
        updateDoc(finDocRef, { [field]: value }).catch(err => {
            console.error("Failed to update finance field:", field, err);
        });
    }, 500);  // 500ms 防抖延遲
}

// 綁定財務欄位輸入事件（使用 input 事件即時捕捉變化）
capitalInput.addEventListener('input', () => {
    let val = parseFloat(capitalInput.value) || 0;
    debounceUpdateFin('capital', val);
});
incomeInput.addEventListener('input', () => {
    let val = parseFloat(incomeInput.value) || 0;
    debounceUpdateFin('income', val);
});
salesInput.addEventListener('input', () => {
    let val = parseFloat(salesInput.value) || 0;
    debounceUpdateFin('salesExpense', val);
});
prInput.addEventListener('input', () => {
    let val = parseFloat(prInput.value) || 0;
    debounceUpdateFin('prExpense', val);
});
kolExpInput.addEventListener('input', () => {
    let val = parseFloat(kolExpInput.value) || 0;
    debounceUpdateFin('kolExpense', val);
});

// 圖表設定：使用 Chart.js 顯示財務分佈（假設使用 Doughnut 圖表呈現支出分配）
const ctx = document.getElementById('line').getContext('2d');  // 取得 canvas (id="line") 的繪圖 context
let financeChart;  // 將用於保存 Chart 實例

// 初始化 Doughnut 圖表的函式
function initFinanceChart(data) {
    // data 是 { salesExpense, prExpense, kolExpense, income } 的物件，用於計算圖表
    const { salesExpense, prExpense, kolExpense, income } = data;
    // 計算淨利（若為負則視為0，以免圖表數值為負）
    let totalExpense = salesExpense + prExpense + kolExpense;
    let netProfit = income - totalExpense;
    if (netProfit < 0) netProfit = 0;
    // Doughnut 圖表資料：三項支出 + 淨利
    const chartData = {
        labels: ["銷售支出", "公關贈送", "KOL 分潤", "淨利"],
        datasets: [{
            data: [salesExpense, prExpense, kolExpense, netProfit],
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCD56", "#4BC0C0"],  // 各區塊顏色
        }]
    };
    // 如果圖表尚未建立，創建新的 Chart
    if (!financeChart) {
        financeChart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: '財務支出分佈' }
                }
            }
        });
    } else {
        // 已經有圖表實例，更新資料並刷新
        financeChart.data.datasets[0].data = chartData.datasets[0].data;
        financeChart.update();
    }
}

// 監聽 finance/fin 文件的即時更新，並更新財務欄位與圖表
onSnapshot(finDocRef, (docSnap) => {
    if (docSnap.exists()) {
        const finData = docSnap.data();
        // 將 Firestore 的最新值顯示在對應輸入框中
        if (capitalInput !== document.activeElement)  capitalInput.value = finData.capital;
        if (incomeInput !== document.activeElement)   incomeInput.value = finData.income;
        if (salesInput !== document.activeElement)    salesInput.value = finData.salesExpense;
        if (prInput !== document.activeElement)       prInput.value = finData.prExpense;
        if (kolExpInput !== document.activeElement)   kolExpInput.value = finData.kolExpense;
        // 更新圖表顯示
        initFinanceChart({
            salesExpense: finData.salesExpense || 0,
            prExpense: finData.prExpense || 0,
            kolExpense: finData.kolExpense || 0,
            income: finData.income || 0
        });
    }
});

// ** KOL 模組 **

// DOM 取得 KOL 表格
const kolTable = document.getElementById('kolTable');

// KOL 文件預設資料
const defaultKolData = {
    name: "",
    quote: 0,
    orders: 0,
    delivered: 0,
    costPerc: 0,    // 成本%
    profit: 0,
    margin: 0,      // 毛利率%
    note: ""
};

// 新增 KOL 列（按鈕 onclick 對應）：在 Firestore 新增一筆 KOL 文件
function addKolRow() {
    addDoc(collection(db, "kol"), defaultKolData).catch(err => {
        console.error("Failed to add KOL document:", err);
    });
}

// 建立一列 KOL 資料的表格列 DOM，並附加必要的事件監聽
function createKolRow(docId, data) {
    const tr = document.createElement('tr');
    tr.dataset.id = docId;
    // KOL 名稱
    const tdName = document.createElement('td');
    const nameInput = document.createElement('input');
    nameInput.type = "text";
    nameInput.value = data.name || "";
    // 失去焦點時更新名稱
    nameInput.addEventListener('blur', () => {
        updateDoc(doc(db, "kol", docId), { name: nameInput.value }).catch(console.error);
    });
    tdName.appendChild(nameInput);
    tr.appendChild(tdName);
    // 報價
    const tdQuote = document.createElement('td');
    const quoteInput = document.createElement('input');
    quoteInput.type = "number";
    quoteInput.value = data.quote || 0;
    quoteInput.addEventListener('input', () => {
        // 輸入報價時重新計算毛利
        recalcKol(docId, quoteInput, deliveredInput, costPercInput, profitSpan, marginSpan);
    });
    tdQuote.appendChild(quoteInput);
    tr.appendChild(tdQuote);
    // 單量（接單數）
    const tdOrders = document.createElement('td');
    const ordersInput = document.createElement('input');
    ordersInput.type = "number";
    ordersInput.value = data.orders || 0;
    ordersInput.addEventListener('blur', () => {
        // 單量欄位可能不直接影響毛利計算（假設毛利只看出單數），僅存檔
        updateDoc(doc(db, "kol", docId), { orders: parseInt(ordersInput.value)||0 }).catch(console.error);
    });
    tdOrders.appendChild(ordersInput);
    tr.appendChild(tdOrders);
    // 出單數
    const tdDelivered = document.createElement('td');
    const deliveredInput = document.createElement('input');
    deliveredInput.type = "number";
    deliveredInput.value = data.delivered || 0;
    deliveredInput.addEventListener('input', () => {
        // 輸入出單數時重新計算毛利
        recalcKol(docId, quoteInput, deliveredInput, costPercInput, profitSpan, marginSpan);
    });
    tdDelivered.appendChild(deliveredInput);
    tr.appendChild(tdDelivered);
    // 成本%
    const tdCost = document.createElement('td');
    const costPercInput = document.createElement('input');
    costPercInput.type = "number";
    costPercInput.value = data.costPerc || 0;
    costPercInput.addEventListener('input', () => {
        // 輸入成本%時重新計算毛利
        recalcKol(docId, quoteInput, deliveredInput, costPercInput, profitSpan, marginSpan);
    });
    tdCost.appendChild(costPercInput);
    tr.appendChild(tdCost);
    // 毛利
    const tdProfit = document.createElement('td');
    const profitSpan = document.createElement('span');
    profitSpan.textContent = data.profit || 0;
    tdProfit.appendChild(profitSpan);
    tr.appendChild(tdProfit);
    // 毛利率%
    const tdMargin = document.createElement('td');
    const marginSpan = document.createElement('span');
    marginSpan.textContent = (data.margin || 0) + "%";
    tdMargin.appendChild(marginSpan);
    tr.appendChild(tdMargin);
    // 備註
    const tdNote = document.createElement('td');
    const noteInput = document.createElement('input');
    noteInput.type = "text";
    noteInput.value = data.note || "";
    noteInput.addEventListener('blur', () => {
        updateDoc(doc(db, "kol", docId), { note: noteInput.value }).catch(console.error);
    });
    tdNote.appendChild(noteInput);
    tr.appendChild(tdNote);
    // 刪除按鈕
    const tdDel = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.textContent = "🗑️";  // 垃圾桶符號
    delBtn.style.color = "red";
    delBtn.addEventListener('click', () => {
        deleteDoc(doc(db, "kol", docId)).catch(console.error);
        // 直接從 DOM 中移除該列（即時反應，Firestore 同步刪除也會觸發監聽）
        tr.remove();
    });
    tdDel.appendChild(delBtn);
    tr.appendChild(tdDel);
    // 將完成的表格列加入 KOL 表格
    kolTable.appendChild(tr);
}

// KOL 毛利與毛利率重新計算函式
function recalcKol(docId, quoteInput, deliveredInput, costPercInput, profitSpan, marginSpan) {
    const quoteVal = parseFloat(quoteInput.value) || 0;
    const deliveredVal = parseFloat(deliveredInput.value) || 0;
    const costPercVal = parseFloat(costPercInput.value) || 0;
    // 計算總收入與毛利
    const revenue = quoteVal * deliveredVal;
    const costAmount = revenue * (costPercVal / 100);
    let profitVal = revenue - costAmount;
    if (profitVal < 0) profitVal = 0;
    // 計算毛利率（%）
    let marginVal = 0;
    if (revenue > 0) {
        marginVal = ((profitVal / revenue) * 100);
    }
    marginVal = Math.round(marginVal);  // 四捨五入取整百分比
    // 更新畫面顯示
    profitSpan.textContent = profitVal;
    marginSpan.textContent = marginVal + "%";
    // 將更新後的值存回 Firestore
    updateDoc(doc(db, "kol", docId), {
        quote: quoteVal,
        delivered: deliveredVal,
        costPerc: costPercVal,
        profit: profitVal,
        margin: marginVal
    }).catch(console.error);
}

// 監聽 KOL 集合的變化（新增/修改/刪除）
onSnapshot(collection(db, "kol"), (snapshot) => {
    snapshot.docChanges().forEach(change => {
        const docId = change.doc.id;
        const docData = change.doc.data();
        if (change.type === "added") {
            // 新增文件 -> 建立新的一行
            createKolRow(docId, docData);
        } else if (change.type === "modified") {
            // 修改文件 -> 找到對應列並更新顯示資料
            const tr = kolTable.querySelector(`tr[data-id="${docId}"]`);
            if (tr) {
                const cells = tr.children;
                // 對應欄位逐一更新（跳過正在編輯的欄位避免干擾）
                const [nameTd, quoteTd, ordersTd, deliveredTd, costTd, profitTd, marginTd, noteTd] = cells;
                const nameInput = nameTd.querySelector('input');
                const quoteInput = quoteTd.querySelector('input');
                const ordersInput = ordersTd.querySelector('input');
                const deliveredInput = deliveredTd.querySelector('input');
                const costInput = costTd.querySelector('input');
                const profitSpan = profitTd.querySelector('span');
                const marginSpan = marginTd.querySelector('span');
                const noteInput = noteTd.querySelector('input');
                if (document.activeElement !== nameInput)      nameInput.value = docData.name;
                if (document.activeElement !== quoteInput)     quoteInput.value = docData.quote;
                if (document.activeElement !== ordersInput)    ordersInput.value = docData.orders;
                if (document.activeElement !== deliveredInput) deliveredInput.value = docData.delivered;
                if (document.activeElement !== costInput)      costInput.value = docData.costPerc;
                // 毛利和毛利率通常為計算欄位，不會被直接編輯
                profitSpan.textContent = docData.profit;
                marginSpan.textContent = docData.margin + "%";
                if (document.activeElement !== noteInput)      noteInput.value = docData.note;
            }
        } else if (change.type === "removed") {
            // 刪除文件 -> 移除對應的表格列
            const tr = kolTable.querySelector(`tr[data-id="${docId}"]`);
            if (tr) tr.remove();
        }
    });
});

// ** 庫存模組 (Stock) **

const stockTable = document.getElementById('stockTable');
const defaultStockData = {
    name: "",
    category: "電子產品",  // 預設分類
    cost: 0,
    quantity: 0,
    totalCost: 0,
    location: "",
    note: ""
};

function addStockRow() {
    addDoc(collection(db, "stock"), defaultStockData).catch(err => {
        console.error("Failed to add stock document:", err);
    });
}

function createStockRow(docId, data) {
    const tr = document.createElement('tr');
    tr.dataset.id = docId;
    // 品名
    const tdName = document.createElement('td');
    const nameInput = document.createElement('input');
    nameInput.type = "text";
    nameInput.value = data.name || "";
    nameInput.addEventListener('blur', () => {
        updateDoc(doc(db, "stock", docId), { name: nameInput.value }).catch(console.error);
    });
    tdName.appendChild(nameInput);
    tr.appendChild(tdName);
    // 分類
    const tdCat = document.createElement('td');
    const catSelect = document.createElement('select');
    const categories = ["電子產品", "其他"];  // 您可按需求擴充分類選項
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        if (cat === data.category) opt.selected = true;
        catSelect.appendChild(opt);
    });
    catSelect.addEventListener('change', () => {
        updateDoc(doc(db, "stock", docId), { category: catSelect.value }).catch(console.error);
    });
    tdCat.appendChild(catSelect);
    tr.appendChild(tdCat);
    // 成本
    const tdCost = document.createElement('td');
    const costInput = document.createElement('input');
    costInput.type = "number";
    costInput.value = data.cost || 0;
    costInput.addEventListener('input', () => {
        // 成本變動時重新計算總成本
        recalcStockTotal(docId, costInput, quantityInput, totalSpan);
    });
    tdCost.appendChild(costInput);
    tr.appendChild(tdCost);
    // 數量
    const tdQty = document.createElement('td');
    const quantityInput = document.createElement('input');
    quantityInput.type = "number";
    quantityInput.value = data.quantity || 0;
    quantityInput.addEventListener('input', () => {
        // 數量變動時重新計算總成本
        recalcStockTotal(docId, costInput, quantityInput, totalSpan);
    });
    tdQty.appendChild(quantityInput);
    tr.appendChild(tdQty);
    // 總成本
    const tdTotal = document.createElement('td');
    const totalSpan = document.createElement('span');
    totalSpan.textContent = data.totalCost || 0;
    tdTotal.appendChild(totalSpan);
    tr.appendChild(tdTotal);
    // 位置
    const tdLoc = document.createElement('td');
    const locInput = document.createElement('input');
    locInput.type = "text";
    locInput.value = data.location || "";
    locInput.addEventListener('blur', () => {
        updateDoc(doc(db, "stock", docId), { location: locInput.value }).catch(console.error);
    });
    tdLoc.appendChild(locInput);
    tr.appendChild(tdLoc);
    // 備註
    const tdNote = document.createElement('td');
    const noteInput = document.createElement('input');
    noteInput.type = "text";
    noteInput.value = data.note || "";
    noteInput.addEventListener('blur', () => {
        updateDoc(doc(db, "stock", docId), { note: noteInput.value }).catch(console.error);
    });
    tdNote.appendChild(noteInput);
    tr.appendChild(tdNote);
    // 刪除按鈕
    const tdDel = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.textContent = "🗑️";
    delBtn.style.color = "red";
    delBtn.addEventListener('click', () => {
        deleteDoc(doc(db, "stock", docId)).catch(console.error);
        tr.remove();
    });
    tdDel.appendChild(delBtn);
    tr.appendChild(tdDel);
    stockTable.appendChild(tr);
}

// 重新計算庫存總成本函式
function recalcStockTotal(docId, costInput, quantityInput, totalSpan) {
    const costVal = parseFloat(costInput.value) || 0;
    const qtyVal = parseFloat(quantityInput.value) || 0;
    const totalVal = costVal * qtyVal;
    totalSpan.textContent = totalVal;
    updateDoc(doc(db, "stock", docId), {
        cost: costVal,
        quantity: qtyVal,
        totalCost: totalVal
    }).catch(console.error);
}

onSnapshot(collection(db, "stock"), (snapshot) => {
    snapshot.docChanges().forEach(change => {
        const docId = change.doc.id;
        const docData = change.doc.data();
        if (change.type === "added") {
            createStockRow(docId, docData);
        } else if (change.type === "modified") {
            const tr = stockTable.querySelector(`tr[data-id="${docId}"]`);
            if (tr) {
                const cells = tr.children;
                const [nameTd, catTd, costTd, qtyTd, totalTd, locTd, noteTd] = cells;
                const nameInput = nameTd.querySelector('input');
                const catSelect = catTd.querySelector('select');
                const costInput = costTd.querySelector('input');
                const qtyInput = qtyTd.querySelector('input');
                const totalSpan = totalTd.querySelector('span');
                const locInput = locTd.querySelector('input');
                const noteInput = noteTd.querySelector('input');
                if (document.activeElement !== nameInput)  nameInput.value = docData.name;
                // 更新下拉選單的值
                catSelect.value = docData.category;
                if (document.activeElement !== costInput) costInput.value = docData.cost;
                if (document.activeElement !== qtyInput)  qtyInput.value = docData.quantity;
                // 總成本直接更新顯示
                totalSpan.textContent = docData.totalCost;
                if (document.activeElement !== locInput)  locInput.value = docData.location;
                if (document.activeElement !== noteInput) noteInput.value = docData.note;
            }
        } else if (change.type === "removed") {
            const tr = stockTable.querySelector(`tr[data-id="${docId}"]`);
            if (tr) tr.remove();
        }
    });
});

// ** 訂單模組 (Order) **

const orderTable = document.getElementById('orderTable');
const defaultOrderData = {
    orderNumber: "",
    productName: "",
    quantity: 1,
    amount: 0,
    status: "未出貨",
    date: (new Date()).toISOString().substring(0,10)  // 取當日前8位 yyyy-mm-dd
};

function addOrderRow() {
    addDoc(collection(db, "order"), defaultOrderData).catch(err => {
        console.error("Failed to add order document:", err);
    });
}

function createOrderRow(docId, data) {
    const tr = document.createElement('tr');
    tr.dataset.id = docId;
    // 訂單編號
    const tdNo = document.createElement('td');
    const noInput = document.createElement('input');
    noInput.type = "text";
    noInput.value = data.orderNumber || "";
    noInput.addEventListener('blur', () => {
        updateDoc(doc(db, "order", docId), { orderNumber: noInput.value }).catch(console.error);
    });
    tdNo.appendChild(noInput);
    tr.appendChild(tdNo);
    // 品名
    const tdProduct = document.createElement('td');
    const productInput = document.createElement('input');
    productInput.type = "text";
    productInput.value = data.productName || "";
    productInput.addEventListener('blur', () => {
        updateDoc(doc(db, "order", docId), { productName: productInput.value }).catch(console.error);
    });
    tdProduct.appendChild(productInput);
    tr.appendChild(tdProduct);
    // 數量
    const tdQty = document.createElement('td');
    const qtyInput = document.createElement('input');
    qtyInput.type = "number";
    qtyInput.value = data.quantity || 1;
    qtyInput.addEventListener('input', () => {
        // 更新金額 (若需要根據庫存自動計算，可在此處擴充；目前僅同步數量值)
        updateDoc(doc(db, "order", docId), { quantity: parseInt(qtyInput.value)||0 }).catch(console.error);
    });
    tdQty.appendChild(qtyInput);
    tr.appendChild(tdQty);
    // 金額
    const tdAmount = document.createElement('td');
    const amountInput = document.createElement('input');
    amountInput.type = "number";
    amountInput.value = data.amount || 0;
    amountInput.addEventListener('blur', () => {
        updateDoc(doc(db, "order", docId), { amount: parseFloat(amountInput.value)||0 }).catch(console.error);
    });
    tdAmount.appendChild(amountInput);
    tr.appendChild(tdAmount);
    // 狀態
    const tdStatus = document.createElement('td');
    const statusSelect = document.createElement('select');
    const statuses = ["未出貨", "已出貨"];
    statuses.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st;
        opt.textContent = st;
        if (st === data.status) opt.selected = true;
        statusSelect.appendChild(opt);
    });
    statusSelect.addEventListener('change', () => {
        updateDoc(doc(db, "order", docId), { status: statusSelect.value }).catch(console.error);
    });
    tdStatus.appendChild(statusSelect);
    tr.appendChild(tdStatus);
    // 日期
    const tdDate = document.createElement('td');
    const dateInput = document.createElement('input');
    dateInput.type = "date";
    // 如果有日期資料，設置，否則用今天日期
    dateInput.value = data.date || (new Date()).toISOString().substring(0,10);
    dateInput.addEventListener('change', () => {
        updateDoc(doc(db, "order", docId), { date: dateInput.value }).catch(console.error);
    });
    tdDate.appendChild(dateInput);
    tr.appendChild(tdDate);
    // 刪除按鈕
    const tdDel = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.textContent = "🗑️";
    delBtn.style.color = "red";
    delBtn.addEventListener('click', () => {
        deleteDoc(doc(db, "order", docId)).catch(console.error);
        tr.remove();
    });
    tdDel.appendChild(delBtn);
    tr.appendChild(tdDel);
    orderTable.appendChild(tr);
}

onSnapshot(collection(db, "order"), (snapshot) => {
    snapshot.docChanges().forEach(change => {
        const docId = change.doc.id;
        const docData = change.doc.data();
        if (change.type === "added") {
            createOrderRow(docId, docData);
        } else if (change.type === "modified") {
            const tr = orderTable.querySelector(`tr[data-id="${docId}"]`);
            if (tr) {
                const cells = tr.children;
                const [noTd, productTd, qtyTd, amountTd, statusTd, dateTd] = cells;
                const noInput = noTd.querySelector('input');
                const productInput = productTd.querySelector('input');
                const qtyInput = qtyTd.querySelector('input');
                const amountInput = amountTd.querySelector('input');
                const statusSelect = statusTd.querySelector('select');
                const dateInput = dateTd.querySelector('input');
                if (document.activeElement !== noInput)       noInput.value = docData.orderNumber;
                if (document.activeElement !== productInput)  productInput.value = docData.productName;
                if (document.activeElement !== qtyInput)      qtyInput.value = docData.quantity;
                if (document.activeElement !== amountInput)   amountInput.value = docData.amount;
                statusSelect.value = docData.status;
                dateInput.value = docData.date;
            }
        } else if (change.type === "removed") {
            const tr = orderTable.querySelector(`tr[data-id="${docId}"]`);
            if (tr) tr.remove();
        }
    });
});

// 頁面載入完成時預設顯示財務頁籤
show('finance');
