/* INVENTARIOS · GI-09 Crear Ingreso — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-09 · Crear Ingreso -->
  <section class="screen" id="scr-gi09">
    <div class="screen-head">
      <h1>MOVIMIENTO: INGRESO</h1><span class="code">GI-09</span>
      <span class="badge" style="background:var(--borrador)">Borrador</span>
      <div class="spacer"></div>
      <button class="btn btn-danger" onclick="toast('Ingreso cancelado (solo posible en Borrador)');go('gi07')">Cancelar</button>
      <button class="btn btn-secondary" onclick="toast('Borrador guardado')">Guardar borrador</button>
      <button class="btn btn-primary" onclick="openModal('m-gi09b')">Confirmar Ingreso</button>
    </div>
    <div class="card">
      <b style="font-size:13px">Detalles generales</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>ID / Código (auto)</label><input value="ING-000514" readonly></div>
        <div class="field"><label>Creado por (auto)</label><input value="USER00 · Logística" readonly></div>
        <div class="field"><label>Tipo de documento</label><input value="Ingreso" readonly></div>
        <div class="field"><label>Tipo de ingreso</label>
          <select><option>Compras Directas</option><option>Devoluciones de Clientes</option><option>Transferencias Internas</option><option>Reabastecimiento interno</option><option>Donaciones o intercambios</option><option>Compras de excedentes o remanentes</option><option>Reacondicionamiento de productos</option><option>Balanceo</option><option>Regularización de inventario (sobrante)</option><option>Carga inicial de stock</option><option>Producto fallado</option><option>Otros</option></select></div>
        <div class="field"><label>N° de documento</label>
          <div style="display:flex;gap:8px"><input id="gi09-ndoc" placeholder="Texto libre u OC vinculada" style="flex:1"><button class="btn btn-secondary btn-sm" onclick="openModal('m-gi09a')">Vincular</button></div></div>
        <div class="field"><label>Fecha de movimiento</label><input type="date" value="2026-07-19"></div>
        <div class="field"><label>Origen</label>
          <div style="display:flex;gap:8px"><select style="width:150px"><option>Proveedor</option><option>Cliente</option><option>Orden de fabricación</option></select><input id="gi09-origen" placeholder="Seleccionar…" style="flex:1"></div></div>
        <div class="field"><label>Almacén destino</label><select id="gi09-alm"><option value="">Seleccionar…</option><option selected>SB-ALM-MPT · MP Telas</option><option>SB-ALM-MPA · MP Avíos</option><option>SB-ALM-PT · Central Mercadería</option></select></div>
        <div class="field"><label id="lbl-refetq-09">Referencia de etiqueta <span class="hint">(libre · se imprime en la etiqueta)</span></label>
          <input id="gi09-refetq" placeholder="Ej. REF-2026-0009"></div>
        <div class="field full"><label>Observaciones</label><input id="gi09-obs" placeholder="Diferencias contra lo vinculado quedan registradas aquí y notifican a Logística"></div>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <b style="font-size:13px">Listado de artículos</b>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" onclick="openBuscador('gi09')">+ Agregar artículo</button>
      </div>
      <table class="grid subtable">
        <thead><tr><th style="width:40px">#</th><th>Código</th><th>Nombre</th><th>Unidad</th><th style="width:110px;text-align:right">Cantidad</th><th style="width:130px;text-align:right">Precio base S/.</th><th>Lote</th><th style="width:70px"></th></tr></thead>
        <tbody id="gi09-items">
          <tr><td>1</td><td>MP-0012</td><td>TELA DENIM 12 OZ AZUL</td><td>MT</td><td><input value="242.40" style="text-align:right"></td><td><input value="19.40" style="text-align:right"></td><td>LOT-2026-0134 <span class="hint">(auto)</span></td><td><button class="btn-link">Eliminar</button></td></tr>
        </tbody>
        <tfoot><tr><td colspan="4" style="text-align:right;font-weight:600">Totales</td><td style="text-align:right;font-weight:600" id="gi09-totq">242.40</td><td style="text-align:right;font-weight:600" id="gi09-tots">S/. 4,702.56</td><td colspan="2"></td></tr></tfoot>
      </table>
  </section>
`);

Vistas.modales(String.raw`
<!-- GI-09a Vincular a documento existente -->
<div class="overlay" id="m-gi09a">
  <div class="modal lg">
    <div class="modal-h"><b>Vincular a documento existente</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-09a</span><span class="x" onclick="closeModal('m-gi09a')">✕</span></div>
    <div class="modal-b">
      <div class="field wide" style="margin-bottom:12px"><label>Buscar Orden de Compra / documento</label><input placeholder="Ej. OC-000231, proveedor…"></div>
      <table class="grid subtable">
        <thead><tr><th>N° documento</th><th>Proveedor</th><th>Fecha</th><th style="text-align:right">Total S/.</th><th style="width:90px"></th></tr></thead>
        <tbody>
          <tr><td>OC-000231</td><td>TEXTIL SAN JACINTO SAC</td><td>10/07/2026</td><td style="text-align:right">4,990.56</td><td><button class="btn btn-primary btn-sm" onclick="vincularOC()">Vincular</button></td></tr>
          <tr><td>OC-000228</td><td>AVÍOS DEL SUR EIRL</td><td>08/07/2026</td><td style="text-align:right">1,240.00</td><td><button class="btn btn-primary btn-sm" onclick="vincularOC()">Vincular</button></td></tr>
        </tbody>
      </table>
      <p class="hint" style="margin-top:10px">Al vincular se precargan proveedor e ítems con cantidades y precios, editables para registrar diferencias <span class="warn" title="Inferencia a afinar">⚠</span>.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi09a')">Cancelar</button></div>
  </div>
</div>

<!-- GI-09b Modal Confirmar Ingreso (CT-05) -->
<div class="overlay" id="m-gi09b">
  <div class="modal">
    <div class="modal-h"><b>Confirmar Ingreso</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-09b · CT-05</span><span class="x" onclick="closeModal('m-gi09b')">✕</span></div>
    <div class="modal-b">
      <p>¿Está seguro de confirmar este ingreso?</p>
      <p class="hint" style="margin-top:8px">Confirmar es irreversible: ejecuta el efecto en stock y Kardex y congela el documento.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi09b')">No</button><button class="btn btn-primary" onclick="closeModal('m-gi09b');toast('Ingreso confirmado: stock y Kardex actualizados');showDetalle('ing513')">Sí</button></div>
  </div>
</div>
`);
