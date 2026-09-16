/* COMPARTIDO · documentos que cruzan módulos. Cada operación valida, modifica BD.d, deja historial y GUARDA (BD.guardar()).
   Los errores se lanzan como Error con un mensaje para el usuario (las pantallas lo muestran con toast).
   - Docs.sf   Solicitud de Fabricación (SF-000001): Comercial/Logística crean y aprueban; Producción crea las órdenes.
   - Docs.sol  Solicitud de Materiales (SOL-000001): cualquier área pide qué y a dónde; Logística define por línea Transferencia o Compra.
   - Docs.oc   Orden de Compra (OC-000001): de bienes (se recibe con Ingreso) o de servicio (se da conformidad, sin stock).
   - Docs.fac  Factura de proveedor (FC-000001).
   - Docs.trf  Solicitud de Transferencia (ST-000001) en dos pasos (decisiones T2/T7): aprobar compromete origen y suma Pedido en destino; recibir mueve.
   - Docs.gre  Guía de Remisión Electrónica (T001-000001) de traslados (p. ej. envío a un servicio de terceros).
   Las órdenes de fabricación (BD.d.ofs) las maneja Producción; aquí solo se enlazan. */
const Docs = (() => {
  const g = () => BD.guardar();
  const exigir = (cond, msg) => { if (!cond) BD.error(msg); };
  const num = v => { const n = Number(v); return isFinite(n) ? n : NaN; };

  /* ================= Solicitud de Fabricación ================= */
  const EST_SF = ['Borrador', 'Pendiente Aprobar', 'Aprobada', 'Rechazada', 'Convertida en Orden', 'Fabricada'];
  const sf = {
    ESTADOS: EST_SF,
    editable(s) { return !!s && (s.est === 'Borrador' || s.est === 'Pendiente Aprobar' || s.est === 'Rechazada'); },
    _lineas(lineas) {
      const out = (lineas || []).filter(l => l.art).map(l => ({ art: l.art, cant: BD.r4(num(l.cant)), ldm: l.ldm || (BD.ldmPred(l.art) || {}).id || '' }));
      out.forEach(l => {
        exigir(BD.art(l.art), 'No existe el artículo ' + l.art);
        exigir(l.cant > 0, 'Cantidad no válida en ' + BD.nomArt(l.art));
        exigir(!l.ldm || (BD.ldm(l.ldm) || {}).art === l.art, BD.nomArt(l.art) + ' no tiene la lista ' + l.ldm);
      });
      return out;
    },
    /* d = {solic, mes, almDestino, fechaReq, obs, lineas:[{art, cant, ldm}]} */
    crear(d) {
      const s = {
        id: BD.sig('sf', 'SF-', 6), fecha: BD.hoy(), mes: d.mes || '', solic: d.solic || BD.usuario, almDestino: d.almDestino || '', fechaReq: d.fechaReq || '',
        est: 'Borrador', vb: false, ger: false, obs: d.obs || '', lineas: sf._lineas(d.lineas), ofs: [], ref: '', comprometido: [], hist: []
      };
      BD.d.sfs.unshift(s);
      BD.hist(s, 'Creada en borrador');
      g(); return s;
    },
    guardar(id, d) {
      const s = BD.sf(id); exigir(s, 'No existe la solicitud ' + id);
      exigir(sf.editable(s), 'La solicitud ' + id + ' está ' + s.est + ': no se edita');
      ['mes', 'solic', 'almDestino', 'fechaReq', 'obs'].forEach(k => { if (d[k] != null) s[k] = d[k]; });
      if (d.lineas) s.lineas = sf._lineas(d.lineas);
      BD.hist(s, 'Modificada');
      g(); return s;
    },
    enviar(id) {
      const s = BD.sf(id); exigir(s, 'No existe la solicitud ' + id);
      exigir(s.est === 'Borrador' || s.est === 'Rechazada', 'Solo se envía una solicitud en Borrador o Rechazada');
      exigir(s.lineas.length, 'Agregue al menos un artículo');
      exigir(s.almDestino && BD.alm(s.almDestino), 'Elija el almacén destino');
      Object.assign(s, { est: 'Pendiente Aprobar', vb: false, ger: false });
      BD.hist(s, 'Enviada a aprobación');
      g(); return s;
    },
    _cerrar(s) {
      if (!(s.vb && s.ger)) return;
      s.est = 'Aprobada';
      s.comprometido = Explosion.bruto(s.lineas);
      s.comprometido.forEach(r => Stock.comprometer(r.alm, r.art, r.cant));
      BD.hist(s, 'Aprobada', 'Materia prima comprometida: ' + s.comprometido.length + ' material(es). Las órdenes se crean en Producción (PR-03)');
    },
    darVB(id) {
      const s = BD.sf(id); exigir(s && s.est === 'Pendiente Aprobar', 'Solo se da V°B° a una solicitud Pendiente Aprobar');
      s.vb = true; BD.hist(s, 'V°B° Logística'); sf._cerrar(s);
      g(); return s;
    },
    aprobar(id) {
      const s = BD.sf(id); exigir(s && s.est === 'Pendiente Aprobar', 'Solo se aprueba una solicitud Pendiente Aprobar');
      s.ger = true; BD.hist(s, 'Aprobación Gerencia'); sf._cerrar(s);
      g(); return s;
    },
    rechazar(id, motivo) {
      const s = BD.sf(id); exigir(s && s.est === 'Pendiente Aprobar', 'Solo se rechaza una solicitud Pendiente Aprobar');
      exigir(String(motivo || '').trim(), 'Indique el motivo del rechazo');
      Object.assign(s, { est: 'Rechazada', vb: false, ger: false });
      BD.hist(s, 'Rechazada', motivo, 'no');
      g(); return s;
    },
    devolver(id, motivo) {
      const s = BD.sf(id); exigir(s && s.est === 'Pendiente Aprobar', 'Solo se devuelve una solicitud Pendiente Aprobar');
      Object.assign(s, { est: 'Borrador', vb: false, ger: false });
      BD.hist(s, 'Devuelta para modificar', motivo || '', 'pend');
      g(); return s;
    },
    /* Producción: al crear las órdenes. Libera lo comprometido por la solicitud (las órdenes comprometen lo suyo) si liberar !== false */
    convertir(id, ofs, ref, liberar) {
      const s = BD.sf(id); exigir(s && s.est === 'Aprobada', 'Solo se crean órdenes de una solicitud Aprobada');
      if (liberar !== false) (s.comprometido || []).forEach(r => Stock.liberar(r.alm, r.art, r.cant));
      Object.assign(s, { est: 'Convertida en Orden', ofs: ofs.slice(), ref: ref || '' });
      BD.hist(s, 'Órdenes de fabricación creadas', ofs.join(', ') + (ref ? ' · referencia ' + ref : ''));
      g(); return s;
    },
    fabricada(id) {
      const s = BD.sf(id); if (!s || s.est === 'Fabricada') return s;
      s.est = 'Fabricada'; BD.hist(s, 'Fabricada', 'Todas sus órdenes están cerradas');
      g(); return s;
    },
    total(s) { return BD.r4(s.lineas.reduce((t, l) => t + l.cant, 0)); }
  };

  /* ================= Solicitud de Materiales ================= */
  /* estados: Borrador → Pendiente → Aprobada (Logística definió el propósito de cada línea) → En proceso → Atendida | Rechazada | Anulada
     estado de línea: Pendiente → En transferencia → Transferido | En compra → Recibido */
  const sol = {
    ESTADOS: ['Borrador', 'Pendiente', 'Aprobada', 'En proceso', 'Atendida', 'Rechazada', 'Anulada'],
    PROPOSITOS: ['Transferencia', 'Compra'],
    _lineas(lineas) {
      const out = (lineas || []).filter(l => l.art).map(l => ({ art: l.art, cant: BD.r4(num(l.cant)), prop: '', origen: '', doc: '', estado: 'Pendiente' }));
      out.forEach(l => { exigir(BD.art(l.art) || BD.rec(l.art), 'No existe ' + l.art); exigir(l.cant > 0, 'Cantidad no válida en ' + BD.nomArt(l.art)); });
      return out;
    },
    /* d = {area:'Producción'|'Logística'|'Comercial', solicita, destino, fechaReq, obs, of, ref, sf, lineas:[{art, cant}]}; enviar: true la deja Pendiente */
    crear(d, enviar) {
      const lineas = sol._lineas(d.lineas);
      exigir(lineas.length, 'Agregue al menos una línea');
      const s = {
        id: BD.sig('sol', 'SOL-', 6), fecha: BD.ahora(), area: d.area || '', solicita: d.solicita || BD.usuario, destino: d.destino || '', fechaReq: d.fechaReq || '',
        obs: d.obs || '', of: d.of || '', ref: d.ref || '', sf: d.sf || '', estado: 'Borrador', lineas, nota: '', hist: []
      };
      exigir(!s.destino || BD.alm(s.destino), 'Almacén destino no válido');
      BD.d.sols.unshift(s);
      BD.hist(s, 'Creada', (s.of ? 'para ' + s.of + ' · ' : '') + lineas.length + ' línea(s)');
      if (enviar) { exigir(s.destino, 'Elija el almacén destino'); s.estado = 'Pendiente'; BD.hist(s, 'Enviada a Logística'); }
      g(); return s;
    },
    guardar(id, d) {
      const s = BD.sol(id); exigir(s && s.estado === 'Borrador', 'Solo se edita una solicitud en Borrador');
      ['destino', 'fechaReq', 'obs'].forEach(k => { if (d[k] != null) s[k] = d[k]; });
      if (d.lineas) s.lineas = sol._lineas(d.lineas);
      g(); return s;
    },
    enviar(id) {
      const s = BD.sol(id); exigir(s && s.estado === 'Borrador', 'Solo se envía una solicitud en Borrador');
      exigir(s.destino && BD.alm(s.destino), 'Elija el almacén destino');
      s.estado = 'Pendiente'; BD.hist(s, 'Enviada a Logística');
      g(); return s;
    },
    /* Logística: decisiones = [{prop:'Transferencia'|'Compra', origen}] por línea (misma posición) */
    aprobar(id, decisiones) {
      const s = BD.sol(id); exigir(s && s.estado === 'Pendiente', 'Solo se aprueba una solicitud Pendiente');
      s.lineas.forEach((l, i) => {
        const x = (decisiones || [])[i] || {}, n = 'Línea ' + (i + 1) + ' (' + BD.nomArt(l.art) + '): ';
        exigir(x.prop === 'Transferencia' || x.prop === 'Compra', n + 'defina el propósito');
        if (x.prop === 'Transferencia') {
          exigir(!BD.esServicio(l.art), n + 'un servicio no se transfiere, se compra');
          exigir(x.origen && BD.alm(x.origen), n + 'elija el almacén de origen');
          exigir(x.origen !== s.destino, n + 'el origen no puede ser el destino');
        }
        l.prop = x.prop; l.origen = x.prop === 'Transferencia' ? x.origen : '';
      });
      s.estado = 'Aprobada';
      const nc = s.lineas.filter(l => l.prop === 'Compra').length;
      s.nota = 'Aprobada: ' + [nc ? nc + ' línea(s) para Compra' : '', s.lineas.length - nc ? (s.lineas.length - nc) + ' para Transferencia' : ''].filter(Boolean).join(' y ');
      BD.hist(s, 'Aprobada por Logística', s.nota);
      g(); return s;
    },
    rechazar(id, motivo) {
      const s = BD.sol(id); exigir(s && s.estado === 'Pendiente', 'Solo se rechaza una solicitud Pendiente');
      exigir(String(motivo || '').trim(), 'Indique el motivo');
      s.estado = 'Rechazada'; s.nota = motivo; BD.hist(s, 'Rechazada', motivo, 'no');
      g(); return s;
    },
    anular(id, motivo) {
      const s = BD.sol(id); exigir(s && (s.estado === 'Borrador' || s.estado === 'Pendiente'), 'Solo se anula una solicitud en Borrador o Pendiente');
      s.estado = 'Anulada'; BD.hist(s, 'Anulada', motivo || '', 'no');
      g(); return s;
    },
    /* Logística crea la Solicitud de Transferencia (GI-11) de las líneas con ese origen; queda APROBADA (compromete origen, Pedido en destino).
       La línea pasa a «Transferido» cuando se confirma la recepción en GI-11 (Docs.trf.recibir). */
    transferir(id, origen) {
      const s = BD.sol(id); exigir(s && (s.estado === 'Aprobada' || s.estado === 'En proceso'), 'La solicitud no está aprobada');
      const ls = s.lineas.filter(l => l.prop === 'Transferencia' && l.origen === origen && l.estado === 'Pendiente');
      exigir(ls.length, 'No hay líneas pendientes para transferir desde ' + origen);
      const t = trf.crear({ origen, destino: s.destino, tipoMov: (BD.alm(s.destino) || {}).transito ? 'TRF-FABRIC' : 'TRF-INTERNO', sol: s.id, of: s.of, obs: 'Atiende ' + s.id, lineas: ls.map(l => ({ art: l.art, cant: l.cant })) });
      trf.aprobar(t.id);
      ls.forEach(l => { l.estado = 'En transferencia'; l.doc = t.id; });
      BD.hist(s, 'Solicitud de transferencia ' + t.id, origen + ' → ' + s.destino);
      sol._actualizar(s);
      g(); return t;
    },
    /* la llama Docs.trf al confirmar la recepción */
    _transferido(solId, art, cant, trfId) {
      const s = BD.sol(solId); if (!s) return;
      const l = s.lineas.find(x => x.art === art && x.doc === trfId && x.estado === 'En transferencia');
      if (!l) return;
      l.recibido = BD.r4((l.recibido || 0) + cant);
      if (l.recibido + 0.00005 >= l.cant) l.estado = 'Transferido';
      sol._actualizar(s);
    },
    /* Logística crea la OC de las líneas de Compra pendientes. d = {prov, precios:{art: pu}, cond, mon, tc, obs} */
    crearOC(id, d) {
      const s = BD.sol(id); exigir(s && (s.estado === 'Aprobada' || s.estado === 'En proceso'), 'La solicitud no está aprobada');
      const ls = s.lineas.filter(l => l.prop === 'Compra' && l.estado === 'Pendiente');
      exigir(ls.length, 'No hay líneas de Compra pendientes');
      d = d || {};
      const precios = d.precios || {};
      const o = oc.crear({ prov: d.prov || '', sol: s.id, of: s.of, sf: s.sf, almDestino: s.destino, cond: d.cond, mon: d.mon, tc: d.tc, obs: d.obs || ('Desde ' + s.id + (s.of ? ' · ' + s.of : '')),
        items: ls.map(l => ({ art: l.art, cant: l.cant, pu: precios[l.art] != null ? precios[l.art] : ((BD.rec(l.art) || {}).costo || (BD.art(l.art) || {}).precioCompra || 0) })) });
      ls.forEach(l => { l.estado = 'En compra'; l.doc = o.id; });
      BD.hist(s, 'Orden de compra ' + o.id, ls.length + ' línea(s)');
      sol._actualizar(s);
      g(); return o;
    },
    /* la llama Docs.oc al recibir / dar conformidad */
    _recibido(solId, art, cant, ocId) {
      const s = BD.sol(solId); if (!s) return;
      const l = s.lineas.find(x => x.art === art && x.doc === ocId && x.estado === 'En compra');
      if (!l) return;
      l.recibido = BD.r4((l.recibido || 0) + cant);
      if (l.recibido + 0.00005 >= l.cant) l.estado = 'Recibido';
      sol._actualizar(s);
    },
    _actualizar(s) {
      if (s.estado === 'Rechazada' || s.estado === 'Anulada') return;
      const cerradas = s.lineas.filter(l => l.estado === 'Transferido' || l.estado === 'Recibido').length;
      const movidas = s.lineas.filter(l => l.estado !== 'Pendiente').length;
      if (cerradas === s.lineas.length) { if (s.estado !== 'Atendida') { s.estado = 'Atendida'; BD.hist(s, 'Atendida'); } }
      else if (movidas) s.estado = 'En proceso';
    }
  };

  /* ================= Orden de Compra ================= */
  /* estados: Borrador → Pendiente de Validar → (V°B° Logística + aprobación Gerencia) → Para Recibir y Pagar → Para Pagar | Para Recibir → Completada · Cancelada */
  const oc = {
    ESTADOS: ['Borrador', 'Pendiente de Validar', 'Para Recibir y Pagar', 'Para Recibir', 'Para Pagar', 'Completada', 'Cancelada'],
    esServicio(o) { return o.items.length > 0 && o.items.every(it => BD.esServicio(it.art)); },
    _items(items) {
      const out = (items || []).filter(i => i.art).map(i => ({ art: i.art, cant: BD.r4(num(i.cant)), pu: BD.r4(num(i.pu) || 0), igv: i.igv == null ? 18 : Number(i.igv), recq: 0, facq: 0 }));
      out.forEach(i => { exigir(BD.art(i.art), 'No existe el artículo ' + i.art); exigir(i.cant > 0, 'Cantidad no válida en ' + BD.nomArt(i.art)); });
      return out;
    },
    /* d = {prov, sol, of, sf, almDestino, fecha, cond, mon, tc, ref, obs, items:[{art, cant, pu, igv}]} */
    crear(d) {
      const items = oc._items(d.items); exigir(items.length, 'Agregue al menos un artículo');
      exigir(!d.prov || BD.prov(d.prov), 'Proveedor no válido');
      const p = BD.prov(d.prov) || {};
      const o = {
        id: BD.sig('oc', 'OC-', 6), est: 'Borrador', fecha: d.fecha || BD.hoy(), prov: d.prov || '', cond: d.cond || p.cond || 'Contado', mon: d.mon || p.mon || 'S/.', tc: Number(d.tc) || 3.75,
        ref: d.ref || '', obs: d.obs || '', sol: d.sol || '', of: d.of || '', sf: d.sf || '', almDestino: d.almDestino || '', valLog: false, valGer: false,
        orgCompra: d.orgCompra || 'SB', grupoCompra: d.grupoCompra || '',
        items, recepciones: [], facturas: [], hist: []
      };
      o.tipo = oc.esServicio(o) ? 'Servicio' : 'Bienes';
      if (!o.grupoCompra) o.grupoCompra = p.tipo === 'Internacional' ? 'IMP' : o.tipo === 'Servicio' ? 'SRV' : ((BD.art(items[0].art) || {}).grupoCompra || 'MP1');
      BD.d.ocs.unshift(o);
      BD.hist(o, 'Creada en borrador', (o.sol ? 'desde ' + o.sol : 'OC directa') + (o.of ? ' · ' + o.of : ''));
      g(); return o;
    },
    guardar(id, d) {
      const o = BD.oc(id); exigir(o && o.est === 'Borrador', 'Solo se edita una OC en Borrador');
      ['prov', 'fecha', 'cond', 'mon', 'tc', 'ref', 'obs', 'almDestino', 'of', 'orgCompra', 'grupoCompra'].forEach(k => { if (d[k] != null) o[k] = d[k]; });
      if (d.items) o.items = oc._items(d.items);
      o.tipo = oc.esServicio(o) ? 'Servicio' : 'Bienes';
      g(); return o;
    },
    enviar(id) {
      const o = BD.oc(id); exigir(o && o.est === 'Borrador', 'Solo se envía una OC en Borrador');
      exigir(BD.prov(o.prov), 'Elija el proveedor');
      exigir(o.items.every(i => i.pu > 0), 'Todas las líneas deben tener precio');
      o.est = 'Pendiente de Validar'; BD.hist(o, 'Enviada a validación');
      g(); return o;
    },
    validar(id) {
      const o = BD.oc(id); exigir(o && o.est === 'Pendiente de Validar', 'La OC no está pendiente de validar');
      o.valLog = true; BD.hist(o, 'V°B° Logística'); oc._aprobada(o);
      g(); return o;
    },
    aprobar(id) {
      const o = BD.oc(id); exigir(o && o.est === 'Pendiente de Validar', 'La OC no está pendiente de validar');
      o.valGer = true; BD.hist(o, 'Aprobación Gerencia'); oc._aprobada(o);
      g(); return o;
    },
    _aprobada(o) {
      if (!(o.valLog && o.valGer)) return;
      o.est = 'Para Recibir y Pagar';
      BD.hist(o, 'Aprobada', 'Lista para recibir y facturar');
      /* T1/M13: la mercadería de una OC de bienes aprobada suma Pedido en su almacén destino */
      if (o.almDestino) o.items.filter(i => !BD.esServicio(i.art)).forEach(i => Stock.pedido(o.almDestino, i.art, i.cant, 1));
      /* servicio de una orden de fabricación: la OC queda en su pestaña Costo para el contraste con el estándar */
      if (o.of) o.items.filter(i => BD.esServicio(i.art)).forEach(i => oc._aOF(o.of, { tipo: 'OC', doc: o.id, rec: i.art, prov: o.prov, cant: i.cant, importe: BD.r2(i.cant * i.pu * (o.mon === 'USD' ? o.tc : 1)) }));
    },
    _aOF(ofId, c) {
      const f = BD.of(ofId); if (!f) return;
      (f.compras = f.compras || []).push(Object.assign({ f: BD.ahora(), u: BD.usuario }, c));
      (f.hist = f.hist || []).push({ f: BD.ahora(), a: c.tipo + ' ' + c.doc, d: BD.nomArt(c.rec) + ' · S/ ' + c.importe, u: BD.usuario });
    },
    cancelar(id, motivo) {
      const o = BD.oc(id); exigir(o && ['Borrador', 'Pendiente de Validar', 'Para Recibir y Pagar'].includes(o.est) && !o.recepciones.length && !o.facturas.length, 'Solo se cancela una OC sin recepciones ni facturas');
      if (o.est === 'Para Recibir y Pagar' && o.almDestino) o.items.filter(i => !BD.esServicio(i.art)).forEach(i => Stock.pedido(o.almDestino, i.art, BD.r4(i.cant - i.recq), -1));
      o.est = 'Cancelada'; BD.hist(o, 'Cancelada', motivo || '', 'no');
      if (o.sol) { const s = BD.sol(o.sol); if (s) { s.lineas.forEach(l => { if (l.doc === o.id && l.estado === 'En compra') { l.estado = 'Pendiente'; l.doc = ''; } }); sol._actualizar(s); } }
      g(); return o;
    },
    avance(o) {
      const tot = o.items.reduce((t, i) => t + i.cant, 0) || 1;
      return { rec: Math.round(100 * o.items.reduce((t, i) => t + Math.min(i.recq, i.cant), 0) / tot), fac: Math.round(100 * o.items.reduce((t, i) => t + Math.min(i.facq, i.cant), 0) / tot) };
    },
    _estado(o) {
      if (o.est === 'Cancelada' || o.est === 'Borrador' || o.est === 'Pendiente de Validar') return;
      const a = oc.avance(o);
      o.est = a.rec >= 100 && a.fac >= 100 ? 'Completada' : a.rec >= 100 ? 'Para Pagar' : a.fac >= 100 ? 'Para Recibir' : 'Para Recibir y Pagar';
    },
    recibible(o) { return ['Para Recibir y Pagar', 'Para Recibir'].includes(o.est); },
    /* bienes: Ingreso al almacén (GI-09). d = {alm, lineas:[{art, cant}], obs} */
    recibir(id, d) {
      const o = BD.oc(id); exigir(o && oc.recibible(o), 'La OC no está para recibir');
      const alm = d.alm || o.almDestino; exigir(BD.alm(alm), 'Elija el almacén de ingreso');
      const lineas = (d.lineas || o.items.map(i => ({ art: i.art, cant: BD.r4(i.cant - i.recq) }))).filter(l => Number(l.cant) > 0);
      exigir(lineas.length, 'Nada que recibir');
      lineas.forEach(l => {
        const it = o.items.find(i => i.art === l.art); exigir(it, BD.nomArt(l.art) + ' no está en la OC');
        exigir(!BD.esServicio(l.art), 'Un servicio no se recibe en almacén: registre la conformidad');
        exigir(it.recq + Number(l.cant) <= it.cant + 0.00005, 'No se recibe más de lo pedido: ' + BD.nomArt(l.art));
      });
      const factor = o.mon === 'USD' ? o.tc : 1;
      const intl = (BD.prov(o.prov) || {}).tipo === 'Internacional';
      const r = Stock.ingreso({ det: intl ? 'Ingreso - Importación' : 'Ingreso - Compra', tipoMov: intl ? 'ING-IMPORT' : 'ING-COMPRA', alm, origen: BD.provNom(o.prov), ndoc: o.id, doc: o.id, modulo: 'Inventarios', obs: d.obs || '',
        lineas: lineas.map(l => ({ art: l.art, cant: l.cant, costo: BD.r4(o.items.find(i => i.art === l.art).pu * factor) })) });
      exigir(r.ok, r.error);
      lineas.forEach(l => {
        const it = o.items.find(i => i.art === l.art);
        if (o.almDestino) Stock.pedido(o.almDestino, l.art, Math.min(Number(l.cant), BD.r4(it.cant - it.recq)), -1);
        it.recq = BD.r4(it.recq + Number(l.cant));
        if (o.sol) sol._recibido(o.sol, l.art, Number(l.cant), o.id);
      });
      o.recepciones.push({ tipo: 'Ingreso', fecha: BD.ahora(), mov: r.mov.id, alm, lineas: lineas.map(l => ({ art: l.art, cant: BD.r4(l.cant) })) });
      BD.hist(o, 'Ingreso ' + r.mov.id, alm);
      oc._estado(o);
      g(); return r.mov;
    },
    /* servicios: conformidad del servicio recibido (sin movimiento de stock). d = {lineas:[{art, cant}], conforme: true, obs} */
    conformidad(id, d) {
      const o = BD.oc(id); exigir(o && oc.recibible(o), 'La OC no está para recibir');
      d = d || {};
      const lineas = (d.lineas || o.items.map(i => ({ art: i.art, cant: BD.r4(i.cant - i.recq) }))).filter(l => Number(l.cant) > 0);
      exigir(lineas.length, 'Nada que dar conformidad');
      lineas.forEach(l => {
        const it = o.items.find(i => i.art === l.art); exigir(it, BD.nomArt(l.art) + ' no está en la OC');
        exigir(it.recq + Number(l.cant) <= it.cant + 0.00005, 'No se da conformidad por más de lo pedido: ' + BD.nomArt(l.art));
        it.recq = BD.r4(it.recq + Number(l.cant));
        if (o.sol) sol._recibido(o.sol, l.art, Number(l.cant), o.id);
      });
      o.recepciones.push({ tipo: 'Conformidad', fecha: BD.ahora(), conforme: d.conforme !== false, obs: d.obs || '', lineas: lineas.map(l => ({ art: l.art, cant: BD.r4(l.cant) })) });
      BD.hist(o, d.conforme === false ? 'Servicio observado' : 'Conformidad del servicio', lineas.map(l => BD.nomArt(l.art) + ' ' + l.cant).join(', '), d.conforme === false ? 'no' : 'ok');
      oc._estado(o);
      g(); return o;
    },
    totales(o) {
      const sub = BD.r2(o.items.reduce((t, i) => t + i.cant * i.pu, 0)), igv = BD.r2(o.items.reduce((t, i) => t + i.cant * i.pu * (i.igv || 0) / 100, 0));
      return { sub, igv, total: BD.r2(sub + igv) };
    }
  };

  /* ================= Factura de proveedor ================= */
  const fac = {
    ESTADOS: ['Impagado', 'Pagado', 'Anulada'],
    /* d = {oc, ndoc, fecha, lineas:[{art, cant, pu}], obs}; sin lineas factura lo pendiente de facturar de la OC */
    crear(d) {
      const o = BD.oc(d.oc); exigir(o && !['Borrador', 'Pendiente de Validar', 'Cancelada'].includes(o.est), 'La OC no está aprobada');
      exigir(String(d.ndoc || '').trim(), 'Indique el número de la factura del proveedor');
      const lineas = (d.lineas || o.items.map(i => ({ art: i.art, cant: BD.r4(i.cant - i.facq), pu: i.pu }))).filter(l => Number(l.cant) > 0);
      exigir(lineas.length, 'La OC ya está facturada');
      lineas.forEach(l => { const it = o.items.find(i => i.art === l.art); exigir(it, BD.nomArt(l.art) + ' no está en la OC'); exigir(it.facq + Number(l.cant) <= it.cant + 0.00005, 'No se factura más de lo pedido: ' + BD.nomArt(l.art)); });
      const f = { id: BD.sig('fac', 'FC-', 6), oc: o.id, prov: o.prov, ndoc: d.ndoc, fecha: d.fecha || BD.hoy(), cond: o.cond, mon: o.mon, tc: o.tc, est: 'Impagado', obs: d.obs || '',
        items: lineas.map(l => { const it = o.items.find(i => i.art === l.art); return { art: l.art, cant: BD.r4(l.cant), pu: BD.r4(l.pu != null ? l.pu : it.pu), igv: it.igv }; }), hist: [] };
      f.items.forEach(l => { const it = o.items.find(i => i.art === l.art); it.facq = BD.r4(it.facq + l.cant); });
      BD.d.facturas.unshift(f);
      o.facturas.push(f.id);
      BD.hist(f, 'Registrada', 'OC ' + o.id);
      BD.hist(o, 'Factura ' + f.id, d.ndoc);
      if (o.of) f.items.filter(i => BD.esServicio(i.art)).forEach(i => oc._aOF(o.of, { tipo: 'Factura', doc: d.ndoc + ' (' + f.id + ')', rec: i.art, prov: o.prov, cant: i.cant, importe: BD.r2(i.cant * i.pu * (o.mon === 'USD' ? o.tc : 1)) }));
      oc._estado(o);
      g(); return f;
    },
    pagar(id) {
      const f = BD.fac(id); exigir(f && f.est === 'Impagado', 'La factura no está impaga');
      f.est = 'Pagado'; BD.hist(f, 'Pagada', 'Tesorería');
      g(); return f;
    },
    total(f) { return BD.r2(f.items.reduce((t, i) => t + i.cant * i.pu * (1 + (i.igv || 0) / 100), 0)); }
  };

  /* ================= Solicitud de Transferencia (GI-11, dos pasos · decisiones T2/T7) ================= */
  /* estados: Borrador → Aprobada (compromete en origen, suma Pedido en destino) → Parcial → Recibida · Cancelada (libera lo pendiente) */
  const trf = {
    ESTADOS: ['Borrador', 'Aprobada', 'Parcial', 'Recibida', 'Cancelada'],
    TIPOS: ['TRF-INTERNO', 'TRF-REPTIENDA', 'TRF-ENTRETIENDA', 'TRF-LIQUID', 'TRF-FABRIC'],
    /* d = {origen, destino, tipoMov, obs, sol, of, lineas:[{art, cant}]} */
    crear(d) {
      exigir(BD.alm(d.origen) && BD.alm(d.destino), 'Elija el almacén de origen y el de destino');
      exigir(d.origen !== d.destino, 'El origen y el destino no pueden ser el mismo almacén');
      const tipoMov = d.tipoMov || 'TRF-INTERNO';
      exigir(trf.TIPOS.includes(tipoMov), 'Tipo de transferencia no válido: ' + tipoMov);
      const lineas = (d.lineas || []).filter(l => l.art).map(l => ({ art: l.art, cant: BD.r4(num(l.cant)), recibido: 0 }));
      exigir(lineas.length, 'Agregue al menos un artículo');
      lineas.forEach(l => { exigir(Stock.inventariable(l.art), BD.nomArt(l.art) + ' no maneja stock'); exigir(l.cant > 0, 'Cantidad no válida en ' + BD.nomArt(l.art)); });
      const t = { id: BD.sig('st', 'ST-', 6), fecha: d.fecha || BD.ahora(), origen: d.origen, destino: d.destino, tipoMov, estado: 'Borrador', obs: d.obs || '', sol: d.sol || '', of: d.of || '', movs: [], lineas, hist: [] };
      (BD.d.trfs = BD.d.trfs || []).unshift(t);
      BD.hist(t, 'Creada', d.origen + ' → ' + d.destino);
      g(); return t;
    },
    /* paso 1: aprobar compromete el stock del origen (debe estar disponible) y suma Pedido en el destino */
    aprobar(id) {
      const t = BD.trf(id); exigir(t && t.estado === 'Borrador', 'Solo se aprueba una solicitud de transferencia en Borrador');
      const falt = Stock.faltantes(t.origen, t.lineas, true);
      if (falt.length) BD.error('No se puede aprobar. ' + Stock.textoFaltantes(t.origen, falt));
      t.lineas.forEach(l => { Stock.comprometer(t.origen, l.art, l.cant); Stock.pedido(t.destino, l.art, l.cant, 1); });
      t.estado = 'Aprobada';
      BD.hist(t, 'Aprobada', 'Comprometido en ' + t.origen + ' y Pedido en ' + t.destino);
      g(); return t;
    },
    pendiente(l) { return BD.r4(l.cant - (l.recibido || 0)); },
    /* paso 2: confirmar la recepción (parcial o total). lineas: [{art, cant}]; sin lineas recibe todo lo pendiente */
    recibir(id, lineas, obs) {
      const t = BD.trf(id); exigir(t && (t.estado === 'Aprobada' || t.estado === 'Parcial'), 'La solicitud de transferencia no está aprobada');
      const rec = (lineas || t.lineas.map(l => ({ art: l.art, cant: trf.pendiente(l) }))).filter(x => Number(x.cant) > 0);
      exigir(rec.length, 'Nada pendiente de recibir');
      rec.forEach(x => {
        const l = t.lineas.find(y => y.art === x.art);
        exigir(l, BD.nomArt(x.art) + ' no está en ' + id);
        exigir(Number(x.cant) <= trf.pendiente(l) + 0.00005, 'No se recibe más de lo pendiente: ' + BD.nomArt(x.art));
      });
      const r = Stock.transferencia({ det: 'Transferencia ' + t.id, tipoMov: t.tipoMov, origen: t.origen, destino: t.destino, ndoc: t.of || t.sol || t.id, doc: t.id, obs: obs || t.obs, modulo: 'Inventarios',
        lineas: rec.map(x => ({ art: x.art, cant: Number(x.cant), liberar: Number(x.cant), pedido: Number(x.cant) })) });
      exigir(r.ok, r.error);
      rec.forEach(x => {
        const l = t.lineas.find(y => y.art === x.art);
        l.recibido = BD.r4((l.recibido || 0) + Number(x.cant));
        if (t.sol) sol._transferido(t.sol, x.art, Number(x.cant), t.id);
      });
      t.movs.push(r.mov.id);
      t.estado = t.lineas.every(l => trf.pendiente(l) <= 0.00005) ? 'Recibida' : 'Parcial';
      BD.hist(t, 'Recepción confirmada ' + r.mov.id, t.estado);
      g(); return r.mov;
    },
    /* cancelar lo pendiente: libera el comprometido en origen y el Pedido en destino */
    cancelar(id, motivo) {
      const t = BD.trf(id); exigir(t && ['Borrador', 'Aprobada', 'Parcial'].includes(t.estado), 'No hay nada pendiente que cancelar');
      if (t.estado !== 'Borrador') t.lineas.forEach(l => { const p = trf.pendiente(l); Stock.liberar(t.origen, l.art, p); Stock.pedido(t.destino, l.art, p, -1); });
      t.estado = t.lineas.some(l => (l.recibido || 0) > 0) ? 'Recibida' : 'Cancelada';
      BD.hist(t, 'Pendientes cancelados', motivo || '', 'no');
      if (t.sol) {
        const s = BD.sol(t.sol);
        if (s) {
          s.lineas.forEach(l => { if (l.doc === t.id && l.estado === 'En transferencia') { if ((l.recibido || 0) > 0) l.estado = 'Transferido'; else { l.estado = 'Pendiente'; l.doc = ''; } } });
          sol._actualizar(s);
        }
      }
      g(); return t;
    },
    /* crear, aprobar y recibir en seguida (p. ej. envío al proveedor del servicio: el almacén de tránsito es virtual) */
    directa(d) { const t = trf.crear(d); trf.aprobar(t.id); const mov = trf.recibir(t.id); return { trf: BD.trf(t.id), mov }; }
  };

  /* ================= Guía de remisión ================= */
  const gre = {
    MOTIVOS: ['Traslado entre establecimientos de la misma empresa', 'Traslado de bienes para transformación', 'Venta', 'Compra', 'Devolución', 'Otros'],
    /* d = {motivo, origen, destino, prov, transportista, mov, of, lineas:[{art, cant}], obs} */
    crear(d) {
      exigir(gre.MOTIVOS.includes(d.motivo), 'Elija el motivo de traslado');
      exigir(BD.alm(d.origen), 'Almacén de origen no válido');
      const x = { id: BD.sig('gre', 'T001-', 6), fecha: d.fecha || BD.ahora(), motivo: d.motivo, origen: d.origen, destino: d.destino || '', prov: d.prov || '',
        transportista: d.transportista || '', mov: d.mov || '', of: d.of || '', estado: 'Aceptada SUNAT', obs: d.obs || '', lineas: (d.lineas || []).map(l => ({ art: l.art, cant: BD.r4(l.cant) })), hist: [] };
      BD.d.gres.unshift(x);
      BD.hist(x, 'Emitida', d.motivo);
      g(); return x;
    }
  };

  return { sf, sol, oc, fac, trf, gre };
})();
