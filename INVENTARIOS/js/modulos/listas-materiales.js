/* INVENTARIOS · GI-17 Listas de Materiales */
/* ===== GI-17 · Listas de Materiales (sin plantilla; nombre = producto final) ===== */
const LDMS={
 ldm1:{id:"LDM-0001",prod:"PT-0001",prodNom:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",desc:"Ensamble final (acabado, azul, talla 28)",cant:1,pred:true,
  items:[{cod:"MP-0044",nom:"BOTON METALICO 17MM",u:"UND",qty:1},
         {cod:"MP-0055",nom:"CUERO SINTETICO PARCHE",u:"UND",qty:1},
         {cod:"MP-0063",nom:"ETIQUETA PANTALON SARA",u:"UND",qty:1},
         {cod:"MP-0061",nom:"HANG TAG SARA DENIM",u:"UND",qty:1},
         {cod:"MP-0064",nom:"BOLSA BRILLO 30X40",u:"UND",qty:1},
         {cod:"MP-0031",nom:"HILO POLIESTER AZUL",u:"MT",qty:0.5},
         {cod:"PPT-0021",nom:"PANTALON WIDE LEG ZULEIKA LAVADO COLOR AZUL TALLA 28",u:"UND",qty:1}]},
 ldm2:{id:"LDM-0002",prod:"PPT-0021",prodNom:"PANTALON WIDE LEG ZULEIKA LAVADO COLOR AZUL TALLA 28",desc:"Lavado del pantalón crudo",cant:1,pred:true,
  items:[{cod:"PPT-0022",nom:"PANTALON WIDE LEG ZULEIKA CRUDO TALLA 28",u:"UND",qty:1}]},
 ldm3:{id:"LDM-0003",prod:"PPT-0022",prodNom:"PANTALON WIDE LEG ZULEIKA CRUDO TALLA 28",desc:"Confección del crudo",cant:1,pred:true,
  items:[{cod:"MP-0045",nom:"CIERRE METALICO 12CM",u:"UND",qty:1},
         {cod:"MP-0071",nom:"TALLITA TALLA 28",u:"UND",qty:1},
         {cod:"MP-0031",nom:"HILO POLIESTER AZUL",u:"MT",qty:1},
         {cod:"MP-0012",nom:"TELA DENIM 12 OZ AZUL",u:"MT",qty:1.5}]}
};
let LDM_ORDEN=["ldm1","ldm2","ldm3"], LDM=null, LDMkey="", LDM_SEQ=4;
/* Catálogo de recursos para la LDM (mano de obra / máquina / servicio).
   Espejo del maestro de Recursos de Producción (PRODUCCION · PR-11), que es donde se crean y editan. */
