/* COMERCIAL V9 — reglas de los maestros propios: listas de precios, datos de venta del artículo y parámetros */
/* Listas de precios y ofertas (LP1–LP5): se crea la lista (moneda, sede y segmento opcionales; con fechas = oferta) y se le agregan artículos o grupos.
   Cada fila lleva precio fijo O % de descuento. Permiso editar_precios. */
const Listas = {
  _ed() { Store.exigir('editar_precios', 'modificar listas de precios y ofertas'); },
  get(cod) { const L = Precios.lista(cod); if (!L) throw new Error('Lista no encontrada'); return L; },
  /* una lista cancelada ya no se modifica (LP6) */
  _abierta(cod) { const L = Listas.get(cod); if (L.cancelada) throw new Error('La lista ' + L.cod + ' está cancelada: no se modifica'); return L; },
  _desc(f) { return f.grupo ? 'grupo ' + M.grupoNom(f.grupo) : f.art + ' ' + (f.um || 'todas las unidades'); },
  _val(f) { return f.precio > 0 ? 'precio ' + UI.n(f.precio) : f.pct > 0 ? UI.n(f.pct) + ' %' : 'sin valor'; },
  /* LP9: sin ambigüedad. Dos listas de precios (sin fechas) activas del MISMO nivel (misma moneda, sede y segmento) no pueden tener el mismo artículo,
     ni el mismo grupo, ni un artículo y el grupo al que pertenece. -> texto del conflicto o '' */
  conflicto(L, f) {
    if (Precios.esOferta(L) || !L.activa || L.cancelada) return '';
    const grupoDe = art => (Store.art(art) || {}).grupo;
    const choca = (x, y) => (x.art && y.art && x.art === y.art) || (x.grupo && y.grupo && x.grupo === y.grupo) ||
      (x.art && y.grupo && grupoDe(x.art) === y.grupo) || (x.grupo && y.art && grupoDe(y.art) === x.grupo);
    for (const O of Precios.listas()) {
      if (O.cod === L.cod || Precios.esOferta(O) || !O.activa || O.cancelada || O.mon !== L.mon || (O.sede || '') !== (L.sede || '') || (O.tipo || '') !== (L.tipo || '')) continue;
      const y = (O.filas || []).find(y => choca(f, y));
      if (y) return 'Conflicto de precios: ' + Listas._desc(f) + ' ya tiene precio en «' + O.nom + '» (' + O.cod + ', ' + Listas._desc(y) + ') para la misma moneda, sede y segmento. ' +
        'Cambie ese precio allá, o use otra sede o segmento';
    }
    return '';
  },
  /* LP8: un precio fijo no puede quedar debajo del precio mínimo del artículo (en la moneda de la lista, por su unidad) */
  _piso(L, f) {
    if (!(f.precio > 0) || !f.art || !f.um) return;
    const min = Precios.minimo(f.art, f.um, L.mon);
    if (min > 0 && f.precio < min) throw new Error(f.art + ': ' + UI.m(f.precio, L.mon) + ' por ' + f.um + ' está debajo del precio mínimo del artículo (' + UI.m(min, L.mon) + '). Ninguna lista ni oferta puede bajar del mínimo');
  },
  /* precio fijo O % de descuento, nunca ninguno (LP7) */
  _valor(v) {
    const pct = v.pct === '' || v.pct == null ? null : Number(v.pct), precio = v.precio === '' || v.precio == null ? null : Number(v.precio);
    if (pct != null && precio != null) throw new Error('Escriba precio fijo O % de descuento, no los dos');
    if (pct == null && precio == null) throw new Error('Indique el precio fijo o el % de descuento: una lista no guarda artículos con precio 0 y descuento 0');
    if (pct != null && (isNaN(pct) || !(pct > 0) || pct >= 100)) throw new Error('El descuento debe ser mayor que 0 y menor que 100 %');
    if (precio != null && (isNaN(precio) || !(precio > 0))) throw new Error('El precio debe ser mayor que cero');
    return { pct, precio };
  },
  guardar(x, cod) {
    Listas._ed();
    const nom = String(x.nom || '').trim();
    if (nom.length < 3) throw new Error('Escriba el nombre de la lista');
    if (Precios.listas().some(l => l.cod !== cod && l.nom.toLowerCase() === nom.toLowerCase())) throw new Error('Ya existe una lista con ese nombre');
    if (!M.MONEDAS.find(m => m.cod === x.mon)) throw new Error('Elija la moneda');
    if (x.sede && !Precios.sedes().some(s => s.cod === x.sede)) throw new Error('Sede no válida');
    if (x.tipo && M.TIPOS_CLIENTE.indexOf(x.tipo) < 0) throw new Error('Segmento de cliente no válido');
    if (x.oferta && !x.desde) throw new Error('Una oferta necesita la fecha de inicio');
    if (x.desde && x.hasta && UI.aFecha(x.hasta) < UI.aFecha(x.desde)) throw new Error('La fecha final no puede ser anterior a la inicial');
    const datos = { nom, mon: x.mon, sede: x.sede || '', tipo: x.tipo || '', desde: x.oferta ? x.desde || '' : '', hasta: x.oferta ? x.hasta || '' : '', activa: x.activa !== false, forzado: !!(x.oferta && x.forzado) };
    if (cod) {
      const L = Listas._abierta(cod);
      if (L.mon !== datos.mon && L.filas.some(f => f.precio > 0)) throw new Error('La lista ya tiene precios en ' + L.mon + ': cree otra lista para ' + datos.mon);
      const prueba = Object.assign({}, L, datos);
      for (const f of L.filas) { const c = Listas.conflicto(prueba, f); if (c) throw new Error(c); Listas._piso(prueba, f); }
      const cambios = Object.keys(datos).filter(k => String(L[k] == null ? '' : L[k]) !== String(datos[k])).map(k => k + ': ' + (L[k] === '' ? '—' : L[k]) + ' → ' + (datos[k] === '' ? '—' : datos[k]));
      Object.assign(L, datos);
      if (cambios.length) Store.hist(L, 'Datos modificados', cambios.join(' · '));
      return L;
    }
    const L = Object.assign({ cod: Store.sig('lpr', 'LP-', 2) }, datos, { filas: [], creado: UI.ahora(), creadoPor: Store.usuario().nom });
    Store.hist(L, Precios.esOferta(L) ? 'Oferta creada' : 'Lista creada', '');
    Precios.listas().push(L);
    return L;
  },
  /* LP6: una lista u oferta NO se borra: se CANCELA con motivo; queda quién, cuándo y por qué. Deja de aplicarse y no se modifica más */
  cancelar(cod, motivo) {
    Listas._ed();
    const L = Listas._abierta(cod), m = String(motivo || '').trim();
    if (m.length < 5) throw new Error('Escriba el motivo de la cancelación');
    L.cancelada = { u: Store.usuario().nom, f: UI.ahora(), motivo: m };
    L.activa = false;
    Store.hist(L, 'Cancelada', m);
    return L;
  },
  /* «Agregar artículos»: varios a la vez con un precio fijo O un % (obligatorio) -> cuántos entraron */
  agregarArts(cod, arts, v) {
    Listas._ed();
    const L = Listas._abierta(cod); v = v || {};
    const { pct, precio } = Listas._valor(v);
    if (precio != null && v.um === '*') throw new Error('Un precio fijo va en una unidad: elija la unidad de venta de cada artículo');
    const nuevos = [];
    (arts || []).forEach(art => {
      const a = Store.art(art);
      if (!a || !a.venta) return;
      const um = v.um === '*' ? '' : v.um && Precios.unidades(art).indexOf(v.um) >= 0 ? v.um : Precios.umVenta(art);
      if (L.filas.some(f => f.art === art && (f.um || '') === um)) return;
      const f = { art, um };
      if (pct != null) f.pct = UI.r2(pct); else f.precio = UI.r2(precio);
      const c = Listas.conflicto(L, f); if (c) throw new Error(c);
      Listas._piso(L, f);
      L.filas.push(f); nuevos.push(f);
    });
    if (!nuevos.length) throw new Error('No hay artículos nuevos que agregar con esa selección');
    Store.hist(L, 'Artículos agregados', nuevos.map(f => Listas._desc(f)).join(', ') + ' · ' + Listas._val(nuevos[0]));
    return nuevos.length;
  },
  /* todo un grupo de artículos con un % de descuento (vale también para los artículos que se creen después) */
  agregarGrupo(cod, grupo, pct) {
    Listas._ed();
    const L = Listas._abierta(cod), p = pct === '' || pct == null ? NaN : Number(pct);
    if (!grupo) throw new Error('Elija el grupo de artículos');
    if (!(p > 0) || p >= 100) throw new Error('Un grupo entra con % de descuento: mayor que 0 y menor que 100 %');
    if (L.filas.some(f => f.grupo === grupo)) throw new Error('El grupo ya está en la lista: cambie su %');
    const f = { grupo, pct: UI.r2(p) };
    const c = Listas.conflicto(L, f); if (c) throw new Error(c);
    L.filas.push(f);
    Store.hist(L, 'Grupo agregado', Listas._desc(f) + ' · ' + Listas._val(f));
    return L;
  },
  /* cambia una fila: precio (quita el %), pct (quita el precio) o um. La fila nunca queda sin precio ni % (LP7) */
  fila(cod, i, campo, val) {
    Listas._ed();
    const L = Listas._abierta(cod), f = L.filas[i];
    if (!f) throw new Error('Fila no encontrada');
    const antes = Listas._desc(f) + ' · ' + Listas._val(f);
    if (campo === 'um') {
      if (f.grupo) throw new Error('Un grupo vale para todas las unidades');
      if (val === '' && !(f.pct > 0)) throw new Error('«Todas las unidades» solo con % de descuento');
      if (L.filas.some((x, k) => k !== i && x.art === f.art && (x.um || '') === val)) throw new Error('El artículo ya está en la lista con esa unidad');
      Listas._piso(L, Object.assign({}, f, { um: val }));
      f.um = val;
    } else {
      const n = val === '' || val == null ? 0 : Number(val);
      if (isNaN(n) || n < 0) throw new Error('Ingrese un número mayor que cero');
      if (!(n > 0)) throw new Error('El artículo debe tener precio fijo o % de descuento: no se guarda con 0 (si no va, quítelo de la lista)');
      if (campo === 'precio') {
        if (f.grupo) throw new Error('Un grupo lleva % de descuento, no precio');
        if (!f.um) throw new Error('Elija la unidad del precio');
        const nf = Object.assign({}, f, { precio: UI.r2(n) }); delete nf.pct; Listas._piso(L, nf);
        delete f.pct; f.precio = UI.r2(n);
      } else if (campo === 'pct') {
        if (n >= 100) throw new Error('El descuento debe ser menor que 100 %');
        delete f.precio; f.pct = UI.r2(n);
      }
    }
    Store.hist(L, 'Artículo modificado', antes + ' → ' + Listas._desc(f) + ' · ' + Listas._val(f));
    return f;
  },
  /* sacar un artículo o grupo de la lista: queda en el historial quién lo sacó y con qué valor estaba */
  quitarFila(cod, i) {
    Listas._ed();
    const L = Listas._abierta(cod), f = L.filas[i];
    if (!f) throw new Error('Fila no encontrada');
    L.filas.splice(i, 1);
    Store.hist(L, 'Artículo retirado', Listas._desc(f) + ' · estaba con ' + Listas._val(f));
    return f;
  }
};

