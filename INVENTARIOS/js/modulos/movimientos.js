/* INVENTARIOS · GI-07 Movimientos, GI-08 detalle y notas internas (NI/NS/NT) */
/* ===== GI-08 · detalle dinámico ===== */
const DETALLES={
 ing513:{titulo:"MOVIMIENTO: INGRESO",estado:"Confirmado",color:"var(--confirmado)",tdoc:"Ingreso",tmovL:"Tipo de ingreso",tmov:"Compras Directas",refetq:"REF-2026-0009",
  id:"ING-000513",user:"USER00 · Logística",ndoc:"OC-000231 (vinculado)",fecha:"15/07/2026",oriL:"Origen",ori:"Proveedor · TEXTIL SAN JACINTO SAC",
  almL:"Almacén destino",alm:"SB-ALM-MPT · MP Telas",obs:"Recepción conforme contra OC-000231.",sistema:false,
  head:'<tr><th style="width:40px">#</th><th>Código</th><th>Nombre</th><th>Unidad</th><th style="text-align:right">Cantidad</th><th style="text-align:right">Precio base S/.</th><th>Lote</th></tr>',
  rows:'<tr><td>1</td><td>MP-0012</td><td>TELA DENIM 12 OZ AZUL</td><td>MT</td><td style="text-align:right">242.40</td><td style="text-align:right">19.40</td><td>LOT-2026-0134</td></tr>'+
       '<tr><td>2</td><td>MP-0031</td><td>HILO POLIESTER AZUL</td><td>KG</td><td style="text-align:right">12.00</td><td style="text-align:right">24.00</td><td>LOT-2026-0135</td></tr>',
  foot:'<tr><td colspan="4" style="text-align:right;font-weight:600">Totales</td><td style="text-align:right;font-weight:600">254.40</td><td style="text-align:right;font-weight:600">S/. 4,990.56</td><td></td></tr>'},
 sal392:{titulo:"MOVIMIENTO: SALIDA",estado:"Completada",color:"var(--completada)",tdoc:"Salida",tmovL:"Tipo de salida",tmov:"Venta al por mayor",
  id:"SAL-000392",user:"USER00 · Logística (ejecutor)",ndoc:"F001-002341 (vinculada)",fecha:"19/07/2026",oriL:"Almacén origen",ori:"SB-ALM-PT · Central Mercadería",
  almL:"Destino",alm:"Cliente · COMERCIAL ANDINA SAC",obs:"Entrega parcial: pendiente 2 UND talla 28 por stock insuficiente.",sistema:false,
  head:'<tr><th style="width:40px">#</th><th>Código</th><th>Nombre</th><th>Unidad</th><th style="text-align:right">Cant. solicitada</th><th style="text-align:right">Entregado</th><th style="text-align:right">Pendiente</th><th>Lote</th></tr>',
  rows:'<tr><td>1</td><td>ART-0001-28AZ</td><td>PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL</td><td>UND</td><td style="text-align:right">40</td><td style="text-align:right">38</td><td style="text-align:right;color:var(--pendiente);font-weight:600">2</td><td>REF-2026-0009</td></tr>'+
       '<tr><td>2</td><td>ART-0001-30AZ</td><td>PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL</td><td>UND</td><td style="text-align:right">4</td><td style="text-align:right">4</td><td style="text-align:right">0</td><td>REF-2026-0011</td></tr>',
  foot:'<tr><td colspan="4" style="text-align:right;font-weight:600">Totales</td><td style="text-align:right;font-weight:600">44</td><td style="text-align:right;font-weight:600">42</td><td style="text-align:right;font-weight:600">2</td><td></td></tr>'},
 ing502:{titulo:"MOVIMIENTO: INGRESO",estado:"Confirmado",color:"var(--confirmado)",tdoc:"Ingreso",tmovL:"Tipo de ingreso",tmov:"Compras Directas",
  id:"ING-000502",user:"USER00 · Logística",ndoc:"OC-000225 (vinculado)",fecha:"05/07/2026",oriL:"Origen",ori:"Proveedor · AVÍOS DEL SUR EIRL",
  almL:"Almacén destino",alm:"SB-ALM-MPA · MP Avíos",obs:"Recepción de avíos conforme.",sistema:false,
  head:'<tr><th style="width:40px">#</th><th>Código</th><th>Nombre</th><th>Unidad</th><th style="text-align:right">Cantidad</th><th style="text-align:right">Precio base S/.</th><th>Lote</th></tr>',
  rows:'<tr><td>1</td><td>MP-0044</td><td>BOTON METALICO 17MM</td><td>UND</td><td style="text-align:right">500</td><td style="text-align:right">0.35</td><td><span class="hint">No aplica</span></td></tr>'+
       '<tr><td>2</td><td>MP-0045</td><td>CIERRE METALICO 12CM</td><td>UND</td><td style="text-align:right">300</td><td style="text-align:right">0.80</td><td><span class="hint">No aplica</span></td></tr>',
  foot:'<tr><td colspan="4" style="text-align:right;font-weight:600">Totales</td><td style="text-align:right;font-weight:600">800</td><td style="text-align:right;font-weight:600">S/. 415.00</td><td></td></tr>'},
 sal387:{titulo:"MOVIMIENTO: SALIDA",estado:"Completada",color:"var(--completada)",tdoc:"Salida (documento de sistema · solo lectura)",tmovL:"Tipo de salida",tmov:"Venta al por menor",
  id:"SAL-000387",user:"Sistema · POS Tienda Gamarra 1",ndoc:"BV-004512",fecha:"14/07/2026",oriL:"Almacén origen",ori:"SB-TDA-01 · Tienda Gamarra 1",
  almL:"Destino",alm:"Cliente venta tienda",obs:"Generado automáticamente por la venta en tienda.",sistema:true,
  head:'<tr><th style="width:40px">#</th><th>Código</th><th>Nombre</th><th>Unidad</th><th style="text-align:right">Cantidad</th><th>Lote</th></tr>',
  rows:'<tr><td>1</td><td>ART-0001-28AZ</td><td>PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL</td><td>UND</td><td style="text-align:right">3</td><td>REF-2026-0009</td></tr>',
  foot:'<tr><td colspan="4" style="text-align:right;font-weight:600">Total</td><td style="text-align:right;font-weight:600">3</td><td></td></tr>'}
};
function showDetalle(k){
  const d=DETALLES[k];
  DET_ACTUAL=k;
  const bn=document.getElementById('d8-nota');
  if(bn)bn.style.display=(d.estado==="Confirmado"||d.estado==="Completada")?"inline-block":"none";
  document.getElementById('d8-title').textContent=d.titulo;
  const b=document.getElementById('d8-estado'); b.textContent=d.estado; b.style.background=d.color;
  document.getElementById('d8-id').value=d.id;
  document.getElementById('d8-user').value=d.user;
  document.getElementById('d8-tdoc').value=d.tdoc;
  document.getElementById('d8-tmov-l').textContent=d.tmovL;
  document.getElementById('d8-tmov').value=d.tmov;
  document.getElementById('d8-ndoc').value=d.ndoc;
  document.getElementById('d8-fecha').value=d.fecha;
  document.getElementById('d8-ori-l').textContent=d.oriL;
  document.getElementById('d8-ori').value=d.ori;
  document.getElementById('d8-alm-l').textContent=d.almL;
  document.getElementById('d8-alm').value=d.alm;
  document.getElementById('d8-obs').value=d.obs;
  const fldRef=document.getElementById('d8-fld-ref');
  if(fldRef){
    const esIngreso=(d.tdoc==='Ingreso');
    fldRef.style.display=esIngreso?'flex':'none';
    document.getElementById('d8-refetq').value=d.refetq||'';
    const l8=document.getElementById('lbl-refetq-08');
    if(l8)l8.textContent=CFG.nombreEtiqueta;
  }
  document.getElementById('d8-origenlink').style.display=d.sistema?"inline-block":"none";
  document.getElementById('d8-tabla').innerHTML="<thead>"+d.head+"</thead><tbody>"+d.rows+"</tbody><tfoot>"+d.foot+"</tfoot>";
  go('gi08');
}

