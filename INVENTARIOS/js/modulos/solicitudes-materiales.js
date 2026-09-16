/* INVENTARIOS · GI-13 Solicitudes de Materiales sobre BD.d.sols (Docs.sol).
   Logística aprueba definiendo el propósito por línea, transfiere por origen (Docs.sol.transferir) y crea la OC con el proveedor elegido (Docs.sol.crearOC → abrirOC). */
const SOLF={id:"",lineas:[],dec:[]};   /* borrador de la pantalla: líneas (Borrador) y decisiones de Logística (Pendiente) */
function areaUsuario(){return VISTA_CM?'Comercial':'Logística'}
function solResumenProp(s){
  const c={}; s.lineas.forEach(l=>{if(l.prop)c[l.prop]=(c[l.prop]||0)+1});
  return Object.keys(c).map(p=>c[p]+' '+p).join(' · ')||hint('Lo define Logística');
}
function renderSol(){
  const q=Fmt.s(document.getElementById('f-sol-q').value), e=document.getElementById('f-sol-e').value, ar=document.getElementById('f-sol-a').value;
  const lista=BD.d.sols.filter(s=>{
    if(e&&s.estado!==e)return false; if(ar&&s.area!==ar)return false;
    if(VISTA_CM&&s.area!=='Comercial')return false;
    if(q&&!Fmt.s([s.id,s.of,s.sf,s.ref,s.obs].concat(s.lineas.map(l=>l.art+' '+BD.nomArt(l.art))).join(' ')).includes(q))return false;
    return true;
  });
  document.getElementById('sol-body').innerHTML=lista.map(s=>{
    const docs=[...new Set(s.lineas.map(l=>l.doc).filter(Boolean))];
    const arts=s.lineas.slice(0,2).map(l=>l.art+' × '+Fmt.n(l.cant)).join('<br>')+(s.lineas.length>2?'<br>'+hint('y '+(s.lineas.length-2)+' más'):'');
    return '<tr class="clickable" onclick="abrirSOL(\''+s.id+'\')"><td>'+s.id+(s.of?'<br><span class="hint">'+s.of+'</span>':'')+(s.sf?'<br><span class="hint">'+s.sf+'</span>':'')+'</td><td>'+s.fecha+'</td><td>'+Fmt.e(s.area||'')+'<br><span class="hint">'+Fmt.e(s.solicita||'')+'</span></td>'+
      '<td>'+(s.destino||hint())+'</td><td>'+arts+'</td><td>'+solResumenProp(s)+'</td><td onclick="event.stopPropagation()">'+(docs.map(docLink).join('<br>')||hint('-'))+'</td><td>'+(s.fechaReq||hint('-'))+'</td><td>'+badge(s.estado)+'</td></tr>';
  }).join('')||'<tr><td colspan="9" style="text-align:center;color:var(--texto-sec);padding:18px">Sin solicitudes para los filtros elegidos</td></tr>';
  document.getElementById('sol-count').textContent=lista.length+" solicitudes";
}
RENDER.gi13=renderSol;

