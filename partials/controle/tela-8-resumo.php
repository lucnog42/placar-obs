<section class="tela" id="tela-8" data-titulo="Resumo & Salvar">
  <h2 class="titulo">📋 Resumo &amp; Salvar</h2>
  <div class="grid-inner">
    <section class="full resumo-card">
      <p>Resumo da configuração <span class="hint">atualize e confira antes de salvar</span></p>
      <div id="resumoConteudo"><span style="color:#888;font-size:11px">Carregando…</span></div>
    </section>
    <section class="full">
      <p>💾 Salvar Configuração Atual</p>
      <div style="display:flex;gap:4px;align-items:center">
        <span style="font-size:11px;color:#aaa;flex:1">Nome auto: <b style="color:#ffd700" id="presetNomeAuto">TimeA_x_TimeB</b><br><span id="presetInfoExtra" style="font-size:10px;color:#666"></span></span>
        <button onclick="Controle.salvarPreset()" style="background:#4CAF50;color:#fff">💾 Salvar preset</button>
      </div>
    </section>
    <section class="full">
      <p>📥 Importar / 📤 Exportar</p>
      <button onclick="Controle.importarPresets()" style="background:#2196F3;color:#fff">📁 Importar .json</button>
      <button onclick="Controle.exportarPresets()" style="background:#FF9800;color:#fff;margin-left:4px">📤 Exportar Todos</button>
      <span style="font-size:10px;color:#aaa;margin-left:6px">Importe ou exporte presets em lote</span>
    </section>
  </div>
</section>
