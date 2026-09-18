/* COMERCIAL V9 · CL-34 Clientes (listado) · CL-35 ficha (nuevo / ver / editar) · modales CL-36 (desactivar/reactivar) y CL-37 (alta rápida desde los documentos).
   2026-09-18: mismo estilo que el maestro de proveedores (CO-01 / CO-02): columnas y filtros equivalentes, acciones Ver / Editar / Desactivar,
   ficha en modo Ver (solo lectura) o Editar, datos en tarjetas y pestañas. Grupo = Nacional / Internacional (como el proveedor);
   Tipo de cliente = el segmento de las listas de precios (Minorista, Mayorista, Exportación, Servicios). */
const CM07 = {
  f: { q: '', grupo: '', tipo: '', est: '', act: 'activos' },
  lista() {
    const f = CM07.f, q = f.q.trim().toLowerCase();
    return Store.d.clientes.filter(c => (f.act === 'todos' || (f.act === 'activos') === c.activo) && (!f.grupo || (c.grupo || 'Nacional') === f.grupo) && (!f.tipo || c.tipo === f.tipo) &&
      (!f.est || Cli.estadoComercial(c) === f.est) && (!q || (c.cod + ' ' + c.doc + ' ' + c.nom + ' ' + c.tel + ' ' + c.email).toLowerCase().includes(q)));
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
      UI.campo('Buscar (código / nombre / documento)', '<input value="' + UI.esc(f.q) + '" placeholder="Ej. CLI-000003, HUAMÁN, 2060…" oninput="CM07.f.q=this.value;CM07.pintar()" style="min-width:250px">') +
      UI.campo('Grupo', '<select onchange="CM07.f.grupo=this.value;CM07.pintar()">' + UI.opts(BD.GRUPOS_SOCIO, f.grupo, 'Todos') + '</select>') +
      UI.campo('Tipo de cliente', '<select onchange="CM07.f.tipo=this.value;CM07.pintar()">' + UI.opts(M.TIPOS_CLIENTE, f.tipo, 'Todos') + '</select>') +
      UI.campo('Estado comercial', '<select onchange="CM07.f.est=this.value;CM07.pintar()">' + UI.opts(['Nuevo', 'Activo', 'Por recuperar', 'Sin compras'], f.est, 'Todos') + '</select>') +
      UI.campo('Estado', '<select onchange="CM07.f.act=this.value;CM07.pintar()">' + UI.opts([{ v: 'activos', t: 'Activo' }, { v: 'inactivos', t: 'Inactivo' }, { v: 'todos', t: 'Todos' }], f.act) + '</select>') +
      '</div></div><div id="cm07-body"></div>' +
      '<p class="hint">Maestro de clientes de Comercial: el cliente es un socio de negocio propio (no se unifica con el proveedor, T6). <b>Grupo</b>: Nacional o Internacional. <b>Tipo de cliente</b>: el segmento de las listas de precios. No se borra: se desactiva. El estado comercial no es un campo: se calcula de sus ventas registradas.</p>';
  },
  pintar() {
    const ed = Store.puede('editar_cliente');
    document.getElementById('cm07-body').innerHTML = UI.tabla(['Código', 'Nombre', 'Grupo', 'Tipo de cliente', 'Tipo y N° de documento', 'Condición de pago', 'Estado comercial', 'Estado', ['Acciones', '', '170px']], CM07.lista().map(c =>
      '<tr class="clickable" onclick="App.go(\'cm07f\',{id:\'' + c.cod + '\'})"><td>' + c.cod + '</td><td>' + UI.esc(c.nom) + (c.aConfirmar ? ' <span class="warn-t" title="Datos a confirmar">⚠</span>' : '') + '</td>' +
      '<td>' + UI.esc(c.grupo || 'Nacional') + '</td><td>' + UI.esc(c.tipo) + '</td><td>' + Cli.docTxt(c) + '</td><td>' + UI.esc((M.cond(c.cond) || {}).nom || '—') + '</td>' +
      '<td>' + UI.estado(Cli.estadoComercial(c)) + '</td><td>' + UI.estado(c.activo ? 'Activo' : 'Inactivo') + '</td>' +
      '<td><button class="btn-link" onclick="event.stopPropagation();App.go(\'cm07f\',{id:\'' + c.cod + '\'})">Ver</button> ' +
      (ed ? '<button class="btn-link" onclick="event.stopPropagation();App.go(\'cm07f\',{id:\'' + c.cod + '\',modo:\'editar\'})">Editar</button> ' +
        '<button class="btn-link" onclick="event.stopPropagation();CM07F.activo(' + !c.activo + ',\'' + c.cod + '\')">' + (c.activo ? 'Desactivar' : 'Reactivar') + '</button>' : '') + '</td></tr>'),
      { vacio: 'Sin clientes para los filtros aplicados' }) + '<div class="pager"><span>' + CM07.lista().length + ' clientes</span></div>';
  },
  excel() {
    UI.csv('clientes', ['Código', 'Nombre', 'Grupo', 'Tipo de cliente', 'Tipo doc.', 'Documento', 'Condición', 'Teléfono', 'Email', 'Dirección', 'Ubigeo', 'Estado comercial', 'Estado'],
      CM07.lista().map(c => [c.cod, c.nom, c.grupo || 'Nacional', c.tipo, c.tipoDoc, c.doc, (M.cond(c.cond) || {}).nom || '', c.tel, c.email, c.dir, c.ubigeo, Cli.estadoComercial(c), c.activo ? 'Activo' : 'Inactivo']));
  }
};
App.pantalla('cm07', { titulo: 'Clientes', permiso: 'ver_cliente', render: CM07.render, despues: CM07.pintar });

