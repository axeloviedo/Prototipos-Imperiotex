/* INVENTARIOS · GI-01 Artículos y GI-02 ficha del artículo (diseño V9, decisión L1) sobre BD.d.maestros.articulos (contrato §3.2).
   Mínimos por almacén (pestaña Planificación) en BD.d.maestros.minimos (datos/maestros-logistica.js). */
let ART_ACTUAL=null;                  /* código del artículo abierto ('' = nuevo) */
let ART_BCS=[], ART_MIN=[], ART_ATR=[]; /* borradores de la ficha: se escriben en la base al Guardar */

/* ===== GI-01 ===== */
function fillArtFilters(){
  const g=document.getElementById('f-art-g'), v=g.value;
  g.innerHTML=opcionesLista(M().grupos.map(x=>({v:x.cod,t:x.cod+' · '+x.nom})),v,'Todos');
  fillArtCatFiltro();
}
function fillArtCatFiltro(){
  const g=document.getElementById('f-art-g').value, c=document.getElementById('f-art-sg'), v=c.value;
  c.innerHTML=opcionesLista(M().categorias.filter(x=>!g||x.grupo===g).map(x=>x.nom),v,'Todas');
}
function renderArt(){
  const q=Fmt.s(document.getElementById('f-art-q').value);
  const g=document.getElementById('f-art-g').value, sg=document.getElementById('f-art-sg').value, e=document.getElementById('f-art-e').value, uso=document.getElementById('f-art-uso').value;
  const lista=M().articulos.filter(a=>{
    if(q && !(Fmt.s(a.cod).includes(q)||Fmt.s(a.nom).includes(q)))return false;
    if(g && a.grupo!==g)return false; if(sg && a.cat!==sg)return false; if(e && a.estado!==e)return false;
    if(uso && !a[uso])return false;
    return true;
  });
  document.querySelector('#tbl-art tbody').innerHTML=lista.map(a=>
    '<tr class="clickable" onclick="openArticleForm(\''+a.cod+'\')"><td>'+a.cod+'</td><td>'+Fmt.e(a.nom)+(a.aConfirmar?' <span class="warn" title="Dato del prototipo a confirmar con el usuario">⚠</span>':'')+'</td>'+
     '<td>'+a.grupo+'</td><td>'+(Fmt.e(a.cat)||hint())+'</td><td>'+badge(a.estado)+'</td><td>'+a.u+'</td><td>'+(a.inv!==false?'Sí':'No')+'</td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();openArticleForm(\''+a.cod+'\')">Editar</button> '+
     '<button class="btn-link" onclick="event.stopPropagation();openArticleForm(\''+a.cod+'\');duplicarArticulo()">Duplicar</button> '+
     (a.estado==='Activo'?'<button class="btn-link" onclick="event.stopPropagation();pedirDesactivar(\''+a.cod+'\')">Desactivar</button>':'<button class="btn-link" onclick="event.stopPropagation();activarArticulo(\''+a.cod+'\')">Activar</button>')+'</td></tr>'
  ).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--texto-sec);padding:16px">Ningún artículo coincide con los filtros</td></tr>';
  document.getElementById('art-count').textContent=lista.length+" de "+M().articulos.length+" artículos";
}
function filterArt(){renderArt()}
RENDER.gi01=()=>{fillArtFilters();renderArt()};

let DESACT_COD="";
function pedirDesactivar(cod){
  if(!cod){toast("Guarde primero el artículo");return}
  DESACT_COD=cod; const a=BD.art(cod), st=Stock.totalAct(cod);
  document.getElementById('gi01a-txt').innerHTML='¿Desactivar <b>'+cod+' · '+Fmt.e(a.nom)+'</b>?'+(st?' Tiene <b>'+Fmt.q(st,a.u)+'</b> en stock: seguirá visible en Existencias hasta que se consuma.':'');
  openModal('m-gi01a');
}
function confirmarDesactivar(){
  const a=BD.art(DESACT_COD); if(!a)return;
  a.estado='Inactivo'; BD.guardar(); closeModal('m-gi01a');
  toast(a.cod+" desactivado"); if(PANTALLA==='gi02')openArticleForm(a.cod); else renderArt();
}
function activarArticulo(cod){const a=BD.art(cod);a.estado='Activo';BD.guardar();renderArt();toast(cod+" activado")}

