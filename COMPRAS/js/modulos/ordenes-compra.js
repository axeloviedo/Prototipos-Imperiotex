/* COMPRAS · CO-06/07 Órdenes de Compra */
/* ===== CO-06/07 · Órdenes de Compra ===== */
const OC_EST={"Borrador":"var(--borrador)","Pendiente de Validar":"var(--pendiente)","Para Recibir y Pagar":"var(--prp)","Para Recibir":"var(--oc-recibir)","Para Pagar":"var(--oc-pagar)","Completada":"var(--completada)","Cancelada":"var(--cancelada)"};
function esServicioOC(o){return o.items.length>0 && o.items.every(it=>String(it.cod).startsWith("SERV"))}
function estadoPorAvance(o){if(o.rec===100&&o.fac===100)return "Completada";if(o.rec===100)return "Para Pagar";if(o.fac===100)return "Para Recibir";return "Para Recibir y Pagar"}
const OCS={
 oc232:{id:"OC-000232",est:"Borrador",sol:"SOL-000029",solKey:"s29",prov:"TEXTIL SAN JACINTO SAC",provTipo:"Nacional",cond:"Crédito 30 días",mon:"S/.",tc:"3.75",
  fecha:"2026-07-19",valLog:false,valGer:false,rec:0,fac:0,ref:"",op:"",obs:"Tela negra para la producción de agosto (hereda SOL-000029).",
  items:[{cod:"MP-0013",nom:"TELA DENIM 12 OZ NEGRO",u:"MT",cant:150,pu:18.80,igv:18}],ca:{adu:0,nac:0,fle:0},docs:["Solicitud origen: SOL-000029 (bloqueada al validarse la OC)"]},
 oc230:{id:"OC-000230",est:"Pendiente de Validar",sol:"SOL-000028",solKey:"",prov:"AVÍOS DEL SUR EIRL",provTipo:"Nacional",cond:"Contado",mon:"S/.",tc:"3.75",
  fecha:"2026-07-18",valLog:true,valGer:false,rec:0,fac:0,ref:"Cotización AV-2026-118",op:"",obs:"Reposición de botones.",
  items:[{cod:"MP-0044",nom:"BOTON METALICO 17MM",u:"UND",cant:2000,pu:0.35,igv:18}],ca:{adu:0,nac:0,fle:0},docs:["Validada por Logística: pendiente Gerencia"]},
 oc231:{id:"OC-000231",est:"Para Pagar",sol:"SOL-000025",solKey:"",prov:"TEXTIL SAN JACINTO SAC",provTipo:"Nacional",cond:"Crédito 30 días",mon:"S/.",tc:"3.75",
  fecha:"2026-07-14",valLog:true,valGer:true,rec:100,fac:0,ref:"Cotización SJ-2198",op:"",obs:"Telas e hilo para producción Zuleika. Ingreso completo: falta factura y pagos.",
  items:[{cod:"MP-0012",nom:"TELA DENIM 12 OZ AZUL",u:"MT",cant:242.40,pu:19.40,igv:18,recq:242.40},{cod:"MP-0031",nom:"HILO POLIESTER AZUL",u:"UND",cant:12,pu:24.00,igv:18,recq:12}],
  ca:{adu:0,nac:0,fle:0},docs:["Ingreso vinculado: ING-000513 (15/07/2026, módulo GI)","Factura: pendiente (CO-10, Ola 5)"]},
 oc229:{id:"OC-000229",est:"Para Recibir y Pagar",sol:"SOL-000026",solKey:"",prov:"TEXTIL SAN JACINTO SAC",provTipo:"Nacional",cond:"Crédito 30 días",mon:"S/.",tc:"3.75",
  fecha:"2026-07-11",valLog:true,valGer:true,rec:50,fac:40,ref:"Cotización SJ-2211",op:"",obs:"Entrega en dos partes: primera recibida, factura parcial registrada.",
  items:[{cod:"MP-0012",nom:"TELA DENIM 12 OZ AZUL",u:"MT",cant:160,pu:19.40,igv:18,recq:80}],ca:{adu:0,nac:0,fle:0},
  docs:["Ingreso parcial vinculado: ING-000508 (80 KG, módulo GI)","Factura parcial: F212-00836 (40%)"]},
 oc227:{id:"OC-000227",est:"Para Recibir",sol:"SOL-000023",solKey:"",prov:"AVÍOS DEL SUR EIRL",provTipo:"Nacional",cond:"Contado",mon:"S/.",tc:"3.75",
  fecha:"2026-07-08",valLog:true,valGer:true,rec:0,fac:100,ref:"Cotización AV-2026-112",op:"",obs:"Factura completa con sus pagos: solo falta registrar el ingreso.",
  items:[{cod:"MP-0045",nom:"CIERRE METALICO 12CM",u:"UND",cant:1000,pu:0.80,igv:18}],ca:{adu:0,nac:0,fle:0},
  docs:["Factura vinculada: F441-00219 Pagada (100%)","Ingreso: pendiente de entrega del proveedor"]},
 oc219:{id:"OC-000219",est:"Para Recibir y Pagar",sol:"SOL-000022",solKey:"",prov:"YKK DO BRASIL LTDA",provTipo:"Internacional",cond:"Contado",mon:"USD",tc:"3.75",
  fecha:"2026-06-28",valLog:true,valGer:true,rec:0,fac:0,ref:"Proforma YKK-BR 88412",op:"",obs:"Importación de cierres YKK (embarque marítimo).",
  items:[{cod:"MP-0046",nom:"CIERRE YKK RC-045 12CM",u:"UND",cant:6000,pu:0.52,igv:0},{cod:"MP-0047",nom:"CIERRE YKK RM-030 15CM",u:"UND",cant:4000,pu:0.48,igv:0}],
  ca:{adu:180,nac:1120,fle:450},docs:["Ingreso: pendiente de llegada del embarque","Factura: Invoice YKK-BR 88412 (CO-10, Ola 5)"]},
 oc222:{id:"OC-000222",est:"Para Recibir y Pagar",sol:"SOL-000024",solKey:"",prov:"CONFECCIONES EL AGUILA SAC",provTipo:"Nacional",cond:"Crédito 15 días",mon:"S/.",tc:"3.75",
  fecha:"2026-07-01",valLog:true,valGer:true,rec:0,fac:0,ref:"Cotización EA-0090",op:"",obs:"Confección tercerizada. El servicio cierra por conformidad, sin ingreso a almacén.",
  items:[{cod:"SERV-0003",nom:"SERVICIO DE CONFECCION PANTALON",u:"UND",cant:120,pu:30.00,igv:18}],
  ca:{adu:0,nac:0,fle:0},docs:["OC de servicio: el envío y el retorno del material se registran en la Orden de Fabricación (Producción)"]},
 oc224:{id:"OC-000224",est:"Pendiente de Validar",sol:"OC directa",solKey:"",prov:"LAVANDERIA INDUSTRIAL DEL SUR SAC",provTipo:"Nacional",cond:"Crédito 15 días",mon:"S/.",tc:"3.75",
  fecha:"2026-07-12",valLog:true,valGer:false,rec:0,fac:0,ref:"Cotización LV-0187",op:"OF-000125",obs:"Servicio de teñido para la producción de agosto.",
  items:[{cod:"SERV-0006",nom:"SERVICIO DE TEÑIDO",u:"UND",cant:80,pu:12.00,igv:18}],ca:{adu:0,nac:0,fle:0},
  docs:["Vinculada a producción: OF-000125","Pendiente: aprobación de Gerencia"]},
 oc228:{id:"OC-000228",est:"Para Pagar",sol:"OC directa",solKey:"",prov:"LAVANDERIA INDUSTRIAL DEL SUR SAC",provTipo:"Nacional",cond:"Crédito 15 días",mon:"S/.",tc:"3.75",
  fecha:"2026-07-10",valLog:true,valGer:true,rec:100,fac:0,ref:"Cotización LV-0181",op:"OF-000122",obs:"Lavado stone wash de las 60 prendas en proceso de la OF-000122. Conformidad dada: falta factura y pagos.",
  items:[{cod:"SERV-0005",nom:"SERVICIO DE LAVADO INDUSTRIAL",u:"UND",cant:60,pu:23.00,igv:18}],ca:{adu:0,nac:0,fle:0},
  docs:["Vinculada a producción: OF-000122","Envío y retorno de las 60 prendas registrados en la OF-000122 (almacén de tránsito)","Conformidad del servicio: recepcionada conforme (14/07)","El costo del servicio se acumula en la OF-000122, no en el Kardex del material"]},
 oc226:{id:"OC-000226",est:"Completada",sol:"OC directa",solKey:"",prov:"TRANSPORTES GAMARRA EXPRESS SAC",provTipo:"Nacional",cond:"Contado",mon:"S/.",tc:"3.75",
  fecha:"2026-07-08",valLog:true,valGer:true,rec:100,fac:100,ref:"Cotización TG-0455",op:"",obs:"Flete Gamarra - Zárate (2 viajes). Servicio finalizado.",
  items:[{cod:"SERV-0009",nom:"SERVICIO DE FLETE LOCAL",u:"UND",cant:2,pu:180.00,igv:18}],ca:{adu:0,nac:0,fle:0},
  docs:["Conformidad del servicio: recepcionada conforme","Factura vinculada: F090-1122 Pagada"]},
 oc225:{id:"OC-000225",est:"Completada",sol:"SOL-000021",solKey:"",prov:"AVÍOS DEL SUR EIRL",provTipo:"Nacional",cond:"Contado",mon:"S/.",tc:"3.75",
  fecha:"2026-07-05",valLog:true,valGer:true,rec:100,fac:100,ref:"Cotización AV-2026-104",op:"",obs:"Botones y cierres metálicos.",
  items:[{cod:"MP-0044",nom:"BOTON METALICO 17MM",u:"UND",cant:500,pu:0.35,igv:18,recq:500},{cod:"MP-0045",nom:"CIERRE METALICO 12CM",u:"UND",cant:300,pu:0.80,igv:18,recq:300}],
  ca:{adu:0,nac:0,fle:0},docs:["Ingreso vinculado: ING-000502 (05/07/2026, módulo GI)","Factura vinculada: F441-00220 Pagada (CO-09, Ola 5)"]},
 oc221:{id:"OC-000221",est:"Para Recibir y Pagar",sol:"SOL-000027",solKey:"",prov:"AVÍOS DEL SUR EIRL",provTipo:"Nacional",cond:"Contado",mon:"S/.",tc:"3.75",
  fecha:"2026-06-30",valLog:true,valGer:true,rec:100,fac:100,ref:"Cotización AV-2026-115",op:"",obs:"Avíos para confección tercerizada.",
  items:[{cod:"MP-0032",nom:"HILO POLIESTER NEGRO",u:"UND",cant:8,pu:24.00,igv:18,recq:8},{cod:"MP-0044",nom:"BOTON METALICO 17MM",u:"UND",cant:600,pu:0.35,igv:18,recq:600}],
  ca:{adu:0,nac:0,fle:0},docs:["Avíos entregados al taller de confección"]},
 oc220:{id:"OC-000220",est:"Completada",sol:"SOL-000027",solKey:"",prov:"TEXTIL SAN JACINTO SAC",provTipo:"Nacional",cond:"Crédito 30 días",mon:"S/.",tc:"3.75",
  fecha:"2026-06-28",valLog:true,valGer:true,rec:100,fac:100,ref:"Cotización SJ-2185",op:"",obs:"Tela para confección tercerizada.",
  items:[{cod:"MP-0013",nom:"TELA DENIM 12 OZ NEGRO",u:"MT",cant:96,pu:18.80,igv:18,recq:96}],
  ca:{adu:0,nac:0,fle:0},docs:["Tela despachada directamente al taller (guía del proveedor)"]},
 oc216:{id:"OC-000216",est:"Completada",sol:"OC directa",solKey:"",prov:"CONFECCIONES EL AGUILA SAC",provTipo:"Nacional",cond:"Crédito 15 días",mon:"S/.",tc:"3.75",
  fecha:"2026-05-28",valLog:true,valGer:true,rec:100,fac:100,ref:"Cotización EA-0081",op:"",obs:"Confección tercerizada de polos.",
  items:[{cod:"SERV-0003",nom:"SERVICIO DE CONFECCION PANTALON",u:"UND",cant:240,pu:13.125,igv:18,recq:240}],
  ca:{adu:0,nac:0,fle:0},docs:["Conformidad del servicio registrada","Factura del proveedor: F556-00311 Pagada"]},
 oc215:{id:"OC-000215",est:"Completada",sol:"OC directa",solKey:"",prov:"TEXTIL SAN JACINTO SAC",provTipo:"Nacional",cond:"Crédito 30 días",mon:"S/.",tc:"3.75",
  fecha:"2026-05-20",valLog:true,valGer:true,rec:100,fac:100,ref:"Cotización SJ-2130",op:"",obs:"Tela jersey para confección tercerizada de polos.",
  items:[{cod:"MP-0018",nom:"TELA POPELINA BLANCA",u:"MT",cant:420,pu:6.50,igv:18,recq:420}],
  ca:{adu:0,nac:0,fle:0},docs:["Tela despachada al taller"]},
 oc214:{id:"OC-000214",est:"Completada",sol:"OC directa",solKey:"",prov:"LAVANDERIA INDUSTRIAL DEL SUR SAC",provTipo:"Nacional",cond:"Contado",mon:"S/.",tc:"3.75",
  fecha:"2026-06-02",valLog:true,valGer:true,rec:100,fac:100,ref:"Cotización LV-0170",op:"",obs:"Lavado y acabado de polos tercerizados.",
  items:[{cod:"SERV-0005",nom:"SERVICIO DE LAVADO INDUSTRIAL",u:"UND",cant:240,pu:2.50,igv:18,recq:240}],
  ca:{adu:0,nac:0,fle:0},docs:["Conformidad del servicio registrada"]},
 oc218:{id:"OC-000218",est:"Cancelada",sol:"SOL-000019",solKey:"",prov:"TEXTIL SAN JACINTO SAC",provTipo:"Nacional",cond:"Contado",mon:"S/.",tc:"3.75",
  fecha:"2026-06-25",valLog:true,valGer:false,rec:0,fac:0,ref:"Cotización SJ-2140",op:"",obs:"Cancelada el 26/06. Motivo: cambio de proveedor por plazo de entrega.",
  items:[{cod:"MP-0018",nom:"TELA POPELINA BLANCA",u:"MT",cant:100,pu:6.50,igv:18}],ca:{adu:0,nac:0,fle:0},
  docs:["Cancelada antes de la validación de Gerencia: sin efectos en stock ni facturas"]}
};
const OCS_ORDEN=["oc232","oc230","oc231","oc224","oc229","oc228","oc227","oc226","oc225","oc222","oc221","oc220","oc219","oc218","oc216","oc215","oc214"];
let OC=null, OCkey="";
function fmtM(n){return n.toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2})}
function ocTotales(o){
  let sub=0,igv=0;
  o.items.forEach(it=>{const st=it.cant*it.pu; sub+=st; igv+=st*(it.igv/100)});
  return {sub:sub,igv:igv,tot:sub+igv};
}
function renderOCS(){
  const q=(document.getElementById('f-oc-q').value||"").toLowerCase();
  const e=document.getElementById('f-oc-e').value, m=document.getElementById('f-oc-m').value;
  const soloImp=document.getElementById('f-oc-i').checked;
  const tb=document.getElementById('ocs-body'); tb.innerHTML=""; let n=0;
  OCS_ORDEN.forEach(k=>{
    const o=OCS[k]; if(!o)return;
    if(q && !(o.id.toLowerCase().includes(q)||sinTildes(o.prov).includes(sinTildes(q))))return;
    if(e && o.est!==e)return; if(m && o.mon!==m)return; if(soloImp && o.provTipo!=="Internacional")return;
    n++;
    const t=ocTotales(o);
    const full=(o.rec===100&&o.fac===100);
    const totalTxt=(o.mon==="USD")?("USD "+fmtM(t.tot)):("S/. "+fmtM(t.tot));
    let estCell='<span class="badge" style="background:'+OC_EST[o.est]+'">'+o.est+'</span>';
    const pct=(v,tip)=>'<td style="text-align:right;color:var(--confirmado);'+(v===100?'font-weight:700':'')+'" title="'+tip+'">'+v+'%</td>';
    const tr=document.createElement('tr'); tr.className="clickable"; tr.onclick=()=>loadOC(k);
    tr.innerHTML='<td>'+o.id+(o.provTipo==="Internacional"?' <span class="hint">IMPORTACIÓN</span>':'')+'</td><td>'+o.prov+'</td><td>'+o.mon+'</td>'+
     '<td style="text-align:right;'+(full?'color:var(--confirmado);font-weight:700':'')+'">'+totalTxt+'</td>'+
     '<td>'+estCell+'</td><td>'+o.fecha+'</td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();verSolDeOCk(\''+k+'\')">'+o.sol+'</button></td>'+
     pct(o.rec,"% recibido: según los ingresos vinculados a la OC")+pct(o.fac,"% facturado: según las facturas vinculadas a la OC")+
     '<td><button class="btn-link" onclick="event.stopPropagation();loadOC(\''+k+'\')">Abrir</button></td>';
    tb.appendChild(tr);
  });
  document.getElementById('ocs-count').textContent=n+" órdenes de compra";
}
function verSolDeOCk(k){const o=OCS[k]; if(o.solKey){loadSOL(o.solKey)}else if(o.sol==="OC directa"){toast("OC directa: sin solicitud de origen")}else{toast("Solicitud "+o.sol+" (ejemplo histórico)")}}
function nuevaOC(){
  OCS.oc233={id:"OC-000233",est:"Borrador",sol:"OC directa",solKey:"",prov:"",provTipo:"",cond:"Contado",mon:"S/.",tc:"3.75",
   fecha:"2026-07-19",valLog:false,valGer:false,rec:0,fac:0,ref:"",op:"",obs:"",items:[],ca:{adu:0,nac:0,fle:0},
   docs:["OC directa: creada sin solicitud de materiales"]};
  if(!OCS_ORDEN.includes("oc233"))OCS_ORDEN.unshift("oc233");
  renderOCS(); loadOC('oc233');
  toast("OC directa creada: seleccione proveedor y agregue ítems");
}
function verSolDeOC(){verSolDeOCk(OCkey)}
function loadOC(k){
  OCkey=k; OC=OCS[k];
  document.getElementById('oc-titulo').textContent="ORDEN DE COMPRA: "+OC.id+(OC.provTipo==="Internacional"?" · IMPORTACIÓN":"");
  document.getElementById('oc-id').value=OC.id;
  document.getElementById('oc-sol').value=OC.sol;
  document.getElementById('oc-prov').value=OC.prov+" ("+OC.provTipo+")";
  document.getElementById('oc-cond').value=OC.cond;
  document.getElementById('oc-mon').value=OC.mon;
  document.getElementById('oc-tc').value=OC.tc;
  document.getElementById('oc-fecha').value=OC.fecha;
  document.getElementById('oc-ref').value=OC.ref;
  document.getElementById('oc-op').value=OC.op||"";
  document.getElementById('oc-obs').value=OC.obs;
  document.getElementById('oc-ca-adu').value=OC.ca.adu;
  document.getElementById('oc-ca-nac').value=OC.ca.nac;
  document.getElementById('oc-ca-fle').value=OC.ca.fle;
  renderOC(); go('co07');
}
function renderOC(){
  const e=OC.est;
  const editable=(e==="Borrador"||e==="Pendiente de Validar"), ro=!editable;
  const b=document.getElementById('oc-badge'); b.textContent=e; b.style.background=OC_EST[e];
  const show=(id,v)=>document.getElementById(id).style.display=v?"inline-block":"none";
  show('oc-b-cancelar',editable); show('oc-b-guardar',editable);
  show('oc-b-enviar',e==="Borrador");
  show('oc-b-vallog',e==="Pendiente de Validar" && !OC.valLog);
  show('oc-b-valger',e==="Pendiente de Validar" && !OC.valGer);
  show('oc-b-crear',e==="Para Recibir y Pagar"||e==="Para Recibir"||e==="Para Pagar");
  ['oc-cond','oc-mon','oc-tc','oc-fecha','oc-ref','oc-op','oc-obs','oc-ca-adu','oc-ca-nac','oc-ca-fle'].forEach(id=>document.getElementById(id).disabled=ro);
  document.getElementById('oc-b-additem').style.display=editable?"inline-block":"none";
  document.getElementById('oc-b-prov').style.display=editable?"inline-block":"none";
  // panel de validaciones
  const val=document.getElementById('oc-val');
  if(e==="Pendiente de Validar"||e==="Para Recibir y Pagar"||e==="Para Recibir"||e==="Para Pagar"||e==="Completada"){
    val.style.display="block";
    document.getElementById('oc-val-log').innerHTML=OC.valLog?'Logística ✓ <span class="hint">(USER00)</span>':'Logística: <span style="color:var(--pendiente);font-weight:600">pendiente</span>';
    document.getElementById('oc-val-ger').innerHTML=OC.valGer?'Gerencia ✓ <span class="hint">(David)</span>':'Gerencia: <span style="color:var(--pendiente);font-weight:600">pendiente</span>';
  }else val.style.display="none";
  // avance numerico y conformidad
  const av=document.getElementById('oc-avance');
  if(e==="Para Recibir y Pagar"||e==="Para Recibir"||e==="Para Pagar"||e==="Completada"){
    av.style.display="block";
    document.getElementById('oc-pct-rec').textContent=OC.rec+"%";
    document.getElementById('oc-pct-fac').textContent=OC.fac+"%";
    document.getElementById('oc-pct-rec').style.color=(OC.rec===100)?"var(--confirmado)":"var(--texto)";
    document.getElementById('oc-pct-fac').style.color=(OC.fac===100)?"var(--confirmado)":"var(--texto)";
    document.getElementById('oc-conformidad').style.display=(esServicioOC(OC)&&OC.rec<100&&e!=="Completada")?"block":"none";
  }else av.style.display="none";
  renderOCitems();
  document.getElementById('oc-docs').innerHTML=OC.docs.map(d=>{
    d=d.replace("ING-000513",'<button class="btn-link" onclick="showDetalle(\'ing513\')">ING-000513</button>');
    d=d.replace("ING-000502",'<button class="btn-link" onclick="showDetalle(\'ing502\')">ING-000502</button>');
    return '<div style="padding:6px 0;border-bottom:1px solid var(--borde)">'+d+'</div>';
  }).join('');
}
function renderOCitems(){
  const e=OC.est, ro=!(e==="Borrador"||e==="Pendiente de Validar");
  const mon=document.getElementById('oc-mon').value, tc=parseFloat(document.getElementById('oc-tc').value)||0;
  document.getElementById('oc-items-head').innerHTML='<tr><th style="width:36px">#</th><th>Código</th><th>Nombre</th><th>Unidad</th><th style="width:90px;text-align:right">Cantidad</th><th style="width:110px;text-align:right">Precio unit.</th><th style="width:100px;text-align:right">Subtotal</th><th style="width:90px;text-align:right">IGV (auto)</th><th style="width:110px;text-align:right">Total</th><th style="width:50px"></th></tr>';
  const tb=document.getElementById('oc-items'); tb.innerHTML="";
  let sub=0,igvT=0;
  OC.items.forEach((it,i)=>{
    const st=it.cant*it.pu, igv=st*(it.igv/100); sub+=st; igvT+=igv;
    const cant=ro?('<td style="text-align:right">'+fmtM(it.cant)+'</td>'):'<td><input value="'+it.cant+'" style="text-align:right" oninput="ocItemInput('+i+',\'cant\',this)"></td>';
    const pu=ro?('<td style="text-align:right">'+fmtM(it.pu)+'</td>'):'<td><input value="'+it.pu+'" style="text-align:right" oninput="ocItemInput('+i+',\'pu\',this)"></td>';
    tb.innerHTML+='<tr><td>'+(i+1)+'</td><td>'+it.cod+'</td><td>'+it.nom+(String(it.cod).startsWith("SERV")?' <span class="hint">(no inventariable: cierra por conformidad)</span>':'')+'</td><td>'+it.u+'</td>'+cant+pu+
      '<td id="oc-st-'+i+'" style="text-align:right">'+fmtM(st)+'</td><td id="oc-igv-'+i+'" style="text-align:right">'+(it.igv>0?fmtM(igv)+' ('+it.igv+'%)':'0.00 <span class="hint">import.</span>')+'</td><td id="oc-tot-'+i+'" style="text-align:right;font-weight:600">'+fmtM(st+igv)+'</td>'+
      '<td>'+(ro?'':'<button class="btn-link" onclick="OC.items.splice('+i+',1);renderOCitems()">Eliminar</button>')+'</td></tr>';
  });
  if(!OC.items.length)tb.innerHTML='<tr><td colspan="10" style="text-align:center;color:var(--texto-sec);padding:16px">Sin ítems: use "+ Agregar ítem"</td></tr>';
  ocTotalesUI();
}
function ocItemInput(i,campo,el){
  OC.items[i][campo]=parseFloat(el.value)||0;
  const it=OC.items[i], st=it.cant*it.pu, igv=st*(it.igv/100);
  const c1=document.getElementById('oc-st-'+i), c2=document.getElementById('oc-igv-'+i), c3=document.getElementById('oc-tot-'+i);
  if(c1)c1.textContent=fmtM(st);
  if(c2)c2.innerHTML=(it.igv>0?fmtM(igv)+' ('+it.igv+'%)':'0.00 <span class="hint">import.</span>');
  if(c3)c3.textContent=fmtM(st+igv);
  ocTotalesUI();
}
function ocTotalesUI(){
  const mon=document.getElementById('oc-mon').value, tc=parseFloat(document.getElementById('oc-tc').value)||0;
  let sub=0,igvT=0;
  OC.items.forEach(it=>{const st=it.cant*it.pu; sub+=st; igvT+=st*(it.igv/100)});
  const tot=sub+igvT;
  const dual=(mon==="USD")?(' <span class="hint">· S/. '+fmtM(tot*tc)+' (TC '+tc+')</span>'):'';
  document.getElementById('oc-items-foot').innerHTML='<tr><td colspan="6" style="text-align:right;font-weight:600">Totales ('+mon+')</td>'+
   '<td style="text-align:right;font-weight:600">'+fmtM(sub)+'</td><td style="text-align:right;font-weight:600">'+fmtM(igvT)+'</td><td style="text-align:right;font-weight:700">'+fmtM(tot)+dual+'</td><td></td></tr>';
  const esImport=(OC.provTipo==="Internacional");
  document.getElementById('oc-costos').style.display=esImport?"block":"none";
  if(esImport){
    const ca=(parseFloat(document.getElementById('oc-ca-adu').value)||0)+(parseFloat(document.getElementById('oc-ca-nac').value)||0)+(parseFloat(document.getElementById('oc-ca-fle').value)||0);
    const factor=sub>0?(1+ca/sub):1;
    const cb=document.getElementById('oc-costos-body'); cb.innerHTML="";
    OC.items.forEach(it=>{
      cb.innerHTML+='<tr><td>'+it.cod+'</td><td>'+it.nom+'</td><td style="text-align:right">'+fmtM(it.pu)+'</td><td style="text-align:right;font-weight:600">S/. '+fmtM(it.pu*factor*tc)+'</td></tr>';
    });
    cb.innerHTML+='<tr><td colspan="4" class="hint">Estimación referencial: costos adicionales USD '+fmtM(ca)+' · Total desembolso estimado USD '+fmtM(sub+ca)+'. El costo real se aplica al Kardex con el Comprobante de Costos de Destino (CO-14), no desde esta OC.</td></tr>';
  }
}
function checkOCbase(){
  if(!OC.prov){toast("Debe seleccionar el proveedor (CT-09)");return false}
  if(!OC.items.length){toast("Agregue al menos un ítem a la OC");return false}
  if(OC.items.some(it=>!(it.pu>0))){toast("Asigne precio unitario a todos los ítems");return false}
  if(!(parseFloat(document.getElementById('oc-tc').value)>0)){toast("El Tipo de Cambio es obligatorio");return false}
  return true;
}
function enviarValidacionOC(){
  if(!checkOCbase())return;
  OC.est="Pendiente de Validar"; renderOC(); renderOCS();
  toast("OC enviada a validación: pendiente de Logística y Gerencia");
}
function validarLogOC(){
  OC.valLog=true;
  if(OC.valGer){completarValidacionOC()}else{renderOC();renderOCS();toast("Validada por Logística: pendiente la aprobación de Gerencia")}
}
function completarValidacionOC(){
  OC.est=estadoPorAvance(OC);
  OC.tc=document.getElementById('oc-tc').value;
  OC.cond=document.getElementById('oc-cond').value;
  OC.ref=document.getElementById('oc-ref').value;
  OC.op=document.getElementById('oc-op').value;
  renderOC(); renderOCS();
  toast("OC validada por Logística y Gerencia: "+OC.est+" · TC congelado · documento inmutable");
}
function ocMoneda(){
  const m=document.getElementById('oc-mon').value;
  if(m==="USD" && OC.provTipo!=="Internacional"){
    toast("USD requiere un proveedor Internacional (importación)");
    document.getElementById('oc-mon').value="S/.";
  }
  OC.mon=document.getElementById('oc-mon').value;
  renderOCitems();
}
function preAprobarOC(){
  if(!checkOCbase())return;
  openModal('m-co07a');
}
function aprobarOC(){
  closeModal('m-co07a');
  OC.valGer=true;
  if(OC.valLog){completarValidacionOC()}else{renderOC();renderOCS();toast("Aprobada por Gerencia: pendiente la validación de Logística")}
}
function cancelarOC(){
  const m=document.getElementById('oc-motivo-cancel').value.trim();
  if(!m){toast("El motivo de cancelación es obligatorio");return}
  closeModal('m-co07c');
  OC.est="Cancelada"; renderOC(); renderOCS();
  toast("OC cancelada. Si había servicio de terceros pendiente, el material retorna vía ingreso a almacén");
}
function conformidadOC(conforme){
  if(conforme){
    OC.rec=100; OC.est=estadoPorAvance(OC); renderOC(); renderOCS();
    toast("Servicio recepcionado conforme: sin ingreso a almacén · "+OC.est);
  }else{
    nuevoRec(OCkey);
    toast("Recepcionada con observaciones: registre el reclamo con el detalle de lo observado");
  }
}

