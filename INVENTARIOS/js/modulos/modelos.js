/* INVENTARIOS · GI-25 Modelos y GI-26 ficha del modelo sobre BD.d.maestros.modelos (decisiones U1–U7).
   modelo = {cod, nom, desc, attrs:[atributos en orden], pred, estado}; el artículo lo referencia con articulo.modelo.
   Opción A: la plantilla lleva TODOS los atributos de sus artículos; cada artículo del modelo tiene uno y solo un valor por atributo,
   solo esos atributos y una combinación que no se repite. Las reglas viven en BD.erroresArticuloModelo (bd.js). */
let MOD_ACTUAL="";      /* código del modelo abierto ('' = nuevo) */
let MOD_ATTRS=[];       /* borrador de la plantilla */
let MOD_ARTS=[];        /* borrador de los artículos: [{cod, attrs:{...}}] */
let MOD_EST="Activo", MOD_SUCIO=false;

/* ===== GI-25 ===== */
function renderModelos(){
  const q=Fmt.s(document.getElementById('f-mod-q').value), e=document.getElementById('f-mod-e').value;
  const lista=(M().modelos||[]).filter(x=>(!q||Fmt.s(x.cod+' '+x.nom).includes(q))&&(!e||x.estado===e));
  document.getElementById('tbl-mod').innerHTML=lista.map(x=>{
    const n=BD.artsDeModelo(x.cod).length, p=x.pred?BD.art(x.pred):null;
    return '<tr class="clickable" onclick="abrirModelo(\''+x.cod+'\')"><td style="white-space:nowrap">'+x.cod+'</td><td>'+Fmt.e(x.nom)+'</td>'+
      '<td>'+x.attrs.map((k,i)=>(i+1)+'° '+Fmt.e(k)).join(' › ')+'</td><td style="text-align:right">'+n+'</td>'+
      '<td>'+(p?p.cod+' <span class="hint">'+Fmt.e(p.nom)+'</span>':hint())+'</td><td>'+badge(x.estado)+'</td>'+
      '<td><button class="btn-link" onclick="event.stopPropagation();abrirModelo(\''+x.cod+'\')">Editar</button></td></tr>';
  }).join('')||'<tr><td colspan="7" style="text-align:center;color:var(--texto-sec);padding:16px">Sin modelos · use "+ Nuevo Modelo"</td></tr>';
}
RENDER.gi25=renderModelos;

/* ===== GI-26 · abrir ===== */
function sigModelo(){let max=0;(M().modelos||[]).forEach(x=>{const m=(x.cod||'').match(/^MOD-(\d+)$/);if(m)max=Math.max(max,+m[1])});return 'MOD-'+String(max+1).padStart(4,'0')}
function abrirModelo(cod){
  const x=cod?BD.modelo(cod):null;
  MOD_ACTUAL=x?x.cod:"";
  MOD_ATTRS=x?x.attrs.slice():[];
  MOD_ARTS=x?BD.artsDeModelo(x.cod).map(a=>({cod:a.cod,attrs:Object.assign({},a.attrs||{})})):[];
  MOD_EST=x?x.estado||'Activo':'Activo'; MOD_SUCIO=false;
  document.getElementById('gi26-title').textContent=x?'Modelo · '+x.nom:'Nuevo Modelo';
  document.getElementById('mod-cod').value=x?x.cod:sigModelo();
  document.getElementById('mod-nom').value=x?x.nom:'';
  document.getElementById('mod-desc').value=x?x.desc||'':'';
  document.getElementById('mod-est').value=MOD_EST;
  const b=document.getElementById('gi26-b-est'); b.style.display=x?'inline-block':'none'; b.textContent=MOD_EST==='Activo'?'Desactivar':'Activar';
  pintarModelo(x?x.pred:'');
  go('gi26');
}
function pintarModelo(pred){
  const ps=document.getElementById('mod-pred'), pv=pred!==undefined?pred:ps.value;
  ps.innerHTML='<option value="">(ninguno)</option>'+opcionesLista(MOD_ARTS.map(r=>({v:r.cod,t:r.cod+' · '+BD.nomArt(r.cod)})),pv,false);
  renderPlantilla(); renderArtsModelo();
}

