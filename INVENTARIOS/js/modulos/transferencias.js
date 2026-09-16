/* INVENTARIOS · GI-11 Solicitud de Transferencia */
/* ===== GI-11 · Transferencia (doble paso) ===== */
const TRF={estado:"Borrador",lines:[
 {cod:"ART-0001-28AZ",nom:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",u:"UND",env:6,rec:0,lote:"REF-2026-0009"},
 {cod:"ART-0001-30AZ",nom:"PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL",u:"UND",env:4,rec:0,lote:"REF-2026-0011"}
]};
const TRF_BADGE={"Borrador":["Borrador","var(--borrador)"],"Aprobada":["Aprobada / En tránsito","var(--aprobada)"],
 "Parcial":["Recibida parcial","var(--parcial)"],"Completada":["Completada","var(--completada)"],"Cancelada":["Cancelada","var(--cancelada)"]};
function findStock(alm,art){return STOCK.find(r=>r.alm===alm&&r.art===art)}
function trfPend(l){return l.env-l.rec}
function renderTRF(){
  const e=TRF.estado, tb=document.getElementById('trf-items'); tb.innerHTML="";
  TRF.lines.forEach((l,i)=>{
    const tr=document.createElement('tr');
    const envCell=(e==="Borrador")?'<td><input value="'+l.env+'" style="text-align:right" oninput="TRF.lines['+i+'].env=parseFloat(this.value)||0"></td>':'<td style="text-align:right">'+l.env+'</td>';
    const recCell=(e==="Borrador")?'<td style="text-align:right">-</td>':'<td style="text-align:right">'+l.rec+'</td>';
    const pend=trfPend(l);
    const pendCell=(e==="Borrador")?'<td style="text-align:right">-</td>':'<td style="text-align:right;'+(pend>0?'color:var(--pendiente);font-weight:600':'')+'">'+pend+'</td>';
    tr.innerHTML='<td>'+(i+1)+'</td><td>'+l.cod+'</td><td>'+l.nom+'</td><td>'+l.u+'</td>'+envCell+recCell+pendCell+
     '<td>'+l.lote+' <span class="hint">(viaja idéntico)</span></td>'+
     '<td>'+(e==="Borrador"?'<button class="btn-link">Eliminar</button>':'')+'</td>';
    tb.appendChild(tr);
  });
  const b=TRF_BADGE[e];
  const badge=document.getElementById('trf-badge'); badge.textContent=b[0]; badge.style.background=b[1];
  const show=(id,v)=>document.getElementById(id).style.display=v?"inline-block":"none";
  show('trf-b-cancelar',e==="Borrador"); show('trf-b-guardar',e==="Borrador"); show('trf-b-aprobar',e==="Borrador");
  show('trf-b-add',e==="Borrador");
  show('trf-b-recibir',e==="Aprobada"||e==="Parcial");
  show('trf-b-nota',e==="Aprobada"||e==="Parcial"||e==="Completada");
  show('trf-b-cancelpend',e==="Parcial");
  show('trf-b-volver',e==="Completada"||e==="Cancelada");
  document.getElementById('trf-origen').disabled=(e!=="Borrador");
  document.getElementById('trf-destino').disabled=(e!=="Borrador");
}
function resetTRF(){
  TRF.estado="Borrador"; TRF.lines.forEach(l=>{l.rec=0});
  document.getElementById('trf-origen').value=""; document.getElementById('trf-destino').value="";
  renderTRF(); go('gi11');
}
function aprobarTRF(){
  const o=document.getElementById('trf-origen').value, d=document.getElementById('trf-destino').value;
  if(!o||!d){toast("Debe seleccionar Almacén origen y Almacén destino (obligatorios)");return}
  if(o===d){toast("El almacén origen y el destino no pueden ser el mismo");return}
  TRF.origen=o; TRF.destino=d; TRF.estado="Aprobada";
  TRF.lines.forEach(l=>{
    const so=findStock(o,l.nom); if(so){so.res+=l.env}
    let sd=findStock(d,l.nom);
    if(!sd){sd={alm:d,art:l.nom,u:l.u,real:0,res:0,esp:0,sem:"cero",lot:null,t:"PRODUCTOS TERMINADOS",c:"PANTALÓN",sc:""};STOCK.push(sd)}
    sd.esp+=l.env;
  });
  renderTRF(); renderStock();
  toast("Transferencia aprobada: stock Comprometido en origen y Pedido en destino (ver Existencias)");
}
function abrirRecepcion(){
  const tb=document.getElementById('rec-items'); tb.innerHTML="";
  TRF.lines.forEach((l,i)=>{
    const pend=trfPend(l); if(pend<=0)return;
    tb.innerHTML+='<tr><td>'+l.cod+'</td><td>'+l.nom+'</td><td style="text-align:right">'+pend+'</td>'+
     '<td><input id="rec-'+i+'" value="'+pend+'" style="text-align:right;width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px"></td></tr>';
  });
  openModal('m-gi11a');
}
function confirmarRecepcion(){
  closeModal('m-gi11a');
  TRF.lines.forEach((l,i)=>{
    const inp=document.getElementById('rec-'+i); if(!inp)return;
    let r=Math.max(0,Math.min(trfPend(l),parseFloat(inp.value)||0));
    if(r>0){
      const so=findStock(TRF.origen,l.nom); if(so){so.real-=r; so.res-=r}
      const sd=findStock(TRF.destino,l.nom); if(sd){sd.real+=r; sd.esp-=r; sd.sem=(sd.real-sd.res)>0?"ok":sd.sem}
      l.rec+=r;
    }
  });
  const pendTotal=TRF.lines.reduce((a,l)=>a+trfPend(l),0);
  TRF.estado=(pendTotal>0)?"Parcial":"Completada";
  renderTRF(); renderStock();
  toast(pendTotal>0?"Recepción parcial confirmada: pendiente registrado":"Recepción completa: Kardex en ambos almacenes, transferencia Completada");
}
function cancelarPendientes(){
  closeModal('m-gi11b');
  TRF.lines.forEach(l=>{
    const pend=trfPend(l); if(pend<=0)return;
    const so=findStock(TRF.origen,l.nom); if(so){so.res-=pend}
    const sd=findStock(TRF.destino,l.nom); if(sd){sd.esp-=pend}
  });
  TRF.estado="Cancelada"; renderTRF(); renderStock();
  toast("Pendientes cancelados: reserva liberada y devuelta al stock del origen");
}
