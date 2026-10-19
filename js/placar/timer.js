// placar/timer.js — cronômetro por epoch (sobrevive a reload e a dois operadores)
var Placar = window.Placar || {};

Placar._tempoBase = 0;    // segundos acumulados (valor de tempo)
Placar._tempoInicio = 0;  // ms epoch em que "rodando" virou true

Placar.Timer = {
    render: function() {
        var el = document.getElementById('tempoDisplay');
        if (!el) return;
        var t = Placar.segundos;
        var m = String(Math.floor(t / 60)).padStart(2, '0'),
            s = String(t % 60).padStart(2, '0');
        el.innerText = m + ':' + s;
    }
};

Placar._agoraServidor = function() {
    return Date.now() + (Placar.offsetMs || 0);
};

Placar._calcularTempo = function() {
    var t = Placar._tempoBase;
    if (Placar.estado.rodando === 'true' && Placar._tempoInicio > 0) {
        var decorrido = Math.floor((Placar._agoraServidor() - Placar._tempoInicio) / 1000);
        if (decorrido > 0) t += decorrido;
    }
    return t;
};

Placar.on('placar:changed', function() {
    Placar._tempoBase = parseInt(Placar.estado.tempo, 10) || 0;
    Placar._tempoInicio = parseInt(Placar.estado.tempoInicio, 10) || 0;
    Placar.segundos = Placar._calcularTempo();
    Placar.Timer.render();
});

// tick local: 2x por segundo, recomputa a partir do epoch (não deriva no cliente)
setInterval(function() {
    Placar.segundos = Placar._calcularTempo();
    Placar.Timer.render();
}, 500);
