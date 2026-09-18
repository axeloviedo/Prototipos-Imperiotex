/* Cambios y devoluciones con saldo a favor (2026-09-18, decisiones CD1–CD9 de docs/12-prototipo-diseno.md §13).
   Corre después de Demo.historia(): la caja de Tienda #1 en soles queda abierta. Cada prueba crea sus propias ventas. */
const T = (f, u) => { BD.reloj = f; UI.reloj = f; Store.fijarUsuario(u || 'USER12', false); };
const fin = () => { BD.reloj = null; UI.reloj = null; Store.fijarUsuario('USER12', false); Store.cfg().dineroDev = 'SALDO'; };
const ses = () => Caja.abierta('TDA-01', 'PEN');
const act = art => Stock.act('SB-TIENDA01', art);
const comp = art => BD.r4(Stock.act('SB-TIENDA01', art) - Stock.disp('SB-TIENDA01', art));
const pagada = (cli, lineas) => { T('31/07/2026 15:00', 'USER10'); const v = Demo.venta({ sede: 'TDA-01', cli, comp: 'BV', lineas, pagos: [{ met: 'EFE', monto: 'resto' }] }); T('31/07/2026 15:01', 'USER11'); Ventas.validarPago(v, v.pagos[0].id); return v; };
const x = (v, lineas, lleva) => ({ lineas, sustTipo: 'Nota de crédito', sustNum: 'BC01-000900', lleva: lleva ? Demo._llevar(v, lleva) : [] });

prueba('demo: los cinco casos quedan registrados con el flujo nuevo', () => {
  const devs = Store.d.devs.slice().reverse(), cambios = devs.filter(Dev.esCambio);
  igual(cambios.length, 3, 'cambios');
  igual(cambios.every(d => d.estado === 'Finalizada' && Store.venta(d.ventaCambio).estado === 'Registrada' && !!Store.venta(d.ventaCambio).salida), true, 'la venta de cada cambio está pagada y salió');
  igual(devs.filter(d => d.estado === 'Pendiente').length, 1, 'queda la devolución en mal estado Pendiente');
  igual(Saldo.de('CLI-000003', 'PEN'), 88, 'saldo a favor del mayorista (178 − 90)');
  igual(Saldo.de('CLI-000004', 'PEN'), 0, 'la clienta usó todo su saldo');
  igual(Store.d.ventas.some(v => v.reembolsos.some(r => r.estado === 'Pendiente' && r.origen !== 'Anulación')), false, 'ninguna devolución deja dinero por devolver en caja');
  igual(Store.d.stock.every(s => s.act > -0.0001 && s.comp > -0.0001), true, 'sin negativos');
});

prueba('cambio con diferencia a favor: sobra → saldo a favor, sin movimiento de caja; la Vendedora acepta', () => {
  try {
    const v = pagada('CLI-000001', [['PT-0003', 2]]);
    const saldo0 = Saldo.de('CLI-000001', 'PEN'), a3 = act('PT-0003'), a1 = act('PT-0001'), caja0 = Caja.resumen(ses()), pagos0 = JSON.stringify(v.pagos);
    T('31/07/2026 15:10', 'USER10');
    const d = Dev.aceptarNueva(v.id, x(v, [{ n: 1, cant: 2, tipo: 'Normal' }], [['PT-0001', 1]]));
    const nv = Store.venta(d.ventaCambio), r = Dev.resumen(v, Object.assign({}, d, { total: 0, llevaTotal: 0 }));
    igual([d.estado, d.total, d.llevaTotal], ['Finalizada', 249.8, 119.9], 'devolución');
    igual(UI.r2(Saldo.de('CLI-000001', 'PEN') - saldo0), 129.9, 'queda a favor');
    igual([act('PT-0003') - a3, act('PT-0001') - a1], [2, -1], 'stock: entra lo devuelto y sale lo que se lleva');
    igual([nv.comp, nv.pagos.length, nv.pagos[0].met, nv.pagos[0].estado, nv.pagos[0].caja, Ventas.estadoPago(nv), !!nv.salida, nv.cambioDe], ['BV', 1, 'SALDO', 'Validado', null, 'Pagado', true, d.id], 'venta nueva');
    igual(JSON.stringify(Store.venta(v.id).pagos), pagos0, 'los pagos originales no se tocan');
    igual([Ventas.estadoPago(Store.venta(v.id)), Ventas.deuda(Store.venta(v.id)), Ventas.porDevolver(Store.venta(v.id))], ['Pagado', 0, 0], 'venta original');
    const caja1 = Caja.resumen(ses());
    igual([caja1.cobros, caja1.esperado, caja1.devoluciones], [caja0.cobros, caja0.esperado, caja0.devoluciones], 'la caja no cambia');
    igual(r.credito, 0, 'nada más por acreditar');
  } finally { fin(); }
});

