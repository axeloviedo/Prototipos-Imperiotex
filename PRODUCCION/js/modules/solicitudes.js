/* PRODUCCION · PR-03 Solicitudes de Fabricación (Docs.sf de la base compartida).
   Se crean en Comercial (CL-30) o Inventarios (GI-22) y se aprueban en Inventarios (GI-23). Producción ve las Aprobadas, Convertidas en Orden y Fabricadas:
   crea sus órdenes (nacen Liberadas) con Prod.generarDesdeSF, que llama Docs.sf.convertir; al cerrar todas sus órdenes la solicitud queda Fabricada. */
const EST_SF = { 'Aprobada': 'var(--aprobado-sol)', 'Convertida en Orden': 'var(--prp)', 'Fabricada': 'var(--completada)' };

const PR03 = {
  render() {
    const R = Prod.nombreRef();
    return '<div class="screen-head"><h1>Solicitudes de Fabricación</h1><span class="code">PR-03</span></div>' +
      UI.tabla(['Solicitud', 'Fecha', 'Pedido', ['Unidades', 'num'], 'Requerida', 'Estado', R, ['Acciones', '', '130px']], Prod.sfsProduccion().map(sf =>
        '<tr><td><b>' + sf.id + '</b><br><span class="mini">' + UI.esc(sf.solic) + '</span></td><td>' + sf.fecha + '</td>' +
        '<td class="mini">' + sf.lineas.map(l => UI.esc(M.nomArt(l.art)) + ' × ' + UI.n(l.cant, 0)).join('<br>') + '</td><td class="num">' + UI.n(Docs.sf.total(sf), 0) + '</td>' +
        '<td class="mini">' + UI.esc(sf.fechaReq || '—') + '</td>' +
        '<td>' + UI.badge(sf.est, EST_SF[sf.est] || 'var(--borrador)') + '</td><td>' + (sf.ref || '—') + '</td>' +
        '<td><button class="btn btn-' + (sf.est === 'Aprobada' ? 'primary' : 'secondary') + ' btn-sm" onclick="App.go(\'pr03d\',{id:\'' + sf.id + '\'})">' + (sf.est === 'Aprobada' ? 'Crear órdenes' : '👁 Ver') + '</button></td></tr>'),
      { vacio: 'No hay solicitudes aprobadas' }) +
      '<p class="hint">Solo llegan las Solicitudes de Fabricación <b>aprobadas</b> (V°B° de Logística y Gerencia). Se crean en Comercial o Inventarios y se aprueban en Inventarios (GI-23); Producción no las modifica: crea sus órdenes y la solicitud pasa a «Convertida en Orden». Cuando todas sus órdenes se cierran queda «Fabricada».</p>';
  }
};
App.pantalla('pr03', { titulo: 'Solicitudes de Fabricación', render: PR03.render });