/* ===== GI-02 · selects, título y pestañas ===== */
function umOptions(sel){return opcionesLista(M().unidades.map(u=>({v:u.cod,t:u.cod+' · '+u.nom})),sel,false)}
function fillTipos(){document.getElementById('sel-grupo').innerHTML=opcionesLista(M().grupos.map(g=>({v:g.cod,t:g.cod+' · '+g.nom})),'',false)}
function fillCat(grupo,sel){
  document.getElementById('sel-subgrupo').innerHTML='<option value=""></option>'+opcionesLista(M().categorias.filter(c=>c.grupo===grupo).map(c=>c.nom),sel,false);
}
function fillSubcat(sel){
  const cat=document.getElementById('sel-subgrupo').value;
  document.getElementById('sel-subsubgrupo').innerHTML='<option value=""></option>'+opcionesLista(M().subcategorias.filter(x=>x.cat===cat).map(x=>x.nom),sel,false);
}
function syncUMInv(){document.querySelectorAll('.um-inv-mirror').forEach(el=>el.value=document.getElementById('sel-um-inv').value)}
const CTRL_FMT={Nada:"—",Lote:"LOT-AAAA-####",Serie:"SER-AAAA-####"};
function ctrlChange(){
  const v=document.getElementById('sel-ctrl').value;
  document.getElementById('ctrl-fmt').value=CTRL_FMT[v]||"—";
  document.getElementById('fld-vence').style.display=v==="Lote"?"flex":"none";
  if(v!=="Lote")document.getElementById('chk-vence').checked=false;
}
function refreshTitle(){
  const est=document.getElementById('sel-estado').value;
  const b=document.getElementById('gi02-estado'); b.textContent=est; b.style.background=COLOR_EST[est];
  const flags=[];
  if(document.getElementById('chk-compra').checked)flags.push("Compra");
  if(document.getElementById('chk-venta').checked)flags.push("Venta");
  if(document.getElementById('chk-manu').checked)flags.push("Fabricación");
  document.getElementById('gi02-flags').innerHTML=flags.map(f=>'<span class="badge" style="background:var(--primario-claro)">'+f+' ✓</span>').join('');
}
/* precio mínimo (L1): vive en el artículo; si la verificación global de Configuración General está activa, aplica a todos */
function togglePrecioMin(on){document.getElementById('fld-precio-min').style.display=on?"flex":"none"}
function aplicarCfgPrecioMin(verifMin){
  const chk=document.getElementById('chk-precio-min'), nota=document.getElementById('nota-precio-min');
  if(cfg().precioMinGlobal){
    chk.checked=true; chk.disabled=true;
    nota.textContent="La verificación está activada para toda la empresa en Configuración General; aquí no se puede desactivar.";
  }else{
    chk.checked=!!verifMin; chk.disabled=false;
    nota.textContent="La verificación global está apagada: este check decide si el precio mínimo se aplica a este artículo.";
  }
  togglePrecioMin(chk.checked);
}
function tipoDe(cod){return M().grupos.find(t=>t.cod===cod)}
function nextCodigo(pref){
  pref=pref||'ART-'; const esc=pref.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  let max=0; M().articulos.forEach(a=>{const m=(a.cod||"").match(new RegExp("^"+esc+"(\\d+)$"));if(m)max=Math.max(max,parseInt(m[1],10))});
  return pref+String(max+1).padStart(4,"0");
}
function aplicarCodigo(grupo){
  const t=tipoDe(grupo), f=document.getElementById('inp-codigo'), l=document.getElementById('lbl-codigo');
  if(ART_ACTUAL){f.value=ART_ACTUAL;f.readOnly=true;l.textContent="Código";}
  else if(t&&t.asignacion==="Externa"){f.value="";f.readOnly=false;f.placeholder="Ingrese código único";l.textContent="Código (asignación externa · manual)";}
  else{f.value=nextCodigo(t?t.prefijo:"ART-");f.readOnly=true;l.textContent="Código (auto · asignación interna)";}
  document.getElementById('gi02-code').textContent=f.value||"(externo)";
}
function applyGrupo(g){
  const t=tipoDe(g), serv=t&&t.inv===false;
  ['tab-inv','tab-plan','tab-manu'].forEach(id=>document.getElementById(id).classList.toggle('hidden',serv));
  if(serv)document.getElementById('chk-invble').checked=false;
  fillCat(g,''); fillSubcat('');
  aplicarCodigo(g);
  document.getElementById('gi02-grupo-meta').textContent=t?t.cod+' · '+t.nom:g;
  const gc=t&&t.grupoCompra&&(M().gruposCompra||[]).find(x=>x.cod===t.grupoCompra);
  document.getElementById('inp-gcompra').value=gc?gc.cod+' · '+gc.nom:(t&&t.grupoCompra)||'(el grupo no define grupo de compras)';
  if(serv){const act=document.querySelector('#gi02-tabs .tab.active');if(act&&act.classList.contains('hidden'))tab(document.querySelector('#gi02-tabs .tab[data-t=general]'));}
  refreshTitle();
}
function tab(el){
  document.querySelectorAll('#gi02-tabs .tab').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('#scr-gi02 .tabpane').forEach(x=>x.classList.remove('active'));
  document.getElementById('pane-'+el.dataset.t).classList.add('active');
}

