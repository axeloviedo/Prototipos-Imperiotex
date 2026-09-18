/* COMERCIAL V9 — reglas de negocio sin DOM: clientes, líneas de documento, cotizaciones, ventas y devoluciones.
   Cadena simple (estilo SAP B1, sin Orden de Venta ni Entrega aparte):
     Cotización (no mueve stock) → Venta pendiente de pago (COMPROMETE stock)
       → pago confirmado (validado en caja) que cubre el total (Salida GI-10: baja el Actual y libera lo comprometido)
       → Devolución = nota de crédito por ítem (Ingreso GI-09, solo de lo que ya salió; deja un crédito al cliente que paga su próxima venta o se devuelve en caja).
   DECISIÓN CERRADA 2026-09-16. Crédito: la misma regla; la condición de pago solo fija el vencimiento del saldo,
   el stock queda comprometido hasta que lo validado cubra el total.
   Toda regla que falla lanza Error con el motivo; App.accion lo muestra y no guarda. */

/* ============================== CLIENTES ============================== */
const Cli = {
  validarDoc(tipo, num) {
    num = String(num || '').trim().toUpperCase();
    if (!tipo) throw new Error('Elija el tipo de documento');
    if (!num) throw new Error('Ingrese el número de documento');
    if (tipo === 'DNI' && !/^\d{8}$/.test(num)) throw new Error('El DNI debe tener 8 dígitos');
    if (tipo === 'RUC' && !/^(10|15|17|20)\d{9}$/.test(num)) throw new Error('El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20');
    if (tipo === 'CE' && !/^[A-Z0-9]{8,12}$/.test(num)) throw new Error('El carné de extranjería debe tener entre 8 y 12 caracteres');
    return num;
  },
  _datos(x, cod) {
    const doc = Cli.validarDoc(x.tipoDoc, x.doc);
    const nom = String(x.nom || '').trim().toUpperCase();
    if (nom.length < 3) throw new Error('Ingrese el nombre o la razón social');
    if (M.TIPOS_CLIENTE.indexOf(x.tipo) < 0) throw new Error('Elija el tipo de cliente');
    if (x.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x.email)) throw new Error('El correo no tiene un formato válido');
    if (x.cond && !M.cond(x.cond)) throw new Error('Condición de pago no válida');
    const otro = Store.d.clientes.find(c => c.tipoDoc === x.tipoDoc && c.doc === doc && c.cod !== cod);
    if (otro) throw new Error('Ya existe el cliente ' + otro.cod + ' con ' + x.tipoDoc + ' ' + doc);
    return { tipoDoc: x.tipoDoc, doc, nom, tipo: x.tipo, tel: x.tel || '', email: x.email || '', dir: x.dir || '', ubigeo: x.ubigeo || '', cond: x.cond || 'CONTADO', obs: x.obs || '' };
  },
  crear(x) {
    Store.exigir('crear_cliente', 'crear clientes');
    const c = Object.assign({ cod: Store.sig('cli', 'CLI-', 6), activo: true, alta: UI.ahora() }, Cli._datos(x));
    Store.d.clientes.push(c);
    return c;
  },
  actualizar(cod, x) {
    Store.exigir('editar_cliente', 'editar clientes');
    const c = Store.cli(cod);
    if (!c) throw new Error('Cliente no encontrado');
    return Object.assign(c, Cli._datos(x, cod));
  },
  cambiarActivo(cod, activo) {
    Store.exigir('editar_cliente', 'activar o desactivar clientes');
    const c = Store.cli(cod);
    if (!c) throw new Error('Cliente no encontrado');
    c.activo = !!activo;
    return c;
  },
  docTxt(c) { return c ? c.tipoDoc + ' ' + c.doc : ''; },
  /* estado comercial DERIVADO de las compras (no es una columna): Sin compras / Nuevo / Activo / Por recuperar */
  estadoComercial(c) {
    const vs = Store.d.ventas.filter(v => v.cli === c.cod && v.estado === 'Registrada');
    if (!vs.length) return 'Sin compras';
    const ts = vs.map(v => UI.aFecha(v.fecha).getTime()), hoy = UI.aFecha(UI.ahora()).getTime();
    if ((hoy - Math.min.apply(null, ts)) / 864e5 <= 30) return 'Nuevo';
    if ((hoy - Math.max.apply(null, ts)) / 864e5 <= 60) return 'Activo';
    return 'Por recuperar';
  }
};

