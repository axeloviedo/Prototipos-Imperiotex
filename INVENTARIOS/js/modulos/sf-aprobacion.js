/* INVENTARIOS · GI-23 Solicitudes de materiales generadas, V°B° y decisiones con trazabilidad */
/* ===== GI-23 · Ola 3: solicitudes de materiales generadas y bloqueo del V°B° ===== */
let SOL_SEQ=33, SOL_OC_SEQ=236;
function spSolKeyDe(cod){
  if(!SP.scs)return null;
  const x=SP.scs.find(y=>y.cod===cod);
  return x?x.k:null;
}
function solTieneOC(solKey){
  const d=SOLS[solKey]; if(!d)return null;
  const k=OCS_ORDEN.find(k=>OCS[k] && OCS[k].solKey===solKey && OCS[k].est!=="Cancelada");
  return k||null;
}
function solLineaDe(solKey,cod){const d=SOLS[solKey];return d?((d.lines||[]).find(l=>l.cod===cod)||null):null}
function spEstadoSC(solKey,cod){
  const d=SOLS[solKey];
  if(!d)return {t:"-",c:"var(--borrador)"};
  const l=solLineaDe(solKey,cod);
  if(l && l.doc)return {t:l.prop==="Compra"?"Orden de Compra":"Transferencia",c:"var(--prp)"};
  if(solTieneOC(solKey))return {t:"Orden de Compra",c:"var(--prp)"};
  if(d.estado==="Rechazado")return {t:"Rechazado",c:"var(--rechazado-sol)"};
  if(d.estado==="Aprobado")return {t:"Aprobado",c:"var(--aprobado-sol)"};
  return {t:"Pendiente",c:"var(--pendiente)"};
}
/* Una sola Solicitud de Materiales (multi-línea) por pedido, con todo el déficit (decisión H5). */
function generarSOLdesdeSP(){
  const faltantes=(SP.mp||[]).filter(m=>m.falta && !spSolKeyDe(m.cod));
  if(!faltantes.length){toast("No hay materiales sin cobertura por solicitar.");return}
  const k="sg"+SOL_SEQ;
  const lines=faltantes.map(m=>({cod:m.cod,nom:m.nom,u:m.u,qty:Math.round(Math.abs(m.dif)*100)/100,prop:"",origen:"",doc:""}));
  SOLS[k]={id:"SOL-0000"+SOL_SEQ,estado:"Pendiente",user:USUARIO_GP,freq:"2026-07-31",
   alm:(faltantes[0].alm||"SB-ALM-MPT · MP Telas"),
   obs:"Déficit de materia prima de la Solicitud de Fabricación "+SP.id+" ("+SP.lineas.length+" artículo(s), "+spTotal(SP)+" prendas). Destino de producción: "+(SP.almDestino||"—")+".",
   nota:"Generada desde "+SP.id+" (GI-23): una sola solicitud multi-línea con "+lines.length+" material(es) en déficit.",
   origenSP:SPkey, lines:lines};
  SOL_LISTA.unshift({k:k,freq:"31/07/2026",crea:"19/07/2026"});
  SP.scs=SP.scs||[];
  faltantes.forEach(m=>SP.scs.push({k:k,cod:m.cod,nom:m.nom,u:m.u,qty:Math.round(Math.abs(m.dif)*100)/100,alm:m.alm}));
  SOL_SEQ++;
  renderPanelMP(); renderSCs(); renderVBaviso(); renderSol();
  toast(SOLS[k].id+" generada: 1 solicitud con "+lines.length+" material(es) en déficit, pendiente de aprobación");
}
function renderSCs(){
  const card=document.getElementById('sp-scs-card'), tb=document.getElementById('sp-scs');
  if(!SP.scs||!SP.scs.length){card.style.display="none";return}
  card.style.display="block"; tb.innerHTML="";
  SP.scs.forEach(x=>{
    const e=spEstadoSC(x.k,x.cod), ock=solTieneOC(x.k);
    tb.innerHTML+='<tr><td>'+SOLS[x.k].id+'</td><td>'+x.nom+'<br><span class="hint">'+x.cod+'</span></td>'+
     '<td style="text-align:right;font-weight:600">'+fmtM(x.qty)+' '+x.u+'</td>'+
     '<td>'+x.alm.split(" · ")[0]+'</td>'+
     '<td><span class="badge" style="background:'+e.c+'">'+e.t+'</span>'+(ock?'<br><span class="hint">'+OCS[ock].id+'</span>':'')+'</td>'+
     '<td><button class="btn-link" onclick="loadSOL(\''+x.k+'\')">Ver</button></td></tr>';
  });
}
function spBloqueoVB(){
  const pend=[];
  (SP.mp||[]).forEach(m=>{
    if(!m.falta)return;
    const k=spSolKeyDe(m.cod), l=k?solLineaDe(k,m.cod):null;
    if(!k || !((l && l.doc) || solTieneOC(k)))pend.push(m.nom);
  });
  return pend;
}
function renderVBaviso(){
  const av=document.getElementById('sp-aviso'), btn=document.getElementById('sp-b-vb');
  if(SP.est!=="Pendiente Aprobar"){return}
  const pend=spBloqueoVB();
  if(pend.length){
    av.style.display="block"; av.style.borderLeftColor="var(--pendiente)"; av.style.background="#FFFBEB";
    av.innerHTML='<b style="font-size:12.5px">⚠ V°B° bloqueado</b><p class="hint" style="margin-top:5px">La materia prima debe tener diferencia ≥ 0, o su Solicitud de Materiales con Orden de Compra o Transferencia creada. Pendiente: <b>'+pend.join(", ")+'</b>.</p>';
    btn.disabled=true; btn.style.opacity=".5"; btn.title="Resuelva la cobertura de materia prima";
  }else{
    av.style.display="block"; av.style.borderLeftColor="var(--confirmado)"; av.style.background="#F0FDF4";
    av.innerHTML='<b style="font-size:12.5px">Materia prima cubierta</b><p class="hint" style="margin-top:5px">Todos los materiales alcanzan o ya tienen su Orden de Compra o Transferencia: el V°B° de Logística queda habilitado.</p>';
    btn.disabled=false; btn.style.opacity="1"; btn.title="";
  }
}

