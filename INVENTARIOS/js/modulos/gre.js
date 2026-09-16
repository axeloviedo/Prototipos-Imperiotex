/* INVENTARIOS · GI-14/15/16 Guías de Remisión Electrónicas */
/* ===== GI-14/15/16 · GRE ===== */
const GRE_EST={"Enviado":"var(--gre-enviado)","Aceptado":"var(--gre-aceptado)","Aceptado c/ observaciones":"var(--gre-obs)","Rechazado":"var(--gre-rechazado)"};
const GRE=[
 {n:219,fem:"2026-07-15",cli:"CONFECCIONES RIMAC SAC",doc:"RUC 20567891234",num:"T001-413",est:"Aceptado c/ observaciones",fenv:"2026-07-15",fent:"2026-07-15",comp:"F001-002338"},
 {n:220,fem:"2026-07-14",cli:"TEXTIL ANDINO EIRL",doc:"RUC 20123456789",num:"T002-265",est:"Rechazado",fenv:"2026-07-14",fent:"2026-07-14",comp:""},
 {n:221,fem:"2026-05-22",cli:"TACURE MONTALVAN, ELIANA AYMET",doc:"DNI 74437817",num:"T005-401",est:"Enviado",fenv:"2026-05-22",fent:"2026-05-22",comp:""},
 {n:222,fem:"2026-05-22",cli:"VALDERRAMA FARFAN, WASHINGTON",doc:"DNI 40751265",num:"T006-8",est:"Enviado",fenv:"2026-05-22",fent:"2026-05-22",comp:""},
 {n:223,fem:"2026-05-20",cli:"SAMAME SAAVEDRA, RONALD FRANKLIN",doc:"DNI 41806790",num:"T002-264",est:"Enviado",fenv:"2026-05-20",fent:"2026-05-20",comp:""},
 {n:224,fem:"2026-05-20",cli:"LOZADA OVIEDO, ARELY ISABEL",doc:"DNI 47697361",num:"T007-5",est:"Enviado",fenv:"2026-05-20",fent:"2026-05-20",comp:""},
 {n:225,fem:"2026-05-20",cli:"MARTEL JEREMIAS, MELANY KAREY",doc:"DNI 72407067",num:"T005-400",est:"Enviado",fenv:"2026-05-20",fent:"2026-05-20",comp:""},
 {n:226,fem:"2026-05-20",cli:"DURAN REYES, MIRLE CAROLAY",doc:"DNI 73135204",num:"T005-399",est:"Enviado",fenv:"2026-05-20",fent:"2026-05-20",comp:""},
 {n:227,fem:"2026-05-20",cli:"LOZANO GREIFO, NAOMI JAILIANNE",doc:"DNI 62182054",num:"T005-398",est:"Enviado",fenv:"2026-05-20",fent:"2026-05-20",comp:""},
 {n:228,fem:"2026-05-20",cli:"SERRATO RIVAS, GAVINO",doc:"DNI 17583114",num:"T003-34",est:"Enviado",fenv:"2026-05-20",fent:"2026-05-20",comp:""},
 {n:229,fem:"2026-05-20",cli:"MILLONES SIESQUEN, MARIA DEL MILAGRO",doc:"DNI 43231062",num:"T007-4",est:"Enviado",fenv:"2026-05-20",fent:"2026-05-20",comp:""},
 {n:230,fem:"2026-05-19",cli:"ROMAN CORDOVA, FIORELLA",doc:"DNI 75824720",num:"T005-397",est:"Enviado",fenv:"2026-05-19",fent:"2026-05-19",comp:""},
 {n:231,fem:"2026-05-19",cli:"FLORES CURASMA, NILDA EDITA",doc:"DNI 43987878",num:"T005-396",est:"Aceptado",fenv:"2026-05-19",fent:"2026-05-19",comp:""},
 {n:232,fem:"2026-05-19",cli:"REYES DOMINGUEZ, KAREM JOCELYN",doc:"DNI 48251256",num:"T005-395",est:"Aceptado",fenv:"2026-05-19",fent:"2026-05-19",comp:""},
 {n:233,fem:"2026-05-19",cli:"ARROYO LLONTOP, MARIANA",doc:"DNI 45281433",num:"T001-412",est:"Aceptado",fenv:"2026-05-19",fent:"2026-05-19",comp:""},
 {n:234,fem:"2026-05-18",cli:"ABARCA ARANDA, INGRID FABIOLA",doc:"DNI 76512907",num:"T005-394",est:"Aceptado",fenv:"2026-05-18",fent:"2026-05-18",comp:""},
 {n:235,fem:"2026-05-18",cli:"ZAPATA ORTIZ, LESLY DIANE",doc:"DNI 76669912",num:"T005-393",est:"Enviado",fenv:"2026-05-18",fent:"2026-05-18",comp:""},
 {n:236,fem:"2026-05-18",cli:"VASQUEZ VALLADARES YANISS PAMELA",doc:"RUC 10710511174",num:"T007-3",est:"Enviado",fenv:"2026-05-18",fent:"2026-05-18",comp:""},
 {n:237,fem:"2026-05-16",cli:"REYES CAJALEON, MARIA DOMITILA",doc:"DNI 15847286",num:"T001-411",est:"Aceptado",fenv:"2026-05-16",fent:"2026-05-16",comp:""},
 {n:238,fem:"2026-05-16",cli:"GUERRERO GUERRERO, MABEL",doc:"DNI 71340916",num:"T007-2",est:"Aceptado",fenv:"2026-05-16",fent:"2026-05-16",comp:""},
 {n:239,fem:"2026-05-16",cli:"SERRATO RIVAS, GAVINO",doc:"DNI 17583114",num:"T003-33",est:"Aceptado",fenv:"2026-05-16",fent:"2026-05-16",comp:""},
 {n:240,fem:"2026-05-16",cli:"PEREZ VARGAS, NOEMI",doc:"DNI 47480707",num:"T007-1",est:"Aceptado",fenv:"2026-05-16",fent:"2026-05-16",comp:""}
];
let greActual=null;
function renderGRE(){
  const q=(document.getElementById('f-gre-q').value||"").toLowerCase();
  const e=document.getElementById('f-gre-e').value;
  const tb=document.getElementById('gre-body'); tb.innerHTML=""; let n=0;
  GRE.forEach((g,i)=>{
    if(q && !(g.cli.toLowerCase().includes(q)||g.num.toLowerCase().includes(q)||g.doc.toLowerCase().includes(q)))return;
    if(e && g.est!==e)return;
    n++;
    const tr=document.createElement('tr'); tr.className="clickable"; tr.onclick=()=>showGRE(i);
    tr.innerHTML='<td>'+g.n+'</td><td>'+g.fem+'</td><td>'+g.cli+'<br><span class="hint">'+g.doc+'</span></td><td>'+g.num+'</td>'+
     '<td><span class="badge" style="background:'+GRE_EST[g.est]+'">'+g.est+'</span></td>'+
     '<td>'+g.fenv+'</td><td>'+g.fent+'</td><td>'+(g.comp||"")+'</td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();toast(\'Descargando PDF de \'+ \''+g.num+'\')">PDF</button></td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();showGRE('+i+')">Ver</button> <button class="btn-link" onclick="event.stopPropagation();toast(\'Estado actualizado desde SUNAT\')" title="Consultar estado [⚠]">⟳</button></td>';
    tb.appendChild(tr);
  });
  document.getElementById('gre-count').textContent=n+" guías de remisión";
}
function showGRE(i){
  const g=GRE[i]; greActual=i;
  document.getElementById('g16-num').textContent="GRE "+g.num;
  const b=document.getElementById('g16-badge'); b.textContent=g.est; b.style.background=GRE_EST[g.est];
  document.getElementById('g16-f-num').value=g.num;
  document.getElementById('g16-f-cli').value=g.cli+" · "+g.doc;
  document.getElementById('g16-f-fem').value=g.fem;
  document.getElementById('g16-f-ftr').value=g.fenv+" / "+g.fent;
  document.getElementById('g16-f-mot').value=g.doc.startsWith("RUC")?"Venta":"Traslado entre establecimientos de la misma empresa";
  document.getElementById('g16-f-ruta').value="Av. Gamarra 228, La Victoria (150115) → destino declarado en la guía";
  document.getElementById('g16-items').innerHTML=
   '<tr><td>1</td><td>ART-0001-28AZ</td><td>PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL</td><td>UND</td><td style="text-align:right">6</td></tr>'+
   '<tr><td>2</td><td>ART-0001-30AZ</td><td>PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL</td><td>UND</td><td style="text-align:right">6</td></tr>';
  const cdr=document.getElementById('g16-cdr');
  document.getElementById('g16-consultar').style.display=(g.est==="Enviado")?"inline-block":"none";
  if(g.est==="Aceptado"){cdr.style.display="block";cdr.style.borderLeft="4px solid var(--gre-aceptado)";
   cdr.innerHTML='<b style="font-size:12.5px">CDR · Constancia de Recepción SUNAT</b><p class="hint" style="margin-top:5px">Código 0: "La Guía de Remisión número '+g.num+' ha sido aceptada." · Respuesta SUNAT del '+g.fenv+' · <button class="btn-link" onclick="toast(\'Descargando CDR (XML)…\')">Descargar CDR</button></p>'}
  else if(g.est==="Aceptado c/ observaciones"){cdr.style.display="block";cdr.style.borderLeft="4px solid var(--gre-obs)";
   cdr.innerHTML='<b style="font-size:12.5px">CDR · Aceptada con observaciones</b><p class="hint" style="margin-top:5px">Código 4000: la guía fue aceptada pero SUNAT registró observaciones (ej. dato referencial del destinatario). Revise el CDR. · <button class="btn-link" onclick="toast(\'Descargando CDR (XML)…\')">Descargar CDR</button></p>'}
  else if(g.est==="Rechazado"){cdr.style.display="block";cdr.style.borderLeft="4px solid var(--gre-rechazado)";
   cdr.innerHTML='<b style="font-size:12.5px">CDR · Rechazada por SUNAT</b><p class="hint" style="margin-top:5px">Código 2800: dato del destinatario no válido. Corrija los datos y emita una nueva guía (la anulación se realiza desde el portal de SUNAT). · <button class="btn-link" onclick="toast(\'Descargando CDR (XML)…\')">Descargar CDR</button></p>'}
  else{cdr.style.display="block";cdr.style.borderLeft="4px solid var(--gre-enviado)";
   cdr.innerHTML='<b style="font-size:12.5px">En proceso de validación</b><p class="hint" style="margin-top:5px">La guía fue enviada a SUNAT y está pendiente de respuesta (CDR). Use "Consultar estado" para refrescar.</p>'}
  go('gi16');
}
function consultarGRE(){
  const g=GRE[greActual];
  if(g.est==="Enviado"){g.est="Aceptado";renderGRE();showGRE(greActual);toast("SUNAT respondió: guía Aceptada (CDR disponible)")}
}

