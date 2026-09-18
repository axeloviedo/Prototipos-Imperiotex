/* COMPARTIDO · documentos de postventa de Compras sobre la base compartida (decisiones N9 / C-3, 2026-09-17).
   Se agregan a Docs (cargar después de documentos.js):
   - Docs.rec  Reclamo al proveedor (RCL-000001): control del problema. No es contable: lo contable son los documentos que genera.
   - Docs.nc   Nota de crédito del proveedor (NC-000001): contra una factura; motivos SUNAT 07 · 05 · 09.
   - Docs.ccd  Costos de destino (CD-000001): flete, seguro, aduanas… repartidos sobre lo recibido de una o más OC.
   - Docs.sug  Sugerido de compras: cálculo, no documento.
   Cada efecto usa un concepto del catálogo de 28 (docs/04): 11 devolución/cambio a proveedor · 12 nota de crédito ·
   05–09 costos vinculados · 04 variación de existencias · 26 regularización por faltante. */
(() => {
  const g = () => BD.guardar();
  const exigir = (cond, msg) => { if (!cond) BD.error(msg); };
  const oc = Docs.oc, fac = Docs.fac;
  const factorOC = o => (o && o.mon === 'USD' ? (Number(o.tc) || 1) : 1);
  /* Revaloriza donde está HOY el material (lo recibido pudo transferirse a planta): lineas = [{art, cant (recibida), monto}].
     Se aplica sobre el stock actual (fuera de tránsito) hasta la cantidad recibida, repartido por almacén según lo que hay;
     la parte de lo ya consumido va a Variación de existencias (concepto 04). meta = {det, ndoc, doc, concepto, obs, fecha} */
  const revalorizarEnStock = (lineas, meta) => {
    const porAlm = {}, variacion = [], movs = [];
    lineas.forEach(l => {
      const filas = BD.d.stock.filter(s => s.art === l.art && s.act > 0.00005 && !(BD.alm(s.alm) || {}).transito);
      const hay = BD.r4(filas.reduce((t, s) => t + s.act, 0)), unidades = Math.min(hay, Number(l.cant) || hay);
      const aplicado = l.cant ? BD.r2(l.monto * unidades / l.cant) : (hay ? l.monto : 0);
      if (Math.abs(l.monto - aplicado) > 0.004) variacion.push({ art: l.art, monto: BD.r2(l.monto - aplicado) });
      let acum = 0;
      filas.forEach((s, k) => {
        const parte = k === filas.length - 1 ? BD.r2(aplicado - acum) : BD.r2(aplicado * s.act / hay);
        acum = BD.r2(acum + parte);
        if (Math.abs(parte) > 0.004) (porAlm[s.alm] = porAlm[s.alm] || []).push({ art: l.art, monto: parte });
      });
    });
    Object.keys(porAlm).forEach(alm => {
      const x = Stock.revalorizacion(Object.assign({ alm, modulo: 'Compras', lineas: porAlm[alm] }, meta));
      if (x.mov) movs.push(x.mov.id);
      x.variacion.forEach(v => variacion.push(v));
    });
    return { movs, variacion };
  };

  /* ================= Reclamo al proveedor ================= */
  /* estados: Registrado (sin resolver) → En proceso (alguna línea espera reposición o nota de crédito) → Resuelto · Anulado
     resolución por línea: Reposición (SAL-DEVPROV + ING-CAMBIO, concepto 11) · Devolución (SAL-DEVPROV, concepto 11, y nota de crédito 07)
     · Nota de crédito (sin devolución: nota 05 bienes / 09 servicio). El faltante de una orden tercerizada sale del tránsito (SAL-REGULARIZ, 26). */
  const rec = {
    ESTADOS: ['Registrado', 'En proceso', 'Resuelto', 'Anulado'],
    RESOLUCIONES: ['Reposición', 'Devolución', 'Nota de crédito'],
    MOTIVOS: ['Faltante en la entrega', 'Producto con defecto de fábrica', 'Tono o color distinto al aprobado', 'Medida o gramaje fuera de especificación',
      'Producto oxidado o deteriorado', 'Servicio mal ejecutado', 'Prendas que no retornaron del servicio', 'Otro'],
    /* lo que se puede reclamar de una OC: lo recibido o con conformidad, menos lo ya reclamado */
    reclamable(ocId, art) {
      const o = BD.oc(ocId); if (!o) return 0;
      const it = o.items.find(i => i.art === art); if (!it) return 0;
      const ya = (BD.d.recs || []).filter(r => r.oc === o.id && r.estado !== 'Anulado').reduce((t, r) => t + r.lineas.filter(l => l.art === art).reduce((a, l) => a + l.cant, 0), 0);
      return BD.r4(Math.max(0, it.recq - ya));
    },
    /* almacén (no de tránsito) con más disponible del artículo, si alcanza para la cantidad */
    almConStock(art, cant) {
      const s = BD.d.stock.filter(x => x.art === art && !(BD.alm(x.alm) || {}).transito && x.act - x.comp + 0.00005 >= cant).sort((a, b) => (b.act - b.comp) - (a.act - a.comp))[0];
      return s ? s.alm : '';
    },
    /* almacén donde entró el bien de la OC (el de su primera recepción) */
    _almDe(o, art) { const r = (o.recepciones || []).find(x => x.tipo === 'Ingreso' && x.lineas.some(l => l.art === art)); return (r && r.alm) || o.almDestino || ''; },
    /* d = {oc, of, obs, lineas:[{art, cant, motivo}]}. Desde el faltante de una orden (of) se toma su OC de servicio y el proveedor del faltante */
    crear(d) {
      let o = d.oc ? BD.oc(d.oc) : null, of = d.of ? BD.of(d.of) : null;
      if (of) {
        exigir(of.faltante && of.faltante.estado === 'Abierto', 'La orden ' + of.id + ' no tiene un faltante abierto');
        exigir(!(BD.d.recs || []).some(r => r.of === of.id && r.estado !== 'Anulado'), 'La orden ' + of.id + ' ya tiene un reclamo');
        o = o || BD.d.ocs.find(x => x.of === of.id && x.est !== 'Cancelada');
        exigir(o, 'La orden ' + of.id + ' no tiene OC de servicio para reclamar');
      }
      exigir(o, 'Elija la orden de compra');
      exigir(!['Borrador', 'Pendiente de Validar', 'Cancelada'].includes(o.est), 'La OC ' + o.id + ' no está aprobada');
      const lineas = (d.lineas || []).filter(l => l.art && Number(l.cant) > 0).map(l => ({ art: l.art, cant: BD.r4(l.cant), motivo: l.motivo || '', resol: '', estado: 'Pendiente', alm: '', docs: [] }));
      exigir(lineas.length, 'Agregue al menos una línea con cantidad');
      lineas.forEach(l => {
        exigir(o.items.some(i => i.art === l.art), BD.nomArt(l.art) + ' no está en la OC ' + o.id);
        exigir(l.motivo, 'Indique el motivo de ' + BD.nomArt(l.art));
        if (!of) exigir(l.cant <= rec.reclamable(o.id, l.art) + 0.00005, 'Solo se reclama lo recibido y aún no reclamado de ' + BD.nomArt(l.art) + ' (' + rec.reclamable(o.id, l.art) + ')');
        l.alm = BD.esServicio(l.art) ? '' : rec._almDe(o, l.art);
      });
      const r = { id: BD.sig('rcl', 'RCL-', 6), emp: o.emp || BD.empresaDe(o.almDestino), fecha: d.fecha || BD.ahora(), prov: of ? (of.faltante.prov || o.prov) : o.prov, oc: o.id, of: of ? of.id : '',
        obs: d.obs || '', estado: 'Registrado', lineas, hist: [] };
      (BD.d.recs = BD.d.recs || []).unshift(r);
      BD.hist(r, 'Registrado', (of ? 'Faltante de ' + of.id + ' · ' : '') + 'OC ' + o.id);
      BD.hist(o, 'Reclamo ' + r.id, lineas.map(l => BD.nomArt(l.art) + ' ' + l.cant).join(', '));
      g(); return r;
    },
    /* decide la resolución de una línea y registra lo que corresponde en el almacén */
    resolver(id, i, d) {
      const r = BD.reclamo(id); exigir(r && (r.estado === 'Registrado' || r.estado === 'En proceso'), 'El reclamo no está abierto');
      const l = r.lineas[i]; exigir(l && !l.resol, 'La línea ya tiene resolución');
      d = d || {};
      exigir(rec.RESOLUCIONES.includes(d.resol), 'Elija la resolución');
      const servicio = BD.esServicio(l.art), o = BD.oc(r.oc);
      exigir(!(servicio && d.resol !== 'Nota de crédito'), 'Un servicio no se devuelve ni se repone: se resuelve con nota de crédito');
      const base = { alm: l.alm, destino: 'Proveedor · ' + BD.provNom(r.prov), ndoc: r.id, doc: 'Reclamo', modulo: 'Compras', fecha: d.fecha };
      if (d.resol === 'Reposición' || d.resol === 'Devolución') {
        /* sale de donde está hoy: el almacén elegido, el de ingreso si aún alcanza o el que tiene más stock (lo recibido pudo transferirse a planta) */
        l.alm = d.alm || (Stock.disp(l.alm, l.art) + 0.00005 >= l.cant ? l.alm : rec.almConStock(l.art, l.cant) || l.alm);
        base.alm = l.alm;
        exigir(BD.alm(l.alm), 'Elija el almacén desde donde se devuelve ' + BD.nomArt(l.art));
        const s = Stock.salida(Object.assign({}, base, { det: 'Salida - Devolución a proveedor', tipoMov: 'SAL-DEVPROV', concepto: '11 · Devolución / cambio a proveedor',
          obs: r.id + ' · ' + l.motivo + (d.resol === 'Reposición' ? ' · el proveedor repone' : ' · con nota de crédito'), lineas: [{ art: l.art, cant: l.cant, bloquear: true }] }));
        exigir(s.ok, s.error);
        l.docs.push(s.mov.id); l.costo = (s.mov.lineas[0] || {}).costo || 0;
      }
      if (r.of && l === r.lineas[0]) {
        /* faltante de una orden tercerizada: lo que no retornó sale del almacén de tránsito como faltante (concepto 26) */
        const of = BD.of(r.of), mats = of ? of.mats.filter(m => (BD.alm(m.alm) || {}).transito) : [];
        const lin = mats.map(m => ({ art: m.cod, cant: BD.r4(m.cons * l.cant), alm: m.alm })).filter(x => x.cant > 0 && Stock.act(x.alm, x.art) > 0.00005);
        [...new Set(lin.map(x => x.alm))].forEach(alm => {
          const s = Stock.salida({ det: 'Salida - Regularización de inventario (faltante)', tipoMov: 'SAL-REGULARIZ', concepto: '26 · Regularización por faltante de inventario', alm, destino: 'Faltante del proveedor · ' + BD.provNom(r.prov),
            ndoc: r.id, doc: 'Reclamo', modulo: 'Compras', fecha: d.fecha, obs: 'Prendas que no retornaron de ' + of.id + ' · ' + r.id,
            lineas: lin.filter(x => x.alm === alm).map(x => ({ art: x.art, cant: Math.min(x.cant, Stock.act(alm, x.art)) })) });
          exigir(s.ok, s.error); l.docs.push(s.mov.id);
        });
      }
      l.resol = d.resol;
      l.estado = d.resol === 'Reposición' ? 'Espera reposición' : 'Espera nota de crédito';
      BD.hist(r, 'Resolución · ' + BD.nomArt(l.art), d.resol + (l.docs.length ? ' · ' + l.docs.join(', ') : ''));
      rec._estado(r);
      g(); return r;
    },
    /* el proveedor repone lo devuelto: ingreso por cambio al mismo costo de la salida (concepto 11) */
    reponer(id, i, d) {
      const r = BD.reclamo(id); exigir(r, 'No existe el reclamo ' + id);
      const l = r.lineas[i]; exigir(l && l.resol === 'Reposición' && l.estado === 'Espera reposición', 'La línea no espera reposición');
      d = d || {};
      const s = Stock.ingreso({ det: 'Ingreso - Cambio / reposición de proveedor', tipoMov: 'ING-CAMBIO', concepto: '11 · Devolución / cambio a proveedor', alm: l.alm, origen: BD.provNom(r.prov),
        ndoc: r.id, doc: 'Reclamo', modulo: 'Compras', fecha: d.fecha, obs: r.id + ' · reposición del proveedor', lineas: [{ art: l.art, cant: l.cant, costo: l.costo || Stock.costo(l.alm, l.art) }] });
      exigir(s.ok, s.error);
      l.docs.push(s.mov.id); l.estado = 'Resuelta';
      BD.hist(r, 'Reposición recibida · ' + BD.nomArt(l.art), s.mov.id);
      rec._estado(r);
      g(); return s.mov;
    },
    /* lo llama Docs.nc al registrar la nota de crédito de la línea */
    _conNota(r, i, ncId) {
      const l = r.lineas[i]; if (!l) return;
      l.docs.push(ncId); l.estado = 'Resuelta';
      BD.hist(r, 'Nota de crédito · ' + BD.nomArt(l.art), ncId);
      rec._estado(r);
    },
    anular(id, motivo) {
      const r = BD.reclamo(id); exigir(r && r.estado === 'Registrado', 'Solo se anula un reclamo sin resoluciones');
      exigir(String(motivo || '').trim(), 'Indique el motivo');
      r.estado = 'Anulado'; BD.hist(r, 'Anulado', motivo, 'no');
      g(); return r;
    },
    _estado(r) {
      if (r.estado === 'Anulado') return;
      const todas = r.lineas.every(l => l.estado === 'Resuelta'), alguna = r.lineas.some(l => l.resol);
      r.estado = todas ? 'Resuelto' : alguna ? 'En proceso' : 'Registrado';
      if (todas && r.of) { const of = BD.of(r.of); if (of && of.faltante) { of.faltante.estado = 'Cerrado'; of.faltante.rec = r.id; (of.hist = of.hist || []).push({ f: BD.ahora(), a: 'Faltante cerrado', d: 'Reclamo ' + r.id, u: BD.usuario }); } }
    }
  };

  /* ================= Nota de crédito del proveedor ================= */
  /* motivos del catálogo SUNAT (tabla 09) que usamos:
     07 Devolución por ítem (lo devuelto en un reclamo) · 05 Descuento por ítem (rebaja de precio, baja el costo de lo que queda en stock)
     · 09 Disminución en el valor (servicio mal ejecutado o faltante de tercerizado).
     Factura impaga: baja lo que se debe. Factura pagada: queda como saldo a favor del proveedor para el próximo pago (Tesorería). */
  const nc = {
    MOTIVOS: { '07': 'Devolución por ítem', '05': 'Descuento por ítem', '09': 'Disminución en el valor' },
    ESTADOS: ['Registrada', 'Anulada'],
    /* notas vigentes de una factura y lo que queda de ella */
    deFactura(facId) { return (BD.d.ncs || []).filter(n => n.fac === facId && n.estado !== 'Anulada'); },
    /* lo que queda por pagar de una factura: total − sus notas de crédito − el saldo a favor aplicado a ella */
    saldoFactura(facId) {
      const f = BD.fac(facId); if (!f) return 0;
      return BD.r2(fac.total(f) - nc.deFactura(facId).reduce((t, n) => t + n.total, 0) - (f.creditos || []).reduce((t, c) => t + c.monto, 0));
    },
    /* lo que queda sin usar de una nota que quedó como saldo a favor */
    disponible(n) { return n && n.estado !== 'Anulada' && n.aplicacion === 'Saldo a favor' ? BD.r2(n.total - (n.usos || []).reduce((t, u) => t + u.monto, 0)) : 0; },
    /* saldo a favor de un proveedor (en una moneda): notas de facturas ya pagadas que aún no se usan del todo */
    favorDe(prov, mon) { return (BD.d.ncs || []).filter(n => n.prov === prov && (!mon || n.mon === mon) && nc.disponible(n) > 0.004); },
    saldoFavor(prov, mon) { return BD.r2(nc.favorDe(prov, mon).reduce((t, n) => t + nc.disponible(n), 0)); },
    /* aplica el saldo a favor del proveedor a una factura impaga suya (la siguiente factura): usa las notas más antiguas primero,
       hasta cubrir lo que falta pagar. La factura guarda de qué notas vino el crédito; si queda en cero, pasa a Pagado. */
    aplicarSaldo(facId, d) {
      const f = BD.fac(facId); exigir(f && f.est === 'Impagado', 'El saldo a favor se aplica a una factura impaga');
      let falta = nc.saldoFactura(f.id), tope = d && d.monto != null ? BD.r2(d.monto) : falta;
      exigir(falta > 0.004, 'La factura ya no tiene saldo por pagar');
      const notas = nc.favorDe(f.prov, f.mon).filter(n => n.fac !== f.id).sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)) || a.id.localeCompare(b.id));
      exigir(notas.length, BD.provNom(f.prov) + ' no tiene saldo a favor en ' + f.mon);
      let usado = 0;
      f.creditos = f.creditos || [];
      notas.forEach(n => {
        const m = BD.r2(Math.min(nc.disponible(n), falta - usado, tope - usado)); if (m <= 0.004) return;
        (n.usos = n.usos || []).push({ fac: f.id, monto: m, fecha: BD.ahora() });
        f.creditos.push({ nc: n.id, monto: m, fecha: BD.ahora() });
        BD.hist(n, 'Saldo a favor aplicado', 'Factura ' + f.ndoc + ' · ' + m);
        usado = BD.r2(usado + m);
      });
      exigir(usado > 0, 'No hay saldo a favor que aplicar');
      BD.hist(f, 'Saldo a favor aplicado', f.creditos.slice(-notas.length).map(c => c.nc + ' ' + c.monto).join(', ') + ' · queda por pagar ' + nc.saldoFactura(f.id));
      if (nc.saldoFactura(f.id) <= 0.01) { f.est = 'Pagado'; BD.hist(f, 'Cancelada con saldo a favor', ''); }
      g(); return { usado, saldo: nc.saldoFactura(f.id) };
    },
    /* d = {fac, ndoc, fecha, motivo, rec, recLinea, obs, lineas:[{art, cant, pu}]} (pu sin IGV, en la moneda de la factura) */
    crear(d) {
      const f = BD.fac(d.fac); exigir(f && f.est !== 'Anulada', 'Elija la factura del proveedor');
      exigir(nc.MOTIVOS[d.motivo], 'Elija el motivo de la nota de crédito');
      const ndoc = String(d.ndoc || '').trim(); exigir(ndoc, 'Indique el número de la nota de crédito del proveedor');
      exigir(!(BD.d.ncs || []).some(n => n.prov === f.prov && String(n.ndoc).trim() === ndoc && n.estado !== 'Anulada'), 'Ya existe una nota de crédito de ' + BD.provNom(f.prov) + ' con el número ' + ndoc);
      const r = d.rec ? BD.reclamo(d.rec) : null, rl = r ? r.lineas[d.recLinea] : null;
      if (r) {
        exigir(rl && rl.estado === 'Espera nota de crédito', 'La línea del reclamo no espera nota de crédito');
        exigir(r.prov === f.prov, 'La factura es de otro proveedor');
        exigir(d.motivo !== '07' || rl.resol === 'Devolución', 'El motivo 07 (devolución) solo aplica a lo devuelto en el reclamo');
      } else exigir(d.motivo !== '07', 'Una devolución se registra desde su reclamo (CO-11)');
      const lineas = (d.lineas || []).filter(l => l.art && Number(l.cant) > 0 && Number(l.pu) > 0).map(l => {
        const it = f.items.find(i => i.art === l.art); exigir(it, BD.nomArt(l.art) + ' no está en la factura ' + f.ndoc);
        exigir(Number(l.cant) <= it.cant + 0.00005, 'No se acredita más de lo facturado de ' + BD.nomArt(l.art));
        return { art: l.art, cant: BD.r4(l.cant), pu: BD.r4(l.pu), igv: it.igv || 0 };
      });
      exigir(lineas.length, 'Agregue al menos una línea con cantidad y precio');
      const total = BD.r2(lineas.reduce((t, l) => t + l.cant * l.pu * (1 + l.igv / 100), 0));
      exigir(total <= nc.saldoFactura(f.id) + 0.01, 'La nota no puede superar el saldo de la factura (' + nc.saldoFactura(f.id) + ')');
      const o = BD.oc(f.oc);
      const n = { id: BD.sig('nc', 'NC-', 6), emp: f.emp || (o && o.emp) || BD.empresa, prov: f.prov, fac: f.id, oc: f.oc, ndoc, fecha: d.fecha || BD.hoy(), motivo: d.motivo,
        motivoNom: nc.MOTIVOS[d.motivo], mon: f.mon, tc: f.tc, rec: r ? r.id : '', recLinea: r ? d.recLinea : null, obs: d.obs || '', lineas, total,
        aplicacion: f.est === 'Pagado' ? 'Saldo a favor' : 'Factura', estado: 'Registrada', movs: [], variacion: [], hist: [] };
      /* 05 · descuento sobre bienes: baja el costo de lo que queda en el almacén; lo ya consumido va a variación (04) */
      if (d.motivo === '05') {
        const x = revalorizarEnStock(lineas.filter(l => !BD.esServicio(l.art)).map(l => ({ art: l.art, cant: l.cant, monto: -BD.r2(l.cant * l.pu * factorOC(f)) })),
          { det: 'Revalorización - Descuento del proveedor', ndoc: n.id, doc: 'Nota de crédito', concepto: '12 · Nota de crédito de proveedor', obs: 'NC ' + ndoc + ' · ' + BD.provNom(f.prov), fecha: d.fecha });
        n.movs = x.movs; n.variacion = x.variacion;
      }
      (BD.d.ncs = BD.d.ncs || []).unshift(n);
      BD.hist(n, 'Registrada', n.motivo + ' ' + n.motivoNom + ' · ' + (n.aplicacion === 'Factura' ? 'rebaja la factura ' + f.ndoc : 'saldo a favor del proveedor (factura ya pagada)'));
      BD.hist(f, 'Nota de crédito ' + n.id, ndoc + ' · ' + n.total);
      if (n.aplicacion === 'Factura' && nc.saldoFactura(f.id) <= 0.01) { f.est = 'Pagado'; BD.hist(f, 'Cancelada con notas de crédito', ''); }
      /* 09 sobre el servicio de una orden: queda en la pestaña Costo de la orden para contrastar */
      if (o && o.of) lineas.filter(l => BD.esServicio(l.art)).forEach(l => oc._aOF(o.of, { tipo: 'Nota de crédito', doc: ndoc + ' (' + n.id + ')', rec: l.art, prov: f.prov, cant: -l.cant, importe: -BD.r2(l.cant * l.pu * factorOC(f)) }));
      if (r) rec._conNota(r, d.recLinea, n.id);
      g(); return n;
    },
    anular(id, motivo) {
      const n = BD.nc(id); exigir(n && n.estado === 'Registrada', 'La nota no está registrada');
      exigir(!n.movs.length, 'La nota ya bajó el costo del stock (' + n.movs.join(', ') + '): no se anula; registre el ajuste que corresponda');
      exigir(!n.rec, 'La nota resolvió el reclamo ' + n.rec + ': no se anula');
      exigir(!(n.usos || []).length, 'El saldo a favor de la nota ya se usó en ' + n.usos.map(u => u.fac).join(', ') + ': no se anula');
      exigir(String(motivo || '').trim(), 'Indique el motivo');
      n.estado = 'Anulada'; BD.hist(n, 'Anulada', motivo, 'no');
      g(); return n;
    }
  };

  /* ================= Costos de destino ================= */
  /* Para cualquier OC con ingresos. Reparto por Valor (recomendado) o por Cantidad sobre lo recibido.
     Registrar revaloriza el costo promedio de lo que sigue en el almacén; lo ya consumido va a variación (04). Anular lo revierte. */
  const ccd = {
    TIPOS: { '05': 'Flete', '06': 'Seguro', '07': 'Derechos aduaneros', '08': 'Agente de aduanas / comisiones', '09': 'Otros costos' },
    BASES: ['Valor', 'Cantidad'],
    ESTADOS: ['Borrador', 'Registrado', 'Anulado'],
    /* líneas recibidas de las OC: base del reparto */
    recibido(ocs) {
      const out = [];
      (ocs || []).forEach(id => {
        const o = BD.oc(id); if (!o) return;
        (o.recepciones || []).filter(x => x.tipo === 'Ingreso').forEach(x => x.lineas.forEach(l => {
          const it = o.items.find(i => i.art === l.art) || {};
          const y = out.find(z => z.oc === o.id && z.art === l.art && z.alm === x.alm);
          const valor = BD.r2(l.cant * (it.pu || 0) * factorOC(o));
          if (y) { y.cant = BD.r4(y.cant + l.cant); y.valor = BD.r2(y.valor + valor); } else out.push({ oc: o.id, art: l.art, alm: x.alm, cant: l.cant, valor });
        }));
      });
      return out;
    },
    /* reparto agrupado por artículo (cantidad recibida y monto), con signo */
    _porArt(reparto, signo) {
      const m = {};
      reparto.forEach(l => { const y = m[l.art] = m[l.art] || { art: l.art, cant: 0, monto: 0 }; y.cant = BD.r4(y.cant + l.cant); y.monto = BD.r2(y.monto + signo * l.monto); });
      return Object.values(m);
    },
    totalCostos(c) { return BD.r2((c.costos || []).reduce((t, x) => t + (Number(x.monto) || 0) * (x.mon === 'USD' ? (Number(x.tc) || 1) : 1), 0)); },
    /* reparto propuesto: cada línea recibida recibe su parte según la base */
    repartir(c) {
      const base = ccd.recibido(c.ocs), total = ccd.totalCostos(c);
      const suma = base.reduce((t, l) => t + (c.base === 'Cantidad' ? l.cant : l.valor), 0);
      let acum = 0;
      return base.map((l, k) => {
        const parte = k === base.length - 1 ? BD.r2(total - acum) : BD.r2(suma ? total * (c.base === 'Cantidad' ? l.cant : l.valor) / suma : 0);
        acum = BD.r2(acum + parte);
        return Object.assign({}, l, { monto: parte, unit: l.cant ? BD.r4(parte / l.cant) : 0 });
      });
    },
    _datos(c, d) {
      if (d.ocs) c.ocs = d.ocs.slice();
      if (d.base) { exigir(ccd.BASES.includes(d.base), 'Base de reparto no válida'); c.base = d.base; }
      if (d.fecha) c.fecha = d.fecha;
      if (d.obs != null) c.obs = d.obs;
      if (d.costos) c.costos = d.costos.filter(x => Number(x.monto) > 0).map(x => {
        exigir(ccd.TIPOS[x.tipo], 'Elija el tipo de costo');
        return { tipo: x.tipo, prov: x.prov || '', ndoc: x.ndoc || '', mon: x.mon === 'USD' ? 'USD' : 'S/.', tc: Number(x.tc) || 1, monto: BD.r2(x.monto) };
      });
      c.ocs.forEach(id => { const o = BD.oc(id); exigir(o, 'No existe la OC ' + id); exigir(ccd.recibido([id]).length, 'La OC ' + id + ' no tiene ingresos al almacén'); });
    },
    crear(d) {
      const c = { id: BD.sig('ccd', 'CD-', 6), emp: BD.empresa, fecha: BD.hoy(), ocs: [], base: 'Valor', costos: [], obs: '', estado: 'Borrador', reparto: [], movs: [], variacion: [], hist: [] };
      ccd._datos(c, d || {});
      if (c.ocs.length) { const o = BD.oc(c.ocs[0]); c.emp = o.emp || c.emp; }
      (BD.d.ccds = BD.d.ccds || []).unshift(c);
      BD.hist(c, 'Creado en borrador');
      g(); return c;
    },
    guardar(id, d) {
      const c = BD.ccd(id); exigir(c && c.estado === 'Borrador', 'Solo se edita un comprobante en Borrador');
      ccd._datos(c, d || {}); BD.hist(c, 'Modificado');
      g(); return c;
    },
    registrar(id) {
      const c = BD.ccd(id); exigir(c && c.estado === 'Borrador', 'Solo se registra un comprobante en Borrador');
      exigir(c.ocs.length, 'Elija al menos una OC recibida');
      exigir(c.costos.length && ccd.totalCostos(c) > 0, 'Agregue al menos un costo');
      c.reparto = ccd.repartir(c);
      const x = revalorizarEnStock(ccd._porArt(c.reparto, 1), { det: 'Revalorización - Costos de destino', ndoc: c.id, doc: 'Costos de destino',
        concepto: [...new Set(c.costos.map(k => k.tipo))].map(t => t + ' · ' + ccd.TIPOS[t]).join(', '), obs: 'OC ' + c.ocs.join(', '), fecha: c.fecha });
      c.movs = x.movs; c.variacion = x.variacion;
      c.estado = 'Registrado';
      BD.hist(c, 'Registrado', 'S/ ' + ccd.totalCostos(c) + ' repartido por ' + c.base.toLowerCase() + (c.movs.length ? ' · ' + c.movs.join(', ') : '') + (c.variacion.length ? ' · a variación: S/ ' + BD.r2(c.variacion.reduce((t, v) => t + v.monto, 0)) : ''));
      c.ocs.forEach(id => BD.hist(BD.oc(id), 'Costos de destino ' + c.id, 'S/ ' + ccd.totalCostos(c)));
      g(); return c;
    },
    anular(id, motivo) {
      const c = BD.ccd(id); exigir(c && c.estado !== 'Anulado', 'El comprobante ya está anulado');
      exigir(String(motivo || '').trim(), 'Indique el motivo');
      if (c.estado === 'Registrado') {
        const x = revalorizarEnStock(ccd._porArt(c.reparto, -1), { det: 'Revalorización - Anulación de costos de destino', ndoc: c.id, doc: 'Costos de destino', obs: motivo });
        c.movs = c.movs.concat(x.movs);
      }
      c.estado = 'Anulado'; BD.hist(c, 'Anulado', motivo, 'no');
      g(); return c;
    }
  };

  /* ================= Sugerido de compras (cálculo) ================= */
  /* Sugerido = Stock mínimo + lo que les falta a las órdenes abiertas sin Solicitud de Materiales − Disponible − Pedido (si sale negativo, 0).
     Una SF aprobada ya comprometió su materia prima: si no alcanza, el Disponible queda negativo y el déficit entra solo. */
  const sug = {
    /* lo que aún necesitan las órdenes abiertas y no se ha pedido con una Solicitud de Materiales */
    _ordenes() {
      const req = {};
      (BD.d.ofs || []).filter(o => o.estado === 'Planificado' || o.estado === 'Liberado').forEach(of => {
        const conSol = new Set((BD.d.sols || []).filter(s => s.of === of.id && !['Anulada', 'Rechazada'].includes(s.estado)).flatMap(s => s.lineas.map(l => l.art)));
        (of.mats || []).filter(m => !m.fab && !conSol.has(m.cod)).forEach(m => {
          const falta = BD.r4(m.plan - m.consumido - m.comp); if (falta <= 0) return;
          (req[m.cod] = req[m.cod] || { cant: 0, ofs: [] }).cant = BD.r4(req[m.cod].cant + falta);
          req[m.cod].ofs.push(of.id);
        });
      });
      return req;
    },
    _almCompra(art) {
      const m = (BD.d.movs || []).find(x => (x.tipoMov === 'ING-COMPRA' || x.tipoMov === 'ING-IMPORT') && x.lineas.some(l => l.art === art));
      return m ? m.alm : '';
    },
    calcular() {
      const ord = sug._ordenes();
      return BD.d.maestros.articulos.filter(a => a.estado !== 'Inactivo' && a.compra && Stock.inventariable(a.cod)).map(a => {
        const min = Number(a.stockMin) || 0, disp = Stock.totalDisp(a.cod), ped = BD.r4(BD.d.stock.filter(s => s.art === a.cod).reduce((t, s) => t + (s.ped || 0), 0));
        const o = ord[a.cod] || { cant: 0, ofs: [] };
        let s = BD.r4(Math.max(0, min + o.cant - disp - ped));
        if (s > 0 && a.u === 'UND') s = Math.ceil(s);
        return { art: a.cod, nom: a.nom, u: a.u, grupo: a.grupo, cat: a.cat, prov: a.provDef || '', pu: a.precioCompra || a.costo || 0,
          min, ordenes: o.cant, ofs: o.ofs, disp, ped, sug: s, alm: sug._almCompra(a.cod) };
      }).filter(r => r.sug > 0 || r.min > 0 || r.ordenes > 0);
    },
    /* crea una OC en borrador por proveedor con lo sugerido. filas = [{art, cant}] */
    crearOC(prov, filas, alm) {
      exigir(prov && BD.prov(prov), 'El artículo no tiene proveedor por defecto: elíjalo en su ficha (GI-02)');
      const items = (filas || []).filter(f => Number(f.cant) > 0).map(f => { const a = BD.art(f.art) || {}; return { art: f.art, cant: f.cant, pu: a.precioCompra || a.costo || 0 }; });
      exigir(items.length, 'No hay cantidades sugeridas');
      const o = oc.crear({ prov, almDestino: alm || '', obs: 'Desde el sugerido de compras (CO-15)', items });
      BD.hist(o, 'Desde el sugerido de compras', items.length + ' artículo(s)');
      g(); return o;
    }
  };

  Object.assign(Docs, { rec, nc, ccd, sug });
})();