prueba('cambio con diferencia en contra: el cliente paga la diferencia en caja; el stock sale al validarla', () => {
  try {
    const v = pagada('CLI-000005', [['PT-0001', 1]]);
    const saldo0 = Saldo.de('CLI-000005', 'PEN'), c3 = comp('PT-0003'), a3 = act('PT-0003'), caja0 = Caja.resumen(ses());
    T('31/07/2026 15:20', 'USER10');
    falla(() => Dev.aceptarNueva(v.id, x(v, [{ n: 1, cant: 1, tipo: 'Normal' }], [['PT-0003', 1]])), 'Diferencia que paga el cliente');
    const d = Dev.aceptarNueva(v.id, x(v, [{ n: 1, cant: 1, tipo: 'Normal' }], [['PT-0003', 1]]), { met: 'EFE' });
    const nv = Store.venta(d.ventaCambio), dif = nv.pagos.find(p => p.met === 'EFE');
    igual([nv.pagos.length, nv.pagos[0].met, nv.pagos[0].monto, dif.monto, dif.estado, dif.caja], [2, 'SALDO', 119.9, 5, 'Por validar', ses().id], 'pagos de la venta nueva');
    igual([nv.salida, comp('PT-0003') - c3, Saldo.de('CLI-000005', 'PEN') - saldo0], [null, 1, 0], 'comprometido hasta validar; el saldo se usó completo');
    T('31/07/2026 15:25', 'USER11'); Ventas.validarPago(nv, dif.id);
    igual([!!nv.salida, comp('PT-0003') - c3, act('PT-0003') - a3], [true, 0, -1], 'validada la diferencia sale el stock');
    igual(UI.r2(Caja.resumen(ses()).cobros - caja0.cobros), 5, 'a la caja solo entra la diferencia');
  } finally { fin(); }
});

prueba('devolución sin «Se lleva»: todo queda como saldo a favor, nada por devolver en caja', () => {
  try {
    const v = pagada('CLI-000001', [['PT-0002', 1]]);
    const saldo0 = Saldo.de('CLI-000001', 'PEN'), a2 = act('PT-0002'), pend0 = Caja.reembolsosPendientes('TDA-01', 'PEN').length;
    T('31/07/2026 15:30', 'USER10');
    const d = Dev.crear(v.id, x(v, [{ n: 1, cant: 1, tipo: 'Normal' }]));
    igual([d.estado, Dev.tipo(d), Dev.dineroTxt(d)], ['Pendiente', 'Devolución', 'Al aceptar'], 'pendiente');
    T('31/07/2026 15:31', 'USER11');
    falla(() => Dev.finalizar(d), 'editar_devolucion_venta');
    T('31/07/2026 15:32', 'USER10'); Dev.finalizar(d);
    igual([UI.r2(Saldo.de('CLI-000001', 'PEN') - saldo0), act('PT-0002') - a2, Caja.reembolsosPendientes('TDA-01', 'PEN').length - pend0], [119.9, 1, 0], 'saldo, stock y caja');
    igual([Ventas.neto(v), Ventas.pagado(v), Ventas.estadoPago(v), Dev.dineroTxt(d)], [0, 0, 'Pagado', 'Saldo a favor S/ 119.90'], 'venta original');
    igual(Saldo.movs('CLI-000001', 'PEN')[0].origen, { doc: 'Devolución', id: d.id }, 'el abono sabe de dónde vino');
  } finally { fin(); }
});

