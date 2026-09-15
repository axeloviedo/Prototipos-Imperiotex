/* COMERCIAL V9 · CM-13 Órdenes de venta (paso 2 · compromete stock). Se atiende con una o varias ventas («Copiar a venta»). */
const CM13 = {
  f: { q: '', est: 'Abierta', sede: '', desde: '', hasta: '' },
  lista() {
    const f = CM13.f, q = f.q.trim().toLowerCase();
    return Store.d.ovs.filter(o => (!f.est || o.estado === f.est) && (!f.sede || o.sede === f.sede) && UI.enRango(o.fecha, f.desde, f.hasta) &&
      (!q || (o.id + ' ' + o.cliente.nom + ' ' + o.cliente.doc).toLowerCase().includes(q)));
  },
  render() {
    const os = Store.d.ovs, ab = os.filter(o => o.estado === 'Abierta'), f = CM13.f;
    return '<div class="screen-head"><h1>Órdenes de venta</h1><span class="code">CM-13</span><div class="spacer"></div>' +
      '<button class="btn btn-secondary" onclick="CM13.excel()">⇩ Excel</button>' +
      (Store.puede('crear_venta') ? '<button class="btn btn-primary" onclick="App.go(\'cm13f\',{nuevo:Date.now()})">+ Nueva orden de venta</button>' : '') + '</div>' +
      DOCUI.flujo(1) +
      UI.kpis([
        { l: 'Abiertas', v: ab.length, s: CM02.sumaMon(ab, o => o.total) },
        { l: 'Unidades por atender', v: UI.n(ab.reduce((t, o) => t + OV.conPendiente(o).reduce((s, l) => s + OV.pendiente(l), 0), 0), 0), s: UI.n(ab.reduce((t, o) => t + OV.comprometido(o), 0), 0) + ' comprometidas en almacén', color: 'var(--pendiente)' },
        { l: 'Cerradas', v: os.filter(o => o.estado === 'Cerrada').length, color: 'var(--confirmado)' },
        { l: 'Canceladas', v: os.filter(o => o.estado === 'Cancelada').length, color: 'var(--borrador)' }
      ]) +
      '<div class="card"><div class="filters">' +
      UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" placeholder="N°, cliente o documento" oninput="CM13.f.q=this.value;CM13.pintar()" style="min-width:230px">') +
      UI.campo('Estado', '<select onchange="CM13.f.est=this.value;CM13.pintar()">' + UI.opts(['Abierta', 'Cerrada', 'Cancelada'], f.est, 'Todos') + '</select>') +
      UI.campo('Tienda', '<select onchange="CM13.f.sede=this.value;CM13.pintar()">' + UI.opts(M.SEDES.map(s => ({ v: s.cod, t: s.nom })), f.sede, 'Todas') + '</select>') +
      UI.campo('Creada desde', '<input type="date" value="' + f.desde + '" onchange="CM13.f.desde=this.value;CM13.pintar()">') +
      UI.campo('Creada hasta', '<input type="date" value="' + f.hasta + '" onchange="CM13.f.hasta=this.value;CM13.pintar()">') +
      '</div></div><div id="cm13-body"></div>';
  },
  pintar() {
    const filas = CM13.lista().map(o =>
      '<tr class="clickable" onclick="App.go(\'cm13v\',{id:\'' + o.id + '\'})"><td><b>' + o.id + '</b></td><td class="mini">' + o.fecha + '</td>' +
      '<td class="mini">' + (o.entrega ? UI.esc(M.lugar(o.entrega.lugar).nom) + '<br>' + o.entrega.fecha : 'Solo servicios') + '</td>' +
      '<td>' + UI.esc(o.cliente.nom) + '<br><span class="mini">' + UI.esc(o.sedeNom) + '</span></td><td class="num">' + UI.m(o.total, o.mon) + '</td>' +
      '<td>' + UI.barra(OV.avance(o), 100) + '</td><td>' + UI.estado(o.estado) + '</td>' +
      '<td onclick="event.stopPropagation()">' + (o.estado === 'Abierta' && Store.puede('crear_venta') ? '<button class="btn btn-primary btn-sm" onclick="App.go(\'cm02f\',{ov:\'' + o.id + '\',nuevo:Date.now()})">Copiar a venta</button>' : '') + '</td></tr>');
    document.getElementById('cm13-body').innerHTML = UI.tabla(['N°', 'Fecha de creación', 'Entrega', 'Cliente', ['Total', 'num'], 'Atendido', 'Estado', ['', '', '120px']], filas, { vacio: 'No hay órdenes con esos filtros' });
  },
  excel() {
    UI.csv('ordenes-de-venta', ['N°', 'Fecha de creación', 'Tienda', 'Cliente', 'Documento', 'Moneda', 'Total', 'Atendido %', 'Estado', 'Cotización', 'Ventas'],
      CM13.lista().map(o => [o.id, o.fecha, o.sedeNom, o.cliente.nom, o.cliente.doc, o.mon, o.total, OV.avance(o), o.estado, o.cot || '', o.ventas.join(' ')]));
  }
};
App.pantalla('cm13', { titulo: 'Órdenes de venta', permiso: 'ver_venta', render: CM13.render, despues: CM13.pintar });

