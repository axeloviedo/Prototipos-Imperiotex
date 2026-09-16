/* COMERCIAL V9 — resolución de precios (listas en cascada) y cálculo de importes (un solo lugar para el dinero).
   Los precios de venta INCLUYEN IGV (como en la documentación): del total de la línea se separan base e impuesto. */
const Precios = {
  /* de la más específica a la general; la tienda y el tipo de cliente son opcionales en cada fila de la lista */
  NIVELES: [
    { t: 'Tienda y tipo de cliente', f: (l, s, c) => !!s && !!c && l.sede === s && l.tipo === c },
    { t: 'Tienda', f: (l, s) => !!s && l.sede === s && !l.tipo },
    { t: 'Tipo de cliente', f: (l, s, c) => !!c && !l.sede && l.tipo === c },
    { t: 'General', f: l => !l.sede && !l.tipo }
  ],

  /* unidades por UM de venta respecto a la UM de inventario (A1: factor global por par) */
  factor(art, um) {
    const a = Store.art(art);
    if (!a || !um || um === a.u) return 1;
    const c = M.CONVERSIONES.find(x => x.de === um && x.a === a.u);
    return c ? c.factor : 1;
  },

  /* -> {precio, origen, fila} o null si no hay precio en esa moneda */
  resolver(art, um, sede, tipoCli, mon) {
    const cands = Store.d.listas.filter(l => l.art === art && l.um === um && l.mon === mon);
    for (const n of Precios.NIVELES) {
      const x = cands.find(l => n.f(l, sede, tipoCli));
      if (x) return { precio: x.precio, origen: 'Lista · ' + n.t, fila: x.id };
    }
    const a = Store.art(art);
    if (a && mon === 'PEN' && a.precioVenta > 0) return { precio: UI.r2(a.precioVenta * Precios.factor(art, um)), origen: 'Precio sugerido del artículo', fila: null };
    return null;
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
