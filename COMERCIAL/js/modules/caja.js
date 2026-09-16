/* COMERCIAL V9 · CL-18 Caja de la tienda (abrir, cobrar, validar, ingresos, egresos, devolver dinero, cerrar; modales CL-19 a CL-27)
   · CL-28 Historial de cajas (modal CL-29). Validar el pago que completa el total de una venta saca su stock (Salida GI-10). */
const CM04 = {
  mon: 'PEN', tab: 'cob',
  caja() { const s = Store.sede(); return M.CAJAS.find(c => c.sede === s.cod && c.mon === CM04.mon); },
  ses() { return Caja.abierta(Store.sede().cod, CM04.mon); },
  dif(v, mon) {
    const cero = Math.abs(v) < 0.005;
    return '<span class="' + (cero ? 'ok-t' : 'err-t') + '">' + (v > 0 ? '+' : '') + UI.m(v, mon) + '</span> <span class="mini">' + (cero ? 'cuadra' : v < 0 ? 'faltante' : 'sobrante') + '</span>';
  },
  porCobrar(sede, mon) { return Store.d.ventas.filter(v => v.estado === 'Registrada' && v.sede === sede && v.mon === mon && Ventas.deuda(v) > 0.004); },

  render() {
    const sede = Store.sede(), cajas = M.CAJAS.filter(c => c.sede === sede.cod);
    if (!cajas.length) return UI.aviso('La tienda ' + UI.esc(sede.nom) + ' no tiene cajas configuradas', 'err');
    if (!cajas.find(c => c.mon === CM04.mon)) CM04.mon = cajas[0].mon;
    const caja = CM04.caja(), s = CM04.ses();
    const monsel = '<div class="monsel">' + cajas.map(c => '<span class="chip' + (c.mon === CM04.mon ? ' on' : '') + '" title="' + UI.esc(c.nom) + '" onclick="CM04.mon=\'' + c.mon + '\';App.refrescar()">' + c.mon + (Caja.abierta(sede.cod, c.mon) ? ' · abierta' : '') + '</span>').join('') + '</div>';
    let html = '<div class="screen-head"><h1>Caja · ' + UI.esc(sede.nom) + '</h1><span class="code">CL-18</span>' + monsel + '<div class="spacer"></div>';

    if (!s) {
      const ult = Caja.ultima(caja.cod), cxc = CM04.porCobrar(sede.cod, CM04.mon), pend = Caja.reembolsosPendientes(sede.cod, CM04.mon);
      html += (Store.puede('crear_caja') ? '<button class="btn btn-primary" onclick="CM04.abrir()">Abrir caja</button>' : '') + '</div>';
      html += UI.aviso('<b>' + UI.esc(caja.nom) + '</b> está cerrada. ' + (Store.puede('crear_caja') ? 'Ábrala con el efectivo inicial para cobrar, registrar ingresos y egresos o devolver dinero.' : 'Su perfil no abre caja: la abre el cajero de la tienda.') +
        (cxc.length || pend.length ? '<br>Esperando caja: ' + cxc.length + ' venta(s) con saldo por cobrar y ' + pend.length + ' devolución(es) de dinero.' : ''), 'info');
      if (ult && ult.cierre) {
        html += '<div class="card"><div class="sec">Último cierre · ' + ult.id + '<div class="spacer"></div><button class="btn btn-secondary btn-sm" onclick="CM05.ver(\'' + ult.id + '\')">Ver detalle</button></div><div class="formgrid c4">' +
          UI.dato('Apertura', ult.abre.f + '<br><span class="mini">' + UI.esc(ult.abre.u) + ' · inicial ' + UI.m(ult.inicial, ult.mon) + '</span>') +
          UI.dato('Cierre', ult.cierre.f + '<br><span class="mini">' + UI.esc(ult.cierre.u) + '</span>') +
          UI.dato('Efectivo esperado · contado', UI.m(ult.cierre.esperado, ult.mon) + ' · ' + UI.m(ult.cierre.contado, ult.mon)) +
          UI.dato('Diferencia', CM04.dif(ult.cierre.dif, ult.mon) + (ult.cierre.obs ? '<br><span class="mini">' + UI.esc(ult.cierre.obs) + '</span>' : '')) + '</div></div>';
      }
      return html;
    }

    const r = Caja.resumen(s), sup = Store.puede('configurar_comercial'), b = [];
    if (Store.puede('crear_venta') || Store.puede('crear_caja')) b.push('<button class="btn btn-secondary" onclick="CM04.cobrar()">Cobrar</button>');
    if (Store.puede('crear_caja')) b.push('<button class="btn btn-secondary" onclick="CM04.mov(\'Ingreso\')">+ Ingreso</button><button class="btn btn-secondary" onclick="CM04.mov(\'Egreso\')">+ Egreso</button>');
    b.push('<button class="btn btn-secondary" onclick="CM04.reporte()">Reporte del día</button>');
    if (Store.puede('editar_caja')) b.push('<button class="btn btn-primary" onclick="CM04.cerrar()">Cerrar caja</button>');
    html += b.join('') + '</div>';
    html += '<div class="doc-head"><div class="t">' + s.id + '<small>' + UI.esc(s.nom) + '</small></div>' + UI.estado('Abierta') +
      '<div class="meta">Abierta el ' + s.abre.f + ' por ' + UI.esc(s.abre.u) + ' · efectivo inicial ' + UI.m(s.inicial, s.mon) + (s.obs ? ' · ' + UI.esc(s.obs) : '') + '</div></div>';
    const pend = Caja.reembolsosPendientes(sede.cod, s.mon), cxc = CM04.porCobrar(sede.cod, s.mon);
    html += UI.kpis([
      { l: 'Cobros validados', v: UI.m(r.cobros, s.mon), s: Object.keys(r.met).filter(k => r.met[k].cobros).map(k => M.metodo(k).nom + ' ' + UI.n(r.met[k].cobros)).join(' · ') },
      { l: 'Pagos por validar', v: r.nPorValidar, s: r.nPorValidar ? UI.m(r.porValidar, s.mon) + ' · impiden cerrar' : 'nada pendiente', color: r.nPorValidar ? 'var(--pendiente)' : 'var(--confirmado)' },
      { l: 'Ingresos · egresos', v: UI.m(r.ingresos, s.mon) + ' · ' + UI.m(r.egresos, s.mon), color: 'var(--borrador)' },
      { l: 'Dinero devuelto a clientes', v: UI.m(r.devoluciones, s.mon), s: pend.length ? pend.length + ' pendiente(s)' : '', color: 'var(--rechazado-sol)' },
      { l: 'Efectivo en caja (sistema)', v: sup ? UI.m(r.esperado, s.mon) : '••••', s: sup ? 'inicial + efectivo validado + ingresos − egresos − devoluciones' : 'lo ve el supervisor: el cierre se cuenta a ciegas', color: 'var(--prp)' }
    ]);
    const tabs = [['cob', 'Cobros (' + Caja.cobros(s).length + ')'], ['cxc', 'Por cobrar (' + cxc.length + ')'], ['mov', 'Ingresos y egresos (' + Caja.movs(s).filter(m => m.tipo !== 'Devolución').length + ')'], ['dev', 'Devoluciones de dinero (' + pend.length + ' pendientes)']];
    html += '<div class="tabs">' + tabs.map(t => '<div class="tab' + (t[0] === CM04.tab ? ' active' : '') + '" onclick="CM04.tab=\'' + t[0] + '\';App.refrescar()">' + t[1] + '</div>').join('') + '</div>';
    html += CM04['t_' + CM04.tab](s, pend, cxc);
    return html;
  },

  t_cob(s) {
    const lista = Caja.cobros(s), pv = lista.filter(x => x.p.estado === 'Por validar');
    return (pv.length && Store.puede('valid_payments') ? '<div class="card" style="padding:10px 14px;display:flex;align-items:center;gap:10px"><span>' + pv.length + ' pago(s) por validar por <b>' + UI.m(pv.reduce((t, x) => t + x.p.monto, 0), s.mon) + '</b></span><span style="flex:1"></span><button class="btn btn-primary btn-sm" onclick="CM04.validarTodos()">Validar todos</button></div>' : '') +
      UI.tabla(['Pago', 'Fecha de creación', 'Venta', 'Cliente', 'Medio', 'Operación / voucher', ['Monto', 'num'], 'Estado', ['', '', '160px']], lista.map(x => {
        const p = x.p, v = x.v, m = M.metodo(p.met);
        return '<tr><td><b>' + p.id + '</b></td><td class="mini">' + p.fecha + '<br>' + UI.esc(p.usuario) + '</td>' +
          '<td><button class="btn-link" style="padding:0" onclick="App.go(\'cm02v\',{id:\'' + v.id + '\',tab:\'pag\'})">' + v.id + '</button><br><span class="mini">' + v.compNum + '</span></td>' +
          '<td>' + UI.esc(v.cliente.nom) + '</td><td>' + m.nom + (p.banco ? '<br><span class="mini">' + p.banco + '</span>' : '') + '</td>' +
          '<td class="mini">' + UI.esc(p.nop) + (p.voucher ? '<br>📎 ' + UI.esc(p.voucher) : '') + '</td><td class="num">' + UI.m(p.monto, s.mon) + '</td>' +
          '<td>' + UI.estado(p.estado) + (p.validado ? '<br><span class="mini">' + p.validado.f.slice(11) + ' · ' + UI.esc(p.validado.u) + '</span>' : '') + (p.motivo ? '<br><span class="mini">' + UI.esc(p.motivo) + '</span>' : '') + '</td>' +
          '<td>' + (p.estado === 'Por validar' && Store.puede('valid_payments') ? '<button class="btn btn-primary btn-sm" onclick="CM04.validar(\'' + v.id + '\',\'' + p.id + '\')">Validar</button> <button class="btn-link" onclick="CM04.rechazar(\'' + v.id + '\',\'' + p.id + '\')">Rechazar</button>' : '') + '</td></tr>';
      }), { vacio: 'Aún no hay cobros en esta caja' }) +
      '<p class="hint">Un cobro Por validar no cuenta en el arqueo ni saca stock: cuando los pagos validados de una venta cubren su total se registra la Salida de almacén y se libera lo comprometido. Se valida al comprobar el efectivo, el voucher del POS o el abono de la transferencia, y se rechaza si no llegó. Validar uno a uno evita que un pago erróneo frene a los demás.</p>';
  },
  t_cxc(s, pend, cxc) {
    return UI.tabla(['Venta', 'Fecha de creación', 'Cliente', 'Condición', ['Total', 'num'], ['Pagado', 'num'], ['Saldo', 'num'], ['', '', '90px']], cxc.map(v => {
      const vto = Ventas.vencimiento(v);
      return '<tr><td><button class="btn-link" style="padding:0" onclick="App.go(\'cm02v\',{id:\'' + v.id + '\'})">' + v.id + '</button><br><span class="mini">' + v.compNum + '</span></td><td class="mini">' + v.fecha + '</td>' +
        '<td>' + UI.esc(v.cliente.nom) + '</td><td class="mini">' + M.cond(v.cond).nom + (vto ? '<br><span class="' + (Ventas.vencida(v) ? 'err-t' : '') + '">vence ' + vto + '</span>' : '') + '</td>' +
        '<td class="num">' + UI.m(v.total, v.mon) + '</td><td class="num">' + UI.m(Ventas.pagado(v), v.mon) + '</td><td class="num"><b>' + UI.m(Ventas.deuda(v), v.mon) + '</b></td>' +
        '<td>' + (Store.puede('crear_venta') || Store.puede('crear_caja') ? '<button class="btn btn-primary btn-sm" onclick="CM04.cobrarVenta(\'' + v.id + '\')">Cobrar</button>' : '') + '</td></tr>';
    }), { vacio: 'No hay ventas con saldo en ' + s.mon + ' en esta tienda' });
  },
  t_mov(s) {
    const lista = Caja.movs(s).filter(m => m.tipo !== 'Devolución');
    return UI.tabla(['Movimiento', 'Fecha de creación', 'Tipo', 'Categoría', 'Descripción', ['Monto', 'num'], 'Estado', ['', '', '120px']], lista.map(m =>
      '<tr><td><b>' + m.id + '</b></td><td class="mini">' + m.fecha + '<br>' + UI.esc(m.usuario) + '</td><td>' + UI.badge(m.tipo, m.tipo === 'Ingreso' ? 'var(--confirmado)' : 'var(--parcial)') + '</td>' +
      '<td>' + UI.esc(m.cat) + '</td><td>' + UI.esc(m.desc) + (m.editado ? '<br><span class="mini">editado ' + m.editado.f + '</span>' : '') + (m.anulado ? '<br><span class="mini">' + UI.esc(m.anulado.motivo) + '</span>' : '') + '</td>' +
      '<td class="num"><span class="' + (m.tipo === 'Ingreso' ? 'ok-t' : 'err-t') + '">' + (m.tipo === 'Ingreso' ? '+' : '−') + UI.m(m.monto, s.mon) + '</span></td><td>' + UI.estado(m.estado) + '</td>' +
      '<td>' + (m.estado === 'Procesado' && Store.puede('editar_caja') ? '<button class="btn-link" onclick="CM04.mov(\'' + m.tipo + '\',\'' + m.id + '\')">Editar</button> <button class="btn-link" onclick="CM04.anularMov(\'' + m.id + '\')">Anular</button>' : '') + '</td></tr>'), { vacio: 'Sin ingresos ni egresos' }) +
      '<p class="hint">Ingresos y egresos de caja chica en efectivo, con categoría y descripción (mínimo 5 caracteres). No se borran: se anulan mientras la caja está abierta.</p>';
  },
  t_dev(s, pend) {
    const hechas = Caja.movs(s).filter(m => m.tipo === 'Devolución');
    return '<div class="sec">Pendientes de entregar al cliente (' + UI.esc(Store.sede(s.sede).nom) + ', ' + s.mon + ')</div>' +
      UI.tabla(['Venta', 'Origen', 'Cliente', 'Fecha de creación', ['Monto', 'num'], ['', '', '140px']], pend.map(x =>
        '<tr><td><button class="btn-link" style="padding:0" onclick="App.go(\'cm02v\',{id:\'' + x.v.id + '\',tab:\'pag\'})">' + x.v.id + '</button></td>' +
        '<td>' + (x.re.origen === 'Anulación' ? 'Anulación de la venta' : '<button class="btn-link" style="padding:0" onclick="App.go(\'cm03f\',{id:\'' + x.re.origen + '\'})">' + x.re.origen + '</button>') + '</td>' +
        '<td>' + UI.esc(x.v.cliente.nom) + '</td><td class="mini">' + x.re.fecha + '</td><td class="num"><b>' + UI.m(x.re.monto, s.mon) + '</b></td>' +
        '<td>' + (Store.puede('crear_caja') ? '<button class="btn btn-primary btn-sm" onclick="CM04.devolver(\'' + x.v.id + '\',\'' + x.re.id + '\')">Devolver dinero</button>' : '') + '</td></tr>'), { vacio: 'No hay devoluciones de dinero pendientes' }) +
      '<div class="sec">Entregadas en esta caja</div>' +
      UI.tabla(['Movimiento', 'Fecha de creación', 'Descripción', 'Medio', ['Monto', 'num'], 'Estado', ['', '', '80px']], hechas.map(m =>
        '<tr><td><b>' + m.id + '</b></td><td class="mini">' + m.fecha + '<br>' + UI.esc(m.usuario) + '</td><td>' + UI.esc(m.desc) + '</td><td>' + M.metodo(m.met).nom + (m.banco ? ' · ' + m.banco : '') + (m.nop ? '<br><span class="mini">' + UI.esc(m.nop) + '</span>' : '') + '</td>' +
        '<td class="num err-t">−' + UI.m(m.monto, s.mon) + '</td><td>' + UI.estado(m.estado) + '</td>' +
        '<td>' + (m.estado === 'Procesado' && Store.puede('editar_caja') ? '<button class="btn-link" onclick="CM04.anularMov(\'' + m.id + '\')">Anular</button>' : '') + '</td></tr>'), { vacio: 'Sin devoluciones de dinero en esta caja' }) +
      '<p class="hint">Se generan al anular una venta cobrada o al finalizar una devolución cuando el cliente ya había pagado. Es un movimiento propio (no un egreso de caja chica), así el reporte los distingue.</p>';
  },

  /* ---------- acciones ---------- */
  abrir() {
    const caja = CM04.caja();
    UI.modal({
      titulo: 'Abrir ' + UI.esc(caja.nom), code: 'CL-19',
      cuerpo: '<div class="formgrid">' + UI.dato('Tienda', UI.esc(Store.sede().nom)) + UI.dato('Moneda', caja.mon) +
        UI.campo('Efectivo inicial (' + caja.mon + ')', '<input id="ab-monto" type="number" min="0" step="any" value="0">', { req: true }) +
        UI.campo('Observación', '<input id="ab-obs">') + '</div><p class="hint" style="margin-top:10px">Solo puede haber una caja abierta por tienda y moneda. La caja es de la tienda: todo su personal cobra contra ella.</p>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="CM04.guardarAbrir()">Abrir caja</button>'
    });
  },
  guardarAbrir() { if (App.accion(() => Caja.abrir(CM04.caja().cod, UI.v('ab-monto'), UI.v('ab-obs')), x => x.id + ' abierta')) { UI.cerrar(); App.refrescar(); } },
  cobrar() {
    const s = CM04.ses();
    UI.modal({
      lg: true, titulo: 'Cobrar · ventas con saldo en ' + s.mon, code: 'CL-20',
      cuerpo: '<div class="filters" style="margin-bottom:8px">' + UI.campo('Cliente, documento o venta', '<input id="cb-q" oninput="CM04.pintarCobro()" placeholder="Buscar…" style="min-width:260px">') + '</div><div id="cb-body"></div>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cerrar</button>'
    });
    CM04.pintarCobro();
  },
  pintarCobro() {
    const s = CM04.ses(), q = UI.v('cb-q').toLowerCase();
    const lista = CM04.porCobrar(s.sede, s.mon).filter(v => !q || (v.id + ' ' + v.cliente.nom + ' ' + v.cliente.doc).toLowerCase().includes(q));
    document.getElementById('cb-body').innerHTML = UI.tabla(['Venta', 'Cliente', ['Total', 'num'], ['Saldo', 'num'], ['', '', '90px']], lista.map(v =>
      '<tr><td><b>' + v.id + '</b><br><span class="mini">' + v.fecha + '</span></td><td>' + UI.esc(v.cliente.nom) + '<br><span class="mini">' + UI.esc(v.cliente.doc) + '</span></td><td class="num">' + UI.m(v.total, v.mon) + '</td><td class="num"><b>' + UI.m(Ventas.deuda(v), v.mon) + '</b></td>' +
      '<td><button class="btn btn-primary btn-sm" onclick="CM04.cobrarVenta(\'' + v.id + '\')">Cobrar</button></td></tr>'), { vacio: 'Sin ventas con saldo' });
  },
  cobrarVenta(id) { PAGOUI.abrir(Store.venta(id), () => { CM04.tab = 'cob'; App.refrescar(); }); },
  validar(vid, pid) { if (App.accion(() => Ventas.validarPago(Store.venta(vid), pid), () => CM02V.msgValidado(Store.venta(vid), pid))) App.refrescar(); },
  rechazar(vid, pid) {
    UI.motivo('Rechazar pago ' + pid, '<p>El pago queda Anulado y el saldo de la venta vuelve a estar pendiente. No mueve stock: la venta sigue con su stock comprometido.</p>', null,
      mot => { if (App.accion(() => Ventas.rechazarPago(Store.venta(vid), pid, mot), 'Pago rechazado')) { UI.cerrar(); App.refrescar(); } }, 'Rechazar', 'CL-11');
  },
  validarTodos() {
    const pv = Caja.porValidar(CM04.ses());
    UI.confirmar('Validar ' + pv.length + ' pago(s)', '<p>Confirme que comprobó el efectivo, los vouchers y los abonos de los pagos siguientes. Las ventas cuyo pago quede completo registran su Salida de stock:</p><ul class="errlist">' + pv.map(x => '<li>' + x.p.id + ' · ' + UI.esc(x.v.cliente.nom) + ' · ' + M.metodo(x.p.met).nom + ' ' + UI.m(x.p.monto, x.v.mon) + '</li>').join('') + '</ul>', () => {
      App.accion(() => pv.forEach(x => Ventas.validarPago(x.v, x.p.id)), () => { const n = new Set(pv.filter(x => x.v.salida && x.v.salida.pago === x.p.id).map(x => x.v.id)).size; return pv.length + ' pago(s) validados' + (n ? ' · ' + n + ' venta(s) con pago completo: salió su stock' : ''); });
      App.refrescar();
    }, 'Validar todos', 'CL-21');
  },
  mov(tipo, id) {
    const m = id ? Store.d.cmovs.find(x => x.id === id) : null, cats = tipo === 'Ingreso' ? Store.d.cfg.catIngreso : Store.d.cfg.catEgreso, s = CM04.ses();
    UI.modal({
      titulo: (m ? 'Editar ' + m.id : 'Nuevo ' + tipo.toLowerCase()) + ' · ' + s.id, code: 'CL-22',
      cuerpo: '<div class="formgrid">' + UI.campo('Categoría', '<select id="mv-cat">' + UI.opts(cats, m ? m.cat : '', 'Seleccionar…') + '</select>', { req: true }) +
        UI.campo('Monto (' + s.mon + ')', '<input id="mv-monto" type="number" min="0" step="any" value="' + (m ? m.monto : '') + '">', { req: true }) +
        UI.campo('Descripción', '<input id="mv-desc" value="' + (m ? UI.esc(m.desc) : '') + '" placeholder="Mínimo 5 caracteres">', { req: true, full: true }) +
        UI.dato('Fecha de creación', m ? m.fecha : UI.ahora()) + UI.dato('Medio', 'Efectivo de caja') + '</div>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="CM04.guardarMov(\'' + tipo + '\',\'' + (id || '') + '\')">Guardar</button>'
    });
  },
  guardarMov(tipo, id) {
    const x = { tipo, cat: UI.v('mv-cat'), desc: UI.v('mv-desc'), monto: UI.v('mv-monto') };
    const r = id ? App.accion(() => Caja.editarMov(id, x), 'Movimiento actualizado') : App.accion(() => Caja.movimiento(CM04.ses(), x), mv => tipo + ' ' + mv.id + ' registrado');
    if (r) { UI.cerrar(); CM04.tab = 'mov'; App.refrescar(); }
  },
  anularMov(id) {
    const m = Store.d.cmovs.find(x => x.id === id);
    UI.motivo('Anular ' + id, '<p>' + UI.esc(m.tipo + ' · ' + m.desc) + ' · ' + UI.m(m.monto, CM04.mon) + '.' + (m.tipo === 'Devolución' ? ' La devolución de dinero vuelve a quedar pendiente.' : '') + '</p>', null,
      mot => { if (App.accion(() => Caja.anularMov(id, mot), id + ' anulado')) { UI.cerrar(); App.refrescar(); } }, 'Anular', 'CL-23');
  },
  devolver(vid, reid) {
    const v = Store.venta(vid), re = v.reembolsos.find(x => x.id === reid), s = CM04.ses();
    const mets = M.METODOS.filter(m => m.monedas.indexOf(s.mon) >= 0 && m.cod !== 'POS');
    UI.modal({
      titulo: 'Devolver dinero · ' + v.id, code: 'CL-24',
      cuerpo: '<div class="formgrid">' + UI.dato('Cliente', UI.esc(v.cliente.nom)) + UI.dato('Monto a devolver', '<b>' + UI.m(re.monto, v.mon) + '</b>') +
        UI.dato('Origen', re.origen === 'Anulación' ? 'Anulación de la venta' : re.origen) + UI.dato('Sale de la caja', s.id) +
        UI.campo('Cómo se devuelve', '<select id="dv-met" onchange="PAGOUI.bancos(\'dv-met\',\'dv-banco\')">' + UI.opts(mets.map(m => ({ v: m.cod, t: m.nom })), 'EFE') + '</select>', { req: true }) +
        UI.campo('Banco', '<select id="dv-banco"></select>') + UI.campo('N° de operación', '<input id="dv-nop">', { hint: 'Obligatorio si no es efectivo', full: true }) + '</div>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="CM04.guardarDevolver(\'' + vid + '\',\'' + reid + '\')">Registrar devolución</button>'
    });
    PAGOUI.bancos('dv-met', 'dv-banco');
  },
  guardarDevolver(vid, reid) {
    if (App.accion(() => Caja.procesarReembolso(CM04.ses(), vid, reid, { met: UI.v('dv-met'), banco: UI.v('dv-banco'), nop: UI.v('dv-nop') }), mv => 'Dinero devuelto · ' + mv.id)) { UI.cerrar(); CM04.tab = 'dev'; App.refrescar(); }
  },
  htmlResumen(s, r, sup) {
    const filas = Object.keys(r.met).map(k => '<tr><td>' + M.metodo(k).nom + '</td><td class="num">' + UI.n(r.met[k].cobros) + '</td><td class="num">' + UI.n(r.met[k].devol) + '</td><td class="num"><b>' + UI.n(r.met[k].cobros - r.met[k].devol) + '</b></td></tr>');
    return UI.tabla(['Medio de pago', ['Cobros validados', 'num'], ['Devoluciones', 'num'], ['Neto', 'num']], filas, { vacio: 'Sin cobros validados' }) +
      '<table class="grid totales" style="margin-left:auto"><tr><td>Efectivo inicial</td><td class="num">' + UI.m(s.inicial, s.mon) + '</td></tr><tr><td>Ingresos de caja</td><td class="num">' + UI.m(r.ingresos, s.mon) + '</td></tr>' +
      '<tr><td>Egresos de caja</td><td class="num">' + UI.m(r.egresos, s.mon) + '</td></tr>' + (sup ? '<tr><td>Efectivo esperado</td><td class="num"><b>' + UI.m(r.esperado, s.mon) + '</b></td></tr>' : '') +
      '<tr><td>Pagos por validar</td><td class="num">' + r.nPorValidar + ' · ' + UI.m(r.porValidar, s.mon) + '</td></tr></table>';
  },
  reporte() {
    const s = CM04.ses(), r = Caja.resumen(s), sup = Store.puede('configurar_comercial');
    UI.modal({
      lg: true, titulo: 'Reporte del día · ' + s.id, code: 'CL-25',
      cuerpo: '<p class="hint" style="margin-bottom:8px">' + UI.esc(s.nom) + ' · abierta el ' + s.abre.f + ' por ' + UI.esc(s.abre.u) + '</p>' + CM04.htmlResumen(s, r, sup),
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cerrar</button><button class="btn btn-primary" onclick="CM05.imprimir(\'' + s.id + '\')">⎙ PDF</button>'
    });
  },
  cerrar() {
    const s = CM04.ses(), r = Caja.resumen(s);
    if (r.nPorValidar) { UI.toast('Hay ' + r.nPorValidar + ' pago(s) por validar: valídelos o recházelos antes de cerrar'); CM04.tab = 'cob'; App.refrescar(); return; }
    UI.modal({
      titulo: 'Cerrar ' + s.id + ' · conteo de efectivo', code: 'CL-26',
      cuerpo: '<p>Cuente el efectivo del cajón y escriba el total. El sistema calcula la diferencia <b>después</b> de confirmar (conteo ciego).</p><div class="formgrid" style="margin-top:10px">' +
        UI.campo('Efectivo contado (' + s.mon + ')', '<input id="ci-cont" type="number" min="0" step="any">', { req: true }) + UI.campo('Observación', '<input id="ci-obs">') + '</div>' +
        '<p class="hint" style="margin-top:10px">Los cobros con tarjeta, Yape o transferencia no se cuentan: ya están validados contra su voucher o abono. Una caja cerrada no se reabre.</p>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="CM04.guardarCerrar()">Cerrar caja</button>'
    });
  },
  guardarCerrar() {
    const s = CM04.ses(), r = App.accion(() => Caja.cerrar(s, UI.v('ci-cont'), UI.v('ci-obs')), x => x.id + ' cerrada');
    if (!r) return;
    UI.modal({
      titulo: r.id + ' cerrada', code: 'CL-27',
      cuerpo: '<div class="formgrid">' + UI.dato('Efectivo esperado', UI.m(r.cierre.esperado, r.mon)) + UI.dato('Efectivo contado', UI.m(r.cierre.contado, r.mon)) + UI.dato('Diferencia', CM04.dif(r.cierre.dif, r.mon), { full: true }) + '</div>' + CM04.htmlResumen(r, r.cierre.resumen, true),
      pie: '<button class="btn btn-secondary" onclick="CM05.imprimir(\'' + r.id + '\')">⎙ PDF</button><button class="btn btn-primary" onclick="UI.cerrar();App.refrescar()">Aceptar</button>'
    });
    App.refrescar();
  }
};
App.pantalla('cm04', { titulo: 'Caja de la tienda', permiso: 'ver_caja', render: CM04.render });

