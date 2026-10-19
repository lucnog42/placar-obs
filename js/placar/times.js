// placar/times.js — componente autocontido: nomes, siglas, escudos, cores
var Placar = window.Placar || {};

Placar.on('times:changed', function() {
    // Nomes
    var fa = document.getElementById('fullA'), fb = document.getElementById('fullB');
    var sa = document.getElementById('siglaA'), sb = document.getElementById('siglaB');
    if (fa) fa.innerText = Placar.estado.timeA || 'TIME A';
    if (fb) fb.innerText = Placar.estado.timeB || 'TIME B';
    if (sa) sa.innerText = Placar.estado.siglaA || 'SIG A';
    if (sb) sb.innerText = Placar.estado.siglaB || 'SIG B';

    // Escudos
    if (Placar.estado.escudoA) document.querySelectorAll('#escudoA').forEach(function(el) { el.src = Placar.estado.escudoA; });
    if (Placar.estado.escudoB) document.querySelectorAll('#escudoB').forEach(function(el) { el.src = Placar.estado.escudoB; });

    // Cores CSS
    document.documentElement.style.setProperty('--corA', Placar.estado.timeACor || '#ff0000');
    document.documentElement.style.setProperty('--corB', Placar.estado.timeBCor || '#0000ff');
});

// Expansão de nomes (sigla ↔ completo) — reage a estilo
Placar.on('estilo:changed', function() {
    document.querySelectorAll('.time').forEach(function(el) {
        el.classList.toggle('expandido', Placar.estado.nomesExpandidos === 'true');
    });
});
