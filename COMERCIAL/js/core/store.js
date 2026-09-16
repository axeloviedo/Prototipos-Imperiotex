/* COMERCIAL — acceso a la BASE COMPARTIDA (BD, clave 'imperiotex.bd'). Comercial ya no guarda una copia propia:
   Store.d ES BD.d (maestros, stock y movimientos comunes + colecciones de Comercial: clientes, listas, cots, ventas, devs, sesiones, cmovs, comercial).
   El usuario activo de la demo no va en la base: se recuerda en localStorage 'imperiotex.comercial.usuario' (el reinicio global lo borra). */
const Store = {
  KEY_USUARIO: 'imperiotex.comercial.usuario',
  get d() { return BD.d; },
  _usuario: null,

  iniciar() {
    BD.iniciar();
    Store.completarBase();
    let cod = null;
    try { cod = localStorage.getItem(Store.KEY_USUARIO); } catch (e) { cod = null; }
    Store.fijarUsuario(cod && M.USUARIOS.some(u => u.cod === cod) ? cod : M.USUARIOS[0].cod, false);
    Cot.barrer();
    BD.guardar();
  },
  guardar() { BD.guardar(); },

  /* una base guardada antes de que existieran los datos de Comercial (o de otra versión de este archivo) se completa sin borrar nada.
     Propuesta para el núcleo: que BD.iniciar agregue los maestros y colecciones de área que falten. */
  completarBase() {
    const d = BD.d, X = typeof BD_COMERCIAL !== 'undefined' ? BD_COMERCIAL : { maestros: {}, colecciones: {} };
    Object.keys(X.maestros || {}).forEach(k => {
      const v = X.maestros[k];
      if (Array.isArray(v) && Array.isArray(d.maestros[k])) v.forEach(it => { if (!d.maestros[k].some(e => e.cod === it.cod)) d.maestros[k].push(BD.copia(it)); });
      else if (d.maestros[k] === undefined) d.maestros[k] = BD.copia(v);
    });
    Object.keys(X.colecciones || {}).forEach(k => { if (d[k] === undefined) d[k] = BD.copia(X.colecciones[k]); });
    const cfg0 = ((X.colecciones || {}).comercial || {}).cfg || {};
    d.comercial = d.comercial || {};
    d.comercial.cfg = Object.assign(BD.copia(cfg0), d.comercial.cfg || {});
  },

  /* reinicio GLOBAL (modal CL-46): BD.reiniciar borra todas las claves 'imperiotex.' y rearma la base del escenario elegido */
  reiniciar() {
    const esc = BD.escenario();
    UI.confirmar('Reiniciar todo el prototipo', '<p>Se reinicia la <b>base de datos compartida</b> con el escenario <b>«' + UI.esc(BD.ESCENARIOS[esc]) + '»</b> y se borran todas las claves <code>imperiotex.*</code>:</p>' +
      '<ul class="errlist"><li>Comercial: cotizaciones, ventas, devoluciones, cajas y movimientos; clientes, listas y configuración vuelven a su valor inicial.</li>' +
      '<li>Inventarios, Compras y Producción: se pierde también lo registrado (stock, movimientos, Solicitudes de Fabricación y de Materiales, órdenes).</li></ul>' +
      '<p>Para cambiar de escenario use el selector «Datos» de la barra superior.</p>', () => {
      BD.reiniciar(esc);
      location.reload();
    }, 'Reiniciar todo', 'CL-46');
  },

  /* correlativos de Comercial en la base (series propias: cli, cot, ven, dev, pag, caja, cmov, ree, lp, comp_<serie>) */
  sig(serie, pref, digitos) {
    if (BD.d.seq[serie] == null) BD.d.seq[serie] = (M.SEQ_INICIAL || {})[serie] || 1;
    return BD.sig(serie, pref, digitos);
  },
  anio() { return UI.hoy().slice(6, 10); },
  cfg() { return BD.d.comercial.cfg; },

  /* usuario activo de la demo; persistir=false lo cambia solo en memoria (la historia de la demo) */
  fijarUsuario(cod, persistir) {
    Store._usuario = cod;
    const u = Store.usuario();
    BD.usuario = u.cod + ' · ' + u.nom + ' (Comercial)';
    if (persistir !== false) { try { localStorage.setItem(Store.KEY_USUARIO, cod); } catch (e) { /* sin almacenamiento */ } }
  },
  usuario() { return M.USUARIOS.find(u => u.cod === Store._usuario) || M.USUARIOS[0]; },
  sede(cod) { return M.SEDES.find(s => s.cod === (cod || Store.usuario().sede)); },
  puede(perm) { if (!perm) return true; const u = Store.usuario(); return (M.PERFILES[u.perfil] || []).indexOf(perm) >= 0; },
  exigir(perm, que) { if (!Store.puede(perm)) throw new Error('Su perfil (' + Store.usuario().perfil + ') no puede ' + que + ': falta el permiso ' + perm); },

  /* artículos: los de la base; se venden los que tienen venta: true */
  art(cod) { return BD.art(cod); },
  arts() { return BD.d.maestros.articulos.filter(a => a.venta); },
  activo(a) { return !!a && a.estado !== 'Inactivo'; },
  cli(cod) { return BD.d.clientes.find(c => c.cod === cod); },
  cot(id) { return BD.d.cots.find(c => c.id === id); },
  venta(id) { return BD.d.ventas.find(v => v.id === id); },
  dev(id) { return BD.d.devs.find(x => x.id === id); },
  sesion(id) { return BD.d.sesiones.find(s => s.id === id); },
  hist(doc, accion, detalle) { (doc.hist = doc.hist || []).push({ f: UI.ahora(), u: Store.usuario().nom, a: accion, d: detalle || '' }); }
};