/* ===== GI-02 · códigos de barra ===== */
function renderBarcodes(){
  document.getElementById('bc-head').innerHTML='<tr><th style="width:36px">#</th><th style="width:210px">Tipo de código</th><th>Código de barras</th><th style="width:110px"></th><th style="width:70px"></th></tr>';
  const tb=document.getElementById('bc-body');
  tb.innerHTML=ART_BCS.map((b,i)=>'<tr><td>'+(i+1)+'</td>'+
     '<td><select onchange="ART_BCS['+i+'].tipo=this.value" style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px">'+opcionesLista(M().tiposCodigoBarra,b.tipo,false)+'</select></td>'+
     '<td><input value="'+Fmt.e(b.cod)+'" oninput="ART_BCS['+i+'].cod=this.value" style="width:100%"></td>'+
     '<td><button class="btn-link" onclick="verEtiqueta('+i+')">Ver etiqueta</button></td>'+
     '<td><button class="btn-link" onclick="ART_BCS.splice('+i+',1);renderBarcodes()">Quitar</button></td></tr>').join('')||
     '<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:14px">Sin códigos: use "+ Agregar código"</td></tr>';
}
function addBarcode(){ART_BCS.push({tipo:M().tiposCodigoBarra[1]||M().tiposCodigoBarra[0]||"Interno",cod:"CI-"+(document.getElementById('inp-codigo').value||"NUEVO")+"-"+(ART_BCS.length+1)});renderBarcodes()}
function verEtiqueta(i){
  const b=ART_BCS[i], c=cfg();
  document.getElementById('etq-nom').textContent=document.getElementById('inp-nombre').value;
  let barras='';
  for(let x=0;x<44;x++){const w=[1,1,2,1,3,1,2,1][x%8];barras+='<span style="display:inline-block;width:'+w+'px;height:52px;background:#111;margin-right:'+((x%3)+1)+'px"></span>'}
  document.getElementById('etq-barras').innerHTML=barras;
  document.getElementById('etq-num').textContent=b.cod;
  const ref=document.getElementById('etq-corte');
  ref.style.display=c.imprimirRef?"block":"none"; ref.textContent=c.nombreEtiqueta+": (se toma del movimiento de ingreso)";
  document.getElementById('etq-nota').textContent="Tipo: "+b.tipo+". "+(c.imprimirRef?"La segunda línea es el valor de «"+c.nombreEtiqueta+"» del movimiento de ingreso (Configuración General).":"La impresión de la referencia está desactivada en Configuración General.");
  openModal('m-etq');
}

/* ===== GI-02 · planificación (mínimos) ===== */
function renderPlan(){
  const u=document.getElementById('sel-um-inv').value;
  document.getElementById('plan-body').innerHTML=ART_MIN.map((m,i)=>'<tr><td><select onchange="ART_MIN['+i+'].alm=this.value" style="width:100%">'+opcionesAlm(m.alm)+'</select></td>'+
    '<td><input value="'+m.cant+'" style="text-align:right" oninput="ART_MIN['+i+'].cant=parseFloat(this.value)||0"></td><td><input class="um-inv-mirror" value="'+u+'" readonly></td>'+
    '<td><button class="btn-link" onclick="ART_MIN.splice('+i+',1);renderPlan()">Eliminar</button></td></tr>').join('')||
    '<tr><td colspan="4" style="text-align:center;color:var(--texto-sec);padding:12px">Sin mínimos definidos</td></tr>';
}
function addPlanRow(){ART_MIN.push({alm:"",cant:0});renderPlan()}