/* ===== Notas internas de movimiento (NI/NS/NT) ===== */
const SERIES={
 NI:{nom:"Nota de Ingreso Interna",prox:46,desde:"Ingreso Confirmado (GI-08)"},
 NS:{nom:"Nota de Salida Interna",prox:81,desde:"Salida Confirmada / Completada (GI-08)"},
 NT:{nom:"Nota de Transferencia entre Almacenes",prox:23,desde:"Transferencia Aprobada / En tránsito (GI-11)"}};
const NOTAS={}; /* movimiento -> numero asignado (idempotente) */
let DET_ACTUAL="ing513";
function renderSeries(){
  const tb=document.getElementById('series-body'); tb.innerHTML="";
  Object.keys(SERIES).forEach(k=>{
    const d=SERIES[k];
    tb.innerHTML+='<tr><td>'+d.nom+'</td><td><b>'+k+'-</b></td>'+
     '<td><input value="'+String(d.prox).padStart(6,"0")+'" style="text-align:right" oninput="SERIES[\''+k+'\'].prox=parseInt(this.value)||'+d.prox+'"></td>'+
     '<td class="hint">'+d.desde+'</td></tr>';
  });
}
const SERIES_GRE=[
 ["T001","00000915","SB-ALM-PT · Central Mercadería (Gamarra)"],
 ["T002","00000388","SB-ALM-MPT · MP Telas (Gamarra)"],
 ["T003","00000241","SB-ALM-MPA · MP Avíos (Gamarra)"],
 ["T004","00000162","SB-ALM-TRN · Almacén Transición (Zárate)"],
 ["T005","00000097","SB-TDA-01 · Tienda Gamarra 1"]];