/* ===== GI-23 · Ola 4: decisiones con trazabilidad ===== */
const HOY_GP="19/07/2026";
function spHistSet(a,d,e){
  const h=SP.hist.find(x=>x.a===a);
  if(h){h.d=d;h.e=e}else SP.hist.push({a:a,d:d,e:e});
}
function preVB(){
  /* Que falte material no impide dar el V°B°: la fabricación puede arrancar con material parcial
     y las compras se gestionan en paralelo. Solo se avisa. */
  const pend=spBloqueoVB();
  if(pend.length)toast("Aviso: "+pend.length+" material(es) sin cobertura. Puede dar el V°B° igualmente: la fabricación arranca con lo disponible.");
  openModal('m-gi23a');
}
function darVB(){
  closeModal('m-gi23a');
  SP.vb=true;
  spHistSet("V°B° Logística",HOY_GP+" 11:20 · Judith","ok");
  cerrarSiCompleto("V°B° de Logística registrado");
}
function aprobarSP(){
  closeModal('m-gi23b');
  SP.ger=true;
  spHistSet("Aprobación Gerencia",HOY_GP+" 15:40 · David","ok");
  cerrarSiCompleto("Aprobación de Gerencia registrada");
}
/* Decisión T7: al aprobarse la SP (V°B° Logística + Gerencia), su MP entra en Comprometido.
   Otra solicitud que usaba ese stock verá bajar su disponible (puede quedar en negativo). */
