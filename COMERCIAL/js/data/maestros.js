/* COMERCIAL V9 — maestros de la demo.
   Artículos, almacenes, grupos y conversiones son los de PROTOTIPOS V9 (GI-02 / PRODUCCION): PT-0001..0003 tienen lista de
   materiales en Producción. Lo propio de Comercial (tiendas, cajas, medios de pago, comprobantes, perfiles) se marca aquí.
   Los artículos, clientes y listas de precios se copian al estado de la demo (se editan en CL-11, CL-13 y CL-14). */
const M = {
  EMPRESAS: ['IMPERIOTEX', 'CATINNA NOW'],

  /* Tienda = sede del punto de venta. Cada una vende desde su almacén (una caja abierta por tienda y moneda). */
  SEDES: [
    { cod: 'TDA-01', nom: 'Tienda Gamarra 1', dir: 'Galería "Ya" 1043, La Victoria', alm: 'SB-TDA-01', canal: 'TIENDA' },
    { cod: 'TDA-02', nom: 'Tienda Gamarra 2', dir: 'Galería "Damero" 939, La Victoria', alm: 'SB-TDA-02', canal: 'TIENDA' },
    { cod: 'MAY-01', nom: 'Local Principal Gamarra · Mayorista', dir: 'Av. Gamarra 228, La Victoria', alm: 'SB-ALM-PT', canal: 'MAYORISTA' }
  ],

  /* almacenes de GI (B1: código, nombre, descripción) que usa Comercial */
  ALMACENES: [
    { cod: 'SB-ALM-PT', nom: 'Almacén Central Mercadería Gamarra', desc: 'Producto terminado listo para distribuir' },
    { cod: 'SB-TDA-01', nom: 'Tienda Gamarra 1', desc: 'Punto de venta' },
    { cod: 'SB-TDA-02', nom: 'Tienda Gamarra 2', desc: 'Punto de venta' },
    { cod: 'SB-ALM-REM', nom: 'Almacén de Remate y Liquidación', desc: 'No conformes: devoluciones en mal estado' }
  ],

  UNIDADES: [{ cod: 'UND', nom: 'Unidad' }, { cod: 'DOC', nom: 'Docena' }, { cod: 'SERV', nom: 'Servicio' }],
  /* A1: factor global por par de UM (1 DOC = 12 UND) */
  CONVERSIONES: [{ de: 'DOC', a: 'UND', factor: 12 }],

  /* Artículos con la pestaña Venta de GI-02: precio sugerido (PEN, por UM de inventario), precio mínimo, afectación IGV
     y lo propio de Comercial: rango de descuento y control de stock al vender. */
  ARTICULOS: [
    { cod: 'PT-0001', nom: 'PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL', grupo: 'PRODUCTOS TERMINADOS', cat: 'PANTALÓN', u: 'UND', uVenta: ['UND', 'DOC'], inv: true, venta: true, precio: 119.90, precioMin: 79.00, verifMin: true, dctoMin: 0, dctoMax: 15, igv: 'Gravado', stockCtrl: 'Bloquear', attrs: { Color: 'AZUL', Talla: '28' }, activo: true },
    { cod: 'PT-0002', nom: 'PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL', grupo: 'PRODUCTOS TERMINADOS', cat: 'PANTALÓN', u: 'UND', uVenta: ['UND', 'DOC'], inv: true, venta: true, precio: 119.90, precioMin: 79.00, verifMin: true, dctoMin: 0, dctoMax: 15, igv: 'Gravado', stockCtrl: 'Bloquear', attrs: { Color: 'AZUL', Talla: '30' }, activo: true },
    { cod: 'PT-0003', nom: 'PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR NEGRO', grupo: 'PRODUCTOS TERMINADOS', cat: 'PANTALÓN', u: 'UND', uVenta: ['UND', 'DOC'], inv: true, venta: true, precio: 124.90, precioMin: 82.00, verifMin: true, dctoMin: 0, dctoMax: 15, igv: 'Gravado', stockCtrl: 'Bloquear', attrs: { Color: 'NEGRO', Talla: '28' }, activo: true },
    { cod: 'PT-0004', nom: 'PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR NEGRO', grupo: 'PRODUCTOS TERMINADOS', cat: 'PANTALÓN', u: 'UND', uVenta: ['UND', 'DOC'], inv: true, venta: true, precio: 124.90, precioMin: 82.00, verifMin: true, dctoMin: 0, dctoMax: 15, igv: 'Gravado', stockCtrl: 'Bloquear', attrs: { Color: 'NEGRO', Talla: '30' }, activo: true },
    { cod: 'PT-0020', nom: 'CASACA DENIM OVERSIZE TALLA M COLOR AZUL', grupo: 'PRODUCTOS TERMINADOS', cat: 'CASACA', u: 'UND', uVenta: ['UND'], inv: true, venta: true, precio: 159.90, precioMin: 110.00, verifMin: true, dctoMin: 0, dctoMax: 10, igv: 'Gravado', stockCtrl: 'Avisar', attrs: { Color: 'AZUL', Talla: 'M' }, activo: true },
    { cod: 'PT-0021', nom: 'CASACA DENIM OVERSIZE TALLA L COLOR AZUL', grupo: 'PRODUCTOS TERMINADOS', cat: 'CASACA', u: 'UND', uVenta: ['UND'], inv: true, venta: true, precio: 159.90, precioMin: 110.00, verifMin: false, dctoMin: 0, dctoMax: 10, igv: 'Gravado', stockCtrl: 'No verificar', attrs: { Color: 'AZUL', Talla: 'L' }, activo: true },
    { cod: 'MERC-0001', nom: 'CORREA DE CUERO NEGRA HEBILLA METALICA', grupo: 'MERCADERÍA', cat: 'ACCESORIOS', u: 'UND', uVenta: ['UND'], inv: true, venta: true, precio: 39.90, precioMin: 0, verifMin: false, dctoMin: 0, dctoMax: 20, igv: 'Gravado', stockCtrl: 'Avisar', attrs: { Color: 'NEGRO' }, activo: true },
    { cod: 'SERV-0001', nom: 'SERVICIO DE BORDADO DE NOMBRE', grupo: 'SERVICIOS', cat: 'PERSONALIZACIÓN', u: 'SERV', uVenta: ['SERV'], inv: false, venta: true, precio: 15.00, precioMin: 0, verifMin: false, dctoMin: 0, dctoMax: 20, igv: 'Gravado', stockCtrl: '', attrs: {}, activo: true },
    { cod: 'SERV-0002', nom: 'SERVICIO DE ARREGLO DE BASTA', grupo: 'SERVICIOS', cat: 'ARREGLOS', u: 'SERV', uVenta: ['SERV'], inv: false, venta: true, precio: 10.00, precioMin: 0, verifMin: false, dctoMin: 0, dctoMax: 50, igv: 'Gravado', stockCtrl: '', attrs: {}, activo: true },
    { cod: 'SERV-0003', nom: 'SERVICIO DE PERSONALIZACION CON PARCHE', grupo: 'SERVICIOS', cat: 'PERSONALIZACIÓN', u: 'SERV', uVenta: ['SERV'], inv: false, venta: true, precio: 25.00, precioMin: 18.00, verifMin: true, dctoMin: 0, dctoMax: 10, igv: 'Exonerado', stockCtrl: '', attrs: {}, activo: true }
  ],
  STOCK_CTRL: [
    { v: 'Bloquear', t: 'Bloquear si no hay disponible' },
    { v: 'Avisar', t: 'Avisar y permitir' },
    { v: 'No verificar', t: 'No verificar' }
  ],
  AFECTACION: ['Gravado', 'Exonerado', 'Inafecto'],

  /* Clientes: el socio de negocio NO se unifica con el proveedor (T6) */
  TIPOS_DOC: [{ cod: 'DNI', nom: 'DNI', largo: 8 }, { cod: 'RUC', nom: 'RUC', largo: 11 }, { cod: 'CE', nom: 'Carné de extranjería', largo: 0 }],
  TIPOS_CLIENTE: ['MINORISTA', 'MAYORISTA', 'EXPORTACIÓN', 'SERVICIOS'],
  UBIGEOS: [
    { cod: '150115', t: 'LIMA / Lima / La Victoria' }, { cod: '150132', t: 'LIMA / Lima / San Juan de Lurigancho' },
    { cod: '150101', t: 'LIMA / Lima / Lima' }, { cod: '150131', t: 'LIMA / Lima / San Isidro' },
    { cod: '140101', t: 'LAMBAYEQUE / Chiclayo / Chiclayo' }, { cod: '130101', t: 'LA LIBERTAD / Trujillo / Trujillo' },
    { cod: '040101', t: 'AREQUIPA / Arequipa / Arequipa' }
  ],
  CLIENTES: [
    { cod: 'CLI-000001', tipoDoc: 'DNI', doc: '45781236', nom: 'MARÍA FERNANDA QUISPE ROJAS', tipo: 'MINORISTA', tel: '987 654 321', email: 'mfquispe@gmail.com', dir: 'Jr. Huánuco 1580', ubigeo: '150115', cond: 'CONTADO', obs: '', activo: true },
    { cod: 'CLI-000002', tipoDoc: 'RUC', doc: '20601234567', nom: 'COMERCIAL ANDINA SAC', tipo: 'MAYORISTA', tel: '074 231 456', email: 'compras@comercialandina.pe', dir: 'Av. Balta 820', ubigeo: '140101', cond: 'CRED30', obs: 'Despachar por agencia Shalom', activo: true },
    { cod: 'CLI-000003', tipoDoc: 'RUC', doc: '10457812369', nom: 'JORGE LUIS HUAMÁN TORRES', tipo: 'MAYORISTA', tel: '955 112 330', email: '', dir: 'Galería Guizado, stand 214', ubigeo: '150115', cond: 'CONTADO', obs: 'Boutique en Trujillo', activo: true },
    { cod: 'CLI-000004', tipoDoc: 'DNI', doc: '70123456', nom: 'ANDREA VÁSQUEZ LEÓN', tipo: 'MINORISTA', tel: '912 400 781', email: 'andrea.vl@hotmail.com', dir: '', ubigeo: '150132', cond: 'CONTADO', obs: '', activo: true },
    { cod: 'CLI-000005', tipoDoc: 'CE', doc: '001234567', nom: 'SOFÍA MARTÍNEZ PAREDES', tipo: 'MINORISTA', tel: '977 300 145', email: 'sofia.mp@gmail.com', dir: 'Av. Javier Prado 450', ubigeo: '150131', cond: 'CONTADO', obs: '', activo: true },
    { cod: 'CLI-000006', tipoDoc: 'RUC', doc: '20512398745', nom: 'MODA URBANA EXPORT SAC', tipo: 'EXPORTACIÓN', tel: '01 445 9870', email: 'ventas@modaurbana.pe', dir: 'Calle Las Begonias 441', ubigeo: '150131', cond: 'CRED60', obs: 'Precios en dólares', activo: true },
    { cod: 'CLI-000007', tipoDoc: 'RUC', doc: '20487654321', nom: 'CONFECCIONES LA MODERNA EIRL', tipo: 'SERVICIOS', tel: '944 781 002', email: '', dir: 'Jr. Antonio Bazo 780', ubigeo: '150115', cond: 'CRED15', obs: '', activo: true },
    { cod: 'CLI-000008', tipoDoc: 'DNI', doc: '41236987', nom: 'CARLOS ENRIQUE SALAZAR DÍAZ', tipo: 'MINORISTA', tel: '923 551 208', email: '', dir: '', ubigeo: '150101', cond: 'CONTADO', obs: 'Sin compras recientes', activo: false }
  ],

  /* Listas de precios (wallets de la documentación): por artículo + UM + moneda, con tienda y tipo de cliente opcionales */
  LISTAS: [
    ['PT-0001', 'UND', '', '', 'PEN', 119.90], ['PT-0001', 'UND', '', 'MAYORISTA', 'PEN', 89.00], ['PT-0001', 'DOC', '', 'MAYORISTA', 'PEN', 1020.00],
    ['PT-0001', 'UND', 'TDA-02', '', 'PEN', 115.00], ['PT-0001', 'UND', '', '', 'USD', 32.00], ['PT-0001', 'UND', '', 'EXPORTACIÓN', 'USD', 24.50],
    ['PT-0002', 'UND', '', '', 'PEN', 119.90], ['PT-0002', 'UND', '', 'MAYORISTA', 'PEN', 89.00], ['PT-0002', 'DOC', '', 'MAYORISTA', 'PEN', 1020.00],
    ['PT-0002', 'UND', '', '', 'USD', 32.00], ['PT-0002', 'UND', '', 'EXPORTACIÓN', 'USD', 24.50],
    ['PT-0003', 'UND', '', '', 'PEN', 124.90], ['PT-0003', 'UND', '', 'MAYORISTA', 'PEN', 92.00], ['PT-0003', 'DOC', '', 'MAYORISTA', 'PEN', 1060.00], ['PT-0003', 'UND', '', '', 'USD', 33.50],
    ['PT-0004', 'UND', '', '', 'PEN', 124.90], ['PT-0004', 'UND', '', 'MAYORISTA', 'PEN', 92.00],
    ['PT-0020', 'UND', '', '', 'PEN', 159.90], ['PT-0020', 'UND', '', 'MAYORISTA', 'PEN', 118.00], ['PT-0020', 'UND', 'TDA-01', 'MAYORISTA', 'PEN', 115.00],
    ['PT-0021', 'UND', '', '', 'PEN', 159.90], ['PT-0021', 'UND', '', 'MAYORISTA', 'PEN', 118.00],
    ['MERC-0001', 'UND', '', '', 'PEN', 39.90],
    ['SERV-0001', 'SERV', '', '', 'PEN', 15.00], ['SERV-0002', 'SERV', '', '', 'PEN', 10.00]
  ],

  MONEDAS: [{ cod: 'PEN', nom: 'Soles', sim: 'S/' }, { cod: 'USD', nom: 'Dólares', sim: 'US$' }],
  /* condiciones de pago de CO-02 (proveedores) aplicadas al cliente */
  CONDICIONES: [{ cod: 'CONTADO', nom: 'Contado', dias: 0 }, { cod: 'CRED15', nom: 'Crédito 15 días', dias: 15 }, { cod: 'CRED30', nom: 'Crédito 30 días', dias: 30 }, { cod: 'CRED60', nom: 'Crédito 60 días', dias: 60 }],
  METODOS: [
    { cod: 'EFE', nom: 'Efectivo', efectivo: true, bancos: [], monedas: ['PEN', 'USD'] },
    { cod: 'YAPE', nom: 'Yape / Plin', efectivo: false, bancos: [], monedas: ['PEN'] },
    { cod: 'TRF', nom: 'Transferencia bancaria', efectivo: false, bancos: ['BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK'], monedas: ['PEN', 'USD'] },
    { cod: 'POS', nom: 'Tarjeta (POS)', efectivo: false, bancos: ['NIUBIZ', 'IZIPAY'], monedas: ['PEN', 'USD'] },
    { cod: 'DEP', nom: 'Depósito en cuenta', efectivo: false, bancos: ['BCP', 'BBVA'], monedas: ['PEN', 'USD'] }
  ],
  /* comprobante de la venta: serie única por tienda y tipo (el envío a SUNAT queda fuera de este prototipo) */
  COMPROBANTES: [{ cod: 'NV', nom: 'Nota de venta', ruc: false }, { cod: 'BV', nom: 'Boleta de venta', ruc: false }, { cod: 'FA', nom: 'Factura', ruc: true }],
  SERIES: { 'TDA-01': { NV: 'NV01', BV: 'B001', FA: 'F001' }, 'TDA-02': { NV: 'NV02', BV: 'B002', FA: 'F002' }, 'MAY-01': { NV: 'NV03', BV: 'B003', FA: 'F003' } },
  DOC_REFERENCIAL: ['Orden de compra del cliente', 'Guía de remisión del cliente', 'Factura del cliente'],
  SUSTENTO_DEV: ['Nota de crédito', 'Nota de devolución interna'],
  TIPOS_DEV: ['Normal', 'Mal estado', 'Cambio'],

  LUGARES_ENTREGA: [
    { cod: 'RECOJO', nom: 'Recojo en tienda', propio: true },
    { cod: 'DELIVERY', nom: 'Delivery en Lima', propio: false, ubigeo: true },
    { cod: 'AGENCIA', nom: 'Envío por agencia (provincia)', propio: false, ubigeo: true, agencia: true }
  ],
  AGENCIAS: ['SHALOM', 'OLVA COURIER', 'MARVISUR'],

  /* una caja por tienda y moneda */
  CAJAS: [
    { cod: 'CJ-TDA01-PEN', nom: 'Caja Tienda Gamarra 1 · Soles', sede: 'TDA-01', mon: 'PEN' },
    { cod: 'CJ-TDA01-USD', nom: 'Caja Tienda Gamarra 1 · Dólares', sede: 'TDA-01', mon: 'USD' },
    { cod: 'CJ-TDA02-PEN', nom: 'Caja Tienda Gamarra 2 · Soles', sede: 'TDA-02', mon: 'PEN' },
    { cod: 'CJ-MAY01-PEN', nom: 'Caja Local Mayorista · Soles', sede: 'MAY-01', mon: 'PEN' },
    { cod: 'CJ-MAY01-USD', nom: 'Caja Local Mayorista · Dólares', sede: 'MAY-01', mon: 'USD' }
  ],
  CAT_INGRESO: ['Fondo de caja chica', 'Sobrante de caja', 'Otros ingresos'],
  CAT_EGRESO: ['Pasajes y movilidad', 'Útiles de oficina', 'Pago a personal eventual', 'Depósito al banco', 'Otros egresos'],
  MOTIVOS_ANULACION: ['Error de registro', 'Cliente desistió de la compra', 'Precio o cantidad equivocados', 'Otro'],

  /* Usuarios de la demo: cada uno tiene UNA tienda asignada (la caja es de la tienda, no del cajero) */
  USUARIOS: [
    { cod: 'USER12', nom: 'Lucía Paredes', perfil: 'Supervisor comercial', sede: 'TDA-01' },
    { cod: 'USER10', nom: 'Karina Salas', perfil: 'Vendedor', sede: 'TDA-01' },
    { cod: 'USER11', nom: 'Pedro Ríos', perfil: 'Cajero', sede: 'TDA-01' },
    { cod: 'USER13', nom: 'Diego Campos', perfil: 'Vendedor', sede: 'MAY-01' },
    { cod: 'USER14', nom: 'Rosa Medina', perfil: 'Cajero', sede: 'MAY-01' },
    { cod: 'USER15', nom: 'Iván Torres', perfil: 'Vendedor', sede: 'TDA-02' }
  ],
  /* permisos finos por acción (ver_*, crear_*, editar_*, eliminar_*) de la documentación */
  PERFILES: {
    'Vendedor': ['ver_cotizacion', 'crear_cotizacion', 'editar_cotizacion', 'ver_venta', 'crear_venta', 'ver_devolucion_venta', 'crear_devolucion_venta', 'ver_cliente', 'crear_cliente', 'editar_cliente', 'ver_existencias', 'ver_caja',
      'ver_solicitud_fabricacion', 'crear_solicitud_materiales'],
    'Cajero': ['ver_cotizacion', 'ver_venta', 'ver_devolucion_venta', 'ver_caja', 'crear_caja', 'editar_caja', 'valid_payments', 'ver_cliente', 'ver_existencias'],
    'Supervisor comercial': ['ver_cotizacion', 'crear_cotizacion', 'editar_cotizacion', 'eliminar_cotizacion', 'ver_venta', 'crear_venta', 'anular_venta', 'asignar_vendedor',
      'ver_devolucion_venta', 'crear_devolucion_venta', 'editar_devolucion_venta', 'ver_caja', 'crear_caja', 'editar_caja', 'valid_payments',
      'ver_cliente', 'crear_cliente', 'editar_cliente', 'ver_existencias', 'editar_precios', 'configurar_comercial',
      'ver_solicitud_fabricacion', 'crear_solicitud_materiales']
  }
};

M.metodo = cod => M.METODOS.find(m => m.cod === cod);
M.cond = cod => M.CONDICIONES.find(c => c.cod === cod);
M.comp = cod => M.COMPROBANTES.find(c => c.cod === cod);
M.lugar = cod => M.LUGARES_ENTREGA.find(l => l.cod === cod);
M.caja = cod => M.CAJAS.find(c => c.cod === cod);
M.alm = cod => M.ALMACENES.find(a => a.cod === cod);
M.almNom = cod => { const a = M.alm(cod); return a ? a.nom : cod; };
M.ubigeo = cod => { const u = M.UBIGEOS.find(x => x.cod === cod); return u ? u.t : ''; };
M.sim = mon => mon === 'USD' ? 'US$' : 'S/';
M.nomArt = cod => { const a = typeof Store !== 'undefined' && Store.d ? Store.art(cod) : M.ARTICULOS.find(x => x.cod === cod); return a ? a.nom : cod; };
