/* COMERCIAL V9 · CL-01 Cotizaciones (listado) · CL-02 ficha (nueva, edición línea por línea, clonar, anular, convertir) · modales CL-03, CL-04 */
const CM01 = {
  f: { q: '', est: '', sede: '', desde: '', hasta: '' },
  lista() {
    Cot.barrer();
    const f = CM01.f, q = f.q.trim().toLowerCase();
    return Store.d.cots.filter(c => (!f.est || c.estado === f.est) && (!f.sede || c.sede === f.sede) && UI.enRango(c.fecha, f.desde, f.hasta) &&
      (!q || (c.id + ' ' + c.cliente.nom + ' ' + c.cliente.doc).toLowerCase().includes(q)));
  },
  montos(lista) {
    return M.MONEDAS.map(m => { const t = lista.filter(c => c.mon === m.cod).reduce((a, c) => a + c.total, 0); return t ? UI.m(t, m.cod) : ''; }).filter(Boolean).join(' · ');
  },
  render() {
    Cot.barrer();
    const cs = Store.d.cots, vig = cs.filter(c => c.estado === 'Vigente'), f = CM01.f;
    const conv = cs.filter(c => c.estado === 'Convertida'), cerradas = cs.filter(c => ['Convertida', 'Vencida', 'Anulada'].indexOf(c.estado) >= 0);
    return '<div class="screen-head"><h1>Cotizaciones</h1><span class="code">CL-01</span><div class="spacer"></div>' +
      '<button class="btn btn-secondary" onclick="CM01.excel(false)">⇩ Excel general</button><button class="btn btn-secondary" onclick="CM01.excel(true)">⇩ Excel detalle</button>' +
      (Store.puede('crear_cotizacion') ? '<button class="btn btn-primary" onclick="App.go(\'cm01f\',{nuevo:Date.now()})">+ Nueva cotización</button>' : '') + '</div>' +
      UI.kpis([
        { l: 'Vigentes', v: vig.length, s: CM01.montos(vig) },
        { l: 'Por vencer (2 días)', v: vig.filter(Cot.porVencer).length, color: 'var(--pendiente)' },
        { l: 'Convertidas en venta', v: conv.length, s: cerradas.length ? Math.round(conv.length / cerradas.length * 100) + '% de las cerradas' : '', color: 'var(--aprobada)' },
        { l: 'Vencidas · anuladas', v: cs.filter(c => c.estado === 'Vencida').length + ' · ' + cs.filter(c => c.estado === 'Anulada').length, color: 'var(--borrador)' }
      ]) +
      '<div class="card"><div class="filters">' +
      UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" placeholder="N°, cliente o documento" oninput="CM01.f.q=this.value;CM01.pintar()" style="min-width:230px">') +
      UI.campo('Estado', '<select onchange="CM01.f.est=this.value;CM01.pintar()">' + UI.opts(['Vigente', 'Convertida', 'Vencida', 'Anulada'], f.est, 'Todos') + '</select>') +
      UI.campo('Tienda', '<select onchange="CM01.f.sede=this.value;CM01.pintar()">' + UI.opts(M.SEDES.map(s => ({ v: s.cod, t: s.nom })), f.sede, 'Todas') + '</select>') +
      UI.campo('Desde', '<input type="date" value="' + f.desde + '" onchange="CM01.f.desde=this.value;CM01.pintar()">') +
      UI.campo('Hasta', '<input type="date" value="' + f.hasta + '" onchange="CM01.f.hasta=this.value;CM01.pintar()">') +
      '</div></div><div id="cm01-body"></div>' +
      '<p class="hint">La cotización no reserva ni mueve stock (la venta es la que lo compromete). Se edita línea por línea mientras está Vigente, vence sola al pasar su fecha de validez y, al convertirse en venta, queda Convertida con el número de la venta (no se convierte dos veces).</p>';
  },
  pintar() {
    const filas = CM01.lista().map(c => {
      const dias = UI.dias(UI.hoy(), c.validez);
      return '<tr class="clickable" onclick="App.go(\'cm01f\',{id:\'' + c.id + '\'})"><td><b>' + c.id + '</b></td><td class="mini">' + c.fecha + '</td>' +
        '<td>' + c.validez + (c.estado === 'Vigente' ? '<br><span class="' + (dias <= 2 ? 'warn-t' : 'mini') + '">' + (dias === 0 ? 'vence hoy' : 'vence en ' + dias + ' día(s)') + '</span>' : '') + '</td>' +
        '<td class="mini">' + UI.esc(c.sedeNom) + '</td><td>' + UI.esc(c.cliente.nom) + '<br><span class="mini">' + UI.esc(c.cliente.doc) + ' · ' + c.cliente.tipo + '</span></td>' +
        '<td class="mini">' + UI.esc(DOCUI.vendedor(c.asesor)) + '</td><td class="num">' + UI.m(c.total, c.mon) + '</td><td>' + UI.estado(c.estado) + '</td>' +
        '<td>' + (c.venta ? '<button class="btn-link" onclick="event.stopPropagation();App.go(\'cm02v\',{id:\'' + c.venta + '\'})">' + c.venta + '</button>' : '') + '</td>' +
        '<td onclick="event.stopPropagation()">' + (c.estado === 'Vigente' && Store.puede('crear_venta') ? '<button class="btn btn-primary btn-sm" onclick="App.go(\'cm02f\',{cot:\'' + c.id + '\',nuevo:Date.now()})">Convertir</button>' : '') + '</td></tr>';
    });
    document.getElementById('cm01-body').innerHTML = UI.tabla(['N°', 'Fecha de creación', 'Válida hasta', 'Tienda', 'Cliente', 'Vendedor', ['Total', 'num'], 'Estado', 'Venta', ['', '', '90px']], filas, { vacio: 'No hay cotizaciones con esos filtros' });
  },
  excel(detalle) {
    const l = CM01.lista();
    if (!detalle) {
      UI.csv('cotizaciones-generales', ['N°', 'Fecha de creación', 'Válida hasta', 'Tienda', 'Cliente', 'Documento', 'Tipo de cliente', 'Vendedor', 'Condición', 'Moneda', 'Op. gravada', 'Op. exonerada', 'IGV', 'Total', 'Estado', 'Venta'],
        l.map(c => [c.id, c.fecha, c.validez, c.sedeNom, c.cliente.nom, c.cliente.doc, c.cliente.tipo, DOCUI.vendedor(c.asesor), M.cond(c.cond).nom, c.mon, c.gravada, c.exonerada, c.igv, c.total, c.estado, c.venta || '']));
      return;
    }
    const filas = [];
    l.forEach(c => c.lineas.forEach((x, i) => filas.push([c.id, c.fecha, c.cliente.nom, i + 1, x.art, x.nom, x.desc, x.um, x.cant, x.precio, x.dcto, x.obsequio ? 'Sí' : '', x.total, c.mon, c.estado])));
    UI.csv('cotizaciones-detalle', ['N°', 'Fecha de creación', 'Cliente', 'Línea', 'Código', 'Artículo', 'Descripción', 'UM', 'Cantidad', 'Precio', 'Dcto. unit.', 'Obsequio', 'Total', 'Moneda', 'Estado'], filas);
  }
};
App.pantalla('cm01', { titulo: 'Cotizaciones', permiso: 'ver_cotizacion', render: CM01.render, despues: CM01.pintar });