prueba('uso del saldo en una venta futura: sin caja ni voucher; no se usa más de lo que hay', () => {
  try {
    T('31/07/2026 15:40', 'USER10');
    const hay = Saldo.de('CLI-000001', 'PEN'), caja0 = Caja.resumen(ses()).cobros;
    const b = Ventas.borrador('TDA-01'); b.cli = 'CLI-000001'; Demo._lineas(b, [['PT-0001', 1]]); b.comp = 'BV'; Precios.doc(b);
    b.pagos = [{ met: 'SALDO', monto: UI.r2(hay + 10) }];
    igual(Ventas.revisar(b).e.some(e => e.indexOf('no alcanza') >= 0), true, 'más que el saldo');
    b.pagos = [{ met: 'SALDO', monto: b.total }];
    const v = Ventas.registrar(b).venta;
    igual([v.pagos[0].estado, v.pagos[0].caja, !!v.salida, Ventas.estadoPago(v)], ['Validado', null, true, 'Pagado'], 'pagada con saldo, sale el stock');
    igual([UI.r2(hay - Saldo.de('CLI-000001', 'PEN')), Caja.resumen(ses()).cobros - caja0], [119.9, 0], 'baja el saldo, la caja no cambia');
    igual(Caja.cobros(ses()).some(c => c.p.met === 'SALDO'), false, 'el saldo nunca aparece como cobro de caja');
    igual(Saldo.movs('CLI-000001', 'PEN')[0].tipo + ' ' + Saldo.movs('CLI-000001', 'PEN')[0].origen.id, 'Uso ' + v.id, 'movimiento de uso');
  } finally { fin(); }
});

prueba('anulación de una venta pagada con saldo: el saldo vuelve y el efectivo queda por devolver en caja', () => {
  try {
    T('31/07/2026 15:50', 'USER10');
    Saldo.abonar('CLI-000005', 'PEN', 100, { doc: 'Prueba', id: 'P-1' });
    const s0 = Saldo.de('CLI-000005', 'PEN'), a2 = act('PT-0002');
    const v = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000005', comp: 'BV', lineas: [['PT-0002', 1]], pagos: [{ met: 'SALDO', monto: 100 }, { met: 'EFE', monto: 'resto' }] });
    T('31/07/2026 15:51', 'USER11'); Ventas.validarPago(v, v.pagos[1].id);
    igual([!!v.salida, UI.r2(s0 - Saldo.de('CLI-000005', 'PEN'))], [true, 100], 'pagada');
    T('31/07/2026 15:52', 'USER12'); Ventas.anular(v, 'Error de registro');
    const pend = v.reembolsos.filter(r => r.estado === 'Pendiente');
    igual([Saldo.de('CLI-000005', 'PEN'), pend.length, pend[0].monto, act('PT-0002') - a2, Ventas.porDevolver(v)], [s0, 1, 19.9, 0, 19.9], 'saldo devuelto, efectivo en caja, stock de vuelta');
  } finally { fin(); }
});

prueba('parámetro «Se devuelve en caja»: lo que sobra queda por devolver en caja; lo que paga el cambio sigue usando el crédito', () => {
  try {
    Store.cfg().dineroDev = 'CAJA';
    const v = pagada('CLI-000001', [['PT-0003', 2]]);
    const s0 = Saldo.de('CLI-000001', 'PEN');
    T('31/07/2026 16:00', 'USER10');
    const d = Dev.aceptarNueva(v.id, x(v, [{ n: 1, cant: 2, tipo: 'Normal' }], [['PT-0001', 1]]));
    const re = Dev.reembolso(d);
    igual([Saldo.de('CLI-000001', 'PEN') - s0, re.estado, re.monto, Store.venta(d.ventaCambio).pagos[0].met], [0, 'Pendiente', 129.9, 'SALDO'], 'sobra a caja');
    T('31/07/2026 16:05', 'USER11'); Caja.procesarReembolso(ses(), v.id, re.id, { met: 'EFE' });
    igual([Ventas.porDevolver(v), Ventas.estadoPago(v)], [0, 'Pagado'], 'devuelto');
  } finally { fin(); }
});

