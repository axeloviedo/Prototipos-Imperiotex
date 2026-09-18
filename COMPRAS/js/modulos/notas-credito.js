/* COMPRAS · CO-12 Notas de Crédito de proveedor sobre la base compartida (Docs.nc, COMPARTIDO/bd/compras.js).
   Contra una factura del mismo proveedor, motivos SUNAT 07 (devolución, desde un reclamo) · 05 (descuento: baja el costo de lo que
   sigue en stock) · 09 (disminución en el valor). Factura impaga: rebaja lo que se debe; pagada: saldo a favor del proveedor. */
/* ===== CO-12 · Notas de Crédito ===== */
const NC_EST={"Nueva":"var(--borrador)","Registrada":"var(--confirmado)","Anulada":"var(--cancelada)"};
let NCF=null; /* borrador {fac, ndoc, fecha, motivo, rec, recLinea, obs, lineas:[{art, cant, pu, igv, max}]} */
let NCid='';
function renderNC(){
  const tb=document.getElementById('nc-body'); if(!tb)return;
  const q=sinTildes(document.getElementById('f-nc-q').value||''), m=document.getElementById('f-nc-m').value, e=document.getElementById('f-nc-e').value;
  const lista=(BD.d.ncs||[]).filter(n=>(!m||n.motivo===m)&&(!e||n.estado===e)&&(!q||sinTildes(n.id+' '+n.ndoc+' '+BD.provNom(n.prov)+' '+((BD.fac(n.fac)||{}).ndoc||'')).includes(q)));
  tb.innerHTML=lista.map(n=>{const f=BD.fac(n.fac)||{};
    return '<tr class="clickable" onclick="abrirNC(\''+n.id+'\')"><td>'+n.id+'</td><td>'+coEsc(n.ndoc)+'</td><td>'+n.fecha+'</td><td>'+coEsc(BD.provNom(n.prov))+'</td>'+
      '<td>'+coEsc(f.ndoc||n.fac)+'</td><td>'+n.motivo+' · '+coEsc(n.motivoNom)+'</td><td>'+(n.rec||'-')+'</td>'+
      '<td style="text-align:right">'+coMon(n.mon)+fmtM(n.total)+'</td><td>'+n.aplicacion+((n.usos||[]).length?'<br><span class="hint">usado en '+n.usos.map(u=>(BD.fac(u.fac)||{}).ndoc||u.fac).join(', ')+' · queda '+fmtM(Docs.nc.disponible(n))+'</span>':'')+'</td><td><span class="badge" style="background:'+(NC_EST[n.estado]||'var(--borrador)')+'">'+n.estado+'</span></td></tr>';
  }).join('')||'<tr><td colspan="10" style="text-align:center;color:var(--texto-sec);padding:16px">Sin notas de crédito</td></tr>';
  document.getElementById('nc-count').textContent=lista.length+' nota(s)';
  /* saldos a favor por proveedor (notas de facturas ya pagadas) */
  const provs=[...new Set((BD.d.ncs||[]).filter(n=>Docs.nc.disponible(n)>0.004).map(n=>n.prov))];
  const bx=document.getElementById('nc-favor');
  if(provs.length){bx.style.display='block';bx.innerHTML='<b style="font-size:12.5px">Saldos a favor por usar</b> <span class="hint">(se aplican desde la ficha de la siguiente factura del proveedor, CO-10)</span> '+provs.map(p=>coEsc(BD.provNom(p))+': <b>'+fmtM(Docs.nc.saldoFavor(p))+'</b>').join(' · ');}
  else bx.style.display='none';
}
/* opciones: {rec, recLinea} para registrar la nota que resuelve una línea de un reclamo */
function nuevaNC(op){
  op=op||{}; NCid='';
  NCF={fac:'',ndoc:'',fecha:BD.hoy(),motivo:'05',rec:op.rec||'',recLinea:op.recLinea!=null?op.recLinea:null,obs:'',lineas:[]};
  if(NCF.rec){
    const r=BD.reclamo(NCF.rec), l=r&&r.lineas[NCF.recLinea];
    if(l){
      NCF.motivo=l.resol==='Devolución'?'07':BD.esServicio(l.art)?'09':'05';
      const f=BD.d.facturas.find(x=>x.oc===r.oc&&x.est!=='Anulada'&&x.items.some(i=>i.art===l.art));
      if(f)ncElegirFactura(f.id,true);
      const li=NCF.lineas.find(x=>x.art===l.art); NCF.lineas.forEach(x=>{x.cant=0}); if(li)li.cant=Math.min(l.cant,li.max);
      NCF.obs='Reclamo '+r.id+' · '+l.motivo;
    }
  }
  go('co12f'); renderNCForm();
}
function abrirNC(id){ const n=BD.nc(id); if(!n){toast('No existe la nota '+id);return} NCF=null; NCid=id; go('co12f'); renderNCForm(); }
function ncFacturas(){
  const r=NCF&&NCF.rec?BD.reclamo(NCF.rec):null;
  return BD.d.facturas.filter(f=>f.est!=='Anulada'&&Docs.nc.saldoFactura(f.id)>0.01&&(!r||f.prov===r.prov));
}
function ncElegirFactura(id,sinPintar){
  const f=BD.fac(id); NCF.fac=id||'';
  NCF.lineas=f?f.items.map(i=>({art:i.art,cant:0,pu:i.pu,igv:i.igv||0,max:i.cant})):[];
  if(!sinPintar)renderNCForm();
}
function ncTotal(lineas){return BD.r2(lineas.reduce((t,l)=>t+(Number(l.cant)||0)*(Number(l.pu)||0)*(1+(l.igv||0)/100),0))}
function renderNCForm(){
  const n=NCid?BD.nc(NCid):null, nuevo=!n, d=n||NCF; if(!d)return;
  document.getElementById('nc-titulo').textContent=nuevo?'REGISTRAR NOTA DE CRÉDITO':'NOTA DE CRÉDITO: '+n.id;
  const b=document.getElementById('nc-badge'), est=nuevo?'Nueva':n.estado; b.textContent=est; b.style.background=NC_EST[est]||'var(--borrador)';
  document.getElementById('nc-id').value=nuevo?'(se asigna al registrar)':n.id;
  const facs=nuevo?ncFacturas():[BD.fac(n.fac)].filter(Boolean);
  document.getElementById('nc-fac').innerHTML='<option value="">Seleccionar…</option>'+facs.map(f=>'<option value="'+f.id+'"'+(d.fac===f.id?' selected':'')+'>'+coEsc(f.ndoc)+' · '+coEsc(BD.provNom(f.prov))+' · saldo '+coMon(f.mon)+fmtM(Docs.nc.saldoFactura(f.id))+' ('+f.est+')</option>').join('');
  document.getElementById('nc-ndoc').value=d.ndoc||'';
  document.getElementById('nc-fecha').value=coISO(d.fecha);
  const motivos=Docs.nc.MOTIVOS;
  document.getElementById('nc-motivo').innerHTML=Object.keys(motivos).filter(k=>k!=='07'||d.rec).map(k=>'<option value="'+k+'"'+(d.motivo===k?' selected':'')+'>'+k+' · '+motivos[k]+'</option>').join('');
  document.getElementById('nc-rec').value=d.rec||'-';
  document.getElementById('nc-obs').value=d.obs||'';
  ['nc-fac','nc-ndoc','nc-fecha','nc-obs'].forEach(id=>document.getElementById(id).disabled=!nuevo);
  document.getElementById('nc-motivo').disabled=!nuevo||!!d.rec;
  document.getElementById('nc-b-guardar').style.display=nuevo?'inline-block':'none';
  document.getElementById('nc-b-anular').style.display=!nuevo&&n.estado==='Registrada'&&!n.rec&&!n.movs.length?'inline-block':'none';
  const f=BD.fac(d.fac);
  document.getElementById('nc-items').innerHTML=(d.lineas||[]).map((l,i)=>{
    const tot=BD.r2((Number(l.cant)||0)*(Number(l.pu)||0)*(1+(l.igv||0)/100));
    const it=f?f.items.find(x=>x.art===l.art):null;
    return '<tr><td>'+l.art+'</td><td>'+coEsc(BD.nomArt(l.art))+'</td><td style="text-align:right">'+fmtQ2(it?it.cant:l.max)+'</td>'+
      '<td>'+(nuevo?'<input value="'+l.cant+'" style="text-align:right" onchange="NCF.lineas['+i+'].cant=Math.min('+l.max+',Math.max(0,parseFloat(this.value)||0));renderNCForm()">':'<div style="text-align:right">'+fmtQ2(l.cant)+'</div>')+'</td>'+
      '<td>'+(nuevo?'<input value="'+l.pu+'" style="text-align:right" onchange="NCF.lineas['+i+'].pu=Math.max(0,parseFloat(this.value)||0);renderNCForm()">':'<div style="text-align:right">'+fmtM(l.pu)+'</div>')+'</td>'+
      '<td style="text-align:right">'+(l.igv||0)+'</td><td style="text-align:right">'+fmtM(tot)+'</td></tr>';
  }).join('')||'<tr><td colspan="7" style="text-align:center;color:var(--texto-sec);padding:12px">Elija la factura</td></tr>';
  const total=nuevo?ncTotal(d.lineas||[]):n.total;
  document.getElementById('nc-foot').innerHTML=(d.lineas||[]).length?'<tr><td colspan="6" style="text-align:right;font-weight:600">Total de la nota'+(f?' ('+f.mon+')':'')+'</td><td style="text-align:right;font-weight:700">'+fmtM(total)+'</td></tr>':'';
  const av=document.getElementById('nc-aviso');
  if(f){
    const pagada=f.est==='Pagado';
    let txt=nuevo?(pagada?'La factura '+coEsc(f.ndoc)+' ya está <b>pagada</b>: la nota quedará como <b>saldo a favor</b> del proveedor.':'La factura '+coEsc(f.ndoc)+' está impaga: la nota <b>rebaja lo que se debe</b> (saldo actual '+coMon(f.mon)+fmtM(Docs.nc.saldoFactura(f.id))+').')
      :'Se aplica a: <b>'+n.aplicacion+'</b>'+(n.movs.length?' · baja el costo con '+n.movs.join(', '):'')+(n.variacion&&n.variacion.length?' · a variación de existencias: '+fmtM(n.variacion.reduce((t,v)=>t+v.monto,0)):'');
    if(nuevo&&d.motivo==='05')txt+=' Motivo 05: <b>baja el costo</b> de lo que sigue en stock (lo ya consumido va a variación de existencias).';
    av.style.display='block'; av.innerHTML='<p class="hint">'+txt+'</p>';
  }else av.style.display='none';
}
function guardarNC(){
  if(!NCF)return;
  NCF.ndoc=document.getElementById('nc-ndoc').value.trim();
  NCF.fecha=coDMY(document.getElementById('nc-fecha').value)||BD.hoy();
  NCF.obs=document.getElementById('nc-obs').value;
  NCF.motivo=document.getElementById('nc-motivo').value;
  const n=coTry(()=>Docs.nc.crear({fac:NCF.fac,ndoc:NCF.ndoc,fecha:NCF.fecha,motivo:NCF.motivo,rec:NCF.rec,recLinea:NCF.recLinea,obs:NCF.obs,lineas:NCF.lineas}));
  if(!n)return;
  toast('Nota '+n.id+' registrada · '+n.aplicacion+(n.rec?' · reclamo '+n.rec+' actualizado':''));
  abrirNC(n.id); renderNC(); if(typeof renderRec==='function')renderRec(); if(typeof renderFac==='function')renderFac();
}
function anularNC(){
  coPedirMotivo('Anular '+NCid,'',motivo=>{
    const n=coTry(()=>Docs.nc.anular(NCid,motivo)); if(!n)return;
    toast(n.id+' anulada'); renderNCForm(); renderNC();
  });
}
RENDER.co12=renderNC;
RENDER.co12f=renderNCForm;
