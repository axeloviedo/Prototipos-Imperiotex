/* COMPRAS · CO-11 Reclamos sobre la base compartida (Docs.rec, COMPARTIDO/bd/compras.js).
   El reclamo registra qué falló y cómo se resolvió; lo contable son los documentos que genera:
   Reposición (SAL-DEVPROV + ING-CAMBIO) · Devolución (SAL-DEVPROV + nota de crédito 07) · Nota de crédito sin devolución (05 / 09).
   El faltante de una orden tercerizada (N6) se reclama desde aquí y se cierra con su nota de crédito. */
/* ===== CO-11 · Reclamos ===== */
const REC_EST={"Nuevo":"var(--borrador)","Registrado":"var(--reclamo-reg)","En proceso":"var(--pendiente)","Resuelto":"var(--confirmado)","Anulado":"var(--cancelada)"};
let REC=null; /* borrador de un reclamo nuevo {oc, of, prov, obs, lineas:[{art, cant, motivo, max}]} o null si se ve uno registrado */
let RECid='';
function recFaltantes(){ return BD.d.ofs.filter(o=>o.faltante&&o.faltante.estado==='Abierto'&&!(BD.d.recs||[]).some(r=>r.of===o.id&&r.estado!=='Anulado')); }
function renderRec(){
  const tb=document.getElementById('rec-body'); if(!tb)return;
  const falt=recFaltantes(), bx=document.getElementById('rec-faltantes');
  if(falt.length){
    bx.style.display='block';
    bx.innerHTML='<b style="font-size:12.5px">Faltantes de servicios tercerizados sin reclamo</b>'+falt.map(o=>'<div style="display:flex;align-items:center;gap:10px;margin-top:6px"><span>'+o.id+' · '+coEsc(BD.nomArt(o.art))+' · <b>'+o.faltante.cant+' '+BD.u(o.art)+'</b> que no retornaron de '+coEsc(BD.provNom(o.faltante.prov))+'</span><button class="btn btn-primary btn-sm" onclick="nuevoRecFaltante(\''+o.id+'\')">Reclamar</button></div>').join('');
  }else bx.style.display='none';
  const q=sinTildes(document.getElementById('f-rec-q').value||''), e=document.getElementById('f-rec-e').value;
  const lista=(BD.d.recs||[]).filter(r=>(!e||r.estado===e)&&(!q||sinTildes(r.id+' '+BD.provNom(r.prov)+' '+r.oc+' '+r.of).includes(q)));
  tb.innerHTML=lista.map(r=>'<tr class="clickable" onclick="abrirRec(\''+r.id+'\')"><td>'+r.id+'</td><td>'+r.fecha.slice(0,10)+'</td><td>'+coEsc(BD.provNom(r.prov))+'</td>'+
    '<td>'+r.oc+(r.of?'<br><span class="hint">'+r.of+'</span>':'')+'</td>'+
    '<td>'+r.lineas.map(l=>coEsc(BD.nomArt(l.art))+' × '+fmtQ2(l.cant)).join('<br>')+'</td>'+
    '<td>'+(r.lineas.map(l=>l.resol||'<span class="hint">por decidir</span>').join('<br>'))+'</td>'+
    '<td><span class="badge" style="background:'+(REC_EST[r.estado]||'var(--borrador)')+'">'+r.estado+'</span></td><td><button class="btn-link">Abrir</button></td></tr>').join('')||
    '<tr><td colspan="8" style="text-align:center;color:var(--texto-sec);padding:16px">Sin reclamos</td></tr>';
  document.getElementById('rec-count').textContent=lista.length+' reclamo(s)';
}
function nuevoRec(){ REC={oc:'',of:'',prov:'',obs:'',lineas:[]}; RECid=''; go('co11f'); renderRecForm(); }
function nuevoRecFaltante(ofId){
  const of=BD.of(ofId), o=BD.d.ocs.find(x=>x.of===ofId&&x.est!=='Cancelada');
  if(!of||!o){toast('La orden '+ofId+' no tiene OC de servicio para reclamar');return}
  const srv=o.items.find(i=>BD.esServicio(i.art));
  REC={oc:o.id,of:of.id,prov:of.faltante.prov||o.prov,obs:'Prendas que no retornaron del servicio ('+of.id+')',lineas:srv?[{art:srv.art,cant:of.faltante.cant,motivo:'Prendas que no retornaron del servicio',max:of.faltante.cant}]:[]};
  RECid=''; go('co11f'); renderRecForm();
}
function abrirRec(id){ const r=BD.reclamo(id); if(!r){toast('No existe el reclamo '+id);return} REC=null; RECid=id; go('co11f'); renderRecForm(); }
function renderRecForm(){
  const r=RECid?BD.reclamo(RECid):null, nuevo=!r, d=r||REC; if(!d)return;
  document.getElementById('rec-titulo').textContent=nuevo?'REGISTRAR RECLAMO':'RECLAMO: '+r.id;
  const b=document.getElementById('rec-badge'), est=nuevo?'Nuevo':r.estado; b.textContent=est; b.style.background=REC_EST[est]||'var(--borrador)';
  document.getElementById('rec-id').value=nuevo?'(se asigna al registrar)':r.id;
  document.getElementById('rec-oc').value=d.oc||'';
  document.getElementById('rec-prov').value=d.prov?BD.provNom(d.prov):'';
  document.getElementById('rec-of').value=d.of||'-';
  document.getElementById('rec-obs').value=d.obs||''; document.getElementById('rec-obs').disabled=!nuevo;
  const show=(id,v)=>{document.getElementById(id).style.display=v?'inline-block':'none'};
  show('rec-b-guardar',nuevo); show('rec-b-oc',nuevo&&!d.of); show('rec-b-additem',nuevo&&!!d.oc&&!d.of); show('rec-b-anular',!nuevo&&r.estado==='Registrado');
  if(nuevo){
    document.getElementById('rec-head').innerHTML='<tr><th>Código</th><th>Artículo / servicio</th><th>Unidad</th><th style="width:110px;text-align:right">Cantidad</th><th style="width:170px">Lote (opcional)</th><th style="width:260px">Motivo</th><th style="width:40px"></th></tr>';
    document.getElementById('rec-items').innerHTML=d.lineas.map((l,i)=>{const av=Docs.rec.avisoUmbral(d.oc,l.art,l.cant);
      return '<tr'+(av?' style="background:#FFFBEB"':'')+'><td>'+l.art+'</td><td>'+coEsc(BD.nomArt(l.art))+(av?'<br><span class="hint" style="color:var(--pendiente)">⚠ '+coEsc(av)+'</span>':'')+'</td><td>'+BD.u(l.art)+'</td>'+
      '<td><input value="'+l.cant+'" style="text-align:right" onchange="REC.lineas['+i+'].cant=Math.min('+l.max+',Math.max(0,parseFloat(this.value)||0));renderRecForm()"><span class="hint">máx. '+fmtQ2(l.max)+'</span></td>'+
      '<td>'+recLoteSel(l,i)+'</td>'+
      '<td><select onchange="REC.lineas['+i+'].motivo=this.value"><option value="">Seleccionar…</option>'+Docs.rec.MOTIVOS.map(m=>'<option'+(l.motivo===m?' selected':'')+'>'+m+'</option>').join('')+'</select></td>'+
      '<td>'+(d.of?'':'<button class="btn-link" onclick="REC.lineas.splice('+i+',1);renderRecForm()">✕</button>')+'</td></tr>';}).join('')||
      '<tr><td colspan="7" style="text-align:center;color:var(--texto-sec);padding:12px">'+(d.oc?'Agregue lo que se reclama':'Primero vincule la OC')+'</td></tr>';
    document.getElementById('rec-hist').innerHTML='';
    return;
  }
  /* reclamo registrado: resolución por línea */
  document.getElementById('rec-head').innerHTML='<tr><th>Artículo / servicio</th><th style="text-align:right">Cantidad</th><th>Motivo</th><th style="width:300px">Resolución</th><th>Documentos</th><th>Estado</th></tr>';
  const abierto=r.estado==='Registrado'||r.estado==='En proceso';
  document.getElementById('rec-items').innerHTML=r.lineas.map((l,i)=>{
    const srv=BD.esServicio(l.art);
    let res;
    if(!l.resol&&abierto){
      const ops=srv?['Nota de crédito','No procedente']:Docs.rec.RESOLUCIONES;
      res='<div style="display:flex;gap:6px;flex-wrap:wrap"><select id="rec-res-'+i+'">'+ops.map(o=>'<option>'+o+'</option>').join('')+'</select>'+
        '<button class="btn btn-primary btn-sm" onclick="resolverRec('+i+')">Aplicar</button></div>'+
        (srv?'':'<span class="hint">Reposición y devolución sacan el producto del almacén donde está</span>');
    }else if(l.estado==='Espera reposición'){
      res=l.resol+'<br><button class="btn btn-primary btn-sm" onclick="reponerRec('+i+')">Registrar reposición</button>';
    }else if(l.estado==='Espera nota de crédito'){
      res=l.resol+'<br><button class="btn btn-primary btn-sm" onclick="nuevaNC({rec:\''+r.id+'\',recLinea:'+i+'})">Registrar nota de crédito</button>';
    }else res=(l.resol||'<span class="hint">—</span>')+(l.obsRes?'<br><span class="hint">'+coEsc(l.obsRes)+'</span>':'');
    return '<tr><td><b>'+l.art+'</b><br><span class="hint">'+coEsc(BD.nomArt(l.art))+(l.lote?' · lote '+coEsc(l.lote):'')+'</span></td><td style="text-align:right">'+fmtQ2(l.cant)+' '+BD.u(l.art)+(l.alm?'<br><span class="hint">'+l.alm+'</span>':'')+'</td>'+
      '<td>'+coEsc(l.motivo)+'</td><td>'+res+'</td><td>'+l.docs.map(recDocLink).join('<br>')+'</td><td>'+coEsc(l.estado)+'</td></tr>';
  }).join('');
  document.getElementById('rec-hist').innerHTML=(r.hist||[]).slice().reverse().map(h=>'<tr><td style="width:130px">'+h.f+'</td><td style="width:180px">'+coEsc(h.u)+'</td><td>'+coEsc(h.a)+'</td><td class="hint">'+coEsc(h.d)+'</td></tr>').join('');
}
function recDocLink(id){
  if(/^NC-/.test(id))return '<button class="btn-link" onclick="abrirNC(\''+id+'\')">'+id+'</button>';
  return '<span title="Movimiento de inventario (Inventarios GI-07)">'+id+'</span>';
}
function abrirRecOC(){
  const lista=BD.d.ocs.filter(o=>!['Borrador','Pendiente de Validar','Cancelada'].includes(o.est)&&o.items.some(i=>i.recq>0));
  document.getElementById('co11a-body').innerHTML=lista.map(o=>'<tr><td>'+o.id+'</td><td>'+coEsc(BD.provNom(o.prov))+'</td><td>'+o.fecha+'</td><td>'+o.est+'</td>'+
    '<td><button class="btn btn-primary btn-sm" onclick="recElegirOC(\''+o.id+'\')">Vincular</button></td></tr>').join('')||'<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:16px">No hay OC con recepciones</td></tr>';
  openModal('m-co11a');
}
function recElegirOC(id){ const o=BD.oc(id); REC.oc=id; REC.prov=o.prov; REC.lineas=[]; closeModal('m-co11a'); renderRecForm(); }
function abrirRecItem(){
  const o=BD.oc(REC.oc); if(!o)return;
  const lista=o.items.map(i=>({art:i.art,max:Docs.rec.reclamable(o.id,i.art)})).filter(x=>x.max>0&&!REC.lineas.some(l=>l.art===x.art));
  document.getElementById('co11b-body').innerHTML=lista.map(x=>'<tr><td>'+x.art+'</td><td>'+coEsc(BD.nomArt(x.art))+'</td><td>'+BD.u(x.art)+'</td><td style="text-align:right">'+fmtQ2(x.max)+'</td>'+
    '<td><button class="btn btn-primary btn-sm" onclick="REC.lineas.push({art:\''+x.art+'\',cant:'+x.max+',motivo:\'\',max:'+x.max+'});closeModal(\'m-co11b\');renderRecForm()">Agregar</button></td></tr>').join('')||
    '<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:16px">Todo lo recibido de esta OC ya está reclamado</td></tr>';
  openModal('m-co11b');
}
function guardarRec(){
  if(!REC)return;
  REC.obs=document.getElementById('rec-obs').value;
  const r=coTry(()=>Docs.rec.crear({oc:REC.oc,of:REC.of,obs:REC.obs,lineas:REC.lineas}));
  if(!r)return;
  toast('Reclamo '+r.id+' registrado: elija la resolución de cada línea');
  abrirRec(r.id); renderRec();
}
/* lote opcional de la línea: solo artículos con control de lote (N7) */
function recLoteSel(l,i){
  if(!Stock.conLote(l.art))return '<span class="hint">no aplica</span>';
  const lotes=Stock.lotes(l.art);
  return '<select onchange="REC.lineas['+i+'].lote=this.value"><option value="">(sin indicar)</option>'+lotes.map(x=>'<option'+(l.lote===x.id?' selected':'')+'>'+x.id+'</option>').join('')+'</select>';
}
function resolverRec(i){
  const resol=document.getElementById('rec-res-'+i).value;
  if(resol==='No procedente'){
    coPedirMotivo('No procedente','El proveedor no acepta el reclamo de esta línea: se cierra sin documentos.',obs=>{
      const r=coTry(()=>Docs.rec.resolver(RECid,i,{resol,obs})); if(!r)return;
      toast('Línea cerrada como No procedente'); renderRecForm(); renderRec();
    },'Cerrar como no procedente');
    return;
  }
  const r=coTry(()=>Docs.rec.resolver(RECid,i,{resol}));
  if(!r)return;
  const l=r.lineas[i];
  toast(resol+(l.docs.length?': '+l.docs.join(', '):'')+(l.estado==='Espera nota de crédito'?' · falta registrar la nota de crédito del proveedor':' · falta registrar la reposición cuando llegue'));
  renderRecForm(); renderRec();
}
function reponerRec(i){
  const m=coTry(()=>Docs.rec.reponer(RECid,i,{}));
  if(!m)return;
  toast('Reposición registrada: '+m.id); renderRecForm(); renderRec();
}
function anularRec(){
  coPedirMotivo('Anular '+RECid,'Solo se anula un reclamo sin resoluciones.',motivo=>{
    const r=coTry(()=>Docs.rec.anular(RECid,motivo)); if(!r)return;
    toast(r.id+' anulado'); renderRecForm(); renderRec();
  });
}
RENDER.co11=renderRec;
RENDER.co11f=renderRecForm;
