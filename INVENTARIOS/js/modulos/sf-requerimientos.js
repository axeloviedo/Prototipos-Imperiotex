/* INVENTARIOS · GI-23 Requerimientos de materia prima (Explosion.bruto sobre las LDM de la base), servicios de terceros,
   existencias de los artículos pedidos y comprometido de la solicitud */
/* líneas válidas para calcular (cantidad > 0 y con lista) */
const lineasCalc=()=>SPF.lineas.filter(l=>l.cant>0&&BD.fabricable(l.art)).map(l=>({art:l.art,cant:l.cant,ldm:l.ldm}));
/* comprometido que esta misma solicitud ya dejó en (alm, art): se suma al disponible para no descontarse a sí misma */
function compPropio(alm,art){const s=SP_ACT();if(!s||s.est!=='Aprobada')return 0;return (s.comprometido||[]).filter(c=>c.alm===alm&&c.art===art).reduce((t,c)=>t+c.cant,0)}
function reqMP(){
  return Explosion.bruto(lineasCalc()).map(r=>{
    const disp=BD.r4(Stock.disp(r.alm,r.art)+compPropio(r.alm,r.art)), dif=BD.r4(disp-r.cant);
    return {alm:r.alm,art:r.art,req:r.cant,disp,dif,falta:dif<0,otros:solStockOtros(r.art,r.alm)};
  }).sort((a,b)=>a.alm.localeCompare(b.alm)||a.art.localeCompare(b.art));
}
function renderPanelMP(){
  const mp=reqMP(); SPF.mp=mp;
  const tb=document.getElementById('sp-mp');
  if(!mp.length){tb.innerHTML='<tr><td colspan="8" style="text-align:center;color:var(--texto-sec);padding:16px">Sin requerimientos: agregue artículos con cantidad y lista de materiales (<button class="btn-link" onclick="go(\'gi17\')">GI-17</button>)</td></tr>';document.getElementById('sp-mp-resumen').innerHTML='';return}
  const sols=BD.d.sols.filter(x=>x.sf===SPF.id&&x.estado!=='Anulada'&&x.estado!=='Rechazada');
  tb.innerHTML=mp.map(m=>{
    const u=BD.u(m.art), sol=sols.find(x=>x.lineas.some(l=>l.art===m.art));
    const est=!m.falta?badge('Suficiente','var(--confirmado)'):sol?docLink(sol.id)+' '+badge(sol.estado):badge('Falta','var(--cancelada)');
    return '<tr><td>'+Fmt.e(BD.nomArt(m.art))+'<br><span class="hint">'+m.art+'</span></td><td>'+m.alm+'</td><td>'+u+'</td>'+
      '<td style="text-align:right;font-weight:600">'+Fmt.n(m.req)+'</td><td style="text-align:right">'+Fmt.n(m.disp)+'</td>'+
      '<td style="text-align:right;font-weight:600;color:'+(m.falta?'var(--cancelada)':'var(--confirmado)')+'">'+(m.dif>=0?'+':'')+Fmt.n(m.dif)+'</td>'+
      '<td style="font-size:12px">'+(m.otros.length?m.otros.map(o=>o.alm+': '+Fmt.n(o.disp)).join('<br>'):hint('-'))+'</td><td>'+est+'</td></tr>';
  }).join('');
  const s=SP_ACT(), faltan=mp.filter(m=>m.falta), sinSol=faltan.filter(m=>!sols.some(x=>x.lineas.some(l=>l.art===m.art)));
  const total=spTotal(SPF), puedeGen=s&&!['Convertida en Orden','Fabricada','Rechazada'].includes(s.est)&&sinSol.length&&!VISTA_CM;
  const sinLDM=SPF.lineas.filter(l=>!BD.fabricable(l.art));
  document.getElementById('sp-mp-resumen').innerHTML=(faltan.length?
    '<div class="card" style="margin:0;border-left:4px solid var(--cancelada);background:#FEF2F2"><b style="font-size:12.5px">'+faltan.length+' material(es) sin cobertura para las '+Fmt.n(total)+' prendas</b><p class="hint" style="margin-top:5px">Genere una Solicitud de Materiales por almacén con el déficit: Logística decide en GI-13 si se transfiere o se compra.</p>'+
      (puedeGen?'<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="generarSOLdesdeSP()">Generar Solicitud de Materiales ('+sinSol.length+')</button>':'')+'</div>':
    '<div class="card" style="margin:0;border-left:4px solid var(--confirmado);background:#F0FDF4"><b style="font-size:12.5px">Materia prima cubierta</b><p class="hint" style="margin-top:5px">Todos los materiales alcanzan para las '+Fmt.n(total)+' prendas del pedido.</p></div>')+
    (sinLDM.length?'<div class="card" style="margin:10px 0 0;border-left:4px solid var(--pendiente);background:#FFFBEB"><b style="font-size:12.5px">'+sinLDM.length+' artículo(s) sin lista de materiales</b><p class="hint" style="margin-top:5px">'+sinLDM.map(l=>l.art).join(', ')+': defina su lista en GI-17.</p></div>':'');
}
/* sub-fila del detalle: materia prima de una línea */
function spReqSubrow(l){
  const rows=Explosion.bruto(l.cant>0&&BD.fabricable(l.art)?[{art:l.art,cant:l.cant,ldm:l.ldm}]:[]).map(r=>'<tr><td>'+r.art+'</td><td>'+Fmt.e(BD.nomArt(r.art))+'</td><td>'+BD.u(r.art)+'</td><td style="text-align:right">'+Fmt.n(r.cant)+'</td><td>'+r.alm+'</td><td style="text-align:right">'+Fmt.n(Stock.disp(r.alm,r.art))+'</td></tr>').join('')||'<tr><td colspan="6" class="hint" style="text-align:center;padding:8px">Sin requerimientos (cantidad 0 o sin lista)</td></tr>';
  const cad=[];let a=l.art,ld=l.ldm;
  for(let k=0;k<6;k++){const L=ld?BD.ldm(ld):BD.ldmPred(a);if(!L)break;cad.push(a+' ('+L.id+')');const sig=L.items.find(i=>i.tipo==='Artículo'&&BD.fabricable(i.cod));if(!sig)break;a=sig.cod;ld=null;}
  return '<tr class="req-sub"><td></td><td colspan="8" style="background:#F8FAFC;padding:8px"><div style="font-size:11.5px;color:var(--texto-sec);margin-bottom:5px">Cadena de fabricación: <b>'+cad.join(' ← ')+'</b></div>'+
    '<div class="tbl-wrap" style="margin:0"><table class="grid subtable" style="margin:0"><thead><tr><th style="width:90px">Código</th><th>Material</th><th style="width:50px">UM</th><th style="width:90px;text-align:right">Requerida</th><th style="width:130px">Almacén</th><th style="width:90px;text-align:right">Disponible</th></tr></thead><tbody>'+rows+'</tbody></table></div></td></tr>';
}
function renderServiciosSP(){
  const srv=Explosion.servicios(lineasCalc()), card=document.getElementById('sp-srv-card');
  card.style.display=srv.length?'block':'none';
  document.getElementById('sp-srv').innerHTML=srv.map(x=>{const R=BD.rec(x.cod)||{}, p=M().proveedores.find(p=>p.servicio===x.cod)||BD.prov(R.prov)||BD.prov((BD.art(x.cod)||{}).provDef);
    return '<tr><td>'+x.cod+'</td><td>'+Fmt.e(R.nom||BD.nomArt(x.cod))+'</td><td style="text-align:right">'+Fmt.q(x.cant,R.u||BD.u(x.cod))+'</td><td>'+(p?Fmt.e(p.cod+' · '+p.nom):hint('-'))+'</td><td style="text-align:right">'+Fmt.m(R.costo)+'</td></tr>'}).join('');
}
function renderPanelStock(){
  const hoy=Fmt.num(BD.hoy());
  const dias=f=>{const p=String(f).split(' ')[0].split('/');if(p.length<3)return null;return Math.round((new Date(BD.hoy().split('/').reverse().join('-'))-new Date(p[2]+'-'+p[1]+'-'+p[0]))/86400000)};
  document.getElementById('sp-stock').innerHTML=SPF.lineas.map(l=>{
    const filas=BD.d.stock.filter(x=>x.art===l.art&&(x.act||x.comp));
    if(!filas.length)return '<tr><td>'+l.art+'</td><td>'+Fmt.e(BD.nomArt(l.art))+'</td><td colspan="6">'+hint('sin existencias en ningún almacén')+'</td><td>'+badge('Sin stock','var(--cancelada)')+'</td></tr>';
    return filas.map((x,i)=>{
      const disp=BD.r4(x.act-x.comp), mn=minimoDe(x.alm,x.art), sem=semaforo(x.alm,x.art,disp);
      const sal=Stock.kardex(x.art,x.alm).filter(k=>k.sal>0&&Fmt.num(k.fecha)<=hoy).pop(), d=sal?dias(sal.fecha):null;
      return '<tr><td>'+(i===0?l.art:'')+'</td><td>'+(i===0?Fmt.e(BD.nomArt(l.art)):'')+'</td><td>'+x.alm+'</td><td style="text-align:right">'+Fmt.n(x.act)+'</td><td style="text-align:right">'+(x.comp?Fmt.n(x.comp):hint('-'))+'</td>'+
        '<td style="text-align:right;font-weight:600">'+Fmt.n(disp)+'</td><td style="text-align:right">'+(mn||hint('-'))+'</td><td>'+(sal?sal.fecha.split(' ')[0]+'<br><span class="hint">hace '+d+' día(s)</span>':hint('Sin salidas'))+'</td>'+
        '<td>'+badge(SEM_TXT[sem],SEM_COLOR[sem])+'</td></tr>';
    }).join('');
  }).join('')||'<tr><td colspan="9" style="text-align:center;color:var(--texto-sec);padding:12px">Sin líneas</td></tr>';
}
function renderComprometidoSP(){
  const s=SP_ACT(), card=document.getElementById('sp-comp-card'), c=(s&&s.comprometido)||[];
  card.style.display=c.length?'block':'none';
  document.getElementById('sp-comp').innerHTML=c.map(x=>{const req=x.req!=null?x.req:x.cant, falta=BD.r4(req-x.cant);
    return '<tr><td>'+x.art+' · '+Fmt.e(BD.nomArt(x.art))+'</td><td>'+x.alm+'</td><td style="text-align:right">'+Fmt.q(req,BD.u(x.art))+'</td><td style="text-align:right;font-weight:600">'+Fmt.n(x.cant)+'</td>'+
      '<td style="text-align:right">'+(falta>0.00005?'<span style="color:var(--cancelada);font-weight:600">'+Fmt.n(falta)+'</span>':hint('-'))+'</td></tr>'}).join('')+
    (s.est!=='Aprobada'?'<tr><td colspan="5" class="hint">'+(s.est==='Convertida en Orden'||s.est==='Fabricada'?'Liberado al crear las órdenes: cada orden compromete lo suyo en Producción.':'')+'</td></tr>':
      (c.some(x=>(x.req!=null?x.req:x.cant)-x.cant>0.00005)?'<tr><td colspan="5" class="hint">Solo se compromete lo que hay en el almacén (el Disponible nunca queda negativo). Lo que falta se pide con la Solicitud de Materiales y se compromete para esta solicitud cuando llega la compra o la transferencia.</td></tr>':''));
}
function verificarStock(){
  const mp=reqMP();
  if(!mp.length){toast("No hay materiales que verificar: agregue artículos con cantidad y lista de materiales");return}
  const f=mp.filter(m=>m.falta);
  toast(f.length?"⚠ "+f.length+" de "+mp.length+" material(es) sin cobertura: "+f.slice(0,3).map(m=>BD.nomArt(m.art)).join(", ")+(f.length>3?"…":""):"✔ Stock suficiente: los "+mp.length+" materiales alcanzan para el pedido");
  renderSPform();
}
