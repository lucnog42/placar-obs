<section class="tela" id="tela-3" data-titulo="Competição">
  <h2 class="titulo">🏆 Competição</h2>
  <div class="grid-inner">
    <section class="full">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
        <div><label style="font-size:10px;color:#aaa">Competição</label><input id="competicao" placeholder="Ex: Pirineus Cup" onchange="Controle.definirTorneio()" style="width:100%;box-sizing:border-box"></div>
        <div><label style="font-size:10px;color:#aaa">Categoria</label><input id="categoria" placeholder="Ex: U16 Masculino" onchange="Controle.definirTorneio()" style="width:100%;box-sizing:border-box"></div>
        <div><label style="font-size:10px;color:#aaa">Grupo</label><input id="grupo" placeholder="Ex: Grupo A" onchange="Controle.definirTorneio()" style="width:100%;box-sizing:border-box"></div>
        <div><label style="font-size:10px;color:#aaa">Fase</label><input id="fase" placeholder="Ex: Final" onchange="Controle.definirTorneio()" style="width:100%;box-sizing:border-box"></div>
        <div><label style="font-size:10px;color:#aaa">Data</label><input id="data" placeholder="Ex: 20/06/2026" onchange="Controle.definirTorneio()" style="width:100%;box-sizing:border-box"></div>
        <div><label style="font-size:10px;color:#aaa">Hora</label><input id="hora" placeholder="Ex: 15:30" onchange="Controle.definirTorneio()" style="width:100%;box-sizing:border-box"></div>
        <div><label style="font-size:10px;color:#aaa">Clima (°C)</label><input id="clima" type="number" placeholder="Ex: 18" onchange="Controle.definirTorneio()" style="width:100%;box-sizing:border-box"></div>
        <div><label style="font-size:10px;color:#aaa">Ícone do clima</label>
          <select id="climaIcone" onchange="Controle.definirTorneio()" style="width:100%">
            <option value="☀️">☀️ Sol</option>
            <option value="⛅">⛅ Parcialmente nublado</option>
            <option value="☁️">☁️ Nublado</option>
            <option value="🌧️">🌧️ Chuva</option>
            <option value="⛈️">⛈️ Trovoada</option>
            <option value="🌨️">🌨️ Neve</option>
            <option value="🌬️">🌬️ Vento</option>
            <option value="">(sem ícone)</option>
          </select>
        </div>
      </div>
      <div style="margin-top:3px"><label style="font-size:10px;color:#aaa">Local</label><input id="local" placeholder="Ex: Estádio Municipal" onchange="Controle.definirTorneio()" style="width:100%;box-sizing:border-box"></div>
      <p style="margin-top:8px;font-size:10px;color:#aaa">🏆 Logo do Torneio</p>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <img id="logoTorneioPreview" src="" style="width:60px;height:60px;object-fit:contain;border-radius:8px;background:rgba(255,255,255,.03);border:1px dashed rgba(255,255,255,.1);display:none" onerror="this.style.display='none'">
        <span id="logoTorneioNome" style="font-size:11px;color:#bbb"></span>
        <button onclick="Controle.uploadLogo()" style="font-size:10px;padding:2px 6px;background:#2196F3;color:#fff">📤 Subir logo</button>
        <button onclick="Controle.limparLogoTorneio()" style="font-size:10px;padding:2px 6px" title="Remover logo">✕</button>
        <button onclick="Controle.listarLogos()" style="font-size:10px;padding:2px 6px">🔄</button>
      </div>
      <p style="margin-top:8px;font-size:10px;color:#aaa">📚 Biblioteca de Logos</p>
      <div style="display:flex;gap:6px;margin-bottom:4px;align-items:center;flex-wrap:wrap">
        <label style="font-size:11px;cursor:pointer;display:flex;align-items:center;gap:3px"><input type="checkbox" id="selTodos-logos" onchange="Controle.toggleTodosLib('logos')"> Selecionar Todos</label>
        <button onclick="Controle.agruparSelecionados('logos')" style="font-size:11px;padding:2px 8px" title="Agrupa os logos marcados">🏷 Agrupar</button>
      </div>
      <div class="biblioteca-toolbar">
        <input id="buscaLogos" placeholder="🔍 Buscar logos" oninput="Controle._aplicarFiltros('logos')">
        <div id="gruposBar-logos" class="grupos-bar"></div>
      </div>
      <div id="listaLogos"><span style="color:#888;font-size:11px">Carregando...</span></div>
    </section>
  </div>
</section>
