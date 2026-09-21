/* PRODUCCION · Buscadores en modal de artículos y recursos (como GI-17a / GI-17b) */
const BUS = {
  _cb: null, _filtro: null,
  articulo(titulo, filtro, cb) {
    BUS._cb = cb; BUS._filtro = filtro || (() => true);
    const grupos = [...new Set(M.ARTICULOS.filter(BUS._filtro).map(a => a.grupo))].map(g => ({ v: g, t: M.grupoNom(g) }));
    UI.modal({
      lg: true, titulo,
      cuerpo: '<div class="filters" style="margin-bottom:10px">' +
        UI.campo('Código / nombre', '<input id="bus-q" placeholder="Buscar…" oninput="BUS.pintarArt()">') +
        UI.campo('Grupo de Artículo', '<select id="bus-g" onchange="BUS.pintarArt()">' + UI.opts(grupos, '', 'Todos') + '</select>') + '</div><div id="bus-body"></div>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cerrar</button>'
    });
    BUS.pintarArt();
  },
  pintarArt() {
    const q = UI.v('bus-q').toLowerCase(), g = UI.v('bus-g');
    const lista = M.ARTICULOS.filter(BUS._filtro).filter(a => (!g || a.grupo === g) && (!q || a.cod.toLowerCase().includes(q) || a.nom.toLowerCase().includes(q)));
    document.getElementById('bus-body').innerHTML = UI.tabla(['Código', 'Artículo', 'Unidad', 'Grupo', ['Stock Disponible', 'num'], ['', '', '100px']], lista.map(a => {
      const disp = Stock.totalDisp(a.cod);
      const attrs = BD.attrsOrdenados(a).map(([k, v]) => k + ': ' + v).join(' · ');
      return '<tr><td>' + a.cod + '</td><td>' + UI.esc(a.nom) + (attrs ? '<br><span class="mini">' + UI.esc(attrs) + '</span>' : '') + '</td><td>' + a.u + '</td><td class="mini">' + UI.esc(M.grupoNom(a.grupo)) + '</td>' +
        '<td class="num">' + (a.inv !== false ? UI.n(disp) : '—') + '</td><td><button class="btn btn-primary btn-sm" onclick="BUS.elegir(\'' + a.cod + '\')">Seleccionar</button></td></tr>';
    }), { vacio: 'Sin resultados' });
  },
  recurso(titulo, cb) {
    BUS._cb = cb;
    UI.modal({
      lg: true, titulo,
      cuerpo: '<div class="filters" style="margin-bottom:10px">' + UI.campo('Código / nombre', '<input id="bus-q" placeholder="Buscar recurso…" oninput="BUS.pintarRec()">') + '</div><div id="bus-body"></div>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cerrar</button>'
    });
    BUS.pintarRec();
  },
  pintarRec() {
    const q = UI.v('bus-q').toLowerCase();
    document.getElementById('bus-body').innerHTML = UI.tabla(['Código', 'Recurso', 'Tipo', 'Unidad', ['Costo', 'num'], ['', '', '100px']],
      M.recActivos(r => !q || r.cod.toLowerCase().includes(q) || r.nom.toLowerCase().includes(q)).map(r =>
        '<tr><td>' + r.cod + '</td><td>' + UI.esc(r.nom) + '</td><td class="mini">' + r.tipo + '</td><td>' + r.u + '</td><td class="num">' + UI.s(r.costo) + '</td>' +
        '<td><button class="btn btn-primary btn-sm" onclick="BUS.elegir(\'' + r.cod + '\')">Seleccionar</button></td></tr>'), { vacio: 'Sin resultados' });
  },
  elegir(cod) { const cb = BUS._cb; UI.cerrar(); if (cb) cb(cod); }
};
