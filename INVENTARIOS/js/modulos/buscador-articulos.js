/* INVENTARIOS · CT-03 Buscador de artículos con contexto y almacén */
/* ===== CT-03 · buscador con contexto y almacén ===== */
let ctxBuscador="gi09", ctxAlm="";
const CTX_ALM={
 gi09:["gi09-alm","el Almacén destino del ingreso"],
 gi10:["gi10-alm","el Almacén origen de la salida"],
 trf:["trf-origen","el Almacén origen de la transferencia"],
 sol:["sol-alm","el Almacén destino de la solicitud"],
 gre:["gre-alm","el Almacén de la sede (GRE)"]};
/* El buscador se alimenta del maestro de artículos: no hay catálogo duplicado.
   Costos y lotes de ejemplo solo para la demostración. */
const COSTO_REF={"MP-0012":"19.10","MP-0013":"18.80","MP-0031":"24.00","MP-0032":"24.00",
 "MP-0044":"0.35","MP-0045":"0.80","MP-0055":"3.20","MP-0061":"0.90","MP-0063":"0.45",
 "MP-0064":"0.60","MP-0071":"0.15","PT-0001":"42.30","PT-0002":"42.30","PT-0003":"42.30",
 "PPT-0021":"31.00","PPT-0022":"22.50","MERC-0205":"58.00"};
const LOTE_REF={
 "MP-0012":'<option>Nuevo lote (auto)</option><option>LOT-2026-0107 · 120.00 MT (FIFO)</option><option>LOT-2026-0121 · 162.40 MT</option>',
 "MP-0031":'<option>Nuevo lote (auto)</option><option>LOT-2026-0098 · 15 UND (FIFO)</option><option>LOT-2026-0110 · 30 UND</option>',
 "PT-0001":'<option>LOT-2026-0209 · 28 (FIFO)</option><option>LOT-2026-0212 · 12</option>',
 "PT-0002":'<option>LOT-2026-0211 · 12 (FIFO)</option>'};