/* ---------- ficha de cotización ---------- */
const CM01F = {
  d: null, clave: null,
  nueva() { return !App.params.id; },
  doc() { return CM01F.nueva() ? CM01F.d : Store.cot(App.params.id); },
  editable() { return CM01F.nueva() ? Store.puede('crear_cotizacion') : Cot.editable(CM01F.doc()); },

  render(p) {
    if (!p.id && (!CM01F.d || p.nuevo !== CM01F.clave)) {
      CM01F.clave = p.nuevo;
      CM01F.d = Cot.borrador();
      if (p.cli) { try { Doc.cambiarCliente(CM01F.d, p.cli); CM01F.d.cond = Store.cli(p.cli).cond || 'CONTADO'; } catch (e) { UI.toast(e.message); } }
    }
    const c = CM01F.doc();
    if (!c) return UI.aviso('No existe la cotización ' + UI.esc(p.id), 'err');
    if (!p.id && !Store.puede('crear_cotizacion')) return UI.aviso('Su perfil no crea cotizaciones', 'err');
    const nueva = CM01F.nueva(), ed = CM01F.editable(), b = [];
    if (nueva) b.push('<button class="btn btn-secondary" onclick="CM01F.d=null;App.go(\'cm01\')">Cancelar</button>', '<button class="btn btn-primary" onclick="CM01F.guardar()">Guardar cotización</button>');
    else {
      if (c.estado === 'Vigente' && Store.puede('crear_venta')) b.push('<button class="btn btn-primary" onclick="App.go(\'cm02f\',{cot:\'' + c.id + '\',nuevo:Date.now()})">Convertir en venta</button>');
      if (Store.puede('crear_cotizacion')) b.push('<button class="btn btn-secondary" onclick="CM01F.clonar()">Clonar</button>');
      b.push('<button class="btn btn-secondary" onclick="DOCUI.imprimir(\'Cotización\',CM01F.doc())">⎙ PDF</button>');
      if (['Vigente', 'Vencida'].indexOf(c.estado) >= 0 && Store.puede('eliminar_cotizacion')) b.push('<button class="btn btn-danger" onclick="CM01F.anular()">Anular</button>');
      b.push('<button class="btn btn-secondary" onclick="App.go(\'cm01\')">Volver</button>');
    }
    const sel = (campo, lista, val) => '<select onchange="CM01F.cab(\'' + campo + '\',this.value)">' + UI.opts(lista, val) + '</select>';
    const rev = ed ? Cot.revisar(c) : { e: [], w: [] };
    return '<div class="screen-head"><h1>' + (nueva ? 'Nueva cotización' : c.id) + '</h1>' + (nueva ? '' : UI.estado(c.estado)) +
      (c.venta ? ' <span class="mini">convertida en</span> <button class="btn-link" onclick="App.go(\'cm02v\',{id:\'' + c.venta + '\'})">' + c.venta + '</button>' : '') +
      '<span class="code">CL-02</span><div class="spacer"></div>' + b.join('') + '</div>' +
      (!nueva && c.estado === 'Vigente' && !ed ? UI.aviso('Solo lectura: su perfil no edita cotizaciones.', 'info') : '') +
      '<div class="card"><div class="formgrid c4">' +
      UI.dato('Tienda', UI.esc(Store.sede(c.sede).nom)) +
      UI.dato('Fecha de creación', nueva ? UI.hoy() : c.fecha + '<br><span class="mini">' + UI.esc(c.usuario) + '</span>') +
      (ed ? UI.campo('Válida hasta', '<input type="date" value="' + UI.dIso(c.validez) + '" min="' + UI.dIso(UI.hoy()) + '" onchange="CM01F.cab(\'validez\',UI.dTxt(this.value))">', { req: true, hint: 'Por defecto ' + Store.d.cfg.diasValidez + ' días (CL-45)' }) : UI.dato('Válida hasta', c.validez)) +
      (ed ? UI.campo('Moneda', sel('mon', M.MONEDAS.map(m => ({ v: m.cod, t: m.cod + ' · ' + m.nom })), c.mon), { req: true }) : UI.dato('Moneda', c.mon)) +
      (ed ? UI.campo('Condición de pago', sel('cond', M.CONDICIONES.map(x => ({ v: x.cod, t: x.nom })), c.cond), { req: true }) : UI.dato('Condición de pago', M.cond(c.cond).nom)) +
      (ed && Store.puede('asignar_vendedor') ? UI.campo('Vendedor', sel('asesor', DOCUI.vendedores(), c.asesor)) : UI.dato('Vendedor', UI.esc(DOCUI.vendedor(c.asesor)))) +
      (ed ? UI.campo('Observación', '<input value="' + UI.esc(c.obs) + '" onchange="CM01F.cab(\'obs\',this.value)">', { estilo: 'grid-column:span 2', hint: 'Obligatoria si hay obsequios' }) : UI.dato('Observación', UI.esc(c.obs), { estilo: 'grid-column:span 2' })) +
      '</div></div>' +
      DOCUI.cardCliente('CM01F', c, ed) +
      '<div class="card"><div class="sec">Detalle' + (ed ? '<div class="spacer"></div><button class="btn btn-secondary btn-sm" onclick="BUS.articulo(CM01F.doc(), cod => CM01F.agregar(cod))">+ Agregar artículos</button>' : '') + '</div>' +
      DOCUI.lineas('CM01F', c, { editable: ed, modo: 'cot' }) + DOCUI.totales(c) + '</div>' +
      (ed && rev.e.length ? UI.aviso('<b>' + (nueva ? 'Para guardar falta:' : 'Revise:') + '</b><ul class="errlist">' + rev.e.slice(0, 6).map(x => '<li>' + UI.esc(x) + '</li>').join('') + '</ul>', 'err') : '') +
      UI.aviso('La cotización <b>no reserva ni mueve stock</b>: la disponibilidad es solo referencia y se vuelve a revisar al convertirla en venta, que es la que compromete el stock. ' +
        (nueva ? 'Al guardar queda Vigente; desde entonces cada cambio de línea se guarda al instante.' : 'Cada cambio se guarda al instante; no se puede quitar la última línea.'), 'info') +
      (nueva ? '' : DOCUI.historial(c));
  },

  /* nueva: se trabaja sobre el borrador · existente: cada cambio va al servicio (línea por línea) */
  _run(fnNueva, fnExistente, msg) {
    if (CM01F.nueva()) App.accion(fnNueva); else App.accion(fnExistente, msg);
    App.refrescar();
  },
  agregar(cod) { CM01F._run(() => Doc.agregar(CM01F.d, cod), () => Cot.agregarLinea(CM01F.doc(), cod), 'Línea agregada y guardada'); },
  cambiar(i, campo, val) { CM01F._run(() => Doc.cambiar(CM01F.d, i, campo, val), () => Cot.cambiarLinea(CM01F.doc(), i, campo, val), 'Línea guardada'); },
  quitar(i) { CM01F._run(() => Doc.quitar(CM01F.d, i), () => Cot.quitarLinea(CM01F.doc(), i), 'Línea quitada'); },
  cliente(cod) {
    CM01F._run(() => { const c = Doc.cambiarCliente(CM01F.d, cod); CM01F.d.cond = c.cond || 'CONTADO'; },
      () => Cot.cambiarCabecera(CM01F.doc(), 'cli', cod), 'Cliente actualizado: precios recalculados');
  },
  cab(campo, val) {
    CM01F._run(() => { const d = CM01F.d; if (campo === 'mon') Doc.cambiarMoneda(d, val); else d[campo] = val; Precios.doc(d); },
      () => Cot.cambiarCabecera(CM01F.doc(), campo, val), campo === 'obs' ? 'Observación guardada' : 'Cotización actualizada');
  },
  guardar() {
    const d = CM01F.d;
    Precios.doc(d);
    const r = Cot.revisar(d);
    if (r.e.length) { UI.toast(r.e[0]); App.refrescar(); return; }
    const go = () => { const c = App.accion(() => Cot.crear(d), x => 'Cotización ' + x.id + ' creada (Vigente)'); if (c) { CM01F.d = null; App.go('cm01f', { id: c.id }); } };
    if (r.w.length) UI.confirmar('Guardar con avisos', '<p>La cotización no reserva stock; al convertirla en venta se vuelve a revisar contra el Disponible.</p><ul class="errlist">' + r.w.map(x => '<li>' + UI.esc(x) + '</li>').join('') + '</ul>', go, 'Guardar', 'CL-03');
    else go();
  },
  clonar() {
    const n = App.accion(() => Cot.clonar(CM01F.doc()), x => 'Copia creada: ' + x.id);
    if (n) App.go('cm01f', { id: n.id });
  },
  anular() {
    const c = CM01F.doc();
    UI.motivo('Anular ' + c.id, '<p>La cotización queda Anulada (no se borra) y ya no se puede convertir en venta.</p>', null,
      mot => { if (App.accion(() => Cot.anular(c, mot), c.id + ' anulada')) { UI.cerrar(); App.refrescar(); } }, 'Anular', 'CL-04');
  }
};
App.pantalla('cm01f', {
  titulo: 'Cotización', menu: 'cm01', permiso: 'ver_cotizacion', render: CM01F.render,
  miga: p => '<a class="btn-link" onclick="App.go(\'cm01\')">Cotizaciones</a> / <b>' + UI.esc(p.id || 'Nueva') + '</b>'
});
