/* INVENTARIOS · GI-07 Movimientos, GI-08 detalle y notas internas (NI/NS/NT) — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-07 · Movimientos -->
  <section class="screen" id="scr-gi07">
    <div class="screen-head">
      <h1>Movimientos</h1><span class="code">GI-07</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="go('gi09')">+ Ingreso</button>
      <button class="btn btn-secondary" onclick="go('gi10')">+ Salida</button>
      <button class="btn btn-secondary" onclick="resetTRF()">+ Transferencia</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Desde</label><input type="date" value="2026-07-01"></div>
        <div class="field"><label>Hasta</label><input type="date" value="2026-07-19"></div>
        <div class="field"><label>Almacén</label><select id="f-mov-a" onchange="renderMov()">
          <option value="">Todos los permitidos</option>
          <option value="SB-ALM-MPT">SB-ALM-MPT · MP Telas</option>
          <option value="SB-ALM-MPA">SB-ALM-MPA · MP Avíos</option>
          <option value="SB-ALM-PT">SB-ALM-PT · Central Mercadería</option>
          <option value="SB-ALM-TRN">SB-ALM-TRN · Almacén Transición</option>
          <option value="SB-TDA-01">SB-TDA-01 · Tienda Gamarra 1</option>
          <option value="SB-TDA-02">SB-TDA-02 · Tienda Gamarra 2</option>
        </select></div>
        <div class="field"><label>Tipo de documento <span class="warn" title="Filtro inferido">⚠</span></label><select id="f-mov-t" onchange="renderMov()"><option value="">Todos</option><option>Ingreso</option><option>Salida</option><option>Transferencia</option></select></div>
        <div class="field"><label>Estado <span class="warn" title="Filtro inferido">⚠</span></label><select id="f-mov-e" onchange="renderMov()"><option value="">Todos</option><option>Borrador</option><option>Confirmado</option><option>Completada</option><option>Aprobada / En tránsito</option><option>Recibida parcial</option><option>Cancelada</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>ID</th><th>Detalle del movimiento</th><th>N° de documento</th><th>Fecha</th><th>Origen / Destino</th><th>Estado</th><th style="width:70px">Acciones</th></tr></thead>
        <tbody id="mov-body"></tbody>
      </table>
      <div class="pager"><span id="mov-count"></span><div class="pg"><button>‹</button><button class="cur">1</button><button>›</button></div></div>
    </div>
    <p class="hint">Los movimientos automáticos (venta en tienda, recepción de compra, recibo de producción) aparecen como documentos de sistema, solo lectura, con link a su proceso origen.</p>
  </section>

  <!-- ==================================================== GI-08 · Detalle de Movimiento -->
  <section class="screen" id="scr-gi08">
    <div class="screen-head">
      <h1 id="d8-title">MOVIMIENTO: INGRESO</h1><span class="code">GI-08</span>
      <span class="badge" id="d8-estado" style="background:var(--confirmado)">Confirmado</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" id="d8-nota" onclick="imprimirNota('gi08')">Imprimir Nota</button>
      <button class="btn btn-secondary" id="d8-origenlink" style="display:none" onclick="toast('Abre el proceso origen (venta POS)')">Ver proceso origen</button>
      <button class="btn btn-secondary">Imprimir / Exportar <span class="warn" title="Inferencia a afinar">⚠</span></button>
      <button class="btn btn-secondary" onclick="go('gi07')">Volver</button>
    </div>
    <div class="card">
      <b style="font-size:13px">Detalles generales</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>ID / Código</label><input id="d8-id" value="" readonly></div>
        <div class="field"><label>Creado por</label><input id="d8-user" value="" readonly></div>
        <div class="field"><label>Tipo de documento</label><input id="d8-tdoc" value="" readonly></div>
        <div class="field"><label id="d8-tmov-l">Tipo de ingreso</label><input id="d8-tmov" value="" readonly></div>
        <div class="field"><label>N° de documento</label><input id="d8-ndoc" value="" readonly></div>
        <div class="field"><label>Fecha de movimiento</label><input id="d8-fecha" value="" readonly></div>
        <div class="field"><label id="d8-ori-l">Origen</label><input id="d8-ori" value="" readonly></div>
        <div class="field"><label id="d8-alm-l">Almacén destino</label><input id="d8-alm" value="" readonly></div>
        <div class="field" id="d8-fld-ref"><label id="lbl-refetq-08">Referencia de etiqueta</label><input id="d8-refetq" value="" readonly></div>
        <div class="field full"><label>Observaciones</label><input id="d8-obs" value="" readonly></div>
      </div>
    </div>
    <div class="card">
      <b style="font-size:13px">Listado de artículos</b>
      <table class="grid subtable" style="margin-top:12px" id="d8-tabla"></table>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- Nota interna de movimiento (formato imprimible) -->
<div class="overlay" id="m-nota">
  <div class="modal lg">
    <div class="modal-h"><b id="nota-mtitle">Nota interna</b><span class="code" style="font-size:11px;color:var(--texto-sec)">Formato de impresión</span><span class="x" onclick="closeModal('m-nota')">✕</span></div>
    <div class="modal-b" style="background:#EEF1F5;padding:18px">
      <div style="background:#fff;border:1px solid var(--borde);border-radius:6px;padding:22px 26px;font-size:12.5px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid var(--primario);padding-bottom:12px">
          <div><b style="font-size:14px">IMPERIOTEX S.A.C.</b><br><span class="hint">Av. Gamarra 228, La Victoria - Lima<br>RUC 20512345678</span></div>
          <div style="text-align:center;border:2px solid var(--primario);border-radius:8px;padding:10px 18px">
            <div id="nota-tipo" style="font-weight:700;font-size:12px;letter-spacing:.5px">NOTA DE SALIDA INTERNA</div>
            <div id="nota-num" style="font-size:17px;font-weight:800;color:var(--primario);margin-top:3px">NS-000000</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-top:14px">
          <div><span class="hint">Fecha</span><br><b id="nota-fecha"></b></div>
          <div><span class="hint">Movimiento de origen</span><br><b id="nota-mov"></b></div>
          <div><span class="hint" id="nota-ori-l">Origen</span><br><span id="nota-ori"></span></div>
          <div><span class="hint" id="nota-des-l">Destino</span><br><span id="nota-des"></span></div>
          <div style="grid-column:1/-1"><span class="hint">Documento vinculado</span><br><span id="nota-doc"></span></div>
        </div>
        <table class="grid subtable" style="margin-top:14px" id="nota-tabla"></table>
        <div style="margin-top:8px"><span class="hint">Observaciones</span><br><span id="nota-obs"></span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:44px;text-align:center">
          <div style="border-top:1px solid var(--texto);padding-top:6px">Entregado por<br><span class="hint">Nombre y firma</span></div>
          <div style="border-top:1px solid var(--texto);padding-top:6px">Recibido por<br><span class="hint">Nombre y firma</span></div>
        </div>
        <p class="hint" style="margin-top:16px;text-align:center;font-size:11px">Documento interno de control · Sin valor tributario · El traslado por vía pública requiere Guía de Remisión Electrónica (SUNAT)</p>
      </div>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-nota')">Cerrar</button><button class="btn btn-primary" onclick="toast('Enviado a impresión (prototipo)')">🖨 Imprimir</button></div>
  </div>
</div>
`);
