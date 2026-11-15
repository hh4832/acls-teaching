
/* ---------- flowchart renderer ---------- */
const NS="http://www.w3.org/2000/svg";
const STY={
  main:{fill:"#ffffff",stroke:"#14284b",text:"#1b2333",w:2.5},
  key:{fill:"#fff4dc",stroke:"#a86a00",text:"#1b2333",w:2.5},
  end:{fill:"#b3122e",stroke:"#b3122e",text:"#ffffff",w:2.5},
  navy:{fill:"#14284b",stroke:"#14284b",text:"#ffffff",w:2.5},
  dec:{fill:"#e3f3f1",stroke:"#0f6e6e",text:"#0b3d3d",w:2.5},
  note:{fill:"#fbe9ec",stroke:"#b3122e",text:"#1b2333",w:2,dash:"8 6"}
};
function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e}
function flow(id,nodes,edges){
  const s=document.getElementById(id); if(!s) return;
  const d=el("defs",{},s);
  const m=el("marker",{id:id+"a",viewBox:"0 0 10 10",refX:"9",refY:"5",markerWidth:"9",markerHeight:"9",orient:"auto-start-reverse"},d);
  el("path",{d:"M0 0L10 5L0 10z",fill:"#14284b"},m);
  edges.forEach(e=>{
    const pts=e.p.map(q=>q.join(",")).join(" ");
    el("polyline",{points:pts,fill:"none",stroke:"#14284b","stroke-width":"2.5","marker-end":"url(#"+id+"a)","stroke-dasharray":e.dash?"8 7":"none"},s);
    if(e.l){const g=el("g",{},s);const t=el("text",{x:e.lx,y:e.ly,"font-size":"20","font-weight":"700",fill:"#b3122e","text-anchor":e.a||"middle"},g);t.textContent=e.l;}
  });
  nodes.forEach(n=>{
    const st=STY[n.k||"main"];
    el("rect",{x:n.x,y:n.y,width:n.w,height:n.h,rx:n.k==="end"?n.h/2:12,fill:st.fill,stroke:st.stroke,"stroke-width":st.w,"stroke-dasharray":st.dash||"none"},s);
    const lines=n.t.split("\n"),fs=n.fs||22,lh=fs*1.35;
    const y0=n.y+n.h/2-(lines.length-1)*lh/2+fs*0.36;
    lines.forEach((ln,i)=>{const t=el("text",{x:n.x+n.w/2,y:y0+i*lh,"font-size":fs,"font-weight":i===0&&n.b!==false?"700":"500",fill:st.text,"text-anchor":"middle"},s);t.textContent=ln;});
  });
}
