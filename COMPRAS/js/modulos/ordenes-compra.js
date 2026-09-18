/* COMPRAS · CO-06/07 Órdenes de Compra
   Conectado a la base compartida: BD.d.ocs con Docs.oc (docs/16 §3.4).
   {id:'OC-000001', est, tipo:'Bienes'|'Servicio', fecha, prov, cond, mon, tc, ref, obs, sol, of, sf, almDestino, valLog, valGer,
    items:[{art, cant, pu, igv, recq, facq}], recepciones:[{tipo:'Ingreso'|'Conformidad', fecha, mov?, alm?, lineas}], facturas:[ids], hist}
   Globales que usan otras pantallas: renderOCS(), loadOC(id), abrirOC(id), nuevaOC(), fmtM(n), sinTildes(t) (en proveedores.js). */

/* ===== utilidades comunes de Compras ===== */
function coD(){ if(!BD.d) BD.iniciar(); return BD.d; }
function coEsc(s){ return String(s==null?"":s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function coMon(m){ return m==="USD"?"USD ":"S/. "; }
function coISO(dmy){ const m=/^(\d{2})\/(\d{2})\/(\d{4})/.exec(dmy||""); return m?(m[3]+"-"+m[2]+"-"+m[1]):""; }
function coDMY(iso){ const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||""); return m?(m[3]+"/"+m[2]+"/"+m[1]):""; }
function coTry(fn){ try{ return fn(); }catch(e){ console.error(e); toast(e&&e.message?e.message:String(e)); return null; } }
function fmtM(n){ return (Number(n)||0).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2}); }
/* refresca las listas de Compras y, si están cargadas, las de Inventarios que muestran lo mismo */
function coRefrescar(){
  ['renderOCS','renderFac','renderPanelCompras','renderSol','renderMov','renderStock','renderDash'].forEach(f=>{
    if(typeof window[f]==='function'){ try{ window[f](); }catch(e){ console.error(f,e); } }
  });
}

/* ===== CO-06/07 · Órdenes de Compra ===== */
const OC_EST={"Borrador":"var(--borrador)","Pendiente de Validar":"var(--pendiente)","Para Recibir y Pagar":"var(--prp)","Para Recibir":"var(--oc-recibir)","Para Pagar":"var(--oc-pagar)","Completada":"var(--completada)","Cancelada":"var(--cancelada)"};
let OC=null, OCid="";   // OC: documento abierto (copia de trabajo si está en Borrador); OCid: '' = nueva sin guardar
function esServicioOC(o){ return !!o && o.items.length>0 && o.items.every(it=>BD.esServicio(it.art)); }
function ocTotales(o){ const t=Docs.oc.totales(o); return {sub:t.sub,igv:t.igv,tot:t.total}; }
function ocIGV(art,prov){ const p=BD.prov(prov), a=BD.art(art); if(p&&p.tipo==="Internacional")return 0; return (a&&a.igv&&a.igv!=="Gravado")?0:18; }
function ocPrecioRef(cod){ const a=BD.art(cod)||{}, r=BD.rec(cod)||{}; return Number(a.precioCompra||r.costo||a.costo||0); }
function ocPendRec(o){ return o.items.filter(i=>i.cant-i.recq>0.00005); }
function ocPendFac(o){ return o.items.filter(i=>i.cant-i.facq>0.00005); }
function ocFacturable(o){ return !!o && ["Para Recibir y Pagar","Para Recibir","Para Pagar"].includes(o.est) && ocPendFac(o).length>0; }

