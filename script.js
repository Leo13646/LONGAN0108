/* ---------- 快捷 ---------- */
const $ = q => document.querySelector(q),
      $$ = q => document.querySelectorAll(q),
      id = i => document.getElementById(i);

/* ---------- Firebase ---------- */
import { initializeApp }   from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore,
         doc, setDoc, getDoc,
         onSnapshot }      from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_t-Yfmxfy8uAqGgQMb3AZarNrzYocByM",
  authDomain: "longan-aef50.firebaseapp.com",
  projectId: "longan-aef50",
  storageBucket: "longan-aef50.appspot.com",
  messagingSenderId: "632631753622",
  appId: "1:632631753622:web:395d077de61b86f9053bb7",
  measurementId: "G-MLN3B4NZ83"
};
initializeApp(firebaseConfig);
const db = getFirestore();

/* ---------- 公用 Firestore 存取 ---------- */
const docRef = k => doc(db, "data", k);     // k = fin | hist | kol | stock | order
const setData = (k, v) => setDoc(docRef(k), v);
const getData =  k     => getDoc(docRef(k));

/* ---------- 分頁 ---------- */
function show(t){
  $$(".tab").forEach(e=>e.style.display="none");
  id(t).style.display="block";
  if(t==="kol"   && id("kolTable").rows.length===1)   addKolRow();
  if(t==="stock" && id("stockTable").rows.length===1) addStockRow();
  if(t==="order" && id("orderTable").rows.length===1) addOrderRow();
}

/* ---------- 財務 ---------- */
const keys = ["capital","income","sellCost","prCost","kolCost","opsCost"];

const loadFin = () => {
  onSnapshot(docRef("fin"), snap=>{
    if(!snap.exists()) return;
    Object.entries(snap.data()).forEach(([k,v])=>{
      if(id(k).value !== String(v)) id(k).value = v;
    });
    calc();                        // 重新計算並更新圖表
  });
};

const saveFin = () =>
  setData("fin", Object.fromEntries(keys.map(k=>[k, id(k).value])));

let pie, line;
let hist = [];

function rebuildCharts(arr, profit){
  /* pie */
  pie?.destroy();
  pie = new Chart(id("pie"), {
    type:"pie",
    data:{labels:["銷售","公關","KOL","營運"],
          datasets:[{data:arr,backgroundColor:["#333","#555","#777","#999"]}]},
    options:{animation:false,plugins:{legend:{labels:{color:"#ccc"}}}}
  });

  /* line（同步到 Firestore） */
  const today = new Date().toLocaleDateString();
  if(!hist.length || hist.at(-1).x !== today){
    hist.push({x:today, y:profit});
    setData("hist",{rows:hist});
  }
  line?.destroy();
  line = new Chart(id("line"),{
    type:"line",
    data:{labels:hist.map(d=>d.x),
          datasets:[{label:"淨利",data:hist.map(d=>d.y),
                     borderColor:"#fff",backgroundColor:"rgba(255,255,255,.15)",
                     fill:true,tension:.35}]},
    options:{animation:false,
             scales:{x:{ticks:{color:"#bbb"}},y:{ticks:{color:"#bbb"}}},
             plugins:{legend:{labels:{color:"#ccc"}}}}
  });
}

let t;function debouncedCalc(){clearTimeout(t);t=setTimeout(calc,150);}
function calc(){
  const n = k=>+id(k).value||0;
  const p = n("income")-n("sellCost")-n("prCost")-n("kolCost")-n("opsCost");
  id("netProfit").textContent = p.toFixed(0);
  saveFin();
  rebuildCharts([n("sellCost"),n("prCost"),n("kolCost"),n("opsCost")], p);
}

/* ---------- 表格的通用 Firestore 存取 ---------- */
const saveTable = (k, tid) =>
  setData(k, {rows:[...id(tid).rows].slice(1).map(r=>[...r.querySelectorAll("input,select")].map(e=>e.value))});

const loadTable = (k, addRowFunc, tid) => {
  onSnapshot(docRef(k), snap=>{
    let rows = snap.exists() ? snap.data().rows : [];

    // 第一次開啟 doc 不存在 → 建立一筆空列
    if(!snap.exists()){
      rows = [[]];                // 空列
      setData(k,{rows});
    }

    // 清空舊表格內容（保留表頭 row 0）
    while(id(tid).rows.length > 1) id(tid).deleteRow(1);

    rows.forEach(r=>addRowFunc(r));
    if(rows.length === 0) addRowFunc();   // 保底一行
  });
};

