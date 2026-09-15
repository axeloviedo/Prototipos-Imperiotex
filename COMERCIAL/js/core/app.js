/* COMERCIAL V9 — registro de pantallas, navegación, usuario activo y ejecución segura de acciones */
const App = {
  P: {}, actual: null, params: null,
  /* cada ítem: [id, icono, título, permiso que lo muestra] */
  MENU: [
    { g: 'Ventas', items: [['cm01', '✎', 'Cotizaciones', 'ver_cotizacion'], ['cm02', '▤', 'Ventas', 'ver_venta'], ['cm03', '↩', 'Devoluciones', 'ver_devolucion_venta']] },
    { g: 'Caja', items: [['cm04', '▣', 'Caja de la tienda', 'ver_caja'], ['cm05', '☷', 'Historial de cajas', 'ver_caja']] },
    { g: 'Consultas', items: [['cm06', '▦', 'Existencias y movimientos', 'ver_existencias']] },
    { g: 'Maestros', items: [['cm07', '☺', 'Clientes', 'ver_cliente'], ['cm08', '$', 'Listas de precios', 'ver_venta'], ['cm09', '≡', 'Artículos de venta', 'ver_venta'], ['cm10', '⚙', 'Configuración', 'ver_venta']] }
  ],

  /* def: {titulo, menu, permiso, miga(params), render(params) -> html, despues(params)} */
  pantalla(id, def) { App.P[id] = def; },

  nav() {
    document.getElementById('nav').innerHTML = App.MENU.map(g => {
      const items = g.items.filter(x => Store.puede(x[3]));
      if (!items.length) return '';
      return '<div class="nav-title">' + g.g + '</div>' + items.map(x => '<div class="nav-item" data-go="' + x[0] + '" onclick="App.go(\'' + x[0] + '\')"><span class="ic">' + x[1] + '</span> ' + x[2] + '</div>').join('');
    }).join('');
    const u = Store.usuario(), s = Store.sede();
    document.getElementById('user-sel').innerHTML = UI.opts(M.USUARIOS.map(x => ({ v: x.cod, t: x.nom + ' · ' + x.perfil })), u.cod);
    document.getElementById('user-avatar').textContent = u.cod.replace('USER', 'U');
    document.getElementById('user-sede').textContent = s ? s.nom : '';
  },

  go(id, params, conservarScroll) {
    const def = App.P[id];
    if (!def) { UI.toast('Pantalla no disponible: ' + id); return; }
    if (def.permiso && !Store.puede(def.permiso)) {
      UI.toast('Su perfil no tiene el permiso ' + def.permiso);
      if (id !== App.primera()) App.go(App.primera());
      return;
    }
    const y = window.scrollY;
    App.actual = id; App.params = params || {};
    let html;
    try { html = def.render(App.params); }
    catch (e) { console.error(e); html = '<div class="card aviso err"><b>Error al mostrar la pantalla</b><p class="hint">' + UI.esc(e.message) + '</p></div>'; }
    document.getElementById('content').innerHTML = html;
    const miga = def.miga ? def.miga(App.params) : '<b>' + def.titulo + '</b>';
    document.getElementById('breadcrumb').innerHTML = 'Comercial / ' + miga;
    const menu = def.menu || id;
    document.querySelectorAll('#nav .nav-item').forEach(n => n.classList.toggle('active', n.dataset.go === menu));
    if (def.despues) { try { def.despues(App.params); } catch (e) { console.error(e); } }
    try { history.replaceState(null, '', '#' + id + (App.params.id ? '/' + encodeURIComponent(App.params.id) : '')); } catch (e) { }
    window.scrollTo(0, conservarScroll ? y : 0);
  },
  refrescar() { App.go(App.actual, App.params, true); },
  primera() {
    for (const g of App.MENU) for (const x of g.items) if (Store.puede(x[3])) return x[0];
    return 'cm02';
  },

  /* ejecuta una mutación: si falla muestra el motivo; si va bien guarda y devuelve el resultado (o true) */
  accion(fn, okMsg) {
    try {
      const r = fn();
      Store.guardar();
      if (okMsg) UI.toast(typeof okMsg === 'function' ? okMsg(r) : okMsg);
      return r === undefined ? true : r;
    } catch (e) {
      console.warn(e);
      UI.toast(e.message || String(e));
      Store.guardar();
      return false;
    }
  },

  cambiarUsuario(cod) {
    Store.d.usuario = cod; Store.guardar();
    App.nav();
    const def = App.P[App.actual];
    if (def && def.permiso && !Store.puede(def.permiso)) App.go(App.primera()); else App.refrescar();
    UI.toast('Ahora trabaja como ' + Store.usuario().nom + ' en ' + Store.sede().nom);
  },

  iniciar() {
    Store.iniciar();
    App.nav();
    const h = (location.hash || '').slice(1).split('/');
    if (h[0] && App.P[h[0]]) App.go(h[0], h[1] ? { id: decodeURIComponent(h[1]) } : {});
    else App.go('cm02');
  }
};
