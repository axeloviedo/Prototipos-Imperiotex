/* COMPRAS · CO-15 Sugerido de Compras sobre la base compartida (Docs.sug, COMPARTIDO/bd/compras.js).
   Sugerido = Stock mínimo + Órdenes abiertas sin Solicitud de Materiales − Disponible − Pedido. Se crea la OC por proveedor por defecto. */
/* ===== CO-15 · Sugerido de Compras ===== */
const SUG={cant:{}}; /* cantidades a comprar editadas por el usuario: {art: cantidad} */
function sugFormula(r){
  return 'Stock mínimo '+fmtQ(r.min,r.u)+' + órdenes sin solicitud '+fmtQ(r.ordenes,r.u)+(r.ofs.length?' ('+r.ofs.join(', ')+')':'')+
    ' − disponible '+fmtQ(r.disp,r.u)+' − pedido '+fmtQ(r.ped,r.u)+' = '+(r.sug>0?fmtQ(r.sug,r.u)+' '+r.u:'cubierto');
}
function fmtQ(v,u){v=Number(v)||0;return (u==="UND")?Math.ceil(v).toLocaleString("es-PE"):v.toLocaleString("es-PE",{minimumFractionDigits:0,maximumFractionDigits:2})}
function sugComprar(r){return SUG.cant[r.art]!=null?SUG.cant[r.art]:r.sug}
function renderSugerido(){
  const tb=document.getElementById('co15-body'); if(!tb)return;
  const filas=Docs.sug.calcular();
  const selG=document.getElementById('f-sug-g'), selP=document.getElementById('f-sug-p');
  const llenar=(sel,vals,txt)=>{const v=sel.value;sel.innerHTML='<option value="">Todos</option>'+vals.map(x=>'<option value="'+x+'">'+coEsc(txt(x))+'</option>').join('');sel.value=vals.includes(v)?v:'';};
  llenar(selG,[...new Set(filas.map(r=>r.grupo))].sort(),x=>x);
  llenar(selP,[...new Set(filas.map(r=>r.prov||'-'))].sort(),x=>x==='-'?'(sin proveedor por defecto)':BD.provNom(x));
  const fq=sinTildes(document.getElementById('f-sug-q').value||''), fg=selG.value, fp=selP.value, solo=document.getElementById('f-sug-solo').checked;
  const lista=filas.filter(r=>(!fq||sinTildes(r.art+' '+r.nom).includes(fq))&&(!fg||r.grupo===fg)&&(!fp||(r.prov||'-')===fp)&&(!solo||r.sug>0));
  const porProv={}; lista.forEach(r=>(porProv[r.prov||'-']=porProv[r.prov||'-']||[]).push(r));
  let html='';
  Object.keys(porProv).sort().forEach(p=>{
    const g=porProv[p], conSug=g.filter(r=>sugComprar(r)>0);
    html+='<tr style="background:var(--fondo-sec,#F8FAFC)"><td colspan="7"><b>'+(p==='-'?'Sin proveedor por defecto':coEsc(BD.provNom(p))+' <span class="hint">'+p+'</span>')+'</b> <span class="hint">· '+g.length+' artículo(s)</span></td>'+
      '<td colspan="2" style="text-align:right">'+(p!=='-'&&conSug.length?'<button class="btn btn-primary btn-sm" onclick="sugCrearOC(\''+p+'\')">Crear OC ('+conSug.length+')</button>':(p==='-'?'<span class="hint">asigne el proveedor en GI-02</span>':''))+'</td></tr>';
    g.forEach(r=>{
      html+='<tr><td>'+r.art+'</td><td>'+coEsc(r.nom)+'</td><td>'+r.u+'</td>'+
        '<td style="text-align:right">'+(r.min?fmtQ(r.min,r.u):'-')+'</td>'+
        '<td style="text-align:right"'+(r.ofs.length?' title="'+r.ofs.join(', ')+'"':'')+'>'+(r.ordenes?fmtQ(r.ordenes,r.u):'-')+'</td>'+
        '<td style="text-align:right;'+(r.disp<0?'color:var(--cancelada);font-weight:600':'')+'">'+fmtQ(r.disp,r.u)+'</td>'+
        '<td style="text-align:right">'+(r.ped?fmtQ(r.ped,r.u):'-')+'</td>'+
        '<td style="text-align:right;cursor:help" title="'+coEsc(sugFormula(r))+'">'+(r.sug>0?'<b style="color:var(--primario)">'+fmtQ(r.sug,r.u)+'</b>':'<span class="badge" style="background:var(--confirmado)">Cubierto</span>')+'</td>'+
        '<td><input value="'+sugComprar(r)+'" style="text-align:right;width:110px" onchange="SUG.cant[\''+r.art+'\']=Math.max(0,parseFloat(this.value)||0);renderSugerido()"></td></tr>';
    });
  });
  tb.innerHTML=html||'<tr><td colspan="9" style="text-align:center;color:var(--texto-sec);padding:16px">Nada que comprar con los filtros aplicados: el stock, lo pedido y las solicitudes cubren la necesidad</td></tr>';
  document.getElementById('co15-count').textContent=lista.length+' artículo(s) · '+lista.filter(r=>r.sug>0).length+' por comprar · pase el mouse sobre el Sugerido para ver la cuenta';
}
function sugCrearOC(prov){
  const filas=Docs.sug.calcular().filter(r=>r.prov===prov).map(r=>({art:r.art,cant:sugComprar(r),alm:r.alm})).filter(r=>r.cant>0);
  if(!filas.length){toast('No hay cantidades a comprar para este proveedor');return}
  const alms=[...new Set(filas.map(r=>r.alm).filter(Boolean))];
  const o=coTry(()=>Docs.sug.crearOC(prov,filas,alms.length===1?alms[0]:''));
  if(!o)return;
  filas.forEach(r=>{delete SUG.cant[r.art]});
  toast('OC '+o.id+' creada en Borrador con '+filas.length+' artículo(s): revise precios y almacén antes de enviarla');
  abrirOC(o.id);
}
RENDER.co15=renderSugerido;
