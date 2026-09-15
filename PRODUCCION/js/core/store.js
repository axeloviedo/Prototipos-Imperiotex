/* PRODUCCION · Producción — estado de la demo en memoria, guardado en localStorage */
const Store = {
  KEY: 'imperiotex.PRODUCCION.produccion',
  d: null,

  iniciar() {
    let txt = null;
    try { txt = localStorage.getItem(Store.KEY); } catch (e) { txt = null; }
    if (txt) { try { Store.d = JSON.parse(txt); } catch (e) { Store.d = null; } }
    if (!Store.d || Store.d.version !== Demo.VERSION) { Demo.crear(); Store.guardar(); }
  },
  guardar() { try { localStorage.setItem(Store.KEY, JSON.stringify(Store.d)); } catch (e) { /* sin almacenamiento: la demo sigue en memoria */ } },
  reiniciar() {
    UI.confirmar('Reiniciar datos de demo', '<p>Se descartan todas las órdenes, emisiones, recibos, solicitudes y movimientos registrados y se vuelve al escenario inicial.</p>', () => {
      try { localStorage.removeItem(Store.KEY); } catch (e) { }
      Demo.crear(); Store.guardar(); App.go('pr01'); UI.toast('Demo reiniciada');
    }, 'Reiniciar');
  },
  /* correlativos: sig('of','OF-',6) -> OF-000121 */
  sig(serie, pref, digitos) { const n = Store.d.seq[serie]++; return pref + String(n).padStart(digitos, '0'); },
  of(id) { return Store.d.ofs.find(o => o.id === id); },
  sf(id) { return Store.d.sfs.find(s => s.id === id); }
};
