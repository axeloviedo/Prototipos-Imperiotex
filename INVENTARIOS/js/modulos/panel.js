/* INVENTARIOS · GI-00 Panel de Logística */
/* ===== GI-00 · Panel de Logística ===== */
const COSTOS_REF={"TELA DENIM 12 OZ AZUL":19.10,"TELA DENIM 12 OZ NEGRO":18.80,"TELA POPELINA BLANCA":6.50,
 "HILO POLIESTER AZUL":24.00,"HILO POLIESTER NEGRO":24.00, /* S/. por cono */"BOTON METALICO 17MM":0.35,"HANG TAG SARA DENIM":0.15,"BOLSA EMPAQUE 30X40":0.10,"CIERRE METALICO 12CM":0.80,
 "PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL":38.50,"PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL":38.50,
 "PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR NEGRO":38.50,
 "BLUSA MANGA GLOBO PERLA TALLA M COLOR BLANCO":22.00,"CASACA DENIM OVERSIZE TALLA M COLOR AZUL":52.00,
 "FALDA DENIM MIDI TALLA 28 COLOR CELESTE":28.50,"SHORT JEAN CLASICO TALLA 30 COLOR AZUL":24.00,
 "POLO BOX FIT TALLA M COLOR BLANCO":15.50,"POLO BOX FIT TALLA L COLOR BLANCO":15.50,
 "JEAN RECTO KIARA TALLA 30 COLOR NEGRO":36.00};
function valorGrupo(){
  const v={"MP - Telas":0,"MP - Avíos":0,"Producto Terminado":0,"PPT (solo cantidades)":0};
  STOCK.forEach(r=>{
    const c=COSTOS_REF[r.art]||0, val=r.real*c;
    if(r.t==="PRODUCTOS EN PROCESO"){return}
    if(r.c==="TELAS")v["MP - Telas"]+=val;
    else if(r.t==="MATERIA PRIMA")v["MP - Avíos"]+=val;
    else if(r.t==="PRODUCTOS TERMINADOS")v["Producto Terminado"]+=val;
  });
  return v;
}
function renderDash(){
  const v=valorGrupo();
  const total=Object.values(v).reduce((a,b)=>a+b,0);
  document.getElementById('kpi-valor').textContent="S/. "+total.toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2});
  document.getElementById('kpi-valor-sub').textContent="promedio ponderado vigente";
  document.getElementById('kpi-alm').textContent=[...new Set(STOCK.map(r=>r.alm))].length;
  document.getElementById('kpi-art').textContent=ARTICULOS.filter(a=>a.e!=="Inactivo"&&a.inv==="Sí").length;
  document.getElementById('kpi-alertas').textContent=STOCK.filter(r=>r.sem==="bajo"||r.sem==="cero").length;
  const max=Math.max(...Object.values(v),1);
  const COLORES={"MP - Telas":"var(--primario-claro)","MP - Avíos":"#0E7490","Producto Terminado":"var(--confirmado)","PPT (solo cantidades)":"var(--borrador)"};
  document.getElementById('chart-grupos').innerHTML=Object.entries(v).map(([g,val])=>{
    const pct=Math.max(2,Math.round(val/max*100));
    const label=(g==="PPT (solo cantidades)")?(STOCK.filter(r=>r.t==="PRODUCTOS EN PROCESO").reduce((a,r)=>a+r.real,0)+" UND en proceso"):("S/. "+val.toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2}));
    return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:11px">'+
     '<div style="width:170px;font-size:12.5px;text-align:right;color:var(--texto-sec)">'+g+'</div>'+
     '<div style="flex:1;background:#EEF2F7;border-radius:5px;height:26px;position:relative">'+
       '<div style="width:'+pct+'%;height:100%;border-radius:5px;background:'+COLORES[g]+'"></div>'+
       '<span style="position:absolute;left:10px;top:4px;font-size:12px;font-weight:600;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.25)">'+label+'</span>'+
     '</div></div>';
  }).join('');
}