/* ===== GI-02 · atributos (tabla editable como V9; se guardan como {atributo: valor}) ===== */
function renderAtributos(){
  const st='width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px';
  document.getElementById('tbl-atributos').innerHTML=ART_ATR.map((x,i)=>{
    const at=M().atributos.find(a=>a.nom===x[0]), vals=at?at.vals.concat(x[1]&&!at.vals.includes(x[1])?[x[1]]:[]):[];
    return '<tr><td>'+(i+1)+'</td>'+
     '<td><select onchange="ART_ATR['+i+']=[this.value,\'\'];renderAtributos()" style="'+st+'"><option value=""></option>'+opcionesLista(M().atributos.map(a=>a.nom),x[0],false)+'</select></td>'+
     '<td><select onchange="ART_ATR['+i+'][1]=this.value" style="'+st+'"><option value=""></option>'+opcionesLista(vals,x[1],false)+'</select></td>'+
     '<td><button class="btn-link" onclick="ART_ATR.splice('+i+',1);renderAtributos()">Quitar</button></td></tr>';
  }).join('')||'<tr><td colspan="4" style="text-align:center;color:var(--texto-sec);padding:14px">Sin atributos (opcional): use "+ Crear"</td></tr>';
}
function addAtributoRow(){ART_ATR.push(["",""]);renderAtributos()}

/* ===== GI-02 · precios de compra (de las facturas de proveedor registradas) ===== */
function preciosCompraFacturas(cod){
  const pus=[];
  BD.d.facturas.forEach(f=>{ if(/anul/i.test(f.est||''))return; const k=(f.mon==='USD'||f.mon==='US$')?(f.tc||1):1;
    (f.items||[]).filter(i=>i.art===cod).forEach(i=>pus.push({pu:i.pu*k,cant:i.cant})); });
  if(!pus.length)return null;
  const cant=pus.reduce((t,x)=>t+x.cant,0);
  return {ultimo:pus[0].pu, promedio:cant?pus.reduce((t,x)=>t+x.pu*x.cant,0)/cant:pus[0].pu};
}

