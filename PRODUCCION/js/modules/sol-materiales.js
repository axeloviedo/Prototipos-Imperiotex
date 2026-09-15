/* PRODUCCION · PR-05 Solicitudes de materiales: Producción indica qué necesita y a dónde (sin propósito);
   Logística revisa existencias y define el propósito POR LÍNEA: Transferencia (GI-11, con almacén de origen) o Compra (OC).
   Al llegar la compra se registra el ingreso (GI-09) o la conformidad del servicio. */
const EST_SOL = { Pendiente: 'var(--pendiente)', 'En proceso': 'var(--prp)', Atendida: 'var(--completada)', Anulada: 'var(--cancelada)' };
const PR05 = {
  f: 'abiertas', sel: '',
  lineas(s) {
    return s.lineas.map(l => UI.esc(Prod.nomItem(l.art)) + ' × ' + UI.q(l.cant, Prod.uItem(l.art)) +
      (l.prop ? '<br><span class="mini">' + l.prop + (l.origen ? ' desde ' + l.origen : '') + ' · ' + l.estado + (l.doc ? ' · ' + UI.esc(l.doc) : '') + '</span>' : '')).join('<br>');
  },
  render(p) {
    if (p.id) PR05.f = '';
    const abierta = s => s.estado === 'Pendiente' || s.estado === 'En proceso';
    const lista = Store.d.sols.filter(s => !PR05.f || (PR05.f === 'abiertas' ? abierta(s) : s.estado === PR05.f));
    const acciones = s => {
      if (s.estado === 'Pendiente') return '<button class="btn btn-primary btn-sm" onclick="PR05.atender(\'' + s.id + '\')">Atender (Logística)</button> <button class="btn btn-secondary btn-sm" onclick="PR05.anular(\'' + s.id + '\')">Anular</button>';
      const compra = s.lineas.filter(l => l.estado === 'En compra');
      return compra.length ? '<button class="btn btn-primary btn-sm" onclick="PR05.recibir(\'' + s.id + '\')">' + (compra.every(l => M.rec(l.art)) ? 'Conformidad' : 'Recibir compra') + '</button>' : '';
    };
    return '<div class="screen-head"><h1>Solicitudes de materiales</h1><span class="code">PR-05</span></div>' +
      '<div class="card"><div class="filters">' + UI.campo('Estado', '<select onchange="PR05.f=this.value;App.go(\'pr05\')">' +
        UI.opts([{ v: 'abiertas', t: 'Abiertas' }, { v: '', t: 'Todas' }, 'Pendiente', 'En proceso', 'Atendida', 'Anulada'], PR05.f) + '</select>') + '</div></div>' +
      UI.tabla(['Solicitud', 'Fecha', 'Orden', 'Destino', 'Artículos y propósito', 'Estado', ['Acciones', '', '200px']], lista.map(s =>
        '<tr' + (p.id === s.id ? ' style="background:#FFFBEB"' : '') + '><td><b>' + s.id + '</b><br><span class="mini">' + UI.esc(s.motivo) + '</span></td><td class="mini">' + s.fecha + '</td>' +
        '<td><button class="btn-link" style="padding:0" onclick="App.go(\'pr02\',{id:\'' + s.of + '\',tab:\'emi\'})">' + s.of + '</button><br><span class="mini">' + UI.esc(Prod.nombreRef()) + ' ' + s.ref + '</span></td>' +
        '<td class="mini">' + (s.destino || '—') + '</td><td>' + PR05.lineas(s) + '</td>' +
        '<td>' + UI.badge(s.estado, EST_SOL[s.estado]) + (s.ing ? '<br><button class="btn-link" style="padding:0" onclick="PR08.verMov(\'' + s.ing + '\')">' + s.ing + '</button>' : '') + '</td>' +
        '<td>' + acciones(s) + '</td></tr>'), { vacio: 'Sin solicitudes' }) +
      '<p class="hint">Producción indica qué necesita y a dónde. Logística revisa existencias y define el propósito de cada línea: Transferencia (GI-11 desde el almacén de origen) o Compra (OC); al llegar la compra se registra el ingreso (GI-09) o la conformidad del servicio.</p>';
  },
  atender(id) {
    const s = Store.d.sols.find(x => x.id === id); if (!s) return;
    PR05.sel = id;
    const filas = s.lineas.map((l, i) => {
      const serv = !!M.rec(l.art), ors = serv ? [] : Prod.origenes(l.art, s.destino), cubre = ors.find(o => o.act + 0.00005 >= l.cant);
      const prop = serv || !cubre ? 'Compra' : 'Transferencia';
      return '<tr><td>' + UI.esc(Prod.nomItem(l.art)) + '<br><span class="mini">' + l.art + '</span></td><td class="num"><b>' + UI.q(l.cant, Prod.uItem(l.art)) + '</b></td>' +
        '<td class="mini">' + (ors.map(o => o.cod + ': ' + UI.n(o.act)).join('<br>') || (serv ? 'servicio' : 'sin stock')) + '</td>' +
        '<td><select id="at-p' + i + '" onchange="PR05.cambio()">' + UI.opts(serv ? ['Compra'] : ['Transferencia', 'Compra'], prop) + '</select></td>' +
        '<td><select id="at-o' + i + '">' + UI.opts(ors.map(o => o.cod), cubre ? cubre.cod : (ors[0] || {}).cod, ors.length ? null : '—') + '</select></td></tr>';
    });
    UI.modal({
      lg: true, titulo: 'Atender ' + s.id + ' · Logística',
      cuerpo: '<p class="mini">Pedido por ' + UI.esc(s.solicita) + ' para ' + s.of + (s.destino ? ' · hacia ' + s.destino : '') + ' · ' + UI.esc(s.motivo) + '</p>' +
        UI.tabla(['Artículo', ['Cantidad', 'num'], 'Stock en otros almacenes', 'Propósito', 'Almacén origen'], filas) +
        '<div id="at-ocw" class="formgrid c3" style="margin-top:10px">' + UI.campo('N° de OC (líneas de Compra)', '<input id="at-oc" placeholder="OC-000000">', { req: true }) + '</div>' +
        '<p class="hint">Transferencia: se registra en GI-11 desde el almacén de origen. Compra: Compras emite la OC y, al llegar, se registra el ingreso o la conformidad del servicio.</p>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="PR05.guardar(\'' + id + '\')">Confirmar</button>'
    });
    PR05.cambio();
  },
  cambio() {
    const s = Store.d.sols.find(x => x.id === PR05.sel); if (!s) return;
    let compra = false;
    s.lineas.forEach((l, i) => { const p = UI.v('at-p' + i), o = document.getElementById('at-o' + i); if (o) o.disabled = p !== 'Transferencia'; if (p === 'Compra') compra = true; });
    const w = document.getElementById('at-ocw'); if (w) w.style.display = compra ? '' : 'none';
  },
  guardar(id) {
    const s = Store.d.sols.find(x => x.id === id); if (!s) return;
    const lineas = s.lineas.map((l, i) => ({ prop: UI.v('at-p' + i), origen: UI.v('at-p' + i) === 'Transferencia' ? UI.v('at-o' + i) : '' }));
    const r = App.accion(() => Prod.atenderSolicitud(id, { lineas, oc: UI.v('at-oc') }), x => id + ' · ' + Prod.resumenSol(x) + ' · ' + x.estado);
    if (r) { UI.cerrar(); App.refrescar(); }
  },
  recibir(id) {
    const s = Store.d.sols.find(x => x.id === id); if (!s) return;
    const lineas = s.lineas.filter(l => l.estado === 'En compra'), serv = lineas.every(l => M.rec(l.art));
    UI.confirmar((serv ? 'Conformidad del servicio · ' : 'Recibir compra · ') + s.id,
      '<p>' + (serv ? 'Se da conformidad al servicio comprado (sin movimiento de stock).' : 'Ingresa a ' + s.destino + ' lo comprado (GI-09).') + '</p><p class="mini">' +
      lineas.map(l => UI.esc(Prod.nomItem(l.art)) + ' × ' + UI.q(l.cant, Prod.uItem(l.art)) + ' · ' + UI.esc(l.doc)).join('<br>') + '</p>',
      () => { if (App.accion(() => Prod.recibirCompra(id), x => id + ' atendida' + (x.ing ? ' · ' + x.ing : ''))) App.refrescar(); }, serv ? 'Dar conformidad' : 'Registrar ingreso');
  },
  anular(id) {
    UI.confirmar('Anular ' + id, '<p>La solicitud deja de estar pendiente para Logística.</p>', () => { if (App.accion(() => Prod.anularSolicitud(id), id + ' anulada')) App.refrescar(); }, 'Anular');
  }
};
App.pantalla('pr05', {
  titulo: 'Solicitudes de materiales', render: PR05.render,
  miga: p => p.id ? '<a class="btn-link" onclick="App.go(\'pr05\')">Solicitudes de materiales</a> / <b>' + UI.esc(p.id) + '</b>' : '<b>Solicitudes de materiales</b>'
});
