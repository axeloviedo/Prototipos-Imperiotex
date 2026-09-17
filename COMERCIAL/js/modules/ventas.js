/* COMERCIAL V9 · CL-05 Ventas (listado) · CL-07 nueva venta (directa o desde cotización) · CL-09 ficha de la venta · modales CL-06, CL-08, CL-11, CL-12.
   Regla de stock (DECISIÓN CERRADA 2026-09-16): la venta pendiente compromete stock; sale cuando los pagos validados cubren el total. */
const CM02 = {
  f: { q: '', sede: '', est: '', pago: '', stock: '', mon: '', desde: '', hasta: '' },
  lista() {
    const f = CM02.f, q = f.q.trim().toLowerCase();
    return Store.d.ventas.filter(v => (!f.sede || v.sede === f.sede) && (!f.est || v.estado === f.est) && (!f.pago || Ventas.estadoPago(v) === f.pago) &&
      (!f.stock || Ventas.estadoStock(v) === f.stock) && (!f.mon || v.mon === f.mon) && UI.enRango(v.fecha, f.desde, f.hasta) &&
      (!q || (v.id + ' ' + v.compNum + ' ' + v.cliente.nom + ' ' + v.cliente.doc).toLowerCase().includes(q)));
  },
  sumaMon(lista, fn) {
    return M.MONEDAS.map(m => { const t = lista.filter(v => v.mon === m.cod).reduce((a, v) => a + fn(v), 0); return t > 0.004 ? UI.m(t, m.cod) : ''; }).filter(Boolean).join(' · ') || UI.s(0);
  },
  render() {
    const f = CM02.f, reg = Store.d.ventas.filter(v => v.estado === 'Registrada'), hoy = UI.hoy();
    const deHoy = reg.filter(v => v.fecha.slice(0, 10) === hoy), conDeuda = reg.filter(v => Ventas.deuda(v) > 0.004);
    const pv = Store.d.ventas.reduce((t, v) => t + Ventas.porValidar(v), 0), pdv = Store.d.ventas.filter(v => Ventas.porDevolver(v) > 0.004);
    return '<div class="screen-head"><h1>Ventas</h1><span class="code">CL-05</span><div class="spacer"></div>' +
      '<button class="btn btn-secondary" onclick="CM02.excel(false)">⇩ Excel general</button><button class="btn btn-secondary" onclick="CM02.excel(true)">⇩ Excel detalle</button>' +
      (Store.puede('crear_venta') ? '<button class="btn btn-secondary" onclick="CM02.desdeCot()">Desde cotización</button><button class="btn btn-primary" onclick="App.go(\'cm02f\',{nuevo:Date.now()})">+ Nueva venta</button>' : '') + '</div>' +
      UI.kpis([
        { l: 'Vendido hoy', v: CM02.sumaMon(deHoy, Ventas.neto), s: deHoy.length + ' venta(s) registradas hoy' },
        { l: 'Por cobrar', v: CM02.sumaMon(conDeuda, Ventas.deuda), s: conDeuda.length + ' venta(s) · ' + conDeuda.filter(Ventas.vencida).length + ' vencida(s)', color: 'var(--pendiente)' },
        { l: 'Pagos por validar', v: pv, s: 'se validan en Caja (CL-18) · ' + reg.filter(v => Ventas.estadoStock(v) === 'Stock comprometido').length + ' venta(s) con stock comprometido', color: 'var(--parcial)' },
        { l: 'Dinero por devolver', v: CM02.sumaMon(pdv, Ventas.porDevolver), s: pdv.length + ' venta(s)', color: 'var(--rechazado-sol)' }
      ]) +
      '<div class="card"><div class="filters">' +
      UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" placeholder="N° venta, comprobante o cliente" oninput="CM02.f.q=this.value;CM02.pintar()" style="min-width:220px">') +
      UI.campo('Tienda', '<select onchange="CM02.f.sede=this.value;CM02.pintar()">' + UI.opts(M.SEDES.map(s => ({ v: s.cod, t: s.nom })), f.sede, 'Todas') + '</select>') +
      UI.campo('Estado', '<select onchange="CM02.f.est=this.value;CM02.pintar()">' + UI.opts(['Registrada', 'Anulada'], f.est, 'Todos') + '</select>') +
      UI.campo('Pago', '<select onchange="CM02.f.pago=this.value;CM02.pintar()">' + UI.opts(['Pagado', 'Por validar', 'Parcial', 'Pendiente de pago', 'Por devolver', 'Anulada'], f.pago, 'Todos') + '</select>') +
      UI.campo('Stock', '<select onchange="CM02.f.stock=this.value;CM02.pintar()">' + UI.opts(['Stock comprometido', 'Stock entregado', 'Stock liberado', 'Stock devuelto'], f.stock, 'Todos') + '</select>') +
      UI.campo('Moneda', '<select onchange="CM02.f.mon=this.value;CM02.pintar()">' + UI.opts(M.MONEDAS.map(m => m.cod), f.mon, 'Todas') + '</select>') +
      UI.campo('Desde', '<input type="date" value="' + f.desde + '" onchange="CM02.f.desde=this.value;CM02.pintar()">') +
      UI.campo('Hasta', '<input type="date" value="' + f.hasta + '" onchange="CM02.f.hasta=this.value;CM02.pintar()">') +
      '</div></div><div id="cm02-body"></div>' +
      '<p class="hint">Una venta es un solo documento para productos y servicios. Al registrarla queda pendiente de pago y <b>compromete</b> el stock de cada línea en su almacén (baja el Disponible). ' +
      'Cuando los pagos <b>validados</b> en caja cubren el total se registra la <b>Salida</b> de almacén (GI-10, venta al por menor o al por mayor), que baja el Actual y libera lo comprometido. ' +
      'No se edita después: mientras el stock está comprometido se anula (libera lo comprometido); cuando ya salió se corrige con una devolución o, dentro del plazo, se anula.</p>';
  },
  pintar() {
    const filas = CM02.lista().map(v => {
      const deuda = Ventas.deuda(v), vto = Ventas.vencimiento(v);
      return '<tr class="clickable" onclick="App.go(\'cm02v\',{id:\'' + v.id + '\'})"><td><b>' + v.id + '</b><br><span class="mini">' + M.comp(v.comp).nom + ' ' + v.compNum + '</span></td>' +
        '<td class="mini">' + v.fecha + '</td><td class="mini">' + UI.esc(v.sedeNom) + '</td>' +
        '<td>' + UI.esc(v.cliente.nom) + '<br><span class="mini">' + UI.esc(v.cliente.doc) + ' · ' + v.cliente.tipo + '</span></td>' +
        '<td class="mini">' + M.cond(v.cond).nom + (vto ? '<br>vence ' + vto : '') + '</td>' +
        '<td class="num">' + UI.m(v.total, v.mon) + '</td><td class="num"><span class="' + (Ventas.vencida(v) ? 'err-t' : '') + '">' + (deuda > 0.004 ? UI.m(deuda, v.mon) : '—') + '</span></td>' +
        '<td>' + UI.estado(Ventas.estadoPago(v)) + (Ventas.porValidar(v) ? '<br><span class="mini">' + Ventas.porValidar(v) + ' por validar</span>' : '') + '</td><td>' + UI.estado(v.estado) + (Ventas.estadoStock(v) ? '<br>' + UI.estado(Ventas.estadoStock(v)) : '') + '</td></tr>';
    });
    document.getElementById('cm02-body').innerHTML = UI.tabla(['Venta · comprobante', 'Fecha de creación', 'Tienda', 'Cliente', 'Condición', ['Total', 'num'], ['Saldo', 'num'], 'Pago', 'Estado · stock'], filas, { vacio: 'No hay ventas con esos filtros' });
  },
  desdeCot() {
    const vig = Store.d.cots.filter(c => c.estado === 'Vigente');
    UI.modal({
      lg: true, titulo: 'Venta desde una cotización', code: 'CL-06',
      cuerpo: '<div class="filters">' + UI.campo('N° de cotización', '<input id="dc-id" placeholder="Ej. COT-2026-000045 o 45">') +
        '<button class="btn btn-primary" onclick="CM02.irCot(UI.v(\'dc-id\'))">Continuar</button></div>' +
        '<div class="sec">Cotizaciones vigentes</div>' +
        UI.tabla(['N°', 'Cliente', 'Tienda', 'Válida hasta', ['Total', 'num'], ['', '', '90px']], vig.map(c => '<tr><td><b>' + c.id + '</b></td><td>' + UI.esc(c.cliente.nom) + '</td><td class="mini">' + UI.esc(c.sedeNom) + '</td><td>' + c.validez + '</td><td class="num">' + UI.m(c.total, c.mon) + '</td>' +
          '<td><button class="btn btn-secondary btn-sm" onclick="CM02.irCot(\'' + c.id + '\')">Convertir</button></td></tr>'), { vacio: 'No hay cotizaciones vigentes' })
    });
  },
  irCot(txt) {
    const t = String(txt || '').trim().toUpperCase();
    if (!t) { UI.toast('Ingrese el número de la cotización'); return; }
    Cot.barrer();
    const c = Store.cot(t) || Store.d.cots.find(x => x.id.endsWith(t.padStart(6, '0')));
    if (!c) { UI.toast('No existe la cotización ' + t); return; }
    if (c.estado !== 'Vigente') { UI.toast(c.id + ' está ' + c.estado + ': solo se convierte una cotización Vigente'); return; }
    UI.cerrar();
    App.go('cm02f', { cot: c.id, nuevo: Date.now() });
  },
  excel(detalle) {
    const l = CM02.lista();
    if (!detalle) {
      UI.csv('ventas-generales', ['Venta', 'Comprobante', 'Número', 'Fecha de creación', 'Tienda', 'Cliente', 'Documento', 'Tipo de cliente', 'Vendedor', 'Condición', 'Moneda', 'Op. gravada', 'Op. exonerada', 'IGV', 'Total', 'Devuelto', 'Pagado', 'Confirmado (validado)', 'Saldo', 'Estado de pago', 'Stock', 'Salida de stock', 'Estado', 'Cotización'],
        l.map(v => [v.id, M.comp(v.comp).nom, v.compNum, v.fecha, v.sedeNom, v.cliente.nom, v.cliente.doc, v.cliente.tipo, DOCUI.vendedor(v.asesor), M.cond(v.cond).nom, v.mon, v.gravada, v.exonerada, v.igv, v.total, Ventas.devuelto(v), Ventas.pagado(v), Ventas.confirmado(v), Ventas.deuda(v), Ventas.estadoPago(v), Ventas.estadoStock(v), v.salida ? v.salida.f : '', v.estado, v.cot || '']));
      return;
    }
    const filas = [];
    l.forEach(v => v.lineas.forEach((x, i) => filas.push([v.id, v.compNum, v.fecha, v.cliente.nom, i + 1, x.art, x.nom, x.desc, x.um, x.alm, x.cant, x.comp || 0, x.precio, x.dcto, x.obsequio ? 'Sí' : '', x.subtotal, x.impuesto, x.total, v.mon, v.estado])));
    UI.csv('ventas-detalle', ['Venta', 'Comprobante', 'Fecha de creación', 'Cliente', 'Línea', 'Código', 'Artículo', 'Descripción', 'UM', 'Almacén', 'Cantidad', 'Comprometido (UM inventario)', 'Precio', 'Dcto. unit.', 'Obsequio', 'Base', 'IGV', 'Total', 'Moneda', 'Estado'], filas);
  }
};
App.pantalla('cm02', { titulo: 'Ventas', permiso: 'ver_venta', render: CM02.render, despues: CM02.pintar });

