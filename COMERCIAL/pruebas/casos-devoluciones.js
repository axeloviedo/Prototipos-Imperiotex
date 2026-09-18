/* Devolución = nota de crédito por ítem + crédito del cliente (2026-09-18, decisiones DV1–DV6 de docs/12-prototipo-diseno.md §14).
   Corre después de Demo.historia(): la caja de Tienda #1 en soles queda abierta. Cada prueba crea sus propias ventas. */
const T = (f, u) => { BD.reloj = f; UI.reloj = f; Store.fijarUsuario(u || 'USER12', false); };
const fin = () => { BD.reloj = null; UI.reloj = null; Store.fijarUsuario('USER12', false); };
const ses = () => Caja.abierta('TDA-01', 'PEN');
const act = art => Stock.act('SB-TIENDA01', art);
const NC = M.SALDO;
const pagada = (cli, lineas) => { T('31/07/2026 15:00', 'USER10'); const v = Demo.venta({ sede: 'TDA-01', cli, comp: 'BV', lineas, pagos: [{ met: 'EFE', monto: 'resto' }] }); T('31/07/2026 15:01', 'USER11'); Ventas.validarPago(v, v.pagos[0].id); return v; };
const nota = (lineas, num) => ({ lineas, sustTipo: 'Nota de crédito', sustNum: num || 'BC01-000900', obs: 'Prueba' });
const nueva = (cli, lineas, pagos) => Demo.venta({ sede: 'TDA-01', cli, comp: 'BV', lineas, pagos });

prueba('demo: cuatro notas de crédito registradas y los tres escenarios del producto nuevo', () => {
  const devs = Store.d.devs;
  igual([devs.length, devs.every(d => d.estado === 'Registrada' && d.movs.length === 1)], [4, true], 'devoluciones');
  igual(Saldo.de('CLI-000001', 'PEN'), 0, 'caso 1: la nota pagó toda la boleta nueva');
  igual(Saldo.de('CLI-000005', 'PEN'), 0, 'caso 2: la nota pagó una parte');
  igual(Saldo.de('CLI-000003', 'PEN'), 0, 'caso 3: la diferencia se devolvió en caja');
  igual(Saldo.de('CLI-000004', 'PEN'), 0, 'caso 5: la clienta usó su crédito');
  igual(Store.d.cmovs.filter(m => m.tipo === 'Devolución' && m.estado !== 'Anulado').map(m => m.monto), [88], 'solo el caso 3 devolvió dinero en caja');
  igual(Store.d.stock.every(s => s.act > -0.0001 && s.comp > -0.0001), true, 'sin negativos');
});

prueba('registrar = un solo paso: entra el stock, la boleta original no cambia y el cliente queda con crédito', () => {
  try {
    const v = pagada('CLI-000001', [['PT-0004', 3]]);
    const a3 = act('PT-0004'), c0 = Saldo.de('CLI-000001', 'PEN'), pagos0 = JSON.stringify(v.pagos), caja0 = Caja.resumen(ses());
    T('31/07/2026 15:05', 'USER10');
    falla(() => Dev.crear(v.id, Object.assign(nota([{ n: 1, cant: 1 }]), { sustNum: '' })), 'N° de la nota de crédito');
    falla(() => Dev.crear(v.id, Object.assign(nota([{ n: 1, cant: 1 }]), { obs: '' })), 'motivo');
    falla(() => Dev.crear(v.id, nota([{ n: 1, cant: 4 }])), 'hasta 3');
    const d = Dev.crear(v.id, nota([{ n: 1, cant: 1 }]));
    igual([d.estado, d.total, d.credito, act('PT-0004') - a3, UI.r2(Saldo.de('CLI-000001', 'PEN') - c0)], ['Registrada', 124.9, 124.9, 1, 124.9], 'efecto');
    igual([v.estado, JSON.stringify(v.pagos) === pagos0, Ventas.neto(v), Ventas.estadoPago(v)], ['Registrada', true, 249.8, 'Pagado'], 'la boleta sigue con las otras dos prendas');
    igual(Caja.resumen(ses()).esperado, caja0.esperado, 'la caja no se mueve');
    igual(Dev.candidatas(v)[0].max, 2, 'se puede devolver lo que queda');
  } finally { fin(); }
});

