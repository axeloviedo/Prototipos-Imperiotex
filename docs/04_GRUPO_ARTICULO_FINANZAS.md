# 04 · Grupo de Artículo — Pestaña Finanzas

> Referencia SAP B1: *Item Group → Set G/L Accounts By* (determinación de cuentas por grupo).
> El "Grupo de Artículo" (antes "Tipo de Artículo") gana una pestaña **Finanzas** con un listado
> de movimientos/conceptos contables. Cada concepto se **vincula a una cuenta contable** y tiene
> un **código numérico** propio y estable.

## Estructura

- **Grupo de Artículo** = ficha con pestañas: **General** (código, nombre, prefijo, asignación de código) + **Finanzas**.
- **Finanzas** = tabla `Concepto contable → Cuenta contable`.
- Un solo nivel: la cuenta se define por Grupo (decisión T4). El artículo la hereda de su grupo.

## Catálogo de conceptos contables (código numérico estable)

| Código | Concepto contable | Cuenta contable |
|---|---|---|
| 01 | Cuenta de existencias | *(a configurar)* |
| 02 | Existencias por recibir / en tránsito | *(a configurar)* |
| 03 | Cuenta de compra | *(a configurar)* |
| 04 | Variación de existencias | *(a configurar)* |
| 05 | Costo vinculado - flete | *(a configurar)* |
| 06 | Costo vinculado - seguro | *(a configurar)* |
| 07 | Costo vinculado - derechos aduaneros | *(a configurar)* |
| 08 | Costo vinculado - agente de aduanas / comisiones | *(a configurar)* |
| 09 | Costo vinculado - otros | *(a configurar)* |
| 10 | Mercadería recibida por facturar | *(a configurar)* |
| 11 | Devolución / cambio a proveedor | *(a configurar)* |
| 12 | Nota de crédito de proveedor | *(a configurar)* |
| 13 | Consumo de materia prima a la orden | *(a configurar)* |
| 14 | Envío a servicio de terceros (tránsito) | *(a configurar)* |
| 15 | Retorno de servicio de terceros | *(a configurar)* |
| 16 | Ingreso de producto en proceso | *(a configurar)* |
| 17 | Ingreso de producto terminado | *(a configurar)* |
| 18 | Ingreso por cancelación de servicio | *(a configurar)* |
| 19 | Registro de merma | *(a configurar)* |
| 20 | Ingreso por venta | *(a configurar)* |
| 21 | Costo de ventas | *(a configurar)* |
| 22 | Descuentos concedidos | *(a configurar)* |
| 23 | Devolución de cliente / cambio de prenda | *(a configurar)* |
| 24 | Venta o entrega a personal | *(a configurar)* |
| 25 | Regularización por sobrante de inventario | *(a configurar)* |
| 26 | Regularización por faltante de inventario | *(a configurar)* |
| 27 | Carga inicial de stock | *(a configurar)* |
| 28 | Transferencia entre almacenes | *(a configurar)* |

> El código numérico es el identificador estable del concepto (no cambia aunque cambie el nombre o la cuenta).
> Cada movimiento de inventario (entrada/salida) que impacte contabilidad referenciará el concepto por su código
> para saber qué cuenta usar del grupo del artículo.

## Notas de implementación

- En el prototipo, la pestaña Finanzas se renderiza como una tabla editable (concepto fijo, cuenta seleccionable o texto).
- La lista de conceptos es **fija** (catálogo de 28); no se agregan/quitan filas, solo se asigna la cuenta a cada uno.
- Modelo de datos real (más adelante): `grupo_articulo_cuenta (grupo_id, concepto_codigo, cuenta_id)`.
