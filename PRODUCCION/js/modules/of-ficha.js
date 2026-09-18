/* PRODUCCION · PR-02 Orden de Fabricación: cabecera, acciones, órdenes de la referencia y pestañas */
const PR02 = {
  tab: 'mat',
  TABS: [],
  registrarTab(t) { PR02.TABS.push(t); PR02.TABS.sort((a, b) => a.orden - b.orden); },
  of() { return BD.of(App.params.id); },
  ir(tab) { PR02.tab = tab; App.refrescar(); },
  sel(html) { return html.replace(/<(select|input)/, '<$1 style="border:1px solid var(--borde);border-radius:6px;padding:7px 10px;width:100%"'); },

  render(p) {
    const of = BD.of(p.id);
    if (!of) return UI.aviso('No existe la orden ' + UI.esc(p.id), 'err');
    if (p.tab) { PR02.tab = p.tab; delete p.tab; }
    const L = M.ldm(of.ldm), R = Prod.nombreRef(), plan = of.estado === 'Planificado', ed = Prod.editable(of);
    const b = [];
    if (plan) b.push('<button class="btn btn-primary" onclick="PR02.liberar()">Liberar</button>');
    if (of.estado === 'Liberado') b.push('<button class="btn btn-secondary" onclick="PR02.tab=\'emi\';App.refrescar();PREM.abrir()">+ Emisión</button>', '<button class="btn btn-primary" onclick="PR02.tab=\'rec\';App.refrescar();PRRE.abrir()">+ Recibo</button>', '<button class="btn btn-secondary" onclick="PR02.cerrar()">Cerrar orden</button>');
    const servs = Prod.serviciosDe(of);
    if (Prod.abierta(of) && servs.some(cod => !Prod.solicitudesServicio(of, cod).length)) b.push('<button class="btn btn-primary" onclick="PR02.pedirServicio()" title="Solicitud de materiales con el servicio para que Logística cree la OC">Pedir servicio</button>');
    if (Prod.abierta(of) && !Prod.tieneMovimientos(of) && !(of.envios || []).length) b.push('<button class="btn btn-secondary" onclick="PR02.tercerizar()">' + (servs.length ? 'Cambiar servicio' : 'Tercerizar') + '</button>');
    if (Prod.abierta(of) && !Prod.tieneMovimientos(of)) b.push('<button class="btn btn-danger" onclick="PR02.cancelar()">Cancelar</button>');
    b.push('<button class="btn btn-secondary" onclick="App.go(\'pr01\')">Volver</button>');

    const ldms = M.ldmsDe(of.art);
    const tabs = PR02.TABS.filter(t => !t.visible || t.visible(of));
    if (!tabs.find(t => t.id === PR02.tab)) PR02.tab = tabs[0].id;
    let cuerpo;
    try { cuerpo = tabs.find(t => t.id === PR02.tab).render(of); } catch (e) { console.error(e); cuerpo = UI.aviso('Error: ' + UI.esc(e.message), 'err'); }

    return '<div class="screen-head"><h1>' + of.id + ' · ' + UI.esc(M.nomArt(of.art)) + '</h1>' + UI.estadoOF(of.estado) + ' <span class="mini">' + PR01.tipo(of) + '</span>' +
      ' <button class="btn-link" onclick="App.go(\'pr04\',{id:\'' + of.ref + '\'})">' + UI.esc(R) + ' ' + of.ref + '</button><div class="spacer"></div>' + b.join('') + '</div>' +
      '<div class="card"><div class="formgrid c4">' +
      UI.dato('Produce', '<b>' + of.art + '</b> · ' + UI.esc(M.nomArt(of.art))) +
      (plan ? UI.campo('Cantidad', PR02.sel('<input type="number" min="0" step="any" value="' + of.cant + '" onchange="PR02.cantidad(this.value)">')) : UI.dato('Cantidad', UI.q(of.cant, M.u(of.art)))) +
      UI.dato('Recibido', UI.n(of.prod, 0) + ' de ' + UI.n(of.cant, 0) + '<br>' + UI.barra(of.prod, of.cant)) +
      UI.dato('Entra en', of.alm + ' · ' + UI.esc(M.almNom(of.alm))) +
      UI.dato('Empresa', UI.esc(BD.empNom(of.emp || BD.empresaDe(of.alm)))) +
      (of.faltante ? UI.dato('Faltante del proveedor', '<b class="err-t">' + UI.q(of.faltante.cant, M.u(of.art)) + '</b><br><span class="mini">' + UI.esc(M.provNom(of.faltante.prov) || '') + ' · ' + of.faltante.f.slice(0, 10) + ' · ' + of.faltante.estado + '</span>') : '') +
      (ed ? UI.campo('Lista de materiales (opcional)', PR02.sel('<select onchange="PR02.ldm(this.value)">' + UI.opts([{ v: '', t: 'Sin lista' }].concat(ldms.map(l => ({ v: l.id, t: l.id + ' · ' + l.nom }))), of.ldm) + '</select>'), { hint: 'Al elegir una lista se copian sus líneas' })
        : UI.dato('Lista de materiales', L ? L.id + ' · ' + UI.esc(L.nom) + (L.obs ? '<br><span class="mini">' + UI.esc(L.obs) + '</span>' : '') : 'Sin lista')) +
      UI.dato('Origen', of.sf ? 'Solicitud <button class="btn-link" onclick="App.go(\'pr03d\',{id:\'' + of.sf + '\'})">' + of.sf + '</button>' : 'Creada en Producción') +
      UI.dato('Fechas', (of.fechaFin ? '<b>Requerida ' + UI.esc(of.fechaFin) + '</b><br>' : '') + 'Creada ' + of.fecha.slice(0, 10) + (of.fechaLib ? ' · liberada ' + of.fechaLib.slice(0, 10) : '') + (of.fechaCierre ? ' · cerrada ' + of.fechaCierre.slice(0, 10) : '')) +
      UI.dato('Observación', UI.esc(of.obs)) +
      (servs.length ? UI.dato('Servicio de terceros', UI.esc(M.provNom(Prod.provServicio(of))) + '<br><span class="mini">' + servs.map(c => UI.esc(Prod.nomItem(c))).join(', ') + ' · ' + UI.esc(Prod.almTercero(of)) + '</span>') : '') +
      '</div></div>' +
      PR02.deLaRef(of) +
      '<div class="tabs">' + tabs.map(t => '<div class="tab' + (t.id === PR02.tab ? ' active' : '') + '" onclick="PR02.ir(\'' + t.id + '\')">' + (typeof t.titulo === 'function' ? t.titulo(of) : t.titulo) + '</div>').join('') + '</div>' +
      '<div>' + cuerpo + '</div>';
  },

  deLaRef(of) {
    const todas = BD.d.ofs.filter(o => o.ref === of.ref && o.estado !== 'Cancelado');
    if (todas.length < 2) return '';
    const sec = Explosion.secuencia(todas);
    return '<div class="card" style="padding:10px 14px"><div class="chips" style="align-items:center">' +
      '<span class="mini" style="margin-right:4px">' + UI.esc(Prod.nombreRef()) + ' ' + of.ref + ':</span>' +
      Explosion.ordenar(todas).map(o => '<span class="chip" style="cursor:pointer;' + (o.id === of.id ? 'background:var(--primario);color:#fff;border-color:var(--primario)' : '') + '" onclick="App.go(\'pr02\',{id:\'' + o.id + '\'})" title="' + o.id + ' · ' + o.estado + '">' +
        'Fase ' + sec[o.id] + ' · ' + UI.esc(M.nomArt(o.art)) + ' ' + UI.n(o.prod, 0) + '/' + UI.n(o.cant, 0) + (o.estado === 'Cerrado' ? ' ✓' : '') + '</span>').join('') + '</div></div>';
  },

  liberar() { const of = PR02.of(); if (App.accion(() => Prod.liberar(of), of.id + ' liberada')) App.refrescar(); },
  cerrar() {
    const of = PR02.of();
    UI.confirmar('Cerrar ' + of.id, '<p>Recibido <b>' + UI.n(of.prod, 0) + '</b> de ' + UI.n(of.cant, 0) + '. Lo comprometido que no se usó vuelve a estar disponible' +
      (Prod.enProceso(of) > 0.004 ? '; el costo emitido sin recibir (' + UI.s(Prod.enProceso(of)) + ') se suma al costo de lo recibido' : '') +
      (Prod.solicitudesDe(of).some(s => s.estado === 'Pendiente') ? '; las solicitudes de materiales pendientes se anulan' : '') + '.</p>',
      () => { if (App.accion(() => Prod.cerrar(of), of.id + ' cerrada')) App.refrescar(); }, 'Cerrar');
  },
  tercerizar() {
    const of = PR02.of(), servs = M.recActivos(r => r.tipo === 'SERVICIO DE TERCEROS'), actual = Prod.serviciosDe(of);
    const recSel = actual[0] || (servs[0] || {}).cod || '', provSel = Prod.provServicio(of) || (M.rec(recSel) || {}).prov || '';
    const provs = M.PROVEEDORES.filter(p => p.servicio || p.grupo === 'SRV' || p.cod === provSel);
    UI.modal({
      titulo: (actual.length ? 'Cambiar servicio · ' : 'Tercerizar fase · ') + of.id,
      cuerpo: '<div class="formgrid">' +
        UI.campo('Servicio', '<select id="te-rec" onchange="PR02.tercProv()">' + UI.opts(servs.map(r => ({ v: r.cod, t: r.cod + ' · ' + r.nom + ' · ' + UI.s(r.costo) + ' / ' + r.u })), recSel) + '</select>', { req: true, full: true }) +
        UI.campo('Proveedor', '<select id="te-prov">' + UI.opts(provs.map(p => ({ v: p.cod, t: p.cod + ' · ' + p.nom })), provSel) + '</select>', { req: true, hint: 'El habitual del servicio; Logística lo confirma al crear la OC' }) +
        UI.campo('Almacén de tránsito', '<select id="te-alm">' + UI.opts(M.opcionesAlm(of.emp || BD.empresaDe(of.alm), Prod.almTercero(of)), Prod.almTercero(of)) + '</select>', { req: true, hint: 'Almacenes de la empresa de la orden; debe estar marcado «en tránsito»' }) +
        '<div class="field full"><label class="check"><input type="checkbox" id="te-sol" checked> Pedir el servicio a Logística (Solicitud de materiales)</label></div></div>' +
        '<p class="hint">' + (actual.length ? 'La orden ya lleva el servicio de su lista de materiales: se reemplaza el servicio o el proveedor (si la solicitud del servicio aún está pendiente, se anula).' :
          'Los materiales de la orden pasan al almacén de tránsito (se mandan con «Enviar al proveedor»), se quitan los recursos propios y se agrega el servicio.') + ' Lo producido vuelve a ' + of.alm + ' con el recibo. La orden pasa a Especial.</p>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="PR02.guardarTerc()">Tercerizar</button>'
    });
  },
  tercProv() { const R = M.rec(UI.v('te-rec')), s = document.getElementById('te-prov'); if (R && R.prov && s) s.value = R.prov; },
  guardarTerc() {
    const of = PR02.of();
    const r = App.accion(() => Prod.tercerizar(of, { rec: UI.v('te-rec'), prov: UI.v('te-prov'), alm: UI.v('te-alm'), solicitar: UI.chk('te-sol') }),
      x => of.id + ' tercerizada' + (x.sol ? ' · ' + x.sol.id + ' enviada a Logística' : ''));
    if (r) { UI.cerrar(); App.refrescar(); }
  },
  pedirServicio() {
    const of = PR02.of();
    UI.confirmar('Pedir servicio · ' + of.id, '<p>Se envía a Logística una <b>Solicitud de materiales</b> con ' + Prod.serviciosDe(of).map(c => UI.esc(Prod.nomItem(c))).join(', ') +
      ' por ' + UI.q(of.cant, M.u(of.art)) + ', destino ' + UI.esc(Prod.almTercero(of)) + '. Logística la aprueba como Compra y crea la OC de servicio (' + UI.esc(M.provNom(Prod.provServicio(of))) + '); al aprobarla Compras, aparece en la pestaña Costo.</p>',
      () => { const r = App.accion(() => Prod.pedirServicio(of), x => x.id + ' enviada a Logística'); if (r) App.refrescar(); }, 'Enviar a Logística');
  },
  cancelar() { const of = PR02.of(); UI.confirmar('Cancelar ' + of.id, '<p>La orden no tiene emisiones ni recibos.</p>', () => { if (App.accion(() => Prod.cancelar(of), of.id + ' cancelada')) App.refrescar(); }, 'Cancelar orden'); },
  ldm(v) {
    const of = PR02.of();
    UI.confirmar('Lista de materiales', '<p>' + (v ? 'Se reemplazan las líneas de la orden por las de ' + v + '.' : 'Se quitan todas las líneas de la orden.') + '</p>',
      () => { App.accion(() => Prod.cambiarLDM(of, v), 'Líneas actualizadas'); App.refrescar(); }, 'Aplicar');
    App.refrescar();
  },
  cantidad(v) { const of = PR02.of(); App.accion(() => Prod.cambiarCantidad(of, parseFloat(v)), 'Cantidad actualizada'); App.refrescar(); }
};
App.pantalla('pr02', {
  titulo: 'Orden de Fabricación', menu: 'pr01', render: PR02.render,
  miga: p => '<a class="btn-link" onclick="App.go(\'pr01\')">Órdenes de Fabricación</a> / <b>' + UI.esc(p.id) + '</b>'
});

