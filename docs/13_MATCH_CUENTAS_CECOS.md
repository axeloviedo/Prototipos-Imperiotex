# 13 · Match con Sábana de Cuentas, CECOs/CEBEs y plantillas del usuario

> Análisis de `logistica-info/PLANTILLAS ENTREGADAS POR EL USUARIO`. No se modifica el prototipo (Fase 2).
> Fecha: 2026-09-09.

---

## 1. Hallazgo central: la cuenta se determina por **Clase de Valoración**, no por Grupo

La `LISTA DE MOVIMIENTOS CONTABLES` trae la **Sábana de Cuentas** y las **Clases de Valoración**:

- **9 Clases de Valoración** (`01 Clases de Valoración`): CV-01 MP Telas · CV-02 MP Avíos · CV-03 Envases/Embalajes · CV-04 Producto en Proceso · CV-05 PP en terceros · CV-06 Producto Terminado · CV-07 Mercadería · CV-08 Muestras · CV-09 Servicios.
- La **Jerarquía A-F** (`03 Jerarquía`) asigna a cada **Categoría/Subcategoría** su Clase de Valoración (ej.: HANG TAG → CV-03 aunque su categoría sea Avíos de Acabados).
- La **Sábana de Cuentas** (`02`) mapea, por fila (Tipo→Cat→Subcat + CV), las cuentas de **28 conceptos** agrupados en **BALANCE(E01-E02) · COMPRAS(C01-C10) · PRODUCCIÓN(P01-P07) · VENTAS(V01-V05) · AJUSTES(A01-A04)**.
- En las **plantillas de artículos**, la columna **"Valorización (auto)"** es justamente el **CV** (ej. CV-02, CV-09), derivado de la categoría/subcategoría.

> **Los 28 conceptos E/C/P/V/A = exactamente nuestros `CONCEPTOS_FIN` 01-28** (mismo orden y nombres). ✔
> **Revisión T4:** en el modelo real, esos 28 conceptos cuelgan de la **Clase de Valoración**, no del "Grupo de Artículo". El artículo obtiene su CV desde su **categoría/subcategoría**.

### Ejemplo real (fila EJEMPLO, PCGE) para CV-01 Telas:
existencias **241111**, en tránsito **284111**, compra **602111**, variación **612111**, flete **609111**, seguro **609121**, aduaneros **609131**, agente **609191**, otros **609191**, … (el resto de filas/CV están **por llenar** por Contabilidad).

## 2. Qué VALIDA y qué AGREGA cada plantilla

### Artículos (MP y Servicios)
Columnas: Código(auto), **Grupo(auto)**, Categoría, Subcategoría, Nombre, Descripción, UM Inventario, Control inventario, **Valorización(auto=CV)**, Apto producción, Precio venta sugerido/mínimo, UM venta/compra, Proveedor def., Precio compra ref., Afectación IGV, Estado. Sub-hojas: **Atributos**, **Stock Mínimo por almacén**, **Códigos de Barras**.
→ **Coincide con nuestro modelo de artículo.** Única incorporación: el campo **Clase de Valoración** (hoy no lo teníamos como entidad; lo teníamos como "Grupo→Finanzas").

### Almacenes
Columnas: **Empresa**, Código, Nombre, **Categoría** (Común…), Sede, **Tipo físico** (Físico/Virtual), **Contenido** (Materia Prima / Productos Terminados / Mercadería Liquidación…), Estado, **Kardex valorizado**, Observaciones.
→ ⚠️ **Reconciliar:** el modelo real **conserva** "Tipo físico" (≈ Clase) y "Contenido" (≈ Uso), que nosotros **quitamos** de la UI (decisiones B2/B3). Además trae **Empresa** (multiempresa) y **Categoría de almacén**. La descripción va en **Observaciones**.

### Proveedores
Columnas: Código, Tipo doc, N° documento, Razón social, **Nombre comercial**, **Grupo**, Tipo (Nacional/Internacional), Estado, Correo, **Dirección fiscal**, **Ubigeo**, Teléfono, **Celular/WhatsApp**, **Moneda default**, **Condición de pago**, **Días crédito**, **Retención**, **Detracción**, **% detracción**, **Cuenta por pagar [Contabilidad]**, **Código detracción [Tributaria]**. Sub-hojas: **Cuentas Bancarias** (Banco, N° cuenta, Tipo, Moneda, CCI, Es principal) y **Contactos** (varios por proveedor).
→ **Valida y amplía T6**: confirma **Bancos** y **Contactos** como tablas (que en el doc 11 marcamos como faltantes) y agrega **Detracción/% detracción, Cuenta por pagar, Código de detracción, Ubigeo, Nombre comercial, Días crédito**.

