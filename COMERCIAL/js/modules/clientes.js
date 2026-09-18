/* COMERCIAL V9 · CL-34 Clientes: listado con estado comercial derivado · CL-35 ficha · modales CL-36 (desactivar/reactivar) y CL-37 (alta rápida desde los documentos) */
const CM07 = {
  f: { q: '', tipo: '', est: '', act: 'activos' },
  lista() {
    const f = CM07.f, q = f.q.trim().toLowerCase();
    return Store.d.clientes.filter(c => (f.act === 'todos' || (f.act === 'activos') === c.activo) && (!f.tipo || c.tipo === f.tipo) && (!f.est || Cli.estadoComercial(c) === f.est) &&
      (!q || (c.cod + ' ' + c.doc + ' ' + c.nom + ' ' + c.tel + ' ' + c.email).toLowerCase().includes(q)));
  },
  render() {
    const act = Store.d.clientes.filter(c => c.activo), est = act.map(Cli.estadoComercial), cuenta = e => est.filter(x => x === e).length, f = CM07.f;
    return '<div class="screen-head"><h1>Clientes</h1><span class="code">CL-34</span><div class="spacer"></div><button class="btn btn-secondary" onclick="CM07.excel()">⇩ Excel</button>' +
      (Store.puede('crear_cliente') ? '<button class="btn btn-primary" onclick="App.go(\'cm07f\',{nuevo:Date.now()})">+ Nuevo cliente</button>' : '') + '</div>' +
      UI.kpis([
        { l: 'Clientes activos', v: act.length, s: cuenta('Sin compras') + ' sin compras' },
        { l: 'Nuevos', v: cuenta('Nuevo'), s: 'primera compra en los últimos 30 días', color: 'var(--prp)' },
        { l: 'Activos', v: cuenta('Activo'), s: 'compraron en los últimos 60 días', color: 'var(--confirmado)' },
        { l: 'Por recuperar', v: cuenta('Por recuperar'), s: 'sin compras hace más de 60 días', color: 'var(--parcial)' }
      ]) +
      '<div class="card"><div class="filters">' +
      UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" placeholder="Código, documento, nombre, teléfono" oninput="CM07.f.q=this.value;CM07.pintar()" style="min-width:250px">') +
      UI.campo('Tipo de cliente', '<select onchange="CM07.f.tipo=this.value;CM07.pintar()">' + UI.opts(M.TIPOS_CLIENTE, f.tipo, 'Todos') + '</select>') +
      UI.campo('Estado comercial', '<select onchange="CM07.f.est=this.value;CM07.pintar()">' + UI.opts(['Nuevo', 'Activo', 'Por recuperar', 'Sin compras'], f.est, 'Todos') + '</select>') +
      UI.campo('Mostrar', '<select onchange="CM07.f.act=this.value;CM07.pintar()">' + UI.opts([{ v: 'activos', t: 'Activos' }, { v: 'inactivos', t: 'Inactivos' }, { v: 'todos', t: 'Todos' }], f.act) + '</select>') +
      '</div></div><div id="cm07-body"></div>' +
      '<p class="hint">El cliente es un socio de negocio propio de Comercial (no se unifica con el proveedor, T6). No se borra: se desactiva. El estado comercial no es un campo: se calcula de sus ventas registradas.</p>';
  },
  pintar() {
    document.getElementById('cm07-body').innerHTML = UI.tabla(['Código', 'Documento', 'Nombre / razón social', 'Teléfono', 'Email', 'Dirección', 'Tipo', 'Estado comercial', ['Compras', 'num']], CM07.lista().map(c => {
      const vs = Store.d.ventas.filter(v => v.cli === c.cod && v.estado === 'Registrada');
      return '<tr class="clickable" onclick="App.go(\'cm07f\',{id:\'' + c.cod + '\'})"><td><b>' + c.cod + '</b></td><td>' + Cli.docTxt(c) + '</td><td>' + UI.esc(c.nom) + (c.activo ? '' : ' ' + UI.estado('Inactivo')) + '</td>' +
        '<td class="mini">' + UI.esc(c.tel) + '</td><td class="mini">' + UI.esc(c.email) + '</td><td class="mini">' + UI.esc(c.dir) + (c.ubigeo ? '<br>' + UI.esc(M.ubigeo(c.ubigeo)) : '') + '</td>' +
        '<td class="mini">' + c.tipo + '</td><td>' + UI.estado(Cli.estadoComercial(c)) + '</td><td class="num">' + vs.length + (vs.length ? '<br><span class="mini">' + CM02.sumaMon(vs, Ventas.neto) + '</span>' : '') + '</td></tr>';
    }), { vacio: 'Sin clientes con esos filtros' });
  },
  excel() {
    UI.csv('clientes', ['Código', 'Tipo doc.', 'Documento', 'Nombre', 'Tipo de cliente', 'Teléfono', 'Email', 'Dirección', 'Ubigeo', 'Condición', 'Estado comercial', 'Activo'],
      CM07.lista().map(c => [c.cod, c.tipoDoc, c.doc, c.nom, c.tipo, c.tel, c.email, c.dir, c.ubigeo, M.cond(c.cond).nom, Cli.estadoComercial(c), c.activo ? 'Sí' : 'No']));
  }
};
App.pantalla('cm07', { titulo: 'Clientes', permiso: 'ver_cliente', render: CM07.render, despues: CM07.pintar });