/* ---------- historial de cajas ---------- */
const CM05 = {
  f: { sede: '', mon: '', est: '', desde: '', hasta: '' },
  lista() {
    const f = CM05.f;
    return Store.d.sesiones.filter(s => (!f.sede || s.sede === f.sede) && (!f.mon || s.mon === f.mon) && (!f.est || s.estado === f.est) && UI.enRango(s.abre.f, f.desde, f.hasta));
  },
  render() {
    const f = CM05.f, sup = Store.puede('configurar_comercial');
    const filas = CM05.lista().map(s => {
      const r = s.cierre ? s.cierre.resumen : Caja.resumen(s);
      return '<tr class="clickable" onclick="CM05.ver(\'' + s.id + '\')"><td><b>' + s.id + '</b><br><span class="mini">' + UI.esc(s.nom) + '</span></td>' +
        '<td class="mini">' + s.abre.f + '<br>' + UI.esc(s.abre.u) + '</td><td class="num">' + UI.m(s.inicial, s.mon) + '</td>' +
        '<td class="mini">' + (s.cierre ? s.cierre.f + '<br>' + UI.esc(s.cierre.u) : '—') + '</td><td class="num">' + UI.m(r.cobros, s.mon) + '</td>' +
        '<td class="num">' + (s.cierre || sup ? UI.m(s.cierre ? s.cierre.esperado : r.esperado, s.mon) : '••••') + '</td><td class="num">' + (s.cierre ? UI.m(s.cierre.contado, s.mon) : '—') + '</td>' +
        '<td class="num">' + (s.cierre ? CM04.dif(s.cierre.dif, s.mon) : '—') + '</td><td>' + UI.estado(s.estado) + '</td></tr>';
    });
    return '<div class="screen-head"><h1>Historial de cajas</h1><span class="code">CL-28</span><div class="spacer"></div><button class="btn btn-secondary" onclick="CM05.excel()">⇩ Excel</button></div>' +
      '<div class="card"><div class="filters">' +
      UI.campo('Tienda', '<select onchange="CM05.f.sede=this.value;App.refrescar()">' + UI.opts(M.SEDES.map(s => ({ v: s.cod, t: s.nom })), f.sede, 'Todas') + '</select>') +
      UI.campo('Moneda', '<select onchange="CM05.f.mon=this.value;App.refrescar()">' + UI.opts(M.MONEDAS.map(m => m.cod), f.mon, 'Todas') + '</select>') +
      UI.campo('Estado', '<select onchange="CM05.f.est=this.value;App.refrescar()">' + UI.opts(['Abierta', 'Cerrada'], f.est, 'Todos') + '</select>') +
      UI.campo('Desde', '<input type="date" value="' + f.desde + '" onchange="CM05.f.desde=this.value;App.refrescar()">') +
      UI.campo('Hasta', '<input type="date" value="' + f.hasta + '" onchange="CM05.f.hasta=this.value;App.refrescar()">') + '</div></div>' +
      UI.tabla(['Caja', 'Apertura', ['Inicial', 'num'], 'Cierre', ['Cobros validados', 'num'], ['Efectivo esperado', 'num'], ['Contado', 'num'], ['Diferencia', 'num'], 'Estado'], filas, { vacio: 'Sin cajas' }) +
      '<p class="hint">Una caja cerrada es histórico: no se reabre ni se borra. Su resumen se guarda al cerrar, así no cambia aunque luego se editen catálogos o medios de pago.</p>';
  },
  ver(id) {
    const s = Store.sesion(id), r = s.cierre ? s.cierre.resumen : Caja.resumen(s), sup = Store.puede('configurar_comercial');
    const cobros = Caja.cobros(s), movs = Caja.movs(s);
    UI.modal({
      ancho: '900px', titulo: s.id + ' · ' + UI.esc(s.nom), code: 'CL-29',
      cuerpo: '<div class="formgrid c4">' + UI.dato('Estado', UI.estado(s.estado)) + UI.dato('Apertura', s.abre.f + '<br><span class="mini">' + UI.esc(s.abre.u) + '</span>') +
        UI.dato('Cierre', s.cierre ? s.cierre.f + '<br><span class="mini">' + UI.esc(s.cierre.u) + '</span>' : '') + UI.dato('Diferencia', s.cierre ? CM04.dif(s.cierre.dif, s.mon) : '') + '</div>' +
        '<div class="sec">Resumen</div>' + CM04.htmlResumen(s, r, sup || !!s.cierre) +
        '<div class="sec">Cobros</div>' + UI.tabla(['Pago', 'Venta', 'Cliente', 'Medio', ['Monto', 'num'], 'Estado'], cobros.map(x => '<tr><td>' + x.p.id + '</td><td>' + x.v.id + '</td><td>' + UI.esc(x.v.cliente.nom) + '</td><td>' + M.metodo(x.p.met).nom + '</td><td class="num">' + UI.m(x.p.monto, s.mon) + '</td><td>' + UI.estado(x.p.estado) + '</td></tr>'), { vacio: 'Sin cobros' }) +
        '<div class="sec">Movimientos de caja</div>' + UI.tabla(['Movimiento', 'Tipo', 'Descripción', ['Monto', 'num'], 'Estado'], movs.map(m => '<tr><td>' + m.id + '</td><td>' + m.tipo + '</td><td>' + UI.esc(m.desc) + '</td><td class="num">' + UI.m(m.monto, s.mon) + '</td><td>' + UI.estado(m.estado) + '</td></tr>'), { vacio: 'Sin movimientos' }),
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cerrar</button><button class="btn btn-primary" onclick="CM05.imprimir(\'' + s.id + '\')">⎙ PDF</button>'
    });
  },
  imprimir(id) {
    const s = Store.sesion(id), r = s.cierre ? s.cierre.resumen : Caja.resumen(s);
    const html = '<div class="head"><div><h1>IMPERIOTEX S.A.C.</h1><div class="mini">' + UI.esc(s.nom) + '</div></div><div style="text-align:right"><h1>Resumen de caja ' + s.id + '</h1><div class="mini">' + s.estado + ' · abierta ' + s.abre.f + (s.cierre ? ' · cerrada ' + s.cierre.f : '') + '</div></div></div>' +
      '<h2>Por medio de pago</h2><table><thead><tr><th>Medio</th><th class="num">Cobros</th><th class="num">Devoluciones</th></tr></thead><tbody>' +
      Object.keys(r.met).map(k => '<tr><td>' + M.metodo(k).nom + '</td><td class="num">' + UI.n(r.met[k].cobros) + '</td><td class="num">' + UI.n(r.met[k].devol) + '</td></tr>').join('') + '</tbody></table>' +
      '<table style="width:320px;margin-left:auto"><tr><td>Efectivo inicial</td><td class="num">' + UI.m(s.inicial, s.mon) + '</td></tr><tr><td>Ingresos</td><td class="num">' + UI.m(r.ingresos, s.mon) + '</td></tr><tr><td>Egresos</td><td class="num">' + UI.m(r.egresos, s.mon) + '</td></tr>' +
      '<tr class="tot"><td>Efectivo esperado</td><td class="num">' + UI.m(r.esperado, s.mon) + '</td></tr>' + (s.cierre ? '<tr><td>Contado</td><td class="num">' + UI.m(s.cierre.contado, s.mon) + '</td></tr><tr class="tot"><td>Diferencia</td><td class="num">' + UI.m(s.cierre.dif, s.mon) + '</td></tr>' : '') + '</table>' +
      '<h2>Movimientos de caja</h2><table><thead><tr><th>Movimiento</th><th>Fecha de creación</th><th>Tipo</th><th>Descripción</th><th class="num">Monto</th><th>Estado</th></tr></thead><tbody>' +
      Caja.movs(s).map(m => '<tr><td>' + m.id + '</td><td>' + m.fecha + '</td><td>' + m.tipo + '</td><td>' + UI.esc(m.desc) + '</td><td class="num">' + UI.n(m.monto) + '</td><td>' + m.estado + '</td></tr>').join('') + '</tbody></table>';
    UI.imprimir('Caja ' + s.id, html);
  },
  excel() {
    UI.csv('cajas', ['Caja', 'Nombre', 'Tienda', 'Moneda', 'Apertura', 'Abrió', 'Inicial', 'Cierre', 'Cerró', 'Cobros validados', 'Ingresos', 'Egresos', 'Devoluciones', 'Esperado', 'Contado', 'Diferencia', 'Estado'],
      CM05.lista().map(s => { const r = s.cierre ? s.cierre.resumen : Caja.resumen(s); return [s.id, s.nom, Store.sede(s.sede).nom, s.mon, s.abre.f, s.abre.u, s.inicial, s.cierre ? s.cierre.f : '', s.cierre ? s.cierre.u : '', r.cobros, r.ingresos, r.egresos, r.devoluciones, r.esperado, s.cierre ? s.cierre.contado : '', s.cierre ? s.cierre.dif : '', s.estado]; }));
  }
};
App.pantalla('cm05', { titulo: 'Historial de cajas', permiso: 'ver_caja', render: CM05.render });
