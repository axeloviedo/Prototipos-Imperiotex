/* COMPARTIDO · arranque de Inventarios y Compras: abre la base compartida, monta el selector de datos, pinta las listas
   iniciales y abre la pantalla de inicio o la del #hash. Cada index.html llama a arrancar('<pantalla de inicio>') al final.
   Las pantallas de Inventarios se pintan al entrar (RENDER[pantalla] en nucleo.js); Compras mantiene sus listas globales. */
const LISTAS_ARRANQUE=["fillGrupoSelects","renderProv","renderOCS","renderFac","renderRec","renderNC","renderPanelCompras","renderCCD","renderSugerido"];
function llamar(nombre){
  const f=window[nombre]; if(typeof f!=='function')return;
  try{f()}catch(e){console.warn('Arranque: '+nombre+' falló · '+(e&&e.message))}
}
function pintarListas(){LISTAS_ARRANQUE.forEach(llamar);pintarCampana()}
function refrescarTodo(){pintarListas();refrescarPantalla()}
/* formularios con datos sin guardar: no se repintan cuando otra pestaña cambia la base */
function pantallaEnEdicion(){
  if(document.querySelector('#modales .overlay.open'))return true;
  const s=PANTALLA;
  if(['gi02','gi04','gi09','gi10','gi15','gi17f','gi22','grupo','mcfg'].includes(s))return true;
  if(s==='gi11'&&typeof TRF!=='undefined'&&!TRF.id)return true;
  if(s==='gi13f'&&typeof SOLF!=='undefined'&&(!SOLF.id||(BD.sol(SOLF.id)||{}).estado==='Borrador'))return true;
  if(s==='gi23'&&typeof SPF!=='undefined'&&SPF.sucio)return true;
  return /^co0[27]$|^co10$/.test(s);
}
function pintarCampana(){
  const cont=document.getElementById('bell-items'); if(!cont)return;
  const it=[];
  mLog('minimos').forEach(m=>{const d=Stock.disp(m.alm,m.art);if(d<=m.cant)it.push({c:d<=0?'var(--stock-cero)':'var(--stock-bajo)',t:(d<=0?'Stock agotado: ':'Por agotarse: ')+BD.nomArt(m.art)+' - '+m.alm,s:'Disponible '+Fmt.n(d)+' · mínimo '+m.cant,a:"verKardex('"+m.art+"','"+m.alm+"')"})});
  const n1=BD.d.sfs.filter(s=>s.est==='Pendiente Aprobar').length; if(n1)it.push({c:'var(--pendiente)',t:n1+' Solicitud(es) de Fabricación por aprobar',s:'GI-21',a:"go('gi21')"});
  const n2=BD.d.sols.filter(s=>s.estado==='Pendiente').length; if(n2)it.push({c:'var(--pendiente)',t:n2+' Solicitud(es) de Materiales por aprobar',s:'GI-13',a:"go('gi13')"});
  const n3=(BD.d.trfs||[]).filter(s=>s.estado==='Aprobada'||s.estado==='Parcial').length; if(n3)it.push({c:'var(--aprobada)',t:n3+' Transferencia(s) pendiente(s) de recibir en destino',s:'GI-11',a:"go('gi07')"});
  cont.innerHTML=it.slice(0,8).map(x=>'<div class="it" onclick="'+x.a+'"><span class="dot" style="background:'+x.c+';margin-top:4px"></span><div>'+Fmt.e(x.t)+'<br><small>'+Fmt.e(x.s)+'</small></div></div>').join('')||'<div class="it"><div class="hint">Sin notificaciones</div></div>';
  const dot=document.querySelector('.bell .dot'); if(dot)dot.style.display=it.length?'':'none';
}
function arrancar(inicio){
  BD.iniciar(USUARIO_ACTIVO);
  if(VISTA_CM)document.body.classList.add('vista-cm');
  BDSelector.montar(document.getElementById('bd-selector'));
  const chip=document.getElementById('usuario-chip'); if(chip)chip.textContent=BD.usuario;
  BD.alCambiar(()=>{ pintarListas(); if(!pantallaEnEdicion())refrescarPantalla(); });
  pintarListas();
  go(VISTA_CM?'gi21':inicio);
  aplicarHash();
  window.addEventListener('hashchange',aplicarHash);
}
/* #pantalla o #pantalla=ID (co07=OC-000001, gi13=SOL-000001, gi23=SF-000001, gi08=ING-000001, gi11=ST-000001, gi16=T001-000001, gi02=PT-0001) */
function aplicarHash(){
  const h=decodeURIComponent((location.hash||"").replace('#','')); if(!h)return;
  const [s,id]=h.split('=');
  const abrir={co07:x=>typeof irOC==='function'?irOC(x):null,gi13:abrirSOL,gi13f:abrirSOL,gi23:abrirSF,gi08:abrirMov,gi11:abrirST,gi16:abrirGRE,gi02:openArticleForm,gi04:abrirAlmacen,gi17f:loadLDM};
  if(id&&abrir[s]){abrir[s](id);return}
  if(document.getElementById('scr-'+s))go(s);
}