/* ---------- ficha del cliente ---------- */
const CM07F = {
  tab: 'datos', ultimo: null,
  form(c, ed, pref) {
    pref = pref || 'cf';
    const inp = (id, v, ph) => ed ? '<input id="' + pref + '-' + id + '" value="' + UI.esc(v) + '"' + (ph ? ' placeholder="' + ph + '"' : '') + '>' : '<div class="dato">' + (UI.esc(v) || '—') + '</div>';
    const sel = (id, lista, v) => ed ? '<select id="' + pref + '-' + id + '">' + UI.opts(lista, v) + '</select>' : '<div class="dato">' + UI.esc((lista.find(x => (x.v || x) === v) || {}).t || v || '—') + '</div>';
    return '<div class="formgrid c3">' +
      UI.campo('Tipo de documento', sel('tdoc', M.TIPOS_DOC.map(t => ({ v: t.cod, t: t.nom })), c.tipoDoc), { req: ed }) +
      UI.campo('N° de documento', inp('doc', c.doc, 'DNI 8 dígitos · RUC 11'), { req: ed, hint: ed ? 'Único por empresa' : '' }) +
      UI.campo('Tipo de cliente', sel('tipo', M.TIPOS_CLIENTE.map(t => ({ v: t, t })), c.tipo), { req: ed, hint: ed ? 'Es el segmento de cliente de las listas de precios y ofertas' : '' }) +
      UI.campo('Nombre o razón social', inp('nom', c.nom), { req: ed, estilo: 'grid-column:span 2' }) +
      UI.campo('Condición de pago habitual', sel('cond', M.CONDICIONES.map(x => ({ v: x.cod, t: x.nom })), c.cond)) +
      UI.campo('Teléfono', inp('tel', c.tel)) + UI.campo('Email', inp('email', c.email)) +
      UI.campo('Ubigeo', sel('ubi', [{ v: '', t: '—' }].concat(M.UBIGEOS.map(u => ({ v: u.cod, t: u.cod + ' · ' + u.t }))), c.ubigeo)) +
      UI.campo('Dirección', inp('dir', c.dir), { full: true }) + UI.campo('Observaciones', inp('obs', c.obs), { full: true }) + '</div>';
  },
  leer(pref) {
    pref = pref || 'cf';
    const g = id => UI.v(pref + '-' + id);
    return { tipoDoc: g('tdoc'), doc: g('doc'), nom: g('nom'), tipo: g('tipo'), tel: g('tel'), email: g('email'), dir: g('dir'), ubigeo: g('ubi'), cond: g('cond'), obs: g('obs') };
  },
  render(p) {
    const nuevo = !p.id;
    const c = nuevo ? { cod: '', tipoDoc: 'DNI', doc: '', nom: '', tipo: 'MINORISTA', tel: '', email: '', dir: '', ubigeo: '', cond: 'CONTADO', obs: '', activo: true } : Store.cli(p.id);
    if (!c) return UI.aviso('No existe el cliente ' + UI.esc(p.id), 'err');
    if (CM07F.ultimo !== (p.id || 'nuevo')) { CM07F.ultimo = p.id || 'nuevo'; CM07F.tab = 'datos'; }
    const ed = nuevo ? Store.puede('crear_cliente') : Store.puede('editar_cliente');
    const vs = nuevo ? [] : Store.d.ventas.filter(v => v.cli === c.cod), cs = nuevo ? [] : Store.d.cots.filter(x => x.cli === c.cod), ds = nuevo ? [] : Store.d.devs.filter(x => x.cliente.cod === c.cod);
    const b = [];
    if (ed && CM07F.tab === 'datos') b.push('<button class="btn btn-primary" onclick="CM07F.guardar()">' + (nuevo ? 'Crear cliente' : 'Guardar') + '</button>');
    if (!nuevo && c.activo && Store.puede('crear_venta')) b.push('<button class="btn btn-secondary" onclick="App.go(\'cm02f\',{cli:\'' + c.cod + '\',nuevo:Date.now()})">Nueva venta</button>');
    if (!nuevo && c.activo && Store.puede('crear_cotizacion')) b.push('<button class="btn btn-secondary" onclick="App.go(\'cm01f\',{cli:\'' + c.cod + '\',nuevo:Date.now()})">Nueva cotización</button>');
    if (!nuevo && Store.puede('editar_cliente')) b.push('<button class="btn btn-' + (c.activo ? 'danger' : 'secondary') + '" onclick="CM07F.activo(' + !c.activo + ')">' + (c.activo ? 'Desactivar' : 'Reactivar') + '</button>');
    b.push('<button class="btn btn-secondary" onclick="App.go(\'cm07\')">Volver</button>');
    let html = '<div class="screen-head"><h1>' + (nuevo ? 'Nuevo cliente' : UI.esc(c.nom)) + '</h1>' + (nuevo ? '' : UI.estado(Cli.estadoComercial(c)) + (c.activo ? '' : ' ' + UI.estado('Inactivo')) + ' <span class="mini">' + c.cod + '</span>') +
      '<span class="code">CL-35</span><div class="spacer"></div>' + b.join('') + '</div>';
    if (!nuevo) {
      const saf = Saldo.porMoneda(c.cod), safTxt = saf.map(x => UI.m(x.saldo, x.mon)).join(' · ');
      const tabs = [['datos', 'Datos'], ['ven', 'Ventas (' + vs.length + ')'], ['cot', 'Cotizaciones (' + cs.length + ')'], ['dev', 'Devoluciones (' + ds.length + ')'], ['saf', 'Crédito' + (safTxt ? ' (' + safTxt + ')' : '')]];
      html += UI.kpis([
        { l: 'Comprado (neto)', v: CM02.sumaMon(vs.filter(v => v.estado === 'Registrada'), Ventas.neto) },
        { l: 'Saldo por cobrar', v: CM02.sumaMon(vs, Ventas.deuda), color: 'var(--pendiente)' },
        { l: 'Crédito (notas de crédito)', v: safTxt || UI.s(0), s: 'sin usar · no vence', color: 'var(--prp)' },
        { l: 'Última compra', v: vs.filter(v => v.estado === 'Registrada').length ? vs.filter(v => v.estado === 'Registrada')[0].fecha.slice(0, 10) : '—', color: 'var(--borrador)' },
        { l: 'Cliente desde', v: (c.alta || '').slice(0, 10) || '—', color: 'var(--borrador)' }
      ]);
      html += '<div class="tabs">' + tabs.map(t => '<div class="tab' + (t[0] === CM07F.tab ? ' active' : '') + '" onclick="CM07F.tab=\'' + t[0] + '\';App.refrescar()">' + t[1] + '</div>').join('') + '</div>';
    }
    if (nuevo || CM07F.tab === 'datos') {
      html += '<div class="card">' + (nuevo ? '' : '<div class="formgrid c3" style="margin-bottom:12px">' + UI.dato('Código', '<b>' + c.cod + '</b>') + '</div>') + CM07F.form(c, ed) + '</div>' +
        '<p class="hint">Solo el documento, el nombre y el tipo son obligatorios. Estado comercial: <b>Nuevo</b> (primera compra en 30 días), <b>Activo</b> (compró en 60 días), <b>Por recuperar</b> (sin compras hace más de 60), <b>Sin compras</b>. «Inactivo» es la baja lógica del registro.</p>';
    } else if (CM07F.tab === 'ven') {
      html += UI.tabla(['Venta', 'Fecha de creación', 'Tienda', ['Total', 'num'], ['Saldo', 'num'], 'Pago', 'Estado'], vs.map(v => '<tr class="clickable" onclick="App.go(\'cm02v\',{id:\'' + v.id + '\'})"><td><b>' + v.id + '</b><br><span class="mini">' + v.compNum + '</span></td><td class="mini">' + v.fecha + '</td><td class="mini">' + UI.esc(v.sedeNom) + '</td><td class="num">' + UI.m(v.total, v.mon) + '</td><td class="num">' + UI.m(Ventas.deuda(v), v.mon) + '</td><td>' + UI.estado(Ventas.estadoPago(v)) + '</td><td>' + UI.estado(v.estado) + '</td></tr>'), { vacio: 'Sin ventas' });
    } else if (CM07F.tab === 'cot') {
      html += UI.tabla(['Cotización', 'Fecha de creación', 'Válida hasta', ['Total', 'num'], 'Estado'], cs.map(x => '<tr class="clickable" onclick="App.go(\'cm01f\',{id:\'' + x.id + '\'})"><td><b>' + x.id + '</b></td><td class="mini">' + x.fecha + '</td><td>' + x.validez + '</td><td class="num">' + UI.m(x.total, x.mon) + '</td><td>' + UI.estado(x.estado) + '</td></tr>'), { vacio: 'Sin cotizaciones' });
    } else if (CM07F.tab === 'dev') {
      html += UI.tabla(['N°', 'Fecha de creación', 'Nota de crédito', 'Venta', ['Total', 'num'], 'Dinero', 'Estado'], ds.map(x => '<tr class="clickable" onclick="App.go(\'cm03f\',{id:\'' + x.id + '\'})"><td><b>' + x.id + '</b></td><td class="mini">' + x.fecha + '</td><td class="mini">' + UI.esc(x.sustTipo + ' ' + x.sustNum) + '</td><td>' + x.venta + '</td><td class="num">' + UI.m(x.total, x.mon) + '</td><td class="mini">' + UI.esc(Dev.dineroTxt(x)) + '</td><td>' + UI.estado(x.estado) + '</td></tr>'), { vacio: 'Sin devoluciones' });
    } else {
      /* crédito por notas de crédito: de dónde vino (devolución, anulación) y en qué venta se usó o si se devolvió en caja; no se borra */
      const ms = Saldo.movs(c.cod), ir = o => !o ? '' : o.doc === 'Devolución' ? '<button class="btn-link" style="padding:0" onclick="App.go(\'cm03f\',{id:\'' + o.id + '\'})">' + o.id + '</button>'
        : (o.doc === 'Venta' || o.doc === 'Anulación') && Store.venta(o.id) ? '<button class="btn-link" style="padding:0" onclick="App.go(\'cm02v\',{id:\'' + o.id + '\'})">' + o.id + '</button>' : UI.esc(o.id || '');
      html += '<div class="chips" style="margin-bottom:8px">' + M.MONEDAS.map(m => '<span class="chip" style="font-size:13px;padding:5px 12px">Crédito ' + m.cod + ': <b>' + UI.m(Saldo.de(c.cod, m.cod), m.cod) + '</b></span>').join('') + '</div>' +
        UI.tabla(['Movimiento', 'Fecha de creación', 'Tipo', 'Origen', 'Detalle', ['Monto', 'num'], 'Usuario'], ms.map(m => '<tr><td><b>' + m.id + '</b></td><td class="mini">' + m.fecha + '</td><td>' + UI.badge(m.tipo, m.tipo === 'Abono' ? 'var(--confirmado)' : 'var(--parcial)') + '</td>' +
          '<td>' + (m.origen ? UI.esc(m.origen.doc) + ' ' + ir(m.origen) : '') + '</td><td class="mini">' + UI.esc(m.obs) + '</td><td class="num">' + (m.tipo === 'Abono' ? '+ ' : '− ') + UI.m(m.monto, m.mon) + '</td><td class="mini">' + UI.esc(m.usuario) + '</td></tr>'), { vacio: 'Sin crédito' }) +
        '<p class="hint">El crédito nace de las notas de crédito (devoluciones) y vuelve si se anula una venta pagada con él. Se usa como medio de pago «Nota de crédito» en cualquier venta de este cliente, en la misma moneda, o se le devuelve en caja desde la devolución. No vence.</p>';
    }
    return html;
  },
  guardar() {
    const id = App.params.id;
    if (id) { if (App.accion(() => Cli.actualizar(id, CM07F.leer()), 'Cliente actualizado')) App.refrescar(); return; }
    const c = App.accion(() => Cli.crear(CM07F.leer()), x => 'Cliente ' + x.cod + ' creado');
    if (c) App.go('cm07f', { id: c.cod });
  },
  activo(v) {
    const c = Store.cli(App.params.id);
    UI.confirmar((v ? 'Reactivar ' : 'Desactivar ') + c.cod, '<p>' + (v ? 'El cliente vuelve a aparecer en los buscadores.' : 'El cliente no se borra: deja de aparecer en los buscadores y no se le puede vender ni cotizar. Su historial se conserva.') + '</p>',
      () => { if (App.accion(() => Cli.cambiarActivo(c.cod, v), c.cod + (v ? ' reactivado' : ' desactivado'))) App.refrescar(); }, v ? 'Reactivar' : 'Desactivar', 'CL-36');
  }
};
App.pantalla('cm07f', {
  titulo: 'Cliente', menu: 'cm07', permiso: 'ver_cliente', render: CM07F.render,
  miga: p => '<a class="btn-link" onclick="App.go(\'cm07\')">Clientes</a> / <b>' + UI.esc(p.id || 'Nuevo') + '</b>'
});

/* ---------- alta rápida desde cotización, venta o buscador ---------- */
const CLIQ = {
  _cb: null,
  abrir(cb) {
    CLIQ._cb = cb;
    UI.modal({
      lg: true, titulo: 'Nuevo cliente', code: 'CL-37',
      cuerpo: CM07F.form({ tipoDoc: 'DNI', doc: '', nom: '', tipo: 'MINORISTA', tel: '', email: '', dir: '', ubigeo: '', cond: 'CONTADO', obs: '' }, true, 'cq') +
        '<p class="hint" style="margin-top:8px">El cliente queda creado y seleccionado en el documento.</p>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="CLIQ.guardar()">Crear y seleccionar</button>'
    });
  },
  guardar() {
    const c = App.accion(() => Cli.crear(CM07F.leer('cq')), x => 'Cliente ' + x.cod + ' creado');
    if (c) { UI.cerrar(); if (CLIQ._cb) CLIQ._cb(c.cod); else App.refrescar(); }
  }
};
