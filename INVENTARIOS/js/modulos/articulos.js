/* INVENTARIOS · GI-01 Artículos y GI-02 ficha del artículo (control, códigos de barra, duplicar) */
/* ===== GI-02 · Control de inventario y códigos de barras ===== */
const CTRL_FMT={"":"—","LOT":"LOT-AAAA-####","SER":"SER-AAAA-####"};
let BARCODES=[{tipo:"GTIN-13 / EAN",cod:"7750001002286"}], BC_SEQ=2300;
function bcTipoOpts(sel){return TIPOS_BC.map(t=>'<option'+(t.nom===sel?' selected':'')+'>'+t.nom+'</option>').join('')}
function ctrlChange(){
  const v=document.getElementById('sel-ctrl').value;
  document.getElementById('ctrl-fmt').value=CTRL_FMT[v]||"—";
  const f=document.getElementById('fld-vence');
  if(f){ f.style.display=(v==="LOT")?"flex":"none"; if(v!=="LOT")document.getElementById('chk-vence').checked=false; }
}
function renderBarcodes(){
  const th=document.getElementById('bc-head');
  th.innerHTML='<tr><th style="width:36px">#</th><th style="width:210px">Tipo de código</th><th>Código de barras</th><th style="width:110px"></th><th style="width:70px"></th></tr>';
  const tb=document.getElementById('bc-body'); tb.innerHTML="";
  BARCODES.forEach((b,i)=>{
    tb.innerHTML+='<tr><td>'+(i+1)+'</td>'+
     '<td><select onchange="BARCODES['+i+'].tipo=this.value" style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px">'+bcTipoOpts(b.tipo)+'</select></td>'+
     '<td><input value="'+b.cod+'" oninput="BARCODES['+i+'].cod=this.value" style="width:100%"></td>'+
     '<td><button class="btn-link" onclick="verEtiqueta('+i+')">Ver etiqueta</button></td>'+
     '<td><button class="btn-link" onclick="BARCODES.splice('+i+',1);renderBarcodes()">Quitar</button></td></tr>';
  });
  if(!BARCODES.length)tb.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:14px">Sin códigos: use "+ Agregar código"</td></tr>';
}
function verEtiqueta(i){
  const b=BARCODES[i];
  document.getElementById('etq-nom').textContent=document.getElementById('gi02-name').textContent;
  let barras='';
  for(let x=0;x<44;x++){const w=[1,1,2,1,3,1,2,1][x%8];barras+='<span style="display:inline-block;width:'+w+'px;height:52px;background:#111;margin-right:'+((x%3)+1)+'px"></span>'}
  document.getElementById('etq-barras').innerHTML=barras;
  document.getElementById('etq-num').textContent=b.cod;
  const ref=document.getElementById('etq-corte');
  if(CFG.imprimirRef){
    ref.style.display="block";
    ref.textContent=CFG.nombreEtiqueta+": REF-2026-0009";
  }else{ ref.style.display="none"; }
  document.getElementById('etq-nota').textContent="Tipo: "+b.tipo+" · Código único e independiente que identifica a este artículo. "+
    (CFG.imprimirRef?("La segunda línea es el valor de «"+CFG.nombreEtiqueta+"» capturado en el movimiento de ingreso; se configura en Configuración General."):"La impresión del valor de referencia está desactivada en Configuración General.");
  openModal('m-etq');
}
function addBarcode(){BARCODES.push({tipo:"Código interno",cod:"CI-"+(BC_SEQ++)});renderBarcodes()}

