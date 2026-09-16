/* INVENTARIOS · GI-CFG Configuración General y GI-19 Series de Documentos */
/* ===== GI-CFG · Configuración General ===== */
const CFG={precioMinGlobal:true, nombreEtiqueta:"Referencia de etiqueta", imprimirRef:true, lotesModo:"manual"};
let CAMPOS_USR=[
 {lbl:"Línea comercial",apl:"Artículos",filtro:true},
 {lbl:"Campaña",apl:"Artículos",filtro:true}
];
function renderCamposUsr(){
  document.getElementById('cfg-cu-body').innerHTML=CAMPOS_USR.map((c,i)=>
   '<tr><td>'+(i+1)+'</td>'+
   '<td><input value="'+c.lbl+'" oninput="CAMPOS_USR['+i+'].lbl=this.value"></td>'+
   '<td><select onchange="CAMPOS_USR['+i+'].apl=this.value"><option'+(c.apl==="Artículos"?" selected":"")+'>Artículos</option><option'+(c.apl==="Almacenes"?" selected":"")+'>Almacenes</option><option'+(c.apl==="Movimientos"?" selected":"")+'>Movimientos</option></select></td>'+
   '<td style="text-align:center"><input type="checkbox"'+(c.filtro?" checked":"")+' onchange="CAMPOS_USR['+i+'].filtro=this.checked"></td>'+
   '<td><button class="btn-link" onclick="delCampoUsuario('+i+')">Eliminar</button></td></tr>').join('');
}
function addCampoUsuario(){CAMPOS_USR.push({lbl:"Nuevo campo",apl:"Artículos",filtro:true});renderCamposUsr()}
function delCampoUsuario(i){CAMPOS_USR.splice(i,1);renderCamposUsr()}
function cfgPrecioMin(){
  CFG.precioMinGlobal=document.getElementById('cfg-precio-min').checked;
  aplicarCfgArticulo();
}
function cfgEtqNombre(){CFG.nombreEtiqueta=document.getElementById('cfg-nom-etq').value||"Referencia de etiqueta";aplicarCfgEtiqueta()}
function cfgImprimirRef(){CFG.imprimirRef=document.getElementById('cfg-imp-ref').checked;aplicarCfgEtiqueta()}
function aplicarCfgEtiqueta(){
  const l=document.getElementById('lbl-refetq-09');
  if(l)l.innerHTML=CFG.nombreEtiqueta+' <span class="hint">(libre · '+(CFG.imprimirRef?'se imprime en la etiqueta':'no se imprime')+')</span>';
  const l8=document.getElementById('lbl-refetq-08');
  if(l8)l8.textContent=CFG.nombreEtiqueta;
}
function aplicarCfgArticulo(){
  /* Con la verificación global activa, el check por artículo queda gobernado por la configuración */
  const chk=document.getElementById('chk-precio-min'), fld=document.getElementById('fld-precio-min');
  if(!chk||!fld)return;
  const nota=document.getElementById('nota-precio-min');
  if(CFG.precioMinGlobal){
    chk.checked=true; chk.disabled=true; fld.style.display="flex";
    if(nota)nota.textContent="La verificación está activada para toda la empresa en Configuración General; aquí no se puede desactivar.";
  }else{
    chk.disabled=false;
    if(nota)nota.textContent="La verificación global está apagada: este check decide si el precio mínimo se aplica a este artículo.";
  }
}
function guardarCfg(){
  CFG.lotesModo=document.getElementById('cfg-lotes-modo').value;
  cfgPrecioMin(); cfgEtqNombre(); cfgImprimirRef();
  toast('Configuración general guardada');
}