const Arts = {
  /* solo los datos de venta: el maestro completo del artículo vive en GI-02 */
  guardar(cod, x) {
    Store.exigir('editar_precios', 'editar los datos de venta del artículo');
    const a = Store.art(cod);
    if (!a) throw new Error('Artículo no encontrado');
    const num = (v, nom) => { const n = Number(v); if (v === '' || isNaN(n) || n < 0) throw new Error(nom + ' debe ser cero o mayor'); return n; };
    const precio = num(x.precio, 'El precio sugerido'), precioMin = num(x.precioMin, 'El precio mínimo');
    const dctoMin = num(x.dctoMin, 'El descuento mínimo'), dctoMax = num(x.dctoMax, 'El descuento máximo');
    if (precioMin > 0 && precio > 0 && precioMin > precio) throw new Error('El precio mínimo no puede superar al precio sugerido');
    if (dctoMax > 100) throw new Error('El descuento máximo no puede superar el 100%');
    if (dctoMin > dctoMax) throw new Error('El descuento mínimo no puede ser mayor que el máximo');
    if (M.AFECTACION.indexOf(x.igv) < 0) throw new Error('Elija la afectación del IGV');
    return Object.assign(a, { precioVenta: UI.r2(precio), precioMin: UI.r2(precioMin), verifMin: !!x.verifMin, dctoMin, dctoMax, igv: x.igv });
  }
};

