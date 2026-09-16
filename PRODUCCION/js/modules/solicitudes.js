/* PRODUCCION · PR-03 Solicitudes de Fabricación (aprobadas en GP): crean órdenes Estándar */
const EST_SF = { 'Aprobada': 'var(--aprobado-sol)', 'En fabricación': 'var(--prp)', 'Fabricada': 'var(--completada)' };

const PR03 = {
  render() {
    const R = Prod.nombreRef();
    return '<div class="screen-head"><h1>Solicitudes de Fabricación</h1><span class="code">PR-03</span></div>' +
      UI.tabla(['Solicitud', 'Fecha', 'Pedido', ['Unidades', 'num'], 'Estado', R, ['Acciones', '', '130px']], Store.d.sfs.filter(sf => EST_SF[sf.est]).map(sf =>
        '<tr><td><b>' + sf.id + '</b></td><td>' + sf.fecha + '</td>' +
        '<td class="mini">' + sf.lineas.map(l => UI.esc(M.nomArt(l.art)) + ' × ' + l.cant).join('<br>') + '</td><td class="num">' + UI.n(sf.lineas.reduce((a, l) => a + l.cant, 0), 0) + '</td>' +
        '<td>' + UI.badge(sf.est, EST_SF[sf.est] || 'var(--borrador)') + '</td><td>' + (sf.ref || '—') + '</td>' +
        '<td><button class="btn btn-' + (sf.ofs.length ? 'secondary' : 'primary') + ' btn-sm" onclick="App.go(\'pr03d\',{id:\'' + sf.id + '\'})">' + (sf.ofs.length ? '👁 Ver' : 'Crear órdenes') + '</button></td></tr>')) +
      '<p class="hint">Solo llegan las Solicitudes de Pedido <b>aprobadas</b> (V°B° de Logística y Gerencia). Se crean, editan y aprueban en Inventarios (GP-01), pantalla compartida por Logística y Comercial; Producción no las modifica: crea sus órdenes.</p>';
  }
};
App.pantalla('pr03', { titulo: 'Solicitudes de Fabricación', render: PR03.render });

const PR03D = {
  render(p) {
    const sf = Store.sf(p.id), R = Prod.nombreRef();
    if (!sf) return UI.aviso('Solicitud no encontrada', 'err');
    let bloque;
    if (!sf.ofs.length) {
      const nec = Explosion.necesidades(sf.lineas.map(l => ({ art: l.art, cant: l.cant, ldm: l.ldm })));
      const filas = nec.map(n => ({ fase: Explosion.pasoArt(n.art), art: n.art, need: n.req, input: true, val: n.sugerido, alm: n.alm }))
        .concat(sf.lineas.map(l => ({ fase: Explosion.pasoArt(l.art, l.ldm), art: l.art, need: l.cant, input: false, val: l.cant, alm: sf.almDestino })))
        .sort((a, b) => a.fase - b.fase || a.art.localeCompare(b.art));
      bloque = '<div class="sec">Órdenes que se van a crear (nacen Liberadas)<div style="flex:1"></div><button class="btn btn-primary" onclick="PR03D.generar()">Crear órdenes</button></div>' +
        UI.tabla([['Fase', 'num', '60px'], 'Orden para', ['Se necesita', 'num'], ['A fabricar', 'num'], 'Entra en'], filas.map(x =>
          '<tr><td class="num"><b>' + x.fase + '</b></td><td>' + (x.input ? '' : '<b>') + UI.esc(M.nomArt(x.art)) + (x.input ? '' : '</b>') + '<br><span class="mini">' + x.art + '</span></td>' +
          '<td class="num">' + UI.n(x.need, 0) + '</td><td class="num">' + (x.input ? '<input type="number" min="0" step="any" id="sfa-' + x.art + '" value="' + x.val + '" style="width:90px;text-align:right;border:1px solid var(--borde);border-radius:5px;padding:5px">' : '<b>' + UI.n(x.val, 0) + '</b>') + '</td><td class="mini">' + x.alm + '</td></tr>'));
    } else {
      const ofs = Explosion.ordenar(sf.ofs.map(id => Store.of(id)).filter(Boolean)), sec = Explosion.secuencia(ofs);
      bloque = '<div class="sec">Órdenes · ' + UI.esc(R) + ' ' + sf.ref + '</div>' +
        UI.tabla([['Fase', 'num', '60px'], 'Orden', 'Produce', ['Recibido', 'num'], 'Estado', ['Acciones', '', '80px']], ofs.map(o => '<tr><td class="num"><b>' + sec[o.id] + '</b></td><td><b>' + o.id + '</b></td>' +
          '<td>' + UI.esc(M.nomArt(o.art)) + '</td><td class="num">' + UI.n(o.prod, 0) + ' / ' + UI.n(o.cant, 0) + '</td><td>' + UI.estadoOF(o.estado) + '</td>' +
          '<td><button class="btn btn-secondary btn-sm" onclick="App.go(\'pr02\',{id:\'' + o.id + '\'})">👁 Ver</button></td></tr>'));
    }
    return '<div class="screen-head"><h1>' + sf.id + '</h1>' + UI.badge(sf.est, EST_SF[sf.est] || 'var(--borrador)') +
      (sf.ref ? ' <span class="badge" style="background:var(--primario-claro)">' + UI.esc(R) + ' ' + sf.ref + '</span>' : '') +
      '<div class="spacer"></div><button class="btn btn-secondary" onclick="App.go(\'pr03\')">Volver</button></div>' +
      '<div class="card"><div class="formgrid c4">' + UI.dato('Fecha', sf.fecha) + UI.dato('Solicitante', UI.esc(sf.solic)) + UI.dato('Requerida', sf.fechaReq) + UI.dato('Aprobación', UI.esc(sf.firmas)) + '</div></div>' +
      '<div class="sec">Pedido</div>' + UI.tabla(['Artículo', ['Cantidad', 'num']], sf.lineas.map(l => '<tr><td>' + UI.esc(M.nomArt(l.art)) + ' <span class="mini">' + l.art + '</span></td><td class="num"><b>' + UI.n(l.cant, 0) + '</b></td></tr>')) +
      bloque +
      '<div class="sec">Materia prima</div>' +
      UI.tabla(['Material', 'Almacén', ['Stock Comprometido', 'num'], ['Stock Actual', 'num'], ['Stock Disponible', 'num']], (sf.comprometido || []).map(r => '<tr><td>' + UI.esc(M.nomArt(r.art)) + '</td><td class="mini">' + r.alm + '</td>' +
        '<td class="num">' + UI.q(r.cant, M.u(r.art)) + '</td><td class="num">' + UI.n(Stock.act(r.alm, r.art)) + '</td><td class="num">' + UI.n(Stock.disp(r.alm, r.art)) + '</td></tr>'), { vacio: 'Sin compromiso' });
  },
  generar() {
    const sf = Store.sf(App.params.id), sug = {};
    document.querySelectorAll('input[id^="sfa-"]').forEach(i => { sug[i.id.slice(4)] = parseFloat(i.value) || 0; });
    const r = App.accion(() => Prod.generarDesdeSF(sf.id, sug), x => x.length + ' órdenes creadas · ' + Prod.nombreRef() + ' ' + sf.ref);
    if (r) App.go('pr01');
  }
};
App.pantalla('pr03d', {
  titulo: 'Solicitud de Fabricación', menu: 'pr03', render: PR03D.render,
  miga: p => '<a class="btn-link" onclick="App.go(\'pr03\')">Solicitudes de Fabricación</a> / <b>' + UI.esc(p.id) + '</b>'
});