prueba('mismo valor: la nota paga toda la boleta nueva; la caja no se mueve', () => {
  try {
    const v = pagada('CLI-000001', [['PT-0001', 1]]);
    T('31/07/2026 15:10', 'USER10');
    Dev.crear(v.id, nota([{ n: 1, cant: 1 }]));
    const caja0 = Caja.resumen(ses()), c0 = Saldo.de('CLI-000001', 'PEN');
    const n = nueva('CLI-000001', [['PT-0002', 1]], [{ met: NC, monto: 'resto' }]);
    igual([n.pagos[0].met, n.pagos[0].estado, n.pagos[0].caja, !!n.salida, Ventas.estadoPago(n)], [NC, 'Validado', null, true, 'Pagado'], 'boleta nueva');
    igual([UI.r2(c0 - Saldo.de('CLI-000001', 'PEN')), Caja.resumen(ses()).cobros - caja0.cobros], [119.9, 0], 'usa el crédito, caja en cero');
    igual(Caja.cobros(ses()).some(c => c.p.met === NC), false, 'la nota nunca es un cobro de caja');
  } finally { fin(); }
});

prueba('mayor valor: la nota paga una parte y el cliente paga la diferencia en caja', () => {
  try {
    const v = pagada('CLI-000005', [['PT-0001', 1]]);
    T('31/07/2026 15:20', 'USER10');
    Dev.crear(v.id, nota([{ n: 1, cant: 1 }]));
    const caja0 = Caja.resumen(ses()).cobros, cred = Saldo.de('CLI-000005', 'PEN');
    const b = Ventas.borrador('TDA-01'); b.cli = 'CLI-000005'; Demo._lineas(b, [['PT-0003', 1]]); b.comp = 'BV'; Precios.doc(b);
    b.pagos = [{ met: NC, monto: UI.r2(cred + 1) }];
    igual(Ventas.revisar(b).e.some(e => e.indexOf('no alcanza') >= 0), true, 'no se usa más crédito del que hay');
    const n = nueva('CLI-000005', [['PT-0003', 1]], [{ met: NC, monto: cred }, { met: 'EFE', monto: 'resto' }]);
    const dif = n.pagos.find(p => p.met === 'EFE');
    igual([n.salida, dif.estado, dif.monto], [null, 'Por validar', UI.r2(n.total - cred)], 'la diferencia queda por validar; el stock comprometido');
    T('31/07/2026 15:25', 'USER11'); Ventas.validarPago(n, dif.id);
    igual([!!n.salida, UI.r2(Caja.resumen(ses()).cobros - caja0), Saldo.de('CLI-000005', 'PEN')], [true, dif.monto, 0], 'a la caja solo entra la diferencia');
  } finally { fin(); }
});

prueba('menor valor: la nota paga la boleta nueva y la diferencia se devuelve en caja', () => {
  try {
    const v = pagada('CLI-000004', [['PT-0004', 1]]); /* cliente sin otro crédito: lo que sobra es solo de esta nota */
    T('31/07/2026 15:30', 'USER10');
    const s0 = Saldo.de('CLI-000004', 'PEN'), d = Dev.crear(v.id, nota([{ n: 1, cant: 1 }]));
    const b = Ventas.borrador('TDA-01'); b.cli = 'CLI-000004'; Demo._lineas(b, [['SERV-VTA-0002', 1]]); b.comp = 'BV'; Precios.doc(b);
    b.pagos = [{ met: NC, monto: b.total }];
    const n = Ventas.registrar(b).venta;
    const sobra = UI.r2(d.credito - n.total), esp0 = Caja.resumen(ses()).esperado;
    igual(Dev.porDevolverCaja(d), sobra, 'lo que sobra');
    T('31/07/2026 15:31', 'USER10');
    falla(() => Dev.devolverEnCaja(d, sobra, { met: 'EFE' }), 'crear_caja');
    T('31/07/2026 15:32', 'USER11');
    falla(() => Dev.devolverEnCaja(d, sobra + 1, { met: 'EFE' }), 'hasta');
    const mc = Dev.devolverEnCaja(d, sobra, { met: 'EFE' });
    igual([mc.tipo, mc.monto, UI.r2(esp0 - Caja.resumen(ses()).esperado), UI.r2(Saldo.de('CLI-000004', 'PEN') - s0), Dev.porDevolverCaja(d)], ['Devolución', sobra, sobra, 0, 0], 'sale de caja y el crédito queda en cero');
    igual(Dev.dineroTxt(d), 'Crédito S/ 124.90 · devuelto en caja ' + UI.m(sobra, 'PEN'), 'texto del listado');
  } finally { fin(); }
});

