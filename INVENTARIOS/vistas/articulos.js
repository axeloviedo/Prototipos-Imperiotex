/* INVENTARIOS · GI-01 Artículos y GI-02 ficha del artículo (maestro completo de la base compartida) — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-01 · Artículos Lista -->
  <section class="screen" id="scr-gi01">
    <div class="screen-head">
      <h1>Artículos</h1><span class="code">GI-01</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="openArticleForm('')">+ Nuevo Artículo</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (código / nombre)</label><input placeholder="Ej. PT-0001, DENIM…" oninput="renderArt()" id="f-art-q"></div>
        <div class="field"><label>Grupo de Artículo</label><select id="f-art-g" onchange="fillArtCatFiltro();renderArt()"><option value="">Todos</option></select></div>
        <div class="field"><label>Categoría</label><select id="f-art-sg" onchange="renderArt()"><option value="">Todas</option></select></div>
        <div class="field"><label>Uso</label><select id="f-art-uso" onchange="renderArt()"><option value="">Todos</option><option value="compra">Se compra</option><option value="venta">Se vende</option><option value="produccion">Producción</option></select></div>
        <div class="field"><label>Estado</label><select id="f-art-e" onchange="renderArt()"><option value="">Todos</option><option>Activo</option><option>Inactivo</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid" id="tbl-art">
        <thead><tr><th>Código</th><th>Nombre</th><th>Grupo</th><th>Categoría</th><th>Estado</th><th>UM Inventario</th><th>Inventariable</th><th style="text-align:right">Stock actual</th><th style="width:200px">Acciones</th></tr></thead>
        <tbody></tbody>
      </table>
      <div class="pager"><span id="art-count"></span></div>
    </div>
    <p class="hint">Maestro de la base compartida: 101 materias primas y 17 servicios de la plantilla, más los avíos y la familia ZULEIKA (piezas PPT-0001..0004, crudo PPT-0005..0008, lavado PPT-0009..0012 y producto final PT-0001..0004). Cada nombre es único. Para crear artículos parecidos use <b>Duplicar</b>. Stock actual = suma de todos los almacenes.</p>
  </section>

  <!-- ==================================================== GI-02 · Artículo Formulario -->
  <section class="screen" id="scr-gi02">
    <div class="screen-head">
      <h1 id="gi02-title">Nuevo Artículo</h1><span class="code">GI-02</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" id="gi02-b-dup" onclick="duplicarArticulo()">⧉ Duplicar</button>
      <button class="btn btn-danger" id="gi02-b-des" onclick="pedirDesactivar(ART_ACTUAL)">Desactivar</button>
      <button class="btn btn-secondary" onclick="go('gi01')">Cancelar</button>
      <button class="btn btn-primary" onclick="guardarArticulo()">Guardar</button>
    </div>

    <div class="doc-head">
      <div><div class="t" id="gi02-name">ARTÍCULO NUEVO</div><div class="meta">Código: <span id="gi02-code">(auto)</span> · Grupo: <span id="gi02-grupo-meta">-</span></div></div>
      <div class="spacer" style="flex:1"></div>
      <span id="gi02-flags" style="display:flex;gap:6px;margin-right:10px"></span>
      <span id="gi02-estado" class="badge" style="background:var(--confirmado)">Activo</span>
    </div>

    <div class="card">
      <p class="leyenda-req"><i></i> Los campos resaltados son obligatorios.</p>
      <div class="tabs" id="gi02-tabs">
        <div class="tab active" data-t="general" onclick="tab(this)">General</div>
        <div class="tab" data-t="inv" id="tab-inv" onclick="tab(this)">Inventario</div>
        <div class="tab" data-t="plan" id="tab-plan" onclick="tab(this)">Planificación de Stock</div>
        <div class="tab" data-t="venta" id="tab-venta" onclick="tab(this)">Venta</div>
        <div class="tab" data-t="compra" id="tab-compra" onclick="tab(this)">Compra</div>
        <div class="tab" data-t="imp" onclick="tab(this)">Impuestos</div>
        <div class="tab" data-t="manu" id="tab-manu" onclick="tab(this)">Producción</div>
        <div class="tab" data-t="atr" id="tab-atr" onclick="tab(this)">Atributos</div>
        <div class="tab" data-t="exist" id="tab-exist" onclick="tab(this)">Existencias</div>
      </div>

      <!-- General -->
      <div class="tabpane active" id="pane-general">
        <div class="formgrid">
          <div class="field req"><label>Grupo de Artículo</label>
            <select id="sel-grupo" onchange="applyGrupo(this.value)"></select></div>
          <div class="field req"><label id="lbl-codigo">Código (auto · asignación interna)</label>
            <input id="inp-codigo" readonly></div>
          <div class="field"><label>Categoría (opcional · hija del grupo)</label>
            <select id="sel-subgrupo" onchange="fillSubcat();refreshCV()"><option value=""></option></select></div>
          <div class="field"><label>Sub categoría (opcional · hija de la categoría)</label>
            <select id="sel-subsubgrupo"><option value=""></option></select></div>
          <div class="field full req"><label>Nombre <span class="hint">(único e irrepetible)</span></label>
            <input id="inp-nombre" placeholder="Nombre del artículo" oninput="document.getElementById('gi02-name').textContent=this.value||'ARTÍCULO NUEVO'"></div>
          <div class="field full"><label>Descripción</label><textarea id="inp-desc" rows="2"></textarea></div>
          <div class="field"><label>Estado</label>
            <select id="sel-estado" onchange="refreshTitle()"><option>Activo</option><option>Inactivo</option></select></div>
        </div>
        <div style="margin-top:16px;border-top:1px solid var(--borde);padding-top:14px">
          <b style="font-size:13px">¿Para qué se usa este artículo?</b>
          <p class="hint" style="margin-top:4px">Un artículo puede ser de varias cosas a la vez; los servicios (SRV) no son inventariables y solo se compran.</p>
          <div style="display:flex;gap:26px;flex-wrap:wrap;margin-top:10px">
            <div class="check"><input type="checkbox" checked id="chk-invble" onchange="refreshTitle()"> Es inventariable</div>
            <div class="check"><input type="checkbox" id="chk-venta" onchange="refreshTitle()"> Se vende</div>
            <div class="check"><input type="checkbox" id="chk-compra" onchange="refreshTitle()"> Se compra</div>
            <div class="check"><input type="checkbox" id="chk-manu" onchange="refreshTitle()"> Producción <span class="hint">(componente o producto de una lista de materiales)</span></div>
          </div>
        </div>
      </div>

      <!-- Planificación de Stock -->
      <div class="tabpane" id="pane-plan">
        <b style="font-size:13px">Stock mínimo por almacén</b>
        <p class="hint" style="margin-top:4px">Origen del semáforo de Existencias (GI-05): por agotarse cuando el disponible es menor o igual al mínimo. La unidad es la de inventario.</p>
        <table class="grid subtable" style="margin-top:10px">
          <thead><tr><th>Almacén</th><th style="width:160px">Cantidad mínima</th><th style="width:120px">Unidad</th><th style="width:70px"></th></tr></thead>
          <tbody id="plan-body"></tbody>
        </table>
        <button class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="addPlanRow()">+ Agregar mínimo</button>
      </div>

      <!-- Inventario -->
      <div class="tabpane" id="pane-inv">
        <div class="formgrid">
          <div class="field req"><label>Unidad de Medida de Inventario <span class="hint">(base para todo el stock)</span></label>
            <select id="sel-um-inv" onchange="syncUMInv()"></select></div>
          <div class="field"><label>Control de inventario</label>
            <select id="sel-ctrl"><option>Nada</option><option>Lote</option><option>Serie</option></select></div>
          <div class="field"><label>Clase de valoración</label><select id="sel-cv"></select></div>
          <div class="field"><label>Valorización</label><input value="Promedio ponderado por almacén" readonly></div>
          <div class="field"><label>Almacén por defecto <span class="hint">(donde entra lo producido)</span></label><select id="sel-alm-def"></select></div>
          <div class="field"><label>Costo inicial de referencia (S/.)</label><input id="inp-costo" style="text-align:right"></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:18px">
          <b style="font-size:13px">Códigos de barras del artículo</b>
          <div style="flex:1"></div>
          <button class="btn btn-secondary btn-sm" onclick="addBarcode()">+ Agregar código</button>
        </div>
        <p class="hint" style="margin-top:4px">Un artículo puede tener varios códigos de barras, cada uno con su tipo (maestro Tipos de Código de Barra). Cada código apunta únicamente a este artículo.</p>
        <table class="grid subtable" style="margin-top:10px">
          <thead id="bc-head"></thead>
          <tbody id="bc-body"></tbody>
        </table>
      </div>

      <!-- Venta -->
      <div class="tabpane" id="pane-venta">
        <div class="formgrid">
          <div class="field"><label>Precio de venta sugerido (S/.)</label><input id="inp-pventa" style="text-align:right"></div>
          <div class="field"><label>Precio de venta mínimo (S/.)</label><input id="inp-pmin" style="text-align:right"></div>
          <div class="field"><label>Descuento mínimo (%)</label><input id="inp-dmin" style="text-align:right"></div>
          <div class="field"><label>Descuento máximo (%)</label><input id="inp-dmax" style="text-align:right"></div>
          <div class="field"><label>Control de stock al vender</label><select id="sel-stockctrl"><option value="">—</option><option>Bloquear</option><option>Avisar</option><option>No verificar</option></select></div>
          <div class="field full"><label>Unidades de medida de venta</label><div id="uventa-box" style="display:flex;gap:14px;flex-wrap:wrap;padding:6px 0"></div></div>
        </div>
        <p class="hint" id="nota-precio-min" style="margin-top:10px"></p>
      </div>

      <!-- Compra -->
      <div class="tabpane" id="pane-compra">
        <div class="formgrid">
          <div class="field"><label>Grupo de compras</label><select id="sel-gcompra"></select></div>
          <div class="field"><label>Proveedor por defecto</label><select id="sel-prov"></select></div>
          <div class="field"><label>Unidad de Medida de Compra</label><select id="sel-um-compra"></select></div>
          <div class="field"><label>Precio de compra de referencia (S/.)</label><input id="inp-pcompra" style="text-align:right"></div>
          <div class="field"><label>Último precio de compra (S/.) <span class="hint">(de las OC)</span></label><input id="inp-ultpc" readonly style="text-align:right"></div>
        </div>
        <p class="hint" style="margin-top:10px">El precio de referencia se propone en las Órdenes de Compra creadas desde una Solicitud de Materiales. El último precio se calcula de las órdenes de compra registradas en la base.</p>
      </div>

      <!-- Impuestos -->
      <div class="tabpane" id="pane-imp">
        <div class="formgrid">
          <div class="field"><label>Afectación IGV</label><select id="sel-igv"><option>Gravado</option><option>Exonerado</option><option>Inafecto</option></select></div>
        </div>
      </div>

      <!-- Producción -->
      <div class="tabpane" id="pane-manu">
        <div class="card" style="margin:0;border-left:4px solid var(--primario-claro)">
          <b style="font-size:12.5px">Listas de Materiales del artículo</b>
          <div id="art-ldms" style="margin-top:8px"></div>
          <p class="hint" style="margin-top:8px">La composición se administra en <button class="btn-link" onclick="go('gi17')">Maestros → Listas de Materiales (GI-17)</button>. Si el artículo tiene lista, es <b>fabricable</b>: Producción crea su orden.</p>
        </div>
      </div>

      <!-- Atributos -->
      <div class="tabpane" id="pane-atr">
        <b style="font-size:13px">Atributos del artículo</b>
        <p class="hint" style="margin:4px 0 10px">Opcionales. Se eligen del <button class="btn-link" onclick="go('matr')">maestro de Atributos</button>. Talla y color son atributos del artículo, no de un producto padre.</p>
        <div class="formgrid" id="atr-box"></div>
      </div>

      <!-- Existencias -->
      <div class="tabpane" id="pane-exist">
        <table class="grid subtable">
          <thead><tr><th>Almacén</th><th style="text-align:right">Actual</th><th style="text-align:right">Comprometido</th><th style="text-align:right">Disponible</th><th style="text-align:right">Costo prom. S/.</th><th></th></tr></thead>
          <tbody id="art-exist"></tbody>
        </table>
      </div>
    </div>
    <p class="hint">La cuenta contable no se define en el artículo: se configura en la pestaña <b>Finanzas</b> de su <button class="btn-link" onclick="go('mtipos')">Grupo de Artículo</button>. El grupo SRV oculta Inventario, Planificación y Existencias. Todo lo guardado aquí lo usan Compras, Producción y Comercial.</p>
  </section>
`);

Vistas.modales(String.raw`
<div class="overlay" id="m-gi01a">
  <div class="modal">
    <div class="modal-h"><b>Desactivar artículo</b><span class="x" onclick="closeModal('m-gi01a')">✕</span></div>
    <div class="modal-b">
      <p style="margin-bottom:10px" id="gi01a-txt"></p>
      <p class="hint">No se elimina: el artículo se conserva por historial y ya no aparece en los buscadores de documentos nuevos.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi01a')">Cancelar</button><button class="btn btn-primary" onclick="confirmarDesactivar()">Desactivar</button></div>
  </div>
</div>

<!-- GI-02d Duplicar artículo -->
<div class="overlay" id="m-gi02d">
  <div class="modal">
    <div class="modal-h"><b>Duplicar artículo</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-02d</span><span class="x" onclick="closeModal('m-gi02d')">✕</span></div>
    <div class="modal-b">
      <p class="hint" style="margin-bottom:12px">Se copia toda la configuración de <b id="dup-src">—</b> (grupo, categoría, unidades, control, precios y atributos). Indique el nombre nuevo; el código se asigna según el grupo.</p>
      <div class="formgrid">
        <div class="field full"><label>Nombre nuevo (único) <span style="color:var(--cancelada)">*</span></label><input id="dup-nombre" placeholder="Ej. PANTALON WIDE LEG ZULEIKA TALLA 32 COLOR AZUL"></div>
        <div class="field"><label>Grupo</label><input id="dup-tipo" readonly></div>
        <div class="field"><label id="dup-cod-lbl">Código</label><input id="dup-cod" readonly></div>
      </div>
      <p class="hint" id="dup-cod-nota" style="margin-top:8px"></p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi02d')">Cancelar</button><button class="btn btn-primary" onclick="confirmarDuplicar()">Crear duplicado</button></div>
  </div>
</div>

<div class="overlay" id="m-etq">
  <div class="modal" style="max-width:420px">
    <div class="modal-h"><b>Etiqueta de código de barras</b><span class="code" style="font-size:11px;color:var(--texto-sec)">Vista previa</span><span class="x" onclick="closeModal('m-etq')">✕</span></div>
    <div class="modal-b" style="background:#EEF1F5;padding:18px">
      <div style="background:#fff;border:1px solid var(--borde);border-radius:6px;padding:18px;text-align:center">
        <div id="etq-nom" style="font-size:11px;font-weight:600;letter-spacing:.3px;margin-bottom:10px"></div>
        <div id="etq-barras" style="line-height:0"></div>
        <div id="etq-num" style="font-size:14px;letter-spacing:3px;margin-top:6px;font-weight:600"></div>
        <div id="etq-corte" style="font-size:12px;margin-top:4px;color:var(--texto-sec);display:none"></div>
      </div>
      <p class="hint" style="margin-top:10px" id="etq-nota"></p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-etq')">Cerrar</button><button class="btn btn-primary" onclick="toast('Enviado a impresión de etiquetas (prototipo)')">🖨 Imprimir</button></div>
  </div>
</div>
`);
