/* ---------- deck controller ---------- */
const slides=[...document.querySelectorAll(".slide")];
const deck=document.getElementById("deck"),bar=document.getElementById("bar"),notesEl=document.getElementById("notes");
slides.forEach((s,i)=>s.setAttribute("data-num",(i+1)+" / "+slides.length));
let cur=0,mobile=false;
/* wrap wide content so it can scroll sideways on phones (no effect on desktop) */
deck.querySelectorAll("table,svg.flow,.tl").forEach(t=>{const w=document.createElement("div");w.className="xs";t.parentNode.insertBefore(w,t);w.appendChild(t)});
/* minimum readable font size in mobile mode (logical px, before zoom) */
const MINFS=19;let bumped=[];
function bumpFonts(){
  deck.querySelectorAll(".slide *").forEach(e=>{
    if(e.closest("svg"))return;
    const fs=parseFloat(getComputedStyle(e).fontSize);
    if(fs<MINFS){bumped.push([e,e.style.fontSize]);e.style.fontSize=MINFS+"px"}
  });
}
function unbumpFonts(){bumped.forEach(([e,v])=>e.style.fontSize=v);bumped=[]}
function isMobile(){return innerWidth<1000||innerWidth/innerHeight<1.2}
function fit(){
  const m=isMobile()&&!window.__printing;
  if(m){
    const k=Math.min(1,Math.max(.62,innerWidth/1000)),w=innerWidth/k;
    if(!mobile){deck.style.zoom="";unbumpFonts();bumpFonts()}
    mobile=true;document.body.classList.add("m");document.documentElement.classList.add("m");
    document.body.classList.toggle("wide",w>=900);
    deck.style.setProperty("--mw",w+"px");deck.style.setProperty("--mh",(innerHeight-52)/k+"px");
    deck.style.zoom=k;
    deck.querySelectorAll(".xs").forEach(x=>x.classList.remove("can"));
    requestAnimationFrame(()=>deck.querySelectorAll(".slide.active .xs").forEach(x=>x.classList.toggle("can",x.scrollWidth>x.clientWidth+2)));
  }else{
    if(mobile){unbumpFonts();deck.style.zoom="";document.body.classList.remove("m","wide");document.documentElement.classList.remove("m")}
    mobile=false;
    const k=Math.min(innerWidth/1600,innerHeight/900);deck.style.transform="scale("+k+")";
  }
}
function go(n){
  const prev=cur;
  cur=Math.max(0,Math.min(slides.length-1,n));
  slides.forEach((s,i)=>s.classList.toggle("active",i===cur));
  if(mobile){if(prev!==cur)scrollTo(0,0);slides[cur].querySelectorAll(".xs").forEach(x=>x.classList.toggle("can",x.scrollWidth>x.clientWidth+2))}
  bar.style.width=((cur+1)/slides.length*100)+"%";
  document.getElementById("mpg").textContent=(cur+1)+" / "+slides.length;
  document.getElementById("mprev").disabled=cur===0;
  document.getElementById("mnext").disabled=cur===slides.length-1;
  const nt=slides[cur].querySelector(".notes");notesEl.textContent=nt?nt.textContent:"（本頁無備註）";
  if(location.hash!=="#"+(cur+1))history.replaceState(null,"","#"+(cur+1));
}
addEventListener("resize",fit);fit();
go((parseInt(location.hash.slice(1))||1)-1);
addEventListener("keydown",e=>{
  if(["ArrowRight","PageDown"," ","Enter"].includes(e.key)){e.preventDefault();go(cur+1)}
  else if(["ArrowLeft","PageUp","Backspace"].includes(e.key)){e.preventDefault();go(cur-1)}
  else if(e.key==="Home")go(0); else if(e.key==="End")go(slides.length-1);
  else if(e.key==="f"||e.key==="F"){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>{})}
  else if(e.key==="n"||e.key==="N")notesEl.classList.toggle("on");
  else if(e.key==="p"||e.key==="P")print();
  else if(e.key==="a"||e.key==="A"){const r=slides[cur].querySelectorAll(".reveal"),on=[...r].some(x=>!x.classList.contains("shown"));r.forEach(x=>x.classList.toggle("shown",on))}
});
addEventListener("hashchange",()=>go((parseInt(location.hash.slice(1))||1)-1));
document.querySelectorAll(".reveal").forEach(r=>r.addEventListener("click",e=>{e.stopPropagation();r.classList.toggle("shown")}));
document.getElementById("stage").addEventListener("click",e=>{if(mobile||e.target.closest("a,.reveal,.toc-item"))return;const x=e.clientX/innerWidth;go(x<.25?cur-1:cur+1)});
document.getElementById("mprev").addEventListener("click",()=>go(cur-1));
document.getElementById("mnext").addEventListener("click",()=>go(cur+1));
document.getElementById("mnotes").addEventListener("click",e=>{notesEl.classList.toggle("on");e.currentTarget.classList.toggle("on",notesEl.classList.contains("on"))});
/* swipe: horizontal only, and not when the finger starts on a sideways-scrollable table/figure */
let tx=null,ty=null;
addEventListener("touchstart",e=>{
  const x=e.target.closest&&e.target.closest(".xs");
  if(e.touches.length>1||(mobile&&x&&x.scrollWidth>x.clientWidth+2)||e.target.closest("#notes,#mnav")){tx=null;return}
  tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
addEventListener("touchend",e=>{if(tx===null)return;const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
  if(Math.abs(dx)>60&&Math.abs(dx)>1.5*Math.abs(dy)&&!(window.visualViewport&&visualViewport.scale>1.05))go(cur+(dx<0?1:-1));tx=null},{passive:true});
/* always print the 16:9 layout */
addEventListener("beforeprint",()=>{window.__printing=true;fit()});
addEventListener("afterprint",()=>{window.__printing=false;fit()});
/* table of contents */
document.querySelectorAll('.toc-item').forEach(a=>{const t=slides.findIndex(x=>{const e=x.querySelector('.kicker');return e&&e.textContent.trim()===a.dataset.key});a.querySelector('.toc-no').textContent=String(t+1).padStart(2,'0');a.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();go(t)})});