/* ===== GI-02 · abrir y guardar ===== */
function openArticleForm(cod){
  const a=cod?BD.art(cod):null;
  ART_ACTUAL=a?a.cod:"";
  const g=a?a.grupo:"PT";
  fillTipos();
  document.getElementById('gi02-title').textContent=a?"Editar Artículo":"Nuevo Artículo";
  document.getElementById('gi02-name').textContent=a?a.nom:"ARTÍCULO NUEVO";
  document.getElementById('sel-grupo').value=g;
  document.getElementById('sel-grupo').disabled=!!a;
  applyGrupo(g);
  fillCat(g,a?a.cat:''); fillSubcat(a?a.subcat:'');
  const set=(id,v)=>document.getElementById(id).value=v==null?'':v, chk=(id,v)=>document.getElementById(id).checked=!!v;
  set('inp-nombre',a?a.nom:''); set('inp-desc',a?a.desc:''); set('sel-estado',a?a.estado:'Activo');
  chk('chk-invble',a?a.inv!==false:(tipoDe(g)||{}).inv!==false); chk('chk-venta',a?a.venta:g==='PT'); chk('chk-compra',a?a.compra:false);
  /* inventario */
  document.getElementById('sel-um-inv').innerHTML=umOptions(a?a.u:'UND');
  set('sel-ctrl',a?a.ctrl||'Nada':'Nada'); ctrlChange(); chk('chk-vence',a&&a.ctrl==='Lote'&&a.vence);
  /* venta */
  set('inp-pventa',a?a.precioVenta:'');
  document.getElementById('sel-um-venta').innerHTML=umOptions(a?a.uVenta||a.u:'UND');
  set('inp-pmin',a?a.precioMin:''); set('inp-dmin',a?a.dctoMin:''); set('inp-dmax',a?a.dctoMax:'');
  aplicarCfgPrecioMin(a&&a.verifMin);
  /* compra */
  document.getElementById('sel-prov').innerHTML='<option value="">-</option>'+opcionesLista(M().proveedores.map(p=>({v:p.cod,t:p.cod+' · '+p.nom})),a?a.provDef:'',false);
  document.getElementById('sel-um-compra').innerHTML=umOptions(a?a.uCompra||a.u:'UND');
  const pc=a?preciosCompraFacturas(a.cod):null;
  set('inp-ultpc',pc?Fmt.m(pc.ultimo):'Sin facturas registradas'); set('inp-prompc',pc?Fmt.m(pc.promedio):'Sin facturas registradas');
  set('sel-igv',a?a.igv||'Gravado':'Gravado');
  /* producción: con lista de materiales no se puede desmarcar «apto» */
  const ldms=a?BD.ldmsDe(a.cod):[];
  chk('chk-manu',ldms.length||(a?a.produccion:g==='PT'||g==='PPT'));
  document.getElementById('chk-manu').disabled=ldms.length>0;
  document.getElementById('hint-manu').textContent=ldms.length?'(tiene lista de materiales: no se puede desmarcar)':'(el artículo puede ser el producto final de una Lista de Materiales)';
  document.getElementById('art-ldms').innerHTML=ldms.length?ldms.map(l=>'<div style="padding:3px 0"><button class="btn-link" onclick="loadLDM(\''+l.id+'\')">'+l.id+'</button> · '+Fmt.e(l.nom)+' '+(l.pred?badge('Predeterminada','var(--aprobado-sol)'):hint('Alternativa'))+'</div>').join(''):hint('Sin lista de materiales: no es fabricable.');
  /* barras, mínimos, atributos */
  ART_BCS=((a&&a.bcs)||[]).map(b=>Object.assign({},b));
  ART_MIN=a?mLog('minimos').filter(m=>m.art===a.cod).map(m=>({alm:m.alm,cant:m.cant})):[];
  ART_ATR=Object.entries((a&&a.attrs)||{});
  renderBarcodes(); renderPlan(); renderAtributos();
  document.getElementById('gi02-b-dup').style.display=a?'inline-block':'none';
  document.getElementById('gi02-b-des').style.display=a&&a.estado==='Activo'?'inline-block':'none';
  refreshTitle(); syncUMInv();
  go('gi02');
  tab(document.querySelector('#gi02-tabs .tab[data-t=general]'));
}
function numOVacio(id){const v=document.getElementById(id).value;return v===''?undefined:(parseFloat(v)||0)}
/* UM de venta/compra referenciales (L5): si difiere de la de inventario debe existir la conversión */
function faltaConversion(um,uInv){return um&&um!==uInv&&!M().conversiones.some(c=>c.de===um&&c.a===uInv)}
function guardarArticulo(){
  const v=id=>document.getElementById(id).value, chk=id=>document.getElementById(id).checked;
  const g=v('sel-grupo'), nom=v('inp-nombre').trim().toUpperCase(), cod=(v('inp-codigo')||'').trim().toUpperCase();
  if(!nom){toast("Indique el nombre del artículo");return}
  if(!cod){toast("Indique el código del artículo");return}
  if(M().articulos.some(a=>a.cod!==ART_ACTUAL&&a.nom.toUpperCase()===nom)){toast("Ya existe un artículo con ese nombre: el nombre es único");return}
  if(!ART_ACTUAL&&BD.art(cod)){toast("El código "+cod+" ya existe");return}
  if(ART_MIN.some(m=>!m.alm)){toast("Elija el almacén de cada mínimo o quite la fila");return}
  const u=v('sel-um-inv'), uv=v('sel-um-venta'), uc=v('sel-um-compra');
  for(const [x,txt] of [[uv,'venta'],[uc,'compra']])
    if(faltaConversion(x,u)){toast("No existe la conversión "+x+" → "+u+" (UM de "+txt+"): créela en Configuraciones → Conversiones");return}
  const dmin=numOVacio('inp-dmin'), dmax=numOVacio('inp-dmax');
  if((dmin||0)<0||(dmax||0)>100){toast("Los descuentos van de 0% a 100%");return}
  if(dmin!==undefined&&dmax!==undefined&&dmin>dmax){toast("El descuento mínimo no puede ser mayor que el máximo");return}
  const atr={};
  for(const [k,val] of ART_ATR){ if(!k)continue; if(k in atr){toast("El atributo "+k+" está repetido");return} if(val)atr[k]=val; }
  const a=ART_ACTUAL?BD.art(ART_ACTUAL):{cod,costo:0,origen:'Inventarios'};
  const ctrl=v('sel-ctrl');
  Object.assign(a,{
    nom, desc:v('inp-desc').trim(), grupo:g, cat:v('sel-subgrupo'), subcat:v('sel-subsubgrupo'), u, ctrl, vence:ctrl==='Lote'&&chk('chk-vence'),
    inv:chk('chk-invble'), compra:chk('chk-compra'), venta:chk('chk-venta'), produccion:chk('chk-manu')||BD.ldmsDe(a.cod).length>0,
    igv:v('sel-igv'), estado:v('sel-estado'), verifMin:chk('chk-precio-min'), attrs:atr, bcs:ART_BCS.filter(b=>b.cod), uVenta:uv, uCompra:uc
  });
  [['precioVenta','inp-pventa'],['precioMin','inp-pmin'],['dctoMin','inp-dmin'],['dctoMax','inp-dmax']].forEach(([k,id])=>{const n=numOVacio(id); if(n===undefined)delete a[k]; else a[k]=n;});
  const prov=v('sel-prov'); if(prov)a.provDef=prov; else delete a.provDef;
  if(!a.vence)delete a.vence;
  if(!Object.keys(a.attrs).length)delete a.attrs;
  if(!ART_ACTUAL)M().articulos.push(a);
  const mins=mLog('minimos'); for(let i=mins.length-1;i>=0;i--)if(mins[i].art===a.cod)mins.splice(i,1);
  ART_MIN.filter(m=>m.cant>0).forEach(m=>mins.push({art:a.cod,alm:m.alm,cant:m.cant}));
  BD.guardar();
  toast("Artículo "+a.cod+" guardado en la base compartida");
  go('gi01');
}

