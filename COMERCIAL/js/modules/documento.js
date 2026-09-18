/* COMERCIAL V9 · piezas de pantalla compartidas por cotización y venta: cliente, líneas, totales, pago e impresión.
   ctx = nombre del objeto de pantalla que expone cambiar(i,campo,val), quitar(i) y cliente(cod). */
const DOCUI = {
  vendedor(cod) { const u = M.USUARIOS.find(x => x.cod === cod); return u ? u.nom : (cod || '—'); },
  vendedores() { return M.USUARIOS.filter(u => u.perfil !== 'Cajero').map(u => ({ v: u.cod, t: u.nom })); },

  cardCliente(ctx, d, editable) {
    const c = Store.cli(d.cli) || null, snap = d.cliente;
    const btn = editable ? '<div class="spacer"></div><button class="btn btn-secondary btn-sm" onclick="BUS.cliente(cod => ' + ctx + '.cliente(cod))">🔍 Buscar cliente</button>' +
      (Store.puede('crear_cliente') ? ' <button class="btn btn-secondary btn-sm" onclick="CLIQ.abrir(cod => ' + ctx + '.cliente(cod))">+ Nuevo cliente</button>' : '') : '';
    let cuerpo;
    if (c) {
      cuerpo = '<div class="formgrid c4">' +
        UI.dato('Nombre / razón social', '<b>' + UI.esc(snap && !editable ? snap.nom : c.nom) + '</b><br><button class="btn-link" style="padding:0" onclick="App.go(\'cm07f\',{id:\'' + c.cod + '\'})">' + c.cod + '</button>') +
        UI.dato('Documento', UI.esc(snap && !editable ? snap.doc : Cli.docTxt(c))) +
        UI.dato('Tipo de cliente', (snap && !editable ? snap.tipo : c.tipo) + '<br><span class="mini">Condición habitual: ' + ((M.cond(c.cond) || {}).nom || '—') + '</span>') +
        UI.dato('Contacto', UI.esc(c.tel || '—') + (c.email ? '<br><span class="mini">' + UI.esc(c.email) + '</span>' : '')) + '</div>';
    } else cuerpo = UI.aviso('Seleccione el cliente con <b>🔍 Buscar cliente</b>' + (Store.puede('crear_cliente') ? ' o regístrelo con <b>+ Nuevo cliente</b>' : ''), 'info');
    return '<div class="card"><div class="sec">Cliente' + btn + '</div>' + cuerpo + '</div>';
  },

  /* o: {editable, bloqueadas (líneas fijas, p. ej. al convertir), modo 'cot'|'venta', soloLectura (ver un documento ya registrado)} */
  lineas(ctx, d, o) {
    o = o || {};
    const ed = !!o.editable && !o.bloqueadas, ro = !!o.soloLectura;
    const inp = (i, campo, val, w) => '<input class="celda num" type="number" min="0" step="any" value="' + val + '" style="width:' + w + 'px" onchange="' + ctx + '.cambiar(' + i + ',\'' + campo + '\',this.value)">';
    const filas = d.lineas.map((l, i) => {
      const a = Store.art(l.art) || { inv: !!l.alm, u: l.um }, ums = Store.art(l.art) ? Precios.unidades(l.art) : [l.um];
      const rev = ro ? { e: [], w: [] } : Doc.revisarLinea(d, l, o.modo);
      const msgs = rev.e.map(x => '<span class="err-t">✕ ' + UI.esc(x) + '</span>').concat(rev.w.map(x => '<span class="warn-t">⚠ ' + UI.esc(x) + '</span>'));
      const um = ed && ums.length > 1 ? '<select class="celda" onchange="' + ctx + '.cambiar(' + i + ',\'um\',this.value)">' + UI.opts(ums, l.um) + '</select>'
        : l.um + (l.factor > 1 ? '<br><span class="mini">= ' + l.factor + ' ' + a.u + '</span>' : '');
      const alm = !a.inv ? '<span class="mini">Servicio</span>' : ed ? '<select class="celda" onchange="' + ctx + '.cambiar(' + i + ',\'alm\',this.value)">' +
        UI.opts(M.ALMACENES.filter(x => x.cod !== Store.cfg().almMalEstado).map(x => ({ v: x.cod, t: x.cod })), l.alm) + '</select>' : '<span class="mini">' + l.alm + '</span>';
      const disp = ro ? (l.comp > 0 ? '<span class="warn-t">comprometido ' + UI.q(l.comp, a.u) + '</span>' : '') + (l.costo != null && Store.puede('configurar_comercial') ? (l.comp > 0 ? '<br>' : '') + '<span class="mini">costo ' + UI.n(l.costo) + '</span>' : '') : a.inv ? UI.n(Stock.disp(l.alm, l.art), 0) + ' <span class="mini">' + a.u + '</span>' : '—';
      const desc = !a.inv ? (ed ? '<input class="celda" style="width:100%;margin-top:4px" placeholder="Descripción personalizada para el cliente" value="' + UI.esc(l.desc) + '" onchange="' + ctx + '.cambiar(' + i + ',\'desc\',this.value)">'
        : (l.desc ? '<br><span class="mini">“' + UI.esc(l.desc) + '”</span>' : '')) : '';
      return '<tr class="' + (msgs.length ? 'con-msg' : '') + '"><td class="num">' + (i + 1) + '</td>' +
        '<td>' + UI.esc(l.nom) + '<br><span class="mini">' + l.art + (l.origen ? ' · ' + (l.precioRef ? UI.esc(l.origen) + ' <span class="mini">(referencial ' + UI.n(l.precioRef.precio) + ' · ' + UI.esc(l.precioRef.origen) + ')</span>' : l.oferta ? '<b class="ok-t">' + UI.esc(l.origen) + '</b>' + (l.precioLista ? ' (lista ' + UI.n(l.precioLista) + ')' : '') : UI.esc(l.origen)) : '') + '</span>' + desc + '</td>' +
        '<td>' + um + '</td><td>' + alm + '</td><td class="num">' + disp + '</td>' +
        '<td class="num">' + (ed ? inp(i, 'cant', l.cant, 70) : UI.q(l.cant)) + '</td>' +
        '<td class="num">' + (ed ? inp(i, 'precio', l.precio, 90) : UI.n(l.obsequio ? 0 : l.precio)) + '</td>' +
        '<td class="num">' + (ed && !l.oferta ? inp(i, 'dcto', l.dcto, 70) : ed ? '<span class="mini">no aplica</span>' : (l.dcto && !l.obsequio ? UI.n(l.dcto) : '')) + '</td>' +
        '<td style="text-align:center">' + (ed ? '<input type="checkbox"' + (l.obsequio ? ' checked' : '') + ' onchange="' + ctx + '.cambiar(' + i + ',\'obsequio\',this.checked)">' : (l.obsequio ? 'Sí' : '')) + '</td>' +
        '<td class="num"><b>' + UI.n(l.total) + '</b>' + (Precios.tasa(l.art) === 0 ? '<br><span class="mini">' + UI.esc(a.igv || 'Sin IGV') + '</span>' : '') + '</td>' +
        '<td>' + (ed ? '<button class="btn-link" title="Quitar la línea" onclick="' + ctx + '.quitar(' + i + ')">✕</button>' : '') + '</td></tr>' +
        (msgs.length ? '<tr class="linea-msg"><td></td><td colspan="10">' + msgs.join('<br>') + '</td></tr>' : '');
    });
    return UI.tabla([['#', 'num', '34px'], 'Artículo', ['UM', '', '84px'], ['Almacén', '', '120px'], [ro ? 'Stock' : 'Disponible', 'num'], ['Cantidad', 'num'], ['Precio ' + M.sim(d.mon), 'num'], ['Dcto. unit.', 'num'], 'Obsequio', ['Total', 'num'], ['', '', '30px']],
      filas, { vacio: 'Sin líneas: agregue artículos o servicios' });
  },

  totales(d) {
    const tr = (t, v, b) => '<tr><td>' + t + '</td><td class="num">' + (b ? '<b>' + v + '</b>' : v) + '</td></tr>';
    return '<div style="display:flex;justify-content:flex-end"><table class="grid totales">' +
      tr('Op. gravada', UI.m(d.gravada, d.mon)) + (d.exonerada ? tr('Op. exonerada / inafecta', UI.m(d.exonerada, d.mon)) : '') +
      tr('IGV (' + (d.igvTasa != null ? d.igvTasa : Store.cfg().igv) + '%)', UI.m(d.igv, d.mon)) + tr('Total', UI.m(d.total, d.mon), true) + '</table></div>';
  },

  historial(doc) {
    const h = (doc.hist || []).slice().reverse();
    return '<div class="card"><div class="sec">Historial</div>' + (h.length ? h.map(x => '<div class="hline"><b>' + UI.esc(x.a) + '</b> <span class="mini">· ' + x.f + ' · ' + UI.esc(x.u) + '</span>' + (x.d ? '<div class="hint">' + UI.esc(x.d) + '</div>' : '') + '</div>').join('') : '<p class="hint">Sin registros</p>') + '</div>';
  },

  imprimir(tipo, d) {
    const venta = tipo === 'Venta', comp = venta ? M.comp(d.comp) : null, sede = Store.sede(d.sede), cli = d.cliente || {};
    const titulo = venta ? comp.nom + ' ' + d.compNum : 'Cotización ' + d.id;
    const html = '<div class="head"><div><h1>IMPERIOTEX S.A.C.</h1><div class="mini">' + UI.esc(sede.nom) + ' · ' + UI.esc(sede.dir) + '</div></div>' +
      '<div style="text-align:right"><h1>' + UI.esc(titulo) + '</h1><div class="mini">' + (venta ? 'Venta ' + d.id + ' · ' : '') + 'Fecha de creación ' + d.fecha.slice(0, 10) + (venta ? '' : ' · Válida hasta ' + d.validez) + '</div></div></div>' +
      '<div class="grid2"><div><b>Cliente:</b> ' + UI.esc(cli.nom) + '</div><div><b>Documento:</b> ' + UI.esc(cli.doc) + '</div>' +
      '<div><b>Condición de pago:</b> ' + ((M.cond(d.cond) || {}).nom || '') + (venta && Ventas.vencimiento(d) ? ' (vence ' + Ventas.vencimiento(d) + ')' : '') + '</div><div><b>Moneda:</b> ' + d.mon + '</div>' +
      '<div><b>Vendedor:</b> ' + UI.esc(DOCUI.vendedor(d.asesor)) + '</div>' + (venta && d.entrega ? '<div><b>Entrega:</b> ' + UI.esc(M.lugar(d.entrega.lugar).nom) + ' · ' + d.entrega.fecha + '</div>' : '') + '</div>' +
      '<h2>Detalle</h2><table><thead><tr><th>#</th><th>Código</th><th>Descripción</th><th>UM</th><th class="num">Cant.</th><th class="num">P. unit.</th><th class="num">Dcto.</th><th class="num">Total</th></tr></thead><tbody>' +
      d.lineas.map((l, i) => '<tr><td>' + (i + 1) + '</td><td>' + l.art + '</td><td>' + UI.esc(l.nom) + (l.desc ? '<br><span class="mini">' + UI.esc(l.desc) + '</span>' : '') + (l.obsequio ? ' <b>(obsequio)</b>' : '') + '</td><td>' + l.um + '</td>' +
        '<td class="num">' + UI.q(l.cant) + '</td><td class="num">' + UI.n(l.obsequio ? 0 : l.precio) + '</td><td class="num">' + (l.dcto && !l.obsequio ? UI.n(l.dcto) : '') + '</td><td class="num">' + UI.n(l.total) + '</td></tr>').join('') +
      '</tbody></table><table style="width:300px;margin-left:auto"><tr><td>Op. gravada</td><td class="num">' + UI.m(d.gravada, d.mon) + '</td></tr>' +
      (d.exonerada ? '<tr><td>Op. exonerada</td><td class="num">' + UI.m(d.exonerada, d.mon) + '</td></tr>' : '') +
      '<tr><td>IGV</td><td class="num">' + UI.m(d.igv, d.mon) + '</td></tr><tr class="tot"><td>Total</td><td class="num">' + UI.m(d.total, d.mon) + '</td></tr></table>' +
      (venta && d.pagos.length ? '<h2>Pagos</h2><table><thead><tr><th>Fecha de creación</th><th>Medio</th><th>Operación</th><th class="num">Monto</th><th>Estado</th></tr></thead><tbody>' +
        d.pagos.map(p => '<tr><td>' + p.fecha + '</td><td>' + M.metodo(p.met).nom + (p.banco ? ' · ' + p.banco : '') + '</td><td>' + UI.esc(p.nop) + '</td><td class="num">' + UI.m(p.monto, d.mon) + '</td><td>' + p.estado + '</td></tr>').join('') + '</tbody></table>' : '') +
      (d.obs ? '<p><b>Observación:</b> ' + UI.esc(d.obs) + '</p>' : '') +
      '<p class="mini">Los precios incluyen IGV. ' + (venta ? 'Documento del prototipo: no tiene valor tributario (el envío a SUNAT está fuera de alcance).' : 'Esta cotización no reserva stock.') + '</p>';
    UI.imprimir(titulo, html);
  }
};

