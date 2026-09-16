/* COMPRAS · CO-00 Panel de Compras */
/* ===== CO-00 · Panel de Compras ===== */
const CPK_MESES=[["Ene",8200],["Feb",11450],["Mar",9800],["Abr",14100],["May",12350],["Jun",16900]];
const CPK_MESES_USD=[["Ene",0],["Feb",1850],["Mar",0],["Abr",2400],["May",0],["Jun",5040]];
function ocSoles(o){
  let sub=0,igvT=0;
  (o.items||[]).forEach(it=>{const st=it.cant*it.pu; sub+=st; igvT+=st*(it.igv/100)});
  const tot=sub+igvT;
  return (o.mon==="USD")?tot*(parseFloat(o.tc)||3.75):tot;
}
function ocUSD(o){
  let sub=0,igvT=0;
  (o.items||[]).forEach(it=>{const st=it.cant*it.pu; sub+=st; igvT+=st*(it.igv/100)});
  return sub+igvT;
}
function renderPanelCompras(){
  const monSel=(document.getElementById('cpk-mon')||{value:"S/."}).value;
  const esUSD=(monSel==="USD");
  const anio=(document.getElementById('cpk-anio')||{value:"2026"}).value;
  const mes=(document.getElementById('cpk-mes')||{value:"07"}).value;
  const pref=anio+(mes?("-"+mes):"");
  const MESES_TXT={"":"todo el año","01":"enero","02":"febrero","03":"marzo","04":"abril","05":"mayo","06":"junio","07":"julio","08":"agosto","09":"setiembre","10":"octubre","11":"noviembre","12":"diciembre"};
  const perTxt=(mes?MESES_TXT[mes]+" ":"")+anio+(mes?"":" completo");
  const abiertos=["Para Recibir y Pagar","Para Recibir","Para Pagar","Impagado"];
  let claves, total, fmtS;
  if(esUSD){
    claves=Object.keys(OCS).filter(k=>{const o=OCS[k];return o.mon==="USD" && o.fecha && o.fecha.startsWith(pref) && o.est!=="Borrador" && o.est!=="Cancelada"});
    total=claves.reduce((a,k)=>a+ocUSD(OCS[k]),0);
    fmtS=v=>"USD "+v.toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2});
    document.querySelector('#cpk-count').parentElement.querySelector('span:last-child').textContent="importaciones · "+perTxt;
    document.querySelector('#cpk-total').parentElement.querySelector('span:last-child').textContent="montos nativos en dólares";
    document.getElementById('cpk-pend').textContent=Object.values(OCS).filter(o=>o.mon==="USD"&&abiertos.includes(o.est)).length;
  }else{
    claves=Object.keys(OCS).filter(k=>{const o=OCS[k];return o.fecha && o.fecha.startsWith(pref) && o.est!=="Borrador" && o.est!=="Cancelada"});
    total=claves.reduce((a,k)=>a+ocSoles(OCS[k]),0);
    fmtS=v=>"S/. "+v.toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2});
    document.querySelector('#cpk-count').parentElement.querySelector('span:last-child').textContent=perTxt+" · sin borradores ni canceladas";
    document.querySelector('#cpk-total').parentElement.querySelector('span:last-child').textContent="USD convertidos al TC de cada OC";
    document.getElementById('cpk-pend').textContent=Object.values(OCS).filter(o=>abiertos.includes(o.est)).length;
  }
  document.getElementById('cpk-count').textContent=claves.length;
  document.getElementById('cpk-total').textContent=fmtS(total);
  document.getElementById('cpk-prom').textContent=claves.length?fmtS(total/claves.length):fmtS(0);
  renderTopCompras(claves,esUSD,perTxt);
  const base=esUSD?CPK_MESES_USD:CPK_MESES;
  const jul=Object.keys(OCS).filter(k=>{const o=OCS[k];return o.fecha && o.fecha.startsWith("2026-07") && o.est!=="Borrador" && o.est!=="Cancelada" && (!esUSD||o.mon==="USD")});
  const datos=[...base,["Jul",Math.round(jul.reduce((a,k)=>a+(esUSD?ocUSD(OCS[k]):ocSoles(OCS[k])),0))]];
  document.getElementById('cpk-chart-titulo').textContent="Tendencia de compras por mes de 2026 ("+(esUSD?"USD":"S/.")+")";
  const max=Math.max(...datos.map(d=>d[1]),1);
  document.getElementById('cpk-chart').innerHTML=datos.map(([m,v],idx)=>{
    const h=Math.max(6,Math.round(v/max*150));
    const actual=(idx===datos.length-1);
    const sel=(mes && anio==="2026" && idx===parseInt(mes)-1)||(actual && mes==="07" && anio==="2026");
    return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px">'+
      '<span style="font-size:11px;font-weight:600;color:'+(actual?"var(--primario)":"var(--texto-sec)")+'">'+(v/1000).toFixed(1)+'K</span>'+
      '<div style="width:100%;max-width:56px;height:'+h+'px;border-radius:6px 6px 0 0;background:'+(actual?"var(--primario)":"#C7D4E4")+';'+(sel?'outline:2px solid var(--pendiente);outline-offset:2px':'')+'" title="'+m+': S/. '+v.toLocaleString("es-PE")+'"></div>'+
      '<span style="font-size:11.5px;color:'+(actual?"var(--primario)":"var(--texto-sec)")+';font-weight:'+(actual?"700":"400")+'">'+m+(actual?" ·":"")+'</span></div>';
  }).join('');
}
function renderTopCompras(claves,esUSD,perTxt){
  const box=document.getElementById('cpk-top'); if(!box)return;
  document.getElementById('cpk-top-sub').textContent="Artículos con mayor monto comprado en "+perTxt+", calculados de las Órdenes de Compra (sin borradores ni canceladas).";
  const agg={};
  claves.forEach(k=>{
    const o=OCS[k], tc=(o.mon==="USD")?(parseFloat(o.tc)||3.75):1;
    (o.items||[]).forEach(it=>{
      const key=it.nom;
      if(!agg[key])agg[key]={nom:it.nom,u:it.u,cant:0,monto:0};
      agg[key].cant+=it.cant;
      agg[key].monto+=it.cant*it.pu*(esUSD?1:tc);
    });
  });
  const top=Object.values(agg).sort((a,b)=>b.monto-a.monto).slice(0,5);
  if(!top.length){box.innerHTML='<p class="hint" style="text-align:center;padding:14px">Sin compras registradas en este período.</p>';return}
  const max=top[0].monto;
  const fmtS=v=>(esUSD?"USD ":"S/. ")+v.toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtC=(v,u)=>(u==="UND")?v.toLocaleString("es-PE"):v.toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2});
  box.innerHTML=top.map((t,i)=>{
    const w=Math.max(4,Math.round(t.monto/max*100));
    return '<div style="display:grid;grid-template-columns:24px 320px 1fr 150px;gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid var(--borde)">'+
     '<span style="color:var(--texto-sec);font-size:12px">'+(i+1)+'</span>'+
     '<span style="font-size:12.5px">'+t.nom+'<br><span class="hint">'+fmtC(t.cant,t.u)+' '+t.u+' compradas</span></span>'+
     '<div style="background:#EDF1F6;border-radius:4px;height:14px"><div style="width:'+w+'%;height:14px;border-radius:4px;background:var(--primario-claro)"></div></div>'+
     '<b style="text-align:right">'+fmtS(t.monto)+'</b></div>';
  }).join('');
}