/* --- GI-15 --- */
const GRE_SEDES={
 "Local Principal - Gamarra":{ubi:"LIMA / Lima / 150115 - La Victoria",dir:"Av. Gamarra 228",alms:[["SB-ALM-PT · Central Mercadería","T001"],["SB-ALM-MPT · MP Telas","T002"],["SB-ALM-MPA · MP Avíos","T003"]]},
 "Taller Zárate":{ubi:"LIMA / Lima / 150132 - San Juan de Lurigancho",dir:"Av. Pirámide del Sol 350",alms:[["SB-ALM-TRN · Almacén Transición","T004"]]},
 "Tienda Gamarra 1":{ubi:"LIMA / Lima / 150115 - La Victoria",dir:"Galería El Rey, Tienda 105",alms:[["SB-TDA-01 · Tienda Gamarra 1","T005"]]},
 "Tienda Gamarra 2":{ubi:"LIMA / Lima / 150115 - La Victoria",dir:"Galería Guizado, Tienda 210",alms:[["SB-TDA-02 · Tienda Gamarra 2","T006"]]}
};
function greSede(){
  const sd=document.getElementById('gre-sede').value, alm=document.getElementById('gre-alm');
  alm.innerHTML='<option value="">Seleccionar…</option>';
  document.getElementById('gre-serie').value="";
  if(!sd){alm.innerHTML='<option value="">Seleccione primero la sede</option>';return}
  GRE_SEDES[sd].alms.forEach(a=>{const o=document.createElement('option');o.value=a[0];o.textContent=a[0];alm.appendChild(o)});
  document.getElementById('gre-ubi-p').value=GRE_SEDES[sd].ubi;
  document.getElementById('gre-dir-p').value=GRE_SEDES[sd].dir;
}
function greAlm(){
  const sd=document.getElementById('gre-sede').value, a=document.getElementById('gre-alm').value;
  const par=(GRE_SEDES[sd]||{alms:[]}).alms.find(x=>x[0]===a);
  document.getElementById('gre-serie').value=par?par[1]:"";
}
function greModo(){
  const pub=document.getElementById('gre-modo').value==="Transporte público";
  document.getElementById('gre-transp-pub').style.display=pub?"grid":"none";
  document.getElementById('gre-transp-priv').style.display=pub?"none":"grid";
}
function nuevaGRE(){
  document.getElementById('gre-sede').value=""; greSede();
  document.getElementById('gre-cliente').value="";
  document.getElementById('gre-ubi-p').value=""; document.getElementById('gre-dir-p').value="";
  document.getElementById('gre-ubi-l').value=""; document.getElementById('gre-dir-l').value="";
  go('gi15');
}
function enviarGRE(){
  if(!document.getElementById('gre-sede').value){toast("Debe seleccionar el Establecimiento / Sede");return}
  if(!document.getElementById('gre-alm').value){toast("Debe seleccionar el Almacén de la sede (define la serie)");return}
  if(!document.getElementById('gre-cliente').value.trim()){toast("Debe indicar el Cliente destinatario");return}
  if(!document.getElementById('gre-ubi-l').value){toast("Debe seleccionar el Ubigeo de llegada");return}
  if(!document.getElementById('gre-dir-l').value.trim()){toast("Debe indicar la Dirección de llegada");return}
  if(document.getElementById('gre-modo').value==="Transporte público" && !document.getElementById('gre-transp').value){toast("Debe seleccionar el Transportista");return}
  const serie=document.getElementById('gre-serie').value;
  const cli=document.getElementById('gre-cliente').value.trim().toUpperCase();
  const nuevo={n:GRE[0].n-1<219?218:Math.min(...GRE.map(x=>x.n))-1,fem:"2026-07-19",cli:cli,doc:"DNI -",num:serie+"-402",est:"Enviado",fenv:"2026-07-19",fent:"2026-07-19",comp:""};
  GRE.unshift(nuevo); renderGRE();
  toast("GRE "+nuevo.num+" enviada a SUNAT: en proceso de validación");
  showGRE(0);
}
