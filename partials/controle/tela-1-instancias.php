<section class="tela ativa" id="tela-1" data-titulo="Instâncias">
  <h2 class="titulo">🎛 Instâncias (sub-controles)</h2>
  <div class="grid-inner">
    <section class="full">
      <p>🔗 Instâncias de placar <span class="hint">selecione uma para usar o controle (obrigatório)</span></p>
      <div id="instanciaAviso" style="font-size:11px;margin-bottom:8px;color:#f59e0b"></div>
      <div style="display:flex;gap:6px;margin-bottom:8px;justify-content:flex-end">
        <button onclick="Controle.abrirCriarInstancia()" style="background:#2196F3;color:#fff;font-weight:bold">➕ Criar Instância</button>
      </div>
      <div id="listaInstancias" style="display:flex;flex-direction:column;gap:6px"></div>
    </section>
    <section class="full">
      <p>📂 Presets desta instância <span class="hint" id="contadorPresets" style="margin-left:8px"></span></p>
      <div style="display:flex;gap:4px;margin-bottom:4px;align-items:center">
        <label style="font-size:11px;cursor:pointer;display:flex;align-items:center;gap:3px"><input type="checkbox" id="selTodosPresets" onchange="Controle.toggleTodosPresets()"> Selecionar Todos</label>
        <button onclick="Controle.importarPresets()" style="background:#2196F3;color:#fff;font-size:11px;padding:4px 9px">📁 Importar .json</button>
        <button onclick="Controle.removerPresetsMarcados()" class="btn-remover" style="margin-left:auto">✕ Remover Marcados</button>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:6px;align-items:center;flex-wrap:wrap">
        <select id="filtroCompeticao" onchange="Controle.filtrarPresets()" style="font-size:11px;max-width:180px"><option value="">Todas competições</option></select>
        <select id="filtroCategoria" onchange="Controle.filtrarPresets()" style="font-size:11px;max-width:140px"><option value="">Todas categorias</option></select>
        <select id="filtroGrupo" onchange="Controle.filtrarPresets()" style="font-size:11px;max-width:100px"><option value="">Todos grupos</option></select>
        <select id="filtroFase" onchange="Controle.filtrarPresets()" style="font-size:11px;max-width:110px"><option value="">Todas fases</option></select>
        <select id="filtroData" onchange="Controle.filtrarPresets()" style="font-size:11px;max-width:105px"><option value="">Datas</option></select>
        <select id="filtroHora" onchange="Controle.filtrarPresets()" style="font-size:11px;max-width:90px"><option value="">Horários</option></select>
        <select id="filtroLocal" onchange="Controle.filtrarPresets()" style="font-size:11px;max-width:120px"><option value="">Locais</option></select>
        <input type="text" id="buscaPresets" placeholder="🔍 Buscar time..." style="flex:1;min-width:80px;font-size:11px" onkeyup="Controle.filtrarPresets()">
      </div>
      <div id="listaPresets"><span style="color:#888;font-size:11px">Carregando...</span></div>
    </section>
  </div>
</section>
