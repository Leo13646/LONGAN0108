psCost"];

const loadFin = async () => {
  const snap = await getDoc(doc(db, "users", uid, "data", "finance"));
  if (snap.exists()) Object.entries(snap.data()).forEach(([k,v]) => id(k).value = v);
};

const saveFin = async () => {
  const d = Object.fromEntries(keys.map(k => [k, id(k).value]));
  await setDoc(doc(db, "users", uid, "data", "finance"), d);
};

let pie, line, hist = [];

const loadHist = () => {
  onSnapshot(doc(db, "users", uid, "data", "history"), snap => {
    hist = snap.exists() ? snap.data().list || [] : [];
    drawLine();
  });
};

function rebuildCharts(arr, profit) {
  pie?.destroy();
  pie = new Chart(id("pie"), {
    type: "pie",
    data: {
      labels: ["銷售", "公關", "KOL", "營運"],
      datasets: [{ data: arr, backgroundColor: ["#333", "#555", "#777", "#999"] }]
    },
    options: { animation: false, plugins: { legend: { labels: { color: "#ccc" } } } }
  });
  const today = new Date().toLocaleDateString();
  if (!hist.length || hist.at(-1).x !== today) {
    hist.push({ x: today, y: profit });
    setDoc(doc(db, "users", uid, "data", "history"), { list: hist });
  }
}

let t;
function debouncedCalc() {
  clearTimeout(t);
  t = setTimeout(calc, 150);
}

function calc() {
  const n = k => +id(k).value || 0;
  const p = n("income") - n("sellCost") - n("prCost") - n("kolCost") - n("opsCost");
  id("netProfit").textContent = p.toFixed(0);
  saveFin();
  rebuildCharts([n("sellCost"), n("prCost"), n("kolCost"), n("opsCost")], p);
}

/* 表格儲存 */
const saveTable = async (k, tid) => {
  const rows = [...id(tid).rows].slice(1).map(r =>
    [...r.querySelectorAll("input,select")].map(e => e.value)
  );
  await setDoc(doc(db, "users", uid, "tables", k), { rows });
};

const loadTable = async (k, add) => {
  const snap = await getDoc(doc(db, "users", uid, "tables", k));
  const rows = snap.exists() ? snap.data().rows : [];
  rows.forEach(add);
};
const saveFin = async () => {
  const d = Object.fromEntries(keys.map(k => [k, id(k).value]));
  await setDoc(doc(db, "users", uid, "data", "finance"), d);
};

let pie, line, hist = [];

const loadHist = () => {
  onSnapshot(doc(db, "users", uid, "data", "history"), snap => {
    hist = snap.exists() ? snap.data().list || [] : [];
    drawLine();
  });
};

function rebuildCharts(arr, profit) {
  pie?.destroy();
  pie = new Chart(id("pie"), {
    type: "pie",
    data: {
      labels: ["銷售", "公關", "KOL", "營運"],
      datasets: [{ data: arr, backgroundColor: ["#333", "#555", "#777", "#999"] }]
    },
    options: { animation: false, plugins: { legend: { labels: { color: "#ccc" } } } }
  });
  const today = new Date().toLocaleDateString();
  if (!hist.length || hist.at(-1).x !== today) {
    hist.push({ x: today, y: profit });
    setDoc(doc(db, "users", uid, "data", "history"), { list: hist });
  }
}

let t;
function debouncedCalc() {
  clearTimeout(t);
  t = setTimeout(calc, 150);
}

function calc() {
  const n = k => +id(k).value || 0;
  const p = n("income") - n("sellCost") - n("prCost") - n("kolCost") - n("opsCost");
  id("netProfit").textContent = p.toFixed(0);
  saveFin();
  rebuildCharts([n("sellCost"), n("prCost"), n("kolCost"), n("opsCost")], p);
}

/* Firebase 表格儲存與載入 */
const saveTable = async (k, tid) => {
  const rows = [...id(tid).rows].slice(1).map(r =>
    [...r.querySelectorAll("input,select")].map(e => e.value)
  );
  await setDoc(doc(db, "users", uid, "tables", k), { rows });
};

