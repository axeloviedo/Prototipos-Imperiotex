/* PRODUCCION · Producción — maestros tomados de PROTOTIPOS V7 (GI / CO / GP).
   Se agregan solo los datos que V7 no tenía y la producción necesita (se marcan "nuevo"):
   piezas cortadas por talla, Almacén Fabricación, el recurso de lavado (servicio de terceros) y las listas de materiales de la demo.
   Los datos son de IMPERIOTEX (confección), pero el módulo no supone ningún rubro: tallas y colores son atributos del artículo. */
const M = {
  EMPRESAS: ['IMPERIOTEX', 'CATINNA NOW'],

  ALMACENES: [
    { cod: 'SB-ALM-MPT', nom: 'Almacén MP Telas', sede: 'Gamarra', transito: false, desc: 'Rollos de tela' },
    { cod: 'SB-ALM-MPA', nom: 'Almacén MP Avíos', sede: 'Gamarra', transito: false, desc: 'Hilos, cierres, botones, etiquetas y empaques' },
    { cod: 'SB-ALM-PPT', nom: 'Almacén Producto en Proceso', sede: 'Zárate', transito: false, desc: 'Piezas cortadas, crudos y lavados' },
    { cod: 'SB-ALM-FAB', nom: 'Almacén Fabricación', sede: 'Zárate', transito: false, desc: 'Material en planta listo para consumir (nuevo)' },
    { cod: 'SB-ALM-PT', nom: 'Almacén Central Mercadería Gamarra', sede: 'Gamarra', transito: false, desc: 'Producto terminado listo para distribuir' },
    { cod: 'SB-ALM-TRN', nom: 'Almacén Transición', sede: 'Virtual', transito: true, desc: 'Producto en poder de terceros (lavandería, maquila)' },
    { cod: 'SB-ALM-REM', nom: 'Almacén de Remate y Liquidación', sede: 'Gamarra', transito: false, desc: 'Remate, liquidación y muestras' },
    { cod: 'SB-TDA-01', nom: 'Tienda Gamarra 1', sede: 'Galería "Ya"', transito: false, desc: 'Punto de venta' }
  ],

  /* grupo = Grupo de Artículo V7; cat = categoría (define los parámetros de control, PR-13) */
  ARTICULOS: [
    { cod: 'PT-0001', nom: 'PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL', u: 'UND', grupo: 'PRODUCTOS TERMINADOS', cat: 'PANTALÓN', attrs: { Color: 'AZUL', Talla: '28' }, inv: true, costo: 0 },
    { cod: 'PT-0002', nom: 'PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL', u: 'UND', grupo: 'PRODUCTOS TERMINADOS', cat: 'PANTALÓN', attrs: { Color: 'AZUL', Talla: '30' }, inv: true, costo: 0 },
    { cod: 'PT-0003', nom: 'PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR NEGRO', u: 'UND', grupo: 'PRODUCTOS TERMINADOS', cat: 'PANTALÓN', attrs: { Color: 'NEGRO', Talla: '28' }, inv: true, costo: 0 },
    { cod: 'PPT-0021', nom: 'PANTALON WIDE LEG ZULEIKA LAVADO COLOR AZUL TALLA 28', u: 'UND', grupo: 'PRODUCTOS EN PROCESO', alm: 'SB-ALM-PPT', cat: 'PANTALÓN', attrs: { Color: 'AZUL', Talla: '28', Acabado: 'LAVADO' }, inv: true, costo: 0 },
    { cod: 'PPT-0023', nom: 'PANTALON WIDE LEG ZULEIKA LAVADO COLOR NEGRO TALLA 28', u: 'UND', grupo: 'PRODUCTOS EN PROCESO', alm: 'SB-ALM-PPT', cat: 'PANTALÓN', attrs: { Color: 'NEGRO', Talla: '28', Acabado: 'LAVADO' }, inv: true, costo: 0 },
    { cod: 'PPT-0024', nom: 'PANTALON WIDE LEG ZULEIKA LAVADO COLOR AZUL TALLA 30', u: 'UND', grupo: 'PRODUCTOS EN PROCESO', alm: 'SB-ALM-PPT', cat: 'PANTALÓN', attrs: { Color: 'AZUL', Talla: '30', Acabado: 'LAVADO' }, inv: true, costo: 0 },
    { cod: 'PPT-0022', nom: 'PANTALON WIDE LEG ZULEIKA CRUDO TALLA 28', u: 'UND', grupo: 'PRODUCTOS EN PROCESO', alm: 'SB-ALM-PPT', cat: 'PANTALÓN', attrs: { Talla: '28', Acabado: 'CRUDO' }, inv: true, costo: 0 },
    { cod: 'PPT-0025', nom: 'PANTALON WIDE LEG ZULEIKA CRUDO TALLA 30', u: 'UND', grupo: 'PRODUCTOS EN PROCESO', alm: 'SB-ALM-PPT', cat: 'PANTALÓN', attrs: { Talla: '30', Acabado: 'CRUDO' }, inv: true, costo: 0 },
    { cod: 'PPT-0026', nom: 'PANTALON WIDE LEG ZULEIKA PIEZAS CORTADAS TALLA 28', u: 'UND', grupo: 'PRODUCTOS EN PROCESO', alm: 'SB-ALM-PPT', cat: 'PANTALÓN', attrs: { Talla: '28' }, inv: true, costo: 0 },
    { cod: 'PPT-0027', nom: 'PANTALON WIDE LEG ZULEIKA PIEZAS CORTADAS TALLA 30', u: 'UND', grupo: 'PRODUCTOS EN PROCESO', alm: 'SB-ALM-PPT', cat: 'PANTALÓN', attrs: { Talla: '30' }, inv: true, costo: 0 },
    { cod: 'PPT-0022F', nom: 'PANTALON WIDE LEG ZULEIKA CRUDO TALLA 28 FALLADO', u: 'UND', grupo: 'PRODUCTOS EN PROCESO', alm: 'SB-ALM-PPT', cat: 'PANTALÓN', attrs: { Talla: '28', Acabado: 'CRUDO', Estado: 'FALLADO' }, inv: true, costo: 0 },
    { cod: 'PPT-0024F', nom: 'PANTALON WIDE LEG ZULEIKA LAVADO COLOR AZUL TALLA 30 FALLADO', u: 'UND', grupo: 'PRODUCTOS EN PROCESO', alm: 'SB-ALM-PPT', cat: 'PANTALÓN', attrs: { Color: 'AZUL', Talla: '30', Acabado: 'LAVADO', Estado: 'FALLADO' }, inv: true, costo: 0 },
    { cod: 'PT-0010', nom: 'PANTALON WIDE LEG THAIR MUESTRA', u: 'UND', grupo: 'PRODUCTOS TERMINADOS', cat: 'PANTALÓN', attrs: { Talla: '28', Color: 'AZUL' }, inv: true, costo: 0 },
    { cod: 'MP-0012', nom: 'TELA DENIM 12 OZ AZUL', u: 'MT', grupo: 'MATERIA PRIMA', cat: 'TELAS', attrs: {}, inv: true, costo: 19.10 },
    { cod: 'MP-0031', nom: 'HILO POLIESTER AZUL', u: 'MT', grupo: 'MATERIA PRIMA', cat: 'HILOS', attrs: {}, inv: true, costo: 0.0017 },
    { cod: 'MP-0046', nom: 'CIERRE YKK RC-045 12CM', u: 'UND', grupo: 'MATERIA PRIMA', cat: 'AVÍOS DE CONFECCIÓN', attrs: {}, inv: true, costo: 0.85 },
    { cod: 'MP-0071', nom: 'TALLITA TALLA 28', u: 'UND', grupo: 'MATERIA PRIMA', cat: 'AVÍOS DE CONFECCIÓN', attrs: {}, inv: true, costo: 0.05 },
    { cod: 'MP-0072', nom: 'TALLITA TALLA 30', u: 'UND', grupo: 'MATERIA PRIMA', cat: 'AVÍOS DE CONFECCIÓN', attrs: {}, inv: true, costo: 0.05 },
    { cod: 'MP-0044', nom: 'BOTON METALICO 17MM', u: 'UND', grupo: 'MATERIA PRIMA', cat: 'AVÍOS DE ACABADOS - PRINCIPALES', attrs: {}, inv: true, costo: 0.35 },
    { cod: 'MP-0055', nom: 'CUERO SINTETICO PARCHE', u: 'UND', grupo: 'MATERIA PRIMA', cat: 'AVÍOS DE ACABADOS - PRINCIPALES', attrs: {}, inv: true, costo: 0.60 },
    { cod: 'MP-0061', nom: 'HANG TAG SARA DENIM', u: 'UND', grupo: 'MATERIA PRIMA', cat: 'AVÍOS DE ACABADOS - PRINCIPALES', attrs: {}, inv: true, costo: 0.25 },
    { cod: 'MP-0063', nom: 'ETIQUETA PANTALON SARA', u: 'UND', grupo: 'MATERIA PRIMA', cat: 'AVÍOS DE ACABADOS - PRINCIPALES', attrs: {}, inv: true, costo: 0.18 },
    { cod: 'MP-0064', nom: 'BOLSA BRILLO 30X40', u: 'UND', grupo: 'MATERIA PRIMA', cat: 'AVÍOS DE ACABADOS - PRINCIPALES', attrs: {}, inv: true, costo: 0.12 }
  ],

  /* Tipos de recurso iniciales (PR-12). "clase" marca el comportamiento que depende del tipo y bloquea renombrarlo o eliminarlo:
     humano = método Manual, operarios y reproceso · servicio = servicio de terceros que se compra y se contrasta con la OC o factura */
  TIPOS_RECURSO: [
    { cod: 'TRC-0001', nom: 'RECURSO HUMANO', clase: 'humano' },
    { cod: 'TRC-0002', nom: 'ACTIVOS FIJOS Y EXTRAS' },
    { cod: 'TRC-0003', nom: 'SERVICIO DE TERCEROS', clase: 'servicio' }
  ],
  UNIDADES_RECURSO: ['HORA', 'UND', 'DÍA', 'METRO', 'KG'],
  CUENTAS_COSTO: [
    { cod: '921101', nom: 'Mano de obra directa' },
    { cod: '921201', nom: 'Servicios de terceros (maquila)' },
    { cod: '921301', nom: 'Depreciación de maquinaria y equipo' },
    { cod: '921401', nom: 'Energía eléctrica de planta' },
    { cod: '921901', nom: 'Otros costos indirectos de fabricación' }
  ],

  /* Recursos iniciales (se guardan y editan en PR-11): GP-07 (V7) + REC-0008..0012 para la demo (REC-0011/0012: servicios de terceros con costo estándar).
     prov = proveedor habitual del servicio (lo usa Tercerizar) */
  RECURSOS: [
    { cod: 'REC-0001', nom: 'Operario de corte · turno mañana', tipo: 'RECURSO HUMANO', resp: '', activo: true, u: 'HORA', costo: 15.00, cuenta: '921101' },
    { cod: 'REC-0002', nom: 'Costurera · línea 1', tipo: 'RECURSO HUMANO', resp: 'María Quispe (jefa de línea)', activo: true, u: 'HORA', costo: 12.80, cuenta: '921101' },
    { cod: 'REC-0003', nom: 'Máquina de corte', tipo: 'ACTIVOS FIJOS Y EXTRAS', resp: 'Luis Torres', activo: true, u: 'HORA', costo: 22.50, cuenta: '921301' },
    { cod: 'REC-0004', nom: 'Mesa de corte manual', tipo: 'ACTIVOS FIJOS Y EXTRAS', resp: '', activo: true, u: 'HORA', costo: 1.20, cuenta: '921301' },
    { cod: 'REC-0005', nom: 'Energía eléctrica de planta', tipo: 'ACTIVOS FIJOS Y EXTRAS', resp: '', activo: true, u: 'HORA', costo: 1.90, cuenta: '921401' },
    { cod: 'REC-0008', nom: 'Operario de acabado', tipo: 'RECURSO HUMANO', resp: '', activo: true, u: 'HORA', costo: 11.50, cuenta: '921101' },
    { cod: 'REC-0009', nom: 'Patronista / tizado', tipo: 'RECURSO HUMANO', resp: 'Josselyne Ramos', activo: true, u: 'HORA', costo: 18.00, cuenta: '921101' },
    { cod: 'REC-0010', nom: 'Máquina recta y remalladora', tipo: 'ACTIVOS FIJOS Y EXTRAS', resp: '', activo: true, u: 'HORA', costo: 3.20, cuenta: '921301' },
    { cod: 'REC-0011', nom: 'Lavado · servicio de terceros', tipo: 'SERVICIO DE TERCEROS', resp: 'Lavandería Industrial del Sur', activo: true, u: 'UND', costo: 3.50, cuenta: '921201', prov: 'PRV-0003' },
    { cod: 'REC-0012', nom: 'Acabado · servicio de terceros', tipo: 'SERVICIO DE TERCEROS', resp: 'Confecciones El Águila', activo: true, u: 'UND', costo: 1.80, cuenta: '921201', prov: 'PRV-0006' }
  ],

  /* Operarios iniciales (se guardan y editan en la demo): cada uno ocupa un recurso de mano de obra */
  OPERARIOS: [
    { cod: 'OPE-001', nom: 'Josselyne Ramos', rec: 'REC-0009', sede: 'Zárate', activo: true },
    { cod: 'OPE-002', nom: 'Luis Torres', rec: 'REC-0001', sede: 'Zárate', activo: true },
    { cod: 'OPE-003', nom: 'Carlos Ramos', rec: 'REC-0001', sede: 'Zárate', activo: true },
    { cod: 'OPE-004', nom: 'María Quispe', rec: 'REC-0002', sede: 'Zárate', activo: true },
    { cod: 'OPE-005', nom: 'Ana García', rec: 'REC-0002', sede: 'Zárate', activo: true },
    { cod: 'OPE-006', nom: 'Elena Vega', rec: 'REC-0002', sede: 'Zárate', activo: true },
    { cod: 'OPE-007', nom: 'Jorge Mendoza', rec: 'REC-0008', sede: 'Gamarra', activo: true },
    { cod: 'OPE-008', nom: 'Rosa Huamán', rec: 'REC-0008', sede: 'Gamarra', activo: true }
  ],

  /* Proveedores de CO-02 (V7) con servicio para producción */
  PROVEEDORES: [
    { cod: 'PRV-0003', nom: 'LAVANDERIA INDUSTRIAL DEL SUR SAC', ruc: '20509876543', dir: 'Calle Los Hornos 240, San Juan de Lurigancho', servicio: 'Lavado', tarifas: { 'REC-0011': 3.50 }, alm: 'SB-ALM-TRN', diasEst: 15 },
    { cod: 'PRV-0006', nom: 'CONFECCIONES EL AGUILA SAC', ruc: '20334455667', dir: 'Jr. Gamarra 653, Int. 402, La Victoria', servicio: 'Confección y acabado', tarifas: { 'REC-0012': 1.80 }, alm: 'SB-ALM-TRN', diasEst: 10 }
  ],
  TRANSPORTISTAS: [{ cod: 'PRV-0004', nom: 'TRANSPORTES GAMARRA EXPRESS SAC', ruc: '20456789123' }],

  /* Listas de materiales (GI-17): cada lista es la fórmula de UN artículo, sin fases ni niveles.
     Si un componente también tiene lista, es un artículo fabricable y puede tener su propia orden. */
  LDMS: [
    { id: 'LDM-0003', art: 'PPT-0026', nom: 'Piezas cortadas talla 28', desc: 'Tendido y corte según el tizado', base: 1, pred: true, items: [
      { tipo: 'Artículo', cod: 'MP-0012', cant: 1.40, alm: 'SB-ALM-MPT', metodo: 'Manual' },
      { tipo: 'Recurso', cod: 'REC-0009', cant: 0.02 },
      { tipo: 'Recurso', cod: 'REC-0001', cant: 0.10 },
      { tipo: 'Recurso', cod: 'REC-0003', cant: 0.05 },
      { tipo: 'Texto', txt: 'Cortar según el tizado adjunto; codificar los paquetes con la referencia de la orden' }] },
    { id: 'LDM-0010', art: 'PPT-0027', nom: 'Piezas cortadas talla 30', desc: 'Tendido y corte según el tizado', base: 1, pred: true, items: [
      { tipo: 'Artículo', cod: 'MP-0012', cant: 1.46, alm: 'SB-ALM-MPT', metodo: 'Manual' },
      { tipo: 'Recurso', cod: 'REC-0009', cant: 0.02 },
      { tipo: 'Recurso', cod: 'REC-0001', cant: 0.10 },
      { tipo: 'Recurso', cod: 'REC-0003', cant: 0.05 },
      { tipo: 'Texto', txt: 'Cortar según el tizado adjunto; codificar los paquetes con la referencia de la orden' }] },
    { id: 'LDM-0011', art: 'PPT-0022', nom: 'Pantalón crudo talla 28', desc: 'Ensamble del pantalón sin lavar', base: 1, pred: true, items: [
      { tipo: 'Artículo', cod: 'PPT-0026', cant: 1, alm: 'SB-ALM-PPT', metodo: 'Manual' },
      { tipo: 'Artículo', cod: 'MP-0031', cant: 250, alm: 'SB-ALM-MPA', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0046', cant: 1, alm: 'SB-ALM-MPA', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0071', cant: 1, alm: 'SB-ALM-MPA', metodo: 'Notificación' },
      { tipo: 'Recurso', cod: 'REC-0002', cant: 0.35 },
      { tipo: 'Recurso', cod: 'REC-0010', cant: 0.30 },
      { tipo: 'Texto', txt: 'Planchar con agua los bolsillos; presillas y ojales antes de empaquetar el lote' }] },
    { id: 'LDM-0012', art: 'PPT-0025', nom: 'Pantalón crudo talla 30', desc: 'Ensamble del pantalón sin lavar', base: 1, pred: true, items: [
      { tipo: 'Artículo', cod: 'PPT-0027', cant: 1, alm: 'SB-ALM-PPT', metodo: 'Manual' },
      { tipo: 'Artículo', cod: 'MP-0031', cant: 250, alm: 'SB-ALM-MPA', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0046', cant: 1, alm: 'SB-ALM-MPA', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0072', cant: 1, alm: 'SB-ALM-MPA', metodo: 'Notificación' },
      { tipo: 'Recurso', cod: 'REC-0002', cant: 0.36 },
      { tipo: 'Recurso', cod: 'REC-0010', cant: 0.30 },
      { tipo: 'Texto', txt: 'Planchar con agua los bolsillos; presillas y ojales antes de empaquetar el lote' }] },
    { id: 'LDM-0006', art: 'PPT-0021', nom: 'Pantalón lavado azul talla 28', desc: 'Lavado stone medio (servicio de terceros)', base: 1, pred: true, items: [
      { tipo: 'Artículo', cod: 'PPT-0022', cant: 1, alm: 'SB-ALM-TRN', metodo: 'Manual' },
      { tipo: 'Recurso', cod: 'REC-0011', cant: 1, metodo: 'Notificación' },
      { tipo: 'Texto', txt: 'Lavado stone medio según la receta adjunta' }] },
    { id: 'LDM-0007', art: 'PPT-0023', nom: 'Pantalón lavado negro talla 28', desc: 'Teñido negro y lavado (servicio de terceros)', base: 1, pred: true, items: [
      { tipo: 'Artículo', cod: 'PPT-0022', cant: 1, alm: 'SB-ALM-TRN', metodo: 'Manual' },
      { tipo: 'Recurso', cod: 'REC-0011', cant: 1, metodo: 'Notificación' },
      { tipo: 'Texto', txt: 'Teñido negro y lavado según la receta adjunta' }] },
    { id: 'LDM-0008', art: 'PPT-0024', nom: 'Pantalón lavado azul talla 30', desc: 'Lavado stone medio (servicio de terceros)', base: 1, pred: true, items: [
      { tipo: 'Artículo', cod: 'PPT-0025', cant: 1, alm: 'SB-ALM-TRN', metodo: 'Manual' },
      { tipo: 'Recurso', cod: 'REC-0011', cant: 1, metodo: 'Notificación' },
      { tipo: 'Texto', txt: 'Lavado stone medio según la receta adjunta' }] },
    { id: 'LDM-0001', art: 'PT-0001', nom: 'Pantalón terminado azul talla 28', desc: 'Limpieza, botón, parche, etiquetado y embolsado', base: 1, pred: true, items: [
      { tipo: 'Artículo', cod: 'PPT-0021', cant: 1, alm: 'SB-ALM-PPT', metodo: 'Manual' },
      { tipo: 'Artículo', cod: 'MP-0044', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0055', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0063', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0061', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0064', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Recurso', cod: 'REC-0008', cant: 0.12 },
      { tipo: 'Texto', txt: 'Pegar la etiqueta con la referencia de la orden' }] },
    { id: 'LDM-0004', art: 'PT-0001', nom: 'Pantalón terminado azul talla 28, sin parche', desc: 'Alternativa sin parche de cuero', base: 1, pred: false, items: [
      { tipo: 'Artículo', cod: 'PPT-0021', cant: 1, alm: 'SB-ALM-PPT', metodo: 'Manual' },
      { tipo: 'Artículo', cod: 'MP-0044', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0063', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0061', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0064', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Recurso', cod: 'REC-0008', cant: 0.10 },
      { tipo: 'Texto', txt: 'Pegar la etiqueta con la referencia de la orden' }] },
    { id: 'LDM-0002', art: 'PT-0002', nom: 'Pantalón terminado azul talla 30', desc: 'Limpieza, botón, parche, etiquetado y embolsado', base: 1, pred: true, items: [
      { tipo: 'Artículo', cod: 'PPT-0024', cant: 1, alm: 'SB-ALM-PPT', metodo: 'Manual' },
      { tipo: 'Artículo', cod: 'MP-0044', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0055', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0063', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0061', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0064', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Recurso', cod: 'REC-0008', cant: 0.12 },
      { tipo: 'Texto', txt: 'Pegar la etiqueta con la referencia de la orden' }] },
    { id: 'LDM-0005', art: 'PT-0003', nom: 'Pantalón terminado negro talla 28', desc: 'Limpieza, botón, parche, etiquetado y embolsado', base: 1, pred: true, items: [
      { tipo: 'Artículo', cod: 'PPT-0023', cant: 1, alm: 'SB-ALM-PPT', metodo: 'Manual' },
      { tipo: 'Artículo', cod: 'MP-0044', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0055', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0063', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0061', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Artículo', cod: 'MP-0064', cant: 1, alm: 'SB-ALM-FAB', metodo: 'Notificación' },
      { tipo: 'Recurso', cod: 'REC-0008', cant: 0.12 },
      { tipo: 'Texto', txt: 'Pegar la etiqueta con la referencia de la orden' }] }
  ],

  /* Catálogos iniciales de producción (editables en PR-13) */
  CATALOGOS: {
    /* parámetros de control por categoría de artículo (se miden en los recibos e inspecciones) */
    parametros: {
      'PANTALÓN': ['Largo total', 'Tiro delantero', 'Tiro posterior', 'Cintura', 'Cadera', 'Rodilla', 'Basta'],
      'TELAS': ['Ancho útil', 'Gramaje']
    }
  }
};

M.art = cod => M.ARTICULOS.find(a => a.cod === cod);
M.nomArt = cod => { const a = M.art(cod); return a ? a.nom : cod; };
M.u = cod => { const a = M.art(cod); return a ? a.u : ''; };
M.alm = cod => M.ALMACENES.find(a => a.cod === cod);
M.almNom = cod => { const a = M.alm(cod); return a ? a.nom : cod; };
/* recursos y tipos de recurso viven en el Store (editables); antes de crear la demo se usan los iniciales */
M.recursos = () => (typeof Store !== 'undefined' && Store.d && Store.d.recursos) || M.RECURSOS;
M.tiposRecurso = () => (typeof Store !== 'undefined' && Store.d && Store.d.tiposRecurso) || M.TIPOS_RECURSO;
M.rec = cod => M.recursos().find(r => r.cod === cod);
M.recActivos = filtro => M.recursos().filter(r => r.activo !== false && (!filtro || filtro(r)));
M.tipoRec = nom => M.tiposRecurso().find(t => t.nom === nom);
M.cuenta = cod => M.CUENTAS_COSTO.find(c => c.cod === cod);
M.prov = cod => M.PROVEEDORES.find(p => p.cod === cod);
M.ldm = id => M.LDMS.find(l => l.id === id);
M.ldmsDe = art => M.LDMS.filter(l => l.art === art).sort((a, b) => (b.pred ? 1 : 0) - (a.pred ? 1 : 0));
M.ldmPred = art => M.ldmsDe(art)[0] || null;
M.attr = (cod, nom) => { const a = M.art(cod); return a && a.attrs ? (a.attrs[nom] || '') : ''; };
M.fabricables = () => M.ARTICULOS.filter(a => M.ldmsDe(a.cod).length);
