// placar/gols.js — componente autocontido: placar de gols
var Placar = window.Placar || {};

Placar.on('placar:changed', function() {
    var ga = document.getElementById('golsA'),
        gb = document.getElementById('golsB');
    if (ga) ga.innerText = Placar.estado.golsA || '0';
    if (gb) gb.innerText = Placar.estado.golsB || '0';
});
