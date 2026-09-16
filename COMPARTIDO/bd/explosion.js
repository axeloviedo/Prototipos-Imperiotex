/* COMPARTIDO · cálculos sobre listas de materiales (los usan Inventarios al aprobar la Solicitud de Fabricación y Producción al crear órdenes).
   Una lista de materiales es la fórmula de UN artículo. Si un material también tiene lista, es FABRICABLE: tiene su propia orden.
   La FASE (número) sale de qué artículo usa a cuál. Producción agrega aquí lo que depende de sus órdenes (necesidades, refs). */
const Explosion = {
  fabricable(cod) { return BD.fabricable(cod); },

  /* materia prima total (lo que no se fabrica) si se fabrica todo lo fabricable: lo que se compromete al aprobar la Solicitud de Fabricación.
     productos: [{art, cant, ldm}] → [{alm, art, cant}] */
  bruto(productos) {
    const req = {};
    const visitar = (art, cant, ldmId) => {
      const L = ldmId ? BD.ldm(ldmId) : BD.ldmPred(art); if (!L) return;
      L.items.forEach(i => {
        if (i.tipo !== 'Artículo') return;
        const c = BD.r4(cant * i.cant / (L.base || 1));
        if (Explosion.fabricable(i.cod)) { visitar(i.cod, c, null); return; }
        if (!Stock.inventariable(i.cod)) return;
        const k = i.alm + '|' + i.cod; req[k] = BD.r4((req[k] || 0) + c);
      });
    };
    productos.forEach(p => visitar(p.art, p.cant, p.ldm));
    return Object.keys(req).map(k => { const x = k.split('|'); return { alm: x[0], art: x[1], cant: req[k] }; });
  },
  /* servicios de terceros que requiere fabricar todo: [{cod, cant}] (para planificar las compras de servicio) */
  servicios(productos) {
    const req = {};
    const visitar = (art, cant, ldmId) => {
      const L = ldmId ? BD.ldm(ldmId) : BD.ldmPred(art); if (!L) return;
      L.items.forEach(i => {
        const c = BD.r4(cant * i.cant / (L.base || 1));
        if (i.tipo === 'Artículo' && Explosion.fabricable(i.cod)) visitar(i.cod, c, null);
        else if (i.tipo === 'Recurso' && BD.esServicio(i.cod)) req[i.cod] = BD.r4((req[i.cod] || 0) + c);
      });
    };
    productos.forEach(p => visitar(p.art, p.cant, p.ldm));
    return Object.keys(req).map(cod => ({ cod, cant: req[cod] }));
  },

  /* fase de un artículo según su lista: 1 = no usa nada fabricado */
  pasoArt(art, ldmId, visto) {
    visto = visto || {};
    if (visto[art]) return 1; visto[art] = true;
    const L = ldmId === '' ? null : (ldmId ? BD.ldm(ldmId) : BD.ldmPred(art)); if (!L) return 1;
    let p = 1;
    L.items.forEach(i => { if (i.tipo === 'Artículo' && Explosion.fabricable(i.cod)) p = Math.max(p, Explosion.pasoArt(i.cod, null, Object.assign({}, visto)) + 1); });
    return p;
  },
  /* fase de cada orden dentro de un grupo: primero lo que otras usan, al final el producto terminado */
  secuencia(ofs) {
    const porArt = {}; ofs.forEach(o => (porArt[o.art] = porArt[o.art] || []).push(o));
    const rank = {};
    const calc = (o, visto) => {
      if (rank[o.id]) return rank[o.id];
      if (visto[o.id]) return 1; visto[o.id] = true;
      let r = 1;
      (o.mats || []).forEach(m => (porArt[m.cod] || []).forEach(h => { if (h.id !== o.id) r = Math.max(r, calc(h, visto) + 1); }));
      rank[o.id] = r; return r;
    };
    ofs.forEach(o => calc(o, {}));
    return rank;
  },
  ordenar(ofs) {
    const k = Explosion.secuencia(ofs);
    return ofs.slice().sort((a, b) => k[a.id] - k[b.id] || a.art.localeCompare(b.art) || a.id.localeCompare(b.id));
  },

  /* almacén (no de tránsito) desde donde las listas toman un artículo */
  almDe(cod) {
    for (const L of BD.d.maestros.ldms) {
      const i = L.items.find(x => x.tipo === 'Artículo' && x.cod === cod && x.alm && !(BD.alm(x.alm) || {}).transito);
      if (i) return i.alm;
    }
    return '';
  },

  materiales(ldmId, cant) {
    const L = BD.ldm(ldmId); if (!L) return [];
    return L.items.filter(i => i.tipo === 'Artículo' && Stock.inventariable(i.cod)).map(i => {
      const a = BD.art(i.cod) || {};
      return { cod: i.cod, cons: BD.r4(i.cant / (L.base || 1)), plan: BD.r4(cant * i.cant / (L.base || 1)), u: a.u || '', alm: i.alm || '', metodo: i.metodo || 'Manual', fab: Explosion.fabricable(i.cod), consumido: 0, comp: 0, valor: 0 };
    });
  },
  recursos(ldmId, cant) {
    const L = BD.ldm(ldmId); if (!L) return [];
    return L.items.filter(i => i.tipo === 'Recurso').map(i => {
      const R = BD.rec(i.cod) || {};
      return { cod: i.cod, cons: BD.r4(i.cant / (L.base || 1)), plan: BD.r4(cant * i.cant / (L.base || 1)), u: R.u || '', metodo: i.metodo || (R.tipo === 'RECURSO HUMANO' ? 'Manual' : 'Notificación'), real: 0, costoReal: 0 };
    });
  },
  textos(ldmId) { const L = BD.ldm(ldmId); return L ? L.items.filter(i => i.tipo === 'Texto').map(i => i.txt) : []; }
};
