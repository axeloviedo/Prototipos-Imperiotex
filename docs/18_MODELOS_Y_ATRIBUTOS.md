# 18 · Modelos y atributos (decisiones U1–U7, 2026-09-19)

Rama `feat/modelos-atributos`. Adapta al prototipo la propuesta «Modelos, Productos y Atributos» (patrón configurable/simple de Magento, parent/child de Amazon, product/variant de Shopify) con las decisiones del usuario:

1. El modelo sirve para **cualquier tipo de artículo** y **no afecta el flujo**.
2. **Opción A**: la plantilla del modelo lleva **todos** los atributos de sus artículos.
3. **Se respeta el nombre del artículo**; los atributos del modelo son **solo para ordenar**.

## 1. Equivalencias

| Propuesta | Prototipo | Nota |
|---|---|---|
| producto | **artículo** (`maestros.articulos`, código = SKU) | Ya era «una cosa concreta con un valor por atributo», con precio y stock propios. |
| modelo | **modelo** (`maestros.modelos`, `MOD-0001`) | Nuevo. Opcional (`articulo.modelo`). No se vende ni se mueve. |
| atributo / valor | `maestros.atributos` `{nom, vals[]}` | Se guardan por nombre; el orden de `vals` es la posición del valor. |
| modelo_attributes (plantilla + orden) | `modelo.attrs` (lista ordenada) | Opción A: todos los atributos de sus artículos. |
| product_values | `articulo.attrs` `{atributo: valor}` | Un valor por atributo por construcción (objeto). |
| combination_key | `BD.combinacion(attrs, modelo)` | Se **calcula**, no se guarda: `Color:AZUL\|Talla:28\|…` en el orden de la plantilla. |
| default_product_id | `modelo.pred` | Opcional; debe ser un artículo del modelo. |
| title autogenerado | — | **No** (U5): el nombre del artículo se respeta. «Generar combinaciones» solo sugiere el nombre de los nuevos. |
| products.stock | — | El stock sigue por artículo **y almacén** (`BD.d.stock`). |
| images, selector de tienda | — | Fuera de alcance (U6). |

## 2. Reglas y dónde se validan

| Regla | Prototipo | Desarrollo (sugerido) |
|---|---|---|
| El valor pertenece a su atributo (con o sin modelo) | `BD.erroresArticuloModelo` (GI-02, GI-26); el maestro no deja quitar un valor en uso; renombrar un atributo lo actualiza en artículos y plantillas | FK compuesta `(value_id, attribute_id) → attribute_values(id, attribute_id)` |
| Un solo valor por atributo | objeto `attrs` | UQ `(article_id, attribute_id)` |
| Con modelo: todos los atributos de la plantilla, ninguno ajeno | `BD.erroresArticuloModelo` | API al guardar (depende de `model_attribute`) |
| Sin combinaciones repetidas en un modelo | `BD.erroresArticuloModelo` y la tabla de GI-26 (marca en rojo) | UQ `(model_id, combination_key)` |
| El preseleccionado es del modelo | `BD.revisarModelos` | FK + API |
| Revisión de toda la base | `BD.revisarModelos()`: la corre `generar-escenario.js` (falla si hay errores) y `INVENTARIOS/pruebas/probar-modelos.js` | — |

### SQL de referencia para el desarrollo

A ajustar al maestro de artículos real (el usuario lo rehará; `article_model` se retiró en la V16 por M1 y este modelo **no** vuelve a llevar la LDM):

