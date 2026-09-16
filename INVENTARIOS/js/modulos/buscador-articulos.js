/* INVENTARIOS · CT-03 Buscador de artículos con contexto y almacén (maestro y stock de la base compartida).
   Cada pantalla registra su contexto en BUSCADOR_CTX: {alm() código del almacén a mostrar, etiqueta, soloInv, requiereAlm, filtro(a), agregar(cod)}. */
const BUSCADOR_CTX={};
let ctxBuscador="", ctxAlm="";
function openBuscador(ctx){
  const c=BUSCADOR_CTX[ctx]; if(!c){toast("Buscador no disponible");return}
  const alm=c.alm?c.alm():'';
  if(c.requiereAlm&&!alm){toast("Seleccione primero "+c.etiqueta+" para ver su stock disponible");return}
  ctxBuscador=ctx; ctxAlm=alm;
  fillCT03Filtros(); document.getElementById('ct03-q').value=''; renderCT03(); openModal('m-ct03');
}
function fillCT03Filtros(){
  const c=BUSCADOR_CTX[ctxBuscador]||{};
  document.getElementById('ct03-g').innerHTML=opcionesLista(M().grupos.filter(g=>!c.soloInv||g.inv!==false).map(g=>({v:g.cod,t:g.cod+' · '+g.nom})),'','Todos');
  document.getElementById('ct03-atr').innerHTML=opcionesLista(M().atributos.map(x=>x.nom),'','Cualquiera');
  fillCT03Cat(); fillCT03Val();
}
function fillCT03Cat(){
  const g=document.getElementById('ct03-g').value;
  document.getElementById('ct03-c').innerHTML=opcionesLista(M().categorias.filter(c=>!g||c.grupo===g).map(c=>c.nom),'','Todas');
}
function fillCT03Val(){
  const a=M().atributos.find(x=>x.nom===document.getElementById('ct03-atr').value);
  document.getElementById('ct03-val').innerHTML=opcionesLista(a?a.vals:[],'','Cualquiera');
}
function renderCT03(){
  const c=BUSCADOR_CTX[ctxBuscador]||{};
  document.getElementById('ct03-chip').textContent=ctxAlm?almEtiqueta(ctxAlm):'(sin almacén: stock total)';
  const q=Fmt.s(document.getElementById('ct03-q').value), fg=document.getElementById('ct03-g').value, fc=document.getElementById('ct03-c').value;
  const fa=document.getElementById('ct03-atr').value, fv=document.getElementById('ct03-val').value;
  const lista=M().articulos.filter(a=>{
    if(a.estado!=='Activo')return false;
    if(c.soloInv&&a.inv===false)return false;
    if(c.filtro&&!c.filtro(a))return false;
    if(q&&!(Fmt.s(a.cod).includes(q)||Fmt.s(a.nom).includes(q)))return false;
    if(fg&&a.grupo!==fg)return false; if(fc&&a.cat!==fc)return false;
    if(fa){const v=(a.attrs||{})[fa]; if(!v)return false; if(fv&&v!==fv)return false;}
    return true;
  });
  const warn=c.avisaSinStock;
  const grupos={}; lista.forEach(a=>(grupos[a.grupo]=grupos[a.grupo]||[]).push(a));
  let html='';
  Object.keys(grupos).forEach(g=>{
    html+='<tr><td colspan="6" style="background:#F8FAFC;font-weight:600;font-size:12px;color:var(--texto-sec)">'+g+' · '+Fmt.e(grupoNom(g))+'</td></tr>';
    grupos[g].slice(0,150).forEach(a=>{
      const inv=a.inv!==false, d=inv?(ctxAlm?Stock.disp(ctxAlm,a.cod):Stock.totalDisp(a.cod)):null, sin=inv&&d<=0;
      const attr=a.attrs?' <span class="hint">'+Object.keys(a.attrs).map(k=>k+': '+a.attrs[k]).join(' · ')+'</span>':'';
      html+='<tr'+(sin&&warn?' style="background:#FEF2F2"':'')+'><td>'+a.cod+'</td><td>'+Fmt.e(a.nom)+attr+(sin&&warn?' <span class="hint">Sin stock disponible</span>':'')+'</td><td>'+a.u+'</td><td>'+(a.ctrl||'Nada')+'</td>'+
       '<td style="text-align:right;'+(sin?'color:var(--stock-cero);font-weight:600':'')+'">'+(inv?Fmt.n(d):hint('No inventariable'))+'</td>'+
       '<td><button class="btn btn-primary btn-sm" onclick="addFromCT03(\''+a.cod+'\')">Agregar</button></td></tr>';
    });
  });
  document.getElementById('ct03-body').innerHTML=html||'<tr><td colspan="6" style="text-align:center;color:var(--texto-sec);padding:16px">Ningún artículo coincide con los filtros</td></tr>';
}
function addFromCT03(cod){
  const c=BUSCADOR_CTX[ctxBuscador]; if(!c)return;
  closeModal('m-ct03');
  c.agregar(cod);
}
