/* COMPRAS · CO-01/02/03 Proveedores y Grupos de Proveedor, CT-09 buscador de proveedor */
/* ===== CO-01/02/03 · Proveedores y Grupos ===== */
function sinTildes(t){return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
let GRUPOS=["Distribuidor","Servicios","Materia Prima","Transportista"];
const PROV=[
 {id:"PRV-0001",nom:"TEXTIL SAN JACINTO SAC",tipo:"Nacional",grupo:"Materia Prima",tdoc:"RUC",ndoc:"20512345678",est:"Activo",
  cnom:"Rosa",cape:"Huamán",cmail:"ventas@sanjacinto.pe",ctel:"+51 987 654 321",dir:"Jr. Antonio Bazo 850",pais:"PERU",prov:"Lima",ciu:"La Victoria",
  compras:[["OC-000231","15/07/2026","Tela denim 12 oz (azul, negro)","S/. 4,990.56","Para Recibir y Pagar"],["OC-000198","02/06/2026","Tela denim 12 oz azul","S/. 6,240.00","Completada"],["OC-000164","05/05/2026","Popelina blanca","S/. 812.50","Completada"]],
  reclamos:[["REC-000006","08/06/2026","Tono distinto al aprobado (rollo 3)","Procedente","Reposición"]],nc:""},
 {id:"PRV-0002",nom:"AVÍOS DEL SUR EIRL",tipo:"Nacional",grupo:"Materia Prima",tdoc:"RUC",ndoc:"20487654321",est:"Activo",
  cnom:"Carlos",cape:"Quispe",cmail:"pedidos@aviosdelsur.pe",ctel:"+51 912 345 678",dir:"Av. México 1420",pais:"PERU",prov:"Lima",ciu:"La Victoria",
  compras:[["OC-000225","05/07/2026","Botones y cierres metálicos","S/. 415.00","Completada"],["OC-000201","08/06/2026","Botones metálicos 17mm (5,000 und)","S/. 1,750.00","Completada"],["OC-000187","18/05/2026","Hilo poliéster (azul y negro)","S/. 1,062.00","Completada"]],
  reclamos:[["REC-000008","10/07/2026","Cierres con óxido: 12% del lote (umbral avíos 10%)","Procedente","Nota de Crédito"]],
  nc:"NC pendiente: NC-000009 por S/. 96.00 (reclamo REC-000008). Visible en las facturas del proveedor (Ola 5)."},
 {id:"PRV-0003",nom:"LAVANDERIA INDUSTRIAL DEL SUR SAC",tipo:"Nacional",grupo:"Servicios",tdoc:"RUC",ndoc:"20509876543",est:"Activo",
  cnom:"María",cape:"Torres",cmail:"operaciones@lavsur.pe",ctel:"+51 998 877 665",dir:"Calle Los Hornos 240",pais:"PERU",prov:"Lima",ciu:"San Juan de Lurigancho",
  compras:[["OC-000228","10/07/2026","Servicio de lavado (OF-000122)","S/. 1,380.00","Para Recibir y Pagar"],["OC-000205","12/06/2026","Servicio de lavado stone wash (OF-000118)","S/. 1,150.00","Completada"],["OC-000188","20/05/2026","Servicio de teñido (OF-000114)","S/. 940.00","Completada"]],
  reclamos:[["REC-000005","15/06/2026","4 prendas manchadas en lavado (OF-000118)","Procedente","Reposición del servicio"]],nc:""},
 {id:"PRV-0004",nom:"TRANSPORTES GAMARRA EXPRESS SAC",tipo:"Nacional",grupo:"Transportista",tdoc:"RUC",ndoc:"20456789123",est:"Activo",
  cnom:"Jorge",cape:"Rivas",cmail:"despachos@tgexpress.pe",ctel:"+51 955 443 322",dir:"Av. Aviación 3050",pais:"PERU",prov:"Lima",ciu:"San Borja",
  compras:[["OC-000226","08/07/2026","Flete Gamarra - Zárate (2 viajes)","S/. 360.00","Completada"],["OC-000210","19/06/2026","Flete reparto a tiendas","S/. 180.00","Completada"]],
  reclamos:[["REC-000003","21/06/2026","Entrega con 1 día de retraso (reparto tiendas)","No procedente","Sin acción: causa externa acreditada"]],nc:""},
 {id:"PRV-0005",nom:"YKK DO BRASIL LTDA",tipo:"Internacional",grupo:"Materia Prima",tdoc:"Tax ID (extranjero)",ndoc:"BR-33.013.545/0001",est:"Activo",
  cnom:"Paulo",cape:"Santos",cmail:"export@ykk.com.br",ctel:"+55 11 4132 8800",dir:"Av. Paulista 1000",pais:"BRASIL",prov:"São Paulo",ciu:"São Paulo",
  compras:[["OC-000219","28/06/2026","IMPORTACIÓN: Cierres MP-0046 (YKK RC-045 12cm, 6,000 und) y MP-0047 (YKK RM-030 15cm, 4,000 und)","USD 5,040.00 · S/. 18,900.00 (TC 3.75)","Para Recibir y Pagar"],["OC-000176","10/05/2026","IMPORTACIÓN: Cierres MP-0047 (YKK RM-030 15cm, reposición)","USD 1,980.00 · S/. 7,326.00 (TC 3.70)","Completada"]],
  reclamos:[["REC-000004","22/05/2026","Faltante de 150 und en bulto 4 (MP-0047, OC-000176)","Procedente","Reposición en el siguiente embarque"]],nc:""},
 {id:"PRV-0006",nom:"CONFECCIONES EL AGUILA SAC",tipo:"Nacional",grupo:"Servicios",tdoc:"RUC",ndoc:"20334455667",est:"Activo",
  cnom:"Elena",cape:"Paredes",cmail:"taller@elaguila.pe",ctel:"+51 934 221 100",dir:"Jr. Gamarra 653, Int. 402",pais:"PERU",prov:"Lima",ciu:"La Victoria",
  compras:[["OC-000222","01/07/2026","Servicio de confección lote tercerizado","S/. 3,600.00","Para Recibir y Pagar"],["OC-000196","28/05/2026","Servicio de confección lote tercerizado","S/. 3,150.00","Completada"]],
  reclamos:[["REC-000007","05/06/2026","18 prendas con costura defectuosa","Procedente","Reposición: recosido sin costo"]],nc:""},
 {id:"PRV-0007",nom:"DISTRIBUIDORA TEXTIL NORTE EIRL",tipo:"Nacional",grupo:"Distribuidor",tdoc:"RUC",ndoc:"20223344556",est:"Inactivo",
  cnom:"",cape:"",cmail:"",ctel:"",dir:"",pais:"PERU",prov:"Lambayeque",ciu:"Chiclayo",
  compras:[["OC-000102","12/02/2026","Mercadería para reventa","S/. 2,150.00","Completada"]],
  reclamos:[["REC-000001","20/02/2026","Prendas con tallas mal etiquetadas","Procedente","Devolución parcial (12 und)"]],nc:""}
];
let PRV={idx:-1,modo:"nuevo"}; // modo: nuevo | ver | editar
function fillGrupoSelects(){
  const opts='<option value="">Seleccionar…</option>'+GRUPOS.map(g=>'<option>'+g+'</option>').join('');
  document.getElementById('prv-grupo').innerHTML=opts;
  document.getElementById('f-prv-g').innerHTML='<option value="">Todos</option>'+GRUPOS.map(g=>'<option>'+g+'</option>').join('');
}
function renderProv(){
  const q=(document.getElementById('f-prv-q').value||"").toLowerCase();
  const g=document.getElementById('f-prv-g').value, t=document.getElementById('f-prv-t').value, e=document.getElementById('f-prv-e').value;
  const tb=document.getElementById('prv-body'); tb.innerHTML=""; let n=0;
  PROV.forEach((p,i)=>{
    if(q && !(sinTildes(p.nom).includes(sinTildes(q))||p.ndoc.toLowerCase().includes(q)))return;
    if(g && p.grupo!==g)return; if(t && p.tipo!==t)return; if(e && p.est!==e)return;
    n++;
    const tr=document.createElement('tr'); tr.className="clickable"; tr.onclick=()=>loadProv(i,'ver');
    tr.innerHTML='<td>'+p.id+'</td><td>'+p.nom+'</td><td>'+p.tipo+'</td><td>'+p.grupo+'</td><td>'+p.tdoc+' '+p.ndoc+'</td>'+
     '<td><span class="badge" style="background:'+(p.est==="Activo"?"var(--confirmado)":"var(--borrador)")+'">'+p.est+'</span></td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();loadProv('+i+',\'ver\')">Ver</button> '+
     '<button class="btn-link" onclick="event.stopPropagation();loadProv('+i+',\'editar\')">Editar</button> '+
     '<button class="btn-link" onclick="event.stopPropagation();eliminarProv('+i+')">Eliminar</button></td>';
    tb.appendChild(tr);
  });
  document.getElementById('prv-count').textContent=n+" proveedores";
}
const PRV_CAMPOS=['prv-tipo','prv-nombre','prv-grupo','prv-tdoc','prv-ndoc','prv-cnom','prv-cape','prv-cmail','prv-ctel','prv-dir','prv-pais','prv-prov','prv-ciu'];
function prvSetRO(ro){PRV_CAMPOS.forEach(id=>document.getElementById(id).disabled=ro)}
function prvTab(t){
  ['datos','compras','reclamos'].forEach(x=>{
    document.getElementById('prv-pane-'+x).style.display=(x===t)?"block":"none";
    document.getElementById('prv-tab-'+x).classList.toggle('active',x===t);
  });
}
function prvTabsVisible(v){
  document.getElementById('prv-tab-compras').style.display=v?"inline-block":"none";
  document.getElementById('prv-tab-reclamos').style.display=v?"inline-block":"none";
}
function nuevoProv(){
  PRV={idx:-1,modo:"nuevo"};
  document.getElementById('prv-titulo').textContent="NUEVO PROVEEDOR";
  document.getElementById('prv-id').value="PRV-0008 (auto)";
  ['prv-nombre','prv-ndoc','prv-cnom','prv-cape','prv-cmail','prv-ctel','prv-dir','prv-prov','prv-ciu'].forEach(id=>document.getElementById(id).value="");
  document.getElementById('prv-tipo').value=""; document.getElementById('prv-grupo').value="";
  document.getElementById('prv-tdoc').value="RUC"; document.getElementById('prv-pais').value="PERU";
  prvSetRO(false); prvTabsVisible(false); prvTab('datos'); prvBotones(); setBadgeProv("Activo");
  go('co02');
}
function syncReclamosProv(){
  PROV.forEach(p=>{
    p.reclamos=RECS_ORDEN.filter(k=>RECS[k].prov===p.nom).map(k=>{
      const d=RECS[k];
      const mot=(d.lineas.length>1)?(d.lineas[0].motivo+" (+"+(d.lineas.length-1)+" artículo"+(d.lineas.length>2?"s":"")+")"):(d.lineas[0]?d.lineas[0].motivo:"-");
      return [d.id,d.freg,mot,d.result,d.salida||"-"];
    });
  });
}
function loadProv(i,modo){
  syncReclamosProv();
  const p=PROV[i]; PRV={idx:i,modo:modo};
  document.getElementById('prv-titulo').textContent=(modo==="ver"?"PROVEEDOR: ":"EDITAR: ")+p.nom;
  document.getElementById('prv-id').value=p.id;
  document.getElementById('prv-tipo').value=p.tipo;
  document.getElementById('prv-nombre').value=p.nom;
  document.getElementById('prv-grupo').value=p.grupo;
  document.getElementById('prv-tdoc').value=p.tdoc;
  document.getElementById('prv-ndoc').value=p.ndoc;
  document.getElementById('prv-cnom').value=p.cnom; document.getElementById('prv-cape').value=p.cape;
  document.getElementById('prv-cmail').value=p.cmail; document.getElementById('prv-ctel').value=p.ctel;
  document.getElementById('prv-dir').value=p.dir; document.getElementById('prv-pais').value=p.pais;
  document.getElementById('prv-prov').value=p.prov; document.getElementById('prv-ciu').value=p.ciu;
  prvSetRO(modo==="ver"); prvTabsVisible(modo==="ver"); prvTab('datos'); setBadgeProv(p.est);
  // historiales
  const hc=document.getElementById('prv-hist-compras'); hc.innerHTML="";
  const ESTC={"Completada":"var(--completada)","Para Recibir y Pagar":"var(--prp)"};
  p.compras.forEach(c=>{const ock='oc'+parseInt(c[0].split('-')[1]);const link=OCS[ock]?('loadOC(\''+ock+'\')'):'toast(\'OC histórica (ejemplo)\')';hc.innerHTML+='<tr><td><button class="btn-link" onclick="'+link+'">'+c[0]+'</button></td><td>'+c[1]+'</td><td>'+c[2]+'</td><td style="text-align:right">'+c[3]+'</td><td><span class="badge" style="background:'+(ESTC[c[4]]||"var(--borrador)")+'">'+c[4]+'</span></td></tr>'});
  if(!p.compras.length)hc.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:16px">Sin compras registradas</td></tr>';
  const hr=document.getElementById('prv-hist-reclamos'); hr.innerHTML="";
  p.reclamos.forEach(r=>{const rk=RECS_ORDEN.find(k=>RECS[k].id===r[0]);hr.innerHTML+='<tr><td>'+(rk?('<button class="btn-link" onclick="loadRec(\''+rk+'\')">'+r[0]+'</button>'):r[0])+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+r[4]+'</td></tr>'});
  if(!p.reclamos.length)hr.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:16px">Sin reclamos registrados</td></tr>';
  const nc=document.getElementById('prv-nc-pend');
  const pendNC=NCS.filter(x=>x.prov===p.nom&&x.est==="Pendiente");
  if(pendNC.length){nc.style.display="block";nc.innerHTML='<b style="font-size:12.5px">Notas de Crédito pendientes</b>'+pendNC.map(x=>'<p class="hint" style="margin-top:5px">'+x.id+' por '+(x.mon==="USD"?"USD ":"S/. ")+fmtM(x.monto)+' (origen '+x.rec+'). Visible en las facturas del proveedor para Tesorería. <button class="btn-link" onclick="go(\'co12\')">Ver en CO-12</button></p>').join('')}else nc.style.display="none";
  prvBotones();
  go('co02');
}
function setBadgeProv(est){
  const b=document.getElementById('prv-badge');
  b.textContent=est; b.style.background=(est==="Activo")?"var(--confirmado)":"var(--borrador)";
}
function prvBotones(){
  const m=PRV.modo, show=(id,v)=>document.getElementById(id).style.display=v?"inline-block":"none";
  show('prv-b-guardar',m!=="ver"); show('prv-b-cancelar',m!=="ver");
  show('prv-b-editar',m==="ver"); show('prv-b-desactivar',m==="ver"&&PRV.idx>=0&&PROV[PRV.idx].est==="Activo");
  show('prv-b-volver',m==="ver");
}
function editarProv(){loadProv(PRV.idx,'editar')}
function guardarProv(){
  const tipo=document.getElementById('prv-tipo').value, nom=document.getElementById('prv-nombre').value.trim();
  const ndoc=document.getElementById('prv-ndoc').value.trim();
  if(!tipo){toast("El Tipo de proveedor es obligatorio (Nacional / Internacional)");return}
  if(!nom){toast("El Nombre del proveedor es obligatorio");return}
  if(!ndoc){toast("El N° de documento es obligatorio");return}
  const dup=PROV.some((p,i)=>p.ndoc===ndoc && i!==PRV.idx);
  if(dup){toast("Ya existe un proveedor con ese N° de documento (debe ser único)");return}
  const datos={tipo:tipo,nom:nom,grupo:document.getElementById('prv-grupo').value,tdoc:document.getElementById('prv-tdoc').value,ndoc:ndoc,
   cnom:document.getElementById('prv-cnom').value,cape:document.getElementById('prv-cape').value,cmail:document.getElementById('prv-cmail').value,ctel:document.getElementById('prv-ctel').value,
   dir:document.getElementById('prv-dir').value,pais:document.getElementById('prv-pais').value,prov:document.getElementById('prv-prov').value,ciu:document.getElementById('prv-ciu').value};
  if(PRV.modo==="nuevo"){
    PROV.push({id:"PRV-000"+(PROV.length+1),est:"Activo",compras:[],reclamos:[],nc:"",...datos});
    toast("Proveedor creado"+(tipo==="Internacional"?": habilita compras en USD (CT-08)":""));
  }else{
    Object.assign(PROV[PRV.idx],datos);
    toast("Proveedor actualizado");
  }
  fillGrupoSelects(); renderProv(); go('co01');
}
function desactivarProv(){
  PROV[PRV.idx].est="Inactivo"; setBadgeProv("Inactivo"); prvBotones(); renderProv();
  toast("Proveedor desactivado: no aparecerá en el buscador de documentos (CT-09)");
}
function eliminarProv(i){
  const p=PROV[i];
  const body=document.getElementById('co01a-body'), foot=document.getElementById('co01a-foot');
  if(p.compras.length){
    body.innerHTML='<p><b>'+p.nom+'</b> tiene compras registradas: no puede eliminarse, solo desactivarse <span class="warn" title="Inferencia a afinar">⚠</span>.</p><p class="hint" style="margin-top:8px">El historial de compras y reclamos debe conservarse para trazabilidad.</p>';
    foot.innerHTML='<button class="btn btn-secondary" onclick="closeModal(\'m-co01a\')">Cancelar</button><button class="btn btn-danger" onclick="PROV['+i+'].est=\'Inactivo\';renderProv();closeModal(\'m-co01a\');toast(\'Proveedor desactivado\')">Desactivar</button>';
  }else{
    body.innerHTML='<p>¿Está seguro de eliminar a <b>'+p.nom+'</b>?</p><p class="hint" style="margin-top:8px">No tiene compras registradas: la eliminación es permanente.</p>';
    foot.innerHTML='<button class="btn btn-secondary" onclick="closeModal(\'m-co01a\')">Cancelar</button><button class="btn btn-danger" onclick="PROV.splice('+i+',1);renderProv();closeModal(\'m-co01a\');toast(\'Proveedor eliminado\')">Eliminar</button>';
  }
  openModal('m-co01a');
}

/* --- CO-03 grupos --- */
let grpEdit=-1;
function renderGrupos(){
  const q=(document.getElementById('grp-q').value||"").toLowerCase();
  const tb=document.getElementById('grp-body'); tb.innerHTML="";
  GRUPOS.forEach((g,i)=>{
    if(q && !sinTildes(g).includes(sinTildes(q)))return;
    const count=PROV.filter(p=>p.grupo===g).length;
    if(grpEdit===i){
      tb.innerHTML+='<tr><td><input id="grp-edit-inp" value="'+g+'" style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px"></td><td style="text-align:right">'+count+'</td>'+
       '<td><button class="btn-link" onclick="guardarGrupo('+i+')">Guardar</button> <button class="btn-link" onclick="grpEdit=-1;renderGrupos()">Cancelar</button></td></tr>';
    }else{
      tb.innerHTML+='<tr><td>'+g+'</td><td style="text-align:right">'+count+'</td>'+
       '<td><button class="btn-link" onclick="grpEdit='+i+';renderGrupos()">Editar</button> <button class="btn-link" onclick="eliminarGrupo('+i+')">Eliminar</button></td></tr>';
    }
  });
}
function crearGrupo(){
  const inp=document.getElementById('grp-nuevo'), v=inp.value.trim();
  if(!v){toast("Escriba el nombre del grupo");return}
  if(GRUPOS.some(g=>g.toLowerCase()===v.toLowerCase())){toast("Ese grupo ya existe");return}
  GRUPOS.push(v); inp.value=""; renderGrupos(); fillGrupoSelects();
  toast("Grupo creado: "+v);
}
function guardarGrupo(i){
  const v=document.getElementById('grp-edit-inp').value.trim();
  if(!v){toast("El nombre no puede quedar vacío");return}
  const old=GRUPOS[i]; GRUPOS[i]=v;
  PROV.forEach(p=>{if(p.grupo===old)p.grupo=v});
  grpEdit=-1; renderGrupos(); fillGrupoSelects(); renderProv();
  toast("Grupo actualizado");
}
function eliminarGrupo(i){
  const count=PROV.filter(p=>p.grupo===GRUPOS[i]).length;
  if(count>0){toast("No se puede eliminar: tiene "+count+" proveedores asignados (reasigne antes)");return}
  toast("Grupo eliminado: "+GRUPOS[i]);
  GRUPOS.splice(i,1); renderGrupos(); fillGrupoSelects();
}

/* --- CT-09 --- */
function openCT09(){
  document.getElementById('ct09-g').innerHTML='<option value="">Todos</option>'+GRUPOS.map(g=>'<option>'+g+'</option>').join('');
  renderCT09(); openModal('m-ct09');
}
function renderCT09(){
  const q=(document.getElementById('ct09-q').value||""), g=document.getElementById('ct09-g').value, t=document.getElementById('ct09-t').value;
  const tb=document.getElementById('ct09-body'); tb.innerHTML="";
  PROV.forEach((p,i)=>{
    if(p.est!=="Activo")return;
    if(q && !(sinTildes(p.nom).includes(sinTildes(q))||p.ndoc.toLowerCase().includes(q.toLowerCase())))return;
    if(g && p.grupo!==g)return; if(t && p.tipo!==t)return;
    tb.innerHTML+='<tr><td>'+p.nom+'</td><td>'+p.tdoc+' '+p.ndoc+'</td><td>'+p.grupo+'</td><td>'+p.tipo+'</td>'+
     '<td><button class="btn btn-primary btn-sm" onclick="elegirProvOC('+i+')">Seleccionar</button></td></tr>';
  });
}
function elegirProvOC(i){
  const p=PROV[i]; closeModal('m-ct09');
  OC.prov=p.nom; OC.provTipo=p.tipo; OC.imp=(p.tipo==="Internacional");
  document.getElementById('oc-prov').value=p.nom+" ("+p.tipo+")";
  document.getElementById('oc-titulo').textContent="ORDEN DE COMPRA: "+OC.id+(OC.imp?" · IMPORTACIÓN":"");
  if(OC.imp){
    document.getElementById('oc-mon').value="USD"; OC.mon="USD";
    OC.items.forEach(it=>it.igv=0);
    toast("Proveedor internacional: la OC se trata como importación (USD, IGV en la nacionalización, costos adicionales)");
  }else{
    if(OC.mon==="USD"){document.getElementById('oc-mon').value="S/."; OC.mon="S/."}
    OC.items.forEach(it=>{if(!String(it.cod).startsWith("SERV"))it.igv=18});
    toast("Proveedor seleccionado: "+p.nom);
  }
  renderOCitems();
}


let devolucionCtx=null;
let ingresoCtx=null;
function avisoDevolucion(){
  if(document.getElementById('gi10-tipo').value==="Devoluciones a proveedores" && !(devolucionCtx&&devolucionCtx.rec))
    toast("Referencia: una devolución a proveedor nace de un reclamo procedente (Reclamos CO-11 → Paso 3 → Crear ▾)");
}
function reclamoDesdeIngreso(){
  if(ingresoCtx&&ingresoCtx.oc){nuevoRec(ingresoCtx.oc);toast("Reclamo iniciado desde el ingreso: indique el artículo y la cantidad observada")}
  else toast("Vincule primero la OC del ingreso para sustentar el reclamo");
}
