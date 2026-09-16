/* INVENTARIOS · GI-21/22/23 Solicitudes de Fabricación sobre BD.d.sfs (Docs.sf, contrato §3.4):
   {id, fecha, mes, solic, almDestino (código), fechaReq, est, vb, ger, obs, lineas:[{art, cant, ldm}], ofs, ref, comprometido, hist}.
   La vista comercial (?vista=comercial) usa estas mismas pantallas. */
const MESES=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"];
function mesesProyectados(extra){
  const p=BD.hoy().split('/'), m0=parseInt(p[1],10)-1, a0=parseInt(p[2],10), out=[];
  for(let i=0;i<7;i++){const m=(m0+i)%12, a=a0+Math.floor((m0+i)/12);out.push(MESES[m]+' '+a)}
  if(extra&&!out.includes(extra))out.unshift(extra);
  return out;
}
function attrDe(cod,nom){return BD.attr(cod,nom)}
/* artículos que se pueden pedir: terminados activos con lista de materiales */
function artTerminados(){return M().articulos.filter(a=>a.grupo==='PT'&&a.estado==='Activo'&&BD.fabricable(a.cod))}
function spTotal(d){return BD.r4(d.lineas.reduce((t,l)=>t+(Number(l.cant)||0),0))}
function spResumen(d){if(!d.lineas.length)return "-";const n=BD.nomArt(d.lineas[0].art);return d.lineas.length>1?n+" y "+(d.lineas.length-1)+" más":n}
function spCategorias(d){return [...new Set(d.lineas.map(l=>(BD.art(l.art)||{}).cat).filter(Boolean))]}

/* ===== GI-21 ===== */
function fillFiltroCatSP(){
  const sel=document.getElementById('f-sp-b'); if(!sel)return;
  sel.innerHTML=opcionesLista([...new Set(artTerminados().map(a=>a.cat).filter(Boolean))],sel.value,'Todas');
  const m=document.getElementById('f-sp-m'), vm=m.value;
  m.innerHTML=opcionesLista([...new Set(BD.d.sfs.map(s=>s.mes).filter(Boolean))],vm,'Todos');
}
function renderSP(){
  fillFiltroCatSP();
  const e=document.getElementById('f-sp-e').value, m=document.getElementById('f-sp-m').value, b=document.getElementById('f-sp-b').value;
  const q=Fmt.s(document.getElementById('f-sp-q').value);
  const lista=BD.d.sfs.filter(d=>(!e||d.est===e)&&(!m||d.mes===m)&&(!b||spCategorias(d).includes(b))&&(!q||d.lineas.some(l=>Fmt.s(l.art+' '+BD.nomArt(l.art)).includes(q))));
  const chip=(ok,t)=>'<span class="badge" style="background:'+(ok?'var(--confirmado)':'var(--borrador)')+';font-size:10.5px">'+(ok?'✓ ':'')+t+'</span>';
  document.getElementById('sp-body').innerHTML=lista.map(d=>'<tr class="clickable" onclick="abrirSF(\''+d.id+'\')"><td>'+d.id+'</td><td>'+d.fecha+'</td><td>'+Fmt.e(d.mes||'')+'</td>'+
    '<td>'+d.lineas.map(l=>l.art+' × '+Fmt.n(l.cant)).join('<br>')+'</td><td style="text-align:right;font-weight:600">'+Fmt.n(spTotal(d))+'</td><td>'+(d.almDestino||hint('-'))+'</td>'+
    '<td>'+badge(d.est)+'</td><td>'+(d.est==='Borrador'?hint('-'):chip(d.vb,'V°B°')+' '+chip(d.ger,'Gerencia'))+'</td><td>'+Fmt.e(d.solic||'')+'</td>'+
    '<td onclick="event.stopPropagation()">'+((d.ofs||[]).length?d.ofs.length+' OF'+(d.ref?'<br><span class="hint">'+Fmt.e(d.ref)+'</span>':''):hint('-'))+'</td></tr>').join('')||
    '<tr><td colspan="10" style="text-align:center;color:var(--texto-sec);padding:18px">Sin solicitudes de fabricación'+(BD.d.sfs.length?' para los filtros':'')+'</td></tr>';
  document.getElementById('sp-count').textContent=lista.length+" solicitudes de fabricación";
}
RENDER.gi21=renderSP;

