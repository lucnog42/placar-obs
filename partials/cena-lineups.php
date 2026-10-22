<?php $MAX = isset($MAX_LINHAS) ? (int)$MAX_LINHAS : 24; ?>
<!-- cena: escalacao — HTML estatico (pool de linhas); js preenche jogadores -->
<div class="cena cena-lineups" data-scene="lineups">
  <div class="cena-bg"></div>
  <div class="cena-inner">
  <div class="lu-painel">
    <header class="lu-hdr">
      <div class="lu-crest th-crestbox"><img alt=""><span class="mono"></span></div>
      <div class="lu-hd">
        <b class="lu-nome" id="luNome"></b>
        <span class="lu-meta" id="luMeta"></span>
      </div>
      <div class="lu-dir">
        <span class="lu-lbl">ESCALAÇÃO</span>
        <span class="lu-time" id="luTime"></span>
      </div>
    </header>

    <div class="lu-lista" id="luLista">
      <?php for ($i = 0; $i < $MAX; $i++): ?>
      <div class="lu-linha">
        <span class="lu-num"></span>
        <span class="lu-jog"></span>
        <span class="lu-pos"></span>
      </div>
      <?php endfor; ?>
    </div>

    <p class="lu-vazio" id="luVazio">Carregue o CSV das escalações</p>
  </div>  </div>
</div>
