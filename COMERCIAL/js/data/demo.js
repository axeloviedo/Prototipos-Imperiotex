/* COMERCIAL V9 — escenario de demo (IMPERIOTEX). Las fechas son relativas al día en que se arma la demo,
   y todo se registra ejecutando los mismos servicios que usan las pantallas: stock, caja y saldos cuadran. */
const Demo = {
  VERSION: 3,
  clon(x) { return JSON.parse(JSON.stringify(x)); },

  /* arma y registra una venta; o = {sede, cli, mon, cond, comp, lineas:[[art, cant, um, dcto, desc]], pagos:[{met, monto|'resto', banco, nop, voucher}], entrega, obs, cot} */
  venta(o) {
    const d = o.cot ? Ventas.desdeCotizacion(o.cot) : Ventas.borrador(o.sede);
    if (!o.cot) {
      d.cli = o.cli; d.mon = o.mon || 'PEN'; d.cond = o.cond || 'CONTADO';
      o.lineas.forEach(x => {
        Doc.agregar(d, x[0]);
        const i = d.lineas.length - 1;
        if (x[2]) Doc.cambiar(d, i, 'um', x[2]);
        Doc.cambiar(d, i, 'cant', x[1]);
        if (x[3]) Doc.cambiar(d, i, 'dcto', x[3]);
        if (x[4]) Doc.cambiar(d, i, 'desc', x[4]);
      });
    }
    d.comp = o.comp;
    if (o.obs) d.obs = o.obs;
    if (o.entrega) Object.assign(d.entrega, o.entrega);
    Precios.doc(d);
    let resto = d.total;
    d.pagos = (o.pagos || []).map(p => { const monto = p.monto === 'resto' ? UI.r2(resto) : p.monto; resto = UI.r2(resto - monto); return Object.assign({}, p, { monto }); });
    return Ventas.registrar(d).venta;
  },
  cotizacion(o) {
    const d = Cot.borrador(o.sede);
    d.cli = o.cli; d.mon = o.mon || 'PEN'; d.cond = o.cond || 'CONTADO'; d.obs = o.obs || '';
    o.lineas.forEach(x => {
      Doc.agregar(d, x[0]);
      const i = d.lineas.length - 1;
      if (x[2]) Doc.cambiar(d, i, 'um', x[2]);
      Doc.cambiar(d, i, 'cant', x[1]);
      if (x[3]) Doc.cambiar(d, i, 'dcto', x[3]);
      if (x[4]) Doc.cambiar(d, i, 'desc', x[4]);
    });
    return Cot.crear(d);
  },

  crear() {
    UI.reloj = null;
    const H = UI.ahora();
    const T = (dias, hora, usuario) => { UI.reloj = UI.sumarDias(H, dias, hora); if (usuario) Store.d.usuario = usuario; };

    Store.d = {
      version: Demo.VERSION, empresa: 'IMPERIOTEX', usuario: 'USER12',
      seq: { cli: 9, cot: 41, ven: 226, dev: 11, pag: 801, caj: 57, mc: 311, ing: 540, sal: 420, ree: 21, lp: 1, c_NV01: 118, c_B001: 2305, c_F001: 412, c_NV02: 40, c_B002: 877, c_F002: 96, c_NV03: 12, c_B003: 150, c_F003: 733 },
      cfg: { igv: 18, tc: 3.76, diasValidez: 7, diasAnulacion: 3, verificarPrecioMin: true, almMalEstado: 'SB-ALM-REM', catIngreso: M.CAT_INGRESO.slice(), catEgreso: M.CAT_EGRESO.slice() },
      arts: Demo.clon(M.ARTICULOS),
      clientes: M.CLIENTES.map((c, i) => Object.assign({ alta: UI.sumarDias(H, -200 + i * 12, '10:00') }, Demo.clon(c))),
      listas: [], stock: [], movs: [], cots: [], ventas: [], devs: [], sesiones: [], cmovs: []
    };
    Store.d.listas = M.LISTAS.map(x => ({ id: Store.sig('lp', 'LP-', 4), art: x[0], um: x[1], sede: x[2], tipo: x[3], mon: x[4], precio: x[5] }));

    /* existencias iniciales de producto terminado (costo promedio de lo producido en PRODUCCION).
       Lo comprometido viene de transferencias aprobadas en GI-11 (T7): Comercial no compromete. */
    [['SB-ALM-PT', 'PT-0001', 120, 10, 52.30], ['SB-ALM-PT', 'PT-0002', 80, 0, 53.10], ['SB-ALM-PT', 'PT-0003', 60, 0, 54.20], ['SB-ALM-PT', 'PT-0004', 24, 0, 54.20],
     ['SB-ALM-PT', 'PT-0020', 40, 0, 71.80], ['SB-ALM-PT', 'PT-0021', 30, 0, 71.80], ['SB-ALM-PT', 'MERC-0001', 50, 0, 14.50],
     ['SB-TDA-01', 'PT-0001', 18, 0, 52.30], ['SB-TDA-01', 'PT-0002', 12, 0, 53.10], ['SB-TDA-01', 'PT-0003', 6, 2, 54.20], ['SB-TDA-01', 'PT-0004', 2, 0, 54.20],
     ['SB-TDA-01', 'PT-0020', 8, 0, 71.80], ['SB-TDA-01', 'PT-0021', 1, 0, 71.80], ['SB-TDA-01', 'MERC-0001', 15, 0, 14.50],
     ['SB-TDA-02', 'PT-0001', 10, 0, 52.30], ['SB-TDA-02', 'PT-0002', 9, 0, 53.10], ['SB-TDA-02', 'PT-0003', 5, 0, 54.20], ['SB-TDA-02', 'PT-0020', 4, 0, 71.80], ['SB-TDA-02', 'MERC-0001', 6, 0, 14.50]
    ].forEach(x => { const f = Stock.fila(x[0], x[1]); f.act = x[2]; f.comp = x[3]; f.costo = x[4]; });

    /* 1) cotización que vence sin respuesta · mayorista en tienda (precio por tienda y tipo de cliente) */
    T(-20, '10:00', 'USER10');
    Demo.cotizacion({ sede: 'TDA-01', cli: 'CLI-000003', lineas: [['PT-0020', 6], ['PT-0021', 6]], obs: 'Pedido para su boutique de Trujillo' });

    /* 2) cotización anulada */
    T(-8, '10:00', 'USER10');
    const cE = Demo.cotizacion({ sede: 'TDA-01', cli: 'CLI-000004', lineas: [['PT-0003', 1]] });
    T(-7, '09:30', 'USER12'); Cot.anular(cE, 'Cliente desistió de la compra');

    /* 3) mayorista: cotización en docenas → venta al crédito con factura y envío por agencia */
    T(-6, '11:00', 'USER13');
    const cA = Demo.cotizacion({ sede: 'MAY-01', cli: 'CLI-000002', cond: 'CRED30', lineas: [['PT-0001', 2, 'DOC'], ['PT-0002', 12], ['PT-0003', 12]], obs: 'Campaña de fiestas patrias' });
    T(-4, '16:00', 'USER13');
    const v5 = Demo.venta({ cot: cA.id, comp: 'FA', entrega: { lugar: 'AGENCIA', fecha: UI.sumarDias(UI.ahora(), 2).slice(0, 10), dir: 'Av. Balta 820', ubigeo: '140101', agencia: 'SHALOM', encNom: 'ROSA CHÁVEZ', encDoc: '41255887', encTel: '074 231 456' } });

    /* 4) exportación en dólares (lista por tipo de cliente en USD) · el stock no alcanza: la cotización solo avisa */
    T(-3, '11:00', 'USER13');
    Demo.cotizacion({ sede: 'MAY-01', cli: 'CLI-000006', mon: 'USD', cond: 'CRED60', lineas: [['PT-0001', 100], ['PT-0002', 100]], obs: 'Precios FOB Callao' });

    /* 5) cotización vigente con un servicio personalizado */
    T(-2, '15:00', 'USER10');
    Demo.cotizacion({ sede: 'TDA-01', cli: 'CLI-000001', lineas: [['PT-0001', 1], ['SERV-0001', 1, null, 0, 'Nombre "MAFE" en el bolsillo trasero']] });

    /* 6) ayer en Tienda Gamarra 1: caja completa (abrir, vender, validar, egreso y cierre con diferencia) */
    T(-1, '09:00', 'USER11');
    const s1 = Caja.abrir('CJ-TDA01-PEN', 200);
    T(-1, '10:15', 'USER10');
    const v1 = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000004', comp: 'BV', lineas: [['PT-0001', 1], ['MERC-0001', 1]], pagos: [{ met: 'EFE', monto: 'resto' }] });
    T(-1, '10:20', 'USER11'); Ventas.validarPago(v1, v1.pagos[0].id);
    T(-1, '12:30', 'USER10');
    const v2 = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000005', comp: 'BV', lineas: [['PT-0020', 1, null, 10]], pagos: [{ met: 'POS', banco: 'NIUBIZ', nop: '004512', voucher: 'voucher_pos_004512.jpg', monto: 'resto' }] });
    T(-1, '12:40', 'USER11'); Ventas.validarPago(v2, v2.pagos[0].id);
    T(-1, '15:10', 'USER10');
    const v3 = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000003', comp: 'FA', lineas: [['PT-0002', 6]], pagos: [{ met: 'TRF', banco: 'BCP', nop: '8812-3345', voucher: 'transferencia_bcp_8812.pdf', monto: 'resto' }] });
    T(-1, '15:30', 'USER11'); Ventas.validarPago(v3, v3.pagos[0].id);
    T(-1, '17:20', 'USER10');
    const v4 = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000001', comp: 'BV', lineas: [['PT-0004', 1]], pagos: [{ met: 'EFE', monto: 'resto' }] });
    T(-1, '17:25', 'USER11'); Ventas.validarPago(v4, v4.pagos[0].id);
    T(-1, '18:00', 'USER11'); Caja.movimiento(s1, { tipo: 'Egreso', cat: 'Útiles de oficina', desc: 'Rollo de papel para la ticketera', monto: 8 });
    T(-1, '20:05', 'USER11'); Caja.cerrar(s1, UI.r2(Caja.resumen(s1).esperado - 2), 'Faltan S/ 2.00 de vuelto');

    /* 7) hoy: se abren las cajas */
    T(0, '09:00', 'USER14'); const sMay = Caja.abrir('CJ-MAY01-PEN', 100);
    T(0, '09:10', 'USER11'); const sTda = Caja.abrir('CJ-TDA01-PEN', 150);

    /* 8) venta anulada el mismo día (el pago por validar se anula y el stock vuelve) */
    T(0, '09:40', 'USER10');
    const v6 = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000004', comp: 'BV', lineas: [['PT-0002', 2]], pagos: [{ met: 'EFE', monto: 'resto' }] });
    T(0, '09:50', 'USER12'); Ventas.anular(v6, 'Precio o cantidad equivocados');

    /* 9) pago a cuenta de la venta al crédito, por validar en la caja mayorista */
    T(0, '10:05', 'USER14');
    Ventas.agregarPago(v5, { met: 'TRF', banco: 'BBVA', nop: 'BBVA-771204', voucher: 'transferencia_andina.pdf', monto: 1000 });

    /* 10) cambio de prenda: devolución finalizada, dinero devuelto en caja y nueva venta */
    T(0, '10:30', 'USER10');
    const d1 = Dev.crear(v4.id, { lineas: [{ n: 1, cant: 1, tipo: 'Cambio' }], sustTipo: 'Nota de crédito', sustNum: 'BC01-000034', obs: 'Talla equivocada: se cambia por la talla 28' });
    T(0, '10:35', 'USER12'); Dev.finalizar(d1);
    T(0, '10:40', 'USER11'); Caja.procesarReembolso(sTda, v4.id, d1.reembolso, { met: 'EFE' });
    T(0, '10:45', 'USER10');
    const v7 = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000001', comp: 'BV', lineas: [['PT-0003', 1]], pagos: [{ met: 'EFE', monto: 'resto' }], obs: 'Cambio de ' + d1.id });
    T(0, '10:50', 'USER11'); Ventas.validarPago(v7, v7.pagos[0].id);

    /* 11) venta de servicios al crédito (sin almacén ni stock; uno exonerado de IGV) */
    T(0, '11:20', 'USER10');
    Demo.venta({ sede: 'TDA-01', cli: 'CLI-000007', comp: 'FA', cond: 'CRED15', lineas: [['SERV-0001', 10, null, 0, 'Bordado "LA MODERNA" en la pretina'], ['SERV-0003', 10]] });

    /* 12) devolución pendiente de la venta mayorista (mal estado → almacén de remate al finalizar) */
    T(0, '11:30', 'USER13');
    Dev.crear(v5.id, { lineas: [{ n: 3, cant: 2, tipo: 'Mal estado' }], sustTipo: 'Nota de crédito', sustNum: 'FC03-000021', obs: 'Costura abierta en 2 unidades' });

    /* 13) venta mixta con dos medios de pago: el Yape queda por validar */
    T(0, '12:00', 'USER10');
    const v9 = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000005', comp: 'BV', lineas: [['PT-0001', 2], ['SERV-0002', 2]], pagos: [{ met: 'YAPE', nop: '930112', voucher: 'yape_930112.jpg', monto: 100 }, { met: 'EFE', monto: 'resto' }] });
    T(0, '12:05', 'USER11'); Ventas.validarPago(v9, v9.pagos[1].id);

    /* 14) movimientos de caja chica */
    T(0, '12:30', 'USER11'); Caja.movimiento(sTda, { tipo: 'Ingreso', cat: 'Fondo de caja chica', desc: 'Reposición de sencillo para vuelto', monto: 50 });
    T(0, '12:45', 'USER11'); Caja.movimiento(sTda, { tipo: 'Egreso', cat: 'Pasajes y movilidad', desc: 'Movilidad para recojo de mercadería', monto: 12.5 });

    UI.reloj = null;
    Store.d.usuario = 'USER12';
    Cot.barrer();
    return Store.d;
  }
};
