// placar/tema.js — componente autocontido: tema, fonte, animação, posição
var Placar = window.Placar || {};

Placar.on('estilo:changed', function() {
    // Tema CSS
    var t = Placar.estado.tema || 'laliga',
        link = document.getElementById('tema'),
        href = 'css/' + t + '.css';
    if (link && link.getAttribute('href') !== href) link.setAttribute('href', href);

    // Animação da notificação
    var a = Placar.estado.notifAnimacao || 'esquerda',
        n = document.getElementById('notificacao');
    if (n) n.setAttribute('data-anim', a);

    // Fonte
    var fam = (window.FONTES || {})[Placar.estado.fonte] || FONTES.arial,
        p = document.querySelector('.Placar');
    if (p) p.style.fontFamily = fam;
    document.querySelectorAll('.notif-text').forEach(function(el) { el.style.fontFamily = fam; });

    // Status visibility (debug toggle)
    var st = document.getElementById('status');
    if (st) st.style.display = (Placar.estado.mostrarStatus === 'false') ? 'none' : '';
});

Placar.on('posicao:changed', function() {
    var p = document.getElementById('placarWrapper');
    if (!p) return;
    p.style.left = (Placar.estado.placarX || '50') + 'px';
    p.style.top = (Placar.estado.placarY || '50') + 'px';
    p.style.transform = 'scale(' + (Placar.estado.placarScale || '0.65') + ')';
});
