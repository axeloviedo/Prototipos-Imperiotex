/* INVENTARIOS · GI-06 Kardex — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-06 · Kardex -->
  <section class="screen" id="scr-gi06">
    <div class="screen-head">
      <h1>Kardex</h1><span class="code">GI-06</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary">Exportar <span class="warn" title="Inferencia a afinar">⚠</span></button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Desde</label><input type="date" value="2026-07-01"></div>
        <div class="field"><label>Hasta</label><input type="date" value="2026-07-19"></div>
        <div class="field"><label>Almacén</label><select><option>Todos los permitidos</option><option>SB-ALM-MPT · MP Telas</option><option>SB-ALM-PT · Central Mercadería</option></select></div>
        <div class="field"><label>Artículo</label><input placeholder="Buscar artículo…"></div>
        <div class="field"><label>Lote</label><input placeholder="Ej. LOT-2026-0134"></div>
      </div>
    </div>

    <div style="margin-bottom:8px"><b style="font-size:14px">TELA DENIM 12 OZ AZUL</b> <span class="hint">· SB-ALM-MPT · MP Telas · MT</span></div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>Fecha</th><th>Detalle del movimiento</th><th>ID comprobante</th><th>Responsable</th><th style="text-align:right">Entrada</th><th style="text-align:right">Salida</th><th style="text-align:right">Existencias</th><th style="text-align:right">Costo Prom. S/. <span class="warn" title="Columna opcional, inferencia">⚠</span></th><th style="text-align:right">Saldo Valorizado S/. <span class="warn" title="Columna opcional, inferencia">⚠</span></th></tr></thead>
        <tbody>
          <tr><td>02/07/2026</td><td>Ingreso - Compras Directas · Lote LOT-2026-0107</td><td><button class="btn-link" onclick="go('gi08')">ING-000498</button></td><td>TEXTIL SAN JACINTO SAC</td><td style="text-align:right">120.00</td><td style="text-align:right"></td><td style="text-align:right">120.00</td><td style="text-align:right">18.50</td><td style="text-align:right">2,220.00</td></tr>
          <tr><td>08/07/2026</td><td>Salida - Retiros internos (OF-000119)</td><td><button class="btn-link" onclick="go('gi08')">SAL-000371</button></td><td>USER03 · Producción</td><td style="text-align:right"></td><td style="text-align:right">80.00</td><td style="text-align:right">40.00</td><td style="text-align:right">18.50</td><td style="text-align:right">740.00</td></tr>
          <tr><td>15/07/2026</td><td>Ingreso - Compras Directas · Lote LOT-2026-0134</td><td><button class="btn-link" onclick="go('gi08')">ING-000513</button></td><td>TEXTIL SAN JACINTO SAC</td><td style="text-align:right">242.40</td><td style="text-align:right"></td><td style="text-align:right">282.40</td><td style="text-align:right">19.10</td><td style="text-align:right">5,393.84</td></tr>
        </tbody>
      </table>
    </div>

    <div style="margin:16px 0 8px"><b style="font-size:14px">PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL</b> <span class="hint">· SB-ALM-PT · Central Mercadería · UND</span></div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>Fecha</th><th>Detalle del movimiento</th><th>ID comprobante</th><th>Responsable</th><th style="text-align:right">Entrada</th><th style="text-align:right">Salida</th><th style="text-align:right">Existencias</th><th style="text-align:right">Costo Prom. S/. <span class="warn" title="Columna opcional, inferencia">⚠</span></th><th style="text-align:right">Saldo Valorizado S/. <span class="warn" title="Columna opcional, inferencia">⚠</span></th></tr></thead>
        <tbody>
          <tr><td>15/06/2026</td><td>Ingreso - Recibo de producción · Lote LOT-2026-0009</td><td><button class="btn-link" onclick="go('gi08')">ING-000476</button></td><td>Judith M. · Logística</td><td style="text-align:right">60</td><td style="text-align:right"></td><td style="text-align:right">60</td><td style="text-align:right">42.30</td><td style="text-align:right">2,538.00</td></tr>
          <tr><td>13/07/2026</td><td>Transferencia interna a tienda (TRF-000214)</td><td><button class="btn-link" onclick="go('gi11')">TRF-000214</button></td><td>USER00 · Logística</td><td style="text-align:right"></td><td style="text-align:right">6</td><td style="text-align:right">54</td><td style="text-align:right">42.30</td><td style="text-align:right">2,284.20</td></tr>
          <tr><td>14/07/2026</td><td>Salida - Venta al por menor (POS)</td><td><button class="btn-link" onclick="showDetalle('sal387')">SAL-000387</button></td><td>Cliente venta tienda</td><td style="text-align:right"></td><td style="text-align:right">3</td><td style="text-align:right">51</td><td style="text-align:right">42.30</td><td style="text-align:right">2,157.30</td></tr>
          <tr><td>16/07/2026</td><td>Salida - Regularización de inventario (faltante)</td><td><button class="btn-link" onclick="toast('Ejemplo visual · salida por regularización de inventario en tienda')">SAL-000401</button></td><td>USER00 · Logística</td><td style="text-align:right"></td><td style="text-align:right">1</td><td style="text-align:right">50</td><td style="text-align:right">42.30</td><td style="text-align:right">2,115.00</td></tr>
        </tbody>
      </table>
    </div>

    <div style="margin:16px 0 8px"><b style="font-size:14px">BOTON METALICO 17MM</b> <span class="hint">· SB-ALM-MPA · MP Avíos · UND</span></div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>Fecha</th><th>Detalle del movimiento</th><th>ID comprobante</th><th>Responsable</th><th style="text-align:right">Entrada</th><th style="text-align:right">Salida</th><th style="text-align:right">Existencias</th><th style="text-align:right">Costo Prom. S/. <span class="warn" title="Columna opcional, inferencia">⚠</span></th><th style="text-align:right">Saldo Valorizado S/. <span class="warn" title="Columna opcional, inferencia">⚠</span></th></tr></thead>
        <tbody>
          <tr><td>05/07/2026</td><td>Ingreso - Compras Directas (OC-000225)</td><td><button class="btn-link" onclick="go('gi08')">ING-000502</button></td><td>AVÍOS DEL SUR EIRL</td><td style="text-align:right">500</td><td style="text-align:right"></td><td style="text-align:right">500</td><td style="text-align:right">0.35</td><td style="text-align:right">175.00</td></tr>
          <tr><td>09/07/2026</td><td>Salida - Retiros internos (OF-000119)</td><td><button class="btn-link" onclick="go('gi08')">SAL-000373</button></td><td>USER03 · Producción</td><td style="text-align:right"></td><td style="text-align:right">180</td><td style="text-align:right">320</td><td style="text-align:right">0.35</td><td style="text-align:right">112.00</td></tr>
          <tr><td>10/07/2026</td><td>Ingreso - Regularización de inventario (sobrante)</td><td><button class="btn-link" onclick="toast('Ejemplo visual · ingreso por regularización de inventario (conteo físico)')">ING-000507</button></td><td>USER00 · Logística</td><td style="text-align:right">20</td><td style="text-align:right"></td><td style="text-align:right">340</td><td style="text-align:right">0.35</td><td style="text-align:right">119.00</td></tr>
        </tbody>
      </table>
    </div>

    <div style="margin:16px 0 8px"><b style="font-size:14px">PANTALON WIDE LEG ZULEIKA CRUDO TALLA 28</b> <span class="hint">· SB-ALM-TRN · Almacén Transición · UND · solo cantidades (Sin Kardex valorizado)</span></div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>Fecha</th><th>Detalle del movimiento</th><th>ID comprobante</th><th>Responsable</th><th style="text-align:right">Entrada</th><th style="text-align:right">Salida</th><th style="text-align:right">Existencias</th></tr></thead>
        <tbody>
          <tr><td>11/07/2026</td><td>Ingreso - Orden de Fabricación (OF-000122)</td><td><button class="btn-link" onclick="go('gi08')">ING-000506</button></td><td>USER03 · Producción</td><td style="text-align:right">60</td><td style="text-align:right"></td><td style="text-align:right">60</td></tr>
          <tr><td>12/07/2026</td><td>Transferencia - Envío a servicio de terceros (almacén de tránsito)</td><td><button class="btn-link" onclick="go('gi11')">TRF-000213</button></td><td>LAVANDERIA INDUSTRIAL DEL SUR SAC</td><td style="text-align:right"></td><td style="text-align:right">60</td><td style="text-align:right">0</td></tr>
        </tbody>
      </table>
    </div>
    <p class="hint">Solo artículos inventariables. El promedio ponderado se recalcula únicamente con Ingresos (con precio). El almacén PPT muestra solo cantidades (sin columnas valorizadas).</p>
  </section>
`);