let CT03_ITEMS={};
function buildCT03(){
  CT03_ITEMS={};
  ARTICULOS.filter(a=>a.e==="Activo" && a.inv==="Sí").forEach(a=>{
    CT03_ITEMS[a.id]={cod:a.id,nom:a.n,u:a.u,t:a.t,c:a.c||"",attrs:a.attrs||[],
      lote:(a.ctrl==="LOT")?(LOTE_REF[a.id]||'<option>Nuevo lote (auto)</option>'):null,
      costo:COSTO_REF[a.id]||"0.00"};
  });
}
function fillCT03Filtros(){
  const g=document.getElementById('ct03-g'); if(!g)return;
  g.innerHTML='<option value="">Todos</option>'+TIPOS.map(t=>'<option>'+t.nom+'</option>').join('');
  document.getElementById('ct03-atr').innerHTML='<option value="">Cualquiera</option>'+ATRIBUTOS.map(x=>'<option>'+x.nom+'</option>').join('');
  fillCT03Cat(); fillCT03Val();
}
function fillCT03Cat(){
  const t=document.getElementById('ct03-g').value;
  const opts=CATEGORIAS.filter(c=>!t||c.tipo===t);
  document.getElementById('ct03-c').innerHTML='<option value="">Todas</option>'+opts.map(c=>'<option>'+c.nom+'</option>').join('');
}
function fillCT03Val(){
  const nom=document.getElementById('ct03-atr').value;
  const a=ATRIBUTOS.find(x=>x.nom===nom);
  document.getElementById('ct03-val').innerHTML='<option value="">Cualquiera</option>'+((a?a.vals:[]).map(v=>'<option>'+v+'</option>').join(''));
}
function openBuscador(ctx){
  const cfg=CTX_ALM[ctx];
  const alm=document.getElementById(cfg[0]).value;
  if(!alm){toast("Seleccione primero "+cfg[1]+" para ver su stock disponible");return}
  ctxBuscador=ctx; ctxAlm=alm;
  buildCT03(); fillCT03Filtros(); renderCT03(); openModal('m-ct03');
}
function ct03Disp(nom){const r=findStock(ctxAlm,nom);return r?Math.round((r.real-r.res)*100)/100:0}
function renderCT03(){
  document.getElementById('ct03-chip').textContent=ctxAlm;
  document.getElementById('ct03-colstock').innerHTML='Disponible en almacén <span class="warn" title="Calculado sobre el almacén del documento: destino en ingresos y solicitudes, origen en salidas y transferencias, el de la sede en GRE">⚠</span>';
  const warnCtx=(ctxBuscador==="gi10"||ctxBuscador==="trf");
  const q=(document.getElementById('ct03-q').value||"").toLowerCase();
  const fg=document.getElementById('ct03-g').value, fc=document.getElementById('ct03-c').value;
  const fa=document.getElementById('ct03-atr').value, fv=document.getElementById('ct03-val').value;
  const tb=document.getElementById('ct03-body'); tb.innerHTML="";
  const grupos={};
  Object.keys(CT03_ITEMS).forEach(k=>{
    const it=CT03_ITEMS[k];
    if(q && !(it.cod.toLowerCase().includes(q)||sinTildes(it.nom).includes(sinTildes(q))))return;
    if(fg && it.t!==fg)return;
    if(fc && it.c!==fc)return;
    if(fa){ const par=it.attrs.find(x=>x[0]===fa); if(!par)return; if(fv && par[1]!==fv)return; }
    (grupos[it.t]=grupos[it.t]||[]).push(k);
  });
  Object.keys(grupos).forEach(g=>{
    tb.innerHTML+='<tr><td colspan="6" style="background:#F8FAFC;font-weight:600;font-size:12px;color:var(--texto-sec)">'+g+'</td></tr>';
    grupos[g].forEach(k=>{
      const it=CT03_ITEMS[k], d=ct03Disp(it.nom), sin=d<=0;
      const fmtD=(it.u==="UND")?String(d):d.toFixed(2);
      const attrTxt=it.attrs.length?(' <span class="hint">'+it.attrs.map(x=>x[0]+": "+x[1]).join(" · ")+'</span>'):'';
      tb.innerHTML+='<tr'+(sin&&warnCtx?' style="background:#FEF2F2"':'')+'><td>'+it.cod+'</td><td>'+it.nom+attrTxt+(sin&&warnCtx?' <span class="hint">Sin stock en el origen</span>':'')+'</td><td>'+it.u+'</td><td>'+(it.lote?"Sí":"No")+'</td>'+
       '<td style="text-align:right;'+(sin?'color:var(--stock-cero);font-weight:600':'')+'">'+fmtD+'</td>'+
       '<td><button class="btn btn-primary btn-sm" onclick="addFromCT03(\''+k+'\')">Agregar</button></td></tr>';
    });
  });
  if(!tb.innerHTML)tb.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--texto-sec);padding:16px">Ningún artículo coincide con los filtros</td></tr>';
}
function addFromCT03(k){
  const it=CT03_ITEMS[k]; closeModal('m-ct03');
  const d=ct03Disp(it.nom);
  if(ctxBuscador==="sol"){
    SOL.lines.push({cod:it.cod,nom:it.nom,u:it.u,qty:1,prop:"",origen:"",doc:""}); renderSOLform();
  }else if(ctxBuscador==="gre"){
    const tb=document.getElementById('gre-items'); const n=tb.rows.length+1; const tr=tb.insertRow();
    tr.innerHTML='<td>'+n+'</td><td>'+it.cod+'</td><td>'+it.nom+'</td><td>'+it.u+'</td><td><input value="1" style="text-align:right"></td><td><button class="btn-link">Eliminar</button></td>';
  }else if(ctxBuscador==="trf"){
    TRF.lines.push({cod:it.cod,nom:it.nom,u:it.u,env:1,rec:0,lote:it.lote?"LOT-2026-0110":"No aplica"}); renderTRF();
    if(d<=0){toast("Advertencia: sin stock disponible en el origen; la línea quedará pendiente al aprobar");return}
  }else if(ctxBuscador==="gi10"){
    const linked=document.getElementById('gi10-head').innerText.includes("Solicitada");
    const tb=document.getElementById('gi10-items'); const n=tb.rows.length+1; const tr=tb.insertRow();
    const lote=it.lote?'<td><select style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px">'+it.lote+'</select></td>':'<td><span class="hint">No aplica</span></td>';
    if(linked){
      tr.innerHTML='<td>'+n+'</td><td>'+it.cod+'</td><td>'+it.nom+'</td><td>'+it.u+'</td><td><input value="1" style="text-align:right"></td>'+lote+'<td><button class="btn-link">Eliminar</button></td>';
    }else{
      tr.innerHTML='<td>'+n+'</td><td>'+it.cod+'</td><td>'+it.nom+'</td><td>'+it.u+'</td><td><input value="1.00" style="text-align:right"></td><td><input value="'+it.costo+'" style="text-align:right"></td>'+lote+'<td><button class="btn-link">Eliminar</button></td>';
    }
    if(d<=0){toast("Advertencia: sin stock disponible en el origen; la salida quedará en parcial/pendiente");return}
  }else{
    const tb=document.getElementById('gi09-items'); const n=tb.rows.length+1; const tr=tb.insertRow();
    tr.innerHTML='<td>'+n+'</td><td>'+it.cod+'</td><td>'+it.nom+'</td><td>'+it.u+'</td><td><input value="1.00" style="text-align:right"></td><td><input value="'+it.costo+'" style="text-align:right"></td><td>'+(it.lote?'<select style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px">'+it.lote+'</select>':'<span class="hint">No aplica</span>')+'</td><td><button class="btn-link">Eliminar</button></td>';
  }
  toast("Artículo agregado");
}
