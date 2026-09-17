/* PRODUCCION · Historia de demo sobre la BASE COMPARTIDA (familia ZULEIKA).
   Demo.historia() parte del escenario «Solo maestros» y registra una operación realista usando SOLO servicios
   (Docs.*, Stock.*, Prod.*), así el stock, los compromisos y los costos cuadran en los cuatro módulos.
   No toca el DOM: la usa el generador de COMPARTIDO/bd/datos/escenario-operacion.js (node). Fechas de julio 2026 con BD.reloj.
   1) Compra de materia prima (OC de bienes por proveedor: crear → enviar → V°B° → aprobar → ingreso en SB-CENTRAL-MP → factura)
      y abastecimiento a SB-ZARATE-MP en dos pasos (Solicitud de Transferencia: crear → aprobar → recibir al día siguiente) con guía.
   2) SF azul (PT-0001/0002) aprobada y FABRICADA completa: piezas → crudo → lavado tercerizado
      (SOL del servicio → OC de servicio → envío con GRE → retorno → conformidad → factura) → producto final.
   3) SF negro (PT-0003/0004) en curso: usa 10 crudos T28 adelantados en una orden manual (el crudo no tiene color: el color nace en el lavado),
      crudo T30 a medias, lavado T28 enviado a la lavandería, lavado T30 con el servicio pedido.
   4) SF de los cuatro PT aprobada sin órdenes (su materia prima queda comprometida). */