function renderOCS(){
  const tb=document.getElementById('ocs-body'); if(!tb)return;
  const q=sinTildes(document.getElementById('f-oc-q').value||"");
  const e=document.getElementById('f-oc-e').value, m=document.getElementById('f-oc-m').value;
  const ft=(document.getElementById('f-oc-t')||{}).value||"";
  const soloImp=document.getElementById('f-oc-i').checked;
  let html="", n=0;
  coD().ocs.forEach(o=>{
    const p=BD.prov(o.prov)||{};
    if(q && !(sinTildes(o.id).includes(q)||sinTildes(p.nom).includes(q)||sinTildes(o.prov).includes(q)||sinTildes(o.sol).includes(q)||sinTildes(o.of).includes(q)))return;
    if(e==="*rec"){ if(!Docs.oc.recibible(o))return; }
    else if(e==="*fac"){ if(!ocFacturable(o))return; }
    else if(e && o.est!==e)return;
    if(m && o.mon!==m)return; if(ft && o.tipo!==ft)return; if(soloImp && p.tipo!=="Internacional")return;
    n++;
    const t=Docs.oc.totales(o), a=Docs.oc.avance(o);
    const full=(o.est==="Completada");
    const origen=[o.sol?'<button class="btn-link" onclick="event.stopPropagation();verSolDeOC(\''+o.sol+'\')">'+o.sol+'</button>':'',
      o.of?'<button class="btn-link" onclick="event.stopPropagation();verOFdeOC(\''+o.of+'\')">'+o.of+'</button>':''].filter(Boolean).join(' · ')||'<span class="hint">OC directa</span>';
    const pct=(v,tip)=>'<td style="text-align:right;color:var(--confirmado);'+(v>=100?'font-weight:700':'')+'" title="'+tip+'">'+v+'%</td>';
    html+='<tr class="clickable" onclick="abrirOC(\''+o.id+'\')"><td>'+o.id+(p.tipo==="Internacional"?' <span class="hint">IMPORTACIÓN</span>':'')+'</td>'+
     '<td>'+o.tipo+'</td><td>'+(o.prov?coEsc(p.nom||o.prov):'<span class="hint">sin proveedor</span>')+'</td><td>'+o.mon+'</td>'+
     '<td style="text-align:right;'+(full?'color:var(--confirmado);font-weight:700':'')+'">'+coMon(o.mon)+fmtM(t.total)+'</td>'+
     '<td><span class="badge" style="background:'+(OC_EST[o.est]||"var(--borrador)")+'">'+o.est+'</span></td><td>'+o.fecha+'</td>'+
     '<td>'+origen+'</td>'+
     pct(a.rec,o.tipo==="Servicio"?"% con conformidad del servicio":"% recibido en almacén")+pct(a.fac,"% facturado")+
     '<td><button class="btn-link" onclick="event.stopPropagation();abrirOC(\''+o.id+'\')">Abrir</button></td></tr>';
  });
  tb.innerHTML=html||'<tr><td colspan="12" style="text-align:center;color:var(--texto-sec);padding:16px">'+(coD().ocs.length?'Sin órdenes para los filtros aplicados':'Aún no hay órdenes de compra en la base: use "+ Agregar OC" o créelas desde una Solicitud de Materiales (GI-13)')+'</td></tr>';
  document.getElementById('ocs-count').textContent=n+" órdenes de compra";
  /* si la ficha está abierta (y no se está editando un borrador) se rehidrata con la base */
  const scr=document.getElementById('scr-co07');
  if(OCid && scr && scr.classList.contains('active')){
    const o=BD.oc(OCid);
    if(o && !(OC && OC!==o && OC.est==="Borrador" && o.est==="Borrador")){ OC=(o.est==="Borrador")?BD.copia(o):o; ocLlenarForm(); renderOC(); }
  }
}
function verSolDeOC(id){
  id=id||(OC&&OC.sol);
  if(!id){toast("OC directa: sin solicitud de origen");return}
  if(typeof abrirSOL==='function')abrirSOL(id); else toast("Solicitud "+id+": ábrala en Inventarios (GI-13)");
}
function verOFdeOC(id){
  id=id||(document.getElementById('oc-op').value||"").trim()||(OC&&OC.of);
  if(!id){toast("La OC no está vinculada a una orden de fabricación");return}
  if(!BD.of(id))toast("La orden "+id+" no existe en la base: se abre Producción igualmente");
  window.open('../PRODUCCION/index.html#pr02/'+encodeURIComponent(id),'_blank');
}
function nuevaOC(){
  coD();
  OCid="";
  OC={id:"",est:"Borrador",tipo:"Bienes",fecha:BD.hoy(),prov:"",cond:"Contado",mon:"S/.",tc:3.75,ref:"",obs:"",sol:"",of:"",sf:"",
      almDestino:"SB-CENTRAL-MP",valLog:false,valGer:false,items:[],recepciones:[],facturas:[],hist:[]};
  ocLlenarForm(); renderOC(); go('co07');
  toast("OC directa: seleccione proveedor y agregue ítems; se guarda en la base al Guardar borrador");
}
function abrirOC(id){
  const o=BD.oc(id);
  if(!o){toast("No existe la orden de compra "+id);return}
  OCid=o.id; OC=(o.est==="Borrador")?BD.copia(o):o;
  ocLlenarForm(); renderOC(); go('co07');
}
function loadOC(id){ abrirOC(id); }