/* ---------- KOL ---------- */
function addKolRow(d=null){
  const st=["未寄出","已寄出"];
  const r=id("kolTable").insertRow();
  for(let i=0;i<8;i++){
    const c=r.insertCell();let el;
    if(i===7){el=btn(()=>{r.remove();sumKOL();saveTable("kol","kolTable");});}
    else if(i===6){el=sel(st);}
    else{el=input([2,3,4,5].includes(i), i===4?30:"");}
    c.appendChild(el);
  }
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value = d[i]??"");
  r.addEventListener("input", ()=>{sumKOL();saveTable("kol","kolTable");});
  r.addEventListener("change",()=>{sumKOL();saveTable("kol","kolTable");});
  sumKOL();
}
function sumKOL(){
  let s=0;
  $$("#kolTable tr").forEach((r,i)=>{
    if(!i) return;
    const [,,p,q,rp,amt] = r.querySelectorAll("input");
    const v=(p.value&&q.value&&rp.value)?(+p.value)*(+q.value)*(+rp.value)/100:(+amt.value||0);
    amt.value=v.toFixed(0);s+=v;
  });
  id("kolCost").value = s.toFixed(0);
  debouncedCalc();
}

/* ---------- STOCK ---------- */
function addStockRow(d=null){
  const cat=["電子產品","美妝","居家","服飾","3C配件","其他"];
  const r=id("stockTable").insertRow();
  for(let i=0;i<8;i++){
    const c=r.insertCell();let el;
    if(i===7){el=btn(()=>{r.remove();sumStock();saveTable("stock","stockTable");});}
    else if(i===1){el=sel(cat);}
    else{el=input([2,3,5].includes(i)); if([2,3].includes(i)) el.oninput=sumStock;
         if(i===4) el.readOnly=true;}
    c.appendChild(el);
  }
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value=d[i]??"");
  r.addEventListener("input", ()=>{sumStock();saveTable("stock","stockTable");});
  r.addEventListener("change",()=>{sumStock();saveTable("stock","stockTable");});
  sumStock();
}
function sumStock(){
  $$("#stockTable tr").forEach((r,i)=>{
    if(!i) return;
    const cost=+r.cells[2].firstChild.value||0,
          qty =+r.cells[3].firstChild.value||0;
    r.cells[4].firstChild.value = (cost*qty).toFixed(0);
  });
}

/* ---------- ORDER ---------- */
function addOrderRow(d=null){
  const st=["未出貨","已出貨","退貨"];
  const r=id("orderTable").insertRow();
  for(let i=0;i<7;i++){
    const c=r.insertCell();let el;
    if(i===6){el=btn(()=>{r.remove();saveTable("order","orderTable");});}
    else if(i===2){el=input(true,1);}
    else if(i===4){el=sel(st);}
    else if(i===5){el=input(false,new Date().toISOString().split("T")[0]); el.type="date";}
    else{el=input(i===3);}
    c.appendChild(el);
  }
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value=d[i]??"");
  r.addEventListener("input", ()=>saveTable("order","orderTable"));
  r.addEventListener("change",()=>saveTable("order","orderTable"));
}

/* ---------- 啟動 ---------- */
window.addEventListener("DOMContentLoaded",async ()=>{
  loadFin();                                     // 即時監聽 fin
  onSnapshot(docRef("hist"),snap=>{              // 即時監聽線圖資料
    hist = snap.exists() ? snap.data().rows || [] : [];
    calc();                                      // 重新畫圖
  });

  loadTable("kol",   addKolRow,   "kolTable");
  loadTable("stock", addStockRow, "stockTable");
  loadTable("order", addOrderRow, "orderTable");

  show("finance");
});

/* ---------- 小元件 ---------- */
const input = (n=false,v="") => (Object.assign(document.createElement("input"),{type:n?"number":"text", value:v}));
const sel   = a => {const s=document.createElement("select");a.forEach(o=>s.add(new Option(o,o)));return s;};
const btn   = f => (Object.assign(document.createElement("button"),{textContent:"🗑", onclick:f}));