function nuevaSOL(){SOLF.id="";SOLF.lineas=[];SOLF.dec=[];cargarCabeceraSOL(null);go('gi13f')}
function abrirSOL(id){
  const s=BD.sol(id); if(!s){toast("No existe la solicitud "+id);return}
  SOLF.id=s.id; SOLF.lineas=s.lineas.map(l=>({art:l.art,cant:l.cant}));
  SOLF.dec=s.lineas.map(l=>({prop:l.prop||(BD.esServicio(l.art)?'Compra':''),origen:l.origen||''}));
  cargarCabeceraSOL(s); go('gi13f');
}
function loadSOL(k){ if(BD.sol(k))abrirSOL(k); else if(k==='nueva')nuevaSOL(); else go('gi13'); }   /* compatibilidad */
function cargarCabeceraSOL(s){
  document.getElementById('sol-id').value=s?s.id:'(se asigna al guardar)';
  document.getElementById('sol-user').value=s?(s.area+' · '+s.solicita):(areaUsuario()+' · '+BD.usuario);
  document.getElementById('sol-freq').value=s?Fmt.iso(s.fechaReq):'';
  document.getElementById('sol-alm').innerHTML=opcionesAlm(s?s.destino:'');
  document.getElementById('sol-obs').value=s?s.obs:'';
}
/* almacenes (distintos del destino) con disponible del artículo */
function solStockOtros(art,destino){
  return BD.d.stock.filter(r=>r.art===art&&r.alm!==destino&&(r.act-r.comp)>0).map(r=>({alm:r.alm,disp:BD.r4(r.act-r.comp)}));
}
function renderSOLform(){
  const s=SOLF.id?BD.sol(SOLF.id):null, e=s?s.estado:'Borrador', ed=e==='Borrador', dec=e==='Pendiente'&&!VISTA_CM;
  const log=!ed, destino=document.getElementById('sol-alm').value;
  document.getElementById('sol-titulo').textContent='SOLICITUD DE MATERIALES'+(s?' · '+s.id:' · NUEVA');
  const b=document.getElementById('sol-badge'); b.textContent=e; b.style.background=COLOR_EST[e];
  const st='width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 6px;font-size:12px';
  document.getElementById('sol-items-head').innerHTML='<tr><th style="width:34px">#</th><th style="width:100px">Código</th><th>Nombre</th><th style="width:56px">UM</th><th style="width:110px;text-align:right">Cantidad</th>'+
    (ed||dec?'<th style="width:170px">Stock en otros almacenes</th>':'')+(log?'<th style="width:140px">Propósito</th><th style="width:170px">Almacén origen</th><th style="width:120px">Estado de línea</th><th style="width:110px">Documento</th>':'')+'<th style="width:60px"></th></tr>';
  document.getElementById('sol-items').innerHTML=SOLF.lineas.map((l,i)=>{
    const srv=BD.esServicio(l.art), otros=srv?[]:solStockOtros(l.art,destino), L=s?s.lineas[i]:null, d=SOLF.dec[i]||{};
    const stock=srv?hint('Servicio: solo compra'):otros.length?otros.map(o=>o.alm+': <b>'+Fmt.n(o.disp)+'</b>').join('<br>'):hint('Sin stock');
    let cols='';
    if(log){
      const prop=dec?(srv?'Compra <span class="hint">(servicio)</span>':'<select style="'+st+'" onchange="SOLF.dec['+i+'].prop=this.value;if(this.value!==\'Transferencia\')SOLF.dec['+i+'].origen=\'\';renderSOLform()"><option value="">Seleccionar…</option>'+opcionesLista(Docs.sol.PROPOSITOS,d.prop,false)+'</select>'):(L.prop||hint('—'));
      const orig=(dec?d.prop:L.prop)!=='Transferencia'?hint('—'):dec?'<select style="'+st+'" onchange="SOLF.dec['+i+'].origen=this.value"><option value="">Seleccionar…</option>'+opcionesLista(otros.map(o=>({v:o.alm,t:o.alm+' ('+Fmt.n(o.disp)+')'})).concat(d.origen&&!otros.some(o=>o.alm===d.origen)?[{v:d.origen,t:d.origen}]:[]),d.origen,false)+'</select>':(L.origen||hint('—'));
      cols=(dec?'<td style="font-size:12px">'+stock+'</td>':'')+'<td>'+prop+'</td><td>'+orig+'</td><td>'+(L?badge(L.estado)+(L.recibido?'<br><span class="hint">recibido '+Fmt.n(L.recibido)+'</span>':''):'')+'</td><td>'+(L&&L.doc?docLink(L.doc):hint('—'))+'</td>';
    }else cols='<td style="font-size:12px">'+stock+'</td>';
    const qty=ed?'<td><input value="'+l.cant+'" style="text-align:right" onchange="SOLF.lineas['+i+'].cant=parseFloat(this.value)||0"></td>':'<td style="text-align:right">'+Fmt.n(l.cant)+'</td>';
    return '<tr><td>'+(i+1)+'</td><td>'+l.art+'</td><td>'+Fmt.e(BD.nomArt(l.art))+'</td><td>'+BD.u(l.art)+'</td>'+qty+cols+'<td>'+(ed?'<button class="btn-link" onclick="SOLF.lineas.splice('+i+',1);renderSOLform()">Quitar</button>':'')+'</td></tr>';
  }).join('')||'<tr><td colspan="11" style="text-align:center;color:var(--texto-sec);padding:18px">Sin artículos: use "+ Agregar artículo"</td></tr>';
  document.getElementById('sol-items-hint').innerHTML=dec?'Defina por línea el <b>propósito</b>: <b>Transferencia</b> (elija el almacén de origen con stock disponible) o <b>Compra</b>. Luego <b>Aprobar</b>; después use <b>Atender ▾</b> para transferir o crear la Orden de Compra.':
    log?'Estado de línea: Pendiente → Transferido (con su TRF) o En compra (con su OC) → Recibido.':'Tabla sin precio. El solicitante indica qué y a dónde; Logística define el propósito de cada línea al aprobar.';
  const show=(id,v)=>document.getElementById(id).style.display=v?"inline-block":"none";
  show('sol-b-guardar',ed); show('sol-b-enviar',ed); show('sol-b-add',ed);
  show('sol-b-anular',s&&(e==='Borrador'||e==='Pendiente'));
  show('sol-b-aprobar',dec); show('sol-b-rechazar',dec);
  const pend=s&&(e==='Aprobada'||e==='En proceso')&&s.lineas.some(l=>l.prop&&l.estado==='Pendiente');
  show('sol-b-crear',pend&&!VISTA_CM);
  ['sol-freq','sol-alm','sol-obs'].forEach(id=>document.getElementById(id).disabled=!ed);
  const vinc=s?[s.of?'Orden de fabricación '+docLink(s.of):'',s.sf?'Solicitud de Fabricación '+docLink(s.sf):'',s.ref?'N° Referencia '+Fmt.e(s.ref):''].filter(Boolean):[];
  document.getElementById('sol-vinc-fld').style.display=vinc.length?'flex':'none';
  document.getElementById('sol-vinc').innerHTML=vinc.join(' · ');
  const nota=document.getElementById('sol-nota');
  if(s&&s.nota){nota.style.display='block';nota.style.borderLeftColor=e==='Rechazada'?'var(--rechazado-sol)':'var(--aprobado-sol)';nota.innerHTML='<b style="font-size:12.5px">'+(e==='Rechazada'?'Solicitud rechazada':'Decisión de Logística')+'</b><p class="hint" style="margin-top:5px">'+Fmt.e(s.nota)+'</p>'}
  else nota.style.display='none';
  const COL={ok:"var(--texto-sec)",pend:"var(--pendiente)",no:"var(--rechazado-sol)"};
  document.getElementById('sol-hist').innerHTML=s&&s.hist.length?s.hist.slice().reverse().map(h=>'<div class="hline"><b style="font-size:12.5px">'+Fmt.e(h.a)+'</b><br><span class="hint" style="color:'+(COL[h.e]||COL.ok)+'">'+h.f+' · '+Fmt.e(h.u)+(h.d?' — '+Fmt.e(h.d):'')+'</span></div>').join(''):hint('Aún sin historial: se registra al guardar.');
}
RENDER.gi13f=renderSOLform;
BUSCADOR_CTX.sol={etiqueta:"el almacén destino",soloInv:false,alm:()=>document.getElementById('sol-alm').value,
  filtro:a=>a.inv!==false||a.grupo==='SRV',
  agregar:cod=>{if(agregarLinea(SOLF,cod))renderSOLform()}};