### CECOs y CEBEs (`CeCos_Cebes.xlsx`)
- **CECO** (Centro de Costo): jerarquía organizacional por empresa (SB01 Imperiotex/SARA, CN01 Catinna): Gerencia General, Admin/Finanzas (Contabilidad, RRHH, Marketing…), Comercial (tiendas Lima/Provincia: Damero, YA, San Pedro, Paraíso, Encanto, Online, CC, Retail), **Producción/Logística** (Diseño, Corte propio/externo, Confección propio/externo, Lavandería propio/externo, Acabados propio/externo, Logística, Almacén, Ingeniería/PCP, Mantenimiento).
- **CEBE** (Centro de Beneficio): por **Tienda × Producto**. Nomenclatura **Sociedad(4)+Tienda(2)+Producto(3)+Correlativo(2)** (ej. `SB0101PAN00` = San Pedro · Pantalón).
→ **Son nuestras Dimensiones**: **Dimensión 1 = Centro de Costo (CECO)** y **Dimensión 2 = Centro de Beneficio (CEBE)**. Ya tenemos catálogos reales, multiempresa.

### Multiempresa (confirmado)
**SB01 = IMPERIOTEX** (marca SARA BQ, abrev. SB) y **CN01 = CATINNA**. Almacenes, proveedores, CECO y CEBE llevan empresa. ⇒ **`empresa_id` en las tablas** (confirma C.3.8 del doc 12).

## 3. Cómo queda el modelo (revisiones sobre docs 02/06/12)

1. **Nueva entidad `clase_valoracion`** (CV-01..09) que **porta los 28 conceptos → cuenta** (Sábana de Cuentas). Reemplaza "cuentas por Grupo" (revisa T4). Sub-tabla `clase_valoracion_cuenta (cv, concepto_codigo, cuenta)`.
2. **Artículo** gana `clase_valoracion` (derivada de categoría/subcategoría vía la Jerarquía; editable si hace falta).
3. **Dimensiones**: `dimension 1 = CECO`, `dimension 2 = CEBE`, con sus catálogos reales (`centro_costo`, `centro_beneficio`), ambos por empresa.
4. **Proveedor**: agregar detracción/%/código, cuenta por pagar, ubigeo, nombre comercial, días crédito + tablas `banco_proveedor` y `contacto_proveedor`.
5. **Almacén**: reconciliar Tipo físico/Contenido/Categoría/Empresa (ver ⚠️ y preguntas).
6. **`empresa`** como entidad raíz (SB01/CN01) y `empresa_id` transversal.
7. **Plan de cuentas** (`cuenta_contable`) alimentado con los códigos PCGE de la Sábana.

## 4. Lo que todavía FALTA / a confirmar (preguntas)

| # | Pregunta / dato faltante | Para |
|---|---|---|
| Q1 | **Sábana de Cuentas completa**: hoy solo la fila EJEMPLO tiene cuentas; faltan las cuentas por **cada CV/categoría** (A-F). ¿La completará Contabilidad? | Contabilidad |
| Q2 | **Plan de cuentas completo** (catálogo PCGE de la empresa), no solo los códigos de ejemplo. | Contabilidad |
| Q3 | Confirmar **T4 → Clase de Valoración**: ¿movemos los 28 conceptos del "Grupo" a la **Clase de Valoración**? (recomendado) | Nosotros/Contab. |
| Q4 | **Asignación del CV**: ¿siempre se deriva de la categoría/subcategoría (Jerarquía A-F) o se puede fijar por artículo? | Nosotros |
| Q5 | **Almacenes**: ¿el modelo conserva **Tipo físico** y **Contenido** (la plantilla los tiene, la UI los quitó)? ¿"Categoría de almacén" (Común…) qué valores tiene? | Usuario |
| Q6 | **Dimensiones**: ¿solo CECO + CEBE, o hay más (de las 5)? ¿Qué documento lleva cuál (movimientos→CECO; ventas→CEBE)? | Contab./Costos |
| Q7 | **CEBE en el movimiento/venta**: ¿cómo se asigna (tienda + producto en la línea de venta)? | Comercial |
| Q8 | **Detracción/Retención**: reglas y catálogo de **códigos de detracción** SUNAT por proveedor/servicio. | Tributaria |
| Q9 | **Empresas**: ¿solo SB01 (Imperiotex/SARA) y CN01 (Catinna), o habrá más? ¿Comparten plan de cuentas y CV? | Usuario |

## 5. Conclusión
La información del usuario **confirma y precisa** nuestro modelo: los 28 conceptos son la Sábana de Cuentas (ahora keyed por **Clase de Valoración**), las Dimensiones son **CECO + CEBE** (con catálogos reales), y Proveedores/Almacenes se enriquecen. Lo único bloqueante para construir la capa contable sigue siendo **completar la Sábana + el plan de cuentas** (Q1/Q2). Con eso, el modelo de datos queda listo para armarse.