/* ---------- nueva venta (directa o conversión de cotización) ---------- */
const CM02F = {
  d: null, clave: null,
  render(p) {
    const clave = (p.cot || '') + '|' + (p.nuevo || '');
    if (!CM02F.d || CM02F.clave !== clave) {
      CM02F.clave = clave;
      try { CM02F.d = p.cot ? Ventas.desdeCotizacion(p.cot) : Ventas.borrador(); }
      catch (e) { CM02F.d = null; return UI.aviso(UI.esc(e.message), 'err') + '<button class="btn btn-secondary" onclick="App.go(\'cm02\')">Volver</button>'; }
      if (!p.cot && p.cli) CM02F._cliente(p.cli);
      if (p.obs) CM02F.d.obs = p.obs;
    }
    const d = CM02F.d, bloq = !!d.cot, sede = Store.sede(d.sede), ses = Caja.abierta(d.sede, d.mon);
    Precios.doc(d);
    const rev = Ventas.revisar(d), cond = M.cond(d.cond), lugar = M.lugar(d.entrega.lugar) || {};
    const pag = UI.r2(d.pagos.reduce((t, x) => t + (Number(x.monto) || 0), 0)), saldo = UI.r2(d.total - pag);
    const sel = (fn, campo, lista, val, vacio) => '<select onchange="CM02F.' + fn + '(\'' + campo + '\',this.value)">' + UI.opts(lista, val, vacio) + '</select>';
    const inp = (fn, campo, val, ph) => '<input value="' + UI.esc(val) + '"' + (ph ? ' placeholder="' + ph + '"' : '') + ' onchange="CM02F.' + fn + '(\'' + campo + '\',this.value)">';

    let html = '<div class="screen-head"><h1>Nueva venta' + (bloq ? ' <span class="mini">desde ' + d.cot + '</span>' : '') + '</h1><span class="code">CL-07</span><div class="spacer"></div>' +
      '<button class="btn btn-secondary" onclick="CM02F.cancelar()">Cancelar</button><button class="btn btn-primary" onclick="CM02F.registrar()">Registrar venta</button></div>';
    html += ses ? UI.aviso('Caja <b>' + ses.id + '</b> abierta en ' + UI.esc(sede.nom) + ' (' + d.mon + '): los pagos entran a esta caja como <b>Por validar</b>; el stock sale cuando lo validado cubre el total.', 'ok')
      : UI.aviso('La caja de ' + UI.esc(sede.nom) + ' en ' + d.mon + ' está <b>cerrada</b>: solo se puede registrar una venta al crédito sin pago a cuenta. ' + (Store.puede('ver_caja') ? '<button class="btn-link" onclick="App.go(\'cm04\')">Ir a Caja (CL-18)</button>' : ''));
    if (bloq) html += UI.aviso('Conversión de <b>' + d.cot + '</b>: el cliente y las líneas vienen de la cotización y no se editan. Complete comprobante, entrega y pago; el Disponible se vuelve a revisar ahora.', 'info');

    html += '<div class="card"><div class="formgrid c4">' +
      UI.dato('Tienda', UI.esc(sede.nom) + '<br><span class="mini">vende desde ' + sede.alm + '</span>') +
      UI.dato('Fecha de creación', UI.hoy() + '<br><span class="mini">la pone el sistema al registrar</span>') +
      UI.campo('Comprobante', sel('cab', 'comp', M.COMPROBANTES.map(x => ({ v: x.cod, t: x.nom + ' · serie ' + M.SERIES[d.sede][x.cod] })), d.comp, 'Seleccionar…'), { req: true, hint: 'La factura exige cliente con RUC' }) +
      UI.campo('Condición de pago', sel('cab', 'cond', M.CONDICIONES.map(x => ({ v: x.cod, t: x.nom })), d.cond), { req: true, hint: cond && cond.dias ? 'Vence el ' + UI.sumarDias(d.fecha + ' 00:00', cond.dias).slice(0, 10) : 'Se paga completo al registrar' }) +
      UI.campo('Moneda', sel('cab', 'mon', M.MONEDAS.map(m => ({ v: m.cod, t: m.cod + ' · ' + m.nom })), d.mon), { req: true, hint: 'Si falta precio en esa moneda, el cambio se revierte' }) +
      (Store.puede('asignar_vendedor') ? UI.campo('Vendedor', sel('cab', 'asesor', DOCUI.vendedores(), d.asesor)) : UI.dato('Vendedor', UI.esc(DOCUI.vendedor(d.asesor)))) +
      UI.campo('Observación', inp('cab', 'obs', d.obs), { estilo: 'grid-column:span 2', hint: 'Obligatoria si hay obsequios' }) + '</div></div>';

    html += DOCUI.cardCliente('CM02F', d, !bloq);
    html += '<div class="card"><div class="sec">Detalle' + (!bloq ? '<div class="spacer"></div><button class="btn btn-secondary btn-sm" onclick="BUS.articulo(CM02F.d, cod => CM02F.agregar(cod))">+ Agregar artículos</button>' : '') + '</div>' +
      DOCUI.lineas('CM02F', d, { editable: true, bloqueadas: bloq, modo: 'venta' }) + DOCUI.totales(d) + '</div>';

    if (d.lineas.length && !Doc.soloServicios(d)) {
      const en = d.entrega;
      html += '<div class="card"><div class="sec">Entrega</div><div class="formgrid c4">' +
        UI.campo('Lugar de entrega', sel('ent', 'lugar', M.LUGARES_ENTREGA.map(x => ({ v: x.cod, t: x.nom })), en.lugar), { req: true }) +
        UI.campo('Fecha de entrega', '<input type="date" value="' + UI.dIso(en.fecha) + '" min="' + UI.dIso(d.fecha) + '" onchange="CM02F.ent(\'fecha\',UI.dTxt(this.value))">', { req: true }) +
        (lugar.ubigeo ? UI.campo('Ubigeo', sel('ent', 'ubigeo', M.UBIGEOS.map(u => ({ v: u.cod, t: u.cod + ' · ' + u.t })), en.ubigeo, 'Seleccionar…'), { req: true }) + UI.campo('Dirección', inp('ent', 'dir', en.dir), { req: true })
          : UI.dato('Se recoge en', UI.esc(sede.nom + ' · ' + sede.dir), { estilo: 'grid-column:span 2' })) +
        (lugar.agencia ? UI.campo('Agencia', sel('ent', 'agencia', M.AGENCIAS, en.agencia, 'Seleccionar…'), { req: true }) : '') +
        (!lugar.propio ? UI.campo('Recibe · nombre', inp('ent', 'encNom', en.encNom), { req: true }) + UI.campo('Recibe · documento', inp('ent', 'encDoc', en.encDoc), { req: true }) + UI.campo('Recibe · teléfono', inp('ent', 'encTel', en.encTel), { req: true }) : '') +
        (cond && cond.cod !== 'CONTADO' ? UI.campo('Entrega del stock', '<label class="mini"><input type="checkbox" ' + (d.entregar ? 'checked' : '') + ' onchange="CM02F.entregaAhora(this.checked)"> Entregar ahora, sin esperar el cobro</label>', { estilo: 'grid-column:span 2', hint: 'Venta al crédito: si no se marca, el stock queda comprometido hasta que el pago confirmado cubra el total' }) : '') +
        '</div><p class="hint" style="margin-top:8px">Al registrar, la venta <b>compromete</b> el stock; la salida de almacén (GI-10) se registra cuando el pago confirmado (validado en caja) cubre el total. La guía de remisión, si el despacho la necesita, se emite en GI-15 con motivo Venta.</p></div>';
    }

    html += '<div class="card"><div class="sec">Documento referencial del cliente <span class="mini">(opcional: los tres datos o ninguno)</span></div><div class="formgrid c4">' +
      UI.campo('Tipo', sel('ref', 'tipo', M.DOC_REFERENCIAL, d.ref.tipo, 'Ninguno')) + UI.campo('Serie', inp('ref', 'serie', d.ref.serie)) + UI.campo('Número', inp('ref', 'num', d.ref.num)) + '</div></div>';

    const mets = M.METODOS.filter(m => m.monedas.indexOf(d.mon) >= 0);
    html += '<div class="card"><div class="sec">Pagos<div class="spacer"></div>' + (ses ? '<button class="btn btn-secondary btn-sm" onclick="CM02F.nuevoPago()">+ Agregar pago</button>' : '') + '</div>' +
      (d.pagos.length ? UI.tabla(['Medio', 'Banco / procesador', 'N° operación', 'Voucher', ['Monto ' + M.sim(d.mon), 'num'], ['', '', '30px']], d.pagos.map((x, i) => {
        const m = M.metodo(x.met) || { bancos: [], efectivo: true };
        return '<tr><td><select class="celda" onchange="CM02F.pago(' + i + ',\'met\',this.value)">' + UI.opts(mets.map(k => ({ v: k.cod, t: k.nom })), x.met) + '</select></td>' +
          '<td>' + (m.bancos.length ? '<select class="celda" onchange="CM02F.pago(' + i + ',\'banco\',this.value)">' + UI.opts(m.bancos, x.banco, 'Seleccionar…') + '</select>' : '<span class="mini">No aplica</span>') + '</td>' +
          '<td>' + (m.efectivo ? '<span class="mini">No aplica</span>' : '<input class="celda" value="' + UI.esc(x.nop) + '" onchange="CM02F.pago(' + i + ',\'nop\',this.value)">') + '</td>' +
          '<td>' + (m.efectivo ? '<span class="mini">No aplica</span>' : (x.voucher ? '📎 ' + UI.esc(x.voucher) + '<br>' : '') + '<input type="file" accept="image/*,.pdf" style="max-width:200px" onchange="CM02F.pago(' + i + ',\'voucher\',this.files[0]?this.files[0].name:\'\')">') + '</td>' +
          '<td class="num"><input class="celda num" type="number" min="0" step="any" style="width:110px" value="' + x.monto + '" onchange="CM02F.pago(' + i + ',\'monto\',this.value)"></td>' +
          '<td><button class="btn-link" onclick="CM02F.quitarPago(' + i + ')">✕</button></td></tr>';
      }), { sub: true }) : '<p class="hint">' + (cond && cond.cod === 'CONTADO' ? 'Venta al contado: registre uno o más pagos (pueden ser de medios distintos) que sumen el total.' : 'Venta al crédito: puede dejar un pago a cuenta menor que el total o cobrar después desde la venta o desde Caja.') + '</p>') +
      '<div class="chips" style="justify-content:flex-end;align-items:center;margin-top:8px"><span class="chip">Total ' + UI.m(d.total, d.mon) + '</span><span class="chip">Pagado ' + UI.m(pag, d.mon) + '</span>' +
      '<span class="chip"' + (Math.abs(saldo) > 0.004 ? ' style="background:#FFFBEB;border-color:#FDE68A"' : '') + '>Saldo ' + UI.m(saldo, d.mon) + '</span>' +
      (ses && saldo > 0.004 ? '<button class="btn btn-secondary btn-sm" onclick="CM02F.completar()">Completar saldo</button>' : '') + '</div></div>';

    if (rev.e.length) html += UI.aviso('<b>Para registrar falta:</b><ul class="errlist">' + rev.e.slice(0, 8).map(x => '<li>' + UI.esc(x) + '</li>').join('') + '</ul>', 'err');
    else html += UI.aviso('Lista para registrar. Al confirmar: ' + (Doc.soloServicios(d) ? 'solo servicios, sin stock' : 'se <b>compromete</b> el stock de los productos (sale cuando los pagos validados cubran el total)') + (d.pagos.length ? ', pagos Por validar en la caja ' + ses.id : '') + (d.cot ? ' y ' + d.cot + ' pasa a Convertida' : '') + '.', 'ok');
    if (rev.w.length) html += UI.aviso('<b>Avisos (no bloquean):</b><ul class="errlist">' + rev.w.map(x => '<li>' + UI.esc(x) + '</li>').join('') + '</ul>');
    return html;
  },

  _ok(fn) { App.accion(fn); App.refrescar(); },
  _cliente(cod) {
    const d = CM02F.d, c = Doc.cambiarCliente(d, cod);
    if (c.tipoDoc === 'RUC') d.comp = 'FA'; else if (d.comp === 'FA') d.comp = 'BV';
    d.cond = c.cond || 'CONTADO';
    if (c.dir && c.ubigeo && !d.entrega.dir) { d.entrega.dir = c.dir; d.entrega.ubigeo = c.ubigeo; }
    return c;
  },
  agregar(cod) { CM02F._ok(() => Doc.agregar(CM02F.d, cod)); },
  cambiar(i, campo, val) { CM02F._ok(() => Doc.cambiar(CM02F.d, i, campo, val)); },
  quitar(i) { CM02F._ok(() => Doc.quitar(CM02F.d, i)); },
  cliente(cod) { CM02F._ok(() => CM02F._cliente(cod)); },
  cab(campo, val) {
    CM02F._ok(() => {
      const d = CM02F.d;
      if (campo === 'mon') { const antes = d.mon; Doc.cambiarMoneda(d, val); if (antes !== d.mon) d.pagos = []; }
      else d[campo] = val;
    });
  },
  ent(campo, val) { CM02F.d.entrega[campo] = val; App.refrescar(); },
  /* venta al crédito: entregar el stock al registrar, sin esperar el cobro (CM-6) */
  entregaAhora(v) { CM02F.d.entregar = !!v; App.refrescar(); },
  ref(campo, val) { CM02F.d.ref[campo] = val; App.refrescar(); },
  nuevoPago() {
    const d = CM02F.d, pag = d.pagos.reduce((t, x) => t + (Number(x.monto) || 0), 0);
    d.pagos.push({ met: 'EFE', banco: '', nop: '', voucher: '', monto: Math.max(0, UI.r2(d.total - pag)) });
    App.refrescar();
  },
  pago(i, campo, val) {
    const x = CM02F.d.pagos[i];
    if (!x) return;
    if (campo === 'monto') x.monto = Number(val) || 0; else x[campo] = val;
    if (campo === 'met') { x.banco = ''; if ((M.metodo(val) || {}).efectivo) { x.nop = ''; x.voucher = ''; } }
    App.refrescar();
  },
  quitarPago(i) { CM02F.d.pagos.splice(i, 1); App.refrescar(); },
  completar() {
    const d = CM02F.d, pag = d.pagos.reduce((t, x) => t + (Number(x.monto) || 0), 0), saldo = UI.r2(d.total - pag);
    if (!d.pagos.length) { CM02F.nuevoPago(); return; }
    const x = d.pagos[d.pagos.length - 1];
    x.monto = UI.r2((Number(x.monto) || 0) + saldo);
    App.refrescar();
  },
  cancelar() { const cot = CM02F.d && CM02F.d.cot; CM02F.d = null; if (cot) App.go('cm01f', { id: cot }); else App.go('cm02'); },
  registrar() {
    const d = CM02F.d, r = Ventas.revisar(d);
    if (r.e.length) { UI.toast(r.e[0]); App.refrescar(); return; }
    const go = () => {
      const res = App.accion(() => Ventas.registrar(d), x => 'Venta ' + x.venta.id + ' registrada · ' + M.comp(x.venta.comp).nom + ' ' + x.venta.compNum);
      if (res) { CM02F.d = null; App.go('cm02v', { id: res.venta.id }); }
    };
    if (r.w.length) UI.confirmar('Registrar con avisos de stock', '<p>Estos artículos se registran aunque el <b>Disponible</b> (Actual − Comprometido) no alcance, porque su control de stock es «Avisar y permitir»: el comprometido puede superar al Actual y, cuando salga el stock, el Actual puede quedar negativo:</p><ul class="errlist">' + r.w.map(x => '<li>' + UI.esc(x) + '</li>').join('') + '</ul>', go, 'Registrar venta', 'CL-08');
    else go();
  }
};
App.pantalla('cm02f', {
  titulo: 'Nueva venta', menu: 'cm02', permiso: 'crear_venta', render: CM02F.render,
  miga: p => '<a class="btn-link" onclick="App.go(\'cm02\')">Ventas</a> / <b>Nueva' + (p.cot ? ' desde ' + UI.esc(p.cot) : '') + '</b>'
});

