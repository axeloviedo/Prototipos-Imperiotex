/* INVENTARIOS · GI-23 decisiones de la Solicitud de Fabricación (V°B°, aprobación, rechazo, devolución) — HTML */
Vistas.modales(String.raw`
<!-- GI-23a V°B° de Logística -->
<div class="overlay" id="m-gi23a">
  <div class="modal">
    <div class="modal-h"><b>Dar V°B° de Logística</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-23a · CT-05</span><span class="x" onclick="closeModal('m-gi23a')">✕</span></div>
    <div class="modal-b">
      <p>¿Confirma el V°B° de Logística para esta solicitud de fabricación?</p>
      <p class="hint" style="margin-top:8px">Se registra en el historial con su usuario y hora. Con el V°B° y la aprobación de Gerencia la solicitud queda Aprobada y compromete la materia prima de todas las fases.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi23a')">No</button><button class="btn btn-primary" onclick="darVB()">Sí, dar V°B°</button></div>
  </div>
</div>

<!-- GI-23b Aprobación de Gerencia -->
<div class="overlay" id="m-gi23b">
  <div class="modal">
    <div class="modal-h"><b>Aprobar solicitud (Gerencia)</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-23b · CT-05</span><span class="x" onclick="closeModal('m-gi23b')">✕</span></div>
    <div class="modal-b">
      <p>¿Aprueba esta solicitud de fabricación para producción?</p>
      <p class="hint" style="margin-top:8px">Con ambas decisiones registradas la solicitud pasa a Aprobada, compromete la materia prima y queda en solo lectura.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi23b')">No</button><button class="btn btn-primary" onclick="aprobarSP()">Sí, aprobar</button></div>
  </div>
</div>

<!-- GI-23c Rechazo -->
<div class="overlay" id="m-gi23c">
  <div class="modal">
    <div class="modal-h"><b>Rechazar solicitud</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-23c</span><span class="x" onclick="closeModal('m-gi23c')">✕</span></div>
    <div class="modal-b">
      <p style="margin-bottom:10px">El rechazo queda en el historial con el motivo; la solicitud se puede corregir y reenviar.</p>
      <div class="field wide"><label>Motivo del rechazo (obligatorio)</label><textarea id="sp-motivo-rech" rows="3" placeholder="Ej. fuera de la proyección acordada para el mes"></textarea></div>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi23c')">Volver</button><button class="btn btn-danger" onclick="rechazarSP()">Rechazar</button></div>
  </div>
</div>

<!-- GI-23d Solicitar modificación -->
<div class="overlay" id="m-gi23d">
  <div class="modal">
    <div class="modal-h"><b>Solicitar modificación</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-23d</span><span class="x" onclick="closeModal('m-gi23d')">✕</span></div>
    <div class="modal-b">
      <p style="margin-bottom:10px">La solicitud vuelve a Borrador (editable); las Solicitudes de Materiales ya generadas se conservan.</p>
      <div class="field wide"><label>Comentario (obligatorio)</label><textarea id="sp-coment-mod" rows="3" placeholder="Ej. ajustar las cantidades de la talla 30 antes de aprobar"></textarea></div>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi23d')">Volver</button><button class="btn btn-primary" onclick="devolverSP()">Devolver</button></div>
  </div>
</div>
`);
