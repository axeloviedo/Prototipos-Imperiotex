/* PRODUCCION · Producción — registro de pantallas, navegación y ejecución segura de acciones */
const App = {
  P: {}, actual: null, params: null,
  MENU: [
    { g: 'Fabricación', items: [['pr01', '✂', 'Órdenes de Fabricación'], ['pr03', '✎', 'Solicitudes de Fabricación'], ['pr05', '⇄', 'Solicitudes de materiales'], ['pr04', '☷', 'Referencias'], ['pr07', '▦', 'Plan de producción']] },
    { g: 'Consultas', items: [['pr08', '▤', 'Existencias y movimientos'], ['pr09', '◔', 'Costos']] },
    { g: 'Maestros', items: [['pr10', '≡', 'Listas de materiales'], ['pr11', '☺', 'Recursos'], ['pr12', '◇', 'Tipos de recurso']] }
  ],

  /* def: {titulo, menu (ítem del menú a resaltar), miga(params), render(params) -> html, despues(params)} */
  pantalla(id, def) { App.P[id] = def; },

  nav() {
    document.getElementById('nav').innerHTML = App.MENU.map(g => '<div class="nav-title">' + g.g + '</div>' +
      g.items.map(x => '<div class="nav-item" data-go="' + x[0] + '" onclick="App.go(\'' + x[0] + '\')"><span class="ic">' + x[1] + '</span> ' + x[2] + '</div>').join('')).join('');
  },

  go(id, params, conservarScroll) {
    const def = App.P[id];
    if (!def) { UI.toast('Pantalla no disponible: ' + id); return; }
    const y = window.scrollY;
    App.actual = id; App.params = params || {};
    let html;
    try { html = def.render(App.params); }
    catch (e) { console.error(e); html = '<div class="card aviso err"><b>Error al mostrar la pantalla</b><p class="hint">' + UI.esc(e.message) + '</p></div>'; }
    document.getElementById('content').innerHTML = html;
    const miga = def.miga ? def.miga(App.params) : '<b>' + def.titulo + '</b>';
    document.getElementById('breadcrumb').innerHTML = 'Producción / ' + miga;
    const menu = def.menu || id;
    document.querySelectorAll('#nav .nav-item').forEach(n => n.classList.toggle('active', n.dataset.go === menu));
    if (def.despues) { try { def.despues(App.params); } catch (e) { console.error(e); } }
    try { history.replaceState(null, '', '#' + id + (App.params.id ? '/' + encodeURIComponent(App.params.id) : '')); } catch (e) { }
    window.scrollTo(0, conservarScroll ? y : 0);
  },
  refrescar() { App.go(App.actual, App.params, true); },

  /* ejecuta una mutación: si falla muestra el motivo y no guarda; si va bien guarda y devuelve true */
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

  iniciar() {
    Store.iniciar();
    App.nav();
    const h = (location.hash || '').slice(1).split('/');
    if (h[0] && App.P[h[0]]) App.go(h[0], h[1] ? { id: decodeURIComponent(h[1]) } : {});
    else App.go('pr01');
  }
};
