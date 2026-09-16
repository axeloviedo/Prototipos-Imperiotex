/* INVENTARIOS · Maestros de configuración (grupos, categorías, UM, atributos, sedes) y su CRUD genérico */
/* ===== Maestros CRUD genéricos (con modal único dinámico) ===== */
const MST={
 tipos:{sing:"Grupo de Artículo",data:TIPOS,ficha:"grupoOpen",cols:[{k:"cod",t:"text",l:"Código"},{k:"nom",t:"text",l:"Nombre"},{k:"pref",t:"text",l:"Prefijo"},{k:"asig",t:"sel",l:"Asignación de código",o:["Interna","Externa"]}],nuevo:()=>({cod:"",nom:"",pref:"",asig:"Interna",fin:{}})},
 cat:{sing:"Categoría",data:CATEGORIAS,cols:[{k:"cod",t:"text",l:"Código"},{k:"tipo",t:"selTipo",l:"Grupo de Artículo"},{k:"nom",t:"text",l:"Nombre"}],nuevo:()=>({cod:nextMstCode("CAT",CATEGORIAS,"cod"),tipo:TIPOS[0].nom,nom:""})},
 sub:{sing:"Sub categoría",data:SUBCATS,cols:[{k:"cod",t:"text",l:"Código"},{k:"cat",t:"selCat",l:"Categoría"},{k:"nom",t:"text",l:"Nombre"}],nuevo:()=>({cod:nextMstCode("SUB",SUBCATS,"cod"),cat:CATEGORIAS[0].nom,nom:""})},
 um:{sing:"Unidad de Medida",data:UNIDADES,cols:[{k:"cod",t:"text",l:"Código"},{k:"nom",t:"text",l:"Nombre"}],nuevo:()=>({cod:"",nom:""})},
 conv:{sing:"Conversión",data:CONVERSIONES,cols:[{k:"de",t:"selUM",l:"De (1 unidad)"},{k:"a",t:"selUM",l:"Equivale a"},{k:"factor",t:"num",l:"Factor"}],nuevo:()=>({de:"UND",a:"UND",factor:1})},
 bc:{sing:"Tipo de Código de Barra",data:TIPOS_BC,cols:[{k:"nom",t:"text",l:"Nombre"}],nuevo:()=>({nom:""})},
 sede:{sing:"Sede",data:SEDES,cols:[{k:"cod",t:"text",l:"Código"},{k:"nom",t:"text",l:"Sede"},{k:"dir",t:"text",l:"Dirección"}],nuevo:()=>({cod:"",nom:"",dir:""})},
 atr:{sing:"Atributo",data:ATRIBUTOS,cols:[{k:"nom",t:"text",l:"Nombre del atributo"}],valores:true,nuevo:()=>({nom:"",vals:[]})}
};
function nextMstCode(prefix,arr,field){
  const esc=prefix.replace(/[.*+?^${}()|[\]\\-]/g,"\\$&");
  let max=0; arr.forEach(r=>{const m=(r[field]||"").match(new RegExp("^"+esc+"-(\\d+)$"));if(m)max=Math.max(max,parseInt(m[1]))});
  return prefix+"-"+String(max+1).padStart(4,"0");
}
function mstCellText(key,c,v){
  if(key==="cat"&&c.k==="tipo"){const t=tipoDe(v);return v}
  return (v===undefined||v==="")?'<span class="hint">—</span>':v;
}
function renderMst(key){
  const m=MST[key], h=document.getElementById('mst-'+key+'-h'), b=document.getElementById('mst-'+key+'-b');
  const extra=m.valores?'<th style="width:120px">Valores</th>':'';
  h.innerHTML='<tr>'+m.cols.map(c=>'<th>'+c.l+'</th>').join('')+extra+'<th style="width:150px">Acciones</th></tr>';
  b.innerHTML="";
  m.data.forEach((row,i)=>{
    const valCell=m.valores?'<td><button class="btn-link" onclick="abrirAttrVals('+i+')">Valores ('+ (row.vals?row.vals.length:0) +')</button></td>':'';
    const editCall = m.ficha ? m.ficha+'('+i+')' : 'crudOpen(\''+key+'\','+i+')';
    b.innerHTML+='<tr>'+m.cols.map(c=>'<td>'+mstCellText(key,c,row[c.k])+'</td>').join('')+valCell+
     '<td><button class="btn-link" onclick="'+editCall+'">Editar</button> '+
     '<button class="btn-link" onclick="crudDelAsk(\''+key+'\','+i+')">Eliminar</button></td></tr>';
  });
  if(!m.data.length)b.innerHTML='<tr><td colspan="'+(m.cols.length+1+(m.valores?1:0))+'" style="text-align:center;color:var(--texto-sec);padding:16px">Sin registros · use "+ Crear"</td></tr>';
}
function mstAdd(key){crudOpen(key,-1)}

