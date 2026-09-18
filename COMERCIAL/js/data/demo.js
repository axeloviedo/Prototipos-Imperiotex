/* COMERCIAL — historia comercial de la demo sobre la BASE COMPARTIDA (docs/16_BASE_DATOS_COMPARTIDA.md).
   Demo.historia() YA NO crea el estado: parte de la base que exista (normalmente después de la historia de Producción, que deja el
   producto terminado Zuleika PT-0001..0004 en SB-CENTRAL) y registra la operación comercial con los mismos servicios que usan las pantallas
   (Stock compartido con modulo 'Comercial', Docs.trf para la reposición en dos pasos, Ventas, Caja, Dev). Sin DOM: la ejecuta el generador de escenario-operacion.js en node.
   Fechas fijas de julio 2026 posteriores al 25/07/2026 (BD.reloj y UI.reloj). No guarda nada por su cuenta salvo BD.guardar() al final. */
const Demo = {
  /* costo de referencia SOLO para la carga inicial (ING-INICIAL), si Producción todavía no dejó producto terminado (aConfirmar) */
  COSTO_REF: { 'PT-0001': 52.30, 'PT-0002': 53.10, 'PT-0003': 54.20, 'PT-0004': 54.20 },
  /* reposición de tiendas desde SB-CENTRAL y lo que compromete la venta mayorista en SB-CENTRAL (UM de inventario) */
  REPOSICION: {
    'SB-TIENDA01': { 'PT-0001': 8, 'PT-0002': 8, 'PT-0003': 6, 'PT-0004': 6 },
    'SB-TIENDA02': { 'PT-0001': 4, 'PT-0002': 4, 'PT-0003': 4, 'PT-0004': 4 }
  },
  /* reposición que queda APROBADA sin recibir al final de la historia: se ve como Pedido en la tienda y Comprometido en SB-CENTRAL */
  REPOSICION_PENDIENTE: { 'SB-TIENDA02': { 'PT-0001': 2, 'PT-0003': 2 } },
  MAYORISTA: { 'PT-0001': 12, 'PT-0002': 6, 'PT-0003': 6 },

  _ok(r) { if (!r || !r.ok) throw new Error('Demo comercial: ' + (r ? r.error : 'sin resultado')); return r.mov; },

  /* arma y registra una venta; o = {sede, cli, mon, cond, comp, lineas:[[art, cant, um, dcto, desc]], pagos:[{met, monto|'resto', banco, nop, voucher}], entrega, obs, cot} */
  venta(o) {
    const d = o.cot ? Ventas.desdeCotizacion(o.cot) : Ventas.borrador(o.sede);
    if (!o.cot) {
      d.cli = o.cli; d.mon = o.mon || 'PEN'; d.cond = o.cond || 'CONTADO';
      Demo._lineas(d, o.lineas);
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
    Demo._lineas(d, o.lineas);
    const c = Cot.crear(d);
    if (o.validez) Cot.cambiarCabecera(c, 'validez', o.validez);
    return c;
  },
  /* líneas de «Se lleva» de un cambio, con los precios de cualquier venta de la tienda y el cliente de la venta original */
  _llevar(v, lineas) { const d = Dev.borradorLleva(v, []); Demo._lineas(d, lineas); return d.lineas; },
  _lineas(d, lineas) {
    lineas.forEach(x => {
      Doc.agregar(d, x[0]);
      const i = d.lineas.length - 1;
      if (x[2]) Doc.cambiar(d, i, 'um', x[2]);
      Doc.cambiar(d, i, 'cant', x[1]);
      if (x[3]) Doc.cambiar(d, i, 'dcto', x[3]);
      if (x[4]) Doc.cambiar(d, i, 'desc', x[4]);
    });
  },

  /* registra la operación comercial sobre BD.d; devuelve un resumen */
  historia() {
    if (!BD.d) throw new Error('Demo comercial: inicie la base (BD.iniciar o BD.reiniciar) antes de la historia');
    Store.completarBase();
    const previo = Store._usuario;
    const T = (fecha, usuario) => { BD.reloj = fecha; UI.reloj = fecha; if (usuario) Store.fijarUsuario(usuario, false); };
    const CENTRAL = 'SB-CENTRAL';

    /* ---------- 0) producto terminado para vender: se usa el que dejó Producción en SB-CENTRAL ---------- */
    T('27/07/2026 08:30', 'USER12');
    const req = {};
    [Demo.REPOSICION, Demo.REPOSICION_PENDIENTE].forEach(R => Object.keys(R).forEach(alm => Object.keys(R[alm]).forEach(art => { req[art] = (req[art] || 0) + R[alm][art]; })));
    Object.keys(Demo.MAYORISTA).forEach(art => { req[art] = (req[art] || 0) + Demo.MAYORISTA[art]; });
    const falta = Object.keys(req).map(art => ({ art, cant: UI.r4(req[art] - Stock.disp(CENTRAL, art)) })).filter(x => x.cant > 0);
    if (falta.length) {
      /* solo si la base no trae producto terminado suficiente (p. ej. «Solo maestros» sin la historia de Producción) */
      Demo._ok(Stock.ingreso({
        tipoMov: 'ING-INICIAL', det: 'Ingreso - Carga inicial de stock', alm: CENTRAL, origen: 'Carga inicial de la demo comercial', ndoc: 'CARGA-DEMO-COMERCIAL', doc: 'Carga inicial', modulo: 'Comercial',
        obs: 'La base no tenía producto terminado suficiente de Producción para la demo comercial: se ingresa solo lo que falta (costo de referencia a confirmar)',
        lineas: falta.map(x => ({ art: x.art, cant: x.cant, costo: Demo.COSTO_REF[x.art] || 0 }))
      }));
    }

    /* ---------- 1) reposición de tiendas en DOS PASOS (Solicitud de Transferencia, decisiones T2/T7):
       27/07 se crea y aprueba (compromete en SB-CENTRAL y suma Pedido en la tienda) · 28/07 la tienda confirma la recepción (mueve el stock) ---------- */
    const reponer = (alm, q) => Docs.trf.crear({ origen: CENTRAL, destino: alm, tipoMov: 'TRF-REPTIENDA', obs: 'Reposición de ' + BD.almNom(alm) + ' · producto terminado Zuleika',
      lineas: Object.keys(q).map(art => ({ art, cant: q[art] })) });
    T('27/07/2026 09:00', 'USER12');
    const reposiciones = Object.keys(Demo.REPOSICION).map(alm => Docs.trf.aprobar(reponer(alm, Demo.REPOSICION[alm]).id).id);

    /* ---------- 2) cotizaciones ---------- */
    T('27/07/2026 10:00', 'USER10');
    Demo.cotizacion({ sede: 'TDA-01', cli: 'CLI-000003', lineas: [['PT-0001', 6], ['PT-0003', 6]], obs: 'Pedido para su boutique de Trujillo' });
    T('27/07/2026 11:00', 'USER10');
    const cE = Demo.cotizacion({ sede: 'TDA-01', cli: 'CLI-000004', lineas: [['PT-0003', 1]] });
    T('27/07/2026 11:30', 'USER12'); Cot.anular(cE, 'Cliente desistió de la compra');
    T('27/07/2026 16:00', 'USER15');
    Demo.cotizacion({ sede: 'TDA-02', cli: 'CLI-000004', lineas: [['PT-0001', 2]], obs: 'Precio especial de Tienda #2' });

    /* 28/07 las tiendas confirman la recepción de la reposición: recién ahí se mueve el stock (Transferencia TRF-REPTIENDA) */
    T('28/07/2026 09:30', 'USER12');
    reposiciones.forEach(id => Docs.trf.recibir(id));

    /* mayorista: cotización en docenas → venta al crédito con factura y envío por agencia (compromete stock en SB-CENTRAL) */
    T('28/07/2026 11:00', 'USER13');
    const cA = Demo.cotizacion({ sede: 'MAY-01', cli: 'CLI-000002', cond: 'CRED30', lineas: [['PT-0001', 1, 'DOC'], ['PT-0002', 6], ['PT-0003', 6]], obs: 'Campaña de fiestas patrias' });
    T('29/07/2026 16:00', 'USER13');
    const v5 = Demo.venta({ cot: cA.id, comp: 'FA', entrega: { lugar: 'AGENCIA', fecha: '31/07/2026', dir: 'Av. Balta 820', ubigeo: '140101', agencia: 'SHALOM', encNom: 'ROSA CHÁVEZ', encDoc: '41255887', encTel: '074 231 456' } });

    /* exportación en dólares (lista por tipo de cliente en USD): el stock no alcanza, la cotización solo avisa */
    T('29/07/2026 17:00', 'USER13');
    Demo.cotizacion({ sede: 'MAY-01', cli: 'CLI-000006', mon: 'USD', cond: 'CRED60', lineas: [['PT-0001', 100], ['PT-0002', 100]], obs: 'Precios FOB Callao · validez hasta fin de año', validez: '31/12/2026' });
    /* cotización vigente con un servicio personalizado */
    T('29/07/2026 18:00', 'USER10');
    Demo.cotizacion({ sede: 'TDA-01', cli: 'CLI-000001', lineas: [['PT-0001', 1], ['SERV-VTA-0001', 1, null, 0, 'Nombre "MAFE" en el bolsillo trasero']], validez: '30/10/2026' });

    /* ---------- 3) 30/07 · Tienda #1: caja completa (abrir, vender, validar = sale el stock, egreso y cierre con diferencia) ---------- */
    T('30/07/2026 09:00', 'USER11');
    const s1 = Caja.abrir('CJ-TDA01-PEN', 200);
    T('30/07/2026 10:15', 'USER10');
    const v1 = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000004', comp: 'BV', lineas: [['PT-0001', 1], ['SERV-VTA-0002', 1]], pagos: [{ met: 'EFE', monto: 'resto' }] });
    T('30/07/2026 10:20', 'USER11'); Ventas.validarPago(v1, v1.pagos[0].id);
    T('30/07/2026 12:30', 'USER10');
    const v2 = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000005', comp: 'BV', lineas: [['PT-0002', 1, null, 10]], pagos: [{ met: 'POS', banco: 'NIUBIZ', nop: '004512', voucher: 'voucher_pos_004512.jpg', monto: 'resto' }] });
    T('30/07/2026 12:40', 'USER11'); Ventas.validarPago(v2, v2.pagos[0].id);
    T('30/07/2026 15:10', 'USER10');
    const v3 = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000003', comp: 'FA', lineas: [['PT-0002', 3]], pagos: [{ met: 'TRF', banco: 'BCP', nop: '8812-3345', voucher: 'transferencia_bcp_8812.pdf', monto: 'resto' }] });
    T('30/07/2026 15:30', 'USER11'); Ventas.validarPago(v3, v3.pagos[0].id);
    T('30/07/2026 17:20', 'USER10');
    const v4 = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000001', comp: 'BV', lineas: [['PT-0004', 1]], pagos: [{ met: 'EFE', monto: 'resto' }] });
    T('30/07/2026 17:25', 'USER11'); Ventas.validarPago(v4, v4.pagos[0].id);
    T('30/07/2026 18:00', 'USER11'); Caja.movimiento(s1, { tipo: 'Egreso', cat: 'Útiles de oficina', desc: 'Rollo de papel para la ticketera', monto: 8 });
    T('30/07/2026 20:05', 'USER11'); Caja.cerrar(s1, UI.r2(Caja.resumen(s1).esperado - 2), 'Faltan S/ 2.00 de vuelto');

    /* ---------- 4) 31/07 · se abren las cajas ---------- */
    T('31/07/2026 09:00', 'USER14'); const sMay = Caja.abrir('CJ-MAY01-PEN', 100);
    T('31/07/2026 09:10', 'USER11'); const sTda = Caja.abrir('CJ-TDA01-PEN', 150);

    /* venta anulada sin pago confirmado: el pago por validar se anula y se libera lo comprometido */
    T('31/07/2026 09:40', 'USER10');
    const v6 = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000004', comp: 'BV', lineas: [['PT-0002', 2]], pagos: [{ met: 'EFE', monto: 'resto' }] });
    T('31/07/2026 09:50', 'USER12'); Ventas.anular(v6, 'Precio o cantidad equivocados');

    /* pago a cuenta de la venta mayorista, validado en la caja mayorista: es parcial, el stock sigue comprometido en SB-CENTRAL */
    T('31/07/2026 10:05', 'USER14');
    const p5 = Ventas.agregarPago(v5, { met: 'TRF', banco: 'BBVA', nop: 'BBVA-771204', voucher: 'transferencia_andina.pdf', monto: 1000 });
    T('31/07/2026 10:10', 'USER14'); Ventas.validarPago(v5, p5.id);

    /* ---------- cambios y devoluciones (2026-09-18, «solo cambios»): el dinero no sale de caja, queda como saldo a favor ----------
       Caso 1 · cambio de talla sin diferencia: la vendedora registra y acepta en el mostrador; la venta nueva se paga toda con
       saldo a favor y sale el stock en el acto (los pagos de la venta original no se tocan) */
    T('31/07/2026 10:30', 'USER10');
    Dev.aceptarNueva(v4.id, { lineas: [{ n: 1, cant: 1, tipo: 'Normal' }], sustTipo: 'Nota de crédito', sustNum: 'BC01-000034', obs: 'Talla equivocada: se cambia por la talla 28',
      lleva: Demo._llevar(v4, [['PT-0003', 1]]) });
    /* Caso 2 · cambio con diferencia en contra: la prenda nueva cuesta más; el cliente paga la diferencia con Yape (por validar en caja).
       Hasta que caja la valida, el stock de la venta nueva queda comprometido */
    T('31/07/2026 10:50', 'USER10');
    Dev.aceptarNueva(v2.id, { lineas: [{ n: 1, cant: 1, tipo: 'Normal' }], sustTipo: 'Nota de crédito', sustNum: 'BC01-000035', obs: 'Prefiere el modelo azul',
      lleva: Demo._llevar(v2, [['PT-0003', 1]]) }, { met: 'YAPE', nop: '930087', voucher: 'yape_930087.jpg' });
    const v2c = Store.venta(Store.d.devs[0].ventaCambio);
    T('31/07/2026 10:55', 'USER11'); Ventas.validarPago(v2c, v2c.pagos.find(p => p.estado === 'Por validar').id);

    /* venta de servicios al crédito (sin almacén ni stock; uno exonerado de IGV) */
    T('31/07/2026 11:20', 'USER10');
    Demo.venta({ sede: 'TDA-01', cli: 'CLI-000007', comp: 'FA', cond: 'CRED15', lineas: [['SERV-VTA-0001', 10, null, 0, 'Bordado "LA MODERNA" en la pretina'], ['SERV-VTA-0003', 10]] });

    /* devolución pendiente de la factura de ayer, que ya tuvo salida (mal estado → SB-LIQUID al finalizar) */
    T('31/07/2026 11:30', 'USER10');
    Dev.crear(v3.id, { lineas: [{ n: 1, cant: 1, tipo: 'Mal estado' }], sustTipo: 'Nota de crédito', sustNum: 'FC01-000021', obs: 'Costura abierta en 1 unidad' });

    /* Caso 3 · cambio con diferencia a favor: el mayorista devuelve 2 de la misma factura y se lleva 1 de otro modelo;
       lo que sobra queda como saldo a favor del cliente (no sale dinero de caja) */
    T('31/07/2026 11:40', 'USER10');
    Dev.aceptarNueva(v3.id, { lineas: [{ n: 1, cant: 2, tipo: 'Normal' }], sustTipo: 'Nota de crédito', sustNum: 'FC01-000022', obs: 'Se lleva una del modelo negro; el resto queda a cuenta',
      lleva: Demo._llevar(v3, [['PT-0004', 1]]) });
    /* Caso 4 · devolución sin «Se lleva»: todo lo pagado queda como saldo a favor. Se registra Pendiente y la acepta la supervisora */
    T('31/07/2026 11:50', 'USER10');
    const d4 = Dev.crear(v1.id, { lineas: [{ n: 1, cant: 1, tipo: 'Normal' }], sustTipo: 'Nota de crédito', sustNum: 'BC01-000036', obs: 'No le quedó; vuelve otro día a elegir' });
    T('31/07/2026 11:55', 'USER12'); Dev.finalizar(d4);
    /* Caso 5 · el cliente vuelve y usa su saldo a favor en una compra mayor: saldo + efectivo (el efectivo se valida en caja) */
    T('31/07/2026 13:20', 'USER10');
    const vS = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000004', comp: 'BV', lineas: [['PT-0001', 1], ['PT-0003', 1]], pagos: [{ met: 'SALDO', monto: Saldo.de('CLI-000004', 'PEN') }, { met: 'EFE', monto: 'resto' }] });
    T('31/07/2026 13:25', 'USER11'); Ventas.validarPago(vS, vS.pagos.find(p => p.estado === 'Por validar').id);

    /* venta mixta con dos medios de pago: el Yape queda por validar, así que el stock sigue comprometido en SB-TIENDA01 */
    T('31/07/2026 12:00', 'USER10');
    const v9 = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000005', comp: 'BV', lineas: [['PT-0001', 2], ['SERV-VTA-0002', 2]], pagos: [{ met: 'YAPE', nop: '930112', voucher: 'yape_930112.jpg', monto: 100 }, { met: 'EFE', monto: 'resto' }] });
    T('31/07/2026 12:05', 'USER11'); Ventas.validarPago(v9, v9.pagos[1].id);

    /* movimientos de caja chica */
    T('31/07/2026 12:30', 'USER11'); Caja.movimiento(sTda, { tipo: 'Ingreso', cat: 'Fondo de caja chica', desc: 'Reposición de sencillo para vuelto', monto: 50 });
    T('31/07/2026 12:45', 'USER11'); Caja.movimiento(sTda, { tipo: 'Egreso', cat: 'Pasajes y movilidad', desc: 'Movilidad para recojo de mercadería', monto: 12.5 });

    /* reposición aprobada que la tienda aún no recibe: Pedido en SB-TIENDA02, Comprometido en SB-CENTRAL */
    T('31/07/2026 13:00', 'USER12');
    Object.keys(Demo.REPOSICION_PENDIENTE).forEach(alm => Docs.trf.aprobar(reponer(alm, Demo.REPOSICION_PENDIENTE[alm]).id));

    Cot.barrer();
    BD.reloj = null; UI.reloj = null;
    Store.fijarUsuario(previo || M.USUARIOS[0].cod, false);
    BD.guardar();
    const d = BD.d;
    return { ajuste: falta, transferencias: (d.trfs || []).map(t => t.id + ' ' + t.estado), cotizaciones: d.cots.length, ventas: d.ventas.length, devoluciones: d.devs.map(x => x.id + ' ' + Dev.tipo(x) + ' ' + x.estado + ' ' + Dev.dineroTxt(x)),
      saldos: d.clientes.map(c => ({ cli: c.cod, saldo: Saldo.de(c.cod, 'PEN') })).filter(x => x.saldo > 0), cajas: d.sesiones.length, movimientosCaja: d.cmovs.length, cajaMayorista: sMay.id };
  }
};
