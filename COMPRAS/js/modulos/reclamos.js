/* COMPRAS · CO-11 Reclamos — DATOS DE EJEMPLO · no conectado a la base compartida (docs/16 §5).
   Usa sus propias OC de ejemplo (REC_OCS); los enlaces a esas OC no abren CO-07. */
/* ===== CO-11 · Reclamos ===== */
const REC_EST={"Registrado":"var(--reclamo-reg)","Resuelto":"var(--confirmado)"};
const MOTIVOS=["Faltante en la entrega","Producto con defecto de fábrica","Tono o color distinto al aprobado","Medida o gramaje fuera de especificación","Producto oxidado o deteriorado","Servicio mal ejecutado","Entrega fuera de plazo","Otros"];
const AVIOS=["MP-0031","MP-0032","MP-0044","MP-0045","MP-0046","MP-0047"];
/* OC de ejemplo solo para los reclamos (no existen en BD.d.ocs) */
const REC_OCS={
 oc225:{id:"OC-000225",prov:"AVÍOS DEL SUR EIRL",fecha:"05/07/2026",est:"Completada",mon:"S/.",items:[{cod:"MP-0044",nom:"BOTON METALICO 17MM",u:"UND",cant:500,recq:500},{cod:"MP-0045",nom:"CIERRE METALICO 12CM",u:"UND",cant:300,recq:300}]},
 oc231:{id:"OC-000231",prov:"TEXTIL SAN JACINTO SAC",fecha:"14/07/2026",est:"Para Pagar",mon:"S/.",items:[{cod:"MP-0012",nom:"TELA DENIM 12 OZ AZUL",u:"MT",cant:242.40,recq:242.40}]},
 oc228:{id:"OC-000228",prov:"LAVANDERIA INDUSTRIAL DEL SUR SAC",fecha:"10/07/2026",est:"Para Pagar",mon:"S/.",items:[{cod:"SERV-0005",nom:"SERVICIO DE LAVADO INDUSTRIAL",u:"UND",cant:60,recq:60}]},
 oc219:{id:"OC-000219",prov:"YKK DO BRASIL LTDA",fecha:"28/06/2026",est:"Para Recibir y Pagar",mon:"USD",items:[{cod:"MP-0046",nom:"CIERRE YKK RC-045 12CM",u:"UND",cant:6000,recq:0},{cod:"MP-0047",nom:"CIERRE YKK RM-030 15CM",u:"UND",cant:4000,recq:4000}]},
 oc222:{id:"OC-000222",prov:"CONFECCIONES EL AGUILA SAC",fecha:"01/07/2026",est:"Para Recibir y Pagar",mon:"S/.",items:[{cod:"SERV-0003",nom:"SERVICIO DE CONFECCION PANTALON",u:"UND",cant:120,recq:120}]},
 oc226:{id:"OC-000226",prov:"TRANSPORTES GAMARRA EXPRESS SAC",fecha:"08/07/2026",est:"Completada",mon:"S/.",items:[{cod:"SERV-0009",nom:"SERVICIO DE FLETE LOCAL",u:"UND",cant:2,recq:2}]},
 oc229:{id:"OC-000229",prov:"TEXTIL SAN JACINTO SAC",fecha:"11/07/2026",est:"Para Recibir y Pagar",mon:"S/.",items:[{cod:"MP-0012",nom:"TELA DENIM 12 OZ AZUL",u:"MT",cant:160,recq:80}]}
};
function recVerOC(k){ const o=REC_OCS[k]; toast((o?o.id:"OC")+": orden de ejemplo de Reclamos, no existe en la base compartida"); }
const RECS={
 r8:{id:"REC-000008",ock:"oc225",oc:"OC-000225",prov:"AVÍOS DEL SUR EIRL",obs:"Despacho con dos artículos observados al abrir las cajas.",freg:"10/07/2026",
  lineas:[{cod:"MP-0045",nom:"CIERRE METALICO 12CM",u:"UND",lote:"",qrec:300,qfall:36,motivo:"Producto oxidado o deteriorado"},
          {cod:"MP-0044",nom:"BOTON METALICO 17MM",u:"UND",lote:"",qrec:500,qfall:60,motivo:"Producto con defecto de fábrica"}],
  result:"Procedente",obsres:"El proveedor reconoce ambos lotes defectuosos y emite una sola Nota de Crédito.",salida:"Nota de Crédito",est:"Resuelto",fcierre:"12/07/2026",
  docs:["Ingreso relacionado: ING-000502 (módulo GI)","Nota de Crédito generada: NC-000009 por S/. 96.00 (pendiente de aplicar)"]},
 r6:{id:"REC-000006",ock:"oc231",oc:"OC-000231",prov:"TEXTIL SAN JACINTO SAC",obs:"Rollo 3 con tono distinto, detectado en corte (falla tardía).",freg:"08/06/2026",
  lineas:[{cod:"MP-0012",nom:"TELA DENIM 12 OZ AZUL",u:"MT",lote:"LOT-2026-0121",qrec:242.40,qfall:38.00,motivo:"Tono o color distinto al aprobado"}],
  result:"Procedente",obsres:"El proveedor acepta reponer el rollo observado.",salida:"Reposición",est:"Resuelto",fcierre:"14/06/2026",
  docs:["Ingreso relacionado: ING-000513 (módulo GI)","Reposición recibida con guía del proveedor referenciando este reclamo"]},
 r5:{id:"REC-000005",ock:"oc228",oc:"OC-000228",prov:"LAVANDERIA INDUSTRIAL DEL SUR SAC",obs:"4 prendas manchadas en el lavado (OF-000118).",freg:"15/06/2026",
  lineas:[{cod:"SERV-0005",nom:"SERVICIO DE LAVADO INDUSTRIAL",u:"UND",lote:"",qrec:60,qfall:4,motivo:"Servicio mal ejecutado"}],
  result:"Procedente",obsres:"El proveedor rehace el lavado de las prendas observadas sin costo.",salida:"Reposición",est:"Resuelto",fcierre:"18/06/2026",
  docs:["Conformidad del servicio registrada con observaciones","Vinculado a producción: OF-000118"]},
 r4:{id:"REC-000004",ock:"oc219",oc:"OC-000219",prov:"YKK DO BRASIL LTDA",obs:"Faltantes detectados en el conteo del embarque.",freg:"22/05/2026",
  lineas:[{cod:"MP-0047",nom:"CIERRE YKK RM-030 15CM",u:"UND",lote:"",qrec:4000,qfall:150,motivo:"Faltante en la entrega"}],
  result:"Procedente",obsres:"YKK confirma el faltante y repone en el siguiente embarque.",salida:"Reposición",est:"Resuelto",fcierre:"30/05/2026",
  docs:["Importación relacionada: OC-000219 (USD)","Reposición programada para el siguiente embarque"]},
 r7:{id:"REC-000007",ock:"oc222",oc:"OC-000222",prov:"CONFECCIONES EL AGUILA SAC",obs:"18 prendas con costura defectuosa.",freg:"05/06/2026",
  lineas:[{cod:"SERV-0003",nom:"SERVICIO DE CONFECCION PANTALON",u:"UND",lote:"",qrec:120,qfall:18,motivo:"Producto con defecto de fábrica"}],
  result:"Procedente",obsres:"El taller recose las prendas observadas sin costo adicional.",salida:"Reposición",est:"Resuelto",fcierre:"09/06/2026",
  docs:["Conformidad del servicio registrada con observaciones"]},
 r3:{id:"REC-000003",ock:"oc226",oc:"OC-000226",prov:"TRANSPORTES GAMARRA EXPRESS SAC",obs:"Entrega con 1 día de retraso en el reparto a tiendas.",freg:"21/06/2026",
  lineas:[{cod:"SERV-0009",nom:"SERVICIO DE FLETE LOCAL",u:"UND",lote:"",qrec:2,qfall:1,motivo:"Entrega fuera de plazo"}],
  result:"No procedente",obsres:"Causa externa acreditada (bloqueo de vía): no se aplica penalidad.",salida:"Sin acción",est:"Resuelto",fcierre:"23/06/2026",
  docs:["Sin efectos económicos ni de stock"]},
 r9:{id:"REC-000009",ock:"oc229",oc:"OC-000229",prov:"TEXTIL SAN JACINTO SAC",obs:"Segundo despacho por debajo del gramaje acordado.",freg:"18/07/2026",
  lineas:[{cod:"MP-0012",nom:"TELA DENIM 12 OZ AZUL",u:"MT",lote:"LOT-2026-0141",qrec:80,qfall:12,motivo:"Medida o gramaje fuera de especificación"}],
  result:"Pendiente de gestión",obsres:"",salida:"",est:"Registrado",fcierre:"",
  docs:["Ingreso relacionado: ING-000508 (módulo GI)"]}
};
const RECS_ORDEN=["r9","r8","r6","r5","r7","r4","r3"];
let REC=null, RECkey="", REC_SEQ=10;
function recTotFall(d){return d.lineas.reduce((a,l)=>a+l.qfall,0)}
function recMotivoResumen(d){
  if(!d.lineas.length)return "-";
  const ms=[...new Set(d.lineas.map(l=>l.motivo))];
  return (ms.length===1)?ms[0]:(ms[0]+' <span class="hint">y '+(ms.length-1)+' motivo'+(ms.length>2?'s':'')+' más</span>');
}
function renderRec(){
  const q=(document.getElementById('f-rec-q').value||"").toLowerCase();
  const e=document.getElementById('f-rec-e').value, r=document.getElementById('f-rec-r').value, sa=document.getElementById('f-rec-s').value;
  const tb=document.getElementById('rec-body'); tb.innerHTML=""; let n=0;
  RECS_ORDEN.forEach(k=>{
    const d=RECS[k]; if(!d)return;
    if(q && !(d.id.toLowerCase().includes(q)||sinTildes(d.prov).includes(sinTildes(q))||d.oc.toLowerCase().includes(q)))return;
    if(e && d.est!==e)return; if(r && d.result!==r)return; if(sa && d.salida!==sa)return;
    n++;
    const resCol=(d.result==="Procedente")?'color:var(--confirmado);font-weight:600':((d.result==="No procedente")?'color:var(--cancelada)':'color:var(--pendiente)');
    const nl=d.lineas.length;
    const tr=document.createElement('tr'); tr.className="clickable"; tr.onclick=()=>loadRec(k);
    tr.innerHTML='<td>'+d.id+'</td><td>'+d.prov+'</td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();recVerOC(\''+d.ock+'\')">'+d.oc+'</button></td>'+
     '<td>'+recMotivoResumen(d)+(nl>1?'<br><span class="hint">'+nl+' artículos afectados</span>':'')+'</td>'+
     '<td style="'+resCol+'">'+d.result+'</td><td>'+(d.salida||"-")+'</td>'+
     '<td><span class="badge" style="background:'+REC_EST[d.est]+'">'+d.est+'</span></td><td>'+d.freg+'</td><td>'+(d.fcierre||"-")+'</td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();loadRec(\''+k+'\')">Abrir</button></td>';
    tb.appendChild(tr);
  });
  document.getElementById('rec-count').textContent=n+" reclamos";
}
function nuevoRec(ockPre){
  if(ockPre && !REC_OCS[ockPre])ockPre="";
  RECkey=""; REC={id:"REC-0000"+REC_SEQ,ock:"",oc:"",prov:"",obs:"",freg:"2026-07-19",lineas:[],
   result:"Pendiente de gestión",obsres:"",salida:"",est:"Registrado",fcierre:"",docs:[]};
  document.getElementById('rec-titulo').textContent="REGISTRAR RECLAMO";
  document.getElementById('rec-id').value=REC.id;
  document.getElementById('rec-oc').value=""; document.getElementById('rec-prov').value="";
  document.getElementById('rec-obs').value=""; document.getElementById('rec-obsres').value="";
  document.getElementById('rec-result').value="Pendiente de gestión"; document.getElementById('rec-salida').value="";
  renderRecForm();
  if(ockPre)vincularRecOC(ockPre);
  go('co11f');
}
function abrirRecOC(){
  const tb=document.getElementById('co11a-body'); tb.innerHTML="";
  Object.keys(REC_OCS).forEach(k=>{
    const o=REC_OCS[k]; if(!o)return;
    if(o.est==="Borrador"||o.est==="Pendiente de Validar"||o.est==="Cancelada")return;
    tb.innerHTML+='<tr><td>'+o.id+'</td><td>'+o.prov+'</td><td>'+o.fecha+'</td><td><span class="badge" style="background:'+OC_EST[o.est]+'">'+o.est+'</span></td>'+
     '<td><button class="btn btn-primary btn-sm" onclick="vincularRecOC(\''+k+'\')">Vincular</button></td></tr>';
  });
  openModal('m-co11a');
}
function vincularRecOC(k){
  closeModal('m-co11a');
  const o=REC_OCS[k]; if(!o){toast("OC de ejemplo no encontrada");return}
  REC.ock=k; REC.oc=o.id; REC.prov=o.prov; REC.lineas=[];
  document.getElementById('rec-oc').value=o.id;
  document.getElementById('rec-prov').value=o.prov;
  renderRecItems();
  toast(o.id+" vinculada: agregue las líneas afectadas");
}
function abrirRecItem(){
  if(!REC.ock){toast("Vincule primero la Orden de Compra");return}
  const o=REC_OCS[REC.ock], tb=document.getElementById('co11b-body'); tb.innerHTML="";
  o.items.forEach((it,i)=>{
    if(REC.lineas.some(l=>l.cod===it.cod))return;
    const qrec=(it.recq!==undefined&&it.recq>0)?it.recq:it.cant;
    tb.innerHTML+='<tr><td>'+it.cod+'</td><td>'+it.nom+'</td><td>'+it.u+'</td><td style="text-align:right">'+fmtM(qrec)+'</td>'+
     '<td><button class="btn btn-primary btn-sm" onclick="addRecLinea('+i+')">Agregar</button></td></tr>';
  });
  if(!tb.innerHTML)tb.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:14px">Todos los ítems de la OC ya están en el reclamo</td></tr>';
  openModal('m-co11b');
}
function addRecLinea(i){
  closeModal('m-co11b');
  const it=REC_OCS[REC.ock].items[i];
  const qrec=(it.recq!==undefined&&it.recq>0)?it.recq:it.cant;
  REC.lineas.push({cod:it.cod,nom:it.nom,u:it.u,lote:"",qrec:qrec,qfall:0,motivo:""});
  renderRecItems();
  toast("Línea agregada: indique la cantidad fallada y su motivo");
}
function recSetLinea(i,campo,v){
  const l=REC.lineas[i];
  if(campo==="qfall")l.qfall=parseFloat(v)||0; else l[campo]=v;
  renderRecItems();
}
function renderRecItems(){
  const editable=(RECkey==="");
  const tb=document.getElementById('rec-items'); tb.innerHTML="";
  let alerta=[];
  REC.lineas.forEach((l,i)=>{
    const pct=l.qrec?Math.round(l.qfall/l.qrec*1000)/10:0;
    const esAvio=AVIOS.includes(l.cod);
    const bajo=esAvio && l.qfall>0 && pct<10;
    if(esAvio && l.qfall>0)alerta.push({nom:l.nom,pct:pct,bajo:bajo});
    const lote=editable?('<input value="'+l.lote+'" placeholder="LOT-… (opcional)" style="width:100%" oninput="REC.lineas['+i+'].lote=this.value">'):(l.lote||'<span class="hint">-</span>');
    const qf=editable?('<input value="'+l.qfall+'" style="text-align:right" oninput="recQfInput('+i+',this)">'):fmtM(l.qfall);
    const mot=editable?('<select style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px" onchange="recSetLinea('+i+',\'motivo\',this.value)"><option value="">Seleccionar…</option>'+MOTIVOS.map(m=>'<option'+(m===l.motivo?' selected':'')+'>'+m+'</option>').join('')+'</select>'):l.motivo;
    tb.innerHTML+='<tr'+(bajo?' style="background:#FFFBEB"':'')+'><td>'+(i+1)+'</td><td>'+l.cod+'</td><td>'+l.nom+'</td><td>'+lote+'</td><td>'+l.u+'</td>'+
     '<td style="text-align:right">'+fmtM(l.qrec)+'</td><td>'+qf+'</td><td>'+mot+'</td>'+
     '<td id="rec-pct-'+i+'" style="text-align:right;'+(esAvio?(bajo?'color:var(--pendiente)':'color:var(--cancelada);font-weight:600'):'')+'">'+(l.qfall>0?pct+'%':'-')+'</td>'+
     '<td>'+(editable?'<button class="btn-link" onclick="REC.lineas.splice('+i+',1);renderRecItems()">Eliminar</button>':'')+'</td></tr>';
  });
  if(!REC.lineas.length)tb.innerHTML='<tr><td colspan="10" style="text-align:center;color:var(--texto-sec);padding:16px">'+(REC.ock?'Sin líneas: use "+ Agregar línea"':'Vincule primero la Orden de Compra')+'</td></tr>';
  recUmbralUI();
}
function recQfInput(i,el){
  const l=REC.lineas[i];
  l.qfall=parseFloat(el.value)||0;
  const pct=l.qrec?Math.round(l.qfall/l.qrec*1000)/10:0;
  const esAvio=AVIOS.includes(l.cod);
  const bajo=esAvio && l.qfall>0 && pct<10;
  const c=document.getElementById('rec-pct-'+i);
  if(c){c.textContent=(l.qfall>0?pct+'%':'-');
    c.style.color=esAvio?(bajo?'var(--pendiente)':'var(--cancelada)'):'';
    c.style.fontWeight=esAvio&&!bajo?'600':''}
  const tr=el.closest('tr');
  if(tr)tr.style.background=bajo?'#FFFBEB':'';
  recUmbralUI();
}
function recUmbralUI(){
  let alerta=[];
  REC.lineas.forEach(l=>{
    const pct=l.qrec?Math.round(l.qfall/l.qrec*1000)/10:0;
    const esAvio=AVIOS.includes(l.cod);
    if(esAvio && l.qfall>0)alerta.push({nom:l.nom,pct:pct,bajo:pct<10});
  });
  const box=document.getElementById('rec-umbral');
  if(!alerta.length){box.style.display="none";return}
  const hayBajo=alerta.some(a=>a.bajo);
  box.style.display="block";
  box.style.borderLeft="4px solid "+(hayBajo?"var(--pendiente)":"var(--cancelada)");
  box.innerHTML='<b style="font-size:12.5px">Avíos · umbral de reclamo 10% (se evalúa por línea)</b>'+
   alerta.map(a=>'<p style="margin-top:6px;font-size:13px">'+a.nom+': <b style="color:'+(a.bajo?"var(--pendiente)":"var(--cancelada)")+'">'+a.pct+'%</b> — '+(a.bajo?"por debajo del 10%: queda como merma identificada del proceso, no se reclama":"igual o por encima del 10%: corresponde reclamar")+'</p>').join('')+
   '<p class="hint" style="margin-top:5px">El umbral aplica solo a avíos. Las líneas por debajo del umbral deben retirarse del reclamo.</p>';
}
function loadRec(k){
  RECkey=k; REC=RECS[k];
  document.getElementById('rec-titulo').textContent="RECLAMO: "+REC.id;
  document.getElementById('rec-id').value=REC.id;
  document.getElementById('rec-oc').value=REC.oc;
  document.getElementById('rec-prov').value=REC.prov;
  document.getElementById('rec-freg').value="2026-07-19";
  document.getElementById('rec-obs').value=REC.obs;
  document.getElementById('rec-result').value=REC.result;
  document.getElementById('rec-obsres').value=REC.obsres;
  document.getElementById('rec-salida').value=REC.salida||"";
  renderRecItems(); renderRecForm(); go('co11f');
}
function renderRecForm(){
  const nuevo=(RECkey===""), cerrado=(REC.est==="Resuelto");
  const b=document.getElementById('rec-badge'); b.textContent=REC.est; b.style.background=REC_EST[REC.est];
  const show=(id,v)=>document.getElementById(id).style.display=v?"inline-block":"none";
  show('rec-b-guardar',nuevo); show('rec-b-cancelar',nuevo); show('rec-b-volver',!nuevo);
  ['rec-freg','rec-obs'].forEach(id=>document.getElementById(id).disabled=(!nuevo));
  document.getElementById('rec-b-oc').style.display=nuevo?"inline-block":"none";
  document.getElementById('rec-b-additem').style.display=nuevo?"inline-block":"none";
  document.getElementById('rec-paso2').style.display=nuevo?"none":"block";
  ['rec-result','rec-obsres'].forEach(id=>document.getElementById(id).disabled=cerrado);
  const p3=(!nuevo && REC.result==="Procedente");
  document.getElementById('rec-paso3').style.display=p3?"block":"none";
  document.getElementById('rec-salida').disabled=cerrado;
  renderRecItems();
  if(p3)recSalidaChange();
  document.getElementById('rec-docs').innerHTML=(REC.docs.length?REC.docs:["Sin documentos relacionados"]).map(d=>{
    d=d.replace(/NC-(\d{6})/,'<button class="btn-link" onclick="go(\'co12\')">NC-$1</button>');
    return '<div style="padding:6px 0;border-bottom:1px solid var(--borde)">'+d+'</div>';
  }).join('');
}
function guardarRec(){
  if(!REC.ock){toast("La OC vinculada es obligatoria: todo reclamo se sustenta en una compra");return}
  if(!REC.lineas.length){toast("Agregue al menos una línea con el artículo o servicio afectado");return}
  for(let i=0;i<REC.lineas.length;i++){
    const l=REC.lineas[i], n=i+1;
    if(!(l.qfall>0)){toast("Línea "+n+" ("+l.cod+"): indique la cantidad fallada");return}
    if(l.qfall>l.qrec){toast("Línea "+n+" ("+l.cod+"): lo fallado no puede superar lo recibido ("+fmtM(l.qrec)+" "+l.u+")");return}
    if(!l.motivo){toast("Línea "+n+" ("+l.cod+"): seleccione el motivo del maestro de fallas");return}
    if(AVIOS.includes(l.cod) && (l.qfall/l.qrec*100)<10){toast("Línea "+n+" ("+l.cod+"): avíos por debajo del umbral 10%, corresponde registrarlo como merma del proceso. Retire la línea del reclamo");return}
  }
  REC.obs=document.getElementById('rec-obs').value; REC.freg="19/07/2026";
  const k="r"+REC_SEQ; REC_SEQ++;
  REC.docs=REC.docs.length?REC.docs:["Reclamo registrado contra "+REC.oc+" · "+REC.lineas.length+" línea(s)"];
  RECS[k]=REC; RECS_ORDEN.unshift(k); RECkey=k;
  renderRecForm(); renderRec();
  toast(REC.id+" registrado con "+REC.lineas.length+" línea(s): gestione con el proveedor y registre el resultado");
}
function recResultChange(){
  if(REC.est==="Resuelto")return;
  REC.result=document.getElementById('rec-result').value;
  REC.obsres=document.getElementById('rec-obsres').value;
  const p3=document.getElementById('rec-paso3');
  if(REC.result==="No procedente"){
    p3.style.display="block";
    REC.salida="Sin acción";
    document.getElementById('rec-salida').parentElement.style.display="none";
    document.getElementById('rec-nc-wrap').style.display="none";
    document.getElementById('rec-b-crear').style.display="none";
    document.getElementById('rec-b-cerrar').style.display="inline-block";
    const nota=document.getElementById('rec-salida-nota');
    nota.style.display="block";
    nota.innerHTML='<b style="font-size:12.5px">Sin salida</b><p class="hint" style="margin-top:5px">Reclamo No procedente: se cierra directamente, sin devolución, reposición ni nota de crédito. Si el proveedor aceptara solo parte de los artículos, se registran reclamos separados.</p>';
  }else{
    document.getElementById('rec-salida').parentElement.style.display="block";
    renderRecForm();
  }
}
function recSalidaChange(){
  const sel=document.getElementById('rec-salida').value;
  REC.salida=sel;
  const nota=document.getElementById('rec-salida-nota'), menu=document.getElementById('rec-crear-menu');
  document.getElementById('rec-nc-wrap').style.display=(sel==="Nota de Crédito")?"block":"none";
  const show=(id,v)=>document.getElementById(id).style.display=v?"inline-block":"none";
  if(!sel){nota.style.display="none";show('rec-b-crear',false);show('rec-b-cerrar',false);return}
  nota.style.display="block";
  const nl=REC.lineas.length, det=REC.lineas.map(l=>fmtM(l.qfall)+' '+l.u+' de '+l.cod).join(' · ');
  if(sel==="Devolución"){
    nota.innerHTML='<b style="font-size:12.5px">Devolución a Proveedores</b><p class="hint" style="margin-top:5px">Genera UNA salida GI-10 de tipo "Devoluciones a proveedores" con las '+nl+' línea(s) del reclamo, vinculada al reclamo, al ingreso y a la OC. Regla: una devolución a proveedor solo puede nacer de un reclamo procedente.</p>';
    menu.innerHTML='<div class="op" onclick="crearDevolucionRec()">Devolución de Compra<small>GI-10 precargado: '+det+'</small></div>';
    show('rec-b-crear',REC.est!=="Resuelto"); show('rec-b-cerrar',false);
  }else if(sel==="Reposición"){
    nota.innerHTML='<b style="font-size:12.5px">Reposición</b><p class="hint" style="margin-top:5px">El proveedor repone las '+nl+' línea(s) observadas: la llegada se recepciona como ingreso en GI-09 con su guía, referenciando este reclamo. No genera nota de crédito.</p>';
    show('rec-b-crear',false); show('rec-b-cerrar',REC.est!=="Resuelto");
  }else if(sel==="Nota de Crédito"){
    nota.innerHTML='<b style="font-size:12.5px">Nota de Crédito</b><p class="hint" style="margin-top:5px">Una sola NC por el monto acordado para todo el reclamo ('+nl+' línea(s)). Quedará Pendiente hasta aplicarse en una factura (Tesorería la consulta antes de pagar).</p>';
    menu.innerHTML='<div class="op" onclick="crearNCdesdeRec()">Nota de Crédito<small>CO-12 con el proveedor, la OC y este reclamo como origen</small></div>';
    show('rec-b-crear',REC.est!=="Resuelto"); show('rec-b-cerrar',false);
  }
}
function crearDevolucionRec(){
  document.getElementById('rec-crear-menu').classList.remove('open');
  devolucionCtx={rec:RECkey};
  toast("Reclamos usa datos de ejemplo: registre la devolución real en Salidas (GI-10) con el tipo de devolución a proveedor");
  if(document.getElementById('scr-gi10'))go('gi10');
}
function crearNCdesdeRec(){
  document.getElementById('rec-crear-menu').classList.remove('open');
  const monto=parseFloat(document.getElementById('rec-ncmonto').value)||0;
  if(!(monto>0)){toast("Indique el monto de la Nota de Crédito");return}
  const o=REC_OCS[REC.ock];
  const id="NC-0000"+NC_SEQ; NC_SEQ++;
  NCS.unshift({id:id,prov:REC.prov,ock:REC.ock,oc:REC.oc,rec:REC.id,reck:RECkey,monto:monto,mon:o?o.mon:"S/.",
   est:"Pendiente",freg:"19/07/2026",fapl:"",fac:""});
  REC.docs.unshift("Nota de Crédito generada: "+id+" por "+(o&&o.mon==="USD"?"USD ":"S/. ")+fmtM(monto)+" por las "+REC.lineas.length+" línea(s) (pendiente de aplicar)");
  cerrarRec(true);
  renderNC();
  toast(id+" registrada y "+REC.id+" resuelto: una sola NC para todo el reclamo");
}
function cerrarRec(silencio){
  REC.est="Resuelto"; REC.fcierre="19/07/2026";
  if(!REC.salida)REC.salida="Sin acción";
  REC.obsres=document.getElementById('rec-obsres').value;
  renderRecForm(); renderRec();
  if(!silencio)toast(REC.id+" resuelto · salida: "+REC.salida);
}
