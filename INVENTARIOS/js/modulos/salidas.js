/* INVENTARIOS · GI-10 Crear Salida */
/* ===== GI-10 · vincular documentos y completar ===== */
const GI10_HEAD_LINK='<tr><th style="width:40px">#</th><th>Código</th><th>Nombre</th><th>Unidad</th><th style="width:130px;text-align:right">Cant. Solicitada</th><th style="width:190px">Lote</th><th style="width:60px"></th></tr>';
function loteSel(op){return '<td><select style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px">'+op+'</select></td>'}
function setLinked(rows){document.getElementById('gi10-head').innerHTML=GI10_HEAD_LINK;document.getElementById('gi10-items').innerHTML=rows;}
function vincularVenta(){
  closeModal('m-gi10a');
  document.getElementById('gi10-ndoc').value="F001-002341";
  document.getElementById('gi10-tipo').value="Venta al por mayor";
  document.getElementById('gi10-alm').value="SB-ALM-PT · Central Mercadería";
  document.getElementById('gi10-dsel').value="Cliente";
  document.getElementById('gi10-dest').value="COMERCIAL ANDINA SAC";
  setLinked(
   '<tr><td>1</td><td>ART-0001-28AZ</td><td>PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL</td><td>UND</td><td style="text-align:right">40</td>'+loteSel('<option>REF-2026-0009 · 38 (FIFO)</option>')+'<td><button class="btn-link">Eliminar</button></td></tr>'+
   '<tr><td>2</td><td>ART-0001-30AZ</td><td>PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL</td><td>UND</td><td style="text-align:right">4</td>'+loteSel('<option>REF-2026-0011 · 12 (FIFO)</option>')+'<td><button class="btn-link">Eliminar</button></td></tr>');
  toast("F001-002341 vinculada: cliente e ítems con cantidad solicitada");
}
function vincularOP(){
  closeModal('m-gi10a');
  document.getElementById('gi10-ndoc').value="OF-000123";
  document.getElementById('gi10-tipo').value="Retiros internos";
  document.getElementById('gi10-alm').value="SB-ALM-MPT · MP Telas";
  document.getElementById('gi10-dsel').value="Orden de fabricación";
  document.getElementById('gi10-dest').value="OF-000123 · Pantalón Zuleika";
  setLinked(
   '<tr><td>1</td><td>MP-0012</td><td>TELA DENIM 12 OZ AZUL</td><td>MT</td><td style="text-align:right">84.00</td>'+loteSel('<option>LOT-2026-0107 · 120.00 (FIFO)</option><option>LOT-2026-0121 · 162.40</option>')+'<td><button class="btn-link">Eliminar</button></td></tr>'+
   '<tr><td>2</td><td>MP-0031</td><td>HILO POLIESTER AZUL</td><td>KG</td><td style="text-align:right">4.80</td>'+loteSel('<option>LOT-2026-0110 · 30.00 (FIFO)</option>')+'<td><button class="btn-link">Eliminar</button></td></tr>');
  toast("OF-000123 vinculada: ítems del requerimiento de producción");
}
function completarSalida(){
  toast("Salida completada: stock descontado, Kardex y usuario ejecutor registrados");
  showDetalle('sal392');
}
