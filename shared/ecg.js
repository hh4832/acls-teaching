/* ---------- animated ECG rhythm strips ----------
   Usage: <canvas class="ecg" data-r="vt" data-sec="6" data-h="260" data-hr="180" data-lead="II" data-theme="paper"></canvas>
   Synthetic, looping waveforms at 25 mm/s, 10 mm/mV. Monitor-style sweep; only the strip on the active slide animates.
   Print draws a static strip. Rhythm list: see R below. */
(function(){
const FS=250; // samples per second
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function G(a,t,mu,sd,amp){ // add gaussian into array a (periodic)
  const L=a.length,c=Math.round(mu*FS),w=Math.ceil(sd*FS*4);
  for(let i=-w;i<=w;i++){const k=((c+i)%L+L)%L,x=(c+i)/FS-mu;a[k]+=amp*Math.exp(-x*x/(2*sd*sd))}
}
/* waveform pieces */
function P(a,t,o={}){const amp=(o.amp??.15)*(o.inv?-1:1);G(a,t,t,o.sd??.022,amp);if(o.notch){G(a,t,t+.035,.018,amp*.8)}}
function N(a,t,rr=.8,o={}){ // narrow QRS + T, t = QRS onset
  const k=o.amp??1;
  G(a,t,t+.012,.007,-.08*k);G(a,t,t+.04,.009,1.1*k);G(a,t,t+.063,.009,-.25*k);
  if(o.noT)return;
  const qt=Math.min(.42,.39*Math.sqrt(rr)),ta=(o.tAmp??.28)*(o.tInv?-1:1);
  G(a,t,t+qt-.09,.045,ta*.85);G(a,t,t+qt-.03,.03,ta*.45);
}
function W(a,t,rr=.8,o={}){ // wide (ventricular) QRS + discordant T
  const k=(o.amp??1)*(o.neg?-1:1);
  G(a,t,t+.05,.026,1.15*k);G(a,t,t+.12,.03,-.5*k);
  if(o.noT)return;
  const qt=Math.min(.46,.42*Math.sqrt(rr));
  G(a,t,t+qt-.08,.06,-.38*k);
}
function SPIKE(a,t,amp=2.2){const i=Math.round(t*FS)%a.length;a[i]+=amp;a[(i+1)%a.length]-=amp*.3}
function wander(a,amp,seed){const L=a.length/FS,r=rng(seed),k1=Math.max(1,Math.round(L/4)),k2=k1+1,p1=r()*6.28,p2=r()*6.28;
  for(let i=0;i<a.length;i++){const t=i/FS;a[i]+=amp*(Math.sin(2*Math.PI*k1*t/L+p1)+.5*Math.sin(2*Math.PI*k2*t/L+p2))}}
function noise(a,amp,seed){const r=rng(seed);let v=0;for(let i=0;i<a.length;i++){v=.6*v+.4*(r()-.5);a[i]+=amp*v}}
function fib(a,amp,fLo,fHi,n,seed){ // sum of sinusoids, periodic over L
  const L=a.length/FS,r=rng(seed);
  for(let j=0;j<n;j++){const f=Math.round((fLo+(fHi-fLo)*r())*L)/L,ph=r()*6.28,am=amp*(.5+r()),mk=Math.max(1,Math.round(L/(2+3*r()))),mp=r()*6.28;
    for(let i=0;i<a.length;i++){const t=i/FS;a[i]+=am*(.55+.45*Math.sin(2*Math.PI*mk*t/L+mp))*Math.sin(2*Math.PI*f*t+ph)}}
}
function arr(L){return new Float32Array(Math.round(L*FS))}
function regular(rr,n,beat){const L=rr*n,a=arr(L);for(let i=0;i<n;i++)beat(a,i*rr,rr);return a}
function irregular(mean,spread,L,seed){ // RR list summing exactly to L
  const r=rng(seed),x=[];let s=0;while(s<L){const v=mean*(1-spread+2*spread*r());x.push(v);s+=v}
  const k=L/s;return x.map(v=>v*k)
}

const R={
  nsr:()=>regular(.8,10,(a,t,rr)=>{P(a,t,{});N(a,t+.16,rr)}),
  sb:()=>regular(1.25,6,(a,t,rr)=>{P(a,t);N(a,t+.16,rr)}),
  st:()=>regular(.48,16,(a,t,rr)=>{P(a,t);N(a,t+.14,rr)}),
  at:()=>regular(.4,20,(a,t,rr)=>{P(a,t,{amp:.12,inv:true,sd:.018});N(a,t+.13,rr,{tAmp:.22})}),
  mat:()=>{const L=8,a=arr(L),rrs=irregular(.55,.28,L,7);let t=0;const sh=[{},{inv:true,amp:.1},{notch:true,amp:.09},{amp:.22,sd:.018},{inv:true,amp:.14,sd:.03}];
    rrs.forEach((rr,i)=>{P(a,t,sh[i%5]);N(a,t+.12+.04*(i%3),rr);t+=rr});return a},
  psvt:()=>regular(1/3,24,(a,t,rr)=>N(a,t,rr,{tAmp:.22})),
  afl41:()=>{const a=regular(.8,10,(a,t,rr)=>N(a,t+.07,rr,{tAmp:.0001,noT:true}));flutter(a);return a},
  afl21:()=>{const a=regular(.4,20,(a,t,rr)=>N(a,t+.07,rr,{noT:true}));flutter(a);return a},
  af_rvr:()=>afib(.46,.3,8,3),
  af_mvr:()=>afib(.75,.35,9,5),
  af_svr:()=>afib(1.3,.25,10.4,11),
  vt:()=>regular(1/3,24,(a,t,rr)=>W(a,t,rr,{amp:1.05})),
  vt_slow:()=>regular(.4,20,(a,t,rr)=>W(a,t,rr,{amp:1})),
  vf_coarse:()=>{const a=arr(8);fib(a,.22,3.5,7.5,6,21);wander(a,.05,2);return a},
  vf_fine:()=>{const a=arr(8);fib(a,.06,4,8,6,31);wander(a,.03,3);noise(a,.02,4);return a},
  tdp:()=>{const L=8,a=arr(L);for(let i=0;i<a.length;i++){const t=i/FS,env=Math.sin(Math.PI*t/2),c=Math.sin(2*Math.PI*4.25*t);a[i]+=.9*env*(c+.25*Math.sin(4*Math.PI*4.25*t+.6))}return a},
  asystole:()=>{const a=arr(8);wander(a,.03,9);noise(a,.012,10);return a},
  pea:()=>regular(1,8,(a,t,rr)=>{P(a,t,{amp:.08});N(a,t+.18,rr,{amp:.55,tAmp:.12})}),
  ivr:()=>regular(1.7,4,(a,t,rr)=>W(a,t,rr,{amp:1.1})),
  aivr:()=>regular(.75,10,(a,t,rr)=>W(a,t,rr,{amp:1.1})),
  junc:()=>regular(1.2,6,(a,t,rr)=>{N(a,t,rr);P(a,t+.1,{inv:true,amp:.08,sd:.018})}),
  avb1:()=>regular(.86,9,(a,t,rr)=>{P(a,t);N(a,t+.32,rr)}),
  wenck:()=>{const pp=.75,L=9,a=arr(L),pr=[.16,.27,.35];for(let c=0;c<3;c++)for(let j=0;j<4;j++){const t=c*3+j*pp;P(a,t);if(j<3)N(a,t+pr[j],pp)}return a},
  mobitz2:()=>{const pp=.75,L=9,a=arr(L);for(let c=0;c<3;c++)for(let j=0;j<4;j++){const t=c*3+j*pp;P(a,t);if(j<3)N(a,t+.18,pp,{})}return a},
  avb3n:()=>{const L=18,a=arr(L);for(let t=0;t<L-1e-6;t+=.72)P(a,t+.1);for(let t=0;t<L-1e-6;t+=1.5)N(a,t+.4,1.5);return a},
  avb3w:()=>{const L=6.8,a=arr(L);for(let t=0;t<L-1e-6;t+=.68)P(a,t+.05);for(let t=0;t<L-1e-6;t+=1.7)W(a,t+.5,1.7);return a},
  sb_bbb:()=>regular(1.3,6,(a,t,rr)=>{P(a,t);W(a,t+.18,rr,{amp:.9})}),
  pace_v:()=>regular(.86,9,(a,t,rr)=>{SPIKE(a,t+.02);W(a,t+.03,rr,{amp:.75,neg:true})}),
  pace_dual:()=>regular(.86,9,(a,t,rr)=>{SPIKE(a,t+.01,1.6);P(a,t+.03,{amp:.12});SPIKE(a,t+.19);W(a,t+.2,rr,{amp:.75,neg:true})}),
  af_fast:()=>afib(.34,.28,8,17),
  psvt_conv:()=>{const L=10,a=arr(L);let t=0;for(let i=0;i<14;i++){N(a,t,1/3,{tAmp:.22});t+=1/3}t+=1.6;while(t<L-.8){P(a,t);N(a,t+.16,.85);t+=.85}return a},
  afl_reveal:()=>{const L=8,a=arr(L);for(let t=.07;t<L;t+=.4){if(t>3.6&&t<6.4)continue;N(a,t,.4,{noT:true})}flutter(a);return a},
  hyperk:()=>regular(.75,10,(a,t,rr)=>{G(a,t,t+.08,.05,.9);G(a,t,t+.25,.07,-.7);G(a,t,t+.47,.07,.75)}),
};
function flutter(a){const fw=.2,n=Math.round(a.length/FS/fw);for(let i=0;i<a.length;i++){const ph=((i/FS)/fw)%1;a[i]+=-.22*(ph<.75?(.5-ph/.75):(-.5+(ph-.75)/.25))}}
function afib(mean,spread,L,seed){const a=arr(L),rrs=irregular(mean,spread,L,seed);let t=0;rrs.forEach(rr=>{N(a,t,rr,{tAmp:.22});t+=rr});fib(a,.035,5,8,5,seed+1);noise(a,.015,seed+2);return a}

const cache={},rng_={};
function range(k){ // robust min/max (ignores single-sample pacer spikes)
  if(!rng_[k]){const d=data(k),n=d.length,m=new Float32Array(n);
    for(let i=0;i<n;i++){const w=[d[(i-2+n)%n],d[(i-1+n)%n],d[i],d[(i+1)%n],d[(i+2)%n]].sort((x,y)=>x-y);m[i]=w[2]} // median-5 drops pacer spikes
    let lo=1e9,hi=-1e9;for(let i=0;i<n;i++){if(m[i]<lo)lo=m[i];if(m[i]>hi)hi=m[i]}const pad=(hi-lo)*.06;rng_[k]=[lo-pad,hi+pad]}return rng_[k]}
function data(k){if(!cache[k]){const a=(R[k]||R.nsr)();if(k!=="asystole"&&!k.startsWith("vf"))noise(a,.008,k.length*13);cache[k]=a}return cache[k]}

const THEME={
  monitor:{bg:"#0a1322",sm:"rgba(80,220,140,.07)",lg:"rgba(80,220,140,.17)",tr:"#3dff8f",glow:"rgba(61,255,143,.55)",tx:"#3dff8f",tx2:"#7f93b5"},
  paper:{bg:"#fffafa",sm:"#f5d2d2",lg:"#e3a1a1",tr:"#14284b",glow:null,tx:"#b3122e",tx2:"#8a7f7f"}
};
const strips=[];
function Strip(c){
  this.c=c;this.ctx=c.getContext("2d");this.key=c.dataset.r||"nsr";this.d=data(this.key);
  this.sec=+(c.dataset.sec||6);this.h=+(c.dataset.h||240);this.th=THEME[c.dataset.theme||"monitor"];
  this.k=0;this.t0=null;this.w=0;c.style.height=this.h+"px";c.style.width="100%";c.style.display="block";
}
Strip.prototype.size=function(){
  const w=this.c.clientWidth;if(!w)return false;
  if(w!==this.w){const r=Math.min(3,(window.devicePixelRatio||1)*1.5);this.w=w;this.c.width=Math.round(w*r);this.c.height=Math.round(this.h*r);this.ctx.setTransform(r,0,0,r,0,0)}
  return true
};
Strip.prototype.val=function(t){const a=this.d,L=a.length,i=((Math.floor(t*FS))%L+L)%L;return a[i]};
Strip.prototype.draw=function(now,stat){
  if(!this.size())return;
  const g=this.ctx,W=this.w,H=this.h,th=this.th,mm=W/(this.sec*25),pps=25*mm;
  /* auto-fit: keep 10 mm/mV when the trace fits; otherwise reduce gain so nothing is cut off */
  const [lo,hi]=range(this.key),top=this.c.dataset.lead===" "&&!this.c.dataset.hr&&!this.c.dataset.label?8:38,bot=8,avail=H-top-bot;
  const span=Math.max(.3,hi-lo);let gain=10;if(span*10*mm>avail)gain=avail/(span*mm);
  const base=top+(avail-span*gain*mm)/2+hi*gain*mm;this.gain=gain;
  g.fillStyle=th.bg;g.fillRect(0,0,W,H);
  g.lineWidth=1;
  for(let i=0,x=0;x<=W;i++,x=i*mm){g.strokeStyle=i%5?th.sm:th.lg;g.beginPath();g.moveTo(x+.5,0);g.lineTo(x+.5,H);g.stroke()}
  for(let i=-60;i<=60;i++){const y=base+i*mm;if(y<0||y>H)continue;g.strokeStyle=i%5?th.sm:th.lg;g.beginPath();g.moveTo(0,y+.5);g.lineTo(W,y+.5);g.stroke()}
  const Tw=this.sec;let cur=W;
  if(!stat){if(this.t0===null)this.t0=now;const el=(now-this.t0)/1000;this.k=Math.floor(el/Tw);cur=(el%Tw)*pps}
  const y=t=>base-this.val(t)*gain*mm;
  g.lineJoin="round";g.lineCap="round";g.strokeStyle=th.tr;g.lineWidth=2.4;
  if(th.glow){g.shadowColor=th.glow;g.shadowBlur=6}
  const seg=(x0,x1,k)=>{if(x1<=x0)return;g.beginPath();for(let x=x0;x<=x1;x+=.75){const t=k*Tw+x/pps;x===x0?g.moveTo(x,y(t)):g.lineTo(x,y(t))}g.stroke()};
  seg(0,cur,this.k);
  if(!stat){seg(Math.min(W,cur+26),W,this.k-1);
    g.shadowBlur=0;g.fillStyle=th.tr;g.beginPath();g.arc(cur,y(this.k*Tw+cur/pps),3.6,0,7);g.fill()}
  g.shadowBlur=0;
  const c=this.c.dataset;g.font="700 18px 'JetBrains Mono',monospace";g.fillStyle=th.tx2;g.textAlign="left";g.fillText(c.lead||"II",14,26);
  if(c.hr){g.textAlign="right";g.fillStyle=th.tx;g.font="700 15px 'JetBrains Mono',monospace";g.fillText("HR",W-92,26);g.font="700 30px 'JetBrains Mono',monospace";g.fillText(c.hr,W-14,32)}
  if(gain<9.5){g.textAlign="right";g.fillStyle=th.tx2;g.font="700 14px 'JetBrains Mono',monospace";g.fillText((gain).toFixed(1)+" mm/mV",W-12,H-10)}
  if(c.label){g.textAlign="left";g.fillStyle=th.tx;g.font="700 18px 'Noto Sans TC','Noto Sans CJK TC',sans-serif";g.fillText(c.label,54,26)}
};
function init(){document.querySelectorAll("canvas.ecg").forEach(c=>{if(!c.__s){c.__s=new Strip(c);strips.push(c.__s)}})}
let printing=false;
function loop(now){
  if(!printing)strips.forEach(s=>{if(s.c.offsetParent)s.draw(now,s.c.dataset.static!==undefined)});
  requestAnimationFrame(loop);
}
addEventListener("beforeprint",()=>{printing=true;strips.forEach(s=>{const sl=s.c.closest(".slide"),pd=sl&&sl.style.display;if(sl)sl.style.display="block";s.w=0;s.draw(0,true);if(sl)sl.style.display=pd})});
addEventListener("afterprint",()=>{printing=false;strips.forEach(s=>s.w=0)});
init();requestAnimationFrame(loop);
function set(c,r,hr){const s=c.__s;if(!s)return;s.key=r;s.d=data(r);if(hr!==undefined)c.dataset.hr=hr;s.t0=null}
/* rhythm switcher buttons: <a class="rbtn" data-for="canvasId" data-r="vf_coarse" data-hr="---" href="#">VF</a> */
document.addEventListener("click",e=>{const b=e.target.closest(".rbtn");if(!b)return;e.preventDefault();e.stopPropagation();
  const c=document.getElementById(b.dataset.for);if(!c)return;
  if(b.dataset.random!==undefined){const pool=b.dataset.random.split(",");let r;do{r=pool[Math.floor(Math.random()*pool.length)]}while(pool.length>1&&r===c.dataset.r);
    c.dataset.r=r;set(c,r,"");const ans=document.getElementById(b.dataset.ans);if(ans){ans.dataset.r=r;ans.classList.remove("shown")}return}
  c.dataset.r=b.dataset.r;set(c,b.dataset.r,b.dataset.hr||"");
  b.parentNode.querySelectorAll(".rbtn").forEach(x=>x.classList.toggle("on",x===b));
},true);
window.ECG={init,set,rhythms:Object.keys(R)};
})();
