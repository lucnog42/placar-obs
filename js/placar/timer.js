// placar/timer.js — componente autocontido: cronômetro
var Placar = window.Placar || {};

Placar.Timer = {
    render: function() {
        var el = document.getElementById('tempoDisplay');
        if (!el) return;
        var m = String(Math.floor(Placar.segundos / 60)).padStart(2, '0'),
            s = String(Placar.segundos % 60).padStart(2, '0');
        el.innerText = m + ':' + s;
    }
};

// Sincronizar com servidor quando estado mudar
Placar.on('placar:changed', function() {
    var sT = parseInt(Placar.estado.tempo) || 0;
    if (Placar.ultimoTempoServidorRaw === null || Placar.estado.tempo !== Placar.ultimoTempoServidorRaw) {
        Placar.segundos = sT;
        Placar.ultimoTempoServidorRaw = Placar.estado.tempo;
    }
    Placar.Timer.render();
});

// Tick local: 1 por segundo
setInterval(function() {
    if (Placar.estado.rodando === 'true') Placar.segundos++;
    Placar.Timer.render();
}, 1000);