function ocLlenarForm(){
  const p=BD.prov(OC.prov);
  document.getElementById('oc-titulo').textContent=(OCid?"ORDEN DE COMPRA: "+OC.id:"NUEVA ORDEN DE COMPRA")+(p&&p.tipo==="Internacional"?" · IMPORTACIÓN":"");
  document.getElementById('oc-id').value=OCid||"(se asigna al guardar)";
  document.getElementById('oc-sol').value=OC.sol||"OC directa";
  document.getElementById('oc-prov').value=p?(p.nom+" ("+p.cod+" · "+p.tipo+")"):"";
  const conds=coCondiciones().map(c=>c.nom); if(OC.cond && !conds.includes(OC.cond))conds.unshift(OC.cond);
  document.getElementById('oc-cond').innerHTML=conds.map(c=>'<option>'+coEsc(c)+'</option>').join('');
  document.getElementById('oc-cond').value=OC.cond||"Contado";
  document.getElementById('oc-mon').value=OC.mon||"S/.";
  document.getElementById('oc-tc').value=OC.tc;
  document.getElementById('oc-fecha').value=coISO(OC.fecha);
  document.getElementById('oc-alm').innerHTML='<option value="">(sin almacén)</option>'+coD().maestros.almacenes.map(a=>'<option value="'+a.cod+'">'+a.cod+' · '+coEsc(a.nom)+'</option>').join('');
  document.getElementById('oc-alm').value=OC.almDestino||"";
  document.getElementById('oc-op').value=OC.of||"";
  document.getElementById('oc-sf').value=OC.sf||"-";
  document.getElementById('oc-ref').value=OC.ref||"";
  document.getElementById('oc-obs').value=OC.obs||"";
}
function ocLeerForm(){
  if(!OC || OC.est!=="Borrador")return;
  OC.cond=document.getElementById('oc-cond').value;
  OC.mon=document.getElementById('oc-mon').value;
  OC.tc=parseFloat(document.getElementById('oc-tc').value)||0;
  OC.fecha=coDMY(document.getElementById('oc-fecha').value)||OC.fecha||BD.hoy();
  OC.almDestino=document.getElementById('oc-alm').value;
  OC.of=(document.getElementById('oc-op').value||"").trim().toUpperCase();
  OC.ref=document.getElementById('oc-ref').value;
  OC.obs=document.getElementById('oc-obs').value;
}
function ocUltimo(o,accion){ const h=(o.hist||[]).filter(x=>x.a===accion).pop(); return h?' <span class="hint">('+coEsc(h.u)+' · '+h.f+')</span>':''; }
function renderOC(){
  const o=OC, e=o.est, editable=(e==="Borrador"), recibible=Docs.oc.recibible(o);
  const b=document.getElementById('oc-badge'); b.textContent=e; b.style.background=OC_EST[e]||"var(--borrador)";
  const tipo=o.items.length?(esServicioOC(o)?"Servicio":"Bienes"):(o.tipo||"Bienes");
  const tb=document.getElementById('oc-tipo-badge'); tb.textContent=tipo; tb.style.background=tipo==="Servicio"?"var(--oc-pagar)":"var(--primario-claro)";
  const show=(id,v)=>{const el=document.getElementById(id); if(el)el.style.display=v?"inline-block":"none"};
  const pendBienes=ocPendRec(o).filter(i=>!BD.esServicio(i.art)), pendSrv=ocPendRec(o).filter(i=>BD.esServicio(i.art));
  show('oc-b-cancelar',["Borrador","Pendiente de Validar","Para Recibir y Pagar"].includes(e) && !o.recepciones.length && !o.facturas.length);
  show('oc-b-guardar',editable);
  show('oc-b-enviar',editable);
  show('oc-b-vallog',e==="Pendiente de Validar" && !o.valLog);
  show('oc-b-valger',e==="Pendiente de Validar" && !o.valGer);
  show('oc-b-ingreso',recibible && pendBienes.length>0);
  show('oc-b-conf',recibible && pendSrv.length>0);
  const ops=[];
  if(recibible && pendBienes.length)ops.push('<div class="op" onclick="abrirRecepcionOC()">Ingreso de Compra<small>Ingreso al almacén de lo pendiente de recibir (GI-09)</small></div>');
  if(recibible && pendSrv.length)ops.push('<div class="op" onclick="abrirConformidadOC()">Conformidad del servicio<small>Sin movimiento de stock</small></div>');
  if(ocFacturable(o))ops.push('<div class="op" onclick="crearFacDesdeOC()">Factura de Compra<small>CO-10 con lo pendiente de facturar de esta OC</small></div>');
  document.getElementById('oc-crear-menu').innerHTML=ops.join('');
  document.getElementById('oc-b-crear').style.display=ops.length?"inline-block":"none";
  ['oc-cond','oc-mon','oc-tc','oc-fecha','oc-ref','oc-op','oc-obs','oc-alm'].forEach(id=>document.getElementById(id).disabled=!editable);
  show('oc-b-additem',editable); show('oc-b-prov',editable);
  show('oc-b-versol',!!o.sol); show('oc-b-verof',editable||!!o.of);
  /* validaciones */
  const val=document.getElementById('oc-val');
  if(e!=="Borrador" && !(e==="Cancelada" && !o.valLog && !o.valGer)){
    val.style.display="block";
    document.getElementById('oc-val-log').innerHTML=o.valLog?'Logística ✓'+ocUltimo(o,'V°B° Logística'):'Logística: <span style="color:var(--pendiente);font-weight:600">pendiente</span>';
    document.getElementById('oc-val-ger').innerHTML=o.valGer?'Gerencia ✓'+ocUltimo(o,'Aprobación Gerencia'):'Gerencia: <span style="color:var(--pendiente);font-weight:600">pendiente</span>';
  }else val.style.display="none";
  /* avance */
  const av=document.getElementById('oc-avance');
  const aviso=document.getElementById('oc-aviso-of');
  const srvOF=!!o.of && o.items.some(i=>BD.esServicio(i.art));
  if(["Para Recibir y Pagar","Para Recibir","Para Pagar","Completada"].includes(e) || srvOF){
    av.style.display="block";
    const a=Docs.oc.avance(o);
    document.getElementById('oc-pct-rec-lbl').textContent=tipo==="Servicio"?"Con conformidad":"Recibido";
    document.getElementById('oc-pct-rec').textContent=a.rec+"%";
    document.getElementById('oc-pct-fac').textContent=a.fac+"%";
    document.getElementById('oc-pct-rec').style.color=(a.rec>=100)?"var(--confirmado)":"var(--texto)";
    document.getElementById('oc-pct-fac').style.color=(a.fac>=100)?"var(--confirmado)":"var(--texto)";
  }else av.style.display="none";
  if(srvOF){
    aviso.style.display="block";
    aviso.innerHTML='<b>Servicio para la orden de fabricación '+coEsc(o.of)+'</b>'+(BD.of(o.of)?'':' <span style="color:var(--pendiente)">(la orden no existe en la base)</span>')+
      '<br>Al aprobarse la OC y al registrar su factura, el importe pasa a la <b>pestaña Costo de la orden</b>, donde se contrasta con el costo estándar del servicio. '+
      '<button class="btn-link" onclick="verOFdeOC(\''+coEsc(o.of)+'\')">Abrir la orden en Producción</button>';
  }else aviso.style.display="none";
  renderOCitems();
  renderOCdocs();
}
function renderOCitems(){
  const o=OC, ro=(o.est!=="Borrador");
  const conAvance=ro && o.est!=="Pendiente de Validar";
  document.getElementById('oc-items-head').innerHTML='<tr><th style="width:36px">#</th><th>Código</th><th>Nombre</th><th>Unidad</th><th style="width:90px;text-align:right">Cantidad</th><th style="width:110px;text-align:right">Precio unit.</th><th style="width:100px;text-align:right">Subtotal</th><th style="width:90px;text-align:right">IGV (auto)</th><th style="width:110px;text-align:right">Total</th>'+
    (conAvance?'<th style="width:90px;text-align:right">Recibido</th><th style="width:90px;text-align:right">Facturado</th>':'')+'<th style="width:60px"></th></tr>';
  let html="";
  o.items.forEach((it,i)=>{
    const st=it.cant*it.pu, igv=st*((it.igv||0)/100), srv=BD.esServicio(it.art);
    const cant=ro?('<td style="text-align:right">'+fmtM(it.cant)+'</td>'):'<td><input value="'+it.cant+'" style="text-align:right" oninput="ocItemInput('+i+',\'cant\',this)"></td>';
    const pu=ro?('<td style="text-align:right">'+fmtM(it.pu)+'</td>'):'<td><input value="'+it.pu+'" style="text-align:right" oninput="ocItemInput('+i+',\'pu\',this)"></td>';
    html+='<tr><td>'+(i+1)+'</td><td>'+it.art+'</td><td>'+coEsc(BD.nomArt(it.art))+(srv?' <span class="hint">(servicio: cierra por conformidad)</span>':'')+'</td><td>'+coEsc(BD.u(it.art))+'</td>'+cant+pu+
      '<td id="oc-st-'+i+'" style="text-align:right">'+fmtM(st)+'</td><td id="oc-igv-'+i+'" style="text-align:right">'+(it.igv>0?fmtM(igv)+' ('+it.igv+'%)':'0.00 <span class="hint">'+(BD.prov(o.prov)&&BD.prov(o.prov).tipo==="Internacional"?'import.':'exon.')+'</span>')+'</td><td id="oc-tot-'+i+'" style="text-align:right;font-weight:600">'+fmtM(st+igv)+'</td>'+
      (conAvance?'<td style="text-align:right;'+(it.recq>=it.cant?'color:var(--confirmado);font-weight:600':'')+'">'+fmtM(it.recq)+'</td><td style="text-align:right;'+(it.facq>=it.cant?'color:var(--confirmado);font-weight:600':'')+'">'+fmtM(it.facq)+'</td>':'')+
      '<td>'+(ro?'':'<button class="btn-link" onclick="OC.items.splice('+i+',1);renderOC()">Eliminar</button>')+'</td></tr>';
  });
  document.getElementById('oc-items').innerHTML=html||'<tr><td colspan="12" style="text-align:center;color:var(--texto-sec);padding:16px">Sin ítems: use "+ Agregar ítem"</td></tr>';
  ocTotalesUI();
}
function ocItemInput(i,campo,el){
  OC.items[i][campo]=parseFloat(el.value)||0;
  const it=OC.items[i], st=it.cant*it.pu, igv=st*((it.igv||0)/100);
  const c1=document.getElementById('oc-st-'+i), c2=document.getElementById('oc-igv-'+i), c3=document.getElementById('oc-tot-'+i);
  if(c1)c1.textContent=fmtM(st);
  if(c2)c2.innerHTML=(it.igv>0?fmtM(igv)+' ('+it.igv+'%)':'0.00');
  if(c3)c3.textContent=fmtM(st+igv);
  ocTotalesUI();
}
function ocTotalesUI(){
  if(!OC)return;
  const mon=document.getElementById('oc-mon').value, tc=parseFloat(document.getElementById('oc-tc').value)||0;
  const conAvance=OC.est!=="Borrador" && OC.est!=="Pendiente de Validar";
  let sub=0,igvT=0;
  OC.items.forEach(it=>{const st=it.cant*it.pu; sub+=st; igvT+=st*((it.igv||0)/100)});
  const tot=sub+igvT;
  const dual=(mon==="USD")?(' <span class="hint">· S/. '+fmtM(tot*tc)+' (TC '+tc+')</span>'):'';
  document.getElementById('oc-items-foot').innerHTML='<tr><td colspan="6" style="text-align:right;font-weight:600">Totales ('+mon+')</td>'+
   '<td style="text-align:right;font-weight:600">'+fmtM(sub)+'</td><td style="text-align:right;font-weight:600">'+fmtM(igvT)+'</td><td style="text-align:right;font-weight:700">'+fmtM(tot)+dual+'</td>'+(conAvance?'<td></td><td></td>':'')+'<td></td></tr>';
  const p=BD.prov(OC.prov), esImport=!!p && p.tipo==="Internacional";
  document.getElementById('oc-costos').style.display=esImport?"block":"none";
  if(esImport){
    const ca=(parseFloat(document.getElementById('oc-ca-adu').value)||0)+(parseFloat(document.getElementById('oc-ca-nac').value)||0)+(parseFloat(document.getElementById('oc-ca-fle').value)||0);
    const factor=sub>0?(1+ca/sub):1;
    document.getElementById('oc-costos-body').innerHTML=OC.items.map(it=>'<tr><td>'+it.art+'</td><td>'+coEsc(BD.nomArt(it.art))+'</td><td style="text-align:right">'+fmtM(it.pu)+'</td><td style="text-align:right;font-weight:600">S/. '+fmtM(it.pu*factor*tc)+'</td></tr>').join('')+
      '<tr><td colspan="4" class="hint">Estimación referencial: costos adicionales USD '+fmtM(ca)+' · desembolso estimado USD '+fmtM(sub+ca)+'. El ingreso al almacén valoriza al precio de la OC; el costo de destino real se aplicaría con CO-14 (pantalla de ejemplo).</td></tr>';
  }
}
function renderOCdocs(){
  const o=OC, filas=[];
  const fila=h=>'<div style="padding:6px 0;border-bottom:1px solid var(--borde)">'+h+'</div>';
  if(o.sol)filas.push(fila('Solicitud de Materiales origen: <button class="btn-link" onclick="verSolDeOC(\''+o.sol+'\')">'+o.sol+'</button>'));
  if(o.sf)filas.push(fila('Solicitud de Fabricación: <b>'+coEsc(o.sf)+'</b>'));
  if(o.of)filas.push(fila('Orden de fabricación: <button class="btn-link" onclick="verOFdeOC(\''+coEsc(o.of)+'\')">'+coEsc(o.of)+'</button>'+(BD.of(o.of)?'':' <span class="hint">(no existe en la base)</span>')));
  o.recepciones.forEach(r=>{
    const det=r.lineas.map(l=>coEsc(BD.nomArt(l.art))+' '+fmtM(l.cant)+' '+coEsc(BD.u(l.art))).join(', ');
    if(r.tipo==="Ingreso"){
      const link=(typeof abrirMov==='function')?'<button class="btn-link" onclick="abrirMov(\''+r.mov+'\')">'+r.mov+'</button>':'<b>'+r.mov+'</b>';
      const mv=BD.mov(r.mov)||{};
      filas.push(fila('Ingreso '+link+(mv.tipoMov?' · <b title="'+coEsc(mv.tipoMovNom||'')+'">'+coEsc(mv.tipoMov)+'</b>':'')+' · '+r.fecha+' · '+coEsc(r.alm)+' · '+det));
    }else{
      filas.push(fila('Conformidad del servicio · '+r.fecha+' · '+(r.conforme===false?'<span style="color:var(--cancelada);font-weight:600">con observaciones</span>':'<span style="color:var(--confirmado);font-weight:600">conforme</span>')+' · '+det+(r.obs?' · '+coEsc(r.obs):'')));
    }
  });
  o.facturas.forEach(fid=>{
    const f=BD.fac(fid); if(!f)return;
    filas.push(fila('Factura <button class="btn-link" onclick="abrirFactura(\''+f.id+'\')">'+f.id+'</button> · comprobante '+coEsc(f.ndoc)+' · '+f.fecha+' · '+coMon(f.mon)+fmtM(Docs.fac.total(f))+' · <span class="badge" style="background:'+(FAC_EST[f.est]||"var(--borrador)")+'">'+f.est+'</span>'));
  });
  document.getElementById('oc-docs').innerHTML=filas.join('')||'<span class="hint">Sin documentos relacionados todavía.</span>';
  document.getElementById('oc-hist').innerHTML=(o.hist||[]).slice().reverse().map(h=>'<tr><td>'+h.f+'</td><td>'+coEsc(h.u)+'</td><td'+(h.e==='no'?' style="color:var(--cancelada)"':'')+'>'+coEsc(h.a)+'</td><td class="hint">'+coEsc(h.d)+'</td></tr>').join('')
    ||'<tr><td colspan="4" style="text-align:center;color:var(--texto-sec);padding:12px">Sin historial: la OC aún no se guarda</td></tr>';
}
/* la moneda (S/. o USD) es libre: no depende del proveedor */
function ocMoneda(){
  OC.mon=document.getElementById('oc-mon').value;
  renderOCitems();
}
function elegirProvOC(cod){
  const p=BD.prov(cod); closeModal('m-ct09');
  if(!p||!OC||OC.est!=="Borrador"){toast("Abra una OC en Borrador para elegir el proveedor");return}
  ocLeerForm();
  OC.prov=p.cod; OC.cond=p.cond||OC.cond;
  OC.items.forEach(it=>it.igv=ocIGV(it.art,p.cod));
  ocLlenarForm(); renderOC();
  toast(p.tipo==="Internacional"?"Proveedor internacional: la OC se trata como importación (USD, IGV en la nacionalización)":"Proveedor seleccionado: "+p.nom);
}
/* guarda la copia de trabajo en la base (crea la OC si es nueva). Devuelve true si se guardó */
function guardarBorradorOC(silencio){
  if(!OC||OC.est!=="Borrador")return false;
  ocLeerForm();
  if(!OC.items.length){toast("Agregue al menos un ítem a la OC");return false}
  const d={prov:OC.prov,fecha:OC.fecha,cond:OC.cond,mon:OC.mon,tc:OC.tc,ref:OC.ref,obs:OC.obs,almDestino:OC.almDestino,of:OC.of,
    items:OC.items.map(i=>({art:i.art,cant:i.cant,pu:i.pu,igv:i.igv}))};
  const o=coTry(()=>OCid?Docs.oc.guardar(OCid,d):Docs.oc.crear(d));
  if(!o)return false;
  const nueva=!OCid; OCid=o.id;
  if(!silencio)toast((nueva?"OC creada en Borrador: ":"Borrador guardado: ")+o.id+(OC.of&&!BD.of(OC.of)?" · aviso: la orden "+OC.of+" no existe en la base":""));
  abrirOC(o.id); coRefrescar();
  return true;
}
function enviarValidacionOC(){
  if(!OC)return;
  ocLeerForm();
  if(!OC.prov){toast("Debe seleccionar el proveedor (CT-09)");return}
  if(!OC.items.length){toast("Agregue al menos un ítem a la OC");return}
  if(OC.items.some(it=>!(it.pu>0))){toast("Asigne precio unitario a todos los ítems");return}
  if(!(OC.tc>0)){toast("El Tipo de Cambio es obligatorio");return}
  if(!guardarBorradorOC(true))return;
  if(coTry(()=>Docs.oc.enviar(OCid))){ abrirOC(OCid); coRefrescar(); toast("OC enviada a validación: pendiente de Logística y Gerencia"); }
}
function validarLogOC(){
  const o=coTry(()=>Docs.oc.validar(OCid)); if(!o)return;
  abrirOC(OCid); coRefrescar();
  toast(o.valGer?"OC aprobada: "+o.est:"V°B° de Logística registrado: pendiente la aprobación de Gerencia");
}
function preAprobarOC(){ openModal('m-co07a'); }
function aprobarOC(){
  closeModal('m-co07a');
  const o=coTry(()=>Docs.oc.aprobar(OCid)); if(!o)return;
  abrirOC(OCid); coRefrescar();
  toast(o.valLog?("OC aprobada: "+o.est+(o.of&&esServicioOC(o)?" · registrada en la pestaña Costo de "+o.of:"")):"Aprobada por Gerencia: pendiente el V°B° de Logística");
}
function preCancelarOC(){
  if(!OCid){ go('co06'); toast("OC nueva descartada (no se había guardado)"); return; }
  document.getElementById('oc-motivo-cancel').value="";
  openModal('m-co07c');
}
function cancelarOC(){
  const m=document.getElementById('oc-motivo-cancel').value.trim();
  if(!m){toast("El motivo de cancelación es obligatorio");return}
  closeModal('m-co07c');
  if(coTry(()=>Docs.oc.cancelar(OCid,m))){ abrirOC(OCid); coRefrescar(); toast("OC cancelada"+(OC.sol?": las líneas de "+OC.sol+" vuelven a quedar pendientes":"")); }
}

