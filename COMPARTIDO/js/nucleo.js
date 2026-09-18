/* COMPARTIDO · núcleo de Inventarios y Compras: modales, avisos, empresa, menú lateral, navegación entre pantallas
   y utilidades de presentación sobre la base compartida (BD, Stock, Docs: docs/16_BASE_DATOS_COMPARTIDA.md). */
/* ===== Vista compartida con Comercial =====
   Comercial abre GI-21/22/23 y GI-13 dentro de su módulo con ?vista=comercial&usuario=…: se oculta el menú y se avisa la miga al padre. */
const QS_NUCLEO=new URLSearchParams(location.search);
const VISTA_CM=QS_NUCLEO.get('vista')==='comercial';
const USUARIO_ACTIVO=(VISTA_CM&&QS_NUCLEO.get('usuario'))||'USER00 · Logística';
const CM_PANTALLAS=["gi21","gi22","gi23","gi13","gi13f"];

/* ===== Modales / util ===== */
function openModal(id){document.getElementById(id).classList.add('open')}
function closeModal(id){document.getElementById(id).classList.remove('open')}
document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open')}));
function toggleBell(e){e.stopPropagation();document.getElementById('bellDrop').classList.toggle('open')}
document.addEventListener('click',()=>{const b=document.getElementById('bellDrop');if(b)b.classList.remove('open');document.querySelectorAll('.dropmenu.open').forEach(m=>m.classList.remove('open'))});
let toastTimer=null;
function toast(msg){const t=document.getElementById('toast');if(!msg)return;t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3200)}
/* ejecuta una operación de la base (Docs/Stock): si lanza error lo muestra como aviso y devuelve null */
function intentar(fn){try{return fn()}catch(e){toast(e.message||String(e));return null}}

