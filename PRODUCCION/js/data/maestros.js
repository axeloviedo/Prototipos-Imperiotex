/* PRODUCCION · Producción — acceso a los maestros de la BASE COMPARTIDA (COMPARTIDO/bd, docs/16_BASE_DATOS_COMPARTIDA.md).
   M no guarda datos propios de artículos, almacenes, unidades, proveedores, listas de materiales, recursos, tipos de recurso ni operarios:
   todo se lee de BD.d.maestros (getters y funciones, sin copias). Las listas de materiales se editan en Inventarios (GI-17);
   recursos, tipos de recurso y operarios se editan aquí (PR-11 / PR-12) directamente en BD.d.maestros.
   Solo quedan en M los catálogos exclusivos de Producción (parámetros de control). */
const M = {
  /* Catálogos solo de Producción: parámetros de control por categoría de artículo (se miden en recibos e inspecciones) */
  CATALOGOS: {
    parametros: {
      'PANTALON': ['Largo total', 'Tiro delantero', 'Tiro posterior', 'Cintura', 'Cadera', 'Rodilla', 'Basta'],
      'TELAS': ['Ancho útil', 'Gramaje']
    }
  },

  _m() { return BD.d.maestros; },
  get EMPRESAS() { return M._m().empresas.map(e => e.nom); },
  get ARTICULOS() { return M._m().articulos; },
  get ALMACENES() { return M._m().almacenes; },
  get UNIDADES() { return M._m().unidades; },
  get PROVEEDORES() { return M._m().proveedores; },
  get LDMS() { return M._m().ldms; },
  get GRUPOS() { return M._m().grupos; },

  art: cod => BD.art(cod),
  nomArt: cod => BD.nomArt(cod),
  u: cod => BD.u(cod),
  alm: cod => BD.alm(cod),
  almNom: cod => BD.almNom(cod),
  grupoNom: cod => { const g = M._m().grupos.find(x => x.cod === cod); return g ? g.nom : cod; },
  recursos: () => M._m().recursos,
  tiposRecurso: () => M._m().tiposRecurso,
  operarios: () => M._m().operarios,
  rec: cod => BD.rec(cod),
  recActivos: filtro => M.recursos().filter(r => r.activo !== false && (!filtro || filtro(r))),
  tipoRec: nom => BD.tipoRec(nom),
  um: cod => BD.um(cod),
  prov: cod => BD.prov(cod),
  provNom: cod => BD.provNom(cod),
  ldm: id => BD.ldm(id),
  ldmsDe: art => BD.ldmsDe(art),
  ldmPred: art => BD.ldmPred(art),
  attr: (cod, nom) => BD.attr(cod, nom),
  fabricables: () => M.ARTICULOS.filter(a => BD.fabricable(a.cod)),
  /* almacenes de tránsito (producto en poder de terceros) */
  transitos: () => M.ALMACENES.filter(a => a.transito)
};
