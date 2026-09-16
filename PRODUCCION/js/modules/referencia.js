/* PRODUCCION · PR-04 Referencias: las órdenes que se crearon juntas, por fase */
const PR04 = {
  estado(ref) {
    const ofs = BD.d.ofs.filter(o => o.ref === ref && o.estado !== 'Cancelado');
    if (ofs.length && ofs.every(o => o.estado === 'Cerrado')) return ['Terminado', 'var(--completada)'];
    if (ofs.some(o => o.estado === 'Liberado' || o.prod > 0)) return ['En proceso', 'var(--prp)'];
    return ['Planificado', 'var(--borrador)'];
  },
  render(p) { return p.id ? PR04.detalle(p.id) : PR04.lista(); },
  lista() {
    const R = Prod.nombreRef();
    return '<div class="screen-head"><h1>Referencias</h1><span class="code">PR-04</span><div class="spacer"></div><button class="btn btn-secondary" onclick="PR04.renombrar()" title="Cómo se llama este campo en la empresa">✎ Nombre del campo: ' + UI.esc(R) + '</button></div>' +
      UI.tabla([R, 'Origen', 'Produce al final', ['Órdenes', 'num'], ['Adjuntos', 'num'], 'Estado', ['Acciones', '', '80px']], Explosion.refs().map(ref => {
        const ofs = BD.d.ofs.filter(o => o.ref === ref && o.estado !== 'Cancelado'), est = PR04.estado(ref), sf = ofs.find(o => o.sf);
        if (!ofs.length) return '';
        const sec = Explosion.secuencia(ofs), max = Math.max.apply(null, ofs.map(o => sec[o.id]));
        return '<tr><td><b>' + ref + '</b>' + '</td><td>' + (sf ? sf.sf : 'Producción') + '</td>' +
          '<td class="mini">' + ofs.filter(o => sec[o.id] === max).map(o => UI.esc(M.nomArt(o.art)) + ' ' + UI.n(o.prod, 0) + '/' + UI.n(o.cant, 0)).join('<br>') + '</td>' +
          '<td class="num">' + ofs.length + '</td><td class="num"><button class="btn-link" onclick="PR01.adjuntos(\'' + ref + '\')">📎 ' + Prod.adjuntosRef(ref).length + '</button></td><td>' + UI.badge(est[0], est[1]) + '</td>' +
          '<td><button class="btn btn-secondary btn-sm" onclick="App.go(\'pr04\',{id:\'' + ref + '\'})">👁 Ver</button></td></tr>';
      }).filter(Boolean));
  },
  /* el nombre del campo es un solo texto por empresa (N° Referencia, Lote, Campaña…): no necesita pantalla de configuración */
  renombrar() {
    UI.modal({
      titulo: 'Nombre del campo de referencia',
      cuerpo: UI.campo('Nombre', '<input id="ref-nom" value="' + UI.esc(Prod.nombreRef()) + '">', { req: true, hint: 'Solo cambia la etiqueta que se muestra en órdenes, referencias y reportes. En el sistema real es un parámetro de texto de la empresa, sin pantalla propia.' }),
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="PR04.guardarNombre()">Guardar</button>'
    });
  },
  guardarNombre() { if (App.accion(() => Prod.renombrarRef(UI.v('ref-nom')), 'Nombre guardado')) { UI.cerrar(); App.refrescar(); } },
  detalle(ref) {
    const R = Prod.nombreRef();
    const ofs = BD.d.ofs.filter(o => o.ref === ref);
    if (!ofs.length) return UI.aviso('No existe', 'err');
    const orden = Explosion.ordenar(ofs), sec = Explosion.secuencia(ofs), est = PR04.estado(ref), sf = ofs.find(o => o.sf);
    const fases = [...new Set(orden.map(o => sec[o.id]))];
    const color = { Planificado: 'var(--borrador)', Liberado: 'var(--prp)', Cerrado: 'var(--confirmado)', Cancelado: 'var(--cancelada)' };
    return '<div class="screen-head"><h1>' + UI.esc(R) + ' ' + ref + '</h1>' + UI.badge(est[0], est[1]) + (sf ? ' <span class="chip">' + sf.sf + '</span>' : '') +
      '<div class="spacer"></div><button class="btn btn-secondary" onclick="PR01.adjuntos(\'' + ref + '\')">📎 Adjuntos (' + Prod.adjuntosRef(ref).length + ')</button><button class="btn btn-secondary" onclick="App.go(\'pr04\')">Volver</button></div>' +
      '<div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;margin-bottom:14px">' + fases.map(fz =>
        '<div style="min-width:220px;flex:1"><div class="mini" style="text-align:center;margin-bottom:6px;font-weight:600">Fase ' + fz + '</div>' +
        orden.filter(o => sec[o.id] === fz).map(o => '<div class="card" style="padding:10px;margin-bottom:8px;cursor:pointer;border-left:4px solid var(--primario-claro)" onclick="App.go(\'pr02\',{id:\'' + o.id + '\'})">' +
          '<div style="font-weight:600;font-size:12.5px">' + UI.esc(M.nomArt(o.art)) + '</div><div class="mini">' + o.id + ' · ' + o.estado + '</div>' +
          '<div style="margin-top:6px">' + UI.barra(o.prod, o.cant) + ' <b>' + UI.n(o.prod, 0) + '/' + UI.n(o.cant, 0) + '</b></div></div>').join('') + '</div>').join('<div style="align-self:center;color:var(--texto-sec)">→</div>') + '</div>' +
      UI.tabla([['Fase', 'num', '60px'], 'Orden', 'Produce', 'Tipo', ['Recibido', 'num'], ['Costo unit.', 'num'], 'Estado', ['Acciones', '', '80px']], orden.map(o => '<tr><td class="num"><b>' + sec[o.id] + '</b></td><td><b>' + o.id + '</b></td>' +
        '<td>' + UI.esc(M.nomArt(o.art)) + '</td><td>' + PR01.tipo(o) + '</td><td class="num">' + UI.n(o.prod, 0) + ' / ' + UI.n(o.cant, 0) + '</td><td class="num">' + UI.s(Prod.costoUnit(o)) + '</td><td>' + UI.estadoOF(o.estado) + '</td>' +
        '<td><button class="btn btn-secondary btn-sm" onclick="App.go(\'pr02\',{id:\'' + o.id + '\'})">👁 Ver</button></td></tr>'));
  }
};
App.pantalla('pr04', {
  titulo: 'Referencias', render: PR04.render,
  miga: p => p.id ? '<a class="btn-link" onclick="App.go(\'pr04\')">Referencias</a> / <b>' + UI.esc(p.id) + '</b>' : '<b>Referencias</b>'
});