/* ============================== LÍNEAS (compartido por cotización y venta) ============================== */
const Doc = {
  sedeAlm(d) { const s = Store.sede(d.sede); return s ? s.alm : ''; },
  tipoCli(d) { const c = Store.cli(d.cli); return c ? c.tipo : ''; },
  MANUAL: 'Precio modificado a mano',
  /* precio de la línea según la tienda del documento, el segmento del cliente y la moneda (listas de precios y ofertas, LP2).
     La línea guarda de dónde sale el precio (origen) y, si es una oferta, cuál y el precio de lista que reemplaza */
  precio(d, l) {
    const r = Precios.resolver(l.art, l.um, d.sede, Doc.tipoCli(d), d.mon);
    l.precio = r ? r.precio : 0;
    l.origen = r ? r.origen : 'Sin precio en ' + d.mon;
    delete l.oferta; delete l.precioLista; delete l.lista; delete l.calculo; delete l.precioRef;
    if (r && r.lista) l.lista = r.lista;
    /* LP5/LP8: evidencia de cómo se llegó al precio (base, ofertas encontradas, ganadora, ajuste al mínimo) */
    if (r) l.calculo = { base: r.base, ofertas: r.ofertas, gana: r.oferta ? r.oferta.cod : (r.lista || 'sugerido'), minimo: r.minimo, ajusteMin: r.ajusteMin, fecha: UI.hoy() };
    /* LP4: la oferta no se suma al descuento manual de la línea */
    if (r && r.oferta) { l.oferta = r.oferta; l.precioLista = r.precioLista; l.dcto = 0; }
    return r;
  },
  nuevaLinea(d, cod) {
    const a = Store.art(cod);
    if (!Store.activo(a)) throw new Error('El artículo ' + cod + ' no existe o está inactivo');
    if (!a.venta) throw new Error(a.nom + ' no está marcado como artículo de venta (GI-02)');
    const um = Precios.umVenta(a.cod);
    const l = { art: a.cod, nom: a.nom, desc: '', um, factor: Precios.factor(a.cod, um), alm: a.inv ? Doc.sedeAlm(d) : '', cant: 1, precio: 0, origen: '', dcto: 0 };
    Doc.precio(d, l);
    Precios.linea(l);
    return l;
  },
  duplicada(d, l, i) { return d.lineas.some((x, k) => k !== i && x.art === l.art && x.um === l.um && x.alm === l.alm); },
  agregar(d, cod) {
    const l = Doc.nuevaLinea(d, cod);
    if (Doc.duplicada(d, l, -1)) throw new Error(l.art + ' ya está en el detalle con la misma unidad y almacén: cambie la cantidad de esa línea');
    d.lineas.push(l);
    Precios.doc(d);
    return l;
  },
  cambiar(d, i, campo, val) {
    const l = d.lineas[i];
    if (!l) throw new Error('Línea no encontrada');
    const antes = JSON.parse(JSON.stringify(l));
    if (campo === 'cant' || campo === 'precio' || campo === 'dcto') {
      const n = Number(val);
      if (val === '' || isNaN(n) || n < 0) throw new Error('Ingrese un número mayor o igual a cero');
      if (campo === 'dcto' && n > 0 && l.oferta) throw new Error('La línea tiene la oferta «' + l.oferta.nom + '»: no se suma un descuento manual (cambie el precio a mano si hace falta)');
      l[campo] = n;
      /* LP11: el precio del motor es REFERENCIAL: el vendedor lo cambia en la línea. Se conserva la referencia (precio, lista y cálculo) como evidencia;
         la oferta deja de aplicarse (LP4) */
      if (campo === 'precio') {
        if (l.origen !== Doc.MANUAL) l.precioRef = { precio: antes.precio, origen: antes.origen, lista: antes.lista || '', oferta: antes.oferta ? antes.oferta.cod : '' };
        l.origen = Doc.MANUAL; delete l.oferta; delete l.precioLista;
      }
    } else if (campo === 'um') { l.um = val; l.factor = Precios.factor(l.art, val); Doc.precio(d, l); }
    else if (campo === 'alm') l.alm = val;
    else if (campo === 'desc') l.desc = String(val || '');
    if ((campo === 'um' || campo === 'alm') && Doc.duplicada(d, l, i)) {
      Object.keys(l).forEach(k => delete l[k]); Object.assign(l, antes);
      Precios.doc(d);
      throw new Error('Ya hay otra línea de ' + l.art + ' con esa unidad y almacén');
    }
    Precios.doc(d);
    return l;
  },
  quitar(d, i) { d.lineas.splice(i, 1); Precios.doc(d); },
  cambiarCliente(d, cod) {
    const c = Store.cli(cod);
    if (!c) throw new Error('Cliente no encontrado');
    if (!c.activo) throw new Error('El cliente ' + c.nom + ' está inactivo');
    d.cli = cod;
    /* el segmento del cliente puede cambiar la lista o la oferta: se vuelven a resolver (salvo los modificados a mano) */
    d.lineas.forEach(l => { if (l.origen !== Doc.MANUAL) Doc.precio(d, l); });
    Precios.doc(d);
    return c;
  },
  /* si alguna línea no tiene precio en la moneda destino, se revierte el cambio (regla de la documentación) */
  cambiarMoneda(d, mon) {
    if (!M.MONEDAS.find(m => m.cod === mon)) throw new Error('Moneda no válida');
    if (mon === d.mon) return;
    const prev = d.mon, copia = JSON.stringify(d.lineas);
    d.mon = mon;
    const sin = [];
    /* el precio escrito a mano se conserva, convertido con el tipo de cambio (LP11); el resto se vuelve a calcular en la moneda nueva */
    d.lineas.forEach(l => {
      if (l.origen === Doc.MANUAL) { l.precio = Precios.convertir(l.precio, prev, mon); if (l.precioRef) l.precioRef.precio = Precios.convertir(l.precioRef.precio, prev, mon); return; }
      const r = Doc.precio(d, l); if (!r) sin.push(l.art);
    });
    if (sin.length) {
      d.mon = prev;
      d.lineas = JSON.parse(copia);
      Precios.doc(d);
      throw new Error('No se cambió la moneda: no hay precio en ' + mon + ' para ' + sin.join(', '));
    }
    Precios.doc(d);
  },
  /* cantidad total (UM de inventario) de un artículo en un almacén dentro del documento */
  necesidad(d, art, alm) { return UI.r4(d.lineas.filter(l => l.art === art && l.alm === alm).reduce((t, l) => t + (Number(l.cant) || 0) * (l.factor || 1), 0)); },

  /* modo 'cot': la falta de stock solo avisa (la cotización no mueve ni reserva nada); modo 'venta': según el control del artículo */
  revisarLinea(d, l, modo) {
    const a = Store.art(l.art) || {}, e = [], w = [];
    if (!(l.cant > 0)) e.push('la cantidad debe ser mayor que cero');
    if (!(l.precio > 0)) e.push('no tiene precio en ' + d.mon);
    if (a.inv && !l.alm) e.push('elija el almacén');
    /* LP4/LP8: la línea con oferta no revisa el rango del descuento manual (no lo admite); su precio ya viene con el piso del precio mínimo */
    if (l.precio > 0 && !l.oferta) {
      const min = UI.r2(l.precio * (a.dctoMin || 0) / 100), max = UI.r2(l.precio * (a.dctoMax || 0) / 100);
      if (l.dcto < min - 0.001 || l.dcto > max + 0.001) e.push('el descuento por unidad debe estar entre ' + UI.n(min) + ' y ' + UI.n(max) + ' (' + (a.dctoMin || 0) + '% a ' + (a.dctoMax || 0) + '% del precio)');
    }
    /* LP12: el vendedor NUNCA vende debajo del precio mínimo (siempre, sin depender de «Verificar el precio mínimo»), tampoco con descuento manual;
       sin mínimo, el neto debe ser mayor que cero */
    if (l.precio > 0) {
      const neto = Precios.netoEnSoles(l, d.mon);
      if (a.precioMin > 0 && neto + 0.001 < a.precioMin) e.push('el precio neto (' + UI.s(neto) + ' por ' + a.u + ') está por debajo del precio mínimo de venta (' + UI.s(a.precioMin) + ')');
      else if (!(neto > 0)) e.push('el precio neto debe ser mayor que cero');
    }
    /* L6: sin stock disponible no se vende (bloquea siempre); la cotización solo avisa porque no reserva stock */
    if (a.inv && l.alm && l.cant > 0) {
      const nec = Doc.necesidad(d, l.art, l.alm), disp = Stock.disp(l.alm, l.art);
      if (nec > disp + 0.00005) {
        const txt = 'disponible ' + UI.n(disp, 0) + ' ' + a.u + ' en ' + l.alm + ', se necesitan ' + UI.n(nec, 0);
        if (modo === 'venta') e.push(txt); else w.push(txt);
      }
    }
    return { e, w };
  },
  revisarLineas(d, modo) {
    const e = [], w = [];
    d.lineas.forEach((l, i) => {
      const r = Doc.revisarLinea(d, l, modo), p = 'Línea ' + (i + 1) + ' (' + l.art + '): ';
      r.e.forEach(x => e.push(p + x)); r.w.forEach(x => w.push(p + x));
    });
    return { e, w };
  },
  snapCliente(d) {
    const c = Store.cli(d.cli);
    d.cliente = c ? { cod: c.cod, doc: Cli.docTxt(c), nom: c.nom, tipo: c.tipo } : null;
    return d;
  },
  soloServicios(d) { return d.lineas.length > 0 && d.lineas.every(l => !(Store.art(l.art) || {}).inv); }
};

