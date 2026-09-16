/* PRODUCCION · Producción — cálculos sobre listas de materiales.
   Una lista de materiales es la fórmula de UN artículo. Si un material también tiene lista, es FABRICABLE:
   se crea otra orden de fabricación para él. La FASE (número) sale de qué artículo usa a cuál. */
const Explosion = {
  fabricable(cod) { return M.ldmsDe(cod).length > 0; },

  /* materia prima total (lo que no se fabrica) si se fabrica todo lo fabricable: lo que se compromete al aprobar la Solicitud de Fabricación */
  bruto(productos) {
    const req = {};
    const visitar = (art, cant, ldmId) => {
      const L = ldmId ? M.ldm(ldmId) : M.ldmPred(art); if (!L) return;
      L.items.forEach(i => {
        if (i.tipo !== 'Artículo') return;
        const c = UI.r4(cant * i.cant / (L.base || 1));
        if (Explosion.fabricable(i.cod)) { visitar(i.cod, c, null); return; }
        if ((M.art(i.cod) || {}).inv === false) return;
        const k = i.alm + '|' + i.cod; req[k] = UI.r4((req[k] || 0) + c);
      });
    };
    productos.forEach(p => visitar(p.art, p.cant, p.ldm));
    return Object.keys(req).map(k => { const x = k.split('|'); return { alm: x[0], art: x[1], cant: req[k] }; });
  },

  /* órdenes que hacen falta para los materiales fabricables: requerido − disponible proyectado */
  necesidades(productos) {
    const disp = {}, res = {};
    const visitar = (art, cant, ldmId) => {
      const L = ldmId ? M.ldm(ldmId) : M.ldmPred(art); if (!L) return;
      L.items.forEach(i => {
        if (i.tipo !== 'Artículo' || !Explosion.fabricable(i.cod)) return;
        const req = UI.r4(cant * i.cant / (L.base || 1));
        if (disp[i.cod] == null) disp[i.cod] = Math.max(0, Prod.proyectado(i.cod));
        const usa = Math.min(disp[i.cod], req); disp[i.cod] = UI.r4(disp[i.cod] - usa);
        const neto = UI.r4(req - usa);
        const r = res[i.cod] = res[i.cod] || { art: i.cod, ldm: M.ldmPred(i.cod).id, alm: Prod.almRecibo(i.cod), req: 0, cubre: 0, sugerido: 0 };
        r.req = UI.r4(r.req + req); r.cubre = UI.r4(r.cubre + usa); r.sugerido = UI.r4(r.sugerido + neto);
        if (neto > 0) visitar(i.cod, neto, null);
      });
    };
    productos.forEach(p => visitar(p.art, p.cant, p.ldm));
    return Object.values(res);
  },

  /* fase de un artículo según su lista: 1 = no usa nada fabricado */
  pasoArt(art, ldmId, visto) {
    visto = visto || {};
    if (visto[art]) return 1; visto[art] = true;
    const L = ldmId === '' ? null : (ldmId ? M.ldm(ldmId) : M.ldmPred(art)); if (!L) return 1;
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
      o.mats.forEach(m => (porArt[m.cod] || []).forEach(h => { if (h.id !== o.id) r = Math.max(r, calc(h, visto) + 1); }));
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
    for (const L of M.LDMS) {
      const i = L.items.find(x => x.tipo === 'Artículo' && x.cod === cod && x.alm && !(M.alm(x.alm) || {}).transito);
      if (i) return i.alm;
    }
    return '';
  },

  materiales(ldmId, cant) {
    const L = M.ldm(ldmId); if (!L) return [];
    return L.items.filter(i => i.tipo === 'Artículo' && (M.art(i.cod) || {}).inv !== false).map(i => {
      const a = M.art(i.cod) || {};
      return { cod: i.cod, cons: UI.r4(i.cant / (L.base || 1)), plan: UI.r4(cant * i.cant / (L.base || 1)), u: a.u || '', alm: i.alm || '', metodo: i.metodo || 'Manual', fab: Explosion.fabricable(i.cod), consumido: 0, comp: 0, valor: 0 };
    });
  },
  recursos(ldmId, cant) {
    const L = M.ldm(ldmId); if (!L) return [];
    return L.items.filter(i => i.tipo === 'Recurso').map(i => ({ cod: i.cod, cons: UI.r4(i.cant / (L.base || 1)), plan: UI.r4(cant * i.cant / (L.base || 1)), u: (M.rec(i.cod) || {}).u || '', metodo: i.metodo || ((M.rec(i.cod) || {}).tipo === 'RECURSO HUMANO' ? 'Manual' : 'Notificación'), real: 0, costoReal: 0 }));
  },
  textos(ldmId) { const L = M.ldm(ldmId); return L ? L.items.filter(i => i.tipo === 'Texto').map(i => i.txt) : []; },
  refs() { return [...new Set(Store.d.ofs.map(o => o.ref))].sort((a, b) => b.localeCompare(a)); }
};
