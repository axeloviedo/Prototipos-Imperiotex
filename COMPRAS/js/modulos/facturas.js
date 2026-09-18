/* COMPRAS · CO-09/10 Facturas de Compra
   Conectado a la base compartida: BD.d.facturas con Docs.fac.crear/pagar (docs/16 §3.4).
   {id:'FC-000001', oc, prov, ndoc, fecha, cond, mon, tc, est:'Impagado'|'Pagado', items:[{art, cant, pu, igv}], obs, hist}
   Globales: renderFac(), abrirFactura(id), crearFacDesdeOC() (desde CO-07). */
const FAC_EST={"Por registrar":"var(--borrador)","Borrador":"var(--borrador)","Impagado":"var(--impagado)","Pagado":"var(--confirmado)","Anulada":"var(--cancelada)"};
let FAC=null;   // factura abierta: documento de la base o borrador local {nuevo:true,...} aún no registrado
function facTot(f){
  let sub=0,igv=0;
  f.items.forEach(it=>{const st=it.cant*it.pu; sub+=st; igv+=st*((it.igv||0)/100)});
  return {sub:sub,igv:igv,tot:sub+igv};
}
function renderFac(){
  const tb=document.getElementById('fac-body'); if(!tb)return;
  const facs=coD().facturas;
  const q=sinTildes(document.getElementById('f-fac-q').value||"");
  const e=document.getElementById('f-fac-e').value;
  const selP=document.getElementById('f-fac-p'), pv=selP.value;
  const provs=[...new Set(facs.map(f=>f.prov))];
  selP.innerHTML='<option value="">Todos</option>'+provs.map(c=>'<option value="'+c+'">'+coEsc(coProvTxt(c))+'</option>').join('');
  selP.value=provs.includes(pv)?pv:"";
  const desde=document.getElementById('f-fac-d').value;
  let html="", n=0, impS=0, impU=0;
  facs.forEach(f=>{
    if(q && !(sinTildes(f.id).includes(q)||sinTildes(f.ndoc).includes(q)||sinTildes(coProvTxt(f.prov)).includes(q)||sinTildes(f.oc).includes(q)))return;
    if(e && f.est!==e)return; if(selP.value && f.prov!==selP.value)return;
    if(desde && coISO(f.fecha)<desde)return;
    n++;
    const tot=Docs.fac.total(f);
    if(f.est==="Impagado"){ if(f.mon==="USD")impU+=tot; else impS+=tot; }
    html+='<tr class="clickable" onclick="abrirFactura(\''+f.id+'\')"><td>'+f.id+'</td><td>'+coEsc(coProvTxt(f.prov))+'</td><td>'+coEsc(f.ndoc)+'</td><td>'+f.mon+'</td>'+
     '<td style="text-align:right;font-weight:600">'+fmtM(tot)+'</td>'+
     '<td><span class="badge" style="background:'+(FAC_EST[f.est]||"var(--borrador)")+'">'+f.est+'</span></td><td>'+f.fecha+'</td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();abrirOC(\''+f.oc+'\')">'+f.oc+'</button></td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();abrirFactura(\''+f.id+'\')">Abrir</button></td></tr>';
  });
  tb.innerHTML=html||'<tr><td colspan="9" style="text-align:center;color:var(--texto-sec);padding:16px">'+(facs.length?'Sin facturas para los filtros aplicados':'Aún no hay facturas en la base: regístrelas contra una OC aprobada')+'</td></tr>';
  const imp=[impS>0?'S/. '+fmtM(impS):'',impU>0?'USD '+fmtM(impU):''].filter(Boolean).join(' + ');
  document.getElementById('fac-count').innerHTML=n+" facturas"+(imp?' · <b style="color:var(--impagado)">Impagado: '+imp+'</b>':'');
  /* rehidrata la ficha abierta (si no es un borrador local) */
  const scr=document.getElementById('scr-co10');
  if(FAC && !FAC.nuevo && scr && scr.classList.contains('active')){ const f=BD.fac(FAC.id); if(f){FAC=f; loadFacForm(true);} }
}
function abrirFacOC(){
  let html="";
  coD().ocs.filter(ocFacturable).forEach(o=>{
    const t=Docs.oc.totales(o), a=Docs.oc.avance(o);
    html+='<tr><td>'+o.id+'</td><td>'+coEsc(coProvTxt(o.prov))+'</td><td>'+o.fecha+'</td><td><span class="badge" style="background:'+(OC_EST[o.est]||"var(--borrador)")+'">'+o.est+'</span></td>'+
     '<td style="text-align:right">'+coMon(o.mon)+fmtM(t.total)+'</td>'+
     '<td style="text-align:right">'+a.rec+'%</td><td style="text-align:right;color:var(--confirmado)">'+a.fac+'%</td>'+
     '<td><button class="btn btn-primary btn-sm" onclick="crearFacDesdeOCk(\''+o.id+'\')">Facturar</button></td></tr>';
  });
  document.getElementById('co10a-body').innerHTML=html||'<tr><td colspan="9" style="text-align:center;color:var(--texto-sec);padding:14px">No hay OCs aprobadas pendientes de facturar</td></tr>';
  openModal('m-co10a');
}
function crearFacDesdeOC(){
  const menu=document.getElementById('oc-crear-menu'); if(menu)menu.classList.remove('open');
  if(!OC||!OCid){toast("Abra primero una orden de compra");return}
  if(!ocFacturable(BD.oc(OCid))){toast("La OC no está aprobada o ya está facturada al 100%");return}
  crearFacDesdeOCk(OCid);
}
function crearFacDesdeOCk(id){
  closeModal('m-co10a');
  const o=BD.oc(id); if(!o){toast("No existe la OC "+id);return}
  if(!ocFacturable(o)){toast("La OC "+id+" no está aprobada o ya está facturada");return}
  FAC={nuevo:true,id:"",oc:o.id,prov:o.prov,ndoc:"",fecha:BD.hoy(),cond:o.cond,mon:o.mon,tc:o.tc,est:"Por registrar",obs:"",
    items:ocPendFac(o).map(it=>({art:it.art,cant:BD.r4(it.cant-it.facq),pu:it.pu,igv:it.igv,max:BD.r4(it.cant-it.facq),puOC:it.pu})),hist:[]};
  loadFacForm();
  toast("Factura contra "+o.id+": transcriba la serie y número del comprobante recibido"+(o.of&&esServicioOC(o)?" · pasará a la pestaña Costo de "+o.of:""));
}
function abrirFactura(id){
  const f=BD.fac(id); if(!f){toast("No existe la factura "+id);return}
  FAC=f; loadFacForm();
}
function loadFac(id){ abrirFactura(id); }
function verOCdeFac(){ if(FAC&&FAC.oc)abrirOC(FAC.oc); }
function loadFacForm(sinIr){
  const o=BD.oc(FAC.oc), p=BD.prov(FAC.prov)||{};
  document.getElementById('fac-id').value=FAC.nuevo?"(se asigna al registrar)":FAC.id;
  document.getElementById('fac-oc').value=FAC.oc;
  document.getElementById('fac-prov').value=p.nom?(p.nom+" ("+p.cod+")"):FAC.prov;
  document.getElementById('fac-ndoc').value=FAC.ndoc;
  document.getElementById('fac-fecha').value=coISO(FAC.fecha);
  document.getElementById('fac-cond').value=FAC.cond||"";
  document.getElementById('fac-mon').value=FAC.mon;
  document.getElementById('fac-tc').value=FAC.tc;
  document.getElementById('fac-obs').value=FAC.obs||"";
  document.getElementById('fac-fiscal').value="Detracción: "+(p.detraccion?"sí":"no")+" · Retención: "+(p.retencion?"sí":"no");
  /* aviso: servicio de una orden de fabricación */
  const av=document.getElementById('fac-aviso-of');
  const srvOF=o && o.of && FAC.items.some(i=>BD.esServicio(i.art));
  if(srvOF){
    av.style.display="block";
    av.innerHTML='<b style="font-size:12.5px">Servicio de la orden de fabricación '+coEsc(o.of)+'</b><p class="hint" style="margin-top:5px">'+(FAC.nuevo?'Al registrarla, esta factura pasa':'Esta factura pasó')+' a la <b>pestaña Costo de la orden</b>, donde el importe real se contrasta con el costo estándar del servicio.'+(BD.of(o.of)?'':' <span style="color:var(--pendiente)">La orden '+coEsc(o.of)+' no existe en la base: no se registra en ninguna orden.</span>')+' <button class="btn-link" onclick="verOFdeOC(\''+coEsc(o.of)+'\')">Abrir la orden en Producción</button></p>';
  }else av.style.display="none";
  /* C-4: si la orden tercerizada dejó un faltante abierto, se avisa (no bloquea: el reclamo va por CO-11) */
  const avFalta=Docs.fac.avisos(FAC.oc);
  if(avFalta.length){
    av.style.display="block";
    av.style.borderLeftColor="var(--pendiente)";
    av.innerHTML=(av.innerHTML||"")+'<p class="hint" style="margin-top:6px"><b>Faltante del servicio:</b> '+coEsc(avFalta.join(" · "))+'</p>';
  }else av.style.borderLeftColor="var(--primario-claro)";
  renderFacForm();
  if(!sinIr)go('co10');
}
function renderFacForm(){
  const e=FAC.est, nuevo=!!FAC.nuevo;
  document.getElementById('fac-titulo').textContent=nuevo?"REGISTRAR FACTURA DEL PROVEEDOR":("FACTURA DEL PROVEEDOR: "+FAC.ndoc+" · "+FAC.id);
  const b=document.getElementById('fac-badge'); b.textContent=e; b.style.background=FAC_EST[e]||"var(--borrador)";
  const show=(id,v)=>document.getElementById(id).style.display=v?"inline-block":"none";
  show('fac-b-cancelar',nuevo); show('fac-b-emitir',nuevo);
  show('fac-b-pago',!nuevo && e==="Impagado"); show('fac-b-volver',!nuevo);
  ['fac-ndoc','fac-fecha','fac-obs'].forEach(id=>document.getElementById(id).disabled=!nuevo);
  document.getElementById('fac-items-hint').style.display=nuevo?"block":"none";
  renderFacItems();
  renderFacDocs();
  renderFacFavor();
}
/* saldo a favor del proveedor (notas de crédito de facturas ya pagadas): se aplica a esta factura impaga (P3) */
function renderFacFavor(){
  const bx=document.getElementById('fac-favor'); if(!bx)return;
  const nuevo=!!FAC.nuevo, favor=Docs.nc.saldoFavor(FAC.prov,FAC.mon), creditos=(!nuevo&&FAC.creditos)||[];
  if(!favor&&!creditos.length){bx.style.display='none';return}
  let html='';
  if(creditos.length)html+='<b style="font-size:12.5px">Saldo a favor aplicado</b><p class="hint" style="margin-top:4px">'+creditos.map(c=>c.nc+' · '+coMon(FAC.mon)+fmtM(c.monto)).join(' · ')+' · queda por pagar <b>'+coMon(FAC.mon)+fmtM(Docs.nc.saldoFactura(FAC.id))+'</b></p>';
  if(favor>0.004){
    html+='<b style="font-size:12.5px">'+coEsc(BD.provNom(FAC.prov))+' tiene saldo a favor: '+coMon(FAC.mon)+fmtM(favor)+'</b>'+
      '<p class="hint" style="margin-top:4px">Viene de notas de crédito de facturas que ya se pagaron ('+Docs.nc.favorDe(FAC.prov,FAC.mon).map(n=>n.id).join(', ')+').'+
      (nuevo?' Registre la factura y luego aplíquelo.':'')+'</p>'+
      (!nuevo&&FAC.est==='Impagado'&&Docs.nc.saldoFactura(FAC.id)>0.004?'<button class="btn btn-primary btn-sm" style="margin-top:6px" onclick="aplicarFavorFac()">Aplicar saldo a favor a esta factura</button>':'');
  }
  bx.innerHTML=html; bx.style.display='block';
}
function aplicarFavorFac(){
  const r=coTry(()=>Docs.nc.aplicarSaldo(FAC.id)); if(!r)return;
  FAC=BD.fac(FAC.id);
  toast('Saldo a favor aplicado: '+coMon(FAC.mon)+fmtM(r.usado)+' · queda por pagar '+coMon(FAC.mon)+fmtM(r.saldo)+(FAC.est==='Pagado'?' (factura cancelada)':''));
  loadFacForm(true); renderFac(); if(typeof renderNC==='function')renderNC();
}
function renderFacItems(){
  const nuevo=!!FAC.nuevo;
  document.getElementById('fac-items-head').innerHTML='<tr><th style="width:36px">#</th><th>Código</th><th>Nombre</th><th>Unidad</th>'+(nuevo?'<th style="width:95px;text-align:right">Pendiente</th>':'')+'<th style="width:95px;text-align:right">Cantidad</th><th style="width:105px;text-align:right">Precio unit.</th><th style="width:100px;text-align:right">Subtotal</th><th style="width:95px;text-align:right">IGV (auto)</th><th style="width:110px;text-align:right">Total</th></tr>';
  const o=BD.oc(FAC.oc);
  let html="";
  FAC.items.forEach((it,i)=>{
    const st=it.cant*it.pu, igv=st*((it.igv||0)/100);
    const ocIt=o?o.items.find(x=>x.art===it.art):null;
    const dif=!!ocIt && Math.abs(ocIt.pu-it.pu)>0.0001;
    const cant=nuevo?'<td><input value="'+it.cant+'" style="text-align:right" oninput="facItemInput('+i+',\'cant\',this)"></td>':('<td style="text-align:right">'+fmtM(it.cant)+'</td>');
    const pu=nuevo?'<td><input value="'+it.pu+'" style="text-align:right" oninput="facItemInput('+i+',\'pu\',this)"></td>':('<td style="text-align:right">'+fmtM(it.pu)+'</td>');
    html+='<tr><td>'+(i+1)+'</td><td>'+it.art+'</td><td id="fac-nom-'+i+'">'+coEsc(BD.nomArt(it.art))+(dif?' <span class="hint" style="color:var(--pendiente)">precio distinto a la OC ('+fmtM(ocIt.pu)+')</span>':'')+'</td><td>'+coEsc(BD.u(it.art))+'</td>'+
     (nuevo?'<td style="text-align:right">'+fmtM(it.max)+'</td>':'')+cant+pu+
     '<td id="fac-st-'+i+'" style="text-align:right">'+fmtM(st)+'</td><td id="fac-igv-'+i+'" style="text-align:right">'+(it.igv>0?fmtM(igv)+' ('+it.igv+'%)':'0.00')+'</td>'+
     '<td id="fac-tot-'+i+'" style="text-align:right;font-weight:600">'+fmtM(st+igv)+'</td></tr>';
  });
  document.getElementById('fac-items').innerHTML=html||'<tr><td colspan="10" style="text-align:center;color:var(--texto-sec);padding:14px">Sin ítems</td></tr>';
  facTotalesUI();
}
function facItemInput(i,campo,el){
  const it=FAC.items[i];
  it[campo]=parseFloat(el.value)||0;
  const st=it.cant*it.pu, igv=st*((it.igv||0)/100);
  const cn=document.getElementById('fac-nom-'+i);
  if(cn)cn.innerHTML=coEsc(BD.nomArt(it.art))+(Math.abs((it.puOC||it.pu)-it.pu)>0.0001?' <span class="hint" style="color:var(--pendiente)">precio distinto a la OC ('+fmtM(it.puOC)+')</span>':'')+(it.cant>it.max+0.00005?' <span class="hint" style="color:var(--cancelada)">supera lo pendiente</span>':'');
  const c1=document.getElementById('fac-st-'+i), c2=document.getElementById('fac-igv-'+i), c3=document.getElementById('fac-tot-'+i);
  if(c1)c1.textContent=fmtM(st);
  if(c2)c2.textContent=(it.igv>0?fmtM(igv)+' ('+it.igv+'%)':'0.00');
  if(c3)c3.textContent=fmtM(st+igv);
  facTotalesUI();
}
function facTotalesUI(){
  const t=facTot(FAC), tc=parseFloat(FAC.tc)||1;
  const dual=(FAC.mon==="USD")?(' <span class="hint">· S/. '+fmtM(t.tot*tc)+' (TC '+tc+')</span>'):'';
  document.getElementById('fac-items-foot').innerHTML='<tr><td colspan="'+(FAC.nuevo?7:6)+'" style="text-align:right;font-weight:600">Totales ('+FAC.mon+')</td>'+
   '<td style="text-align:right;font-weight:600">'+fmtM(t.sub)+'</td><td style="text-align:right;font-weight:600">'+fmtM(t.igv)+'</td><td style="text-align:right;font-weight:700">'+fmtM(t.tot)+dual+'</td></tr>';
  const p=BD.prov(FAC.prov)||{}, box=document.getElementById('fac-detr-box');
  if(p.detraccion||p.retencion){
    box.style.display="block";
    box.innerHTML='Dato informativo del maestro del proveedor: '+[p.detraccion?'<b>sujeto a detracción</b> (se deposita en su cuenta del Banco de la Nación; porcentaje según el tipo de servicio)':'',p.retencion?'<b>sujeto a retención</b>':''].filter(Boolean).join(' · ')+'. No se calcula aquí: lo aplica Tesorería al pagar <span class="warn" title="Porcentajes y cuentas a confirmar con contabilidad">⚠</span>.';
  }else box.style.display="none";
}
function renderFacDocs(){
  const o=BD.oc(FAC.oc), filas=[];
  const fila=h=>'<div style="padding:6px 0;border-bottom:1px solid var(--borde)">'+h+'</div>';
  if(o){
    const a=Docs.oc.avance(o);
    filas.push(fila('Orden de compra <button class="btn-link" onclick="abrirOC(\''+o.id+'\')">'+o.id+'</button> · <span class="badge" style="background:'+(OC_EST[o.est]||"var(--borrador)")+'">'+o.est+'</span> · recibido '+a.rec+'% · facturado '+a.fac+'%'));
    o.recepciones.filter(r=>r.tipo==="Ingreso").forEach(r=>filas.push(fila('Ingreso relacionado: '+((typeof abrirMov==='function')?'<button class="btn-link" onclick="abrirMov(\''+r.mov+'\')">'+r.mov+'</button>':'<b>'+r.mov+'</b>')+((BD.mov(r.mov)||{}).tipoMov?' · '+coEsc(BD.mov(r.mov).tipoMov):'')+' · '+r.fecha+' · '+coEsc(r.alm))));
    o.recepciones.filter(r=>r.tipo==="Conformidad").forEach(r=>filas.push(fila('Conformidad del servicio · '+r.fecha+(r.conforme===false?' · con observaciones':''))));
    o.facturas.filter(id=>id!==FAC.id).forEach(id=>{const f=BD.fac(id); if(f)filas.push(fila('Otra factura de la misma OC: <button class="btn-link" onclick="abrirFactura(\''+f.id+'\')">'+f.id+'</button> · '+coEsc(f.ndoc)+' · '+f.est))});
  }
  (FAC.hist||[]).slice().reverse().forEach(h=>filas.push(fila(h.f+' · '+coEsc(h.u)+' · <b>'+coEsc(h.a)+'</b>'+(h.d?' · <span class="hint">'+coEsc(h.d)+'</span>':''))));
  document.getElementById('fac-docs').innerHTML=filas.join('')||'<span class="hint">Sin documentos relacionados</span>';
}
function cancelarFacForm(){ const oc=FAC&&FAC.oc; FAC=null; if(oc&&BD.oc(oc))abrirOC(oc); else go('co09'); }
function registrarFac(){
  if(!FAC||!FAC.nuevo)return;
  const nd=document.getElementById('fac-ndoc').value.trim();
  if(!nd){toast("Transcriba la serie y número del comprobante recibido del proveedor");return}
  if(!/^[A-Za-z0-9]+-[0-9]+$/.test(nd)){toast("Formato esperado serie-número, por ejemplo F001-00012");return}
  if(coD().facturas.some(f=>f.prov===FAC.prov && f.ndoc===nd)){toast("Ya existe una factura de este proveedor con ese comprobante");return}
  const lineas=FAC.items.filter(it=>it.cant>0).map(it=>({art:it.art,cant:it.cant,pu:it.pu}));
  if(!lineas.length){toast("Indique al menos una cantidad a facturar");return}
  if(FAC.items.some(it=>it.pu<=0 && it.cant>0)){toast("Todas las líneas facturadas deben tener precio");return}
  const fecha=coDMY(document.getElementById('fac-fecha').value)||BD.hoy();
  const avisos=Docs.fac.avisos(FAC.oc);
  if(avisos.length&&!FAC.avisado){FAC.avisado=true;toast(avisos[0]+". Vuelva a pulsar Registrar factura para continuar");return}
  const f=coTry(()=>Docs.fac.crear({oc:FAC.oc,ndoc:nd,fecha:fecha,lineas:lineas,obs:document.getElementById('fac-obs').value}));
  if(!f)return;
  const o=BD.oc(f.oc), a=Docs.oc.avance(o);
  FAC=f; loadFacForm(); coRefrescar();
  toast(nd+" registrada ("+f.id+"): Impagada · OC facturada al "+a.fac+"% · "+o.est);
}
function marcarPagada(){
  if(!FAC||FAC.nuevo)return;
  const f=coTry(()=>Docs.fac.pagar(FAC.id)); if(!f)return;
  FAC=f; loadFacForm(); coRefrescar();
  toast("Pago reflejado desde Tesorería: la factura queda Pagada");
}
