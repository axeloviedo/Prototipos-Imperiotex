/* INVENTARIOS · GI-00 Panel de Logística calculado de la base compartida (stock, movimientos y documentos) */
function renderDash(){
  const emp=empresaAbrev();
  const filas=BD.d.stock.filter(s=>(s.act||s.comp)&&((BD.alm(s.alm)||{}).emp||emp)===emp);
  const G={MPT:{t:"MP - Telas",v:0,c:"var(--primario-claro)"},MPA:{t:"MP - Avíos",v:0,c:"#0E7490"},PT:{t:"Producto Terminado",v:0,c:"var(--confirmado)"},MERC:{t:"Mercadería",v:0,c:"var(--prp)"},PPT:{t:"Producto en proceso",v:0,c:"var(--borrador)",und:true}};
  let total=0;
  filas.forEach(s=>{
    const a=BD.art(s.art)||{}, al=BD.alm(s.alm)||{};
    const k=a.grupo==='MP'?(a.cat==='TELAS'?'MPT':'MPA'):a.grupo;
    if(!G[k])return;
    if(G[k].und){G[k].v+=s.act;return}
    if(al.kardexValorizado===false)return;
    const v=s.act*s.costo; G[k].v+=v; total+=v;
  });
  document.getElementById('kpi-fecha').textContent="Datos al "+BD.ahora()+" · base compartida ("+BD.ESCENARIOS[BD.escenario()]+")";
  document.getElementById('kpi-valor').textContent="S/. "+Fmt.m(total);
  const alms=[...new Set(filas.filter(s=>s.act).map(s=>s.alm))];
  document.getElementById('kpi-alm').textContent=alms.length;
  document.getElementById('kpi-alm-sub').textContent="de "+M().almacenes.filter(a=>a.emp===emp&&a.estado==='Activo').length+" almacenes activos ("+emp+")";
  document.getElementById('kpi-art').textContent=M().articulos.filter(a=>a.estado==="Activo"&&a.inv!==false).length;
  document.getElementById('kpi-alertas').textContent=alertasMinimo().length;
  const max=Math.max(1,...Object.values(G).filter(x=>!x.und).map(x=>x.v));
  const maxU=Math.max(1,G.PPT.v);
  document.getElementById('chart-grupos').innerHTML=Object.values(G).map(x=>{
    const pct=Math.max(2,Math.round(x.v/(x.und?maxU:max)*100));
    const label=x.und?Fmt.n(x.v)+" UND en proceso":"S/. "+Fmt.m(x.v);
    return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:11px"><div style="width:170px;font-size:12.5px;text-align:right;color:var(--texto-sec)">'+x.t+'</div>'+
     '<div style="flex:1;background:#EEF2F7;border-radius:5px;height:26px;position:relative"><div style="width:'+pct+'%;height:100%;border-radius:5px;background:'+x.c+'"></div>'+
     '<span style="position:absolute;left:10px;top:4px;font-size:12px;font-weight:600;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.35)">'+label+'</span></div></div>';
  }).join('');
  document.getElementById('dash-movs').innerHTML=BD.d.movs.slice(0,8).map(m=>'<tr class="clickable" onclick="abrirMov(\''+m.id+'\')"><td>'+m.id+'</td><td>'+(m.tipoMov||m.tipo)+'</td><td>'+Fmt.e(m.det||m.tipoMovNom||'')+'</td><td>'+Fmt.e(m.od||'')+'</td><td>'+m.fecha+'</td><td>'+Fmt.e(m.modulo||'')+'</td></tr>').join('')||'<tr><td colspan="6" style="text-align:center;color:var(--texto-sec);padding:12px">Sin movimientos todavía</td></tr>';
  const cnt=(lista,f)=>lista.filter(f).length;
  const item=(n,txt,accion)=>'<div class="hline" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span>'+txt+'</span>'+(n?'<button class="btn-link" onclick="'+accion+'"><b>'+n+'</b></button>':hint('0'))+'</div>';
  document.getElementById('dash-pend').innerHTML=
    item(cnt(BD.d.sfs,s=>s.est==='Pendiente Aprobar'),'Solicitudes de Fabricación por aprobar',"go('gi21');document.getElementById('f-sp-e').value='Pendiente Aprobar';renderSP()")+
    item(cnt(BD.d.sfs,s=>s.est==='Aprobada'),'Solicitudes de Fabricación aprobadas sin órdenes',"go('gi21');document.getElementById('f-sp-e').value='Aprobada';renderSP()")+
    item(cnt(BD.d.sols,s=>s.estado==='Pendiente'),'Solicitudes de Materiales por aprobar',"go('gi13');document.getElementById('f-sol-e').value='Pendiente';renderSol()")+
    item(cnt(BD.d.sols,s=>s.estado==='Aprobada'||s.estado==='En proceso'),'Solicitudes de Materiales por atender',"go('gi13')")+
    item(cnt(BD.d.ocs,o=>Docs.oc.recibible(o)&&Docs.oc.tieneBienes(o)),'Órdenes de Compra de bienes por recibir (GI-09)',"nuevoIngreso()");
}
RENDER.gi00=renderDash;
