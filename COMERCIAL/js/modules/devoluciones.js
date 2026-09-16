/* COMERCIAL V9 · CL-13 Devoluciones de venta (solo productos, solo de ventas con salida de stock) · CL-15 ficha (registrar, editar, finalizar, anular) · modales CL-14, CL-16, CL-17 */
const CM03 = {
  f: { q: '', est: '', desde: '', hasta: '' },
  lista() {
    const f = CM03.f, q = f.q.trim().toLowerCase();
    return Store.d.devs.filter(x => (!f.est || x.estado === f.est) && UI.enRango(x.fecha, f.desde, f.hasta) &&
      (!q || (x.id + ' ' + x.venta + ' ' + x.cliente.nom + ' ' + x.sustNum).toLowerCase().includes(q)));
  },
  render() {
    const ds = Store.d.devs, mes = UI.hoy().slice(3), f = CM03.f;
    const finMes = ds.filter(x => x.estado === 'Finalizada' && x.finalizada && x.finalizada.f.slice(3, 10) === mes);
    const pend = ds.map(Dev.reembolso).filter(r => r && r.estado === 'Pendiente');
    return '<div class="screen-head"><h1>Devoluciones</h1><span class="code">CL-13</span><div class="spacer"></div>' +
      '<button class="btn btn-secondary" onclick="CM03.excel()">⇩ Excel</button>' +
      (Store.puede('crear_devolucion_venta') ? '<button class="btn btn-primary" onclick="CM03.nueva()">+ Nueva devolución</button>' : '') + '</div>' +
      UI.kpis([
        { l: 'Pendientes', v: ds.filter(x => x.estado === 'Pendiente').length, s: 'aún no mueven stock', color: 'var(--pendiente)' },
        { l: 'Finalizadas este mes', v: finMes.length, s: CM02.sumaMon(finMes, x => x.total) },
        { l: 'Dinero por devolver', v: pend.length, s: pend.length ? UI.s(pend.reduce((t, r) => t + r.monto, 0)) + ' (se entrega en Caja)' : '', color: 'var(--rechazado-sol)' },
        { l: 'Anuladas', v: ds.filter(x => x.estado === 'Anulada').length, color: 'var(--borrador)' }
      ]) +
      '<div class="card"><div class="filters">' +
      UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" placeholder="N°, venta, cliente o sustento" oninput="CM03.f.q=this.value;CM03.pintar()" style="min-width:240px">') +
      UI.campo('Estado', '<select onchange="CM03.f.est=this.value;CM03.pintar()">' + UI.opts(['Pendiente', 'Finalizada', 'Anulada'], f.est, 'Todos') + '</select>') +
      UI.campo('Desde', '<input type="date" value="' + f.desde + '" onchange="CM03.f.desde=this.value;CM03.pintar()">') +
      UI.campo('Hasta', '<input type="date" value="' + f.hasta + '" onchange="CM03.f.hasta=this.value;CM03.pintar()">') +
      '</div></div><div id="cm03-body"></div>' +
      '<p class="hint">Solo se devuelve lo que ya salió: la venta debe tener su Salida de stock (pago confirmado completo); mientras el stock está comprometido la venta se anula. Pendiente = editable, sin efecto. <b>Finalizar</b> registra el Ingreso de almacén (GI-09, «Devoluciones de Clientes»): Normal y Cambio vuelven al almacén de la venta; Mal estado va al almacén de remate. Si el cliente ya había pagado, la devolución del dinero queda pendiente en Caja; si no, se descuenta del saldo.</p>';
  },
  pintar() {
    document.getElementById('cm03-body').innerHTML = UI.tabla(['Devolución', 'Fecha de creación', 'Venta', 'Cliente', 'Sustento', ['Unidades', 'num'], ['Total', 'num'], 'Dinero', 'Estado'], CM03.lista().map(x => {
      const re = Dev.reembolso(x);
      return '<tr class="clickable" onclick="App.go(\'cm03f\',{id:\'' + x.id + '\'})"><td><b>' + x.id + '</b></td><td class="mini">' + x.fecha + '</td>' +
        '<td><button class="btn-link" style="padding:0" onclick="event.stopPropagation();App.go(\'cm02v\',{id:\'' + x.venta + '\'})">' + x.venta + '</button></td>' +
        '<td>' + UI.esc(x.cliente.nom) + '</td><td class="mini">' + UI.esc(x.sustTipo + ' ' + x.sustNum) + '</td><td class="num">' + UI.n(x.lineas.reduce((t, l) => t + l.cant, 0), 0) + '</td>' +
        '<td class="num">' + UI.m(x.total, x.mon) + '</td><td class="mini">' + (re ? UI.m(re.monto, x.mon) + ' · ' + re.estado : x.estado === 'Finalizada' ? 'Descontado del saldo' : '—') + '</td><td>' + UI.estado(x.estado) + '</td></tr>';
    }), { vacio: 'No hay devoluciones con esos filtros' });
  },
  nueva() {
    const recientes = Store.d.ventas.filter(v => v.estado === 'Registrada' && v.salida && Dev.candidatas(v).length).slice(0, 8);
    UI.modal({
      lg: true, titulo: 'Nueva devolución · elegir la venta', code: 'CL-14',
      cuerpo: '<div class="filters">' + UI.campo('N° de venta o comprobante', '<input id="nd-v" placeholder="Ej. VEN-2026-000230 o B001-002308">') +
        '<button class="btn btn-primary" onclick="CM03.ir(UI.v(\'nd-v\'))">Continuar</button></div><div class="sec">Ventas recientes con productos ya entregados (con salida de stock)</div>' +
        UI.tabla(['Venta', 'Comprobante', 'Fecha de creación', 'Cliente', ['Total', 'num'], ['', '', '80px']], recientes.map(v => '<tr><td><b>' + v.id + '</b></td><td class="mini">' + v.compNum + '</td><td class="mini">' + v.fecha + '</td><td>' + UI.esc(v.cliente.nom) + '</td><td class="num">' + UI.m(v.total, v.mon) + '</td>' +
          '<td><button class="btn btn-secondary btn-sm" onclick="CM03.ir(\'' + v.id + '\')">Elegir</button></td></tr>'), { vacio: 'Sin ventas' })
    });
  },
  ir(txt) {
    const t = String(txt || '').trim().toUpperCase();
    if (!t) { UI.toast('Ingrese el número de la venta'); return; }
    const v = Store.venta(t) || Store.d.ventas.find(x => x.compNum === t || x.id.endsWith(t.padStart(6, '0')));
    if (!v) { UI.toast('No existe la venta ' + t); return; }
    if (v.estado !== 'Registrada') { UI.toast(v.id + ' está ' + v.estado + ': solo se devuelve una venta Registrada'); return; }
    if (!Dev.candidatas(v).length) { UI.toast(v.id + ' solo tiene servicios: no se devuelve'); return; }
    if (!v.salida) { UI.toast(v.id + ' aún no tiene salida de stock (está comprometido hasta confirmar el pago completo): no se devuelve, se anula'); return; }
    UI.cerrar();
    App.go('cm03f', { venta: v.id, nuevo: Date.now() });
  },
  excel() {
    const filas = [];
    CM03.lista().forEach(x => x.lineas.forEach(l => filas.push([x.id, x.fecha, x.venta, x.cliente.nom, x.sustTipo, x.sustNum, l.art, l.nom, l.um, l.cant, l.tipo, l.precio, l.total, x.total, x.mon, x.estado])));
    UI.csv('devoluciones', ['Devolución', 'Fecha de creación', 'Venta', 'Cliente', 'Sustento', 'N° sustento', 'Código', 'Artículo', 'UM', 'Cantidad', 'Tipo', 'Precio neto', 'Total línea', 'Total devolución', 'Moneda', 'Estado'], filas);
  }
};
App.pantalla('cm03', { titulo: 'Devoluciones', permiso: 'ver_devolucion_venta', render: CM03.render, despues: CM03.pintar });

