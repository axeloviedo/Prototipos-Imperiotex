/* INVENTARIOS · GI-13 Solicitudes de Materiales */
/* ===== GI-13 · Solicitudes de Materiales ===== */
const SOL_BADGE={"Borrador":["Borrador","var(--borrador)"],"Pendiente":["Pendiente","var(--pendiente)"],"Aprobado":["Aprobado","var(--aprobado-sol)"],"Rechazado":["Rechazado","var(--rechazado-sol)"]};
const SOLS={
 nueva:{id:"SOL-000032",estado:"Borrador",user:"USER00 · Logística",freq:"2026-07-24",alm:"",obs:"",lines:[],nota:""},
 s31:{id:"SOL-000031",estado:"Pendiente",user:"USER03 · Producción",freq:"2026-07-22",alm:"SB-ALM-MPA · MP Avíos",
   obs:"Avíos para completar la OF-000123 (Zuleika) en producción.",nota:"",
   lines:[{cod:"MP-0032",nom:"HILO POLIESTER NEGRO",u:"UND",qty:6,prop:"",origen:"",doc:""},{cod:"MP-0044",nom:"BOTON METALICO 17MM",u:"UND",qty:180,prop:"",origen:"",doc:""}]},
 s30:{id:"SOL-000030",estado:"Pendiente",user:"USER07 · Tienda Gamarra 1",freq:"2026-07-21",alm:"SB-TDA-01 · Tienda Gamarra 1",
   obs:"Reposición de tienda por alerta de mínimos (talla 30).",nota:"",
   lines:[{cod:"ART-0001-28AZ",nom:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",u:"UND",qty:6,prop:"",origen:"",doc:""},{cod:"ART-0001-30AZ",nom:"PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL",u:"UND",qty:6,prop:"",origen:"",doc:""}]},
 s29:{id:"SOL-000029",estado:"Aprobado",user:"USER03 · Producción",freq:"2026-07-25",alm:"SB-ALM-MPT · MP Telas",
   obs:"Tela negra para la producción de agosto.",
   nota:"Aprobada el 16/07/2026 por USER00 · Logística: 1 línea para Compra. Se notificó al solicitante.",
   lines:[{cod:"MP-0013",nom:"TELA DENIM 12 OZ NEGRO",u:"MT",qty:150,prop:"Compra",origen:"",doc:"OC-000232"}]},
 s27:{id:"SOL-000027",estado:"Rechazado",user:"USER07 · Tienda Gamarra 1",freq:"2026-07-16",alm:"SB-ALM-MPA · MP Avíos",
   obs:"Compra de cierres para stock.",
   nota:"Rechazada el 13/07/2026 por USER00 · Logística. Motivo: stock suficiente en almacén; usar existencias antes de comprar. Se notificó al solicitante.",
   lines:[{cod:"MP-0045",nom:"CIERRE METALICO 12CM",u:"UND",qty:500,prop:"",origen:"",doc:""}]}
};
const SOL_LISTA=[
 {k:"s31",freq:"22/07/2026",crea:"18/07/2026"},
 {k:"s30",freq:"21/07/2026",crea:"18/07/2026"},
 {k:"s29",freq:"25/07/2026",crea:"15/07/2026"},
 {k:"s27",freq:"16/07/2026",crea:"12/07/2026"}
];
let SOL={key:"nueva"};

/* ===== GI-13 · Solicitudes de Materiales =====
   El solicitante indica qué necesita y a dónde (sin propósito). Logística, al aprobar, define el propósito por línea:
   Compra → Orden de Compra · Transferencia → Transferencia GI-11 desde el almacén de origen. */
const SOL_PROPS=["Compra","Transferencia"];
function solStockOtros(l,destino){
  return STOCK.filter(r=>r.art===l.nom && r.alm!==destino && (r.real-r.res)>0).map(r=>({alm:r.alm,disp:Math.round((r.real-r.res)*100)/100}));
}
function solResumenProp(d){
  const c={}; d.lines.forEach(l=>{if(l.prop)c[l.prop]=(c[l.prop]||0)+1});
  const t=Object.keys(c).map(p=>c[p]+" "+p).join(" · ");
  return t||'<span class="hint">Lo define Logística</span>';
}
function renderSol(){
  const e=document.getElementById('f-sol-e').value;
  const tb=document.getElementById('sol-body'); tb.innerHTML=""; let n=0;
  SOL_LISTA.forEach(x=>{
    const d=SOLS[x.k];
    if(e && d.estado!==e)return;
    n++;
    const b=SOL_BADGE[d.estado];
    const tr=document.createElement('tr'); tr.className="clickable"; tr.onclick=()=>loadSOL(x.k);
    tr.innerHTML='<td>'+d.id+'</td><td><span class="badge" style="background:'+b[1]+'">'+b[0]+'</span></td><td>'+solResumenProp(d)+'</td><td>'+x.freq+'</td><td>'+x.crea+'</td><td><button class="btn-link">⋯</button></td>';
    tb.appendChild(tr);
  });
  document.getElementById('sol-count').textContent=n+" solicitudes";
}
function loadSOL(k){
  if(k==="nueva")Object.assign(SOLS.nueva,{id:"SOL-0000"+SOL_SEQ,user:USUARIO_GP,alm:"",obs:"",lines:[]});
  SOL.key=k; const d=SOLS[k]; SOL.lines=d.lines.map(l=>({prop:"",origen:"",doc:"",...l})); SOL.estado=d.estado;
  document.getElementById('sol-id').value=d.id;
  document.getElementById('sol-user').value=d.user;
  document.getElementById('sol-freq').value=d.freq;
  document.getElementById('sol-alm').value=d.alm;
  document.getElementById('sol-obs').value=d.obs;
  renderSOLform(); go('gi13f');
}
function renderSOLform(){
  const e=SOL.estado, ro=(e!=="Borrador"), log=(e!=="Borrador"), edLog=(e==="Pendiente"&&!VISTA_CM);
  const destino=document.getElementById('sol-alm').value;
  document.getElementById('sol-items-head').innerHTML='<tr><th style="width:40px">#</th><th>Código</th><th>Nombre</th><th>Unidad</th><th style="width:110px;text-align:right">Cantidad</th>'+
    (log?'<th style="width:180px">Stock en otros almacenes</th><th style="width:140px">Propósito</th><th style="width:200px">Almacén origen</th><th style="width:120px">Documento</th>':'')+'<th style="width:60px"></th></tr>';
  const tb=document.getElementById('sol-items'); tb.innerHTML="";
  SOL.lines.forEach((l,i)=>{
    const qty=ro?'<td style="text-align:right">'+l.qty+'</td>':'<td><input value="'+l.qty+'" style="text-align:right" oninput="SOL.lines['+i+'].qty=parseFloat(this.value)||0"></td>';
    let extra="";
    if(log){
      const otros=solStockOtros(l,destino);
      const stock=otros.length?otros.map(o=>o.alm.split(" · ")[0]+": "+o.disp).join("<br>"):'<span class="hint">Sin stock</span>';
      const prop=edLog?'<select onchange="SOL.lines['+i+'].prop=this.value;if(this.value!==\'Transferencia\')SOL.lines['+i+'].origen=\'\';renderSOLform()"><option value="">Seleccionar…</option>'+SOL_PROPS.map(p=>'<option'+(l.prop===p?' selected':'')+'>'+p+'</option>').join('')+'</select>':(l.prop||'—');
      const orig=l.prop!=="Transferencia"?'<span class="hint">—</span>':(edLog?'<select onchange="SOL.lines['+i+'].origen=this.value"><option value="">Seleccionar…</option>'+otros.map(o=>'<option'+(l.origen===o.alm?' selected':'')+'>'+o.alm+'</option>').join('')+'</select>':(l.origen||'—'));
      extra='<td style="font-size:12px">'+stock+'</td><td>'+prop+'</td><td>'+orig+'</td><td>'+(l.doc||'<span class="hint">—</span>')+'</td>';
    }
    const tr=document.createElement('tr');
    tr.innerHTML='<td>'+(i+1)+'</td><td>'+l.cod+'</td><td>'+l.nom+'</td><td>'+l.u+'</td>'+qty+extra+
      '<td>'+(ro?'':'<button class="btn-link" onclick="SOL.lines.splice('+i+',1);renderSOLform()">Eliminar</button>')+'</td>';
    tb.appendChild(tr);
  });
  if(!SOL.lines.length)tb.innerHTML='<tr><td colspan="'+(log?10:6)+'" style="text-align:center;color:var(--texto-sec);padding:18px">Sin artículos: use "+ Agregar artículo"</td></tr>';
  const b=SOL_BADGE[e], badge=document.getElementById('sol-badge');
  badge.textContent=b[0]; badge.style.background=b[1];
  const show=(id,v)=>document.getElementById(id).style.display=v?"inline-block":"none";
  show('sol-b-cancelar',e==="Borrador"); show('sol-b-enviar',e==="Borrador"); show('sol-b-add',e==="Borrador");
  show('sol-b-aprobar',e==="Pendiente"&&!VISTA_CM); show('sol-b-rechazar',e==="Pendiente"&&!VISTA_CM);
  show('sol-b-volver',e!=="Borrador"&&(VISTA_CM||e!=="Pendiente"));
  const pend=SOL.lines.some(l=>l.prop&&!l.doc);
  document.getElementById('sol-b-crear').style.display=(e==="Aprobado"&&pend&&!VISTA_CM)?"inline-block":"none";
  if(e==="Aprobado")crearMenuSOL();
  ['sol-freq','sol-alm','sol-obs'].forEach(id=>document.getElementById(id).disabled=ro);
  const nota=document.getElementById('sol-nota'), d=SOLS[SOL.key];
  if(d.nota){nota.style.display="block";nota.style.borderLeftColor=(e==="Rechazado")?"var(--rechazado-sol)":"var(--aprobado-sol)";nota.innerHTML='<b style="font-size:12.5px">'+(e==="Rechazado"?"Solicitud rechazada":"Solicitud aprobada")+'</b><p class="hint" style="margin-top:5px">'+d.nota+'</p>'}
  else nota.style.display="none";
}
function enviarSOL(){
  if(!document.getElementById('sol-alm').value){toast("Indique el almacén destino");return}
  if(!SOL.lines.length){toast("Agregue al menos un artículo a la solicitud");return}
  if(SOL.lines.some(l=>!(l.qty>0))){toast("Todas las líneas deben tener cantidad mayor a cero");return}
  const k="sn"+SOL_SEQ, fr=document.getElementById('sol-freq').value;
  SOLS[k]={id:"SOL-0000"+SOL_SEQ,estado:"Pendiente",user:USUARIO_GP,freq:fr,alm:document.getElementById('sol-alm').value,
   obs:document.getElementById('sol-obs').value,nota:"",lines:SOL.lines.map(l=>({...l,prop:"",origen:"",doc:""}))};
  SOL_LISTA.unshift({k:k,freq:fr?fr.split("-").reverse().join("/"):"—",crea:HOY_GP});
  SOL_SEQ++; renderSol();
  toast(SOLS[k].id+" enviada: Logística definirá el propósito de cada línea al aprobarla");
  go('gi13');
}
function aprobarSOL(){
  const i=SOL.lines.findIndex(l=>!l.prop||(l.prop==="Transferencia"&&!l.origen));
  if(i>=0){toast("Línea "+(i+1)+": defina el propósito"+(SOL.lines[i].prop==="Transferencia"?" y el almacén de origen":""));return}
  const d=SOLS[SOL.key]; d.lines=SOL.lines.map(l=>({...l})); d.estado="Aprobado"; SOL.estado="Aprobado";
  const nC=d.lines.filter(l=>l.prop==="Compra").length, nT=d.lines.length-nC;
  d.nota="Aprobada hoy por USER00 · Logística: "+[nC?nC+" línea(s) para Compra":"",nT?nT+" línea(s) para Transferencia":""].filter(Boolean).join(" y ")+". Use Crear para generar los documentos. Se notificó al solicitante.";
  renderSOLform(); renderSol();
  toast("Solicitud aprobada con el propósito de cada línea");
}
function crearMenuSOL(){
  const m=document.getElementById('sol-crear-menu'), pend=SOL.lines.filter(l=>l.prop&&!l.doc);
  const nC=pend.filter(l=>l.prop==="Compra").length;
  const origenes=[...new Set(pend.filter(l=>l.prop==="Transferencia").map(l=>l.origen))];
  m.innerHTML=(nC?'<div class="op" onclick="crearOCdesdeSOL()">Crear Orden de Compra<small>'+nC+' línea(s) con propósito Compra</small></div>':'')+
    origenes.map(o=>'<div class="op" onclick="crearTRFdesdeSOL(\''+o+'\')">Crear Transferencia desde '+o.split(" · ")[0]+'<small>'+pend.filter(l=>l.prop==="Transferencia"&&l.origen===o).length+' línea(s) · se precarga GI-11</small></div>').join('');
}
function solMarcarDoc(filtro,doc){
  const d=SOLS[SOL.key];
  SOL.lines.forEach((l,i)=>{if(filtro(l)){l.doc=doc; if(d.lines[i])d.lines[i].doc=doc;}});
}
function crearTRFdesdeSOL(origen){
  document.getElementById('sol-crear-menu').classList.remove('open');
  const d=SOLS[SOL.key], f=l=>l.prop==="Transferencia"&&l.origen===origen&&!l.doc, lines=SOL.lines.filter(f);
  TRF.estado="Borrador";
  TRF.lines=lines.map(l=>({cod:l.cod,nom:l.nom,u:l.u,env:l.qty,rec:0,lote:"No aplica"}));
  const org=document.getElementById('trf-origen'); org.value=[...org.options].some(o=>o.value===origen)?origen:"";
  const dest=document.getElementById('trf-destino'); dest.value=[...dest.options].some(o=>o.value===d.alm)?d.alm:"";
  solMarcarDoc(f,"Transferencia (GI-11)");
  renderTRF(); go('gi11');
  toast("Transferencia desde "+origen.split(" · ")[0]+" precargada con "+lines.length+" línea(s) de "+d.id);
}
function crearOCdesdeSOL(){
  document.getElementById('sol-crear-menu').classList.remove('open');
  const d=SOLS[SOL.key], f=l=>l.prop==="Compra"&&!l.doc, lines=SOL.lines.filter(f);
  const doc=solCrearOC(d,lines);
  solMarcarDoc(f,doc);
  renderSol();
}
/* Compras: crea una OC real en Borrador (mismo patrón que nuevaOC) con las líneas de propósito Compra */
function solCrearOC(d,lines){
  let n=234; while(OCS["oc"+n])n++;
  const k="oc"+n, id="OC-"+String(n).padStart(6,"0");
  OCS[k]={id:id,est:"Borrador",sol:d.id,solKey:SOL.key,prov:"",provTipo:"",cond:"Contado",mon:"S/.",tc:"3.75",
   fecha:"2026-07-19",valLog:false,valGer:false,rec:0,fac:0,ref:"",op:"",obs:d.obs||"",
   items:lines.map(l=>({cod:l.cod,nom:l.nom,u:l.u,cant:l.qty,pu:0,igv:18})),ca:{adu:0,nac:0,fle:0},
   docs:["Creada desde "+d.id+" (líneas con propósito Compra)"]};
  OCS_ORDEN.unshift(k);
  renderOCS(); loadOC(k);
  toast(id+" creada en Borrador desde "+d.id+" con "+lines.length+" línea(s): seleccione proveedor y asigne precios");
  return id;
}
function rechazarSOL(){
  const m=document.getElementById('sol-motivo-rechazo').value.trim();
  if(!m){toast("El motivo del rechazo es obligatorio");return}
  closeModal('m-gi13a');
  const d=SOLS[SOL.key]; d.estado="Rechazado"; SOL.estado="Rechazado";
  d.nota="Rechazada hoy por USER00 · Logística. Motivo: "+m+" Se notificó al solicitante.";
  renderSOLform(); renderSol();
  toast("Solicitud rechazada con motivo; solicitante notificado");
}