const Cfg = {
  guardar(x) {
    Store.exigir('configurar_comercial', 'cambiar la configuración comercial');
    const n = (v, min, max, nom) => { const k = Number(v); if (v === '' || isNaN(k) || k < min || k > max) throw new Error(nom + ' debe estar entre ' + min + ' y ' + max); return k; };
    const c = Store.cfg();
    const igv = n(x.igv, 0, 30, 'El IGV'), tc = n(x.tc, 0.01, 99, 'El tipo de cambio'), dv = n(x.diasValidez, 1, 90, 'La validez de la cotización'), da = n(x.diasAnulacion, 0, 30, 'El plazo para anular');
    if (!M.ALMACENES.some(a => a.cod === x.almMalEstado)) throw new Error('Elija el almacén para devoluciones en mal estado');
    Object.assign(c, { igv, tc: UI.r4(tc), diasValidez: Math.round(dv), diasAnulacion: Math.round(da), almMalEstado: x.almMalEstado });
    return c;
  },
  agregarCat(tipo, nombre) {
    Store.exigir('configurar_comercial', 'cambiar la configuración comercial');
    const lista = tipo === 'Ingreso' ? Store.cfg().catIngreso : Store.cfg().catEgreso, nom = String(nombre || '').trim();
    if (nom.length < 3) throw new Error('Escriba el nombre de la categoría');
    if (lista.some(x => x.toLowerCase() === nom.toLowerCase())) throw new Error('La categoría ya existe');
    lista.push(nom);
  },
  quitarCat(tipo, nombre) {
    Store.exigir('configurar_comercial', 'cambiar la configuración comercial');
    const lista = tipo === 'Ingreso' ? Store.cfg().catIngreso : Store.cfg().catEgreso;
    if (lista.length <= 1) throw new Error('Debe quedar al menos una categoría');
    const i = lista.indexOf(nombre);
    if (i >= 0) lista.splice(i, 1);
  }
};
