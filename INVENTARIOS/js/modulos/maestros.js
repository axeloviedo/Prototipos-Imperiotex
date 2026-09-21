/* INVENTARIOS · Maestros de configuración (grupos, categorías, sub categorías, UM, conversiones, atributos, códigos de barra, sedes)
   CRUD genérico sobre BD.d.maestros (base compartida): lo que se guarda aquí lo ven Compras, Producción y Comercial. */
const MST={
 tipos:{sing:"Grupo de Artículo",lista:()=>M().grupos,ficha:"grupoOpen",
  cols:[{k:"cod",t:"text",l:"Código"},{k:"nom",t:"text",l:"Nombre"},{k:"prefijo",t:"text",l:"Prefijo"},{k:"asignacion",t:"sel",l:"Asignación de código",o:["Interna","Externa"]},{k:"inv",t:"bool",l:"Inventariable"},{k:"grupoCompra",t:"selGC",l:"Grupo de compras"}],
  nuevo:()=>({cod:"",nom:"",prefijo:"",asignacion:"Interna",inv:true}),
  enUso:r=>M().articulos.filter(a=>a.grupo===r.cod).length},
 cat:{sing:"Categoría",lista:()=>M().categorias,
  cols:[{k:"cod",t:"text",l:"Código"},{k:"grupo",t:"selGrupo",l:"Grupo de Artículo"},{k:"nom",t:"text",l:"Nombre"}],
  nuevo:()=>({cod:"",grupo:"MP",nom:""}),
  enUso:r=>M().articulos.filter(a=>a.cat===r.nom).length+M().subcategorias.filter(s=>s.cat===r.nom).length},
 sub:{sing:"Sub categoría",lista:()=>M().subcategorias,
  cols:[{k:"cat",t:"selCat",l:"Categoría"},{k:"nom",t:"text",l:"Nombre"}],
  nuevo:()=>({cat:(M().categorias[0]||{}).nom||"",nom:""}),
  enUso:r=>M().articulos.filter(a=>a.cat===r.cat&&a.subcat===r.nom).length},
 um:{sing:"Unidad de Medida",lista:()=>M().unidades,
  cols:[{k:"cod",t:"text",l:"Código"},{k:"nom",t:"text",l:"Nombre"}],
  nuevo:()=>({cod:"",nom:""}),
  enUso:r=>M().articulos.filter(a=>a.u===r.cod||a.uCompra===r.cod).length+M().conversiones.filter(c=>c.de===r.cod||c.a===r.cod).length},
 conv:{sing:"Conversión",lista:()=>M().conversiones,
  cols:[{k:"de",t:"selUM",l:"De (1 unidad)"},{k:"a",t:"selUM",l:"Equivale a"},{k:"factor",t:"num",l:"Factor"}],
  nuevo:()=>({de:"DOC",a:"UND",factor:1})},
 bc:{sing:"Tipo de Código de Barra",lista:()=>M().tiposCodigoBarra,texto:true,
  cols:[{k:"nom",t:"text",l:"Nombre"}],nuevo:()=>({nom:""}),
  enUso:r=>M().articulos.filter(a=>(a.bcs||[]).some(b=>b.tipo===r.nom)).length},
 sede:{sing:"Sede",lista:()=>M().sedes,
  cols:[{k:"cod",t:"text",l:"Código"},{k:"nom",t:"text",l:"Sede"},{k:"dir",t:"text",l:"Dirección"},{k:"contenido",t:"text",l:"Contenido"}],
  nuevo:()=>({cod:"",nom:"",dir:"",contenido:""}),
  enUso:r=>M().almacenes.filter(a=>a.sede===r.nom).length},
 atr:{sing:"Atributo",lista:()=>M().atributos,valores:true,
  cols:[{k:"nom",t:"text",l:"Nombre del atributo"}],nuevo:()=>({nom:"",vals:[]}),
  enUso:r=>M().articulos.filter(a=>a.attrs&&a.attrs[r.nom]).length+(M().modelos||[]).filter(x=>x.attrs.includes(r.nom)).length}
};
/* fila como objeto (los tipos de código de barra se guardan como texto) */
function mstFila(m,row){return m.texto?{nom:row}:row}
function mstCellText(c,v){
  if(c.t==="bool")return v?"Sí":"No";
  if(c.t==="selGrupo")return v?Fmt.e(v)+' <span class="hint">'+Fmt.e(grupoNom(v))+'</span>':hint();
  return (v===undefined||v==="")?hint():Fmt.e(v);
}
function renderMst(key){
  const m=MST[key], h=document.getElementById('mst-'+key+'-h'), b=document.getElementById('mst-'+key+'-b');
  if(!h||!b)return;
  const extra=(m.valores?'<th style="width:120px">Valores</th>':'')+(m.enUso?'<th style="width:90px;text-align:right">En uso</th>':'');
  h.innerHTML='<tr>'+m.cols.map(c=>'<th>'+c.l+'</th>').join('')+extra+'<th style="width:150px">Acciones</th></tr>';
  const lista=m.lista();
  b.innerHTML=lista.map((raw,i)=>{
    const row=mstFila(m,raw);
    const valCell=m.valores?'<td><button class="btn-link" onclick="abrirAttrVals('+i+')">Valores ('+(row.vals?row.vals.length:0)+')</button></td>':'';
    const uso=m.enUso?'<td style="text-align:right">'+(m.enUso(row)||hint('-'))+'</td>':'';
    const editCall=m.ficha?m.ficha+'('+i+')':'crudOpen(\''+key+'\','+i+')';
    return '<tr>'+m.cols.map(c=>'<td>'+mstCellText(c,row[c.k])+'</td>').join('')+valCell+uso+
     '<td><button class="btn-link" onclick="'+editCall+'">Editar</button> <button class="btn-link" onclick="crudDelAsk(\''+key+'\','+i+')">Eliminar</button></td></tr>';
  }).join('');
  if(!lista.length)b.innerHTML='<tr><td colspan="'+(m.cols.length+2+(m.valores?1:0))+'" style="text-align:center;color:var(--texto-sec);padding:16px">Sin registros · use "+ Crear"</td></tr>';
}
function mstAdd(key){crudOpen(key,-1)}

