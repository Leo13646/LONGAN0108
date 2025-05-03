/* ---------- 財務 ---------- */
const keys = ["capital", "income", "sellCost", "prCost", "kolCost", "opsCost"];
let pie, line, hist = [];
let debounceTimer;

const saveFin = () => {
  const data = Object.fromEntries(keys.map(k => [k, id(k).value]));
  setDoc(doc(db, "finance", "fin"), data);
};

const loadFin = () => {
  onSnapshot(doc(db, "finance", "fin"), snap => {
    if (!snap.exists()) return;
    const data = snap.data();
    keys.forEach(k => {
      if (document.activeElement !== id(k)) {
        id(k).value = data[k] || "";
      }
    });
    updateCharts();
  });
};

const saveHist = () => setDoc(doc(db, "finance", "hist"), { rows: hist });

const loadHist = () => {
  onSnapshot(doc(db, "finance", "hist"), snap => {
    hist = snap.exists() ? snap.data().rows || [] : [];
    updateCharts();
  });
};

function updateCharts() {
  const n = k => +id(k).value || 0;
  const profit = n("income") - n("sellCost") - n("prCost") - n("kolCost") - n("opsCost");

  id("netProfit").textContent = profit.toFixed(0);

  pie?.destroy();
  pie = new Chart(id("pie"), {
    type: "pie",
    data: {
      labels: ["銷售", "公關", "KOL", "營運"],
      datasets: [{ data: [n("sellCost"), n("prCost"), n("kolCost"), n("opsCost")], backgroundColor: ["#333", "#555", "#777", "#999"] }]
    },
    options: { animation: false, plugins: { legend: { labels: { color: "#ccc" } } } }
  });

  const today = new Date().toLocaleDateString();
  if (!hist.length || hist.at(-1).x !== today) {
    hist.push({ x: today, y: profit });
    saveHist();
  }

  line?.destroy();
  line = new Chart(id("line"), {
    type: "line",
    data: {
      labels: hist.map(d => d.x),
      datasets: [{
        label: "淨利", data: hist.map(d => d.y),
        borderColor: "#fff", backgroundColor: "rgba(255,255,255,0.2)", fill: true, tension: .35
      }]
    },
    options: { animation: false, scales: { x: { ticks: { color: "#bbb" } }, y: { ticks: { color: "#bbb" } } }, plugins: { legend: { labels: { color: "#ccc" } } } }
  });
}

function debouncedCalc() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    saveFin();
    updateCharts();
  }, 500);
}
/* ---------- 財務 ---------- */
const keys = ["capital", "income", "sellCost", "prCost", "kolCost", "opsCost"];
let pie, line, hist = [];
let debounceTimer;

const saveFin = () => {
  const data = Object.fromEntries(keys.map(k => [k, id(k).value]));
  setDoc(doc(db, "finance", "fin"), data);
};

const loadFin = () => {
  onSnapshot(doc(db, "finance", "fin"), snap => {
    if (!snap.exists()) return;
    const data = snap.data();
    keys.forEach(k => {
      if (document.activeElement !== id(k)) {
        id(k).value = data[k] || "";
      }
    });
    updateCharts();
  });
};

const saveHist = () => setDoc(doc(db, "finance", "hist"), { rows: hist });

const loadHist = () => {
  onSnapshot(doc(db, "finance", "hist"), snap => {
    hist = snap.exists() ? snap.data().rows || [] : [];
    updateCharts();
  });
};

function updateCharts() {
  const n = k => +id(k).value || 0;
  const profit = n("income") - n("sellCost") - n("prCost") - n("kolCost") - n("opsCost");

  id("netProfit").textContent = profit.toFixed(0);

  pie?.destroy();
  pie = new Chart(id("pie"), {
    type: "pie",
    data: {
      labels: ["銷售", "公關", "KOL", "營運"],
      datasets: [{ data: [n("sellCost"), n("prCost"), n("kolCost"), n("opsCost")], backgroundColor: ["#333", "#555", "#777", "#999"] }]
    },
    options: { animation: false, plugins: { legend: { labels: { color: "#ccc" } } } }
  });

  const today = new Date().toLocaleDateString();
  if (!hist.length || hist.at(-1).x !== today) {
    hist.push({ x: today, y: profit });
    saveHist();
  }

  line?.destroy();
  line = new Chart(id("line"), {
    type: "line",
    data: {
      labels: hist.map(d => d.x),
      datasets: [{
        label: "淨利", data: hist.map(d => d.y),
        borderColor: "#fff", backgroundColor: "rgba(255,255,255,0.2)", fill: true, tension: .35
      }]
    },
    options: { animation: false, scales: { x: { ticks: { color: "#bbb" } }, y: { ticks: { color: "#bbb" } } }, plugins: { legend: { labels: { color: "#ccc" } } } }
  });
}

function debouncedCalc() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    saveFin();
    updateCharts();
  }, 500);
}
/* ---------- 共用表格存取 ---------- */
const saveTable = (key, tableId) => {
  const rows = [...id(tableId).rows].slice(1).map(r =>
    [...r.querySelectorAll("input,select")].map(e => e.value)
  );
  setDoc(doc(db, "tables", key), { rows });
};

const loadTable = (key, addRow, tableId) => {
  onSnapshot(doc(db, "tables", key), snap => {
    const data = snap.exists() ? snap.data().rows || [] : [];
    while (id(tableId).rows.length > 1) id(tableId).deleteRow(1);
    if (data.length === 0) addRow();
    else data.forEach(addRow);
  });
};

/* ---------- KOL ---------- */
function addKolRow(d = null) {
  const r = id("kolTable").insertRow();
  const st = ["未寄出", "已寄出"];
  for (let i = 0; i < 8; i++) {
    const c = r.insertCell();
    let el;
    if (i === 7) el = btn(() => { r.remove(); sumKOL(); saveTable("kol", "kolTable"); });
    else if (i === 6) el = sel(st);
    else el = input([2, 3, 4, 5].includes(i), i === 4 ? 30 : "");
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
    const [,, p, q, rp, amt] = r.querySelectorAll("input");
    const v = (p.value && q.value && rp.value) ? (+p.value) * (+q.value) * (+rp.value) / 100 : (+amt.value || 0);
    amt.value = v.toFixed(0);
    s += v;
  });
  id("kolCost").value = s.toFixed(0);
  debouncedCalc();
}

/* ---------- STOCK ---------- */
function addStockRow(d = null) {
  const cat = ["電子產品", "美妝", "居家", "服飾", "3C配件", "其他"];
  const r = id("stockTable").insertRow();
  for (let i = 0; i < 8; i++) {
    const c = r.insertCell();
    let el;
    if (i === 7) el = btn(() => { r.remove(); sumStock(); saveTable("stock", "stockTable"); });
    else if (i === 1) el = sel(cat);
    else {
      el = input([2, 3, 5].includes(i));
      if ([2, 3].includes(i)) el.oninput = () => sumStock();
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
    const qty = +r.cells[3].firstChild.value || 0;
    r.cells[4].firstChild.value = (cost * qty).toFixed(0);
  });
}
