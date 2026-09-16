/* INVENTARIOS · GI-09 Crear Ingreso: manual (Stock.ingreso) o desde una OC de bienes (Docs.oc.recibir).
   También define la tabla de líneas que comparten los formularios de movimiento (GI-09/10/11 y ajuste). */

/* ===== Tabla de líneas compartida =====
   est = {lineas:[{art, cant, costo, max?}]}; op = {tbody, thead, tfoot, alm (código para mostrar stock), costo:true|'ro'|false, disp:true, estVar:'nombre global'} */
function tablaLineas(est,op){
  const conCosto=!!op.costo, ro=op.costo==='ro';
  document.getElementById(op.thead).innerHTML='<tr><th style="width:36px">#</th><th style="width:100px">Código</th><th>Nombre</th><th style="width:60px">UM</th>'+
    (op.disp?'<th style="width:110px;text-align:right">'+(op.dispLbl||'Disponible')+'</th>':'')+(op.max?'<th style="width:100px;text-align:right">Pendiente</th>':'')+
    '<th style="width:120px;text-align:right">Cantidad</th>'+(conCosto?'<th style="width:120px;text-align:right">Costo unit. S/.</th><th style="width:110px;text-align:right">Valor S/.</th>':'')+'<th style="width:70px"></th></tr>';
  let tq=0, tv=0;
  document.getElementById(op.tbody).innerHTML=est.lineas.map((l,i)=>{
    const u=BD.u(l.art), d=op.alm?Stock.disp(op.alm,l.art):0, v=BD.r2((Number(l.cant)||0)*(Number(l.costo)||0));
    tq+=Number(l.cant)||0; tv+=v;
    const falta=op.disp&&op.avisar&&(Number(l.cant)||0)>d;
    return '<tr'+(falta?' style="background:#FEF2F2"':'')+'><td>'+(i+1)+'</td><td>'+l.art+'</td><td>'+Fmt.e(BD.nomArt(l.art))+(falta?' <span class="hint" style="color:var(--cancelada)">supera el disponible</span>':'')+'</td><td>'+u+'</td>'+
      (op.disp?'<td style="text-align:right">'+(op.alm?Fmt.n(d):hint('-'))+'</td>':'')+(op.max?'<td style="text-align:right">'+Fmt.n(l.max)+'</td>':'')+
      '<td><input value="'+l.cant+'" style="text-align:right" onchange="'+op.estVar+'.lineas['+i+'].cant=parseFloat(this.value)||0;'+op.render+'()"></td>'+
      (conCosto?'<td>'+(ro?'<div style="text-align:right">'+Fmt.m(l.costo)+'</div>':'<input value="'+l.costo+'" style="text-align:right" onchange="'+op.estVar+'.lineas['+i+'].costo=parseFloat(this.value)||0;'+op.render+'()">')+'</td><td style="text-align:right">'+Fmt.m(v)+'</td>':'')+
      '<td><button class="btn-link" onclick="'+op.estVar+'.lineas.splice('+i+',1);'+op.render+'()">Quitar</button></td></tr>';
  }).join('')||'<tr><td colspan="10" style="text-align:center;color:var(--texto-sec);padding:16px">Sin artículos: use "+ Agregar artículo"</td></tr>';
  document.getElementById(op.tfoot).innerHTML=est.lineas.length?'<tr><td colspan="'+(4+(op.disp?1:0)+(op.max?1:0))+'" style="text-align:right;font-weight:600">Totales</td><td style="text-align:right;font-weight:600">'+Fmt.n(tq)+'</td>'+(conCosto?'<td></td><td style="text-align:right;font-weight:700">S/. '+Fmt.m(tv)+'</td>':'')+'<td></td></tr>':'';
}
function lineasValidas(est){
  if(!est.lineas.length){toast("Agregue al menos un artículo");return false}
  const i=est.lineas.findIndex(l=>!(Number(l.cant)>0)); if(i>=0){toast("Línea "+(i+1)+": la cantidad debe ser mayor que cero");return false}
  return true;
}
function agregarLinea(est,cod,extra){
  if(est.lineas.some(l=>l.art===cod)){toast("El artículo ya está en el listado");return false}
  est.lineas.push(Object.assign({art:cod,cant:1},extra||{})); return true;
}
function prepararCabecera(pref){
  document.getElementById(pref+'-id').value='(automático)';
  document.getElementById(pref+'-user').value=BD.usuario;
  document.getElementById(pref+'-fecha').value=BD.ahora();
}

