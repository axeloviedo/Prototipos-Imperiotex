/* INVENTARIOS · GI-11 Solicitud de Transferencia en dos pasos sobre BD.d.trfs (Docs.trf, decisiones T1/T7):
   crear (Borrador) → aprobar (compromete en origen y suma Pedido en destino) → recibir total o parcial (Stock.transferencia) → Recibida · cancelar pendientes. */
const TRF={id:"",lineas:[]};
const trfs=()=>BD.d.trfs||[];
const stDoc=id=>trfs().find(x=>x.id===id);
/* cantidad recibida de una línea (tolerante al nombre del campo) */
const recLinea=l=>Number(l.rec!=null?l.rec:l.recibido!=null?l.recibido:l.recq)||0;
function resetTRF(){
  TRF.id=""; TRF.lineas=[];
  go('gi11');
}
function abrirST(id){
  const s=stDoc(id); if(!s){toast("No existe la transferencia "+id);return}
  /* vista compartida de Comercial: la misma ST se ve y se recibe en su pantalla CL-47 (Recepción de mercadería) */
  if(VISTA_CM&&window.parent!==window){window.parent.postMessage({tipo:"gp-abrir-st",id:s.id},"*");return}
  TRF.id=s.id; TRF.lineas=s.lineas.map(l=>({art:l.art,cant:l.cant}));
  go('gi11');
}
function cargarCabeceraST(){
  const s=TRF.id?stDoc(TRF.id):null;
  document.getElementById('trf-id').value=s?s.id:'(se asigna al guardar)';
  document.getElementById('trf-user').value=s?(((s.hist||[])[0]||{}).u||''):BD.usuario;
  document.getElementById('trf-fecha').value=s?(s.fecha||''):BD.ahora();
  document.getElementById('trf-tipo').innerHTML=opcionesTipoMov('TRF',s?s.tipoMov:'','Seleccionar…');
  document.getElementById('trf-origen').innerHTML=opcionesAlm(s?s.origen:'');
  document.getElementById('trf-destino').innerHTML=opcionesAlm(s?s.destino:'');
  document.getElementById('trf-obs').value=s?(s.obs||''):'';
  bloquearMismoAlm();
}
/* el tipo de transferencia lo elige el usuario (L3); origen y destino no pueden ser el mismo almacén */
function bloquearMismoAlm(){
  const o=document.getElementById('trf-origen'), d=document.getElementById('trf-destino');
  [...d.options].forEach(x=>x.disabled=!!x.value&&x.value===o.value);
  [...o.options].forEach(x=>x.disabled=!!x.value&&x.value===d.value);
}
function renderTRF(){
  const s=TRF.id?stDoc(TRF.id):null, e=s?s.estado:'Nuevo', ed=!s;
  document.getElementById('trf-titulo').textContent='SOLICITUD DE TRANSFERENCIA'+(s?' · '+s.id:'');
  const b=document.getElementById('trf-badge'); b.textContent=e; b.style.background=COLOR_EST[e]||'var(--borrador)';
  ['trf-tipo','trf-origen','trf-destino','trf-obs'].forEach(id=>document.getElementById(id).disabled=!ed);
  const show=(id,v)=>document.getElementById(id).style.display=v?'inline-block':'none';
  const pend=s&&s.lineas.some(l=>recLinea(l)<l.cant);
  show('trf-b-guardar',ed); show('trf-b-add',ed);
  show('trf-b-aprobar',ed||e==='Borrador');
  show('trf-b-cancelar',s&&e==='Borrador');
  show('trf-b-recibir',s&&(e==='Aprobada'||e==='Parcial')&&pend);
  show('trf-b-cancelpend',s&&(e==='Aprobada'||e==='Parcial')&&pend);
  if(ed){
    tablaLineas(TRF,{thead:'trf-head',tbody:'trf-items',tfoot:'trf-foot',alm:document.getElementById('trf-origen').value,disp:true,dispLbl:'Disponible en origen',avisar:true,estVar:'TRF',render:'renderTRF'});
  }else{
    document.getElementById('trf-head').innerHTML='<tr><th style="width:36px">#</th><th>Código</th><th>Nombre</th><th>UM</th><th style="text-align:right">Cant. enviada</th><th style="text-align:right">Cant. recibida</th><th style="text-align:right">Pendiente</th></tr>';
    document.getElementById('trf-items').innerHTML=s.lineas.map((l,i)=>{const r=recLinea(l), p=BD.r4(l.cant-r);
      return '<tr><td>'+(i+1)+'</td><td>'+l.art+'</td><td>'+Fmt.e(BD.nomArt(l.art))+'</td><td>'+BD.u(l.art)+'</td><td style="text-align:right">'+Fmt.n(l.cant)+'</td><td style="text-align:right">'+Fmt.n(r)+'</td><td style="text-align:right;'+(p>0&&e!=='Cancelada'?'color:var(--pendiente);font-weight:600':'')+'">'+Fmt.n(p)+'</td></tr>'}).join('');
    document.getElementById('trf-foot').innerHTML='';
  }
  const movs=s?BD.d.movs.filter(m=>m.doc===s.id||m.ndoc===s.id):[];
  const av=document.getElementById('trf-aviso'), vinc=s?[s.sol?'Atiende '+docLink(s.sol):'',s.of?'Orden '+docLink(s.of):''].filter(Boolean):[];
  if(s&&(movs.length||vinc.length)){av.style.display='block';av.innerHTML='<b style="font-size:12.5px">'+(movs.length?'Recepciones registradas: '+movs.map(m=>docLink(m.id)).join(', '):'Documento vinculado')+'</b>'+(vinc.length?'<p class="hint" style="margin-top:4px">'+vinc.join(' · ')+'</p>':'');}
  else av.style.display='none';
  const COL={ok:"var(--texto-sec)",pend:"var(--pendiente)",no:"var(--rechazado-sol)"};
  document.getElementById('trf-hist').innerHTML=s&&(s.hist||[]).length?s.hist.slice().reverse().map(h=>'<div class="hline"><b style="font-size:12.5px">'+Fmt.e(h.a)+'</b><br><span class="hint" style="color:'+(COL[h.e]||COL.ok)+'">'+h.f+' · '+Fmt.e(h.u)+(h.d?' — '+Fmt.e(h.d):'')+'</span></div>').join(''):hint('Se registra al guardar.');
}
RENDER.gi11=()=>{cargarCabeceraST();renderTRF()};
BUSCADOR_CTX.trf={etiqueta:"el almacén origen",soloInv:true,requiereAlm:true,avisaSinStock:true,alm:()=>document.getElementById('trf-origen').value,
  agregar:cod=>{if(agregarLinea(TRF,cod))renderTRF(); if(Stock.disp(document.getElementById('trf-origen').value,cod)<=0)toast("Advertencia: sin stock disponible en el origen")}};
