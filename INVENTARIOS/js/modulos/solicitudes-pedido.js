/* INVENTARIOS · GP-01/02/03 Solicitudes de Pedido: bandeja, alta, revisión y buscador de artículos */
/* ===== GP-02 · Alta de solicitud sobre artículos concretos ===== */
let SP_SEQ=8, NSP=null, ART_CTX="rev";
function nuevaSP(){
  NSP={id:"SP-000"+SP_SEQ,lineas:[]};
  document.getElementById('n-sp-id').value=NSP.id;
  document.getElementById('n-sp-mes').value=""; document.getElementById('n-sp-obs').value="";
  document.getElementById('n-sp-almdest').innerHTML='<option value="">Seleccionar…</option>'+ALMACENES.map(a=>'<option value="'+a.cod+' · '+a.nom+'">'+a.cod+' · '+a.nom+'</option>').join('');
  document.getElementById('n-sp-solic').value=USUARIO_GP;
  renderNSPitems(); go('gp02');
}
function ctxSP(){return ART_CTX==="nuevo"?NSP:SP}

/* --- Buscador de artículos (GP-02b) --- */
function abrirBuscadorArt(ctx){
  ART_CTX=ctx;
  if(ctx==="rev" && !(SP.est==="Borrador"||SP.est==="Pendiente Aprobar")){toast("El detalle solo se edita en Borrador o Pendiente Aprobar");return}
  const cats=[...new Set(artTerminados().map(a=>a.c).filter(Boolean))];
  document.getElementById('gp02b-q').value="";
  document.getElementById('gp02b-cat').innerHTML='<option value="">Todas</option>'+cats.map(c=>'<option>'+c+'</option>').join('');
  const cols=catalogoValores("Color"), tallas=catalogoValores("Talla");
  document.getElementById('gp02b-color').innerHTML='<option value="">Todos</option>'+cols.map(c=>'<option>'+c+'</option>').join('');
  document.getElementById('gp02b-talla').innerHTML='<option value="">Todas</option>'+tallas.map(t=>'<option>'+t+'</option>').join('');
  renderBuscadorArt(); openModal('m-gp02b');
}
function renderBuscadorArt(){
  const q=(document.getElementById('gp02b-q').value||"").toLowerCase();
  const cat=document.getElementById('gp02b-cat').value;
  const col=document.getElementById('gp02b-color').value;
  const tal=document.getElementById('gp02b-talla').value;
  const d=ctxSP();
  const tb=document.getElementById('gp02b-body'); tb.innerHTML="";
  artTerminados().forEach(a=>{
    if(cat && a.c!==cat)return;
    if(col && attrDe(a,"Color")!==col)return;
    if(tal && attrDe(a,"Talla")!==tal)return;
    if(q && !(a.id.toLowerCase().includes(q)||sinTildes(a.n).includes(sinTildes(q))))return;
    const ya=d.lineas.some(l=>l.art===a.id);
    tb.innerHTML+='<tr><td style="text-align:center">'+(ya?'<span class="hint">✓</span>':'<input type="checkbox" class="gp02b-chk" value="'+a.id+'">')+'</td>'+
     '<td>'+a.id+'</td><td>'+a.n+(ya?' <span class="hint">(ya en el detalle)</span>':'')+'</td>'+
     '<td>'+(attrDe(a,"Color")||'<span class="hint">-</span>')+'</td><td>'+(attrDe(a,"Talla")||'<span class="hint">-</span>')+'</td><td>'+a.u+'</td></tr>';
  });
  if(!tb.innerHTML)tb.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--texto-sec);padding:14px">Ningún artículo terminado coincide con los filtros</td></tr>';
}
function addArtsSeleccionados(){
  const d=ctxSP();
  const sel=[...document.querySelectorAll('.gp02b-chk:checked')].map(x=>x.value);
  if(!sel.length){toast("Marque al menos un artículo");return}
  sel.forEach(cod=>{
    const a=artDe(cod);
    d.lineas.push({art:a.id,nom:a.n,color:attrDe(a,"Color"),talla:attrDe(a,"Talla"),qty:0});
  });
  refrescarDetalleSP();
  renderBuscadorArt();
  toast(sel.length+" artículo(s) agregado(s) al detalle: complete las cantidades");
}
function refrescarDetalleSP(){
  if(ART_CTX==="nuevo"){renderNSPitems()}
  else{renderSPform(); if(SP.est!=="Borrador"){renderPanelStock();renderPanelMP();renderVBaviso();}}
}
function renderNSPitems(){
  const tb=document.getElementById('n-sp-items'); tb.innerHTML="";
  NSP.lineas.forEach((l,i)=>{
    tb.innerHTML+='<tr><td>'+(i+1)+'</td><td>'+(l.art||'<span class="hint">—</span>')+'</td>'+
     '<td>'+l.nom+'</td><td>'+(l.color||'-')+'</td><td>'+(l.talla||'-')+'</td>'+
     '<td><input value="'+l.qty+'" style="text-align:right" oninput="nspQty('+i+',this)"></td>'+
     '<td><button class="btn-link" onclick="NSP.lineas.splice('+i+',1);renderNSPitems()">Quitar</button></td></tr>';
  });
  if(!NSP.lineas.length)tb.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--texto-sec);padding:14px">Sin líneas: use "+ Agregar artículos"</td></tr>';
  nspFootUI();
}
function nspQty(i,el){NSP.lineas[i].qty=parseFloat(el.value)||0;nspFootUI()}
function nspFootUI(){
  const t=NSP.lineas.reduce((a,l)=>a+l.qty,0);
  document.getElementById('n-sp-items-foot').innerHTML=NSP.lineas.length?('<tr><td colspan="5" style="text-align:right;font-weight:600">TOTAL</td><td style="text-align:right;font-weight:700">'+t+'</td><td></td></tr>'):'';
  document.getElementById('n-sp-total').value=t+" UND";
}
function guardarSP(enviar){
  if(!document.getElementById('n-sp-mes').value){toast("Seleccione el mes proyectado");return}
  if(!document.getElementById('n-sp-almdest').value){toast("Seleccione el almacén destino");return}
  if(!NSP.lineas.length){toast("Agregue al menos un artículo al detalle");return}
  if(NSP.lineas.some(l=>!(l.qty>0))){toast("Todas las líneas deben tener cantidad mayor a cero");return}
  const k="sp"+SP_SEQ;
  SPS[k]={id:NSP.id,fecha:"19/07/2026",mes:document.getElementById('n-sp-mes').value,
   almDestino:document.getElementById('n-sp-almdest').value,
   solic:USUARIO_GP,est:enviar?"Pendiente Aprobar":"Borrador",vb:false,ger:false,
   obs:document.getElementById('n-sp-obs').value||"-",
   lineas:NSP.lineas.map(l=>({...l})),
   hist:enviar?[{a:"Envió la solicitud",d:"19/07/2026 · "+USUARIO_GP,e:"ok"},
                {a:"V°B° Logística",d:"Pendiente · Judith",e:"pend"},
                {a:"Aprobación Gerencia",d:"Pendiente · David",e:"pend"}]
             :[{a:"Creada en borrador",d:"19/07/2026 · "+USUARIO_GP,e:"ok"},
               {a:"Envío a revisión",d:"Pendiente",e:"pend"}]};
  SPS_ORDEN.unshift(k); SP_SEQ++;
  renderSP(); loadSP(k);
  toast(SPS[k].id+(enviar?" enviada a revisión: los paneles de stock y materia prima ya están calculados":" guardada como Borrador"));
}

