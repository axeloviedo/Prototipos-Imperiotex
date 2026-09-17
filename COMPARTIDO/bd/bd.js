/* COMPARTIDO · Base de datos única del prototipo (Inventarios, Compras, Producción y Comercial).
   Se guarda en localStorage con la clave 'imperiotex.bd'. Contrato completo en docs/16_BASE_DATOS_COMPARTIDA.md.
   - Maestros: plantillas reales (datos/maestros-plantillas.js) + complementos (datos/maestros-complementos.js).
   - Dos escenarios de datos: 'maestros' (solo maestros, sin stock, movimientos ni documentos, para empezar de cero)
     y 'operacion' (maestros + compras, órdenes, movimientos, saldos y ventas ya registrados: datos/escenario-operacion.js).
   - Reiniciar borra todas las claves 'imperiotex.' y vuelve TODOS los módulos al escenario elegido.
   Requiere cargar antes: datos/maestros-plantillas.js y datos/maestros-complementos.js. */
const BD = {
  KEY: 'imperiotex.bd',
  KEY_ESCENARIO: 'imperiotex.bd.escenario',
  VERSION: 4,
  ESCENARIOS: { maestros: 'Solo maestros (empezar de cero)', operacion: 'Con operación (movimientos y saldos)' },
  d: null,
  /* texto del usuario activo que firma movimientos e historiales: cada módulo lo fija al iniciar */
  usuario: 'Usuario del prototipo',
  /* empresa activa (abreviatura del maestro de empresas): todo documento nace con la empresa de su almacén o con ésta (P-3) */
  empresa: 'SB',
  /* fecha fija opcional (la usa el generador de escenarios); si no, la del sistema o UI.reloj */
  reloj: null,
  _oyentes: [],

  /* ---------- utilidades sin dependencias ---------- */
  r2(v) { return Math.round((Number(v) || 0) * 100) / 100; },
  r4(v) { return Math.round((Number(v) || 0) * 10000) / 10000; },
  copia(x) { return JSON.parse(JSON.stringify(x)); },
  ahora() {
    if (BD.reloj) return BD.reloj;
    if (typeof UI !== 'undefined' && UI && UI.reloj) return UI.reloj;
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  },
  hoy() { return BD.ahora().slice(0, 10); },
  error(msg) { throw new Error(msg); },

  /* ---------- carga, guardado y escenarios ---------- */
  iniciar(usuario) {
    if (usuario) BD.usuario = usuario;
    if (BD.d) return BD.d;
    let d = null;
    try { d = JSON.parse(localStorage.getItem(BD.KEY) || 'null'); } catch (e) { d = null; }
    if (!d || d.version !== BD.VERSION) d = BD.construir(BD.escenarioGuardado());
    BD.d = d;
    BD.guardar();
    if (typeof window !== 'undefined' && window.addEventListener && !BD._escuchando) {
      BD._escuchando = true;
      window.addEventListener('storage', e => {
        if (e.key !== BD.KEY) return;
        try { const n = JSON.parse(e.newValue || 'null'); if (n) { BD.d = n; BD._oyentes.forEach(f => { try { f(); } catch (x) { console.error(x); } }); } } catch (x) { }
      });
    }
    return BD.d;
  },
  guardar() { try { localStorage.setItem(BD.KEY, JSON.stringify(BD.d)); } catch (e) { /* sin almacenamiento: sigue en memoria */ } },
  /* fn() se llama cuando otra pestaña (otro módulo) guarda cambios: refrescar la pantalla actual */
  alCambiar(fn) { BD._oyentes.push(fn); },
  escenario() { return (BD.d && BD.d.escenario) || BD.escenarioGuardado(); },
  escenarioGuardado() { try { return localStorage.getItem(BD.KEY_ESCENARIO) || 'operacion'; } catch (e) { return 'operacion'; } },
  /* reinicia TODO el prototipo con el escenario indicado (por defecto el actual) */
  reiniciar(escenario) {
    escenario = BD.ESCENARIOS[escenario] ? escenario : BD.escenario();
    try {
      Object.keys(localStorage).filter(k => k.indexOf('imperiotex.') === 0).forEach(k => localStorage.removeItem(k));
      localStorage.setItem(BD.KEY_ESCENARIO, escenario);
    } catch (e) { }
    BD.d = BD.construir(escenario);
    BD.guardar();
    return BD.d;
  },
  construir(escenario) {
    if (escenario === 'operacion' && typeof BD_ESCENARIO_OPERACION !== 'undefined' && BD_ESCENARIO_OPERACION && BD_ESCENARIO_OPERACION.version === BD.VERSION) {
      const d = BD.copia(BD_ESCENARIO_OPERACION);
      d.escenario = 'operacion';
      return d;
    }
    /* si todavía no existe el escenario de operación generado, se arranca solo con maestros */
    return BD.base('maestros');
  },
  /* escenario 'maestros': solo maestros, todo lo transaccional vacío y correlativos en 1 */
  base(escenario) {
    const d = {
      version: BD.VERSION, escenario: escenario || 'maestros', creado: BD.ahora(),
      seq: {},
      maestros: BD.maestrosIniciales(),
      stock: [], movs: [],
      sfs: [], sols: [], ocs: [], facturas: [], trfs: [], gres: [], ofs: [], lotes: [],
      config: { nombreRef: 'N° Referencia' }
    };
    /* colecciones propias de un área (p. ej. clientes y ventas de Comercial) declaradas en su archivo de datos */
    BD.extras().forEach(x => Object.keys(x.colecciones || {}).forEach(k => { if (d[k] === undefined) d[k] = BD.copia(x.colecciones[k]); }));
    return d;
  },
  /* datos propios de cada área: datos/maestros-logistica.js (BD_LOGISTICA) y datos/maestros-comercial.js (BD_COMERCIAL).
     Formato: { maestros: {clave: [..] | {..}}, colecciones: {clave: valor inicial} }. Las listas de maestros se agregan a las existentes. */
  extras() {
    return [typeof BD_LOGISTICA !== 'undefined' ? BD_LOGISTICA : null, typeof BD_COMERCIAL !== 'undefined' ? BD_COMERCIAL : null].filter(Boolean);
  },
  maestrosIniciales() {
    const P = BD_PLANTILLAS, C = BD_COMPLEMENTOS;
    const articulos = P.articulos.map(a => Object.assign({ costo: a.precioCompra || 0 }, a, C.ajustesArticulos[a.cod] || {})).concat(C.articulos);
    const m = BD.copia({
      empresas: P.empresas,
      sedes: P.sedes,
      almacenes: P.almacenes.concat(C.almacenes),
      unidades: P.unidades.map(u => ({ cod: u, nom: C.NOMBRES_UM[u] || u, origen: 'plantilla' })).concat(C.unidades),
      conversiones: C.conversiones,
      grupos: C.grupos,
      categorias: P.categorias.concat(C.categorias),
      subcategorias: P.subcategorias.concat(C.subcategorias),
      atributos: P.atributos.map(nom => ({ nom, vals: C.atributoValores[nom] || [] })),
      tiposCodigoBarra: P.tiposCodigoBarra,
      articulos,
      ldms: C.ldms,
      tiposRecurso: C.tiposRecurso,
      recursos: C.recursos,
      operarios: C.operarios,
      proveedores: P.proveedores.concat(C.proveedores),
      gruposProveedor: P.gruposProveedor,
      condicionesPago: P.condicionesPago,
      /* estructura organizativa (docx): organización y grupos de compras, grupos y tipos de movimiento */
      organizacionesCompra: P.organizacionesCompra || [],
      gruposCompra: P.gruposCompra || [],
      gruposMovimiento: P.gruposMovimiento || [],
      tiposMovimiento: P.tiposMovimiento || []
    });
    BD.extras().forEach(x => Object.keys(x.maestros || {}).forEach(k => {
      const v = BD.copia(x.maestros[k]);
      if (Array.isArray(m[k]) && Array.isArray(v)) v.forEach(it => { if (!(it && it.cod && m[k].some(e => e.cod === it.cod))) m[k].push(it); });
      else m[k] = v;
    }));
    return m;
  },

  /* correlativos compartidos: sig('oc','OC-',6) → OC-000001 */
  sig(serie, pref, dig) {
    if (BD.d.seq[serie] == null) BD.d.seq[serie] = 1;
    return (pref || '') + String(BD.d.seq[serie]++).padStart(dig || 6, '0');
  },
  hist(doc, accion, detalle, marca) { (doc.hist = doc.hist || []).push({ f: BD.ahora(), u: BD.usuario, a: accion, d: detalle || '', e: marca || 'ok' }); },

  /* ---------- lectura de maestros ---------- */
  m() { return BD.d.maestros; },
  art(cod) { return BD.d.maestros.articulos.find(a => a.cod === cod); },
  nomArt(cod) { const a = BD.art(cod) || BD.rec(cod); return a ? a.nom : cod; },
  u(cod) { const a = BD.art(cod) || BD.rec(cod); return a ? a.u : ''; },
  alm(cod) { return BD.d.maestros.almacenes.find(a => a.cod === cod); },
  almNom(cod) { const a = BD.alm(cod); return a ? a.nom : cod; },
  emp(abrev) { return BD.d.maestros.empresas.find(e => e.abrev === (abrev || BD.empresa)); },
  empNom(abrev) { const e = BD.emp(abrev); return e ? e.nom : (abrev || ''); },
  /* empresa de un documento: la de su almacén; si no tiene, la activa (P-3) */
  empresaDe(alm) { return (BD.alm(alm) || {}).emp || BD.empresa; },
  um(cod) { return BD.d.maestros.unidades.find(u => u.cod === cod); },
  prov(cod) { return BD.d.maestros.proveedores.find(p => p.cod === cod); },
  provNom(cod) { const p = BD.prov(cod); return p ? p.nom : cod; },
  rec(cod) { return BD.d.maestros.recursos.find(r => r.cod === cod); },
  tipoRec(nom) { return BD.d.maestros.tiposRecurso.find(t => t.nom === nom); },
  esServicio(cod) { const r = BD.rec(cod), a = BD.art(cod); return (r && r.tipo === 'SERVICIO DE TERCEROS') || (!!a && a.grupo === 'SRV'); },
  operario(cod) { return BD.d.maestros.operarios.find(o => o.cod === cod); },
  ldm(id) { return BD.d.maestros.ldms.find(l => l.id === id); },
  ldmsDe(art) { return BD.d.maestros.ldms.filter(l => l.art === art).sort((a, b) => (b.pred ? 1 : 0) - (a.pred ? 1 : 0)); },
  ldmPred(art) { return BD.ldmsDe(art)[0] || null; },
  fabricable(cod) { return BD.ldmsDe(cod).length > 0; },
  /* grupo de compras del artículo: lo define su Grupo de Artículo (K10) */
  grupoCompra(cod) { const a = BD.art(cod), g = a && BD.d.maestros.grupos.find(x => x.cod === a.grupo); return (g && g.grupoCompra) || ''; },
  attr(cod, nom) { const a = BD.art(cod); return a && a.attrs ? (a.attrs[nom] || '') : ''; },

  /* ---------- lectura de documentos ---------- */
  sf(id) { return BD.d.sfs.find(x => x.id === id); },
  sol(id) { return BD.d.sols.find(x => x.id === id); },
  oc(id) { return BD.d.ocs.find(x => x.id === id); },
  fac(id) { return BD.d.facturas.find(x => x.id === id); },
  of(id) { return BD.d.ofs.find(x => x.id === id); },
  gre(id) { return BD.d.gres.find(x => x.id === id); },
  trf(id) { return (BD.d.trfs || []).find(x => x.id === id); },
  mov(id) { return BD.d.movs.find(x => x.id === id); },
  tipoMov(cod) { return (BD.d.maestros.tiposMovimiento || []).find(t => t.cod === cod); }
};