function spComprometerMP(){
  if(SP._committed)return;
  (SP.lineas||[]).forEach(l=>{ spEnsureReqs(l); (l.reqs||[]).forEach(r=>{
    if(r.tipo && r.tipo!=="Artículo")return; /* recursos/texto no mueven stock */
    const s=findStock(r.almOrigen, r.nom);
    if(s)s.res=Math.round(((s.res||0)+(r.cant||0))*100)/100;
  }); });
  SP._committed=true;
}
function cerrarSiCompleto(msg){
  if(SP.vb && SP.ger){
    SP.est="Aprobada";
    spComprometerMP();
    SP.hist.push({a:"Solicitud aprobada",d:HOY_GP+" · MP comprometida · Aprobada: las órdenes de fabricación se crean en Producción (Solicitudes de Fabricación)",e:"ok"});
    renderSPform(); renderSP();
    toast(msg+": la solicitud queda Aprobada y en solo lectura");
  }else{
    renderSPform(); renderSP();
    toast(msg+": falta "+(SP.vb?"la aprobación de Gerencia":"el V°B° de Logística"));
  }
}
function rechazarSP(){
  const m=document.getElementById('sp-motivo-rech').value.trim();
  if(!m){toast("El motivo del rechazo es obligatorio");return}
  closeModal('m-gi23c');
  SP.est="Rechazada"; SP.ger=false; SP.motivo=m;
  spHistSet("Aprobación Gerencia","Rechazada el "+HOY_GP+" · David","no");
  SP.hist.push({a:"Rechazo de Gerencia",d:HOY_GP+" 16:05 · David — Motivo: "+m,e:"no"});
  document.getElementById('sp-motivo-rech').value="";
  renderSPform(); renderSP();
  toast("Solicitud rechazada: vuelve a Comercial con el motivo visible");
}
function devolverSP(){
  const c=document.getElementById('sp-coment-mod').value.trim();
  if(!c){toast("El comentario para Comercial es obligatorio");return}
  closeModal('m-gi23d');
  SP.est="Borrador"; SP.vb=false; SP.ger=false; SP.devuelta=c;
  spHistSet("V°B° Logística","Pendiente · Judith","pend");
  spHistSet("Aprobación Gerencia","Pendiente · David","pend");
  SP.hist.push({a:"Devuelta para modificación",d:HOY_GP+" 12:30 · Judith — "+c,e:"pend"});
  document.getElementById('sp-coment-mod').value="";
  renderSPform(); renderSP();
  toast("Solicitud devuelta a Comercial: editable, con el comentario registrado");
}
function enviarSPrev(){
  if(!SP.lineas.length){toast("Agregue al menos un artículo al detalle");return}
  if(SP.lineas.some(l=>!(l.qty>0))){toast("Todas las líneas deben tener cantidad mayor a cero");return}
  SP.est="Pendiente Aprobar"; SP.vb=false; SP.ger=false;
  spHistSet("Envío a revisión",HOY_GP+" · "+USUARIO_GP,"ok");
  spHistSet("V°B° Logística","Pendiente · Judith","pend");
  spHistSet("Aprobación Gerencia","Pendiente · David","pend");
  renderSP(); loadSP(SPkey);
  toast(SP.id+" enviada a revisión: los paneles de stock y materia prima ya están calculados");
}
function reabrirSP(){
  SP.est="Borrador"; SP.vb=false; SP.ger=false; SP.motivo=""; SP.devuelta="";
  SP.hist.push({a:"Reabierta para corrección",d:HOY_GP+" · "+USUARIO_GP,e:"pend"});
  spHistSet("V°B° Logística","Pendiente · Judith","pend");
  spHistSet("Aprobación Gerencia","Pendiente · David","pend");
  renderSP(); loadSP(SPkey);
  toast(SP.id+" vuelve a Borrador: corrija el detalle y envíela otra vez a revisión");
}
function renderValidaciones(){
  const box=document.getElementById('sp-val');
  if(SP.est==="Borrador"){box.style.display="none";return}
  box.style.display="block";
  const li=(t,ok,q)=>'<div style="padding:4px 0">'+t+': '+(ok?'<b style="color:var(--confirmado)">✓ '+q+'</b>':'<b style="color:var(--pendiente)">pendiente</b>')+'</div>';
  box.innerHTML='<b style="font-size:12.5px">Validaciones</b>'+
    li("Logística",SP.vb,"Judith")+
    li("Gerencia",SP.ger,"David")+
    '<p class="hint" style="margin-top:6px">Ambas decisiones son independientes y pueden registrarse en cualquier orden.</p>';
}
