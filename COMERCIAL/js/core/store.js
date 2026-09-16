/* COMERCIAL V9 — estado de la demo en memoria, guardado en localStorage */
const Store = {
  KEY: 'imperiotex.v9.comercial',
  d: null,

  iniciar() {
    let txt = null;
    try { txt = localStorage.getItem(Store.KEY); } catch (e) { txt = null; }
    if (txt) { try { Store.d = JSON.parse(txt); } catch (e) { Store.d = null; } }
    if (!Store.d || Store.d.version !== Demo.VERSION) { Demo.crear(); Store.guardar(); }
    Cot.barrer();
  },
  guardar() { try { localStorage.setItem(Store.KEY, JSON.stringify(Store.d)); } catch (e) { /* sin almacenamiento: la demo sigue en memoria */ } },
  /* reinicio GLOBAL del prototipo: Inventarios, Compras, Producción y Comercial guardan con el prefijo 'imperiotex.' */
  PREFIJO: 'imperiotex.',
  borrarTodo() {
    const borradas = [];
    try {
      const claves = [];
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf(Store.PREFIJO) === 0) claves.push(k); }
      claves.forEach(k => { localStorage.removeItem(k); borradas.push(k); });
    } catch (e) { /* sin almacenamiento: no hay nada que borrar */ }
    return borradas;
  },
  reiniciar() {
    UI.confirmar('Reiniciar todo el prototipo', '<p>Se borran <b>todos</b> los datos guardados del prototipo general (claves <code>imperiotex.*</code>), no solo los de Comercial:</p>' +
      '<ul class="errlist"><li>Comercial: clientes, cotizaciones, ventas, devoluciones, cajas y movimientos.</li><li>Inventarios, Compras y Producción: también se pierde lo registrado (incluidas las Solicitudes de Fabricación y de Materiales).</li></ul>' +
      '<p>Comercial vuelve a su escenario inicial; los demás módulos lo harán al abrirlos.</p>', () => {
      Store.borrarTodo();
      Demo.crear(); Store.guardar(); App.nav(); App.go('cm02'); UI.toast('Prototipo reiniciado: se borraron los datos de todos los módulos');
    }, 'Reiniciar todo', 'CL-46');
  },

  /* correlativos: sig('ven','VEN-2026-',6) -> VEN-2026-000231 */
  sig(serie, pref, digitos) {
    if (Store.d.seq[serie] == null) Store.d.seq[serie] = 1;
    const n = Store.d.seq[serie]++;
    return pref + String(n).padStart(digitos, '0');
  },
  anio() { return UI.hoy().slice(6, 10); },

  usuario() { return M.USUARIOS.find(u => u.cod === Store.d.usuario) || M.USUARIOS[0]; },
  sede(cod) { return M.SEDES.find(s => s.cod === (cod || Store.usuario().sede)); },
  puede(perm) { if (!perm) return true; const u = Store.usuario(); return (M.PERFILES[u.perfil] || []).indexOf(perm) >= 0; },
  exigir(perm, que) { if (!Store.puede(perm)) throw new Error('Su perfil (' + Store.usuario().perfil + ') no puede ' + que + ': falta el permiso ' + perm); },

  art(cod) { return Store.d.arts.find(a => a.cod === cod); },
  cli(cod) { return Store.d.clientes.find(c => c.cod === cod); },
  cot(id) { return Store.d.cots.find(c => c.id === id); },
  venta(id) { return Store.d.ventas.find(v => v.id === id); },
  dev(id) { return Store.d.devs.find(x => x.id === id); },
  sesion(id) { return Store.d.sesiones.find(s => s.id === id); },
  hist(doc, accion, detalle) { (doc.hist = doc.hist || []).push({ f: UI.ahora(), u: Store.usuario().nom, a: accion, d: detalle || '' }); }
};
