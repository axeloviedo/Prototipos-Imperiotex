/* PRODUCCION · PR-02 pestaña Materiales: detalle como la lista de materiales de GI-17 (Artículo inventariable / Recurso / Texto) */
const PRMAT = {
  num(v) { return String(UI.r4(v)); },
  render(of) {
    const ed = Prod.editable(of);
    const inp = (v, on) => '<input value="' + UI.esc(v) + '" onchange="' + on + '" style="width:90px;text-align:right;border:1px solid var(--borde);border-radius:5px;padding:4px 6px">';
    const sel = (tipo, i, campo, lista, v) => '<select onchange="PRMAT.cambiar(\'' + tipo + '\',' + i + ',\'' + campo + '\',this.value)" style="border:1px solid var(--borde);border-radius:5px;padding:4px">' + UI.opts(lista, v) + '</select>';
    const quitar = (tipo, i) => ed ? '<button class="btn-link" onclick="PRMAT.quitar(\'' + tipo + '\',' + i + ')">Eliminar</button>' : '';
    let n = 0;
    const filas = [];
    of.mats.forEach((m, i) => {
      const pend = UI.r4(Math.max(0, m.plan - m.consumido)), disp = Stock.disp(m.alm, m.cod), ped = Prod.pedido(of, m.cod, m.alm), falta = of.estado === 'Liberado' && !m.fab ? Prod.faltaPedir(of, m) : 0;
      const lo = m.fab ? Prod.ordenesDe(m.cod, of.ref)[0] : null;
      filas.push('<tr><td>' + (++n) + '</td><td>Artículo</td><td>' + m.cod + '</td>' +
        '<td>' + UI.esc(M.nomArt(m.cod)) + (lo ? '<br><span class="mini">lo produce <button class="btn-link" style="padding:0" onclick="App.go(\'pr02\',{id:\'' + lo.id + '\'})">' + lo.id + '</button></span>' : '') + '</td>' +
        '<td class="num">' + (ed ? inp(m.cons, 'PRMAT.cambiar(\'Artículo\',' + i + ',\'cons\',this.value)') : PRMAT.num(m.cons)) + '</td><td>' + m.u + '</td>' +
        '<td>' + (ed ? sel('Artículo', i, 'alm', M.almacenesDe(of.emp, m.alm).map(a => a.cod), m.alm) : '<span class="mini">' + m.alm + '</span>') + '</td>' +
        '<td>' + (ed ? sel('Artículo', i, 'metodo', ['Notificación', 'Manual'], m.metodo) : '<span class="mini">' + m.metodo + '</span>') + '</td>' +
        '<td class="num">' + UI.n(m.plan) + '</td><td class="num">' + UI.n(m.comp) + '</td>' +
        '<td class="num">' + (ped ? '<span title="Pedido a Logística y aún no llegado: al llegar se compromete para esta orden">' + UI.n(ped) + '</span>' : '<span class="mini">—</span>') + '</td>' +
        '<td class="num">' + (falta > 0 ? '<b class="err-t">' + UI.n(falta) + '</b>' : '<span class="mini">—</span>') + '</td>' +
        '<td class="num">' + UI.n(m.consumido) + '</td><td class="num">' + UI.n(pend) + '</td>' +
        '<td class="num">' + UI.n(disp) + '</td><td>' + quitar('Artículo', i) + '</td></tr>');
    });
    of.recs.forEach((r, i) => {
      const R = M.rec(r.cod) || {};
      filas.push('<tr><td>' + (++n) + '</td><td>Recurso</td><td>' + r.cod + '</td><td>' + UI.esc(R.nom || r.cod) + (Prod.esServicio(r.cod) ? '<br><span class="mini">servicio de terceros · costo estándar ' + UI.s(R.costo) + '</span>' : '') + '</td>' +
        '<td class="num">' + (ed ? inp(r.cons, 'PRMAT.cambiar(\'Recurso\',' + i + ',\'cons\',this.value)') : PRMAT.num(r.cons)) + '</td><td>' + (R.u || '') + '</td><td class="mini">—</td>' +
        '<td>' + (ed ? sel('Recurso', i, 'metodo', ['Notificación', 'Manual'], r.metodo) : '<span class="mini">' + r.metodo + '</span>') + '</td>' +
        '<td class="num">' + UI.n(r.plan) + '</td><td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">' + UI.n(r.real) + '</td><td class="num">' + UI.n(Math.max(0, r.plan - r.real)) + '</td><td class="num">—</td><td>' + quitar('Recurso', i) + '</td></tr>');
    });
    of.textos.forEach((t, i) => {
      filas.push('<tr><td>' + (++n) + '</td><td>Texto</td><td class="mini">—</td>' +
        '<td colspan="12">' + (ed ? '<input value="' + UI.esc(t) + '" placeholder="Texto / instrucción" onchange="PRMAT.cambiar(\'Texto\',' + i + ',\'txt\',this.value)" style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 7px">' : UI.esc(t)) + '</td><td>' + quitar('Texto', i) + '</td></tr>');
    });
    const porPedir = of.estado === 'Liberado' ? of.mats.filter(m => !m.fab && Prod.faltaPedir(of, m) > 0).length : 0;
    return '<div class="card" style="padding:12px 16px"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b style="font-size:13px">Detalle de la orden</b>' +
      '<span class="mini">' + (of.tipofab === 'Estándar' ? 'Estándar: lista de materiales sin cambios' : 'Especial: lista modificada') + (ed ? ' · al editar pasa a Especial' : '') +
      ' · Manual: se emite · Notificación: se consume al recibir</span><div style="flex:1"></div>' +
      (porPedir ? '<button class="btn btn-primary btn-sm" onclick="PRMAT.pedir()" title="Solicitud de materiales a Logística por lo que la orden aún no tiene comprometido ni pedido">Pedir a Logística lo que falta (' + porPedir + ')</button>' : '') +
      (ed ? '<button class="btn btn-secondary btn-sm" onclick="PRMAT.agregarArt()">+ Artículo</button><button class="btn btn-secondary btn-sm" onclick="PRMAT.agregarRec()">+ Recurso</button><button class="btn btn-secondary btn-sm" onclick="PRMAT.agregarTxt()">+ Texto</button>' : '') + '</div>' +
      (of.estado === 'Liberado' ? '<p class="hint" style="margin:8px 0 0"><b>Comprometido</b> = reservado para esta orden (solo lo que había en el almacén: el Disponible nunca queda negativo) · <b>Pedido</b> = solicitado a Logística y en camino: al llegar se compromete para esta orden · <b>Falta pedir</b> = lo que aún no está reservado ni pedido.</p>' : '') + '</div>' +
      UI.tabla([['#', '', '36px'], ['Tipo', '', '80px'], ['Código', '', '100px'], 'Componente / Descripción', ['Cantidad base', 'num'], 'Unidad', 'Almacén', 'Método', ['Planificada', 'num'], ['Comprometido', 'num'], ['Pedido', 'num'], ['Falta pedir', 'num'], ['Consumido', 'num'], ['Pendiente', 'num'], ['Disponible almacén', 'num'], ['', '', '70px']],
        filas, { vacio: ed ? 'Sin líneas: use "+ Artículo", "+ Recurso" o "+ Texto"' : 'Sin líneas' });
  },
  pedir() {
    const of = PR02.of();
    const r = App.accion(() => Prod.solicitarLoQueFalta(of), x => x.map(s => s.id).join(', ') + ' enviada a Logística: al llegar se compromete para la orden');
    if (r) App.refrescar();
  },
  agregarArt() { BUS.articulo('Agregar componente (inventariable)', a => a.inv !== false && a.cod !== PR02.of().art, cod => { const of = PR02.of(); App.accion(() => Prod.agregarLinea(of, { tipo: 'Artículo', cod }), 'Artículo agregado'); App.refrescar(); }); },
  agregarRec() { BUS.recurso('Agregar recurso', cod => { const of = PR02.of(); App.accion(() => Prod.agregarLinea(of, { tipo: 'Recurso', cod }), 'Recurso agregado'); App.refrescar(); }); },
  agregarTxt() { const of = PR02.of(); App.accion(() => Prod.agregarLinea(of, { tipo: 'Texto' })); App.refrescar(); },
  cambiar(tipo, i, campo, v) { const of = PR02.of(); App.accion(() => Prod.cambiarLinea(of, tipo, i, campo, v)); App.refrescar(); },
  quitar(tipo, i) { const of = PR02.of(); App.accion(() => Prod.quitarLinea(of, tipo, i), 'Línea eliminada'); App.refrescar(); }
};
PR02.registrarTab({ id: 'mat', orden: 1, titulo: 'Materiales', render: PRMAT.render });
