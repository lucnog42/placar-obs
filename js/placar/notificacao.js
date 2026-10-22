// placar/notificacao.js — componente autocontido: notificações
var Placar = window.Placar || {};

/* Notificacao como overlay animado, fora do placar (#camadaNotif).
   Vale com o placar normal e com as cenas do overlay, porque nao depende deles.
   Retorna false se a camada nao existe no HTML. */
Placar.notificar = function (tipo, texto, dur) {
    var box = document.getElementById('notifOv');
    if (!box) return false;
    var titulos = {
        gol: 'GOOOOL!', amarelo: 'CARTÃO AMARELO', vermelho: 'CARTÃO VERMELHO',
        substituicao: 'SUBSTITUIÇÃO', info: 'AVISO'
    };
    var tt = document.getElementById('notifOvTitulo');
    var tx = document.getElementById('notifOvTexto');
    var ic = document.getElementById('notifOvIco');
    var t = String(tipo || 'info').toLowerCase();
    if (tt) tt.textContent = titulos[t] || 'AVISO';
    if (tx) tx.textContent = texto || '';
    if (ic) ic.textContent = (t === 'gol') ? '⚽' : (t === 'amarelo') ? '▮' : (t === 'vermelho') ? '▮' : (t === 'substituicao') ? '⇄' : '●';

    box.className = 'notif-ov tipo-' + t;
    void box.offsetWidth;                 // reinicia a animacao de entrada
    box.classList.add('show');

    clearTimeout(Placar._ntTimer);
    Placar._ntTimer = setTimeout(function () { box.classList.remove('show'); },
        Math.max(1, parseInt(dur, 10) || 4) * 1000);
    return true;
};

/* encerra a notificacao antes do tempo */
Placar.limparNotificacao = function () {
    clearTimeout(Placar._ntTimer);
    var box = document.getElementById('notifOv');
    if (box) box.classList.remove('show');
};

/* apelido antigo (o overlay da tabela usava este nome) */
Placar.notifTabela = Placar.notificar;
Placar.limparNotifTabela = Placar.limparNotificacao;

Placar.on('notif:changed', function () {
    var tipo = Placar.estado.notifTipo,
        texto = Placar.estado.notifTexto,
        id = Placar.estado.notifId;

    if (!tipo || !texto || !id || id === Placar.ultimaNotifId) return;
    // primeira leitura depois de um reload: memoriza sem repetir a notificacao
    if (Placar.ultimaNotifId === undefined) { Placar.ultimaNotifId = id; return; }
    Placar.ultimaNotifId = id;

    Placar.notificar(tipo, texto, 4);
});