/* ---------- ficha de la venta ---------- */
const CM02V = {
  tab: 'det',
  v() { return Store.venta(App.params.id); },
  render(p) {
    const v = Store.venta(p.id);
    if (!v) return UI.aviso('No existe la venta ' + UI.esc(p.id), 'err');
    if (p.tab) { CM02V.tab = p.tab; delete p.tab; }
    const comp = M.comp(v.comp), deuda = Ventas.deuda(v), devs = Store.d.devs.filter(x => x.venta === v.id), vto = Ventas.vencimiento(v);
    const movIds = v.movs.concat(...devs.map(x => x.movs)), movs = movIds.map(id => Store.d.movs.find(m => m.id === id)).filter(Boolean);
    const b = [];
    if (v.estado === 'Registrada' && deuda > 0.004 && (Store.puede('crear_venta') || Store.puede('crear_caja'))) b.push('<button class="btn btn-primary" onclick="PAGOUI.abrir(CM02V.v())">+ Pago</button>');
    if (v.estado === 'Registrada' && v.salida && Dev.candidatas(v).length && Store.puede('crear_devolucion_venta')) b.push('<button class="btn btn-secondary" onclick="App.go(\'cm03f\',{venta:\'' + v.id + '\',nuevo:Date.now()})">↩ Devolución</button>');
    b.push('<button class="btn btn-secondary" onclick="DOCUI.imprimir(\'Venta\',CM02V.v())">⎙ PDF</button>');
    if (v.estado === 'Registrada' && !v.salida && Ventas.aCredito(v) && Ventas.tieneStock(v) && Store.puede('crear_venta')) b.push('<button class="btn btn-secondary" onclick="CM02V.entregar()">Entregar</button>');
    if (v.estado === 'Registrada' && Store.puede('anular_venta')) b.push('<button class="btn btn-danger" onclick="CM02V.anular()">Anular</button>');
    b.push('<button class="btn btn-secondary" onclick="App.go(\'cm02\')">Volver</button>');
    const tabs = [['det', 'Detalle'], ['pag', 'Pagos (' + v.pagos.length + ')'], ['dev', 'Devoluciones (' + devs.length + ')'], ['mov', 'Movimientos de stock (' + movs.length + ')'], ['hist', 'Historial']];

    let html = '<div class="screen-head"><h1>' + v.id + '</h1>' + UI.estado(v.estado) + ' ' + UI.estado(Ventas.estadoPago(v)) + (Ventas.estadoStock(v) ? ' ' + UI.estado(Ventas.estadoStock(v)) : '') + ' <span class="mini">' + comp.nom + ' ' + v.compNum + '</span><span class="code">CL-09</span><div class="spacer"></div>' + b.join('') + '</div>';
    if (v.anulacion) html += UI.aviso('<b>Anulada</b> el ' + v.anulacion.f + ' por ' + UI.esc(v.anulacion.u) + ': ' + UI.esc(v.anulacion.motivo) + '. ' + (v.salida ? 'El stock volvió al almacén' : Ventas.tieneStock(v) ? 'Se liberó el stock comprometido (no había salido)' : 'Solo servicios') + (Ventas.porDevolver(v) > 0.004 ? ' y hay <b>' + UI.m(Ventas.porDevolver(v), v.mon) + '</b> por devolver al cliente en Caja.' : '.'), 'err');
    else if (Ventas.porDevolver(v) > 0.004) html += UI.aviso('Hay <b>' + UI.m(Ventas.porDevolver(v), v.mon) + '</b> por devolver al cliente: se entrega en Caja (CL-18 › Devoluciones de dinero).');
    if (v.estado === 'Registrada' && Ventas.estadoStock(v) === 'Stock comprometido') html += UI.aviso('<b>Stock comprometido</b> (' + UI.n(Ventas.comprometido(v), 0) + ' unidad(es) de inventario): baja el Disponible pero aún no sale del almacén. Sale con una Salida GI-10 cuando los pagos <b>validados</b> cubran el total (confirmado ' + UI.m(Ventas.confirmado(v), v.mon) + ' de ' + UI.m(v.total, v.mon) + '). Mientras tanto no admite devoluciones: si ya no va, se anula y se libera lo comprometido.', 'info');
    else if (v.salida && v.salida.movs.length) html += UI.aviso('Stock entregado el ' + v.salida.f + ' al confirmarse el pago completo: ' + v.salida.movs.map(id => '<button class="btn-link" style="padding:0" onclick="CM06.verMov(\'' + id + '\')">' + id + '</button>').join(', ') + '.', 'ok');
    if (Ventas.vencida(v)) html += UI.aviso('Crédito vencido el ' + vto + ' con saldo ' + UI.m(deuda, v.mon) + '.', 'err');
    html += UI.kpis([
      { l: 'Total', v: UI.m(v.total, v.mon), s: 'confirmado ' + UI.m(Ventas.confirmado(v), v.mon) },
      { l: 'Devuelto', v: UI.m(Ventas.devuelto(v), v.mon), color: 'var(--borrador)' },
      { l: 'Pagado', v: UI.m(Ventas.pagado(v), v.mon), s: Ventas.porValidar(v) ? Ventas.porValidar(v) + ' pago(s) por validar' : '', color: 'var(--confirmado)' },
      { l: 'Saldo', v: UI.m(deuda, v.mon), s: vto ? 'vence ' + vto : '', color: deuda > 0.004 ? 'var(--pendiente)' : 'var(--confirmado)' }
    ]);
    const en = v.entrega;
    html += '<div class="card"><div class="formgrid c4">' +
      UI.dato('Comprobante', comp.nom + '<br><b>' + v.compNum + '</b>') + UI.dato('Fecha de creación', v.fecha) + UI.dato('Tienda', UI.esc(v.sedeNom)) +
      UI.dato('Condición · moneda', M.cond(v.cond).nom + ' · ' + v.mon) +
      UI.dato('Vendedor', UI.esc(DOCUI.vendedor(v.asesor)) + '<br><span class="mini">registró ' + UI.esc(v.usuario) + '</span>') +
      UI.dato('Origen', v.cot ? 'Cotización <button class="btn-link" style="padding:0" onclick="App.go(\'cm01f\',{id:\'' + v.cot + '\'})">' + v.cot + '</button>' : 'Venta directa') +
      UI.dato('Documento referencial', v.ref && v.ref.tipo ? UI.esc(v.ref.tipo + ' ' + v.ref.serie + '-' + v.ref.num) : '') +
      UI.dato('Se puede anular hasta', v.estado !== 'Registrada' ? '' : v.salida ? v.plazoAnular : 'sin plazo mientras no se confirme el pago completo') +
      (en ? UI.dato('Entrega', UI.esc(M.lugar(en.lugar).nom) + ' · ' + en.fecha + (en.agencia ? ' · ' + en.agencia : '') + (en.dir ? '<br><span class="mini">' + UI.esc(en.dir) + ' · ' + UI.esc(M.ubigeo(en.ubigeo)) + '</span>' : ''), { estilo: 'grid-column:span 2' }) +
        (en.encNom ? UI.dato('Recibe', UI.esc(en.encNom) + '<br><span class="mini">' + UI.esc(en.encDoc) + ' · ' + UI.esc(en.encTel) + '</span>') : '')
        : UI.dato('Entrega', 'No aplica (solo servicios)')) +
      (v.obs ? UI.dato('Observación', UI.esc(v.obs), { full: true }) : '') + '</div></div>';
    html += DOCUI.cardCliente('CM02V', v, false);
    html += '<div class="tabs">' + tabs.map(t => '<div class="tab' + (t[0] === CM02V.tab ? ' active' : '') + '" onclick="CM02V.tab=\'' + t[0] + '\';App.refrescar()">' + t[1] + '</div>').join('') + '</div>';
    html += CM02V['t_' + CM02V.tab](v, devs, movs);
    return html;
  },
  t_det(v) {
    const costo = UI.r2(v.lineas.reduce((t, l) => t + (l.costo || 0) * l.cant, 0));
    const base = v.mon === 'USD' ? UI.r2(v.subtotal * Store.cfg().tc) : v.subtotal;
    return '<div class="card">' + DOCUI.lineas('CM02V', v, { soloLectura: true }) + DOCUI.totales(v) +
      (Store.puede('configurar_comercial') && costo ? '<p class="hint" style="text-align:right;margin-top:8px">Costo de lo vendido (costo promedio del almacén al salir): ' + UI.s(costo) + ' · margen sobre la base sin IGV: <b>' + UI.s(base - costo) + '</b></p>' : '') + '</div>';
  },
  t_pag(v) {
    const filas = v.pagos.map(x => {
      const m = M.metodo(x.met), s = Store.sesion(x.caja), puede = x.estado === 'Por validar' && Store.puede('valid_payments') && s && s.estado === 'Abierta';
      return '<tr><td><b>' + x.id + '</b></td><td class="mini">' + x.fecha + '<br>' + UI.esc(x.usuario) + '</td><td>' + m.nom + (x.banco ? '<br><span class="mini">' + x.banco + '</span>' : '') + '</td>' +
        '<td>' + UI.esc(x.nop || '') + (x.voucher ? '<br><span class="mini">📎 ' + UI.esc(x.voucher) + '</span>' : '') + '</td><td class="num">' + UI.m(x.monto, v.mon) + '</td>' +
        '<td class="mini">' + x.caja + (s ? '<br>' + s.estado : '') + '</td><td>' + UI.estado(x.estado) + (x.validado ? '<br><span class="mini">' + x.validado.f + ' · ' + UI.esc(x.validado.u) + '</span>' : '') + (x.motivo ? '<br><span class="mini">' + UI.esc(x.motivo) + '</span>' : '') + '</td>' +
        '<td>' + (puede ? '<button class="btn btn-primary btn-sm" onclick="CM02V.validar(\'' + x.id + '\')">Validar</button> <button class="btn-link" onclick="CM02V.rechazar(\'' + x.id + '\')">Rechazar</button>' : '') + '</td></tr>';
    });
    const ree = v.reembolsos.map(r => '<tr><td><b>' + r.id + '</b></td><td class="mini">' + r.fecha + '</td><td>' + (r.origen === 'Anulación' ? 'Anulación de la venta' : '<button class="btn-link" onclick="App.go(\'cm03f\',{id:\'' + r.origen + '\'})">' + r.origen + '</button>') + '</td>' +
      '<td class="num">' + UI.m(r.monto, v.mon) + '</td><td>' + UI.estado(r.estado) + '</td><td class="mini">' + (r.mov ? r.mov + ' · ' + r.caja : 'Se entrega en Caja') + '</td></tr>');
    return UI.tabla(['Pago', 'Fecha de creación', 'Medio', 'Operación / voucher', ['Monto', 'num'], 'Caja', 'Estado', ['', '', '160px']], filas, { vacio: 'Sin pagos' + (Ventas.deuda(v) > 0.004 ? ': cobre con + Pago o desde Caja' : '') }) +
      (ree.length ? '<div class="sec">Devoluciones de dinero al cliente</div>' + UI.tabla(['N°', 'Fecha de creación', 'Origen', ['Monto', 'num'], 'Estado', 'Movimiento de caja'], ree) : '') +
      '<p class="hint">Cada pago entra a la caja abierta de la tienda como <b>Por validar</b>; quien tiene el permiso valid_payments lo valida o lo rechaza (por ejemplo, si la transferencia no llegó). Solo lo validado cuenta en el arqueo y solo cuando lo validado cubre el total sale el stock de la venta.</p>';
  },
  t_dev(v, devs) {
    return UI.tabla(['Devolución', 'Fecha de creación', 'Sustento', ['Unidades', 'num'], ['Total', 'num'], 'Dinero', 'Estado'], devs.map(x => {
      const re = Dev.reembolso(x);
      return '<tr class="clickable" onclick="App.go(\'cm03f\',{id:\'' + x.id + '\'})"><td><b>' + x.id + '</b></td><td class="mini">' + x.fecha + '</td><td>' + UI.esc(x.sustTipo + ' ' + x.sustNum) + '</td>' +
        '<td class="num">' + UI.n(x.lineas.reduce((t, l) => t + l.cant, 0), 0) + '</td><td class="num">' + UI.m(x.total, x.mon) + '</td>' +
        '<td class="mini">' + (re ? UI.m(re.monto, x.mon) + ' · ' + re.estado : x.estado === 'Finalizada' ? 'Descontado del saldo' : '—') + '</td><td>' + UI.estado(x.estado) + '</td></tr>';
    }), { vacio: 'Sin devoluciones' });
  },
  t_mov(v, devs, movs) {
    return UI.tabla(['Movimiento', 'Fecha', 'Tipo', 'Detalle', 'Documento', 'Almacén', 'Concepto contable', ['Valor', 'num']], movs.map(m =>
      '<tr class="clickable" onclick="CM06.verMov(\'' + m.id + '\')"><td><b>' + m.id + '</b></td><td class="mini">' + m.fecha + '</td><td>' + UI.badge(m.tipo, m.tipo === 'Ingreso' ? 'var(--confirmado)' : 'var(--parcial)') + '</td>' +
      '<td>' + UI.esc(m.det) + '</td><td>' + m.ndoc + '</td><td class="mini">' + m.alm + '</td><td class="mini">' + UI.esc(m.concepto) + '</td><td class="num">' + UI.s(m.valor) + '</td></tr>'), { vacio: !Ventas.tieneStock(v) ? 'Sin movimientos de stock (solo servicios)' : v.salida ? 'Sin movimientos de stock' : 'Aún sin salida: el stock está comprometido hasta que los pagos validados cubran el total' }) +
      '<p class="hint">Los mismos movimientos se ven en GI-07 (Movimientos) y GI-06 (Kardex), con la venta o la devolución como documento de origen.</p>';
  },
  t_hist(v) { return DOCUI.historial(v); },
  validar(id) { if (App.accion(() => Ventas.validarPago(CM02V.v(), id), () => CM02V.msgValidado(CM02V.v(), id))) App.refrescar(); },
  msgValidado(v, id) { return v.salida && v.salida.pago === id ? 'Pago ' + id + ' validado: pago completo, salió el stock' + (v.salida.movs.length ? ' (' + v.salida.movs.join(', ') + ')' : '') : 'Pago ' + id + ' validado' + (Ventas.estadoStock(v) === 'Stock comprometido' ? ': el stock sigue comprometido hasta cubrir el total' : ''); },
  rechazar(id) {
    UI.motivo('Rechazar pago ' + id, '<p>El pago queda Anulado y el saldo vuelve a estar pendiente. No mueve stock: la venta sigue con su stock comprometido.</p>', null,
      mot => { if (App.accion(() => Ventas.rechazarPago(CM02V.v(), id, mot), 'Pago rechazado')) { UI.cerrar(); App.refrescar(); } }, 'Rechazar', 'CL-11');
  },
  entregar() {
    const v = CM02V.v();
    UI.confirmar('Entregar ' + v.id, 'Sale el stock de la venta al crédito antes de cobrarla: baja el Actual del almacén y libera lo comprometido. Después solo se puede corregir con una devolución o anulando dentro del plazo.',
      () => { if (App.accion(() => Ventas.entregar(v), v.id + ' entregada: stock fuera del almacén')) App.refrescar(); }, 'Entregar', 'CL-08');
  },
  anular() {
    const v = CM02V.v();
    const efecto = v.salida ? 'el stock vuelve al almacén con un Ingreso' : Ventas.tieneStock(v) ? 'se <b>libera el stock comprometido</b> (aún no había salido)' : 'no hay stock que mover (solo servicios)';
    const plazo = v.salida ? ' Solo hasta el ' + v.plazoAnular + ' y si no tiene devoluciones.' : ' Mientras no se confirme el pago completo no hay plazo.';
    UI.motivo('Anular ' + v.id, '<p>La venta no se borra: queda <b>Anulada</b>, ' + efecto + ' y lo cobrado queda por devolver en Caja.' + plazo + '</p>', M.MOTIVOS_ANULACION,
      mot => { if (App.accion(() => Ventas.anular(v, mot), v.id + ' anulada')) { UI.cerrar(); App.refrescar(); } }, 'Anular venta', 'CL-12');
  }
};
App.pantalla('cm02v', {
  titulo: 'Venta', menu: 'cm02', permiso: 'ver_venta', render: CM02V.render,
  miga: p => '<a class="btn-link" onclick="App.go(\'cm02\')">Ventas</a> / <b>' + UI.esc(p.id) + '</b>'
});