/* ===== CO-07d · Registrar ingreso (bienes) ===== */
function abrirRecepcionOC(){
  const menu=document.getElementById('oc-crear-menu'); if(menu)menu.classList.remove('open');
  if(!OC||!Docs.oc.recibible(OC)){toast("La OC no está para recibir");return}
  const pend=ocPendRec(OC).filter(i=>!BD.esServicio(i.art));
  if(!pend.length){toast("No hay bienes pendientes de recibir");return}
  const alm=(OC.almDestino && BD.alm(OC.almDestino))?OC.almDestino:"SB-CENTRAL-MP";
  document.getElementById('oc-rec-alm').innerHTML=coD().maestros.almacenes.map(a=>'<option value="'+a.cod+'">'+a.cod+' · '+coEsc(a.nom)+'</option>').join('');
  document.getElementById('oc-rec-alm').value=alm;
  document.getElementById('oc-rec-obs').value="";
  document.getElementById('oc-rec-body').innerHTML=pend.map(it=>{
    const p=BD.r4(it.cant-it.recq);
    return '<tr><td>'+it.art+'</td><td>'+coEsc(BD.nomArt(it.art))+'</td><td>'+coEsc(BD.u(it.art))+'</td><td style="text-align:right">'+fmtM(it.cant)+'</td><td style="text-align:right">'+fmtM(it.recq)+'</td><td style="text-align:right;font-weight:600">'+fmtM(p)+'</td>'+
      '<td><input class="oc-rec-cant" data-art="'+it.art+'" value="'+p+'" style="text-align:right"></td></tr>';
  }).join('');
  openModal('m-oc-rec');
}
function confirmarRecepcionOC(){
  const alm=document.getElementById('oc-rec-alm').value, obs=document.getElementById('oc-rec-obs').value.trim();
  const lineas=[...document.querySelectorAll('#oc-rec-body .oc-rec-cant')].map(el=>({art:el.dataset.art,cant:parseFloat(el.value)||0})).filter(l=>l.cant>0);
  if(!lineas.length){toast("Indique al menos una cantidad a recibir");return}
  const mov=coTry(()=>Docs.oc.recibir(OCid,{alm:alm,lineas:lineas,obs:obs||("Ingreso contra "+OCid)}));
  if(!mov)return;
  closeModal('m-oc-rec');
  abrirOC(OCid); coRefrescar();
  toast("Ingreso "+mov.id+(mov.tipoMov?" ("+mov.tipoMov+")":"")+" registrado en "+alm+" · OC "+OC.est);
}

