/* INVENTARIOS · Grupo de Artículo: ficha con pestaña Finanzas */
/* ===== Grupo de Artículo · ficha con pestaña Finanzas (28 conceptos contables) ===== */
const CONCEPTOS_FIN=[
 {c:"01",n:"Cuenta de existencias"},
 {c:"02",n:"Existencias por recibir / en tránsito"},
 {c:"03",n:"Cuenta de compra"},
 {c:"04",n:"Variación de existencias"},
 {c:"05",n:"Costo vinculado - flete"},
 {c:"06",n:"Costo vinculado - seguro"},
 {c:"07",n:"Costo vinculado - derechos aduaneros"},
 {c:"08",n:"Costo vinculado - agente de aduanas / comisiones"},
 {c:"09",n:"Costo vinculado - otros"},
 {c:"10",n:"Mercadería recibida por facturar"},
 {c:"11",n:"Devolución / cambio a proveedor"},
 {c:"12",n:"Nota de crédito de proveedor"},
 {c:"13",n:"Consumo de materia prima a la orden"},
 {c:"14",n:"Envío a servicio de terceros (tránsito)"},
 {c:"15",n:"Retorno de servicio de terceros"},
 {c:"16",n:"Ingreso de producto en proceso"},
 {c:"17",n:"Ingreso de producto terminado"},
 {c:"18",n:"Ingreso por cancelación de servicio"},
 {c:"19",n:"Registro de merma"},
 {c:"20",n:"Ingreso por venta"},
 {c:"21",n:"Costo de ventas"},
 {c:"22",n:"Descuentos concedidos"},
 {c:"23",n:"Devolución de cliente / cambio de prenda"},
 {c:"24",n:"Venta o entrega a personal"},
 {c:"25",n:"Regularización por sobrante de inventario"},
 {c:"26",n:"Regularización por faltante de inventario"},
 {c:"27",n:"Carga inicial de stock"},
 {c:"28",n:"Transferencia entre almacenes"}
];
/* Semilla: la cuenta contable única que existía en el grupo pasa al concepto 01 (Cuenta de existencias) */
TIPOS.forEach(t=>{ if(!t.fin)t.fin={}; if(t.cta && !t.fin["01"]) t.fin["01"]=t.cta; });

let GRUPO_WORK=null, GRUPO_NEW=false;
function grupoOpen(idx){
  GRUPO_NEW = (idx<0);
  GRUPO_WORK = GRUPO_NEW ? {cod:"",nom:"",pref:"",asig:"Interna",fin:{}} : TIPOS[idx];
  if(!GRUPO_WORK.fin)GRUPO_WORK.fin={};
  document.getElementById('grupo-title').textContent=(GRUPO_NEW?"Nuevo ":"")+"Grupo de Artículo"+(GRUPO_NEW?"":" · "+(GRUPO_WORK.nom||GRUPO_WORK.cod));
  document.getElementById('gru-cod').value=GRUPO_WORK.cod||"";
  document.getElementById('gru-nom').value=GRUPO_WORK.nom||"";
  document.getElementById('gru-pref').value=GRUPO_WORK.pref||"";
  document.getElementById('gru-asig').value=GRUPO_WORK.asig||"Interna";
  // reset a la pestaña General
  document.querySelectorAll('#grupo-tabs .tab').forEach((x,k)=>x.classList.toggle('active',k===0));
  document.querySelectorAll('#scr-grupo .gtabpane').forEach(x=>x.classList.remove('active'));
  document.getElementById('gpane-general').classList.add('active');
  renderGrupoFin();
  go('grupo');
}
function grupoTab(el){
  document.querySelectorAll('#grupo-tabs .tab').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('#scr-grupo .gtabpane').forEach(x=>x.classList.remove('active'));
  document.getElementById('gpane-'+el.dataset.t).classList.add('active');
}
function renderGrupoFin(){
  const tb=document.getElementById('grupo-fin-body'); if(!tb)return;
  const st='width:100%;border:1px solid var(--borde);border-radius:5px;padding:6px 9px;font-size:12.5px';
  tb.innerHTML=CONCEPTOS_FIN.map(cp=>{
    const v=(GRUPO_WORK.fin&&GRUPO_WORK.fin[cp.c])||"";
    return '<tr><td style="text-align:center;font-weight:600">'+cp.c+'</td><td>'+cp.n+
      '</td><td><input id="gfin-'+cp.c+'" value="'+v.replace(/"/g,'&quot;')+'" placeholder="Cuenta contable…" style="'+st+'"></td></tr>';
  }).join('');
}
function grupoSave(){
  const cod=document.getElementById('gru-cod').value.trim();
  const nom=document.getElementById('gru-nom').value.trim();
  if(!cod){toast("Indique el código del grupo");return}
  if(!nom){toast("Indique el nombre del grupo");return}
  GRUPO_WORK.cod=cod; GRUPO_WORK.nom=nom;
  GRUPO_WORK.pref=document.getElementById('gru-pref').value.trim();
  GRUPO_WORK.asig=document.getElementById('gru-asig').value;
  GRUPO_WORK.fin=GRUPO_WORK.fin||{};
  CONCEPTOS_FIN.forEach(cp=>{const el=document.getElementById('gfin-'+cp.c); if(el)GRUPO_WORK.fin[cp.c]=el.value.trim();});
  if(GRUPO_NEW)TIPOS.push(GRUPO_WORK);
  renderMst('tipos'); go('mtipos');
  toast((GRUPO_NEW?"Creado":"Actualizado")+": Grupo de Artículo");
}
