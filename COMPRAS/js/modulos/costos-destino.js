/* COMPRAS · CO-14 Costos de Destino sobre la base compartida (Docs.ccd, COMPARTIDO/bd/compras.js).
   Flete, seguro, aduanas, agente u otros de cualquier OC recibida; se reparten por valor (recomendado) o por cantidad
   y suben el costo promedio de lo que sigue en stock (revalorización REV-). */
/* ===== CO-14 · Costos de Destino ===== */
const CCD_EST={"Borrador":"var(--borrador)","Registrado":"var(--confirmado)","Anulado":"var(--cancelada)"};
let CCD=null; /* copia de trabajo: {id, fecha, base, obs, ocs:[], costos:[], estado} */
function ccdTotalOC(id){return Docs.ccd.recibido([id]).reduce((t,l)=>t+l.valor,0)}
function renderCCD(){
  const tb=document.getElementById('ccd-body'); if(!tb)return;
  const lista=BD.d.ccds||[];
  tb.innerHTML=lista.map(c=>'<tr class="clickable" onclick="abrirCCD(\''+c.id+'\')"><td>'+c.id+'</td><td>'+c.fecha+'</td><td>'+c.ocs.join(', ')+'</td>'+
    '<td>'+coEsc([...new Set(c.costos.map(x=>Docs.ccd.TIPOS[x.tipo]))].join(', '))+'</td><td>'+c.base+'</td>'+
    '<td style="text-align:right">'+fmtM(Docs.ccd.totalCostos(c))+'</td><td><span class="badge" style="background:'+(CCD_EST[c.estado]||'var(--borrador)')+'">'+c.estado+'</span></td>'+
    '<td><button class="btn-link">Abrir</button></td></tr>').join('')||'<tr><td colspan="8" style="text-align:center;color:var(--texto-sec);padding:16px">Sin comprobantes: use «+ Nuevo comprobante»</td></tr>';
  document.getElementById('ccd-count').textContent=lista.length+' comprobante(s)';
}
function nuevoCCD(ocId){
  CCD={id:'',fecha:BD.hoy(),base:'Valor',obs:'',ocs:ocId?[ocId]:[],costos:[],estado:'Borrador'};
  go('co14f'); renderCCDForm();
}
function abrirCCD(id){ const c=BD.ccd(id); if(!c){toast('No existe el comprobante '+id);return} CCD=BD.copia(c); go('co14f'); renderCCDForm(); }
function ccdEditable(){return CCD&&CCD.estado==='Borrador'}
function ccdLeer(){
  if(!ccdEditable())return;
  CCD.fecha=coDMY(document.getElementById('ccd-fecha').value)||CCD.fecha;
  CCD.base=document.getElementById('ccd-base').value;
  CCD.obs=document.getElementById('ccd-obs').value;
}
function renderCCDForm(){
  if(!CCD)return;
  const ed=ccdEditable();
  document.getElementById('ccd-titulo').textContent=CCD.id?'COSTOS DE DESTINO: '+CCD.id:'NUEVO COMPROBANTE DE COSTOS DE DESTINO';
  const b=document.getElementById('ccd-badge'); b.textContent=CCD.estado; b.style.background=CCD_EST[CCD.estado]||'var(--borrador)';
  document.getElementById('ccd-id').value=CCD.id||'(se asigna al guardar)';
  document.getElementById('ccd-fecha').value=coISO(CCD.fecha);
  document.getElementById('ccd-base').value=CCD.base;
  document.getElementById('ccd-obs').value=CCD.obs||'';
  ['ccd-fecha','ccd-base','ccd-obs'].forEach(id=>document.getElementById(id).disabled=!ed);
  const show=(id,v)=>{document.getElementById(id).style.display=v?'inline-block':'none'};
  show('ccd-b-save',ed); show('ccd-b-send',ed); show('ccd-b-addoc',ed); show('ccd-b-addcosto',ed); show('ccd-b-anular',!!CCD.id&&CCD.estado!=='Anulado');
  /* 1 · OC */
  document.getElementById('ccd-ocs').innerHTML=CCD.ocs.map((id,i)=>{const o=BD.oc(id)||{};
    return '<tr><td><button class="btn-link" onclick="abrirOC(\''+id+'\')">'+id+'</button></td><td>'+coEsc(BD.provNom(o.prov))+'</td><td>'+(o.mon||'')+'</td><td style="text-align:right">'+fmtM(ccdTotalOC(id))+'</td>'+
      '<td>'+(ed?'<button class="btn-link" onclick="CCD.ocs.splice('+i+',1);renderCCDForm()">Quitar</button>':'')+'</td></tr>';}).join('')||
    '<tr><td colspan="5" style="text-align:center;color:var(--texto-sec);padding:12px">Agregue la OC recibida a la que pertenecen estos costos</td></tr>';
  /* 2 · costos */
  const provs=BD.d.maestros.proveedores.filter(p=>p.estado!=='Inactivo');
  document.getElementById('ccd-costos').innerHTML=CCD.costos.map((x,i)=>{
    const sol=BD.r2((Number(x.monto)||0)*(x.mon==='USD'?(Number(x.tc)||1):1));
    const set=(k,v)=>'CCD.costos['+i+'].'+k+'='+v+';renderCCDForm()';
    return '<tr><td><select '+(ed?'':'disabled ')+'onchange="'+set('tipo','this.value')+'">'+Object.keys(Docs.ccd.TIPOS).map(t=>'<option value="'+t+'"'+(x.tipo===t?' selected':'')+'>'+t+' · '+Docs.ccd.TIPOS[t]+'</option>').join('')+'</select></td>'+
      '<td><select '+(ed?'':'disabled ')+'onchange="'+set('prov','this.value')+'"><option value="">(sin proveedor)</option>'+provs.map(p=>'<option value="'+p.cod+'"'+(x.prov===p.cod?' selected':'')+'>'+coEsc(p.nom)+'</option>').join('')+'</select></td>'+
      '<td><input value="'+coEsc(x.ndoc||'')+'" '+(ed?'':'disabled ')+'onchange="'+set('ndoc','this.value')+'"></td>'+
      '<td><select '+(ed?'':'disabled ')+'onchange="'+set('mon','this.value')+'"><option'+(x.mon!=='USD'?' selected':'')+'>S/.</option><option'+(x.mon==='USD'?' selected':'')+'>USD</option></select></td>'+
      '<td><input value="'+(x.tc||'')+'" style="text-align:right" '+(ed&&x.mon==='USD'?'':'disabled ')+'onchange="'+set('tc','parseFloat(this.value)||0')+'"></td>'+
      '<td><input value="'+(x.monto||'')+'" style="text-align:right" '+(ed?'':'disabled ')+'onchange="'+set('monto','parseFloat(this.value)||0')+'"></td>'+
      '<td style="text-align:right">'+fmtM(sol)+'</td><td>'+(ed?'<button class="btn-link" onclick="CCD.costos.splice('+i+',1);renderCCDForm()">✕</button>':'')+'</td></tr>';
  }).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--texto-sec);padding:12px">Agregue el flete, seguro, aduana u otro costo</td></tr>';
  const total=Docs.ccd.totalCostos(CCD);
  document.getElementById('ccd-costos-foot').innerHTML=CCD.costos.length?'<tr><td colspan="6" style="text-align:right;font-weight:600">Total en soles</td><td style="text-align:right;font-weight:700">S/. '+fmtM(total)+'</td><td></td></tr>':'';
  /* 3 · reparto (el registrado muestra el que se aplicó) */
  const rep=CCD.estado==='Borrador'?Docs.ccd.repartir(CCD):(CCD.reparto||[]);
  document.getElementById('ccd-items').innerHTML=rep.map(l=>'<tr><td>'+l.oc+'</td><td>'+l.art+'</td><td>'+coEsc(BD.nomArt(l.art))+'</td><td>'+l.alm+'</td>'+
    '<td style="text-align:right">'+fmtQ2(l.cant)+' '+BD.u(l.art)+'</td><td style="text-align:right">'+fmtM(l.valor)+'</td><td style="text-align:right;font-weight:600">'+fmtM(l.monto)+'</td><td style="text-align:right">'+fmtM(l.unit)+'</td></tr>').join('')||
    '<tr><td colspan="8" style="text-align:center;color:var(--texto-sec);padding:12px">Se llena solo con lo recibido de las OC elegidas</td></tr>';
  document.getElementById('ccd-items-foot').innerHTML=rep.length?'<tr><td colspan="6" style="text-align:right;font-weight:600">Total repartido</td><td style="text-align:right;font-weight:700">S/. '+fmtM(rep.reduce((t,l)=>t+l.monto,0))+'</td><td></td></tr>':'';
  const av=document.getElementById('ccd-aviso');
  if(CCD.estado==='Registrado'||CCD.estado==='Anulado'){
    const x=BD.ccd(CCD.id)||CCD, varia=BD.r2((x.variacion||[]).reduce((t,v)=>t+v.monto,0));
    av.style.display='block';
    av.innerHTML='<b style="font-size:12.5px">'+(CCD.estado==='Registrado'?'Aplicado al costo':'Anulado')+'</b><p class="hint" style="margin-top:4px">Revalorizaciones: '+((x.movs||[]).join(', ')||'—')+
      (varia?' · a variación de existencias (lo ya consumido): S/. '+fmtM(varia):'')+'. Se ven en el Kardex (GI-06).</p>';
  }else av.style.display='none';
  document.getElementById('ccd-resumen').innerHTML=ed&&total&&rep.length?'<p class="hint">Reparto por <b>'+CCD.base.toLowerCase()+'</b>: S/. '+fmtM(total)+' entre '+rep.length+' línea(s) recibida(s).</p>':'';
}
function fmtQ2(v){return (Number(v)||0).toLocaleString('es-PE',{maximumFractionDigits:2})}
function addCostoCCD(){ if(!ccdEditable())return; CCD.costos.push({tipo:'05',prov:'',ndoc:'',mon:'S/.',tc:3.75,monto:0}); renderCCDForm(); }
function abrirModalOCCCD(){
  const lista=BD.d.ocs.filter(o=>Docs.ccd.recibido([o.id]).length&&!CCD.ocs.includes(o.id));
  document.getElementById('co14a-body').innerHTML=lista.map(o=>'<tr><td>'+o.id+'</td><td>'+coEsc(BD.provNom(o.prov))+'</td><td>'+o.fecha+'</td><td>'+o.est+'</td><td style="text-align:right">'+fmtM(ccdTotalOC(o.id))+'</td>'+
    '<td><button class="btn btn-primary btn-sm" onclick="CCD.ocs.push(\''+o.id+'\');closeModal(\'m-co14a\');renderCCDForm()">Agregar</button></td></tr>').join('')||
    '<tr><td colspan="6" style="text-align:center;color:var(--texto-sec);padding:16px">No hay otras OC con ingresos al almacén</td></tr>';
  openModal('m-co14a');
}
function ccdDatos(){return {ocs:CCD.ocs,base:CCD.base,fecha:CCD.fecha,obs:CCD.obs,costos:CCD.costos}}
function guardarCCD(silencio){
  if(!ccdEditable())return false;
  ccdLeer();
  if(!CCD.ocs.length){toast('Agregue al menos una OC recibida');return false}
  const c=coTry(()=>CCD.id?Docs.ccd.guardar(CCD.id,ccdDatos()):Docs.ccd.crear(ccdDatos()));
  if(!c)return false;
  CCD=BD.copia(c); if(!silencio)toast('Borrador guardado: '+c.id); renderCCDForm(); renderCCD();
  return true;
}
function preRegistrarCCD(){
  if(!guardarCCD(true))return;
  document.getElementById('co14b-txt').innerHTML='¿Registrar <b>'+CCD.id+'</b> por <b>S/. '+fmtM(Docs.ccd.totalCostos(CCD))+'</b> repartido por '+CCD.base.toLowerCase()+'?';
  openModal('m-co14b');
}
function registrarCCD(){
  closeModal('m-co14b');
  const c=coTry(()=>Docs.ccd.registrar(CCD.id)); if(!c)return;
  CCD=BD.copia(c); toast(c.id+' registrado: costo aplicado ('+(c.movs.join(', ')||'sin stock: todo a variación')+')'); renderCCDForm(); renderCCD();
}
/* modal de motivo compartido por CO-11, CO-12 y CO-14 */
let CO_MOTIVO_FN=null;
function coPedirMotivo(titulo,texto,fn){
  CO_MOTIVO_FN=fn; document.getElementById('co-motivo-tit').textContent=titulo;
  document.getElementById('co-motivo-txt').textContent=texto||''; document.getElementById('co-motivo').value='';
  openModal('m-co-motivo');
}
function coMotivoOk(){
  const m=document.getElementById('co-motivo').value.trim();
  if(!m){toast('El motivo es obligatorio');return}
  closeModal('m-co-motivo'); if(CO_MOTIVO_FN)CO_MOTIVO_FN(m);
}
function anularCCD(){
  if(!CCD||!CCD.id)return;
  coPedirMotivo('Anular '+CCD.id,CCD.estado==='Registrado'?'Se revierte el costo aplicado con otra revalorización.':'',motivo=>{
    const c=coTry(()=>Docs.ccd.anular(CCD.id,motivo)); if(!c)return;
    CCD=BD.copia(c); toast(c.id+' anulado'); renderCCDForm(); renderCCD();
  });
}
RENDER.co14=renderCCD;
RENDER.co14f=renderCCDForm;
