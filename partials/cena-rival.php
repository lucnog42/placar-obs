<!-- cena: rival — top 3, o rival (time logo acima do principal) e os 3 abaixo do
     time principal. HTML estatico com slots fixos; o JS so preenche texto/imagem. -->
<div class="cena cena-rival" data-scene="rival">
  <div class="cena-bg"></div>
  <div class="cena-inner">
    <div class="rv-painel">
      <header class="rv-hdr">
        <img class="rv-logo" id="rvLogo" src="" alt="">
        <div class="rv-hd">
          <b class="rv-tit" id="rvTitulo"></b>
          <span class="rv-sub" id="rvSub"></span>
        </div>
        <div class="rv-dir">
          <span class="rv-lbl">CORRIDA NA TABELA</span>
          <span class="rv-time" id="rvTime"></span>
        </div>
      </header>

      <div class="rv-cols">
        <div class="rv-col">
          <span class="rv-lbl rv-lbl-top">TOP 3</span>
          <div class="rv-lin" id="rvT1">
            <span class="rv-pos"></span>
            <span class="rv-crest th-crestbox"><img alt=""><span class="mono"></span></span>
            <span class="rv-nome"></span>
            <span class="rv-pts"></span>
          </div>
          <div class="rv-lin" id="rvT2">
            <span class="rv-pos"></span>
            <span class="rv-crest th-crestbox"><img alt=""><span class="mono"></span></span>
            <span class="rv-nome"></span>
            <span class="rv-pts"></span>
          </div>
          <div class="rv-lin" id="rvT3">
            <span class="rv-pos"></span>
            <span class="rv-crest th-crestbox"><img alt=""><span class="mono"></span></span>
            <span class="rv-nome"></span>
            <span class="rv-pts"></span>
          </div>
        </div>

        <div class="rv-col rv-col-meio">
          <span class="rv-lbl" id="rvLblRiv">RIVAL</span>
          <div class="rv-lin rv-rival" id="rvRiv">
            <span class="rv-pos"></span>
            <span class="rv-crest th-crestbox"><img alt=""><span class="mono"></span></span>
            <span class="rv-nome"></span>
            <span class="rv-pts"></span>
          </div>
          <span class="rv-lbl rv-lbl-eu">TIME PRINCIPAL</span>
          <div class="rv-lin rv-eu" id="rvPrin">
            <span class="rv-pos"></span>
            <span class="rv-crest th-crestbox"><img alt=""><span class="mono"></span></span>
            <span class="rv-nome"></span>
            <span class="rv-pts"></span>
          </div>
        </div>

        <div class="rv-col">
          <span class="rv-lbl rv-lbl-baixo">PERSEGUINDO</span>
          <div class="rv-lin" id="rvB1">
            <span class="rv-pos"></span>
            <span class="rv-crest th-crestbox"><img alt=""><span class="mono"></span></span>
            <span class="rv-nome"></span>
            <span class="rv-pts"></span>
          </div>
          <div class="rv-lin" id="rvB2">
            <span class="rv-pos"></span>
            <span class="rv-crest th-crestbox"><img alt=""><span class="mono"></span></span>
            <span class="rv-nome"></span>
            <span class="rv-pts"></span>
          </div>
          <div class="rv-lin" id="rvB3">
            <span class="rv-pos"></span>
            <span class="rv-crest th-crestbox"><img alt=""><span class="mono"></span></span>
            <span class="rv-nome"></span>
            <span class="rv-pts"></span>
          </div>
        </div>
      </div>

      <div class="rv-foot" id="rvFoot"></div>
    </div>
  </div>
</div>
