/* INVENTARIOS · GI-CFG Configuración General y GI-19 Series de Documentos.
   Se guardan en BD.d.maestros.configLogistica / seriesInternas / seriesGRE (datos/maestros-logistica.js). */
const cfg=()=>mLog('configLogistica');
function renderCfg(){
  const c=cfg();
  document.getElementById('cfg-precio-min').checked=!!c.precioMinGlobal;
  document.getElementById('cfg-nom-etq').value=c.nombreEtiqueta||'';
  document.getElementById('cfg-imp-ref').checked=!!c.imprimirRef;
  document.getElementById('cfg-lotes-modo').value=c.lotesModo||'manual';
  renderCamposUsr();
}
function renderCamposUsr(){
  const cu=cfg().camposUsuario;
  document.getElementById('cfg-cu-body').innerHTML=cu.map((c,i)=>
   '<tr><td>'+(i+1)+'</td>'+
   '<td><input value="'+Fmt.e(c.lbl)+'" oninput="cfg().camposUsuario['+i+'].lbl=this.value"></td>'+
   '<td><select onchange="cfg().camposUsuario['+i+'].apl=this.value">'+opcionesLista(["Artículos","Almacenes","Movimientos"],c.apl,false)+'</select></td>'+
   '<td style="text-align:center"><input type="checkbox"'+(c.filtro?" checked":"")+' onchange="cfg().camposUsuario['+i+'].filtro=this.checked"></td>'+
   '<td><button class="btn-link" onclick="delCampoUsuario('+i+')">Eliminar</button></td></tr>').join('');
}
function addCampoUsuario(){cfg().camposUsuario.push({lbl:"Nuevo campo",apl:"Artículos",filtro:true});renderCamposUsr()}
function delCampoUsuario(i){cfg().camposUsuario.splice(i,1);renderCamposUsr()}
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
function renderSeries(){
  const s=mLog('seriesInternas'), tb=document.getElementById('series-body'); if(!tb)return;
  tb.innerHTML=Object.keys(s).map(k=>'<tr><td>'+s[k].nom+'</td><td><b>'+k+'-</b></td>'+
    '<td><input value="'+String(s[k].prox).padStart(6,"0")+'" style="text-align:right" onchange="serieProx(\''+k+'\',this.value)"></td>'+
    '<td class="hint">'+s[k].desde+'</td></tr>').join('');
}
function serieProx(k,v){const n=parseInt(v,10);if(!(n>0)){toast("Correlativo no válido");renderSeries();return}mLog('seriesInternas')[k].prox=n;BD.guardar();toast("Próximo correlativo "+k+"-"+String(n).padStart(6,"0"))}
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
