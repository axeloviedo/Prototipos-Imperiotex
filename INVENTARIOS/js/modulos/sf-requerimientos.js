/* INVENTARIOS · GI-23 Alertas de stock y requerimientos de materia prima por línea */
/* ===== GI-23 · Paneles automáticos: alertas de stock y requerimientos de MP ===== */
/* Umbrales mínimos por variante (maestro) */
/* Mínimos por artículo y almacén: viven en GI-02, pestaña Planificación de Stock */
const UMBRALES={"PT-0001":15,"PT-0002":10,"PT-0003":18};
/* Listas de Materiales por modelo: la primera es la predeterminada. Un modelo puede tener varias
   (p.ej. el mismo jean con dos telas según disponibilidad de stock o de compra). */
/* Listas de materiales por artículo fabricable. Cada artículo tiene la suya: las cantidades de
   tela varían por talla, así que no puede haber una lista compartida. Un artículo puede tener
   una lista predeterminada y otras alternativas (p. ej. otra tela según disponibilidad). */
const LDM_OPTS={
 "PT-0001":[
  {id:"LDM-0001",nom:"Denim 12 Oz azul · talla 28 · 1.40 MT (predeterminada)",items:[
    {cod:"MP-0012",nom:"TELA DENIM 12 OZ AZUL",u:"MT",cons:1.40,alm:"SB-ALM-MPT · MP Telas"},
    {cod:"MP-0031",nom:"HILO POLIESTER AZUL",u:"UND",cons:0.05,alm:"SB-ALM-MPA · MP Avíos"},
    {cod:"MP-0044",nom:"BOTON METALICO 17MM",u:"UND",cons:1,alm:"SB-ALM-MPA · MP Avíos"},
    {cod:"MP-0045",nom:"CIERRE METALICO 12CM",u:"UND",cons:1,alm:"SB-ALM-MPA · MP Avíos"}]},
  {id:"LDM-0004",nom:"Denim alternativo · talla 28 · 1.40 MT",items:[
    {cod:"MP-0013",nom:"TELA DENIM 12 OZ NEGRO",u:"MT",cons:1.40,alm:"SB-ALM-MPT · MP Telas"},
    {cod:"MP-0031",nom:"HILO POLIESTER AZUL",u:"UND",cons:0.05,alm:"SB-ALM-MPA · MP Avíos"},
    {cod:"MP-0044",nom:"BOTON METALICO 17MM",u:"UND",cons:1,alm:"SB-ALM-MPA · MP Avíos"}]}
 ],
 "PT-0002":[
  {id:"LDM-0002",nom:"Denim 12 Oz azul · talla 30 · 1.46 MT (predeterminada)",items:[
    {cod:"MP-0012",nom:"TELA DENIM 12 OZ AZUL",u:"MT",cons:1.46,alm:"SB-ALM-MPT · MP Telas"},
    {cod:"MP-0031",nom:"HILO POLIESTER AZUL",u:"UND",cons:0.05,alm:"SB-ALM-MPA · MP Avíos"},
    {cod:"MP-0044",nom:"BOTON METALICO 17MM",u:"UND",cons:1,alm:"SB-ALM-MPA · MP Avíos"},
    {cod:"MP-0045",nom:"CIERRE METALICO 12CM",u:"UND",cons:1,alm:"SB-ALM-MPA · MP Avíos"}]}
 ],
 "PT-0003":[
  {id:"LDM-0005",nom:"Denim 12 Oz negro · talla 28 · 1.40 MT (predeterminada)",items:[
    {cod:"MP-0013",nom:"TELA DENIM 12 OZ NEGRO",u:"MT",cons:1.40,alm:"SB-ALM-MPT · MP Telas"},
    {cod:"MP-0032",nom:"HILO POLIESTER NEGRO",u:"UND",cons:0.05,alm:"SB-ALM-MPA · MP Avíos"},
    {cod:"MP-0044",nom:"BOTON METALICO 17MM",u:"UND",cons:1,alm:"SB-ALM-MPA · MP Avíos"}]}
 ]
};
function ldmDe(cod){
  /* Lista predeterminada del artículo (primera de LDM_OPTS) */
  const lista=LDM_OPTS[cod]||[];
  return lista.length?lista[0]:null;
}
function ldmOptsDe(cod){ return LDM_OPTS[cod]||[]; }
/* Lista efectiva de una línea: Estándar = predeterminada; Especial = la elegida (l.ldmId) */
function ldmDeLinea(l){
  const opts=ldmOptsDe(l.art); if(!opts.length)return null;
  if(l.tipofab==="Especial" && l.ldmId){ const f=opts.find(o=>o.id===l.ldmId); if(f)return f; }
  return opts[0];
}
function spSetTipoFab(i,val){
  SP.lineas[i].tipofab=val;
  if(val!=="Especial")SP.lineas[i].ldmId=null; /* Estándar vuelve a la predeterminada */
  spRebuildReqs(SP.lineas[i]); renderSPform();
}
function spSetLdm(i,val){ SP.lineas[i].ldmId=val; spRebuildReqs(SP.lineas[i]); renderSPform(); }
function verificarStock(){
  renderPanelMP();
  const mp=SP.mp||[];
  if(!mp.length){toast("No hay materiales que verificar: agregue artículos con lista de materiales.");return;}
  const faltan=mp.filter(m=>m.falta);
  if(!faltan.length){toast("✔ Stock suficiente: los "+mp.length+" material(es) de la lista alcanzan para el pedido.");}
  else{const nombres=faltan.map(m=>m.nom).slice(0,3).join(", ");toast("⚠ "+faltan.length+" de "+mp.length+" material(es) sin cobertura: "+nombres+(faltan.length>3?"…":"")+". Puede continuar; genere las Solicitudes de Materiales.");}
}
function spDisp(alm,art){const r=findStock(alm,art);return r?Math.round((r.real-r.res)*100)/100:null}

