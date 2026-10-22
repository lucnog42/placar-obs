<?php $MAX = isset($MAX_LINHAS) ? (int)$MAX_LINHAS : 24; ?>
<!-- cena: tabela (classificação) — estrutura fixa; JS preenche textos/imagens -->
<div class="cena cena-table" data-scene="table">
  <div class="cena-bg"></div>
  <header class="th-hdr">
    <img class="th-logo" id="thLogo" src="" alt="">
    <div class="th-live"><span class="dot"></span>AO VIVO</div>
    <div class="th-hdrmain">
      <div class="th-ttl" id="thTtl"></div>
      <div class="th-sub" id="thSub"></div>
    </div>
    <div class="th-right">
      <div class="th-vname" id="thVname"></div>
      <div class="th-vmeta" id="thVmeta"></div>
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

    <div class="th-body" id="thBody">
      <?php for ($i = 0; $i < $MAX; $i++): ?>
      <div class="th-row th-grid" style="--i:<?= $i ?>">
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

  <div class="th-foot">Fonte: fcf.cat · PTS=pontos, J=jogos, V/E/D=vitórias/empates/derrotas, F/C=gols pró/contra · cor da posição = zona · ordem por pontos e saldo de gols</div>
</div>
