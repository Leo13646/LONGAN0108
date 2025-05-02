/********* 快捷 *********/
const $ = q => document.querySelector(q);
const $$ = q => document.querySelectorAll(q);
const id = i => document.getElementById(i);

/********* Firebase 參考 *********/
const col   = name => db.collection(name);
const docOf = name => db.collection("single").doc(name);   // 用來存 finance / hist 單一文件

/********* Ripple 動畫 *********/
document.addEventListener("click", e=>{
  if(e.target.tagName !== "BUTTON") return;
  const btn=e.target, rect=btn.getBoundingClientRect();
  const r=document.createElement("span");
  r.className="ripple";
  const d=Math.max(rect.width,rect.height);
  r.style.width=r.style.height=d+"px";
  r.style.left=(e.clientX-rect.left-d/2)+"px";
  r.style.top =(e.clientY-rect.top -d/2)+"px";
  btn.appendChild(r);
  r.addEventListener("animationend",()=>r.remove());
});

/********* 分頁 *********/
function show(t){
  $$(".tab").forEach(e=>e.style.display="none");
  id(t).style.display="block";
  if(t==="kol"  && id("kolTable").rows.length===1)   addKolRow();
  if(t==="stock"&& id("stockTable").rows.length===1) addStockRow();
  if(t==="order"&& id("orderTable").rows.length===1) addOrderRow();
}

/********* 財務 (單文件) *********/
const finKeys=["capital","income","sellCost","prCost","kolCost","opsCost"];
async function loadFin(){
  const snap=await docOf("finance").get();
  if(snap.exists){
    Object.entries(snap.data()).forEach(([k,v])=>id(k).value=v);
  }
}
const saveFin=async ()=>{
  const data=Object.fromEntries(finKeys.map(k=>[k,id(k).value]));
  await docOf("finance").set(data);
};

let pie,line;   // Chart 實例
let hist=[];    // 折線圖資料

async function rebuildCharts(arr,profit){
  /* pie */
  pie?.destroy();
  pie=new Chart(id("pie"),{
    type:"pie",
    data:{labels:["銷售","公關","KOL","營運"],
      datasets:[{data:arr,backgroundColor:["#333","#555","#777","#999"]}]},
    options:{animation:false,plugins:{legend:{labels:{color:"#ccc"}}}}
  });

  /* line */
  const today=new Date().toLocaleDateString();
  if(!hist.length || hist.at(-1).x!==today){
    hist.push({x:today,y:profit});
    await docOf("hist").set({list:hist});
  }
  line?.destroy();
  line=new Chart(id("line"),{
    type:"line",
    data:{labels:hist.map(d=>d.x),
      datasets:[{label:"淨利",data:hist.map(d=>d.y),
        borderColor:"#fff",backgroundColor:"rgba(255,255,255,.15)",fill:true,tension:.35}]},
    options:{animation:false,
      scales:{x:{ticks:{color:"#bbb"}},y:{ticks:{color:"#bbb"}}},
      plugins:{legend:{labels:{color:"#ccc"}}}}
  });
}

let t;function debouncedCalc(){clearTimeout(t);t=setTimeout(calc,150);}
async function calc(){
  const n=k=>+id(k).value||0;
  const p=n("income")-n("sellCost")-n("prCost")-n("kolCost")-n("opsCost");
  id("netProfit").textContent=p.toFixed(0);
  await saveFin();
  rebuildCharts([n("sellCost"),n("prCost"),n("kolCost"),n("opsCost")],p);
}

/********* 雲端表格存取通用 *********/
const saveTable = async (coll,tid)=>{
  const rows=[...id(tid).rows].slice(1).map(r=>[...r.querySelectorAll("input,select")].map(e=>e.value));
  await col(coll).doc("data").set({rows});
};

const loadTable = async (coll,adder)=>{
  const snap=await col(coll).doc("data").get();
  if(!snap.exists) return;
  snap.data().rows.forEach(adder);
};