/* ---------- nueva orden de venta (directa o copiada de una cotización) ---------- */
const CM13F = {
  d: null, clave: null,
  render(p) {
    const clave = (p.cot || '') + '|' + (p.nuevo || '');
    if (!CM13F.d || CM13F.clave !== clave) {
      CM13F.clave = clave;
      try { CM13F.d = p.cot ? OV.desdeCotizacion(p.cot) : OV.borrador(); }
      catch (e) { CM13F.d = null; return UI.aviso(UI.esc(e.message), 'err') + '<button class="btn btn-secondary" onclick="history.back()">Volver</button>'; }
      if (!p.cot && p.cli) { try { CM13F._cliente(p.cli); } catch (e) { UI.toast(e.message); } }
    }
    const d = CM13F.d, sede = Store.sede(d.sede), lugar = M.lugar(d.entrega.lugar) || {}, en = d.entrega;
    Precios.doc(d);
    const rev = OV.revisar(d);
    const sel = (fn, campo, lista, val, vacio) => '<select onchange="CM13F.' + fn + '(\'' + campo + '\',this.value)">' + UI.opts(lista, val, vacio) + '</select>';
    const inp = (fn, campo, val) => '<input value="' + UI.esc(val) + '" onchange="CM13F.' + fn + '(\'' + campo + '\',this.value)">';
    let html = '<div class="screen-head"><h1>Nueva orden de venta' + (d.cot ? ' <span class="mini">copiada de ' + d.cot + '</span>' : '') + '</h1><span class="code">CM-13</span><div class="spacer"></div>' +
      '<button class="btn btn-secondary" onclick="CM13F.salir()">Cancelar</button><button class="btn btn-primary" onclick="CM13F.crear()">Crear orden de venta</button></div>' +
      DOCUI.flujo(1) +
      '<div class="card"><div class="formgrid c4">' +
      UI.dato('Tienda', UI.esc(sede.nom)) + UI.dato('Fecha de creación', UI.ahora()) +
      UI.campo('Moneda', sel('cab', 'mon', M.MONEDAS.map(m => ({ v: m.cod, t: m.cod + ' · ' + m.nom })), d.mon), { req: true }) +
      (Store.puede('asignar_vendedor') ? UI.campo('Vendedor', sel('cab', 'asesor', DOCUI.vendedores(), d.asesor)) : UI.dato('Vendedor', UI.esc(DOCUI.vendedor(d.asesor)))) +
      UI.campo('Observación', inp('cab', 'obs', d.obs), { full: true }) + '</div></div>' +
      DOCUI.cardCliente('CM13F', d, true) +
      '<div class="card"><div class="sec">Detalle<div class="spacer"></div><button class="btn btn-secondary btn-sm" onclick="BUS.articulo(CM13F.d, cod => CM13F.agregar(cod))">+ Agregar artículos</button></div>' +
      DOCUI.lineas('CM13F', d, { editable: true, modo: 'stock' }) + DOCUI.totales(d) + '</div>';
    if (d.lineas.length && !Doc.soloServicios(d)) {
      html += '<div class="card"><div class="sec">Entrega</div><div class="formgrid c4">' +
        UI.campo('Lugar', sel('ent', 'lugar', M.LUGARES_ENTREGA.map(x => ({ v: x.cod, t: x.nom })), en.lugar), { req: true }) +
        UI.campo('Fecha de entrega', '<input type="date" value="' + UI.dIso(en.fecha) + '" min="' + UI.dIso(UI.hoy()) + '" onchange="CM13F.ent(\'fecha\',UI.dTxt(this.value))">', { req: true }) +
        (lugar.ubigeo ? UI.campo('Ubigeo', sel('ent', 'ubigeo', M.UBIGEOS.map(u => ({ v: u.cod, t: u.t })), en.ubigeo, 'Seleccionar…'), { req: true }) + UI.campo('Dirección', inp('ent', 'dir', en.dir), { req: true })
          : UI.dato('Se recoge en', UI.esc(sede.nom), { estilo: 'grid-column:span 2' })) +
        (lugar.agencia ? UI.campo('Agencia', sel('ent', 'agencia', M.AGENCIAS, en.agencia, 'Seleccionar…'), { req: true }) : '') +
        (!lugar.propio ? UI.campo('Recibe · nombre', inp('ent', 'encNom', en.encNom), { req: true }) + UI.campo('Recibe · documento', inp('ent', 'encDoc', en.encDoc), { req: true }) + UI.campo('Recibe · teléfono', inp('ent', 'encTel', en.encTel), { req: true }) : '') +
        '</div></div>';
    }
    html += rev.e.length ? UI.aviso('<b>Falta:</b><ul class="errlist">' + rev.e.slice(0, 8).map(x => '<li>' + UI.esc(x) + '</li>').join('') + '</ul>', 'err')
      : UI.aviso('Al crearla, el stock de estas líneas queda <b>comprometido</b> para este cliente hasta que se venda o se cierre la orden.', 'ok');
    if (rev.w.length) html += UI.aviso('<ul class="errlist">' + rev.w.map(x => '<li>' + UI.esc(x) + '</li>').join('') + '</ul>');
    return html;
  },
  _ok(fn) { App.accion(fn); App.refrescar(); },
  _cliente(cod) {
    const d = CM13F.d, c = Doc.cambiarCliente(d, cod);
    if (c.dir && c.ubigeo && !d.entrega.dir) { d.entrega.dir = c.dir; d.entrega.ubigeo = c.ubigeo; }
    return c;
  },
  agregar(cod) { CM13F._ok(() => Doc.agregar(CM13F.d, cod)); },
  cambiar(i, campo, val) { CM13F._ok(() => Doc.cambiar(CM13F.d, i, campo, val)); },
  quitar(i) { CM13F._ok(() => Doc.quitar(CM13F.d, i)); },
  cliente(cod) { CM13F._ok(() => CM13F._cliente(cod)); },
  cab(campo, val) { CM13F._ok(() => { if (campo === 'mon') Doc.cambiarMoneda(CM13F.d, val); else CM13F.d[campo] = val; }); },
  ent(campo, val) { CM13F.d.entrega[campo] = val; App.refrescar(); },
  salir() { const cot = CM13F.d && CM13F.d.cot; CM13F.d = null; if (cot) App.go('cm01f', { id: cot }); else App.go('cm13'); },
  crear() {
    const d = CM13F.d, r = OV.revisar(d);
    if (r.e.length) { UI.toast(r.e[0]); App.refrescar(); return; }
    const o = App.accion(() => OV.crear(d), x => 'Orden ' + x.id + ' creada: stock comprometido');
    if (o) { CM13F.d = null; App.go('cm13v', { id: o.id }); }
  }
};
App.pantalla('cm13f', {
  titulo: 'Nueva orden de venta', menu: 'cm13', permiso: 'crear_venta', render: CM13F.render,
  miga: p => '<a class="btn-link" onclick="App.go(\'cm13\')">Órdenes de venta</a> / <b>Nueva</b>'
});

