<!-- ===== DEBUG (painel recolhível) ===== -->
<details id="debugPanel">
  <summary>🛠 Debug</summary>
  <div class="grid-inner" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">
    <section>
      <p>🔢 Contador de Alterações</p>
      <div class="debug-row">
        <label class="toggle-sw"><input type="checkbox" id="debugContadorToggle" checked onchange="Controle.toggleDebugContador()"><span class="slider"></span></label>
        <span id="debugContadorStatus" style="color:#4CAF50;font-weight:bold;font-size:11px">LIGADO</span>
      </div>
      <div class="debug-row">
        <span class="debug-counter" id="debugContador">0</span>
        <button onclick="Controle.zerarDebugContador()">Zerar</button>
      </div>
    </section>
    <section>
      <p>📡 Log de Polling</p>
      <div class="debug-log" id="debugLog">Nenhum poll ainda...</div>
      <div class="debug-row">
        <button onclick="Controle.limparDebugLog()">Limpar</button>
        <span id="debugLogCount" style="font-size:10px;color:#aaa">0 registros</span>
      </div>
    </section>
    <section>
      <p>⚡ Ping / Latência</p>
      <div class="debug-row">
        <span class="debug-ping fast" id="debugPing">-- ms</span>
        <span id="debugPingStatus" style="font-size:10px;color:#aaa">Aguardando...</span>
      </div>
    </section>
    <section>
      <p>📶 Status da Conexão</p>
      <div class="debug-row">
        <label class="toggle-sw"><input type="checkbox" id="debugStatusToggle" checked onchange="Controle.toggleDebugStatus()"><span class="slider"></span></label>
        <span id="debugStatusLabel" style="color:#4CAF50;font-weight:bold;font-size:11px">VISIVEL</span>
      </div>
    </section>
    <section>
      <p>✏️ Forçar Estado (JSON Direto)</p>
      <textarea class="debug-json" id="debugJsonInput" placeholder='{"placar":{"golsA":"1",...}}'></textarea>
      <div class="debug-row">
        <button onclick="Controle.forcarEstado()" style="background:#ff9800;color:#000">Forçar POST</button>
        <button onclick="document.getElementById('debugJsonInput').value=''">Limpar</button>
        <span style="color:#ff9800;font-size:10px">⚠ Sobrescreve estado real</span>
      </div>
    </section>
  </div>
</details>
