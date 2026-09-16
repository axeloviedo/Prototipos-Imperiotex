/* INVENTARIOS · Maestros de configuración (grupos, categorías, UM, atributos, sedes) y su CRUD genérico — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== MAESTROS (CRUD simples) -->
  <section class="screen" id="scr-mtipos">
    <div class="screen-head"><h1>Grupos de Artículo</h1><span class="code">MST</span><div class="spacer"></div><button class="btn btn-primary" onclick="grupoOpen(-1)">+ Crear</button></div>
    <div class="tbl-wrap"><table class="grid"><thead id="mst-tipos-h"></thead><tbody id="mst-tipos-b"></tbody></table></div>
    <p class="hint">El prefijo se usa para armar el código del artículo. La asignación define cómo se numera: <b>Interna</b> (el sistema autogenera) o <b>Externa</b> (el usuario ingresa un código único). <b>Las cuentas contables se configuran en la pestaña Finanzas de cada grupo</b> (28 conceptos contables, cada uno vinculado a una cuenta): todos los artículos del grupo comparten esas cuentas y el artículo no las lleva. El grupo <b>OFERTAS</b> queda planteado como ejemplo <span class="warn" title="Concepto anotado en la reunión del 11-ago pero todavía sin definir: confirmar si una oferta es un grupo de artículo, un combo de varios artículos o un precio promocional">⚠</span>. Los códigos mostrados son solo para diferenciar, no son los definitivos.</p>
  </section>

  <section class="screen" id="scr-mcat">
    <div class="screen-head"><h1>Categorías</h1><span class="code">MST</span><div class="spacer"></div><button class="btn btn-primary" onclick="mstAdd('cat')">+ Crear</button></div>
    <div class="tbl-wrap"><table class="grid"><thead id="mst-cat-h"></thead><tbody id="mst-cat-b"></tbody></table></div>
    <p class="hint">El código de la categoría (<b>CAT-####</b>) es propio de este maestro y no tiene relación con el código del artículo: son numeraciones independientes. Cada categoría cuelga de un grupo de artículo. Es opcional en el artículo.</p>
  </section>

  <section class="screen" id="scr-msub">
    <div class="screen-head"><h1>Sub categorías</h1><span class="code">MST</span><div class="spacer"></div><button class="btn btn-primary" onclick="mstAdd('sub')">+ Crear</button></div>
    <div class="tbl-wrap"><table class="grid"><thead id="mst-sub-h"></thead><tbody id="mst-sub-b"></tbody></table></div>
    <p class="hint">El código de la sub categoría (<b>SUB-####</b>) es propio de este maestro y no choca con el del artículo ni con el de la categoría. Cada sub categoría cuelga de una categoría. Es opcional en el artículo.</p>
  </section>

  <section class="screen" id="scr-mum">
    <div class="screen-head"><h1>Unidades de Medida</h1><span class="code">MST</span><div class="spacer"></div><button class="btn btn-primary" onclick="mstAdd('um')">+ Crear</button></div>
    <div class="tbl-wrap"><table class="grid"><thead id="mst-um-h"></thead><tbody id="mst-um-b"></tbody></table></div>
    <p class="hint">Maestro de unidades usado por Venta, Compra e Inventario. La unidad de Inventario es la base para trabajar todo el stock.</p>
  </section>

  <section class="screen" id="scr-mconv">
    <div class="screen-head"><h1>Conversiones de Unidades de Medida</h1><span class="code">MST</span><div class="spacer"></div><button class="btn btn-primary" onclick="mstAdd('conv')">+ Crear</button></div>
    <div class="tbl-wrap"><table class="grid"><thead id="mst-conv-h"></thead><tbody id="mst-conv-b"></tbody></table></div>
    <p class="hint">1 unidad "De" equivale a "Factor" unidades "A". Con estas equivalencias el sistema convierte entre la unidad de venta/compra y la de inventario.</p>
  </section>

  <section class="screen" id="scr-matr">
    <div class="screen-head"><h1>Atributos</h1><span class="code">MST</span><div class="spacer"></div><button class="btn btn-primary" onclick="mstAdd('atr')">+ Crear</button></div>
    <div class="tbl-wrap"><table class="grid"><thead id="mst-atr-h"></thead><tbody id="mst-atr-b"></tbody></table></div>
    <p class="hint">Cada atributo (Color, Talla, Material…) tiene sus valores. Los artículos pueden usarlos de forma opcional en su pestaña Atributos.</p>
  </section>

  <section class="screen" id="scr-mbc">
    <div class="screen-head"><h1>Tipos de Código de Barra</h1><span class="code">MST</span><div class="spacer"></div><button class="btn btn-primary" onclick="mstAdd('bc')">+ Crear</button></div>
    <div class="tbl-wrap"><table class="grid"><thead id="mst-bc-h"></thead><tbody id="mst-bc-b"></tbody></table></div>
    <p class="hint">Catálogo configurable de tipos de código de barra que se pueden asignar a un artículo (GTIN, código interno, proveedor, cliente, legado…).</p>
  </section>

  <section class="screen" id="scr-msede">
    <div class="screen-head"><h1>Sedes</h1><span class="code">MST</span><div class="spacer"></div><button class="btn btn-primary" onclick="mstAdd('sede')">+ Crear</button></div>
    <div class="tbl-wrap"><table class="grid"><thead id="mst-sede-h"></thead><tbody id="mst-sede-b"></tbody></table></div>
    <p class="hint">Establecimientos de la empresa. Cada almacén pertenece a una sede.</p>
  </section>
`);

Vistas.modales(String.raw`
<!-- Modal CRUD genérico (crear / editar cualquier maestro) -->
<div class="overlay" id="m-crud">
  <div class="modal">
    <div class="modal-h"><b id="crud-title">Nuevo registro</b><span class="code" id="crud-code" style="font-size:11px;color:var(--texto-sec)">CRUD</span><span class="x" onclick="closeModal('m-crud')">✕</span></div>
    <div class="modal-b">
      <div class="formgrid" id="crud-body" style="grid-template-columns:1fr"></div>
      <p class="hint" id="crud-hint" style="margin-top:10px"></p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-crud')">Cancelar</button><button class="btn btn-primary" onclick="crudSave()">Guardar</button></div>
  </div>
</div>

<!-- Modal confirmación de eliminación genérico -->
<div class="overlay" id="m-crud-del">
  <div class="modal">
    <div class="modal-h"><b>Eliminar registro</b><span class="x" onclick="closeModal('m-crud-del')">✕</span></div>
    <div class="modal-b">
      <p>¿Está seguro de eliminar <b id="crud-del-name">—</b>?</p>
      <p class="hint" style="margin-top:8px">Esta acción quita el registro del maestro. En producción se validaría que no esté en uso por artículos o documentos.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-crud-del')">Cancelar</button><button class="btn btn-danger" onclick="crudDel()">Eliminar</button></div>
  </div>
</div>

<!-- Valores de un atributo -->
<div class="overlay" id="m-attrval">
  <div class="modal">
    <div class="modal-h"><b id="attrval-title">Valores del atributo</b><span class="code" style="font-size:11px;color:var(--texto-sec)">MST</span><span class="x" onclick="closeModal('m-attrval')">✕</span></div>
    <div class="modal-b">
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input id="attrval-input" placeholder="Nuevo valor (ej. AZUL)" style="flex:1;border:1px solid var(--borde);border-radius:6px;padding:7px 10px;font-size:13px" onkeydown="if(event.key==='Enter')attrValAdd()">
        <button class="btn btn-primary btn-sm" onclick="attrValAdd()">Agregar</button>
      </div>
      <table class="grid subtable">
        <thead><tr><th>Valor</th><th style="width:80px"></th></tr></thead>
        <tbody id="attrval-body"></tbody>
      </table>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-attrval')">Cerrar</button></div>
  </div>
</div>
`);
