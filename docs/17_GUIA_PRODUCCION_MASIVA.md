# 17 · Guía de prueba: Producción masiva con stock suficiente

> 2026-09-16 · rama `feat/datos-compartidos`. Base compartida: `16_BASE_DATOS_COMPARTIDA.md`. Decisiones: `00_DECISIONES_CERRADAS.md` (J1–J6, T1–T8, K1–K10).
> Objetivo: recorrer paso a paso una producción masiva de **PANTALON WIDE LEG ZULEIKA** pasando por los cuatro módulos, incluida la **compra del servicio de lavado tercerizado**, y ver en cada paso qué cambia en stock, comprometido, pedido y costos.

## 0. Cómo abrir y elegir los datos

1. En la carpeta `PROTOTIPOS`: `python -m http.server 8000` y abrir `http://localhost:8000`.
2. Abrir cada módulo en **su propia pestaña**: Inventarios, Compras, Producción y Comercial. Todos usan la misma base: lo que se registra en una pestaña se ve en las otras (se refrescan solas).
3. En la barra superior de cualquier módulo, **Datos**:
   - **Con operación (movimientos y saldos)** → para probar ya mismo (sección 2).
   - **Solo maestros (empezar de cero)** → para crear todo desde la compra de materia prima (sección 3).
   - **↺ Reiniciar** vuelve los cuatro módulos a los datos iniciales del escenario elegido.

## 1. Qué hay en cada escenario

| | Solo maestros | Con operación |
|---|---|---|
| Maestros (artículos, almacenes, proveedores, LDM, recursos, operarios, clientes, listas) | ✔ | ✔ (los mismos) |
| Stock, movimientos, OC, facturas, solicitudes, órdenes, ventas | vacío | ✔ julio 2026 |
| Materia prima en **SB-ZARATE-MP** para 400 pantalones más | — | ✔ (compra OC-000007/000008 del 01/08, abastecida con ST-000009 el 04/08) |
| Solicitud de Fabricación lista para aprobar | — | **SF-000004** (100 de cada PT, **Pendiente Aprobar**) |
| Historia ya registrada | — | SF-000001 fabricada (lavado tercerizado completo), SF-000002 en curso (la lavandería devolvió 4 prendas menos del negro T28; el negro T30 pasó a Lavandería Ecotex y volvió con 6 prendas falladas), SF-000003 aprobada sin órdenes, ventas y cajas en tiendas, reposición ST-000007 en camino; en Compras, 3 reclamos resueltos (reposición, devolución con nota 07, el faltante de la lavandería con nota 09 y el lavado fallido de Ecotex, cuyo crédito se aplicó a su siguiente factura) y el flete de la tela como costo de destino |

**Familia de trabajo** (2 colores × 2 tallas; el color nace en el lavado, K9): PIEZAS CORTADAS por talla PPT-0001..0002 → CRUDO por talla PPT-0003..0004 → LAVADO tercerizado por color y talla PPT-0005..0008 → PRODUCTO FINAL PT-0001 (azul 28), PT-0002 (azul 30), PT-0003 (negro 28), PT-0004 (negro 30).
**Almacenes**: SB-CENTRAL-MP (compra) → SB-ZARATE-MP (materia prima en planta) → SB-ZARATE-PP (producto en proceso) → SB-TRANSITO (en la lavandería) → SB-CENTRAL (producto terminado) → SB-TIENDA01..05.

## 2. Recorrido con «Con operación» (SF-000004, 400 pantalones)