/* ============================== COTIZACIONES ============================== */
const Cot = {
  borrador(sede) {
    const u = Store.usuario();
    return { sede: sede || u.sede, cli: '', asesor: u.cod, mon: 'PEN', cond: 'CONTADO', obs: '', lineas: [], validez: UI.sumarDias(UI.ahora(), Store.cfg().diasValidez).slice(0, 10) };
  },
  revisar(d) {
    const e = [], c = Store.cli(d.cli);
    if (!c) e.push('Seleccione el cliente'); else if (!c.activo) e.push('El cliente ' + c.nom + ' está inactivo');
    if (!d.lineas.length) e.push('Agregue al menos un artículo o servicio');
    if (!M.cond(d.cond)) e.push('Elija la condición de pago');
    if (!d.validez) e.push('Indique la fecha de validez'); else if (UI.aFecha(d.validez) < UI.aFecha(UI.hoy())) e.push('La validez no puede ser anterior a hoy');
    const r = Doc.revisarLineas(d, 'cot');
    return { e: e.concat(r.e), w: r.w };
  },
  crear(d) {
    Store.exigir('crear_cotizacion', 'crear cotizaciones');
    Precios.doc(d);
    const r = Cot.revisar(d);
    if (r.e.length) throw new Error(r.e[0]);
    const c = Doc.snapCliente(JSON.parse(JSON.stringify(d)));
    Object.assign(c, { id: Store.sig('cot', 'COT-' + Store.anio() + '-', 6), emp: BD.empresaDe(Doc.sedeAlm(d)), fecha: UI.ahora(), estado: 'Vigente', venta: null, usuario: Store.usuario().nom, sedeNom: Store.sede(d.sede).nom, hist: [] });
    Precios.doc(c);
    Store.hist(c, 'Creada', r.w.length ? 'Avisos: ' + r.w.join(' · ') : '');
    Store.d.cots.unshift(c);
    return c;
  },
  editable(c) { return !!c && c.estado === 'Vigente' && Store.puede('editar_cotizacion'); },
  _ed(c) {
    if (!c) throw new Error('Cotización no encontrada');
    Store.exigir('editar_cotizacion', 'editar cotizaciones');
    if (c.estado !== 'Vigente') throw new Error('Solo se edita una cotización Vigente (' + c.id + ' está ' + c.estado + ')');
  },
  /* edición línea por línea: si el cambio deja la línea inválida se deshace (como un 422 del servidor) */
  _conReverso(c, fn) {
    const copia = JSON.stringify(c.lineas);
    try {
      const l = fn();
      if (l) { const r = Doc.revisarLinea(c, l, 'cot'); if (r.e.length) throw new Error(r.e[0]); }
      return l;
    } catch (err) { c.lineas = JSON.parse(copia); Precios.doc(c); throw err; }
  },
  agregarLinea(c, art) {
    Cot._ed(c);
    const l = Doc.agregar(c, art);
    Store.hist(c, 'Línea agregada', l.art + ' · ' + UI.m(l.precio, c.mon));
    return l;
  },
  cambiarLinea(c, i, campo, val) {
    Cot._ed(c);
    return Cot._conReverso(c, () => Doc.cambiar(c, i, campo, val));
  },
  quitarLinea(c, i) {
    Cot._ed(c);
    if (c.lineas.length <= 1) throw new Error('No se puede quitar la última línea: anule la cotización si ya no aplica');
    const l = c.lineas[i];
    Doc.quitar(c, i);
    Store.hist(c, 'Línea quitada', l.art);
  },
  cambiarCabecera(c, campo, val) {
    Cot._ed(c);
    if (campo === 'cli') { Doc.cambiarCliente(c, val); Doc.snapCliente(c); }
    else if (campo === 'mon') Doc.cambiarMoneda(c, val);
    else if (campo === 'cond') { if (!M.cond(val)) throw new Error('Condición no válida'); c.cond = val; }
    else if (campo === 'validez') { if (!val || UI.aFecha(val) < UI.aFecha(UI.hoy())) throw new Error('La validez no puede ser anterior a hoy'); c.validez = val; }
    else if (campo === 'asesor') { Store.exigir('asignar_vendedor', 'asignar el vendedor'); c.asesor = val; }
    else if (campo === 'obs') c.obs = String(val || '');
    if (campo !== 'obs') Store.hist(c, 'Cabecera actualizada', campo + ': ' + val);
  },
  clonar(c) {
    Store.exigir('crear_cotizacion', 'crear cotizaciones');
    const u = Store.usuario();
    const d = Cot.borrador(u.sede);
    Object.assign(d, { cli: c.cli, mon: c.mon, cond: c.cond, obs: c.obs, lineas: JSON.parse(JSON.stringify(c.lineas)) });
    d.lineas.forEach(l => { if (l.alm) l.alm = Doc.sedeAlm(d); });
    const n = Cot.crear(d);
    Store.hist(n, 'Clonada', 'Copia de ' + c.id);
    return n;
  },
  anular(c, motivo) {
    Store.exigir('eliminar_cotizacion', 'anular cotizaciones');
    if (['Vigente', 'Vencida'].indexOf(c.estado) < 0) throw new Error('No se anula una cotización ' + c.estado);
    if (!motivo) throw new Error('Indique el motivo');
    c.estado = 'Anulada';
    Store.hist(c, 'Anulada', motivo);
  },
  /* barrido (como el job diario): Vigente con la validez vencida pasa a Vencida */
  barrer() {
    const hoy = UI.aFecha(UI.hoy());
    Store.d.cots.forEach(c => {
      if (c.estado === 'Vigente' && hoy > UI.aFecha(c.validez)) {
        c.estado = 'Vencida';
        (c.hist = c.hist || []).push({ f: UI.ahora(), u: 'Sistema', a: 'Vencida', d: 'Pasó la fecha de validez ' + c.validez });
      }
    });
  },
  porVencer(c) { return c.estado === 'Vigente' && UI.dias(UI.hoy(), c.validez) <= 2; }
};