prueba('todo o nada: si la venta del cambio no se puede registrar, no queda nada a medias', () => {
  try {
    const v = pagada('CLI-000001', [['PT-0004', 1]]);
    T('31/07/2026 16:10', 'USER10');
    const antes = JSON.stringify(BD.d);
    falla(() => Dev.aceptarNueva(v.id, x(v, [{ n: 1, cant: 1, tipo: 'Normal' }], [['PT-0001', 999]]), { met: 'EFE' }), 'se necesitan 999');
    igual(JSON.stringify(BD.d) === antes, true, 'la base quedó igual');
    const d = Dev.crear(Store.venta(v.id).id, x(v, [{ n: 1, cant: 1, tipo: 'Normal' }], [['PT-0001', 999]]));
    const antes2 = JSON.stringify(BD.d);
    falla(() => Dev.finalizar(d, { met: 'EFE' }), 'se necesitan 999');
    igual([JSON.stringify(BD.d) === antes2, Store.dev(d.id).estado], [true, 'Pendiente'], 'la devolución sigue Pendiente y el stock no se movió');
  } finally { fin(); }
});

prueba('mal estado en un cambio: entra y pasa a liquidación; lo que se lleva sale de la tienda', () => {
  try {
    const v = pagada('CLI-000001', [['PT-0002', 1]]);
    const a2 = act('PT-0002'), l2 = Stock.act(Store.cfg().almMalEstado, 'PT-0002');
    T('31/07/2026 16:20', 'USER10');
    const d = Dev.aceptarNueva(v.id, x(v, [{ n: 1, cant: 1, tipo: 'Mal estado' }], [['PT-0002', 1]]));
    igual([act('PT-0002') - a2, Stock.act(Store.cfg().almMalEstado, 'PT-0002') - l2, d.trfs.length], [-1, 1, 1], 'liquidación y salida');
  } finally { fin(); }
});

prueba('bases guardadas antes: se completan el medio SALDO, el catálogo, el parámetro, la colección y el permiso del Vendedor', () => {
  const copia = JSON.stringify(BD.d);
  try {
    const c = BD.d.maestros.comercial;
    c.metodos = c.metodos.filter(m => m.cod !== 'SALDO');
    c.tiposDev = ['Normal', 'Mal estado', 'Cambio'];
    c.perfiles.Vendedor = c.perfiles.Vendedor.filter(p => p !== 'editar_devolucion_venta');
    BD.d.comercial.permsAgregados = ['recibir_transferencia'];
    delete BD.d.comercial.cfg.dineroDev; delete BD.d.saldos;
    Store.completarBase();
    igual([!!M.metodo('SALDO'), M.TIPOS_DEV, c.perfiles.Vendedor.indexOf('editar_devolucion_venta') >= 0, Store.cfg().dineroDev, BD.d.saldos], [true, ['Normal', 'Mal estado'], true, 'SALDO', []], 'completada');
    const v = Store.d.ventas.find(k => k.estado === 'Registrada' && k.salida && Dev.candidatas(k).some(c => c.max > 0));
    const n = Dev.candidatas(v).find(c => c.max > 0).n;
    igual(Dev._armar(v, { lineas: [{ n, cant: 1, tipo: 'Cambio' }], sustTipo: 'Nota de crédito', sustNum: 'X' }).lineas[0].tipo, 'Normal', 'el tipo «Cambio» guardado pasa a Normal');
  } finally { BD.d = JSON.parse(copia); }
});
