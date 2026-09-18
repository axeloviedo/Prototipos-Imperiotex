/* COMERCIAL V9 — reglas de los maestros propios: listas de precios, datos de venta del artículo y parámetros */
/* Listas de precios y ofertas (LP1–LP5): se crea la lista (moneda, tienda y segmento opcionales; con fechas = oferta) y se le agregan artículos o grupos.
   Cada fila lleva precio fijo O % de descuento. Permiso editar_precios. */
const Listas = {
  _ed() { Store.exigir('editar_precios', 'modificar listas de precios y ofertas'); },
  get(cod) { const L = Precios.lista(cod); if (!L) throw new Error('Lista no encontrada'); return L; },
  guardar(x, cod) {
    Listas._ed();
    const nom = String(x.nom || '').trim();
    if (nom.length < 3) throw new Error('Escriba el nombre de la lista');
    if (Precios.listas().some(l => l.cod !== cod && l.nom.toLowerCase() === nom.toLowerCase())) throw new Error('Ya existe una lista con ese nombre');
    if (!M.MONEDAS.find(m => m.cod === x.mon)) throw new Error('Elija la moneda');
    if (x.sede && !Store.sede(x.sede)) throw new Error('Tienda no válida');
    if (x.tipo && M.TIPOS_CLIENTE.indexOf(x.tipo) < 0) throw new Error('Segmento de cliente no válido');
    if (x.oferta && !x.desde) throw new Error('Una oferta necesita la fecha de inicio');
    if (x.desde && x.hasta && UI.aFecha(x.hasta) < UI.aFecha(x.desde)) throw new Error('La fecha final no puede ser anterior a la inicial');
    const datos = { nom, mon: x.mon, sede: x.sede || '', tipo: x.tipo || '', desde: x.oferta ? x.desde || '' : '', hasta: x.oferta ? x.hasta || '' : '', activa: x.activa !== false };
    if (cod) {
      const L = Listas.get(cod);
      if (L.mon !== datos.mon && L.filas.some(f => f.precio > 0)) throw new Error('La lista ya tiene precios en ' + L.mon + ': cree otra lista para ' + datos.mon);
      return Object.assign(L, datos);
    }
    const L = Object.assign({ cod: Store.sig('lpr', 'LP-', 2) }, datos, { filas: [] });
    Precios.listas().push(L);
    return L;
  },
  quitar(cod) {
    Listas._ed();
    const i = Precios.listas().findIndex(l => l.cod === cod);
    if (i < 0) throw new Error('Lista no encontrada');
    return Precios.listas().splice(i, 1)[0];
  },
  /* «Agregar artículos»: varios a la vez; v = {um, precio | pct} opcional (un % vale para todas las unidades si no se elige unidad) -> cuántos entraron */
  agregarArts(cod, arts, v) {
    Listas._ed();
    const L = Listas.get(cod); v = v || {};
    const pct = v.pct === '' || v.pct == null ? null : Number(v.pct), precio = v.precio === '' || v.precio == null ? null : Number(v.precio);
    if (pct != null && (!(pct > 0) || pct >= 100)) throw new Error('El descuento debe ser mayor que 0 y menor que 100 %');
    if (precio != null && !(precio > 0)) throw new Error('El precio debe ser mayor que cero');
    let n = 0;
    (arts || []).forEach(art => {
      const a = Store.art(art);
      if (!a || !a.venta) return;
      const um = v.um === '*' ? '' : v.um && Precios.unidades(art).indexOf(v.um) >= 0 ? v.um : (pct != null && !v.um ? '' : Precios.umVenta(art));
      if (L.filas.some(f => f.art === art && (f.um || '') === um)) return;
      const f = { art, um };
      if (pct != null) f.pct = UI.r2(pct); else if (precio != null && um) f.precio = UI.r2(precio);
      L.filas.push(f); n++;
    });
    if (!n) throw new Error('No hay artículos nuevos que agregar con esa selección');
    return n;
  },
  /* todo un grupo de artículos con un % de descuento */
  agregarGrupo(cod, grupo, pct) {
    Listas._ed();
    const L = Listas.get(cod), p = Number(pct);
    if (!grupo) throw new Error('Elija el grupo de artículos');
    if (!(p > 0) || p >= 100) throw new Error('Un grupo entra con % de descuento: mayor que 0 y menor que 100 %');
    if (L.filas.some(f => f.grupo === grupo)) throw new Error('El grupo ya está en la lista: cambie su %');
    L.filas.push({ grupo, pct: UI.r2(p) });
    return L;
  },
  /* cambia una fila: precio (quita el %), pct (quita el precio) o um */
  fila(cod, i, campo, val) {
    Listas._ed();
    const L = Listas.get(cod), f = L.filas[i];
    if (!f) throw new Error('Fila no encontrada');
    if (campo === 'um') {
      if (f.grupo) throw new Error('Un grupo vale para todas las unidades');
      if (val === '' && !(f.pct > 0)) throw new Error('«Todas las unidades» solo con % de descuento');
      if (L.filas.some((x, k) => k !== i && x.art === f.art && (x.um || '') === val)) throw new Error('El artículo ya está en la lista con esa unidad');
      f.um = val; return f;
    }
    const n = val === '' ? null : Number(val);
    if (n != null && (isNaN(n) || n < 0)) throw new Error('Ingrese un número mayor o igual a cero');
    if (campo === 'precio') {
      if (f.grupo) throw new Error('Un grupo lleva % de descuento, no precio');
      if (n > 0 && !f.um) throw new Error('Elija la unidad del precio');
      delete f.pct; if (n > 0) f.precio = UI.r2(n); else delete f.precio;
    } else if (campo === 'pct') {
      if (n != null && n >= 100) throw new Error('El descuento debe ser menor que 100 %');
      delete f.precio; if (n > 0) f.pct = UI.r2(n); else delete f.pct;
    }
    return f;
  },
  quitarFila(cod, i) {
    Listas._ed();
    const L = Listas.get(cod);
    if (!L.filas[i]) throw new Error('Fila no encontrada');
    return L.filas.splice(i, 1)[0];
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