/* --- Modal CRUD dinámico --- */
let CRUD_KEY=null, CRUD_IDX=-1;
function crudFieldEditor(c,v){
  const st='width:100%;border:1px solid var(--borde);border-radius:6px;padding:7px 10px;font-size:13px';
  if(c.t==="text")return '<input id="crud-f-'+c.k+'" value="'+(v==null?"":v)+'" style="'+st+'">';
  if(c.t==="num")return '<input id="crud-f-'+c.k+'" type="number" value="'+(v==null?0:v)+'" style="'+st+';text-align:right">';
  let opts=[];
  if(c.t==="sel")opts=c.o;
  else if(c.t==="selTipo")opts=TIPOS.map(t=>t.nom);
  else if(c.t==="selCat")opts=CATEGORIAS.map(x=>x.nom);
  else if(c.t==="selUM")opts=UNIDADES.map(x=>x.cod);
  return '<select id="crud-f-'+c.k+'" style="'+st+'">'+opts.map(o=>'<option'+(o===v?' selected':'')+'>'+o+'</option>').join('')+'</select>';
}
function crudOpen(key,idx){
  CRUD_KEY=key; CRUD_IDX=idx;
  const m=MST[key];
  const row = idx>=0 ? m.data[idx] : m.nuevo();
  document.getElementById('crud-title').textContent=(idx>=0?"Editar ":"Nuevo ")+m.sing;
  document.getElementById('crud-code').textContent=m.sing;
  document.getElementById('crud-body').innerHTML=m.cols.map(c=>'<div class="field full"><label>'+c.l+'</label>'+crudFieldEditor(c,row[c.k])+'</div>').join('');
  document.getElementById('crud-hint').textContent=(key==="atr")?"Guarde el atributo y luego administre sus valores con el botón Valores del listado.":"";
  openModal('m-crud');
}
function crudSave(){
  const m=MST[CRUD_KEY], nuevo=CRUD_IDX<0;
  const obj = nuevo ? m.nuevo() : m.data[CRUD_IDX];
  m.cols.forEach(c=>{const el=document.getElementById('crud-f-'+c.k); if(!el)return; obj[c.k]= c.t==="num"?(parseFloat(el.value)||0):el.value.trim?el.value.trim():el.value;});
  // validación mínima
  const primer=m.cols[0], nomCol=m.cols.find(c=>c.k==="nom");
  if(nomCol && !obj.nom){toast("Indique el nombre");return}
  if(nuevo)m.data.push(obj);
  closeModal('m-crud'); renderMst(CRUD_KEY);
  if(CRUD_KEY==="um"){fillUMSelects(document.getElementById('sel-um-inv')?document.getElementById('sel-um-inv').value:'UND')}
  toast((nuevo?"Creado":"Actualizado")+": "+m.sing);
}
function crudDelAsk(key,idx){
  CRUD_KEY=key; CRUD_IDX=idx;
  const m=MST[key], row=m.data[idx];
  document.getElementById('crud-del-name').textContent=(row.nom||row.cod||row.de||"registro");
  openModal('m-crud-del');
}
function crudDel(){
  MST[CRUD_KEY].data.splice(CRUD_IDX,1);
  closeModal('m-crud-del'); renderMst(CRUD_KEY);
  toast("Registro eliminado");
}

/* --- Valores de atributo (sub-CRUD) --- */
let ATTR_IDX=-1;
function abrirAttrVals(i){
  ATTR_IDX=i;
  document.getElementById('attrval-title').textContent="Valores de "+(ATRIBUTOS[i].nom||"atributo");
  renderAttrVals(); openModal('m-attrval');
}
function renderAttrVals(){
  const a=ATRIBUTOS[ATTR_IDX], tb=document.getElementById('attrval-body'); tb.innerHTML="";
  a.vals.forEach((v,j)=>{tb.innerHTML+='<tr><td>'+v+'</td><td><button class="btn-link" onclick="ATRIBUTOS['+ATTR_IDX+'].vals.splice('+j+',1);renderAttrVals();renderMst(\'atr\')">Quitar</button></td></tr>'});
  if(!a.vals.length)tb.innerHTML='<tr><td colspan="2" style="text-align:center;color:var(--texto-sec);padding:12px">Sin valores</td></tr>';
}
function attrValAdd(){
  const inp=document.getElementById('attrval-input'), v=inp.value.trim();
  if(!v)return;
  ATRIBUTOS[ATTR_IDX].vals.push(v); inp.value=""; renderAttrVals(); renderMst('atr');
}
