/* INVENTARIOS · GI-CFG Configuración General y GI-19 Series de Documentos.
   Se guardan en BD.d.maestros.configLogistica / seriesInternas / seriesGRE (datos/maestros-logistica.js). */
const cfg=()=>mLog('configLogistica');
function renderCfg(){
  const c=cfg();
  document.getElementById('cfg-precio-min').checked=!!c.precioMinGlobal;
  document.getElementById('cfg-nom-etq').value=c.nombreEtiqueta||'';
  document.getElementById('cfg-imp-ref').checked=!!c.imprimirRef;
  document.getElementById('cfg-lotes-modo').value=c.lotesModo||'manual';
}
function cfgPrecioMin(){}
function cfgEtqNombre(){}
function cfgImprimirRef(){}
function guardarCfg(){
  const c=cfg();
  c.precioMinGlobal=document.getElementById('cfg-precio-min').checked;
  c.nombreEtiqueta=document.getElementById('cfg-nom-etq').value.trim()||'N° Referencia';
  c.imprimirRef=document.getElementById('cfg-imp-ref').checked;
  c.lotesModo=document.getElementById('cfg-lotes-modo').value;
  BD.guardar();
  toast('Configuración general guardada en la base compartida');
}
RENDER.mcfg=renderCfg;

/* ===== GI-19 · Series ===== */
/* cada serie interna numera un tipo de movimiento de la base: el próximo correlativo sale de BD.d.seq */
const SERIE_SEQ={NI:'ing',NS:'sal',NT:'trf'};
const SERIE_PREF={NI:'ING-',NS:'SAL-',NT:'TRF-'};
function serieEmitidos(k){return BD.d.movs.filter(m=>String(m.id).startsWith(SERIE_PREF[k])).length}
function renderSeries(){
  const s=mLog('seriesInternas'), tb=document.getElementById('series-body'); if(!tb)return;
  tb.innerHTML=Object.keys(s).map(k=>'<tr><td>'+s[k].nom+'</td><td><b>'+k+'-</b></td>'+
    '<td><input value="'+String(BD.d.seq[SERIE_SEQ[k]]||1).padStart(6,"0")+'" style="text-align:right" onchange="serieProx(&quot;'+k+'&quot;,this.value)"></td>'+
    '<td style="text-align:right">'+Fmt.n(serieEmitidos(k),0)+'</td>'+
    '<td class="hint">'+s[k].desde+'</td></tr>').join('');
}
function serieProx(k,v){
  const n=parseInt(v,10);
  if(!(n>0)){toast("Correlativo no válido");renderSeries();return}
  const emitidos=serieEmitidos(k);
  if(n<=emitidos){toast("Ya hay "+emitidos+" documentos de esta serie: el próximo correlativo debe ser mayor");renderSeries();return}
  BD.d.seq[SERIE_SEQ[k]]=n; mLog('seriesInternas')[k].prox=n; BD.guardar();
  toast("Próximo correlativo "+k+"-"+String(n).padStart(6,"0"));
  renderSeries();
}
function renderSeriesGRE(){
  const tb=document.getElementById('series-gre-body'); if(!tb)return;
  const prox=String(BD.d.seq.gre||1).padStart(6,'0');
  tb.innerHTML=mLog('seriesGRE').map(x=>'<tr><td>Guía de Remisión Electrónica</td><td><b>'+x.serie+'-</b></td>'+
   '<td style="text-align:right"><span style="color:var(--texto-sec)">'+(x.serie==='T001'?prox:'—')+'</span> <span class="hint">(auto SUNAT)</span></td>'+
   '<td class="hint">'+Fmt.e(almEtiqueta(x.alm))+'</td></tr>').join('');
}
RENDER.gi19=()=>{renderSeries();renderSeriesGRE()};
/* compatibilidad: otras pantallas llamaban a estas funciones */
function aplicarCfgEtiqueta(){}
function aplicarCfgArticulo(){}