/* ===== GI-26 · plantilla ===== */
function renderPlantilla(){
  document.getElementById('mod-plantilla').innerHTML=MOD_ATTRS.map((k,i)=>{
    return '<tr><td>'+(i+1)+'°</td><td><b>'+Fmt.e(k)+'</b></td>'+
      '<td><button class="btn-link" '+(i?'':'disabled ')+'onclick="moverAtributoModelo('+i+',-1)">↑ Subir</button> <button class="btn-link" '+(i<MOD_ATTRS.length-1?'':'disabled ')+'onclick="moverAtributoModelo('+i+',1)">↓ Bajar</button> '+
      '<button class="btn-link" onclick="quitarAtributoModelo('+i+')">Quitar</button></td></tr>';
  }).join('')||'<tr><td colspan="3" style="text-align:center;color:var(--texto-sec);padding:12px">Sin atributos: agregue al menos uno (p. ej. Color, Talla)</td></tr>';
  /* aviso: al guardar, los artículos pierden los atributos que no estén en la plantilla (opción A) */
  const fuera={}; MOD_ARTS.forEach(r=>Object.keys(r.attrs).forEach(k=>{if(r.attrs[k]&&!MOD_ATTRS.includes(k))fuera[k]=(fuera[k]||0)+1}));
  document.getElementById('mod-plantilla-nota').innerHTML=Object.keys(fuera).length?
    '⚠ Al guardar se quitará '+Object.keys(fuera).map(k=>'<b>'+Fmt.e(k)+'</b> de '+fuera[k]+' artículo(s)').join(', ')+', porque la plantilla ya no lo incluye.':
    'El orden de la plantilla es el orden en que se muestran los atributos (1° Color, 2° Talla…). El orden de los valores se fija en Configuraciones → Atributos.';
}
/* modal con todos los atributos del maestro: los que ya están en la plantilla salen marcados y bloqueados;
   si ya están todos, el modal se abre igual pero no hay nada que agregar */
function abrirAgregarAtributo(){
  const todos=M().atributos.map(a=>a.nom), libres=todos.filter(n=>!MOD_ATTRS.includes(n));
  document.getElementById('gi26t-lista').innerHTML=todos.map((n,i)=>{const ya=MOD_ATTRS.includes(n);
    return '<label style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13px'+(ya?';color:var(--texto-sec)':'')+'">'+
      '<input type="checkbox" class="gi26t-chk" value="'+Fmt.e(n)+'"'+(ya?' checked disabled':'')+'> '+Fmt.e(n)+(ya?' <span class="hint">(ya está en la plantilla)</span>':'')+'</label>'}).join('')||
    '<p class="hint">No hay atributos: créelos en Configuraciones → Atributos.</p>';
  document.getElementById('gi26t-nota').textContent=libres.length?'Se agregan al final de la plantilla, en el orden de esta lista; luego puede moverlos con ↑↓.':'Todos los atributos ya están en la plantilla: no hay ninguno más para agregar.';
  const ok=document.getElementById('gi26t-ok'); ok.disabled=!libres.length; ok.style.opacity=libres.length?'':'.45'; ok.style.cursor=libres.length?'':'not-allowed';
  openModal('m-gi26t');
}
function agregarAtributosModelo(){
  const elegidos=[...document.querySelectorAll('.gi26t-chk:checked:not(:disabled)')].map(c=>c.value);
  if(!elegidos.length){toast("Marque al menos un atributo");return}
  elegidos.forEach(k=>{if(!MOD_ATTRS.includes(k))MOD_ATTRS.push(k)});
  MOD_SUCIO=true; closeModal('m-gi26t'); renderPlantilla(); renderArtsModelo();
  toast("Agregado a la plantilla: "+elegidos.join(", ")+" · complete los valores de los artículos y guarde");
}
function moverAtributoModelo(i,d){const j=i+d; if(j<0||j>=MOD_ATTRS.length)return; [MOD_ATTRS[i],MOD_ATTRS[j]]=[MOD_ATTRS[j],MOD_ATTRS[i]]; MOD_SUCIO=true; renderPlantilla(); renderArtsModelo();}
function quitarAtributoModelo(i){MOD_ATTRS.splice(i,1); MOD_SUCIO=true; renderPlantilla(); renderArtsModelo();}