/* ===== CO-07e · Conformidad del servicio ===== */
function abrirConformidadOC(){
  const menu=document.getElementById('oc-crear-menu'); if(menu)menu.classList.remove('open');
  if(!OC||!Docs.oc.recibible(OC)){toast("La OC no está para recibir");return}
  const pend=ocPendRec(OC).filter(i=>BD.esServicio(i.art));
  if(!pend.length){toast("No hay servicios pendientes de conformidad");return}
  const box=document.getElementById('oc-conf-of');
  if(OC.of){box.style.display="block"; box.innerHTML='Servicio para la orden <b>'+coEsc(OC.of)+'</b>: el costo del servicio se contrasta en la pestaña Costo de la orden (Producción) con la factura del proveedor.'}
  else box.style.display="none";
  document.getElementById('oc-conf-res').value="si";
  document.getElementById('oc-conf-obs').value="";
  document.getElementById('oc-conf-body').innerHTML=pend.map(it=>{
    const p=BD.r4(it.cant-it.recq);
    return '<tr><td>'+it.art+'</td><td>'+coEsc(BD.nomArt(it.art))+'</td><td>'+coEsc(BD.u(it.art))+'</td><td style="text-align:right">'+fmtM(it.cant)+'</td><td style="text-align:right">'+fmtM(it.recq)+'</td><td style="text-align:right;font-weight:600">'+fmtM(p)+'</td>'+
      '<td><input class="oc-conf-cant" data-art="'+it.art+'" value="'+p+'" style="text-align:right"></td></tr>';
  }).join('');
  openModal('m-oc-conf');
}
function confirmarConformidadOC(){
  const conforme=document.getElementById('oc-conf-res').value!=="no", obs=document.getElementById('oc-conf-obs').value.trim();
  if(!conforme && !obs){toast("Describa las observaciones del servicio");return}
  const lineas=[...document.querySelectorAll('#oc-conf-body .oc-conf-cant')].map(el=>({art:el.dataset.art,cant:parseFloat(el.value)||0})).filter(l=>l.cant>0);
  if(!lineas.length){toast("Indique al menos una cantidad");return}
  const o=coTry(()=>Docs.oc.conformidad(OCid,{lineas:lineas,conforme:conforme,obs:obs}));
  if(!o)return;
  closeModal('m-oc-conf');
  abrirOC(OCid); coRefrescar();
  toast((conforme?"Conformidad del servicio registrada":"Servicio registrado con observaciones")+" · OC "+o.est);
}

