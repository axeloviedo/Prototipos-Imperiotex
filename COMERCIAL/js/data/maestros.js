/* COMERCIAL — maestros leídos de la BASE COMPARTIDA (docs/16_BASE_DATOS_COMPARTIDA.md).
   Ya no hay copias propias: los catálogos de Comercial viven en COMPARTIDO/bd/datos/maestros-comercial.js (BD.d.maestros.comercial),
   los artículos, almacenes y conversiones son los de la base (BD.d.maestros). M es solo una fachada de lectura con los nombres de siempre.
   No toca el DOM al cargarse (lo ejecuta también el generador de escenarios en node). */
const M = {
  EMPRESAS: ['IMPERIOTEX', 'CATINNA NOW'],
  _c() { return BD.d.maestros.comercial; },
  /* almacenes donde hay producto para vender: producto terminado, liquidación, online y tiendas de la empresa de Comercial */
  almacenesVenta() {
    const emp = M._c().empresa || 'SB';
    return BD.d.maestros.almacenes.filter(a => a.emp === emp && a.estado !== 'Inactivo' && (/Tienda/.test(a.cat || '') || /Productos Terminados|Mercader|Liquidaci/i.test(a.contenido || '')));
  }
};

/* NOMBRE_EN_M → clave en BD.d.maestros.comercial */
[['SEDES', 'tiendas'], ['CAJAS', 'cajas'], ['MONEDAS', 'monedas'], ['CONDICIONES', 'condiciones'], ['METODOS', 'metodos'], ['COMPROBANTES', 'comprobantes'],
 ['SERIES', 'series'], ['DOC_REFERENCIAL', 'docReferencial'], ['SUSTENTO_DEV', 'sustentoDev'], ['TIPOS_DEV', 'tiposDev'], ['LUGARES_ENTREGA', 'lugaresEntrega'],
 ['AGENCIAS', 'agencias'], ['MOTIVOS_ANULACION', 'motivosAnulacion'], ['STOCK_CTRL', 'stockCtrl'], ['AFECTACION', 'afectacion'], ['TIPOS_DOC', 'tiposDoc'],
 ['TIPOS_CLIENTE', 'tiposCliente'], ['UBIGEOS', 'ubigeos'], ['USUARIOS', 'usuarios'], ['PERFILES', 'perfiles'], ['SEQ_INICIAL', 'seqInicial']
].forEach(x => Object.defineProperty(M, x[0], { get: () => M._c()[x[1]], enumerable: true }));
Object.defineProperty(M, 'ALMACENES', { get: () => M.almacenesVenta(), enumerable: true });
Object.defineProperty(M, 'CONVERSIONES', { get: () => BD.d.maestros.conversiones, enumerable: true });

M.metodo = cod => M.METODOS.find(m => m.cod === cod);
M.cond = cod => M.CONDICIONES.find(c => c.cod === cod);
M.comp = cod => M.COMPROBANTES.find(c => c.cod === cod);
M.lugar = cod => M.LUGARES_ENTREGA.find(l => l.cod === cod);
M.caja = cod => M.CAJAS.find(c => c.cod === cod);
M.alm = cod => BD.alm(cod);
M.almNom = cod => BD.almNom(cod);
M.ubigeo = cod => { const u = M.UBIGEOS.find(x => x.cod === cod); return u ? u.t : ''; };
M.sim = mon => mon === 'USD' ? 'US$' : 'S/';
M.nomArt = cod => BD.nomArt(cod);
M.grupoNom = cod => { const g = BD.d.maestros.grupos.find(x => x.cod === cod); return g ? g.nom : (cod || ''); };
