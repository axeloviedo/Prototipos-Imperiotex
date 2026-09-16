/* INVENTARIOS · Artículos de ejemplo (GI-01) */
/* ===== Datos de ejemplo - GI-01 ===== */
const ARTICULOS=[
 {id:"PT-0001",n:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL",e:"Activo",u:"UND",inv:"Sí",t:"PRODUCTOS TERMINADOS",c:"PANTALÓN",sc:"",ctrl:"LOT",venta:true,compra:false,manu:true,attrs:[["Color","AZUL"],["Talla","28"]],bcs:[{tipo:"GTIN-13 / EAN",cod:"7750001002286"},{tipo:"Código interno",cod:"ZUL-28-AZ"}]},
 {id:"PT-0002",n:"PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL",e:"Activo",u:"UND",inv:"Sí",t:"PRODUCTOS TERMINADOS",c:"PANTALÓN",sc:"",ctrl:"LOT",venta:true,compra:false,manu:true,attrs:[["Color","AZUL"],["Talla","30"]],bcs:[{tipo:"GTIN-13 / EAN",cod:"7750001002293"}]},
 {id:"PT-0003",n:"PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR NEGRO",e:"Activo",u:"UND",inv:"Sí",t:"PRODUCTOS TERMINADOS",c:"PANTALÓN",sc:"",ctrl:"LOT",venta:true,compra:false,manu:true,attrs:[["Color","NEGRO"],["Talla","28"]],bcs:[{tipo:"GTIN-13 / EAN",cod:"7750001002309"}]},
 {id:"PPT-0021",n:"PANTALON WIDE LEG ZULEIKA LAVADO COLOR AZUL TALLA 28",e:"Activo",u:"UND",inv:"Sí",t:"PRODUCTOS EN PROCESO",c:"",sc:"",ctrl:"LOT",venta:false,compra:false,manu:true,attrs:[["Color","AZUL"],["Talla","28"],["Acabado","LAVADO"]],bcs:[]},
 {id:"PPT-0022",n:"PANTALON WIDE LEG ZULEIKA CRUDO TALLA 28",e:"Activo",u:"UND",inv:"Sí",t:"PRODUCTOS EN PROCESO",c:"",sc:"",ctrl:"LOT",venta:false,compra:false,manu:true,attrs:[["Talla","28"],["Acabado","CRUDO"]],bcs:[]},
 {id:"MP-0012",n:"TELA DENIM 12 OZ AZUL",e:"Activo",u:"MT",inv:"Sí",t:"MATERIA PRIMA",c:"TELAS",sc:"",ctrl:"LOT",venta:false,compra:true,manu:false,attrs:[],bcs:[]},
 {id:"MP-0031",n:"HILO POLIESTER AZUL",e:"Activo",u:"CONO",inv:"Sí",t:"MATERIA PRIMA",c:"HILOS",sc:"",ctrl:"LOT",venta:false,compra:true,manu:false,attrs:[],bcs:[]},
 {id:"MP-0044",n:"BOTON METALICO 17MM",e:"Activo",u:"UND",inv:"Sí",t:"MATERIA PRIMA",c:"AVÍOS DE ACABADOS - PRINCIPALES",sc:"BOTÓN",ctrl:"",venta:false,compra:true,manu:false,attrs:[],bcs:[]},
 {id:"MP-0055",n:"CUERO SINTETICO PARCHE",e:"Activo",u:"UND",inv:"Sí",t:"MATERIA PRIMA",c:"AVÍOS DE ACABADOS - PRINCIPALES",sc:"CUEROS",ctrl:"",venta:false,compra:true,manu:false,attrs:[],bcs:[]},
 {id:"MP-0061",n:"HANG TAG SARA DENIM",e:"Activo",u:"UND",inv:"Sí",t:"MATERIA PRIMA",c:"AVÍOS DE ACABADOS - PRINCIPALES",sc:"HANG TAG",ctrl:"",venta:false,compra:true,manu:false,attrs:[],bcs:[]},
 {id:"MP-0063",n:"ETIQUETA PANTALON SARA",e:"Activo",u:"UND",inv:"Sí",t:"MATERIA PRIMA",c:"AVÍOS DE ACABADOS - PRINCIPALES",sc:"ETIQUETA PANTALÓN",ctrl:"",venta:false,compra:true,manu:false,attrs:[],bcs:[]},
 {id:"MP-0064",n:"BOLSA BRILLO 30X40",e:"Activo",u:"UND",inv:"Sí",t:"MATERIA PRIMA",c:"AVÍOS DE ACABADOS - PRINCIPALES",sc:"BOLSA BRILLO",ctrl:"",venta:false,compra:true,manu:false,attrs:[],bcs:[]},
 {id:"MP-0045",n:"CIERRE METALICO 12CM",e:"Inactivo",u:"UND",inv:"Sí",t:"MATERIA PRIMA",c:"AVÍOS DE CONFECCIÓN",sc:"CIERRES",ctrl:"",venta:false,compra:true,manu:false,attrs:[],bcs:[]},
 {id:"MP-0071",n:"TALLITA TALLA 28",e:"Activo",u:"UND",inv:"Sí",t:"MATERIA PRIMA",c:"AVÍOS DE CONFECCIÓN",sc:"TALLITAS",ctrl:"",venta:false,compra:true,manu:false,attrs:[],bcs:[]},
 {id:"MERC-0205",n:"CARTERA MINI VALENTINA COLOR CAMEL",e:"Activo",u:"UND",inv:"Sí",t:"MERCADERÍA",c:"",sc:"",ctrl:"",venta:true,compra:true,manu:false,attrs:[["Color","CAMEL"]],bcs:[{tipo:"GTIN-13 / EAN",cod:"7750001002500"}]},
 {id:"OFER-0001",n:"PACK 2 PANTALONES ZULEIKA TALLA 28",e:"Activo",u:"UND",inv:"Sí",t:"OFERTAS",c:"",sc:"",ctrl:"",venta:true,compra:false,manu:false,attrs:[["Talla","28"]],bcs:[]},
 {id:"SERV-0003",n:"SERVICIO DE LAVANDERIA INDUSTRIAL",e:"Activo",u:"UND",inv:"No",t:"SERVICIOS",c:"",sc:"",ctrl:"",venta:false,compra:true,manu:false,attrs:[],bcs:[]}
];
const EST_COLOR={"Activo":"var(--confirmado)","Inactivo":"var(--borrador)"};

function renderArt(){
  const q=(document.getElementById('f-art-q').value||"").toLowerCase();
  const g=document.getElementById('f-art-g').value, sg=document.getElementById('f-art-sg').value, e=document.getElementById('f-art-e').value;
  const tb=document.querySelector('#tbl-art tbody'); tb.innerHTML="";
  let n=0;
  ARTICULOS.forEach(a=>{
    if(q && !(a.id.toLowerCase().includes(q)||a.n.toLowerCase().includes(q)))return;
    if(g && a.t!==g)return; if(sg && a.c!==sg)return; if(e && a.e!==e)return;
    n++;
    const tr=document.createElement('tr'); tr.className="clickable";
    tr.onclick=()=>openArticleForm(a.id);
    tr.innerHTML=`<td>${a.id}</td><td>${a.n}</td>
      <td><span class="badge" style="background:${EST_COLOR[a.e]}">${a.e}</span></td>
      <td>${a.u}</td><td>${a.inv}</td>
      <td><button class="btn-link" onclick="event.stopPropagation();openArticleForm('${a.id}')">Editar</button>
          <button class="btn-link" onclick="event.stopPropagation();openArticleForm('${a.id}');setTimeout(duplicarArticulo,30)">Duplicar</button>
          <button class="btn-link" onclick="event.stopPropagation();openModal('m-gi01a')">Desactivar</button></td>`;
    tb.appendChild(tr);
  });
  document.getElementById('art-count').textContent=n+" artículos";
}
function filterArt(){renderArt()}
function fillArtFilters(){
  const g=document.getElementById('f-art-g'); if(g.options.length<=1){TIPOS.forEach(t=>{const o=document.createElement('option');o.textContent=t.nom;o.value=t.nom;g.appendChild(o)})}
}
function fillSubcatFiltro(cid,sid){
  const c=document.getElementById(cid).value, s=document.getElementById(sid);
  s.innerHTML='<option value="">Todas</option>';
  SUBCATS.filter(x=>!c||x.cat===c).forEach(x=>{const o=document.createElement('option');o.textContent=x.nom;o.value=x.nom;s.appendChild(o)});
}
function fillStockFilters(){
  const g=document.getElementById('f-stk-g'); if(g&&g.options.length<=1){TIPOS.forEach(t=>{const o=document.createElement('option');o.textContent=t.nom;o.value=t.nom;g.appendChild(o)})}
}
