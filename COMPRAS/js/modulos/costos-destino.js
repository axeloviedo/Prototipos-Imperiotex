/* COMPRAS · CO-14 Comprobante de Costos de Destino (Landed Cost) */
/* ===== CO-14 · Comprobante de Costos de Destino Estimados (Landed Cost) ===== */
const CTAS_COSTO=["Cargos de tránsito y transporte","Derechos de aduana y nacionalización","Flete internacional","Seguro de carga"];
const CCD_EST={"Borrador":"var(--borrador)","Aplicado":"var(--completada)"};
let CCDS=[
 {id:"CCD-0001",fecha:"19/07/2026",tc:"3.40",base:"Cantidad",est:"Borrador",fks:[4],
  costos:[{cta:"Cargos de tránsito y transporte",desc:"Transporte marítimo Santos-Callao + gastos portuarios",mon:"S/.",imp:2000},
          {cta:"Derechos de aduana y nacionalización",desc:"Agencia de aduanas y nacionalización del embarque",mon:"USD",imp:300}]}
];
let CCD=null, CCDidx=-1, CCD_SEQ=2;
function ccdFacTotS(f){const t=facTot(f);return (f.mon==="USD")?t.tot*(parseFloat(f.tc)||1):t.tot}
function ccdItems(){
  const arr=[];
  CCD.fks.forEach(fi=>{
    const f=FACS[fi]; if(!f)return;
    const tc=(f.mon==="USD")?(parseFloat(f.tc)||1):1;
    f.items.forEach(it=>{
      const tot=it.cant*it.pu*tc;
      const ya=arr.find(x=>x.cod===it.cod);
      if(ya){ya.cant+=it.cant;ya.tot+=tot}
      else arr.push({cod:it.cod,nom:it.nom,cant:it.cant,tot:tot});
    });
  });
  return arr;
}
function ccdCostosTotS(){
  const tc=parseFloat(document.getElementById('ccd-tc').value)||1;
  return CCD.costos.reduce((a,c)=>a+((c.mon==="USD")?c.imp*tc:c.imp),0);
}
function renderCCD(){
  const tb=document.getElementById('ccd-body'); tb.innerHTML="";
  CCDS.forEach((d,i)=>{
    const provs=[...new Set(d.fks.map(fi=>FACS[fi]?FACS[fi].prov:""))].filter(Boolean).join(", ");
    const facs=d.fks.map(fi=>FACS[fi]?FACS[fi].id:"").filter(Boolean).join(", ");
    const tc=parseFloat(d.tc)||1;
    const tot=d.costos.reduce((a,c)=>a+((c.mon==="USD")?c.imp*tc:c.imp),0);
    tb.innerHTML+='<tr class="clickable" onclick="loadCCD('+i+')"><td>'+d.id+'</td><td>'+d.fecha+'</td><td>'+facs+'</td><td>'+provs+'</td>'+
     '<td style="text-align:right;font-weight:600">'+fmtM(tot)+'</td>'+
     '<td><span class="badge" style="background:'+CCD_EST[d.est]+'">'+d.est+'</span></td>'+
     '<td><button class="btn-link" onclick="event.stopPropagation();loadCCD('+i+')">Abrir</button></td></tr>';
  });
  document.getElementById('ccd-count').textContent=CCDS.length+" comprobantes";
}
function nuevoCCD(){
  CCDidx=-1;
  CCD={id:"CCD-000"+CCD_SEQ,fecha:"19/07/2026",tc:"3.40",base:"Cantidad",est:"Borrador",fks:[],costos:[]};
  loadCCDform(); go('co14f');
}
function loadCCD(i){CCDidx=i; CCD=CCDS[i]; loadCCDform(); go('co14f')}
function loadCCDform(){
  document.getElementById('ccd-titulo').textContent="COMPROBANTE DE COSTOS DE DESTINO: "+CCD.id;
  document.getElementById('ccd-id').value=CCD.id;
  document.getElementById('ccd-fecha').value=CCD.fecha;
  document.getElementById('ccd-tc').value=CCD.tc;
  document.getElementById('ccd-base').value=CCD.base;
  const ro=(CCD.est!=="Borrador");
  document.getElementById('ccd-tc').readOnly=ro;
  document.getElementById('ccd-base').disabled=ro;
  const b=document.getElementById('ccd-badge'); b.textContent=CCD.est; b.style.background=CCD_EST[CCD.est];
  document.getElementById('ccd-b-save').style.display=ro?"none":"inline-block";
  document.getElementById('ccd-b-send').style.display=ro?"none":"inline-block";
  document.getElementById('ccd-b-addfac').style.display=ro?"none":"inline-block";
  document.getElementById('ccd-b-addcosto').style.display=ro?"none":"inline-block";
  const av=document.getElementById('ccd-aviso');
  if(ro){av.style.display="block";
    av.innerHTML='<b style="font-size:12.5px">Comprobante Aplicado</b><p class="hint" style="margin-top:5px">El costo promedio de Kardex de los ítems fue recalculado con estos costos de destino. Documento en solo lectura.</p>'}
  else av.style.display="none";
  renderCCDfacs(); renderCCDcostos(); ccdTotalesUI();
}
function renderCCDfacs(){
  const ro=(CCD.est!=="Borrador");
  const tb=document.getElementById('ccd-facs'); tb.innerHTML="";
  CCD.fks.forEach((fi,x)=>{
    const f=FACS[fi]; if(!f)return;
    tb.innerHTML+='<tr><td>'+f.id+'</td><td>'+f.ndoc+'</td><td>'+f.oc+'</td><td>'+f.prov+'</td>'+
     '<td style="text-align:right;font-weight:600">'+fmtM(ccdFacTotS(f))+'</td>'+
     '<td>'+(ro?'':'<button class="btn-link" onclick="CCD.fks.splice('+x+',1);renderCCDfacs();ccdTotalesUI()">Quitar</button>')+'</td></tr>';
  });
  if(!CCD.fks.length)tb.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--texto-sec);padding:14px">Sin facturas: use "+ Agregar factura"</td></tr>';
}
function abrirModalFacCCD(){
  const tb=document.getElementById('co14a-body'); tb.innerHTML="";
  FACS.forEach((f,i)=>{
    if(CCD.fks.includes(i))return;
    tb.innerHTML+='<tr><td>'+f.id+'</td><td>'+f.ndoc+'</td><td>'+f.oc+'</td><td>'+f.prov+'</td>'+
     '<td><span class="badge" style="background:'+(FAC_EST[f.est]||"var(--borrador)")+'">'+f.est+'</span></td>'+
     '<td style="text-align:right">'+fmtM(ccdFacTotS(f))+'</td>'+
     '<td><button class="btn btn-primary btn-sm" onclick="addFacCCD('+i+')">Agregar</button></td></tr>';
  });
  if(!tb.innerHTML)tb.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--texto-sec);padding:14px">No quedan facturas por agregar</td></tr>';
  openModal('m-co14a');
}
function addFacCCD(i){
  CCD.fks.push(i); closeModal('m-co14a');
  renderCCDfacs(); ccdTotalesUI();
  toast(FACS[i].id+" agregada: sus ítems ya aparecen en la tabla 2");
}
function addCostoCCD(){
  CCD.costos.push({cta:CTAS_COSTO[0],desc:"",mon:"S/.",imp:0});
  renderCCDcostos(); ccdTotalesUI();
}
function renderCCDcostos(){
  const ro=(CCD.est!=="Borrador");
  const tb=document.getElementById('ccd-costos'); tb.innerHTML="";
  const tc=parseFloat(document.getElementById('ccd-tc').value)||1;
  CCD.costos.forEach((c,i)=>{
    const sol=(c.mon==="USD")?c.imp*tc:c.imp;
    const cta=ro?c.cta:('<select style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px" onchange="CCD.costos['+i+'].cta=this.value">'+CTAS_COSTO.map(x=>'<option'+(x===c.cta?' selected':'')+'>'+x+'</option>').join('')+'</select>');
    const desc=ro?c.desc:('<input value="'+c.desc+'" placeholder="Descripción del cargo…" style="width:100%" oninput="CCD.costos['+i+'].desc=this.value">');
    const mon=ro?c.mon:('<select style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px" onchange="CCD.costos['+i+'].mon=this.value;ccdTotalesUI()"><option'+(c.mon==="S/."?' selected':'')+'>S/.</option><option'+(c.mon==="USD"?' selected':'')+'>USD</option></select>');
    const imp=ro?('<td style="text-align:right">'+fmtM(c.imp)+'</td>'):('<td><input value="'+c.imp+'" style="text-align:right" oninput="ccdCostoInput('+i+',this)"></td>');
    tb.innerHTML+='<tr><td>'+cta+'</td><td>'+desc+'</td><td>'+mon+'</td>'+imp+
     '<td id="ccd-cs-'+i+'" style="text-align:right;font-weight:600">'+fmtM(sol)+'</td>'+
     '<td>'+(ro?'':'<button class="btn-link" onclick="CCD.costos.splice('+i+',1);renderCCDcostos();ccdTotalesUI()">Quitar</button>')+'</td></tr>';
  });
  if(!CCD.costos.length)tb.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--texto-sec);padding:14px">Sin costos: use "+ Agregar costo"</td></tr>';
}
function ccdCostoInput(i,el){
  CCD.costos[i].imp=parseFloat(el.value)||0;
  const tc=parseFloat(document.getElementById('ccd-tc').value)||1;
  const c=CCD.costos[i];
  const celda=document.getElementById('ccd-cs-'+i);
  if(celda)celda.textContent=fmtM((c.mon==="USD")?c.imp*tc:c.imp);
  ccdTotalesUI(true);
}
function ccdTotalesUI(soloTotales){
  if(!soloTotales)renderCCDcostosSoles();
  const items=ccdItems();
  const totC=ccdCostosTotS();
  const base=document.getElementById('ccd-base').value;
  const sumQ=items.reduce((a,x)=>a+x.cant,0), sumV=items.reduce((a,x)=>a+x.tot,0);
  const tb=document.getElementById('ccd-items'); tb.innerHTML="";
  const aplicado=(CCD.est==="Aplicado");
  items.forEach(x=>{
    const actual=x.cant?x.tot/x.cant:0;
    const adic=(base==="Cantidad")?(sumQ?totC/sumQ:0):(sumV&&x.cant?(totC*(x.tot/sumV))/x.cant:0);
    tb.innerHTML+='<tr><td>'+x.cod+'</td><td>'+x.nom+'</td><td style="text-align:right">'+x.cant.toLocaleString("es-PE")+'</td>'+
     '<td style="text-align:right">'+fmtM(x.tot)+'</td>'+
     '<td style="text-align:right">'+actual.toFixed(2)+'</td>'+
     '<td style="text-align:right;color:var(--pendiente);font-weight:600">+'+adic.toFixed(2)+'</td>'+
     '<td style="text-align:right;font-weight:700;color:'+(aplicado?"var(--completada)":"var(--primario)")+'">'+(actual+adic).toFixed(2)+'</td></tr>';
  });
  if(!items.length)tb.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--texto-sec);padding:14px">Agregue facturas en la tabla 1: los ítems se llenan solos</td></tr>';
  document.getElementById('ccd-items-foot').innerHTML=items.length?('<tr><td colspan="2" style="text-align:right;font-weight:600">Totales</td><td style="text-align:right;font-weight:700">'+sumQ.toLocaleString("es-PE")+'</td><td style="text-align:right;font-weight:700">'+fmtM(sumV)+'</td><td colspan="3"></td></tr>'):'';
  document.getElementById('ccd-costos-foot').innerHTML=CCD.costos.length?('<tr><td colspan="4" style="text-align:right;font-weight:600">Total costos de destino</td><td style="text-align:right;font-weight:700">S/. '+fmtM(totC)+'</td><td></td></tr>'):'';
  const r=document.getElementById('ccd-resumen');
  if(items.length&&totC>0){
    const ej=(base==="Cantidad")?('S/. '+fmtM(totC)+' entre '+sumQ.toLocaleString("es-PE")+' unidades = <b>S/. '+(sumQ?(totC/sumQ).toFixed(2):0)+' adicionales por unidad</b>'):('S/. '+fmtM(totC)+' repartidos según el valor de cada ítem');
    r.innerHTML='<div class="card" style="margin:0;border-left:4px solid var(--primario-claro)"><b style="font-size:12.5px">Prorrateo por '+base.toLowerCase()+'</b><p class="hint" style="margin-top:5px">'+ej+'. '+(CCD.est==="Aplicado"?'Aplicado al costo promedio del Kardex.':'Al enviar, el nuevo costo de Kardex de la columna final reemplaza al promedio vigente de cada ítem.')+'</p></div>';
  }else r.innerHTML="";
}
function renderCCDcostosSoles(){renderCCDcostos()}
function guardarCCD(){
  if(CCDidx<0){CCDS.push(CCD);CCDidx=CCDS.length-1;CCD_SEQ++}
  renderCCD(); toast(CCD.id+" guardado como Borrador: aún no afecta el Kardex");
}
function preEnviarCCD(){
  if(!CCD.fks.length){toast("Agregue al menos una factura (tabla 1)");return}
  if(!CCD.costos.length||ccdCostosTotS()<=0){toast("Agregue al menos un costo con importe mayor a cero (tabla 3)");return}
  openModal('m-co14b');
}
function enviarCCD(){
  closeModal('m-co14b');
  CCD.tc=document.getElementById('ccd-tc').value;
  CCD.base=document.getElementById('ccd-base').value;
  CCD.est="Aplicado";
  if(CCDidx<0){CCDS.push(CCD);CCDidx=CCDS.length-1;CCD_SEQ++}
  const items=ccdItems(), totC=ccdCostosTotS();
  const sumQ=items.reduce((a,x)=>a+x.cant,0);
  loadCCDform(); renderCCD();
  toast(CCD.id+" aplicado: Kardex recalculado (+S/. "+(sumQ?(totC/sumQ).toFixed(2):"0.00")+"/und prorrateado sobre "+items.length+" ítem(s))");
}
