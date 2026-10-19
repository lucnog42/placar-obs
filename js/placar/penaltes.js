// placar/penaltes.js — componente autocontido: pênaltis
var Placar = window.Placar || {};

Placar.on('penaltes:changed', function() {
    ['PA1','PA2','PA3','PA4','PA5','PB1','PB2','PB3','PB4','PB5'].forEach(function(id) {
        var ep = Placar.estado[id] || 'neutro', el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('gol', 'erro');
        if (ep === 'gol') el.classList.add('gol');
        else if (ep === 'erro') el.classList.add('erro');
    });

    var p = document.getElementById('Penalte');
    if (!p) return;
    if (Placar.estado.penaltesAtivos !== 'false') p.classList.remove('escondido');
    else p.classList.add('escondido');
});