function renderSeriesGRE(){
  const tb=document.getElementById('series-gre-body'); if(!tb)return;
  tb.innerHTML=SERIES_GRE.map(x=>'<tr><td>Guía de Remisión Electrónica</td><td><b>'+x[0]+'-</b></td>'+
   '<td style="text-align:right"><span style="color:var(--texto-sec)">'+x[1]+'</span> <span class="hint">(auto SUNAT)</span></td>'+
   '<td class="hint">'+x[2]+'</td></tr>').join('');
}
function notaNumero(serie,clave){
  if(NOTAS[clave])return NOTAS[clave];
  const n=serie+"-"+String(SERIES[serie].prox).padStart(6,"0");
  SERIES[serie].prox++; NOTAS[clave]=n; renderSeries();
  return n;
}
function imprimirNota(ctx){
  let serie,tipoTxt,clave,fecha,mov,oriL,ori,desL,des,doc,obs,tabla;
  if(ctx==="gi08"){
    const d=DETALLES[DET_ACTUAL];
    const esIngreso=d.tdoc.startsWith("Ingreso");
    serie=esIngreso?"NI":"NS";
    tipoTxt=esIngreso?"NOTA DE INGRESO INTERNA":"NOTA DE SALIDA INTERNA";
    clave=d.id; fecha=d.fecha; mov=d.id+" · "+d.tmov;
    oriL=d.oriL; ori=d.ori; desL=d.almL; des=d.alm; doc=d.ndoc; obs=d.obs;
    tabla="<thead>"+d.head+"</thead><tbody>"+d.rows+"</tbody>";
  }else if(ctx==="trf"){
    serie="NT"; tipoTxt="NOTA DE TRANSFERENCIA ENTRE ALMACENES";
    clave="TRF-000221"; fecha="19/07/2026"; mov="TRF-000221 · Transferencia interna";
    oriL="Almacén origen"; ori=TRF.origen||document.getElementById('trf-origen').value;
    desL="Almacén destino"; des=TRF.destino||document.getElementById('trf-destino').value;
    doc="-"; obs="La mercadería viaja con esta nota; los lotes/cortes se conservan idénticos en destino.";
    tabla='<thead><tr><th>#</th><th>Código</th><th>Nombre</th><th>Unidad</th><th style="text-align:right">Cant. enviada</th><th>Lote / N° Referencia</th></tr></thead><tbody>'+
      TRF.lines.map((l,i)=>'<tr><td>'+(i+1)+'</td><td>'+l.cod+'</td><td>'+l.nom+'</td><td>'+l.u+'</td><td style="text-align:right">'+l.env+'</td><td>'+l.lote+'</td></tr>').join('')+'</tbody>';
  }
  const num=notaNumero(serie,clave);
  document.getElementById('nota-mtitle').textContent=SERIES[serie].nom+" · "+num;
  document.getElementById('nota-tipo').textContent=tipoTxt;
  document.getElementById('nota-num').textContent=num;
  document.getElementById('nota-fecha').textContent=fecha;
  document.getElementById('nota-mov').textContent=mov;
  document.getElementById('nota-ori-l').textContent=oriL; document.getElementById('nota-ori').textContent=ori;
  document.getElementById('nota-des-l').textContent=desL; document.getElementById('nota-des').textContent=des;
  document.getElementById('nota-doc').textContent=doc;
  document.getElementById('nota-obs').textContent=obs||"-";
  document.getElementById('nota-tabla').innerHTML=tabla;
  openModal('m-nota');
  toast(NOTAS[clave]===num?("Nota "+num+" del movimiento "+clave+" (el correlativo se asigna una sola vez)"):"");
}