function docsTrf(){if(typeof Docs==='undefined'||!Docs.trf){toast("La Solicitud de Transferencia (Docs.trf) aún no está disponible en la base");return null}return Docs.trf}
function guardarST(aprobar){
  const D=docsTrf(); if(!D)return;
  let s=TRF.id?stDoc(TRF.id):null;
  if(!s){
    const o=document.getElementById('trf-origen').value, d=document.getElementById('trf-destino').value;
    if(!o||!d){toast("Seleccione el almacén origen y el destino");return}
    if(o===d){toast("El almacén origen y el destino no pueden ser el mismo");return}
    if(!lineasValidas(TRF))return;
    if(!document.getElementById('trf-tipo').value){toast("Elija el tipo de transferencia");return}
    s=intentar(()=>D.crear({origen:o,destino:d,tipoMov:document.getElementById('trf-tipo').value,obs:document.getElementById('trf-obs').value.trim(),lineas:TRF.lineas.map(l=>({art:l.art,cant:l.cant}))}));
    if(!s)return;
  }
  if(aprobar){const r=intentar(()=>D.aprobar(s.id)); if(!r){abrirST(s.id);return}}
  toast(s.id+(aprobar?" aprobada: comprometido en "+s.origen+" y pedido en "+s.destino:" guardada como Borrador"));
  abrirST(s.id);
}
function cancelarST(){
  const D=docsTrf(); if(!D)return;
  if(!confirm("¿Cancelar la transferencia "+TRF.id+"?"))return;
  const r=intentar(()=>D.cancelar(TRF.id)); if(!r)return;
  toast(TRF.id+" cancelada"); abrirST(TRF.id);
}
function abrirRecepcion(){
  const s=stDoc(TRF.id); if(!s)return;
  document.getElementById('rec-items').innerHTML=s.lineas.map((l,i)=>{const p=BD.r4(l.cant-recLinea(l)); if(p<=0)return '';
    return '<tr><td>'+l.art+'</td><td>'+Fmt.e(BD.nomArt(l.art))+'</td><td style="text-align:right">'+Fmt.n(p)+'</td><td><input id="rec-'+i+'" value="'+p+'" style="text-align:right;width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px"></td></tr>'}).join('');
  openModal('m-gi11a');
}
function confirmarRecepcion(){
  const D=docsTrf(); if(!D)return;
  const s=stDoc(TRF.id);
  const lineas=s.lineas.map((l,i)=>{const x=document.getElementById('rec-'+i);return x?{art:l.art,cant:parseFloat(x.value)||0}:null}).filter(l=>l&&l.cant>0);
  if(!lineas.length){toast("Indique al menos una cantidad recibida");return}
  const r=intentar(()=>D.recibir(TRF.id,lineas)); if(!r)return;
  closeModal('m-gi11a');
  const s2=stDoc(TRF.id);
  toast("Recepción confirmada: "+s2.id+" queda "+s2.estado);
  abrirST(TRF.id);
}
function cancelarPendientes(){
  const D=docsTrf(); if(!D)return;
  const r=intentar(()=>D.cancelar(TRF.id)); closeModal('m-gi11b'); if(!r)return;
  toast("Pendientes cancelados: comprometido y pedido liberados"); abrirST(TRF.id);
}
/* listado en GI-24 Transferencias (antes era un bloque dentro de GI-07 Movimientos) */
function renderST(){
  const tb=document.getElementById('st-body'); if(!tb)return;
  const e=document.getElementById('f-st-e').value, q=Fmt.s(document.getElementById('f-st-q').value);
  const lista=trfs().filter(s=>(!e||s.estado===e)&&(!q||Fmt.s([s.id,s.origen,s.destino,s.tipoMov,s.sol,s.of].join(' ')).includes(q)));
  const cnt=document.getElementById('st-count'); if(cnt)cnt.textContent=lista.length+" de "+trfs().length+" solicitudes";
  tb.innerHTML=lista.map(s=>{
    const movs=BD.d.movs.filter(m=>m.doc===s.id||m.ndoc===s.id);
    return '<tr class="clickable" onclick="abrirST(\''+s.id+'\')"><td>'+s.id+'</td><td>'+(s.fecha||'')+'</td><td>'+(s.tipoMov||'')+'</td><td>'+s.origen+' → '+s.destino+'</td><td>'+s.lineas.length+'</td>'+
      '<td onclick="event.stopPropagation()">'+(docLink(s.sol||s.of))+'</td><td onclick="event.stopPropagation()">'+(movs.map(m=>docLink(m.id)).join(' ')||hint('-'))+'</td><td>'+badge(s.estado)+'</td></tr>';
  }).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--texto-sec);padding:12px">Sin solicitudes de transferencia</td></tr>';
}
RENDER.gi24=renderST;
