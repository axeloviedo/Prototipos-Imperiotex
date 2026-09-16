/* INVENTARIOS · GI-14/15/16 Guías de Remisión Electrónicas sobre BD.d.gres (Docs.gre.crear) */
function destinatarioGRE(g){return g.prov?BD.provNom(g.prov):g.destino?almEtiqueta(g.destino):hint('-')}
function renderGRE(){
  const m=document.getElementById('f-gre-m'), vm=m.value; m.innerHTML=opcionesLista(Docs.gre.MOTIVOS,vm,'Todos');
  const a=document.getElementById('f-gre-a'), va=a.value; a.innerHTML=opcionesAlm(va,null,'Todos');
  const q=Fmt.s(document.getElementById('f-gre-q').value), fm=m.value, fa=a.value;
  const lista=(BD.d.gres||[]).filter(g=>(!fm||g.motivo===fm)&&(!fa||g.origen===fa)&&(!q||Fmt.s([g.id,g.mov,g.of,g.origen,g.destino,g.prov&&BD.provNom(g.prov)].join(' ')).includes(q)));
  document.getElementById('gre-body').innerHTML=lista.map(g=>'<tr class="clickable" onclick="abrirGRE(\''+g.id+'\')"><td>'+g.id+'</td><td>'+g.fecha+'</td><td>'+Fmt.e(g.motivo)+'</td>'+
    '<td>'+g.origen+' → '+(g.destino||hint('-'))+'</td><td>'+(g.prov?Fmt.e(BD.provNom(g.prov)):hint('-'))+'</td><td onclick="event.stopPropagation()">'+docLink(g.mov)+'</td><td onclick="event.stopPropagation()">'+docLink(g.of)+'</td>'+
    '<td style="text-align:right">'+g.lineas.length+'</td><td>'+badge(g.estado)+'</td></tr>').join('')||
    '<tr><td colspan="9" style="text-align:center;color:var(--texto-sec);padding:18px">Sin guías de remisión en la base</td></tr>';
  document.getElementById('gre-count').textContent=lista.length+" guías de remisión";
}
RENDER.gi14=renderGRE;

let GRE_ACTUAL="";
function abrirGRE(id){GRE_ACTUAL=id;go('gi16')}
function renderDetalleGRE(){
  const g=(BD.d.gres||[]).find(x=>x.id===GRE_ACTUAL); if(!g)return;
  document.getElementById('g16-num').textContent="GRE "+g.id;
  const b=document.getElementById('g16-badge'); b.textContent=g.estado; b.style.background=COLOR_EST[g.estado]||'var(--gre-aceptado)';
  document.getElementById('g16-cdr').innerHTML='<b style="font-size:12.5px">CDR · Constancia de Recepción SUNAT (simulada)</b><p class="hint" style="margin-top:5px">Código 0: «La Guía de Remisión número '+g.id+' ha sido aceptada.» · '+g.fecha+'</p>';
  const campo=(l,v)=>'<div class="field"><label>'+l+'</label><div style="padding:6px 0">'+(v||hint('-'))+'</div></div>';
  document.getElementById('g16-campos').innerHTML=campo('Número',g.id)+campo('Fecha de emisión',g.fecha)+campo('Motivo de traslado',Fmt.e(g.motivo))+
    campo('Almacén de partida',Fmt.e(almEtiqueta(g.origen)))+campo('Llegada',Fmt.e(g.destino?almEtiqueta(g.destino):(g.dirLlegada||'')))+campo('Proveedor / destinatario',g.prov?Fmt.e(g.prov+' · '+BD.provNom(g.prov)):'')+
    campo('Transportista',Fmt.e(g.transportista||''))+campo('Movimiento',docLink(g.mov))+campo('Orden de fabricación',docLink(g.of))+campo('Observaciones',Fmt.e(g.obs||''))+
    campo('Emitida por',Fmt.e(((g.hist||[])[0]||{}).u||''));
  document.getElementById('g16-items').innerHTML=g.lineas.map((l,i)=>'<tr><td>'+(i+1)+'</td><td>'+l.art+'</td><td>'+Fmt.e(BD.nomArt(l.art))+'</td><td>'+BD.u(l.art)+'</td><td style="text-align:right">'+Fmt.n(l.cant)+'</td></tr>').join('');
}
RENDER.gi16=renderDetalleGRE;

