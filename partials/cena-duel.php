<?php $MAX = isset($MAX_LINHAS) ? (int)$MAX_LINHAS : 24; ?>
<!-- cena: duelo — HTML estatico; js preenche os dois cartoes e o resumo -->
<div class="cena cena-duel" data-scene="duel">
  <div class="cena-bg"></div>
  <div class="cena-inner">

  <div class="du-par">
    <div class="du-card du-a">
      <span class="du-pos" id="duPa"></span>
      <div class="du-crest th-crestbox"><img alt=""><span class="mono"></span></div>
      <b class="du-nome" id="duNa"></b>
      <div class="du-pts"><b id="duPtsA">0</b><span>PONTOS</span></div>
      <div class="du-stats">
        <div class="du-stat"><b id="duJA"></b><span>J</span></div>
        <div class="du-stat"><b id="duVA"></b><span>V</span></div>
        <div class="du-stat"><b id="duEA"></b><span>E</span></div>
        <div class="du-stat"><b id="duDA"></b><span>D</span></div>
      </div>
      <div class="du-barras">
        <div class="ft-bar"><span class="fb-lbl">Gols a favor</span><span class="fb-val" id="duFA"></span><i class="fb-fill" id="duFBarA" style="--p:0"></i></div>
        <div class="ft-bar"><span class="fb-lbl">Gols contra</span><span class="fb-val" id="duCA"></span><i class="fb-fill fb-contra" id="duCBarA" style="--p:0"></i></div>
      </div>
    </div>

    <div class="du-vs"><span>VS</span></div>

    <div class="du-card du-b">
      <span class="du-pos" id="duPb"></span>
      <div class="du-crest th-crestbox"><img alt=""><span class="mono"></span></div>
      <b class="du-nome" id="duNb"></b>
      <div class="du-pts"><b id="duPtsB">0</b><span>PONTOS</span></div>
      <div class="du-stats">
        <div class="du-stat"><b id="duJB"></b><span>J</span></div>
        <div class="du-stat"><b id="duVB"></b><span>V</span></div>
        <div class="du-stat"><b id="duEB"></b><span>E</span></div>
        <div class="du-stat"><b id="duDB"></b><span>D</span></div>
      </div>
      <div class="du-barras">
        <div class="ft-bar"><span class="fb-lbl">Gols a favor</span><span class="fb-val" id="duFB"></span><i class="fb-fill" id="duFBarB" style="--p:0"></i></div>
        <div class="ft-bar"><span class="fb-lbl">Gols contra</span><span class="fb-val" id="duCB"></span><i class="fb-fill fb-contra" id="duCBarB" style="--p:0"></i></div>
      </div>
    </div>
  </div>

  <div class="du-resumo">
    <span class="du-rt du-ra" id="duResA"></span>
    <span class="du-rt du-rc" id="duResC"></span>
    <span class="du-rt du-rb" id="duResB"></span>
  </div>  </div>
</div>
