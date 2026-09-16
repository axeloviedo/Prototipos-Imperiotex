/* INVENTARIOS · GI-21/22/23 Solicitudes de Fabricación: bandeja, alta, revisión y buscador de artículos — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-21 · Solicitudes de Fabricación (Bandeja) -->
  <section class="screen" id="scr-gi21">
    <div class="screen-head">
      <h1>Solicitudes de Fabricación</h1><span class="code">GI-21</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevaSP()">+ Nueva Solicitud de Fabricación</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Estado</label><select id="f-sp-e" onchange="renderSP()"><option value="">Todos</option><option>Borrador</option><option>Pendiente Aprobar</option><option>Aprobada</option><option>Rechazada</option><option>Convertida en Orden</option></select></div>
        <div class="field"><label>Mes proyectado</label><select id="f-sp-m" onchange="renderSP()"><option value="">Todos</option><option>Jul 2026</option><option>Ago 2026</option><option>Set 2026</option></select></div>
        <div class="field"><label>Buscar artículo</label><input id="f-sp-q" placeholder="Código o nombre del artículo…" oninput="renderSP()"></div>
        <div class="field"><label>Categoría</label><select id="f-sp-b" onchange="renderSP()"><option value="">Todas</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>N° Sol.</th><th>Fecha Cra.</th><th>Mes proy.</th><th style="text-align:right">Líneas</th><th style="text-align:right">Cant. total</th><th>Estado</th><th>Creado por</th><th style="width:180px">Acciones</th></tr></thead>
        <tbody id="sp-body"></tbody>
      </table>
      <div class="pager"><span id="sp-count"></span></div>
    </div>
    <p class="hint">Pantalla <b>compartida por Logística y Comercial</b>: ambos crean, editan, envían y aprueban las mismas solicitudes. Editar está disponible en Borrador, Pendiente Aprobar y Rechazada; las Aprobadas son de solo lectura. <b>Producción</b> solo ve las aprobadas, en Solicitudes de Fabricación (PR-03).</p>
  </section>

  <!-- ==================================================== GI-22 · Nueva Solicitud de Fabricación -->
  <section class="screen" id="scr-gi22">
    <div class="screen-head">
      <h1>Nueva Solicitud de Fabricación</h1><span class="code">GI-22</span>
      <span class="badge" style="background:var(--borrador)">Borrador</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="go('gi21')">Cancelar</button>
      <button class="btn btn-secondary" onclick="guardarSP(false)">Guardar borrador</button>
      <button class="btn btn-primary" onclick="guardarSP(true)">Enviar a revisión</button>
    </div>
    <div class="card">
      <div class="formgrid">
        <div class="field"><label>N° de solicitud (auto)</label><input id="n-sp-id" readonly></div>
        <div class="field"><label>Fecha de creación (auto)</label><input id="n-sp-fecha" readonly value="19/07/2026"></div>
        <div class="field req"><label>Mes proyectado</label>
          <select id="n-sp-mes"><option value="">Seleccionar…</option><option>Ago 2026</option><option>Set 2026</option><option>Oct 2026</option></select></div>
        <div class="field req"><label>Almacén destino <span class="hint">(a donde se mueve y consume la MP, y aparece el PT)</span></label>
          <select id="n-sp-almdest"></select></div>
        <div class="field"><label>Solicitante (auto)</label><input id="n-sp-solic" readonly value="USER00 · Logística"></div>
        <div class="field"><label>Cantidad total (auto, suma del detalle)</label><input id="n-sp-total" readonly style="text-align:right;font-weight:600" value="0 UND"></div>
        <div class="field full"><label>Observaciones generales</label><input id="n-sp-obs" placeholder="Ej. proyección acordada con Comercial…"></div>
      </div>
      <p class="leyenda-req" style="margin-top:8px"><i></i> Los campos resaltados son obligatorios.</p>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <b style="font-size:13px">Detalle del pedido</b>
        <div class="spacer"></div>
        <button class="btn btn-secondary btn-sm" onclick="abrirBuscadorArt('nuevo')">+ Agregar artículos</button>
      </div>
      <p class="hint" style="margin-top:5px">Una línea por artículo. Cada talla y color es un artículo con su propio código: se eligen desde el buscador, que permite filtrar por categoría y por valores de atributo y marcar varios de una vez.</p>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th style="width:34px">#</th><th style="width:110px">Código</th><th>Artículo</th><th style="width:90px">Color</th><th style="width:70px">Talla</th><th style="width:130px;text-align:right">Cantidad</th><th style="width:70px"></th></tr></thead>
        <tbody id="n-sp-items"></tbody>
        <tfoot id="n-sp-items-foot"></tfoot>
      </table>
    </div>
  </section>

  <!-- ==================================================== GI-23 · Solicitud de Fabricación · Revisión -->
  <section class="screen" id="scr-gi23">
    <div class="screen-head">
      <h1 id="sp-titulo">Solicitud de Fabricación · Revisión</h1><span class="code" id="sp-code">GI-23</span>
      <span class="badge" id="sp-badge" style="background:var(--pendiente)">Pendiente Aprobar</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" id="sp-b-enviar" style="display:none" onclick="enviarSPrev()">Enviar a revisión</button>
      <button class="btn btn-secondary" id="sp-b-reabrir" style="display:none" onclick="reabrirSP()">Corregir y reenviar</button>
      <button class="btn btn-secondary" id="sp-b-mod" onclick="openModal('m-gi23d')">Solicitar modificación</button>
      <button class="btn btn-danger" id="sp-b-rech" onclick="openModal('m-gi23c')">Rechazar</button>
      <button class="btn btn-secondary" id="sp-b-verif" onclick="verificarStock()">Verificar stock</button>
      <button class="btn btn-secondary" id="sp-b-vb" onclick="preVB()">Dar V°B° (Logística)</button>
      <button class="btn btn-primary" id="sp-b-ap" onclick="openModal('m-gi23b')">Aprobar (Gerencia)</button>
      <button class="btn btn-primary" id="sp-b-prod" style="display:none" onclick="irProduccion('pr03')">Ver en Producción</button>
      <button class="btn btn-secondary" id="sp-b-volver" onclick="go('gi21')">Volver</button>
    </div>

    <div id="sp-aviso" class="card" style="display:none;border-left:4px solid var(--pendiente);background:#FFFBEB"></div>

    <div class="gp2col">
      <div>
        <div class="card">
          <b style="font-size:13px">Resumen</b>
          <div class="formgrid" style="margin-top:12px">
            <div class="field"><label>N° de solicitud</label><input id="sp-id" readonly></div>
            <div class="field"><label>Artículos solicitados</label><input id="sp-resumen" readonly></div>
            <div class="field"><label>Mes proyectado</label><input id="sp-mes" readonly></div>
            <div class="field"><label>Almacén destino <span class="hint">(consumo de MP y PT)</span></label><select id="sp-almdest" onchange="SP.almDestino=this.value"></select></div>
            <div class="field"><label>Solicitante</label><input id="sp-solic" readonly></div>
            <div class="field"><label>Cantidad total</label><input id="sp-total" readonly style="text-align:right;font-weight:600"></div>
            <div class="field full"><label>Observaciones generales</label><input id="sp-obs" readonly></div>
          </div>
        </div>

        <div class="card">
          <div style="display:flex;align-items:center;gap:10px">
            <b style="font-size:13px">Detalle del pedido</b>
            <div class="spacer"></div>
            <button class="btn btn-secondary btn-sm" id="sp-b-adddet" onclick="abrirBuscadorArt('rev')">+ Agregar artículos</button>
          </div>
          <p class="hint" style="margin-top:5px">Una línea por artículo terminado. En Borrador y Pendiente Aprobar las cantidades son editables: al cambiarlas, los Requerimientos de Materia Prima se recalculan al instante. <b>Tipo de fabricación</b>: <b>Estándar</b> usa la lista predeterminada (fija) y <b>Especial</b> permite elegir otra lista de materiales; al cambiar la lista, la MP se recalcula.</p>
          <div class="tbl-wrap">
          <table class="grid subtable" style="margin-top:12px">
            <thead><tr><th style="width:34px">#</th><th style="width:100px">Código</th><th>Artículo</th><th style="width:80px">Color</th><th style="width:64px">Talla</th><th style="width:110px;text-align:right">Cantidad</th><th style="width:120px">Tipo fabricación</th><th style="width:200px">Lista de materiales</th><th style="width:150px">Estado del artículo</th></tr></thead>
            <tbody id="sp-items"></tbody>
            <tfoot id="sp-items-foot"></tfoot>
          </table>
          </div>
        </div>

        <div id="sp-paneles">
          <div class="card">
            <b style="font-size:13px">Alertas de Stock</b>
            <p class="hint" style="margin-top:5px">Una fila por cada almacén donde el artículo tenga existencias, sea cual sea. No se fija un almacén: se listan los que hay. <b>Disponible = actual − comprometido</b>.</p>
            <table class="grid subtable" style="margin-top:12px">
              <thead><tr><th style="width:110px">Código</th><th>Artículo</th><th>Almacén</th><th style="width:100px;text-align:right">Actual</th><th style="width:110px;text-align:right">Comprometido</th><th style="width:100px;text-align:right">Disponible</th><th style="width:100px;text-align:right">Umbral mín. <span class="warn" title="Maestro de mínimos por artículo y almacén (GI-02, pestaña Planificación)">⚠</span></th><th style="width:150px">Estado</th></tr></thead>
              <tbody id="sp-stock"></tbody>
            </table>
          </div>

          <div class="card">
            <b style="font-size:13px">Rotación de los artículos del pedido</b>
            <p class="hint" style="margin-top:5px">Cómo rota cada artículo del detalle por almacén (como GI-18, filtrado al pedido). Sirve para decidir qué tallas y colores priorizar.</p>
            <table class="grid subtable" style="margin-top:12px">
              <thead><tr><th>Artículo</th><th>Almacén</th><th style="width:80px;text-align:right">Stock</th><th style="width:110px">Última salida</th><th style="width:150px;text-align:right">Días sin movimiento</th><th style="width:150px">Estado</th></tr></thead>
              <tbody id="sp-rot"></tbody>
            </table>
            <div style="display:flex;gap:18px;align-items:center;font-size:12px;flex-wrap:wrap;margin-top:10px">
              <span class="dotled"><span class="dot" style="background:var(--confirmado)"></span> Rota bien (≤30d)</span>
              <span class="dotled"><span class="dot" style="background:var(--pendiente)"></span> Vigilar (31-90d)</span>
              <span class="dotled"><span class="dot" style="background:#C2410C"></span> Inmovilizado (91-180d)</span>
              <span class="dotled"><span class="dot" style="background:var(--cancelada)"></span> Crítico (>180d)</span>
            </div>
          </div>

          <div class="card">
            <div style="display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap">
              <b style="font-size:13px;padding-bottom:6px">Requerimientos de Materia Prima</b>
              <div class="spacer"></div>
              
            </div>
            <p class="hint" style="margin-top:5px">Cálculo automático: para cada línea se toma su <b>lista de materiales efectiva</b> (Estándar = predeterminada; Especial = la elegida en el Detalle), se multiplica por la cantidad pedida y se agrega por material contra el almacén de cada uno. Cambiar la cantidad, la lista o el tipo de fabricación recalcula la tabla al instante. Editar las cantidades del Detalle recalcula esta tabla al instante: puede ajustar el pedido hasta que la tela alcance sin necesidad de comprar. Los hilos van por unidades (conos): consumo fraccionario por prenda (0.05 UND = 1 cono cada 20 prendas) <span class="warn" title="Observación: validar con Producción si prefieren fracción de cono por prenda o redondeo por orden">⚠</span>.</p>
            <table class="grid subtable" style="margin-top:12px">
              <thead><tr><th>Material</th><th style="width:70px">Unidad</th><th style="width:150px;text-align:right">Consumo x prenda <span class="warn" title="Viene de la lista de materiales de cada artículo (GI-17)">⚠</span></th><th style="width:105px;text-align:right">Requerida</th><th style="width:105px;text-align:right">Disponible</th><th style="width:105px;text-align:right">Diferencia</th><th style="width:150px">Estado</th><th style="width:150px">Acciones</th></tr></thead>
              <tbody id="sp-mp"></tbody>
            </table>
            <div id="sp-mp-resumen" style="margin-top:10px"></div>
          </div>

          <div class="card" id="sp-scs-card" style="display:none">
            <b style="font-size:13px">Solicitudes de Materiales generadas</b>
            <p class="hint" style="margin-top:5px">Se generan sin propósito: Logística define por línea si se compra o se transfiere y crea la Orden de Compra o la Transferencia.</p>
            <table class="grid subtable" style="margin-top:12px">
              <thead><tr><th>N° Solicitud</th><th>Material</th><th style="width:120px;text-align:right">Cantidad</th><th style="width:150px">Almacén destino</th><th style="width:170px">Estado</th><th style="width:80px"></th></tr></thead>
              <tbody id="sp-scs"></tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card">
        <b style="font-size:13px">Historial de decisiones</b>
        <div id="sp-hist" style="margin-top:10px;font-size:13px"></div>
        <div id="sp-val" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--borde);font-size:12.5px;display:none"></div>
      </div>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- GI-22b Buscador de artículos para el detalle -->
<div class="overlay" id="m-gi22b">
  <div class="modal lg">
    <div class="modal-h"><b>Agregar artículos al detalle</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-22b</span><span class="x" onclick="closeModal('m-gi22b')">✕</span></div>
    <div class="modal-b">
      <div class="filters" style="margin-bottom:10px">
        <div class="field"><label>Buscar</label><input id="gi22b-q" placeholder="Código o nombre…" oninput="renderBuscadorArt()"></div>
        <div class="field"><label>Categoría</label><select id="gi22b-cat" onchange="renderBuscadorArt()"></select></div>
        <div class="field"><label>Color</label><select id="gi22b-color" onchange="renderBuscadorArt()"></select></div>
        <div class="field"><label>Talla</label><select id="gi22b-talla" onchange="renderBuscadorArt()"></select></div>
      </div>
      <table class="grid subtable">
        <thead><tr><th style="width:36px"></th><th style="width:110px">Código</th><th>Artículo</th><th style="width:90px">Color</th><th style="width:70px">Talla</th><th style="width:80px">Unidad</th></tr></thead>
        <tbody id="gi22b-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Solo artículos terminados activos de la empresa activa. Talla y color son atributos del artículo, no de un producto padre: marque varios y agréguelos de una vez.</p>

      <div style="margin-top:14px;border-top:1px solid var(--borde);padding-top:12px">
        <p class="hint">El artículo debe <b>existir en el sistema</b> para agregarlo al detalle. Si la combinación (color/talla) todavía no existe, créela primero en el <button class="btn-link" onclick="closeModal('m-gi22b');go('gi01')">maestro de artículos</button> (con <b>Duplicar</b>) y vuelva a buscarla aquí.</p>
      </div>
    </div>
    <div class="modal-f">
      <button class="btn btn-secondary" onclick="closeModal('m-gi22b')">Cerrar</button>
      <button class="btn btn-primary" onclick="addArtsSeleccionados()">Agregar seleccionados</button>
    </div>
  </div>
</div>
`);
