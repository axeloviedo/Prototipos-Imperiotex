/* COMPARTIDO · maestros que NO vienen en las plantillas del usuario y el prototipo necesita.
   Todo lo de aquí lleva origen: 'complemento'. Lo marcado aConfirmar: true es un dato inventado que el usuario debe validar
   (p. ej. RUC de proveedores de servicios o costos estándar).
   Familia de trabajo: PANTALON WIDE LEG ZULEIKA en 2 colores (AZUL, NEGRO) × 2 tallas (28, 30).
   El color nace en el lavado: piezas cortadas y crudo van solo por talla (un mismo denim da varios colores) y sirven para cualquier color:
     PIEZAS CORTADAS (PPT-0001..0002) → CRUDO (PPT-0003..0004) → LAVADO por color, tercerizado (PPT-0005..0008) → PRODUCTO FINAL (PT-0001..0004). */
const BD_COMPLEMENTOS = (() => {
  const C = 'complemento';

  const unidades = [
    { cod: 'HORA', nom: 'Hora', origen: C }, { cod: 'DÍA', nom: 'Día', origen: C }
  ];
  const NOMBRES_UM = { UND: 'Unidad', MT: 'Metro', KG: 'Kilogramo', DOC: 'Docena', MILLAR: 'Millar', ROLLO: 'Rollo', CONO: 'Cono', PAR: 'Par', JUEGO: 'Juego', CAJA: 'Caja', PAQUETE: 'Paquete', LT: 'Litro' };
  const conversiones = [{ de: 'DOC', a: 'UND', factor: 12 }, { de: 'MILLAR', a: 'UND', factor: 1000 }];

  const grupos = [
    { cod: 'MP', nom: 'MATERIA PRIMA', prefijo: 'MP-', asignacion: 'Interna', inv: true, grupoCompra: 'MP1' },
    { cod: 'SRV', nom: 'SERVICIOS', prefijo: 'SRV-', asignacion: 'Interna', inv: false, grupoCompra: 'SRV' },
    { cod: 'PPT', nom: 'PRODUCTOS EN PROCESO', prefijo: 'PPT-', asignacion: 'Interna', inv: true, origen: C },
    { cod: 'PT', nom: 'PRODUCTOS TERMINADOS', prefijo: 'PT-', asignacion: 'Interna', inv: true, origen: C },
    { cod: 'MERC', nom: 'MERCADERÍA', prefijo: 'MERC-', asignacion: 'Interna', inv: true, grupoCompra: 'MSC', origen: C }
  ];
  const categorias = [
    { cod: 'PAN', nom: 'PANTALON', grupo: 'PT', origen: C },
    { cod: 'PANPP', nom: 'PANTALON EN PROCESO', grupo: 'PPT', origen: C }
  ];
  const subcategorias = [
    { cat: 'PANTALON', nom: 'WIDE LEG', origen: C },
    { cat: 'PANTALON EN PROCESO', nom: 'PIEZAS CORTADAS', origen: C },
    { cat: 'PANTALON EN PROCESO', nom: 'CRUDO', origen: C },
    { cat: 'PANTALON EN PROCESO', nom: 'LAVADO', origen: C }
  ];
  const atributoValores = {
    Color: ['AZUL', 'NEGRO', 'CELESTE', 'BLANCO'], Talla: ['26', '28', '30', '32', '34'],
    Acabado: ['PIEZAS CORTADAS', 'CRUDO', 'LAVADO', 'TERMINADO'], Material: ['DENIM CONFORT', 'DENIM RIGIDO', 'DENIM STRECH'], Composición: [], Género: ['DAMA', 'CABALLERO']
  };

  /* Almacén de producto en proceso: creado el 2026-09-16 por decisión del usuario (las plantillas no lo traían);
     figura en ESTRUCTURA_ORGANIZATIVA_LOGISTICA_INVENTARIOS_ERP_ACTUALIZADO.docx */
  const almacenes = ['SB', 'CN'].map(emp => ({ emp, cod: emp + '-ZARATE-PP', nom: 'Almacén Zárate Producto en Proceso', sede: 'Zárate', estado: 'Activo', kardexValorizado: false, transito: false, obs: 'Piezas cortadas, crudos y lavados en planta (solo cantidades en contabilidad)', origen: C }));

  /* Datos que faltan en artículos de la plantilla que usa Zuleika: costo de referencia y proveedor por defecto
     (MP-0071, MP-0052, MP-0054 y MP-0009 ya no los usan las listas propuestas; se conservan en el maestro) */
  const ajustesArticulos = {
    /* las telas se manejan por lote (I-7): cada ingreso crea su lote L<año>-<artículo>-<correlativo> */
    'MP-0070': { produccion: true, precioCompra: 19.10, costo: 19.10, provDef: 'PROV-0001', stockMin: 50, ctrl: 'Lote', aConfirmar: true },
    'MP-0071': { produccion: true, precioCompra: 19.40, costo: 19.40, provDef: 'PROV-0001', stockMin: 50, ctrl: 'Lote', aConfirmar: true },
    'MP-0052': { produccion: true, precioCompra: 8.50, costo: 8.50, provDef: 'PROV-0002', aConfirmar: true },
    'MP-0054': { produccion: true, precioCompra: 8.50, costo: 8.50, provDef: 'PROV-0002', aConfirmar: true },
    'MP-0055': { produccion: true, precioCompra: 8.90, costo: 8.90, provDef: 'PROV-0002', aConfirmar: true },
    'MP-0058': { produccion: true, precioCompra: 8.50, costo: 8.50, provDef: 'PROV-0002', aConfirmar: true },
    'MP-0003': { produccion: true, precioCompra: 0.45, costo: 0.45, provDef: 'PROV-0002', aConfirmar: true },
    'MP-0009': { produccion: true, precioCompra: 0.45, costo: 0.45, provDef: 'PROV-0002', aConfirmar: true },
    'MP-0042': { produccion: true, precioCompra: 0.05, costo: 0.05, provDef: 'PROV-0002', aConfirmar: true },
    'MP-0043': { produccion: true, precioCompra: 0.05, costo: 0.05, provDef: 'PROV-0002', aConfirmar: true }
  };

  const mp = (cod, nom, subcat, precio) => ({ cod, nom, desc: nom, grupo: 'MP', cat: 'AVIOS DE ACABADOS PRINCIPALES', subcat, u: 'UND', ctrl: 'Nada', inv: true, compra: true, venta: false, produccion: true, igv: 'Gravado', estado: 'Activo', precioCompra: precio, costo: precio, uCompra: 'UND', provDef: 'PROV-0002', origen: C, aConfirmar: true });
  const articulos = [
    /* avíos de acabado de Zuleika: la plantilla trae las sub categorías pero no los artículos */
    Object.assign(mp('MP-0102', 'BOTON METALICO 17MM PLATA ENVEJECIDA', 'BOTON', 0.35), { stockMin: 100 }),
    Object.assign(mp('MP-0103', 'REMACHE METALICO 9MM PLATA ENVEJECIDA', 'BOTON', 0.12), { stockMin: 600 }),
    mp('MP-0104', 'PARCHE CUERO SINTETICO SARA BQ', 'CUEROS', 0.60),
    mp('MP-0105', 'ETIQUETA PANTALON SARA BQ', 'ETIQUETA PANTALON', 0.18),
    mp('MP-0106', 'HANG TAG SARA DENIM', 'HANG TAG', 0.25),
    mp('MP-0107', 'BOLSA BRILLO 30X40', 'BOLSA BRILLO', 0.12)
  ];

  /* tela, hilos y cierre únicos para todos los colores: se usan antes del lavado, donde todavía no hay color */
  const TELA = 'MP-0070', HILOS = ['MP-0055', 'MP-0058'], CIERRE = 'MP-0003';
  const COLORES = [
    { c: 'AZUL', receta: 'Lavado stone medio según la receta adjunta', precio: 119.90, min: 79.00 },
    { c: 'NEGRO', receta: 'Lavado negro fijado según la receta adjunta', precio: 124.90, min: 82.00 }
  ];
  const TALLAS = [{ t: '28', metros: 1.40, tallita: 'MP-0042' }, { t: '30', metros: 1.46, tallita: 'MP-0043' }];
  const pad = n => String(n).padStart(4, '0');
  const combos = [];
  COLORES.forEach(co => TALLAS.forEach(ta => combos.push({ co, ta })));

  /* productos en proceso sin color hasta el lavado: clave en zuleika.ppt = etapa + talla (lavado: etapa + color + talla) */
  const zuleika = { pt: {}, ppt: {} };
  const ppt = (clave, nom, et, attrs) => {
    const cod = 'PPT-' + pad(Object.keys(zuleika.ppt).length + 1);
    zuleika.ppt[clave] = cod;
    articulos.push({ cod, nom, desc: 'Pantalón Zuleika en proceso: ' + et.toLowerCase(), grupo: 'PPT', cat: 'PANTALON EN PROCESO', subcat: et, u: 'UND', ctrl: 'Nada',
      inv: true, compra: false, venta: false, produccion: true, igv: 'Gravado', estado: 'Activo', costo: 0,
      attrs: Object.assign(attrs, { Acabado: et, Material: 'DENIM CONFORT', Género: 'DAMA' }), origen: C });
  };
  combos.forEach(({ co, ta }, i) => {
    const pt = 'PT-' + pad(i + 1);
    zuleika.pt[co.c + ta.t] = pt;
    articulos.push({ cod: pt, nom: 'PANTALON WIDE LEG ZULEIKA TALLA ' + ta.t + ' COLOR ' + co.c, desc: 'Pantalón wide leg Zuleika terminado', grupo: 'PT', cat: 'PANTALON', subcat: 'WIDE LEG', u: 'UND', ctrl: 'Nada',
      inv: true, compra: false, venta: true, produccion: true, igv: 'Gravado', estado: 'Activo', costo: 0,
      attrs: { Color: co.c, Talla: ta.t, Acabado: 'TERMINADO', Material: 'DENIM CONFORT', Género: 'DAMA' },
      precioVenta: co.precio, precioMin: co.min, uVenta: 'UND', dctoMin: 0, dctoMax: 15, stockMin: ta.t === '28' ? 15 : 10, origen: C });
  });
  ['PIEZAS CORTADAS', 'CRUDO'].forEach(et => TALLAS.forEach(ta => ppt(et + ta.t, 'PANTALON WIDE LEG ZULEIKA ' + et + ' TALLA ' + ta.t, et, { Talla: ta.t })));
  combos.forEach(({ co, ta }) => ppt('LAVADO' + co.c + ta.t, 'PANTALON WIDE LEG ZULEIKA LAVADO COLOR ' + co.c + ' TALLA ' + ta.t, 'LAVADO', { Color: co.c, Talla: ta.t }));

  /* artículos «… FALLADO» de crudo (por talla) y lavado (por color y talla) (decisión J2: producto fallado = salida del artículo + ingreso del fallado al mismo costo) */
  articulos.filter(a => a.grupo === 'PPT' && (a.subcat === 'CRUDO' || a.subcat === 'LAVADO')).forEach(a => articulos.push(Object.assign({}, a,
    { cod: a.cod + 'F', nom: a.nom + ' FALLADO', desc: a.desc + ' (fallado)', produccion: false, attrs: Object.assign({}, a.attrs, { Estado: 'FALLADO' }) })));

  /* ---------- recursos ---------- */
  const tiposRecurso = [
    { cod: 'TRC-0001', nom: 'RECURSO HUMANO', clase: 'humano' },
    { cod: 'TRC-0002', nom: 'ACTIVOS FIJOS Y EXTRAS' },
    { cod: 'TRC-0003', nom: 'SERVICIO DE TERCEROS', clase: 'servicio' }
  ];
  const rec = (cod, nom, tipo, u, costo, cuenta) => ({ cod, nom, tipo, activo: true, u, costo, cuenta, origen: C, aConfirmar: true });
  const recursos = [
    rec('REC-0001', 'Patronista / tizado', 'RECURSO HUMANO', 'HORA', 18.00, '921101'),
    rec('REC-0002', 'Operario de corte', 'RECURSO HUMANO', 'HORA', 15.00, '921101'),
    rec('REC-0003', 'Máquina de corte', 'ACTIVOS FIJOS Y EXTRAS', 'HORA', 22.50, '921301'),
    rec('REC-0004', 'Costurera · línea de confección', 'RECURSO HUMANO', 'HORA', 12.80, '921101'),
    rec('REC-0005', 'Máquina recta y remalladora', 'ACTIVOS FIJOS Y EXTRAS', 'HORA', 3.20, '921301'),
    rec('REC-0006', 'Operario de acabado', 'RECURSO HUMANO', 'HORA', 11.50, '921101'),
    rec('REC-0007', 'Energía eléctrica de planta', 'ACTIVOS FIJOS Y EXTRAS', 'HORA', 1.90, '921401')
  ];

  /* Servicios de terceros: el artículo SRV-xxxx (plantilla) se compra con OC; su ficha de recurso lleva el costo estándar y el proveedor habitual.
     El código del recurso ES el código del artículo de servicio. Los proveedores no vienen en la plantilla: se crean aquí (aConfirmar). */
  const SERVICIOS = [
    ['SRV-0001', 'LAVANDERIA LANDEO', 'RUC', '20600000001', 3.50],
    ['SRV-0002', 'LAVANDERIA ECOTEX', 'RUC', '20600000002', 3.80],
    ['SRV-0003', 'CESAR CURILLA', 'DNI', '40000003', 0.90],
    ['SRV-0004', 'MISAEL ULIARTE', 'DNI', '40000004', 0.95],
    ['SRV-0005', 'ORTENCIO CASTILLO', 'DNI', '40000005', 6.50],
    ['SRV-0006', 'JUAN BLANQUILLO', 'DNI', '40000006', 6.50],
    ['SRV-0007', 'ALFREDO HUAYTAN', 'DNI', '40000007', 6.50],
    ['SRV-0008', 'CARMEN TAYPE', 'DNI', '40000008', 6.50],
    ['SRV-0009', 'JOSE CHIPANA', 'DNI', '40000009', 6.50],
    ['SRV-0010', 'DANIEL PRADO', 'DNI', '40000010', 6.50],
    ['SRV-0011', 'NESTOR RIVERA', 'DNI', '40000011', 6.50],
    ['SRV-0012', 'POLO OCHOA', 'DNI', '40000012', 6.50],
    ['SRV-0013', 'RENZO VENANCIO', 'DNI', '40000013', 6.50],
    ['SRV-0014', 'WALTER CACHAY', 'DNI', '40000014', 6.50],
    ['SRV-0015', 'MERY INCA', 'DNI', '40000015', 6.50],
    ['SRV-0016', 'KLEPER MONTEZA', 'DNI', '40000016', 6.50],
    ['SRV-0017', 'NIXON PANAIFO GUZMAN', 'DNI', '40000017', 6.50]
  ];
  const proveedores = [];
  SERVICIOS.forEach((s, i) => {
    const prov = 'PROV-' + pad(5 + i);
    proveedores.push({ cod: prov, tipoDoc: s[2], doc: s[3], nom: s[1], comercial: s[1], grupo: 'SRV', tipo: 'Nacional', estado: 'Activo', email: '', dir: '', ubigeo: 'LIMA / Lima / La Victoria', tel: '', cel: '',
      mon: 'S/.', cond: 'Crédito 15 días', dias: 15, retencion: false, detraccion: s[2] === 'RUC', servicio: s[0], alm: 'SB-TRANSITO', diasEst: 7, origen: C, aConfirmar: true });
    recursos.push({ cod: s[0], nom: 'Servicio ' + s[1].toLowerCase().replace(/\b\w/g, x => x.toUpperCase()), tipo: 'SERVICIO DE TERCEROS', activo: true, u: 'UND', costo: s[4], cuenta: '921201', prov, origen: C, aConfirmar: true });
  });
  const ajustesArticulosSrv = {};
  SERVICIOS.forEach((s, i) => { ajustesArticulosSrv[s[0]] = { provDef: 'PROV-' + pad(5 + i), precioCompra: s[4], produccion: true }; });

  const operarios = [
    ['OPE-001', 'Josselyne Ramos', 'REC-0001'], ['OPE-002', 'Luis Torres', 'REC-0002'], ['OPE-003', 'Carlos Ramos', 'REC-0002'],
    ['OPE-004', 'María Quispe', 'REC-0004'], ['OPE-005', 'Ana García', 'REC-0004'], ['OPE-006', 'Elena Vega', 'REC-0004'],
    ['OPE-007', 'Jorge Mendoza', 'REC-0006'], ['OPE-008', 'Rosa Huamán', 'REC-0006']
  ].map(o => ({ cod: o[0], nom: o[1], rec: o[2], activo: true, origen: C }));

  /* ---------- listas de materiales de Zuleika (cada lista = fórmula de UN artículo) ---------- */
  const MP_ALM = 'SB-ZARATE-MP', PP_ALM = 'SB-ZARATE-PP', TRANSITO = 'SB-TRANSITO';
  const A = (cod, cant, alm, metodo) => ({ tipo: 'Artículo', cod, cant, alm, metodo });
  const R = (cod, cant, metodo) => metodo ? { tipo: 'Recurso', cod, cant, metodo } : { tipo: 'Recurso', cod, cant };
  const T = txt => ({ tipo: 'Texto', txt });
  const ldms = [];
  let n = 1;
  const nuevaLdm = (art, nom, desc, items, pred) => ldms.push({ id: 'LDM-' + pad(n++), art, nom, desc, base: 1, pred: pred !== false, items, origen: C });
  combos.forEach(({ co, ta }) => {
    const k = co.c + ta.t, lav = zuleika.ppt['LAVADO' + k];
    nuevaLdm(zuleika.pt[k], 'Zuleika terminado ' + co.c.toLowerCase() + ' talla ' + ta.t, 'Botón, remaches, parche, etiquetado y embolsado', [
      A(lav, 1, PP_ALM, 'Manual'),
      A('MP-0102', 1, MP_ALM, 'Notificación'), A('MP-0103', 6, MP_ALM, 'Notificación'), A('MP-0104', 1, MP_ALM, 'Notificación'),
      A('MP-0105', 1, MP_ALM, 'Notificación'), A('MP-0106', 1, MP_ALM, 'Notificación'), A('MP-0107', 1, MP_ALM, 'Notificación'),
      R('REC-0006', 0.12), R('REC-0007', 0.02, 'Notificación'), T('Pegar la etiqueta con la referencia de la orden y embolsar por talla')]);
  });
  combos.forEach(({ co, ta }) => {
    const k = co.c + ta.t;
    nuevaLdm(zuleika.ppt['LAVADO' + k], 'Zuleika lavado ' + co.c.toLowerCase() + ' talla ' + ta.t, 'Lavado industrial (servicio de terceros)', [
      A(zuleika.ppt['CRUDO' + ta.t], 1, TRANSITO, 'Manual'), R('SRV-0001', 1, 'Notificación'), T(co.receta)]);
  });
  /* crudo y piezas cortadas: una lista por talla, sirven para cualquier color */
  TALLAS.forEach(ta => {
    nuevaLdm(zuleika.ppt['CRUDO' + ta.t], 'Zuleika crudo talla ' + ta.t, 'Confección del pantalón sin lavar', [
      A(zuleika.ppt['PIEZAS CORTADAS' + ta.t], 1, PP_ALM, 'Manual'),
      A(HILOS[0], 0.05, MP_ALM, 'Notificación'), A(HILOS[1], 0.05, MP_ALM, 'Notificación'),
      A(CIERRE, 1, MP_ALM, 'Notificación'), A(ta.tallita, 1, MP_ALM, 'Notificación'),
      R('REC-0004', 0.35), R('REC-0005', 0.30, 'Notificación'), T('Presillas y ojales antes de empaquetar el lote')]);
  });
  TALLAS.forEach(ta => {
    nuevaLdm(zuleika.ppt['PIEZAS CORTADAS' + ta.t], 'Zuleika piezas cortadas talla ' + ta.t, 'Tendido y corte según el tizado', [
      A(TELA, ta.metros, MP_ALM, 'Manual'), R('REC-0001', 0.02), R('REC-0002', 0.10), R('REC-0003', 0.05, 'Notificación'),
      T('Cortar según el tizado adjunto; codificar los paquetes con la referencia de la orden')]);
  });
  /* alternativa: terminado azul talla 28 sin parche */
  nuevaLdm('PT-0001', 'Zuleika terminado azul talla 28 sin parche', 'Alternativa sin parche de cuero', [
    A(zuleika.ppt['LAVADOAZUL28'], 1, PP_ALM, 'Manual'),
    A('MP-0102', 1, MP_ALM, 'Notificación'), A('MP-0103', 6, MP_ALM, 'Notificación'), A('MP-0105', 1, MP_ALM, 'Notificación'),
    A('MP-0106', 1, MP_ALM, 'Notificación'), A('MP-0107', 1, MP_ALM, 'Notificación'), R('REC-0006', 0.10), T('Sin parche: pedido especial')], false);

  return {
    NOMBRES_UM, unidades, conversiones, grupos, categorias, subcategorias, atributoValores, almacenes,
    ajustesArticulos: Object.assign(ajustesArticulos, ajustesArticulosSrv), articulos, tiposRecurso, recursos, proveedores, operarios, ldms, zuleika
  };
})();