| # | Módulo · pantalla | Qué hacer | Qué verificar |
|---|---|---|---|
| 1 | Inventarios · **GI-05** Inventario | Filtrar SB-ZARATE-MP. | Hay stock de tela MP-0070, hilos MP-0055/MP-0058, cierre MP-0003, tallitas y avíos; Disponible suficiente. |
| 2 | Inventarios · **GI-21** → **SF-000004** (GI-23) | **Dar V°B° (Logística)** y luego **Aprobar (Gerencia)**. | Estado **Aprobada**. En GI-05 sube el **Comprometido** de la materia prima (p. ej. tela MP-0070 +572 m). |
| 3 | Producción · **PR-03** Solicitudes de Fabricación → SF-000004 | **Crear órdenes**. | 12 órdenes **Liberadas** con un mismo N° Referencia: 2 de piezas cortadas y 2 de crudo (una por talla, 200 cada una: juntan los dos colores), 4 lavados y 4 finales. En Inventarios GI-21 la SF queda **Convertida en Orden**. |
| 4 | Producción · **PR-01** → orden de PIEZAS CORTADAS (PR-02) | **+ Emisión** (tela Manual + horas de patronista y operario de corte con sus operarios) → **Registrar emisión**; luego **+ Recibo** por 200 → **Registrar recibo**; **Cerrar orden**. Repetir en la otra talla. | Movimientos **SAL-USOPROD** (tela) e **ING-PROD** (piezas a SB-ZARATE-PP). En Inventarios GI-06 Kardex de MP-0070 baja el saldo. |
| 5 | Producción · órdenes de CRUDO | Emisión (piezas cortadas + horas de costurera) → Recibo por 200 (consume hilos, cierre y tallita por notificación) → Cerrar. Repetir en la otra talla. | Crudos PPT-0003..0004 en SB-ZARATE-PP (sin color: cada lavado toma los de su talla); costo unitario acumulado visible en la pestaña Costo. |
| 6 | Producción · orden de LAVADO (PR-02) | **Pedir servicio**. | Se crea una **Solicitud de Materiales** de Producción con la línea **SRV-0001 × 100**, destino SB-TRANSITO, estado **Pendiente**. |
| 7 | Inventarios · **GI-13** → esa solicitud | **Atender ▾**: propósito **Compra** → **Aprobar**; **Crear ▾ → Crear Orden de Compra** eligiendo **PROV-0005 LAVANDERIA LANDEO**. | Se abre CO-07 con la **OC de servicio** en Borrador (3,50 por prenda). La línea de la solicitud queda **En compra**. |
| 8 | Compras · **CO-07** esa OC | **Enviar a validación** → **Validar (Logística)** → **Aprobar (Gerencia)**. | Estado **Para Recibir y Pagar**. En Producción, pestaña **Costo** de la orden de lavado aparece la OC. |
| 9 | Producción · orden de LAVADO | **Enviar al proveedor** (cantidad 100). | **Solicitud de Transferencia** TRF-FABRIC SB-ZARATE-PP → SB-TRANSITO recibida en el momento y **guía T001-…** «Traslado de bienes para transformación». Se ve en Inventarios GI-11, GI-07 y GI-14. |
| 10 | Producción · orden de LAVADO | Retorno: **+ Emisión** (crudo en tránsito, **SAL-MAQUILA**) → **+ Recibo** por 100 (consume el servicio, **ING-PROD** a SB-ZARATE-PP) → **Cerrar orden**. | Lavados PPT-0005..0008 en SB-ZARATE-PP; costo incluye 3,50 del servicio. |
| 11 | Compras · CO-07 la OC de servicio → **Conformidad del servicio**; **CO-09 + Registrar Factura** desde la OC (número del proveedor) | | OC **Completada**; la solicitud de materiales **Atendida**; en la pestaña Costo de la orden: estándar vs OC vs factura. |
| 12 | Repetir 6–11 para los otros 3 lavados | (una solicitud y una OC de servicio por orden) | |
| 13 | Producción · órdenes de PRODUCTO FINAL | Emisión (lavado Manual + horas de acabado) → Recibo por 100 (consume botón, 6 remaches, parche, etiqueta, hang tag y bolsa) → Cerrar. Repetir en las 4. | PT-0001..0004 +100 cada uno en **SB-CENTRAL** (costo unitario ≈ S/ 44). La SF queda **Fabricada** (Producción PR-03 e Inventarios GI-21). PR-09 Costos por N° Referencia. |
| 14 | Inventarios · GI-11 **+ Transferencia** SB-CENTRAL → SB-TIENDA01 (TRF-REPTIENDA) | **Aprobar Transferencia** (compromete en central, **Pedido** en tienda) → **Confirmar Recepción** (parcial o total). | GI-05: Pedido en la tienda hasta confirmar; luego el stock pasa a la tienda. |
| 15 | Comercial · Ventas (tienda 1) | Vender PT-0001 y cobrar. | Venta pendiente compromete; al validar el pago completo sale el stock (**SAL-VENTA**). Visible en Inventarios GI-07 y en CL-32. |

**Resultado verificado (prueba automática del 17/09/2026 sobre este mismo recorrido):** 12 órdenes cerradas, 4 OC de servicio Completadas con factura, 4 solicitudes Atendidas, SF-000004 Fabricada, PT en SB-CENTRAL: PT-0001 128, PT-0002 118, PT-0003 108, PT-0004 100 (costos S/ 44,13 – 45,30: incluyen el flete de la tela), ningún stock, comprometido ni pedido negativo; los cuatro módulos muestran lo mismo.

## 3. Recorrido desde «Solo maestros»

Antes del paso 2 de la sección anterior hay que tener materia prima en planta:

| # | Módulo · pantalla | Qué hacer | Qué verificar |
|---|---|---|---|
| A | Compras · **CO-06 → + Agregar OC** | Proveedor **PROV-0001 TEXTIL SAN JACINTO** con la tela MP-0070; otra OC a **PROV-0002 AVÍOS DEL SUR** con hilos MP-0055/MP-0058, cierre MP-0003, tallitas y avíos MP-0102..0107. Almacén destino SB-CENTRAL-MP. **Guardar borrador → Enviar a validación → Validar (Logística) → Aprobar (Gerencia)**. | Estado Para Recibir y Pagar; en Inventarios GI-05 aparece **Pedido** en SB-CENTRAL-MP. |
| B | Compras · CO-07 **Registrar ingreso** (o Inventarios GI-09 vinculando la OC) | Recibir todo en SB-CENTRAL-MP. | Movimiento **ING-COMPRA**; el Pedido baja y sube el Actual. |
| C | Compras · **CO-09 + Registrar Factura** | Desde cada OC. | OC Completada. |
| D | Inventarios · **GI-11 + Transferencia** SB-CENTRAL-MP → SB-ZARATE-MP (TRF-INTERNO) | Agregar lo comprado → **Aprobar Transferencia** → al día siguiente **Confirmar Recepción**. Opcional: guía en GI-15. | Comprometido en central y Pedido en Zárate hasta confirmar; luego stock en SB-ZARATE-MP. |
| E | Comercial · **CL-30** (o Inventarios **GI-22**) | **+ Nueva Solicitud de Fabricación**: PT-0001..0004 con cantidades, almacén destino SB-CENTRAL → **Enviar a revisión**. | Queda **Pendiente Aprobar**. Continuar con el paso 2 de la sección 2. |

