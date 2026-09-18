/* INVENTARIOS · GI-06 Kardex por artículo y almacén (Stock.kardex sobre BD.d.movs) */
function fillKardexFiltros(){
  const sa=document.getElementById('f-kdx-art'), va=sa.value;
  const conMov=new Set(); BD.d.movs.forEach(m=>m.lineas.forEach(l=>conMov.add(l.art)));
  const arts=M().articulos.filter(a=>a.inv!==false).sort((x,y)=>(conMov.has(y.cod)?1:0)-(conMov.has(x.cod)?1:0)||x.cod.localeCompare(y.cod));
  sa.innerHTML='<option value="">Todos con movimientos ('+conMov.size+')</option>'+arts.map(a=>'<option value="'+a.cod+'"'+(a.cod===va?' selected':'')+'>'+a.cod+' · '+Fmt.e(a.nom)+(conMov.has(a.cod)?'':' (sin movimientos)')+'</option>').join('');
  const al=document.getElementById('f-kdx-alm'), vl=al.value; al.innerHTML=opcionesAlm(vl,null,'Todos los almacenes');
  const g=document.getElementById('f-kdx-g'), vg=g.value;
  g.innerHTML=opcionesLista((M().gruposMovimiento||[]).map(x=>({v:x.cod,t:x.cod+' · '+x.nom})),vg,'Todos');
  fillKdxTipos();
}
function fillKdxTipos(){const t=document.getElementById('f-kdx-t'), v=t.value; t.innerHTML=opcionesTipoMov(document.getElementById('f-kdx-g').value,v,'Todos')}
function verKardex(art,alm){
  go('gi06');
  document.getElementById('f-kdx-art').value=art||''; document.getElementById('f-kdx-alm').value=alm||'';
  renderKardex();
}
function renderKardex(){
  const art=document.getElementById('f-kdx-art').value, alm=document.getElementById('f-kdx-alm').value;
  const fg=document.getElementById('f-kdx-g').value, ft=document.getElementById('f-kdx-t').value;
  const d=Fmt.num(Fmt.bd(document.getElementById('f-kdx-d').value)), h=Fmt.num(Fmt.bd(document.getElementById('f-kdx-h').value));
  const movPorId={}; BD.d.movs.forEach(m=>movPorId[m.id]=m);
  /* pares artículo × almacén con movimientos */
  const pares={};
  BD.d.movs.forEach(m=>m.lineas.forEach(l=>{
    if(art&&l.art!==art)return; if(alm&&l.alm!==alm)return;
    const al=BD.alm(l.alm); if(al&&al.emp!==empresaAbrev())return;
    pares[l.art+'|'+l.alm]=1;
  }));
  const claves=Object.keys(pares).sort();
  const cont=document.getElementById('kdx-tablas');
  if(!claves.length){cont.innerHTML='<div class="card" style="text-align:center;color:var(--texto-sec)">'+(art?'Sin movimientos de '+Fmt.e(artEtiqueta(art))+(alm?' en '+alm:'')+'.':'Sin movimientos en la base: registre un ingreso (GI-09) o reciba una Orden de Compra.')+'</div>';return}
  cont.innerHTML=claves.slice(0,60).map(k=>{
    const [a,l]=k.split('|'), A=BD.art(a)||{}, AL=BD.alm(l)||{}, val=AL.kardexValorizado!==false, conLote=Stock.conLote(a);
    let prom=0, saldoPrev=0, filas='';
    Stock.kardex(a,l).forEach(r=>{
      /* costo promedio vigente después del movimiento */
      if(r.reval) prom=r.costo; /* revalorización: cambia el costo sin mover cantidades */
      else if(r.ent>0) prom=saldoPrev>0?BD.r4((saldoPrev*prom+r.ent*r.costo)/(saldoPrev+r.ent)):r.costo;
      saldoPrev=r.saldo;
      const m=movPorId[r.id]||{}, n=Fmt.num(r.fecha);
      if(d&&n<d)return; if(h&&n>h)return; if(fg&&m.grupoMov!==fg)return; if(ft&&m.tipoMov!==ft)return;
      filas+='<tr><td>'+r.fecha+'</td><td>'+Fmt.e(r.det||m.tipoMovNom||r.tipo)+'<br><span class="hint">'+(m.tipoMov||'')+(m.modulo?' · '+m.modulo:'')+'</span></td>'+
        '<td><button class="btn-link" onclick="abrirMov(\''+r.id+'\')">'+r.id+'</button></td><td>'+docLink(r.ndoc)+'</td><td>'+Fmt.e(m.usuario||'')+'</td>'+
        (conLote?'<td class="hint">'+Fmt.e(r.lote||'-')+'</td>':'')+
        '<td style="text-align:right">'+(r.ent?Fmt.n(r.ent):'')+'</td><td style="text-align:right">'+(r.sal?Fmt.n(r.sal):'')+'</td><td style="text-align:right;font-weight:600">'+Fmt.n(r.saldo)+'</td>'+
        (val?'<td style="text-align:right">'+Fmt.m(r.costo)+'</td><td style="text-align:right">'+Fmt.m(prom)+'</td><td style="text-align:right">'+Fmt.m(r.saldo*prom)+'</td>':'')+'</tr>';
    });
    const cab='<tr><th>Fecha</th><th>Detalle del movimiento</th><th>ID</th><th>Documento</th><th>Usuario</th>'+(conLote?'<th>Lote</th>':'')+'<th style="text-align:right">Entrada</th><th style="text-align:right">Salida</th><th style="text-align:right">Existencias</th>'+
      (val?'<th style="text-align:right">Costo mov. S/.</th><th style="text-align:right">Costo prom. S/.</th><th style="text-align:right">Saldo valorizado S/.</th>':'')+'</tr>';
    return '<div style="margin:12px 0 8px"><b style="font-size:14px">'+a+' · '+Fmt.e(A.nom||'')+'</b> <span class="hint">· '+Fmt.e(almEtiqueta(l))+' · '+(A.u||'')+(val?'':' · solo cantidades (sin Kardex valorizado)')+' · Actual '+Fmt.n(Stock.act(l,a))+' · Comprometido '+Fmt.n(Stock.comp(l,a))+'</span></div>'+
      '<div class="tbl-wrap"><table class="grid"><thead>'+cab+'</thead><tbody>'+(filas||'<tr><td colspan="11" class="hint" style="text-align:center;padding:10px">Sin movimientos con los filtros de fecha o tipo</td></tr>')+'</tbody></table></div>';
  }).join('')+(claves.length>60?'<p class="hint">Se muestran 60 de '+claves.length+' combinaciones: filtre por artículo o almacén.</p>':'');
}
RENDER.gi06=()=>{fillKardexFiltros();renderKardex()};