function datosSOL(){
  return {area:areaUsuario(),solicita:BD.usuario,destino:document.getElementById('sol-alm').value,fechaReq:Fmt.bd(document.getElementById('sol-freq').value),
    obs:document.getElementById('sol-obs').value.trim(),lineas:SOLF.lineas.map(l=>({art:l.art,cant:l.cant}))};
}
function guardarSOL(enviar){
  const d=datosSOL();
  if(!lineasValidas(SOLF))return;
  if(enviar&&!d.destino){toast("Indique el almacén destino");return}
  let s;
  if(!SOLF.id)s=intentar(()=>Docs.sol.crear(d,enviar));
  else s=intentar(()=>{Docs.sol.guardar(SOLF.id,d);return enviar?Docs.sol.enviar(SOLF.id):BD.sol(SOLF.id)});
  if(!s)return;
  toast(s.id+(enviar?" enviada a Logística: define el propósito de cada línea al aprobar":" guardada como Borrador"));
  abrirSOL(s.id);
}
function aprobarSOL(){
  const s=BD.sol(SOLF.id); if(!s)return;
  const r=intentar(()=>Docs.sol.aprobar(s.id,SOLF.dec.map((x,i)=>BD.esServicio(s.lineas[i].art)?{prop:'Compra'}:x)));
  if(!r)return;
  toast(r.id+" aprobada: "+r.nota+". Use «Atender» para transferir o crear la OC");
  abrirSOL(r.id);
}
function rechazarSOL(){
  const m=document.getElementById('sol-motivo-rechazo').value.trim();
  const r=intentar(()=>Docs.sol.rechazar(SOLF.id,m)); if(!r)return;
  closeModal('m-gi13a'); document.getElementById('sol-motivo-rechazo').value='';
  toast(r.id+" rechazada con motivo"); abrirSOL(r.id);
}
function anularSOL(){
  if(!confirm("¿Anular la solicitud "+SOLF.id+"?"))return;
  const r=intentar(()=>Docs.sol.anular(SOLF.id,'Anulada desde GI-13')); if(!r)return;
  toast(r.id+" anulada"); abrirSOL(r.id);
}
function crearMenuSOL(){
  const s=BD.sol(SOLF.id); if(!s)return;
  const pend=s.lineas.filter(l=>l.prop&&l.estado==='Pendiente');
  const nC=pend.filter(l=>l.prop==='Compra').length;
  const origenes=[...new Set(pend.filter(l=>l.prop==='Transferencia').map(l=>l.origen))];
  document.getElementById('sol-crear-menu').innerHTML=
    origenes.map(o=>'<div class="op" onclick="transferirSOL(\''+o+'\')">Transferir desde '+o+'<small>'+pend.filter(l=>l.prop==='Transferencia'&&l.origen===o).length+' línea(s) → '+s.destino+'</small></div>').join('')+
    (nC?'<div class="op" onclick="abrirOCdesdeSOL()">Crear Orden de Compra<small>'+nC+' línea(s) con propósito Compra</small></div>':'');
}
function transferirSOL(origen){
  document.getElementById('sol-crear-menu').classList.remove('open');
  const r=intentar(()=>Docs.sol.transferir(SOLF.id,origen)); if(!r)return;
  toast(/^ST-/.test(r.id)?"Solicitud de Transferencia "+r.id+" aprobada ("+origen+" → "+r.destino+"): confirme la recepción en GI-11":"Transferencia "+r.id+" registrada: "+origen+" → "+(r.destino||''));
  abrirSOL(SOLF.id);
}
function abrirOCdesdeSOL(){
  document.getElementById('sol-crear-menu').classList.remove('open');
  const s=BD.sol(SOLF.id), ls=s.lineas.filter(l=>l.prop==='Compra'&&l.estado==='Pendiente');
  /* proveedor sugerido: el por defecto del artículo o el del recurso de servicio */
  const sug=ls.map(l=>(BD.art(l.art)||{}).provDef||(BD.rec(l.art)||{}).prov||(M().proveedores.find(p=>p.servicio===l.art)||{}).cod).find(Boolean)||'';
  document.getElementById('sol-oc-prov').innerHTML='<option value="">Seleccionar…</option>'+opcionesLista(M().proveedores.filter(p=>p.estado!=='Inactivo').map(p=>({v:p.cod,t:p.cod+' · '+p.nom+(p.servicio?' (servicio '+p.servicio+')':'')})),sug,false);
  document.getElementById('sol-oc-items').innerHTML=ls.map((l,i)=>{
    const pu=(BD.rec(l.art)||{}).costo||(BD.art(l.art)||{}).precioCompra||0;
    return '<tr><td>'+l.art+'</td><td>'+Fmt.e(BD.nomArt(l.art))+'</td><td style="text-align:right">'+Fmt.q(l.cant,BD.u(l.art))+'</td><td><input class="sol-oc-pu" data-art="'+l.art+'" value="'+pu+'" style="text-align:right;width:100%"></td></tr>';
  }).join('');
  openModal('m-gi13b');
}
function confirmarOCdesdeSOL(){
  const prov=document.getElementById('sol-oc-prov').value;
  if(!prov){toast("Elija el proveedor");return}
  const precios={}; document.querySelectorAll('.sol-oc-pu').forEach(x=>precios[x.dataset.art]=parseFloat(x.value)||0);
  const oc=intentar(()=>Docs.sol.crearOC(SOLF.id,{prov,precios})); if(!oc)return;
  closeModal('m-gi13b');
  toast(oc.id+" creada en Borrador desde "+SOLF.id+" ("+oc.tipo+"): complétela en Compras");
  irOC(oc.id);
}
