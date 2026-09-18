/* COMERCIAL V9 · CL-13 Cambios y devoluciones (solo productos, solo de ventas con salida de stock) · CL-15 ficha en dos columnas «Devuelve» / «Se lleva»
   (registrar, editar, aceptar, anular) · modales CL-14, CL-16 (Aceptar), CL-17.
   2026-09-18 «solo cambios»: un cambio es una devolución con «Se lleva»; al aceptarla el dinero queda como saldo a favor del cliente
   y paga la venta nueva; la diferencia que falta se cobra en caja. Los pagos de la venta original no se tocan. */
const CM03 = {
  f: { q: '', est: '', tipo: '', desde: '', hasta: '' },
  lista() {
    const f = CM03.f, q = f.q.trim().toLowerCase();
    return Store.d.devs.filter(x => (!f.est || x.estado === f.est) && (!f.tipo || Dev.tipo(x) === f.tipo) && UI.enRango(x.fecha, f.desde, f.hasta) &&
      (!q || (x.id + ' ' + x.venta + ' ' + (x.ventaCambio || '') + ' ' + x.cliente.nom + ' ' + x.sustNum).toLowerCase().includes(q)));
  },
  render() {
    const ds = Store.d.devs, mes = UI.hoy().slice(3), f = CM03.f;
    const finMes = ds.filter(x => x.estado === 'Finalizada' && x.finalizada && x.finalizada.f.slice(3, 10) === mes);
    const pend = ds.map(Dev.reembolso).filter(r => r && r.estado === 'Pendiente');
    const saldos = Store.d.clientes.map(c => Saldo.porMoneda(c.cod)).filter(x => x.length);
    return '<div class="screen-head"><h1>Cambios y devoluciones</h1><span class="code">CL-13</span><div class="spacer"></div>' +
      '<button class="btn btn-secondary" onclick="CM03.excel()">⇩ Excel</button>' +
      (Store.puede('crear_devolucion_venta') ? '<button class="btn btn-primary" onclick="CM03.nueva()">+ Cambio / devolución</button>' : '') + '</div>' +
      UI.kpis([
        { l: 'Pendientes de aceptar', v: ds.filter(x => x.estado === 'Pendiente').length, s: 'aún no mueven stock ni dinero', color: 'var(--pendiente)' },
        { l: 'Aceptadas este mes', v: finMes.length, s: finMes.filter(Dev.esCambio).length + ' cambio(s) · ' + CM02.sumaMon(finMes, x => x.total) },
        { l: 'Clientes con saldo a favor', v: saldos.length, s: M.MONEDAS.map(m => { const t = UI.r2(Store.d.clientes.reduce((a, c) => a + Saldo.de(c.cod, m.cod), 0)); return t > 0.004 ? UI.m(t, m.cod) : ''; }).filter(Boolean).join(' · '), color: 'var(--prp)' },
        { l: 'Dinero por devolver en caja', v: pend.length, s: pend.length ? UI.s(pend.reduce((t, r) => t + r.monto, 0)) : 'solo con el parámetro «Se devuelve en caja»', color: 'var(--rechazado-sol)' }
      ]) +
      '<div class="card"><div class="filters">' +
      UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" placeholder="N°, venta, cliente o sustento" oninput="CM03.f.q=this.value;CM03.pintar()" style="min-width:240px">') +
      UI.campo('Tipo', '<select onchange="CM03.f.tipo=this.value;CM03.pintar()">' + UI.opts(['Cambio', 'Devolución'], f.tipo, 'Todos') + '</select>') +
      UI.campo('Estado', '<select onchange="CM03.f.est=this.value;CM03.pintar()">' + UI.opts(['Pendiente', 'Finalizada', 'Anulada'], f.est, 'Todos') + '</select>') +
      UI.campo('Desde', '<input type="date" value="' + f.desde + '" onchange="CM03.f.desde=this.value;CM03.pintar()">') +
      UI.campo('Hasta', '<input type="date" value="' + f.hasta + '" onchange="CM03.f.hasta=this.value;CM03.pintar()">') +
      '</div></div><div id="cm03-body"></div>' +
      '<p class="hint">Solo se devuelve lo que ya salió (la venta tiene su Salida de stock). Un <b>cambio</b> es una devolución con artículos en «Se lleva». ' +
      '<b>Aceptar</b> ingresa lo devuelto (Normal al almacén de la venta; Mal estado a liquidación), deja el dinero como <b>saldo a favor</b> del cliente y, si se lleva algo, registra la venta nueva pagada con ese saldo; ' +
      'si cuesta más, el cliente paga la diferencia en caja. Los pagos de la venta original no se tocan y no sale dinero de caja' + (Store.cfg().dineroDev === 'CAJA' ? ' (salvo lo que sobra: el parámetro de CL-45 está en «Se devuelve en caja»)' : '') + '.</p>';
  },
  pintar() {
    document.getElementById('cm03-body').innerHTML = UI.tabla(['N°', 'Fecha de creación', 'Tipo', 'Venta', 'Cliente', 'Sustento', ['Devuelve', 'num'], ['Se lleva', 'num'], 'Dinero', 'Estado'], CM03.lista().map(x =>
      '<tr class="clickable" onclick="App.go(\'cm03f\',{id:\'' + x.id + '\'})"><td><b>' + x.id + '</b></td><td class="mini">' + x.fecha + '</td><td>' + Dev.tipo(x) + '</td>' +
      '<td><button class="btn-link" style="padding:0" onclick="event.stopPropagation();App.go(\'cm02v\',{id:\'' + x.venta + '\'})">' + x.venta + '</button>' +
      (x.ventaCambio ? '<br><span class="mini">→ </span><button class="btn-link mini" style="padding:0" onclick="event.stopPropagation();App.go(\'cm02v\',{id:\'' + x.ventaCambio + '\'})">' + x.ventaCambio + '</button>' : '') + '</td>' +
      '<td>' + UI.esc(x.cliente.nom) + '</td><td class="mini">' + UI.esc(x.sustTipo + ' ' + x.sustNum) + '</td><td class="num">' + UI.m(x.total, x.mon) + '</td>' +
      '<td class="num">' + (Dev.esCambio(x) ? UI.m(x.llevaTotal, x.mon) : '—') + '</td><td class="mini">' + UI.esc(Dev.dineroTxt(x)) + '</td><td>' + UI.estado(x.estado) + '</td></tr>'), { vacio: 'No hay cambios ni devoluciones con esos filtros' });
  },
  nueva() {
    const recientes = Store.d.ventas.filter(v => v.estado === 'Registrada' && v.salida && Dev.candidatas(v).some(c => c.max > 0)).slice(0, 8);
    UI.modal({
      lg: true, titulo: 'Cambio o devolución · elegir la venta', code: 'CL-14',
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
    CM03.lista().forEach(x => {
      x.lineas.forEach(l => filas.push([x.id, x.fecha, Dev.tipo(x), x.venta, x.ventaCambio || '', x.cliente.nom, x.sustTipo, x.sustNum, 'Devuelve', l.art, l.nom, l.um, l.cant, l.tipo, l.precio, l.total, x.mon, Dev.dineroTxt(x), x.estado]));
      (x.lleva || []).forEach(l => filas.push([x.id, x.fecha, Dev.tipo(x), x.venta, x.ventaCambio || '', x.cliente.nom, x.sustTipo, x.sustNum, 'Se lleva', l.art, l.nom, l.um, l.cant, '', l.precio, l.total, x.mon, Dev.dineroTxt(x), x.estado]));
    });
    UI.csv('cambios-devoluciones', ['N°', 'Fecha de creación', 'Tipo', 'Venta', 'Venta del cambio', 'Cliente', 'Sustento', 'N° sustento', 'Sentido', 'Código', 'Artículo', 'UM', 'Cantidad', 'Estado de la prenda', 'Precio', 'Total línea', 'Moneda', 'Dinero', 'Estado'], filas);
  }
};
App.pantalla('cm03', { titulo: 'Cambios y devoluciones', permiso: 'ver_devolucion_venta', render: CM03.render, despues: CM03.pintar });

/* ---------- ficha CL-15: «Devuelve» | «Se lleva», con el resultado en vivo ---------- */
const CM03F = {
  x: null, clave: null,
  dev() { return App.params.id ? Store.dev(App.params.id) : null; },
  venta() { const d = CM03F.dev(); return Store.venta(d ? d.venta : App.params.venta); },
  datos() {
    const x = CM03F.x;
    return { lineas: Object.keys(x.lineas).map(n => ({ n: Number(n), cant: x.lineas[n].cant, tipo: x.lineas[n].tipo })), sustTipo: x.sustTipo, sustNum: x.sustNum, dcto: x.dcto, obs: x.obs, voucher: x.voucher, lleva: x.ll.lineas };
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
        : { lineas: {}, sustTipo: Dev.sustentoDe(v), sustNum: '', dcto: 0, obs: '', voucher: '' };
      CM03F.x.ll = Dev.borradorLleva(v, dev ? dev.lleva : []);
      if (dev) dev.lineas.forEach(l => { CM03F.x.lineas[l.n] = { cant: l.cant, tipo: l.tipo === 'Cambio' ? 'Normal' : l.tipo }; });
    }
    const x = CM03F.x, ll = x.ll, ed = Store.puede('crear_devolucion_venta') && (!dev || dev.estado === 'Pendiente') && v.estado === 'Registrada' && !!v.salida;
    const acepta = Store.puede('editar_devolucion_venta') && (!dev || dev.estado === 'Pendiente') && v.estado === 'Registrada' && !!v.salida;
    let prev = dev, err = '';
    /* la barra en vivo se ve aunque falte el N° del sustento (se pide al guardar o aceptar) */
    if (ed) { try { prev = Dev._armar(v, Object.assign(CM03F.datos(), { sustNum: x.sustNum || '—' }), dev ? dev.id : null); } catch (e) { prev = null; err = e.message; } }
    if (ed && prev && !String(x.sustNum || '').trim()) err = 'Falta el N° de la ' + String(x.sustTipo).toLowerCase() + ' (se emite en el sistema de facturación)';
    const cambio = dev && !ed ? Dev.esCambio(dev) : ll.lineas.length > 0;

    const b = [];
    if (ed) b.push('<button class="btn btn-secondary" onclick="CM03F.guardar()">' + (dev ? 'Guardar cambios' : 'Guardar pendiente') + '</button>');
    if (acepta) b.push('<button class="btn btn-primary" onclick="CM03F.aceptar()">Aceptar ' + (cambio ? 'cambio' : 'devolución') + '</button>');
    if (dev && dev.estado === 'Pendiente' && Store.puede('crear_devolucion_venta')) b.push('<button class="btn btn-danger" onclick="CM03F.anular()">Anular</button>');
    if (dev && dev.ventaCambio) b.push('<button class="btn btn-secondary" onclick="App.go(\'cm02v\',{id:\'' + dev.ventaCambio + '\'})">Venta del cambio ' + dev.ventaCambio + '</button>');
    b.push(dev ? '<button class="btn btn-secondary" onclick="App.go(\'cm03\')">Volver</button>' : '<button class="btn btn-secondary" onclick="App.go(\'cm02v\',{id:\'' + v.id + '\'})">Cancelar</button>');

    let html = '<div class="screen-head"><h1>' + (dev ? (Dev.esCambio(dev) ? 'Cambio ' : 'Devolución ') + dev.id : 'Cambio o devolución') + '</h1>' + (dev ? UI.estado(dev.estado) : '') + '<span class="code">CL-15</span><div class="spacer"></div>' + b.join('') + '</div>';
    if (dev && dev.estado === 'Pendiente' && !Store.puede('editar_devolucion_venta')) html += UI.aviso('Pendiente de aceptar por un perfil con el permiso editar_devolucion_venta (Vendedor o Supervisor comercial).', 'info');
    if (dev && dev.estado === 'Anulada' && dev.anulada) html += UI.aviso('<b>Anulada</b> el ' + dev.anulada.f + ' por ' + UI.esc(dev.anulada.u) + ': ' + UI.esc(dev.anulada.motivo), 'err');
    html += '<div class="card"><div class="formgrid c4">' +
      UI.dato('Venta', '<button class="btn-link" style="padding:0" onclick="App.go(\'cm02v\',{id:\'' + v.id + '\'})">' + v.id + '</button><br><span class="mini">' + M.comp(v.comp).nom + ' ' + v.compNum + ' · ' + v.fecha.slice(0, 10) + '</span>') +
      UI.dato('Cliente', UI.esc(v.cliente.nom) + '<br><span class="mini">' + UI.esc(v.cliente.doc) + (Saldo.de(v.cli, v.mon) > 0.004 ? ' · saldo a favor ' + UI.m(Saldo.de(v.cli, v.mon), v.mon) : '') + '</span>') +
      UI.dato('Tienda · moneda', UI.esc(v.sedeNom) + ' · ' + v.mon) +
      UI.dato('Pago de la venta', UI.estado(Ventas.estadoPago(v)) + '<br><span class="mini">pagado ' + UI.m(Ventas.pagado(v), v.mon) + ' · saldo ' + UI.m(Ventas.deuda(v), v.mon) + ' · no se modifica</span>') + '</div></div>';

    /* columna izquierda: lo que devuelve */
    const cands = Dev.candidatas(v, dev ? dev.id : null);
    const filasDev = ed ? cands.map(c => {
      const s = x.lineas[c.n] || { cant: 0, tipo: 'Normal' };
      return '<tr><td>' + UI.esc(c.nom) + '<br><span class="mini">' + c.art + ' · ' + c.um + ' · máx. ' + UI.q(c.max) + (c.devuelta ? ' (ya devuelto ' + UI.q(c.devuelta) + ')' : '') + '</span></td>' +
        '<td class="num"><input class="celda num" type="number" min="0" max="' + c.max + '" step="any" style="width:64px" value="' + s.cant + '" onchange="CM03F.linea(' + c.n + ',\'cant\',this.value)"></td>' +
        '<td><select class="celda" onchange="CM03F.linea(' + c.n + ',\'tipo\',this.value)">' + UI.opts(M.TIPOS_DEV, s.tipo) + '</select></td>' +
        '<td class="num">' + UI.n(c.precio) + '</td><td class="num">' + UI.n(UI.r2(c.precio * (s.cant || 0))) + '</td></tr>';
    }) : (dev ? dev.lineas : []).map(l => '<tr><td>' + UI.esc(l.nom) + '<br><span class="mini">' + l.art + ' · ' + l.um + ' · entra a ' + (l.tipo === 'Mal estado' ? Store.cfg().almMalEstado + ' (liquidación)' : l.alm) + '</span></td>' +
      '<td class="num"><b>' + UI.q(l.cant) + '</b></td><td>' + (l.tipo === 'Cambio' ? 'Normal' : l.tipo) + '</td><td class="num">' + UI.n(l.precio) + '</td><td class="num">' + UI.n(l.total) + '</td></tr>');
    const colDev = '<div class="card" style="flex:1;min-width:340px"><div class="sec">↩ Devuelve</div>' +
      UI.tabla(['Artículo', ['Cant.', 'num'], 'Estado', ['Precio', 'num'], ['Total', 'num']], filasDev, { vacio: 'La venta no tiene productos' }) +
      '<p class="hint">Precio neto con el que se vendió. Mal estado va a ' + Store.cfg().almMalEstado + '.</p></div>';

    /* columna derecha: lo que se lleva (mismo buscador y mismos precios que cualquier venta) */
    const lleva = ed ? ll.lineas : (dev ? dev.lleva || [] : []);
    const filasLl = lleva.map((l, i) => {
      const a = Store.art(l.art) || { inv: true, u: l.um };
      const ums = ed && Store.art(l.art) ? Precios.unidades(l.art) : [l.um];
      const rev = ed ? Doc.revisarLinea(ll, l, 'venta') : { e: [] };
      return '<tr><td>' + UI.esc(l.nom) + '<br><span class="mini">' + l.art + (l.origen ? ' · ' + UI.esc(l.origen) : '') + '</span>' + (rev.e.length ? '<br><span class="err-t mini">✕ ' + UI.esc(rev.e[0]) + '</span>' : '') + '</td>' +
        '<td>' + (ums.length > 1 ? '<select class="celda" onchange="CM03F.cambiar(' + i + ',\'um\',this.value)">' + UI.opts(ums, l.um) + '</select>' : l.um) + '</td>' +
        '<td class="num">' + (ed && a.inv ? UI.n(Stock.disp(l.alm, l.art), 0) : '') + '</td>' +
        '<td class="num">' + (ed ? '<input class="celda num" type="number" min="0" step="any" style="width:64px" value="' + l.cant + '" onchange="CM03F.cambiar(' + i + ',\'cant\',this.value)">' : '<b>' + UI.q(l.cant) + '</b>') + '</td>' +
        '<td class="num">' + UI.n(l.precio) + '</td><td class="num">' + UI.n(l.total) + '</td>' +
        '<td>' + (ed ? '<button class="btn-link" title="Quitar" onclick="CM03F.quitar(' + i + ')">✕</button>' : '') + '</td></tr>';
    });
    const colLl = '<div class="card" style="flex:1;min-width:340px"><div class="sec">🛍 Se lleva' + (ed ? '<div class="spacer"></div><button class="btn btn-secondary btn-sm" onclick="BUS.articulo(CM03F.x.ll, cod => CM03F.agregar(cod))">+ Agregar artículos</button>' : '') + '</div>' +
      UI.tabla(['Artículo', 'UM', [ed ? 'Disp.' : '', 'num'], ['Cant.', 'num'], ['Precio', 'num'], ['Total', 'num'], ['', '', '24px']], filasLl, { vacio: ed ? 'Vacío = devolución (el dinero queda como saldo a favor). Agregue lo que se lleva para hacer un cambio.' : 'No se llevó nada: fue una devolución' }) +
      '<p class="hint">Precios de ' + UI.esc(v.sedeNom) + ' para ' + UI.esc(v.cliente.tipo) + ' en ' + v.mon + '. Sale de ' + Doc.sedeAlm(ll) + ' con ' + M.comp(v.comp).nom.toLowerCase() + ' nueva.</p></div>';
    html += '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start">' + colDev + colLl + '</div>';

    /* resultado en vivo */
    if (err && Object.keys(x.lineas).some(n => x.lineas[n].cant > 0)) html += UI.aviso(UI.esc(err), prev ? 'info' : 'err');
    if (prev) html += CM03F.barra(v, prev, dev);

    html += '<div class="card"><div class="sec">Sustento</div><div class="formgrid c4">' +
      (ed ? UI.campo('Documento de sustento', '<select onchange="CM03F.cab(\'sustTipo\',this.value)">' + UI.opts(M.SUSTENTO_DEV, x.sustTipo) + '</select>', { req: true }) +
        UI.campo('N° del documento', '<input value="' + UI.esc(x.sustNum) + '" placeholder="' + (x.sustTipo === 'Nota de crédito' ? (v.comp === 'FA' ? 'Ej. FC01-000035' : 'Ej. BC01-000035') : 'Ej. NDI-000012') + '" onchange="CM03F.cab(\'sustNum\',this.value)">', { req: true, hint: 'Se emite en el sistema de facturación: aquí se anota su número' }) +
        UI.campo('Descuento sobre lo devuelto', '<input type="number" min="0" step="any" value="' + x.dcto + '" onchange="CM03F.cab(\'dcto\',this.value)">') +
        UI.campo('Observación', '<input value="' + UI.esc(x.obs) + '" onchange="CM03F.cab(\'obs\',this.value)">')
        : UI.dato('Documento de sustento', UI.esc(dev.sustTipo + ' ' + dev.sustNum)) + UI.dato('Descuento', UI.m(dev.dcto, dev.mon)) +
        UI.dato('Fecha de creación', dev.fecha + '<br><span class="mini">' + UI.esc(dev.usuario) + '</span>') +
        UI.dato('Aceptada', dev.finalizada ? dev.finalizada.f + '<br><span class="mini">' + UI.esc(dev.finalizada.u) + '</span>' : '—') + (dev.obs ? UI.dato('Observación', UI.esc(dev.obs), { full: true }) : '')) +
      '</div></div>';
    if (dev) html += DOCUI.historial(dev);
    return html;
  },
  /* «Devuelve S/ X · Se lleva S/ Y · Diferencia» y lo que pasará (o pasó) al aceptar */
  barra(v, prev, dev) {
    const fin = dev && dev.estado === 'Finalizada', r = fin ? null : Dev.resumen(v, prev);
    const chip = (t, estilo) => '<span class="chip" style="font-size:13px;padding:5px 12px;' + (estilo || '') + '">' + t + '</span>';
    let dif;
    if (fin) dif = chip('Dinero: ' + UI.esc(Dev.dineroTxt(dev)), 'background:#EEF7F1');
    else if (r.paga > 0.004) dif = chip('El cliente paga <b>' + UI.m(r.paga, v.mon) + '</b>', 'background:#FFFBEB;border-color:#FDE68A');
    else if (r.sobra > 0.004) dif = chip((r.modo === 'SALDO' ? 'Queda a favor del cliente ' : 'Se devuelve en caja ') + '<b>' + UI.m(r.sobra, v.mon) + '</b>', 'background:#EEF2FF;border-color:#C7D2FE');
    else dif = chip('Sin diferencia');
    const efectos = fin ? [] : [
      'Ingresa lo devuelto con un Ingreso GI-09 «Devoluciones de Clientes» al costo con que salió' + (prev.lineas.some(l => l.tipo === 'Mal estado') ? '; lo que está en mal estado pasa a ' + Store.cfg().almMalEstado : '') + '.',
      r.descuenta > 0.004 ? 'La venta tenía saldo pendiente: ' + UI.m(r.descuenta, v.mon) + ' se descuentan de ese saldo.' : '',
      prev.lleva.length ? 'Se registra una ' + M.comp(v.comp).nom.toLowerCase() + ' nueva por ' + UI.m(r.lleva, v.mon) + ' pagada con saldo a favor ' + UI.m(r.usa, v.mon) + (r.paga > 0.004 ? ' y la diferencia ' + UI.m(r.paga, v.mon) + ' por validar en caja (el stock sale al validarla)' : ' (el stock sale en el acto)') + '.' : '',
      r.sobra > 0.004 ? (r.modo === 'SALDO' ? UI.m(r.sobra, v.mon) + ' quedan como saldo a favor del cliente, para su próxima compra (no vence).' : UI.m(r.sobra, v.mon) + ' quedan por devolver en caja (parámetro de CL-45).') : '',
      'Los pagos de ' + v.id + ' no cambian.'
    ].filter(Boolean);
    return '<div class="card"><div class="chips" style="align-items:center">' + chip('Devuelve ' + UI.m(prev.total, v.mon)) + chip('Se lleva ' + UI.m(prev.lleva.length ? (fin ? dev.llevaTotal : r.lleva) : 0, v.mon)) + dif + '</div>' +
      (efectos.length ? '<div class="sec" style="margin-top:10px">Al aceptar</div><ul class="errlist">' + efectos.map(t => '<li>' + t + '</li>').join('') + '</ul>' : '') +
      (fin && dev.movs.length ? '<p class="hint" style="margin-top:8px">Movimientos de stock: ' + dev.movs.map(id => '<button class="btn-link" style="padding:0" onclick="CM06.verMov(\'' + id + '\')">' + id + '</button>').join(', ') + '</p>' : '') + '</div>';
  },
  linea(n, campo, val) {
    const l = CM03F.x.lineas[n] = CM03F.x.lineas[n] || { cant: 0, tipo: 'Normal' };
    l[campo] = campo === 'cant' ? (Number(val) || 0) : val;
    App.refrescar();
  },
  cab(campo, val) { CM03F.x[campo] = campo === 'dcto' ? (Number(val) || 0) : val; App.refrescar(); },
  agregar(cod) { if (App.accion(() => Doc.agregar(CM03F.x.ll, cod))) App.refrescar(); },
  cambiar(i, campo, val) { App.accion(() => Doc.cambiar(CM03F.x.ll, i, campo, val)); App.refrescar(); },
  quitar(i) { Doc.quitar(CM03F.x.ll, i); App.refrescar(); },
  guardar() {
    const dev = CM03F.dev(), v = CM03F.venta();
    if (dev) { if (App.accion(() => Dev.actualizar(dev, CM03F.datos()), dev.id + ' actualizada')) { CM03F.clave = null; App.refrescar(); } return; }
    const d = App.accion(() => Dev.crear(v.id, CM03F.datos()), r => r.id + ' registrada: queda Pendiente hasta aceptarla');
    if (d) App.go('cm03f', { id: d.id });
  },
  /* CL-16 · Aceptar: resumen y, si el cliente paga más, el medio de pago de la diferencia */
  aceptar() {
    const dev = CM03F.dev(), v = CM03F.venta();
    let prev;
    try { prev = Dev._armar(v, CM03F.datos(), dev ? dev.id : null); } catch (e) { UI.toast(e.message); return; }
    const r = Dev.resumen(v, prev), ses = Caja.abierta(v.sede, v.mon);
    const otros = Saldo.de(v.cli, v.mon), mets = M.METODOS.filter(m => m.monedas.indexOf(v.mon) >= 0 && (!m.saldo || otros > 0.004));
    let pago = '';
    if (r.paga > 0.004) {
      pago = '<div class="sec" style="margin-top:12px">Diferencia que paga el cliente: ' + UI.m(r.paga, v.mon) + '</div>' +
        (ses ? '' : UI.aviso('La caja de ' + UI.esc(v.sedeNom) + ' en ' + v.mon + ' está cerrada: ábrala para cobrar la diferencia' + (otros > 0.004 ? ' o use el saldo a favor que el cliente ya tenía' : '') + '.', 'err')) +
        '<div class="formgrid">' + UI.campo('Medio de pago', '<select id="ac-met" onchange="PAGOUI.bancos(\'ac-met\',\'ac-banco\')">' + UI.opts(mets.map(m => ({ v: m.cod, t: m.nom + (m.saldo ? ' (tiene ' + UI.m(otros, v.mon) + ')' : '') })), 'EFE') + '</select>', { req: true }) +
        UI.campo('Banco / procesador', '<select id="ac-banco"></select>') +
        UI.campo('N° de operación', '<input id="ac-nop">', { hint: 'Si no es efectivo' }) + UI.campo('Voucher', '<input type="file" id="ac-vou" accept="image/*,.pdf">', { hint: 'Si no es efectivo' }) + '</div>' +
        '<p class="hint">Es un pago normal de la venta nueva: queda <b>Por validar</b> en la caja ' + (ses ? ses.id : '') + ' y el stock de lo que se lleva sale cuando caja lo valida.</p>';
    }
    UI.modal({
      titulo: 'Aceptar ' + (prev.lleva.length ? 'cambio' : 'devolución') + (dev ? ' ' + dev.id : ''), code: 'CL-16',
      cuerpo: '<div class="chips">' + '<span class="chip">Devuelve ' + UI.m(r.devuelve, v.mon) + '</span><span class="chip">Se lleva ' + UI.m(r.lleva, v.mon) + '</span>' +
        (r.paga > 0.004 ? '<span class="chip"><b>Paga ' + UI.m(r.paga, v.mon) + '</b></span>' : r.sobra > 0.004 ? '<span class="chip"><b>' + (r.modo === 'SALDO' ? 'A favor ' : 'Se devuelve ') + UI.m(r.sobra, v.mon) + '</b></span>' : '<span class="chip">Sin diferencia</span>') + '</div>' +
        '<p style="margin-top:10px">La vendedora recibe la prenda y se aplica todo junto: ingreso al almacén' + (prev.lleva.length ? ', venta nueva pagada con el saldo a favor' : '') + (r.sobra > 0.004 && r.modo === 'SALDO' ? ' y el saldo a favor que queda' : '') + '. Después ya no se edita ni se anula; los pagos de ' + v.id + ' no cambian.</p>' + pago,
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="CM03F.aceptarOk(' + (r.paga > 0.004) + ')">Aceptar</button>'
    });
    if (r.paga > 0.004) PAGOUI.bancos('ac-met', 'ac-banco');
  },
  aceptarOk(conPago) {
    const dev = CM03F.dev(), v = CM03F.venta(), datos = CM03F.datos();
    const pd = conPago ? { met: UI.v('ac-met'), banco: UI.v('ac-banco'), nop: UI.v('ac-nop'), voucher: UI.archivo('ac-vou') } : null;
    const d = App.accion(() => dev
      ? Dev._atomico(() => { const x = Store.dev(dev.id); if (Store.puede('crear_devolucion_venta')) Dev.actualizar(x, datos); return Dev.finalizar(x, pd); })
      : Dev.aceptarNueva(v.id, datos, pd),
    r => r.id + ' aceptada' + (r.ventaCambio ? ' · venta del cambio ' + r.ventaCambio : '') + (r.saldoMov ? ' · saldo a favor actualizado' : ''));
    if (!d) return;
    UI.cerrar();
    CM03F.clave = null;
    App.go('cm03f', { id: d.id });
  },
  anular() {
    const dev = CM03F.dev();
    UI.motivo('Anular ' + dev.id, '<p>No movió stock ni dinero: queda Anulada (no se borra) y sus cantidades vuelven a estar disponibles para devolver.</p>', null,
      mot => { if (App.accion(() => Dev.anular(dev, mot), dev.id + ' anulada')) { UI.cerrar(); CM03F.clave = null; App.refrescar(); } }, 'Anular', 'CL-17');
  }
};
App.pantalla('cm03f', {
  titulo: 'Cambio o devolución', menu: 'cm03', permiso: 'ver_devolucion_venta', render: CM03F.render,
  miga: p => '<a class="btn-link" onclick="App.go(\'cm03\')">Cambios y devoluciones</a> / <b>' + UI.esc(p.id || 'Nuevo') + '</b>'
});
