/* INVENTARIOS · GI-09 Crear Ingreso */
/* ===== GI-09 · vincular OC y agregar artículo ===== */
function vincularOC(){
  closeModal('m-gi09a');
  document.getElementById('gi09-ndoc').value="OC-000231";
  document.getElementById('gi09-origen').value="TEXTIL SAN JACINTO SAC";
  document.getElementById('gi09-items').innerHTML=
    '<tr><td>1</td><td>MP-0012</td><td>TELA DENIM 12 OZ AZUL</td><td>MT</td><td><input value="242.40" style="text-align:right"></td><td><input value="19.40" style="text-align:right"></td><td>LOT-2026-0134 <span class="hint">(auto)</span></td><td><button class="btn-link">Eliminar</button></td></tr>'+
    '<tr><td>2</td><td>MP-0031</td><td>HILO POLIESTER AZUL</td><td>KG</td><td><input value="12.00" style="text-align:right"></td><td><input value="24.00" style="text-align:right"></td><td>LOT-2026-0135 <span class="hint">(auto)</span></td><td><button class="btn-link">Eliminar</button></td></tr>';
  document.getElementById('gi09-totq').textContent="254.40";
  document.getElementById('gi09-tots').textContent="S/. 4,990.56";
  toast("OC-000231 vinculada: proveedor e ítems precargados");
}
function agregarItem(){
  closeModal('m-ct03');
  const tb=document.getElementById('gi09-items');
  const n=tb.rows.length+1;
  const tr=tb.insertRow();
  tr.innerHTML='<td>'+n+'</td><td>MP-0031</td><td>HILO POLIESTER AZUL</td><td>KG</td><td><input value="1.00" style="text-align:right"></td><td><input value="24.00" style="text-align:right"></td><td><select style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px"><option>Nuevo lote (auto)</option><option>LOT-2026-0110 · 30.00 KG</option><option>LOT-2026-0098 · 15.00 KG</option></select></td><td><button class="btn-link">Eliminar</button></td>';
  toast("Artículo agregado");
}
