/* PRODUCCION · Producción — estado de la demo en memoria, guardado en localStorage */
const Store = {
  KEY: 'imperiotex.PRODUCCION.produccion',
  d: null,

  iniciar() {
    let txt = null;
    try { txt = localStorage.getItem(Store.KEY); } catch (e) { txt = null; }
    if (txt) { try { Store.d = JSON.parse(txt); } catch (e) { Store.d = null; } }
    if (!Store.d || Store.d.version !== Demo.VERSION) { Demo.crear(); Store.guardar(); }
    SFComp.importar();
  },
  guardar() {
    try { localStorage.setItem(Store.KEY, JSON.stringify(Store.d)); } catch (e) { /* sin almacenamiento: la demo sigue en memoria */ }
    SFComp.exportar();
  },
  /* reinicia TODO el prototipo (Inventarios, Compras, Producción y Comercial): borra todas las claves 'imperiotex.' */
  reiniciar() {
    UI.confirmar('Reiniciar todo el prototipo', '<p>Se descartan los datos registrados en <b>todos los módulos</b> (Inventarios, Compras, Producción y Comercial) y todos vuelven al escenario inicial.</p>', () => {
      try { Object.keys(localStorage).filter(k => k.indexOf('imperiotex.') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) { }
      Demo.crear(); Store.guardar(); App.go('pr01'); UI.toast('Prototipo reiniciado');
    }, 'Reiniciar todo');
  },
  /* correlativos: sig('of','OF-',6) -> OF-000121 */
  sig(serie, pref, digitos) { const n = Store.d.seq[serie]++; return pref + String(n).padStart(digitos, '0'); },
  of(id) { return Store.d.ofs.find(o => o.id === id); },
  sf(id) { return Store.d.sfs.find(s => s.id === id); }
};

/* Solicitudes de Fabricación compartidas: se crean, editan y aprueban en Inventarios (GI-21/22/23) y Comercial.
   Producción lee las aprobadas de 'imperiotex.v9.solicitudes' y avisa en 'imperiotex.v9.sf-produccion' cuáles ya tienen órdenes. */
const SFComp = {
  KEY_GI: 'imperiotex.v9.solicitudes', KEY_PR: 'imperiotex.v9.sf-produccion',
  importar() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(SFComp.KEY_GI) || 'null'); } catch (e) { d = null; }
    if (!d || !d.SPS) return 0;
    let n = 0;
    Object.values(d.SPS).forEach(sp => {
      if ((sp.est !== 'Aprobada' && sp.est !== 'Convertida en Orden') || Store.sf(sp.id)) return;
      const lineas = (sp.lineas || []).filter(l => l.qty > 0 && M.ldmPred(l.art)).map(l => ({ art: l.art, cant: l.qty, tipofab: 'Estándar', ldm: M.ldmPred(l.art).id }));
      if (!lineas.length) return;
      const alm = String(sp.almDestino || '').split(' · ')[0];
      const firmas = (sp.hist || []).filter(h => h.e === 'ok' && /V°B°|Aprobación/.test(h.a)).map(h => h.a + ' ' + String(h.d).split(' ')[0]).join(' · ');
      const sf = { id: sp.id, fecha: sp.fecha, mes: sp.mes, solic: sp.solic, almDestino: M.alm(alm) ? alm : 'SB-ALM-PT', fechaReq: '', est: 'Aprobada', firmas, obs: sp.obs || '', lineas, ofs: [], ref: '' };
      Store.d.sfs.unshift(sf);
      Prod.aprobarSF(sf);
      n++;
    });
    if (n) { try { localStorage.setItem(Store.KEY, JSON.stringify(Store.d)); } catch (e) { } }
    return n;
  },
  exportar() {
    const m = {};
    (Store.d.sfs || []).filter(sf => sf.ofs && sf.ofs.length).forEach(sf => {
      const of = Store.of(sf.ofs[0]);
      m[sf.id] = { ref: sf.ref, fecha: of && of.hist && of.hist[0] ? of.hist[0].f : '' };
    });
    try { localStorage.setItem(SFComp.KEY_PR, JSON.stringify(m)); } catch (e) { }
  }
};
/* si Inventarios o Comercial aprueban una solicitud en otra pestaña, aparece aquí sin recargar */
window.addEventListener('storage', e => {
  if (e.key !== SFComp.KEY_GI || !Store.d) return;
  if (SFComp.importar() && (App.actual === 'pr03' || App.actual === 'pr03d')) App.refrescar();
});
