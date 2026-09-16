/* PRODUCCION · Producción — escenario de demo (datos de IMPERIOTEX).
   Se arma ejecutando los mismos servicios que usan las pantallas, así el stock y los costos cuadran. */
const Demo = {
  VERSION: 12,
  AVIOS: ['MP-0044', 'MP-0055', 'MP-0063', 'MP-0061', 'MP-0064'],
  _t(txt) { UI.reloj = txt; },
  /* recursos Manual de una emisión: las horas se reparten entre (hasta) dos operarios del recurso */
  _recursos(of, cant) {
    const recs = {};
    of.recs.forEach((r, i) => {
      if (r.metodo === 'Notificación') return;
      const horas = UI.r4(r.cons * cant), ops = Store.d.operarios.filter(o => o.rec === r.cod && o.activo).slice(0, 2);
      if (!ops.length) { recs[i] = { cant: horas }; return; }
      const parte = UI.r2(horas / ops.length);
      recs[i] = { operarios: ops.map((o, k) => ({ ope: o.cod, horas: k < ops.length - 1 ? parte : UI.r4(horas - parte * (ops.length - 1)) })) };
    });
    return recs;
  },
  /* libera, emite (líneas Manual con operarios) y recibe (consume lo Notificación); o = {emitir:[], recibir:[], reales, tercero, cerrar} */
  _producir(of, fecha, o) {
    o = o || {};
    Demo._t(fecha);
    if (of.estado === 'Planificado') Prod.liberar(of);
    const em = o.emitir || [of.cant], rc = o.recibir || em, n = Math.max(em.length, rc.length);
    for (let k = 0; k < n; k++) {
      const dia = k === 0 ? fecha : UI.sumarDias(fecha, k, '08:00');
      if (em[k]) {
        Demo._t(dia);
        if (o.tercero) Prod.enviarProveedor(of, { cant: em[k] });
        const mats = {};
        of.mats.forEach((m, i) => { if (m.metodo !== 'Notificación') mats[i] = k === 0 && o.reales && o.reales['m' + i] != null ? o.reales['m' + i] : UI.r4(m.cons * em[k]); });
        Prod.emitir(of, { mats, recs: Demo._recursos(of, em[k]) });
      }
      if (rc[k]) { Demo._t(UI.sumarDias(dia, 0, '17:30')); Prod.recibir(of, { cant: rc[k] }); }
    }
    if (o.cerrar) { Demo._t(UI.sumarDias(fecha, n - 1, '18:00')); Prod.cerrar(of); }
  },

  crear() {
    Store.d = {
      version: Demo.VERSION, usuario: 'USER05 · Producción', empresa: 'IMPERIOTEX',
      seq: { of: 121, ref: 156, ing: 521, sal: 401, trf: 221, gre: 88, sol: 31, fall: 1, inc: 1 },
      cfg: { nombreRef: 'N° Referencia' },
      stock: [], movs: [], ofs: [], sfs: [], sols: [],
      operarios: JSON.parse(JSON.stringify(M.OPERARIOS)),
      recursos: JSON.parse(JSON.stringify(M.RECURSOS)),
      tiposRecurso: JSON.parse(JSON.stringify(M.TIPOS_RECURSO))
    };
    [['SB-ALM-MPT', 'MP-0012', 640, 19.10], ['SB-ALM-MPA', 'MP-0031', 300000, 0.0017], ['SB-ALM-MPA', 'MP-0046', 900, 0.85],
     ['SB-ALM-MPA', 'MP-0071', 500, 0.05], ['SB-ALM-MPA', 'MP-0072', 400, 0.05], ['SB-ALM-MPA', 'MP-0044', 1200, 0.35],
     ['SB-ALM-MPA', 'MP-0055', 900, 0.60], ['SB-ALM-MPA', 'MP-0061', 1000, 0.25], ['SB-ALM-MPA', 'MP-0063', 1000, 0.18],
     ['SB-ALM-MPA', 'MP-0064', 1500, 0.12], ['SB-ALM-FAB', 'MP-0044', 120, 0.35], ['SB-ALM-FAB', 'MP-0055', 120, 0.60],
     ['SB-ALM-FAB', 'MP-0061', 120, 0.25], ['SB-ALM-FAB', 'MP-0063', 120, 0.18], ['SB-ALM-FAB', 'MP-0064', 120, 0.12],
     ['SB-ALM-PT', 'PT-0001', 40, 52.30], ['SB-ALM-PT', 'PT-0002', 12, 53.10]
    ].forEach(x => { const f = Stock.fila(x[0], x[1]); f.act = x[2]; f.costo = x[3]; });

    const L = (a, c, l) => ({ art: a, cant: c, tipofab: 'Estándar', ldm: l });
    Store.d.sfs = [
      { id: 'SF-000008', fecha: '08/07/2026', mes: 'Set 2026', solic: 'Comercial 01', almDestino: 'SB-ALM-PT', fechaReq: '30/08/2026', est: 'Aprobada', firmas: 'V°B° Logística 09/07/2026 · Gerencia 10/07/2026', obs: 'Campaña de setiembre: colores base.', lineas: [L('PT-0001', 40, 'LDM-0001'), L('PT-0002', 30, 'LDM-0002'), L('PT-0003', 30, 'LDM-0005')], ofs: [], ref: '' },
      { id: 'SF-000003', fecha: '11/06/2026', mes: 'Ago 2026', solic: 'Comercial 02', almDestino: 'SB-ALM-PT', fechaReq: '05/08/2026', est: 'Aprobada', firmas: 'V°B° Logística 12/06/2026 · Gerencia 12/06/2026', obs: '', lineas: [L('PT-0001', 35, 'LDM-0001'), L('PT-0002', 33, 'LDM-0002'), L('PT-0003', 36, 'LDM-0005')], ofs: [], ref: '' },
      { id: 'SF-000002', fecha: '05/06/2026', mes: 'Jul 2026', solic: 'Comercial 02', almDestino: 'SB-ALM-PT', fechaReq: '05/07/2026', est: 'Aprobada', firmas: 'V°B° Logística 05/06/2026 · Gerencia 06/06/2026', obs: '', lineas: [L('PT-0001', 60, 'LDM-0001'), L('PT-0002', 50, 'LDM-0002'), L('PT-0003', 70, 'LDM-0005')], ofs: [], ref: '' }
    ];
    Store.d.sfs.forEach(sf => { Demo._t(sf.fecha + ' 16:00'); Prod.aprobarSF(sf); });
    const f = (lst, art) => lst.find(o => o.art === art);

    /* 1) SF-000002 · referencia 0156: todo terminado; los avíos de planta se reponen con una solicitud de materiales (Logística transfiere) */
    Demo._t('06/06/2026 10:20');
    const c1 = Prod.generarDesdeSF('SF-000002');
    Demo._producir(f(c1, 'PPT-0026'), '08/06/2026 08:00', { reales: { m0: 186 }, cerrar: true });
    Demo._producir(f(c1, 'PPT-0027'), '08/06/2026 13:00', { cerrar: true });
    Demo._producir(f(c1, 'PPT-0022'), '09/06/2026 08:00', { emitir: [70, 60], cerrar: true });
    Demo._producir(f(c1, 'PPT-0025'), '09/06/2026 08:00', { cerrar: true });
    Demo._producir(f(c1, 'PPT-0021'), '12/06/2026 09:00', { tercero: true, cerrar: true });
    Demo._producir(f(c1, 'PPT-0023'), '12/06/2026 09:00', { tercero: true, cerrar: true });
    Demo._producir(f(c1, 'PPT-0024'), '12/06/2026 09:00', { tercero: true, cerrar: true });
    Demo._t('28/06/2026 11:00');
    Prod.registrarCompra(f(c1, 'PPT-0021'), { tipo: 'Factura', doc: 'F001-000812', rec: 'REC-0011', cant: 60, importe: 216 });
    Prod.registrarCompra(f(c1, 'PPT-0023'), { tipo: 'OC', doc: 'OC-000246', rec: 'REC-0011', cant: 70, importe: 245 });
    Demo._producir(f(c1, 'PT-0001'), '29/06/2026 08:00', { cerrar: true });
    Demo._producir(f(c1, 'PT-0002'), '30/06/2026 08:00', { cerrar: true });
    const pt3 = f(c1, 'PT-0003');
    Demo._t('01/07/2026 08:00');
    const s1 = Prod.solicitarFaltantes(pt3, Demo.AVIOS.map(art => ({ art, cant: 70, destino: 'SB-ALM-FAB' })), 'Reposición de avíos en planta')[0];
    Demo._t('01/07/2026 10:30'); Prod.atenderSolicitud(s1.id, { prop: 'Transferencia', origen: 'SB-ALM-MPA' });
    Demo._producir(pt3, '01/07/2026 11:00', { cerrar: true });

    /* 2) SF-000003 · referencia 0157: en curso */
    Demo._t('13/07/2026 09:15');
    const c2 = Prod.generarDesdeSF('SF-000003');
    Demo._producir(f(c2, 'PPT-0026'), '14/07/2026 08:00', { reales: { m0: 101 }, cerrar: true });
    Prod.adjuntar(f(c2, 'PPT-0026'), 'tizado_zuleika_T28.pdf', 'Tizado para 71 unidades');
    Demo._producir(f(c2, 'PPT-0027'), '14/07/2026 13:30', { cerrar: true });
    Demo._producir(f(c2, 'PPT-0025'), '15/07/2026 08:00', { cerrar: true });
    Demo._producir(f(c2, 'PPT-0022'), '16/07/2026 08:00', { emitir: [60], recibir: [40] });
    Demo._producir(f(c2, 'PPT-0024'), '17/07/2026 09:00', { tercero: true, emitir: [20] });

    /* 3) Orden Especial sin lista (materiales indicados a mano) · referencia 0158 */
    Demo._t('18/07/2026 09:00');
    const esp = Prod.crearManual({ art: 'PT-0002', cant: 3, alm: 'SB-ALM-PT', obs: 'Reacondicionar 3 pantalones: cambio de botón' })[0];
    Prod.agregarLinea(esp, { tipo: 'Artículo', cod: 'PPT-0024' });
    Prod.agregarLinea(esp, { tipo: 'Artículo', cod: 'MP-0044' });
    Prod.agregarLinea(esp, { tipo: 'Recurso', cod: 'REC-0008' }); Prod.cambiarLinea(esp, 'Recurso', 0, 'cons', 0.5);
    Prod.agregarLinea(esp, { tipo: 'Texto' }); Prod.cambiarLinea(esp, 'Texto', 0, 'txt', 'Cambiar botón y planchar');

    /* 4) Muestra: no es una orden de fabricación, es un ingreso con el costo indicado */
    Demo._t('20/07/2026 10:00');
    Stock.ingreso({ det: 'Ingreso - Muestra', alm: 'SB-ALM-REM', origen: 'Desarrollo de producto', ndoc: 'MUESTRA-THAIR', lineas: [{ art: 'PT-0010', cant: 2, costo: 48.5 }], obs: 'Muestra con costo indicado (sin orden de fabricación)' });

    /* 5) defecto de lavandería: 2 lavados T30 vuelven mal → artículo fallado (salida + ingreso); Compras gestiona la nota de crédito */
    const lav2 = f(c2, 'PPT-0024');
    Demo._t('20/07/2026 15:00');
    Prod.registrarCompra(lav2, { tipo: 'OC', doc: 'OC-000251', rec: 'REC-0011', cant: 20, importe: 70 });
    Prod.reclasificarFallado({ alm: 'SB-ALM-PPT', art: 'PPT-0024', fallado: 'PPT-0024F', cant: 2, motivo: 'Defecto de lavandería (servicio de terceros)', obs: 'Manchas en 2 unidades del lote' });
    Prod.registrarCompra(lav2, { tipo: 'Nota de crédito', doc: 'NC-C-000014', rec: 'REC-0011', cant: 2, importe: 7 });

    /* 6) defecto de confección: 4 crudos T28 fallados → artículo fallado y orden de reproceso (solo mano de obra) en la misma referencia */
    Demo._t('21/07/2026 09:00');
    Prod.reclasificarFallado({ alm: 'SB-ALM-PPT', art: 'PPT-0022', fallado: 'PPT-0022F', cant: 4, motivo: 'Defecto de confección', obs: 'Costura de entrepierna abierta' });
    const rep = Prod.crearReproceso({ art: 'PPT-0022', fallado: 'PPT-0022F', cant: 4, alm: 'SB-ALM-PPT', ref: '0157', rec: 'REC-0002', horas: 0.25 });
    Demo._producir(rep, '21/07/2026 10:00', { cerrar: true });

    /* 7) fase tercerizada con las órdenes ya creadas: el acabado T28 negro lo hará un taller; se pide la compra del servicio a Logística */
    Demo._t('21/07/2026 11:30');
    Prod.tercerizar(f(c2, 'PT-0003'), { prov: 'PRV-0006', alm: 'SB-ALM-TRN', rec: 'REC-0012' });

    /* 8) referencia 0157: terminado T30 emitido; al recibir faltan avíos en planta → solicitud de materiales pendiente para Logística */
    const pt2 = f(c2, 'PT-0002');
    Demo._producir(pt2, '22/07/2026 08:00', { emitir: [18], recibir: [] });
    Demo._t('22/07/2026 17:40');
    Prod.solicitarFaltantes(pt2, Prod.faltantesNotificacion(pt2, 18).map(x => ({ art: x.cod, cant: x.falta, destino: x.alm })), 'Falta stock para recibir');

    UI.reloj = null;
    return Store.d;
  }
};
