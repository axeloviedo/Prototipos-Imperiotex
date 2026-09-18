/* INVENTARIOS · GI-07 Movimientos, GI-08 detalle y notas internas (NI/NS/NT) — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-07 · Movimientos -->
  <section class="screen" id="scr-gi07">
    <div class="screen-head">
      <h1>Movimientos</h1><span class="code">GI-07</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevoIngreso()">+ Ingreso</button>
      <button class="btn btn-secondary" onclick="nuevaSalida()">+ Salida</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (ID / documento)</label><input id="f-mov-q" placeholder="Ej. ING-000001, OC-000001…" oninput="renderMov()"></div>
        <div class="field"><label>Desde</label><input type="date" id="f-mov-d" onchange="renderMov()"></div>
        <div class="field"><label>Hasta</label><input type="date" id="f-mov-h" onchange="renderMov()"></div>
        <div class="field"><label>Almacén</label><select id="f-mov-a" onchange="renderMov()"></select></div>
        <div class="field"><label>Grupo de movimiento</label><select id="f-mov-g" onchange="fillMovTipos();renderMov()"></select></div>
        <div class="field"><label>Tipo de movimiento</label><select id="f-mov-t" onchange="renderMov()"></select></div>
        <div class="field"><label>Módulo</label><select id="f-mov-m" onchange="renderMov()"></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>ID</th><th>Tipo de movimiento</th><th>Detalle</th><th>N° de documento</th><th>Fecha</th><th>Origen → Destino</th><th>Usuario</th><th>Módulo</th><th style="text-align:right">Valor S/.</th><th>Estado</th></tr></thead>
        <tbody id="mov-body"></tbody>
      </table>
      <div class="pager"><span id="mov-count"></span></div>
    </div>
    <p class="hint">Todos los movimientos de la base compartida: los que registra Logística aquí y los automáticos de otros módulos (recepción de compra, emisión y recibo de producción, envío al servicio de terceros, ventas de Comercial). Un movimiento confirmado no se edita: se corrige con otro movimiento (regularización por sobrante en GI-09 o por faltante en GI-10). Las <b>Solicitudes de Transferencia</b> son pedidos, no movimientos: están en <a href="#" onclick="go('gi24');return false">Transferencias (GI-24)</a>; aquí aparece su movimiento cuando se confirma la recepción.</p>
  </section>

  <!-- ==================================================== GI-08 · Detalle de Movimiento -->
  <section class="screen" id="scr-gi08">
    <div class="screen-head">
      <h1 id="d8-title">MOVIMIENTO</h1><span class="code">GI-08</span>
      <span class="badge" id="d8-estado" style="background:var(--confirmado)">Confirmado</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" id="d8-nota" onclick="imprimirNota()">Imprimir Nota</button>
      <button class="btn btn-secondary" id="d8-gre" onclick="greDesdeMov()">Crear GRE</button>
      <button class="btn btn-secondary" onclick="go('gi07')">Volver</button>
    </div>
    <div class="card">
      <b style="font-size:13px">Detalles generales</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>ID</label><input id="d8-id" readonly></div>
        <div class="field"><label>Registrado por</label><input id="d8-user" readonly></div>
        <div class="field"><label>Tipo de movimiento</label><input id="d8-tmov" readonly></div>
        <div class="field"><label>Detalle</label><input id="d8-det" readonly></div>
        <div class="field"><label>Fecha de movimiento</label><input id="d8-fecha" readonly></div>
        <div class="field"><label>Módulo</label><input id="d8-mod" readonly></div>
        <div class="field"><label id="d8-ori-l">Origen</label><input id="d8-ori" readonly></div>
        <div class="field"><label id="d8-alm-l">Destino</label><input id="d8-alm" readonly></div>
        <div class="field"><label>Concepto contable</label><input id="d8-concepto" readonly></div>
        <div class="field"><label>Valor total S/.</label><input id="d8-valor" readonly style="text-align:right"></div>
        <div class="field full"><label>Observaciones</label><input id="d8-obs" readonly></div>
      </div>
    </div>
    <div class="card" id="d8-docs"></div>
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
          <div><b style="font-size:14px" id="nota-emp">IMPERIOTEX</b><br><span class="hint">Documento interno de control</span></div>
          <div style="text-align:center;border:2px solid var(--primario);border-radius:8px;padding:10px 18px">
            <div id="nota-tipo" style="font-weight:700;font-size:12px;letter-spacing:.5px">NOTA INTERNA</div>
            <div id="nota-num" style="font-size:17px;font-weight:800;color:var(--primario);margin-top:3px">NS-000000</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-top:14px">
          <div><span class="hint">Fecha</span><br><b id="nota-fecha"></b></div>
          <div><span class="hint">Movimiento de origen</span><br><b id="nota-mov"></b></div>
          <div><span class="hint">Origen</span><br><span id="nota-ori"></span></div>
          <div><span class="hint">Destino</span><br><span id="nota-des"></span></div>
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
