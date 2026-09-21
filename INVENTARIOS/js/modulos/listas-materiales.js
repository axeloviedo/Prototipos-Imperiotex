/* INVENTARIOS · GI-17 Listas de Materiales sobre BD.d.maestros.ldms (contrato §3.1):
   items [{tipo:'Artículo', cod, cant, alm, metodo:'Manual'|'Notificación'} | {tipo:'Recurso', cod, cant, metodo} | {tipo:'Texto', txt}]
   Los recursos salen de BD.d.maestros.recursos (se crean en Producción PR-11). */
const METODOS=["Notificación","Manual"];
let LDM=null, LDM_ID="";   /* copia en edición y id original ('' = nueva) */
function fillLDMFiltros(){
  const g=document.getElementById('f-ldm-g'), v=g.value;
  g.innerHTML=opcionesLista(M().grupos.filter(x=>x.inv!==false).map(x=>({v:x.cod,t:x.cod+' · '+x.nom})),v,'Todos');
}
function renderLDM(){
  fillLDMFiltros();
  const q=Fmt.s(document.getElementById('f-ldm-q').value), g=document.getElementById('f-ldm-g').value;
  const lista=M().ldms.filter(l=>{const a=BD.art(l.art)||{};return (!g||a.grupo===g)&&(!q||Fmt.s([l.id,l.art,a.nom,l.nom,l.desc].join(' ')).includes(q))});
  document.getElementById('ldm-body').innerHTML=lista.map(d=>{
    const nA=d.items.filter(i=>i.tipo==='Artículo').length, nR=d.items.filter(i=>i.tipo==='Recurso').length;
    return '<tr class="clickable" onclick="loadLDM(\''+d.id+'\')"><td>'+d.id+'</td><td>'+d.art+' · '+Fmt.e(BD.nomArt(d.art))+(d.almProd?'<br><span class="hint">entra en '+Fmt.e(d.almProd)+'</span>':'')+'</td><td>'+Fmt.e(d.nom||'')+'<br><span class="hint">'+Fmt.e(d.desc||'')+(d.obs?' · <i>'+Fmt.e(d.obs)+'</i>':'')+'</span></td>'+
     '<td>'+(d.pred?badge('Predeterminada','var(--aprobado-sol)'):hint('Alternativa'))+'</td><td style="text-align:right">'+Fmt.n(d.base||1)+'</td><td style="text-align:right">'+nA+' art. · '+nR+' rec.</td>'+
     '<td style="text-align:right">'+Explosion.pasoArt(d.art,d.id)+'</td><td><button class="btn-link" onclick="event.stopPropagation();loadLDM(\''+d.id+'\')">Abrir</button></td></tr>';
  }).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--texto-sec);padding:16px">Sin listas de materiales</td></tr>';
  document.getElementById('ldm-count').textContent=lista.length+" de "+M().ldms.length+" listas de materiales";
}
RENDER.gi17=renderLDM;