/* ===== GP-01/GP-03 · Solicitudes de Pedido de Fabricación ===== */
const SP_EST={"Borrador":"var(--borrador)","Pendiente Aprobar":"var(--pendiente)","Aprobada":"var(--confirmado)","Rechazada":"var(--rechazado-sol)","Convertida en Orden":"var(--completada)"};
/* Los artículos son códigos concretos del maestro GI: talla y color son atributos suyos.
   No hay plantillas ni variantes: para crear uno parecido se usa Duplicar en GI-02. */
function artDe(cod){return ARTICULOS.find(a=>a.id===cod)}
function attrDe(a,nom){if(!a||!a.attrs)return "";const p=a.attrs.find(x=>x[0]===nom);return p?p[1]:""}
function artTerminados(){return ARTICULOS.filter(a=>a.t==="PRODUCTOS TERMINADOS"&&a.e==="Activo")}
function catalogoValores(nom){
  const v=new Set();
  artTerminados().forEach(a=>{const x=attrDe(a,nom); if(x)v.add(x)});
  const m=ATRIBUTOS.find(x=>x.nom===nom);
  if(m)m.vals.forEach(x=>v.add(x));
  return [...v];
}
function spResumen(d){
  if(!d.lineas.length)return "-";
  const n0=d.lineas[0].nom||d.lineas[0].art;
  return d.lineas.length>1 ? (n0+" y "+(d.lineas.length-1)+" más") : n0;
}
function spCategorias(d){return [...new Set(d.lineas.map(l=>{const a=artDe(l.art);return a?a.c:""}).filter(Boolean))]}
const SPS={
 sp7:{id:"SP-0007",fecha:"12/06/2026",mes:"Ago 2026",  solic:"Comercial 01",est:"Pendiente Aprobar",vb:false,ger:false,obs:"Proyección acordada con Logística para la campaña de agosto.",
  lineas:[{art:"PT-0001",nom:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",color:"AZUL",talla:"28",qty:90},{art:"PT-0002",nom:"PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL",color:"AZUL",talla:"30",qty:75},{art:"PT-0003",nom:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR NEGRO",color:"NEGRO",talla:"28",qty:80}],
  hist:[{a:"Envió la solicitud",d:"12/06/2026 10:24 · Comercial 01",e:"ok"},
        {a:"V°B° Logística",d:"Pendiente · Judith",e:"pend"},
        {a:"Aprobación Gerencia",d:"Pendiente · David",e:"pend"}]},
 sp3:{id:"SP-0003",fecha:"11/06/2026",mes:"Ago 2026",  solic:"Comercial 02",est:"Aprobada",vb:true,ger:true,obs:"Reposición de los tres colores base.",
  lineas:[{art:"PT-0001",nom:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",color:"AZUL",talla:"28",qty:35},{art:"PT-0002",nom:"PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL",color:"AZUL",talla:"30",qty:33},{art:"PT-0003",nom:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR NEGRO",color:"NEGRO",talla:"28",qty:36}],
  hist:[{a:"Envió la solicitud",d:"11/06/2026 09:10 · Comercial 02",e:"ok"},
        {a:"V°B° Logística",d:"12/06/2026 11:05 · Judith",e:"ok"},
        {a:"Aprobación Gerencia",d:"12/06/2026 15:40 · David",e:"ok"}]},
 sp6:{id:"SP-0006",fecha:"09/06/2026",mes:"Ago 2026",  solic:"Comercial 01",est:"Borrador",vb:false,ger:false,obs:"Pendiente de cerrar cantidades con Comercial.",
  lineas:[{art:"PT-0001",nom:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",color:"AZUL",talla:"28",qty:30},{art:"PT-0002",nom:"PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL",color:"AZUL",talla:"30",qty:25},{art:"PT-0003",nom:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR NEGRO",color:"NEGRO",talla:"28",qty:33}],
  hist:[{a:"Creada en borrador",d:"09/06/2026 16:02 · Comercial 01",e:"ok"},
        {a:"Envío a revisión",d:"Pendiente · Comercial 01",e:"pend"}]},
 sp2:{id:"SP-0002",fecha:"05/06/2026",mes:"Jul 2026",  solic:"Comercial 02",est:"Convertida en Orden",vb:true,ger:true,obs:"Campaña de julio: reposición de los colores base.",
  lineas:[{art:"PT-0001",nom:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",color:"AZUL",talla:"28",qty:60},{art:"PT-0002",nom:"PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL",color:"AZUL",talla:"30",qty:50},{art:"PT-0003",nom:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR NEGRO",color:"NEGRO",talla:"28",qty:70}],
  hist:[{a:"Envió la solicitud",d:"05/06/2026 09:30 · Comercial 02",e:"ok"},
        {a:"V°B° Logística",d:"05/06/2026 15:10 · Judith",e:"ok"},
        {a:"Aprobación Gerencia",d:"06/06/2026 09:05 · David",e:"ok"},
        {a:"Órdenes de Fabricación creadas en Producción",d:"06/06/2026 10:20 · Producción (Solicitudes de Fabricación)",e:"ok"}]},
 sp4:{id:"SP-0004",fecha:"10/06/2026",mes:"Jul 2026",  solic:"Comercial 01",est:"Rechazada",vb:true,ger:false,obs:"Pedido adicional fuera de la proyección acordada.",
  lineas:[{art:"PT-0003",nom:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR NEGRO",color:"NEGRO",talla:"28",qty:25}],
  hist:[{a:"Envió la solicitud",d:"10/06/2026 08:40 · Comercial 01",e:"ok"},
        {a:"V°B° Logística",d:"10/06/2026 12:15 · Judith",e:"ok"},
        {a:"Rechazo de Gerencia",d:"10/06/2026 17:30 · David — Motivo: fuera de la proyección acordada para julio; replantear en la proyección de agosto.",e:"no"}]}
};
const SPS_ORDEN=["sp6","sp7","sp3","sp2","sp4"];
let SP=null, SPkey="";
function spTotal(d){return d.lineas.reduce((a,l)=>a+l.qty,0)}
function spQtyInput(i,el){
  SP.lineas[i].qty=parseFloat(el.value)||0;
  spRebuildReqs(SP.lineas[i]);
  document.getElementById('sp-total').value=spTotal(SP)+" UND";
  document.getElementById('sp-items-foot').innerHTML='<tr><td colspan="5" style="text-align:right;font-weight:600">TOTAL</td><td style="text-align:right;font-weight:700">'+spTotal(SP)+'</td><td colspan="3"></td></tr>';
  if(SP.est!=="Borrador"){renderPanelStock();renderPanelMP();renderVBaviso();}
  renderSP();
}
function renderSP(){
  const e=document.getElementById('f-sp-e').value, m=document.getElementById('f-sp-m').value;
  const q=(document.getElementById('f-sp-q').value||""), b=document.getElementById('f-sp-b').value;
  const tb=document.getElementById('sp-body'); tb.innerHTML=""; let n=0;
  SPS_ORDEN.forEach(k=>{
    const d=SPS[k]; if(!d)return;
    if(e && d.est!==e)return; if(m && d.mes!==m)return;
    if(b && !spCategorias(d).includes(b))return;
    if(q && !d.lineas.some(l=>sinTildes(l.nom).includes(sinTildes(q))||(l.art||"").toLowerCase().includes(q.toLowerCase())))return;
    n++;
    const editable=(d.est==="Borrador"||d.est==="Pendiente Aprobar"||d.est==="Rechazada");
    const tr=document.createElement('tr'); tr.className="clickable"; tr.onclick=()=>loadSP(k);
    tr.innerHTML='<td>'+d.id+'</td><td>'+d.fecha+'</td><td>'+d.mes+'</td>'+
     '<td style="text-align:right">'+d.lineas.length+'</td>'+
     '<td style="text-align:right;font-weight:600">'+spTotal(d)+'</td>'+
     '<td><span class="badge" style="background:'+SP_EST[d.est]+'">'+d.est+'</span></td><td>'+d.solic+'</td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();loadSP(\''+k+'\')">Ver</button> '+
     (editable?'<button class="btn-link" onclick="event.stopPropagation();loadSP(\''+k+'\')">Editar</button>':'<span class="hint">Editar</span>')+'</td>';
    tb.appendChild(tr);
  });
  document.getElementById('sp-count').textContent=n+" solicitudes de pedido";
}
function fillFiltroCatSP(){
  const sel=document.getElementById('f-sp-b'); if(!sel)return;
  const cats=[...new Set(artTerminados().map(a=>a.c).filter(Boolean))];
  sel.innerHTML='<option value="">Todas</option>'+cats.map(c=>'<option>'+c+'</option>').join('');
}
function loadSP(k){
  SPkey=k; SP=SPS[k];
  if(!SP.almDestino)SP.almDestino="SB-ALM-PPT · Almacén Producto en Proceso"; /* default de producción */
  document.getElementById('sp-id').value=SP.id;
  document.getElementById('sp-resumen').value=spResumen(SP);
  document.getElementById('sp-mes').value=SP.mes;
  document.getElementById('sp-solic').value=SP.solic;
  document.getElementById('sp-total').value=spTotal(SP)+" UND";
  document.getElementById('sp-obs').value=SP.obs;
  const ad=document.getElementById('sp-almdest');
  ad.innerHTML=ALMACENES.map(a=>'<option value="'+a.cod+' · '+a.nom+'">'+a.cod+' · '+a.nom+'</option>').join('');
  if(SP.almDestino && !ALMACENES.some(a=>(a.cod+' · '+a.nom)===SP.almDestino))ad.innerHTML+='<option value="'+SP.almDestino+'">'+SP.almDestino+'</option>';
  ad.value=SP.almDestino||"";
  ad.disabled=!(SP.est==="Borrador"||SP.est==="Pendiente Aprobar");
  renderSPform(); go('gp03');
}
function renderSPform(){
  const e=SP.est;
  const b=document.getElementById('sp-badge'); b.textContent=e; b.style.background=SP_EST[e];
  const t=document.getElementById('sp-titulo');
  t.textContent="Solicitud de Pedido · "+(e==="Pendiente Aprobar"?"Revisión":e);
  document.getElementById('sp-code').textContent=(e==="Aprobada")?"GP-03-01":"GP-03";
  const show=(id,v)=>document.getElementById(id).style.display=v?"inline-block":"none";
  const enRevision=(e==="Pendiente Aprobar");
  show('sp-b-mod',enRevision); show('sp-b-rech',enRevision);
  show('sp-b-vb',enRevision && !SP.vb); show('sp-b-ap',enRevision && !SP.ger);
  show('sp-b-prod',e==="Aprobada"||e==="Convertida en Orden");
  show('sp-b-verif',enRevision || e==="Aprobada");
  show('sp-b-enviar',e==="Borrador"); show('sp-b-reabrir',e==="Rechazada");
  // detalle
  const tb=document.getElementById('sp-items'); tb.innerHTML="";
  const editableDet=(e==="Borrador"||e==="Pendiente Aprobar");
  document.getElementById('sp-b-adddet').style.display=editableDet?"inline-block":"none";
  const sst='width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 6px;font-size:12px';
  SP.lineas.forEach((l,i)=>{
    if(l.tipofab==null)l.tipofab="Estándar";
    const qtyCell=editableDet?('<td><input value="'+l.qty+'" style="text-align:right" oninput="spQtyInput('+i+',this)"></td>'):('<td style="text-align:right">'+l.qty+'</td>');
    const opts=ldmOptsDe(l.art);
    let tipoFabCell,ldmCell;
    if(!l.art || !opts.length){
      tipoFabCell='<span class="hint">—</span>'; ldmCell='<span class="hint">—</span>';
    } else if(editableDet){
      tipoFabCell='<select style="'+sst+'" onchange="spSetTipoFab('+i+',this.value)"><option'+(l.tipofab==="Estándar"?" selected":"")+'>Estándar</option><option'+(l.tipofab==="Especial"?" selected":"")+'>Especial</option></select>';
      const cur=ldmDeLinea(l);
      const dis=(l.tipofab!=="Especial")?" disabled":"";
      ldmCell='<select style="'+sst+(dis?';background:#F1F5F9;color:var(--texto-sec)':'')+'" onchange="spSetLdm('+i+',this.value)"'+dis+'>'+
        opts.map(o=>'<option value="'+o.id+'"'+((cur&&o.id===cur.id)?" selected":"")+'>'+o.nom+'</option>').join('')+'</select>';
    } else {
      const cur=ldmDeLinea(l);
      tipoFabCell=l.tipofab;
      ldmCell=cur?('<span class="hint">'+cur.nom+'</span>'):'<span class="hint">—</span>';
    }
    let estado = '<span class="hint">Dado de alta</span>';
    if(l.art && opts.length){ spEnsureReqs(l); estado += ' · <button class="btn-link" onclick="spToggleExp('+i+')">'+(l._exp?'▾':'▸')+' Materiales ('+((l.reqs||[]).length)+')</button>'; }
    let filaHtml='<tr><td>'+(i+1)+'</td><td>'+(l.art||'<span class="hint">—</span>')+'</td><td>'+l.nom+'</td>'+
     '<td>'+(l.color||'-')+'</td><td>'+(l.talla||'-')+'</td>'+qtyCell+
     '<td>'+tipoFabCell+'</td><td>'+ldmCell+'</td>'+
     '<td>'+estado+
     (editableDet?' <button class="btn-link" onclick="SP.lineas.splice('+i+',1);renderSPform();if(SP.est!==\'Borrador\'){renderPanelStock();renderPanelMP();renderVBaviso();}">Quitar</button>':'')+'</td></tr>';
    if(l._exp && l.art && opts.length) filaHtml += spReqSubrow(l,i);
    tb.innerHTML+=filaHtml;
  });
  document.getElementById('sp-items-foot').innerHTML='<tr><td colspan="5" style="text-align:right;font-weight:600">TOTAL</td><td style="text-align:right;font-weight:700">'+spTotal(SP)+'</td><td colspan="3"></td></tr>';
  // historial
  const COL={ok:"var(--confirmado)",pend:"var(--pendiente)",no:"var(--rechazado-sol)"};
  document.getElementById('sp-hist').innerHTML=SP.hist.map(h=>
    '<div class="hline"><b style="font-size:12.5px">'+h.a+'</b><br><span class="hint" style="color:'+(h.e==="pend"?"var(--pendiente)":(h.e==="no"?"var(--rechazado-sol)":"var(--texto-sec)"))+'">'+h.d+'</span></div>').join('');
  // aviso segun estado
  const av=document.getElementById('sp-aviso');
  if(e==="Rechazada"){
    av.style.display="block"; av.style.borderLeftColor="var(--rechazado-sol)"; av.style.background="#FEF2F2";
    av.innerHTML='<b style="font-size:12.5px">Solicitud rechazada por Gerencia</b><p class="hint" style="margin-top:5px">'+(SP.motivo?("Motivo: "+SP.motivo+". "):"")+'El documento vuelve a ser editable por Comercial y el motivo queda visible en el historial.</p>';
  }else if(e==="Aprobada"){
    av.style.display="block"; av.style.borderLeftColor="var(--confirmado)"; av.style.background="#F0FDF4";
    av.innerHTML='<b style="font-size:12.5px">Solicitud aprobada</b><p class="hint" style="margin-top:5px">Solo lectura. Aprobada: las órdenes de fabricación se crean en Producción (Solicitudes de Fabricación). Use «Ver en Producción».</p>';
  }else if(e==="Convertida en Orden"){
    av.style.display="block"; av.style.borderLeftColor="var(--completada)"; av.style.background="#F0FDF4";
    av.innerHTML='<b style="font-size:12.5px">Solicitud convertida en Orden de Fabricación</b><p class="hint" style="margin-top:5px">Documento bloqueado en solo lectura. Sus órdenes de fabricación se gestionan en Producción.</p>';
  }else if(e==="Borrador"){
    av.style.display="block"; av.style.borderLeftColor="var(--borrador)"; av.style.background="#F8FAFC";
    av.innerHTML=SP.devuelta
      ? '<b style="font-size:12.5px">Devuelta para modificación</b><p class="hint" style="margin-top:5px">Comentario de Logística: '+SP.devuelta+' Comercial la corrige y la vuelve a enviar; las Solicitudes de Materiales ya generadas se conservan.</p>'
      : '<b style="font-size:12.5px">Borrador de Comercial</b><p class="hint" style="margin-top:5px">Aún no enviada a revisión: no genera cálculo de materia prima ni notificaciones.</p>';
  }else av.style.display="none";
  // paneles de la Ola 2
  document.getElementById('sp-paneles').style.display=(e==="Borrador")?"none":"block";
  if(e!=="Borrador"){renderPanelStock();renderRotModelo();renderPanelMP();renderSCs();renderVBaviso();}
  renderValidaciones();
}

/* ===== GP-03 · Rotación del modelo ===== */
const ROT_GP={
 "PT-0003":[{alm:"SB-ALM-LIQ · Liquidación Central",stock:80,usal:"21/12/2025",dias:210},
            {alm:"SB-ALM-PT · Central Mercadería",stock:22,usal:"30/04/2026",dias:80}],
 "PT-0002":[{alm:"SB-ALM-PT · Central Mercadería",stock:4,usal:"24/02/2026",dias:145}],
 "PT-0001":[{alm:"SB-ALM-PT · Central Mercadería",stock:40,usal:"12/07/2026",dias:7},
            {alm:"SB-TDA-01 · Tienda Gamarra 1",stock:9,usal:"17/07/2026",dias:2}]
};
function rotSemGP(d){
  if(d>180)return["Crítico >180 días","var(--cancelada)"];
  if(d>90)return["Inmovilizado","#C2410C"];
  if(d>30)return["Vigilar","var(--pendiente)"];
  return["Rota bien","var(--confirmado)"];
}
function renderRotModelo(){
  const tb=document.getElementById('sp-rot'); if(!tb)return;
  tb.innerHTML="";
  let filas=[];
  SP.lineas.forEach(l=>{ (ROT_GP[l.art]||[]).forEach(r=>filas.push({...r,art:l.art,nom:l.nom})) });
  filas.sort((a,b)=>b.dias-a.dias);
  filas.forEach(r=>{
    const[t,c]=rotSemGP(r.dias);
    tb.innerHTML+='<tr><td>'+r.nom+'<br><span class="hint">'+r.art+'</span></td><td>'+r.alm+'</td>'+
     '<td style="text-align:right">'+r.stock+'</td><td>'+r.usal+'</td>'+
     '<td style="text-align:right;font-weight:700;'+(r.dias>90?'color:var(--cancelada)':'')+'">'+r.dias+'</td>'+
     '<td><span class="badge" style="background:'+c+'">'+t+'</span></td></tr>';
  });
  if(!filas.length)tb.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--texto-sec);padding:14px">Sin historial de rotación para los artículos de este pedido</td></tr>';
}
