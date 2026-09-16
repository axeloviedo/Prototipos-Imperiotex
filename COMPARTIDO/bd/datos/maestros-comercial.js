/* COMPARTIDO · datos propios de Comercial: tiendas, cajas, medios de pago, comprobantes y series, condiciones, tipos de cliente,
   ubigeos, usuarios y perfiles de la demo, clientes, listas de precios y configuración comercial.
   Formato en docs/16_BASE_DATOS_COMPARTIDA.md §3. Lo mantiene quien trabaja COMERCIAL/.
   - maestros.comercial: catálogos fijos de Comercial (no chocan con las claves comunes: las tiendas no son las «sedes» de la plantilla).
   - maestros.articulos / categorias: servicios que vende Comercial (se AGREGAN a los de la base; prefijo SERV-VTA- para no chocar con SRV-).
     Los productos de venta son los de la base con venta: true (Zuleika PT-0001..0004, pestaña Venta en maestros-complementos.js).
   - colecciones: lo editable desde Comercial (clientes, listas, configuración) con su valor inicial, y lo transaccional vacío.
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
      { cod: 'DEP', nom: 'Depósito en cuenta', efectivo: false, bancos: ['BCP', 'BBVA'], monedas: ['PEN', 'USD'] }
    ],
    /* comprobante de la venta: serie única por tienda y tipo (el envío a SUNAT queda fuera de este prototipo) */
    comprobantes: [{ cod: 'NV', nom: 'Nota de venta', ruc: false }, { cod: 'BV', nom: 'Boleta de venta', ruc: false }, { cod: 'FA', nom: 'Factura', ruc: true }],
    series: { 'TDA-01': { NV: 'NV01', BV: 'B001', FA: 'F001' }, 'TDA-02': { NV: 'NV02', BV: 'B002', FA: 'F002' }, 'MAY-01': { NV: 'NV03', BV: 'B003', FA: 'F003' } },
    docReferencial: ['Orden de compra del cliente', 'Guía de remisión del cliente', 'Factura del cliente'],
    sustentoDev: ['Nota de crédito', 'Nota de devolución interna'],
    tiposDev: ['Normal', 'Mal estado', 'Cambio'],
    lugaresEntrega: [
      { cod: 'RECOJO', nom: 'Recojo en tienda', propio: true },
      { cod: 'DELIVERY', nom: 'Delivery en Lima', propio: false, ubigeo: true },
      { cod: 'AGENCIA', nom: 'Envío por agencia (provincia)', propio: false, ubigeo: true, agencia: true }
    ],
    agencias: ['SHALOM', 'OLVA COURIER', 'MARVISUR'],
    motivosAnulacion: ['Error de registro', 'Cliente desistió de la compra', 'Precio o cantidad equivocados', 'Otro'],
    stockCtrl: [
      { v: 'Bloquear', t: 'Bloquear si no hay disponible' },
      { v: 'Avisar', t: 'Avisar y permitir' },
      { v: 'No verificar', t: 'No verificar' }
    ],
    afectacion: ['Gravado', 'Exonerado', 'Inafecto'],
    /* clientes: el socio de negocio NO se unifica con el proveedor */
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
        'ver_solicitud_fabricacion', 'crear_solicitud_materiales'],
      'Cajero': ['ver_cotizacion', 'ver_venta', 'ver_devolucion_venta', 'ver_caja', 'crear_caja', 'editar_caja', 'valid_payments', 'ver_cliente', 'ver_existencias'],
      'Supervisor comercial': ['ver_cotizacion', 'crear_cotizacion', 'editar_cotizacion', 'eliminar_cotizacion', 'ver_venta', 'crear_venta', 'anular_venta', 'asignar_vendedor',
        'ver_devolucion_venta', 'crear_devolucion_venta', 'editar_devolucion_venta', 'ver_caja', 'crear_caja', 'editar_caja', 'valid_payments',
        'ver_cliente', 'crear_cliente', 'editar_cliente', 'ver_existencias', 'editar_precios', 'configurar_comercial',
        'ver_solicitud_fabricacion', 'crear_solicitud_materiales']
    },
    /* primer número de las series de Comercial en BD.d.seq cuando todavía no existen (los clientes y listas iniciales ya ocupan números) */
    seqInicial: { cli: 9, lp: 23 }
  };

  /* servicios que vende la tienda (no inventariables: sin almacén, stock ni devolución) */
  const srv = (cod, nom, cat, precio, min, dctoMax, igv) => ({ cod, nom, desc: nom, grupo: 'SRV', cat, subcat: '', u: 'UND', ctrl: 'Nada', cv: 'CV-09',
    inv: false, compra: false, venta: true, produccion: false, igv, estado: 'Activo', costo: 0,
    precioVenta: precio, precioMin: min, uVenta: ['UND'], dctoMin: 0, dctoMax, stockCtrl: '', origen: O, aConfirmar: true });
  const articulos = [
    srv('SERV-VTA-0001', 'SERVICIO DE BORDADO DE NOMBRE', 'PERSONALIZACION', 15.00, 0, 20, 'Gravado'),
    srv('SERV-VTA-0002', 'SERVICIO DE ARREGLO DE BASTA', 'ARREGLOS', 10.00, 0, 50, 'Gravado'),
    srv('SERV-VTA-0003', 'SERVICIO DE PERSONALIZACION CON PARCHE', 'PERSONALIZACION', 25.00, 18.00, 10, 'Exonerado')
  ];
  const categorias = [
    { cod: 'SVPER', nom: 'PERSONALIZACION', cv: 'CV-09', grupo: 'SRV', origen: O },
    { cod: 'SVARR', nom: 'ARREGLOS', cv: 'CV-09', grupo: 'SRV', origen: O }
  ];

  const cli = (n, tipoDoc, doc, nom, tipo, tel, email, dir, ubigeo, cond, obs, alta, activo) =>
    ({ cod: 'CLI-' + String(n).padStart(6, '0'), tipoDoc, doc, nom, tipo, tel, email, dir, ubigeo, cond, obs, activo: activo !== false, alta, aConfirmar: true });
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

  /* listas de precios: por artículo + UM + moneda, con tienda y tipo de cliente opcionales (precios con IGV) */
  const listas = [
    ['PT-0001', 'UND', '', '', 'PEN', 119.90], ['PT-0001', 'UND', '', 'MAYORISTA', 'PEN', 89.00], ['PT-0001', 'DOC', '', 'MAYORISTA', 'PEN', 1020.00],
    ['PT-0001', 'UND', 'TDA-02', '', 'PEN', 115.00], ['PT-0001', 'UND', '', '', 'USD', 32.00], ['PT-0001', 'UND', '', 'EXPORTACIÓN', 'USD', 24.50],
    ['PT-0002', 'UND', '', '', 'PEN', 119.90], ['PT-0002', 'UND', '', 'MAYORISTA', 'PEN', 89.00], ['PT-0002', 'DOC', '', 'MAYORISTA', 'PEN', 1020.00],
    ['PT-0002', 'UND', '', '', 'USD', 32.00], ['PT-0002', 'UND', '', 'EXPORTACIÓN', 'USD', 24.50],
    ['PT-0003', 'UND', '', '', 'PEN', 124.90], ['PT-0003', 'UND', '', 'MAYORISTA', 'PEN', 92.00], ['PT-0003', 'DOC', '', 'MAYORISTA', 'PEN', 1060.00], ['PT-0003', 'UND', '', '', 'USD', 33.50],
    ['PT-0004', 'UND', '', '', 'PEN', 124.90], ['PT-0004', 'UND', '', 'MAYORISTA', 'PEN', 92.00], ['PT-0004', 'UND', 'TDA-01', 'MAYORISTA', 'PEN', 90.00],
    ['PT-0004', 'DOC', '', 'MAYORISTA', 'PEN', 1060.00],
    ['SERV-VTA-0001', 'UND', '', '', 'PEN', 15.00], ['SERV-VTA-0002', 'UND', '', '', 'PEN', 10.00], ['SERV-VTA-0003', 'UND', '', '', 'PEN', 25.00]
  ].map((x, i) => ({ id: 'LP-' + String(i + 1).padStart(4, '0'), art: x[0], um: x[1], sede: x[2], tipo: x[3], mon: x[4], precio: x[5], aConfirmar: true }));

  return {
    maestros: { comercial, articulos, categorias },
    colecciones: {
      clientes, listas,
      /* configuración comercial editable en CL-45 */
      comercial: {
        cfg: {
          igv: 18, tc: 3.76, diasValidez: 7, diasAnulacion: 3, verificarPrecioMin: true, almMalEstado: 'SB-LIQUID',
          catIngreso: ['Fondo de caja chica', 'Sobrante de caja', 'Otros ingresos'],
          catEgreso: ['Pasajes y movilidad', 'Útiles de oficina', 'Pago a personal eventual', 'Depósito al banco', 'Otros egresos']
        }
      },
      cots: [], ventas: [], devs: [], sesiones: [], cmovs: []
    }
  };
})();
