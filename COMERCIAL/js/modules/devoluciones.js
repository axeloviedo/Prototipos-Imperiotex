/* COMERCIAL V9 · CL-13 Devoluciones (nota de crédito por ítem) · CL-15 ficha · modales CL-14 (elegir la venta), CL-16 (registrar), CL-17 (anular una pendiente antigua), CL-52 (devolver en caja).
   2026-09-18: la devolución es una nota de crédito por ítem sobre UNA boleta o factura, que no se anula. En un solo paso entra el stock al almacén
   de la venta y el cliente queda con un crédito por lo que pagó. Si se lleva otro producto, es una venta nueva normal pagada con «Nota de crédito»;
   lo que sobra se le devuelve en caja o queda como vale. */
const CM03 = {
  f: { q: '', desde: '', hasta: '' },
  lista() {
    const f = CM03.f, q = f.q.trim().toLowerCase();
    return Store.d.devs.filter(x => UI.enRango(x.fecha, f.desde, f.hasta) &&
      (!q || (x.id + ' ' + x.venta + ' ' + x.cliente.nom + ' ' + x.sustNum).toLowerCase().includes(q)));
  },
  render() {
    const ds = Store.d.devs.filter(x => x.estado !== 'Anulada'), mes = UI.hoy().slice(3), f = CM03.f;
    const delMes = ds.filter(x => x.fecha.slice(3, 10) === mes);
    const cred = M.MONEDAS.map(m => { const t = UI.r2(Store.d.clientes.reduce((a, c) => a + Saldo.de(c.cod, m.cod), 0)); return t > 0.004 ? UI.m(t, m.cod) : ''; }).filter(Boolean).join(' · ');
    const pend = Store.d.devs.filter(x => x.estado === 'Pendiente').length;
    return '<div class="screen-head"><h1>Devoluciones</h1><span class="code">CL-13</span><div class="spacer"></div>' +
      '<button class="btn btn-secondary" onclick="CM03.excel()">⇩ Excel</button>' +
      (Store.puede('crear_devolucion_venta') ? '<button class="btn btn-primary" onclick="CM03.nueva()">+ Nueva devolución</button>' : '') + '</div>' +
      UI.kpis([
        { l: 'Devoluciones este mes', v: delMes.length, s: CM02.sumaMon(delMes, x => x.total) },
        { l: 'Crédito de clientes sin usar', v: cred || UI.s(0), s: 'se usa como «Nota de crédito» en una venta o se devuelve en caja', color: 'var(--prp)' },
        { l: 'Devuelto en caja', v: CM02.sumaMon(ds, Dev.devueltoCaja), color: 'var(--rechazado-sol)' }
      ].concat(pend ? [{ l: 'Pendientes (versión anterior)', v: pend, s: 'regístrelas o anúlelas', color: 'var(--pendiente)' }] : [])) +
      '<div class="card"><div class="filters">' +
      UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" placeholder="N°, venta, cliente o nota de crédito" oninput="CM03.f.q=this.value;CM03.pintar()" style="min-width:240px">') +
      UI.campo('Desde', '<input type="date" value="' + f.desde + '" onchange="CM03.f.desde=this.value;CM03.pintar()">') +
      UI.campo('Hasta', '<input type="date" value="' + f.hasta + '" onchange="CM03.f.hasta=this.value;CM03.pintar()">') +
      '</div></div><div id="cm03-body"></div>' +
      '<p class="hint">Una devolución es una <b>nota de crédito por ítem</b> sobre una boleta o factura: la venta original no se anula (el cliente se queda con lo demás). ' +
      'Al registrarla entra el stock al almacén de la venta y el cliente queda con un <b>crédito</b> por lo que pagó. Si se lleva otro producto, se hace una <b>venta nueva</b> y se paga con «Nota de crédito»: ' +
      'mismo valor, la caja no se mueve; mayor valor, paga la diferencia; menor valor, la diferencia se le devuelve en caja o queda como vale. Anular una venta es solo para un error, dentro de ' + Store.cfg().diasAnulacion + ' días.</p>';
  },
  pintar() {
    document.getElementById('cm03-body').innerHTML = UI.tabla(['N°', 'Fecha de creación', 'Venta', 'Cliente', 'Nota de crédito', ['Total', 'num'], 'Dinero', 'Estado'], CM03.lista().map(x => {
      const v = Store.venta(x.venta);
      return '<tr class="clickable" onclick="App.go(\'cm03f\',{id:\'' + x.id + '\'})"><td><b>' + x.id + '</b></td><td class="mini">' + x.fecha + '</td>' +
        '<td><button class="btn-link" style="padding:0" onclick="event.stopPropagation();App.go(\'cm02v\',{id:\'' + x.venta + '\'})">' + x.venta + '</button>' + (v ? '<br><span class="mini">' + v.compNum + '</span>' : '') + '</td>' +
        '<td>' + UI.esc(x.cliente.nom) + '</td><td class="mini">' + UI.esc(x.sustTipo + ' ' + x.sustNum) + '</td><td class="num">' + UI.m(x.total, x.mon) + '</td>' +
        '<td class="mini">' + UI.esc(Dev.dineroTxt(x)) + '</td><td>' + UI.estado(x.estado) + '</td></tr>';
    }), { vacio: 'No hay devoluciones con esos filtros' });
  },
  nueva() {
    const recientes = Store.d.ventas.filter(v => !Dev.puedeDevolver(v) && Dev.candidatas(v).some(c => c.max > 0)).slice(0, 8);
    UI.modal({
      lg: true, titulo: 'Nueva devolución · elegir la boleta o factura', code: 'CL-14',
      cuerpo: '<div class="filters">' + UI.campo('N° de venta o comprobante', '<input id="nd-v" placeholder="Ej. VEN-2026-000230 o B001-002308">') +
        '<button class="btn btn-primary" onclick="CM03.ir(UI.v(\'nd-v\'))">Continuar</button></div><div class="sec">Ventas recientes con productos entregados</div>' +
        UI.tabla(['Venta', 'Comprobante', 'Fecha de creación', 'Cliente', ['Total', 'num'], ['', '', '80px']], recientes.map(v => '<tr><td><b>' + v.id + '</b></td><td class="mini">' + v.compNum + '</td><td class="mini">' + v.fecha + '</td><td>' + UI.esc(v.cliente.nom) + '</td><td class="num">' + UI.m(v.total, v.mon) + '</td>' +
          '<td><button class="btn btn-secondary btn-sm" onclick="CM03.ir(\'' + v.id + '\')">Elegir</button></td></tr>'), { vacio: 'Sin ventas' })
    });
  },
  ir(txt) {
    const t = String(txt || '').trim().toUpperCase();
    if (!t) { UI.toast('Ingrese el número de la venta'); return; }
    const v = Store.venta(t) || Store.d.ventas.find(x => x.compNum === t || x.id.endsWith(t.padStart(6, '0')));
    const no = v ? Dev.puedeDevolver(v) : 'No existe la venta ' + t;
    if (no) { UI.toast(no); return; }
    UI.cerrar();
    App.go('cm03f', { venta: v.id, nuevo: Date.now() });
  },
  excel() {
    const filas = [];
    CM03.lista().forEach(x => x.lineas.forEach(l => filas.push([x.id, x.fecha, x.venta, x.cliente.nom, x.sustTipo, x.sustNum, x.obs || '', l.art, l.nom, l.um, l.cant, l.precio, l.total, x.total, x.mon, Dev.dineroTxt(x), x.estado])));
    UI.csv('devoluciones', ['Devolución', 'Fecha de creación', 'Venta', 'Cliente', 'Sustento', 'N° sustento', 'Motivo', 'Código', 'Artículo', 'UM', 'Cantidad', 'Precio neto', 'Total línea', 'Total devolución', 'Moneda', 'Dinero', 'Estado'], filas);
  }
};
App.pantalla('cm03', { titulo: 'Devoluciones', permiso: 'ver_devolucion_venta', render: CM03.render, despues: CM03.pintar });

