/* INVENTARIOS · GI-07 Movimientos y GI-08 detalle sobre BD.d.movs (todos los módulos) + notas internas NI/NS/NT */
const EST_MOV_COLOR={"Confirmado":"var(--confirmado)","Completada":"var(--completada)"};
function fillMovFiltros(){
  const a=document.getElementById('f-mov-a'); a.innerHTML=opcionesAlm(a.value,null,'Todos');
  const g=document.getElementById('f-mov-g'), vg=g.value;
  g.innerHTML=opcionesLista((M().gruposMovimiento||[]).map(x=>({v:x.cod,t:x.cod+' · '+x.nom})),vg,'Todos');
  fillMovTipos();
  const m=document.getElementById('f-mov-m'), vm=m.value;
  m.innerHTML=opcionesLista([...new Set(BD.d.movs.map(x=>x.modulo).filter(Boolean))].sort(),vm,'Todos');
}
function fillMovTipos(){const t=document.getElementById('f-mov-t'), v=t.value; t.innerHTML=opcionesTipoMov(document.getElementById('f-mov-g').value,v,'Todos')}
function renderMov(){
  const q=Fmt.s(document.getElementById('f-mov-q').value), a=document.getElementById('f-mov-a').value;
  const g=document.getElementById('f-mov-g').value, t=document.getElementById('f-mov-t').value, mo=document.getElementById('f-mov-m').value;
  const d=Fmt.num(Fmt.bd(document.getElementById('f-mov-d').value)), h=Fmt.num(Fmt.bd(document.getElementById('f-mov-h').value));
  const lista=BD.d.movs.filter(m=>{
    const alms=[...new Set(m.lineas.map(l=>l.alm).concat([m.alm,m.destino]).filter(Boolean))];
    if(!alms.some(x=>((BD.alm(x)||{}).emp||empresaAbrev())===empresaAbrev()))return false;
    if(a&&!alms.includes(a))return false;
    if(g&&m.grupoMov!==g)return false; if(t&&m.tipoMov!==t)return false; if(mo&&m.modulo!==mo)return false;
    const n=Fmt.num(m.fecha); if(d&&n<d)return false; if(h&&n>h)return false;
    if(q&&!Fmt.s([m.id,m.ndoc,m.doc,m.det,m.od].join(' ')).includes(q))return false;
    return true;
  });
  document.getElementById('mov-body').innerHTML=lista.map(m=>'<tr class="clickable" onclick="abrirMov(\''+m.id+'\')"><td>'+m.id+'</td>'+
    '<td>'+(m.tipoMov?'<b>'+m.tipoMov+'</b><br><span class="hint">'+Fmt.e(m.tipoMovNom||'')+'</span>':Fmt.e(m.tipo))+'</td><td>'+Fmt.e(m.det||'')+'</td>'+
    '<td onclick="event.stopPropagation()">'+docLink(m.ndoc)+(m.doc&&m.doc!==m.ndoc?'<br>'+docLink(m.doc):'')+'</td><td>'+m.fecha+'</td><td>'+Fmt.e(m.od||'')+'</td><td>'+Fmt.e(m.usuario||'')+'</td><td>'+Fmt.e(m.modulo||'')+'</td>'+
    '<td style="text-align:right">'+Fmt.m(m.valor)+'</td><td>'+badge(m.est,EST_MOV_COLOR[m.est])+'</td></tr>').join('')||
    '<tr><td colspan="10" style="text-align:center;color:var(--texto-sec);padding:18px">'+(BD.d.movs.length?'Ningún movimiento coincide con los filtros':'Sin movimientos en la base: registre un ingreso o reciba una Orden de Compra')+'</td></tr>';
  document.getElementById('mov-count').textContent=lista.length+" de "+BD.d.movs.length+" movimientos";
}
RENDER.gi07=()=>{fillMovFiltros();renderMov();renderST()};