const RECURSOS_LDM=[
 {cod:"REC-0001",nom:"Operario de corte · turno mañana",u:"HORA"},
 {cod:"REC-0002",nom:"Costurera · línea 1",u:"HORA"},
 {cod:"REC-0003",nom:"Máquina de corte",u:"HORA"},
 {cod:"REC-0004",nom:"Mesa de corte manual",u:"HORA"},
 {cod:"REC-0005",nom:"Energía eléctrica de planta",u:"HORA"},
 {cod:"REC-0008",nom:"Operario de acabado",u:"HORA"},
 {cod:"REC-0009",nom:"Patronista / tizado",u:"HORA"},
 {cod:"REC-0010",nom:"Máquina recta y remalladora",u:"HORA"},
 {cod:"REC-0011",nom:"Lavado · servicio de terceros",u:"UND"},
 {cod:"REC-0012",nom:"Acabado · servicio de terceros",u:"UND"}
];
/* Catálogo de almacenes para los selectores de la LDM */
const ALMACENES=[
 {cod:"SB-ALM-MPT",nom:"Almacén MP Telas"},
 {cod:"SB-ALM-MPA",nom:"Almacén MP Avíos"},
 {cod:"SB-ALM-PPT",nom:"Almacén Producto en Proceso"},
 {cod:"SB-ALM-PT",nom:"Almacén Central Mercadería Gamarra"},
 {cod:"SB-TDA-01",nom:"Tienda Gamarra 1"},
 {cod:"SB-TRF-01",nom:"Almacén de Tránsito SB"}
];
/* Almacén sugerido para un componente, tomado de sus existencias (STOCK se indexa por nombre en el proto) */
function almCodeFromStock(nom){
  const r=(typeof STOCK!=="undefined")?STOCK.find(x=>x.art===nom):null;
  return r ? (r.alm.split(" · ")[0]||"").trim() : "";
}
const EMISION_OPTS=["Notificación","Manual"];
/* Semilla del tipo de línea en las listas existentes */
Object.values(LDMS).forEach(d=>{ (d.items||[]).forEach(it=>{if(!it.tipo)it.tipo="Artículo"}); });
function ldmProdOptions(sel){
  return '<option value="">Seleccionar…</option>'+ARTICULOS.filter(a=>a.manu).map(a=>'<option value="'+a.id+'"'+(a.id===sel?' selected':'')+'>'+a.id+' · '+a.n+'</option>').join('');
}
function mpCatalogo(){return ARTICULOS.filter(a=>a.inv==="Sí").map(a=>({cod:a.id,nom:a.n,u:a.u,cat:a.c||a.t}))}
function renderLDM(){
  const tb=document.getElementById('ldm-body'); tb.innerHTML="";
  LDM_ORDEN.forEach(k=>{
    const d=LDMS[k];
    tb.innerHTML+='<tr class="clickable" onclick="loadLDM(\''+k+'\')"><td>'+d.id+'</td><td>'+d.prodNom+'</td><td>'+(d.desc||'<span class="hint">—</span>')+'</td>'+
     '<td>'+(d.pred?'<span class="badge" style="background:var(--aprobado-sol)">Predeterminada</span>':'<span class="hint">Alternativa</span>')+'</td>'+
     '<td style="text-align:right">'+d.cant+'</td><td style="text-align:right">'+d.items.length+'</td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();loadLDM(\''+k+'\')">Abrir</button></td></tr>';
  });
  document.getElementById('ldm-count').textContent=LDM_ORDEN.length+" listas de materiales";
}
function nuevaLDM(){
  LDMkey=""; LDM={id:"LDM-000"+LDM_SEQ,prod:"",prodNom:"",desc:"",cant:1,items:[]};
  document.getElementById('ldm-titulo').textContent="NUEVA LISTA DE MATERIALES";
  document.getElementById('ldm-id').value=LDM.id;
  document.getElementById('ldm-prod').innerHTML=ldmProdOptions("");
  document.getElementById('ldm-desc').value="";
  document.getElementById('ldm-cant').value="1";
  document.getElementById('ldm-pred').checked=false;
  renderLDMitems(); go('gi17f');
}
function loadLDM(k){
  LDMkey=k; LDM=LDMS[k];
  document.getElementById('ldm-titulo').textContent="LISTA DE MATERIALES: "+LDM.prodNom;
  document.getElementById('ldm-id').value=LDM.id;
  document.getElementById('ldm-prod').innerHTML=ldmProdOptions(LDM.prod);
  document.getElementById('ldm-desc').value=LDM.desc||"";
  document.getElementById('ldm-cant').value=LDM.cant;
  document.getElementById('ldm-pred').checked=!!LDM.pred;
  renderLDMitems(); go('gi17f');
}
function ldmProdChange(){
  const id=document.getElementById('ldm-prod').value, a=ARTICULOS.find(x=>x.id===id);
  document.getElementById('ldm-titulo').textContent="LISTA DE MATERIALES: "+(a?a.n:"");
}
function tipoBadgeLDM(t){
  const col = t==="Recurso" ? "var(--aprobada)" : (t==="Texto" ? "var(--borrador)" : "var(--primario-claro)");
  return '<span class="badge" style="background:'+col+'">'+t+'</span>';
}
function almSelectLDM(i,cur){
  const st='width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 6px;font-size:12px';
  return '<select onchange="LDM.items['+i+'].alm=this.value" style="'+st+'"><option value="">—</option>'+
    ALMACENES.map(a=>'<option value="'+a.cod+'"'+(a.cod===cur?' selected':'')+' title="'+a.nom+'">'+a.cod+'</option>').join('')+'</select>';
}
function emiSelectLDM(i,cur){
  const st='width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 6px;font-size:12px';
  return '<select onchange="LDM.items['+i+'].emision=this.value" style="'+st+'">'+
    EMISION_OPTS.map(o=>'<option'+(o===cur?' selected':'')+'>'+o+'</option>').join('')+'</select>';
}
function renderLDMitems(){
  const tb=document.getElementById('ldm-items'); tb.innerHTML="";
  LDM.items.forEach((l,i)=>{
    if(!l.tipo)l.tipo="Artículo";
    let cod,comp,cant,uni,alm,emi;
    if(l.tipo==="Texto"){
      cod='<span class="hint">—</span>';
      comp='<input value="'+(l.nom||"").replace(/"/g,'&quot;')+'" placeholder="Texto / instrucción" style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 7px;font-size:12.5px" oninput="LDM.items['+i+'].nom=this.value">';
      cant='<span class="hint">—</span>'; uni='<span class="hint">—</span>';
      alm='<span class="hint">—</span>'; emi='<span class="hint">—</span>';
    } else {
      if(l.alm==null)l.alm=almCodeFromStock(l.nom)||"";
      if(l.emision==null)l.emision="Notificación";
      cod=l.cod; comp=l.nom;
      cant='<input value="'+l.qty+'" style="text-align:right" oninput="LDM.items['+i+'].qty=parseFloat(this.value)||0">';
      uni=l.u;
      alm=almSelectLDM(i,l.alm); emi=emiSelectLDM(i,l.emision);
    }
    tb.innerHTML+='<tr><td>'+(i+1)+'</td><td>'+tipoBadgeLDM(l.tipo)+'</td><td>'+cod+'</td><td>'+comp+'</td>'+
     '<td>'+cant+'</td><td>'+uni+'</td><td>'+alm+'</td><td>'+emi+'</td>'+
     '<td><button class="btn-link" onclick="LDM.items.splice('+i+',1);renderLDMitems()">Eliminar</button></td></tr>';
  });
  if(!LDM.items.length)tb.innerHTML='<tr><td colspan="9" style="text-align:center;color:var(--texto-sec);padding:16px">Sin líneas: use "+ Artículo", "+ Recurso" o "+ Texto"</td></tr>';
}
function addTextoLDM(){ if(!LDM)return; LDM.items.push({tipo:"Texto",cod:"",nom:"",u:"",qty:0}); renderLDMitems(); }
/* + Recurso: modal de búsqueda (espejo del de artículos) */
function abrirBuscarRec(){ if(!LDM)return; document.getElementById('ldmrec-q').value=""; renderBuscarRec(); openModal('m-ldm-rec'); }
function renderBuscarRec(){
  const q=(document.getElementById('ldmrec-q').value||"").toLowerCase();
  const tb=document.getElementById('ldmrec-body'); tb.innerHTML="";
  RECURSOS_LDM.forEach(r=>{
    if(LDM.items.some(l=>l.tipo==="Recurso" && l.cod===r.cod))return;
    if(q && !(r.cod.toLowerCase().includes(q)||sinTildes(r.nom).includes(sinTildes(q))))return;
    tb.innerHTML+='<tr><td>'+r.cod+'</td><td>'+r.nom+'</td><td>'+r.u+'</td>'+
     '<td><button class="btn btn-primary btn-sm" onclick="addRecLDM(\''+r.cod+'\')">Agregar</button></td></tr>';
  });
  if(!tb.innerHTML)tb.innerHTML='<tr><td colspan="4" style="text-align:center;color:var(--texto-sec);padding:14px">Sin resultados (o ya están en la lista)</td></tr>';
}
function addRecLDM(cod){
  const r=RECURSOS_LDM.find(x=>x.cod===cod); if(!r)return;
  LDM.items.push({tipo:"Recurso",cod:r.cod,nom:r.nom,u:r.u,qty:1});
  closeModal('m-ldm-rec'); renderLDMitems();
  toast(r.nom+" agregado: indique la cantidad por unidad producida");
}
function abrirBuscarMP(){document.getElementById('gi17a-q').value="";fillMPFiltros();renderBuscarMP();openModal('m-gi17a')}
function fillMPFiltros(){
  const g=document.getElementById('gi17a-g'); if(!g)return;
  g.innerHTML='<option value="">Todos</option>'+TIPOS.map(t=>'<option>'+t.nom+'</option>').join('');
  document.getElementById('gi17a-atr').innerHTML='<option value="">Cualquiera</option>'+ATRIBUTOS.map(x=>'<option>'+x.nom+'</option>').join('');
  fillMPVal();
}
function fillMPVal(){
  const nom=document.getElementById('gi17a-atr').value;
  const a=ATRIBUTOS.find(x=>x.nom===nom);
  document.getElementById('gi17a-val').innerHTML='<option value="">Cualquiera</option>'+((a?a.vals:[]).map(v=>'<option>'+v+'</option>').join(''));
}
function renderBuscarMP(){
  const q=(document.getElementById('gi17a-q').value||"").toLowerCase();
  const fg=document.getElementById('gi17a-g').value;
  const fa=document.getElementById('gi17a-atr').value, fv=document.getElementById('gi17a-val').value;
  const tb=document.getElementById('gi17a-body'); tb.innerHTML="";
  ARTICULOS.filter(a=>a.inv==="Sí" && a.e==="Activo").forEach(a=>{
    if(LDM.items.some(l=>l.cod===a.id))return;
    if(LDM.prod && a.id===LDM.prod)return;
    if(q && !(a.id.toLowerCase().includes(q)||sinTildes(a.n).includes(sinTildes(q))))return;
    if(fg && a.t!==fg)return;
    if(fa){ const par=(a.attrs||[]).find(x=>x[0]===fa); if(!par)return; if(fv && par[1]!==fv)return; }
    const attrTxt=(a.attrs&&a.attrs.length)?(' <span class="hint">'+a.attrs.map(x=>x[0]+": "+x[1]).join(" · ")+'</span>'):'';
    tb.innerHTML+='<tr><td>'+a.id+'</td><td>'+a.n+attrTxt+'</td><td>'+a.u+'</td><td>'+(a.c||a.t)+'</td>'+
     '<td><button class="btn btn-primary btn-sm" onclick="addMPLDM(\''+a.id+'\')">Agregar</button></td></tr>';
  });
  if(!tb.innerHTML)tb.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:14px">Sin resultados (o ya están en la lista)</td></tr>';
}
function addMPLDM(cod){
  const m=mpCatalogo().find(x=>x.cod===cod); if(!m)return;
  LDM.items.push({tipo:"Artículo",cod:m.cod,nom:m.nom,u:m.u,qty:1});
  closeModal('m-gi17a'); renderLDMitems();
  toast(m.nom+" agregado: indique la cantidad por unidad producida");
}
function guardarLDM(){
  const prod=document.getElementById('ldm-prod').value;
  if(!prod){toast("Seleccione el producto final");return}
  if(!LDM.items.length){toast("Agregue al menos una línea");return}
  if(LDM.items.some(l=>l.tipo==="Texto" && !((l.nom||"").trim()))){toast("Complete el texto de las líneas de tipo Texto");return}
  const a=ARTICULOS.find(x=>x.id===prod);
  LDM.prod=prod; LDM.prodNom=a?a.n:prod; LDM.desc=document.getElementById('ldm-desc').value.trim();
  LDM.cant=parseFloat(document.getElementById('ldm-cant').value)||1;
  const marcarPred=document.getElementById('ldm-pred').checked;
  if(marcarPred){LDM_ORDEN.forEach(k2=>{if(LDMS[k2].prod===prod && LDMS[k2]!==LDM)LDMS[k2].pred=false})}
  LDM.pred=marcarPred || !LDM_ORDEN.some(k2=>LDMS[k2]!==LDM && LDMS[k2].prod===prod && LDMS[k2].pred);
  if(!LDMkey){const k="ldm"+LDM_SEQ; LDMS[k]=LDM; LDM_ORDEN.push(k); LDMkey=k; LDM_SEQ++;}
  renderLDM(); go('gi17');
  toast(LDM.id+" guardada como "+(LDM.pred?"Predeterminada":"alternativa")+" de "+LDM.prodNom);
}
