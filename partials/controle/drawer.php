<!-- ===== DRAWER ===== -->
<nav id="drawer">
  <div class="drawer-head"><span>Menu</span><button onclick="Controle.fecharMenu()">✕</button></div>
  <div class="drawer-instancia" id="drawerInstancia">instância padrão</div>
  <a class="drawer-item" onclick="Controle.irPara(1)">🎛 Instâncias</a>
  <a class="drawer-item" onclick="Controle.irPara(2)">👥 Equipes</a>
  <a class="drawer-item" onclick="Controle.irPara(3)">🏆 Competição</a>
  <a class="drawer-item" onclick="Controle.irPara(4)">📊 Tabela</a>
  <a class="drawer-item" onclick="Controle.irPara(5)">🎨 Tema</a>
  <a class="drawer-item" onclick="Controle.irPara(6)">🤝 Patrocinadores</a>
  <a class="drawer-item" onclick="Controle.irPara(7)">📢 Repertório</a>
  <a class="drawer-item" onclick="Controle.irPara(8)">📋 Resumo &amp; Salvar</a>
  <a class="drawer-item" onclick="Controle.irPara(9)">🎯 Operar ao vivo</a>
  <hr style="border-color:#22304a;margin:8px 14px">
  <button class="drawer-btn" onclick="Controle.salvarPreset()">💾 Salvar preset</button>
  <button class="drawer-btn" onclick="Controle.togglePreview()">👁 Preview</button>
  <div class="drawer-foot">Placar OBS · FCF Quarta Catalana</div>
</nav>
<div id="drawerOverlay" onclick="Controle.fecharMenu()"></div>
