/* INVENTARIOS · GI-10 Crear Salida — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-10 · Crear Salida / Nota de Entrega -->
  <section class="screen" id="scr-gi10">
    <div class="screen-head">
      <h1>MOVIMIENTO: SALIDA</h1><span class="code">GI-10</span>
      <span class="badge" style="background:var(--borrador)">Borrador</span>
      <div class="spacer"></div>
      <button class="btn btn-danger" onclick="toast('Salida cancelada (solo posible en Borrador)');go('gi07')">Cancelar</button>
      <button class="btn btn-secondary" onclick="toast('Borrador guardado')">Guardar borrador</button>
      <button class="btn btn-primary" onclick="openModal('m-gi10b')">Completar Salida</button>
    </div>
    <div class="card">
      <b style="font-size:13px">Detalles generales</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>ID / Código (auto)</label><input value="SAL-000392" readonly></div>
        <div class="field"><label>Creado por (auto)</label><input value="USER00 · Logística" readonly></div>
        <div class="field"><label>Tipo de documento</label><input value="Salida" readonly></div>
        <div class="field"><label>Tipo de salida</label>
          <select id="gi10-tipo"><option>Retiros internos</option><option>Venta al por mayor</option><option>Venta al por menor</option><option>Devoluciones a proveedores</option><option>Transferencias internas</option><option>Envíos a distribuidores o socios</option><option>Donaciones</option><option>Desperdicio o eliminación</option><option>Préstamos o alquileres</option><option>Muestras gratuitas</option><option>Balanceo</option><option>Regularización de inventario (faltante)</option><option>Producto fallado</option><option>Otros</option></select></div>
        <div class="field"><label>N° de documento</label>
          <div style="display:flex;gap:8px"><input id="gi10-ndoc" placeholder="Texto libre o venta vinculada" style="flex:1"><button class="btn btn-secondary btn-sm" onclick="openModal('m-gi10a')">Vincular</button></div></div>
        <div class="field"><label>Fecha de movimiento</label><input type="date" value="2026-07-19"></div>
        <div class="field"><label>Almacén origen</label><select id="gi10-alm"><option>SB-ALM-MPT · MP Telas</option><option>SB-ALM-MPA · MP Avíos</option><option>SB-ALM-PT · Central Mercadería</option><option>SB-ALM-TRN · Almacén Transición</option></select></div>
        <div class="field"><label>Destino</label>
          <div style="display:flex;gap:8px"><select id="gi10-dsel" style="width:170px"><option>Área interna</option><option>Cliente</option><option>Orden de fabricación</option><option>Distribuidor</option><option>Proveedor</option></select><input id="gi10-dest" value="Taller Zárate" style="flex:1"></div></div>
        <div class="field full"><label>Observaciones</label><input placeholder="Los parciales y pendientes quedan registrados en el documento"></div>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <b style="font-size:13px">Listado de artículos</b>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" onclick="openBuscador('gi10')">+ Agregar artículo</button>
      </div>
      <table class="grid subtable" id="gi10-tabla">
        <thead id="gi10-head"><tr><th style="width:40px">#</th><th>Código</th><th>Nombre</th><th>Unidad</th><th style="width:110px;text-align:right">Cantidad</th><th style="width:130px;text-align:right">Precio Base S/. <span class="warn" title="A confirmar: el BPD indica salidas sin valorización en pantalla">⚠</span></th><th style="width:190px">Lote</th><th style="width:60px"></th></tr></thead>
        <tbody id="gi10-items">
          <tr>
            <td>1</td><td>MP-0012</td><td>TELA DENIM 12 OZ AZUL</td><td>MT</td>
            <td><input value="84.00" style="text-align:right"></td>
            <td><input value="19.10" style="text-align:right"></td>
            <td><select style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px"><option>LOT-2026-0107 · 120.00 (FIFO)</option><option>LOT-2026-0121 · 162.40</option></select></td>
            <td><button class="btn-link">Eliminar</button></td>
          </tr>
        </tbody>
      </table>
      <p class="hint" style="margin-top:8px">Salida libre: Cantidad, Precio Base y Lote. Salida vinculada a Venta u Orden de Fabricación: solo Cant. Solicitada (la cantidad ya viene del proceso de solicitud y orden). Lote con default FIFO. Completar descuenta stock, escribe el Kardex y registra el usuario ejecutor.</p>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- GI-10a Vincular a documento -->
<div class="overlay" id="m-gi10a">
  <div class="modal lg">
    <div class="modal-h"><b>Vincular a documento</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-10a</span><span class="x" onclick="closeModal('m-gi10a')">✕</span></div>
    <div class="modal-b">
      <div class="filters" style="margin-bottom:12px">
        <div class="field"><label>Buscar</label><input placeholder="N° documento, cliente, OF…"></div>
        <div class="field"><label>Tipo de documento</label><select><option>Todos</option><option>Venta / Factura</option><option>Orden de Fabricación</option></select></div>
      </div>
      <table class="grid subtable">
        <thead><tr><th>N° documento</th><th>Tipo</th><th>Cliente / Referencia</th><th>Fecha</th><th style="width:90px"></th></tr></thead>
        <tbody>
          <tr><td>F001-002341</td><td>Venta / Factura</td><td>COMERCIAL ANDINA SAC</td><td>18/07/2026</td><td><button class="btn btn-primary btn-sm" onclick="vincularVenta()">Vincular</button></td></tr>
          <tr><td>OF-000123</td><td>Orden de Fabricación</td><td>Pantalón Zuleika · Taller Zárate</td><td>17/07/2026</td><td><button class="btn btn-primary btn-sm" onclick="vincularOP()">Vincular</button></td></tr>
        </tbody>
      </table>
      <p class="hint" style="margin-top:10px">Al vincular se precargan destino e ítems con su cantidad solicitada. El precio de venta se obtiene de la venta/factura, no de esta pantalla.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi10a')">Cancelar</button></div>
  </div>
</div>

<!-- GI-10b Modal Confirmar Salida (CT-05) -->
<div class="overlay" id="m-gi10b">
  <div class="modal">
    <div class="modal-h"><b>Completar Salida</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-10b · CT-05</span><span class="x" onclick="closeModal('m-gi10b')">✕</span></div>
    <div class="modal-b">
      <p>¿Está seguro de confirmar esta salida?</p>
      <p class="hint" style="margin-top:8px">Confirmar es irreversible: descuenta stock en tiempo real, escribe el Kardex y registra el usuario ejecutor. Los pendientes quedan registrados en el documento.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi10b')">No</button><button class="btn btn-primary" onclick="closeModal('m-gi10b');completarSalida()">Sí</button></div>
  </div>
</div>
`);
