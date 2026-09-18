/* INVENTARIOS · GI-23 decisiones sobre la Solicitud de Fabricación (Docs.sf: guardar, enviar, darVB, aprobar, rechazar, devolver)
   y Solicitudes de Materiales generadas para el déficit (Docs.sol.crear con sf). */
function datosSPF(){return {almDestino:SPF.almDestino,fechaReq:SPF.fechaReq,obs:SPF.obs,lineas:SPF.lineas.map(l=>({art:l.art,cant:l.cant,ldm:l.ldm}))}}
function validarSPF(){
  if(!SPF.fechaReq){toast("Indique la fecha requerida");return false}
  if(!SPF.lineas.length){toast("Agregue al menos un artículo al detalle");return false}
  const i=SPF.lineas.findIndex(l=>!(l.cant>0)); if(i>=0){toast("Línea "+(i+1)+": la cantidad debe ser mayor que cero");return false}
  return true;
}
/* guarda los cambios pendientes de la pantalla (si la solicitud es editable) */
function persistirSPF(){
  const s=SP_ACT(); if(!s||!Docs.sf.editable(s)||!SPF.sucio)return s;
  if(!validarSPF())return null;
  const r=intentar(()=>Docs.sf.guardar(s.id,datosSPF())); if(r)SPF.sucio=false;
  return r;
}
function guardarCambiosSP(){const r=persistirSPF(); if(r){toast(r.id+" guardada");abrirSF(r.id)}}
function enviarSPrev(){
  if(!validarSPF())return;
  const s=SP_ACT(); if(SPF.sucio&&!persistirSPF())return;
  const r=intentar(()=>Docs.sf.enviar(s.id)); if(!r)return;
  toast(r.id+" enviada a revisión: falta el V°B° de Logística y la aprobación de Gerencia");
  abrirSF(r.id);
}
function preVB(){
  if(SPF.sucio&&!persistirSPF())return;
  const f=reqMP().filter(m=>m.falta);
  if(f.length)toast("Aviso: "+f.length+" material(es) sin cobertura. Puede dar el V°B° igualmente");
  openModal('m-gi23a');
}
function tras(r,msg){
  if(!r)return;
  toast(msg(r)); abrirSF(r.id); if(typeof renderSP==='function')renderSP();
}
function darVB(){
  closeModal('m-gi23a');
  tras(intentar(()=>Docs.sf.darVB(SPF.id)),r=>r.est==='Aprobada'?"V°B° registrado: "+r.id+" queda Aprobada y compromete "+r.comprometido.length+" material(es)":"V°B° de Logística registrado: falta la aprobación de Gerencia");
}
function aprobarSP(){
  closeModal('m-gi23b');
  if(SPF.sucio&&!persistirSPF())return;
  tras(intentar(()=>Docs.sf.aprobar(SPF.id)),r=>r.est==='Aprobada'?"Aprobación registrada: "+r.id+" queda Aprobada y compromete "+r.comprometido.length+" material(es)":"Aprobación de Gerencia registrada: falta el V°B° de Logística");
}
function rechazarSP(){
  const m=document.getElementById('sp-motivo-rech').value.trim();
  if(!m){toast("El motivo del rechazo es obligatorio");return}
  const r=intentar(()=>Docs.sf.rechazar(SPF.id,m)); if(!r)return;
  closeModal('m-gi23c'); document.getElementById('sp-motivo-rech').value='';
  tras(r,x=>x.id+" rechazada: el motivo queda en el historial");
}
function devolverSP(){
  const c=document.getElementById('sp-coment-mod').value.trim();
  if(!c){toast("El comentario es obligatorio");return}
  const r=intentar(()=>Docs.sf.devolver(SPF.id,c)); if(!r)return;
  closeModal('m-gi23d'); document.getElementById('sp-coment-mod').value='';
  tras(r,x=>x.id+" devuelta a Borrador con el comentario registrado");
}
function reabrirSP(){enviarSPrev()}

/* ===== Solicitudes de Materiales del déficit: una por almacén destino ===== */
function generarSOLdesdeSP(){
  const s=SP_ACT(); if(!s)return;
  const sols=BD.d.sols.filter(x=>x.sf===s.id&&x.estado!=='Anulada'&&x.estado!=='Rechazada');
  const falt=reqMP().filter(m=>m.falta&&!sols.some(x=>x.lineas.some(l=>l.art===m.art)));
  if(!falt.length){toast("No hay materiales sin cobertura por solicitar");return}
  const porAlm={}; falt.forEach(m=>(porAlm[m.alm]=porAlm[m.alm]||[]).push(m));
  const creadas=[];
  for(const alm of Object.keys(porAlm)){
    const x=intentar(()=>Docs.sol.crear({area:'Logística',solicita:BD.usuario,destino:alm,sf:s.id,fechaReq:s.fechaReq||'',
      obs:'Déficit de materia prima de '+s.id+' ('+s.lineas.length+' artículo(s), '+Fmt.n(Docs.sf.total(s))+' prendas)',
      lineas:porAlm[alm].map(m=>({art:m.art,cant:BD.r4(-m.dif)}))},true));
    if(!x)break; creadas.push(x.id);
  }
  if(!creadas.length)return;
  toast(creadas.join(', ')+" generada(s) y enviada(s) a Logística (GI-13)");
  renderSPform();
}
function renderSCs(){
  const card=document.getElementById('sp-scs-card'), tb=document.getElementById('sp-scs');
  const sols=BD.d.sols.filter(x=>x.sf===SPF.id);
  card.style.display=sols.length?'block':'none';
  tb.innerHTML=sols.map(x=>'<tr><td>'+docLink(x.id)+'</td><td>'+x.lineas.map(l=>l.art+' × '+Fmt.n(l.cant)+' '+badge(l.estado)).join('<br>')+'</td><td>'+x.destino+'</td><td>'+badge(x.estado)+'</td>'+
    '<td>'+([...new Set(x.lineas.map(l=>l.doc).filter(Boolean))].map(docLink).join(', ')||hint('-'))+'</td></tr>').join('');
}