/* ===== GI-02 · Duplicar (no copia códigos de barras; atributos sin valor) ===== */
function duplicarArticulo(){
  if(!ART_ACTUAL){toast("Guarde primero el artículo");return}
  const a=BD.art(ART_ACTUAL), t=tipoDe(a.grupo);
  document.getElementById('dup-src').textContent=a.cod+' · '+a.nom;
  document.getElementById('dup-nombre').value="";
  document.getElementById('dup-tipo').value=a.grupo+' · '+grupoNom(a.grupo);
  const f=document.getElementById('dup-cod'), l=document.getElementById('dup-cod-lbl'), n=document.getElementById('dup-cod-nota');
  if(t&&t.asignacion==="Externa"){f.value="";f.readOnly=false;l.textContent="Código (asignación externa · manual)";n.textContent="Este grupo usa asignación externa: ingrese un código único.";}
  else{f.value=nextCodigo(t?t.prefijo:"ART-");f.readOnly=true;l.textContent="Código (asignación interna · auto)";n.textContent="Este grupo usa asignación interna: el sistema propone el siguiente código.";}
  openModal('m-gi02d');
}
function confirmarDuplicar(){
  const nom=document.getElementById('dup-nombre').value.trim().toUpperCase(), cod=document.getElementById('dup-cod').value.trim().toUpperCase();
  if(!nom){toast("Indique el nombre nuevo (único)");return}
  if(M().articulos.some(a=>a.nom.toUpperCase()===nom)){toast("Ya existe un artículo con ese nombre");return}
  if(!cod||BD.art(cod)){toast("Indique un código único");return}
  const base=BD.art(ART_ACTUAL);
  const nuevo=Object.assign(BD.copia(base),{cod,nom,estado:"Activo",origen:'Inventarios',bcs:[]});
  delete nuevo.aConfirmar; delete nuevo.attrs;
  M().articulos.push(nuevo); BD.guardar();
  closeModal('m-gi02d');
  openArticleForm(cod);
  ART_ATR=Object.keys(base.attrs||{}).map(k=>[k,""]); renderAtributos();
  toast("Artículo duplicado: "+cod+" · "+nom+" (sin códigos de barras; complete los atributos y guarde)");
}
