/* COMPRAS · CO-09/10 Facturas de Compra */
/* ===== CO-09/CO-10 · Facturas de Compra ===== */
const FAC_EST={"Borrador":"var(--borrador)","Impagado":"var(--impagado)","Pagado":"var(--confirmado)"};
let FACS=[
 {id:"FC-000048",ock:"oc225",oc:"OC-000225",prov:"AVÍOS DEL SUR EIRL",ndoc:"F441-00220",fecha:"05/07/2026",cond:"Contado",mon:"S/.",tc:"3.75",
  est:"Pagado",detr:false,detrp:12,obs:"Botones y cierres metálicos.",
  items:[{cod:"MP-0044",nom:"BOTON METALICO 17MM",u:"UND",cant:500,pu:0.35,igv:18},{cod:"MP-0045",nom:"CIERRE METALICO 12CM",u:"UND",cant:300,pu:0.80,igv:18}],
  docs:["Pago registrado en BPD_TESORERIA el 05/07/2026 (contado)","Ingreso relacionado: ING-000502 (módulo GI)"],ncs:[]},
 {id:"FC-000051",ock:"oc227",oc:"OC-000227",prov:"AVÍOS DEL SUR EIRL",ndoc:"F441-00219",fecha:"08/07/2026",cond:"Contado",mon:"S/.",tc:"3.75",
  est:"Pagado",detr:false,detrp:12,obs:"Pagada por adelantado: la entrega llegó después.",
  items:[{cod:"MP-0045",nom:"CIERRE METALICO 12CM",u:"UND",cant:1000,pu:0.80,igv:18}],
  docs:["Pago registrado en BPD_TESORERIA el 08/07/2026"],ncs:[]},
 {id:"FC-000053",ock:"oc229",oc:"OC-000229",prov:"TEXTIL SAN JACINTO SAC",ndoc:"F212-00836",fecha:"11/07/2026",cond:"Crédito 30 días",mon:"S/.",tc:"3.75",
  est:"Impagado",detr:false,detrp:12,obs:"Factura del primer despacho (entrega parcial).",
  items:[{cod:"MP-0012",nom:"TELA DENIM 12 OZ AZUL",u:"MT",cant:64,pu:19.40,igv:18}],
  docs:["Vence el 10/08/2026 (crédito 30 días) · pago pendiente en BPD_TESORERIA"],ncs:[]},
 {id:"FC-000055",ock:"oc226",oc:"OC-000226",prov:"TRANSPORTES GAMARRA EXPRESS SAC",ndoc:"F090-1122",fecha:"08/07/2026",cond:"Contado",mon:"S/.",tc:"3.75",
  est:"Pagado",detr:true,detrp:12,obs:"Servicio de flete: sujeto a detracción.",
  items:[{cod:"SERV-0009",nom:"SERVICIO DE FLETE LOCAL",u:"UND",cant:2,pu:180.00,igv:18}],
  docs:["Pago registrado en BPD_TESORERIA","Detracción depositada en cuenta del Banco de la Nación"],ncs:[]}
 ,{id:"FC-000054",ock:"oc219",oc:"OC-000219",prov:"YKK DO BRASIL LTDA",ndoc:"Invoice YKK-BR 88412",fecha:"18/07/2026",cond:"Contado",mon:"USD",tc:"3.75",
  est:"Impagado",detr:false,detrp:12,obs:"Importación de cierres YKK: embarque marítimo en tránsito.",
  items:[{cod:"MP-0046",nom:"CIERRE YKK RC-045 12CM",u:"UND",cant:6000,pu:0.52,igv:0},{cod:"MP-0047",nom:"CIERRE YKK RM-030 15CM",u:"UND",cant:4000,pu:0.48,igv:0}],
  docs:["Registrada desde la Invoice del proveedor (CO-10)","Mercadería aún no recibida: embarque en tránsito"],ncs:[]}
];
let FAC=null, FACidx=-1, FAC_SEQ=56;
function facTot(f){
  let sub=0,igv=0;
  f.items.forEach(it=>{const st=it.cant*it.pu; sub+=st; igv+=st*(it.igv/100)});
  return {sub:sub,igv:igv,tot:sub+igv};
}
function renderFac(){
  const q=(document.getElementById('f-fac-q').value||"").toLowerCase();
  const e=document.getElementById('f-fac-e').value, pv=document.getElementById('f-fac-p').value;
  const selP=document.getElementById('f-fac-p');
  if(selP.options.length<=1)selP.innerHTML='<option value="">Todos</option>'+[...new Set(PROV.map(x=>x.nom))].map(x=>'<option>'+x+'</option>').join('');
  const tb=document.getElementById('fac-body'); tb.innerHTML=""; let n=0, imp=0;
  FACS.forEach((f,i)=>{
    if(q && !(f.id.toLowerCase().includes(q)||f.ndoc.toLowerCase().includes(q)||sinTildes(f.prov).includes(sinTildes(q))||f.oc.toLowerCase().includes(q)))return;
    if(e && f.est!==e)return; if(pv && f.prov!==pv)return;
    n++;
    const t=facTot(f); if(f.est==="Impagado")imp+=t.tot;
    const tr=document.createElement('tr'); tr.className="clickable"; tr.onclick=()=>loadFac(i);
    tr.innerHTML='<td>'+f.id+'</td><td>'+f.prov+'</td><td>'+(f.ndoc||'<span class="hint">sin registrar</span>')+'</td><td>'+f.mon+'</td>'+
     '<td style="text-align:right;font-weight:600">'+fmtM(t.tot)+'</td>'+
     '<td><span class="badge" style="background:'+FAC_EST[f.est]+'">'+f.est+'</span></td><td>'+f.fecha+'</td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();loadOC(\''+f.ock+'\')">'+f.oc+'</button></td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();loadFac('+i+')">Abrir</button></td>';
    tb.appendChild(tr);
  });
  document.getElementById('fac-count').innerHTML=n+" facturas"+(imp>0?' · <b style="color:var(--impagado)">Impagado: S/. '+fmtM(imp)+'</b>':'');
}
function abrirFacOC(){
  const tb=document.getElementById('co10a-body'); tb.innerHTML="";
  OCS_ORDEN.forEach(k=>{
    const o=OCS[k]; if(!o)return;
    if(o.est==="Borrador"||o.est==="Pendiente de Validar"||o.est==="Cancelada")return;
    if(o.fac>=100)return;
    const t=ocTotales(o);
    tb.innerHTML+='<tr><td>'+o.id+'</td><td>'+o.prov+'</td><td>'+o.fecha+'</td><td style="text-align:right">'+(o.mon==="USD"?"USD ":"S/. ")+fmtM(t.tot)+'</td>'+
     '<td style="text-align:right;color:var(--confirmado)">'+o.fac+'%</td>'+
     '<td><button class="btn btn-primary btn-sm" onclick="crearFacDesdeOCk(\''+k+'\')">Facturar</button></td></tr>';
  });
  if(!tb.innerHTML)tb.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--texto-sec);padding:14px">No hay OCs pendientes de facturar</td></tr>';
  openModal('m-co10a');
}
function crearFacDesdeOC(){
  document.getElementById('oc-crear-menu').classList.remove('open');
  if(OC.fac>=100){toast("La OC ya está facturada al 100%");return}
  crearFacDesdeOCk(OCkey);
}
function crearFacDesdeOCk(k){
  closeModal('m-co10a');
  const o=OCS[k];
  const esServ=esServicioOC(o);
  FAC={id:"FC-0000"+FAC_SEQ,ock:k,oc:o.id,prov:o.prov,ndoc:"",fecha:"19/07/2026",cond:o.cond,mon:o.mon,tc:o.tc,
   est:"Borrador",detr:esServ,detrp:12,obs:"",
   items:o.items.map(it=>({cod:it.cod,nom:it.nom,u:it.u,cant:it.cant,pu:it.pu,igv:it.igv})),
   docs:["Factura del proveedor registrada contra "+o.id+" (Crear ▾)"],ncs:[]};
  FACidx=-1;
  loadFacForm();
  toast("Factura contra "+o.id+": ítems y precios precargados, transcriba la serie y número del comprobante recibido"+(esServ?" · servicio: detracción sugerida":""));
}
function loadFac(i){
  FACidx=i; FAC=FACS[i]; loadFacForm();
}
function loadFacForm(){
  document.getElementById('fac-id').value=FAC.id;
  document.getElementById('fac-oc').value=FAC.oc;
  document.getElementById('fac-prov').value=FAC.prov;
  document.getElementById('fac-ndoc').value=FAC.ndoc;
  document.getElementById('fac-cond').value=FAC.cond;
  document.getElementById('fac-mon').value=FAC.mon;
  document.getElementById('fac-tc').value=FAC.tc;
  document.getElementById('fac-obs').value=FAC.obs;
  document.getElementById('fac-detr').checked=FAC.detr;
  document.getElementById('fac-detrp').value=FAC.detrp;
  renderFacForm(); go('co10');
}
function renderFacForm(){
  const e=FAC.est, ro=(e!=="Borrador");
  document.getElementById('fac-titulo').textContent=(e==="Borrador")?"REGISTRAR FACTURA DEL PROVEEDOR":("FACTURA DEL PROVEEDOR: "+(FAC.ndoc||FAC.id));
  const b=document.getElementById('fac-badge'); b.textContent=e; b.style.background=FAC_EST[e];
  const show=(id,v)=>document.getElementById(id).style.display=v?"inline-block":"none";
  show('fac-b-cancelar',e==="Borrador"); show('fac-b-guardar',e==="Borrador"); show('fac-b-emitir',e==="Borrador");
  show('fac-b-pago',e==="Impagado"); show('fac-b-volver',ro);
  ['fac-ndoc','fac-fecha','fac-cond','fac-obs','fac-detr','fac-detrp'].forEach(id=>document.getElementById(id).disabled=ro);
  renderFacItems();
  renderFacNC();
  document.getElementById('fac-docs').innerHTML=(FAC.docs.length?FAC.docs:["Sin documentos relacionados"]).map(d=>{
    d=d.replace("ING-000502",'<button class="btn-link" onclick="showDetalle(\'ing502\')">ING-000502</button>');
    d=d.replace("ING-000513",'<button class="btn-link" onclick="showDetalle(\'ing513\')">ING-000513</button>');
    return '<div style="padding:6px 0;border-bottom:1px solid var(--borde)">'+d+'</div>';
  }).join('');
}
function renderFacItems(){
  const ro=(FAC.est!=="Borrador");
  document.getElementById('fac-items-head').innerHTML='<tr><th style="width:36px">#</th><th>Código</th><th>Nombre</th><th>Unidad</th><th style="width:95px;text-align:right">Cantidad</th><th style="width:105px;text-align:right">Precio unit.</th><th style="width:100px;text-align:right">Subtotal</th><th style="width:95px;text-align:right">IGV (auto)</th><th style="width:110px;text-align:right">Total</th></tr>';
  const tb=document.getElementById('fac-items'); tb.innerHTML="";
  let sub=0,igvT=0;
  const oc=OCS[FAC.ock];
  FAC.items.forEach((it,i)=>{
    const st=it.cant*it.pu, igv=st*(it.igv/100); sub+=st; igvT+=igv;
    const ocIt=oc?oc.items.find(x=>x.cod===it.cod):null;
    const dif=(ocIt && (Math.abs(ocIt.cant-it.cant)>0.001 || Math.abs(ocIt.pu-it.pu)>0.001));
    const cant=ro?('<td style="text-align:right">'+fmtM(it.cant)+'</td>'):'<td><input value="'+it.cant+'" style="text-align:right" oninput="facItemInput('+i+',\'cant\',this)"></td>';
    const pu=ro?('<td style="text-align:right">'+fmtM(it.pu)+'</td>'):'<td><input value="'+it.pu+'" style="text-align:right" oninput="facItemInput('+i+',\'pu\',this)"></td>';
    tb.innerHTML+='<tr><td>'+(i+1)+'</td><td>'+it.cod+'</td><td id="fac-nom-'+i+'">'+it.nom+(dif?' <span class="hint" style="color:var(--pendiente)">difiere de la OC</span>':'')+'</td><td>'+it.u+'</td>'+cant+pu+
     '<td id="fac-st-'+i+'" style="text-align:right">'+fmtM(st)+'</td><td id="fac-igv-'+i+'" style="text-align:right">'+(it.igv>0?fmtM(igv)+' ('+it.igv+'%)':'0.00 <span class="hint">import.</span>')+'</td>'+
     '<td id="fac-tot-'+i+'" style="text-align:right;font-weight:600">'+fmtM(st+igv)+'</td></tr>';
  });
  facTotalesUI();
}
function facItemInput(i,campo,el){
  FAC.items[i][campo]=parseFloat(el.value)||0;
  const it=FAC.items[i], st=it.cant*it.pu, igv=st*(it.igv/100);
  const oc=OCS[FAC.ock];
  const ocIt=oc?oc.items.find(x=>x.cod===it.cod):null;
  const dif=(ocIt && (Math.abs(ocIt.cant-it.cant)>0.001 || Math.abs(ocIt.pu-it.pu)>0.001));
  const cn=document.getElementById('fac-nom-'+i);
  if(cn)cn.innerHTML=it.nom+(dif?' <span class="hint" style="color:var(--pendiente)">difiere de la OC</span>':'');
  const c1=document.getElementById('fac-st-'+i), c2=document.getElementById('fac-igv-'+i), c3=document.getElementById('fac-tot-'+i);
  if(c1)c1.textContent=fmtM(st);
  if(c2)c2.innerHTML=(it.igv>0?fmtM(igv)+' ('+it.igv+'%)':'0.00 <span class="hint">import.</span>');
  if(c3)c3.textContent=fmtM(st+igv);
  facTotalesUI();
}
function facTotalesUI(){
  let sub=0,igvT=0;
  FAC.items.forEach(it=>{const st=it.cant*it.pu; sub+=st; igvT+=st*(it.igv/100)});
  const tot=sub+igvT;
  const tc=parseFloat(FAC.tc)||1;
  const dual=(FAC.mon==="USD")?(' <span class="hint">· S/. '+fmtM(tot*tc)+' (TC '+tc+')</span>'):'';
  document.getElementById('fac-items-foot').innerHTML='<tr><td colspan="6" style="text-align:right;font-weight:600">Totales ('+FAC.mon+')</td>'+
   '<td style="text-align:right;font-weight:600">'+fmtM(sub)+'</td><td style="text-align:right;font-weight:600">'+fmtM(igvT)+'</td><td style="text-align:right;font-weight:700">'+fmtM(tot)+dual+'</td></tr>';
  // detraccion
  const box=document.getElementById('fac-detr-box');
  const aplica=document.getElementById('fac-detr').checked;
  FAC.detr=aplica; FAC.detrp=parseFloat(document.getElementById('fac-detrp').value)||0;
  if(aplica){
    const d=tot*FAC.detrp/100;
    box.style.display="block";
    box.innerHTML='Detracción '+FAC.detrp+'%: <b>'+fmtM(d)+'</b> se deposita en la cuenta de detracciones del proveedor · Neto a pagar al proveedor: <b>'+fmtM(tot-d)+'</b> <span class="warn" title="Porcentaje y supuestos a confirmar con contabilidad">⚠</span>';
  }else box.style.display="none";
}
function renderFacNC(){
  const box=document.getElementById('fac-nc'), tb=document.getElementById('fac-nc-body');
  const pend=NCS.filter(x=>x.prov===FAC.prov && x.est==="Pendiente");
  if(!pend.length || FAC.est==="Pagado"){box.style.display="none";return}
  box.style.display="block"; tb.innerHTML="";
  pend.forEach(x=>{
    const i=NCS.indexOf(x);
    tb.innerHTML+='<tr><td>'+x.id+'</td>'+
     '<td>'+(x.reck?('<button class="btn-link" onclick="loadRec(\''+x.reck+'\')">'+x.rec+'</button>'):x.rec)+'</td>'+
     '<td>'+x.oc+'</td><td style="text-align:right;font-weight:600">'+(x.mon==="USD"?"USD ":"S/. ")+fmtM(x.monto)+'</td>'+
     '<td><button class="btn btn-primary btn-sm" onclick="aplicarNCenFac('+i+')">Aplicar a esta factura</button></td></tr>';
  });
}
function aplicarNCenFac(i){
  const x=NCS[i];
  if(!FAC.ndoc){toast("Registre primero la factura para poder aplicarle la NC");return}
  x.est="Aplicada"; x.fac=FAC.ndoc; x.fapl="19/07/2026";
  FAC.ncs.push(x.id);
  FAC.docs.unshift("Nota de Crédito aplicada: "+x.id+" por "+(x.mon==="USD"?"USD ":"S/. ")+fmtM(x.monto)+" (origen "+x.rec+")");
  renderFacForm(); renderNC();
  toast(x.id+" aplicada a "+FAC.ndoc+": el descuento se refleja en el pago a Tesorería");
}
function registrarFac(){
  const nd=document.getElementById('fac-ndoc').value.trim();
  if(!nd){toast("Transcriba la serie y número del comprobante recibido del proveedor");return}
  if(!/^[A-Za-z0-9]+-[0-9]+$/.test(nd)){toast("Formato esperado serie-número, por ejemplo F212-00841");return}
  if(FACS.some((f,i)=>f.ndoc===nd && i!==FACidx)){toast("Ya existe una factura registrada con ese comprobante");return}
  if(!FAC.items.length){toast("La factura no tiene ítems");return}
  FAC.ndoc=nd; FAC.cond=document.getElementById('fac-cond').value;
  FAC.obs=document.getElementById('fac-obs').value; FAC.est="Impagado";
  if(FACidx<0){FACS.unshift(FAC); FACidx=0; FAC_SEQ++;}
  // avance de facturacion en la OC
  const o=OCS[FAC.ock];
  if(o){
    const totOC=o.items.reduce((a,it)=>a+it.cant*it.pu,0);
    const facV=FACS.filter(f=>f.ock===FAC.ock&&f.est!=="Borrador").reduce((a,f)=>a+f.items.reduce((b,it)=>b+it.cant*it.pu,0),0);
    o.fac=Math.min(100,Math.round(facV/totOC*100));
    o.est=estadoPorAvance(o);
    o.docs.unshift("Factura del proveedor registrada: "+nd+" ("+FAC.id+") · Impagada");
    renderOCS();
  }
  renderFacForm(); renderFac();
  toast(nd+" registrada: Impagada · OC facturada al "+(o?o.fac:0)+"% · estado "+(o?o.est:""));
}
function marcarPagada(){
  FAC.est="Pagado";
  FAC.docs.unshift("Pago registrado en BPD_TESORERIA el 19/07/2026");
  renderFacForm(); renderFac();
  toast("Pago reflejado desde BPD_TESORERIA: la factura queda Pagada");
}