PR02.registrarTab({
  id: 'adj', orden: 6, titulo: of => 'Adjuntos (' + of.adj.length + ')',
  render(of) {
    return '<div class="card"><div class="filters">' + UI.campo('Archivo', '<input type="file" id="adj-file">') +
      UI.campo('Descripción', '<input id="adj-desc" style="min-width:300px">') +
      '<button class="btn btn-primary" onclick="PR02.adjuntar()">Adjuntar</button>' +
      '<button class="btn btn-secondary" onclick="PR01.adjuntos(\'' + of.ref + '\')">📎 Todos los de la referencia (' + Prod.adjuntosRef(of.ref).length + ')</button></div></div>' +
      UI.tabla(['Archivo', 'Descripción', 'Fecha', 'Usuario'], of.adj.map(a => '<tr><td>📎 ' + UI.esc(a.nombre) + '</td><td>' + UI.esc(a.desc) + '</td><td>' + a.f + '</td><td class="mini">' + UI.esc(a.u) + '</td></tr>'), { vacio: 'Sin adjuntos' });
  }
});
PR02.adjuntar = function () {
  const of = PR02.of(), fi = document.getElementById('adj-file');
  if (App.accion(() => Prod.adjuntar(of, fi && fi.files && fi.files[0] ? fi.files[0].name : '', UI.v('adj-desc')), 'Adjunto registrado')) App.refrescar();
};
PR02.registrarTab({
  id: 'hist', orden: 7, titulo: 'Historial',
  render(of) { return '<div class="card">' + of.hist.slice().reverse().map(h => '<div class="hline"><b>' + UI.esc(h.a) + '</b> <span class="mini">· ' + h.f + ' · ' + UI.esc(h.u) + '</span>' + (h.d ? '<div class="hint">' + UI.esc(h.d) + '</div>' : '') + '</div>').join('') + '</div>'; }
});
