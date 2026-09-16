/* INVENTARIOS · Solicitudes de Pedido y de Materiales compartidas con Comercial (?vista=comercial) y guardadas en localStorage */
/* ===== Vista compartida GP-01 / GI-13 (Logística y Comercial) =====
   Comercial abre estas mismas pantallas con ?vista=comercial&usuario=… dentro de su módulo.
   Las Solicitudes de Pedido y de Materiales (y el comprometido que dejan) se guardan en localStorage
   para que Logística y Comercial trabajen sobre los mismos datos. Producción solo ve las aprobadas (PR-03). */
const GP_QS=new URLSearchParams(location.search);
const VISTA_CM=GP_QS.get('vista')==='comercial';
const USUARIO_GP=GP_QS.get('usuario')||"USER00 · Logística";
const GP_COMP_KEY="imperiotex.v9.solicitudes", GP_COMP_VER=1;
const CM_PANTALLAS=["gp01","gp02","gp03","gi13","gi13f"];
let gpSinGuardar=false;
function gpGuardarCompartido(){
  if(gpSinGuardar)return;
  try{localStorage.setItem(GP_COMP_KEY,JSON.stringify({v:GP_COMP_VER,SPS,SPS_ORDEN,SP_SEQ,SOLS,SOL_LISTA,SOL_SEQ,stockRes:STOCK.map(r=>r.res)}))}catch(e){}
}
function gpCargarCompartido(){
  let d=null; try{d=JSON.parse(localStorage.getItem(GP_COMP_KEY)||"null")}catch(e){d=null}
  if(!d||d.v!==GP_COMP_VER)return false;
  Object.keys(SPS).forEach(k=>delete SPS[k]); Object.assign(SPS,d.SPS);
  SPS_ORDEN.splice(0,SPS_ORDEN.length,...d.SPS_ORDEN); SP_SEQ=d.SP_SEQ;
  Object.keys(SOLS).forEach(k=>delete SOLS[k]); Object.assign(SOLS,d.SOLS);
  SOL_LISTA.splice(0,SOL_LISTA.length,...d.SOL_LISTA); SOL_SEQ=d.SOL_SEQ;
  if(Array.isArray(d.stockRes)&&d.stockRes.length===STOCK.length)STOCK.forEach((r,i)=>{r.res=d.stockRes[i]});
  if(SPkey&&SPS[SPkey])SP=SPS[SPkey];
  return true;
}
function gpReiniciarCompartido(){
  if(!confirm("Se descartan las Solicitudes de Pedido y de Materiales registradas (también en Comercial) y se vuelve al escenario inicial."))return;
  gpSinGuardar=true;
  try{localStorage.removeItem(GP_COMP_KEY)}catch(e){}
  location.reload();
}
function irProduccion(h){
  const u=new URL('../PRODUCCION/index.html#'+h,location.href).href;
  (VISTA_CM?window.top:window).location.href=u;
}
gpCargarCompartido();
["renderSP","renderSol","renderSPform"].forEach(n=>{const f=window[n];window[n]=function(){const r=f.apply(this,arguments);gpGuardarCompartido();return r}});
{
  const goBase=go;
  go=function(s){
    if(VISTA_CM&&!CM_PANTALLAS.includes(s)){toast("Esa pantalla es de Logística: ábrala en Inventarios (GI)");return}
    goBase(s); gpGuardarCompartido();
    if(VISTA_CM&&window.parent!==window){try{window.parent.postMessage({tipo:"gp-miga",html:BC[s]||""},"*")}catch(e){}}
  };
}
if(VISTA_CM)document.body.classList.add('vista-cm');
window.addEventListener('pagehide',gpGuardarCompartido);
/* Si la otra vista (otra pestaña) guarda, se recargan las listas sin volver a escribir */
window.addEventListener('storage',e=>{
  if(e.key!==GP_COMP_KEY)return;
  gpSinGuardar=true;
  try{ if(gpCargarCompartido()){renderSP();renderSol();} } finally { gpSinGuardar=false; }
});
