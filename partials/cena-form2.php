<?php $MAX = isset($MAX_LINHAS) ? (int)$MAX_LINHAS : 24; ?>
<!-- cena: ultimos jogos do destaque — HTML estatico; js preenche -->
<div class="cena cena-form2" data-scene="form2">
  <div class="cena-bg"></div>
  <div class="cena-inner">

  <div class="f2-esq">
    <span class="f2-lbl">ÚLTIMOS JOGOS</span>
    <div class="f2-topo">
      <div class="f2-crest th-crestbox"><img alt=""><span class="mono"></span></div>
      <div class="f2-tit">
        <b class="f2-nome" id="f2Nome"></b>
        <span class="f2-pos" id="f2Pos"></span>
      </div>
    </div>

    <span class="f2-lbl f2-lbl-seq">SEQUÊNCIA</span>
    <div class="f2-seq" id="f2Seq">
      <?php for ($i = 0; $i < 5; $i++): ?><span class="f2-pilula"></span><?php endfor; ?>
    </div>
    <p class="f2-vazio" id="f2Vazio">Sem jogos registrados ainda</p>

    <div class="f2-stats" id="f2Stats">
      <?php foreach (['VITÓRIAS', 'EMPATES', 'DERROTAS', 'GOLS F', 'GOLS C', 'SALDO'] as $k): ?>
      <div class="f2-stat"><b></b><span><?= $k ?></span></div>
      <?php endforeach; ?>
    </div>
  </div>

  <div class="f2-dir">
    <span class="f2-lbl">DESEMPENHO</span>
    <div class="f2-barras">
      <div class="ft-bar"><span class="fb-lbl">Gols a favor</span><span class="fb-val" id="f2FB"></span><i class="fb-fill" id="f2FBar" style="--p:0"></i></div>
      <div class="ft-bar"><span class="fb-lbl">Gols contra</span><span class="fb-val" id="f2CB"></span><i class="fb-fill fb-contra" id="f2CBar" style="--p:0"></i></div>
    </div>
    <div class="f2-medidas">
      <div class="f2-med"><b id="f2Media">0.00</b><span>MÉDIA GOLS/JOGO</span></div>
      <div class="f2-med"><b id="f2Ppg">0.00</b><span>PONTOS POR JOGO</span></div>
      <div class="f2-med"><b id="f2Apr">0%</b><span>APROVEITAMENTO</span></div>
    </div>
  </div>
  </div>
</div>
