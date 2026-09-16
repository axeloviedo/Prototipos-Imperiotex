/* COMPARTIDO · datos propios de Logística (Inventarios y Compras) que no están en las plantillas ni en los complementos:
   configuración general, finanzas por grupo de artículo, series de notas internas, mínimos de stock, datos de la GRE.
   Formato en docs/16_BASE_DATOS_COMPARTIDA.md §3. Lo mantiene quien trabaja INVENTARIOS/ y COMPRAS/.
   Todo lo de aquí es propuesta del prototipo (aConfirmar) salvo que se indique otra cosa. No toca el DOM. */
const BD_LOGISTICA = (() => {
  /* GI-CFG · Configuración General de la empresa */
  const configLogistica = {
    precioMinGlobal: true, nombreEtiqueta: 'N° Referencia', imprimirRef: true, lotesModo: 'manual',
    camposUsuario: [{ lbl: 'Línea comercial', apl: 'Artículos', filtro: true }, { lbl: 'Campaña', apl: 'Artículos', filtro: true }]
  };
  /* Pestaña Finanzas del Grupo de Artículo: 28 conceptos contables (referencia SAP B1) */
  const conceptosFinanzas = [
    ['01', 'Cuenta de existencias'], ['02', 'Existencias por recibir / en tránsito'], ['03', 'Cuenta de compra'], ['04', 'Variación de existencias'],
    ['05', 'Costo vinculado - flete'], ['06', 'Costo vinculado - seguro'], ['07', 'Costo vinculado - derechos aduaneros'], ['08', 'Costo vinculado - agente de aduanas / comisiones'],
    ['09', 'Costo vinculado - otros'], ['10', 'Mercadería recibida por facturar'], ['11', 'Devolución / cambio a proveedor'], ['12', 'Nota de crédito de proveedor'],
    ['13', 'Consumo de materia prima a la orden'], ['14', 'Envío a servicio de terceros (tránsito)'], ['15', 'Retorno de servicio de terceros'], ['16', 'Ingreso de producto en proceso'],
    ['17', 'Ingreso de producto terminado'], ['18', 'Ingreso por cancelación de servicio'], ['19', 'Registro de merma'], ['20', 'Ingreso por venta'],
    ['21', 'Costo de ventas'], ['22', 'Descuentos concedidos'], ['23', 'Devolución de cliente / cambio de prenda'], ['24', 'Venta o entrega a personal'],
    ['25', 'Regularización por sobrante de inventario'], ['26', 'Regularización por faltante de inventario'], ['27', 'Carga inicial de stock'], ['28', 'Transferencia entre almacenes']
  ].map(x => ({ c: x[0], n: x[1] }));
  /* cuentas por grupo de artículo (código de grupo → {concepto: cuenta}) */
  const finanzasGrupo = {
    MP: { '01': '2411 · Materias primas', '03': '6021 · Compra de materias primas', '13': '6121 · Variación de materias primas' },
    SRV: { '03': '6321 · Servicios de terceros', '14': '2151 · Productos en proceso en poder de terceros' },
    PPT: { '01': '2311 · Productos en proceso', '16': '7121 · Variación de productos en proceso' },
    PT: { '01': '2111 · Productos terminados', '17': '7111 · Variación de productos terminados', '21': '6921 · Costo de ventas' },
    MERC: { '01': '2011 · Mercaderías', '21': '6911 · Costo de ventas de mercaderías' }
  };
  /* GI-19 · series de notas internas de movimiento (sin valor tributario) */
  const seriesInternas = {
    NI: { nom: 'Nota de Ingreso Interna', prox: 1, desde: 'Ingreso confirmado (GI-08)' },
    NS: { nom: 'Nota de Salida Interna', prox: 1, desde: 'Salida confirmada (GI-08)' },
    NT: { nom: 'Nota de Transferencia entre Almacenes', prox: 1, desde: 'Transferencia completada (GI-08)' }
  };
  /* series de GRE por almacén de despacho (referencial: la base numera con T001-) */
  const seriesGRE = [
    { serie: 'T001', alm: 'SB-CENTRAL' }, { serie: 'T002', alm: 'SB-CENTRAL-MP' }, { serie: 'T003', alm: 'SB-ZARATE-MP' },
    { serie: 'T004', alm: 'SB-ZARATE-PP' }, { serie: 'T005', alm: 'SB-TIENDA01' }
  ];
  /* GI-02 · Planificación de stock: mínimo por artículo y almacén (alertas del semáforo) */
  const minimos = [
    { art: 'PT-0001', alm: 'SB-CENTRAL', cant: 15 }, { art: 'PT-0002', alm: 'SB-CENTRAL', cant: 10 },
    { art: 'PT-0003', alm: 'SB-CENTRAL', cant: 15 }, { art: 'PT-0004', alm: 'SB-CENTRAL', cant: 10 },
    { art: 'MP-0070', alm: 'SB-ZARATE-MP', cant: 50 }, { art: 'MP-0071', alm: 'SB-ZARATE-MP', cant: 50 },
    { art: 'MP-0102', alm: 'SB-ZARATE-MP', cant: 100 }, { art: 'MP-0103', alm: 'SB-ZARATE-MP', cant: 600 }
  ];
  /* GI-09 / GI-10 · tipos de movimiento manual (el detalle queda como «Ingreso - …» / «Salida - …») */
  const tiposIngreso = ['Compra', 'Devoluciones de Clientes', 'Carga inicial de stock', 'Regularización de inventario (sobrante)', 'Reacondicionamiento de productos', 'Donaciones o intercambios', 'Producto fallado', 'Otros'];
  const tiposSalida = ['Retiros internos', 'Venta al por mayor', 'Venta al por menor', 'Devoluciones a proveedores', 'Muestras gratuitas', 'Donaciones', 'Desperdicio o eliminación', 'Regularización de inventario (faltante)', 'Producto fallado', 'Otros'];
  /* GI-15 · datos de la guía */
  const transportistas = ['TRANSPORTES GAMARRA EXPRESS SAC · RUC 20456789123', 'LOGISTICA ANDINA SAC · RUC 20321654987'];
  const ubigeos = ['LIMA / Lima / 150115 - La Victoria', 'LIMA / Lima / 150132 - San Juan de Lurigancho', 'LIMA / Lima / 150101 - Lima', 'LAMBAYEQUE / Chiclayo / 140101 - Chiclayo'];

  return {
    maestros: { configLogistica, conceptosFinanzas, finanzasGrupo, seriesInternas, seriesGRE, minimos, tiposIngreso, tiposSalida, transportistas, ubigeos },
    /* notas internas impresas: id de movimiento → número de nota (NI-000001) */
    colecciones: { notasInternas: {} }
  };
})();
