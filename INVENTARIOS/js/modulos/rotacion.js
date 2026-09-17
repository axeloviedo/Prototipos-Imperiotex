/* INVENTARIOS · GI-18 Rotación de Artículos · sobre la base compartida (BD.d.stock + BD.d.movs).
   Cada fila es (almacén × artículo) con stock actual: días desde su último movimiento en ese almacén,
   valor al costo promedio del almacén y semáforo de rotación. */
function rotSem(d){
  if(d>180)return["Crítico >180 días","var(--cancelada)"];
  if(d>90)return["Inmovilizado","#C2410C"];
  if(d>30)return["Vigilar","var(--pendiente)"];
  return["Rota bien","var(--confirmado)"];
}
/* días entre una fecha dd/mm/aaaa [hh:mm] y hoy; sin fecha, vacío */
function rotDias(f){
  if(!f)return null;
  const p=String(f).split(' ')[0].split('/'); if(p.length!==3)return null;
  const d=new Date(Number(p[2]),Number(p[1])-1,Number(p[0])), hoy=Fmt.iso(BD.hoy()).split('-');
  const h=new Date(Number(hoy[0]),Number(hoy[1])-1,Number(hoy[2]));
  return Math.max(0,Math.round((h-d)/86400000));
}
/* filas de rotación: stock con Actual > 0, con su último ingreso y última salida */
function rotFilas(){
  const ult={};
  BD.d.movs.forEach(m=>m.lineas.forEach(l=>{
    const k=l.alm+'|'+l.art, u=ult[k]=ult[k]||{ing:'',sal:''};
    const campo=l.signo>0?'ing':'sal';
    if(!u[campo]||Fmt.num(m.fecha)>=Fmt.num(u[campo]))u[campo]=m.fecha;
  }));
  return BD.d.stock.filter(s=>s.act>0.00005).map(s=>{
    const a=BD.art(s.art)||{}, u=ult[s.alm+'|'+s.art]||{ing:'',sal:''};
    const dIng=rotDias(u.ing), dSal=rotDias(u.sal);
    const dias=[dIng,dSal].filter(x=>x!=null);
    return { art:s.art, nom:a.nom||s.art, alm:s.alm, almNom:BD.almNom(s.alm), grupo:a.grupo||'', cat:a.cat||'',
      stock:s.act, u:a.u||'', valor:BD.r2(s.act*(s.costo||0)), uing:u.ing?u.ing.slice(0,10):'', usal:u.sal?u.sal.slice(0,10):'',
      dias:dias.length?Math.min.apply(null,dias):null };
  });
}
function rotGrupoNom(cod){const g=BD.d.maestros.grupos.find(x=>x.cod===cod);return g?g.nom:cod}
function renderRot(){
  const F=rotFilas();
  const selA=document.getElementById('f-rot-alm'), selS=document.getElementById('f-rot-sg'), selG=document.getElementById('f-rot-g');
  const opciones=(sel,valores,textos)=>{
    const v=sel.value;
    sel.innerHTML='<option value="">'+sel.dataset.todos+'</option>'+valores.map((x,i)=>'<option value="'+Fmt.e(x)+'">'+Fmt.e(textos?textos[i]:x)+'</option>').join('');
    sel.value=valores.indexOf(v)>=0?v:'';
  };
  const alms=[...new Set(F.map(r=>r.alm))].sort();
  const grupos=[...new Set(F.map(r=>r.grupo))].filter(Boolean).sort();
  const cats=[...new Set(F.map(r=>r.cat))].filter(Boolean).sort();
  opciones(selA,alms,alms.map(c=>c+' · '+BD.almNom(c)));
  opciones(selG,grupos,grupos.map(rotGrupoNom));
  opciones(selS,cats);
  const fa=selA.value, fs=selS.value, fg=selG.value, fq=Fmt.s(document.getElementById('f-rot-q').value||''), fd=parseInt(document.getElementById('f-rot-d').value)||0;
  const lista=F.filter(r=>{
    if(fa&&r.alm!==fa)return false; if(fg&&r.grupo!==fg)return false; if(fs&&r.cat!==fs)return false;
    if(fq&&!Fmt.s(r.art+' '+r.nom).includes(fq))return false;
    if(fd&&!(r.dias!=null&&r.dias>fd))return false;
    return true;
  }).sort((a,b)=>(b.dias==null?-1:b.dias)-(a.dias==null?-1:a.dias));
  document.getElementById('rot-body').innerHTML=lista.map(r=>{
    const[t,c]=r.dias==null?["Sin movimientos","var(--borrador)"]:rotSem(r.dias);
    return '<tr><td><b>'+r.art+'</b><br><span class="mini">'+Fmt.e(r.nom)+'</span></td><td>'+r.alm+'<br><span class="mini">'+Fmt.e(r.almNom)+'</span></td>'+
      '<td style="text-align:right">'+Fmt.q(r.stock,r.u)+'</td>'+
      '<td style="text-align:right">'+Fmt.m(r.valor)+'</td>'+
      '<td>'+(r.uing||hint('-'))+'</td><td>'+(r.usal||hint('-'))+'</td>'+
      '<td style="text-align:right;font-weight:700;'+(r.dias>90?'color:var(--cancelada)':'')+'">'+(r.dias==null?'—':r.dias)+'</td>'+
      '<td><span class="badge" style="background:'+c+'">'+t+'</span></td></tr>';
  }).join('')||'<tr><td colspan="8" class="hint" style="text-align:center;padding:18px">Sin artículos con stock</td></tr>';
  document.getElementById('rot-count').textContent=lista.length+" artículos";
  const inm=F.filter(r=>r.dias!=null&&r.dias>90);
  document.getElementById('rot-valor').textContent="S/. "+Fmt.m(inm.reduce((a,r)=>a+r.valor,0));
  document.getElementById('rot-count90').textContent=inm.length;
  const conDias=F.filter(r=>r.dias!=null);
  document.getElementById('rot-edad').textContent=conDias.length?Math.round(conDias.reduce((a,r)=>a+r.dias,0)/conDias.length)+" días":"—";
}

RENDER.gi18=renderRot;
