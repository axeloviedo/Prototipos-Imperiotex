/* INVENTARIOS · GI-01 Artículos y GI-02 ficha del artículo (diseño V9 sobre la base compartida, decisión L1) — HTML */
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
        <thead><tr><th>Código</th><th>Nombre</th><th>Grupo</th><th>Categoría</th><th>Estado</th><th>UM Inventario</th><th>Inventariable</th><th style="width:200px">Acciones</th></tr></thead>
        <tbody></tbody>
      </table>
      <div class="pager"><span id="art-count"></span></div>
    </div>
    <p class="hint">Maestro de la base compartida: 101 materias primas y 17 servicios de la plantilla, más los avíos y la familia ZULEIKA (piezas PPT-0001..0004, crudo PPT-0005..0008, lavado PPT-0009..0012 y producto final PT-0001..0004). Cada nombre es único. Para crear artículos parecidos use <b>Duplicar</b>.</p>
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
        <div class="tab" data-t="venta" onclick="tab(this)">Venta</div>
        <div class="tab" data-t="compra" onclick="tab(this)">Compra</div>
        <div class="tab" data-t="imp" onclick="tab(this)">Impuestos</div>
        <div class="tab" data-t="manu" id="tab-manu" onclick="tab(this)">Producción</div>
        <div class="tab" data-t="atr" id="tab-atr" onclick="tab(this)">Atributos</div>
      </div>

      <!-- General -->
      <div class="tabpane active" id="pane-general">
        <div class="formgrid">
          <div class="field req"><label>Grupo de Artículo <span class="hint">(bridge contable · no se cambia una vez creado)</span></label>
            <select id="sel-grupo" onchange="applyGrupo(this.value)"></select></div>
          <div class="field req"><label id="lbl-codigo">Código (auto · asignación interna)</label>
            <input id="inp-codigo" readonly></div>
          <div class="field"><label>Categoría (opcional · hija del grupo)</label>
            <select id="sel-subgrupo" onchange="fillSubcat()"><option value=""></option></select></div>
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
          <p class="hint" style="margin-top:4px">Un artículo puede ser de las tres cosas a la vez; los servicios no son inventariables.</p>
          <div style="display:flex;gap:26px;flex-wrap:wrap;margin-top:10px">
            <div class="check"><input type="checkbox" checked id="chk-invble" onchange="refreshTitle()"> Es inventariable</div>
            <div class="check"><input type="checkbox" id="chk-venta" onchange="refreshTitle()"> Se vende</div>
            <div class="check"><input type="checkbox" id="chk-compra" onchange="refreshTitle()"> Se compra</div>
          </div>
        </div>
      </div>

      <!-- Planificación de Stock -->
      <div class="tabpane" id="pane-plan">
        <div class="formgrid">
          <div class="field"><label>Stock mínimo <span class="hint">(único para el artículo)</span></label><input id="inp-stockmin" style="text-align:right" placeholder="0 = sin mínimo"></div>
          <div class="field"><label>Unidad (Inventario)</label><input class="um-inv-mirror" readonly></div>
        </div>
        <p class="hint" style="margin-top:8px">Origen de las alertas por agotarse / agotado: se compara con el disponible de <b>cada almacén</b> donde está el artículo. La unidad es siempre la Unidad de Medida de Inventario del artículo.</p>
      </div>

      <!-- Inventario -->
      <div class="tabpane" id="pane-inv">
        <div class="formgrid">
          <div class="field req"><label>Unidad de Medida de Inventario <span class="hint">(base para trabajar todo)</span></label>
            <select id="sel-um-inv" onchange="syncUMInv()"></select></div>
          <div class="field"><label>Control de inventario <span class="hint">(uno o ninguno)</span></label>
            <select id="sel-ctrl" onchange="ctrlChange()"><option>Nada</option><option>Lote</option><option>Serie</option></select></div>
          <div class="field"><label>Valorización</label><input value="Promedio ponderado" readonly></div>
          <div class="field" id="fld-vence" style="display:none"><div class="check" style="margin-top:22px"><input type="checkbox" id="chk-vence"> Este artículo vence <span class="hint">(sus lotes tienen fecha de vencimiento)</span></div></div>
          <div class="field"><label>Formato de numeración (auto)</label><input id="ctrl-fmt" readonly></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:18px">
          <b style="font-size:13px">Códigos de barras del artículo</b>
          <div style="flex:1"></div>
          <button class="btn btn-secondary btn-sm" onclick="addBarcode()">+ Agregar código</button>
        </div>
        <p class="hint" style="margin-top:4px">Un artículo puede tener varios códigos de barras únicos e independientes, cada uno con su tipo (maestro Tipos de Código de Barra). Cada código apunta únicamente a este artículo.</p>
        <table class="grid subtable" style="margin-top:10px">
          <thead id="bc-head"></thead>
          <tbody id="bc-body"></tbody>
        </table>
      </div>

      <!-- Venta -->
      <div class="tabpane" id="pane-venta">
        <div class="formgrid">
          <div class="field"><label>Precio de Venta (Valor Sugerido) (S/.)</label><input id="inp-pventa" style="text-align:right"></div>
          <div class="field"><label>Unidad de Medida de Venta predeterminada <span class="hint">(ayuda)</span></label><select id="sel-um-venta"></select></div>
          <div class="field"><div class="check" style="margin-top:6px"><input type="checkbox" id="chk-precio-min" onchange="togglePrecioMin(this.checked)"> Verificar Precio Mínimo</div></div>
          <div class="field" id="fld-precio-min" style="display:none"><label>Precio de venta mínimo (único) (S/.)</label><input id="inp-pmin" style="text-align:right"></div>
          <div class="field"><label>Descuento mínimo (%)</label><input id="inp-dmin" style="text-align:right"></div>
          <div class="field"><label>Descuento máximo (%)</label><input id="inp-dmax" style="text-align:right"></div>
        </div>
        <p class="hint" id="nota-precio-min" style="margin-top:10px"></p>
        <p class="hint" style="margin-top:4px">Las unidades de venta y de compra son referenciales: todo el stock se mueve en la Unidad de Medida de Inventario. Si la unidad es distinta, debe existir su factor de conversión (Configuraciones → Conversiones).</p>
      </div>

      <!-- Compra -->
      <div class="tabpane" id="pane-compra">
        <div class="formgrid">
          <div class="field"><label>Proveedor por defecto</label><select id="sel-prov"></select></div>
          <div class="field"><label>Unidad de Medida de Compra predeterminada <span class="hint">(ayuda)</span></label><select id="sel-um-compra"></select></div>
          <div class="field"><label>Grupo de compras <span class="hint">(del Grupo de Artículo)</span></label><input id="inp-gcompra" readonly></div>
          <div class="field"><label>Último precio de compra (S/.) <span class="hint">(calculado)</span></label><input id="inp-ultpc" readonly style="text-align:right"></div>
          <div class="field"><label>Precio de compra promedio (S/.) <span class="hint">(calculado)</span></label><input id="inp-prompc" readonly style="text-align:right"></div>
        </div>
        <p class="hint" style="margin-top:10px">El precio de compra no se captura aquí: es un atributo de la operación. El sistema lo deriva de las facturas de compra registradas (último y promedio) y lo muestra como referencia de solo lectura.</p>
      </div>

      <!-- Impuestos -->
      <div class="tabpane" id="pane-imp">
        <div class="formgrid">
          <div class="field"><label>Afectación IGV</label><select id="sel-igv"><option value="Gravado">Gravado - Operación Onerosa (18%)</option><option value="Exonerado">Exonerado</option><option value="Inafecto">Inafecto</option></select></div>
        </div>
      </div>

      <!-- Producción -->
      <div class="tabpane" id="pane-manu">
        <div class="formgrid">
          <div class="field full"><div class="check"><input type="checkbox" id="chk-manu" onchange="refreshTitle()"> Apto para producción / fabricación <span class="hint" id="hint-manu">(el artículo puede ser el producto final de una Lista de Materiales)</span></div></div>
        </div>
        <div class="card" style="margin:14px 0 0;border-left:4px solid var(--primario-claro)">
          <b style="font-size:12.5px">Lista de Materiales del artículo</b>
          <div id="art-ldms" style="margin-top:8px"></div>
          <p class="hint" style="margin-top:5px">La composición se administra en <button class="btn-link" onclick="go('gi17')">Configuraciones → Listas de Materiales</button>. Un artículo apto para producción puede tener una lista Predeterminada y otras alternativas.</p>
        </div>
      </div>

      <!-- Atributos -->
      <div class="tabpane" id="pane-atr">
        <div style="display:flex;align-items:center;gap:10px;margin:0 0 8px">
          <b style="font-size:13px">Atributos del artículo</b>
          <div style="flex:1"></div>
          <button class="btn btn-secondary btn-sm" onclick="addAtributoRow()">+ Crear</button>
        </div>
        <table class="grid subtable">
          <thead><tr><th style="width:50px">#</th><th>Atributo</th><th>Valor de Atributo</th><th style="width:70px"></th></tr></thead>
          <tbody id="tbl-atributos"></tbody>
        </table>
        <p class="hint" style="margin-top:8px">Los atributos son opcionales y se eligen del <button class="btn-link" onclick="go('matr')">maestro de Atributos</button> (cada atributo tiene sus valores). No dependen de un producto padre: son una característica más de este artículo. Para crear artículos parecidos con distintos valores, use <b>Duplicar</b>.</p>
      </div>
    </div>
    <p class="hint">La cuenta contable no se define en el artículo: se configura en la pestaña <b>Finanzas</b> de su <button class="btn-link" onclick="go('mtipos')">Grupo de Artículo</button> (todos los artículos del grupo comparten esas cuentas). El grupo SERVICIOS oculta las pestañas de Inventario, Planificación y Producción. La numeración de código depende del grupo de artículo (asignación interna o externa).</p>
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
      <p class="hint" style="margin-bottom:12px">Se copia toda la configuración del artículo <b id="dup-src">—</b> (grupo, categoría, unidades, control, precios y producción). <b>No se copian los códigos de barras</b>: cada código es de un solo artículo. Indique el nombre nuevo; el código se asigna según el grupo. Los atributos se copian sin valor para que los complete.</p>
      <div class="formgrid">
        <div class="field full"><label>Nombre nuevo (único e irrepetible) <span style="color:var(--cancelada)">*</span></label><input id="dup-nombre" placeholder="Ej. PANTALON WIDE LEG ZULEIKA TALLA 32 COLOR AZUL"></div>
        <div class="field"><label>Grupo de Artículo</label><input id="dup-tipo" readonly></div>
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