/* ===== GI-08 · detalle ===== */
let MOV_ACTUAL="";
function abrirMov(id){
  const m=BD.mov(id); if(!m){toast("No existe el movimiento "+id);return}
  MOV_ACTUAL=id; go('gi08');
}
function renderDetalleMov(){
  const m=BD.mov(MOV_ACTUAL); if(!m)return;
  const set=(id,v)=>document.getElementById(id).value=v==null?'':v;
  document.getElementById('d8-title').textContent="MOVIMIENTO: "+m.tipo.toUpperCase()+" · "+m.id;
  const b=document.getElementById('d8-estado'); b.textContent=m.est; b.style.background=EST_MOV_COLOR[m.est]||'var(--confirmado)';
  set('d8-id',m.id); set('d8-user',m.usuario); set('d8-tmov',(m.tipoMov?m.tipoMov+' · ':'')+(m.tipoMovNom||m.tipo)); set('d8-det',m.det);
  set('d8-fecha',m.fecha); set('d8-mod',m.modulo); set('d8-concepto',m.concepto||'—'); set('d8-valor',Fmt.m(m.valor)); set('d8-obs',m.obs);
  const [ori,des]=String(m.od||'').split(' → ');
  if(m.tipo==='Ingreso'){document.getElementById('d8-ori-l').textContent='Origen';set('d8-ori',ori);document.getElementById('d8-alm-l').textContent='Almacén destino';set('d8-alm',almEtiqueta(m.alm));}
  else if(m.tipo==='Salida'){document.getElementById('d8-ori-l').textContent='Almacén origen';set('d8-ori',almEtiqueta(m.alm));document.getElementById('d8-alm-l').textContent='Destino';set('d8-alm',des||'');}
  else{document.getElementById('d8-ori-l').textContent='Almacén origen';set('d8-ori',almEtiqueta(m.alm));document.getElementById('d8-alm-l').textContent='Almacén destino';set('d8-alm',almEtiqueta(m.destino));}
  /* documentos relacionados */
  const rel=[];
  if(m.ndoc)rel.push(['N° de documento',docLink(m.ndoc)]);
  if(m.doc&&m.doc!==m.ndoc)rel.push(['Documento de origen',docLink(m.doc)]);
  BD.d.ocs.filter(o=>o.recepciones.some(r=>r.mov===m.id)).forEach(o=>rel.push(['Recepción de la Orden de Compra',docLink(o.id)+' · '+Fmt.e(BD.provNom(o.prov))]));
  BD.d.sols.filter(s=>s.lineas.some(l=>l.doc===m.id)).forEach(s=>rel.push(['Atiende la Solicitud de Materiales',docLink(s.id)]));
  (BD.d.gres||[]).filter(g=>g.mov===m.id).forEach(g=>rel.push(['Guía de remisión',docLink(g.id)+' · '+Fmt.e(g.motivo)]));
  BD.d.ofs.filter(o=>JSON.stringify(o).indexOf('"'+m.id+'"')>=0).forEach(o=>rel.push(['Orden de fabricación',docLink(o.id)+' · '+Fmt.e(BD.nomArt(o.art))]));
  const nota=colLog('notasInternas')[m.id]; if(nota)rel.push(['Nota interna impresa',nota]);
  document.getElementById('d8-docs').innerHTML='<b style="font-size:13px">Documentos relacionados</b>'+(rel.length?'<div class="formgrid" style="margin-top:10px">'+rel.map(r=>'<div class="field"><label>'+r[0]+'</label><div style="padding:6px 0">'+r[1]+'</div></div>').join('')+'</div>':'<p class="hint" style="margin-top:6px">Movimiento manual sin documento vinculado.</p>');
  /* líneas */
  const trf=m.tipo==='Transferencia';
  const conLote=m.lineas.some(l=>l.lote);
  document.getElementById('d8-tabla').innerHTML='<thead><tr><th style="width:40px">#</th><th>Código</th><th>Nombre</th><th>UM</th>'+(trf?'<th>Almacén</th>':'')+(conLote?'<th>Lote</th>':'')+'<th style="text-align:right">Cantidad</th><th style="text-align:right">Costo S/.</th><th style="text-align:right">Valor S/.</th><th style="text-align:right">Saldo después</th></tr></thead><tbody>'+
    m.lineas.map((l,i)=>'<tr><td>'+(i+1)+'</td><td><button class="btn-link" onclick="verKardex(\''+l.art+'\',\''+l.alm+'\')">'+l.art+'</button></td><td>'+Fmt.e(BD.nomArt(l.art))+'</td><td>'+BD.u(l.art)+'</td>'+
      (trf?'<td>'+l.alm+' '+(l.signo>0?badge('Entra','var(--confirmado)'):badge('Sale','var(--cancelada)'))+'</td>':'')+(conLote?'<td class="hint">'+Fmt.e(l.lote||'-')+'</td>':'')+
      '<td style="text-align:right">'+(l.signo<0?'−':'')+Fmt.n(l.cant)+'</td><td style="text-align:right">'+Fmt.m(l.costo)+'</td><td style="text-align:right">'+Fmt.m(l.valor)+'</td><td style="text-align:right">'+Fmt.n(l.saldo)+'</td></tr>').join('')+
    '</tbody><tfoot><tr><td colspan="'+((trf?7:6)+(conLote?1:0))+'" style="text-align:right;font-weight:600">Valor total</td><td style="text-align:right;font-weight:700">S/. '+Fmt.m(m.valor)+'</td><td></td></tr></tfoot>';
  document.getElementById('d8-gre').style.display=(m.tipo!=='Ingreso'&&!(BD.d.gres||[]).some(g=>g.mov===m.id))?'inline-block':'none';
}
RENDER.gi08=renderDetalleMov;

