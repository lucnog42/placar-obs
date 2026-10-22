// placar/notificacao.js — componente autocontido: notificações
var Placar = window.Placar || {};

Placar.on('notif:changed', function() {
    var box = document.getElementById('notificacao');
    if (!box) return;

    var tipo = Placar.estado.notifTipo,
        texto = Placar.estado.notifTexto,
        id = Placar.estado.notifId;

    if (!tipo || !texto || !id || id === Placar.ultimaNotifId) return;
    Placar.ultimaNotifId = id;

    // Fase D: notificacao desenhada no motor/canvas da tabela (mesmo tema)
    if (window.Tabela && Placar.Tabela && Placar.Tabela.dispararNotif) {
        Placar.Tabela.dispararNotif(tipo, texto, 4);
        return;
    }

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