const loadTable = async (k, add) => {
  const snap = await getDoc(doc(db, "users", uid, "tables", k));
  const rows = snap.exists() ? snap.data().rows : [];
  rows.forEach(add);
};
/* KOL 管理 */
function addKolRow(d = null) {
  const st = ["未寄出", "已寄出"];
  const r = id("kolTable").insertRow();
  for (let i = 0; i < 8; i++) {
    const c = r.insertCell();
    let el = (i === 7)
      ? btn(() => { r.remove(); sumKOL(); saveTable("kol", "kolTable"); })
      : (i === 6)
        ? sel(st)
        : input([2,3,4,5].includes(i), i === 4 ? 30 : "");
    c.appendChild(el);
  }
  if (d) [...r.cells].forEach((c, i) => c.firstChild.value = d[i] || "");
  r.addEventListener("input", () => { sumKOL(); saveTable("kol", "kolTable"); });
  r.addEventListener("change", () => { sumKOL(); saveTable("kol", "kolTable"); });
  sumKOL();
}

function sumKOL() {
  let s = 0;
  $$("#kolTable tr").forEach((r, i) => {
    if (!i) return;
    const [,, p, q, rate, amt] = r.querySelectorAll("input");
    const v = (p.value && q.value && rate.value)
      ? (+p.value) * (+q.value) * (+rate.value) / 100
      : (+amt.value || 0);
    amt.value = v.toFixed(0);
    s += v;
  });
  id("kolCost").value = s.toFixed(0);
  debouncedCalc();
}

/* 庫存管理 */
function addStockRow(d = null) {
  const cat = ["電子產品","美妝","居家","服飾","3C配件","其他"];
  const r = id("stockTable").insertRow();
  for (let i = 0; i < 8; i++) {
    const c = r.insertCell();
    let el;
    if (i === 7) el = btn(() => { r.remove(); sumStock(); saveTable("stock", "stockTable"); });
    else if (i === 1) el = sel(cat);
    else {
      el = input([2,3,5].includes(i));
      if ([2,3].includes(i)) el.oninput = sumStock;
      if (i === 4) el.readOnly = true;
    }
    c.appendChild(el);
  }
  if (d) [...r.cells].forEach((c, i) => c.firstChild.value = d[i] || "");
  r.addEventListener("input", () => { sumStock(); saveTable("stock", "stockTable"); });
  r.addEventListener("change", () => { sumStock(); saveTable("stock", "stockTable"); });
  sumStock();
}

function sumStock() {
  $$("#stockTable tr").forEach((r, i) => {
    if (!i) return;
    const cost = +r.cells[2].firstChild.value || 0;
    const qty  = +r.cells[3].firstChild.value || 0;
    r.cells[4].firstChild.value = (cost * qty).toFixed(0);
  });
}

/* 訂單管理 */
function addOrderRow(d = null) {
  const st = ["未出貨", "已出貨", "退貨"];
  const r = id("orderTable").insertRow();
  for (let i = 0; i < 7; i++) {
    const c = r.insertCell();
    let el;
    if (i === 6) el = btn(() => { r.remove(); saveTable("order", "orderTable"); });
    else if (i === 2) el = input(true, 1);
    else if (i === 4) el = sel(st);
    else if (i === 5) {
      el = input(false, new Date().toISOString().split("T")[0]);
      el.type = "date";
    } else el = input(i === 3);
    c.appendChild(el);
  }
  if (d) [...r.cells].forEach((c, i) => c.firstChild.value = d[i] || "");
  r.addEventListener("input", () => saveTable("order", "orderTable"));
  r.addEventListener("change", () => saveTable("order", "orderTable"));
}

/* 啟動初始化 */
async function startApp() {
  await loadFin();
  calc();
  await loadHist();
  await loadTable("kol",   addKolRow);
  if (id("kolTable").rows.length === 1) addKolRow();
  await loadTable("stock", addStockRow);
  if (id("stockTable").rows.length === 1) addStockRow();
  await loadTable("order", addOrderRow);
  if (id("orderTable").rows.length === 1) addOrderRow();
  show("finance");
}

/* 小元件 */
const input = (isNum = false, val = "") => {
  const e = document.createElement("input");
  if (isNum) e.type = "number";
  e.value = val;
  return e;
};
const sel = opts => {
  const s = document.createElement("select");
  opts.forEach(o => s.add(new Option(o, o)));
  return s;
};
const btn = handler => {
  const b = document.createElement("button");
  b.textContent = "🗑";
  b.onclick = handler;
  return b;
};