/* --- Modal CRUD dinámico --- */
let CRUD_KEY=null, CRUD_IDX=-1;
function crudFieldEditor(c,v){
  const st='width:100%;border:1px solid var(--borde);border-radius:6px;padding:7px 10px;font-size:13px';
  if(c.t==="text")return '<input id="crud-f-'+c.k+'" value="'+Fmt.e(v==null?"":v)+'" style="'+st+'">';
  if(c.t==="num")return '<input id="crud-f-'+c.k+'" type="number" value="'+(v==null?0:v)+'" style="'+st+';text-align:right">';
  if(c.t==="bool")return '<select id="crud-f-'+c.k+'" style="'+st+'"><option value="1"'+(v?' selected':'')+'>Sí</option><option value="0"'+(v?'':' selected')+'>No</option></select>';
  let opts=[];
  if(c.t==="sel")opts=c.o.map(o=>({v:o,t:o}));
  else if(c.t==="selGrupo")opts=M().grupos.map(g=>({v:g.cod,t:g.cod+' · '+g.nom}));
  else if(c.t==="selCat")opts=M().categorias.map(x=>({v:x.nom,t:x.nom+' ('+x.grupo+')'}));
  else if(c.t==="selUM")opts=M().unidades.map(x=>({v:x.cod,t:x.cod+' · '+x.nom}));
  return '<select id="crud-f-'+c.k+'" style="'+st+'">'+opcionesLista(opts,v,false)+'</select>';
}
function crudOpen(key,idx){
  CRUD_KEY=key; CRUD_IDX=idx;
  const m=MST[key];
  const row=idx>=0?mstFila(m,m.lista()[idx]):m.nuevo();
  document.getElementById('crud-title').textContent=(idx>=0?"Editar ":"Nuevo ")+m.sing;
  document.getElementById('crud-code').textContent=m.sing;
  document.getElementById('crud-body').innerHTML=m.cols.map(c=>'<div class="field full"><label>'+c.l+'</label>'+crudFieldEditor(c,row[c.k])+'</div>').join('');
  document.getElementById('crud-hint').textContent=(key==="atr")?"Guarde el atributo y luego administre sus valores con el botón Valores del listado."+(idx>=0?" Cambiar el nombre lo actualiza también en los artículos y en las plantillas de modelo que lo usan.":""):(idx>=0&&m.enUso&&m.enUso(row)?"Registro en uso: cambiar el código o el nombre no actualiza los artículos que ya lo usan.":"");
  openModal('m-crud');
}
function crudSave(){
  const m=MST[CRUD_KEY], nuevo=CRUD_IDX<0, lista=m.lista();
  const obj=nuevo?m.nuevo():Object.assign({},mstFila(m,lista[CRUD_IDX]));
  m.cols.forEach(c=>{const el=document.getElementById('crud-f-'+c.k); if(!el)return;
    obj[c.k]=c.t==="num"?(parseFloat(el.value)||0):c.t==="bool"?el.value==="1":el.value.trim();});
  if(m.cols.some(c=>c.k==="nom")&&!obj.nom){toast("Indique el nombre");return}
  if(m.cols.some(c=>c.k==="cod")&&!obj.cod){toast("Indique el código");return}
  if(CRUD_KEY==="conv"&&(obj.de===obj.a||!(obj.factor>0))){toast("La conversión necesita dos unidades distintas y un factor mayor que cero");return}
  const clave=r=>{r=mstFila(m,r);return m.cols.some(c=>c.k==="cod")?r.cod:CRUD_KEY==="sub"?r.cat+'|'+r.nom:CRUD_KEY==="conv"?r.de+'|'+r.a:r.nom};
  if(lista.some((r,i)=>i!==CRUD_IDX&&clave(r)===clave(obj))){toast("Ya existe un registro con ese código o nombre");return}
  const guardado=m.texto?obj.nom:obj;
  /* atributo renombrado (U3): los artículos y las plantillas de modelo lo guardan por nombre, se actualizan juntos */
  if(CRUD_KEY==="atr"&&!nuevo){
    const antes=lista[CRUD_IDX].nom;
    if(antes!==obj.nom){
      M().articulos.forEach(a=>{if(a.attrs&&antes in a.attrs){const n={};Object.keys(a.attrs).forEach(k=>n[k===antes?obj.nom:k]=a.attrs[k]);a.attrs=n;}});
      (M().modelos||[]).forEach(x=>{x.attrs=x.attrs.map(k=>k===antes?obj.nom:k)});
    }
  }
  if(nuevo)lista.push(guardado); else if(m.texto)lista[CRUD_IDX]=guardado; else Object.assign(lista[CRUD_IDX],obj);
  BD.guardar();
  closeModal('m-crud'); renderMst(CRUD_KEY);
  toast((nuevo?"Creado":"Actualizado")+": "+m.sing+" · guardado en la base compartida");
}
function crudDelAsk(key,idx){
  CRUD_KEY=key; CRUD_IDX=idx;
  const m=MST[key], row=mstFila(m,m.lista()[idx]);
  const uso=m.enUso?m.enUso(row):0;
  if(uso){toast("No se puede eliminar «"+(row.nom||row.cod)+"»: está en uso en "+uso+" registro(s). Desactive o reasigne primero.");return}
  document.getElementById('crud-del-name').textContent=(row.nom||row.cod||(row.de+' → '+row.a)||"registro");
  openModal('m-crud-del');
}
function crudDel(){
  MST[CRUD_KEY].lista().splice(CRUD_IDX,1); BD.guardar();
  closeModal('m-crud-del'); renderMst(CRUD_KEY);
  toast("Registro eliminado");
}

