<?php $MAX = isset($MAX_LINHAS) ? (int)$MAX_LINHAS : 24; ?>
<!-- cena: lower third (faixa inferior) — HTML estatico; js preenche textos/escudos -->
<div class="cena cena-lower" data-scene="lower">
  <div class="cena-bg"></div>
  <div class="lw-faixa">
    <div class="lw-lado lw-a">
      <div class="lw-crest th-crestbox"><img alt=""><span class="mono"></span></div>
      <div class="lw-txts">
        <b class="lw-nome" id="lwNa"></b>
        <span class="lw-meta" id="lwMa"></span>
        <span class="lw-gols" id="lwGa"></span>
        <div class="lw-form" id="lwFa"><?php for ($c = 0; $c < 6; $c++): ?><span class="th-chip"></span><?php endfor; ?></div>
      </div>
    </div>
    <div class="lw-centro">
      <div class="lw-vs">VS</div>
      <span class="lw-sub" id="lwSub"></span>
      <span class="lw-fonte">fcf.cat</span>
    </div>
    <div class="lw-lado lw-b">
      <div class="lw-txts">
        <b class="lw-nome" id="lwNb"></b>
        <span class="lw-meta" id="lwMb"></span>
        <span class="lw-gols" id="lwGb"></span>
        <div class="lw-form" id="lwFb"><?php for ($c = 0; $c < 6; $c++): ?><span class="th-chip"></span><?php endfor; ?></div>
      </div>
      <div class="lw-crest th-crestbox"><img alt=""><span class="mono"></span></div>
    </div>
  </div>
</div>