/* ===== GI-22 · alta ===== */
let NSP={lineas:[]}, ART_CTX="nuevo";
function nuevaSP(){
  NSP={lineas:[]};
  document.getElementById('n-sp-fecha').value=BD.hoy();
  document.getElementById('n-sp-mes').innerHTML='<option value="">Seleccionar…</option>'+opcionesLista(mesesProyectados(),'',false);
  document.getElementById('n-sp-almdest').innerHTML=opcionesAlm('SB-CENTRAL',a=>a.contenido==='Productos Terminados'&&!a.transito);
  document.getElementById('n-sp-freq').value='';
  document.getElementById('n-sp-obs').value='';
  document.getElementById('n-sp-solic').value=BD.usuario;
  renderNSPitems(); go('gi22');
}
function opcionesLDM(art,sel){return BD.ldmsDe(art).map(l=>'<option value="'+l.id+'"'+(l.id===sel?' selected':'')+'>'+l.id+' · '+Fmt.e(l.nom)+(l.pred?' (predeterminada)':'')+'</option>').join('')}
function renderNSPitems(){
  const st='width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 6px;font-size:12px';
  document.getElementById('n-sp-items').innerHTML=NSP.lineas.map((l,i)=>'<tr><td>'+(i+1)+'</td><td>'+l.art+'</td><td>'+Fmt.e(BD.nomArt(l.art))+'</td><td>'+(attrDe(l.art,'Color')||'-')+'</td><td>'+(attrDe(l.art,'Talla')||'-')+'</td>'+
    '<td><select style="'+st+'" onchange="NSP.lineas['+i+'].ldm=this.value">'+opcionesLDM(l.art,l.ldm)+'</select></td>'+
    '<td><input value="'+l.cant+'" style="text-align:right" oninput="NSP.lineas['+i+'].cant=parseFloat(this.value)||0;nspFootUI()"></td>'+
    '<td><button class="btn-link" onclick="NSP.lineas.splice('+i+',1);renderNSPitems()">Quitar</button></td></tr>').join('')||
    '<tr><td colspan="8" style="text-align:center;color:var(--texto-sec);padding:14px">Sin líneas: use "+ Agregar artículos"</td></tr>';
  nspFootUI();
}
function nspFootUI(){
  const t=spTotal(NSP);
  document.getElementById('n-sp-items-foot').innerHTML=NSP.lineas.length?'<tr><td colspan="6" style="text-align:right;font-weight:600">TOTAL</td><td style="text-align:right;font-weight:700">'+Fmt.n(t)+'</td><td></td></tr>':'';
  document.getElementById('n-sp-total').value=Fmt.n(t)+" UND";
}
function guardarSP(enviar){
  const d={mes:document.getElementById('n-sp-mes').value,almDestino:document.getElementById('n-sp-almdest').value,fechaReq:Fmt.bd(document.getElementById('n-sp-freq').value),
    obs:document.getElementById('n-sp-obs').value.trim(),solic:BD.usuario,lineas:NSP.lineas.map(l=>({art:l.art,cant:l.cant,ldm:l.ldm}))};
  if(!d.mes){toast("Seleccione el mes proyectado");return}
  if(!d.almDestino){toast("Seleccione el almacén destino");return}
  if(!lineasValidas(NSP))return;
  const s=intentar(()=>{const x=Docs.sf.crear(d);return enviar?Docs.sf.enviar(x.id):x}); if(!s)return;
  toast(s.id+(enviar?" enviada a revisión: los requerimientos de materia prima ya están calculados":" guardada como Borrador"));
  abrirSF(s.id);
}