/* ===== CO-07b · Agregar ítem a la orden (maestro compartido de artículos) ===== */
function openBuscadorOC(){
  if(!OC||OC.est!=="Borrador"){toast("Solo se agregan ítems a una OC en Borrador");return}
  document.getElementById('oc-it-g').innerHTML='<option value="">Todos</option>'+(coD().maestros.grupos||[]).map(g=>'<option value="'+g.cod+'">'+coEsc(g.nom)+'</option>').join('');
  document.getElementById('oc-it-q').value="";
  renderBuscarOC(); openModal('m-oc-item');
}
function renderBuscarOC(){
  const q=sinTildes(document.getElementById('oc-it-q').value||"");
  const fg=document.getElementById('oc-it-g').value;
  const p=BD.prov(OC&&OC.prov);
  const lista=coD().maestros.articulos.filter(a=>a.compra && a.estado==="Activo" && !OC.items.some(it=>it.art===a.cod))
    .filter(a=>!fg||a.grupo===fg)
    .filter(a=>!q||sinTildes(a.cod).includes(q)||sinTildes(a.nom).includes(q))
    .sort((a,b)=>((p&&b.cod===p.servicio)?1:0)-((p&&a.cod===p.servicio)?1:0));
  const max=150;
  document.getElementById('oc-it-body').innerHTML=lista.slice(0,max).map(a=>{
    const pu=ocPrecioRef(a.cod);
    return '<tr><td>'+a.cod+'</td><td>'+coEsc(a.nom)+(p&&a.cod===p.servicio?' <span class="hint">(servicio del proveedor)</span>':'')+'</td><td>'+a.grupo+'</td><td>'+coEsc(a.uCompra||a.u)+'</td>'+
     '<td style="text-align:right">'+(pu?fmtM(pu):'<span class="hint">-</span>')+'</td>'+
     '<td><button class="btn btn-primary btn-sm" onclick="ocAddItem(\''+a.cod+'\')">Agregar</button></td></tr>';
  }).join('')+(lista.length>max?'<tr><td colspan="6" class="hint" style="text-align:center">'+(lista.length-max)+' artículos más: afine la búsqueda</td></tr>':'')
    ||'<tr><td colspan="6" style="text-align:center;color:var(--texto-sec);padding:14px">Sin resultados (o ya están en la orden)</td></tr>';
}
function ocAddItem(cod){
  const a=BD.art(cod); if(!a||!OC)return;
  ocLeerForm();
  OC.items.push({art:cod,cant:1,pu:ocPrecioRef(cod),igv:ocIGV(cod,OC.prov),recq:0,facq:0});
  closeModal('m-oc-item'); renderOC();
  toast("Ítem agregado: ajuste la cantidad y el precio de la línea");
}
