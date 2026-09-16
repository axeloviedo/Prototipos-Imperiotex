/* COMPRAS · CO-01/02/03 Proveedores y Grupos de Proveedor, CT-09 buscador de proveedor
   Conectado a la base compartida (docs/16 §3.1): BD.d.maestros.proveedores, gruposProveedor y condicionesPago.
   Registro: {cod:'PROV-0001', tipoDoc, doc, nom, comercial, grupo, tipo, estado, email, dir, ubigeo, tel, cel, mon, cond, dias,
              retencion, detraccion, servicio?, alm?, diasEst?, origen, aConfirmar?} */
function sinTildes(t){return String(t==null?"":t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
function coProvs(){return coD().maestros.proveedores}
function coGruposProv(){return coD().maestros.gruposProveedor||(coD().maestros.gruposProveedor=[])}
function coCondiciones(){return coD().maestros.condicionesPago||[]}
function coProvTxt(cod){const p=BD.prov(cod);return p?p.nom:(cod||"")}
/* el campo proveedor.grupo guarda el CÓDIGO del grupo (MP1, SRV, IMP, ADU, GEN) */
function coGrupoProvNom(cod){const g=coGruposProv().find(x=>x.cod===cod);return g?g.nom:(cod||"")}

let PRV={cod:"",modo:"nuevo"}; // modo: nuevo | ver | editar
function fillGrupoSelects(){
  const gs=coGruposProv();
  const opts=g=>g.map(x=>'<option value="'+coEsc(x.cod)+'">'+coEsc(x.cod)+' · '+coEsc(x.nom)+'</option>').join('');
  const s1=document.getElementById('prv-grupo'); if(s1)s1.innerHTML='<option value="">Seleccionar…</option>'+opts(gs);
  const s2=document.getElementById('f-prv-g'); if(s2){const v=s2.value; s2.innerHTML='<option value="">Todos</option>'+opts(gs); s2.value=v;}
  const sc=document.getElementById('prv-cond'); if(sc)sc.innerHTML=coCondiciones().map(c=>'<option value="'+coEsc(c.nom)+'">'+coEsc(c.nom)+'</option>').join('');
  const ss=document.getElementById('prv-servicio');
  if(ss)ss.innerHTML='<option value="">Ninguno</option>'+coD().maestros.articulos.filter(a=>a.grupo==='SRV').map(a=>'<option value="'+a.cod+'">'+a.cod+' · '+coEsc(a.nom)+'</option>').join('');
  const sa=document.getElementById('prv-alm');
  if(sa)sa.innerHTML='<option value="">Ninguno</option>'+coD().maestros.almacenes.map(a=>'<option value="'+a.cod+'">'+a.cod+' · '+coEsc(a.nom)+'</option>').join('');
}
function renderProv(){
  const tb=document.getElementById('prv-body'); if(!tb)return;
  const q=sinTildes(document.getElementById('f-prv-q').value||"");
  const g=document.getElementById('f-prv-g').value, t=document.getElementById('f-prv-t').value, e=document.getElementById('f-prv-e').value;
  let html="", n=0;
  coProvs().forEach(p=>{
    if(q && !(sinTildes(p.nom).includes(q)||sinTildes(p.comercial).includes(q)||sinTildes(p.doc).includes(q)||sinTildes(p.cod).includes(q)))return;
    if(g && p.grupo!==g)return; if(t && p.tipo!==t)return; if(e && p.estado!==e)return;
    n++;
    const srv=p.servicio?(p.servicio+' · '+coEsc(BD.nomArt(p.servicio))):'<span class="hint">-</span>';
    html+='<tr class="clickable" onclick="loadProv(\''+p.cod+'\',\'ver\')"><td>'+p.cod+'</td><td>'+coEsc(p.nom)+(p.aConfirmar?' <span class="warn" title="Datos a confirmar">⚠</span>':'')+'</td><td>'+coEsc(p.tipo)+'</td><td>'+(p.grupo?'<span title="'+coEsc(coGrupoProvNom(p.grupo))+'">'+coEsc(p.grupo)+'</span>':'-')+'</td><td>'+coEsc(p.tipoDoc)+' '+coEsc(p.doc)+'</td>'+
     '<td>'+coEsc(p.cond||'-')+'</td><td>'+srv+'</td>'+
     '<td><span class="badge" style="background:'+(p.estado==="Activo"?"var(--confirmado)":"var(--borrador)")+'">'+coEsc(p.estado)+'</span></td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();loadProv(\''+p.cod+'\',\'ver\')">Ver</button> '+
     '<button class="btn-link" onclick="event.stopPropagation();loadProv(\''+p.cod+'\',\'editar\')">Editar</button> '+
     '<button class="btn-link" onclick="event.stopPropagation();eliminarProv(\''+p.cod+'\')">Eliminar</button></td></tr>';
  });
  tb.innerHTML=html||'<tr><td colspan="9" style="text-align:center;color:var(--texto-sec);padding:16px">Sin proveedores para los filtros aplicados</td></tr>';
  document.getElementById('prv-count').textContent=n+" proveedores";
}
const PRV_CAMPOS=['prv-tipo','prv-nombre','prv-comercial','prv-grupo','prv-tdoc','prv-ndoc','prv-email','prv-tel','prv-cel','prv-dir','prv-ubigeo','prv-mon','prv-cond','prv-retencion','prv-detraccion','prv-servicio','prv-alm','prv-diasest'];
function prvSetRO(ro){PRV_CAMPOS.forEach(id=>{const el=document.getElementById(id); if(el)el.disabled=ro}); const b=document.getElementById('prv-b-grupos'); if(b)b.style.display=ro?"none":"inline-block"}
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
function prvSigCodigo(){
  const max=coProvs().reduce((m,p)=>{const k=parseInt(String(p.cod).replace(/\D/g,''),10);return isFinite(k)&&k>m?k:m},0);
  return "PROV-"+String(max+1).padStart(4,'0');
}
function prvLlenar(p){
  const v=(id,x)=>{const el=document.getElementById(id); if(el)el.value=(x==null?"":x)};
  v('prv-id',p.cod); v('prv-tipo',p.tipo); v('prv-nombre',p.nom); v('prv-comercial',p.comercial); v('prv-grupo',p.grupo);
  v('prv-tdoc',p.tipoDoc||'RUC'); v('prv-ndoc',p.doc); v('prv-email',p.email); v('prv-tel',p.tel); v('prv-cel',p.cel);
  v('prv-dir',p.dir); v('prv-ubigeo',p.ubigeo); v('prv-mon',p.mon||'S/.'); v('prv-cond',p.cond||'Contado');
  v('prv-retencion',p.retencion?'si':'no'); v('prv-detraccion',p.detraccion?'si':'no');
  v('prv-servicio',p.servicio||''); v('prv-alm',p.alm||''); v('prv-diasest',p.diasEst||'');
  document.getElementById('prv-aconf').style.display=p.aConfirmar?"inline-block":"none";
}
function nuevoProv(){
  fillGrupoSelects();
  PRV={cod:"",modo:"nuevo"};
  document.getElementById('prv-titulo').textContent="NUEVO PROVEEDOR";
  prvLlenar({cod:prvSigCodigo()+" (auto)",tipo:"",tipoDoc:"RUC",mon:"S/.",cond:"Contado"});
  prvSetRO(false); prvTabsVisible(false); prvTab('datos'); prvBotones(); setBadgeProv("Activo");
  go('co02');
}
function loadProv(cod,modo){
  const p=BD.prov(cod); if(!p){toast("No existe el proveedor "+cod);return}
  fillGrupoSelects();
  PRV={cod:cod,modo:modo};
  document.getElementById('prv-titulo').textContent=(modo==="ver"?"PROVEEDOR: ":"EDITAR: ")+p.nom;
  prvLlenar(p);
  prvSetRO(modo==="ver"); prvTabsVisible(modo==="ver"); prvTab('datos'); setBadgeProv(p.estado);
  /* historial de compras: órdenes de la base */
  const hc=document.getElementById('prv-hist-compras');
  const ocs=coD().ocs.filter(o=>o.prov===cod);
  hc.innerHTML=ocs.map(o=>{
    const t=Docs.oc.totales(o), a=Docs.oc.avance(o);
    const concepto=o.items.slice(0,2).map(i=>coEsc(BD.nomArt(i.art))).join(', ')+(o.items.length>2?' (+'+(o.items.length-2)+')':'');
    return '<tr><td><button class="btn-link" onclick="abrirOC(\''+o.id+'\')">'+o.id+'</button></td><td>'+o.tipo+'</td><td>'+o.fecha+'</td><td>'+concepto+'</td>'+
     '<td style="text-align:right">'+coMon(o.mon)+fmtM(t.total)+'</td><td style="text-align:right">'+a.rec+'%</td><td style="text-align:right">'+a.fac+'%</td>'+
     '<td><span class="badge" style="background:'+(OC_EST[o.est]||"var(--borrador)")+'">'+o.est+'</span></td></tr>';
  }).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--texto-sec);padding:16px">Sin órdenes de compra registradas</td></tr>';
  /* reclamos: datos de ejemplo (CO-11 no está conectado a la base) */
  const hr=document.getElementById('prv-hist-reclamos');
  const recs=(typeof RECS_ORDEN!=='undefined')?RECS_ORDEN.filter(k=>RECS[k]&&RECS[k].prov===p.nom):[];
  hr.innerHTML=recs.map(k=>{const d=RECS[k];const mot=d.lineas.length?d.lineas[0].motivo+(d.lineas.length>1?' (+'+(d.lineas.length-1)+')':''):'-';
    return '<tr><td><button class="btn-link" onclick="loadRec(\''+k+'\')">'+d.id+'</button></td><td>'+d.freg+'</td><td>'+mot+'</td><td>'+d.result+'</td><td>'+(d.salida||'-')+'</td></tr>'}).join('')
    ||'<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:16px">Sin reclamos registrados</td></tr>';
  const nc=document.getElementById('prv-nc-pend');
  const pendNC=(typeof NCS!=='undefined')?NCS.filter(x=>x.prov===p.nom&&x.est==="Pendiente"):[];
  if(pendNC.length){nc.style.display="block";nc.innerHTML='<b style="font-size:12.5px">Notas de Crédito pendientes (ejemplo)</b>'+pendNC.map(x=>'<p class="hint" style="margin-top:5px">'+x.id+' por '+coMon(x.mon)+fmtM(x.monto)+' (origen '+x.rec+'). <button class="btn-link" onclick="go(\'co12\')">Ver en CO-12</button></p>').join('')}else nc.style.display="none";
  prvBotones();
  go('co02');
}
function setBadgeProv(est){
  const b=document.getElementById('prv-badge');
  b.textContent=est; b.style.background=(est==="Activo")?"var(--confirmado)":"var(--borrador)";
}
function prvBotones(){
  const m=PRV.modo, p=BD.prov(PRV.cod), show=(id,v)=>document.getElementById(id).style.display=v?"inline-block":"none";
  show('prv-b-guardar',m!=="ver"); show('prv-b-cancelar',m!=="ver");
  show('prv-b-editar',m==="ver"); show('prv-b-desactivar',m==="ver"&&!!p&&p.estado==="Activo");
  show('prv-b-activar',m==="ver"&&!!p&&p.estado!=="Activo");
  show('prv-b-volver',m==="ver");
}
function editarProv(){loadProv(PRV.cod,'editar')}
function guardarProv(){
  const val=id=>(document.getElementById(id).value||"").trim();
  const tipo=val('prv-tipo'), nom=val('prv-nombre'), doc=val('prv-ndoc');
  if(!tipo){toast("El Tipo de proveedor es obligatorio (Nacional / Internacional)");return}
  if(!nom){toast("La razón social del proveedor es obligatoria");return}
  if(!doc){toast("El N° de documento es obligatorio");return}
  if(coProvs().some(p=>p.doc===doc && p.cod!==PRV.cod)){toast("Ya existe un proveedor con ese N° de documento (debe ser único)");return}
  const cond=val('prv-cond'), c=coCondiciones().find(x=>x.nom===cond);
  const diasEst=parseInt(val('prv-diasest'),10);
  const datos={tipo:tipo,nom:nom,comercial:val('prv-comercial')||nom,grupo:val('prv-grupo'),tipoDoc:val('prv-tdoc'),doc:doc,
   email:val('prv-email'),tel:val('prv-tel'),cel:val('prv-cel'),dir:val('prv-dir'),ubigeo:val('prv-ubigeo'),
   mon:val('prv-mon')||'S/.',cond:cond||'Contado',dias:c?c.dias:0,retencion:val('prv-retencion')==='si',detraccion:val('prv-detraccion')==='si'};
  const srv=val('prv-servicio'), alm=val('prv-alm');
  let p;
  if(PRV.modo==="nuevo"){
    p=Object.assign({cod:prvSigCodigo()},datos,{estado:"Activo",origen:"prototipo"});
    coProvs().push(p);
  }else{
    p=BD.prov(PRV.cod); if(!p){toast("No existe el proveedor "+PRV.cod);return}
    Object.assign(p,datos);
  }
  if(srv)p.servicio=srv; else delete p.servicio;
  if(alm)p.alm=alm; else delete p.alm;
  if(isFinite(diasEst)&&diasEst>0)p.diasEst=diasEst; else delete p.diasEst;
  BD.guardar();
  toast((PRV.modo==="nuevo"?"Proveedor creado: ":"Proveedor actualizado: ")+p.cod+(tipo==="Internacional"&&PRV.modo==="nuevo"?" · habilita compras en USD":""));
  fillGrupoSelects(); renderProv(); loadProv(p.cod,'ver');
}
function desactivarProv(){
  const p=BD.prov(PRV.cod); if(!p)return;
  p.estado="Inactivo"; BD.guardar(); setBadgeProv("Inactivo"); prvBotones(); renderProv();
  toast("Proveedor desactivado: no aparecerá en el buscador de documentos (CT-09)");
}
function activarProv(){
  const p=BD.prov(PRV.cod); if(!p)return;
  p.estado="Activo"; BD.guardar(); setBadgeProv("Activo"); prvBotones(); renderProv();
  toast("Proveedor activado");
}
function eliminarProv(cod){
  const p=BD.prov(cod); if(!p)return;
  const body=document.getElementById('co01a-body'), foot=document.getElementById('co01a-foot');
  const nOC=coD().ocs.filter(o=>o.prov===cod).length, nFac=coD().facturas.filter(f=>f.prov===cod).length;
  if(nOC||nFac){
    body.innerHTML='<p><b>'+coEsc(p.nom)+'</b> tiene '+nOC+' orden(es) de compra y '+nFac+' factura(s): no puede eliminarse, solo desactivarse.</p><p class="hint" style="margin-top:8px">El historial de compras debe conservarse para trazabilidad.</p>';
    foot.innerHTML='<button class="btn btn-secondary" onclick="closeModal(\'m-co01a\')">Cancelar</button><button class="btn btn-danger" onclick="prvConfirmarDesactivar(\''+cod+'\')">Desactivar</button>';
  }else{
    body.innerHTML='<p>¿Está seguro de eliminar a <b>'+coEsc(p.nom)+'</b> ('+cod+')?</p><p class="hint" style="margin-top:8px">No tiene compras registradas: se quita del maestro compartido de todos los módulos.</p>';
    foot.innerHTML='<button class="btn btn-secondary" onclick="closeModal(\'m-co01a\')">Cancelar</button><button class="btn btn-danger" onclick="prvConfirmarEliminar(\''+cod+'\')">Eliminar</button>';
  }
  openModal('m-co01a');
}
function prvConfirmarDesactivar(cod){const p=BD.prov(cod); if(p){p.estado="Inactivo"; BD.guardar()} closeModal('m-co01a'); renderProv(); toast("Proveedor desactivado")}
function prvConfirmarEliminar(cod){
  const l=coProvs(), i=l.findIndex(p=>p.cod===cod);
  if(i>=0){l.splice(i,1); BD.guardar()}
  closeModal('m-co01a'); renderProv(); toast("Proveedor eliminado: "+cod);
}

/* --- CO-03 grupos --- */
let grpEdit=-1;
function renderGrupos(){
  const q=sinTildes(document.getElementById('grp-q').value||"");
  const tb=document.getElementById('grp-body'); let html="";
  coGruposProv().forEach((g,i)=>{
    if(q && !(sinTildes(g.nom).includes(q)||sinTildes(g.cod).includes(q)))return;
    const count=coProvs().filter(p=>p.grupo===g.cod).length;
    if(grpEdit===i){
      html+='<tr><td>'+coEsc(g.cod)+'</td><td><input id="grp-edit-inp" value="'+coEsc(g.nom)+'" style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px"></td>'+
       '<td><input id="grp-edit-desc" value="'+coEsc(g.desc||'')+'" style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px"></td><td style="text-align:right">'+count+'</td>'+
       '<td><button class="btn-link" onclick="guardarGrupo('+i+')">Guardar</button> <button class="btn-link" onclick="grpEdit=-1;renderGrupos()">Cancelar</button></td></tr>';
    }else{
      html+='<tr><td>'+coEsc(g.cod)+'</td><td>'+coEsc(g.nom)+'</td><td class="hint">'+coEsc(g.desc||'')+'</td><td style="text-align:right">'+count+'</td>'+
       '<td><button class="btn-link" onclick="grpEdit='+i+';renderGrupos()">Editar</button> <button class="btn-link" onclick="eliminarGrupo('+i+')">Eliminar</button></td></tr>';
    }
  });
  tb.innerHTML=html||'<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:14px">Sin grupos</td></tr>';
}
function crearGrupo(){
  const inp=document.getElementById('grp-nuevo'), v=inp.value.trim(), desc=(document.getElementById('grp-desc').value||"").trim();
  if(!v){toast("Escriba el nombre del grupo");return}
  const gs=coGruposProv();
  if(gs.some(g=>sinTildes(g.nom)===sinTildes(v))){toast("Ese grupo ya existe");return}
  let base=sinTildes(v).replace(/[^a-z]/g,'').slice(0,3).toUpperCase()||"GRP", cod=base, n=2;
  while(gs.some(g=>g.cod===cod))cod=base+(n++);
  const ng={cod:cod,nom:v}; if(desc)ng.desc=desc; gs.push(ng); BD.guardar();
  inp.value=""; document.getElementById('grp-desc').value="";
  renderGrupos(); fillGrupoSelects();
  toast("Grupo creado: "+v+" ("+cod+")");
}
function guardarGrupo(i){
  const v=document.getElementById('grp-edit-inp').value.trim(), desc=document.getElementById('grp-edit-desc').value.trim();
  if(!v){toast("El nombre no puede quedar vacío");return}
  const gs=coGruposProv(), g=gs[i];
  if(gs.some((x,j)=>j!==i&&sinTildes(x.nom)===sinTildes(v))){toast("Ya existe otro grupo con ese nombre");return}
  g.nom=v; if(desc)g.desc=desc; else delete g.desc;
  BD.guardar();
  grpEdit=-1; renderGrupos(); fillGrupoSelects(); renderProv();
  toast("Grupo actualizado");
}
function eliminarGrupo(i){
  const gs=coGruposProv(), g=gs[i];
  const count=coProvs().filter(p=>p.grupo===g.cod).length;
  if(count>0){toast("No se puede eliminar: tiene "+count+" proveedores asignados (reasigne antes)");return}
  gs.splice(i,1); BD.guardar();
  toast("Grupo eliminado: "+g.nom);
  renderGrupos(); fillGrupoSelects();
}

/* --- CT-09 buscador de proveedor para la OC en edición --- */
function openCT09(){
  document.getElementById('ct09-g').innerHTML='<option value="">Todos</option>'+coGruposProv().map(g=>'<option value="'+coEsc(g.cod)+'">'+coEsc(g.cod)+' · '+coEsc(g.nom)+'</option>').join('');
  document.getElementById('ct09-q').value="";
  renderCT09(); openModal('m-ct09');
}
function renderCT09(){
  const q=sinTildes(document.getElementById('ct09-q').value||""), g=document.getElementById('ct09-g').value, t=document.getElementById('ct09-t').value;
  const tb=document.getElementById('ct09-body');
  const srvs=(typeof OC!=='undefined'&&OC&&OC.items)?OC.items.map(i=>i.art).filter(a=>BD.esServicio(a)):[];
  const lista=coProvs().filter(p=>{
    if(p.estado!=="Activo")return false;
    if(q && !(sinTildes(p.nom).includes(q)||sinTildes(p.doc).includes(q)||sinTildes(p.cod).includes(q)||sinTildes(p.comercial).includes(q)))return false;
    if(g && p.grupo!==g)return false; if(t && p.tipo!==t)return false;
    return true;
  }).sort((a,b)=>(srvs.includes(b.servicio)?1:0)-(srvs.includes(a.servicio)?1:0));
  tb.innerHTML=lista.map(p=>'<tr'+(srvs.includes(p.servicio)?' style="background:#F0FDF4"':'')+'><td>'+p.cod+'</td><td>'+coEsc(p.nom)+'</td><td>'+coEsc(p.tipoDoc)+' '+coEsc(p.doc)+'</td><td>'+coEsc(p.grupo||'-')+'</td>'+
    '<td>'+(p.servicio?p.servicio:'<span class="hint">-</span>')+'</td><td>'+coEsc(p.tipo)+'</td>'+
    '<td><button class="btn btn-primary btn-sm" onclick="elegirProvOC(\''+p.cod+'\')">Seleccionar</button></td></tr>').join('')
    ||'<tr><td colspan="7" style="text-align:center;color:var(--texto-sec);padding:14px">Sin proveedores activos para los filtros</td></tr>';
}

/* --- utilidades usadas por GI-09 / GI-10 (Inventarios) --- */
let devolucionCtx=null;
let ingresoCtx=null;
function avisoDevolucion(){
  const el=document.getElementById('gi10-tipo');
  if(el && el.value==="Devoluciones a proveedores" && !(devolucionCtx&&devolucionCtx.rec))
    toast("Referencia: una devolución a proveedor nace de un reclamo procedente (Reclamos CO-11 → Paso 3 → Crear ▾)");
}
function reclamoDesdeIngreso(){
  toast("Reclamos (CO-11) usa datos de ejemplo: no se vincula a ingresos reales de la base");
  go('co11');
}