/********* KOL *********/
function addKolRow(d=null){
  const st=["未寄出","已寄出"];
  const r=id("kolTable").insertRow();
  for(let i=0;i<8;i++){
    const c=r.insertCell();let el;
    if(i===7){el=btn(()=>{r.remove();sumKOL();saveTable("kol","kolTable");});}
    else if(i===6){el=sel(st);}
    else{el=input([2,3,4,5].includes(i),i===4?30:"");}
    c.appendChild(el);
  }
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value=d[i]||"");
  ["input","change"].forEach(ev=>r.addEventListener(ev,()=>{sumKOL();saveTable("kol","kolTable");}));
  sumKOL();
}
function sumKOL(){
  let s=0;
  $$("#kolTable tr").forEach((r,i)=>{
    if(!i) return;
    const [,,p,q,rp,amt]=r.querySelectorAll("input");
    const v=(p.value&&q.value&&rp.value)?(+p.value)*(+q.value)*(+rp.value)/100:(+amt.value||0);
    amt.value=v.toFixed(0);
    s+=v;
  });
  id("kolCost").value=s.toFixed(0);
  debouncedCalc();
}

/********* STOCK *********/
function addStockRow(d=null){
  const cat=["電子產品","美妝","居家","服飾","3C配件","其他"];
  const r=id("stockTable").insertRow();
  for(let i=0;i<8;i++){
    const c=r.insertCell();let el;
    if(i===7){el=btn(()=>{r.remove();sumStock();saveTable("stock","stockTable");});}
    else if(i===1){el=sel(cat);}
    else{
      el=input([2,3,5].includes(i));
      if([2,3].includes(i)) el.oninput=sumStock;
      if(i===4){el.readOnly=true;}
    }
    c.appendChild(el);
  }
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value=d[i]||"");
  ["input","change"].forEach(ev=>r.addEventListener(ev,()=>{sumStock();saveTable("stock","stockTable");}));
  sumStock();
}
function sumStock(){
  $$("#stockTable tr").forEach((r,i)=>{
    if(!i) return;
    const cost=+r.cells[2].firstChild.value||0,
          qty =+r.cells[3].firstChild.value||0;
    r.cells[4].firstChild.value=(cost*qty).toFixed(0);
  });
}

/********* ORDER *********/
function addOrderRow(d=null){
  const st=["未出貨","已出貨","退貨"];
  const r=id("orderTable").insertRow();
  for(let i=0;i<7;i++){
    const c=r.insertCell();let el;
    if(i===6){el=btn(()=>{r.remove();saveTable("order","orderTable");});}
    else if(i===2){el=input(true,1);}
    else if(i===4){el=sel(st);}
    else if(i===5){el=input(false,new Date().toISOString().split("T")[0]);el.type="date";}
    else{el=input(i===3);}
    c.appendChild(el);
  }
  if(d) [...r.cells].forEach((c,i)=>c.firstChild.value=d[i]||"");
  ["input","change"].forEach(ev=>r.addEventListener(ev,()=>saveTable("order","orderTable")));
}

/********* 元件輔助 *********/
const input=(num=false,v="")=>{const e=document.createElement("input");if(num)e.type="number";e.value=v;return e;}
const sel=a=>{const s=document.createElement("select");a.forEach(o=>s.add(new Option(o,o)));return s;}
const btn=f=>{const b=document.createElement("button");b.textContent="🗑";b.onclick=f;return b;}

/********* 啟動 *********/
window.addEventListener("DOMContentLoaded",async ()=>{
  /* 單文件資料 */
  await loadFin();
  const histSnap=await docOf("hist").get();
  hist=histSnap.exists ? histSnap.data().list : [];
  calc();

  /* 表格資料 */
  await loadTable("kol",addKolRow);
  if(id("kolTable").rows.length===1) addKolRow();

  await loadTable("stock",addStockRow);
  if(id("stockTable").rows.length===1) addStockRow();

  await loadTable("order",addOrderRow);
  if(id("orderTable").rows.length===1) addOrderRow();

  show("finance");
});