/* ===== GI-02 · selects, título y pestañas dinámicas ===== */
function fillTipos(){const s=document.getElementById('sel-grupo');s.innerHTML=TIPOS.map(t=>'<option>'+t.nom+'</option>').join('')}
function fillCat(tipo){
  const s=document.getElementById('sel-subgrupo'); s.innerHTML='<option value=""></option>';
  CATEGORIAS.filter(c=>c.tipo===tipo).forEach(c=>{const o=document.createElement('option');o.textContent=c.nom;o.value=c.nom;s.appendChild(o)});
}
function fillSubcat(){
  const cat=document.getElementById('sel-subgrupo').value, s=document.getElementById('sel-subsubgrupo');
  s.innerHTML='<option value=""></option>';
  SUBCATS.filter(x=>x.cat===cat).forEach(x=>{const o=document.createElement('option');o.textContent=x.nom;o.value=x.nom;s.appendChild(o)});
}
function fillUMSelects(sel){
  document.getElementById('sel-um-inv').innerHTML=umOptions(sel||'UND');
  document.querySelectorAll('.um-sel-venta').forEach(el=>el.innerHTML=umOptions(sel||'UND'));
  document.querySelectorAll('.um-sel-compra').forEach(el=>el.innerHTML=umOptions(sel||'UND'));
}
function syncUMInv(){
  const u=document.getElementById('sel-um-inv').value;
  document.querySelectorAll('.um-inv-mirror').forEach(el=>el.value=u);
}
function refreshTitle(){
  const est=document.getElementById('sel-estado').value;
  const b=document.getElementById('gi02-estado'); b.textContent=est; b.style.background=EST_COLOR[est];
  const flags=[];
  if(document.getElementById('chk-compra').checked)flags.push("Compra");
  if(document.getElementById('chk-venta').checked)flags.push("Venta");
  if(document.getElementById('chk-manu').checked)flags.push("Fabricación");
  document.getElementById('gi02-flags').innerHTML=flags.map(f=>'<span class="badge" style="background:var(--primario-claro)">'+f+' ✅</span>').join('');
}
function togglePrecioMin(on){document.getElementById('fld-precio-min').style.display=on?"flex":"none"}
function addPlanRow(){
  const tb=document.getElementById('plan-body'), u=document.getElementById('sel-um-inv').value;
  const tr=tb.insertRow();
  tr.innerHTML='<td><select><option>SB-ALM-PT Central Gamarra</option><option>SB-TDA-01 Tienda Gamarra 1</option><option>SB-ALM-MPT MP Telas</option></select></td><td><input value="0"></td><td><input class="um-inv-mirror" value="'+u+'" readonly></td><td><button class="btn-link" onclick="this.closest(\'tr\').remove()">Eliminar</button></td>';
}
function atributoOpts(sel){return '<option value=""></option>'+ATRIBUTOS.map(a=>'<option'+(a.nom===sel?' selected':'')+'>'+a.nom+'</option>').join('')}
function valorOpts(attr,sel){const a=ATRIBUTOS.find(x=>x.nom===attr);const vals=a?a.vals:[];return '<option value=""></option>'+vals.map(v=>'<option'+(v===sel?' selected':'')+'>'+v+'</option>').join('')}
function renderAtributos(list){
  const tb=document.getElementById('tbl-atributos'); tb.innerHTML="";
  (list||[]).forEach((x,i)=>{
    tb.innerHTML+='<tr><td>'+(i+1)+'</td>'+
     '<td><select onchange="onAtributoChange('+i+',this)" style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px">'+atributoOpts(x[0])+'</select></td>'+
     '<td><select id="atrval-'+i+'" style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px">'+valorOpts(x[0],x[1])+'</select></td>'+
     '<td><button class="btn-link" onclick="this.closest(\'tr\').remove()">Quitar</button></td></tr>';
  });
  if(!(list||[]).length)tb.innerHTML='<tr><td colspan="4" style="text-align:center;color:var(--texto-sec);padding:14px">Sin atributos (opcional): use "+ Agregar atributo"</td></tr>';
}
function onAtributoChange(i,sel){
  const v=document.getElementById('atrval-'+i); if(v)v.innerHTML=valorOpts(sel.value,"");
}
function addAtributoRow(){
  const tb=document.getElementById('tbl-atributos');
  if(tb.querySelector('td[colspan]'))tb.innerHTML="";
  const i=tb.rows.length; const tr=tb.insertRow();
  tr.innerHTML='<td>'+(i+1)+'</td>'+
   '<td><select onchange="onAtributoChange('+i+',this)" style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px">'+atributoOpts("")+'</select></td>'+
   '<td><select id="atrval-'+i+'" style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px">'+valorOpts("","")+'</select></td>'+
   '<td><button class="btn-link" onclick="this.closest(\'tr\').remove()">Quitar</button></td>';
}

/* ===== GI-02 · Duplicar ===== */
let ART_ACTUAL=null;
function tipoDe(nom){return TIPOS.find(t=>t.nom===nom)}
function nextCodigo(pref){
  let max=0; ARTICULOS.forEach(a=>{const m=(a.id||"").match(new RegExp("^"+pref+"-(\\d+)$"));if(m)max=Math.max(max,parseInt(m[1]))});
  return pref+"-"+String(max+1).padStart(4,"0");
}
function duplicarArticulo(){
  const tipoNom=document.getElementById('sel-grupo').value, t=tipoDe(tipoNom);
  document.getElementById('dup-src').textContent=document.getElementById('gi02-name').textContent;
  document.getElementById('dup-nombre').value="";
  document.getElementById('dup-tipo').value=tipoNom;
  const wrap=document.getElementById('dup-cod'), lbl=document.getElementById('dup-cod-lbl'), nota=document.getElementById('dup-cod-nota');
  if(t && t.asig==="Externa"){wrap.value="";wrap.removeAttribute('readonly');wrap.placeholder="Ingrese un código único";lbl.textContent="Código (asignación externa · manual)";nota.textContent="Este tipo usa asignación externa: ingrese un código único e irrepetible.";}
  else{wrap.value=nextCodigo(t?t.pref:"ART");wrap.setAttribute('readonly','');lbl.textContent="Código (asignación interna · auto)";nota.textContent="Este tipo usa asignación interna: el sistema propone el siguiente código.";}
  openModal('m-gi02d');
}
function confirmarDuplicar(){
  const nom=document.getElementById('dup-nombre').value.trim();
  if(!nom){toast("Indique el nombre nuevo (único e irrepetible)");return}
  if(ARTICULOS.some(a=>a.n.toLowerCase()===nom.toLowerCase())){toast("Ya existe un artículo con ese nombre: el nombre es único");return}
  const cod=document.getElementById('dup-cod').value.trim();
  if(!cod){toast("Ingrese el código (asignación externa)");return}
  if(ARTICULOS.some(a=>a.id.toLowerCase()===cod.toLowerCase())){toast("Ese código ya existe: debe ser único");return}
  const base=ART_ACTUAL||ARTICULOS[0];
  const nuevo=Object.assign({},base,{id:cod,n:nom,e:"Activo",bcs:(base.bcs||[]).map(b=>({...b})),attrs:(base.attrs||[]).map(a=>[a[0],""])});
  ARTICULOS.push(nuevo);
  closeModal('m-gi02d'); renderArt();
  toast("Artículo duplicado: "+cod+" · "+nom+" (copia de la configuración; ajuste atributos si aplica)");
  openArticleForm(cod);
}

