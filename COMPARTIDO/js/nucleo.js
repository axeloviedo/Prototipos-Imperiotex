/* COMPARTIDO · núcleo de Inventarios y Compras: modales, avisos, empresa, menú lateral y navegación entre pantallas */
/* ===== Modales / util ===== */
function openModal(id){document.getElementById(id).classList.add('open')}
function closeModal(id){document.getElementById(id).classList.remove('open')}
document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open')}));
function toggleBell(e){e.stopPropagation();document.getElementById('bellDrop').classList.toggle('open')}
document.addEventListener('click',()=>{document.getElementById('bellDrop').classList.remove('open');const m=document.getElementById('sol-crear-menu');if(m)m.classList.remove('open')});
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}

/* ===== Empresa ===== */
function cambiarEmpresa(e){
  document.getElementById('logoEmp').textContent = e==="IMPERIOTEX" ? "IMPERIOTEX · SARA BQ" : "CATINNA NOW";
  toast("Empresa activa: "+e);
}

/* ===== Acordeón del menú lateral ===== */
function toggleGrp(g,s){document.getElementById(g).classList.toggle('open');document.getElementById(s).classList.toggle('open')}
function toggleCfg(){document.getElementById('cfgGroup').classList.toggle('open');document.getElementById('cfgSub').classList.toggle('open')}

/* ===== Navegación =====
   BC = miga de pan de cada pantalla, NAVMAP = ítem del menú que se resalta, MST_KEYS = maestros CRUD.
   Cada módulo registra sus pantallas en su js/rutas.js. */
const BC = {}, NAVMAP = {}, MST_KEYS = {};
function go(s){
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  document.getElementById('scr-'+s).classList.add('active');
  document.getElementById('breadcrumb').innerHTML=BC[s]||"";
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.go===NAVMAP[s]));
  if(MST_KEYS[s])renderMst(MST_KEYS[s]);
  window.scrollTo(0,0);
}
function irModulo(f){ if(f) window.location.href=f; }
document.querySelectorAll('.nav-item[data-go]').forEach(x=>x.onclick=()=>go(x.dataset.go));
