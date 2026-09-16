/* INVENTARIOS · Grupo de Artículo: ficha con pestaña Finanzas.
   General en BD.d.maestros.grupos; las cuentas por concepto en BD.d.maestros.finanzasGrupo (datos/maestros-logistica.js). */
let GRUPO_IDX=-1;
function grupoOpen(idx){
  GRUPO_IDX=idx;
  const g=idx>=0?M().grupos[idx]:{cod:"",nom:"",prefijo:"",asignacion:"Interna",inv:true};
  document.getElementById('grupo-title').textContent=idx<0?"Nuevo Grupo de Artículo":"Grupo de Artículo · "+g.nom;
  const cod=document.getElementById('gru-cod'); cod.value=g.cod||""; cod.readOnly=idx>=0;
  document.getElementById('gru-nom').value=g.nom||"";
  document.getElementById('gru-pref').value=g.prefijo||"";
  document.getElementById('gru-asig').value=g.asignacion||"Interna";
  document.getElementById('gru-inv').checked=g.inv!==false;
  document.querySelectorAll('#grupo-tabs .tab').forEach((x,k)=>x.classList.toggle('active',k===0));
  document.querySelectorAll('#scr-grupo .gtabpane').forEach(x=>x.classList.remove('active'));
  document.getElementById('gpane-general').classList.add('active');
  renderGrupoFin(g.cod);
  go('grupo');
}
function grupoTab(el){
  document.querySelectorAll('#grupo-tabs .tab').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('#scr-grupo .gtabpane').forEach(x=>x.classList.remove('active'));
  document.getElementById('gpane-'+el.dataset.t).classList.add('active');
}
function renderGrupoFin(cod){
  const tb=document.getElementById('grupo-fin-body'); if(!tb)return;
  const fin=(mLog('finanzasGrupo')||{})[cod]||{};
  const st='width:100%;border:1px solid var(--borde);border-radius:5px;padding:6px 9px;font-size:12.5px';
  tb.innerHTML=mLog('conceptosFinanzas').map(cp=>'<tr><td style="text-align:center;font-weight:600">'+cp.c+'</td><td>'+cp.n+
    '</td><td><input id="gfin-'+cp.c+'" value="'+Fmt.e(fin[cp.c]||"")+'" placeholder="Cuenta contable…" style="'+st+'"></td></tr>').join('');
}
function grupoSave(){
  const cod=document.getElementById('gru-cod').value.trim().toUpperCase();
  const nom=document.getElementById('gru-nom').value.trim().toUpperCase();
  if(!cod){toast("Indique el código del grupo");return}
  if(!nom){toast("Indique el nombre del grupo");return}
  if(GRUPO_IDX<0&&M().grupos.some(g=>g.cod===cod)){toast("Ya existe el grupo "+cod);return}
  const g=GRUPO_IDX>=0?M().grupos[GRUPO_IDX]:{cod};
  let pref=document.getElementById('gru-pref').value.trim().toUpperCase(); if(pref&&!pref.endsWith('-'))pref+='-';
  Object.assign(g,{nom,prefijo:pref,asignacion:document.getElementById('gru-asig').value,inv:document.getElementById('gru-inv').checked});
  if(GRUPO_IDX<0)M().grupos.push(g);
  const fin={}; mLog('conceptosFinanzas').forEach(cp=>{const v=(document.getElementById('gfin-'+cp.c)||{}).value; if(v&&v.trim())fin[cp.c]=v.trim();});
  mLog('finanzasGrupo')[cod]=fin;
  BD.guardar();
  renderMst('tipos'); go('mtipos');
  toast((GRUPO_IDX<0?"Creado":"Actualizado")+": Grupo de Artículo "+cod);
}