Cantidades orientativas de materia prima por 100 pantalones de un color y talla: tela 140 m (talla 28) o 146 m (talla 30); 5 conos de cada hilo; 100 cierres; 100 tallitas; 100 botones; 600 remaches; 100 parches, etiquetas, hang tags y bolsas.

## 4. Reglas que se ven en el recorrido

- **Comprometido** (T7): sube al aprobarse la Solicitud de Fabricación; al crear las órdenes pasa de la solicitud a cada orden; se consume al emitir o recibir.
- **Pedido** (T1): OC de bienes aprobada y Solicitud de Transferencia aprobada; es informativo (Disponible = Actual − Comprometido).
- **Transferencia en dos pasos** (T2/T7): aprobar compromete en origen; confirmar la recepción mueve. Excepción: envío al proveedor del servicio (almacén de tránsito virtual).
- **Sin tipo Ajuste** (J1): regularizar = ING-REGULARIZ / SAL-REGULARIZ con motivo. **Producto fallado** (J2) = SAL-FALLADO + ING-FALLADO (artículos «… FALLADO» de crudo y lavado).
- **Tercerización en la orden** (J3): la compra del servicio es una OC de servicio normal que nace de la solicitud de materiales; su OC y factura se contrastan con el costo estándar en la pestaña Costo de la orden.

## 5. Casos de uso que salen de aquí (para detallar después)

1. Materia prima insuficiente al emitir → solicitud de materiales por faltantes → Logística transfiere o compra.
2. Recepción parcial de la OC de materia prima y de la transferencia a planta.
3. Lavado con prendas falladas → SAL-FALLADO + ING-FALLADO y orden de reproceso.
4. Factura del servicio distinta al estándar o a la OC → nota de crédito.
5. Solicitud de Fabricación rechazada o devuelta para modificar.
6. Cambio de lavandería en la orden (Tercerizar / Cambiar servicio) antes de enviar.
7. Reposición a tiendas en dos pasos y venta con pago parcial (stock comprometido hasta el pago completo).

## 4. Caso especial: lavado fallido con crédito del proveedor (Ecotex)

Ya registrado en «Con operación». Sirve para ver cómo se conectan Producción, Compras y el saldo a favor.

| # | Dónde mirarlo | Qué pasó | Qué verificar |
|---|---|---|---|
| 1 | Producción · **OF-000016** (lavado negro talla 30) | El servicio se cambió a **SRV-0002 Lavandería Ecotex** («Tercerizar / Cambiar servicio»); se enviaron las 16 prendas de crudo que había. | Pestaña Costo: OC-000006 de Ecotex, su factura y la nota de crédito en negativo. |
| 2 | Producción · misma orden · Recibos e Inventarios · GI-05 | Volvieron las 16; **6 con manchas** se reclasificaron como producto fallado (SAL-FALLADO + ING-FALLADO, J2). | SB-ZARATE-PP: 10 de PPT-0008 y 6 de **PPT-0008F** al mismo costo. |
| 3 | Compras · CO-10 **F003-000101** | Ecotex facturó las 16 y la factura **se pagó**. | Estado Pagado. |
| 4 | Compras · CO-11 **reclamo de Ecotex** | «Servicio mal ejecutado» por 6. Un servicio no se devuelve: se resuelve con **nota de crédito**. | Resuelto; la línea muestra NC-000003. |
| 5 | Compras · CO-12 **NC-000003** (NC03-000007, motivo 09) | Como la factura ya estaba pagada, el crédito quedó como **saldo a favor** (S/ 26,90). | «Se aplica a: Saldo a favor · usado en F003-000115 · queda 0,00». |
| 6 | Compras · CO-10 **F003-000115** (lavado de muestras) | La siguiente factura de Ecotex **usó el saldo a favor**. | «Saldo a favor aplicado NC-000003 · S/ 26,90 · queda por pagar S/ 17,94». |

Para repetirlo a mano desde «Solo maestros» o con otra factura: en CO-12 registre una nota de crédito sobre una factura **ya pagada** (queda como saldo a favor) y luego abra en CO-10 una factura **impaga** del mismo proveedor: aparece el aviso y el botón **«Aplicar saldo a favor a esta factura»**.