/* --- Valores de atributo (sub-CRUD) --- */
let ATTR_IDX=-1;
function abrirAttrVals(i){
  ATTR_IDX=i;
  document.getElementById('attrval-title').textContent="Valores de "+(M().atributos[i].nom||"atributo");
  renderAttrVals(); openModal('m-attrval');
}
/* el orden de la lista es el orden en que se muestran los valores (U4: 28 → 30 → 32); un valor en uso no se quita (U3) */
function usoValor(nom,v){return M().articulos.filter(a=>a.attrs&&a.attrs[nom]===v).length}
function renderAttrVals(){
  const a=M().atributos[ATTR_IDX], tb=document.getElementById('attrval-body'), n=a.vals.length;
  tb.innerHTML=a.vals.map((v,j)=>{const uso=usoValor(a.nom,v);
    return '<tr><td>'+(j+1)+'. '+Fmt.e(v)+(uso?' <span class="hint">('+uso+' artículo(s))</span>':'')+'</td><td style="white-space:nowrap">'+
      '<button class="btn-link" '+(j?'':'disabled ')+'onclick="attrValMover('+j+',-1)" title="Subir">↑</button> <button class="btn-link" '+(j<n-1?'':'disabled ')+'onclick="attrValMover('+j+',1)" title="Bajar">↓</button> '+
      '<button class="btn-link" onclick="attrValDel('+j+')">Quitar</button></td></tr>'}).join('');
  if(!a.vals.length)tb.innerHTML='<tr><td colspan="2" style="text-align:center;color:var(--texto-sec);padding:12px">Sin valores</td></tr>';
}
function attrValMover(j,d){const v=M().atributos[ATTR_IDX].vals, k=j+d; if(k<0||k>=v.length)return; [v[j],v[k]]=[v[k],v[j]]; BD.guardar(); renderAttrVals();}
function attrValDel(j){
  const a=M().atributos[ATTR_IDX], uso=usoValor(a.nom,a.vals[j]);
  if(uso){toast("No se puede quitar «"+a.vals[j]+"»: lo usan "+uso+" artículo(s). Cambie primero su valor.");return}
  a.vals.splice(j,1);BD.guardar();renderAttrVals();renderMst('atr');
}
function attrValAdd(){
  const inp=document.getElementById('attrval-input'), v=inp.value.trim().toUpperCase();
  if(!v)return;
  const a=M().atributos[ATTR_IDX];
  if(a.vals.includes(v)){toast("Ese valor ya existe");return}
  a.vals.push(v); BD.guardar(); inp.value=""; renderAttrVals(); renderMst('atr');
}