```sql
CREATE TABLE attribute_value (
  id BIGINT PRIMARY KEY, id_attribute BIGINT NOT NULL, name VARCHAR(80) NOT NULL, position INT NOT NULL,
  UNIQUE KEY uq_attribute_value_name (id_attribute, name),
  UNIQUE KEY uq_value_attribute (id, id_attribute),               -- destino de la FK compuesta
  FOREIGN KEY (id_attribute) REFERENCES attribute (id));
CREATE TABLE model (
  id BIGINT PRIMARY KEY, code VARCHAR(20) UNIQUE, name VARCHAR(150) UNIQUE, description TEXT,
  id_default_article BIGINT NULL, status VARCHAR(10) NOT NULL);   -- se desactiva, no se borra
CREATE TABLE model_attribute (
  id_model BIGINT, id_attribute BIGINT, position INT NOT NULL,
  PRIMARY KEY (id_model, id_attribute), FOREIGN KEY (id_model) REFERENCES model (id), FOREIGN KEY (id_attribute) REFERENCES attribute (id));
ALTER TABLE article ADD id_model BIGINT NULL, ADD combination_key VARCHAR(255) NULL,
  ADD UNIQUE KEY uq_article_model_combination (id_model, combination_key), ADD FOREIGN KEY (id_model) REFERENCES model (id);
CREATE TABLE article_attribute_value (
  id_article BIGINT, id_attribute BIGINT, id_value BIGINT,
  PRIMARY KEY (id_article, id_attribute),
  FOREIGN KEY (id_article) REFERENCES article (id), FOREIGN KEY (id_attribute) REFERENCES attribute (id),
  FOREIGN KEY (id_value, id_attribute) REFERENCES attribute_value (id, id_attribute));
```

## 3. Pantallas

- **GI-25 Modelos** (Inventarios → Maestros → Modelos; también en el menú de Compras): código, nombre, plantilla, cantidad de artículos, preseleccionado y estado.
- **GI-26 Modelo**: nombre, descripción, preseleccionado; **plantilla** (solo los atributos, sin listar sus valores, U7) con ↑↓ / quitar y **+ Agregar atributo**, que abre un modal con todos los atributos (los que ya están salen marcados y bloqueados; si están todos, el modal se abre igual con «Agregar» inactivo) (avisa si al guardar se quitará un atributo a sus artículos); **artículos del modelo** con los valores editables; **+ Agregar artículo existente** (solo los que no tienen modelo); **⚙ Generar combinaciones**: se marcan los valores de cada atributo, se elige un artículo base (copia grupo, categoría, UM, precios, impuestos y usos; no copia códigos de barras ni LDM) y se crean las combinaciones que faltan con el código del grupo y un nombre sugerido editable. Desactivar / Activar.
- **GI-02**: campo **Modelo** en General. Con modelo, la pestaña Atributos muestra la plantilla fija (sin agregar ni quitar filas); todos obligatorios. Duplicar un artículo con modelo propone el mismo modelo con los valores vacíos.
- **GI-01**: columna y filtro de Modelo.
- **Configuraciones → Atributos**: valores con orden ↑↓ y cuántos artículos usan cada uno; no se quita un valor en uso.

## 4. Datos

| Modelo | Plantilla | Artículos |
|---|---|---|
| MOD-0001 PANTALON WIDE LEG ZULEIKA | 1° Color · 2° Talla · 3° Material · 4° Género | PT-0001..0004 (preseleccionado PT-0001) |

**U7:** por ahora piezas cortadas, crudo y lavado (PPT-0001..0008) quedan **sin modelo**, y los atributos son solo **Color, Talla, Material y Género**: se quitaron «Acabado» (la etapa ya la dicen la sub categoría y el nombre) y «Composición» (sin valores), que venían en la plantilla Excel, y «Estado» (los fallados PPT-0003F..0008F se reconocen por su código y su nombre; también quedan **sin modelo**). La base sube a `VERSION` 8 (al abrir, cada navegador se reinicia con el escenario elegido); el escenario «Con operación» se regeneró y su operación no cambió (solo maestros: atributos, modelos y los atributos y el campo `modelo` de los artículos ZULEIKA).

## 5. Impacto por módulo

| Módulo | Cambio |
|---|---|
| COMPARTIDO/bd | `modelos`, `articulo.modelo`, atributos Color/Talla/Material/Género, reglas y revisión en `bd.js`, `VERSION` 8, migración que agrega `modelos: []` |
| INVENTARIOS | GI-25/26, GI-01/02, maestro de Atributos |
| COMPRAS | Menú Modelos (mismas pantallas de Inventarios) |
| PRODUCCION / COMERCIAL | Solo el orden en que el buscador muestra los atributos. Stock, LDM, órdenes, precios, listas y ventas **no cambian** |

Pendiente, a decidir: captura por matriz Color × Talla en ventas, SF u OC; e incluir la pantalla GI-25/26 en la matriz de permisos.
