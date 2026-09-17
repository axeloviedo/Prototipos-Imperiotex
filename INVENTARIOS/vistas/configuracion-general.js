/* INVENTARIOS · GI-CFG Configuración General y GI-19 Series de Documentos — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-CFG · Configuración General -->
  <section class="screen" id="scr-mcfg">
    <div class="screen-head">
      <h1>Configuración General</h1><span class="code">GI-CFG</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="guardarCfg()">Guardar</button>
    </div>
    <p class="hint" style="margin:0 0 14px">Parámetros que aplican a toda la empresa activa. Existen para que lo que cambia entre clientes no quede fijado en el código: cada uno se activa o se apaga aquí, y las pantallas se comportan en consecuencia.</p>

    <div class="card">
      <b style="font-size:13px">Precios de venta</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field full"><div class="check"><input type="checkbox" id="cfg-precio-min" checked onchange="cfgPrecioMin()"> Verificar precio mínimo de venta en toda la empresa</div></div>
      </div>
      <p class="hint">Con esta opción activa, cualquier artículo cuyo precio de venta mínimo sea mayor que cero bloquea la venta por debajo de ese importe, sin necesidad de marcarlo artículo por artículo. Si se apaga, la verificación queda a criterio del check de cada artículo.</p>
    </div>

    <div class="card">
      <b style="font-size:13px">Etiquetas de producto</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>Nombre del campo de referencia</label>
          <input id="cfg-nom-etq" value="N° Referencia"></div>
        <div class="field"><div class="check" style="margin-top:22px"><input type="checkbox" id="cfg-imp-ref" checked onchange="cfgImprimirRef()"> Imprimir el valor de referencia en la etiqueta</div></div>
      </div>
      <p class="hint">El código de barras identifica al artículo y no cambia nunca. La referencia es un dato libre que se captura en el <button class="btn-link" onclick="go('gi09')">movimiento de ingreso</button> y se imprime debajo del código: aquí es el N° Referencia, en otra empresa puede ser una campaña o una fecha de vencimiento. Renombre el campo según lo que signifique para el cliente.</p>
      <div class="card" style="margin:12px 0 0;border-left:4px solid var(--pendiente);background:#FFFBEB">
        <b style="font-size:12.5px">El N° Referencia no es un lote</b>
        <p class="hint" style="margin-top:5px">Una misma tela puede alcanzar para varias órdenes de fabricación, y una orden puede consumir varios lotes. El lote es un atributo del movimiento y del saldo, no del artículo ni del código de barras. Si el cliente quiere ver de qué N° Referencia salió una prenda, eso es esta referencia, no un lote.</p>
      </div>
    </div>

    <div class="card">
      <b style="font-size:13px">Lotes y series</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>Consumo de lotes en las salidas</label>
          <select id="cfg-lotes-modo"><option value="manual" selected>El usuario elige el lote</option><option value="fifo">Automático · primero el más antiguo (FIFO)</option><option value="fefo">Automático · primero el que vence antes (FEFO)</option></select></div>
        <div class="field"><label>Aplica a</label><input value="Artículos con control de inventario por Lote" readonly></div>
      </div>
      <p class="hint">El sistema soporta lotes siempre; cada artículo decide si los usa en su pestaña Inventario (Control de inventario = Lote). El consumo automático solo es recomendable cuando el almacén físico está ordenado: si no lo está, agrava los descuadres en lugar de resolverlos.</p>
    </div>
  </section>

  <!-- ==================================================== GI-19 · Series de Documentos -->
  <section class="screen" id="scr-gi19">
    <div class="screen-head">
      <h1>Series de Documentos Internos</h1><span class="code">GI-19</span>
      <div class="spacer"></div>
    </div>
    <div class="card">
      <p class="hint">Series y correlativos de las notas internas de movimiento. El próximo correlativo es editable: al imprimir la primera nota de un movimiento se asigna el número y la serie avanza sola. Correlativo continuo, sin reinicio anual.</p>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th>Documento</th><th style="width:90px">Serie</th><th style="width:150px;text-align:right">Próximo correlativo</th><th style="width:110px;text-align:right">Emitidos</th><th>Se imprime desde</th></tr></thead>
        <tbody id="series-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Las notas internas son documentos de control sin valor tributario: el traslado por vía pública se sustenta con la Guía de Remisión Electrónica (GI-14). <span class="warn" title="Formatos definitivos de impresión a validar con Logística">⚠</span></p>
    </div>

    <div class="card">
      <b style="font-size:13px">Series de Guías de Remisión Electrónicas (referencial)</b>
      <p class="hint" style="margin-top:5px">Series GRE por almacén de despacho. Solo visual: en el prototipo todas las guías se numeran con la serie <b>T001-</b> de la base compartida (la numeración real la controla la emisión electrónica ante SUNAT). Las guías se emiten desde GI-14 / GI-15.</p>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th>Documento</th><th style="width:90px">Serie</th><th style="width:150px;text-align:right">Próximo correlativo</th><th>Almacén de despacho</th></tr></thead>
        <tbody id="series-gre-body"></tbody>
      </table>
    </div>
  </section>
`);
