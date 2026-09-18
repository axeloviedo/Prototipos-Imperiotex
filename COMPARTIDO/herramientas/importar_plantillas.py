# Importa las plantillas reales entregadas por el usuario (docs/INFO/PLANTILLAS ENTREGADAS POR EL USUARIO)
# y genera COMPARTIDO/bd/datos/maestros-plantillas.js.
# Uso (desde la carpeta PROTOTIPOS):  python COMPARTIDO/herramientas/importar_plantillas.py
# No editar el .js generado a mano: los datos que faltan en las plantillas van en maestros-complementos.js.
import openpyxl, json, os, re, sys

sys.stdout.reconfigure(encoding='utf-8')
BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PL = os.path.join(BASE, 'docs', 'INFO', 'PLANTILLAS ENTREGADAS POR EL USUARIO')
SALIDA = os.path.join(BASE, 'COMPARTIDO', 'bd', 'datos', 'maestros-plantillas.js')


def limpio(v):
    if v is None:
        return ''
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return re.sub(r'\s+', ' ', str(v)).strip()


def filas(archivo, hoja):
    ws = openpyxl.load_workbook(os.path.join(PL, archivo), data_only=True)[hoja]
    return [[limpio(c) for c in r] for r in ws.iter_rows(values_only=True)]


def bloques_config(archivo):
    """Configuraciones: devuelve {titulo: [filas]} por cada bloque numerado '1. …'"""
    out, actual = {}, None
    for r in filas(archivo, 'Configuraciones'):
        v = [c for c in r if c != '']
        if not v:
            continue
        m = re.match(r'^(\d+)\.\s+(.*)$', v[0])
        if m and len(v) == 1:
            actual = m.group(2).upper()
            out[actual] = []
            continue
        if actual:
            out[actual].append(v)
    return out


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


# ---------------- artículos (MP y SRV) ----------------
IGV_CORTO = {'Gravado - Operación Onerosa (18%)': 'Gravado'}


def articulos(archivo, grupo):
    rs = filas(archivo, 'Artículos')
    cab = rs[0]
    idx = {c: i for i, c in enumerate(cab)}
    out = []
    for r in rs[1:]:
        cod = r[idx['Código (auto)']]
        nom = r[idx['Nombre (*)']]
        if not cod or not nom:
            continue
        u = r[idx['UM de Inventario (*)']].upper() or 'UND'
        a = {
            'cod': cod, 'nom': nom, 'desc': r[idx['Descripción']], 'grupo': grupo,
            'cat': r[idx['Categoría']], 'subcat': r[idx['Sub categoría']],
            'u': u, 'ctrl': r[idx['Control de inventario (*)']] or 'Nada',
            'inv': grupo != 'SRV', 'compra': True, 'venta': False,
            'produccion': r[idx['Apto para producción']] == 'Sí',
            'igv': IGV_CORTO.get(r[idx['Afectación IGV (*)']], r[idx['Afectación IGV (*)']] or 'Gravado'),
            'estado': r[idx['Estado (*)']] or 'Activo', 'origen': 'plantilla'
        }
        pc = num(r[idx['Precio compra ref. S/.']])
        if pc is not None:
            a['precioCompra'] = pc
        if r[idx['UM de compra']]:
            a['uCompra'] = r[idx['UM de compra']].upper()
        if r[idx['Proveedor por defecto']]:
            a['provDefNom'] = r[idx['Proveedor por defecto']]
        out.append(a)
    return out


mp = articulos('PLANTILLA_Articulos_MATERIA_PRIMA.xlsx', 'MP')
srv = articulos('PLANTILLA_Articulos_SERVICIOS.xlsx', 'SRV')

cfg_mp = bloques_config('PLANTILLA_Articulos_MATERIA_PRIMA.xlsx')
cfg_srv = bloques_config('PLANTILLA_Articulos_SERVICIOS.xlsx')


def categorias(cfg, grupo):
    clave = [k for k in cfg if k.startswith('CATEGORÍAS')][0]
    # sin clase de valoración (L2): la cuenta contable vive en el Grupo de Artículo, pestaña Finanzas
    return [{'cod': r[0], 'nom': r[1], 'grupo': grupo} for r in cfg[clave] if r[0] != 'CODIGO']


def subcategorias(cfg):
    clave = [k for k in cfg if k.startswith('SUB CATEGORÍAS')][0]
    out, cat = [], None
    for r in cfg[clave]:
        v = r[0]
        if v.startswith('Categoría nueva'):
            continue
        if v == 'SUBCATEGORIA':
            continue
        if v.isupper() and len(r) == 1 and (cat is None or v in NOMBRES_CAT):
            cat = v
            continue
        out.append({'cat': cat, 'nom': v})
    return out