/* ===== Buscador de artículos (GI-22b) ===== */
function abrirBuscadorArt(ctx){
  ART_CTX=ctx;
  if(ctx==="rev"&&!spEditable()){toast("El detalle solo se edita en Borrador, Pendiente Aprobar o Rechazada");return}
  document.getElementById('gi22b-q').value="";
  document.getElementById('gi22b-cat').innerHTML=opcionesLista([...new Set(artTerminados().map(a=>a.cat).filter(Boolean))],'','Todas');
  const vals=nom=>{const s=new Set();artTerminados().forEach(a=>{const v=attrDe(a.cod,nom);if(v)s.add(v)});return [...s].sort()};
  document.getElementById('gi22b-color').innerHTML=opcionesLista(vals('Color'),'','Todos');
  document.getElementById('gi22b-talla').innerHTML=opcionesLista(vals('Talla'),'','Todas');
  renderBuscadorArt(); openModal('m-gi22b');
}
function ctxSP(){return ART_CTX==="nuevo"?NSP:SPF}
function renderBuscadorArt(){
  const q=Fmt.s(document.getElementById('gi22b-q').value), cat=document.getElementById('gi22b-cat').value;
  const col=document.getElementById('gi22b-color').value, tal=document.getElementById('gi22b-talla').value, d=ctxSP();
  document.getElementById('gi22b-body').innerHTML=artTerminados().filter(a=>(!cat||a.cat===cat)&&(!col||attrDe(a.cod,'Color')===col)&&(!tal||attrDe(a.cod,'Talla')===tal)&&(!q||Fmt.s(a.cod+' '+a.nom).includes(q))).map(a=>{
    const ya=d.lineas.some(l=>l.art===a.cod);
    return '<tr><td style="text-align:center">'+(ya?hint('✓'):'<input type="checkbox" class="gi22b-chk" value="'+a.cod+'">')+'</td><td>'+a.cod+'</td><td>'+Fmt.e(a.nom)+(ya?' '+hint('(ya en el detalle)'):'')+'</td>'+
      '<td>'+(attrDe(a.cod,'Color')||'-')+'</td><td>'+(attrDe(a.cod,'Talla')||'-')+'</td><td>'+a.u+'</td><td style="text-align:right">'+Fmt.n(Stock.totalDisp(a.cod))+'</td><td>'+BD.ldmsDe(a.cod).length+'</td></tr>';
  }).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--texto-sec);padding:14px">Ningún artículo terminado fabricable coincide con los filtros</td></tr>';
}
function addArtsSeleccionados(){
  const d=ctxSP(), sel=[...document.querySelectorAll('.gi22b-chk:checked')].map(x=>x.value);
  if(!sel.length){toast("Marque al menos un artículo");return}
  sel.forEach(cod=>d.lineas.push({art:cod,cant:0,ldm:(BD.ldmPred(cod)||{}).id||''}));
  if(ART_CTX==="nuevo")renderNSPitems(); else {SPF.sucio=true;renderSPform();}
  renderBuscadorArt();
  toast(sel.length+" artículo(s) agregado(s): complete las cantidades");
}

