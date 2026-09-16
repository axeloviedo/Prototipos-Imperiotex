/* COMERCIAL V9 · CL-40 Listas de precios (cascada + simulador; modales CL-41, CL-42) · CL-43 Artículos de venta (datos de la pestaña Venta de GI-02; modal CL-44) */
const CM08 = {
  art: 'PT-0001', sim: { um: 'UND', sede: 'TDA-01', tipo: 'MINORISTA', mon: 'PEN' },
  ORDEN: { 'Tienda y tipo de cliente': 0, 'Tienda': 1, 'Tipo de cliente': 2, 'General': 3 },
  render() {
    const arts = Store.arts().filter(a => a.venta);
    let a = Store.art(CM08.art);
    if (!a || !a.venta) { a = arts[0]; CM08.art = a.cod; }
    const ums = a.uVenta || [a.u];
    if (ums.indexOf(CM08.sim.um) < 0) CM08.sim.um = ums[0];
    const ed = Store.puede('editar_precios'), s = CM08.sim;
    const filas = Store.d.listas.filter(l => l.art === a.cod).sort((x, y) => x.mon.localeCompare(y.mon) || x.um.localeCompare(y.um) || CM08.ORDEN[Listas.nivel(x)] - CM08.ORDEN[Listas.nivel(y)]);
    const sel = (campo, lista, val) => '<select onchange="CM08.sim.' + campo + '=this.value;App.refrescar()">' + UI.opts(lista, val) + '</select>';

    let html = '<div class="screen-head"><h1>Listas de precios</h1><span class="code">CL-40</span><div class="spacer"></div><button class="btn btn-secondary" onclick="CM08.excel()">⇩ Excel</button></div>';
    html += UI.aviso('<b>Cómo se elige el precio</b> (por artículo, unidad de venta y moneda), de lo más específico a lo general: ' +
      '<b>1.</b> tienda y tipo de cliente · <b>2.</b> tienda · <b>3.</b> tipo de cliente · <b>4.</b> general · <b>5.</b> precio sugerido del artículo (GI-02), solo en soles. ' +
      'Si una línea no tiene precio en la moneda del documento, el cambio de moneda se revierte. El precio mínimo y el rango de descuento se controlan aparte (CL-43).', 'info');
    html += '<div class="card"><div class="formgrid c4">' +
      UI.campo('Artículo', '<select onchange="CM08.art=this.value;App.refrescar()">' + UI.opts(arts.map(x => ({ v: x.cod, t: x.cod + ' · ' + x.nom })), a.cod) + '</select>', { estilo: 'grid-column:span 2' }) +
      UI.dato('Precio sugerido · mínimo', UI.s(a.precioVenta) + ' · ' + (a.precioMin ? UI.s(a.precioMin) + (a.verifMin || Store.cfg().verificarPrecioMin ? ' (se verifica)' : ' (no se verifica)') : 'sin mínimo')) +
      UI.dato('Unidades de venta', ums.map(u => u + (Precios.factor(a.cod, u) > 1 ? ' = ' + Precios.factor(a.cod, u) + ' ' + a.u : '')).join(' · ')) + '</div></div>';

    html += '<div class="sec">Precios de ' + a.cod + '<div class="spacer"></div>' + (ed ? '<button class="btn btn-primary btn-sm" onclick="CM08.fila()">+ Agregar precio</button>' : '') + '</div>' +
      UI.tabla(['Fila', 'Moneda', 'UM', 'Tienda', 'Tipo de cliente', 'Nivel', ['Precio', 'num'], ['', '', '120px']], filas.map(l =>
        '<tr><td class="mini">' + l.id + '</td><td>' + l.mon + '</td><td>' + l.um + '</td><td>' + (l.sede ? UI.esc(Store.sede(l.sede).nom) : '<span class="mini">Todas</span>') + '</td>' +
        '<td>' + (l.tipo || '<span class="mini">Todos</span>') + '</td><td class="mini">' + Listas.nivel(l) + '</td><td class="num"><b>' + UI.m(l.precio, l.mon) + '</b></td>' +
        '<td>' + (ed ? '<button class="btn-link" onclick="CM08.fila(\'' + l.id + '\')">Editar</button> <button class="btn-link" onclick="CM08.quitar(\'' + l.id + '\')">Quitar</button>' : '') + '</td></tr>'),
        { vacio: 'Sin filas: se usa el precio sugerido del artículo (solo en soles)' });

    const cands = Store.d.listas.filter(l => l.art === a.cod && l.um === s.um && l.mon === s.mon);
    let usado = false;
    const niveles = Precios.NIVELES.map(n => { const x = cands.find(l => n.f(l, s.sede, s.tipo)); const r = { t: n.t, x, gana: !!x && !usado }; if (x) usado = true; return r; });
    const r = Precios.resolver(a.cod, s.um, s.sede, s.tipo, s.mon);
    html += '<div class="card"><div class="sec">Simulador</div><div class="formgrid c4">' +
      UI.campo('Unidad', sel('um', ums, s.um)) + UI.campo('Tienda', sel('sede', [{ v: '', t: 'Sin tienda' }].concat(M.SEDES.map(x => ({ v: x.cod, t: x.nom }))), s.sede)) +
      UI.campo('Tipo de cliente', sel('tipo', [{ v: '', t: 'Sin tipo' }].concat(M.TIPOS_CLIENTE.map(t => ({ v: t, t }))), s.tipo)) + UI.campo('Moneda', sel('mon', M.MONEDAS.map(m => m.cod), s.mon)) + '</div>' +
      '<div style="display:flex;gap:18px;align-items:flex-start;margin-top:12px;flex-wrap:wrap"><div style="flex:1;min-width:320px">' +
      UI.tabla(['Nivel', 'Fila', ['Precio', 'num'], ''], niveles.map((n, i) => '<tr><td>' + (i + 1) + '. ' + n.t + '</td><td class="mini">' + (n.x ? n.x.id : '—') + '</td><td class="num">' + (n.x ? UI.m(n.x.precio, n.x.mon) : '') + '</td><td>' + (n.gana ? '<b class="ok-t">✓ se usa</b>' : n.x ? '<span class="mini">ignorado</span>' : '') + '</td></tr>')
        .concat(['<tr><td>5. Precio sugerido del artículo</td><td class="mini">GI-02</td><td class="num">' + (s.mon === 'PEN' ? UI.s((a.precioVenta || 0) * Precios.factor(a.cod, s.um)) : '<span class="mini">solo PEN</span>') + '</td><td>' + (!usado && r ? '<b class="ok-t">✓ se usa</b>' : '') + '</td></tr>'])) +
      '</div><div class="kpi" style="min-width:220px"><div class="l">Precio resultante</div><div class="v">' + (r ? UI.m(r.precio, s.mon) : '<span class="err-t">Sin precio</span>') + '</div><div class="s">' + (r ? r.origen : 'no se puede vender en ' + s.mon) + '</div></div></div></div>';

    html += '<div class="sec">Resumen de artículos (unidad de inventario)</div>' +
      UI.tabla(['Código', 'Artículo', ['General S/', 'num'], ['Mayorista S/', 'num'], ['General US$', 'num'], ['Exportación US$', 'num'], ['Filas', 'num']], arts.map(x => {
        const u = x.u, pr = (tipo, mon) => { const k = Precios.resolver(x.cod, u, '', tipo, mon); return k ? UI.n(k.precio) + (k.fila ? '' : ' <span class="mini">sug.</span>') : '<span class="mini">—</span>'; };
        return '<tr class="clickable" onclick="CM08.art=\'' + x.cod + '\';App.refrescar()"><td>' + x.cod + '</td><td>' + UI.esc(x.nom) + '</td><td class="num">' + pr('', 'PEN') + '</td><td class="num">' + pr('MAYORISTA', 'PEN') + '</td><td class="num">' + pr('', 'USD') + '</td><td class="num">' + pr('EXPORTACIÓN', 'USD') + '</td><td class="num">' + Store.d.listas.filter(l => l.art === x.cod).length + '</td></tr>';
      }));
    return html;
  },
  fila(id) {
    const a = Store.art(CM08.art), l = id ? Store.d.listas.find(x => x.id === id) : { um: (a.uVenta || [a.u])[0], sede: '', tipo: '', mon: 'PEN', precio: '' };
    UI.modal({
      titulo: (id ? 'Editar ' + id : 'Nuevo precio') + ' · ' + a.cod, code: 'CL-41',
      cuerpo: '<div class="formgrid">' + UI.dato('Artículo', UI.esc(a.nom), { full: true }) +
        UI.campo('Unidad de venta', '<select id="lp-um">' + UI.opts(a.uVenta || [a.u], l.um) + '</select>', { req: true }) +
        UI.campo('Moneda', '<select id="lp-mon">' + UI.opts(M.MONEDAS.map(m => m.cod), l.mon) + '</select>', { req: true }) +
        UI.campo('Tienda', '<select id="lp-sede">' + UI.opts([{ v: '', t: 'Todas' }].concat(M.SEDES.map(x => ({ v: x.cod, t: x.nom }))), l.sede) + '</select>') +
        UI.campo('Tipo de cliente', '<select id="lp-tipo">' + UI.opts([{ v: '', t: 'Todos' }].concat(M.TIPOS_CLIENTE.map(t => ({ v: t, t }))), l.tipo) + '</select>') +
        UI.campo('Precio (incluye IGV)', '<input id="lp-precio" type="number" min="0" step="any" value="' + l.precio + '">', { req: true }) + '</div>' +
        '<p class="hint" style="margin-top:8px">No puede haber dos filas con la misma combinación de unidad, tienda, tipo de cliente y moneda.</p>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="CM08.guardar(\'' + (id || '') + '\')">Guardar</button>'
    });
  },
  guardar(id) {
    const x = { art: CM08.art, um: UI.v('lp-um'), mon: UI.v('lp-mon'), sede: UI.v('lp-sede'), tipo: UI.v('lp-tipo'), precio: UI.v('lp-precio') };
    if (App.accion(() => Listas.guardar(x, id || null), l => 'Precio ' + l.id + ' guardado')) { UI.cerrar(); App.refrescar(); }
  },
  quitar(id) {
    UI.confirmar('Quitar ' + id, '<p>Los documentos ya emitidos conservan su precio; los nuevos usarán el siguiente nivel de la cascada.</p>', () => { if (App.accion(() => Listas.quitar(id), id + ' quitado')) App.refrescar(); }, 'Quitar', 'CL-42');
  },
  excel() {
    UI.csv('listas-de-precios', ['Fila', 'Código', 'Artículo', 'UM', 'Tienda', 'Tipo de cliente', 'Nivel', 'Moneda', 'Precio'],
      Store.d.listas.map(l => [l.id, l.art, M.nomArt(l.art), l.um, l.sede ? Store.sede(l.sede).nom : 'Todas', l.tipo || 'Todos', Listas.nivel(l), l.mon, l.precio]));
  }
};
App.pantalla('cm08', { titulo: 'Listas de precios', permiso: 'ver_venta', render: CM08.render });