/* ===== GI-07 · movimientos con filtros activos ===== */
const EST_MOV={"Borrador":"var(--borrador)","Confirmado":"var(--confirmado)","Completada":"var(--completada)","Aprobada / En tránsito":"var(--aprobada)","Recibida parcial":"var(--parcial)","Cancelada":"var(--cancelada)"};
const MOV=[
 {id:"SAL-000392",tipo:"Salida",det:"Salida - Venta al por mayor",ndoc:"F001-002341",fecha:"19/07/2026",od:"SB-ALM-PT → COMERCIAL ANDINA SAC",alms:["SB-ALM-PT"],est:"Completada",click:()=>showDetalle('sal392')},
 {id:"ING-000513",tipo:"Ingreso",det:"Ingreso - Compras Directas (telas)",ndoc:"OC-000231",fecha:"15/07/2026",od:"TEXTIL SAN JACINTO → SB-ALM-MPT",alms:["SB-ALM-MPT"],est:"Confirmado",click:()=>showDetalle('ing513')},
 {id:"SAL-000387",tipo:"Salida",det:"Salida - Venta al por menor <span class='hint'>(Sistema · solo lectura)</span>",ndoc:"BV-004512",fecha:"14/07/2026",od:"SB-TDA-01 → Cliente",alms:["SB-TDA-01"],est:"Completada",click:()=>showDetalle('sal387')},
 {id:"ING-000509",tipo:"Ingreso",det:"Ingreso - Recibo de producción (PT) <span class='hint'>(Sistema · solo lectura)</span>",ndoc:"OF-000122",fecha:"14/07/2026",od:"Producción → SB-ALM-PT",alms:["SB-ALM-PT"],est:"Confirmado",click:()=>showDetalle('ing513')},
 {id:"TRF-000214",tipo:"Transferencia",det:"Transferencia interna (PT a tienda)",ndoc:"-",fecha:"13/07/2026",od:"SB-ALM-PT → SB-TDA-01",alms:["SB-ALM-PT","SB-TDA-01"],est:"Aprobada / En tránsito",click:()=>go('gi11')},
 {id:"ING-000501",tipo:"Ingreso",det:"Ingreso - Devoluciones de Clientes (PT)",ndoc:"NC-000021",fecha:"12/07/2026",od:"Cliente → SB-ALM-PT",alms:["SB-ALM-PT"],est:"Borrador",click:()=>go('gi09')},
 {id:"TRF-000211",tipo:"Transferencia",det:"Transferencia interna (PT a tienda)",ndoc:"-",fecha:"11/07/2026",od:"SB-ALM-PT → SB-TDA-02",alms:["SB-ALM-PT","SB-TDA-02"],est:"Recibida parcial",click:()=>toast('Ejemplo visual · Recibida parcial: pendiente 5 UND por confirmar o cancelar')},
 {id:"TRF-000209",tipo:"Transferencia",det:"Transferencia interna (mercadería entre tiendas)",ndoc:"-",fecha:"08/07/2026",od:"SB-TDA-01 → SB-TDA-02",alms:["SB-TDA-01","SB-TDA-02"],est:"Completada",click:()=>toast('Ejemplo visual · Transferencia cerrada')},
 {id:"ING-000502",tipo:"Ingreso",det:"Ingreso - Compras Directas (avíos)",ndoc:"OC-000225",fecha:"05/07/2026",od:"AVÍOS DEL SUR → SB-ALM-MPA",alms:["SB-ALM-MPA"],est:"Confirmado",click:()=>showDetalle('ing502')},
 {id:"SAL-000375",tipo:"Salida",det:"Salida - Muestras gratuitas (PT)",ndoc:"-",fecha:"04/07/2026",od:"SB-ALM-PT → Showroom",alms:["SB-ALM-PT"],est:"Cancelada",click:()=>toast('Documento cancelado en Borrador: sin efecto en stock')},
 {id:"ING-000488",tipo:"Ingreso",det:"Ingreso - Devoluciones de Clientes (PT)",ndoc:"NC-000018",fecha:"03/07/2026",od:"Cliente → SB-ALM-PT",alms:["SB-ALM-PT"],est:"Confirmado",click:()=>showDetalle('ing513')}
];
function renderMov(){
  const a=document.getElementById('f-mov-a').value;
  const t=document.getElementById('f-mov-t').value;
  const e=document.getElementById('f-mov-e').value;
  const tb=document.getElementById('mov-body'); tb.innerHTML=""; let n=0;
  MOV.forEach(m=>{
    if(a && !m.alms.includes(a))return;
    if(t && m.tipo!==t)return;
    if(e && m.est!==e)return;
    n++;
    const tr=document.createElement('tr'); tr.className="clickable"; tr.onclick=m.click;
    tr.innerHTML='<td>'+m.id+'</td><td>'+m.det+'</td><td>'+m.ndoc+'</td><td>'+m.fecha+'</td><td>'+m.od+'</td>'+
     '<td><span class="badge" style="background:'+EST_MOV[m.est]+'">'+m.est+'</span></td>'+
     '<td><button class="btn-link">⋯</button></td>';
    tb.appendChild(tr);
  });
  document.getElementById('mov-count').textContent=n+" movimientos";
}
