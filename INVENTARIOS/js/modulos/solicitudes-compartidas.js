/* INVENTARIOS · Solicitudes de Fabricación y de Materiales compartidas con Comercial (?vista=comercial) y Producción, guardadas en localStorage */
/* ===== Vista compartida GI-21 / GI-13 (Logística y Comercial) =====
   Comercial abre estas mismas pantallas con ?vista=comercial&usuario=… dentro de su módulo.
   Las Solicitudes de Fabricación y de Materiales (y el comprometido que dejan) se guardan en localStorage
   para que Logística y Comercial trabajen sobre los mismos datos. Producción lee las aprobadas (PR-03) y, cuando crea sus
   órdenes, lo avisa en 'imperiotex.v9.sf-produccion': aquí la solicitud pasa a «Convertida en Orden».
   Reiniciar borra todas las claves 'imperiotex.' y vuelve TODO el prototipo (todos los módulos) a los datos de demo. */
const GP_QS=new URLSearchParams(location.search);
const VISTA_CM=GP_QS.get('vista')==='comercial';
const USUARIO_GP=GP_QS.get('usuario')||"USER00 · Logística";
const GP_COMP_KEY="imperiotex.v9.solicitudes", GP_COMP_VER=2, SF_PROD_KEY="imperiotex.v9.sf-produccion";
const CM_PANTALLAS=["gi21","gi22","gi23","gi13","gi13f"];
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
/* Producción avisa qué solicitudes ya tienen órdenes: {"SF-000003": {ref, fecha}} */
function gpAplicarProduccion(){
  let m=null; try{m=JSON.parse(localStorage.getItem(SF_PROD_KEY)||"null")}catch(e){m=null}
  if(!m)return false;
  let hubo=false;
  Object.values(SPS).forEach(d=>{
    const x=m[d.id]; if(!x||d.est!=="Aprobada")return;
    d.est="Convertida en Orden"; hubo=true;
    (d.hist=d.hist||[]).push({a:"Órdenes de Fabricación creadas en Producción",d:(x.fecha||"")+" · Producción · "+(x.ref?"Referencia "+x.ref:""),e:"ok"});
  });
  return hubo;
}
/* reinicia TODO el prototipo: Inventarios, Compras, Producción y Comercial vuelven a sus datos de demo */
function gpReiniciarCompartido(){
  if(!confirm("Se reinicia todo el prototipo: se descartan los datos registrados en Inventarios, Compras, Producción y Comercial y todos vuelven al escenario inicial."))return;
  gpSinGuardar=true;
  try{Object.keys(localStorage).filter(k=>k.indexOf("imperiotex.")===0).forEach(k=>localStorage.removeItem(k))}catch(e){}
  location.reload();
}
function irProduccion(h){
  const u=new URL('../PRODUCCION/index.html#'+h,location.href).href;
  (VISTA_CM?window.top:window).location.href=u;
}
gpCargarCompartido();
gpAplicarProduccion();
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
  if(e.key!==GP_COMP_KEY && e.key!==SF_PROD_KEY)return;
  if(e.key===SF_PROD_KEY){ if(gpAplicarProduccion()){renderSP(); if(SP&&document.getElementById('scr-gi23').classList.contains('active'))renderSPform();} return; }
  gpSinGuardar=true;
  try{ if(gpCargarCompartido()){gpAplicarProduccion();renderSP();renderSol();} } finally { gpSinGuardar=false; }
});