const Demo = {
  USUARIOS: { comercial: 'Comercial 01', logistica: 'USER02 · Logística', compras: 'USER03 · Compras', gerencia: 'Gerencia General', produccion: 'USER05 · Producción' },
  /* almacén donde entran las órdenes de producto en proceso de la historia (lo elige Producción) */
  _almsProceso() { const r = {}; BD.d.maestros.articulos.filter(a => a.grupo === 'PPT').forEach(a => { r[a.cod] = 'SB-ZARATE-PP'; }); return r; },
  _en(fecha, quien) { BD.reloj = fecha; BD.usuario = Demo.USUARIOS[quien] || quien; },
  _sumar(fecha, dias, hora) { return UI.sumarDias(fecha, dias, hora); },

  /* recursos Manual de una emisión: las horas se reparten entre (hasta) dos operarios del recurso */
  _recursos(of, cant) {
    const recs = {};
    of.recs.forEach((r, i) => {
      if (r.metodo === 'Notificación') return;
      const horas = UI.r4(r.cons * cant), ops = M.operarios().filter(o => o.rec === r.cod && o.activo !== false).slice(0, 2);
      if (!ops.length) { recs[i] = { cant: horas }; return; }
      const parte = UI.r2(horas / ops.length);
      recs[i] = { operarios: ops.map((o, k) => ({ ope: o.cod, horas: k < ops.length - 1 ? parte : UI.r4(horas - parte * (ops.length - 1)) })) };
    });
    return recs;
  },
  /* emite (líneas Manual con operarios) y recibe (consume lo Notificación) por días; o = {emitir:[], recibir:[], reales:{m0: cant}, cerrar} */
  _producir(of, fecha, o) {
    o = o || {};
    Demo._en(fecha, 'produccion');
    if (of.estado === 'Planificado') Prod.liberar(of);
    const em = o.emitir || [of.cant], rc = o.recibir || em, n = Math.max(em.length, rc.length);
    for (let k = 0; k < n; k++) {
      const dia = k === 0 ? fecha : Demo._sumar(fecha, k, '08:00');
      if (em[k]) {
        Demo._en(dia, 'produccion');
        const mats = {};
        of.mats.forEach((m, i) => { if (m.metodo !== 'Notificación') mats[i] = k === 0 && o.reales && o.reales['m' + i] != null ? o.reales['m' + i] : UI.r4(m.cons * em[k]); });
        const r = Prod.emitir(of, { mats, recs: Demo._recursos(of, em[k]) });
        if (r.sols.length) throw new Error('Demo: faltó stock al emitir ' + of.id);
      }
      if (rc[k]) { Demo._en(Demo._sumar(dia, 0, '17:30'), 'produccion'); Prod.recibir(of, { cant: rc[k] }); }
    }
    if (o.cerrar) { Demo._en(Demo._sumar(fecha, n - 1, '18:00'), 'produccion'); Prod.cerrar(of); }
    BD.guardar();
  },
  /* Producción pide el servicio; Logística lo aprueba como Compra y crea la OC de servicio; Compras la envía y se aprueba */
  _comprarServicio(of, fPedido, fOC, fAprob) {
    Demo._en(fPedido, 'produccion');
    const sol = Prod.pedirServicio(of); BD.guardar();
    if (!fOC) return { sol };
    Demo._en(fOC, 'logistica');
    Docs.sol.aprobar(sol.id, sol.lineas.map(() => ({ prop: 'Compra' })));
    const oc = Docs.sol.crearOC(sol.id, { prov: Prod.provServicio(of) });
    if (!fAprob) return { sol, oc };
    Demo._en(fAprob, 'compras'); Docs.oc.enviar(oc.id);
    Demo._en(Demo._sumar(fAprob, 0, fAprob.slice(11, 13) + ':20'), 'logistica'); Docs.oc.validar(oc.id);
    Demo._en(Demo._sumar(fAprob, 0, fAprob.slice(11, 13) + ':45'), 'gerencia'); Docs.oc.aprobar(oc.id);
    return { sol, oc };
  },
  /* solicitud de fabricación creada por Comercial, V°B° de Logística y aprobación de Gerencia */
  _sf(fecha, fVB, fAprob, d) {
    Demo._en(fecha, 'comercial');
    const sf = Docs.sf.crear(Object.assign({ solic: Demo.USUARIOS.comercial }, d));
    Docs.sf.enviar(sf.id);
    Demo._en(fVB, 'logistica'); Docs.sf.darVB(sf.id);
    Demo._en(fAprob, 'gerencia'); Docs.sf.aprobar(sf.id);
    return sf;
  },

  historia() {
    if (!BD.d) BD.d = BD.base('maestros');
    if (BD.d.movs.length || BD.d.ofs.length || BD.d.sfs.length || BD.d.ocs.length) throw new Error('Demo.historia() parte del escenario «Solo maestros» (base sin movimientos ni documentos)');
    const usuarioAntes = BD.usuario;
    const L = (art, cant) => ({ art, cant, ldm: (BD.ldmPred(art) || {}).id });
    const AZUL = [L('PT-0001', 40), L('PT-0002', 30)];
    const NEGRO = [L('PT-0003', 30), L('PT-0004', 24)];
    const TODOS = [L('PT-0001', 20), L('PT-0002', 20), L('PT-0003', 20), L('PT-0004', 20)];

    /* ---------- 1) compra de la materia prima de la campaña (+5 %) ---------- */
    const req = {};
    Explosion.bruto(AZUL.concat(NEGRO, TODOS)).forEach(r => { req[r.art] = UI.r4((req[r.art] || 0) + r.cant); });
    const porProv = {};
    Object.keys(req).sort().forEach(art => {
      const a = BD.art(art);
      (porProv[a.provDef] = porProv[a.provDef] || []).push({ art, cant: Math.ceil(req[art] * 1.05), pu: a.precioCompra || a.costo });
    });
    const ocsMP = Object.keys(porProv).sort().map((prov, k) => {
      Demo._en('01/07/2026 09:' + String(10 + k * 15), 'compras');
      const oc = Docs.oc.crear({ prov, almDestino: 'SB-CENTRAL-MP', obs: 'Materia prima campaña julio · Zuleika', items: porProv[prov] });
      Docs.oc.enviar(oc.id);
      Demo._en('01/07/2026 11:' + String(10 + k * 15), 'logistica'); Docs.oc.validar(oc.id);
      Demo._en('01/07/2026 15:' + String(10 + k * 15), 'gerencia'); Docs.oc.aprobar(oc.id);
      return oc;
    });
    ocsMP.forEach((oc, k) => {
      Demo._en('03/07/2026 10:' + String(10 + k * 20), 'logistica'); Docs.oc.recibir(oc.id, { alm: 'SB-CENTRAL-MP', obs: 'Guía del proveedor 001-00' + (4510 + k) });
      Demo._en('03/07/2026 16:' + String(10 + k * 20), 'compras'); Docs.fac.crear({ oc: oc.id, ndoc: 'F001-000' + (812 + k) });
    });
    const lineasMP = Object.keys(porProv).sort().flatMap(p => porProv[p]).map(x => ({ art: x.art, cant: x.cant }));
    Demo._en('04/07/2026 08:30', 'logistica');
    const st = Docs.trf.crear({ origen: 'SB-CENTRAL-MP', destino: 'SB-ZARATE-MP', tipoMov: 'TRF-INTERNO', obs: 'Abastecimiento a planta Zárate: materia prima de la campaña de julio (' + ocsMP.map(o => o.id).join(', ') + ')', lineas: lineasMP });
    Demo._en('04/07/2026 09:15', 'gerencia'); Docs.trf.aprobar(st.id);
    Demo._en('05/07/2026 10:00', 'logistica');
    const movST = Docs.trf.recibir(st.id);
    Docs.gre.crear({ motivo: 'Traslado entre establecimientos de la misma empresa', origen: 'SB-CENTRAL-MP', destino: 'SB-ZARATE-MP', mov: movST.id, lineas: lineasMP, obs: 'Abastecimiento a planta Zárate · ' + st.id });

    /* ---------- 2) SF azul: fabricada completa con lavado tercerizado ---------- */
    const sf1 = Demo._sf('02/07/2026 10:00', '02/07/2026 15:30', '03/07/2026 09:00',
      { mes: 'Jul 2026', almDestino: 'SB-CENTRAL', fechaReq: '25/07/2026', obs: 'Campaña de julio: Zuleika azul', lineas: AZUL });
    Demo._en('06/07/2026 09:30', 'produccion');
    const c1 = Prod.generarDesdeSF(sf1.id, null, Demo._almsProceso()); BD.guardar();
    const f1 = art => c1.find(o => o.art === art);
    Demo._producir(f1('PPT-0001'), '07/07/2026 08:00', { reales: { m0: 57 }, cerrar: true });
    Prod.adjuntar(f1('PPT-0001'), 'tizado_zuleika_T28.pdf', 'Tizado para 40 unidades');
    Demo._producir(f1('PPT-0002'), '07/07/2026 13:00', { cerrar: true });
    Demo._producir(f1('PPT-0003'), '08/07/2026 08:00', { emitir: [25, 15], cerrar: true });
    Demo._producir(f1('PPT-0004'), '08/07/2026 09:00', { cerrar: true });
    [['PPT-0005', 'F002-000345', null], ['PPT-0006', 'F002-000346', 3.6]].forEach(([art, ndoc, pu], k) => {
      const of = f1(art);
      const { oc } = Demo._comprarServicio(of, '10/07/2026 09:' + (10 + k * 5), '10/07/2026 15:' + (10 + k * 5), '10/07/2026 17:0' + k);
      Demo._en('11/07/2026 08:' + (10 + k * 10), 'produccion'); Prod.enviarProveedor(of, { cant: of.cant }); BD.guardar();
      Demo._producir(of, '16/07/2026 09:' + (10 + k * 10), { cerrar: true });
      Demo._en('16/07/2026 11:' + (10 + k * 10), 'compras'); Docs.oc.conformidad(oc.id, { obs: 'Lavado conforme' });
      Demo._en('18/07/2026 10:' + (10 + k * 10), 'compras');
      Docs.fac.crear({ oc: oc.id, ndoc, lineas: pu ? [{ art: 'SRV-0001', cant: of.cant, pu }] : null });
    });
    Demo._producir(f1('PT-0001'), '20/07/2026 08:00', { cerrar: true });
    Demo._producir(f1('PT-0002'), '20/07/2026 13:00', { cerrar: true });

    /* ---------- 3) SF negro: en curso ---------- */
    const sf2 = Demo._sf('08/07/2026 11:00', '09/07/2026 10:00', '09/07/2026 12:00',
      { mes: 'Ago 2026', almDestino: 'SB-CENTRAL', fechaReq: '05/08/2026', obs: 'Reposición Zuleika negro', lineas: NEGRO });
    /* crudo sin color: Producción adelanta 10 crudos talla 28 (orden manual con sus piezas cortadas); la SF negro los usa y fabrica solo 20 */
    Demo._en('10/07/2026 10:00', 'produccion');
    const adelanto = Prod.crearManual({ art: 'PPT-0003', ldm: BD.ldmPred('PPT-0003').id, cant: 10, alm: 'SB-ZARATE-PP', sugeridas: { 'PPT-0001': 10 }, alms: Demo._almsProceso(), obs: 'Adelanto de crudo talla 28 para cualquier color' });
    BD.guardar();
    Demo._producir(adelanto.find(o => o.art === 'PPT-0001'), '10/07/2026 10:30', { cerrar: true });
    Demo._producir(adelanto.find(o => o.art === 'PPT-0003'), '11/07/2026 08:00', { cerrar: true });
    Demo._en('13/07/2026 09:15', 'produccion');
    const c2 = Prod.generarDesdeSF(sf2.id, null, Demo._almsProceso()); BD.guardar();
    const f2 = art => c2.find(o => o.art === art);
    Demo._producir(f2('PPT-0001'), '14/07/2026 08:00', { cerrar: true });
    Demo._producir(f2('PPT-0002'), '14/07/2026 13:30', { cerrar: true });
    Demo._producir(f2('PPT-0003'), '15/07/2026 08:00', { cerrar: true });
    Demo._producir(f2('PPT-0004'), '16/07/2026 08:00', { emitir: [24], recibir: [16] });
    const lav28 = f2('PPT-0007');
    Demo._comprarServicio(lav28, '17/07/2026 09:00', '17/07/2026 15:00', '18/07/2026 10:00');
    Demo._en('20/07/2026 08:30', 'produccion'); Prod.enviarProveedor(lav28, { cant: lav28.cant }); BD.guardar();
    Demo._comprarServicio(f2('PPT-0008'), '17/07/2026 09:05');

    /* ---------- 4) SF de los cuatro terminados: aprobada, sin órdenes ---------- */
    Demo._sf('20/07/2026 10:00', '22/07/2026 09:00', '22/07/2026 11:30',
      { mes: 'Ago 2026', almDestino: 'SB-CENTRAL', fechaReq: '20/08/2026', obs: 'Campaña de agosto: surtido Zuleika', lineas: TODOS });

    BD.reloj = null;
    BD.usuario = usuarioAntes;
    BD.guardar();
    return BD.d;
  }
};