/* ===== GI-26 · artículos del modelo (valores editables) ===== */
function claveBorrador(r){return MOD_ATTRS.map(k=>k+':'+(r.attrs[k]||'')).join('|')}
function renderArtsModelo(){
  const st='border:1px solid var(--borde);border-radius:5px;padding:4px 6px;font-size:12px';
  document.getElementById('mod-arts-h').innerHTML='<tr><th>Código</th><th>Nombre</th>'+MOD_ATTRS.map((k,i)=>'<th>'+(i+1)+'° '+Fmt.e(k)+'</th>').join('')+'<th>Estado</th><th style="width:120px"></th></tr>';
  const cuenta={}; MOD_ARTS.forEach(r=>{const c=claveBorrador(r);cuenta[c]=(cuenta[c]||0)+1});
  document.getElementById('mod-arts-b').innerHTML=MOD_ARTS.map((r,i)=>{
    const a=BD.art(r.cod)||{}, rep=cuenta[claveBorrador(r)]>1;
    return '<tr'+(rep?' style="background:#FEF2F2"':'')+'><td><button class="btn-link" onclick="irArticuloDesdeModelo(\''+r.cod+'\')">'+r.cod+'</button></td><td>'+Fmt.e(a.nom||'')+(rep?' <span class="warn" title="Combinación repetida">⚠ repetida</span>':'')+'</td>'+
      MOD_ATTRS.map(k=>{const at=BD.atributo(k), v=r.attrs[k]||'', vals=at?at.vals:[], ajeno=v&&!vals.includes(v);
        return '<td><select style="'+st+(!v||ajeno?';border-color:#DC2626':'')+'" onchange="MOD_ARTS['+i+'].attrs[\''+k.replace(/'/g,"\\'")+'\']=this.value;MOD_SUCIO=true;renderArtsModelo()"><option value=""></option>'+
          (ajeno?'<option selected>'+Fmt.e(v)+'</option>':'')+opcionesLista(vals,v,false)+'</select></td>'}).join('')+
      '<td>'+badge(a.estado||'')+'</td><td><button class="btn-link" onclick="MOD_ARTS.splice('+i+',1);MOD_SUCIO=true;pintarModelo()">Quitar del modelo</button></td></tr>';
  }).join('')||'<tr><td colspan="'+(MOD_ATTRS.length+4)+'" style="text-align:center;color:var(--texto-sec);padding:12px">Sin artículos: agregue existentes o use «Generar combinaciones»</td></tr>';
  document.getElementById('mod-arts-count').textContent='· '+MOD_ARTS.length+' artículo(s)';
}
function irArticuloDesdeModelo(cod){
  if(MOD_SUCIO){toast("Guarde o cancele primero los cambios del modelo");return}
  openArticleForm(cod);
}

/* ===== GI-26 · guardar y estado ===== */
function erroresModeloBorrador(nom){
  const err=[];
  if(!nom)err.push("Indique el nombre del modelo");
  if((M().modelos||[]).some(x=>x.cod!==MOD_ACTUAL&&x.nom.toUpperCase()===nom))err.push("Ya existe un modelo con ese nombre");
  if(!MOD_ATTRS.length)err.push("La plantilla necesita al menos un atributo");
  const vistos={};
  MOD_ARTS.forEach(r=>{
    const falta=MOD_ATTRS.filter(k=>!r.attrs[k]);
    if(falta.length){err.push(r.cod+": falta "+falta.join(", "));return}
    MOD_ATTRS.forEach(k=>{const at=BD.atributo(k); if(!at||!at.vals.includes(r.attrs[k]))err.push(r.cod+": «"+r.attrs[k]+"» no es un valor de "+k)});
    const c=claveBorrador(r); if(vistos[c])err.push(r.cod+" repite la combinación de "+vistos[c]); else vistos[c]=r.cod;
  });
  return err;
}
function guardarModelo(){
  const nom=document.getElementById('mod-nom').value.trim().toUpperCase(), pred=document.getElementById('mod-pred').value;
  const err=erroresModeloBorrador(nom);
  if(err.length){toast(err[0]+(err.length>1?" (y "+(err.length-1)+" más)":""));return}
  const quitan=MOD_ARTS.filter(r=>Object.keys(r.attrs).some(k=>r.attrs[k]&&!MOD_ATTRS.includes(k)));
  if(quitan.length&&!confirm("La plantilla no incluye algunos atributos que tienen "+quitan.length+" artículo(s): se les quitarán esos valores. ¿Continuar?"))return;
  const cod=MOD_ACTUAL||document.getElementById('mod-cod').value;
  let x=BD.modelo(cod);
  if(!x){x={cod,origen:'Inventarios'};M().modelos.push(x);}
  Object.assign(x,{nom,desc:document.getElementById('mod-desc').value.trim(),attrs:MOD_ATTRS.slice(),pred:MOD_ARTS.some(r=>r.cod===pred)?pred:'',estado:MOD_EST});
  const enModelo=MOD_ARTS.map(r=>r.cod);
  BD.artsDeModelo(cod).filter(a=>!enModelo.includes(a.cod)).forEach(a=>delete a.modelo);
  MOD_ARTS.forEach(r=>{const a=BD.art(r.cod); if(!a)return; a.modelo=cod; a.attrs={}; MOD_ATTRS.forEach(k=>a.attrs[k]=r.attrs[k]);});
  BD.guardar();
  toast("Modelo "+cod+" guardado en la base compartida · "+MOD_ARTS.length+" artículo(s)");
  abrirModelo(cod);
}
/* no se borra: se desactiva (ya no se ofrece para artículos nuevos; los que lo tienen lo conservan) */
function alternarEstadoModelo(){
  const x=BD.modelo(MOD_ACTUAL); if(!x)return;
  if(MOD_SUCIO){toast("Guarde o cancele primero los cambios del modelo");return}
  x.estado=x.estado==='Activo'?'Inactivo':'Activo'; BD.hist(x,x.estado==='Activo'?'Activado':'Desactivado'); BD.guardar();
  toast("Modelo "+x.cod+" "+(x.estado==='Activo'?"activado":"desactivado")); abrirModelo(x.cod);
}

/* ===== GI-26 · agregar artículos existentes ===== */
function abrirAgregarArtModelo(){document.getElementById('gi26a-q').value='';renderAgregarArtModelo();openModal('m-gi26a')}
function renderAgregarArtModelo(){
  const q=Fmt.s(document.getElementById('gi26a-q').value);
  const lista=M().articulos.filter(a=>!a.modelo&&!MOD_ARTS.some(r=>r.cod===a.cod)&&
    (!q||Fmt.s(a.cod+' '+a.nom+' '+Object.values(a.attrs||{}).join(' ')).includes(q))).slice(0,100);
  document.getElementById('gi26a-body').innerHTML=lista.map(a=>'<tr><td>'+a.cod+'</td><td>'+Fmt.e(a.nom)+
    (a.attrs?'<br><span class="hint">'+BD.attrsOrdenados(a).map(([k,v])=>Fmt.e(k)+': '+Fmt.e(v)).join(' · ')+'</span>':'')+'</td>'+
    '<td><button class="btn-link" onclick="agregarArtModelo(\''+a.cod+'\')">Agregar</button></td></tr>').join('')||
    '<tr><td colspan="3" style="text-align:center;color:var(--texto-sec);padding:12px">Ningún artículo sin modelo coincide</td></tr>';
}
function agregarArtModelo(cod){
  const a=BD.art(cod); MOD_ARTS.push({cod,attrs:Object.assign({},a.attrs||{})}); MOD_SUCIO=true;
  renderAgregarArtModelo(); pintarModelo();
  toast(cod+" agregado: complete sus valores y guarde el modelo");
}

/* ===== GI-26 · generar combinaciones ===== */
let GEN_VALS={}, GEN_FILAS=[];
function abrirGenerarCombinaciones(){
  if(!MOD_ACTUAL||MOD_SUCIO){toast("Guarde primero el modelo (plantilla y artículos) y luego genere las combinaciones");return}
  if(!MOD_ATTRS.length){toast("La plantilla no tiene atributos");return}
  /* valores ya usados por los artículos del modelo quedan marcados */
  GEN_VALS={}; MOD_ATTRS.forEach(k=>GEN_VALS[k]=[...new Set(MOD_ARTS.map(r=>r.attrs[k]).filter(Boolean))]);
  const x=BD.modelo(MOD_ACTUAL), propios=MOD_ARTS.map(r=>BD.art(r.cod)).filter(Boolean), otros=M().articulos.filter(a=>a.estado==='Activo'&&!propios.includes(a));
  document.getElementById('gi26g-base').innerHTML=
    (propios.length?'<optgroup label="Del modelo">'+opcionesLista(propios.map(a=>({v:a.cod,t:a.cod+' · '+a.nom})),x.pred||propios[0].cod,false)+'</optgroup>':'')+
    '<optgroup label="Otros artículos">'+opcionesLista(otros.map(a=>({v:a.cod,t:a.cod+' · '+a.nom})),'',false)+'</optgroup>';
  renderGenerar(); openModal('m-gi26g');
}
function genMarcar(k,v,on){const l=GEN_VALS[k]; if(on&&!l.includes(v))l.push(v); if(!on)GEN_VALS[k]=l.filter(z=>z!==v); renderGenerar();}
function renderGenerar(){
  const x=BD.modelo(MOD_ACTUAL), base=BD.art(document.getElementById('gi26g-base').value);
  document.getElementById('gi26g-vals').innerHTML=MOD_ATTRS.map((k,i)=>{const at=BD.atributo(k)||{vals:[]};
    return '<div style="margin:4px 0"><b style="font-size:12.5px">'+(i+1)+'° '+Fmt.e(k)+':</b> '+at.vals.map(v=>
      '<label style="margin-right:12px;font-size:12.5px;white-space:nowrap"><input type="checkbox" '+(GEN_VALS[k].includes(v)?'checked ':'')+
      'onchange="genMarcar(\''+k.replace(/'/g,"\\'")+'\',\''+v.replace(/'/g,"\\'")+'\',this.checked)"> '+Fmt.e(v)+'</label>').join('')+'</div>'}).join('');
  /* producto cartesiano en el orden de la plantilla y de los valores */
  let combos=[{}];
  MOD_ATTRS.forEach(k=>{const at=BD.atributo(k)||{vals:[]}, vs=at.vals.filter(v=>GEN_VALS[k].includes(v)); combos=[].concat(...combos.map(c=>vs.map(v=>Object.assign({},c,{[k]:v}))));});
  if(MOD_ATTRS.some(k=>!GEN_VALS[k].length))combos=[];
  const varian=MOD_ATTRS.filter(k=>GEN_VALS[k].length>1), t=base&&M().grupos.find(g=>g.cod===base.grupo);
  /* códigos correlativos del grupo del artículo base (nextCodigo de GI-02), uno por combinación nueva */
  const pref=(t&&t.prefijo)||'ART-', desde=+(nextCodigo(pref).match(/(\d+)$/)||[0,1])[1];
  let n=0; const sig=()=>pref+String(desde+(n++)).padStart(4,'0');
  GEN_FILAS=combos.slice(0,200).map(c=>{
    const clave=BD.combinacion(c,{attrs:MOD_ATTRS}), ya=MOD_ARTS.find(r=>claveBorrador(r)===clave);
    return ya?{attrs:c,existe:ya.cod}:{attrs:c,cod:sig(),nom:(x.nom+' '+(varian.length?varian:MOD_ATTRS).map(k=>c[k]).join(' ')).toUpperCase()};
  });
  document.getElementById('gi26g-h').innerHTML='<tr>'+MOD_ATTRS.map(k=>'<th>'+Fmt.e(k)+'</th>').join('')+'<th>Código</th><th>Nombre del artículo nuevo <span class="hint">(editable)</span></th></tr>';
  document.getElementById('gi26g-b').innerHTML=GEN_FILAS.map((f,i)=>'<tr>'+MOD_ATTRS.map(k=>'<td>'+Fmt.e(f.attrs[k])+'</td>').join('')+
    (f.existe?'<td colspan="2" class="hint">Ya existe: '+f.existe+' · '+Fmt.e(BD.nomArt(f.existe))+'</td>':
     '<td><input value="'+f.cod+'" oninput="GEN_FILAS['+i+'].cod=this.value.trim().toUpperCase()" style="width:110px"></td><td><input value="'+Fmt.e(f.nom)+'" oninput="GEN_FILAS['+i+'].nom=this.value" style="width:100%"></td>')+'</tr>').join('')||
    '<tr><td colspan="'+(MOD_ATTRS.length+2)+'" style="text-align:center;color:var(--texto-sec);padding:12px">Marque al menos un valor de cada atributo</td></tr>';
  const nuevos=GEN_FILAS.filter(f=>!f.existe).length;
  document.getElementById('gi26g-nota').textContent=GEN_FILAS.length+' combinación(es): '+nuevos+' nueva(s) y '+(GEN_FILAS.length-nuevos)+' que ya existen.'+(combos.length>200?' Se muestran solo las primeras 200.':'')+(base?'':' Elija el artículo base.');
}
function crearCombinaciones(){
  const base=BD.art(document.getElementById('gi26g-base').value), nuevos=GEN_FILAS.filter(f=>!f.existe);
  if(!base){toast("Elija el artículo base");return}
  if(!nuevos.length){toast("No hay combinaciones nuevas que crear");return}
  const noms=new Set(M().articulos.map(a=>a.nom.toUpperCase())), cods=new Set(M().articulos.map(a=>a.cod));
  for(const f of nuevos){
    const nom=(f.nom||'').trim().toUpperCase();
    if(!f.cod||cods.has(f.cod)){toast("Código vacío o repetido: "+(f.cod||'(vacío)'));return}
    if(!nom||noms.has(nom)){toast("Nombre vacío o repetido: "+(nom||'(vacío)')+" · el nombre del artículo es único");return}
    cods.add(f.cod); noms.add(nom);
  }
  nuevos.forEach(f=>{
    const a=Object.assign(BD.copia(base),{cod:f.cod,nom:f.nom.trim().toUpperCase(),estado:'Activo',origen:'Inventarios',bcs:[],costo:0,modelo:MOD_ACTUAL,attrs:Object.assign({},f.attrs)});
    delete a.aConfirmar;
    M().articulos.push(a);
  });
  BD.guardar(); closeModal('m-gi26g');
  toast(nuevos.length+" artículo(s) creados en el modelo "+MOD_ACTUAL+" (sin códigos de barras ni lista de materiales)");
  abrirModelo(MOD_ACTUAL);
}