/* ===== GI-23 · revisión ===== */
let SPF={id:"",lineas:[],sucio:false};   /* copia editable de la solicitud abierta */
const SP_ACT=()=>BD.sf(SPF.id);
function spEditable(){const s=SP_ACT();return !!s&&Docs.sf.editable(s)}
function abrirSF(id){
  const s=BD.sf(id); if(!s){toast("No existe la solicitud "+id);return}
  SPF={id:s.id,lineas:s.lineas.map(l=>({art:l.art,cant:l.cant,ldm:l.ldm})),sucio:false,mes:s.mes,almDestino:s.almDestino,fechaReq:s.fechaReq,obs:s.obs};
  go('gi23');
}
function loadSP(k){abrirSF(k)}   /* compatibilidad */
function renderSPform(){
  const s=SP_ACT(); if(!s)return;
  const e=s.est, ed=Docs.sf.editable(s), st='width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 6px;font-size:12px';
  const b=document.getElementById('sp-badge'); b.textContent=e; b.style.background=COLOR_EST[e];
  document.getElementById('sp-titulo').textContent="Solicitud de Fabricación · "+s.id+(e==="Pendiente Aprobar"?" · Revisión":"");
  document.getElementById('sp-id').value=s.id;
  document.getElementById('sp-resumen').value=spResumen(SPF);
  document.getElementById('sp-mes').innerHTML=opcionesLista(mesesProyectados(SPF.mes),SPF.mes,false);
  document.getElementById('sp-almdest').innerHTML=opcionesAlm(SPF.almDestino,a=>a.contenido==='Productos Terminados'&&!a.transito||a.cod===SPF.almDestino);
  document.getElementById('sp-freq').value=Fmt.iso(SPF.fechaReq);
  document.getElementById('sp-solic').value=s.solic||'';
  document.getElementById('sp-obs').value=SPF.obs||'';
  ['sp-mes','sp-almdest','sp-freq','sp-obs'].forEach(id=>{const x=document.getElementById(id);x.disabled=!ed;x.onchange=()=>{SPF.mes=document.getElementById('sp-mes').value;SPF.almDestino=document.getElementById('sp-almdest').value;SPF.fechaReq=Fmt.bd(document.getElementById('sp-freq').value);SPF.obs=document.getElementById('sp-obs').value;SPF.sucio=true;renderBotonesSP()}});
  document.getElementById('sp-total').value=Fmt.n(spTotal(SPF))+" UND";
  document.getElementById('sp-ofs').innerHTML=(s.ofs||[]).length?s.ofs.map(docLink).join(', ')+(s.ref?' · '+Fmt.e(s.ref):''):hint('Sin órdenes todavía');
  document.getElementById('sp-b-adddet').style.display=ed?'inline-block':'none';
  /* detalle */
  document.getElementById('sp-items').innerHTML=SPF.lineas.map((l,i)=>{
    const opts=BD.ldmsDe(l.art), pred=(BD.ldmPred(l.art)||{}).id, esp=l.ldm&&l.ldm!==pred;
    const qty=ed?'<td><input value="'+l.cant+'" style="text-align:right" onchange="spQtyInput('+i+',this)"></td>':'<td style="text-align:right">'+Fmt.n(l.cant)+'</td>';
    const tipo=!opts.length?hint():ed?'<select style="'+st+'" onchange="spSetTipoFab('+i+',this.value)"><option'+(esp?'':' selected')+'>Estándar</option><option'+(esp?' selected':'')+(opts.length<2?' disabled':'')+'>Especial</option></select>':(esp?'Especial':'Estándar');
    const ldm=!opts.length?'<span class="hint" style="color:var(--cancelada)">Sin lista</span>':ed&&esp?'<select style="'+st+'" onchange="spSetLdm('+i+',this.value)">'+opcionesLDM(l.art,l.ldm)+'</select>':docLDM(l.ldm||pred);
    const n=Explosion.bruto([l]).length;
    let fila='<tr><td>'+(i+1)+'</td><td>'+l.art+'</td><td>'+Fmt.e(BD.nomArt(l.art))+'</td><td>'+(attrDe(l.art,'Color')||'-')+'</td><td>'+(attrDe(l.art,'Talla')||'-')+'</td>'+qty+'<td>'+tipo+'</td><td>'+ldm+'</td>'+
      '<td><button class="btn-link" onclick="spToggleExp('+i+')">'+(l._exp?'▾':'▸')+' Materiales ('+n+')</button>'+(ed?' <button class="btn-link" onclick="SPF.lineas.splice('+i+',1);SPF.sucio=true;renderSPform()">Quitar</button>':'')+'</td></tr>';
    if(l._exp)fila+=spReqSubrow(l);
    return fila;
  }).join('')||'<tr><td colspan="9" style="text-align:center;color:var(--texto-sec);padding:14px">Sin líneas</td></tr>';
  document.getElementById('sp-items-foot').innerHTML='<tr><td colspan="5" style="text-align:right;font-weight:600">TOTAL</td><td style="text-align:right;font-weight:700">'+Fmt.n(spTotal(SPF))+'</td><td colspan="3"></td></tr>';
  /* historial */
  const COL={ok:"var(--texto-sec)",pend:"var(--pendiente)",no:"var(--rechazado-sol)"};
  document.getElementById('sp-hist').innerHTML=(s.hist||[]).slice().reverse().map(h=>'<div class="hline"><b style="font-size:12.5px">'+Fmt.e(h.a)+'</b><br><span class="hint" style="color:'+(COL[h.e]||COL.ok)+'">'+h.f+' · '+Fmt.e(h.u)+(h.d?' — '+Fmt.e(h.d):'')+'</span></div>').join('');
  renderPanelMP(); renderServiciosSP(); renderSCs(); renderPanelStock(); renderComprometidoSP();
  renderValidaciones(); renderAvisoSP(); renderBotonesSP();
}
RENDER.gi23=renderSPform;
function docLDM(id){return id?'<button class="btn-link" onclick="loadLDM(\''+id+'\')">'+id+'</button> <span class="hint">'+Fmt.e((BD.ldm(id)||{}).nom||'')+'</span>':hint()}
function spQtyInput(i,el){SPF.lineas[i].cant=parseFloat(el.value)||0;SPF.sucio=true;renderSPform()}
function spSetTipoFab(i,v){const l=SPF.lineas[i];if(v==='Estándar')l.ldm=(BD.ldmPred(l.art)||{}).id||'';else{const alt=BD.ldmsDe(l.art).find(x=>!x.pred);if(alt)l.ldm=alt.id;}SPF.sucio=true;renderSPform()}
function spSetLdm(i,v){SPF.lineas[i].ldm=v;SPF.sucio=true;renderSPform()}
function spToggleExp(i){SPF.lineas[i]._exp=!SPF.lineas[i]._exp;renderSPform()}
function renderBotonesSP(){
  const s=SP_ACT(); if(!s)return;
  const e=s.est, show=(id,v)=>document.getElementById(id).style.display=v?"inline-block":"none", rev=e==="Pendiente Aprobar";
  show('sp-b-guardar',Docs.sf.editable(s)&&SPF.sucio);
  show('sp-b-enviar',e==="Borrador"||e==="Rechazada");
  document.getElementById('sp-b-enviar').textContent=e==="Rechazada"?"Corregir y reenviar":"Enviar a revisión";
  show('sp-b-mod',rev); show('sp-b-rech',rev);
  show('sp-b-vb',rev&&!s.vb); show('sp-b-ap',rev&&!s.ger);
  show('sp-b-verif',e!=="Convertida en Orden"&&e!=="Fabricada");
  show('sp-b-prod',e==="Aprobada"||e==="Convertida en Orden"||e==="Fabricada");
}
function renderAvisoSP(){
  const s=SP_ACT(), av=document.getElementById('sp-aviso'), e=s.est;
  const set=(c,bg,html)=>{av.style.display="block";av.style.borderLeftColor=c;av.style.background=bg;av.innerHTML=html};
  const ult=a=>(s.hist||[]).slice().reverse().find(h=>h.a===a);
  if(e==="Rechazada"){const h=ult('Rechazada');set("var(--rechazado-sol)","#FEF2F2",'<b style="font-size:12.5px">Solicitud rechazada</b><p class="hint" style="margin-top:5px">'+(h&&h.d?'Motivo: '+Fmt.e(h.d)+'. ':'')+'Se puede corregir y volver a enviar.</p>')}
  else if(e==="Aprobada")set("var(--confirmado)","#F0FDF4",'<b style="font-size:12.5px">Solicitud aprobada · materia prima comprometida</b><p class="hint" style="margin-top:5px">Solo lectura. Las órdenes de fabricación se crean en Producción (PR-03): al crearlas la solicitud pasa a Convertida en Orden y las órdenes toman su propio comprometido.</p>')
  else if(e==="Convertida en Orden"||e==="Fabricada")set("var(--completada)","#F0FDF4",'<b style="font-size:12.5px">'+(e==="Fabricada"?"Solicitud fabricada":"Solicitud convertida en órdenes de fabricación")+'</b><p class="hint" style="margin-top:5px">Solo lectura. Órdenes: '+((s.ofs||[]).map(docLink).join(', ')||'-')+(s.ref?' · N° Referencia '+Fmt.e(s.ref):'')+'.</p>')
  else if(e==="Borrador"){const h=ult('Devuelta para modificar');set("var(--borrador)","#F8FAFC",h?'<b style="font-size:12.5px">Devuelta para modificación</b><p class="hint" style="margin-top:5px">'+Fmt.e(h.d||'')+' · Corrija y vuelva a enviar.</p>':'<b style="font-size:12.5px">Borrador</b><p class="hint" style="margin-top:5px">Aún no enviada a revisión. Los requerimientos se muestran como referencia.</p>')}
  else if(e==="Pendiente Aprobar"){
    const f=(SPF.mp||[]).filter(m=>m.falta);
    set(f.length?"var(--pendiente)":"var(--confirmado)",f.length?"#FFFBEB":"#F0FDF4",f.length?'<b style="font-size:12.5px">⚠ '+f.length+' material(es) sin cobertura</b><p class="hint" style="margin-top:5px">Puede dar el V°B° igualmente (se compromete aunque el disponible quede negativo) y gestionar la compra o transferencia con una Solicitud de Materiales.</p>':'<b style="font-size:12.5px">Materia prima cubierta</b><p class="hint" style="margin-top:5px">Todos los materiales alcanzan con el disponible actual.</p>');
  }else av.style.display="none";
}
function renderValidaciones(){
  const s=SP_ACT(), box=document.getElementById('sp-val');
  if(s.est==="Borrador"){box.innerHTML='';return}
  const quien=a=>{const h=(s.hist||[]).slice().reverse().find(x=>x.a===a);return h?h.u+' · '+h.f:''};
  const li=(t,ok,a)=>'<div style="padding:4px 0">'+t+': '+(ok?'<b style="color:var(--confirmado)">✓ '+Fmt.e(quien(a))+'</b>':'<b style="color:var(--pendiente)">pendiente</b>')+'</div>';
  box.innerHTML='<b style="font-size:12.5px">Validaciones</b>'+li("V°B° Logística",s.vb,'V°B° Logística')+li("Aprobación Gerencia",s.ger,'Aprobación Gerencia')+'<p class="hint" style="margin-top:6px">Ambas firmas son independientes y en cualquier orden.</p>';
}
