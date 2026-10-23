<section class="tela" id="tela-6" data-titulo="Patrocinadores">
  <h2 class="titulo">🤝 Patrocinadores</h2>
  <div class="grid-inner">
    <section class="full">
      <p>Título dos patrocinadores</p>
      <input type="text" id="spText" placeholder="PATROCINADORES" style="width:100%;box-sizing:border-box" onchange="Controle.definirSpText(this.value)">
      <span class="hint">Texto exibido na cena "Patrocinadores" do overlay.</span>
    </section>
    <section class="full">
      <p>Rotação <span class="hint">patrocinadores a cada intervalo</span></p>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <label class="toggle-sw" title="Liga/desliga a rotação automática"><input type="checkbox" id="sponsorsAtivo" onchange="Controle.definirSponsorRotacao('ativo', this.checked)"><span class="slider"></span></label>
        <span id="sponsorsAtivoLabel" style="font-size:12px;color:#93a4c0">desligada</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">
        <div><label style="font-size:10px;color:#aaa">A cada (segundos)</label><input type="number" id="sponsorsIntervalo" min="5" step="5" placeholder="60" style="width:100%;box-sizing:border-box" onchange="Controle.definirSponsorRotacao('intervalo', this.value)"></div>
        <div><label style="font-size:10px;color:#aaa">Duração (segundos)</label><input type="number" id="sponsorsDuracao" min="1" step="1" placeholder="8" style="width:100%;box-sizing:border-box" onchange="Controle.definirSponsorRotacao('duracao', this.value)"></div>
      </div>
      <span class="hint">A faixa mostra <b>um patrocinador por vez</b>: ele entra pela direita, sai pela direita e o próximo entra no mesmo lugar. A "duração" é do bloco inteiro (dividida entre os logos); mínimo 5 s entre blocos. Notificações e cenas manuais têm prioridade. O switch também está na tela <b>Operar ao vivo</b>.</span>
    </section>
    <section class="full">
      <p>Logos dos patrocinadores <span class="hint">o <b>nome exibido</b> é o texto que aparece embaixo do logo (vazio = só o logo)</span></p>
      <div style="display:flex;gap:10px;flex-wrap:wrap" id="sponsorSlots"></div>
      <div style="margin-top:8px">
        <button onclick="Controle.adicionarPatrocinador()" style="background:#2196F3;color:#fff">➕ Adicionar Patrocinador</button>
      </div>
      <span class="hint" id="sponsorInfo">Cada patrocinador entra na rotação do overlay.</span>
    </section>
  </div>
</section>