/* ---------- registrar un pago contra la caja abierta de la tienda de la venta ---------- */
const PAGOUI = {
  _v: null, _cb: null,
  abrir(v, cb) {
    const ses = Caja.abierta(v.sede, v.mon);
    if (!ses) { UI.toast('La caja de ' + v.sedeNom + ' en ' + v.mon + ' está cerrada: ábrala para cobrar'); return; }
    PAGOUI._v = v; PAGOUI._cb = cb;
    const mets = M.METODOS.filter(m => m.monedas.indexOf(v.mon) >= 0);
    UI.modal({
      titulo: 'Registrar pago · ' + v.id, code: 'CL-10',
      cuerpo: '<div class="formgrid">' + UI.dato('Cliente', UI.esc(v.cliente.nom)) + UI.dato('Saldo pendiente', '<b>' + UI.m(Ventas.deuda(v), v.mon) + '</b>') +
        UI.dato('Entra a la caja', ses.id + ' · ' + UI.esc(ses.nom)) + UI.dato('Fecha de creación', UI.ahora()) +
        UI.campo('Medio de pago', '<select id="pg-met" onchange="PAGOUI.bancos()">' + UI.opts(mets.map(m => ({ v: m.cod, t: m.nom })), 'EFE') + '</select>', { req: true }) +
        UI.campo('Banco / procesador', '<select id="pg-banco"></select>') +
        UI.campo('N° de operación', '<input id="pg-nop">', { hint: 'Obligatorio si no es efectivo' }) +
        UI.campo('Voucher', '<input type="file" id="pg-vou" accept="image/*,.pdf">', { hint: 'Obligatorio si no es efectivo' }) +
        UI.campo('Monto (' + v.mon + ')', '<input id="pg-monto" type="number" min="0" step="any" value="' + Ventas.deuda(v) + '">', { req: true }) + '</div>' +
        '<p class="hint" style="margin-top:10px">El pago queda <b>Por validar</b> hasta que caja lo valide (permiso valid_payments); la caja no se puede cerrar con pagos por validar. ' +
        'El stock de la venta sigue <b>comprometido</b> y sale (Salida GI-10) cuando los pagos validados cubren el total.</p>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="PAGOUI.guardar()">Registrar pago</button>'
    });
    PAGOUI.bancos();
  },
  bancos(idMet, idBanco) {
    const m = M.metodo(UI.v(idMet || 'pg-met')), s = document.getElementById(idBanco || 'pg-banco');
    if (!m || !s) return;
    s.innerHTML = m.bancos.length ? UI.opts(m.bancos, '', 'Seleccionar…') : '<option value="">No aplica</option>';
    s.disabled = !m.bancos.length;
  },
  guardar() {
    const v = PAGOUI._v;
    const p = App.accion(() => Ventas.agregarPago(v, { met: UI.v('pg-met'), banco: UI.v('pg-banco'), nop: UI.v('pg-nop'), voucher: UI.archivo('pg-vou'), monto: UI.v('pg-monto') }),
      x => 'Pago ' + x.id + ' registrado: queda por validar en caja');
    if (p) { UI.cerrar(); if (PAGOUI._cb) PAGOUI._cb(p); else App.refrescar(); }
  }
};