/* --- Tipos de movimiento (solo lectura: BD.d.maestros.gruposMovimiento / tiposMovimiento) --- */
function renderTiposMov(){
  const cuenta={}; BD.d.movs.forEach(m=>{if(m.tipoMov)cuenta[m.tipoMov]=(cuenta[m.tipoMov]||0)+1});
  document.getElementById('mst-tmov-b').innerHTML=(M().gruposMovimiento||[]).map(g=>
    '<tr style="background:#F8FAFC"><td colspan="5"><b>'+g.cod+' · '+Fmt.e(g.nom)+'</b> <span class="hint">'+Fmt.e(g.desc||'')+'</span></td></tr>'+
    (M().tiposMovimiento||[]).filter(t=>t.grupo===g.cod).map(t=>'<tr><td>'+t.grupo+'</td><td>'+t.cod+'</td><td>'+Fmt.e(t.nom)+'</td><td class="hint">'+Fmt.e(t.desc||'')+'</td><td style="text-align:right">'+(cuenta[t.cod]||hint('-'))+'</td></tr>').join('')).join('')||
    '<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:16px">La base no tiene tipos de movimiento: reinicie los datos</td></tr>';
}
RENDER.mtmov=renderTiposMov;
/* opciones de tipos de movimiento de un grupo (ING/SAL/TRF/AJU) */
function opcionesTipoMov(grupo,sel,vacio){
  return opcionesLista((M().tiposMovimiento||[]).filter(t=>!grupo||t.grupo===grupo).map(t=>({v:t.cod,t:t.cod+' · '+t.nom})),sel,vacio===undefined?false:vacio);
}