/* ===== Notas internas (NI/NS/NT): el número se asigna una sola vez por movimiento ===== */
function imprimirNota(){
  const m=BD.mov(MOV_ACTUAL); if(!m)return;
  const serie=m.tipo==='Ingreso'?'NI':m.tipo==='Salida'?'NS':'NT', S=mLog('seriesInternas'), notas=colLog('notasInternas');
  let num=notas[m.id], nueva=false;
  if(!num){num=serie+'-'+String(S[serie].prox).padStart(6,'0');S[serie].prox++;notas[m.id]=num;BD.guardar();nueva=true;}
  const [ori,des]=String(m.od||'').split(' → ');
  document.getElementById('nota-mtitle').textContent=S[serie].nom+" · "+num;
  document.getElementById('nota-emp').textContent=(M().empresas.find(e=>e.abrev===((BD.alm(m.alm)||{}).emp||'SB'))||{}).nom||'IMPERIOTEX';
  document.getElementById('nota-tipo').textContent=S[serie].nom.toUpperCase();
  document.getElementById('nota-num').textContent=num;
  document.getElementById('nota-fecha').textContent=m.fecha;
  document.getElementById('nota-mov').textContent=m.id+" · "+(m.tipoMovNom||m.det||m.tipo);
  document.getElementById('nota-ori').textContent=ori||''; document.getElementById('nota-des').textContent=des||'';
  document.getElementById('nota-doc').textContent=[m.ndoc,m.doc].filter((x,i,a)=>x&&a.indexOf(x)===i).join(' · ')||'-';
  document.getElementById('nota-obs').textContent=m.obs||'-';
  const lin=m.tipo==='Transferencia'?m.lineas.filter(l=>l.signo<0):m.lineas;
  document.getElementById('nota-tabla').innerHTML='<thead><tr><th>#</th><th>Código</th><th>Nombre</th><th>UM</th><th style="text-align:right">Cantidad</th></tr></thead><tbody>'+
    lin.map((l,i)=>'<tr><td>'+(i+1)+'</td><td>'+l.art+'</td><td>'+Fmt.e(BD.nomArt(l.art))+'</td><td>'+BD.u(l.art)+'</td><td style="text-align:right">'+Fmt.n(l.cant)+'</td></tr>').join('')+'</tbody>';
  openModal('m-nota');
  toast(nueva?"Nota "+num+" asignada al movimiento "+m.id:"Reimpresión de la nota "+num+" (el correlativo se asigna una sola vez)");
  renderDetalleMov();
}

/* compatibilidad con pantallas antiguas de Compras que abrían un detalle de ejemplo */
function showDetalle(k){ if(BD.mov(k))abrirMov(k); else go('gi07'); }
