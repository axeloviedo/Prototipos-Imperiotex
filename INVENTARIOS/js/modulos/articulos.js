/* INVENTARIOS · GI-01 Artículos y GI-02 ficha del artículo sobre BD.d.maestros.articulos (contrato §3.2).
   Mínimos por almacén (pestaña Planificación) en BD.d.maestros.minimos (datos/maestros-logistica.js). */
let ART_ACTUAL=null;          /* código del artículo abierto ('' = nuevo) */
let ART_BCS=[], ART_MIN=[];   /* borradores de la ficha: se escriben en la base al Guardar */

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
  document.querySelector('#tbl-art tbody').innerHTML=lista.map(a=>{
    const act=a.inv!==false?Stock.totalAct(a.cod):null;
    return '<tr class="clickable" onclick="openArticleForm(\''+a.cod+'\')"><td>'+a.cod+'</td><td>'+Fmt.e(a.nom)+(a.aConfirmar?' <span class="warn" title="Dato del prototipo a confirmar con el usuario">⚠</span>':'')+'</td>'+
     '<td>'+a.grupo+'</td><td>'+(Fmt.e(a.cat)||hint())+'</td><td>'+badge(a.estado)+'</td><td>'+a.u+'</td><td>'+(a.inv!==false?'Sí':'No')+'</td>'+
     '<td style="text-align:right">'+(act==null?hint('No aplica'):Fmt.q(act,a.u))+'</td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();openArticleForm(\''+a.cod+'\')">Editar</button> '+
     '<button class="btn-link" onclick="event.stopPropagation();openArticleForm(\''+a.cod+'\');duplicarArticulo()">Duplicar</button> '+
     (a.estado==='Activo'?'<button class="btn-link" onclick="event.stopPropagation();pedirDesactivar(\''+a.cod+'\')">Desactivar</button>':'<button class="btn-link" onclick="event.stopPropagation();activarArticulo(\''+a.cod+'\')">Activar</button>')+'</td></tr>';
  }).join('')||'<tr><td colspan="9" style="text-align:center;color:var(--texto-sec);padding:16px">Ningún artículo coincide con los filtros</td></tr>';
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

/* ===== GI-02 · selects ===== */
function umOptions(sel,vacio){return opcionesLista(M().unidades.map(u=>({v:u.cod,t:u.cod+' · '+u.nom})),sel,vacio||false)}
function fillTipos(){document.getElementById('sel-grupo').innerHTML=opcionesLista(M().grupos.map(g=>({v:g.cod,t:g.cod+' · '+g.nom})),'',false)}
function fillCat(grupo,sel){
  document.getElementById('sel-subgrupo').innerHTML='<option value=""></option>'+opcionesLista(M().categorias.filter(c=>c.grupo===grupo).map(c=>c.nom),sel,false);
}
function fillSubcat(sel){
  const cat=document.getElementById('sel-subgrupo').value;
  document.getElementById('sel-subsubgrupo').innerHTML='<option value=""></option>'+opcionesLista(M().subcategorias.filter(x=>x.cat===cat).map(x=>x.nom),sel,false);
}
function refreshCV(){
  const c=M().categorias.find(x=>x.nom===document.getElementById('sel-subgrupo').value);
  if(c&&c.cv)document.getElementById('sel-cv').value=c.cv;
}
function fillUMSelects(sel){
  document.getElementById('sel-um-inv').innerHTML=umOptions(sel||'UND');
}
function syncUMInv(){document.querySelectorAll('.um-inv-mirror').forEach(el=>el.textContent=document.getElementById('sel-um-inv').value)}
function refreshTitle(){
  const est=document.getElementById('sel-estado').value;
  const b=document.getElementById('gi02-estado'); b.textContent=est; b.style.background=COLOR_EST[est];
  const flags=[];
  if(document.getElementById('chk-invble').checked)flags.push("Inventario");
  if(document.getElementById('chk-compra').checked)flags.push("Compra");
  if(document.getElementById('chk-venta').checked)flags.push("Venta");
  if(document.getElementById('chk-manu').checked)flags.push("Producción");
  document.getElementById('gi02-flags').innerHTML=flags.map(f=>'<span class="badge" style="background:var(--primario-claro)">'+f+' ✓</span>').join('');
  document.getElementById('tab-venta').classList.toggle('hidden',!document.getElementById('chk-venta').checked);
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
  ['tab-inv','tab-plan','tab-exist'].forEach(id=>document.getElementById(id).classList.toggle('hidden',serv));
  if(serv){document.getElementById('chk-invble').checked=false;document.getElementById('chk-venta').checked=false;}
  fillCat(g,''); fillSubcat('');
  aplicarCodigo(g);
  document.getElementById('gi02-grupo-meta').textContent=t?t.cod+' · '+t.nom:g;
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
    '<td><input value="'+m.cant+'" style="text-align:right" oninput="ART_MIN['+i+'].cant=parseFloat(this.value)||0"></td><td class="um-inv-mirror">'+u+'</td>'+
    '<td><button class="btn-link" onclick="ART_MIN.splice('+i+',1);renderPlan()">Eliminar</button></td></tr>').join('')||
    '<tr><td colspan="4" style="text-align:center;color:var(--texto-sec);padding:12px">Sin mínimos definidos</td></tr>';
}
function addPlanRow(){ART_MIN.push({alm:"",cant:0});renderPlan()}

