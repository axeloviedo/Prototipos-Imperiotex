/* COMERCIAL V9 — resolución de precios (listas de precios y ofertas, decisión LP 2026-09-18) y cálculo de importes (un solo lugar para el dinero).
   Los precios de venta INCLUYEN IGV (como en la documentación): del total de la línea se separan base e impuesto. */
const Precios = {
  /* unidades por UM de venta respecto a la UM de inventario (A1: factor global por par). La UM de venta es referencial (L5):
     se puede usar cualquier unidad con conversión a la de inventario; sin conversión no se realiza la operación */
  factor(art, um) {
    const a = Store.art(art);
    if (!a || !um || um === a.u) return 1;
    const c = M.CONVERSIONES.find(x => x.de === um && x.a === a.u);
    if (!c) throw new Error('No existe la conversión ' + um + ' → ' + a.u + ' para ' + a.cod + ': créela en Inventarios (Configuraciones → Conversiones)');
    return c.factor;
  },
  /* unidades con las que se puede vender el artículo: la de venta predeterminada primero, luego la de inventario y las que tienen conversión */
  unidades(art) {
    const a = Store.art(art); if (!a) return [];
    const ok = u => u === a.u || M.CONVERSIONES.some(x => x.de === u && x.a === a.u);
    return [...new Set([a.uVenta || a.u, a.u].concat(M.CONVERSIONES.filter(x => x.a === a.u).map(x => x.de)))].filter(ok);
  },
  umVenta(art) { const a = Store.art(art); return a ? Precios.unidades(art)[0] || a.u : ''; },
  /* verificación del precio mínimo: la de Configuración General de Inventarios (L1) o la del artículo */
  verificaMin(a) { return !!((BD.d.maestros.configLogistica || {}).precioMinGlobal || (a && a.verifMin)); },

  /* ===== LISTAS DE PRECIOS Y OFERTAS (decisiones LP1–LP5, 12-prototipo-diseno.md §12) =====
     Store.d.listasPrecio = [{ cod, nom, mon, sede (sede del maestro compartido BD.d.maestros.sedes; '' = todas), tipo ('' = todos los segmentos), desde, hasta, activa,
                               filas: [{ art, um, precio | pct }  ó  { grupo, pct }] }]
     Una lista SIN fechas es una lista de precios; CON fechas es una oferta. Cada fila lleva precio fijo O % de descuento. */
  listas() { return Store.d.listasPrecio || (Store.d.listasPrecio = []); },
  lista(cod) { return Precios.listas().find(l => l.cod === cod); },
  esOferta(L) { return !!(L && (L.desde || L.hasta)); },
  /* 0 = sede y segmento · 1 = sede · 2 = segmento · 3 = general (de lo más específico a lo general) */
  NIVELES: ['Sede y segmento', 'Sede', 'Segmento', 'General'],
  /* sedes del maestro compartido (Gamarra, Galería «Ya», Damero…) */
  sedes() { return (BD.d.maestros && BD.d.maestros.sedes) || []; },
  sedeNom(cod) { const s = Precios.sedes().find(x => x.cod === cod); return s ? s.nom : cod; },
  /* el documento trae su tienda (punto de venta, TDA-01): la lista se busca por la sede de esa tienda (YA). Si ya es una sede, queda igual */
  sedeDe(cod) { const t = M.SEDES.find(x => x.cod === cod); return t ? t.sede || '' : cod || ''; },
  espec(L) { return L.sede && L.tipo ? 0 : L.sede ? 1 : L.tipo ? 2 : 3; },
  nivel(L) { return Precios.NIVELES[Precios.espec(L)]; },
  enFechas(L, fecha) {
    const f = UI.aFecha((fecha || UI.hoy()).slice(0, 10));
    return !(L.desde && f < UI.aFecha(L.desde)) && !(L.hasta && f > UI.aFecha(L.hasta));
  },
  /* Activa · Inactiva, y en las ofertas Programada · Vigente · Vencida */
  estado(L, fecha) {
    if (L.cancelada) return 'Cancelada';
    if (!L.activa) return 'Inactiva';
    if (!Precios.esOferta(L)) return 'Activa';
    const f = UI.aFecha((fecha || UI.hoy()).slice(0, 10));
    if (L.desde && f < UI.aFecha(L.desde)) return 'Programada';
    if (L.hasta && f > UI.aFecha(L.hasta)) return 'Vencida';
    return 'Vigente';
  },
  /* ¿la lista vale para este documento? misma moneda, su sede (o todas), su segmento (o todos), activa y en fecha */
  aplica(L, sede, tipo, mon, fecha) {
    return !!L.activa && !L.cancelada && L.mon === mon && (!L.sede || L.sede === sede) && (!L.tipo || L.tipo === tipo) && Precios.enFechas(L, fecha);
  },
  /* fila de la lista para el artículo y la unidad: la del artículo en esa unidad → la del artículo en su unidad de inventario (× factor)
     → la del artículo con % para todas las unidades → la de su grupo. -> {f, por} o null */
  filaDe(L, art, um) {  /* una fila sin precio ni % no cuenta (LP7) */
    const a = Store.art(art), fs = (L.filas || []).filter(f => f.precio > 0 || f.pct > 0);
    if (!a) return null;
    const exacta = fs.find(f => f.art === art && f.um === um);
    if (exacta) return { f: exacta, factor: 1 };
    const inv = um !== a.u && fs.find(f => f.art === art && f.um === a.u);
    if (inv) return { f: inv, factor: Precios.factor(art, um) };
    const todas = fs.find(f => f.art === art && !f.um && f.pct > 0);
    if (todas) return { f: todas, factor: 1 };
    const grupo = fs.find(f => f.grupo && f.grupo === a.grupo && f.pct > 0);
    return grupo ? { f: grupo, factor: 1 } : null;
  },
  pctTxt(p) { return '−' + UI.n(p, Number.isInteger(p) ? 0 : 2) + ' %'; },
  /* listas y ofertas que tienen el artículo para ese documento, de la más específica a la general */
  candidatos(art, um, sede, tipo, mon, fecha) {
    sede = Precios.sedeDe(sede);
    return Precios.listas().filter(L => Precios.aplica(L, sede, tipo, mon, fecha))
      .map(L => ({ L, x: Precios.filaDe(L, art, um) })).filter(c => c.x)
      .sort((p, q) => Precios.espec(p.L) - Precios.espec(q.L));
  },
  /* precio sin ofertas: la lista más específica; si su fila es un %, se aplica sobre la siguiente (y al final sobre el precio sugerido) */
  _normal(cands, i, art, um, mon) {
    const c = cands[i];
    if (!c) {
      const a = Store.art(art);
      if (a && mon === 'PEN' && a.precioVenta > 0) return { precio: UI.r2(a.precioVenta * Precios.factor(art, um)), origen: 'Precio sugerido del artículo' };
      return null;
    }
    const f = c.x.f;
    if (f.precio > 0) return { precio: UI.r2(f.precio * c.x.factor), origen: c.L.nom, lista: c.L.cod };
    const b = Precios._normal(cands, i + 1, art, um, mon);
    return b ? { precio: UI.r2(b.precio * (1 - f.pct / 100)), origen: c.L.nom + ' ' + Precios.pctTxt(f.pct), lista: c.L.cod } : null;
  },
  /* soles ↔ dólares con el tipo de cambio de la configuración comercial */
  convertir(v, de, a) { const tc = Store.cfg().tc || 1; return de === a ? v : UI.r2(de === 'USD' ? v * tc : v / tc); },
  /* PISO del precio (LP8): el precio mínimo del artículo (S/ por UM de inventario) × conversión, en la moneda del documento.
     Siempre se aplica a listas y ofertas. Con mínimo 0 el piso es «mayor que cero»: ningún precio de lista u oferta puede ser 0 o negativo */
  minimo(art, um, mon) {
    const a = Store.art(art);
    return a && a.precioMin > 0 ? UI.r2(Precios.convertir(a.precioMin, 'PEN', mon) * Precios.factor(art, um)) : 0;
  },
  /* MOTOR DE PRECIOS en fases (LP8–LP10, 12-prototipo-diseno.md §12.2):
     1. PRECIO BASE: la lista más específica sin ofertas (sede+segmento → sede → segmento → general) → precio sugerido (solo PEN).
     2. OFERTAS: todas las vigentes que aplican (sede, segmento, moneda, artículo, unidad), cada una con su precio.
     3. RESOLUCIÓN: MEJOR PRECIO = el menor entre el base y las ofertas (una oferta no empeora el precio).
        Una oferta con «Precio obligatorio» aplica aunque sea más cara (si hay varias obligatorias, la de menor precio).
     4. PISO: nunca debajo del precio mínimo del artículo; si queda debajo se AJUSTA al mínimo. Nunca 0 o menos.
     -> {precio, origen, lista, oferta {cod, nom, pct, forzado} | null, precioLista, base {precio, origen, lista}, ofertas [{cod, nom, precio, forzado}], minimo, ajusteMin}
        o null si no hay precio en esa moneda. La línea del documento guarda todo esto como evidencia (LP5). */
  resolver(art, um, sede, tipo, mon, fecha) {
    const cands = Precios.candidatos(art, um, sede, tipo, mon, fecha);
    const base = Precios._normal(cands.filter(c => !Precios.esOferta(c.L)), 0, art, um, mon);
    const ofertas = cands.filter(c => Precios.esOferta(c.L)).map(c => {
      const f = c.x.f;
      const precio = f.precio > 0 ? UI.r2(f.precio * c.x.factor) : base ? UI.r2(base.precio * (1 - f.pct / 100)) : 0;
      return { L: c.L, f, precio, forzado: !!c.L.forzado };
    }).filter(o => o.precio > 0);
    if (!base && !ofertas.length) return null;
    /* resolución */
    const forzadas = ofertas.filter(o => o.forzado).sort((p, q) => p.precio - q.precio);
    let gana = forzadas[0] || null;
    if (!gana) {
      const mejor = ofertas.slice().sort((p, q) => p.precio - q.precio || Precios.espec(p.L) - Precios.espec(q.L))[0];
      if (mejor && (!base || mejor.precio < base.precio)) gana = mejor;
    }
    const r = gana
      ? { precio: gana.precio, origen: 'Oferta ' + gana.L.nom + (gana.f.pct > 0 ? ' ' + Precios.pctTxt(gana.f.pct) : '') + (gana.forzado ? ' (precio obligatorio)' : ''), lista: gana.L.cod,
          oferta: { cod: gana.L.cod, nom: gana.L.nom, pct: gana.f.pct > 0 ? gana.f.pct : null, forzado: gana.forzado } }
      : { precio: base.precio, origen: base.origen, lista: base.lista, oferta: null };
    r.precioLista = base ? base.precio : null;
    r.base = base ? { precio: base.precio, origen: base.origen, lista: base.lista || '' } : null;
    r.ofertas = ofertas.map(o => ({ cod: o.L.cod, nom: o.L.nom, precio: o.precio, forzado: o.forzado }));
    /* piso: precio mínimo del artículo; con mínimo 0, mayor que cero */
    r.minimo = Precios.minimo(art, um, mon);
    r.ajusteMin = false;
    if (r.minimo > 0 && r.precio < r.minimo) { r.precio = r.minimo; r.ajusteMin = true; r.origen += ' · ajustado al precio mínimo'; }
    if (!(r.precio > 0)) return null;
    return r;
  },

  tasa(art) {
    const a = Store.art(art);
    return a && a.igv === 'Gravado' ? (Store.cfg().igv || 0) / 100 : 0;
  },

  /* completa los importes de una línea {art, cant, precio, dcto, obsequio}; dcto es monto por unidad */
  linea(l) {
    const pu = l.obsequio ? 0 : (Number(l.precio) || 0);
    const dct = l.obsequio ? 0 : (Number(l.dcto) || 0);
    l.neto = UI.r4(pu - dct);
    l.total = UI.r2(l.neto * (Number(l.cant) || 0));
    const t = Precios.tasa(l.art);
    l.subtotal = UI.r2(l.total / (1 + t));
    l.impuesto = UI.r2(l.total - l.subtotal);
    return l;
  },

  /* totales del documento: op. gravada/exonerada, IGV y total */
  doc(d) {
    let sub = 0, igv = 0, tot = 0, exo = 0;
    (d.lineas || []).forEach(l => {
      Precios.linea(l);
      tot += l.total; igv += l.impuesto;
      if (Precios.tasa(l.art) > 0) sub += l.subtotal; else exo += l.subtotal;
    });
    d.gravada = UI.r2(sub); d.exonerada = UI.r2(exo); d.igv = UI.r2(igv); d.total = UI.r2(tot);
    d.subtotal = UI.r2(sub + exo);
    d.igvTasa = Store.cfg().igv;
    return d;
  },

  /* precio neto por UM de inventario llevado a soles, para comparar con el precio mínimo */
  netoEnSoles(l, mon) {
    const f = Precios.factor(l.art, l.um) || 1;
    const tc = mon === 'USD' ? (Store.cfg().tc || 1) : 1;
    return UI.r4((l.neto || 0) * tc / f);
  }
};
