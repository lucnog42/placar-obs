<section class="tela" id="tela-2" data-titulo="Equipes">
  <h2 class="titulo">👥 Equipes</h2>
  <div class="grid-inner">
    <section class="full">
      <p>Times <span class="hint">nome + sigla</span></p>
      <div style="display:grid;grid-template-columns:2fr 1fr 2fr 1fr;gap:6px">
        <div><label style="font-size:10px;color:#aaa">Nome (Casa)</label><input id="timeA" placeholder="Time A" style="width:100%;box-sizing:border-box"></div>
        <div><label style="font-size:10px;color:#aaa">Sigla (Casa)</label><input id="siglaA" placeholder="Sigla A" maxlength="6" style="width:100%;box-sizing:border-box"></div>
        <div><label style="font-size:10px;color:#aaa">Nome (Visitante)</label><input id="timeB" placeholder="Time B" style="width:100%;box-sizing:border-box"></div>
        <div><label style="font-size:10px;color:#aaa">Sigla (Visit.)</label><input id="siglaB" placeholder="Sigla B" maxlength="6" style="width:100%;box-sizing:border-box"></div>
      </div>
      <button onclick="Controle.definirTimes()" style="margin-top:8px">Definir Times</button>
    </section>
    <section class="full">
      <p>🎨 Cores dos Times</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <button class="A" id="btnCorTimeA" onclick="Controle.definirCor('timeA')">Cor <span class="nomeTimeA">Time A</span></button>
        <button class="B" id="btnCorTimeB" onclick="Controle.definirCor('timeB')">Cor <span class="nomeTimeB">Time B</span></button>
        <button onclick="Controle.resetarCor()">Resetar</button>
      </div>
      <p style="font-size:11px;color:#93a4c0">📚 Biblioteca de cores salvas</p>
      <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center;flex-wrap:wrap">
        <button onclick="Controle.adicionarCor()" style="background:#2196F3;color:#fff">➕ Adicionar Cor</button>
        <label style="font-size:11px;cursor:pointer;display:flex;align-items:center;gap:3px"><input type="checkbox" id="selTodos-cores" onchange="Controle.toggleTodosLib('cores')"> Selecionar Todos</label>
        <button onclick="Controle.agruparSelecionados('cores')" style="font-size:11px;padding:2px 8px" title="Agrupa as cores marcadas">🏷 Agrupar</button>
        <span style="font-size:10px;color:#aaa">salve cores para reusar em qualquer jogo</span>
      </div>
      <div class="biblioteca-toolbar">
        <input id="buscaCores" placeholder="🔍 Buscar cores" oninput="Controle._aplicarFiltros('cores')">
        <div id="gruposBar-cores" class="grupos-bar"></div>
      </div>
      <div id="listaCores"><span style="color:#888;font-size:11px">Carregando...</span></div>
    </section>
    <section class="full">
      <p>📚 Biblioteca de Escudos</p>
      <div style="display:flex;gap:4px;margin-bottom:4px;align-items:center;flex-wrap:wrap">
        <button onclick="Controle.uploadEscudosBatch()" style="background:#2196F3;color:#fff">📁 Selecionar PNGs</button>
        <label style="font-size:11px;cursor:pointer;display:flex;align-items:center;gap:3px"><input type="checkbox" id="selTodosEscudos" onchange="Controle.toggleTodosEscudos()"> Selecionar Todos</label>
        <button onclick="Controle.agruparSelecionados('escudos')" style="font-size:11px;padding:2px 8px" title="Agrupa os escudos marcados">🏷 Agrupar</button>
        <button onclick="Controle.removerEscudosMarcados()" class="btn-remover" style="margin-left:auto">✕ Remover Marcados</button>
      </div>
      <div class="biblioteca-toolbar">
        <input id="buscaEscudos" placeholder="🔍 Buscar escudos" oninput="Controle._aplicarFiltros('escudos')">
        <div id="gruposBar-escudos" class="grupos-bar"></div>
      </div>
      <div id="listaEscudos"><span style="color:#888;font-size:11px">Carregando...</span></div>
    </section>
  </div>
</section>