/* ============================== VENTAS ============================== */
const Ventas = {
  borrador(sede) {
    const u = Store.usuario();
    return {
      sede: sede || u.sede, fecha: UI.hoy(), cli: '', asesor: u.cod, mon: 'PEN', cond: 'CONTADO', comp: 'BV', entregar: false,
      ref: { tipo: '', serie: '', num: '' },
      entrega: { lugar: 'RECOJO', fecha: UI.hoy(), dir: '', ubigeo: '', agencia: '', encNom: '', encDoc: '', encTel: '' },
      obs: '', cot: null, lineas: [], pagos: []
    };
  },
  /* la conversión copia la cotización: líneas bloqueadas; se completan comprobante, pago, fecha, entrega y referencial */
  desdeCotizacion(id) {
    const c = Store.cot(id);
    if (!c) throw new Error('No existe la cotización ' + id);
    Cot.barrer();
    if (c.estado !== 'Vigente') throw new Error('Solo se convierte una cotización Vigente (' + c.id + ' está ' + c.estado + ')');
    const d = Ventas.borrador(c.sede);
    Object.assign(d, { cli: c.cli, asesor: c.asesor, mon: c.mon, cond: c.cond, obs: c.obs, cot: c.id, comp: '', lineas: JSON.parse(JSON.stringify(c.lineas)) });
    Precios.doc(d);
    return d;
  },
  /* el medio «Nota de crédito» usa el crédito del cliente: no entra a caja, no pide banco, operación ni voucher y se valida solo (DV2) */
  esSaldo(p) { const m = M.metodo(p && p.met); return !!(m && m.saldo); },
  revisarPago(mon, p) {
    const e = [], m = M.metodo(p.met);
    if (!m) { e.push('elija el medio de pago'); return e; }
    if (m.monedas.indexOf(mon) < 0) e.push(m.nom + ' no acepta ' + mon);
    if (!(Number(p.monto) > 0)) e.push('el monto debe ser mayor que cero');
    if (m.saldo) return e;
    if (m.bancos.length && m.bancos.indexOf(p.banco) < 0) e.push('elija el banco o procesador de ' + m.nom);
    if (!m.efectivo && !String(p.nop || '').trim()) e.push('ingrese el N° de operación');
    if (!m.efectivo && !String(p.voucher || '').trim()) e.push('adjunte el voucher');
    return e;
  },
  revisar(d) {
    const e = [], c = Store.cli(d.cli), comp = M.comp(d.comp);
    Precios.doc(d);
    if (!c) e.push('Seleccione el cliente'); else if (!c.activo) e.push('El cliente ' + c.nom + ' está inactivo');
    if (!d.lineas.length) e.push('Agregue al menos un artículo o servicio');
    if (!comp) e.push('Elija el tipo de comprobante');
    else if (comp.ruc && c && c.tipoDoc !== 'RUC') e.push('La factura exige un cliente con RUC');
    if (!M.cond(d.cond)) e.push('Elija la condición de pago');
    if (!d.fecha) e.push('Indique la fecha del documento'); else if (UI.aFecha(d.fecha) > UI.aFecha(UI.hoy())) e.push('La fecha del documento no puede ser posterior a hoy');
    const ref = d.ref || {}, llenos = [ref.tipo, ref.serie, ref.num].filter(x => String(x || '').trim()).length;
    if (llenos && llenos < 3) e.push('Documento referencial del cliente: complete tipo, serie y número, o deje los tres vacíos');
    if (d.cot) { const ct = Store.cot(d.cot); if (!ct || ct.estado !== 'Vigente') e.push('La cotización ' + d.cot + ' ya no está Vigente'); }
    if (d.lineas.length && !Doc.soloServicios(d)) {
      const en = d.entrega || {}, lg = M.lugar(en.lugar);
      if (!lg) e.push('Elija el lugar de entrega');
      else {
        if (!en.fecha) e.push('Indique la fecha de entrega');
        else if (d.fecha && UI.aFecha(en.fecha) < UI.aFecha(d.fecha)) e.push('La fecha de entrega no puede ser anterior a la del documento');
        if (lg.ubigeo && (!en.ubigeo || !String(en.dir || '').trim())) e.push('Entrega: indique el ubigeo y la dirección');
        if (lg.agencia && !en.agencia) e.push('Entrega: elija la agencia');
        if (!lg.propio && (!String(en.encNom || '').trim() || !String(en.encDoc || '').trim() || !String(en.encTel || '').trim())) e.push('Entrega fuera de la tienda: indique nombre, documento y teléfono de quien recibe');
      }
    }
    const rl = Doc.revisarLineas(d, 'venta');
    rl.e.forEach(x => e.push(x));
    const pagos = d.pagos || [], pag = UI.r2(pagos.reduce((t, p) => t + (Number(p.monto) || 0), 0)), cond = M.cond(d.cond);
    pagos.forEach((p, i) => Ventas.revisarPago(d.mon, p).forEach(x => e.push('Pago ' + (i + 1) + ': ' + x)));
    if (cond && cond.cod === 'CONTADO') {
      if (!pagos.length) e.push('Venta al contado: registre el pago');
      else if (Math.abs(pag - d.total) > 0.01) e.push('Venta al contado: los pagos (' + UI.m(pag, d.mon) + ') deben sumar el total (' + UI.m(d.total, d.mon) + ')');
    } else if (cond && pagos.length && pag >= d.total - 0.001) e.push('Venta al crédito: el pago a cuenta debe ser menor que el total (si paga todo, elija Contado)');
    const conSaldo = UI.r2(pagos.filter(Ventas.esSaldo).reduce((t, p) => t + (Number(p.monto) || 0), 0));
    if (conSaldo > 0 && c && conSaldo > Saldo.de(c.cod, d.mon) + 0.004) e.push('El crédito del cliente (notas de crédito) es ' + UI.m(Saldo.de(c.cod, d.mon), d.mon) + ': no alcanza para pagar ' + UI.m(conSaldo, d.mon));
    if (pagos.some(p => !Ventas.esSaldo(p)) && !Caja.abierta(d.sede, d.mon)) e.push('Para registrar pagos debe estar abierta la caja de ' + Store.sede(d.sede).nom + ' en ' + d.mon);
    return { e, w: rl.w };
  },
  /* registra la venta: nace Pendiente de pago y COMPROMETE el stock de sus líneas inventariables (todavía no hay salida) */
  registrar(d) {
    Store.exigir('crear_venta', 'registrar ventas');
    const r = Ventas.revisar(d);
    if (r.e.length) throw new Error(r.e[0]);
    const u = Store.usuario(), sede = Store.sede(d.sede), comp = M.comp(d.comp);
    /* F3: se vuelve a comprobar el Disponible de TODOS los almacenes antes de comprometer nada */
    const porAlm = {};
    d.lineas.forEach((l, i) => { l.n = i + 1; if ((Store.art(l.art) || {}).inv) (porAlm[l.alm] = porAlm[l.alm] || []).push(l); });
    Object.keys(porAlm).forEach(alm => porAlm[alm].forEach(l => {
      if (Doc.necesidad(d, l.art, alm) > Stock.disp(alm, l.art) + 0.00005) throw new Error('Stock disponible insuficiente de ' + l.art + ' en ' + alm);
    }));
    const ses = (d.pagos || []).some(p => !Ventas.esSaldo(p)) ? Caja.abierta(d.sede, d.mon) : null;
    const v = Doc.snapCliente(JSON.parse(JSON.stringify(d)));
    const serie = M.SERIES[d.sede][d.comp];
    Object.assign(v, {
      id: Store.sig('ven', 'VEN-' + Store.anio() + '-', 6), emp: BD.empresaDe(Doc.sedeAlm(d)), compNum: Store.sig('comp_' + serie, serie + '-', 6),
      fecha: UI.ahora(), sedeNom: sede.nom, usuario: u.nom, estado: 'Registrada', salida: null, movs: [], reembolsos: [], hist: []
    });
    v.plazoAnular = UI.sumarDias(v.fecha, Store.cfg().diasAnulacion).slice(0, 10);
    if (Doc.soloServicios(v)) v.entrega = null;
    Precios.doc(v);
    /* compromiso por línea inventariable, en UM de inventario */
    v.lineas.forEach(l => { l.comp = (Store.art(l.art) || {}).inv ? UI.r4(l.cant * l.factor) : 0; });
    Stock.comprometerLineas(v.lineas.filter(l => l.comp > 0).map(l => ({ alm: l.alm, art: l.art, cant: l.comp })), 1);
    v.pagos = (d.pagos || []).map(p => Ventas.esSaldo(p) ? Ventas._pagoSaldo(v, p.monto)
      : { id: Store.sig('pag', 'PAG-', 6), fecha: UI.ahora(), met: p.met, banco: p.banco || '', nop: p.nop || '', voucher: p.voucher || '', monto: UI.r2(p.monto), estado: 'Por validar', caja: ses.id, usuario: u.nom });
    if (d.cot) { const c = Store.cot(d.cot); c.estado = 'Convertida'; c.venta = v.id; Store.hist(c, 'Convertida en venta', v.id); }
    const nComp = v.lineas.filter(l => l.comp > 0).length;
    Store.hist(v, 'Registrada', comp.nom + ' ' + v.compNum + (d.cot ? ' · desde ' + d.cot : '') + (nComp ? ' · stock comprometido en ' + nComp + ' línea(s) hasta que el pago confirmado cubra el total' : '') + (r.w.length ? ' · avisos: ' + r.w.join(' · ') : ''));
    Store.d.ventas.unshift(v);
    Ventas._salidaSiPagada(v);
    if (!v.salida && d.entregar && Ventas.aCredito(v) && Ventas.tieneStock(v)) Ventas.entregar(v);
    return { venta: v, avisos: r.w };
  },

  /* ---------- stock de la venta (DECISIÓN CERRADA 2026-09-16) ---------- */
  tieneStock(v) { return v.lineas.some(l => (Store.art(l.art) || {}).inv); },
  comprometido(v) { return UI.r4(v.lineas.reduce((t, l) => t + (l.comp || 0), 0)); },
  /* '' (solo servicios) · Stock comprometido · Stock entregado · Stock liberado (anulada sin salida) · Stock devuelto (anulada con salida) */
  estadoStock(v) {
    if (!Ventas.tieneStock(v)) return '';
    if (v.estado === 'Anulada') return v.salida ? 'Stock devuelto' : 'Stock liberado';
    return v.salida ? 'Stock entregado' : 'Stock comprometido';
  },
  /* cuánto tienen comprometido las ventas pendientes en un almacén y artículo (para las consultas) */
  comprometidoVentas(alm, art) {
    return UI.r4(Store.d.ventas.filter(v => v.estado === 'Registrada' && !v.salida).reduce((t, v) => t + v.lineas.filter(l => l.alm === alm && l.art === art).reduce((s, l) => s + (l.comp || 0), 0), 0));
  },
  _porAlmacen(v) {
    const porAlm = {};
    v.lineas.forEach(l => { if ((Store.art(l.art) || {}).inv) (porAlm[l.alm] = porAlm[l.alm] || []).push(l); });
    return porAlm;
  },
  _lineasSalida(lin) { return lin.map(l => ({ art: l.art, cant: UI.r4(l.cant * l.factor), bloquear: false, liberar: l.comp || 0 })); },
  /* ¿la salida de la venta se puede registrar? (el Stock compartido no deja el Actual en negativo) → '' o el motivo */
  faltaParaSalir(v) {
    const porAlm = Ventas._porAlmacen(v);
    const txt = Object.keys(porAlm).map(alm => { const f = Stock.faltantes(alm, Ventas._lineasSalida(porAlm[alm]), false); return f.length ? Stock.textoFaltantes(alm, f) : ''; }).filter(Boolean);
    return txt.join(' · ');
  },
  /* REGLA: cuando lo confirmado (pagos validados) cubre el total sale el stock: una Salida GI-10 por almacén que baja el Actual y libera lo comprometido.
     Usa el Stock compartido (modulo 'Comercial'): la salida aparece en el Kardex y los movimientos de Inventarios. */
  _salidaSiPagada(v, pagoId) {
    if (!v || v.estado !== 'Registrada' || v.salida) return null;
    if (Ventas.confirmado(v) + 0.01 < v.total) return null;
    return Ventas._salida(v, pagoId, 'pago confirmado');
  },
  /* entrega del stock de una venta al crédito antes de cobrarla (CM-6): la decide el usuario al registrar o desde la ficha */
  entregar(v) {
    Store.exigir('crear_venta', 'entregar una venta al crédito');
    if (!v || v.estado !== 'Registrada') throw new Error('Solo se entrega una venta Registrada');
    if (v.salida) throw new Error('La venta ' + v.id + ' ya tiene su salida de stock');
    if (!Ventas.aCredito(v)) throw new Error('La venta ' + v.id + ' es al contado: el stock sale cuando el pago confirmado cubre el total');
    if (!Ventas.tieneStock(v)) throw new Error('La venta ' + v.id + ' no tiene productos que entregar');
    return Ventas._salida(v, null, 'entrega a crédito');
  },
  aCredito(v) { const c = M.cond(v && v.cond); return !!c && c.cod !== 'CONTADO'; },
  _salida(v, pagoId, motivo) {
    const u = Store.usuario(), comp = M.comp(v.comp);
    const det = (v.cliente && v.cliente.tipo) === 'MAYORISTA' ? 'Salida - Venta al por mayor' : 'Salida - Venta al por menor';
    const falta = Ventas.faltaParaSalir(v);
    if (falta) throw new Error('No se puede registrar la salida de ' + v.id + ': ' + falta);
    const porAlm = Ventas._porAlmacen(v), movs = [];
    Object.keys(porAlm).forEach(alm => {
      const lin = porAlm[alm];
      const r = Stock.salida({ tipoMov: 'SAL-VENTA', det, alm, destino: 'Cliente · ' + v.cliente.nom, ndoc: v.id, doc: 'Venta', modulo: 'Comercial', obs: comp.nom + ' ' + v.compNum + ' · ' + motivo, lineas: Ventas._lineasSalida(lin) });
      if (!r.ok) throw new Error(r.error);
      const mov = r.mov;
      lin.forEach(l => { const ml = mov.lineas.find(x => x.art === l.art); l.costo = UI.r4((ml ? ml.costo : 0) * l.factor); l.comp = 0; });
      v.movs.push(mov.id); movs.push(mov.id);
    });
    v.salida = { f: UI.ahora(), u: u.nom, pago: pagoId || null, motivo, movs };
    if (movs.length) Store.hist(v, 'Salida de stock', (motivo === 'pago confirmado' ? 'Pago confirmado completo' : 'Entrega a crédito (antes de cobrar)') + ': ' + movs.join(', ') + ' (baja el Actual y se libera lo comprometido)');
    return v.salida;
  },

  /* ---------- importes derivados ---------- */
  /* confirmado = pagos validados en caja (solo esto cuenta para sacar el stock) */
  confirmado(v) { return UI.r2(v.pagos.filter(p => p.estado === 'Validado').reduce((t, p) => t + p.monto, 0)); },
  pagado(v) { return UI.r2(v.pagos.filter(p => p.estado !== 'Anulado').reduce((t, p) => t + p.monto, 0) - v.reembolsos.filter(x => x.estado === 'Procesado').reduce((t, x) => t + x.monto, 0)); },
  devoluciones(v) { return Store.d.devs.filter(x => x.venta === v.id && x.estado !== 'Anulada'); },
  devuelto(v) { return UI.r2(Store.d.devs.filter(x => x.venta === v.id && (x.estado === 'Registrada' || x.estado === 'Finalizada')).reduce((t, x) => t + x.total, 0)); },
  neto(v) { return v.estado === 'Anulada' ? 0 : UI.r2(v.total - Ventas.devuelto(v)); },
  porDevolver(v) { return UI.r2(v.reembolsos.filter(x => x.estado === 'Pendiente').reduce((t, x) => t + x.monto, 0)); },
  deuda(v) { return v.estado === 'Anulada' ? 0 : UI.r2(Math.max(0, Ventas.neto(v) - Ventas.pagado(v))); },
  estadoPago(v) {
    if (Ventas.porDevolver(v) > 0.004) return 'Por devolver';
    if (v.estado === 'Anulada') return 'Anulada';
    const neto = Ventas.neto(v), pag = Ventas.pagado(v);
    const conf = UI.r2(Ventas.confirmado(v) - v.reembolsos.filter(x => x.estado === 'Procesado').reduce((t, x) => t + x.monto, 0));
    if (pag >= neto - 0.01) return conf >= neto - 0.01 ? 'Pagado' : 'Por validar';
    return pag > 0.004 ? 'Parcial' : 'Pendiente de pago';
  },
  porValidar(v) { return v.pagos.filter(p => p.estado === 'Por validar').length; },
  vencimiento(v) { const c = M.cond(v.cond); return c && c.dias ? UI.sumarDias(v.fecha, c.dias).slice(0, 10) : ''; },
  vencida(v) { const f = Ventas.vencimiento(v); return !!f && Ventas.deuda(v) > 0.004 && UI.aFecha(UI.hoy()) > UI.aFecha(f); },

  /* ---------- pagos (cobros) ---------- */
  agregarPago(v, p) {
    if (!Store.puede('crear_venta') && !Store.puede('crear_caja')) throw new Error('Su perfil no puede registrar pagos');
    if (!v || v.estado !== 'Registrada') throw new Error('Solo se cobra una venta Registrada');
    const e = Ventas.revisarPago(v.mon, p);
    if (e.length) throw new Error('Pago: ' + e[0]);
    const deuda = Ventas.deuda(v);
    if (deuda <= 0.004) throw new Error('La venta ' + v.id + ' no tiene saldo pendiente');
    if (Number(p.monto) > deuda + 0.01) throw new Error('El pago (' + UI.m(p.monto, v.mon) + ') supera el saldo pendiente (' + UI.m(deuda, v.mon) + ')');
    if (Ventas.esSaldo(p)) {
      if (Number(p.monto) > Saldo.de(v.cli, v.mon) + 0.004) throw new Error('El crédito del cliente (notas de crédito) es ' + UI.m(Saldo.de(v.cli, v.mon), v.mon));
      /* se valida solo: si completa el total, la salida debe poder registrarse antes de usar el saldo */
      if (!v.salida && Ventas.confirmado(v) + Number(p.monto) + 0.01 >= v.total) { const falta = Ventas.faltaParaSalir(v); if (falta) throw new Error('El pago completa el total y debe salir el stock, pero no alcanza: ' + falta); }
      const ps = Ventas._pagoSaldo(v, p.monto);
      v.pagos.push(ps);
      Store.hist(v, 'Pago con nota de crédito', UI.m(ps.monto, v.mon) + ' · ' + ps.saldoMov + ' (no entra a caja)');
      Ventas._salidaSiPagada(v, ps.id);
      return ps;
    }
    const ses = Caja.abierta(v.sede, v.mon);
    if (!ses) throw new Error('Abra la caja de ' + v.sedeNom + ' en ' + v.mon + ' para registrar el pago');
    const pago = { id: Store.sig('pag', 'PAG-', 6), fecha: UI.ahora(), met: p.met, banco: p.banco || '', nop: p.nop || '', voucher: p.voucher || '', monto: UI.r2(p.monto), estado: 'Por validar', caja: ses.id, usuario: Store.usuario().nom };
    v.pagos.push(pago);
    Store.hist(v, 'Pago registrado', M.metodo(p.met).nom + ' · ' + UI.m(pago.monto, v.mon) + ' · caja ' + ses.id);
    return pago;
  },
  /* pago con el crédito del cliente (sus notas de crédito): movimiento Uso, queda Validado al instante y no pertenece a ninguna caja */
  _pagoSaldo(v, monto) {
    const u = Store.usuario(), m = Saldo.usar(v.cli, v.mon, monto, { doc: 'Venta', id: v.id }, 'Pago de ' + v.id);
    return { id: Store.sig('pag', 'PAG-', 6), fecha: UI.ahora(), met: M.SALDO, banco: '', nop: m.id, voucher: '', monto: UI.r2(monto), estado: 'Validado', caja: null, saldoMov: m.id, usuario: u.nom, validado: { f: UI.ahora(), u: 'Sistema (nota de crédito)' } };
  },
  _pagoEnCaja(v, id) {
    Store.exigir('valid_payments', 'validar pagos');
    const p = v && v.pagos.find(x => x.id === id);
    if (!p) throw new Error('Pago no encontrado');
    if (p.estado !== 'Por validar') throw new Error('El pago ' + p.id + ' ya está ' + p.estado);
    const s = Store.sesion(p.caja);
    if (!s || s.estado !== 'Abierta') throw new Error('La caja ' + p.caja + ' ya está cerrada');
    return p;
  },
  validarPago(v, id) {
    const p = Ventas._pagoEnCaja(v, id);
    /* si este pago completa el total, la salida debe poder registrarse ANTES de marcarlo validado (no quedan cambios a medias) */
    if (!v.salida && Ventas.confirmado(v) + p.monto + 0.01 >= v.total) {
      const falta = Ventas.faltaParaSalir(v);
      if (falta) throw new Error('El pago completa el total y debe salir el stock, pero no alcanza: ' + falta);
    }
    p.estado = 'Validado';
    p.validado = { f: UI.ahora(), u: Store.usuario().nom };
    Store.hist(v, 'Pago validado en caja', p.id + ' · ' + UI.m(p.monto, v.mon) + ' · confirmado ' + UI.m(Ventas.confirmado(v), v.mon) + ' de ' + UI.m(v.total, v.mon));
    Ventas._salidaSiPagada(v, p.id);
    return p;
  },
  rechazarPago(v, id, motivo) {
    const p = Ventas._pagoEnCaja(v, id);
    if (!String(motivo || '').trim()) throw new Error('Indique por qué se rechaza el pago');
    p.estado = 'Anulado';
    p.motivo = motivo;
    Store.hist(v, 'Pago rechazado', p.id + ' · ' + motivo);
    return p;
  },

  /* D1: anulación lógica (nunca se borra). Sin salida (stock comprometido): libera lo comprometido, sin plazo.
     Con salida: solo dentro del plazo y devuelve el stock con un Ingreso. Lo cobrado queda Por devolver en caja */
  anular(v, motivo) {
    Store.exigir('anular_venta', 'anular ventas');
    if (!v || v.estado !== 'Registrada') throw new Error('La venta ya está ' + (v ? v.estado : 'eliminada'));
    if (!motivo) throw new Error('Elija el motivo de la anulación');
    if (Ventas.devoluciones(v).length) throw new Error('La venta tiene devoluciones: no se anula (anule antes las devoluciones pendientes)');
    if (v.salida && UI.aFecha(UI.hoy()) > UI.aFecha(v.plazoAnular)) throw new Error('El plazo para anular venció el ' + v.plazoAnular + ': registre una devolución');
    if (!v.salida) {
      const lib = v.lineas.filter(l => l.comp > 0);
      Stock.comprometerLineas(lib.map(l => ({ alm: l.alm, art: l.art, cant: l.comp })), -1);
      lib.forEach(l => { l.comp = 0; });
    } else {
      const porAlm = Ventas._porAlmacen(v);
      Object.keys(porAlm).forEach(alm => {
        const r = Stock.ingreso({ tipoMov: 'ING-DEVCLI', det: 'Ingreso - Devoluciones de Clientes', alm, origen: 'Cliente · ' + v.cliente.nom, ndoc: v.id, doc: 'Venta', modulo: 'Comercial', obs: 'Anulación de ' + v.id + ': ' + motivo, lineas: porAlm[alm].map(l => ({ art: l.art, cant: UI.r4(l.cant * l.factor), costo: UI.r4((l.costo || 0) / (l.factor || 1)) })) });
        if (!r.ok) throw new Error(r.error);
        v.movs.push(r.mov.id);
      });
    }
    v.pagos.filter(p => p.estado === 'Por validar').forEach(p => { p.estado = 'Anulado'; p.motivo = 'Venta anulada'; });
    const cobrado = UI.r2(Ventas.pagado(v) - Ventas.porDevolver(v));
    /* lo pagado con nota de crédito vuelve al crédito del cliente; el resto queda por devolver en caja, como siempre */
    const conSaldo = UI.r2(Math.min(cobrado, v.pagos.filter(p => p.estado !== 'Anulado' && Ventas.esSaldo(p)).reduce((t, p) => t + p.monto, 0)));
    const enCaja = UI.r2(cobrado - conSaldo);
    if (conSaldo > 0.004) Ventas._aSaldo(v, conSaldo, { doc: 'Anulación', id: v.id }, 'Anulación de ' + v.id);
    if (enCaja > 0.004) v.reembolsos.push({ id: Store.sig('ree', 'DD-', 6), origen: 'Anulación', monto: enCaja, estado: 'Pendiente', fecha: UI.ahora() });
    v.estado = 'Anulada';
    v.anulacion = { f: UI.ahora(), u: Store.usuario().nom, motivo };
    Store.hist(v, 'Anulada', motivo + (v.salida ? ' · stock devuelto al almacén' : Ventas.tieneStock(v) ? ' · stock comprometido liberado' : '') + (conSaldo > 0.004 ? ' · vuelven al crédito del cliente ' + UI.m(conSaldo, v.mon) : '') + (enCaja > 0.004 ? ' · por devolver ' + UI.m(enCaja, v.mon) : ''));
    return v;
  },
  /* dinero de la venta que pasa al crédito del cliente: Abono + devolución de dinero ya Procesada (sin caja),
     así lo pagado de la venta baja igual que con una devolución en caja */
  _aSaldo(v, monto, origen, obs) {
    const m = Saldo.abonar(v.cli, v.mon, monto, origen, obs);
    const re = { id: Store.sig('ree', 'DD-', 6), origen: origen.doc === 'Anulación' ? 'Anulación' : origen.id, monto: UI.r2(monto), estado: 'Procesado', destino: 'Crédito del cliente', saldoMov: m.id, fecha: UI.ahora() };
    v.reembolsos.push(re);
    return re;
  }
};

