/* ---------- 快捷 ---------- */
const $=q=>document.querySelector(q), $$=q=>document.querySelectorAll(q), id=i=>document.getElementById(i);

/* ---------- Firebase 初始化 ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

/* ---------- 分頁 ---------- */
function show(t){$$(".tab").forEach(e=>e.style.display="none");id(t).style.display="block";
  if(t==="kol"  && id("kolTable").rows.length===1)   addKolRow();
  if(t==="stock"&& id("stockTable").rows.length===1) addStockRow();
  if(t==="order"&& id("orderTable").rows.length===1) addOrderRow();}

/* ---------- 財務 ---------- */
const keys=["capital","income","sellCost","prCost","kolCost","opsCost"];
let isTyping=false, typingTimeout;
keys.forEach(k=>{
  const el=id(k);
  el.addEventListener("input",()=>{
    isTyping=true;
    clearTimeout(typingTimeout);
    typingTimeout=setTimeout(()=>{ isTyping=false; calc(); }, 500);
  });
});
const saveFin=_=>{
  const data = Object.fromEntries(keys.map(k=>[k,id(k).value]));
  setDoc(doc(db, "finance", "fin"), data);
};
const loadFin=_=>{
  onSnapshot(doc(db, "finance", "fin"), snap=>{
    if(!snap.exists()) return;
    if(isTyping) return;
    Object.entries(snap.data()).forEach(([k,v])=>{
      if(id(k).value!==String(v)) id(k).value=v;
    });
    calc();
  });
};

let pie,line,hist=[];
const loadHist=_=>{
  onSnapshot(doc(db, "finance", "hist"), snap=>{
    hist = snap.exists() ? snap.data().rows || [] : [];
    calc();
  });
};
const saveHist=_=>setDoc(doc(db, "finance", "hist"), { rows: hist });

function rebuildCharts(arr,profit){
  pie?.destroy();
  pie=new Chart(id("pie"),{type:"pie",data:{labels:["銷售","公關","KOL","營運"],datasets:[{data:arr,backgroundColor:["#333","#555","#777","#999"]}]},
    options:{animation:false,plugins:{legend:{labels:{color:"#ccc"}}}}});

  const today=new Date().toLocaleDateString();
  if(!hist.length||hist.at(-1).x!==today
