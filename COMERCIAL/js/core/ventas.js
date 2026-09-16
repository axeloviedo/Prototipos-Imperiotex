/* COMERCIAL V9 — reglas de negocio sin DOM: clientes, líneas de documento, cotizaciones, ventas y devoluciones.
   Cadena simple (estilo SAP B1, sin Orden de Venta ni Entrega aparte):
     Cotización (no mueve stock) → Venta pendiente de pago (COMPROMETE stock)
       → pago confirmado (validado en caja) que cubre el total (Salida GI-10: baja el Actual y libera lo comprometido)
       → Devolución (Ingreso GI-09, solo de lo que ya salió).
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
  precio(d, l) {
    const r = Precios.resolver(l.art, l.um, d.sede, Doc.tipoCli(d), d.mon);
    l.precio = r ? r.precio : 0;
    l.origen = r ? r.origen : 'Sin precio en ' + d.mon;
    return r;
  },
  nuevaLinea(d, cod) {
    const a = Store.art(cod);
    if (!a || !a.activo) throw new Error('El artículo ' + cod + ' no existe o está inactivo');
    if (!a.venta) throw new Error(a.nom + ' no está marcado como artículo de venta (GI-02)');
    const um = (a.uVenta && a.uVenta[0]) || a.u;
    const l = { art: a.cod, nom: a.nom, desc: '', um, factor: Precios.factor(a.cod, um), alm: a.inv ? Doc.sedeAlm(d) : '', cant: 1, precio: 0, origen: '', dcto: 0, obsequio: false };
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
    const antes = { um: l.um, alm: l.alm, precio: l.precio, origen: l.origen, factor: l.factor };
    if (campo === 'cant' || campo === 'precio' || campo === 'dcto') {
      const n = Number(val);
      if (val === '' || isNaN(n) || n < 0) throw new Error('Ingrese un número mayor o igual a cero');
      l[campo] = n;
      if (campo === 'precio') l.origen = 'Precio modificado a mano';
    } else if (campo === 'obsequio') l.obsequio = !!val;
    else if (campo === 'um') { l.um = val; l.factor = Precios.factor(l.art, val); Doc.precio(d, l); }
    else if (campo === 'alm') l.alm = val;
    else if (campo === 'desc') l.desc = String(val || '');
    if ((campo === 'um' || campo === 'alm') && Doc.duplicada(d, l, i)) {
      Object.assign(l, antes);
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
    /* el tipo de cliente cambia el nivel de la lista de precios: se vuelven a resolver (salvo los modificados a mano) */
    d.lineas.forEach(l => { if (l.origen !== 'Precio modificado a mano') Doc.precio(d, l); });
    Precios.doc(d);
    return c;
  },
  /* si alguna línea no tiene precio en la moneda destino, se revierte el cambio (regla de la documentación) */
  cambiarMoneda(d, mon) {
    if (!M.MONEDAS.find(m => m.cod === mon)) throw new Error('Moneda no válida');
    if (mon === d.mon) return;
    const prev = d.mon, copia = d.lineas.map(l => ({ precio: l.precio, origen: l.origen }));
    d.mon = mon;
    const sin = [];
    d.lineas.forEach(l => { const r = Doc.precio(d, l); if (!r && !l.obsequio) sin.push(l.art); });
    if (sin.length) {
      d.mon = prev;
      d.lineas.forEach((l, k) => { l.precio = copia[k].precio; l.origen = copia[k].origen; });
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
    if (!l.obsequio && !(l.precio > 0)) e.push('no tiene precio en ' + d.mon);
    if (a.inv && !l.alm) e.push('elija el almacén');
    if (!l.obsequio && l.precio > 0) {
      const min = UI.r2(l.precio * (a.dctoMin || 0) / 100), max = UI.r2(l.precio * (a.dctoMax || 0) / 100);
      if (l.dcto < min - 0.001 || l.dcto > max + 0.001) e.push('el descuento por unidad debe estar entre ' + UI.n(min) + ' y ' + UI.n(max) + ' (' + (a.dctoMin || 0) + '% a ' + (a.dctoMax || 0) + '% del precio)');
      if (a.precioMin > 0 && (Store.d.cfg.verificarPrecioMin || a.verifMin)) {
        const neto = Precios.netoEnSoles(l, d.mon);
        if (neto + 0.001 < a.precioMin) e.push('el precio neto (' + UI.s(neto) + ' por ' + a.u + ') está por debajo del precio mínimo de venta (' + UI.s(a.precioMin) + ')');
      }
    }
    if (a.inv && l.alm && l.cant > 0 && a.stockCtrl !== 'No verificar') {
      const nec = Doc.necesidad(d, l.art, l.alm), disp = Stock.disp(l.alm, l.art);
      if (nec > disp + 0.00005) {
        const txt = 'disponible ' + UI.n(disp, 0) + ' ' + a.u + ' en ' + l.alm + ', se necesitan ' + UI.n(nec, 0);
        if (modo === 'venta' && a.stockCtrl === 'Bloquear') e.push(txt); else w.push(txt);
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
    return { sede: sede || u.sede, cli: '', asesor: u.cod, mon: 'PEN', cond: 'CONTADO', obs: '', lineas: [], validez: UI.sumarDias(UI.ahora(), Store.d.cfg.diasValidez).slice(0, 10) };
  },
  revisar(d) {
    const e = [], c = Store.cli(d.cli);
    if (!c) e.push('Seleccione el cliente'); else if (!c.activo) e.push('El cliente ' + c.nom + ' está inactivo');
    if (!d.lineas.length) e.push('Agregue al menos un artículo o servicio');
    if (!M.cond(d.cond)) e.push('Elija la condición de pago');
    if (!d.validez) e.push('Indique la fecha de validez'); else if (UI.aFecha(d.validez) < UI.aFecha(UI.hoy())) e.push('La validez no puede ser anterior a hoy');
    if (d.lineas.some(l => l.obsequio) && !(d.obs || '').trim()) e.push('Indique en la observación el motivo del obsequio');
    const r = Doc.revisarLineas(d, 'cot');
    return { e: e.concat(r.e), w: r.w };
  },
  crear(d) {
    Store.exigir('crear_cotizacion', 'crear cotizaciones');
    Precios.doc(d);
    const r = Cot.revisar(d);
    if (r.e.length) throw new Error(r.e[0]);
    const c = Doc.snapCliente(JSON.parse(JSON.stringify(d)));
    Object.assign(c, { id: Store.sig('cot', 'COT-' + Store.anio() + '-', 6), fecha: UI.ahora(), estado: 'Vigente', venta: null, usuario: Store.usuario().nom, sedeNom: Store.sede(d.sede).nom, hist: [] });
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
      sede: sede || u.sede, fecha: UI.hoy(), cli: '', asesor: u.cod, mon: 'PEN', cond: 'CONTADO', comp: 'BV',
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
  revisarPago(mon, p) {
    const e = [], m = M.metodo(p.met);
    if (!m) { e.push('elija el medio de pago'); return e; }
    if (m.monedas.indexOf(mon) < 0) e.push(m.nom + ' no acepta ' + mon);
    if (!(Number(p.monto) > 0)) e.push('el monto debe ser mayor que cero');
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
    if (d.lineas.some(l => l.obsequio) && !(d.obs || '').trim()) e.push('Indique en la observación el motivo del obsequio');
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
    if (pagos.length && !Caja.abierta(d.sede, d.mon)) e.push('Para registrar pagos debe estar abierta la caja de ' + Store.sede(d.sede).nom + ' en ' + d.mon);
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
      if (Store.art(l.art).stockCtrl === 'Bloquear' && Doc.necesidad(d, l.art, alm) > Stock.disp(alm, l.art) + 0.00005) throw new Error('Stock disponible insuficiente de ' + l.art + ' en ' + alm);
    }));
    const ses = (d.pagos || []).length ? Caja.abierta(d.sede, d.mon) : null;
    const v = Doc.snapCliente(JSON.parse(JSON.stringify(d)));
    const serie = M.SERIES[d.sede][d.comp];
    Object.assign(v, {
      id: Store.sig('ven', 'VEN-' + Store.anio() + '-', 6), compNum: Store.sig('c_' + serie, serie + '-', 6),
      fecha: UI.ahora(), sedeNom: sede.nom, usuario: u.nom, estado: 'Registrada', salida: null, movs: [], reembolsos: [], hist: []
    });
    v.plazoAnular = UI.sumarDias(v.fecha, Store.d.cfg.diasAnulacion).slice(0, 10);
    if (Doc.soloServicios(v)) v.entrega = null;
    Precios.doc(v);
    /* compromiso por línea inventariable, en UM de inventario */
    v.lineas.forEach(l => { l.comp = (Store.art(l.art) || {}).inv ? UI.r4(l.cant * l.factor) : 0; });
    Stock.comprometer(v.lineas.filter(l => l.comp > 0).map(l => ({ alm: l.alm, art: l.art, cant: l.comp })), 1);
    v.pagos = (d.pagos || []).map(p => ({ id: Store.sig('pag', 'PAG-', 6), fecha: UI.ahora(), met: p.met, banco: p.banco || '', nop: p.nop || '', voucher: p.voucher || '', monto: UI.r2(p.monto), estado: 'Por validar', caja: ses.id, usuario: u.nom }));
    if (d.cot) { const c = Store.cot(d.cot); c.estado = 'Convertida'; c.venta = v.id; Store.hist(c, 'Convertida en venta', v.id); }
    const nComp = v.lineas.filter(l => l.comp > 0).length;
    Store.hist(v, 'Registrada', comp.nom + ' ' + v.compNum + (d.cot ? ' · desde ' + d.cot : '') + (nComp ? ' · stock comprometido en ' + nComp + ' línea(s) hasta que el pago confirmado cubra el total' : '') + (r.w.length ? ' · avisos: ' + r.w.join(' · ') : ''));
    Store.d.ventas.unshift(v);
    Ventas._salidaSiPagada(v); /* p. ej. un documento de total cero (solo obsequios) */
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
  /* REGLA: cuando lo confirmado (pagos validados) cubre el total sale el stock: una Salida GI-10 por almacén que baja el Actual y libera lo comprometido */
  _salidaSiPagada(v, pagoId) {
    if (!v || v.estado !== 'Registrada' || v.salida) return null;
    if (Ventas.confirmado(v) + 0.01 < v.total) return null;
    const u = Store.usuario(), comp = M.comp(v.comp);
    const det = (v.cliente && v.cliente.tipo) === 'MAYORISTA' ? 'Salida - Venta al por mayor' : 'Salida - Venta al por menor';
    const porAlm = {};
    v.lineas.forEach(l => { if ((Store.art(l.art) || {}).inv) (porAlm[l.alm] = porAlm[l.alm] || []).push(l); });
    const movs = [];
    Object.keys(porAlm).forEach(alm => {
      const lin = porAlm[alm];
      const mov = Stock.salida({ det, alm, destino: 'Cliente · ' + v.cliente.nom, ndoc: v.id, obs: comp.nom + ' ' + v.compNum + ' · pago confirmado', lineas: lin.map(l => ({ art: l.art, cant: UI.r4(l.cant * l.factor), bloquear: false, liberar: l.comp || 0 })) });
      lin.forEach(l => { const ml = mov.lineas.find(x => x.art === l.art); l.costo = UI.r4((ml ? ml.costo : 0) * l.factor); l.comp = 0; });
      v.movs.push(mov.id); movs.push(mov.id);
    });
    v.salida = { f: UI.ahora(), u: u.nom, pago: pagoId || null, movs };
    if (movs.length) Store.hist(v, 'Salida de stock', 'Pago confirmado completo: ' + movs.join(', ') + ' (baja el Actual y se libera lo comprometido)');
    return v.salida;
  },

  /* ---------- importes derivados ---------- */
  /* confirmado = pagos validados en caja (solo esto cuenta para sacar el stock) */
  confirmado(v) { return UI.r2(v.pagos.filter(p => p.estado === 'Validado').reduce((t, p) => t + p.monto, 0)); },
  pagado(v) { return UI.r2(v.pagos.filter(p => p.estado !== 'Anulado').reduce((t, p) => t + p.monto, 0) - v.reembolsos.filter(x => x.estado === 'Procesado').reduce((t, x) => t + x.monto, 0)); },
  devoluciones(v) { return Store.d.devs.filter(x => x.venta === v.id && x.estado !== 'Anulada'); },
  devuelto(v) { return UI.r2(Store.d.devs.filter(x => x.venta === v.id && x.estado === 'Finalizada').reduce((t, x) => t + x.total, 0)); },
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
    const ses = Caja.abierta(v.sede, v.mon);
    if (!ses) throw new Error('Abra la caja de ' + v.sedeNom + ' en ' + v.mon + ' para registrar el pago');
    const pago = { id: Store.sig('pag', 'PAG-', 6), fecha: UI.ahora(), met: p.met, banco: p.banco || '', nop: p.nop || '', voucher: p.voucher || '', monto: UI.r2(p.monto), estado: 'Por validar', caja: ses.id, usuario: Store.usuario().nom };
    v.pagos.push(pago);
    Store.hist(v, 'Pago registrado', M.metodo(p.met).nom + ' · ' + UI.m(pago.monto, v.mon) + ' · caja ' + ses.id);
    return pago;
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
      Stock.comprometer(lib.map(l => ({ alm: l.alm, art: l.art, cant: l.comp })), -1);
      lib.forEach(l => { l.comp = 0; });
    } else {
      const porAlm = {};
      v.lineas.forEach(l => { if ((Store.art(l.art) || {}).inv) (porAlm[l.alm] = porAlm[l.alm] || []).push(l); });
      Object.keys(porAlm).forEach(alm => {
        const mov = Stock.ingreso({ det: 'Ingreso - Devoluciones de Clientes', alm, origen: 'Cliente · ' + v.cliente.nom, ndoc: v.id, obs: 'Anulación de ' + v.id + ': ' + motivo, lineas: porAlm[alm].map(l => ({ art: l.art, cant: UI.r4(l.cant * l.factor), costo: UI.r4((l.costo || 0) / (l.factor || 1)) })) });
        v.movs.push(mov.id);
      });
    }
    v.pagos.filter(p => p.estado === 'Por validar').forEach(p => { p.estado = 'Anulado'; p.motivo = 'Venta anulada'; });
    const cobrado = Ventas.pagado(v) - Ventas.porDevolver(v);
    if (cobrado > 0.004) v.reembolsos.push({ id: Store.sig('ree', 'DD-', 6), origen: 'Anulación', monto: UI.r2(cobrado), estado: 'Pendiente', fecha: UI.ahora() });
    v.estado = 'Anulada';
    v.anulacion = { f: UI.ahora(), u: Store.usuario().nom, motivo };
    Store.hist(v, 'Anulada', motivo + (v.salida ? ' · stock devuelto al almacén' : Ventas.tieneStock(v) ? ' · stock comprometido liberado' : '') + (cobrado > 0.004 ? ' · por devolver ' + UI.m(cobrado, v.mon) : ''));
    return v;
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
  _armar(v, x, devId) {
    const cands = Dev.candidatas(v, devId), lineas = [];
    (x.lineas || []).forEach(y => {
      const cant = Number(y.cant) || 0;
      if (!(cant > 0)) return;
      const c = cands.find(k => k.n === Number(y.n));
      if (!c) throw new Error('La línea ' + y.n + ' no pertenece a la venta');
      if (cant > c.max + 0.00005) throw new Error('Línea ' + c.n + ' (' + c.art + '): se puede devolver hasta ' + UI.n(c.max, 0) + ' ' + c.um + ' (vendido ' + UI.n(c.vendida, 0) + ', ya devuelto ' + UI.n(c.devuelta, 0) + ')');
      if (M.TIPOS_DEV.indexOf(y.tipo) < 0) throw new Error('Línea ' + c.n + ': elija el tipo de devolución');
      const l = { n: c.n, art: c.art, nom: c.nom, um: c.um, factor: c.factor, alm: c.alm, cant, tipo: y.tipo, precio: c.precio, costo: c.costo };
      l.total = UI.r2(l.precio * cant);
      const t = Precios.tasa(l.art);
      l.subtotal = UI.r2(l.total / (1 + t));
      l.impuesto = UI.r2(l.total - l.subtotal);
      lineas.push(l);
    });
    if (!lineas.length) throw new Error('Indique la cantidad a devolver de al menos una línea');
    if (M.SUSTENTO_DEV.indexOf(x.sustTipo) < 0) throw new Error('Elija el documento de sustento');
    if (!String(x.sustNum || '').trim()) throw new Error('Ingrese el número del documento de sustento');
    const bruto = UI.r2(lineas.reduce((t, l) => t + l.total, 0)), dcto = Number(x.dcto) || 0;
    if (dcto < 0 || dcto > bruto) throw new Error('El descuento debe estar entre 0 y ' + UI.n(bruto));
    const f = bruto ? (bruto - dcto) / bruto : 0, total = UI.r2(bruto - dcto), igv = UI.r2(lineas.reduce((t, l) => t + l.impuesto, 0) * f);
    return { lineas, bruto, dcto: UI.r2(dcto), total, igv, subtotal: UI.r2(total - igv), sustTipo: x.sustTipo, sustNum: String(x.sustNum).trim(), obs: x.obs || '', voucher: x.voucher || '' };
  },
  crear(ventaId, x) {
    Store.exigir('crear_devolucion_venta', 'registrar devoluciones');
    const v = Store.venta(ventaId);
    if (!v) throw new Error('No existe la venta ' + ventaId);
    if (v.estado !== 'Registrada') throw new Error('Solo se devuelve una venta Registrada (' + v.id + ' está ' + v.estado + ')');
    if (!v.salida) throw new Error('La venta ' + v.id + ' aún no tiene salida de stock (sigue comprometido hasta que el pago confirmado cubra el total): no hay nada que devolver; si ya no va, anúlela');
    if (!Dev.candidatas(v).length) throw new Error('La venta no tiene productos: los servicios no se devuelven');
    const d = Object.assign({ id: Store.sig('dev', 'DEV-' + Store.anio() + '-', 6), fecha: UI.ahora(), venta: v.id, sede: v.sede, sedeNom: v.sedeNom, cliente: v.cliente, mon: v.mon, estado: 'Pendiente', usuario: Store.usuario().nom, movs: [], reembolso: null, hist: [] }, Dev._armar(v, x));
    Store.hist(d, 'Registrada', UI.n(d.lineas.reduce((t, l) => t + l.cant, 0), 0) + ' unidad(es) · ' + UI.m(d.total, d.mon));
    Store.d.devs.unshift(d);
    Store.hist(v, 'Devolución registrada', d.id + ' (Pendiente)');
    return d;
  },
  actualizar(d, x) {
    Store.exigir('crear_devolucion_venta', 'editar devoluciones');
    if (!d || d.estado !== 'Pendiente') throw new Error('Solo se edita una devolución Pendiente');
    Object.assign(d, Dev._armar(Store.venta(d.venta), x, d.id));
    Store.hist(d, 'Actualizada', UI.m(d.total, d.mon));
    return d;
  },
  finalizar(d) {
    Store.exigir('editar_devolucion_venta', 'finalizar devoluciones');
    if (!d || d.estado !== 'Pendiente') throw new Error('Solo se finaliza una devolución Pendiente');
    const v = Store.venta(d.venta);
    if (v.estado !== 'Registrada') throw new Error('La venta ' + v.id + ' ya no está Registrada');
    if (!v.salida) throw new Error('La venta ' + v.id + ' no tiene salida de stock: solo se devuelve lo que ya salió');
    Dev._armar(v, { lineas: d.lineas.map(l => ({ n: l.n, cant: l.cant, tipo: l.tipo })), sustTipo: d.sustTipo, sustNum: d.sustNum, dcto: d.dcto }, d.id);
    const netoAntes = Ventas.neto(v), pagado = Ventas.pagado(v), pendiente = Ventas.porDevolver(v);
    const porAlm = {};
    d.lineas.forEach(l => { const alm = l.tipo === 'Mal estado' ? Store.d.cfg.almMalEstado : l.alm; (porAlm[alm] = porAlm[alm] || []).push(l); });
    Object.keys(porAlm).forEach(alm => {
      const mov = Stock.ingreso({ det: 'Ingreso - Devoluciones de Clientes', alm, origen: 'Cliente · ' + d.cliente.nom, ndoc: d.id, obs: d.sustTipo + ' ' + d.sustNum + ' · venta ' + v.id, lineas: porAlm[alm].map(l => ({ art: l.art, cant: UI.r4(l.cant * l.factor), costo: UI.r4((l.costo || 0) / (l.factor || 1)) })) });
      d.movs.push(mov.id);
    });
    d.estado = 'Finalizada';
    d.finalizada = { f: UI.ahora(), u: Store.usuario().nom };
    /* dinero: primero baja la deuda; solo se devuelve lo que el cliente pagó de más */
    const monto = UI.r2(Math.min(d.total, Math.max(0, pagado - pendiente - (netoAntes - d.total))));
    if (monto > 0.004) {
      const re = { id: Store.sig('ree', 'DD-', 6), origen: d.id, monto, estado: 'Pendiente', fecha: UI.ahora() };
      v.reembolsos.push(re);
      d.reembolso = re.id;
    }
    Store.hist(d, 'Finalizada', 'Stock devuelto con ' + d.movs.join(', ') + (monto > 0.004 ? ' · por devolver al cliente ' + UI.m(monto, d.mon) : ' · se descuenta del saldo de la venta'));
    Store.hist(v, 'Devolución finalizada', d.id + ' · ' + UI.m(d.total, d.mon));
    return d;
  },
  /* D3: anulación lógica, solo mientras no movió stock */
  anular(d, motivo) {
    Store.exigir('crear_devolucion_venta', 'anular devoluciones');
    if (!d || d.estado !== 'Pendiente') throw new Error('Solo se anula una devolución Pendiente: una Finalizada ya movió stock');
    if (!String(motivo || '').trim()) throw new Error('Indique el motivo');
    d.estado = 'Anulada';
    Store.hist(d, 'Anulada', motivo);
    Store.hist(Store.venta(d.venta), 'Devolución anulada', d.id);
  },
  reembolso(d) {
    if (!d.reembolso) return null;
    const v = Store.venta(d.venta);
    return v ? v.reembolsos.find(x => x.id === d.reembolso) : null;
  },
  tieneCambio(d) { return d.lineas.some(l => l.tipo === 'Cambio'); }
};
