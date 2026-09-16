/* COMPRAS · CO-00 Panel de Compras
   Indicadores calculados de la base compartida: BD.d.ocs, BD.d.facturas y BD.d.sols. Con «Solo maestros» todo queda en cero. */
const CPK_MESES_TXT=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"];
function ocSoles(o){ const t=Docs.oc.totales(o).total; return (o.mon==="USD")?t*(parseFloat(o.tc)||3.75):t; }
function ocUSD(o){ return Docs.oc.totales(o).total; }
/* partes de la fecha 'dd/mm/aaaa' */
function cpkAnio(f){ return String(f||"").slice(6,10); }
function cpkMes(f){ return String(f||"").slice(3,5); }
function cpkIr(estado){ const s=document.getElementById('f-oc-e'); if(s)s.value=estado; renderOCS(); go('co06'); }
function cpkIrFac(){ const s=document.getElementById('f-fac-e'); if(s)s.value="Impagado"; renderFac(); go('co09'); }
function renderPanelCompras(){
  if(!document.getElementById('cpk-count'))return;
  const d=coD();
  /* ---- pendientes (cualquier fecha) ---- */
  let lineasSol=0; const solsCon=new Set();
  d.sols.filter(s=>s.estado==="Aprobada"||s.estado==="En proceso").forEach(s=>s.lineas.forEach(l=>{ if(l.prop==="Compra" && l.estado==="Pendiente"){ lineasSol++; solsCon.add(s.id); } }));
  document.getElementById('cpk-sol').textContent=lineasSol;
  document.getElementById('cpk-sol-sub').textContent=solsCon.size?("en "+solsCon.size+" solicitud(es): "+[...solsCon].slice(0,3).join(", ")+(solsCon.size>3?"…":"")):"solicitudes de materiales aprobadas";
  const porVal=d.ocs.filter(o=>o.est==="Pendiente de Validar");
  document.getElementById('cpk-val').textContent=porVal.length;
  const borr=d.ocs.filter(o=>o.est==="Borrador").length;
  document.getElementById('cpk-val-sub').textContent="V°B° Logística o aprobación Gerencia"+(borr?" · "+borr+" en borrador":"");
  const porRec=d.ocs.filter(o=>Docs.oc.recibible(o));
  document.getElementById('cpk-rec').textContent=porRec.length;
  const nSrv=porRec.filter(o=>o.tipo==="Servicio").length;
  document.getElementById('cpk-rec-sub').textContent=(porRec.length-nSrv)+" de bienes (ingreso) · "+nSrv+" de servicio (conformidad)";
  document.getElementById('cpk-fac').textContent=d.ocs.filter(ocFacturable).length;
  const imp=d.facturas.filter(f=>f.est==="Impagado");
  const impS=imp.filter(f=>f.mon!=="USD").reduce((t,f)=>t+Docs.fac.total(f),0), impU=imp.filter(f=>f.mon==="USD").reduce((t,f)=>t+Docs.fac.total(f),0);
  document.getElementById('cpk-imp').textContent=imp.length;
  document.getElementById('cpk-imp-sub').textContent="S/. "+fmtM(impS)+(impU?" + USD "+fmtM(impU):"");

  /* ---- período ---- */
  const selA=document.getElementById('cpk-anio');
  const anios=[...new Set(d.ocs.map(o=>cpkAnio(o.fecha)).filter(Boolean).concat([cpkAnio(BD.hoy())]))].sort();
  const aSel=selA.value||cpkAnio(BD.hoy());
  selA.innerHTML=anios.map(a=>'<option'+(a===aSel?' selected':'')+'>'+a+'</option>').join(''); selA.value=aSel;
  const anio=selA.value, mes=document.getElementById('cpk-mes').value;
  const esUSD=document.getElementById('cpk-mon').value==="USD";
  const MESES_TXT={"":"todo el año","01":"enero","02":"febrero","03":"marzo","04":"abril","05":"mayo","06":"junio","07":"julio","08":"agosto","09":"setiembre","10":"octubre","11":"noviembre","12":"diciembre"};
  const perTxt=(mes?MESES_TXT[mes]+" ":"")+anio+(mes?"":" completo");
  const validas=d.ocs.filter(o=>o.est!=="Borrador" && o.est!=="Cancelada" && (!esUSD||o.mon==="USD"));
  const periodo=validas.filter(o=>cpkAnio(o.fecha)===anio && (!mes||cpkMes(o.fecha)===mes));
  const monto=o=>esUSD?ocUSD(o):ocSoles(o);
  const total=periodo.reduce((a,o)=>a+monto(o),0);
  const fmtS=v=>(esUSD?"USD ":"S/. ")+fmtM(v);
  document.getElementById('cpk-count').textContent=periodo.length;
  document.getElementById('cpk-count-sub').textContent=(esUSD?"importaciones · ":"")+perTxt+" · sin borradores ni canceladas";
  document.getElementById('cpk-total').textContent=fmtS(total);
  document.getElementById('cpk-total-sub').textContent=esUSD?"montos nativos en dólares":"USD convertidos al TC de cada OC · con IGV";
  document.getElementById('cpk-prom').textContent=fmtS(periodo.length?total/periodo.length:0);
  document.getElementById('cpk-tipos').textContent=periodo.filter(o=>o.tipo!=="Servicio").length+" / "+periodo.filter(o=>o.tipo==="Servicio").length;
  renderTopCompras(periodo,esUSD,perTxt);
  /* ---- tendencia mensual del año ---- */
  const datos=CPK_MESES_TXT.map((m,i)=>{const mm=String(i+1).padStart(2,'0'); return [m,Math.round(validas.filter(o=>cpkAnio(o.fecha)===anio&&cpkMes(o.fecha)===mm).reduce((a,o)=>a+monto(o),0)),mm]});
  document.getElementById('cpk-chart-titulo').textContent="Tendencia de compras por mes de "+anio+" ("+(esUSD?"USD":"S/.")+")";
  const max=Math.max(...datos.map(x=>x[1]),1);
  document.getElementById('cpk-chart').innerHTML=datos.map(([m,v,mm])=>{
    const h=v>0?Math.max(6,Math.round(v/max*150)):2;
    const sel=(mes===mm);
    return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px">'+
      '<span style="font-size:11px;font-weight:600;color:'+(sel?"var(--primario)":"var(--texto-sec)")+'">'+(v?(v/1000).toFixed(1)+'K':'0')+'</span>'+
      '<div style="width:100%;max-width:56px;height:'+h+'px;border-radius:6px 6px 0 0;background:'+(sel?"var(--primario)":"#C7D4E4")+'" title="'+m+': '+fmtS(v)+'"></div>'+
      '<span style="font-size:11.5px;color:'+(sel?"var(--primario)":"var(--texto-sec)")+';font-weight:'+(sel?"700":"400")+'">'+m+'</span></div>';
  }).join('');
}
function renderTopCompras(ocs,esUSD,perTxt){
  const box=document.getElementById('cpk-top'); if(!box)return;
  document.getElementById('cpk-top-sub').textContent="Artículos con mayor monto comprado en "+perTxt+", calculados de las Órdenes de Compra (sin borradores ni canceladas, sin IGV).";
  const agg={};
  ocs.forEach(o=>{
    const tc=(o.mon==="USD")?(parseFloat(o.tc)||3.75):1;
    o.items.forEach(it=>{
      if(!agg[it.art])agg[it.art]={nom:BD.nomArt(it.art),u:BD.u(it.art),cant:0,monto:0};
      agg[it.art].cant+=it.cant;
      agg[it.art].monto+=it.cant*it.pu*(esUSD?1:tc);
    });
  });
  const top=Object.values(agg).sort((a,b)=>b.monto-a.monto).slice(0,5);
  if(!top.length){box.innerHTML='<p class="hint" style="text-align:center;padding:14px">Sin compras registradas en este período.</p>';return}
  const max=top[0].monto||1;
  const fmtS=v=>(esUSD?"USD ":"S/. ")+fmtM(v);
  const fmtC=(v,u)=>(u==="UND")?v.toLocaleString("es-PE"):fmtM(v);
  box.innerHTML=top.map((t,i)=>{
    const w=Math.max(4,Math.round(t.monto/max*100));
    return '<div style="display:grid;grid-template-columns:24px 320px 1fr 150px;gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid var(--borde)">'+
     '<span style="color:var(--texto-sec);font-size:12px">'+(i+1)+'</span>'+
     '<span style="font-size:12.5px">'+coEsc(t.nom)+'<br><span class="hint">'+fmtC(t.cant,t.u)+' '+coEsc(t.u)+' compradas</span></span>'+
     '<div style="background:#EDF1F6;border-radius:4px;height:14px"><div style="width:'+w+'%;height:14px;border-radius:4px;background:var(--primario-claro)"></div></div>'+
     '<b style="text-align:right">'+fmtS(t.monto)+'</b></div>';
  }).join('');
}
