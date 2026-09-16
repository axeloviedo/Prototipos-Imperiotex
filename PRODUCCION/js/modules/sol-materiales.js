/* PRODUCCION · PR-05 Solicitudes de materiales (Docs.sol de la base compartida).
   Producción CREA solicitudes (a mano con «+ Nueva solicitud», desde la orden cuando falta stock o al pedir un servicio de terceros)
   y CONSULTA su avance real. Logística las atiende en Inventarios (GI-13): define por línea Transferencia o Compra,
   transfiere (GI-11) o crea la OC; Compras la aprueba y registra el ingreso o la conformidad del servicio. Aquí no se simula nada de eso. */
const EST_SOL = { Borrador: 'var(--borrador)', Pendiente: 'var(--pendiente)', Aprobada: 'var(--aprobado-sol)', 'En proceso': 'var(--prp)', Atendida: 'var(--completada)', Rechazada: 'var(--cancelada)', Anulada: 'var(--cancelada)' };
const EST_LINEA = { Pendiente: 'var(--pendiente)', 'En transferencia': 'var(--aprobada)', Transferido: 'var(--confirmado)', 'En compra': 'var(--prp)', Recibido: 'var(--completada)' };
const PR05 = {
  f: 'abiertas',
  GI13: '../INVENTARIOS/index.html#gi13',
  /* línea con su estado real: Pendiente · En transferencia (ST aprobada, falta confirmar la recepción en GI-11) · Transferido · En compra (OC y su estado) · Recibido */
  linea(l) {
    const u = Prod.uItem(l.art);
    let doc = '';
    if (l.doc && /^OC-/.test(l.doc)) { const oc = BD.oc(l.doc); doc = UI.esc(l.doc) + (oc ? ' · ' + UI.esc(oc.est) + ' · ' + UI.esc(M.provNom(oc.prov)) : ''); }
    else if (l.doc && /^ST-/.test(l.doc)) { const t = BD.trf(l.doc); doc = '<button class="btn-link" style="padding:0" onclick="PRUI.doc(\'' + l.doc + '\')">' + UI.esc(l.doc) + '</button>' + (t ? ' · ' + UI.esc(t.estado) + (t.estado === 'Aprobada' || t.estado === 'Parcial' ? ' (recepción por confirmar en GI-11)' : '') : ''); }
    else if (l.doc) doc = '<button class="btn-link" style="padding:0" onclick="PR08.verMov(\'' + l.doc + '\')">' + UI.esc(l.doc) + '</button>';
    return '<div style="margin-bottom:4px">' + UI.esc(Prod.nomItem(l.art)) + ' <span class="mini">' + l.art + '</span> × <b>' + UI.q(l.cant, u) + '</b> ' + UI.badge(l.estado, EST_LINEA[l.estado] || 'var(--borrador)') +
      '<br><span class="mini">' + (l.prop ? l.prop + (l.origen ? ' desde ' + l.origen : '') : 'sin propósito (lo define Logística)') +
      (doc ? ' · ' + doc : '') + (l.recibido ? ' · recibido ' + UI.q(l.recibido, u) : '') + '</span></div>';
  },
  render(p) {
    if (p.id) PR05.f = '';
    const abierta = s => Prod.ABIERTAS_SOL.includes(s.estado);
    const lista = BD.d.sols.filter(s => (s.area === Prod.MODULO || s.of) && (!PR05.f || (PR05.f === 'abiertas' ? abierta(s) : s.estado === PR05.f)));
    const acciones = s => (s.estado === 'Pendiente' || s.estado === 'Borrador' ? '<button class="btn btn-secondary btn-sm" onclick="PR05.anular(\'' + s.id + '\')">Anular</button> ' : '') +
      '<a class="btn-link" href="' + PR05.GI13 + '" target="_blank" title="Logística atiende la solicitud en Inventarios">Ver en GI-13 ↗</a>';
    return '<div class="screen-head"><h1>Solicitudes de materiales</h1><span class="code">PR-05</span><div class="spacer"></div>' +
      '<a class="btn btn-secondary" style="text-decoration:none" href="' + PR05.GI13 + '" target="_blank">Ver en Inventarios (GI-13)</a>' +
      '<button class="btn btn-primary" onclick="PR05.nueva()">+ Nueva solicitud</button></div>' +
      UI.aviso('<b>Producción crea y consulta</b> sus solicitudes de materiales. <b>Logística las atiende</b> en Inventarios (GI-13): define por línea Transferencia o Compra; ' +
        'Compras aprueba la OC y registra el ingreso o la conformidad del servicio. El estado de cada línea es el real de la base compartida.', 'info') +
      '<div class="card"><div class="filters">' + UI.campo('Estado', '<select onchange="PR05.f=this.value;App.go(\'pr05\')">' +
        UI.opts([{ v: 'abiertas', t: 'Abiertas' }, { v: '', t: 'Todas' }].concat(Object.keys(EST_SOL)), PR05.f) + '</select>') + '</div></div>' +
      UI.tabla(['Solicitud', 'Fecha', 'Orden', 'Destino', 'Líneas y estado', 'Estado', ['Acciones', '', '160px']], lista.map(s =>
        '<tr' + (p.id === s.id ? ' style="background:#FFFBEB"' : '') + '><td><b>' + s.id + '</b><br><span class="mini">' + UI.esc(s.obs) + '</span><br><span class="mini">' + UI.esc(s.solicita) + '</span></td><td class="mini">' + s.fecha + '</td>' +
        '<td>' + (s.of ? '<button class="btn-link" style="padding:0" onclick="App.go(\'pr02\',{id:\'' + s.of + '\',tab:\'emi\'})">' + s.of + '</button><br><span class="mini">' + UI.esc(Prod.nombreRef()) + ' ' + UI.esc(s.ref) + '</span>' : '<span class="mini">Sin orden</span>') + '</td>' +
        '<td class="mini">' + (s.destino || '—') + '</td><td>' + s.lineas.map(PR05.linea).join('') + (s.nota ? '<span class="mini">' + UI.esc(s.nota) + '</span>' : '') + '</td>' +
        '<td>' + UI.badge(s.estado, EST_SOL[s.estado] || 'var(--borrador)') + '</td>' +
        '<td>' + acciones(s) + '</td></tr>'), { vacio: 'Sin solicitudes' }) +
      '<p class="hint">Producción indica qué necesita y a dónde. Logística revisa existencias y define el propósito de cada línea: Transferencia (GI-11 desde el almacén de origen) o Compra (OC). Un servicio de terceros solo se compra: su OC aparece en la pestaña Costo de la orden.</p>';
  },
  /* ---------- PR-05a Nueva solicitud (Producción) ---------- */
  nuevas: [],
  nueva() {
    PR05.nuevas = [{ art: '', cant: '' }];
    const ofs = BD.d.ofs.filter(o => Prod.abierta(o));
    UI.modal({
      lg: true, titulo: 'Nueva solicitud de materiales <span class="code">PR-05a</span>',
      cuerpo: '<div class="formgrid c3">' +
        UI.campo('Orden de fabricación', '<select id="ns-of">' + UI.opts(ofs.map(o => ({ v: o.id, t: o.id + ' · ' + M.nomArt(o.art) })), '', 'Sin orden') + '</select>', { hint: 'Opcional' }) +
        UI.campo('Almacén destino', '<select id="ns-dest">' + UI.opts(M.ALMACENES.map(a => ({ v: a.cod, t: a.cod + ' · ' + a.nom })), 'SB-ZARATE-MP') + '</select>', { req: true, hint: 'A dónde debe llegar' }) +
        UI.campo('Motivo', '<input id="ns-mot" placeholder="Ej. Reposición de avíos en planta">') + '</div>' +
        '<div class="sec">Qué necesita <div style="flex:1"></div><button class="btn btn-secondary btn-sm" onclick="PR05.leer();PR05.nuevas.push({art:\'\',cant:\'\'});PR05.pintarNuevas()">+ Línea</button></div><div id="ns-lineas"></div>' +
        '<p class="hint">Solo se indica qué y a dónde, sin propósito: Logística decide en GI-13 si cada línea se transfiere o se compra.</p>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="PR05.crear()">Enviar a Logística</button>'
    });
    PR05.pintarNuevas();
  },
  pintarNuevas() {
    const arts = M.ARTICULOS.filter(a => a.inv !== false && a.estado !== 'Inactivo').map(a => ({ v: a.cod, t: a.cod + ' · ' + a.nom }))
      .concat(M.recActivos(r => r.tipo === 'SERVICIO DE TERCEROS').map(r => ({ v: r.cod, t: r.cod + ' · ' + r.nom })));
    document.getElementById('ns-lineas').innerHTML = UI.tabla(['Artículo o servicio', ['Cantidad', 'num', '140px'], ['', '', '60px']], PR05.nuevas.map((l, i) =>
      '<tr><td><select id="ns-a' + i + '" style="width:100%">' + UI.opts(arts, l.art, '— Seleccione —') + '</select></td>' +
      '<td><input id="ns-c' + i + '" type="number" min="0" step="any" value="' + UI.esc(l.cant) + '" style="width:120px;text-align:right"></td>' +
      '<td>' + (PR05.nuevas.length > 1 ? '<button class="btn-link" onclick="PR05.leer();PR05.nuevas.splice(' + i + ',1);PR05.pintarNuevas()">Quitar</button>' : '') + '</td></tr>'), { estilo: 'margin:0' });
  },
  leer() { PR05.nuevas = PR05.nuevas.map((l, i) => ({ art: UI.v('ns-a' + i), cant: UI.v('ns-c' + i) })); },
  crear() {
    PR05.leer();
    const r = App.accion(() => Prod.crearSolicitud({ of: UI.v('ns-of'), destino: UI.v('ns-dest'), motivo: UI.v('ns-mot'), lineas: PR05.nuevas }), x => x.id + ' enviada a Logística');
    if (r) { UI.cerrar(); App.go('pr05', { id: r.id }); }
  },
  anular(id) {
    UI.confirmar('Anular ' + id, '<p>La solicitud deja de estar pendiente para Logística.</p>', () => { if (App.accion(() => Prod.anularSolicitud(id), id + ' anulada')) App.refrescar(); }, 'Anular');
  }
};
App.pantalla('pr05', {
  titulo: 'Solicitudes de materiales', render: PR05.render,
  miga: p => p.id ? '<a class="btn-link" onclick="App.go(\'pr05\')">Solicitudes de materiales</a> / <b>' + UI.esc(p.id) + '</b>' : '<b>Solicitudes de materiales</b>'
});