/* ---------- ficha CL-15 ---------- */
const CM03F = {
  x: null, clave: null,
  dev() { return App.params.id ? Store.dev(App.params.id) : null; },
  venta() { const d = CM03F.dev(); return Store.venta(d ? d.venta : App.params.venta); },
  datos() { const x = CM03F.x; return { lineas: Object.keys(x.lineas).map(n => ({ n: Number(n), cant: x.lineas[n] })), sustTipo: x.sustTipo, sustNum: x.sustNum, obs: x.obs }; },
  render(p) {
    const dev = CM03F.dev(), v = CM03F.venta();
    if (p.id && !dev) return UI.aviso('No existe la devolución ' + UI.esc(p.id), 'err');
    if (!v) return UI.aviso('No existe la venta ' + UI.esc(p.venta || ''), 'err');
    if (!dev && Dev.puedeDevolver(v)) return UI.aviso(UI.esc(Dev.puedeDevolver(v)), 'err') + '<button class="btn btn-secondary" onclick="App.go(\'cm02v\',{id:\'' + v.id + '\'})">Volver a la venta</button>';
    const clave = p.id || (p.venta + '|' + p.nuevo);
    if (CM03F.clave !== clave) {
      CM03F.clave = clave;
      CM03F.x = { lineas: {}, sustTipo: dev ? dev.sustTipo : Dev.sustentoDe(v), sustNum: dev ? dev.sustNum : '', obs: dev ? dev.obs || '' : '' };
      if (dev) dev.lineas.forEach(l => { CM03F.x.lineas[l.n] = l.cant; });
    }
    const x = CM03F.x, nueva = !dev, ed = nueva && Store.puede('crear_devolucion_venta');
    const b = [];
    if (ed) b.push('<button class="btn btn-primary" onclick="CM03F.registrar()">Registrar devolución</button>');
    if (dev && dev.estado === 'Pendiente' && Store.puede('crear_devolucion_venta')) b.push('<button class="btn btn-primary" onclick="CM03F.registrarPendiente()">Registrar</button><button class="btn btn-danger" onclick="CM03F.anular()">Anular</button>');
    if (dev && dev.estado === 'Registrada' && Store.puede('crear_venta')) b.push('<button class="btn btn-secondary" onclick="App.go(\'cm02f\',{cli:\'' + v.cli + '\',obs:\'Cambio (' + UI.esc(dev.sustTipo + ' ' + dev.sustNum) + ')\',nuevo:Date.now()})">Nueva venta para el cliente</button>');
    if (dev && Dev.porDevolverCaja(dev) > 0.004 && Store.puede('crear_caja')) b.push('<button class="btn btn-secondary" onclick="CM03F.devolver()">Devolver en caja</button>');
    b.push(dev ? '<button class="btn btn-secondary" onclick="App.go(\'cm03\')">Volver</button>' : '<button class="btn btn-secondary" onclick="App.go(\'cm02v\',{id:\'' + v.id + '\'})">Cancelar</button>');

    let html = '<div class="screen-head"><h1>' + (dev ? 'Devolución ' + dev.id : 'Nueva devolución') + '</h1>' + (dev ? UI.estado(dev.estado) : '') + '<span class="code">CL-15</span><div class="spacer"></div>' + b.join('') + '</div>';
    html += '<div class="card"><div class="formgrid c4">' +
      UI.dato('Venta', '<button class="btn-link" style="padding:0" onclick="App.go(\'cm02v\',{id:\'' + v.id + '\'})">' + v.id + '</button><br><span class="mini">' + M.comp(v.comp).nom + ' ' + v.compNum + ' · ' + v.fecha.slice(0, 10) + '</span>') +
      UI.dato('Cliente', UI.esc(v.cliente.nom) + '<br><span class="mini">' + UI.esc(v.cliente.doc) + '</span>') +
      UI.dato('Tienda · moneda', UI.esc(v.sedeNom) + ' · ' + v.mon) +
      UI.dato('La venta', 'No se anula ni se modifica<br><span class="mini">' + UI.esc(Ventas.estadoPago(v)) + ' · pagado ' + UI.m(Ventas.pagado(v), v.mon) + '</span>') + '</div></div>';

    /* prendas: cantidad a devolver (nueva) o lo devuelto */
    const filas = nueva ? Dev.candidatas(v).map(c => '<tr><td>' + UI.esc(c.nom) + '<br><span class="mini">' + c.art + ' · ' + c.um + '</span></td><td class="num">' + UI.q(c.vendida) + '</td><td class="num">' + UI.q(c.devuelta) + '</td>' +
      '<td class="num"><input class="celda num" type="number" min="0" max="' + c.max + '" step="any" style="width:70px" value="' + (x.lineas[c.n] || 0) + '"' + (c.max > 0 ? '' : ' disabled') + ' onchange="CM03F.cant(' + c.n + ',this.value)"></td>' +
      '<td class="num">' + UI.n(c.precio) + '</td><td class="num">' + UI.n(UI.r2(c.precio * (x.lineas[c.n] || 0))) + '</td></tr>')
      : dev.lineas.map(l => '<tr><td>' + UI.esc(l.nom) + '<br><span class="mini">' + l.art + ' · ' + l.um + ' · entró a ' + l.alm + '</span></td><td class="num">—</td><td class="num">—</td><td class="num"><b>' + UI.q(l.cant) + '</b></td><td class="num">' + UI.n(l.precio) + '</td><td class="num">' + UI.n(l.total) + '</td></tr>');
    let prev = dev, err = '';
    if (nueva) { try { prev = Dev._armar(v, Object.assign(CM03F.datos(), { sustNum: x.sustNum || '—', obs: x.obs || '—' })); } catch (e) { prev = null; err = e.message; } }
    html += '<div class="card"><div class="sec">Prendas que devuelve <span class="mini">(los servicios no se devuelven; precio neto con el que se vendió)</span></div>' +
      UI.tabla(['Artículo', ['Vendido', 'num'], ['Ya devuelto', 'num'], ['Devuelve', 'num'], ['Precio', 'num'], ['Total', 'num']], filas, { vacio: 'La venta no tiene productos' }) +
      '<div style="display:flex;justify-content:flex-end;margin-top:8px"><span class="chip" style="font-size:13px;padding:5px 12px">Total de la nota: <b>' + UI.m(prev ? prev.total : 0, v.mon) + '</b></span></div></div>';

    html += '<div class="card"><div class="sec">Nota de crédito</div><div class="formgrid c3">' +
      (nueva ? UI.campo('Documento', '<select onchange="CM03F.cab(\'sustTipo\',this.value)">' + UI.opts(M.SUSTENTO_DEV, x.sustTipo) + '</select>', { req: true }) +
        UI.campo('N°', '<input value="' + UI.esc(x.sustNum) + '" placeholder="' + (v.comp === 'FA' ? 'Ej. FC01-000035' : 'Ej. BC01-000035') + '" onchange="CM03F.cab(\'sustNum\',this.value)">', { req: true, hint: 'Se emite en el sistema de facturación: aquí se anota su número' }) +
        UI.campo('Motivo', '<input value="' + UI.esc(x.obs) + '" placeholder="Ej. talla equivocada" onchange="CM03F.cab(\'obs\',this.value)">', { req: true })
        : UI.dato('Documento', UI.esc(dev.sustTipo + ' ' + dev.sustNum)) + UI.dato('Motivo', UI.esc(dev.obs || '—')) + UI.dato('Fecha de creación', dev.fecha + '<br><span class="mini">' + UI.esc(dev.usuario) + '</span>')) +
      '</div></div>';

    if (nueva) {
      if (err && Object.keys(x.lineas).some(n => x.lineas[n] > 0)) html += UI.aviso(UI.esc(err), 'err');
      if (prev) {
        const cred = Dev.creditoDe(v, prev.total);
        html += '<div class="card"><div class="sec">Al registrar</div><ul class="errlist">' +
          '<li>Entra al almacén de la venta (' + prev.lineas.map(l => l.alm).filter((a, i, s) => s.indexOf(a) === i).join(', ') + ') con un Ingreso GI-09 «Devoluciones de Clientes», al costo con que salió.</li>' +
          (cred > 0.004 ? '<li>El cliente queda con un <b>crédito de ' + UI.m(cred, v.mon) + '</b>: paga su venta nueva con «Nota de crédito» o se le devuelve en caja.</li>' : '') +
          (prev.total - cred > 0.004 ? '<li>' + UI.m(UI.r2(prev.total - cred), v.mon) + ' se descuentan del saldo por cobrar de la venta.</li>' : '') +
          '<li>La ' + M.comp(v.comp).nom.toLowerCase() + ' ' + v.compNum + ' no se anula: el cliente se queda con lo demás.</li></ul></div>';
      }
    } else if (dev.estado === 'Registrada') {
      const cred = dev.credito != null ? dev.credito : dev.total, caja = Dev.devueltoCaja(dev), disp = Saldo.de(dev.cliente.cod, dev.mon), re = Dev.reembolso(dev);
      html += '<div class="card"><div class="sec">Dinero</div><div class="formgrid c4">' +
        UI.dato('Crédito que dejó la nota', UI.m(cred, dev.mon)) + UI.dato('Devuelto en caja', UI.m(caja, dev.mon)) +
        UI.dato('Crédito del cliente hoy', '<b>' + UI.m(disp, dev.mon) + '</b><br><span class="mini">suma de sus notas sin usar · <button class="btn-link" style="padding:0" onclick="App.go(\'cm07f\',{id:\'' + dev.cliente.cod + '\'});CM07F.tab=\'saf\'">ver movimientos</button></span>') +
        UI.dato('Stock', dev.movs.map(id => '<button class="btn-link" style="padding:0" onclick="CM06.verMov(\'' + id + '\')">' + id + '</button>').join(', ')) + '</div>' +
        (re ? '<p class="hint">Devolución de la versión anterior: ' + UI.m(re.monto, dev.mon) + ' por devolver en caja (' + re.estado + ').</p>' : '') +
        '<p class="hint">Si el cliente se lleva otro producto: <b>Nueva venta para el cliente</b> y pague con «Nota de crédito». Lo que sobre se devuelve aquí con <b>Devolver en caja</b> (cajero) o queda como vale.</p></div>';
    }
    if (dev) html += DOCUI.historial(dev);
    return html;
  },
  cant(n, val) { CM03F.x.lineas[n] = Number(val) || 0; App.refrescar(); },
  cab(campo, val) { CM03F.x[campo] = val; App.refrescar(); },
  /* CL-16: confirmar y registrar en un solo paso */
  registrar() {
    const v = CM03F.venta();
    let prev;
    try { prev = Dev._armar(v, CM03F.datos()); } catch (e) { UI.toast(e.message); return; }
    const cred = Dev.creditoDe(v, prev.total);
    UI.confirmar('Registrar devolución', '<p>' + UI.esc(prev.sustTipo + ' ' + prev.sustNum) + ' por <b>' + UI.m(prev.total, v.mon) + '</b>: entra el stock' + (cred > 0.004 ? ' y el cliente queda con un crédito de <b>' + UI.m(cred, v.mon) + '</b>' : '') + '. La venta ' + v.id + ' no se anula. No se puede deshacer.</p>', () => {
      const d = App.accion(() => Dev.crear(v.id, CM03F.datos()), r => r.id + ' registrada' + (r.credito > 0.004 ? ': crédito del cliente ' + UI.m(r.credito, r.mon) : ''));
      if (d) { CM03F.clave = null; App.go('cm03f', { id: d.id }); }
    }, 'Registrar', 'CL-16');
  },
  registrarPendiente() { const d = CM03F.dev(); if (App.accion(() => Dev.finalizar(d), d.id + ' registrada')) { CM03F.clave = null; App.refrescar(); } },
  /* CL-52: devolver en caja lo que el cliente no usó de esta nota */
  devolver() {
    const d = CM03F.dev(), v = Store.venta(d.venta), max = Dev.porDevolverCaja(d), s = Caja.abierta(v.sede, v.mon);
    if (!s) { UI.toast('Abra la caja de ' + v.sedeNom + ' en ' + v.mon + ' para devolver el dinero'); return; }
    const mets = M.METODOS.filter(m => !m.saldo && m.monedas.indexOf(v.mon) >= 0);
    UI.modal({
      titulo: 'Devolver en caja · ' + d.id, code: 'CL-52',
      cuerpo: '<div class="formgrid">' + UI.dato('Cliente', UI.esc(d.cliente.nom)) + UI.dato('Se puede devolver', '<b>' + UI.m(max, d.mon) + '</b>') +
        UI.dato('Sale de la caja', s.id + ' · ' + UI.esc(s.nom)) +
        UI.campo('Monto (' + d.mon + ')', '<input id="dc-monto" type="number" min="0" step="any" value="' + max + '">', { req: true }) +
        UI.campo('Cómo se devuelve', '<select id="dc-met" onchange="PAGOUI.bancos(\'dc-met\',\'dc-banco\')">' + UI.opts(mets.map(m => ({ v: m.cod, t: m.nom })), 'EFE') + '</select>', { req: true }) +
        UI.campo('Banco', '<select id="dc-banco"></select>') + UI.campo('N° de operación', '<input id="dc-nop">', { hint: 'Si no es efectivo' }) + '</div>' +
        '<p class="hint">Baja el crédito del cliente y sale el dinero de la caja (movimiento tipo Devolución).</p>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="CM03F.devolverOk()">Devolver</button>'
    });
    PAGOUI.bancos('dc-met', 'dc-banco');
  },
  devolverOk() {
    const d = CM03F.dev();
    if (App.accion(() => Dev.devolverEnCaja(d, UI.v('dc-monto'), { met: UI.v('dc-met'), banco: UI.v('dc-banco'), nop: UI.v('dc-nop') }), m => 'Devuelto en caja: ' + m.id)) { UI.cerrar(); App.refrescar(); }
  },
  anular() {
    const dev = CM03F.dev();
    UI.motivo('Anular ' + dev.id, '<p>No movió stock ni dinero: queda Anulada (no se borra).</p>', null,
      mot => { if (App.accion(() => Dev.anular(dev, mot), dev.id + ' anulada')) { UI.cerrar(); CM03F.clave = null; App.refrescar(); } }, 'Anular', 'CL-17');
  }
};
App.pantalla('cm03f', {
  titulo: 'Devolución', menu: 'cm03', permiso: 'ver_devolucion_venta', render: CM03F.render,
  miga: p => '<a class="btn-link" onclick="App.go(\'cm03\')">Devoluciones</a> / <b>' + UI.esc(p.id || 'Nueva') + '</b>'
});
