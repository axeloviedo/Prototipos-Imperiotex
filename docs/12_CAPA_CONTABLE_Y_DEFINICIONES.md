# 12 · Capa contable, Motivo de Traslado / Tipo de Objeto, y definiciones para armar el modelo

> **Diseño para FASE 2 (no se implementa en el prototipo todavía).** Deja el modelo de datos listo para construirlo.
> Complementa `11_REVISION_TABLAS_XLSX.md`. Fecha: 2026-09-09.

---

## A. Motivo de Traslado y Tipo de Objeto (patrón SAP B1)

### A.1 Tipo de Objeto (ObjType)
Cada **tipo de documento** tiene un número estable. Sirve para el **enlace genérico** entre documentos
(`Objeto Base + ID Interno Base + Línea Base`), reemplazando los enlaces ad-hoc actuales (`solKey`, `origenSP`, `ndoc`).

| Documento | Tipo de Objeto (propuesto) |
|---|---|
| Entrada de Inventario | **59** |
| Salida de Inventario | **60** |
| Orden de Fabricación | **202** |
| Orden de Compra | 22 |
| Factura de Compra | 18 |
| Solicitud de Materiales | *(definir, p. ej. 1470)* |
| Solicitud de Pedido de Producción | *(definir)* |
| Transferencia de inventario | 67 |
| Guía de Remisión (GRE) | *(definir)* |

> Los números 59/60/202 vienen del Excel; el resto se define (se pueden reusar los de SAP B1 o numeración propia). Lo esencial: **cada documento lleva su ObjType** y los enlaces usan `(objeto_base, id_interno_base, linea_base)`.

### A.2 Motivo de Traslado (catálogo único — 38 códigos SUNAT)
Razón de **cada** movimiento de inventario. Un solo catálogo (hoja *Motivo de Traslado* del Excel) que:
- **sustenta la GRE** ante SUNAT,
- **determina el concepto contable** (y por tanto la cuenta del Grupo) del movimiento,
- reemplaza las listas de razones dispersas de GI-09/GI-10.

**Tabla `motivo_traslado`**: `codigo (01..99), descripcion, tipo_objeto (59|60), concepto_contable (01..28), afecta_gre (Y/N)`.

### A.3 Mapeo Motivo → Concepto contable (⚠️-6, a confirmar con Contabilidad)
Borrador en `06_MODELO_DATOS_PROTOTIPO.md` §final. Ej.: 02 Compra→03 Cuenta de compra; 10 Salida a producción→13 Consumo MP; 28 Diferencia de inventario (regularización)→25/26; etc. **Falta validarlo con Contabilidad.**

---

## B. Capa contable (FASE 2)

### B.1 Plan de Cuentas — `cuenta_contable`
`codigo, nombre, tipo(activo/pasivo/gasto/ingreso/orden), moneda, requiere_dimension(Y/N), activo`.
Referenciada por: `grupo_cuenta` (los 28 conceptos), `asiento_detalle`, `recurso.cuenta_mayor`, `socio.cuenta_asociada`.

### B.2 Dimensiones / Centros de costo
- **`dimension`** (definición de las 5 dimensiones): `n (1..5), nombre (ej. Centro de Costo, CEPRO, Línea, Proyecto), activa`.
- **`dimension_valor`** (catálogo de valores por dimensión): `dimension_n, codigo (ej. CEPRO01), nombre, activo`.
- Se usan en: **detalle de movimiento** (`dim01..05`), **asiento_detalle** (`dim01..05`), y por defecto en Almacén / Recurso / OF.

### B.3 Asientos — `asiento` + `asiento_detalle`
Generados **automáticamente** desde un movimiento: `motivo → concepto contable → cuenta del Grupo → línea de asiento` (Debe/Haber según Dirección 0/1).

**`asiento`** (cabecera): `id_interno, fecha, glosa, moneda, tc, objeto_base, id_interno_base, estado`.
**`asiento_detalle`**: `linea, cuenta_contable, debe, haber, debe_ME, haber_ME, dim01, dim02, dim03, dim04, dim05, socio (opc), descripcion`.