/* ============================== CRÉDITO DEL CLIENTE POR NOTAS DE CRÉDITO (2026-09-18) ==============================
   La devolución (nota de crédito) deja al cliente un crédito por lo que pagó, por cliente y moneda, sin vencimiento.
   Se usa como medio de pago «Nota de crédito» (M.SALDO = 'NC') en su próxima venta o se le devuelve en caja.
   BD.d.saldos = movimientos { id SAF-000001, emp, cli, mon, tipo Abono|Uso, monto, origen {doc, id}, obs, fecha, usuario }. Nunca se borran. */
const Saldo = {
  movs(cli, mon) { return (Store.d.saldos || []).filter(m => m.cli === cli && (!mon || m.mon === mon)); },
  de(cli, mon) { return UI.r2(Saldo.movs(cli, mon).reduce((t, m) => t + (m.tipo === 'Abono' ? m.monto : -m.monto), 0)); },
  /* [{mon, saldo}] con saldo mayor que cero */
  porMoneda(cli) { return M.MONEDAS.map(m => ({ mon: m.cod, saldo: Saldo.de(cli, m.cod) })).filter(x => x.saldo > 0.004); },
  _mov(tipo, cli, mon, monto, origen, obs) {
    monto = UI.r2(Number(monto));
    if (!(monto > 0)) throw new Error('El monto del crédito debe ser mayor que cero');
    if (!Store.cli(cli)) throw new Error('Cliente no encontrado');
    Store.d.saldos = Store.d.saldos || [];
    const m = { id: Store.sig('saf', 'SAF-', 6), emp: M._c().empresa || 'SB', cli, mon, tipo, monto, origen: origen || null, obs: obs || '', fecha: UI.ahora(), usuario: Store.usuario().nom };
    Store.d.saldos.unshift(m);
    return m;
  },
  abonar(cli, mon, monto, origen, obs) { return Saldo._mov('Abono', cli, mon, monto, origen, obs); },
  usar(cli, mon, monto, origen, obs) {
    if (Number(monto) > Saldo.de(cli, mon) + 0.004) throw new Error('El crédito del cliente (notas de crédito) es ' + UI.m(Saldo.de(cli, mon), mon) + ': no alcanza para ' + UI.m(monto, mon));
    return Saldo._mov('Uso', cli, mon, monto, origen, obs);
  }
};