function sigLDM(){let max=0;M().ldms.forEach(l=>{const m=/^LDM-(\d+)$/.exec(l.id);if(m)max=Math.max(max,+m[1])});return 'LDM-'+String(max+1).padStart(4,'0')}
function nuevaLDM(art){
  LDM_ID=""; LDM={id:sigLDM(),art:art||"",nom:"",desc:"",obs:"",almProd:"",base:1,pred:false,items:[]};
  go('gi17f');
}
function loadLDM(id){
  const d=BD.ldm(id); if(!d){toast("No existe la lista "+id);return}
  LDM_ID=id; LDM=BD.copia(d); go('gi17f');
}
function renderLDMform(){
  if(!LDM)return;
  document.getElementById('ldm-titulo').textContent=LDM_ID?"LISTA DE MATERIALES "+LDM.id:"NUEVA LISTA DE MATERIALES";
  document.getElementById('ldm-id').value=LDM.id;
  document.getElementById('ldm-prod').innerHTML='<option value="">Seleccionar…</option>'+opcionesLista(M().articulos.filter(a=>a.inv!==false&&(a.produccion||a.cod===LDM.art)&&(a.estado==='Activo'||a.cod===LDM.art)&&['PT','PPT','MERC'].includes(a.grupo)).map(a=>({v:a.cod,t:a.cod+' · '+a.nom})),LDM.art,false);
  document.getElementById('ldm-prod').disabled=!!LDM_ID;
  document.getElementById('ldm-nom').value=LDM.nom||'';
  document.getElementById('ldm-desc').value=LDM.desc||'';
  document.getElementById('ldm-obs').value=LDM.obs||'';
  document.getElementById('ldm-almprod').innerHTML=opcionesAlm(LDM.almProd||'',a=>!a.transito,'Sin proponer (Producción lo elige)');
  document.getElementById('ldm-cant').value=LDM.base||1;
  document.getElementById('ldm-pred').checked=!!LDM.pred;
  const otras=LDM.art?BD.ldmsDe(LDM.art).filter(l=>l.id!==LDM.id):[];
  document.getElementById('ldm-otras').innerHTML=otras.length?'Otras listas de '+LDM.art+': '+otras.map(l=>'<button class="btn-link" onclick="loadLDM(\''+l.id+'\')">'+l.id+'</button>'+(l.pred?' (predeterminada)':'')).join(', '):'';
  renderLDMitems();
}
RENDER.gi17f=renderLDMform;
function ldmProdChange(){LDM.art=document.getElementById('ldm-prod').value;if(!LDM.nom)LDM.nom=BD.nomArt(LDM.art);renderLDMform()}
function tipoBadgeLDM(t){return badge(t,t==="Recurso"?"var(--aprobada)":t==="Texto"?"var(--borrador)":"var(--primario-claro)")}
function renderLDMitems(){
  const st='width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 6px;font-size:12px';
  document.getElementById('ldm-items').innerHTML=LDM.items.map((l,i)=>{
    let cod,comp,cant,uni,alm,emi;
    if(l.tipo==="Texto"){
      cod=hint(); comp='<input value="'+Fmt.e(l.txt||'')+'" placeholder="Texto / instrucción" style="'+st+'" oninput="LDM.items['+i+'].txt=this.value">';
      cant=uni=alm=emi=hint();
    }else{
      const R=l.tipo==='Recurso'?BD.rec(l.cod)||{}:null, A=R?null:BD.art(l.cod)||{};
      cod=l.cod; comp=Fmt.e(R?R.nom+' · '+(R.tipo||''):A.nom)+(A&&BD.fabricable(l.cod)?' '+badge('Fabricable','var(--prp)'):'')+(R&&BD.esServicio(l.cod)?' '+badge('Servicio de terceros','var(--oc-pagar)'):'');
      cant='<input value="'+l.cant+'" style="text-align:right" onchange="LDM.items['+i+'].cant=parseFloat(this.value)||0">';
      uni=R?R.u||'':A.u||'';
      alm=R?hint():'<select onchange="LDM.items['+i+'].alm=this.value" style="'+st+'">'+opcionesAlm(l.alm,null,'—')+'</select>';
      const met=l.metodo||(R?(R.tipo==='RECURSO HUMANO'?'Manual':'Notificación'):'Manual');
      emi='<select onchange="LDM.items['+i+'].metodo=this.value" style="'+st+'">'+opcionesLista(METODOS,met,false)+'</select>';
    }
    return '<tr><td>'+(i+1)+'</td><td>'+tipoBadgeLDM(l.tipo)+'</td><td>'+cod+'</td><td>'+comp+'</td><td>'+cant+'</td><td>'+uni+'</td><td>'+alm+'</td><td>'+emi+'</td>'+
      '<td><button class="btn-link" onclick="LDM.items.splice('+i+',1);renderLDMitems()">Eliminar</button></td></tr>';
  }).join('')||'<tr><td colspan="9" style="text-align:center;color:var(--texto-sec);padding:16px">Sin líneas: use "+ Artículo", "+ Recurso" o "+ Texto"</td></tr>';
}
function addTextoLDM(){LDM.items.push({tipo:"Texto",txt:""});renderLDMitems()}