/* ===== CO-07 · Agregar ítem a la orden y crear su ingreso ===== */
function openBuscadorOC(){
  const g=document.getElementById('oc-it-g');
  g.innerHTML='<option value="">Todos</option>'+TIPOS.map(t=>'<option>'+t.nom+'</option>').join('');
  document.getElementById('oc-it-q').value="";
  renderBuscarOC(); openModal('m-oc-item');
}
function renderBuscarOC(){
  const q=(document.getElementById('oc-it-q').value||"").toLowerCase();
  const fg=document.getElementById('oc-it-g').value;
  const tb=document.getElementById('oc-it-body'); tb.innerHTML="";
  ARTICULOS.filter(a=>a.e==="Activo" && a.compra).forEach(a=>{
    if(OC.items.some(it=>it.cod===a.id))return;
    if(fg && a.t!==fg)return;
    if(q && !(a.id.toLowerCase().includes(q)||sinTildes(a.n).includes(sinTildes(q))))return;
    const pu=Number((typeof COSTO_REF!=='undefined' && COSTO_REF[a.id])||0);
    tb.innerHTML+='<tr><td>'+a.id+'</td><td>'+a.n+'</td><td>'+a.u+'</td>'+
     '<td style="text-align:right">'+(pu?fmtM(pu):'<span class="hint">-</span>')+'</td>'+
     '<td><button class="btn btn-primary btn-sm" onclick="ocAddItem(\''+a.id+'\')">Agregar</button></td></tr>';
  });
  if(!tb.innerHTML)tb.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:14px">Sin resultados (o ya están en la orden)</td></tr>';
}
function ocAddItem(cod){
  const a=ARTICULOS.find(x=>x.id===cod); if(!a)return;
  const pu=Number((typeof COSTO_REF!=='undefined' && COSTO_REF[a.id])||0);
  OC.items.push({cod:a.id,nom:a.n,u:a.u,cant:1,pu:pu,igv:18});
  closeModal('m-oc-item'); renderOCitems();
  toast("Ítem agregado: ajuste la cantidad y el precio de la línea");
}
function crearIngresoDesdeOC(){
  const menu=document.getElementById('oc-crear-menu'); if(menu)menu.classList.remove('open');
  if(!OC){toast("Abra primero una orden de compra");return}
  if(OC.est==="Borrador"){toast("La orden todavía está en Borrador: confírmela antes de registrar su ingreso");return}
  /* GI-09 precargado contra esta OC: registra la llegada física de lo comprado */
  const nd=document.getElementById('gi09-ndoc'); if(nd)nd.value=OC.id;
  const org=document.getElementById('gi09-origen'); if(org)org.value=OC.prov;
  const obs=document.getElementById('gi09-obs');
  if(obs)obs.value="Ingreso contra "+OC.id+". Las diferencias frente a lo pedido quedan registradas aquí.";
  const tb=document.getElementById('gi09-items');
  if(tb){
    tb.innerHTML="";
    OC.items.filter(it=>!String(it.cod).startsWith("SERV")).forEach((it,i)=>{
      tb.innerHTML+='<tr><td>'+(i+1)+'</td><td>'+it.cod+'</td><td>'+it.nom+'</td><td>'+it.u+'</td>'+
       '<td><input value="'+it.cant+'" style="text-align:right"></td>'+
       '<td><input value="'+Number(it.pu).toFixed(2)+'" style="text-align:right"></td>'+
       '<td><span class="hint">auto</span></td>'+
       '<td><button class="btn-link" onclick="this.closest(\'tr\').remove()">Eliminar</button></td></tr>';
    });
  }
  go('gi09');
  toast("Ingreso precargado desde "+OC.id+": confirme cantidades recibidas y regístrelo");
}