prueba('devolución sin producto nuevo: el crédito queda como vale y se puede usar después o devolver en caja', () => {
  try {
    const v = pagada('CLI-000001', [['PT-0002', 1]]);
    T('31/07/2026 15:40', 'USER10');
    const s0 = Saldo.de('CLI-000001', 'PEN'), d = Dev.crear(v.id, nota([{ n: 1, cant: 1 }]));
    igual([UI.r2(Saldo.de('CLI-000001', 'PEN') - s0), Dev.porDevolverCaja(d)], [119.9, 119.9], 'vale');
    T('31/07/2026 15:41', 'USER11'); Dev.devolverEnCaja(d, 19.9, { met: 'EFE' });
    igual([UI.r2(Saldo.de('CLI-000001', 'PEN') - s0), Dev.porDevolverCaja(d)], [100, 100], 'devolución parcial en caja');
  } finally { fin(); }
});

prueba('la venta con saldo por cobrar: primero se descuenta de lo que debe; solo lo pagado es crédito', () => {
  try {
    T('31/07/2026 15:50', 'USER10');
    const v = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000002', comp: 'FA', cond: 'CRED30', lineas: [['PT-0001', 2]], entrega: { lugar: 'RECOJO' }, pagos: [{ met: 'EFE', monto: 50 }] });
    Ventas.entregar(v);
    T('31/07/2026 15:51', 'USER11'); Ventas.validarPago(v, v.pagos[0].id);
    const deuda0 = Ventas.deuda(v);
    T('31/07/2026 15:52', 'USER10');
    const d = Dev.crear(v.id, Object.assign(nota([{ n: 1, cant: 1 }]), { sustNum: 'FC01-000900' }));
    igual([d.credito, Ventas.deuda(v)], [0, UI.r2(deuda0 - d.total)], 'baja la deuda, no hay crédito');
  } finally { fin(); }
});

prueba('anular una venta pagada con nota de crédito: el crédito vuelve y el efectivo queda por devolver en caja', () => {
  try {
    T('31/07/2026 16:00', 'USER10');
    Saldo.abonar('CLI-000005', 'PEN', 100, { doc: 'Prueba', id: 'P-1' });
    const s0 = Saldo.de('CLI-000005', 'PEN'), a2 = act('PT-0002');
    const v = nueva('CLI-000005', [['PT-0002', 1]], [{ met: NC, monto: 100 }, { met: 'EFE', monto: 'resto' }]);
    T('31/07/2026 16:01', 'USER11'); Ventas.validarPago(v, v.pagos[1].id);
    T('31/07/2026 16:02', 'USER12'); Ventas.anular(v, 'Error de registro');
    const pend = v.reembolsos.filter(r => r.estado === 'Pendiente');
    igual([Saldo.de('CLI-000005', 'PEN'), pend.length, pend[0].monto, act('PT-0002') - a2], [s0, 1, UI.r2(v.total - 100), 0], 'crédito devuelto, efectivo en caja, stock de vuelta');
  } finally { fin(); }
});

prueba('plazos: la baja (anular) hasta 7 días; la nota de crédito hasta 12 meses', () => {
  try {
    const v = pagada('CLI-000001', [['PT-0001', 1]]);
    igual([Store.cfg().diasAnulacion, v.plazoAnular, Dev.plazo(v)], [7, '07/08/2026', '31/07/2027'], 'plazos');
    T('01/08/2027 10:00', 'USER10');
    falla(() => Dev.crear(v.id, nota([{ n: 1, cant: 1 }])), '12 meses');
  } finally { fin(); }
});

prueba('bases guardadas antes: se agrega el medio «Nota de crédito» y la colección; una devolución Pendiente se registra igual', () => {
  const copia = JSON.stringify(BD.d);
  try {
    const c = BD.d.maestros.comercial;
    c.metodos = c.metodos.filter(m => m.cod !== NC);
    delete BD.d.saldos;
    Store.completarBase();
    igual([!!M.metodo(NC), M.metodo(NC).nom, BD.d.saldos], [true, 'Nota de crédito', []], 'completada');
    const v = pagada('CLI-000001', [['PT-0001', 1]]);
    const d = { id: 'DEV-VIEJA', emp: 'SB', fecha: v.fecha, venta: v.id, sede: v.sede, sedeNom: v.sedeNom, cliente: v.cliente, mon: v.mon, estado: 'Pendiente', usuario: 'X', movs: [], reembolso: null, hist: [],
      lineas: [{ n: 1, cant: 1, tipo: 'Cambio' }], sustTipo: 'Nota de crédito', sustNum: 'BC01-1', obs: '' };
    Store.d.devs.unshift(d);
    T('31/07/2026 16:10', 'USER10'); Dev.finalizar(d);
    igual([d.estado, d.credito, d.movs.length], ['Registrada', 119.9, 1], 'registrada con el mismo efecto');
  } finally { BD.d = JSON.parse(copia); fin(); }
});