/* enlace a un documento de la base según su prefijo (OC, SOL, SF, OF, FC, GRE, movimiento) */
function docLink(id){
  if(!id)return hint('-');
  const e=Fmt.e(id);
  if(/^OC-\d+$/.test(id)&&BD.oc(id))return '<button class="btn-link" onclick="irOC(\''+id+'\')">'+e+'</button>';
  if(/^SOL-\d+$/.test(id)&&BD.sol(id))return '<button class="btn-link" onclick="abrirSOL(\''+id+'\')">'+e+'</button>';
  if(/^SF-\d+$/.test(id)&&BD.sf(id))return '<button class="btn-link" onclick="abrirSF(\''+id+'\')">'+e+'</button>';
  if(/^(ING|SAL|TRF)-\d+$/.test(id)&&BD.mov(id))return '<button class="btn-link" onclick="abrirMov(\''+id+'\')">'+e+'</button>';
  if(/^ST-\d+$/.test(id)&&(BD.d.trfs||[]).some(g=>g.id===id))return '<button class="btn-link" onclick="abrirST(\''+id+'\')">'+e+'</button>';
  if(/^T001-\d+$/.test(id)&&(BD.d.gres||[]).some(g=>g.id===id))return '<button class="btn-link" onclick="abrirGRE(\''+id+'\')">'+e+'</button>';
  if(/^OF-\d+$/.test(id)&&BD.of(id))return '<button class="btn-link" onclick="irProduccion(\'pr02/'+id+'\')" title="Abre la orden en Producción">'+e+'</button>';
  return e;
}
/* abre una OC en Compras (CO-07) con la función que expone Compras */
function irOC(id){
  if(typeof abrirOC==='function')return abrirOC(id);
  if(typeof loadOC==='function')return loadOC(id);
  toast("La pantalla de Órdenes de Compra no está disponible");
}
