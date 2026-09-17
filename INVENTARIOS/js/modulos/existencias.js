/* INVENTARIOS · GI-05 Existencias sobre BD.d.stock (Stock.*) y Stock Pedido desde las OC de bienes aprobadas */
/* cantidad pendiente de ingreso por almacén y artículo (OC aprobadas no recibidas del todo) */
function stockPedido(){
  const p={};
  /* la base lleva el Pedido en stock.ped (OC aprobadas y transferencias aprobadas, T1); si aún no existe se calcula de las OC */
  if(BD.d.stock.some(s=>s.ped!==undefined)||Array.isArray(BD.d.trfs)){BD.d.stock.forEach(s=>{if(s.ped>0)p[s.alm+'|'+s.art]=s.ped});return p}
  BD.d.ocs.filter(o=>Docs.oc.recibible(o)&&o.tipo!=='Servicio').forEach(o=>o.items.forEach(i=>{
    const falta=BD.r4(i.cant-i.recq); if(!(falta>0)||!Stock.inventariable(i.art))return;
    const k=(o.almDestino||'')+'|'+i.art; p[k]=BD.r4((p[k]||0)+falta);
  }));
  return p;
}
/* stock mínimo único del artículo (L9): el mismo valor se compara con el disponible de cada almacén */
function minimoDe(alm,art){return (BD.art(art)||{}).stockMin||0}
/* filas almacén × artículo con mínimo y disponible ≤ mínimo (alertas del panel y de la campana) */
function alertasMinimo(){const emp=empresaAbrev();return BD.d.stock.filter(s=>minimoDe(s.alm,s.art)&&((BD.alm(s.alm)||{}).emp||emp)===emp).map(s=>({alm:s.alm,art:s.art,cant:minimoDe(s.alm,s.art),disp:BD.r4(s.act-s.comp)})).filter(x=>x.disp<=x.cant)}
function semaforo(alm,art,disp){if(disp<=0)return 'cero';const mn=minimoDe(alm,art);return mn&&disp<=mn?'bajo':'ok'}
const SEM_COLOR={ok:"var(--stock-ok)",bajo:"var(--stock-bajo)",cero:"var(--stock-cero)"};
const SEM_TXT={ok:"Normal",bajo:"Por agotarse",cero:"Agotado"};