cats = categorias(cfg_mp, 'MP') + categorias(cfg_srv, 'SRV')
NOMBRES_CAT = {c['nom'] for c in cats}
subcats = subcategorias(cfg_mp)


def lista_simple(cfg, prefijo, cab):
    clave = [k for k in cfg if k.startswith(prefijo)][0]
    return [r[0] for r in cfg[clave] if r[0] != cab]


unidades_pl = lista_simple(cfg_mp, 'UNIDADES', 'UNIDAD')
atributos = lista_simple(cfg_mp, 'ATRIBUTOS', 'ATRIBUTO')
tipos_barra = lista_simple(cfg_mp, 'TIPOS DE CÓDIGO', 'TIPO')

# ---------------- almacenes ----------------
cfg_alm = bloques_config('PLANTILLA_Almacenes_GI.xlsx')
rs = filas('PLANTILLA_Almacenes_GI.xlsx', 'Almacenes')
almacenes = []
for r in rs[1:]:
    if not r[1]:
        continue
    almacenes.append({
        # sin categoría, físico/virtual ni contenido (L3); la categoría «Transición» del Excel se vuelve el indicador en tránsito
        'emp': r[0], 'cod': r[1], 'nom': r[2], 'sede': r[4],
        'estado': r[7] or 'Activo', 'kardexValorizado': r[8] == 'Sí', 'transito': r[3] == 'Transición', 'obs': r[9], 'origen': 'plantilla'
    })
empresas = [{'cod': r[0], 'nom': r[1], 'marca': r[2], 'abrev': r[3]} for r in cfg_alm['EMPRESAS'] if r[0] != 'Código']
sedes = [{'cod': r[0], 'nom': r[1], 'dir': r[2] if len(r) > 2 else '', 'contenido': r[3] if len(r) > 3 else ''} for r in cfg_alm['SEDES / CENTROS FÍSICOS'] if r[0] != 'Código']

# ---------------- proveedores ----------------
rs = filas('PLANTILLA_Proveedores.xlsx', 'Proveedores')
cab = rs[0]
idx = {c: i for i, c in enumerate(cab)}
proveedores = []
for r in rs[1:]:
    if not r[idx['Razón social / Nombre (*)']]:
        continue  # la plantilla trae códigos vacíos reservados
    g = lambda c: r[idx[c]] if c in idx else ''
    proveedores.append({
        'cod': g('Código (*)'), 'tipoDoc': g('Tipo doc. (*)'), 'doc': g('N° documento (*)'), 'nom': g('Razón social / Nombre (*)'),
        # 2026-09-18 (pedido del usuario): GRUPO = Nacional / Internacional (columna «Tipo (*)» del Excel) y TIPO = Telas, Avíos,
        # Servicios, Generales (columna «Grupo» del Excel, hoja «GRUPO DE PROVEEDORES»). Revisa K4.
        'comercial': g('Nombre comercial'), 'grupo': g('Tipo (*)'), 'tipo': g('Grupo'), 'estado': g('Estado (*)') or 'Activo',
        'email': g('Correo electrónico (*)'), 'dir': g('Dirección fiscal'), 'ubigeo': g('Ubigeo'), 'tel': g('Teléfono'), 'cel': g('Celular / WhatsApp'),
        'mon': g('Moneda default') or 'S/.', 'cond': g('Condición de pago (*)') or 'Contado', 'dias': int(num(g('Días crédito')) or 0),
        'retencion': g('Retención') == 'Sí', 'detraccion': g('Detracción') == 'Sí', 'origen': 'plantilla'
    })
cfg_prov = bloques_config('PLANTILLA_Proveedores.xlsx')
tipos_prov = [{'cod': r[0], 'nom': r[1], 'desc': r[2]} for r in cfg_prov['GRUPO DE PROVEEDORES'] if r[0] != 'Código']
condiciones = [{'nom': r[0], 'dias': int(num(r[1]) or 0)} for r in cfg_prov['CONDICIÓN DE PAGO'] if r[0] != 'Descripción']

# proveedor por defecto: de nombre a código
por_nombre = {p['nom'].upper(): p['cod'] for p in proveedores}
for a in mp + srv:
    n = a.pop('provDefNom', '')
    if n:
        a['provDef'] = por_nombre.get(n.upper().replace('AVIOS', 'AVÍOS'), '')

