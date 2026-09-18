/* COMPARTIDO · datos propios de Comercial: tiendas, cajas, medios de pago, comprobantes y series, condiciones, tipos de cliente,
   ubigeos, usuarios y perfiles de la demo, clientes, listas de precios y ofertas, y configuración comercial.
   Formato en docs/16_BASE_DATOS_COMPARTIDA.md §3. Lo mantiene quien trabaja COMERCIAL/.
   - maestros.comercial: catálogos fijos de Comercial (no chocan con las claves comunes: las tiendas no son las «sedes» de la plantilla).
   - maestros.articulos / categorias: servicios que vende Comercial (se AGREGAN a los de la base; prefijo SERV-VTA- para no chocar con SRV-).
     Los productos de venta son los de la base con venta: true (Zuleika PT-0001..0004, pestaña Venta en maestros-complementos.js).
   - colecciones: lo editable desde Comercial (clientes, listas de precios, configuración) con su valor inicial, y lo transaccional vacío.
   Lo marcado aConfirmar: true es un dato inventado que el usuario debe validar. */
const BD_COMERCIAL = (() => {
  const O = 'comercial';

  /* Tienda = punto de venta. Cada una vende desde un almacén REAL de la plantilla (una caja abierta por tienda y moneda). */
  const tiendas = [
    { cod: 'TDA-01', nom: 'Tienda #1 · Galería "Ya"', dir: 'Gamarra, Galería "Ya" 1043, La Victoria', alm: 'SB-TIENDA01', sede: 'YA', canal: 'TIENDA' },
    { cod: 'TDA-02', nom: 'Tienda #2 · Galería "Damero"', dir: 'Gamarra, Galería "Damero" 939, La Victoria', alm: 'SB-TIENDA02', sede: 'DAM', canal: 'TIENDA' },
    { cod: 'MAY-01', nom: 'Local Mayorista · Almacén Central', dir: 'Pisagua 984, La Victoria', alm: 'SB-CENTRAL', sede: 'G', canal: 'MAYORISTA', aConfirmar: true }
  ];

  const comercial = {
    empresa: 'SB',
    tiendas,
    cajas: [
      { cod: 'CJ-TDA01-PEN', nom: 'Caja Tienda #1 · Soles', sede: 'TDA-01', mon: 'PEN' },
      { cod: 'CJ-TDA01-USD', nom: 'Caja Tienda #1 · Dólares', sede: 'TDA-01', mon: 'USD' },
      { cod: 'CJ-TDA02-PEN', nom: 'Caja Tienda #2 · Soles', sede: 'TDA-02', mon: 'PEN' },
      { cod: 'CJ-MAY01-PEN', nom: 'Caja Local Mayorista · Soles', sede: 'MAY-01', mon: 'PEN' },
      { cod: 'CJ-MAY01-USD', nom: 'Caja Local Mayorista · Dólares', sede: 'MAY-01', mon: 'USD' }
    ],
    monedas: [{ cod: 'PEN', nom: 'Soles', sim: 'S/' }, { cod: 'USD', nom: 'Dólares', sim: 'US$' }],
    /* mismos nombres y días que condicionesPago de la plantilla de proveedores, con código para el cliente */
    condiciones: [{ cod: 'CONTADO', nom: 'Contado', dias: 0 }, { cod: 'CRED15', nom: 'Crédito 15 días', dias: 15 }, { cod: 'CRED30', nom: 'Crédito 30 días', dias: 30 }, { cod: 'CRED60', nom: 'Crédito 60 días', dias: 60 }],
    metodos: [
      { cod: 'EFE', nom: 'Efectivo', efectivo: true, bancos: [], monedas: ['PEN', 'USD'] },
      { cod: 'YAPE', nom: 'Yape / Plin', efectivo: false, bancos: [], monedas: ['PEN'] },
      { cod: 'TRF', nom: 'Transferencia bancaria', efectivo: false, bancos: ['BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK'], monedas: ['PEN', 'USD'] },
      { cod: 'POS', nom: 'Tarjeta (POS)', efectivo: false, bancos: ['NIUBIZ', 'IZIPAY'], monedas: ['PEN', 'USD'] },
      { cod: 'DEP', nom: 'Depósito en cuenta', efectivo: false, bancos: ['BCP', 'BBVA'], monedas: ['PEN', 'USD'] },
      /* crédito del cliente por sus notas de crédito (devoluciones, 2026-09-18): se valida solo, no entra a caja y no pide voucher;
         solo se ofrece si el cliente tiene crédito en la moneda de la venta */
      { cod: 'NC', nom: 'Nota de crédito', efectivo: false, saldo: true, bancos: [], monedas: ['PEN', 'USD'] }
    ],
    /* comprobante de la venta: serie única por tienda y tipo (el envío a SUNAT queda fuera de este prototipo) */
    comprobantes: [{ cod: 'NV', nom: 'Nota de venta', ruc: false }, { cod: 'BV', nom: 'Boleta de venta', ruc: false }, { cod: 'FA', nom: 'Factura', ruc: true }],
    series: { 'TDA-01': { NV: 'NV01', BV: 'B001', FA: 'F001' }, 'TDA-02': { NV: 'NV02', BV: 'B002', FA: 'F002' }, 'MAY-01': { NV: 'NV03', BV: 'B003', FA: 'F003' } },
    docReferencial: ['Orden de compra del cliente', 'Guía de remisión del cliente', 'Factura del cliente'],
    /* el número del sustento se escribe a mano: la nota de crédito se emite en el sistema de facturación (2026-09-18) */
    sustentoDev: ['Nota de crédito', 'Nota de devolución interna'],
    tiposDev: ['Normal', 'Mal estado', 'Cambio'], /* ya no se usa desde 2026-09-18: la devolución no distingue estado (DV1) */
    lugaresEntrega: [
      { cod: 'RECOJO', nom: 'Recojo en tienda', propio: true },
      { cod: 'DELIVERY', nom: 'Delivery en Lima', propio: false, ubigeo: true },
      { cod: 'AGENCIA', nom: 'Envío por agencia (provincia)', propio: false, ubigeo: true, agencia: true }
    ],
    agencias: ['SHALOM', 'OLVA COURIER', 'MARVISUR'],
    motivosAnulacion: ['Error de registro', 'Cliente desistió de la compra', 'Precio o cantidad equivocados', 'Otro'],
    afectacion: ['Gravado', 'Exonerado', 'Inafecto'],
    /* clientes: el socio de negocio NO se unifica con el proveedor. Grupo = Nacional / Internacional (como el proveedor, 2026-09-18) */
    tiposDoc: [{ cod: 'DNI', nom: 'DNI', largo: 8 }, { cod: 'RUC', nom: 'RUC', largo: 11 }, { cod: 'CE', nom: 'Carné de extranjería', largo: 0 }],
    tiposCliente: ['MINORISTA', 'MAYORISTA', 'EXPORTACIÓN', 'SERVICIOS'],
    ubigeos: [
      { cod: '150115', t: 'LIMA / Lima / La Victoria' }, { cod: '150132', t: 'LIMA / Lima / San Juan de Lurigancho' },
      { cod: '150101', t: 'LIMA / Lima / Lima' }, { cod: '150131', t: 'LIMA / Lima / San Isidro' },
      { cod: '140101', t: 'LAMBAYEQUE / Chiclayo / Chiclayo' }, { cod: '130101', t: 'LA LIBERTAD / Trujillo / Trujillo' },
      { cod: '040101', t: 'AREQUIPA / Arequipa / Arequipa' }
    ],
    /* usuarios de la demo: cada uno tiene UNA tienda asignada (la caja es de la tienda, no del cajero).
       El usuario activo NO se guarda en la base: localStorage 'imperiotex.comercial.usuario' */
    usuarios: [
      { cod: 'USER12', nom: 'Lucía Paredes', perfil: 'Supervisor comercial', sede: 'TDA-01' },
      { cod: 'USER10', nom: 'Karina Salas', perfil: 'Vendedor', sede: 'TDA-01' },
      { cod: 'USER11', nom: 'Pedro Ríos', perfil: 'Cajero', sede: 'TDA-01' },
      { cod: 'USER13', nom: 'Diego Campos', perfil: 'Vendedor', sede: 'MAY-01' },
      { cod: 'USER14', nom: 'Rosa Medina', perfil: 'Cajero', sede: 'MAY-01' },
      { cod: 'USER15', nom: 'Iván Torres', perfil: 'Vendedor', sede: 'TDA-02' }
    ],
    /* permisos finos por acción (ver_*, crear_*, editar_*, eliminar_*) */
    perfiles: {
      'Vendedor': ['ver_cotizacion', 'crear_cotizacion', 'editar_cotizacion', 'ver_venta', 'crear_venta', 'ver_devolucion_venta', 'crear_devolucion_venta', 'ver_cliente', 'crear_cliente', 'editar_cliente', 'ver_existencias', 'ver_caja',
        'ver_solicitud_fabricacion', 'crear_solicitud_materiales', 'recibir_transferencia'],
      'Cajero': ['ver_cotizacion', 'ver_venta', 'ver_devolucion_venta', 'ver_caja', 'crear_caja', 'editar_caja', 'valid_payments', 'ver_cliente', 'ver_existencias', 'recibir_transferencia'],
      'Supervisor comercial': ['ver_cotizacion', 'crear_cotizacion', 'editar_cotizacion', 'eliminar_cotizacion', 'ver_venta', 'crear_venta', 'anular_venta', 'asignar_vendedor',
        'ver_devolucion_venta', 'crear_devolucion_venta', 'editar_devolucion_venta', 'ver_caja', 'crear_caja', 'editar_caja', 'valid_payments',
        'ver_cliente', 'crear_cliente', 'editar_cliente', 'ver_existencias', 'editar_precios', 'configurar_comercial',
        'ver_solicitud_fabricacion', 'crear_solicitud_materiales', 'recibir_transferencia']
      /* acceso_logistico_general (usuario logístico: movimientos y recepción de todos los almacenes) no lo tiene ningún perfil de Comercial */
    },
    /* primer número de las series de Comercial en BD.d.seq cuando todavía no existen (los clientes y listas iniciales ya ocupan números) */
    seqInicial: { cli: 9, lpr: 10 }
  };

  /* servicios que vende la tienda (no inventariables: sin almacén, stock ni devolución) */
  const srv = (cod, nom, cat, precio, min, dctoMax, igv) => ({ cod, nom, desc: nom, grupo: 'SRV', cat, subcat: '', u: 'UND', ctrl: 'Nada',
    inv: false, compra: false, venta: true, produccion: false, igv, estado: 'Activo', costo: 0,
    precioVenta: precio, precioMin: min, uVenta: 'UND', dctoMin: 0, dctoMax, origen: O, aConfirmar: true });
  const articulos = [
    srv('SERV-VTA-0001', 'SERVICIO DE BORDADO DE NOMBRE', 'PERSONALIZACION', 15.00, 0, 20, 'Gravado'),
    srv('SERV-VTA-0002', 'SERVICIO DE ARREGLO DE BASTA', 'ARREGLOS', 10.00, 0, 50, 'Gravado'),
    srv('SERV-VTA-0003', 'SERVICIO DE PERSONALIZACION CON PARCHE', 'PERSONALIZACION', 25.00, 18.00, 10, 'Exonerado')
  ];
  const categorias = [
    { cod: 'SVPER', nom: 'PERSONALIZACION', grupo: 'SRV', origen: O },
    { cod: 'SVARR', nom: 'ARREGLOS', grupo: 'SRV', origen: O }
  ];

  const cli = (n, tipoDoc, doc, nom, tipo, tel, email, dir, ubigeo, cond, obs, alta, activo) =>
    ({ cod: 'CLI-' + String(n).padStart(6, '0'), tipoDoc, doc, nom, grupo: 'Nacional', tipo, tel, email, dir, ubigeo, cond, obs, activo: activo !== false, alta, aConfirmar: true });
  const clientes = [
    cli(1, 'DNI', '45781236', 'MARÍA FERNANDA QUISPE ROJAS', 'MINORISTA', '987 654 321', 'mfquispe@gmail.com', 'Jr. Huánuco 1580', '150115', 'CONTADO', '', '12/01/2026 10:00'),
    cli(2, 'RUC', '20601234567', 'COMERCIAL ANDINA SAC', 'MAYORISTA', '074 231 456', 'compras@comercialandina.pe', 'Av. Balta 820', '140101', 'CRED30', 'Despachar por agencia Shalom', '24/01/2026 10:00'),
    cli(3, 'RUC', '10457812369', 'JORGE LUIS HUAMÁN TORRES', 'MAYORISTA', '955 112 330', '', 'Galería Guizado, stand 214', '150115', 'CONTADO', 'Boutique en Trujillo', '05/02/2026 10:00'),
    cli(4, 'DNI', '70123456', 'ANDREA VÁSQUEZ LEÓN', 'MINORISTA', '912 400 781', 'andrea.vl@hotmail.com', '', '150132', 'CONTADO', '', '17/02/2026 10:00'),
    cli(5, 'CE', '001234567', 'SOFÍA MARTÍNEZ PAREDES', 'MINORISTA', '977 300 145', 'sofia.mp@gmail.com', 'Av. Javier Prado 450', '150131', 'CONTADO', '', '01/03/2026 10:00'),
    cli(6, 'RUC', '20512398745', 'MODA URBANA EXPORT SAC', 'EXPORTACIÓN', '01 445 9870', 'ventas@modaurbana.pe', 'Calle Las Begonias 441', '150131', 'CRED60', 'Precios en dólares', '13/03/2026 10:00'),
    cli(7, 'RUC', '20487654321', 'CONFECCIONES LA MODERNA EIRL', 'SERVICIOS', '944 781 002', '', 'Jr. Antonio Bazo 780', '150115', 'CRED15', '', '25/03/2026 10:00'),
    cli(8, 'DNI', '41236987', 'CARLOS ENRIQUE SALAZAR DÍAZ', 'MINORISTA', '923 551 208', '', '', '150101', 'CONTADO', 'Sin compras recientes', '06/04/2026 10:00', false)
  ];

  /* listas de precios y ofertas (12-prototipo-diseno.md §12): la lista tiene moneda y, opcionales, sede (maestro compartido) y segmento de cliente; con fechas es una oferta.
     Cada fila: artículo + unidad con precio fijo, o artículo / grupo con % de descuento. Precios con IGV */
  const LP = (n, nom, mon, sede, tipo, filas, desde, hasta) => ({ cod: 'LP-' + String(n).padStart(2, '0'), nom, mon, sede, tipo, desde: desde || '', hasta: hasta || '', activa: true, filas, aConfirmar: true });
  const P = (art, um, precio) => ({ art, um, precio }), D = (art, pct, um) => ({ art, um: um || '', pct }), G = (grupo, pct) => ({ grupo, pct });
  const listasPrecio = [
    LP(1, 'Precios generales S/', 'PEN', '', '', [P('PT-0001', 'UND', 119.90), P('PT-0002', 'UND', 119.90), P('PT-0003', 'UND', 124.90), P('PT-0004', 'UND', 124.90),
      P('SERV-VTA-0001', 'UND', 15.00), P('SERV-VTA-0002', 'UND', 10.00), P('SERV-VTA-0003', 'UND', 25.00)]),
    LP(2, 'Precios generales US$', 'USD', '', '', [P('PT-0001', 'UND', 32.00), P('PT-0002', 'UND', 32.00), P('PT-0003', 'UND', 33.50)]),
    LP(3, 'Mayorista', 'PEN', '', 'MAYORISTA', [P('PT-0001', 'UND', 89.00), P('PT-0001', 'DOC', 1020.00), P('PT-0002', 'UND', 89.00), P('PT-0002', 'DOC', 1020.00),
      P('PT-0003', 'UND', 92.00), P('PT-0003', 'DOC', 1060.00), P('PT-0004', 'UND', 92.00), P('PT-0004', 'DOC', 1060.00)]),
    LP(4, 'Exportación', 'USD', '', 'EXPORTACIÓN', [P('PT-0001', 'UND', 24.50), P('PT-0002', 'UND', 24.50)]),
    LP(5, 'Galería Damero', 'PEN', 'DAM', '', [P('PT-0001', 'UND', 115.00)]),
    LP(6, 'Mayorista Galería Ya', 'PEN', 'YA', 'MAYORISTA', [P('PT-0004', 'UND', 90.00)]),
    /* ofertas: vencida, vigente en setiembre y programada para diciembre */
    LP(7, 'Día del Padre', 'PEN', '', '', [G('PT', 10)], '10/06/2026', '21/06/2026'),
    LP(8, 'Primavera', 'PEN', '', 'MINORISTA', [D('PT-0003', 20)], '01/09/2026', '30/09/2026'),
    LP(9, 'Navidad', 'PEN', '', '', [G('PT', 15), P('PT-0001', 'UND', 99.90)], '01/12/2026', '24/12/2026')
  ];

  return {
    maestros: { comercial, articulos, categorias },
    colecciones: {
      clientes, listasPrecio,
      /* configuración comercial editable en CL-45 */
      comercial: {
        cfg: {
          igv: 18, tc: 3.76, diasValidez: 7, diasAnulacion: 7, almMalEstado: 'SB-LIQUID',
          catIngreso: ['Fondo de caja chica', 'Sobrante de caja', 'Otros ingresos'],
          catEgreso: ['Pasajes y movilidad', 'Útiles de oficina', 'Pago a personal eventual', 'Depósito al banco', 'Otros egresos']
        }
      },
      cots: [], ventas: [], devs: [], sesiones: [], cmovs: [], saldos: []
    }
  };
})();
