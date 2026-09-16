/* INVENTARIOS · GI-20 Saldos por almacén y fecha */
/* ===== GI-20 · Saldos por almacén y fecha ===== */
function salM(v){return Number(v).toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2})}
function fillSaldosFiltros(){
  const alm=document.getElementById('f-sal-alm'); if(!alm)return;
  const alms=[...new Set(STOCK.map(x=>x.alm))];
  alm.innerHTML='<option value="">Todos</option>'+alms.map(a=>'<option>'+a+'</option>').join('');
  document.getElementById('f-sal-g').innerHTML='<option value="">Todos</option>'+TIPOS.map(t=>'<option>'+t.nom+'</option>').join('');
}
function renderSaldos(){
  const alm=document.getElementById('f-sal-alm').value;
  const q=(document.getElementById('f-sal-q').value||"").toLowerCase();
  const g=document.getElementById('f-sal-g').value;
  const cero=document.getElementById('f-sal-cero').checked;
  const tb=document.getElementById('sal-body'); tb.innerHTML="";
  let n=0, total=0;
  STOCK.forEach(x=>{
    const a=ARTICULOS.find(y=>y.n===x.art);
    const cod=a?a.id:"—", tipo=a?a.t:"", u=a?a.u:"UND";
    if(alm && x.alm!==alm)return;
    if(g && tipo!==g)return;
    if(q && !(cod.toLowerCase().includes(q)||sinTildes(x.art).includes(sinTildes(q))))return;
    const saldo=x.real, comp=x.res||0, disp=Math.round((saldo-comp)*100)/100;
    if(!cero && saldo===0)return;
    const costo=Number((a&&COSTO_REF[a.id])||0);
    const val=Math.round(saldo*costo*100)/100;
    total+=val; n++;
    const fmt=v=>(u==="UND")?v:Number(v).toFixed(2);
    tb.innerHTML+='<tr><td>'+x.alm+'</td><td>'+cod+'</td><td>'+x.art+'</td><td>'+u+'</td>'+
     '<td style="text-align:right;font-weight:600">'+fmt(saldo)+'</td>'+
     '<td style="text-align:right">'+(comp?fmt(comp):'<span class="hint">-</span>')+'</td>'+
     '<td style="text-align:right">'+fmt(disp)+'</td>'+
     '<td style="text-align:right">'+(costo?costo.toFixed(2):'<span class="hint">-</span>')+'</td>'+
     '<td style="text-align:right;font-weight:600">'+(val?salM(val):'<span class="hint">-</span>')+'</td></tr>';
  });
  if(!n)tb.innerHTML='<tr><td colspan="9" style="text-align:center;color:var(--texto-sec);padding:18px">Sin saldos para los filtros elegidos</td></tr>';
  document.getElementById('sal-foot').innerHTML=n?('<tr><td colspan="8" style="text-align:right;font-weight:600">TOTAL VALORIZADO</td><td style="text-align:right;font-weight:700">S/. '+salM(total)+'</td></tr>'):'';
  document.getElementById('sal-count').textContent=n+" líneas de saldo a la fecha de corte";
}