/* ===== GI-09 ===== */
const ING={oc:"",lineas:[]};
function nuevoIngreso(ocId){
  ING.oc=""; ING.lineas=[];
  prepararCabecera('gi09');
  document.getElementById('gi09-tipo').innerHTML=opcionesTipoMov('ING','ING-INICIAL');
  ['gi09-ndoc','gi09-origen','gi09-refetq','gi09-obs'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('gi09-alm').innerHTML=opcionesAlm('');
  const lbl=document.getElementById('lbl-refetq-09'); if(lbl)lbl.innerHTML=Fmt.e(cfg().nombreEtiqueta)+' <span class="hint">('+(cfg().imprimirRef?'se imprime en la etiqueta':'no se imprime')+')</span>';
  go('gi09');
  if(ocId)vincularOC(ocId); else renderIngreso();
}
function renderIngreso(){
  const o=ING.oc?BD.oc(ING.oc):null, alm=document.getElementById('gi09-alm').value;
  ['gi09-tipo','gi09-ndoc','gi09-origen'].forEach(id=>document.getElementById(id).disabled=!!o);
  document.getElementById('gi09-b-vinc').style.display=o?'none':'inline-block';
  document.getElementById('gi09-b-desv').style.display=o?'inline-block':'none';
  document.getElementById('gi09-b-add').style.display=o?'none':'inline-block';
  const av=document.getElementById('gi09-oc-aviso');
  if(o){av.style.display='block';av.innerHTML='<b style="font-size:12.5px">Recepción de '+docLink(o.id)+' · '+Fmt.e(BD.provNom(o.prov))+'</b><p class="hint" style="margin-top:4px">'+badge(o.est)+' · Avance recibido '+Docs.oc.avance(o).rec+'% '+(o.sol?'· desde '+docLink(o.sol):'')+(o.sf?' · '+docLink(o.sf):'')+'. Ajuste las cantidades si llegó una parte; quite las líneas que no llegaron.</p>';}
  else av.style.display='none';
  tablaLineas(ING,{thead:'gi09-head',tbody:'gi09-items',tfoot:'gi09-foot',alm,disp:true,dispLbl:'Stock actual en destino',costo:o?'ro':true,max:!!o,estVar:'ING',render:'renderIngreso'});
}
RENDER.gi09=()=>{};
BUSCADOR_CTX.gi09={etiqueta:"el almacén destino",soloInv:true,alm:()=>document.getElementById('gi09-alm').value,
  agregar:cod=>{const a=BD.art(cod)||{}; if(agregarLinea(ING,cod,{costo:Stock.costo(document.getElementById('gi09-alm').value,cod)||a.precioCompra||a.costo||0}))renderIngreso()}};

function ocsPorRecibir(){return BD.d.ocs.filter(o=>Docs.oc.recibible(o)&&o.tipo!=='Servicio'&&o.items.some(i=>i.recq<i.cant&&Stock.inventariable(i.art)))}
function abrirVincularOC(){
  const lista=ocsPorRecibir();
  document.getElementById('gi09a-body').innerHTML=lista.map(o=>{
    const pend=o.items.reduce((t,i)=>t+Math.max(0,i.cant-i.recq),0);
    return '<tr><td>'+o.id+'</td><td>'+Fmt.e(BD.provNom(o.prov))+'</td><td>'+o.fecha+'</td><td>'+(o.almDestino||hint('-'))+'</td><td>'+badge(o.est)+'</td><td style="text-align:right">'+Fmt.n(pend)+'</td><td><button class="btn btn-primary btn-sm" onclick="closeModal(\'m-gi09a\');vincularOC(\''+o.id+'\')">Vincular</button></td></tr>';
  }).join('')||'<tr><td colspan="7" style="text-align:center;color:var(--texto-sec);padding:16px">No hay órdenes de compra de bienes aprobadas pendientes de recibir. Se crean y aprueban en Compras (CO-07).</td></tr>';
  openModal('m-gi09a');
}
function vincularOC(id){
  const o=BD.oc(id); if(!o||!Docs.oc.recibible(o)){toast("La OC "+id+" no está para recibir");return}
  ING.oc=o.id;
  const intl=(BD.prov(o.prov)||{}).tipo==='Extranjero'||o.mon==='USD'&&(BD.prov(o.prov)||{}).tipo!=='Nacional';
  document.getElementById('gi09-tipo').innerHTML=opcionesTipoMov('ING',intl?'ING-IMPORT':'ING-COMPRA');
  document.getElementById('gi09-ndoc').value=o.id;
  document.getElementById('gi09-origen').value=BD.provNom(o.prov);
  if(o.almDestino)document.getElementById('gi09-alm').value=o.almDestino;
  const f=o.mon==='USD'?o.tc:1;
  ING.lineas=o.items.filter(i=>i.recq<i.cant&&Stock.inventariable(i.art)).map(i=>({art:i.art,cant:BD.r4(i.cant-i.recq),max:BD.r4(i.cant-i.recq),costo:BD.r4(i.pu*f)}));
  renderIngreso();
  toast(o.id+" vinculada: proveedor y líneas pendientes precargados");
}
function pedirConfirmarIngreso(){
  const alm=document.getElementById('gi09-alm').value;
  if(!alm){toast("Seleccione el almacén destino");return}
  if(!lineasValidas(ING))return;
  if(ING.oc){const i=ING.lineas.findIndex(l=>l.cant>l.max+0.00005); if(i>=0){toast("Línea "+(i+1)+": no se recibe más de lo pendiente ("+l0(ING.lineas[i].max)+")");return}}
  document.getElementById('gi09b-txt').innerHTML='¿Confirmar el ingreso de <b>'+ING.lineas.length+'</b> artículo(s) a <b>'+Fmt.e(almEtiqueta(alm))+'</b>'+(ING.oc?' contra <b>'+ING.oc+'</b>':'')+'?';
  openModal('m-gi09b');
}
function l0(v){return Fmt.n(v)}
function confirmarIngreso(){
  closeModal('m-gi09b');
  const alm=document.getElementById('gi09-alm').value, ref=document.getElementById('gi09-refetq').value.trim();
  const obs=[document.getElementById('gi09-obs').value.trim(),ref?cfg().nombreEtiqueta+': '+ref:''].filter(Boolean).join(' · ');
  let mov=null;
  if(ING.oc){
    mov=intentar(()=>Docs.oc.recibir(ING.oc,{alm,obs,lineas:ING.lineas.map(l=>({art:l.art,cant:l.cant}))}));
  }else{
    const tipo=document.getElementById('gi09-tipo').value, t=BD.tipoMov(tipo)||{};
    if(/REGULARIZ|OBSERV|FALLADO/.test(tipo)&&!document.getElementById('gi09-obs').value.trim()){toast("Indique en Observaciones el motivo ("+(t.nom||tipo)+")");return}
    const r=intentar(()=>Stock.ingreso({det:'Ingreso - '+(t.nom||tipo),tipoMov:tipo,alm,origen:document.getElementById('gi09-origen').value.trim()||'Ingreso manual',
      ndoc:document.getElementById('gi09-ndoc').value.trim(),obs,modulo:'Inventarios',lineas:ING.lineas.map(l=>({art:l.art,cant:l.cant,costo:l.costo}))}));
    if(r&&!r.ok){toast(r.error);return}
    if(r){BD.guardar();mov=r.mov;}
  }
  if(!mov)return;
  toast("Ingreso "+mov.id+" confirmado: stock y Kardex actualizados");
  abrirMov(mov.id);
}