### B.4 Motor de movimientos (base de los asientos) — `entrada`/`salida` + detalle
Ya documentado (doc `02`/`06`); se completa con lo que exige la capa contable:
- Cabecera: `id_interno, fecha_contab, fecha_doc, tipo_documento, motivo_traslado, comentarios, tipo_objeto (59|60)`.
- Detalle: `linea, articulo(o recurso), tipo_item(I/R), cantidad, precio_unit, almacen, um, cuenta_contable, objeto_base, id_interno_base, linea_base, direccion (0=incrementa|1=disminuye), dim01..05`.
- **Regularización** (no hay tipo Ajuste) → entrada (dir 0) o salida (dir 1) con motivo. **Transferencia** → salida (origen) + entrada (destino).

### B.5 Saldos (vistas/derivados)
- `saldo_almacen` (artículo, almacén, stock_actual) y `saldo_lote` (artículo, lote, almacén, stock, centro_costo): se **derivan** de los movimientos; se pueden materializar por rendimiento. `existencia` (Resumen x Artículo) ya cubre el saldo por almacén con Comprometido/Pedido/Costo.

### B.6 Campos sueltos a incorporar (del Excel)
- `proveedor.cuenta_asociada`, `proveedor` + tablas `banco` y `banco_socio` (cuenta, CCI), `contacto` (tabla, varios por socio).
- `recurso.cuenta_mayor`, `recurso.um`.
- `almacen.centro_costo`.
- `existencia.stock_min`, `existencia.stock_max`.

---

## C. ¿Qué necesitamos DEFINIR para empezar a armar el modelo?

> Lo que ya está decidido está en `00_DECISIONES_CERRADAS.md`. Esto es lo que **falta definir** para construir el esquema.

### C.1 Contabilidad (bloqueante para la capa contable)
1. **Plan de cuentas real** (catálogo de cuentas).
2. **Asignación de los 28 conceptos → cuenta**, por Grupo de Artículo (hoy texto libre en la pestaña Finanzas).
3. **Mapeo Motivo de Traslado → concepto contable** (⚠️-6) + qué motivos afectan GRE.
4. **Dimensiones**: cuántas se usan (de las 5), su significado (Centro de Costo, CEPRO…) y sus catálogos.
5. **Reglas de valorización**: promedio ponderado ✔; definir tratamiento de **importación** (prorrateo de flete/seguro/aduanas) y **TC congelado**; ¿costo por almacén o global?

### C.2 Documentos y numeración
6. **Números de Tipo de Objeto** por cada documento (tabla A.1).
7. **Series y correlativos** por documento/tipo de objeto (continuo vs reinicio anual — la GRE reinicia).

### C.3 Arquitectura / alcance
8. **Multiempresa**: confirmar que cada tabla lleva `empresa_id` (el ERP es multiempresa) y cómo se aísla (ver reglas del repo).
9. **Esquemas por módulo** y contratos: qué vive en logística vs comercial vs producción vs contabilidad, y las FK lógicas cross-schema (coordina con [[rediseno-modelo-articulos-logistica]] y los agentes contract-guard/security).
10. **Identidad del artículo**: alinear el código de artículo del modelo con el maestro del backend (migración en curso en `imperiotex-GestionLogistica`).
11. **Frontera con Producción**: qué tablas son de Producción (Orden de Producción + ejecución) y cuáles de Logística (planeamiento), para no duplicar.

### C.4 Cierres menores ya identificados
12. **⚠️-3**: cabecera de LDM (Tipo Venta/Producción + Almacén).
13. **Bancos/Contactos** (normalizar) y campos sueltos de C.1/B.6.

---

## D. Recomendación de secuencia (Fase 2)
1. Cerrar **C.1** con Contabilidad (plan de cuentas, 28 conceptos, mapeo motivo→concepto, dimensiones, valorización).
2. Fijar **C.2** (Tipos de Objeto + series).
3. Confirmar **C.3** (multiempresa + esquemas + identidad de artículo).
4. Con eso, **armar el ERD/esquema** consolidando: núcleo logístico (ya definido en docs 02/06) + capa contable (B) + patrón Motivo/Tipo de Objeto (A).

> **Estado:** este documento deja el modelo **diseñado y listo**; no se ha modificado ningún prototipo. La construcción del esquema es trabajo de Fase 2, condicionado a las definiciones de la sección C.
