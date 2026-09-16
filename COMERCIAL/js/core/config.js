/* COMERCIAL V9 — reglas de los maestros propios: listas de precios, datos de venta del artículo y parámetros */
const Listas = {
  nivel(l) { return l.sede && l.tipo ? 'Tienda y tipo de cliente' : l.sede ? 'Tienda' : l.tipo ? 'Tipo de cliente' : 'General'; },
  guardar(x, id) {
    Store.exigir('editar_precios', 'modificar listas de precios');
    const a = Store.art(x.art);
    if (!a) throw new Error('Elija el artículo');
    if ((a.uVenta || [a.u]).indexOf(x.um) < 0) throw new Error('La unidad ' + x.um + ' no es de venta para ' + a.cod);
    if (x.sede && !Store.sede(x.sede)) throw new Error('Tienda no válida');
    if (x.tipo && M.TIPOS_CLIENTE.indexOf(x.tipo) < 0) throw new Error('Tipo de cliente no válido');
    if (!M.MONEDAS.find(m => m.cod === x.mon)) throw new Error('Elija la moneda');
    const p = Number(x.precio);
    if (!(p > 0)) throw new Error('El precio debe ser mayor que cero');
    const dup = Store.d.listas.find(l => l.id !== id && l.art === x.art && l.um === x.um && (l.sede || '') === (x.sede || '') && (l.tipo || '') === (x.tipo || '') && l.mon === x.mon);
    if (dup) throw new Error('Ya existe ese precio (' + dup.id + '): edítelo en lugar de duplicarlo');
    const datos = { art: x.art, um: x.um, sede: x.sede || '', tipo: x.tipo || '', mon: x.mon, precio: UI.r2(p) };
    if (id) {
      const l = Store.d.listas.find(k => k.id === id);
      if (!l) throw new Error('Precio no encontrado');
      return Object.assign(l, datos);
    }
    const l = Object.assign({ id: Store.sig('lp', 'LP-', 4) }, datos);
    Store.d.listas.push(l);
    return l;
  },
  quitar(id) {
    Store.exigir('editar_precios', 'modificar listas de precios');
    const i = Store.d.listas.findIndex(l => l.id === id);
    if (i < 0) throw new Error('Precio no encontrado');
    return Store.d.listas.splice(i, 1)[0];
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
    if (a.inv && !M.STOCK_CTRL.find(s => s.v === x.stockCtrl)) throw new Error('Elija el control de stock al vender');
    return Object.assign(a, { precioVenta: UI.r2(precio), precioMin: UI.r2(precioMin), verifMin: !!x.verifMin, dctoMin, dctoMax, igv: x.igv, stockCtrl: a.inv ? x.stockCtrl : '' });
  }
};

const Cfg = {
  guardar(x) {
    Store.exigir('configurar_comercial', 'cambiar la configuración comercial');
    const n = (v, min, max, nom) => { const k = Number(v); if (v === '' || isNaN(k) || k < min || k > max) throw new Error(nom + ' debe estar entre ' + min + ' y ' + max); return k; };
    const c = Store.cfg();
    const igv = n(x.igv, 0, 30, 'El IGV'), tc = n(x.tc, 0.01, 99, 'El tipo de cambio'), dv = n(x.diasValidez, 1, 90, 'La validez de la cotización'), da = n(x.diasAnulacion, 0, 30, 'El plazo para anular');
    if (!M.ALMACENES.some(a => a.cod === x.almMalEstado)) throw new Error('Elija el almacén para devoluciones en mal estado');
    Object.assign(c, { igv, tc: UI.r4(tc), diasValidez: Math.round(dv), diasAnulacion: Math.round(da), verificarPrecioMin: !!x.verificarPrecioMin, almMalEstado: x.almMalEstado });
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