/* ============================== DEVOLUCIONES (solo productos) ============================== */
const Dev = {
  /* R2: el máximo descuenta lo devuelto en TODAS las devoluciones no anuladas de la venta (salvo la que se edita) */
  candidatas(v, devId) {
    return v.lineas.filter(l => (Store.art(l.art) || {}).inv).map(l => {
      const ya = UI.r4(Store.d.devs.filter(x => x.venta === v.id && x.estado !== 'Anulada' && x.id !== devId)
        .reduce((t, x) => t + x.lineas.filter(y => y.n === l.n).reduce((s, y) => s + y.cant, 0), 0));
      return { n: l.n, art: l.art, nom: l.nom, um: l.um, factor: l.factor, alm: l.alm, vendida: l.cant, devuelta: ya, max: UI.r4(l.cant - ya), precio: l.cant ? UI.r4(l.total / l.cant) : 0, costo: l.costo || 0 };
    });
  },
  /* la nota de venta se corrige con una nota interna; boleta y factura con nota de crédito (su número se escribe: se emite en el sistema de facturación) */
  sustentoDe(v) { return v && v.comp === 'NV' ? 'Nota de devolución interna' : 'Nota de crédito'; },
  /* DV4: la nota de crédito se emite hasta 12 meses después de la venta */
  plazo(v) { return UI.sumarDias(v.fecha, Dev.DIAS_PLAZO).slice(0, 10); },
  DIAS_PLAZO: 365,
  puedeDevolver(v) {
    if (!v) return 'No existe la venta';
    if (v.estado !== 'Registrada') return 'Solo se devuelve una venta Registrada (' + v.id + ' está ' + v.estado + ')';
    if (!v.salida) return 'La venta ' + v.id + ' aún no tiene salida de stock (sigue comprometido hasta que el pago confirmado cubra el total): no hay nada que devolver; si ya no va, anúlela';
    if (!Dev.candidatas(v).length) return 'La venta no tiene productos: los servicios no se devuelven';
    if (UI.aFecha(UI.hoy()) > UI.aFecha(Dev.plazo(v))) return 'Pasaron 12 meses desde la venta (' + Dev.plazo(v) + '): ya no se emite nota de crédito';
    return '';
  },
  _armar(v, x, devId) {
    const cands = Dev.candidatas(v, devId), lineas = [];
    (x.lineas || []).forEach(y => {
      const cant = Number(y.cant) || 0;
      if (!(cant > 0)) return;
      const c = cands.find(k => k.n === Number(y.n));
      if (!c) throw new Error('La línea ' + y.n + ' no pertenece a la venta');
      if (cant > c.max + 0.00005) throw new Error('Línea ' + c.n + ' (' + c.art + '): se puede devolver hasta ' + UI.n(c.max, 0) + ' ' + c.um + ' (vendido ' + UI.n(c.vendida, 0) + ', ya devuelto ' + UI.n(c.devuelta, 0) + ')');
      const l = { n: c.n, art: c.art, nom: c.nom, um: c.um, factor: c.factor, alm: c.alm, cant, precio: c.precio, costo: c.costo };
      l.total = UI.r2(l.precio * cant);
      const t = Precios.tasa(l.art);
      l.subtotal = UI.r2(l.total / (1 + t));
      l.impuesto = UI.r2(l.total - l.subtotal);
      lineas.push(l);
    });
    if (!lineas.length) throw new Error('Indique la cantidad a devolver de al menos una prenda');
    if (M.SUSTENTO_DEV.indexOf(x.sustTipo) < 0) throw new Error('Elija el documento de sustento');
    if (!String(x.sustNum || '').trim()) throw new Error('Ingrese el N° de la ' + String(x.sustTipo).toLowerCase() + ' (se emite en el sistema de facturación)');
    if (!String(x.obs || '').trim()) throw new Error('Indique el motivo de la devolución');
    const total = UI.r2(lineas.reduce((t, l) => t + l.total, 0)), igv = UI.r2(lineas.reduce((t, l) => t + l.impuesto, 0));
    return { lineas, bruto: total, dcto: 0, total, igv, subtotal: UI.r2(total - igv), sustTipo: x.sustTipo, sustNum: String(x.sustNum).trim(), obs: String(x.obs).trim() };
  },
  /* crédito que deja la nota: lo que el cliente ya pagó por lo devuelto (si la venta tenía saldo por cobrar, primero se descuenta de ese saldo) */
  creditoDe(v, total) {
    const neto = Ventas.neto(v), pagado = Ventas.pagado(v), pend = Ventas.porDevolver(v);
    return UI.r2(Math.min(total, Math.max(0, pagado - pend - (neto - total))));
  },
  /* DV1 · registrar la devolución = nota de crédito por ítem, en un solo paso: entra el stock al almacén de la venta
     y el cliente queda con un crédito por lo que pagó. La boleta o factura original no se anula ni se toca. */
  crear(ventaId, x) {
    Store.exigir('crear_devolucion_venta', 'registrar devoluciones');
    const v = Store.venta(ventaId), no = Dev.puedeDevolver(v);
    if (no) throw new Error(no);
    const x0 = Dev._armar(v, x), cred = Dev.creditoDe(v, x0.total); /* antes de sumar la devolución a la venta */
    const d = Object.assign({ id: Store.sig('dev', 'DEV-' + Store.anio() + '-', 6), emp: v.emp || BD.empresaDe(Doc.sedeAlm(v)), fecha: UI.ahora(), venta: v.id, sede: v.sede, sedeNom: v.sedeNom, cliente: v.cliente, mon: v.mon, estado: 'Registrada', usuario: Store.usuario().nom, movs: [], reembolso: null, hist: [] }, x0);
    Store.d.devs.unshift(d);
    Dev._aplicar(d, v, cred);
    Store.hist(v, 'Devolución', d.id + ' · ' + d.sustTipo + ' ' + d.sustNum + ' · ' + UI.m(d.total, d.mon) + ' · la venta no se modifica');
    return d;
  },
  _aplicar(d, v, cred) {
    Dev._ingresar(d, v);
    const desc = UI.r2(d.total - cred);
    d.credito = cred;
    if (cred > 0.004) { const re = Ventas._aSaldo(v, cred, { doc: 'Devolución', id: d.id }, d.sustTipo + ' ' + d.sustNum); d.saldoMov = re.saldoMov; d.reembolsoSaldo = re.id; }
    Store.hist(d, 'Registrada', 'Stock devuelto con ' + d.movs.join(', ') + (cred > 0.004 ? ' · crédito del cliente ' + UI.m(cred, d.mon) : '') + (desc > 0.004 ? ' · se descuenta del saldo por cobrar ' + UI.m(desc, d.mon) : ''));
  },
  /* bases guardadas antes: una devolución Pendiente se registra con el mismo efecto */
  finalizar(d) {
    Store.exigir('crear_devolucion_venta', 'registrar devoluciones');
    if (!d || d.estado !== 'Pendiente') throw new Error('Solo se registra una devolución Pendiente');
    const v = Store.venta(d.venta), no = Dev.puedeDevolver(v);
    if (no) throw new Error(no);
    Object.assign(d, Dev._armar(v, { lineas: d.lineas.map(l => ({ n: l.n, cant: l.cant })), sustTipo: d.sustTipo, sustNum: d.sustNum, obs: d.obs || 'Devolución' }, d.id));
    const cred = Dev.creditoDe(v, d.total);
    d.estado = 'Registrada';
    Dev._aplicar(d, v, cred);
    return d;
  },
  /* todo vuelve con un Ingreso ING-DEVCLI al almacén de la venta, al costo con que salió (sin «mal estado»: si hiciera falta, Inventarios lo traslada) */
  _ingresar(d, v) {
    const porAlm = {};
    d.lineas.forEach(l => { (porAlm[l.alm] = porAlm[l.alm] || []).push(l); });
    Object.keys(porAlm).forEach(alm => {
      const r = Stock.ingreso({ tipoMov: 'ING-DEVCLI', det: 'Ingreso - Devoluciones de Clientes', alm, origen: 'Cliente · ' + d.cliente.nom, ndoc: d.id, doc: 'Devolución', modulo: 'Comercial', obs: d.sustTipo + ' ' + d.sustNum + ' · venta ' + v.id,
        lineas: porAlm[alm].map(l => ({ art: l.art, cant: UI.r4(l.cant * l.factor), costo: UI.r4((l.costo || 0) / (l.factor || 1)) })) });
      if (!r.ok) throw new Error(r.error);
      d.movs.push(r.mov.id);
    });
  },
  /* D3: una devolución Pendiente (bases guardadas antes) se anula con motivo; una registrada ya movió stock y dinero */
  anular(d, motivo) {
    Store.exigir('crear_devolucion_venta', 'anular devoluciones');
    if (!d || d.estado !== 'Pendiente') throw new Error('Solo se anula una devolución Pendiente: una registrada ya movió stock');
    if (!String(motivo || '').trim()) throw new Error('Indique el motivo');
    d.estado = 'Anulada';
    d.anulada = { f: UI.ahora(), u: Store.usuario().nom, motivo };
    Store.hist(d, 'Anulada', motivo);
    Store.hist(Store.venta(d.venta), 'Devolución anulada', d.id);
  },
  /* lo ya devuelto en caja de esta nota */
  devueltoCaja(d) {
    const v = Store.venta(d.venta);
    return v ? UI.r2(v.reembolsos.filter(r => r.origen === d.id && r.destino !== 'Crédito del cliente').reduce((t, r) => t + r.monto, 0)) : 0;
  },
  /* cuánto de esta nota se puede devolver en caja: lo que no se devolvió aún y que el cliente todavía tiene como crédito */
  porDevolverCaja(d) {
    if (!d || d.estado !== 'Registrada' || !(d.credito > 0)) return 0;
    return UI.r2(Math.max(0, Math.min(d.credito - Dev.devueltoCaja(d), Saldo.de(d.cliente.cod, d.mon))));
  },
  /* DV3 · devolver en caja (lo que sobra de un cambio a menor valor, o una devolución sin producto nuevo): el crédito baja (Uso)
     y sale el dinero de la caja abierta de la tienda en el mismo paso (movimiento de caja tipo Devolución) */
  devolverEnCaja(d, monto, x) {
    Store.exigir('crear_caja', 'devolver dinero');
    const v = Store.venta(d.venta), max = Dev.porDevolverCaja(d), m = UI.r2(Number(monto));
    if (!(m > 0)) throw new Error('Indique cuánto se devuelve');
    if (m > max + 0.004) throw new Error('Se puede devolver hasta ' + UI.m(max, d.mon) + ' (crédito de esta nota que el cliente aún no usó)');
    const s = Caja.abierta(v.sede, v.mon);
    if (!s) throw new Error('Abra la caja de ' + v.sedeNom + ' en ' + v.mon + ' para devolver el dinero');
    return Dev._atomico(() => {
      const dd = Store.dev(d.id), vv = Store.venta(v.id);
      const mov = Saldo.usar(dd.cliente.cod, dd.mon, m, { doc: 'Devolución', id: dd.id }, 'Devuelto en caja');
      const re = { id: Store.sig('ree', 'DD-', 6), origen: dd.id, monto: m, estado: 'Pendiente', fecha: UI.ahora(), saldoMov: mov.id };
      vv.reembolsos.push(re);
      const mc = Caja.procesarReembolso(Store.sesion(s.id), vv.id, re.id, x || { met: 'EFE' });
      Store.hist(dd, 'Devuelto en caja', UI.m(m, dd.mon) + ' · ' + mc.id);
      return mc;
    });
  },
  _atomico(fn) {
    const copia = JSON.stringify(BD.d);
    try { return fn(); } catch (e) { BD.d = JSON.parse(copia); throw e; }
  },
  reembolso(d) {
    if (!d.reembolso) return null;
    const v = Store.venta(d.venta);
    return v ? v.reembolsos.find(x => x.id === d.reembolso) : null;
  },
  /* texto corto del dinero para listados */
  dineroTxt(d) {
    if (d.estado === 'Anulada') return '—';
    if (d.estado === 'Pendiente') return 'Pendiente de registrar';
    const re = Dev.reembolso(d); /* devoluciones de la versión anterior: dinero por devolver en caja */
    if (re) return 'Caja ' + UI.m(re.monto, d.mon) + ' · ' + re.estado;
    const cred = d.credito != null ? d.credito : d.total, caja = Dev.devueltoCaja(d), p = [];
    if (cred > 0.004) p.push('Crédito ' + UI.m(cred, d.mon));
    if (caja > 0.004) p.push('devuelto en caja ' + UI.m(caja, d.mon));
    if (UI.r2(d.total - cred) > 0.004) p.push('descontado del saldo ' + UI.m(UI.r2(d.total - cred), d.mon));
    return p.join(' · ') || '—';
  }
};