/* ===== GI-15 ===== */
const GREF={lineas:[]};
function nuevaGRE(movId){
  GREF.lineas=[];
  const movs=BD.d.movs.filter(m=>m.tipo!=='Ingreso'&&!(BD.d.gres||[]).some(g=>g.mov===m.id)).slice(0,60);
  document.getElementById('gre-mov').innerHTML='<option value="">(sin movimiento)</option>'+movs.map(m=>'<option value="'+m.id+'"'+(m.id===movId?' selected':'')+'>'+m.id+' · '+Fmt.e(m.od)+' · '+m.fecha+'</option>').join('');
  document.getElementById('gre-motivo').innerHTML=opcionesLista(Docs.gre.MOTIVOS,'Traslado entre establecimientos de la misma empresa',false);
  document.getElementById('gre-alm').innerHTML=opcionesAlm('');
  document.getElementById('gre-destino').innerHTML=opcionesAlm('',null,'(fuera de la empresa)');
  document.getElementById('gre-prov').innerHTML='<option value="">(ninguno)</option>'+opcionesLista(M().proveedores.map(p=>({v:p.cod,t:p.cod+' · '+p.nom})),'',false);
  document.getElementById('gre-transp').innerHTML=opcionesLista(mLog('transportistas'),'',false);
  document.getElementById('gre-ubi-l').innerHTML=opcionesLista(mLog('ubigeos'),'','Seleccionar…');
  ['gre-of','gre-obs','gre-ubi-p','gre-dir-p','gre-dir-l','gre-cond','gre-placa'].forEach(id=>document.getElementById(id).value='');
  go('gi15');
  if(movId)greDesdeMovSel(); else renderGREitems();
}
function greDesdeMov(){nuevaGRE(MOV_ACTUAL)}
function greDesdeMovSel(){
  const m=BD.mov(document.getElementById('gre-mov').value); if(!m){renderGREitems();return}
  document.getElementById('gre-alm').value=m.alm; greAlm();
  if(m.destino)document.getElementById('gre-destino').value=m.destino;
  const dst=BD.alm(m.destino)||{};
  document.getElementById('gre-motivo').value=m.tipoMov==='TRF-FABRIC'||dst.transito?'Traslado de bienes para transformación':m.tipo==='Transferencia'?'Traslado entre establecimientos de la misma empresa':m.tipoMov==='SAL-VENTA'?'Venta':m.tipoMov==='SAL-DEVPROV'?'Devolución':'Otros';
  if(/^OF-/.test(m.ndoc||''))document.getElementById('gre-of').value=m.ndoc;
  GREF.lineas=m.lineas.filter(l=>l.signo<0).map(l=>({art:l.art,cant:l.cant}));
  renderGREitems();
}
function greAlm(){
  const a=BD.alm(document.getElementById('gre-alm').value), s=a?M().sedes.find(x=>x.nom===a.sede):null;
  const serie=a?(mLog('seriesGRE').find(x=>x.alm===a.cod)||{}).serie:'';
  document.getElementById('gre-serie').value='T001'+(serie&&serie!=='T001'?' (referencial '+serie+')':'');
  document.getElementById('gre-ubi-p').value=s?(s.cod==='Z'?mLog('ubigeos')[1]:mLog('ubigeos')[0]):'';
  document.getElementById('gre-dir-p').value=s?s.dir:'';
  renderGREitems();
}
function greModo(){
  const pub=document.getElementById('gre-modo').value==="Transporte público";
  document.getElementById('gre-transp-pub').style.display=pub?"grid":"none";
  document.getElementById('gre-transp-priv').style.display=pub?"none":"grid";
}
function renderGREitems(){
  tablaLineas(GREF,{thead:'gre-head',tbody:'gre-items',tfoot:'gre-foot',alm:document.getElementById('gre-alm').value,disp:true,dispLbl:'Actual en partida',estVar:'GREF',render:'renderGREitems'});
}
BUSCADOR_CTX.gre={etiqueta:"el almacén de partida",soloInv:true,requiereAlm:true,alm:()=>document.getElementById('gre-alm').value,
  agregar:cod=>{if(agregarLinea(GREF,cod))renderGREitems()}};
function enviarGRE(){
  const v=id=>document.getElementById(id).value.trim();
  if(!v('gre-alm')){toast("Seleccione el almacén de partida");return}
  if(!v('gre-destino')&&!v('gre-prov')&&!v('gre-dir-l')){toast("Indique la llegada: almacén, proveedor o dirección");return}
  if(!lineasValidas(GREF))return;
  const pub=v('gre-modo')==='Transporte público';
  const g=intentar(()=>Docs.gre.crear({motivo:v('gre-motivo'),origen:v('gre-alm'),destino:v('gre-destino'),prov:v('gre-prov'),
    transportista:pub?v('gre-transp'):('Privado · '+[v('gre-cond'),v('gre-placa')].filter(Boolean).join(' · ')),mov:v('gre-mov'),of:v('gre-of'),obs:v('gre-obs'),
    lineas:GREF.lineas.map(l=>({art:l.art,cant:l.cant}))}));
  if(!g)return;
  g.modo=v('gre-modo'); if(v('gre-ubi-l'))g.ubigeoLlegada=v('gre-ubi-l'); if(v('gre-dir-l'))g.dirLlegada=v('gre-dir-l');
  BD.guardar();
  toast("GRE "+g.id+" emitida y aceptada por SUNAT (simulado)");
  abrirGRE(g.id);
}