# ---------------- estructura organizativa (docx) ----------------
# Se lee la versión ACTUALIZADA del Word (COMPARTIDO/herramientas/actualizar_estructura_word.py), corregida con los Excel.
# LOS EXCEL MANDAN: almacenes, sedes, empresas y tipos de proveedor salen del Excel; del Word solo se toma lo que el Excel no tiene
# (compartida de la sede, organización y grupos de compras, grupos y tipos de movimiento).
import docx
from docx.table import Table


def tablas_docx(archivo):
    """Tablas del documento como listas de filas; las celdas combinadas se toman una sola vez."""
    d = docx.Document(os.path.join(PL, archivo))
    return [[[limpio(tc.xpath('string(.)')) for tc in dict.fromkeys(c._tc for c in r.cells)] for r in tb.rows] for tb in d.tables]


def buscar(tablas, cabecera):
    for tb in tablas:
        if tb and tb[0][:len(cabecera)] == cabecera:
            return tb[1:]
    raise SystemExit('No se encontró la tabla ' + str(cabecera))


estructura = {}
ARCH_EST = 'ESTRUCTURA_ORGANIZATIVA_LOGISTICA_INVENTARIOS_ERP_ACTUALIZADO.docx'
if os.path.exists(os.path.join(PL, ARCH_EST)):
    T = tablas_docx(ARCH_EST)
    sedes_doc = {r[0]: r for r in buscar(T, ['Código', 'Sede', 'Compartida', 'Contenido'])}
    for s in sedes:
        r = sedes_doc.get(s['cod'])
        if r:
            s['compartida'] = r[2] == 'Sí'
    estructura['organizacionesCompra'] = [{'cod': r[0], 'centro': r[1], 'nom': r[2]} for r in buscar(T, ['Org. Compras', 'Centro', 'Descripción'])]
    grupos_compra = next(tb[1:] for tb in T if tb and tb[0] == ['Código', 'Descripción'])
    estructura['gruposCompra'] = [{'cod': r[0], 'nom': r[1]} for r in grupos_compra]
    estructura['gruposMovimiento'] = [{'cod': r[0], 'nom': r[1], 'desc': r[2]} for r in buscar(T, ['Código', 'Grupo de Movimiento', 'Propósito'])]
    tipos_mov = []
    for tb in T:
        if tb and len(tb[0]) >= 3 and tb[0][:2] == ['Código', 'Tipo de Movimiento']:
            for r in tb[1:]:
                tipos_mov.append({'cod': r[0], 'grupo': r[0].split('-')[0], 'nom': r[1], 'desc': r[2]})
    estructura['tiposMovimiento'] = tipos_mov

# tipo del proveedor: el código de la hoja «GRUPO DE PROVEEDORES» del Excel (Telas → TEL, Avíos → AVI…)
por_nombre_tipo = {t['nom'].upper(): t['cod'] for t in tipos_prov}
for pr in proveedores:
    pr['tipo'] = por_nombre_tipo.get(pr['tipo'].upper(), pr['tipo'])

datos = {
    'fuente': 'docs/INFO/PLANTILLAS ENTREGADAS POR EL USUARIO',
    'estructura': 'ESTRUCTURA_ORGANIZATIVA_LOGISTICA_INVENTARIOS_ERP.docx',
    'empresas': empresas, 'sedes': sedes, 'almacenes': almacenes,
    'unidades': unidades_pl, 'atributos': atributos, 'tiposCodigoBarra': tipos_barra,
    'categorias': cats, 'subcategorias': subcats,
    'articulos': mp + srv, 'proveedores': proveedores, 'tiposProveedor': tipos_prov, 'condicionesPago': condiciones,
    **estructura
}
os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
with open(SALIDA, 'w', encoding='utf8', newline='\n') as f:
    f.write('/* COMPARTIDO · maestros importados de las plantillas reales del usuario (docs/INFO/PLANTILLAS ENTREGADAS POR EL USUARIO).\n')
    f.write('   ARCHIVO GENERADO por COMPARTIDO/herramientas/importar_plantillas.py: no editar a mano. Lo que falta va en maestros-complementos.js. */\n')
    f.write('const BD_PLANTILLAS = ')
    f.write(json.dumps(datos, ensure_ascii=False, indent=1))
    f.write(';\n')
print('artículos MP', len(mp), '· SRV', len(srv), '· almacenes', len(almacenes), '· proveedores', len(proveedores),
      '· categorías', len(cats), '· subcategorías', len(subcats), '· unidades', len(unidades_pl))