/* ---------- ficha de devolución ---------- */
const CM03F = {
  x: null, clave: null,
  dev() { return App.params.id ? Store.dev(App.params.id) : null; },
  venta() { const d = CM03F.dev(); return Store.venta(d ? d.venta : App.params.venta); },
  datos() {
    const x = CM03F.x;
    return { lineas: Object.keys(x.lineas).map(n => ({ n: Number(n), cant: x.lineas[n].cant, tipo: x.lineas[n].tipo })), sustTipo: x.sustTipo, sustNum: x.sustNum, dcto: x.dcto, obs: x.obs, voucher: x.voucher };
  },
  render(p) {
    const dev = CM03F.dev(), v = CM03F.venta();
    if (p.id && !dev) return UI.aviso('No existe la devolución ' + UI.esc(p.id), 'err');
    if (!v) return UI.aviso('No existe la venta ' + UI.esc(p.venta || ''), 'err');
    if (!dev && !v.salida) return UI.aviso('La venta ' + UI.esc(v.id) + ' aún no tiene salida de stock: su stock está <b>comprometido</b> hasta que los pagos validados cubran el total. Solo se devuelve lo que ya salió; si la venta ya no va, anúlela.', 'err') +
      '<button class="btn btn-secondary" onclick="App.go(\'cm02v\',{id:\'' + v.id + '\'})">Volver a la venta</button>';
    const clave = p.id || (p.venta + '|' + p.nuevo);
    if (CM03F.clave !== clave) {
      CM03F.clave = clave;
      CM03F.x = dev ? { lineas: {}, sustTipo: dev.sustTipo, sustNum: dev.sustNum, dcto: dev.dcto, obs: dev.obs, voucher: dev.voucher }
        : { lineas: {}, sustTipo: 'Nota de crédito', sustNum: '', dcto: 0, obs: '', voucher: '' };
      if (dev) dev.lineas.forEach(l => { CM03F.x.lineas[l.n] = { cant: l.cant, tipo: l.tipo }; });
    }
    const x = CM03F.x, ed = Store.puede('crear_devolucion_venta') && (!dev || dev.estado === 'Pendiente') && v.estado === 'Registrada' && !!v.salida;
    let prev = dev, err = '';
    if (ed) { try { prev = Dev._armar(v, CM03F.datos(), dev ? dev.id : null); } catch (e) { prev = null; err = e.message; } }

    const b = [];
    if (ed) b.push('<button class="btn btn-' + (dev ? 'secondary' : 'primary') + '" onclick="CM03F.guardar()">' + (dev ? 'Guardar cambios' : 'Registrar devolución') + '</button>');
    if (dev && dev.estado === 'Pendiente' && Store.puede('editar_devolucion_venta')) b.push('<button class="btn btn-primary" onclick="CM03F.finalizar()">Finalizar</button>');
    if (dev && dev.estado === 'Pendiente' && Store.puede('crear_devolucion_venta')) b.push('<button class="btn btn-danger" onclick="CM03F.anular()">Anular</button>');
    if (dev && dev.estado === 'Finalizada' && Dev.tieneCambio(dev) && Store.puede('crear_venta')) b.push('<button class="btn btn-primary" onclick="App.go(\'cm02f\',{cli:\'' + v.cli + '\',obs:\'Cambio de ' + dev.id + '\',nuevo:Date.now()})">Registrar venta del cambio</button>');
    b.push(dev ? '<button class="btn btn-secondary" onclick="App.go(\'cm03\')">Volver</button>' : '<button class="btn btn-secondary" onclick="App.go(\'cm02v\',{id:\'' + v.id + '\'})">Cancelar</button>');

    let html = '<div class="screen-head"><h1>' + (dev ? dev.id : 'Nueva devolución') + '</h1>' + (dev ? UI.estado(dev.estado) : '') + '<span class="code">CL-15</span><div class="spacer"></div>' + b.join('') + '</div>';
    if (dev && dev.estado === 'Pendiente' && !Store.puede('editar_devolucion_venta')) html += UI.aviso('Pendiente de finalizar por un supervisor (permiso editar_devolucion_venta).', 'info');
    html += '<div class="card"><div class="formgrid c4">' +
      UI.dato('Venta', '<button class="btn-link" style="padding:0" onclick="App.go(\'cm02v\',{id:\'' + v.id + '\'})">' + v.id + '</button><br><span class="mini">' + M.comp(v.comp).nom + ' ' + v.compNum + ' · ' + v.fecha.slice(0, 10) + '</span>') +
      UI.dato('Cliente', UI.esc(v.cliente.nom) + '<br><span class="mini">' + UI.esc(v.cliente.doc) + '</span>') +
      UI.dato('Tienda · moneda', UI.esc(v.sedeNom) + ' · ' + v.mon) +
      UI.dato('Pago de la venta', UI.estado(Ventas.estadoPago(v)) + '<br><span class="mini">pagado ' + UI.m(Ventas.pagado(v), v.mon) + ' · saldo ' + UI.m(Ventas.deuda(v), v.mon) + '</span>') + '</div></div>';

    const cands = Dev.candidatas(v, dev ? dev.id : null);
    const filas = ed ? cands.map(c => {
      const s = x.lineas[c.n] || { cant: 0, tipo: 'Normal' };
      return '<tr><td class="num">' + c.n + '</td><td>' + UI.esc(c.nom) + '<br><span class="mini">' + c.art + '</span></td><td>' + c.um + '</td><td class="mini">' + c.alm + '</td>' +
        '<td class="num">' + UI.q(c.vendida) + '</td><td class="num">' + UI.q(c.devuelta) + '</td><td class="num"><b>' + UI.q(c.max) + '</b></td>' +
        '<td class="num"><input class="celda num" type="number" min="0" max="' + c.max + '" step="any" style="width:80px" value="' + s.cant + '" onchange="CM03F.linea(' + c.n + ',\'cant\',this.value)"></td>' +
        '<td><select class="celda" onchange="CM03F.linea(' + c.n + ',\'tipo\',this.value)">' + UI.opts(M.TIPOS_DEV, s.tipo) + '</select></td>' +
        '<td class="num">' + UI.n(c.precio) + '</td><td class="num">' + UI.n(UI.r2(c.precio * (s.cant || 0))) + '</td></tr>';
    }) : (dev ? dev.lineas : []).map(l => '<tr><td class="num">' + l.n + '</td><td>' + UI.esc(l.nom) + '<br><span class="mini">' + l.art + '</span></td><td>' + l.um + '</td>' +
      '<td class="mini">' + (l.tipo === 'Mal estado' ? Store.cfg().almMalEstado : l.alm) + '</td><td class="num">—</td><td class="num">—</td><td class="num">—</td>' +
      '<td class="num"><b>' + UI.q(l.cant) + '</b></td><td>' + l.tipo + '</td><td class="num">' + UI.n(l.precio) + '</td><td class="num">' + UI.n(l.total) + '</td></tr>');
    html += '<div class="card"><div class="sec">Productos de la venta <span class="mini">(los servicios no se devuelven · el máximo descuenta las otras devoluciones no anuladas)</span></div>' +
      UI.tabla([['Línea', 'num', '50px'], 'Artículo', 'UM', ed ? 'Almacén de la venta' : 'Almacén de ingreso', ['Vendido', 'num'], ['Ya devuelto', 'num'], ['Máximo', 'num'], ['A devolver', 'num'], 'Tipo', ['Precio neto', 'num'], ['Total', 'num']], filas, { vacio: 'La venta no tiene productos' }) + '</div>';

    html += '<div class="card"><div class="sec">Sustento</div><div class="formgrid c4">' +
      (ed ? UI.campo('Documento de sustento', '<select onchange="CM03F.cab(\'sustTipo\',this.value)">' + UI.opts(M.SUSTENTO_DEV, x.sustTipo) + '</select>', { req: true }) +
        UI.campo('N° del documento', '<input value="' + UI.esc(x.sustNum) + '" placeholder="Ej. BC01-000035" onchange="CM03F.cab(\'sustNum\',this.value)">', { req: true }) +
        UI.campo('Descuento sobre el total', '<input type="number" min="0" step="any" value="' + x.dcto + '" onchange="CM03F.cab(\'dcto\',this.value)">') +
        UI.campo('Voucher / imagen', (x.voucher ? '<span class="mini">📎 ' + UI.esc(x.voucher) + '</span>' : '') + '<input type="file" accept="image/*,.pdf" onchange="CM03F.cab(\'voucher\',this.files[0]?this.files[0].name:\'\')">') +
        UI.campo('Observación', '<input value="' + UI.esc(x.obs) + '" onchange="CM03F.cab(\'obs\',this.value)">', { full: true })
        : UI.dato('Documento de sustento', UI.esc(dev.sustTipo + ' ' + dev.sustNum)) + UI.dato('Descuento', UI.m(dev.dcto, dev.mon)) + UI.dato('Voucher', dev.voucher ? '📎 ' + UI.esc(dev.voucher) : '') +
        UI.dato('Fecha de creación', dev.fecha + '<br><span class="mini">' + UI.esc(dev.usuario) + '</span>') + (dev.obs ? UI.dato('Observación', UI.esc(dev.obs), { full: true }) : '')) +
      '</div></div>';

    if (err && Object.keys(x.lineas).some(n => x.lineas[n].cant > 0)) html += UI.aviso(UI.esc(err), 'err');
    if (prev) {
      const malEstado = prev.lineas.filter(l => l.tipo === 'Mal estado').length;
      let dinero;
      if (dev && dev.estado !== 'Pendiente') {
        const re = Dev.reembolso(dev);
        dinero = dev.estado === 'Anulada' ? 'no aplica (anulada)' : re ? UI.m(re.monto, dev.mon) + ' · ' + re.estado + (re.estado === 'Pendiente' ? ' (se entrega en Caja)' : ' (' + re.mov + ')') : 'no se devolvió dinero: se descontó del saldo de la venta';
      } else {
        const est = UI.r2(Math.min(prev.total, Math.max(0, Ventas.pagado(v) - Ventas.porDevolver(v) - (Ventas.neto(v) - prev.total))));
        dinero = est > 0.004 ? 'se devolverán ' + UI.m(est, v.mon) + ' en Caja' : 'se descuenta del saldo pendiente (no se devuelve dinero)';
      }
      const fin = dev && dev.estado === 'Finalizada';
      html += '<div class="card"><div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap"><div style="flex:1;min-width:300px">' +
        '<div class="sec">' + (fin ? 'Efectos aplicados' : dev && dev.estado === 'Anulada' ? 'Sin efectos (anulada)' : 'Efectos al finalizar') + '</div><ul class="errlist">' +
        '<li>Ingreso de almacén GI-09 «Devoluciones de Clientes» (concepto contable 23)' + (dev && dev.movs.length ? ': ' + dev.movs.map(id => '<button class="btn-link" style="padding:0" onclick="CM06.verMov(\'' + id + '\')">' + id + '</button>').join(', ') : '') + ', al costo con el que salió.</li>' +
        '<li>Normal y Cambio vuelven al almacén de la venta; Mal estado va a ' + Store.cfg().almMalEstado + (malEstado ? ' (' + malEstado + ' línea(s))' : '') + '.</li>' +
        '<li>Dinero: ' + dinero + '.</li>' +
        (Dev.tieneCambio(prev) ? '<li>Hay líneas de <b>Cambio</b>: después de finalizar, registre la venta de lo que se lleva el cliente.</li>' : '') +
        '</ul></div><table class="grid totales"><tr><td>Bruto</td><td class="num">' + UI.m(prev.bruto, v.mon) + '</td></tr><tr><td>Descuento</td><td class="num">' + UI.m(prev.dcto, v.mon) + '</td></tr>' +
        '<tr><td>IGV incluido</td><td class="num">' + UI.m(prev.igv, v.mon) + '</td></tr><tr><td>Total</td><td class="num"><b>' + UI.m(prev.total, v.mon) + '</b></td></tr></table></div></div>';
    }
    if (dev) html += DOCUI.historial(dev);
    return html;
  },
  linea(n, campo, val) {
    const l = CM03F.x.lineas[n] = CM03F.x.lineas[n] || { cant: 0, tipo: 'Normal' };
    l[campo] = campo === 'cant' ? (Number(val) || 0) : val;
    App.refrescar();
  },
  cab(campo, val) { CM03F.x[campo] = campo === 'dcto' ? (Number(val) || 0) : val; App.refrescar(); },
  guardar() {
    const dev = CM03F.dev(), v = CM03F.venta();
    if (dev) { if (App.accion(() => Dev.actualizar(dev, CM03F.datos()), dev.id + ' actualizada')) { CM03F.clave = null; App.refrescar(); } return; }
    const d = App.accion(() => Dev.crear(v.id, CM03F.datos()), r => r.id + ' registrada: queda Pendiente hasta finalizarla');
    if (d) App.go('cm03f', { id: d.id });
  },
  finalizar() {
    const dev = CM03F.dev();
    UI.confirmar('Finalizar ' + dev.id, '<p>Se registra el ingreso de los productos al almacén y, si el cliente ya pagó, la devolución del dinero queda pendiente en Caja. Después ya no se edita ni se anula.</p>', () => {
      const r = App.accion(() => { if (Store.puede('crear_devolucion_venta')) Dev.actualizar(dev, CM03F.datos()); return Dev.finalizar(dev); },
        d => d.id + ' finalizada' + (d.reembolso ? ': dinero por devolver en Caja' : ''));
      CM03F.clave = null;
      if (r) App.refrescar(); else App.refrescar();
    }, 'Finalizar', 'CL-16');
  },
  anular() {
    const dev = CM03F.dev();
    UI.motivo('Anular ' + dev.id, '<p>La devolución no movió stock: queda Anulada y sus cantidades vuelven a estar disponibles para devolver.</p>', null,
      mot => { if (App.accion(() => Dev.anular(dev, mot), dev.id + ' anulada')) { UI.cerrar(); CM03F.clave = null; App.refrescar(); } }, 'Anular', 'CL-17');
  }
};
App.pantalla('cm03f', {
  titulo: 'Devolución', menu: 'cm03', permiso: 'ver_devolucion_venta', render: CM03F.render,
  miga: p => '<a class="btn-link" onclick="App.go(\'cm03\')">Devoluciones</a> / <b>' + UI.esc(p.id || 'Nueva') + '</b>'
});
