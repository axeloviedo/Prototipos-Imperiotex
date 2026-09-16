/* INVENTARIOS · GI-03 Almacenes y GI-04 ficha del almacén */
/* ===== GI-04 · permisos por almacén y sedes ===== */
const ROLES_OPTS='<option>Logística</option><option>Gerencia</option><option>Comercial</option><option>Vendedor Tienda</option><option>Producción</option>';
function addPermiso(btn){
  const tb=document.getElementById('gi04-permisos-body');
  const tr=document.createElement('tr');
  tr.innerHTML='<td><select style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px">'+ROLES_OPTS+'</select></td>'+
   '<td style="text-align:center"><input type="checkbox" checked></td>'+
   '<td><button class="btn-link" onclick="this.closest(\'tr\').remove()">Quitar</button></td>';
  tb.appendChild(tr);
}
function togglePermisosAlm(on){document.getElementById('gi04-permisos-card').style.display=on?"block":"none"}
function fillSedes(){
  const opts=SEDES.map(s=>'<option>'+s.nom+'</option>').join('');
  const g4=document.getElementById('gi04-sede'); if(g4)g4.innerHTML=opts;
  const f=document.getElementById('f-alm-sede'); if(f&&f.options.length<=1){SEDES.forEach(s=>{const o=document.createElement('option');o.textContent=s.nom;o.value=s.nom;f.appendChild(o)})}
}

/* ===== GI-04 · restricción de grupos de artículo ===== */
/* (La "Clase de almacén" se eliminó; el comportamiento vive en los indicadores: en tránsito / Kardex valorizado / recosteo.) */
