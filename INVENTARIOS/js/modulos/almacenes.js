/* INVENTARIOS · GI-03 Almacenes y GI-04 ficha del almacén sobre BD.d.maestros.almacenes */
const ROLES=["Logística","Gerencia","Comercial","Vendedor Tienda","Producción"];
let ALM_ACTUAL="", ALM_ROLES=[];
function fillSedes(){
  const f=document.getElementById('f-alm-sede'); if(!f)return;
  const v=f.value; f.innerHTML=opcionesLista(M().sedes.map(s=>s.nom),v,'Todas');
}
function renderAlmacenes(){
  fillSedes();
  const q=Fmt.s(document.getElementById('f-alm-q').value), sede=document.getElementById('f-alm-sede').value, e=document.getElementById('f-alm-e').value;
  const lista=M().almacenes.filter(a=>a.emp===empresaAbrev()&&(!q||Fmt.s(a.cod+' '+a.nom).includes(q))&&(!sede||a.sede===sede)&&(!e||a.estado===e));
  document.getElementById('alm-body').innerHTML=lista.map(a=>{
    const n=Stock.deAlmacen(a.cod).length;
    const ind=[a.transito?badge('En tránsito','var(--aprobada)'):'',a.kardexValorizado?badge('Kardex valorizado','var(--primario-claro)'):badge('Solo cantidades','var(--borrador)')].join(' ');
    return '<tr class="clickable" onclick="abrirAlmacen(\''+a.cod+'\')"><td>'+a.cod+(a.aConfirmar?' <span class="warn" title="Dato del prototipo a confirmar">⚠</span>':'')+'</td><td>'+Fmt.e(a.nom)+'<br><span class="hint">'+Fmt.e(a.obs||'')+'</span></td><td>'+Fmt.e(a.sede)+'</td><td>'+ind+'</td>'+
     '<td style="text-align:right">'+(n||hint('-'))+'</td><td>'+badge(a.estado)+'</td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();abrirAlmacen(\''+a.cod+'\')">Editar</button> <button class="btn-link" onclick="event.stopPropagation();go(\'gi05\');document.getElementById(\'f-stk-a\').value=\''+a.cod+'\';renderStock()">Stock</button></td></tr>';
  }).join('')||'<tr><td colspan="7" style="text-align:center;color:var(--texto-sec);padding:16px">Sin almacenes para los filtros</td></tr>';
  document.getElementById('alm-count').textContent=lista.length+" almacenes ("+empresaAbrev()+")";
}
RENDER.gi03=renderAlmacenes;

function abrirAlmacen(cod){
  const a=cod?BD.alm(cod):null;
  ALM_ACTUAL=a?a.cod:"";
  document.getElementById('gi04-title').textContent=a?"Almacén - "+a.cod:"Nuevo Almacén";
  document.getElementById('gi04-emp').innerHTML=opcionesLista(M().empresas.map(e=>({v:e.abrev,t:e.abrev+' · '+e.nom})),a?a.emp:empresaAbrev(),false);
  document.getElementById('gi04-emp').disabled=!!a;
  const cd=document.getElementById('gi04-cod'); cd.value=a?a.cod:(empresaAbrev()+'-'); cd.readOnly=!!a;
  document.getElementById('gi04-nom').value=a?a.nom:'';
  document.getElementById('gi04-sede').innerHTML=opcionesLista(M().sedes.map(s=>s.nom),a?a.sede:'',false);
  document.getElementById('gi04-estado').value=a?a.estado:'Activo';
  document.getElementById('gi04-obs').value=a?a.obs||'':'';
  document.getElementById('alm-transito').checked=a?!!a.transito:false;
  document.getElementById('alm-kardex').checked=a?!!a.kardexValorizado:true;
  ALM_ROLES=(a&&a.roles)?a.roles.slice():[];
  document.getElementById('chk-permisos-alm').checked=ALM_ROLES.length>0; togglePermisosAlm(ALM_ROLES.length>0);
  renderPermisos();
  document.getElementById('gi04-b-des').style.display=a&&a.estado==='Activo'?'inline-block':'none';
  const filas=a?Stock.deAlmacen(a.cod):[];
  document.getElementById('gi04-stock-card').style.display=a?'block':'none';
  document.getElementById('gi04-stock').innerHTML=filas.map(s=>'<tr><td><button class="btn-link" onclick="verKardex(\''+s.art+'\',\''+s.alm+'\')">'+s.art+'</button> · '+Fmt.e(BD.nomArt(s.art))+'</td><td style="text-align:right">'+Fmt.q(s.act,BD.u(s.art))+'</td><td style="text-align:right">'+Fmt.q(s.comp,BD.u(s.art))+'</td><td style="text-align:right;font-weight:600">'+Fmt.q(s.act-s.comp,BD.u(s.art))+'</td><td style="text-align:right">'+Fmt.m(s.act*s.costo)+'</td></tr>').join('')||'<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:12px">Sin existencias</td></tr>';
  go('gi04');
}
function togglePermisosAlm(on){document.getElementById('gi04-permisos-card').style.display=on?"block":"none"}
function renderPermisos(){
  document.getElementById('gi04-permisos-body').innerHTML=ALM_ROLES.map((r,i)=>'<tr><td><select onchange="ALM_ROLES['+i+']=this.value" style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px">'+opcionesLista(ROLES,r,false)+'</select></td><td><button class="btn-link" onclick="ALM_ROLES.splice('+i+',1);renderPermisos()">Quitar</button></td></tr>').join('');
}
function addPermiso(){ALM_ROLES.push(ROLES.find(r=>!ALM_ROLES.includes(r))||ROLES[0]);renderPermisos()}
function guardarAlmacen(){
  const v=id=>document.getElementById(id).value.trim();
  const cod=v('gi04-cod').toUpperCase(), nom=v('gi04-nom');
  if(!cod||cod.endsWith('-')){toast("Indique el código del almacén");return}
  if(!nom){toast("Indique el nombre del almacén");return}
  if(!ALM_ACTUAL&&BD.alm(cod)){toast("Ya existe el almacén "+cod);return}
  const a=ALM_ACTUAL?BD.alm(ALM_ACTUAL):{cod,origen:'Inventarios'};
  const estado=v('gi04-estado');
  if(ALM_ACTUAL&&estado==='Inactivo'&&a.estado!=='Inactivo'&&Stock.deAlmacen(a.cod).length){toast("No se puede desactivar: el almacén tiene existencias");return}
  Object.assign(a,{emp:v('gi04-emp'),nom,sede:v('gi04-sede'),estado,obs:v('gi04-obs'),
    transito:document.getElementById('alm-transito').checked,kardexValorizado:document.getElementById('alm-kardex').checked});
  if(document.getElementById('chk-permisos-alm').checked&&ALM_ROLES.length)a.roles=ALM_ROLES.slice(); else delete a.roles;
  if(!ALM_ACTUAL)M().almacenes.push(a);
  BD.guardar();
  toast("Almacén "+cod+" guardado en la base compartida");
  go('gi03');
}
function desactivarAlmacen(){
  const a=BD.alm(ALM_ACTUAL); if(!a)return;
  if(Stock.deAlmacen(a.cod).length){toast("No se puede desactivar "+a.cod+": mantiene existencias. Transfiéralas o regularícelas primero");return}
  a.estado='Inactivo'; BD.guardar(); toast(a.cod+" desactivado"); go('gi03');
}
