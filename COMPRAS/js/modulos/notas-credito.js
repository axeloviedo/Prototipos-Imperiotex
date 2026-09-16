/* COMPRAS · CO-12 Notas de Crédito — DATOS DE EJEMPLO · no conectado a la base compartida (docs/16 §5) */
/* ===== CO-12 · Notas de Crédito ===== */
let NCS=[
 {id:"NC-000009",prov:"AVÍOS DEL SUR EIRL",ock:"oc225",oc:"OC-000225",rec:"REC-000008",reck:"r8",monto:96.00,mon:"S/.",
  est:"Pendiente",freg:"12/07/2026",fapl:"",fac:""},
 {id:"NC-000006",prov:"TEXTIL SAN JACINTO SAC",ock:"oc231",oc:"OC-000231",rec:"REC-000002",reck:"",monto:242.50,mon:"S/.",
  est:"Aplicada",freg:"20/05/2026",fapl:"28/05/2026",fac:"F212-00829"}
];
let NC_SEQ=10, ncIdx=-1;
function renderNC(){
  const q=(document.getElementById('f-nc-q').value||"").toLowerCase();
  const e=document.getElementById('f-nc-e').value, pv=document.getElementById('f-nc-p').value;
  const selP=document.getElementById('f-nc-p');
  if(selP.options.length<=1)selP.innerHTML='<option value="">Todos</option>'+[...new Set(NCS.map(x=>x.prov))].map(x=>'<option>'+x+'</option>').join('');
  const tb=document.getElementById('nc-body'); tb.innerHTML=""; let n=0, pend=0;
  NCS.forEach((x,i)=>{
    if(q && !(x.id.toLowerCase().includes(q)||sinTildes(x.prov).includes(sinTildes(q))||x.oc.toLowerCase().includes(q)))return;
    if(e && x.est!==e)return; if(pv && x.prov!==pv)return;
    n++; if(x.est==="Pendiente")pend+=x.monto;
    const tr=document.createElement('tr');
    tr.innerHTML='<td>'+x.id+'</td><td>'+x.prov+'</td>'+
     '<td><button class="btn-link" onclick="recVerOC(\''+x.ock+'\')">'+x.oc+'</button></td>'+
     '<td>'+(x.reck?('<button class="btn-link" onclick="loadRec(\''+x.reck+'\')">'+x.rec+'</button>'):x.rec)+'</td>'+
     '<td style="text-align:right;font-weight:600">'+fmtM(x.monto)+'</td><td>'+x.mon+'</td>'+
     '<td><span class="badge" style="background:'+(x.est==="Pendiente"?"var(--pendiente)":"var(--confirmado)")+'">'+x.est+'</span></td>'+
     '<td>'+x.freg+'</td><td>'+(x.fapl||"-")+'</td><td>'+(x.fac||"-")+'</td>'+
     '<td>'+(x.est==="Pendiente"?'<button class="btn-link" onclick="preAplicarNC('+i+')">Marcar Aplicada</button>':'<span class="hint">-</span>')+'</td>';
    tb.appendChild(tr);
  });
  document.getElementById('nc-count').innerHTML=n+" notas de crédito"+(pend>0?' · <b style="color:var(--pendiente)">Pendientes por aplicar: S/. '+fmtM(pend)+'</b>':'');
}
function nuevaNC(){toast("Una NC nace de un reclamo procedente con salida Nota de Crédito (CO-11): regístrela desde el reclamo para conservar la trazabilidad");go('co11')}
function preAplicarNC(i){
  ncIdx=i; const x=NCS[i];
  document.getElementById('co12a-txt').innerHTML='<b>'+x.id+'</b> · '+x.prov+' · '+(x.mon==="USD"?"USD ":"S/. ")+fmtM(x.monto)+'<br><span class="hint">Origen: '+x.rec+' sobre '+x.oc+'</span>';
  document.getElementById('co12a-fac').value="";
  openModal('m-co12a');
}
function aplicarNC(){
  const f=document.getElementById('co12a-fac').value.trim();
  if(!f){toast("Indique la factura donde se aplicó el descuento");return}
  const x=NCS[ncIdx]; x.est="Aplicada"; x.fac=f; x.fapl="19/07/2026";
  closeModal('m-co12a'); renderNC();
  toast(x.id+" aplicada en "+f+": deja de figurar como crédito pendiente");
}
