/* COMPRAS · CO-15 Sugerido de Compras */
/* ===== CO-15 · Sugerido de Compras ===== */
let SUG_SEQ=34;
const SUG_MESES_LBL=["Nov","Dic","Ene","Feb","Mar","Abr","May","Jun","Jul"];
const SUGERIDO=[
 {cod:"MP-0045",nom:"CIERRE METALICO 12CM",u:"UND",t:"MATERIA PRIMA",c:"AVÍOS DE CONFECCIÓN",alm:"SB-ALM-MPA · MP Avíos",
  meses:[2500,3100,2600,2900,3000,3100,2800,3500,3300],plan:160,hol:15,disp:58,cam:3000,camDoc:"OC-000229 confirmada, pendiente de recepción"},
 {cod:"MP-0044",nom:"BOTON METALICO 17MM",u:"UND",t:"MATERIA PRIMA",c:"AVÍOS DE ACABADOS - PRINCIPALES",alm:"SB-ALM-MPA · MP Avíos",
  meses:[2700,3400,2900,3000,3100,3050,3000,3200,3100],plan:160,hol:15,disp:340,cam:4000,camDoc:"OC-000219 (importación YKK) en tránsito"},
 {cod:"MP-0046",nom:"CIERRE YKK RC-045 12CM",u:"UND",t:"MATERIA PRIMA",c:"AVÍOS DE CONFECCIÓN",alm:"SB-ALM-MPA · MP Avíos",
  meses:[2000,2600,2200,2400,2500,2550,2400,2700,2700],plan:0,hol:15,disp:0,cam:6000,camDoc:"OC-000219 (importación YKK) en tránsito"},
 {cod:"MP-0012",nom:"TELA DENIM 12 OZ AZUL",u:"MT",t:"MATERIA PRIMA",c:"TELAS",alm:"SB-ALM-MPT · MP Telas",
  meses:[820,1050,850,900,940,920,880,1010,960],plan:415.80,hol:15,disp:282.40,cam:500,camDoc:"OC-000228 confirmada por 500 MT"},
 {cod:"MP-0013",nom:"TELA DENIM 12 OZ NEGRO",u:"MT",t:"MATERIA PRIMA",c:"TELAS",alm:"SB-ALM-MPT · MP Telas",
  meses:[340,470,360,400,420,410,380,450,430],plan:0,hol:15,disp:96.50,cam:0,camDoc:""},
 {cod:"MP-0031",nom:"HILO POLIESTER AZUL",u:"CONO",t:"MATERIA PRIMA",c:"HILOS",alm:"SB-ALM-MPA · MP Avíos",
  meses:[40,55,42,46,48,47,44,52,48],plan:8,hol:15,disp:45,cam:0,camDoc:""},
 {cod:"MP-0032",nom:"HILO POLIESTER NEGRO",u:"CONO",t:"MATERIA PRIMA",c:"HILOS",alm:"SB-ALM-MPA · MP Avíos",
  meses:[22,34,25,28,30,29,26,32,30],plan:0,hol:15,disp:38,cam:0,camDoc:""},
 {cod:"MERC-0205",nom:"CARTERA MINI VALENTINA COLOR CAMEL",u:"UND",t:"MERCADERÍA",c:"CARTERAS",alm:"SB-ALM-PT · Central Mercadería",
  meses:[90,150,100,105,115,120,110,125,125],plan:0,hol:15,disp:35,cam:0,camDoc:"Mercadería de reventa: se compra terminada, no se produce"}
];
function sugVentana(){const el=document.getElementById('f-sug-m');return el?parseInt(el.value)||3:3}
function sugProm(r){
  const w=sugVentana(), arr=r.meses.slice(-w);
  return Math.round(arr.reduce((a,v)=>a+v,0)/w*100)/100;
}
function sugDetalleMeses(r){
  const w=sugVentana();
  const arr=r.meses.slice(-w);
  return SUG_MESES_LBL.slice(-w).map((m,i)=>m+" "+fmtQ(arr[i],r.u)).join(" · ");
}
function sugNec(r){
  const conHol=sugProm(r)*(1+(r.hol||0)/100);
  return Math.round(Math.max(conHol,r.plan||0)*100)/100;
}
function sugVal(r){return Math.round((sugNec(r)-r.disp-r.cam)*100)/100}
function fmtQ(v,u){return (u==="UND")?Math.ceil(v).toLocaleString("es-PE"):v.toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2})}
function renderSugerido(){
  const tb=document.getElementById('co15-body'); if(!tb)return;
  const selG=document.getElementById('f-sug-g'), selS=document.getElementById('f-sug-sg');
  if(selG.options.length<=1){
    [...new Set(SUGERIDO.map(r=>r.t))].forEach(a=>{const o=document.createElement('option');o.textContent=a;selG.appendChild(o)});
    [...new Set(SUGERIDO.map(r=>r.c))].forEach(a=>{const o=document.createElement('option');o.textContent=a;selS.appendChild(o)});
  }
  const fq=(document.getElementById('f-sug-q').value||"").toLowerCase(), fg=selG.value, fs=selS.value;
  tb.innerHTML=""; let n=0;
  const orden=SUGERIDO.map((r,i)=>({r,i})).sort((a,b)=>sugProm(b.r)-sugProm(a.r));
  orden.forEach(({r,i})=>{
    if(fq && !(r.cod.toLowerCase().includes(fq)||r.nom.toLowerCase().includes(fq)))return;
    if(fg && r.t!==fg)return;
    if(fs && r.c!==fs)return;
    n++;
    const prom=sugProm(r);
    const planaplica=(r.plan||0)>prom*(1+(r.hol||0)/100);
    tb.innerHTML+='<tr id="co15-tr-'+i+'">'+
     '<td style="color:var(--texto-sec)">'+n+'</td>'+
     '<td>'+r.cod+'</td><td>'+r.nom+'</td><td>'+r.u+'</td>'+
     '<td id="co15-prom-'+i+'" style="text-align:right;font-weight:600" title="Salidas del Kardex · '+sugDetalleMeses(r)+'">'+fmtQ(prom,r.u)+'</td>'+
     '<td style="text-align:right">'+(r.plan?fmtQ(r.plan,r.u)+(planaplica?' <span class="warn" title="El plan aprobado supera al histórico con holgura: manda el plan">⚠</span>':''):'-')+'</td>'+
     '<td><input value="'+r.hol+'" style="text-align:right" oninput="sugHolInput('+i+',this)"></td>'+
     '<td id="co15-nec-'+i+'" style="text-align:right;font-weight:600;cursor:help" title="Mayor entre consumo × (1 + holgura) y el plan aprobado (GP)">'+fmtQ(sugNec(r),r.u)+'</td>'+
     '<td style="text-align:right">'+fmtQ(r.disp,r.u)+'</td>'+
     '<td style="text-align:right"'+(r.cam?' title="'+r.camDoc+'"':'')+'>'+(r.cam?fmtQ(r.cam,r.u):'-')+'</td>'+
     '<td id="co15-sug-'+i+'" style="text-align:right">'+sugCellHTML(r)+'</td>'+
     '<td id="co15-acc-'+i+'">'+sugAccionHTML(r,i)+'</td></tr>';
  });
  if(!n)tb.innerHTML='<tr><td colspan="12" style="text-align:center;color:var(--texto-sec);padding:16px">Sin artículos para los filtros aplicados</td></tr>';
  document.getElementById('co15-count').textContent=n+" artículos · el ranking # se reordena según la ventana de consumo elegida";
}
function sugFormulaTxt(r){
  const prom=sugProm(r), hol=r.hol||0, conHol=Math.round(prom*(1+hol/100)*100)/100;
  const nec=sugNec(r), v=sugVal(r), w=sugVentana();
  let f="Consumo prom. ("+w+" meses) "+fmtQ(prom,r.u)+" × "+(1+hol/100).toFixed(2)+" (holgura "+hol+"%) = "+fmtQ(conHol,r.u);
  if((r.plan||0)>conHol)f+=" · pero el plan aprobado (GP) pide "+fmtQ(r.plan,r.u)+", que es mayor: manda el plan → Necesidad "+fmtQ(nec,r.u);
  else f+=" → Necesidad "+fmtQ(nec,r.u);
  f+=" − Disponible "+fmtQ(r.disp,r.u)+" − En camino "+fmtQ(r.cam,r.u)+" = "+fmtQ(v,r.u);
  if(v<=0)f+=" → cubierto: No comprar";
  else f+=" → comprar "+fmtQ(v,r.u)+" "+r.u;
  return f;
}
function sugCellHTML(r){
  const v=sugVal(r);
  if(v<=0)return '<span class="badge" style="background:var(--confirmado);cursor:help" title="'+sugFormulaTxt(r)+'">No comprar</span>';
  return '<b style="color:var(--primario);cursor:help" title="'+sugFormulaTxt(r)+'">'+fmtQ(v,r.u)+' '+r.u+'</b>';
}
function sugAccionHTML(r,i){
  const v=sugVal(r);
  if(v<=0)return '<span class="hint" title="Lo disponible más lo que viene en camino cubre la necesidad">Cubierto</span>';
  return '<button class="btn btn-secondary btn-sm" onclick="sugGenerarSOL('+i+')">Generar Solicitud</button>';
}
function sugHolInput(i,el){
  const r=SUGERIDO[i];
  r.hol=parseFloat(el.value)||0;
  const cn=document.getElementById('co15-nec-'+i), cs=document.getElementById('co15-sug-'+i), ca=document.getElementById('co15-acc-'+i);
  if(cn)cn.textContent=fmtQ(sugNec(r),r.u);
  if(cs)cs.innerHTML=sugCellHTML(r);
  if(ca)ca.innerHTML=sugAccionHTML(r,i);
}
function sugGenerarSOL(i){
  const r=SUGERIDO[i], v=sugVal(r);
  const k="sug"+SUG_SEQ;
  SOLS[k]={id:"SOL-0000"+SUG_SEQ,estado:"Pendiente",user:"USER00 · Logística",freq:"2026-08-05",alm:r.alm,
   obs:"Generada desde el Sugerido de Compras (CO-15): consumo prom. "+fmtQ(sugProm(r),r.u)+" "+r.u+"/mes + holgura "+r.hol+"% − disponible − en camino.",
   nota:"",lines:[{cod:r.cod,nom:r.nom,u:r.u,qty:(r.u==="UND")?Math.ceil(v):v,prop:"",origen:"",doc:""}]};
  SOL_LISTA.unshift({k:k,freq:"2026-08-05",crea:"19/07/2026 · USER00"});
  SUG_SEQ++;
  renderSol();
  toast(SOLS[k].id+" creada con "+fmtQ(v,r.u)+" "+r.u+" de "+r.nom+": sigue el circuito normal de aprobación (GI-13)");
  loadSOL(k);
}