const CM09 = {
  f: { q: '', grupo: '' },
  render() {
    const f = CM09.f, q = f.q.toLowerCase(), ed = Store.puede('editar_precios');
    const arts = Store.arts().filter(a => a.venta && (!f.grupo || a.grupo === f.grupo) && (!q || (a.cod + ' ' + a.nom).toLowerCase().includes(q)));
    return '<div class="screen-head"><h1>Artículos de venta</h1><span class="code">CL-43</span></div>' +
      '<div class="card"><div class="filters">' + UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" onchange="CM09.f.q=this.value;App.refrescar()" placeholder="Código o nombre">') +
      UI.campo('Grupo de Artículo', '<select onchange="CM09.f.grupo=this.value;App.refrescar()">' + UI.opts([...new Set(Store.arts().map(a => a.grupo))].map(g => ({ v: g, t: M.grupoNom(g) })), f.grupo, 'Todos') + '</select>') + '</div></div>' +
      UI.tabla(['Código', 'Artículo', 'Grupo', 'UM venta', ['Precio sugerido', 'num'], ['Precio mínimo', 'num'], ['Descuento', 'num'], 'IGV', 'Control de stock al vender', ['Disponible', 'num'], ['', '', '70px']], arts.map(a =>
        '<tr><td>' + a.cod + '</td><td>' + UI.esc(a.nom) + '</td><td class="mini">' + UI.esc(M.grupoNom(a.grupo)) + (a.origen === 'comercial' ? '<br><span class="mini">servicio de Comercial</span>' : '') + '</td><td>' + (a.uVenta || [a.u]).join(', ') + '</td>' +
        '<td class="num">' + UI.s(a.precioVenta) + '</td><td class="num">' + (a.precioMin ? UI.s(a.precioMin) + '<br><span class="mini">' + (a.verifMin || Store.cfg().verificarPrecioMin ? 'se verifica' : 'no se verifica') + '</span>' : '—') + '</td>' +
        '<td class="num">' + (a.dctoMin || 0) + '% – ' + (a.dctoMax || 0) + '%</td><td class="mini">' + a.igv + '</td>' +
        '<td class="mini">' + (a.inv ? (M.STOCK_CTRL.find(s => s.v === a.stockCtrl) || {}).t : 'Servicio: sin stock') + '</td>' +
        '<td class="num">' + (a.inv ? UI.n(Stock.totalDisp(a.cod), 0) : '—') + '</td>' +
        '<td>' + (ed ? '<button class="btn-link" onclick="CM09.editar(\'' + a.cod + '\')">Editar</button>' : '') + '</td></tr>'), { vacio: 'Sin artículos' }) +
      '<p class="hint">Son los artículos de la base compartida marcados «Venta» (el maestro completo vive en Inventarios, GI-02); aquí solo se ven y ajustan los datos de su pestaña Venta, que se guardan en la misma base. ' +
      'Control de stock (contra el Disponible, que ya descuenta lo comprometido por ventas pendientes): <b>Bloquear</b> impide vender sin disponible · <b>Avisar y permitir</b> muestra el aviso y deja vender · <b>No verificar</b> vende sin mirar el stock. Los servicios no son inventariables: no llevan almacén, stock ni devolución.</p>';
  },
  editar(cod) {
    const a = Store.art(cod);
    UI.modal({
      titulo: 'Datos de venta · ' + a.cod, code: 'CL-44',
      cuerpo: '<div class="formgrid">' + UI.dato('Artículo', UI.esc(a.nom), { full: true }) +
        UI.campo('Precio sugerido (S/, por ' + a.u + ')', '<input id="av-precio" type="number" min="0" step="any" value="' + (a.precioVenta || 0) + '">', { req: true }) +
        UI.campo('Precio mínimo de venta (S/)', '<input id="av-min" type="number" min="0" step="any" value="' + (a.precioMin || 0) + '">', { hint: '0 = sin mínimo' }) +
        '<div class="field full"><label class="check"><input type="checkbox" id="av-verif"' + (a.verifMin ? ' checked' : '') + '> Verificar el precio mínimo en este artículo <span class="hint">(la Configuración puede exigirlo para toda la empresa)</span></label></div>' +
        UI.campo('Descuento mínimo (%)', '<input id="av-dmin" type="number" min="0" max="100" step="any" value="' + (a.dctoMin || 0) + '">') +
        UI.campo('Descuento máximo (%)', '<input id="av-dmax" type="number" min="0" max="100" step="any" value="' + (a.dctoMax || 0) + '">') +
        UI.campo('Afectación IGV', '<select id="av-igv">' + UI.opts(M.AFECTACION, a.igv) + '</select>', { req: true }) +
        (a.inv ? UI.campo('Control de stock al vender', '<select id="av-ctrl">' + UI.opts(M.STOCK_CTRL, a.stockCtrl) + '</select>', { req: true }) : UI.dato('Control de stock', 'Servicio: no aplica')) + '</div>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="CM09.guardar(\'' + cod + '\')">Guardar</button>'
    });
  },
  guardar(cod) {
    const x = { precio: UI.v('av-precio'), precioMin: UI.v('av-min'), verifMin: UI.chk('av-verif'), dctoMin: UI.v('av-dmin'), dctoMax: UI.v('av-dmax'), igv: UI.v('av-igv'), stockCtrl: UI.v('av-ctrl') };
    if (App.accion(() => Arts.guardar(cod, x), cod + ' actualizado')) { UI.cerrar(); App.refrescar(); }
  }
};
App.pantalla('cm09', { titulo: 'Artículos de venta', permiso: 'ver_venta', render: CM09.render });