/* ===== GI-02 · atributos ===== */
function renderAtributos(attrs){
  attrs=attrs||{};
  document.getElementById('atr-box').innerHTML=M().atributos.map((a,i)=>'<div class="field"><label>'+Fmt.e(a.nom)+'</label><select id="atr-'+i+'"><option value=""></option>'+opcionesLista(a.vals.concat(attrs[a.nom]&&!a.vals.includes(attrs[a.nom])?[attrs[a.nom]]:[]),attrs[a.nom]||'',false)+'</select></div>').join('');
}
function leerAtributos(){
  const o={}; M().atributos.forEach((a,i)=>{const v=document.getElementById('atr-'+i).value; if(v)o[a.nom]=v;}); return o;
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
  chk('chk-invble',a?a.inv!==false:(tipoDe(g)||{}).inv!==false); chk('chk-venta',a?a.venta:g==='PT'); chk('chk-compra',a?a.compra:false); chk('chk-manu',a?a.produccion:g==='PT'||g==='PPT');
  fillUMSelects(a?a.u:'UND');
  set('sel-ctrl',a?a.ctrl||'Nada':'Nada');
  document.getElementById('sel-cv').innerHTML=opcionesLista(M().clasesValoracion.map(x=>({v:x.cod,t:x.cod+' · '+x.nom})),a?a.cv:'',false);
  if(!a)refreshCV();
  document.getElementById('sel-alm-def').innerHTML=opcionesAlm(a?a.alm:'',null,'(ninguno)');
  set('inp-costo',a?a.costo||0:0);
  /* venta */
  set('inp-pventa',a?a.precioVenta:''); set('inp-pmin',a?a.precioMin:''); set('inp-dmin',a?a.dctoMin:''); set('inp-dmax',a?a.dctoMax:''); set('sel-stockctrl',a?a.stockCtrl||'':'');
  const uv=(a&&a.uVenta)||[];
  document.getElementById('uventa-box').innerHTML=M().unidades.map(u=>'<label class="check"><input type="checkbox" class="chk-uventa" value="'+u.cod+'"'+(uv.includes(u.cod)?' checked':'')+'> '+u.cod+'</label>').join('');
  document.getElementById('nota-precio-min').textContent=cfg().precioMinGlobal?"La verificación de precio mínimo está activa para toda la empresa (Configuración General): el precio mínimo mayor que cero bloquea la venta por debajo.":"La verificación global de precio mínimo está apagada en Configuración General.";
  /* compra */
  document.getElementById('sel-gcompra').innerHTML='<option value="">(ninguno)</option>'+opcionesLista((M().gruposCompra||[]).map(x=>({v:x.cod,t:x.cod+' · '+x.nom})),a?a.grupoCompra:'',false);
  document.getElementById('sel-prov').innerHTML='<option value="">(ninguno)</option>'+opcionesLista(M().proveedores.map(p=>({v:p.cod,t:p.cod+' · '+p.nom})),a?a.provDef:'',false);
  document.getElementById('sel-um-compra').innerHTML=umOptions(a?a.uCompra||a.u:'UND','(igual a inventario)');
  set('inp-pcompra',a?a.precioCompra:'');
  const ult=a?ultimoPrecioCompra(a.cod):null;
  set('inp-ultpc',ult==null?'Sin compras registradas':Fmt.m(ult));
  set('sel-igv',a?a.igv||'Gravado':'Gravado');
  /* barras, mínimos, atributos, LDM, existencias */
  ART_BCS=((a&&a.bcs)||[]).map(b=>Object.assign({},b));
  ART_MIN=a?mLog('minimos').filter(m=>m.art===a.cod).map(m=>({alm:m.alm,cant:m.cant})):[];
  renderBarcodes(); renderPlan(); renderAtributos(a?a.attrs:{});
  const ldms=a?BD.ldmsDe(a.cod):[];
  document.getElementById('art-ldms').innerHTML=ldms.length?ldms.map(l=>'<div style="padding:3px 0"><button class="btn-link" onclick="loadLDM(\''+l.id+'\')">'+l.id+'</button> · '+Fmt.e(l.nom)+' '+(l.pred?badge('Predeterminada','var(--aprobado-sol)'):hint('Alternativa'))+'</div>').join(''):hint('Sin lista de materiales: no es fabricable.');
  const filas=a?BD.d.stock.filter(s=>s.art===a.cod&&(s.act||s.comp)):[];
  document.getElementById('art-exist').innerHTML=filas.map(s=>'<tr><td>'+Fmt.e(almEtiqueta(s.alm))+'</td><td style="text-align:right">'+Fmt.q(s.act,a.u)+'</td><td style="text-align:right">'+Fmt.q(s.comp,a.u)+'</td><td style="text-align:right;font-weight:600">'+Fmt.q(s.act-s.comp,a.u)+'</td><td style="text-align:right">'+Fmt.m(s.costo)+'</td><td><button class="btn-link" onclick="verKardex(\''+a.cod+'\',\''+s.alm+'\')">Kardex</button></td></tr>').join('')||'<tr><td colspan="6" style="text-align:center;color:var(--texto-sec);padding:12px">Sin existencias</td></tr>';
  document.getElementById('gi02-b-dup').style.display=a?'inline-block':'none';
  document.getElementById('gi02-b-des').style.display=a&&a.estado==='Activo'?'inline-block':'none';
  refreshTitle(); syncUMInv();
  go('gi02');
  tab(document.querySelector('#gi02-tabs .tab[data-t=general]'));
}
function ultimoPrecioCompra(cod){
  for(const o of BD.d.ocs){ if(o.est==='Cancelada'||o.est==='Borrador')continue; const it=o.items.find(i=>i.art===cod); if(it)return it.pu*(o.mon==='USD'?o.tc:1); }
  return null;
}
function numOVacio(id){const v=document.getElementById(id).value;return v===''?undefined:(parseFloat(v)||0)}
function guardarArticulo(){
  const g=document.getElementById('sel-grupo').value, nom=document.getElementById('inp-nombre').value.trim().toUpperCase();
  const cod=(document.getElementById('inp-codigo').value||'').trim().toUpperCase();
  if(!nom){toast("Indique el nombre del artículo");return}
  if(!cod){toast("Indique el código del artículo");return}
  if(M().articulos.some(a=>a.cod!==ART_ACTUAL&&a.nom.toUpperCase()===nom)){toast("Ya existe un artículo con ese nombre: el nombre es único");return}
  if(!ART_ACTUAL&&BD.art(cod)){toast("El código "+cod+" ya existe");return}
  if(ART_MIN.some(m=>!m.alm)){toast("Elija el almacén de cada mínimo o quite la fila");return}
  if(document.getElementById('chk-compra').checked&&!document.getElementById('sel-gcompra').value){toast("Elija el grupo de compras (pestaña Compra): el artículo se compra");return}
  const a=ART_ACTUAL?BD.art(ART_ACTUAL):{cod,origen:'Inventarios'};
  const v=id=>document.getElementById(id).value;
  Object.assign(a,{
    nom, desc:v('inp-desc').trim(), grupo:g, cat:v('sel-subgrupo'), subcat:v('sel-subsubgrupo'), u:v('sel-um-inv'), ctrl:v('sel-ctrl'), cv:v('sel-cv'),
    inv:document.getElementById('chk-invble').checked, compra:document.getElementById('chk-compra').checked, venta:document.getElementById('chk-venta').checked, produccion:document.getElementById('chk-manu').checked,
    igv:v('sel-igv'), estado:v('sel-estado'), costo:parseFloat(v('inp-costo'))||0, attrs:leerAtributos(), bcs:ART_BCS.filter(b=>b.cod)
  });
  const alm=v('sel-alm-def'); if(alm)a.alm=alm; else delete a.alm;
  [['precioCompra','inp-pcompra'],['precioVenta','inp-pventa'],['precioMin','inp-pmin'],['dctoMin','inp-dmin'],['dctoMax','inp-dmax']].forEach(([k,id])=>{const n=numOVacio(id); if(n===undefined)delete a[k]; else a[k]=n;});
  const gc=v('sel-gcompra'); if(gc)a.grupoCompra=gc; else delete a.grupoCompra;
  const prov=v('sel-prov'); if(prov)a.provDef=prov; else delete a.provDef;
  const uc=v('sel-um-compra'); if(uc)a.uCompra=uc; else delete a.uCompra;
  const sc=v('sel-stockctrl'); if(sc)a.stockCtrl=sc; else delete a.stockCtrl;
  const uv=[...document.querySelectorAll('.chk-uventa:checked')].map(x=>x.value); if(uv.length)a.uVenta=uv; else delete a.uVenta;
  if(!Object.keys(a.attrs).length)delete a.attrs;
  if(!ART_ACTUAL)M().articulos.push(a);
  const mins=mLog('minimos'); for(let i=mins.length-1;i>=0;i--)if(mins[i].art===a.cod)mins.splice(i,1);
  ART_MIN.filter(m=>m.cant>0).forEach(m=>mins.push({art:a.cod,alm:m.alm,cant:m.cant}));
  BD.guardar();
  toast("Artículo "+a.cod+" guardado en la base compartida");
  go('gi01');
}

/* ===== GI-02 · Duplicar ===== */
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
  delete nuevo.aConfirmar;
  M().articulos.push(nuevo); BD.guardar();
  closeModal('m-gi02d');
  toast("Artículo duplicado: "+cod+" · "+nom+" (ajuste atributos si aplica)");
  openArticleForm(cod);
}