const PR03D = {
  render(p) {
    const sf = BD.sf(p.id), R = Prod.nombreRef();
    if (!sf) return UI.aviso('Solicitud no encontrada', 'err');
    let bloque;
    if (sf.est === 'Aprobada' && !sf.ofs.length) {
      const nec = Explosion.necesidades(sf.lineas.map(l => ({ art: l.art, cant: l.cant, ldm: l.ldm })));
      const filas = nec.map(n => ({ fase: Explosion.pasoArt(n.art), art: n.art, need: n.req, input: true, val: n.sugerido, alm: n.alm }))
        .concat(sf.lineas.map(l => ({ fase: Explosion.pasoArt(l.art, l.ldm), art: l.art, need: l.cant, input: false, val: l.cant, alm: sf.almDestino || Prod.almRecibo(l.art) })))
        .sort((a, b) => a.fase - b.fase || a.art.localeCompare(b.art));
      bloque = '<div class="sec">Órdenes que se van a crear (nacen Liberadas)<div style="flex:1"></div>' +
        '<span class="mini">' + UI.esc(R) + '</span> ' + PR01N.selRef('sf-ref', '') + ' <button class="btn btn-primary" onclick="PR03D.generar()">Crear órdenes</button></div>' +
        '<p class="hint">«Nueva» crea una referencia para estas órdenes. Vincular a una existente las suma a esa referencia (p. ej. otra solicitud de la misma campaña) para el listado por fase y el recosteo.</p>' +
        UI.tabla([['Fase', 'num', '60px'], 'Orden para', ['Se necesita', 'num'], ['A fabricar', 'num'], 'Entra en'], filas.map(x =>
          '<tr><td class="num"><b>' + x.fase + '</b></td><td>' + (x.input ? '' : '<b>') + UI.esc(M.nomArt(x.art)) + (x.input ? '' : '</b>') + '<br><span class="mini">' + x.art + '</span></td>' +
          '<td class="num">' + UI.n(x.need, 0) + '</td><td class="num">' + (x.input ? '<input type="number" min="0" step="any" id="sfa-' + x.art + '" value="' + x.val + '" style="width:90px;text-align:right;border:1px solid var(--borde);border-radius:5px;padding:5px">' : '<b>' + UI.n(x.val, 0) + '</b>') + '</td><td>' + (x.input ? '<select id="sfalm-' + x.art + '" style="border:1px solid var(--borde);border-radius:5px;padding:5px">' + UI.opts([{ v: '', t: 'Seleccionar…' }].concat(M.opcionesAlm(sf.emp || BD.empresaDe(sf.almDestino), x.alm, null, false)), x.alm) + '</select>' : '<span class="mini">' + x.alm + '</span>') + '</td></tr>'));
    } else {
      const ofs = Explosion.ordenar(sf.ofs.map(id => BD.of(id)).filter(Boolean)), sec = Explosion.secuencia(ofs);
      bloque = '<div class="sec">Órdenes · ' + UI.esc(R) + ' ' + UI.esc(sf.ref) + '</div>' +
        UI.tabla([['Fase', 'num', '60px'], 'Orden', 'Produce', ['Recibido', 'num'], 'Estado', ['Acciones', '', '80px']], ofs.map(o => '<tr><td class="num"><b>' + sec[o.id] + '</b></td><td><b>' + o.id + '</b></td>' +
          '<td>' + UI.esc(M.nomArt(o.art)) + '</td><td class="num">' + UI.n(o.prod, 0) + ' / ' + UI.n(o.cant, 0) + '</td><td>' + UI.estadoOF(o.estado) + '</td>' +
          '<td><button class="btn btn-secondary btn-sm" onclick="App.go(\'pr02\',{id:\'' + o.id + '\'})">👁 Ver</button></td></tr>'), { vacio: 'Sin órdenes' });
    }
    const aprobada = sf.est === 'Aprobada';
    return '<div class="screen-head"><h1>' + sf.id + '</h1>' + UI.badge(sf.est, EST_SF[sf.est] || 'var(--borrador)') +
      (sf.ref ? ' <span class="badge" style="background:var(--primario-claro)">' + UI.esc(R) + ' ' + UI.esc(sf.ref) + '</span>' : '') +
      '<div class="spacer"></div><button class="btn btn-secondary" onclick="App.go(\'pr03\')">Volver</button></div>' +
      '<div class="card"><div class="formgrid c4">' + UI.dato('Fecha', sf.fecha) + UI.dato('Solicitante', UI.esc(sf.solic)) + UI.dato('Mes', UI.esc(sf.mes)) + UI.dato('Requerida', UI.esc(sf.fechaReq)) +
      UI.dato('Almacén destino', UI.esc(sf.almDestino) + ' · ' + UI.esc(M.almNom(sf.almDestino))) + UI.dato('Aprobación', UI.esc(Prod.firmasSF(sf)), { estilo: 'grid-column:span 2' }) + UI.dato('Observación', UI.esc(sf.obs)) + '</div></div>' +
      '<div class="sec">Pedido</div>' + UI.tabla(['Artículo', 'Lista de materiales', ['Cantidad', 'num']], sf.lineas.map(l => '<tr><td>' + UI.esc(M.nomArt(l.art)) + ' <span class="mini">' + l.art + '</span></td><td class="mini">' + UI.esc(l.ldm) + '</td><td class="num"><b>' + UI.n(l.cant, 0) + '</b></td></tr>')) +
      bloque +
      '<div class="sec">Materia prima ' + (aprobada ? 'comprometida por la solicitud' : 'que comprometió la solicitud al aprobarse') + '</div>' +
      (aprobada ? '' : '<p class="hint">Al crear las órdenes la solicitud liberó este compromiso y cada orden comprometió lo suyo (pestaña Materiales de la orden).</p>') +
      UI.tabla(['Material', 'Almacén', [aprobada ? 'Comprometido' : 'Cantidad', 'num'], ['Stock Actual', 'num'], ['Stock Disponible', 'num']], (sf.comprometido || []).map(r => '<tr><td>' + UI.esc(M.nomArt(r.art)) + '</td><td class="mini">' + r.alm + '</td>' +
        '<td class="num">' + UI.q(r.cant, M.u(r.art)) + '</td><td class="num">' + UI.n(Stock.act(r.alm, r.art)) + '</td><td class="num">' + UI.n(Stock.disp(r.alm, r.art)) + '</td></tr>'), { vacio: 'Sin compromiso' });
  },
  generar() {
    const sf = BD.sf(App.params.id), sug = {}, alms = {};
    document.querySelectorAll('input[id^="sfa-"]').forEach(i => { sug[i.id.slice(4)] = parseFloat(i.value) || 0; });
    document.querySelectorAll('select[id^="sfalm-"]').forEach(s => { alms[s.id.slice(6)] = s.value; });
    const faltan = Object.keys(sug).filter(a => sug[a] > 0 && !alms[a]);
    if (faltan.length) { UI.toast('Elija el almacén donde entra lo producido de: ' + faltan.map(a => M.nomArt(a)).join(', ')); return; }
    const r = App.accion(() => Prod.generarDesdeSF(sf.id, sug, alms, UI.v('sf-ref')), x => x.length + ' órdenes creadas · ' + Prod.nombreRef() + ' ' + x[0].ref);
    if (r) App.go('pr01');
  }
};
App.pantalla('pr03d', {
  titulo: 'Solicitud de Fabricación', menu: 'pr03', render: PR03D.render,
  miga: p => '<a class="btn-link" onclick="App.go(\'pr03\')">Solicitudes de Fabricación</a> / <b>' + UI.esc(p.id) + '</b>'
});
