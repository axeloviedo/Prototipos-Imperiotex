/* INVENTARIOS · Datos de los maestros (grupos, categorías, UM, conversiones, atributos, códigos de barra, sedes) */
/* ===== Maestros: Tipos, Categorías, Sub categorías, UM, Conversiones, Atributos, Códigos de barra, Sedes ===== */
const TIPOS=[
 {cod:"MP",nom:"MATERIA PRIMA",pref:"MP",asig:"Interna",cta:"2411 · Materias primas"},
 {cod:"PT",nom:"PRODUCTOS TERMINADOS",pref:"PT",asig:"Interna",cta:"2111 · Productos terminados"},
 {cod:"PPT",nom:"PRODUCTOS EN PROCESO",pref:"PPT",asig:"Interna",cta:"2131 · Productos en proceso"},
 {cod:"SERV",nom:"SERVICIOS",pref:"SERV",asig:"Interna",cta:"6321 · Servicios de terceros"},
 {cod:"MERC",nom:"MERCADERÍA",pref:"MERC",asig:"Externa",cta:"2011 · Mercaderías"},
 {cod:"MUEST",nom:"MUESTRAS",pref:"MUEST",asig:"Interna",cta:"2311 · Muestras"},
 {cod:"OFER",nom:"OFERTAS",pref:"OFER",asig:"Interna",cta:"2011 · Mercaderías"}
];
const CATEGORIAS=[
 {cod:"CAT-0001",tipo:"MATERIA PRIMA",nom:"TELAS"},
 {cod:"CAT-0002",tipo:"MATERIA PRIMA",nom:"HILOS"},
 {cod:"CAT-0003",tipo:"MATERIA PRIMA",nom:"AVÍOS DE CONFECCIÓN"},
 {cod:"CAT-0004",tipo:"MATERIA PRIMA",nom:"AVÍOS DE ACABADOS - PRINCIPALES"},
 {cod:"CAT-0005",tipo:"MATERIA PRIMA",nom:"AVÍOS DE ACABADOS - SECUNDARIOS"},
 {cod:"CAT-0006",tipo:"PRODUCTOS TERMINADOS",nom:"PANTALÓN"},
 {cod:"CAT-0007",tipo:"PRODUCTOS TERMINADOS",nom:"PANTALÓN OVEROL"},
 {cod:"CAT-0008",tipo:"PRODUCTOS TERMINADOS",nom:"CASACA"},
 {cod:"CAT-0009",tipo:"PRODUCTOS TERMINADOS",nom:"CAMISERO"},
 {cod:"CAT-0010",tipo:"PRODUCTOS TERMINADOS",nom:"MARICIELO"},
 {cod:"CAT-0011",tipo:"PRODUCTOS TERMINADOS",nom:"SHORT"},
 {cod:"CAT-0012",tipo:"PRODUCTOS TERMINADOS",nom:"SHORT MOM"},
 {cod:"CAT-0013",tipo:"PRODUCTOS TERMINADOS",nom:"SHORT OVEROL"},
 {cod:"CAT-0014",tipo:"PRODUCTOS TERMINADOS",nom:"SHORT FALDA"},
 {cod:"CAT-0015",tipo:"PRODUCTOS TERMINADOS",nom:"CHALECO"},
 {cod:"CAT-0016",tipo:"PRODUCTOS TERMINADOS",nom:"BIKER"},
 {cod:"CAT-0017",tipo:"PRODUCTOS TERMINADOS",nom:"FALDAS"},
 {cod:"CAT-0018",tipo:"PRODUCTOS TERMINADOS",nom:"FALDA"},
 {cod:"CAT-0019",tipo:"PRODUCTOS TERMINADOS",nom:"MAXI FALDA"},
 {cod:"CAT-0020",tipo:"PRODUCTOS TERMINADOS",nom:"JORTS"},
 {cod:"CAT-0021",tipo:"PRODUCTOS TERMINADOS",nom:"TOP"},
 {cod:"CAT-0022",tipo:"PRODUCTOS TERMINADOS",nom:"POLOS"},
 {cod:"CAT-0023",tipo:"PRODUCTOS TERMINADOS",nom:"VESTIDOS"},
 {cod:"CAT-0024",tipo:"PRODUCTOS TERMINADOS",nom:"OFERTAS"}
];
const SUBCATS=[
 {cod:"SUB-0001",cat:"AVÍOS DE CONFECCIÓN",nom:"CIERRES"},
 {cod:"SUB-0002",cat:"AVÍOS DE CONFECCIÓN",nom:"TALLITAS"},
 {cod:"SUB-0003",cat:"AVÍOS DE ACABADOS - PRINCIPALES",nom:"BOTÓN"},
 {cod:"SUB-0004",cat:"AVÍOS DE ACABADOS - PRINCIPALES",nom:"CUEROS"},
 {cod:"SUB-0005",cat:"AVÍOS DE ACABADOS - PRINCIPALES",nom:"ETIQUETA PANTALÓN"},
 {cod:"SUB-0006",cat:"AVÍOS DE ACABADOS - PRINCIPALES",nom:"ETIQUETA CASACA"},
 {cod:"SUB-0007",cat:"AVÍOS DE ACABADOS - PRINCIPALES",nom:"HANG TAG"},
 {cod:"SUB-0008",cat:"AVÍOS DE ACABADOS - PRINCIPALES",nom:"JALADORES"},
 {cod:"SUB-0009",cat:"AVÍOS DE ACABADOS - PRINCIPALES",nom:"CINTA SCOTCH"},
 {cod:"SUB-0010",cat:"AVÍOS DE ACABADOS - PRINCIPALES",nom:"BOLSA BRILLO"},
 {cod:"SUB-0011",cat:"AVÍOS DE ACABADOS - PRINCIPALES",nom:"BALÍN"},
 {cod:"SUB-0012",cat:"AVÍOS DE ACABADOS - PRINCIPALES",nom:"RAFIA"},
 {cod:"SUB-0013",cat:"AVÍOS DE ACABADOS - PRINCIPALES",nom:"HILOS DE ACABADOS"},
 {cod:"SUB-0014",cat:"AVÍOS DE ACABADOS - SECUNDARIOS",nom:"REGULADORES"},
 {cod:"SUB-0015",cat:"AVÍOS DE ACABADOS - SECUNDARIOS",nom:"HEBILLAS"},
 {cod:"SUB-0016",cat:"AVÍOS DE ACABADOS - SECUNDARIOS",nom:"BOTÓN ACRÍLICO"},
 {cod:"SUB-0017",cat:"AVÍOS DE ACABADOS - SECUNDARIOS",nom:"PLANCHA DE BRILLOS"},
 {cod:"SUB-0018",cat:"AVÍOS DE ACABADOS - SECUNDARIOS",nom:"CÓDIGO DE BARRA"}
];
const UNIDADES=[
 {cod:"UND",nom:"Unidad"},{cod:"MT",nom:"Metro"},{cod:"CM",nom:"Centímetro"},
 {cod:"KG",nom:"Kilogramo"},{cod:"GR",nom:"Gramo"},{cod:"DOC",nom:"Docena"},
 {cod:"CONO",nom:"Cono"},{cod:"ROLLO",nom:"Rollo"},{cod:"CJ",nom:"Caja"},{cod:"BOL",nom:"Bolsa"},{cod:"PAR",nom:"Par"}
];
const CONVERSIONES=[
 {de:"DOC",a:"UND",factor:12},{de:"MT",a:"CM",factor:100},{de:"KG",a:"GR",factor:1000},
 {de:"CJ",a:"UND",factor:12},{de:"ROLLO",a:"MT",factor:50},{de:"CONO",a:"MT",factor:5000},{de:"PAR",a:"UND",factor:2}
];
const ATRIBUTOS=[
 {nom:"Color",vals:["AZUL","NEGRO","CELESTE","BLANCO","CAMEL"]},
 {nom:"Talla",vals:["26","28","30","32","34","S","M","L"]},
 {nom:"Material",vals:["DENIM 12 OZ","POPELINA","DRILL"]},
 {nom:"Acabado",vals:["CRUDO","LAVADO","TEÑIDO"]}
];
const TIPOS_BC=[
 {nom:"GTIN-8"},{nom:"GTIN-12 / UPC"},{nom:"GTIN-13 / EAN"},{nom:"GTIN-14"},
 {nom:"Código interno"},{nom:"Código proveedor"},{nom:"Código cliente"},{nom:"Código legado"}
];
const SEDES=[
 {cod:"G",nom:"Gamarra",dir:"Pisagua 984, La Victoria"},
 {cod:"Z",nom:"Zárate",dir:"San Juan de Lurigancho"},
 {cod:"VIRT",nom:"Virtual",dir:"(sin dirección física)"},
 {cod:"YA",nom:'Galería "Ya"',dir:"Gamarra, YA 1043"},
 {cod:"DAM",nom:'Galería "Damero"',dir:"Gamarra, Damero 939"},
 {cod:"PAR",nom:'Galería "Paraíso"',dir:"Gamarra, Paraíso 1556"},
 {cod:"SANP",nom:'Galería "San Pedro"',dir:"Gamarra, San Pedro 1160"},
 {cod:"ENC",nom:'Galería "Encanto"',dir:"Gamarra, Encanto 460"},
 {cod:"JEA",nom:'Galería "Jeans"',dir:"Gamarra, Jeans 327"}
];
function umOptions(sel){return UNIDADES.map(u=>'<option'+(u.cod===sel?' selected':'')+'>'+u.cod+'</option>').join('')}
/* filtros del listado: Tipo -> Categoría */
function fillSubFiltro(gid,sgid){
  const g=document.getElementById(gid).value, sg=document.getElementById(sgid);
  sg.innerHTML='<option value="">Todas</option>';
  CATEGORIAS.filter(c=>!g||c.tipo===g).forEach(c=>{const o=document.createElement('option');o.textContent=c.nom;o.value=c.nom;sg.appendChild(o)});
}