/* ===== GI-02 ===== */
function openArticleForm(id){
  const a=ARTICULOS.find(x=>x.id===id);
  ART_ACTUAL=a||null;
  const tipoNom=a?a.t:"PRODUCTOS TERMINADOS";
  document.getElementById('gi02-title').textContent=a?"Editar Artículo":"Nuevo Artículo";
  document.getElementById('gi02-name').textContent=a?a.n:"ARTÍCULO NUEVO";
  document.getElementById('gi02-grupo-meta').textContent=tipoNom;
  document.getElementById('sel-grupo').value=tipoNom;
  applyGrupo(tipoNom);
  if(a&&a.c)document.getElementById('sel-subgrupo').value=a.c;
  fillSubcat();
  if(a&&a.sc)document.getElementById('sel-subsubgrupo').value=a.sc;
  document.getElementById('inp-nombre').value=a?a.n:"";
  document.getElementById('sel-estado').value=a?a.e:"Activo";
  document.getElementById('chk-invble').checked=a?(a.inv==="Sí"):true;
  document.getElementById('chk-venta').checked=a?!!a.venta:false;
  document.getElementById('chk-compra').checked=a?!!a.compra:false;
  document.getElementById('chk-manu').checked=a?!!a.manu:false;
  // código según asignación del tipo
  const t=tipoDe(tipoNom);
  const codField=document.getElementById('inp-codigo'), codLbl=document.getElementById('lbl-codigo');
  if(a){codField.value=a.id;codField.setAttribute('readonly','');codLbl.textContent="Código";}
  else if(t&&t.asig==="Externa"){codField.value="";codField.removeAttribute('readonly');codField.placeholder="Ingrese código único";codLbl.textContent="Código (asignación externa · manual)";}
  else{codField.value=nextCodigo(t?t.pref:"ART");codField.setAttribute('readonly','');codLbl.textContent="Código (auto · asignación interna)";}
  document.getElementById('gi02-code').textContent=codField.value||"(externo)";
  // UM inventario + control + barcodes
  fillUMSelects(a?a.u:'UND');
  document.getElementById('sel-ctrl').value=(a&&a.ctrl!==undefined)?a.ctrl:"LOT";
  BARCODES=(a&&a.bcs)?a.bcs.map(b=>({...b})):[];
  ctrlChange(); renderBarcodes(); syncUMInv();
  renderAtributos(a?(a.attrs||[]):[]);
  document.getElementById('chk-precio-min').checked=false; togglePrecioMin(false);
  refreshTitle();
  go('gi02');
  tab(document.querySelector('#gi02-tabs .tab[data-t=general]'));
}
function applyGrupo(g){
  const serv=g==="SERVICIOS";
  document.getElementById('tab-inv').classList.toggle('hidden',serv);
  document.getElementById('tab-plan').classList.toggle('hidden',serv);
  document.getElementById('tab-manu').classList.toggle('hidden',serv);
  if(serv)document.getElementById('chk-invble').checked=false;
  fillCat(g);
  document.getElementById('sel-subsubgrupo').innerHTML='<option value=""></option>';
  // reflejar asignación del tipo en el código (solo en alta)
  if(!ART_ACTUAL){
    const t=tipoDe(g), codField=document.getElementById('inp-codigo'), codLbl=document.getElementById('lbl-codigo');
    if(t&&t.asig==="Externa"){codField.value="";codField.removeAttribute('readonly');codField.placeholder="Ingrese código único";codLbl.textContent="Código (asignación externa · manual)";}
    else{codField.value=nextCodigo(t?t.pref:"ART");codField.setAttribute('readonly','');codLbl.textContent="Código (auto · asignación interna)";}
    document.getElementById('gi02-code').textContent=codField.value||"(externo)";
  }
  document.getElementById('gi02-grupo-meta').textContent=g;
  if(serv){const act=document.querySelector('#gi02-tabs .tab.active');if(act&&(act.dataset.t==='inv'||act.dataset.t==='plan'||act.dataset.t==='manu'))tab(document.querySelector('#gi02-tabs .tab[data-t=general]'));}
}
function tab(el){
  document.querySelectorAll('#gi02-tabs .tab').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.tabpane').forEach(x=>x.classList.remove('active'));
  document.getElementById('pane-'+el.dataset.t).classList.add('active');
}
