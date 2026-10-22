// placar/notificacao.js — componente autocontido: notificações
var Placar = window.Placar || {};

/* Notificacao do overlay de tabela (HTML). Retorna false se a camada nao existe. */
Placar.notifTabela = function (tipo, texto, dur) {
    var box = document.getElementById('notifTabela');
    if (!box) return false;
    var titulos = { gol: 'GOOOOL!', amarelo: 'CARTÃO AMARELO', vermelho: 'CARTÃO VERMELHO', substituicao: 'SUBSTITUIÇÃO' };
    var tt = document.getElementById('notifTabelaTitulo');
    var tx = document.getElementById('notifTabelaTexto');
    if (tt) tt.textContent = titulos[tipo] || 'AVISO';
    if (tx) tx.textContent = texto || '';
    box.className = 'notif-tabela tipo-' + (tipo || 'info');
    void box.offsetWidth;
    box.classList.add('show');
    clearTimeout(Placar._ntTimer);
    Placar._ntTimer = setTimeout(function () { box.classList.remove('show'); }, Math.max(1, parseInt(dur, 10) || 4) * 1000);
    return true;
};

/* encerra a notificacao do overlay antes do tempo */
Placar.limparNotifTabela = function () {
    clearTimeout(Placar._ntTimer);
    var box = document.getElementById('notifTabela');
    if (box) box.classList.remove('show');
};

Placar.on('notif:changed', function() {
    var box = document.getElementById('notificacao');
    if (!box) return;

    var tipo = Placar.estado.notifTipo,
        texto = Placar.estado.notifTexto,
        id = Placar.estado.notifId;

    if (!tipo || !texto || !id || id === Placar.ultimaNotifId) return;
    // primeira leitura depois de um reload: memoriza sem repetir a notificacao
    if (Placar.ultimaNotifId === undefined) { Placar.ultimaNotifId = id; return; }
    Placar.ultimaNotifId = id;

    // overlay de tabela ligado? a notificacao usa o HTML da tabela (mesmo visual, sem canvas)
    if (Placar.Tabela && Placar.Tabela.ativo && Placar.notifTabela(tipo, texto, 4)) return;

    var c = tipo === 'gol' ? texto :
            tipo === 'amarelo' ? '\u{1F7E8} ' + texto :
            '\u{1F7E5} ' + texto;

    ['notifText','notifText2','notifText3','notifText4'].forEach(function(i) {
        var e = document.getElementById(i);
        if (e) e.innerText = c;
    });

    box.classList.remove('gol', 'amarelo', 'vermelho');
    box.classList.add(tipo);

    var track = document.getElementById('notifTrack');
    if (track) {
        track.style.animation = 'none';
        void track.offsetWidth;
        track.style.animation = '';
    }

    box.classList.add('show');
    box.classList.remove('hidden');
    setTimeout(function() { box.classList.remove('show'); }, 3000);
});
