<?php $MAX = isset($MAX_LINHAS) ? (int)$MAX_LINHAS : 24; ?>
<!-- cena: time destaque — HTML estatico; js preenche -->
<div class="cena cena-feature" data-scene="feature">
  <div class="cena-bg"></div>
  <div class="cena-inner">
  <div class="ft-painel">

    <div class="ft-esq">
      <div class="ft-topo">
        <div class="ft-crest th-crestbox"><img alt=""><span class="mono"></span></div>
        <div class="ft-tit">
          <b class="ft-nome" id="ftNome"></b>
          <span class="ft-pos" id="ftPos"></span>
        </div>
      </div>

      <div class="ft-pts">
        <b id="ftPts">0</b><span>PONTOS</span>
        <div class="ft-ultimos">
          <span class="ft-lbl">ÚLTIMOS</span>
          <div class="ft-chips" id="ftChips"><?php for ($c = 0; $c < 6; $c++): ?><span class="th-chip"></span><?php endfor; ?></div>
        </div>
      </div>

      <div class="ft-barras">
        <div class="ft-bar"><span class="fb-lbl">Gols a favor</span><span class="fb-val" id="ftFB"></span><i class="fb-fill" id="ftFBar" style="--p:0"></i></div>
        <div class="ft-bar"><span class="fb-lbl">Gols contra</span><span class="fb-val" id="ftCB"></span><i class="fb-fill fb-contra" id="ftCBar" style="--p:0"></i></div>
      </div>

      <div class="ft-stats" id="ftStats">
        <?php foreach (['J', 'V', 'E', 'D', 'F', 'C', 'DG'] as $k): ?>
        <div class="ft-stat"><b></b><span><?= $k ?></span></div>
        <?php endforeach; ?>
      </div>
    </div>

    <div class="ft-ctx">
      <span class="ft-lbl">CONTEXTO NA TABELA</span>
      <div class="ft-lista" id="ftLista">
        <?php for ($i = 0; $i < 7; $i++): ?>
        <div class="ft-linha">
          <span class="fl-pos"></span>
          <div class="fl-crest th-crestbox mini"><img alt=""><span class="mono"></span></div>
          <span class="fl-nome"></span>
          <span class="fl-pts"></span>
        </div>
        <?php endfor; ?>
      </div>
    </div>

  </div>  </div>
</div>
