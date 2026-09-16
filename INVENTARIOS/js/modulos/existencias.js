/* INVENTARIOS · GI-05 Existencias y lotes */
/* ===== GI-05 modal lotes ===== */
const LOTES={
 tela_az:{t:"TELA DENIM 12 OZ AZUL",s:"SB-ALM-MPT · MP Telas",u:"MT",vence:false,rows:[["LOT-2026-0107","02/06/2026",120.00,120.00,""],["LOT-2026-0121","28/06/2026",162.40,162.40,""]]},
 tela_ng:{t:"TELA DENIM 12 OZ NEGRO",s:"SB-ALM-MPT · MP Telas",u:"MT",rows:[["LOT-2026-0115","12/06/2026",96.00,96.00]]},
 hilo_az:{t:"HILO POLIESTER AZUL",s:"SB-ALM-MPA · MP Avíos",u:"UND",vence:true,rows:[["LOT-2026-0098","20/05/2026",15,15,"20/05/2028"],["LOT-2026-0110","05/06/2026",30,30,"05/06/2028"]]},
 z28:{t:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",s:"SB-ALM-PT · Central Mercadería",u:"UND",rows:[["LOT-2026-0209","15/06/2026",50,28],["LOT-2026-0212","10/07/2026",30,12]]},
 z30:{t:"PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL",s:"SB-ALM-PT · Central Mercadería",u:"UND",rows:[["LOT-2026-0211","15/06/2026",12,12]]},
 z28t:{t:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",s:"SB-TDA-01 · Tienda Gamarra 1",u:"UND",rows:[["LOT-2026-0209","20/06/2026",9,9]]}
};
function showLotes(k){
  const d=LOTES[k];
  document.getElementById('lotes-title').textContent="Lotes disponibles - "+d.t;
  document.getElementById('lotes-sub').textContent=d.s;
  const fmtL=v=>(d.u==="UND")?v:Number(v).toFixed(2);
  const vence=!!d.vence;
  document.getElementById('lotes-head').innerHTML='<tr><th>Código</th><th>Fecha de ingreso</th>'+
    (vence?'<th>Fecha de vencimiento</th>':'')+
    '<th style="text-align:right">Cantidad inicial</th><th style="text-align:right">Disponible</th><th style="width:120px">Acciones</th></tr>';
  const tb=document.getElementById('lotes-body'); tb.innerHTML="";
  let totIni=0, totDisp=0;
  d.rows.forEach(r=>{
    totIni+=r[2]; totDisp+=r[3];
    tb.innerHTML+='<tr><td>'+r[0]+'</td><td>'+r[1]+'</td>'+
     (vence?('<td>'+(r[4]||'<span class="hint">-</span>')+'</td>'):'')+
     '<td style="text-align:right">'+fmtL(r[2])+' '+d.u+'</td>'+
     '<td style="text-align:right;font-weight:600">'+fmtL(r[3])+' '+d.u+'</td>'+
     '<td><button class="btn-link" onclick="showTraza(\''+r[0]+'\')">Trazabilidad</button></td></tr>';
  });
  const st=STOCK.find(x=>x.art===d.t&&x.alm===d.s);
  const cuadra=st && Math.abs(st.real-totDisp)<0.01;
  tb.innerHTML+='<tr style="background:#F7FAFC"><td colspan="'+(vence?3:2)+'" style="text-align:right;font-weight:600">TOTAL</td>'+
   '<td style="text-align:right;font-weight:600">'+fmtL(totIni)+' '+d.u+'</td>'+
   '<td style="text-align:right;font-weight:700">'+fmtL(totDisp)+' '+d.u+
   (st?' <span class="hint" title="Stock Actual del artículo en este almacén: '+fmtL(st.real)+' '+d.u+'">'+(cuadra?"✓ cuadra con el stock":"⚠ no cuadra")+'</span>':'')+'</td><td></td></tr>';
  openModal('m-lotes');
}
/* Trazabilidad de lote y N° Referencia (modal sobre modal) */
const TRAZAS={
 "LOT-2026-0107":{tipo:"Lote de materia prima",art:"TELA DENIM 12 OZ AZUL",proceso:"Ingreso por compra",doc:"OC-000225 · TEXTIL SAN JACINTO SAC",mov:"ING-000502",fecha:"02/06/2026",cant:"120.00 MT",destino:"SB-ALM-MPT · MP Telas",modulo:"co"},
 "LOT-2026-0121":{tipo:"Lote de materia prima",art:"TELA DENIM 12 OZ AZUL",proceso:"Ingreso por compra",doc:"OC-000231 · TEXTIL SAN JACINTO SAC",mov:"ING-000513",fecha:"28/06/2026",cant:"162.40 MT",destino:"SB-ALM-MPT · MP Telas",modulo:"co"},
 "LOT-2026-0115":{tipo:"Lote de materia prima",art:"TELA DENIM 12 OZ NEGRO",proceso:"Ingreso por compra",doc:"OC-000220 · TEXTIL SAN JACINTO SAC",mov:"ING-000509",fecha:"12/06/2026",cant:"96.00 MT",destino:"SB-ALM-MPT · MP Telas",modulo:"co"},
 "LOT-2026-0098":{tipo:"Lote de materia prima",art:"HILO POLIESTER AZUL",proceso:"Ingreso por compra",doc:"OC-000218 · AVÍOS DEL SUR EIRL",mov:"ING-000497",fecha:"20/05/2026",cant:"15.00 KG",destino:"SB-ALM-MPA · MP Avíos",modulo:"co"},
 "LOT-2026-0110":{tipo:"Lote de materia prima",art:"HILO POLIESTER AZUL",proceso:"Ingreso por compra",doc:"OC-000227 · AVÍOS DEL SUR EIRL",mov:"ING-000505",fecha:"05/06/2026",cant:"30.00 KG",destino:"SB-ALM-MPA · MP Avíos",modulo:"co"},
 "LOT-2026-0209":{opk:"op123",tipo:"Lote de producto terminado",art:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",proceso:"Ingreso por producción",doc:"OF-000123 · N° Referencia 0009 (finalizada)",mov:"ING-000495",fecha:"15/06/2026",cant:"50 UND",destino:"SB-ALM-PT · Central Mercadería",modulo:"gp"},
 "LOT-2026-0212":{opk:"",tipo:"Lote de producto terminado",art:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",proceso:"Ingreso por producción",doc:"Lote 0012 · (anterior al sistema: sin OF registrada)",mov:"ING-000509",fecha:"10/07/2026",cant:"30 UND",destino:"SB-ALM-PT · Central Mercadería",modulo:"gp"},
 "LOT-2026-0211":{opk:"op124",tipo:"Lote de producto terminado",art:"PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL",proceso:"Ingreso por producción",doc:"OF-000124 · N° Referencia 0011 (finalizada)",mov:"ING-000496",fecha:"15/06/2026",cant:"12 UND",destino:"SB-ALM-PT · Central Mercadería",modulo:"gp"}
};
function showTraza(cod){
  const t=TRAZAS[cod];
  if(!t){toast("Sin registro de trazabilidad para "+cod+" en este prototipo");return}
  const esPT=t.modulo==="gp";
  document.getElementById('traza-title').textContent="Trazabilidad";
  document.getElementById('traza-head').style.background=esPT?"var(--confirmado)":"var(--primario)";
  document.getElementById('traza-tipo').textContent=t.tipo;
  document.getElementById('traza-cod').textContent=cod;
  document.getElementById('traza-art').textContent=t.art;
  const celda=(lbl,val)=>'<div style="padding:9px 0;border-bottom:1px solid var(--borde)"><span class="hint" style="font-size:11px;text-transform:uppercase;letter-spacing:.4px">'+lbl+'</span><br><span style="font-size:13px">'+val+'</span></div>';
  document.getElementById('traza-grid').innerHTML=
    celda("Fecha de ingreso",t.fecha)+celda("Cantidad ingresada",'<b>'+t.cant+'</b>')+
    celda("Movimiento",t.mov)+celda("Almacén de destino",t.destino);
  document.getElementById('traza-origen').innerHTML=
    '<span class="hint" style="font-size:11px;text-transform:uppercase;letter-spacing:.4px">'+t.proceso+'</span><br>'+
    '<b style="font-size:14px">'+t.doc.split(" · ")[0]+'</b><br>'+
    '<span style="font-size:12.5px;color:var(--texto-sec)">'+(t.doc.split(" · ")[1]||"")+'</span>';
  const btn=document.getElementById('traza-btn');
  if(t.modulo==="co"){btn.textContent="Ver la compra (módulo CO)";btn.onclick=()=>window.location.href="../COMPRAS/index.html#co06"}
  else{btn.textContent="Ver la orden de fabricación (módulo Producción)";btn.onclick=()=>window.location.href="../PRODUCCION/index.html#pr01"}
  openModal('m-traza');
}

/* ===== GI-05 · datos y render de existencias ===== */
const STOCK=[
 {alm:"SB-ALM-MPT · MP Telas",art:"TELA DENIM 12 OZ AZUL",u:"MT",real:282.40,res:20.00,esp:150.00,sem:"ok",lot:"tela_az",t:"MATERIA PRIMA",c:"TELAS",sc:""},
 {alm:"SB-ALM-MPT · MP Telas",art:"TELA DENIM 12 OZ NEGRO",u:"MT",real:96.00,res:0,esp:0,sem:"ok",lot:"tela_ng",t:"MATERIA PRIMA",c:"TELAS",sc:""},
 {alm:"SB-ALM-MPT · MP Telas",art:"TELA POPELINA BLANCA",u:"MT",real:12.50,res:0,esp:80.00,sem:"bajo",lot:null,t:"MATERIA PRIMA",c:"TELAS",sc:""},
 {alm:"SB-ALM-MPA · MP Avíos",art:"HANG TAG SARA DENIM",u:"UND",real:500,res:0,esp:0,sem:"ok",lot:null,t:"MATERIA PRIMA",c:"AVÍOS DE ACABADOS - PRINCIPALES",sc:"HANG TAG"},
 {alm:"SB-ALM-MPA · MP Avíos",art:"BOLSA BRILLO 30X40",u:"UND",real:1200,res:0,esp:0,sem:"ok",lot:null,t:"MATERIA PRIMA",c:"AVÍOS DE ACABADOS - PRINCIPALES",sc:"BOLSA BRILLO"},
 {alm:"SB-ALM-MPA · MP Avíos",art:"HILO POLIESTER NEGRO",u:"CONO",real:0,res:0,esp:25.00,sem:"cero",lot:null,t:"MATERIA PRIMA",c:"HILOS",sc:""},
 {alm:"SB-ALM-MPA · MP Avíos",art:"HILO POLIESTER AZUL",u:"CONO",real:45.00,res:0,esp:0,sem:"ok",lot:"hilo_az",t:"MATERIA PRIMA",c:"HILOS",sc:""},
 {alm:"SB-ALM-MPA · MP Avíos",art:"BOTON METALICO 17MM",u:"UND",real:340,res:0,esp:0,sem:"ok",lot:null,t:"MATERIA PRIMA",c:"AVÍOS DE ACABADOS - PRINCIPALES",sc:"BOTÓN"},
 {alm:"SB-ALM-MPA · MP Avíos",art:"CIERRE METALICO 12CM",u:"UND",real:58,res:0,esp:500,sem:"bajo",lot:null,t:"MATERIA PRIMA",c:"AVÍOS DE CONFECCIÓN",sc:"CIERRES"},
 {alm:"SB-ALM-PT · Central Mercadería",art:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",u:"UND",real:40,res:12,esp:0,sem:"ok",lot:"z28",t:"PRODUCTOS TERMINADOS",c:"PANTALÓN",sc:""},
 {alm:"SB-ALM-PT · Central Mercadería",art:"PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL",u:"UND",real:12,res:0,esp:0,sem:"ok",lot:"z30",t:"PRODUCTOS TERMINADOS",c:"PANTALÓN",sc:""},
 {alm:"SB-ALM-PT · Central Mercadería",art:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR NEGRO",u:"UND",real:0,res:0,esp:60,sem:"cero",lot:null,t:"PRODUCTOS TERMINADOS",c:"PANTALÓN",sc:""},
 {alm:"SB-TDA-01 · Tienda Gamarra 1",art:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",u:"UND",real:9,res:0,esp:6,sem:"ok",lot:"z28t",t:"PRODUCTOS TERMINADOS",c:"PANTALÓN",sc:""},
 {alm:"SB-TDA-01 · Tienda Gamarra 1",art:"PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL",u:"UND",real:4,res:0,esp:12,sem:"bajo",lot:null,t:"PRODUCTOS TERMINADOS",c:"PANTALÓN",sc:""},
 {alm:"SB-TDA-02 · Tienda Gamarra 2",art:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR NEGRO",u:"UND",real:7,res:0,esp:0,sem:"ok",lot:null,t:"PRODUCTOS TERMINADOS",c:"PANTALÓN",sc:""},
 {alm:"SB-ALM-TRN · Almacén Transición",art:"PANTALON WIDE LEG ZULEIKA CRUDO TALLA 28",u:"UND",real:60,res:0,esp:0,sem:"ok",lot:null,t:"PRODUCTOS EN PROCESO",c:"",sc:""}
];
const SEM_COLOR={ok:"var(--stock-ok)",bajo:"var(--stock-bajo)",cero:"var(--stock-cero)"};
function fmt(n,u){const s=(u==="UND")?String(n):n.toFixed(2);return s+" "+u}
function renderStock(){
  const q=(document.getElementById('f-stk-q').value||"").toLowerCase();
  const a=document.getElementById('f-stk-a').value;
  const g=document.getElementById('f-stk-g').value, sg=document.getElementById('f-stk-sg').value, ssg=document.getElementById('f-stk-ssg').value;
  const tb=document.getElementById('stk-body'); tb.innerHTML=""; let n=0;
  STOCK.forEach(r=>{
    if(q && !r.art.toLowerCase().includes(q))return;
    if(a && r.alm!==a)return;
    if(g && r.t!==g)return; if(sg && r.c!==sg)return; if(ssg && r.sc!==ssg)return;
    if(!document.getElementById('f-sem-'+r.sem).checked)return;
    n++;
    const disp=r.real-r.res;
    const tr=document.createElement('tr');
    tr.title="Disponible = Actual − Comprometido";
    tr.innerHTML='<td><span class="dot" style="background:'+SEM_COLOR[r.sem]+'"></span></td>'+
     '<td>'+r.alm+'</td>'+
     '<td><button class="btn-link" onclick="go(\'gi06\')">'+r.art+'</button></td>'+
     '<td style="text-align:right">'+fmt(r.real,r.u)+'</td>'+
     '<td style="text-align:right">'+fmt(r.res,r.u)+'</td>'+
     '<td style="text-align:right">'+fmt(r.esp,r.u)+'</td>'+
     '<td style="text-align:right"><b>'+fmt(disp,r.u)+'</b></td>'+
     '<td>'+(r.lot?'<button class="btn-link" onclick="showLotes(\''+r.lot+'\')">Ver lotes</button>':'')+'</td>';
    tb.appendChild(tr);
  });
  document.getElementById('stk-count').textContent=n+" registros de existencias";
}


function exportStockCSV(){
  const q=(document.getElementById('f-stk-q').value||"").toLowerCase();
  const a=document.getElementById('f-stk-a').value;
  const g=document.getElementById('f-stk-g').value, sg=document.getElementById('f-stk-sg').value, ssg=document.getElementById('f-stk-ssg').value;
  const SEM_TXT={ok:"Normal",bajo:"Por agotarse",cero:"Agotado"};
  let rows=[["Estado","Almacén","Artículo","Unidad","Stock Actual","Comprometido","Pedido","Disponible"]];
  STOCK.forEach(r=>{
    if(q && !r.art.toLowerCase().includes(q))return;
    if(a && r.alm!==a)return;
    if(g && r.t!==g)return; if(sg && r.c!==sg)return; if(ssg && r.sc!==ssg)return;
    if(!document.getElementById('f-sem-'+r.sem).checked)return;
    rows.push([SEM_TXT[r.sem],r.alm,r.art,r.u,r.real,r.res,r.esp,r.real-r.res]);
  });
  const csv="\uFEFF"+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(";")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const aEl=document.createElement('a'); aEl.href=url; aEl.download="Existencias_"+new Date().toISOString().slice(0,10)+".csv";
  document.body.appendChild(aEl); aEl.click(); aEl.remove(); URL.revokeObjectURL(url);
  toast("Exportadas "+(rows.length-1)+" filas con los filtros activos (CSV abre directo en Excel)");
}