/* + Recurso */
function abrirBuscarRec(){document.getElementById('ldmrec-q').value="";renderBuscarRec();openModal('m-ldm-rec')}
function renderBuscarRec(){
  const q=Fmt.s(document.getElementById('ldmrec-q').value);
  const lista=M().recursos.filter(r=>r.activo!==false&&!LDM.items.some(l=>l.tipo==="Recurso"&&l.cod===r.cod)&&(!q||Fmt.s(r.cod+' '+r.nom+' '+r.tipo).includes(q)));
  document.getElementById('ldmrec-body').innerHTML=lista.map(r=>'<tr><td>'+r.cod+'</td><td>'+Fmt.e(r.nom)+'<br><span class="hint">'+Fmt.e(r.tipo||'')+'</span></td><td>'+(r.u||'')+'</td><td style="text-align:right">'+Fmt.m(r.costo)+'</td>'+
    '<td><button class="btn btn-primary btn-sm" onclick="addRecLDM(\''+r.cod+'\')">Agregar</button></td></tr>').join('')||'<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:14px">Sin resultados (o ya están en la lista)</td></tr>';
}
function addRecLDM(cod){
  const r=BD.rec(cod); if(!r)return;
  LDM.items.push({tipo:"Recurso",cod:r.cod,cant:1,metodo:r.tipo==='RECURSO HUMANO'?'Manual':'Notificación'});
  closeModal('m-ldm-rec'); renderLDMitems();
  toast(r.nom+" agregado: indique la cantidad por la cantidad base");
}
/* + Artículo */
function abrirBuscarMP(){document.getElementById('gi17a-q').value="";fillMPFiltros();renderBuscarMP();openModal('m-gi17a')}
function fillMPFiltros(){
  document.getElementById('gi17a-g').innerHTML=opcionesLista(M().grupos.filter(g=>g.inv!==false).map(g=>({v:g.cod,t:g.cod+' · '+g.nom})),'','Todos');
  document.getElementById('gi17a-atr').innerHTML=opcionesLista(M().atributos.map(x=>x.nom),'','Cualquiera');
  fillMPVal();
}
function fillMPVal(){
  const a=M().atributos.find(x=>x.nom===document.getElementById('gi17a-atr').value);
  document.getElementById('gi17a-val').innerHTML=opcionesLista(a?a.vals:[],'','Cualquiera');
}
function renderBuscarMP(){
  const q=Fmt.s(document.getElementById('gi17a-q').value), fg=document.getElementById('gi17a-g').value;
  const fa=document.getElementById('gi17a-atr').value, fv=document.getElementById('gi17a-val').value;
  const lista=M().articulos.filter(a=>{
    if(a.inv===false||a.estado!=='Activo'||a.cod===LDM.art||LDM.items.some(l=>l.tipo==='Artículo'&&l.cod===a.cod))return false;
    if(q&&!Fmt.s(a.cod+' '+a.nom).includes(q))return false; if(fg&&a.grupo!==fg)return false;
    if(fa){const v=(a.attrs||{})[fa]; if(!v||(fv&&v!==fv))return false;}
    return true;
  });
  document.getElementById('gi17a-body').innerHTML=lista.slice(0,200).map(a=>'<tr><td>'+a.cod+'</td><td>'+Fmt.e(a.nom)+(a.attrs?' <span class="hint">'+BD.attrsOrdenados(a).map(([k,v])=>k+': '+v).join(' · ')+'</span>':'')+'</td><td>'+a.u+'</td><td>'+Fmt.e(a.cat||a.grupo)+'</td>'+
    '<td><button class="btn btn-primary btn-sm" onclick="addMPLDM(\''+a.cod+'\')">Agregar</button></td></tr>').join('')||'<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:14px">Sin resultados (o ya están en la lista)</td></tr>';
}
function addMPLDM(cod){
  const a=BD.art(cod); if(!a)return;
  LDM.items.push({tipo:"Artículo",cod:a.cod,cant:1,alm:a.alm||Explosion.almDe(a.cod)||'',metodo:BD.fabricable(a.cod)?'Manual':'Notificación'});
  closeModal('m-gi17a'); renderLDMitems();
  toast(a.nom+" agregado: indique la cantidad y el almacén de donde se toma");
}
function guardarLDM(){
  LDM.art=document.getElementById('ldm-prod').value;
  LDM.nom=document.getElementById('ldm-nom').value.trim()||BD.nomArt(LDM.art);
  LDM.desc=document.getElementById('ldm-desc').value.trim();
  LDM.obs=document.getElementById('ldm-obs').value.trim();
  LDM.almProd=document.getElementById('ldm-almprod').value||'';
  if(LDM.almProd&&(BD.alm(LDM.almProd)||{}).transito){toast("El almacén donde entra lo producido no puede ser uno en tránsito");return}
  LDM.base=parseFloat(document.getElementById('ldm-cant').value)||1;
  if(!LDM.art){toast("Seleccione el producto");return}
  if(!LDM.items.length){toast("Agregue al menos una línea");return}
  const i=LDM.items.findIndex(l=>l.tipo==='Texto'?!(l.txt||'').trim():!(l.cant>0)||(l.tipo==='Artículo'&&!l.alm));
  if(i>=0){toast("Línea "+(i+1)+": "+(LDM.items[i].tipo==='Texto'?"complete el texto":LDM.items[i].tipo==='Artículo'&&!LDM.items[i].alm?"elija el almacén":"la cantidad debe ser mayor que cero"));return}
  /* evitar ciclos: un componente fabricable no puede usar (directa o indirectamente) el producto de esta lista */
  const usa=(art,visto)=>{if(visto[art])return false;visto[art]=1;return BD.ldmsDe(art).some(L=>L.id!==LDM.id&&L.items.some(x=>x.tipo==='Artículo'&&(x.cod===LDM.art||usa(x.cod,visto))))};
  const ciclo=LDM.items.find(x=>x.tipo==='Artículo'&&usa(x.cod,{}));
  if(ciclo){toast("Ciclo: "+ciclo.cod+" ya usa "+LDM.art+" en su propia lista");return}
  const hermanas=BD.ldmsDe(LDM.art).filter(l=>l.id!==LDM.id);
  LDM.pred=document.getElementById('ldm-pred').checked||!hermanas.some(l=>l.pred);
  if(LDM.pred)hermanas.forEach(l=>l.pred=false);
  if(LDM_ID)Object.assign(BD.ldm(LDM_ID),LDM); else M().ldms.push(Object.assign(LDM,{origen:'Inventarios'}));
  const a=BD.art(LDM.art); if(a&&!a.produccion)a.produccion=true;
  BD.guardar();
  toast(LDM.id+" guardada como "+(LDM.pred?"predeterminada":"alternativa")+" de "+LDM.art);
  go('gi17');
}