/* ===== Requerimientos por (línea de producto × material) =====
   Fuente de verdad: la SOL es un roll-up (suma por material+origen) y la OP un filtro por artículo.
   Cada requerimiento lleva su artículo (por estar dentro de la línea) y su origen (LDM|Manual). */
function almOrigenOpts(){ return [...new Set(STOCK.map(r=>r.alm))]; }
function spEnsureReqs(l){ if(!l.reqs)spRebuildReqs(l); }
function spRebuildReqs(l){
  const prev=l.reqs||[];
  const prevLDM={}; prev.forEach(r=>{if(r.origen==="LDM")prevLDM[r.cod]=r;});
  const manual=prev.filter(r=>r.origen==="Manual");
  const ldm=ldmDeLinea(l), base=[];
  if(ldm){ ldm.items.forEach(it=>{
    const ex=prevLDM[it.cod];
    base.push({tipo:"Artículo",cod:it.cod,nom:it.nom,u:it.u,cons:(it.cons||0),
      cant:Math.round(((it.cons||0)*(l.qty||0))*100)/100,
      almOrigen: ex?ex.almOrigen:(it.alm||""),
      emision: ex?ex.emision:"Notificación", origen:"LDM"});
  });}
  l.reqs=base.concat(manual);
}
function spReqAlmSet(li,ri,val){ SP.lineas[li].reqs[ri].almOrigen=val; if(SP.est!=="Borrador"){renderPanelMP();renderVBaviso();} }
function spReqEmiSet(li,ri,val){ SP.lineas[li].reqs[ri].emision=val; }
function spReqCantSet(li,ri,val){ SP.lineas[li].reqs[ri].cant=parseFloat(val)||0; if(SP.est!=="Borrador"){renderPanelMP();renderVBaviso();} }
function spReqDel(li,ri){ SP.lineas[li].reqs.splice(ri,1); renderSPform(); if(SP.est!=="Borrador"){renderPanelMP();renderVBaviso();} }
function spToggleExp(i){ SP.lineas[i]._exp=!SP.lineas[i]._exp; renderSPform(); }
function spReqSubrow(l,li){
  const editable=(SP.est==="Borrador"||SP.est==="Pendiente Aprobar");
  const esp=(l.tipofab==="Especial");
  const opts=almOrigenOpts();
  const sst='border:1px solid var(--borde);border-radius:5px;padding:4px 6px;font-size:11.5px';
  let rows=(l.reqs||[]).map((r,ri)=>{
    const alm=editable?('<select style="width:100%;'+sst+'" onchange="spReqAlmSet('+li+','+ri+',this.value)">'+opts.map(o=>'<option'+(o===r.almOrigen?' selected':'')+'>'+o+'</option>').join('')+'</select>'):(r.almOrigen.split(" · ")[0]);
    const cant=(esp&&editable&&r.origen==="Manual")?('<input value="'+r.cant+'" style="width:80px;text-align:right;'+sst+'" oninput="spReqCantSet('+li+','+ri+',this.value)">'):('<span>'+fmtM(r.cant)+'</span>');
    const emi=editable?('<select style="'+sst+'" onchange="spReqEmiSet('+li+','+ri+',this.value)">'+EMISION_OPTS.map(o=>'<option'+(o===r.emision?' selected':'')+'>'+o+'</option>').join('')+'</select>'):r.emision;
    const orig='<span class="badge" style="background:'+(r.origen==="Manual"?"var(--pendiente)":"var(--primario-claro)")+'">'+r.origen+'</span>';
    const del=(esp&&editable&&r.origen==="Manual")?(' <button class="btn-link" onclick="spReqDel('+li+','+ri+')">Quitar</button>'):'';
    return '<tr><td>'+r.cod+'</td><td>'+r.nom+'</td><td>'+r.u+'</td><td style="text-align:right">'+cant+'</td><td>'+alm+'</td><td>'+emi+'</td><td>'+orig+del+'</td></tr>';
  }).join('');
  if(!rows)rows='<tr><td colspan="7" class="hint" style="text-align:center;padding:8px">Sin requerimientos</td></tr>';
  const addBtn=(esp&&editable)?'<button class="btn btn-secondary btn-sm" style="margin-top:6px" onclick="abrirBuscarMPreq('+li+')">+ Agregar material (manual)</button>':'';
  return '<tr class="req-sub"><td></td><td colspan="8" style="background:#F8FAFC;padding:8px">'+
    '<div style="font-size:11.5px;color:var(--texto-sec);margin-bottom:5px">Requerimientos de MP de <b>'+(l.art||l.nom)+'</b> · '+(esp?'Especial (puede agregar materiales)':'Estándar (lista fija)')+'</div>'+
    '<div class="tbl-wrap"><table class="grid subtable" style="margin:0"><thead><tr><th style="width:100px">Código</th><th>Material</th><th style="width:50px">U</th><th style="width:90px;text-align:right">Cantidad</th><th style="width:180px">Almacén origen</th><th style="width:120px">Método</th><th style="width:120px">Origen</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+addBtn+'</td></tr>';
}
/* Buscador de material para agregar manualmente (Especial) */
let MPREQ_LI=-1;
function abrirBuscarMPreq(li){ MPREQ_LI=li; document.getElementById('spmpreq-q').value=""; renderBuscarMPreq(); openModal('m-spmpreq'); }
function renderBuscarMPreq(){
  const q=(document.getElementById('spmpreq-q').value||"").toLowerCase();
  const tb=document.getElementById('spmpreq-body'); tb.innerHTML="";
  const l=SP.lineas[MPREQ_LI];
  ARTICULOS.filter(a=>a.inv==="Sí"&&a.e==="Activo").forEach(a=>{
    if((l.reqs||[]).some(r=>r.cod===a.id))return;
    if(l.art && a.id===l.art)return;
    if(q && !(a.id.toLowerCase().includes(q)||a.n.toLowerCase().includes(q)))return;
    tb.innerHTML+='<tr><td>'+a.id+'</td><td>'+a.n+'</td><td>'+a.u+'</td><td><button class="btn btn-primary btn-sm" onclick="addMPreq(\''+a.id+'\')">Agregar</button></td></tr>';
  });
  if(!tb.innerHTML)tb.innerHTML='<tr><td colspan="4" class="hint" style="text-align:center;padding:12px">Sin resultados (o ya está en el requerimiento)</td></tr>';
}
function addMPreq(cod){
  const a=ARTICULOS.find(x=>x.id===cod); if(!a)return;
  const l=SP.lineas[MPREQ_LI]; l.reqs=l.reqs||[];
  const almDef=(STOCK.find(s=>s.art===a.n)||{}).alm || almOrigenOpts()[0] || "";
  l.reqs.push({tipo:"Artículo",cod:a.id,nom:a.n,u:a.u,cons:0,cant:1,almOrigen:almDef,emision:"Manual",origen:"Manual"});
  closeModal('m-spmpreq'); renderSPform(); if(SP.est!=="Borrador"){renderPanelMP();renderVBaviso();}
  toast(a.n+" agregado como material manual: indique la cantidad");
}
function renderPanelStock(){
  /* Sin almacen fijo: se lista cada almacen donde el articulo tenga existencias */
  const tb=document.getElementById('sp-stock'); tb.innerHTML="";
  SP.lineas.forEach(l=>{
    const um=UMBRALES[l.art]||0;
    if(!l.art){
      tb.innerHTML+='<tr><td><span class="hint">—</span></td><td>'+l.nom+'</td><td colspan="5"><span class="hint">-</span></td>'+
       '<td><span class="badge" style="background:var(--pendiente)">Artículo sin dar de alta</span></td></tr>';
      return;
    }
    const filas=STOCK.filter(x=>x.art===l.nom);
    if(!filas.length){
      tb.innerHTML+='<tr><td>'+l.art+'</td><td>'+l.nom+'</td><td colspan="5"><span class="hint">sin existencias en ningún almacén</span></td>'+
       '<td><span class="badge" style="background:var(--cancelada)">Sin stock</span></td></tr>';
      return;
    }
    filas.forEach((x,i)=>{
      const comp=x.res||0, disp=Math.round((x.real-comp)*100)/100;
      let est,col;
      if(disp<um){est="Crítico";col="var(--cancelada)"}
      else if(disp<=um*1.2){est="Por agotarse";col="var(--pendiente)"}
      else {est="OK";col="var(--confirmado)"}
      tb.innerHTML+='<tr><td>'+(i===0?l.art:'')+'</td><td>'+(i===0?l.nom:'')+'</td><td>'+x.alm+'</td>'+
       '<td style="text-align:right">'+fmtM(x.real)+'</td>'+
       '<td style="text-align:right">'+(comp?fmtM(comp):'<span class="hint">-</span>')+'</td>'+
       '<td style="text-align:right;font-weight:600">'+fmtM(disp)+'</td>'+
       '<td style="text-align:right">'+(um||'<span class="hint">-</span>')+'</td>'+
       '<td><span class="badge" style="background:'+col+'">'+est+'</span></td></tr>';
    });
  });
}
function renderPanelMP(){
  /* Para cada línea se toma la lista de materiales PREDETERMINADA de su artículo (no se elige)
     y se agrega por material. Que falte cobertura no impide avanzar: solo se avisa. */
  const conArt=SP.lineas.filter(l=>l.art && ldmOptsDe(l.art).length);
  const sinArt=SP.lineas.filter(l=>!l.art);
  const sinLDM=SP.lineas.filter(l=>l.art && !ldmOptsDe(l.art).length);
  const total=spTotal(SP);
  const tb=document.getElementById('sp-mp'); tb.innerHTML="";
  const agr={};
  conArt.forEach(l=>{
    spEnsureReqs(l);
    (l.reqs||[]).forEach(m=>{
      const k=m.cod+"@@"+m.almOrigen;
      if(!agr[k])agr[k]={cod:m.cod,nom:m.nom,u:m.u,alm:m.almOrigen,cons:m.cons,req:0,det:[]};
      agr[k].req+=(m.cant||0);
      agr[k].det.push(l.art+" × "+l.qty+(m.origen==="Manual"?" (manual)":""));
    });
  });
  const bom=Object.values(agr);
  let faltan=0, pendGen=0;
  if(!bom.length){
    tb.innerHTML='<tr><td colspan="8" style="text-align:center;color:var(--texto-sec);padding:16px">Ningún artículo del detalle tiene lista de materiales: defínala en <button class="btn-link" onclick="go(\'gi17\')">GI-17 · Listas de Materiales</button></td></tr>';
    document.getElementById('sp-mp-resumen').innerHTML=""; return;
  }
  SP.mp=[];
  bom.forEach((m,i)=>{
    const req=Math.round(m.req*100)/100;
    const disp=spDisp(m.alm,m.nom)||0;
    const dif=Math.round((disp-req)*100)/100;
    const falta=(dif<0);
    if(falta)faltan++;
    SP.mp.push({cod:m.cod,nom:m.nom,u:m.u,alm:m.alm,req:req,disp:disp,dif:dif,falta:falta});
    const yaK=spSolKeyDe(m.cod);
    let est='<span class="badge" style="background:var(--confirmado)">Suficiente</span>';
    if(falta){
      if(yaK){const e2=spEstadoSC(yaK,m.cod); est='<span class="badge" style="background:'+e2.c+'">'+e2.t+'</span>'}
      else {est='<span class="badge" style="background:var(--cancelada)">Falta</span>'; pendGen++;}
    }
    const acc=(falta&&yaK)?('<button class="btn-link" onclick="loadSOL(\''+yaK+'\')">'+SOLS[yaK].id+'</button>'):'<span class="hint">-</span>';
    tb.innerHTML+='<tr><td>'+m.nom+'<br><span class="hint">'+m.cod+' · '+m.alm.split(" · ")[0]+'</span></td><td>'+m.u+'</td>'+
     '<td style="text-align:right">'+m.cons+'<br><span class="hint">'+m.det.join(' · ')+'</span></td>'+
     '<td style="text-align:right;font-weight:600">'+fmtM(req)+'</td>'+
     '<td style="text-align:right">'+fmtM(disp)+'</td>'+
     '<td style="text-align:right;font-weight:600;color:'+(falta?"var(--cancelada)":"var(--confirmado)")+'">'+(dif>=0?"+":"")+fmtM(dif)+'</td>'+
     '<td>'+est+'</td><td>'+acc+'</td></tr>';
  });
  const r=document.getElementById('sp-mp-resumen');
  const genBtn=pendGen?('<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="generarSOLdesdeSP()">Generar Solicitud de Materiales ('+pendGen+')</button>'):'';
  /* UC-11/12: aviso si la SOL ya emitida no coincide con el requerido actual (no se auto-sincroniza) */
  const desal=[];
  (SP.scs||[]).forEach(x=>{
    const m=(SP.mp||[]).find(mm=>mm.cod===x.cod);
    const necesitaHoy=(m&&m.falta)?Math.round(Math.abs(m.dif)*100)/100:0;
    if(Math.abs((x.qty||0)-necesitaHoy)>0.01)
      desal.push((SOLS[x.k]?SOLS[x.k].id:x.k)+" · "+x.nom+": pedida "+fmtM(x.qty)+" "+x.u+", ahora se requiere "+fmtM(necesitaHoy)+" "+x.u+(necesitaHoy===0?" (ya no se necesita)":""));
  });
  const desalCard=desal.length?('<div class="card" style="margin:10px 0 0;border-left:4px solid var(--pendiente);background:#FFFBEB"><b style="font-size:12.5px">⚠ Solicitud de Materiales desalineada</b>'+desal.map(x=>'<p class="hint" style="margin-top:5px">'+x+'</p>').join('')+'<p class="hint" style="margin-top:5px">La solicitud ya emitida no se actualiza sola: si sigue <b>Pendiente</b>, regenérela; si ya tiene <b>Orden de Compra</b>, ajústela en Logística.</p></div>'):'';
  const avisoAlta=sinArt.length?('<div class="card" style="margin:10px 0 0;border-left:4px solid var(--pendiente);background:#FFFBEB"><b style="font-size:12.5px">'+sinArt.length+' línea(s) sin artículo</b><p class="hint" style="margin-top:5px">No entran en el cálculo de materia prima.</p></div>'):'';
  const avisoLDM=sinLDM.length?('<div class="card" style="margin:10px 0 0;border-left:4px solid var(--pendiente);background:#FFFBEB"><b style="font-size:12.5px">'+sinLDM.length+' artículo(s) sin lista de materiales</b><p class="hint" style="margin-top:5px">'+sinLDM.map(l=>l.art).join(', ')+'. Defina su lista en GI-17.</p></div>'):'';
  if(faltan){
    r.innerHTML='<div class="card" style="margin:0;border-left:4px solid var(--cancelada);background:#FEF2F2"><b style="font-size:12.5px">'+faltan+' material(es) sin cobertura para las '+total+' prendas</b><p class="hint" style="margin-top:5px">Genere <b>una sola Solicitud de Materiales</b> multi-línea para todo el déficit del pedido.</p>'+genBtn+'</div>'+desalCard+avisoAlta+avisoLDM;
  }else{
    r.innerHTML='<div class="card" style="margin:0;border-left:4px solid var(--confirmado);background:#F0FDF4"><b style="font-size:12.5px">Materia prima cubierta</b><p class="hint" style="margin-top:5px">Todos los materiales alcanzan para las '+total+' prendas del pedido.</p></div>'+desalCard+avisoAlta+avisoLDM;
  }
}
