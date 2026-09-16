/* INVENTARIOS · GI-20 Saldos por almacén y fecha: se reconstruyen desde los movimientos (Stock.kardex / Stock.saldoA) */
function fillSaldosFiltros(){
  const alm=document.getElementById('f-sal-alm'); if(!alm)return;
  alm.innerHTML=opcionesAlm(alm.value,null,'Todos');
  const g=document.getElementById('f-sal-g'), v=g.value;
  g.innerHTML=opcionesLista(M().grupos.filter(x=>x.inv!==false).map(x=>({v:x.cod,t:x.cod+' · '+x.nom})),v,'Todos');
  const f=document.getElementById('f-sal-f'); if(!f.value)f.value=Fmt.iso(BD.hoy());
}
/* saldo y costo promedio de un artículo en un almacén al cierre de la fecha (dd/mm/aaaa) */
function saldoCostoA(art,alm,fecha){
  const lim=Fmt.num(fecha); let saldo=0, prom=0, prev=0, mov=0;
  Stock.kardex(art,alm).forEach(r=>{
    if(Fmt.num(r.fecha)>lim)return;
    if(r.ent>0)prom=prev>0?BD.r4((prev*prom+r.ent*r.costo)/(prev+r.ent)):r.costo;
    prev=r.saldo; saldo=r.saldo; mov++;
  });
  return {saldo,costo:prom,mov};
}
function renderSaldos(){
  fillSaldosFiltros();
  const fecha=Fmt.bd(document.getElementById('f-sal-f').value)||BD.hoy();
  const alm=document.getElementById('f-sal-alm').value, q=Fmt.s(document.getElementById('f-sal-q').value), g=document.getElementById('f-sal-g').value;
  const cero=document.getElementById('f-sal-cero').checked, hoy=fecha===BD.hoy()||Fmt.num(fecha)>=Fmt.num(BD.hoy());
  const pares={}; BD.d.movs.forEach(m=>m.lineas.forEach(l=>pares[l.alm+'|'+l.art]=1));
  let n=0, total=0;
  const filas=Object.keys(pares).sort().map(k=>{
    const [al,art]=k.split('|'), a=BD.art(art)||{}, A=BD.alm(al)||{};
    if(A.emp&&A.emp!==empresaAbrev())return '';
    if(alm&&al!==alm)return ''; if(g&&a.grupo!==g)return '';
    if(q&&!(Fmt.s(art).includes(q)||Fmt.s(a.nom).includes(q)))return '';
    const s=saldoCostoA(art,al,fecha);
    if(!s.mov)return ''; if(!cero&&!s.saldo)return '';
    const comp=hoy?Stock.comp(al,art):null, val=A.kardexValorizado===false?null:BD.r2(s.saldo*s.costo);
    if(val)total+=val; n++;
    return '<tr><td>'+al+'</td><td><button class="btn-link" onclick="verKardex(\''+art+'\',\''+al+'\')">'+art+'</button></td><td>'+Fmt.e(a.nom||'')+'</td><td>'+(a.u||'')+'</td>'+
     '<td style="text-align:right;font-weight:600">'+Fmt.n(s.saldo)+'</td>'+
     '<td style="text-align:right">'+(comp==null?hint('Solo hoy'):comp?Fmt.n(comp):hint('-'))+'</td>'+
     '<td style="text-align:right">'+(comp==null?hint('-'):Fmt.n(s.saldo-comp))+'</td>'+
     '<td style="text-align:right">'+(val==null?hint('Solo cant.'):Fmt.m(s.costo))+'</td>'+
     '<td style="text-align:right;font-weight:600">'+(val==null?hint('-'):Fmt.m(val))+'</td></tr>';
  }).join('');
  document.getElementById('sal-body').innerHTML=filas||'<tr><td colspan="9" style="text-align:center;color:var(--texto-sec);padding:18px">Sin saldos para los filtros elegidos a la fecha '+fecha+'</td></tr>';
  document.getElementById('sal-foot').innerHTML=n?('<tr><td colspan="8" style="text-align:right;font-weight:600">TOTAL VALORIZADO AL '+fecha+'</td><td style="text-align:right;font-weight:700">S/. '+Fmt.m(total)+'</td></tr>'):'';
  document.getElementById('sal-count').textContent=n+" líneas de saldo a la fecha de corte "+fecha;
}
RENDER.gi20=renderSaldos;
