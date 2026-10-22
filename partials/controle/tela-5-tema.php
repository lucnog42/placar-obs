<section class="tela" id="tela-5" data-titulo="Tema">
  <h2 class="titulo">🎨 Tema &amp; Aparência</h2>
  <div class="grid-inner">
    <section class="full">
      <p>Tema <span class="hint">tema único por enquanto — vale para o placar e para o overlay</span></p>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="font-size:13px;font-weight:700;padding:6px 12px;border-radius:8px;background:#0e1624;border:1px solid #2a3a55;color:#ffd700">🏆 La Liga</span>
        <span style="font-size:11px;color:#93a4c0">placar + overlay usam essa mesma base</span>
      </div>
    </section>
    <section class="full">
      <p>Fonte</p>
      <button class="fonte-btn" data-fonte="arial" onclick="Controle.definirFonte('arial')">Arial</button>
      <button class="fonte-btn" data-fonte="impact" onclick="Controle.definirFonte('impact')">Impact</button>
      <button class="fonte-btn" data-fonte="georgia" onclick="Controle.definirFonte('georgia')">Georgia</button>
      <button class="fonte-btn" data-fonte="courier" onclick="Controle.definirFonte('courier')">Courier</button>
      <button class="fonte-btn" data-fonte="trebuchet" onclick="Controle.definirFonte('trebuchet')">Trebuchet</button>
      <button class="fonte-btn" data-fonte="verdana" onclick="Controle.definirFonte('verdana')">Verdana</button>
    </section>
    <section class="full">
      <p>📐 Tamanho e Posição do Placar</p>
      <div class="scale-row">
        <span>Escala:</span>
        <button onclick="Controle.ajustarScale(-0.05)">−</button>
        <input type="range" id="scaleSlider" min="0.3" max="1.5" step="0.05" value="0.65" oninput="Controle.onScaleSlider(this.value)">
        <button onclick="Controle.ajustarScale(0.05)">+</button>
        <span id="scaleVal" style="min-width:30px">0.65</span>
      </div>
      <div class="pos-row">
        <label>X:</label><input type="number" id="inputX" value="50" onchange="Controle.setPosicao()" style="width:60px;"> px
        <label>Y:</label><input type="number" id="inputY" value="50" onchange="Controle.setPosicao()" style="width:60px;"> px
        <button onclick="Controle.resetPosicao()">↺</button>
      </div>
    </section>
  </div>
</section>