/* ===== Formato ===== */
const Fmt={
  /* número con separador es-PE; d = decimales máximos. Las cantidades se guardan con 4 decimales y se muestran con 2 como máximo */
  n(v,d){return (Number(v)||0).toLocaleString('es-PE',{minimumFractionDigits:0,maximumFractionDigits:Math.min(2,d==null?2:d)})},
  /* dinero con 2 decimales */
  m(v){return (Number(v)||0).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2})},
  /* cantidad con su unidad */
  q(v,u){return Fmt.n(v,2)+(u?' '+u:'')},
  s(t){return String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')},
  e(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')},
  /* dd/mm/aaaa [hh:mm] ⇄ aaaa-mm-dd (inputs date) */
  iso(f){const p=String(f||'').split(' ')[0].split('/');return p.length===3?p[2]+'-'+p[1]+'-'+p[0]:''},
  bd(iso){const p=String(iso||'').split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:''},
  /* número comparable de una fecha dd/mm/aaaa */
  num(f){const p=String(f||'').split(' ')[0].split('/');return p.length===3?Number(p[2]+p[1]+p[0]):0}
};
const hint=t=>'<span class="hint">'+(t==null?'—':t)+'</span>';
const COLOR_EST={
  /* genéricos */
  "Borrador":"var(--borrador)","Activo":"var(--confirmado)","Inactivo":"var(--borrador)",
  /* movimientos */
  "Confirmado":"var(--confirmado)","Completada":"var(--completada)",
  /* Solicitud de Fabricación */
  "Pendiente Aprobar":"var(--pendiente)","Aprobada":"var(--confirmado)","Rechazada":"var(--rechazado-sol)","Convertida en Orden":"var(--completada)","Fabricada":"var(--prp)",
  /* Solicitud de Materiales (documento y línea) */
  "Pendiente":"var(--pendiente)","En proceso":"var(--aprobada)","Atendida":"var(--completada)","Anulada":"var(--cancelada)",
  "Transferido":"var(--completada)","En compra":"var(--prp)","Recibido":"var(--completada)","En transferencia":"var(--aprobada)",
  /* Solicitud de Transferencia */
  "Parcial":"var(--parcial)","Recibida":"var(--completada)",
  /* Orden de Compra */
  "Pendiente de Validar":"var(--pendiente)","Para Recibir y Pagar":"var(--aprobada)","Para Recibir":"var(--oc-recibir)","Para Pagar":"var(--oc-pagar)","Cancelada":"var(--cancelada)",
  /* GRE */
  "Aceptada SUNAT":"var(--gre-aceptado)","Enviada":"var(--gre-enviado)"
};
function badge(t,color){return '<span class="badge" style="background:'+(color||COLOR_EST[t]||'var(--borrador)')+'">'+Fmt.e(t)+'</span>'}
/* aviso fijo de las pantallas que siguen con datos de ejemplo */
const AVISO_EJEMPLO='<div class="card" style="border-left:4px solid var(--pendiente);background:#FFFBEB;padding:10px 14px"><b style="font-size:12.5px">Datos de ejemplo · no conectado a la base</b> <span class="hint">Esta pantalla no lee ni escribe la base compartida del prototipo.</span></div>';

/* ===== Lecturas de presentación sobre BD ===== */
/* la base se abre al cargar (el arranque vuelve a llamarla: es idempotente) para que los módulos puedan leer BD.d */
BD.iniciar(USUARIO_ACTIVO);
const M=()=>BD.d.maestros;
/* maestro o colección propia de Logística (datos/maestros-logistica.js): si la base se creó antes de declararlo, se agrega */
function mLog(k){
  if(M()[k]===undefined&&typeof BD_LOGISTICA!=='undefined'&&BD_LOGISTICA.maestros[k]!==undefined){M()[k]=BD.copia(BD_LOGISTICA.maestros[k]);BD.guardar();}
  return M()[k];
}
function colLog(k){
  if(BD.d[k]===undefined&&typeof BD_LOGISTICA!=='undefined'&&BD_LOGISTICA.colecciones[k]!==undefined){BD.d[k]=BD.copia(BD_LOGISTICA.colecciones[k]);BD.guardar();}
  return BD.d[k];
}
function almEtiqueta(cod){const a=BD.alm(cod);return a?a.cod+' · '+a.nom:(cod||'')}
function artEtiqueta(cod){return cod?cod+' · '+BD.nomArt(cod):''}
/* <option> de almacenes activos de la empresa activa (sel = código elegido); filtro(a) opcional */
function opcionesAlm(sel,filtro,vacio){
  const lista=M().almacenes.filter(a=>a.emp===empresaAbrev() && (a.estado!=='Inactivo'||a.cod===sel) && (!filtro||filtro(a)));
  return (vacio===false?'':'<option value="">'+(vacio||'Seleccionar…')+'</option>')+lista.map(a=>'<option value="'+a.cod+'"'+(a.cod===sel?' selected':'')+'>'+a.cod+' · '+Fmt.e(a.nom)+'</option>').join('');
}
function opcionesLista(lista,sel,vacio){
  return (vacio===false?'':'<option value="">'+(vacio||'Todos')+'</option>')+lista.map(x=>{const v=typeof x==='object'?x.v:x, t=typeof x==='object'?x.t:x;return '<option value="'+Fmt.e(v)+'"'+(v===sel?' selected':'')+'>'+Fmt.e(t)+'</option>'}).join('');
}
function grupoNom(cod){const g=M().grupos.find(x=>x.cod===cod);return g?g.nom:(cod||'')}

/* ===== Empresa ===== */
function empresaAbrev(){const s=document.getElementById('selEmpresa');const e=M().empresas.find(x=>x.nom===(s?s.value:'IMPERIOTEX'));return e?e.abrev:'SB'}
function cambiarEmpresa(e){
  document.getElementById('logoEmp').textContent = e==="IMPERIOTEX" ? "IMPERIOTEX · SARA BQ" : "CATINNA NOW";
  BD.empresa = empresaAbrev();
  toast("Empresa activa: "+e+" · los almacenes se filtran por empresa");
  if(typeof refrescarTodo==='function')refrescarTodo();
}

/* ===== Acordeón del menú lateral ===== */
function toggleGrp(g,s){document.getElementById(g).classList.toggle('open');document.getElementById(s).classList.toggle('open')}
function toggleCfg(){document.getElementById('cfgGroup').classList.toggle('open');document.getElementById('cfgSub').classList.toggle('open')}

/* ===== Navegación =====
   BC = miga de pan de cada pantalla, NAVMAP = ítem del menú que se resalta, MST_KEYS = maestros CRUD,
   RENDER = función que repinta la pantalla al entrar y cuando la base cambia en otra pestaña.
   Cada módulo registra sus pantallas en su js/rutas.js (BC/NAVMAP) y en su js/modulos (RENDER). */
const BC = {}, NAVMAP = {}, MST_KEYS = {}, RENDER = {};
let PANTALLA="";
function go(s){
  if(VISTA_CM&&!CM_PANTALLAS.includes(s)){toast("Esa pantalla es de Logística: ábrala en Inventarios (GI)");return}
  const scr=document.getElementById('scr-'+s); if(!scr){toast("Pantalla no disponible: "+s);return}
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  scr.classList.add('active'); PANTALLA=s;
  document.getElementById('breadcrumb').innerHTML=BC[s]||"";
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.go===NAVMAP[s]));
  if(MST_KEYS[s]&&typeof renderMst==='function')renderMst(MST_KEYS[s]);
  if(RENDER[s])RENDER[s]();
  window.scrollTo(0,0);
  if(VISTA_CM&&window.parent!==window){try{window.parent.postMessage({tipo:"gp-miga",html:BC[s]||""},"*")}catch(e){}}
}
/* repinta la pantalla activa (tras una operación o un cambio de otra pestaña) */
function refrescarPantalla(){if(PANTALLA&&RENDER[PANTALLA])RENDER[PANTALLA]()}
function irModulo(f){ if(f) window.location.href=f; }
function irProduccion(h){
  const u=new URL('../PRODUCCION/index.html#'+h,location.href).href;
  (VISTA_CM?window.top:window).location.href=u;
}
document.querySelectorAll('.nav-item[data-go]').forEach(x=>x.onclick=()=>go(x.dataset.go));
