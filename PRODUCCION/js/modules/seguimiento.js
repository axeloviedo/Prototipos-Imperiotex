/* PRODUCCION · PR-07 Plan de producción: lo que falta producir en órdenes abiertas */
const PR07 = {
  render() {
    const abiertas = Explosion.ordenar(BD.d.ofs.filter(o => Prod.abierta(o) && Prod.pendiente(o) > 0));
    const horas = {};
    abiertas.forEach(o => o.recs.forEach(r => { horas[r.cod] = UI.r2((horas[r.cod] || 0) + r.cons * Prod.pendiente(o)); }));
    return '<div class="screen-head"><h1>Plan de producción</h1><span class="code">PR-07</span></div>' +
      UI.tabla(['Orden', Prod.nombreRef(), 'Produce', ['Pendiente', 'num'], 'Estado'], abiertas.map(o => '<tr class="clickable" onclick="App.go(\'pr02\',{id:\'' + o.id + '\'})"><td><b>' + o.id + '</b></td><td>' + o.ref + '</td>' +
        '<td>' + UI.esc(M.nomArt(o.art)) + '</td><td class="num"><b>' + UI.q(Prod.pendiente(o), M.u(o.art)) + '</b></td><td>' + UI.estadoOF(o.estado) + '</td></tr>'), { vacio: 'Nada pendiente' }) +
      '<div class="sec">Horas necesarias por recurso</div>' +
      UI.tabla(['Recurso', ['Horas', 'num'], 'Operarios'], Object.keys(horas).map(cod => {
        const Rc = M.rec(cod) || {};
        return '<tr><td>' + UI.esc(Rc.nom || cod) + '</td><td class="num">' + UI.n(horas[cod], 1) + '</td><td class="mini">' + M.operarios().filter(o => o.rec === cod && o.activo).map(o => UI.esc(o.nom)).join(', ') + '</td></tr>';
      }), { vacio: 'Sin horas pendientes' });
  }
};
App.pantalla('pr07', { titulo: 'Plan de producción', render: PR07.render });
