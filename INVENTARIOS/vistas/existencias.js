/* INVENTARIOS · GI-05 Existencias y lotes — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-05 · Existencias -->
  <section class="screen" id="scr-gi05">
    <div class="screen-head">
      <h1>Inventario - Existencias</h1><span class="code">GI-05</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="exportStockCSV()">⇩ Exportar Excel (CSV)</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Artículo(s)</label><input id="f-stk-q" placeholder="Buscar artículo…" oninput="renderStock()"></div>
        <div class="field"><label>Almacén(es) - solo permitidos</label><select id="f-stk-a" onchange="renderStock()">
          <option value="">Todos los permitidos</option>
          <option>SB-ALM-MPT · MP Telas</option>
          <option>SB-ALM-MPA · MP Avíos</option>
          <option>SB-ALM-PT · Central Mercadería</option>
          <option>SB-ALM-TRN · Almacén Transición</option>
          <option>SB-TDA-01 · Tienda Gamarra 1</option>
          <option>SB-TDA-02 · Tienda Gamarra 2</option>
        </select></div>
        <div class="field"><label>Grupo de Artículo</label><select id="f-stk-g" onchange="fillSubFiltro('f-stk-g','f-stk-sg');fillSubcatFiltro('f-stk-sg','f-stk-ssg');renderStock()"><option value="">Todos</option></select></div>
        <div class="field"><label>Categoría</label><select id="f-stk-sg" onchange="fillSubcatFiltro('f-stk-sg','f-stk-ssg');renderStock()"><option value="">Todas</option></select></div>
        <div class="field"><label>Sub categoría</label><select id="f-stk-ssg" onchange="renderStock()"><option value="">Todas</option></select></div>
        <div class="field" style="min-width:340px"><label>Estado del stock (combine los que quiera ver)</label>
          <div style="display:flex;gap:16px;align-items:center;padding:7px 2px">
            <label class="dotled" style="cursor:pointer"><input type="checkbox" id="f-sem-cero" checked onchange="renderStock()"> <span class="dot" style="background:var(--stock-cero)"></span> Agotado</label>
            <label class="dotled" style="cursor:pointer"><input type="checkbox" id="f-sem-ok" checked onchange="renderStock()"> <span class="dot" style="background:var(--stock-ok)"></span> Normal</label>
            <label class="dotled" style="cursor:pointer"><input type="checkbox" id="f-sem-bajo" checked onchange="renderStock()"> <span class="dot" style="background:var(--stock-bajo)"></span> Por agotarse</label>
          </div></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid" id="tbl-stock">
        <thead><tr><th style="width:30px"></th><th>Almacén</th><th>Artículo</th><th style="text-align:right">Stock Actual</th><th style="text-align:right">Stock Comprometido</th><th style="text-align:right">Stock Pedido <span class="warn" title="Mercadería en camino: transferencias en tránsito hacia el almacén + OC confirmadas pendientes de ingreso. No entra en el disponible.">⚠</span></th><th style="text-align:right">Stock Disponible</th><th style="width:100px">Lotes</th></tr></thead>
        <tbody id="stk-body"></tbody>
      </table>
      <div class="pager"><span id="stk-count"></span></div>
    </div>
    <div class="card" style="display:flex;gap:22px;align-items:center;font-size:12.5px;flex-wrap:wrap">
      <b>Semáforo:</b>
      <span class="dotled"><span class="dot" style="background:var(--stock-ok)"></span> Normal (sobre el mínimo)</span>
      <span class="dotled"><span class="dot" style="background:var(--stock-bajo)"></span> Por agotarse (disponible ≤ mínimo del almacén)</span>
      <span class="dotled"><span class="dot" style="background:var(--stock-cero)"></span> Agotado (disponible = 0)</span>
      <span class="hint">Disponible = Actual − Comprometido (el <b>Pedido</b> es mercadería en camino y no entra en el disponible) · Los valores no se guardan: se calculan a partir de los movimientos de ingreso y de salida y de las órdenes abiertas · "Ver lotes" solo aparece en artículos con control de lote</span>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<div class="overlay" id="m-lotes">
  <div class="modal">
    <div class="modal-h"><b id="lotes-title">Lotes disponibles</b><span class="x" onclick="closeModal('m-lotes')">✕</span></div>
    <div class="modal-b">
      <p class="hint" style="margin-bottom:10px" id="lotes-sub"></p>
      <table class="grid subtable">
        <thead id="lotes-head"></thead>
        <tbody id="lotes-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">El lote es un atributo del movimiento y del saldo, nunca del artículo. Se sostiene sobre dos tablas: un <b>resumen</b> por artículo, lote y almacén, y un <b>detalle</b> colgado de cada movimiento con su ID de operación y línea. La fecha de vencimiento solo se pide en los artículos marcados como «Este artículo vence».</p>
    </div>
    <div class="modal-f"><button class="btn btn-primary" onclick="closeModal('m-lotes')">Cerrar</button></div>
  </div>
</div>

<!-- Modal Ver lotes (GI-05) -->
<div class="overlay" id="m-traza" style="z-index:220">
  <div class="modal">
    <div class="modal-h"><b id="traza-title">Trazabilidad</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-05</span><span class="x" onclick="closeModal('m-traza')">✕</span></div>
    <div class="modal-b" style="padding:0">
      <div id="traza-head" style="background:var(--primario);color:#fff;padding:16px 22px">
        <div id="traza-tipo" style="font-size:11px;letter-spacing:.6px;text-transform:uppercase;opacity:.8"></div>
        <div id="traza-cod" style="font-size:19px;font-weight:700;margin-top:3px"></div>
        <div id="traza-art" style="font-size:12.5px;opacity:.9;margin-top:3px"></div>
      </div>
      <div style="padding:16px 22px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px" id="traza-grid"></div>
        <div id="traza-origen" style="margin-top:14px;border:1px solid var(--borde);border-left:4px solid var(--primario-claro);border-radius:7px;padding:12px 15px"></div>
        <p class="hint" style="margin-top:12px;text-align:justify">La trazabilidad responde de dónde vino este stock: en materia prima apunta a la compra que lo trajo; en producto terminado, a la orden de fabricación finalizada que lo generó. El botón abre el documento exacto en su módulo.</p>
      </div>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-traza')">Cerrar</button><button class="btn btn-primary" id="traza-btn">Ver documento</button></div>
  </div>
</div>
`);
