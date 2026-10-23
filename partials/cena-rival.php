<?php $MAX_RIVAL = 8; ?>
<!-- cena: rival — mesma linguagem visual da tabela (margem, linha de 88px,
     cabeçalho fixo) mas ESTÁTICA e com poucos times: top 3, o rival, o time
     principal e os 3 que vêm logo abaixo. Sem rolagem e sem animação de linha. -->
<div class="cena cena-table cena-rival" data-scene="rival">
  <div class="cena-bg"></div>
  <header class="th-hdr">
    <img class="th-logo" id="rvLogo" src="" alt="">
    <div class="th-live"><span class="dot"></span>AO VIVO</div>
    <div class="th-hdrmain">
      <div class="th-ttl" id="rvTitulo"></div>
      <div class="th-sub" id="rvSub"></div>
    </div>
    <div class="th-right">
      <div class="th-vname" id="rvVname"></div>
      <div class="th-vmeta" id="rvVmeta"></div>
      <div class="th-vbar"></div>
    </div>
  </header>

  <div class="th-tbl">
    <div class="th-thead th-grid">
      <div class="th-pos"></div>
      <div></div>
      <div class="th-name">Equipe</div>
      <div class="th-pts">Pts</div>
      <div>J</div><div>V</div><div>E</div><div>D</div><div>F</div><div>C</div>
      <div class="th-form">Últimos</div>
    </div>

    <div class="th-body">
      <?php for ($i = 0; $i < $MAX_RIVAL; $i++): ?>
      <div class="th-row th-grid" id="rvRow<?= $i ?>">
        <div class="th-pos"></div>
        <div class="th-crest"><span class="th-crestbox"><img alt=""><span class="mono"></span></span></div>
        <div class="th-name"></div>
        <div class="th-pts"></div>
        <div class="th-num"></div><div class="th-num"></div><div class="th-num"></div>
        <div class="th-num"></div><div class="th-num"></div><div class="th-num"></div>
        <div class="th-form">
          <?php for ($c = 0; $c < 6; $c++): ?><span class="th-chip"></span><?php endfor; ?>
        </div>
      </div>
      <?php endfor; ?>
    </div>
  </div>

  <div class="th-foot" id="rvFoot"></div>
</div>
