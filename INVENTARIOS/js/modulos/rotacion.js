/* INVENTARIOS · GI-18 Rotación de Artículos */
/* ===== GI-18 · Rotación de Artículos ===== */
const ROT=[
 {art:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR NEGRO",alm:"SB-ALM-LIQ · Liquidación Central",sg:"PRODUCTOS TERMINADOS - PANTALONES",stock:80,uing:"20/12/2025",usal:"21/12/2025",dias:210},
 {art:"BLUSA MANGA GLOBO PERLA TALLA M COLOR BLANCO",alm:"SB-TDA-02 · Tienda Gamarra 2",sg:"PRODUCTOS TERMINADOS - BLUSAS",stock:34,uing:"05/12/2025",usal:"28/12/2025",dias:203},
 {art:"CASACA DENIM OVERSIZE TALLA M COLOR AZUL",alm:"SB-ALM-PT · Central Mercadería",sg:"PRODUCTOS TERMINADOS - CASACAS",stock:26,uing:"10/01/2026",usal:"02/02/2026",dias:167},
 {art:"PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL",alm:"SB-ALM-PT · Central Mercadería",sg:"PRODUCTOS TERMINADOS - PANTALONES",stock:4,uing:"15/06/2026",usal:"24/02/2026",dias:145},
 {art:"FALDA DENIM MIDI TALLA 28 COLOR CELESTE",alm:"SB-TDA-03 · Tienda Zárate",sg:"PRODUCTOS TERMINADOS - FALDAS",stock:18,uing:"20/02/2026",usal:"08/03/2026",dias:133},
 {art:"SHORT JEAN CLASICO TALLA 30 COLOR AZUL",alm:"SB-TDA-01 · Tienda Gamarra 1",sg:"PRODUCTOS TERMINADOS - SHORTS",stock:22,uing:"12/03/2026",usal:"30/04/2026",dias:80},
 {art:"TELA POPELINA BLANCA",alm:"SB-ALM-MPT · MP Telas",sg:"MATERIAS PRIMAS - TELAS",stock:12.50,uing:"08/04/2026",usal:"02/05/2026",dias:78},
 {art:"POLO BOX FIT TALLA M COLOR BLANCO",alm:"SB-TDA-02 · Tienda Gamarra 2",sg:"PRODUCTOS TERMINADOS - POLOS",stock:45,uing:"12/06/2026",usal:"05/06/2026",dias:44},
 {art:"HILO POLIESTER AZUL",alm:"SB-ALM-MPA · MP Avíos",sg:"MATERIAS PRIMAS - AVIOS CONFECCION",stock:45,uing:"05/06/2026",usal:"20/03/2026",dias:44},
 {art:"JEAN RECTO KIARA TALLA 30 COLOR NEGRO",alm:"SB-TDA-03 · Tienda Zárate",sg:"PRODUCTOS TERMINADOS - JEANS",stock:15,uing:"28/05/2026",usal:"25/06/2026",dias:24},
 {art:"CIERRE METALICO 12CM",alm:"SB-ALM-MPA · MP Avíos",sg:"MATERIAS PRIMAS - AVIOS CONFECCION",stock:58,uing:"05/07/2026",usal:"10/05/2026",dias:14},
 {art:"BOTON METALICO 17MM",alm:"SB-ALM-MPA · MP Avíos",sg:"MATERIAS PRIMAS - AVIOS ACABADOS",stock:340,uing:"05/07/2026",usal:"03/04/2026",dias:14},
 {art:"POLO BOX FIT TALLA L COLOR BLANCO",alm:"SB-TDA-01 · Tienda Gamarra 1",sg:"PRODUCTOS TERMINADOS - POLOS",stock:28,uing:"12/06/2026",usal:"16/07/2026",dias:3},
 {art:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",alm:"SB-ALM-PT · Central Mercadería",sg:"PRODUCTOS TERMINADOS - PANTALONES",stock:40,uing:"15/06/2026",usal:"12/07/2026",dias:7},
 {art:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",alm:"SB-TDA-01 · Tienda Gamarra 1",sg:"PRODUCTOS TERMINADOS - PANTALONES",stock:9,uing:"20/06/2026",usal:"17/07/2026",dias:2},
 {art:"TELA DENIM 12 OZ AZUL",alm:"SB-ALM-MPT · MP Telas",sg:"MATERIAS PRIMAS - TELAS",stock:282.40,uing:"28/06/2026",usal:"14/07/2026",dias:5}
];
function rotSem(d){
  if(d>180)return["Crítico >180 días","var(--cancelada)"];
  if(d>90)return["Inmovilizado","#C2410C"];
  if(d>30)return["Vigilar","var(--pendiente)"];
  return["Rota bien","var(--confirmado)"];
}
function rotGrp(r){return r.sg.split(" - ")[0]}
function rotCat(r){return r.sg.split(" - ")[1]||""}
function renderRot(){
  const selA=document.getElementById('f-rot-alm'), selS=document.getElementById('f-rot-sg'), selG=document.getElementById('f-rot-g');
  if(selA.options.length<=1){
    [...new Set(ROT.map(r=>r.alm))].forEach(a=>{const o=document.createElement('option');o.textContent=a;selA.appendChild(o)});
    [...new Set(ROT.map(rotGrp))].forEach(a=>{const o=document.createElement('option');o.textContent=a;selG.appendChild(o)});
    [...new Set(ROT.map(rotCat))].forEach(a=>{const o=document.createElement('option');o.textContent=a;selS.appendChild(o)});
  }
  const fa=selA.value, fs=selS.value, fg=selG.value, fq=(document.getElementById('f-rot-q').value||"").toLowerCase(), fd=parseInt(document.getElementById('f-rot-d').value)||0;
  const tb=document.getElementById('rot-body'); tb.innerHTML=""; let n=0;
  ROT.slice().sort((a,b)=>b.dias-a.dias).forEach(r=>{
    if(fa&&r.alm!==fa)return; if(fg&&rotGrp(r)!==fg)return; if(fs&&rotCat(r)!==fs)return;
    if(fq&&!r.art.toLowerCase().includes(fq))return;
    if(fd&&r.dias<=fd)return;
    n++;
    const val=r.stock*(COSTOS_REF[r.art]||0);
    const[t,c]=rotSem(r.dias);
    tb.innerHTML+='<tr><td>'+r.art+'</td><td>'+r.alm+'</td><td style="text-align:right">'+r.stock+'</td>'+
     '<td style="text-align:right">'+val.toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2})+'</td>'+
     '<td>'+r.uing+'</td><td>'+r.usal+'</td>'+
     '<td style="text-align:right;font-weight:700;'+(r.dias>90?'color:var(--cancelada)':'')+'">'+r.dias+'</td>'+
     '<td><span class="badge" style="background:'+c+'">'+t+'</span></td></tr>';
  });
  document.getElementById('rot-count').textContent=n+" artículos";
  const inm=ROT.filter(r=>r.dias>90);
  document.getElementById('rot-valor').textContent="S/. "+inm.reduce((a,r)=>a+r.stock*(COSTOS_REF[r.art]||0),0).toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2});
  document.getElementById('rot-count90').textContent=inm.length;
  document.getElementById('rot-edad').textContent=Math.round(ROT.reduce((a,r)=>a+r.dias,0)/ROT.length)+" días";
}