/* ---------- ficha del cliente (CL-35): nuevo · ver (solo lectura) · editar ---------- */
const CM07F = {
  tab: 'datos', ultimo: null,
  /* formulario en tarjetas, como CO-02; ed = false → campos deshabilitados (modo Ver). pref distingue la ficha ('cf') del alta rápida ('cq') */
  form(c, ed, pref) {
    pref = pref || 'cf';
    const dis = ed ? '' : ' disabled';
    const inp = (id, v, ph) => '<input id="' + pref + '-' + id + '" value="' + UI.esc(v) + '"' + (ph && ed ? ' placeholder="' + ph + '"' : '') + dis + '>';
    const sel = (id, lista, v, vacio) => '<select id="' + pref + '-' + id + '"' + dis + '>' + UI.opts(lista, v, vacio) + '</select>';
    const card = (tit, cuerpo) => '<div class="card"><b style="font-size:13px">' + tit + '</b><div class="formgrid c3" style="margin-top:12px">' + cuerpo + '</div></div>';
    return card('Detalles generales (obligatorios)',
        UI.campo('Código (auto)', '<input value="' + UI.esc(c.cod || 'Se asigna al guardar') + '" disabled>') +
        UI.campo('Grupo', sel('grupo', BD.GRUPOS_SOCIO, c.grupo || 'Nacional'), { req: ed }) +
        UI.campo('Tipo de cliente', sel('tipo', M.TIPOS_CLIENTE, c.tipo), { req: ed, hint: ed ? 'Segmento de las listas de precios y ofertas' : '' }) +
        UI.campo('Nombre o razón social', inp('nom', c.nom, 'Nombre completo o razón social'), { req: ed }) +
        UI.campo('Tipo de documento', sel('tdoc', M.TIPOS_DOC.map(t => ({ v: t.cod, t: t.nom })), c.tipoDoc), { req: ed }) +
        UI.campo('N° de documento', inp('doc', c.doc, 'DNI 8 dígitos · RUC 11'), { req: ed, hint: ed ? 'Único por empresa' : '' })) +
      card('Contacto y dirección (opcional)',
        UI.campo('Email', inp('email', c.email, 'correo@dominio.com')) + UI.campo('Teléfono', inp('tel', c.tel, '9…')) +
        UI.campo('Ubigeo', sel('ubi', [{ v: '', t: '—' }].concat(M.UBIGEOS.map(u => ({ v: u.cod, t: u.cod + ' · ' + u.t }))), c.ubigeo)) +
        UI.campo('Dirección', inp('dir', c.dir), { full: true })) +
      card('Condiciones comerciales',
        UI.campo('Condición de pago habitual', sel('cond', M.CONDICIONES.map(x => ({ v: x.cod, t: x.nom })), c.cond)) +
        UI.campo('Observaciones', inp('obs', c.obs), { estilo: 'grid-column:span 2' }));
  },
  leer(pref) {
    pref = pref || 'cf';
    const g = id => UI.v(pref + '-' + id);
    return { tipoDoc: g('tdoc'), doc: g('doc'), nom: g('nom'), grupo: g('grupo'), tipo: g('tipo'), tel: g('tel'), email: g('email'), dir: g('dir'), ubigeo: g('ubi'), cond: g('cond'), obs: g('obs') };
  },
  render(p) {
    const nuevo = !p.id;
    const c = nuevo ? { cod: '', tipoDoc: 'DNI', doc: '', nom: '', grupo: 'Nacional', tipo: 'MINORISTA', tel: '', email: '', dir: '', ubigeo: '', cond: 'CONTADO', obs: '', activo: true } : Store.cli(p.id);
    if (!c) return UI.aviso('No existe el cliente ' + UI.esc(p.id), 'err');
    const modo = nuevo ? 'nuevo' : (p.modo === 'editar' && Store.puede('editar_cliente') ? 'editar' : 'ver');
    if (CM07F.ultimo !== (p.id || 'nuevo') + modo) { CM07F.ultimo = (p.id || 'nuevo') + modo; CM07F.tab = 'datos'; }
    const ed = modo !== 'ver' && (nuevo ? Store.puede('crear_cliente') : true);
    const vs = nuevo ? [] : Store.d.ventas.filter(v => v.cli === c.cod), cs = nuevo ? [] : Store.d.cots.filter(x => x.cli === c.cod), ds = nuevo ? [] : Store.d.devs.filter(x => x.cliente.cod === c.cod);

    /* botones como CO-02: en edición Cancelar / Guardar; en Ver las acciones del registro */
    const b = [];
    if (modo === 'ver') {
      if (Store.puede('editar_cliente')) b.push('<button class="btn btn-' + (c.activo ? 'danger' : 'secondary') + '" onclick="CM07F.activo(' + !c.activo + ')">' + (c.activo ? 'Desactivar' : 'Reactivar') + '</button>');
      if (Store.puede('editar_cliente')) b.push('<button class="btn btn-secondary" onclick="App.go(\'cm07f\',{id:\'' + c.cod + '\',modo:\'editar\'})">Editar</button>');
      if (c.activo && Store.puede('crear_cotizacion')) b.push('<button class="btn btn-secondary" onclick="App.go(\'cm01f\',{cli:\'' + c.cod + '\',nuevo:Date.now()})">Nueva cotización</button>');
      if (c.activo && Store.puede('crear_venta')) b.push('<button class="btn btn-secondary" onclick="App.go(\'cm02f\',{cli:\'' + c.cod + '\',nuevo:Date.now()})">Nueva venta</button>');
      b.push('<button class="btn btn-secondary" onclick="App.go(\'cm07\')">Volver</button>');
    } else {
      b.push('<button class="btn btn-secondary" onclick="' + (nuevo ? 'App.go(\'cm07\')' : 'App.go(\'cm07f\',{id:\'' + c.cod + '\'})') + '">Cancelar</button>');
      if (ed) b.push('<button class="btn btn-primary" onclick="CM07F.guardar()">Guardar</button>');
    }
    const titulo = nuevo ? 'NUEVO CLIENTE' : (modo === 'ver' ? 'CLIENTE: ' : 'EDITAR: ') + UI.esc(c.nom);
    let html = '<div class="screen-head"><h1>' + titulo + '</h1><span class="code">CL-35</span>' +
      (nuevo ? '' : ' ' + UI.estado(c.activo ? 'Activo' : 'Inactivo') + ' ' + UI.badge('Estado comercial: ' + Cli.estadoComercial(c), UI.COLORES[Cli.estadoComercial(c)] || 'var(--borrador)') + (c.aConfirmar ? ' ' + UI.badge('Datos a confirmar', 'var(--pendiente)') : '')) +
      '<div class="spacer"></div>' + b.join('') + '</div>';

    if (modo === 'ver') {
      html += UI.kpis([
        { l: 'Comprado (neto)', v: CM02.sumaMon(vs.filter(v => v.estado === 'Registrada'), Ventas.neto) },
        { l: 'Saldo por cobrar', v: CM02.sumaMon(vs, Ventas.deuda), color: 'var(--pendiente)' },
        { l: 'Última compra', v: vs.filter(v => v.estado === 'Registrada').length ? vs.filter(v => v.estado === 'Registrada')[0].fecha.slice(0, 10) : '—', color: 'var(--borrador)' },
        { l: 'Cliente desde', v: (c.alta || '').slice(0, 10) || '—', color: 'var(--borrador)' }
      ]);
      const tabs = [['datos', 'Datos del cliente'], ['ven', 'Historial de ventas (' + vs.length + ')'], ['cot', 'Cotizaciones (' + cs.length + ')'], ['dev', 'Devoluciones (' + ds.length + ')']];
      html += '<div class="tabs">' + tabs.map(t => '<div class="tab' + (t[0] === CM07F.tab ? ' active' : '') + '" onclick="CM07F.tab=\'' + t[0] + '\';App.refrescar()">' + t[1] + '</div>').join('') + '</div>';
    }
    if (modo !== 'ver' || CM07F.tab === 'datos') {
      html += CM07F.form(c, ed) +
        '<p class="hint">Obligatorios: grupo, tipo de cliente, nombre y documento. Estado comercial: <b>Nuevo</b> (primera compra en 30 días), <b>Activo</b> (compró en 60 días), <b>Por recuperar</b> (sin compras hace más de 60), <b>Sin compras</b>. «Inactivo» es la baja lógica del registro.</p>';
    } else if (CM07F.tab === 'ven') {
      html += '<div class="card"><b style="font-size:13px">Ventas del cliente</b>' + UI.tabla(['Venta', 'Fecha de creación', 'Tienda', ['Total', 'num'], ['Saldo', 'num'], 'Pago', 'Estado'], vs.map(v => '<tr class="clickable" onclick="App.go(\'cm02v\',{id:\'' + v.id + '\'})"><td><b>' + v.id + '</b><br><span class="mini">' + v.compNum + '</span></td><td class="mini">' + v.fecha + '</td><td class="mini">' + UI.esc(v.sedeNom) + '</td><td class="num">' + UI.m(v.total, v.mon) + '</td><td class="num">' + UI.m(Ventas.deuda(v), v.mon) + '</td><td>' + UI.estado(Ventas.estadoPago(v)) + '</td><td>' + UI.estado(v.estado) + '</td></tr>'), { vacio: 'Sin ventas registradas', sub: true }) + '</div>';
    } else if (CM07F.tab === 'cot') {
      html += '<div class="card"><b style="font-size:13px">Cotizaciones del cliente</b>' + UI.tabla(['Cotización', 'Fecha de creación', 'Válida hasta', ['Total', 'num'], 'Estado'], cs.map(x => '<tr class="clickable" onclick="App.go(\'cm01f\',{id:\'' + x.id + '\'})"><td><b>' + x.id + '</b></td><td class="mini">' + x.fecha + '</td><td>' + x.validez + '</td><td class="num">' + UI.m(x.total, x.mon) + '</td><td>' + UI.estado(x.estado) + '</td></tr>'), { vacio: 'Sin cotizaciones', sub: true }) + '</div>';
    } else {
      html += '<div class="card"><b style="font-size:13px">Devoluciones del cliente</b>' + UI.tabla(['Devolución', 'Fecha de creación', 'Venta', ['Total', 'num'], 'Estado'], ds.map(x => '<tr class="clickable" onclick="App.go(\'cm03f\',{id:\'' + x.id + '\'})"><td><b>' + x.id + '</b></td><td class="mini">' + x.fecha + '</td><td>' + x.venta + '</td><td class="num">' + UI.m(x.total, x.mon) + '</td><td>' + UI.estado(x.estado) + '</td></tr>'), { vacio: 'Sin devoluciones', sub: true }) + '</div>';
    }
    return html;
  },
  guardar() {
    const id = App.params.id;
    if (id) { if (App.accion(() => Cli.actualizar(id, CM07F.leer()), 'Cliente actualizado: ' + id)) App.go('cm07f', { id }); return; }
    const c = App.accion(() => Cli.crear(CM07F.leer()), x => 'Cliente creado: ' + x.cod);
    if (c) App.go('cm07f', { id: c.cod });
  },
  /* CL-36: desde la ficha o desde la fila del listado */
  activo(v, cod) {
    const c = Store.cli(cod || App.params.id);
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
      cuerpo: CM07F.form({ tipoDoc: 'DNI', doc: '', nom: '', grupo: 'Nacional', tipo: 'MINORISTA', tel: '', email: '', dir: '', ubigeo: '', cond: 'CONTADO', obs: '' }, true, 'cq') +
        '<p class="hint" style="margin-top:8px">El cliente queda creado y seleccionado en el documento.</p>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="CLIQ.guardar()">Crear y seleccionar</button>'
    });
  },
  guardar() {
    const c = App.accion(() => Cli.crear(CM07F.leer('cq')), x => 'Cliente creado: ' + x.cod);
    if (c) { UI.cerrar(); if (CLIQ._cb) CLIQ._cb(c.cod); else App.refrescar(); }
  }
};