function fillStockFilters(){
  const a=document.getElementById('f-stk-a'); if(!a)return;
  const va=a.value; a.innerHTML=opcionesAlm(va,null,'Todos los almacenes');
  const g=document.getElementById('f-stk-g'), vg=g.value;
  g.innerHTML=opcionesLista(M().grupos.filter(x=>x.inv!==false).map(x=>({v:x.cod,t:x.cod+' · '+x.nom})),vg,'Todos');
  fillStockCat();
}
function fillStockCat(){
  const g=document.getElementById('f-stk-g').value, c=document.getElementById('f-stk-sg'), v=c.value;
  c.innerHTML=opcionesLista(M().categorias.filter(x=>!g||x.grupo===g).map(x=>x.nom),v,'Todas'); fillStockSub();
}
function fillStockSub(){
  const c=document.getElementById('f-stk-sg').value, s=document.getElementById('f-stk-ssg'), v=s.value;
  s.innerHTML=opcionesLista([...new Set(M().subcategorias.filter(x=>!c||x.cat===c).map(x=>x.nom))],v,'Todas');
}
/* filas de existencias con los filtros activos */
function filasStock(){
  const q=Fmt.s(document.getElementById('f-stk-q').value), fa=document.getElementById('f-stk-a').value;
  const g=document.getElementById('f-stk-g').value, sg=document.getElementById('f-stk-sg').value, ssg=document.getElementById('f-stk-ssg').value;
  const ped=stockPedido(), filas={}, emp=empresaAbrev();
  BD.d.stock.forEach(s=>{ if(s.act||s.comp||s.ped) filas[s.alm+'|'+s.art]={alm:s.alm,art:s.art,act:s.act,comp:s.comp,costo:s.costo}; });
  Object.keys(ped).forEach(k=>{ if(!filas[k]){const x=k.split('|'); if(x[0])filas[k]={alm:x[0],art:x[1],act:0,comp:0,costo:Stock.costo(x[0],x[1])};} });
  return Object.values(filas).map(r=>{
    const a=BD.art(r.art)||{}, al=BD.alm(r.alm)||{};
    r.ped=ped[r.alm+'|'+r.art]||0; r.disp=BD.r4(r.act-r.comp); r.sem=semaforo(r.alm,r.art,r.disp); r.a=a; r.al=al;
    return r;
  }).filter(r=>{
    if((r.al.emp||emp)!==emp)return false;
    if(fa&&r.alm!==fa)return false;
    if(q&&!(Fmt.s(r.art).includes(q)||Fmt.s(r.a.nom).includes(q)))return false;
    if(g&&r.a.grupo!==g)return false; if(sg&&r.a.cat!==sg)return false; if(ssg&&r.a.subcat!==ssg)return false;
    return document.getElementById('f-sem-'+r.sem).checked;
  }).sort((x,y)=>x.alm.localeCompare(y.alm)||x.art.localeCompare(y.art));
}
function renderStock(){
  const filas=filasStock(); let val=0;
  document.getElementById('stk-body').innerHTML=filas.map(r=>{
    const u=r.a.u||'', v=r.al.kardexValorizado===false?null:BD.r2(r.act*r.costo); if(v)val+=v;
    return '<tr title="Disponible = Actual − Comprometido"><td><span class="dot" style="background:'+SEM_COLOR[r.sem]+'" title="'+SEM_TXT[r.sem]+(minimoDe(r.alm,r.art)?' · mínimo '+minimoDe(r.alm,r.art):'')+'"></span></td>'+
     '<td>'+r.alm+'<br><span class="hint">'+Fmt.e(r.al.nom||'')+'</span></td>'+
     '<td><button class="btn-link" onclick="verKardex(\''+r.art+'\',\''+r.alm+'\')">'+r.art+'</button> · '+Fmt.e(r.a.nom||'')+'</td><td>'+u+'</td>'+
     '<td style="text-align:right">'+Fmt.n(r.act)+'</td>'+
     '<td style="text-align:right">'+(r.comp?Fmt.n(r.comp):hint('-'))+'</td>'+
     '<td style="text-align:right">'+(r.ped?Fmt.n(r.ped):hint('-'))+'</td>'+
     '<td style="text-align:right;'+(r.disp<0?'color:var(--cancelada);':'')+'"><b>'+Fmt.n(r.disp)+'</b></td>'+
     '<td style="text-align:right">'+(v==null?hint('Solo cant.'):Fmt.m(r.costo))+'</td>'+
     '<td style="text-align:right">'+(v==null?hint('-'):Fmt.m(v))+'</td>'+
     '<td><button class="btn-link" onclick="verKardex(\''+r.art+'\',\''+r.alm+'\')">Kardex</button></td></tr>';
  }).join('')||'<tr><td colspan="11" style="text-align:center;color:var(--texto-sec);padding:18px">'+(BD.d.stock.length?'Sin existencias para los filtros elegidos':'Sin existencias: la base está en «Solo maestros». Registre un ingreso (GI-09) o reciba una OC.')+'</td></tr>';
  document.getElementById('stk-foot').innerHTML=filas.length?'<tr><td colspan="9" style="text-align:right;font-weight:600">TOTAL VALORIZADO</td><td style="text-align:right;font-weight:700">S/. '+Fmt.m(val)+'</td><td></td></tr>':'';
  document.getElementById('stk-count').textContent=filas.length+" registros de existencias";
}
RENDER.gi05=()=>{fillStockFilters();renderStock()};
function exportStockCSV(){
  const rows=[["Estado","Almacén","Código","Artículo","Unidad","Stock Actual","Comprometido","Pedido","Disponible","Costo promedio","Valorizado"]];
  filasStock().forEach(r=>rows.push([SEM_TXT[r.sem],r.alm,r.art,r.a.nom,r.a.u,r.act,r.comp,r.ped,r.disp,r.costo,BD.r2(r.act*r.costo)]));
  const csv="﻿"+rows.map(r=>r.map(c=>'"'+String(c==null?'':c).replace(/"/g,'""')+'"').join(";")).join("\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const aEl=document.createElement('a'); aEl.href=url; aEl.download="Existencias_"+BD.hoy().split('/').reverse().join('-')+".csv";
  document.body.appendChild(aEl); aEl.click(); aEl.remove(); URL.revokeObjectURL(url);
  toast("Exportadas "+(rows.length-1)+" filas con los filtros activos");
}