/* ---------- ficha de la orden de venta ---------- */
const CM13V = {
  o() { return Store.ov(App.params.id); },
  render(p) {
    const o = Store.ov(p.id);
    if (!o) return UI.aviso('No existe la orden ' + UI.esc(p.id), 'err');
    const b = [], ab = o.estado === 'Abierta';
    if (ab && Store.puede('crear_venta')) b.push('<button class="btn btn-primary" onclick="App.go(\'cm02f\',{ov:\'' + o.id + '\',nuevo:Date.now()})">Copiar a venta</button>');
    if (ab && o.lineas.some(l => l.atendida > 0) && Store.puede('crear_venta')) b.push('<button class="btn btn-secondary" onclick="CM13V.cerrar()">Cerrar orden</button>');
    b.push('<button class="btn btn-secondary" onclick="DOCUI.imprimir(\'Orden de venta\',CM13V.o())">⎙ PDF</button>');
    if (ab && !o.lineas.some(l => l.atendida > 0) && Store.puede('anular_venta')) b.push('<button class="btn btn-danger" onclick="CM13V.cancelar()">Cancelar</button>');
    b.push('<button class="btn btn-secondary" onclick="App.go(\'cm13\')">Volver</button>');
    const en = o.entrega;
    const filas = o.lineas.map(l => '<tr><td class="num">' + l.n + '</td><td>' + UI.esc(l.nom) + '<br><span class="mini">' + l.art + (l.desc ? ' · “' + UI.esc(l.desc) + '”' : '') + '</span></td><td class="mini">' + (l.alm || 'Servicio') + '</td>' +
      '<td class="num">' + UI.q(l.cant, l.um) + '</td><td class="num">' + UI.q(l.atendida) + '</td><td class="num"><b>' + UI.q(OV.pendiente(l)) + '</b></td><td class="num">' + (l.comp ? UI.q(l.comp) : '') + '</td>' +
      '<td class="num">' + UI.n(l.precio) + '</td><td class="num">' + UI.n(l.total) + '</td></tr>');
    return '<div class="screen-head"><h1>' + o.id + '</h1>' + UI.estado(o.estado) + '<span class="code">CM-13</span><div class="spacer"></div>' + b.join('') + '</div>' +
      DOCUI.relaciones(o, 'ov') +
      (ab ? UI.aviso('Stock <b>comprometido</b> para este cliente: ' + UI.n(OV.comprometido(o), 0) + ' unidad(es). Cópiela a una venta (puede ser por partes); la orden se cierra sola al atender todo.', 'info') : '') +
      '<div class="card"><div class="formgrid c4">' +
      UI.dato('Cliente', '<b>' + UI.esc(o.cliente.nom) + '</b><br><span class="mini">' + UI.esc(o.cliente.doc) + '</span>') +
      UI.dato('Fecha de creación', o.fecha + '<br><span class="mini">' + UI.esc(o.usuario) + '</span>') + UI.dato('Tienda', UI.esc(o.sedeNom)) +
      UI.dato('Vendedor · moneda', UI.esc(DOCUI.vendedor(o.asesor)) + ' · ' + o.mon) +
      UI.dato('Entrega', en ? UI.esc(M.lugar(en.lugar).nom) + ' · ' + en.fecha + (en.agencia ? ' · ' + en.agencia : '') + (en.dir ? '<br><span class="mini">' + UI.esc(en.dir) + ' · ' + UI.esc(M.ubigeo(en.ubigeo)) + '</span>' : '') : 'Solo servicios', { estilo: 'grid-column:span 2' }) +
      (en && en.encNom ? UI.dato('Recibe', UI.esc(en.encNom) + '<br><span class="mini">' + UI.esc(en.encDoc) + ' · ' + UI.esc(en.encTel) + '</span>') : '') +
      (o.obs ? UI.dato('Observación', UI.esc(o.obs), { full: true }) : '') + '</div></div>' +
      '<div class="card"><div class="sec">Detalle</div>' +
      UI.tabla([['#', 'num', '34px'], 'Artículo', 'Almacén', ['Pedido', 'num'], ['Atendido', 'num'], ['Pendiente', 'num'], ['Comprometido', 'num'], ['Precio ' + M.sim(o.mon), 'num'], ['Total', 'num']], filas) +
      DOCUI.totales(o) + '</div>' +
      DOCUI.historial(o);
  },
  cerrar() {
    const o = CM13V.o();
    UI.confirmar('Cerrar ' + o.id, '<p>Lo que falta atender (' + UI.n(OV.conPendiente(o).reduce((t, l) => t + OV.pendiente(l), 0), 0) + ' unidades) ya no se venderá: se libera el stock comprometido.</p>',
      () => { if (App.accion(() => OV.cerrar(o), o.id + ' cerrada')) App.refrescar(); }, 'Cerrar orden');
  },
  cancelar() {
    const o = CM13V.o();
    UI.motivo('Cancelar ' + o.id, '<p>La orden no tiene ventas: queda Cancelada y se libera todo el stock comprometido.</p>', null,
      mot => { if (App.accion(() => OV.cancelar(o, mot), o.id + ' cancelada')) { UI.cerrar(); App.refrescar(); } }, 'Cancelar orden');
  }
};
App.pantalla('cm13v', {
  titulo: 'Orden de venta', menu: 'cm13', permiso: 'ver_venta', render: CM13V.render,
  miga: p => '<a class="btn-link" onclick="App.go(\'cm13\')">Órdenes de venta</a> / <b>' + UI.esc(p.id) + '</b>'
});
