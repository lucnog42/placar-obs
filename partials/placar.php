<!-- placar (scoreboard) — HTML estático, preenchido por js/placar/*.js -->
<div id="placarWrapper">
<div class="Placar">
    <div class="time" id="timeA"><span class="sigla-text" id="siglaA">SIG A</span><span class="full-text" id="fullA">TIME A</span></div>
    <div class="time" id="timeB"><span class="sigla-text" id="siglaB">SIG B</span><span class="full-text" id="fullB">TIME B</span></div>
    <img class="escudo" src="" id="escudoA"><img class="escudo" src="" id="escudoB">
    <span id="golsA" class="gol-num">0</span><span id="linha"> - </span><span id="golsB" class="gol-num">0</span>
    <div class="timer" id="tempoDisplay">00:00</div>

    <!-- ====== BASQUETE: Periodo + Shot Clock + Faltas + Posse ====== -->
    <div id="periodoDisplay" class="basquete-only" style="display:none">1Q</div>
    <div id="shotClockDisplay" class="basquete-only shot-clock" style="display:none">24</div>

    <div id="faltasRow" class="basquete-only" style="display:none">
        <div id="faltasA" class="faltas-display"></div>
        <span id="posseSeta" class="posse-seta">◀</span>
        <div id="faltasB" class="faltas-display"></div>
    </div>

    <div id="notificacao" class="notificacao hidden">
        <div class="notif-text-wrapper"><div class="notif-track" id="notifTrack">
            <img class="bola-spin" src="img/bola.png" alt=""><span id="notifText" class="notif-text"></span>
            <img class="bola-spin" src="img/bola.png" alt=""><span id="notifText2" class="notif-text"></span>
            <img class="bola-spin" src="img/bola.png" alt=""><span id="notifText3" class="notif-text"></span>
            <img class="bola-spin" src="img/bola.png" alt=""><span id="notifText4" class="notif-text"></span>
        </div></div>
    </div>
</div>

    <!-- ====== PENALTIS (futebol-only) ====== -->
    <div id="Penalte" class="escondido futebol-only">
    <div id="PenaltesA"><div id="PA1" class="Penaltes"></div><div id="PA2" class="Penaltes"></div><div id="PA3" class="Penaltes"></div><div id="PA4" class="Penaltes"></div><div id="PA5" class="Penaltes"></div></div>
    <div id="PenaltesB"><div id="PB5" class="Penaltes"></div><div id="PB4" class="Penaltes"></div><div id="PB3" class="Penaltes"></div><div id="PB2" class="Penaltes"></div><div id="PB1" class="Penaltes"></div></div>
</div>
</div>
