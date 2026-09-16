/* INVENTARIOS · GI-10 Crear Salida (Stock.salida). La regularización por faltante es una salida SAL-REGULARIZ con observación (sin tipo Ajuste, decisión J1) */
const SAL={lineas:[]};
function nuevaSalida(){
  SAL.lineas=[];
  prepararCabecera('gi10');
  document.getElementById('gi10-tipo').innerHTML=opcionesTipoMov('SAL','SAL-DEVPROV');
  ['gi10-ndoc','gi10-dest','gi10-obs'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('gi10-alm').innerHTML=opcionesAlm('');
  go('gi10'); renderSalida();
}
function renderSalida(){
  tablaLineas(SAL,{thead:'gi10-head',tbody:'gi10-items',tfoot:'gi10-foot',alm:document.getElementById('gi10-alm').value,disp:true,avisar:true,estVar:'SAL',render:'renderSalida'});
}
BUSCADOR_CTX.gi10={etiqueta:"el almacén origen",soloInv:true,requiereAlm:true,avisaSinStock:true,alm:()=>document.getElementById('gi10-alm').value,
  agregar:cod=>{if(agregarLinea(SAL,cod))renderSalida()}};
function pedirCompletarSalida(){
  const alm=document.getElementById('gi10-alm').value;
  if(!alm){toast("Seleccione el almacén origen");return}
  if(!lineasValidas(SAL))return;
  document.getElementById('gi10b-txt').innerHTML='¿Confirmar la salida de <b>'+SAL.lineas.length+'</b> artículo(s) desde <b>'+Fmt.e(almEtiqueta(alm))+'</b>?';
  openModal('m-gi10b');
}
function completarSalida(){
  closeModal('m-gi10b');
  const tipo=document.getElementById('gi10-tipo').value, t=BD.tipoMov(tipo)||{}, bloq=document.getElementById('gi10-bloq').checked;
  if(/REGULARIZ|FALLADO/.test(tipo)&&!document.getElementById('gi10-obs').value.trim()){toast("Indique en Observaciones el motivo de la "+(/FALLADO/.test(tipo)?"salida por producto fallado":"regularización"));return}
  const r=intentar(()=>Stock.salida({det:'Salida - '+(t.nom||tipo),tipoMov:tipo,alm:document.getElementById('gi10-alm').value,destino:document.getElementById('gi10-dest').value.trim()||'Salida manual',
    ndoc:document.getElementById('gi10-ndoc').value.trim(),obs:document.getElementById('gi10-obs').value.trim(),modulo:'Inventarios',
    lineas:SAL.lineas.map(l=>({art:l.art,cant:l.cant,bloquear:bloq}))}));
  if(!r)return;
  if(!r.ok){toast(r.error);return}
  BD.guardar();
  toast("Salida "+r.mov.id+" completada: stock descontado y Kardex actualizado");
  abrirMov(r.mov.id);
}
