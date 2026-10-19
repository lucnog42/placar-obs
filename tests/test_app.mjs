// Integração: roda o pipeline real do app (estado -> js/placar/tabela.js -> canvas)
import fs from 'fs';
import vm from 'vm';
import { createCanvas, Image } from '@napi-rs/canvas';

const B = '../';
const canvas = createCanvas(1920, 1080);
const ctx = canvas.getContext('2d');

const els = {};
function mkEl(id) {
    return {
        id,
        _cls: new Set(),
        classList: {
            add(c) { els[id]._cls.add(c); },
            remove(c) { els[id]._cls.delete(c); },
            contains(c) { return els[id]._cls.has(c); },
            toggle(c, on) { on ? els[id]._cls.add(c) : els[id]._cls.delete(c); }
        },
        style: { setProperty() { }, },
        innerText: '', textContent: '', value: '', checked: false,
        width: 1920, height: 1080,
        getContext() { return ctx; },
        setAttribute() { }, querySelectorAll() { return []; }
    };
}
const rafs = [];
const clears = [];
const context = {
    window: null, Image, console, performance, Object, Math, JSON, Date,
    parseInt, parseFloat, isNaN, String, Number, Array, Error, RegExp, Promise, Set, Map,
    setTimeout, clearTimeout, setInterval, clearInterval,
    requestAnimationFrame(cb) { rafs.push(cb); return rafs.length; },
    cancelAnimationFrame(id) { clears.push(id); },
    document: {
        getElementById(id) { return els[id] || (els[id] = mkEl(id)); },
        querySelectorAll() { return []; },
        documentElement: { style: { setProperty() { } } },
        createElement(t) { return mkEl(t); }
    }
};
context.window = context;              // window === global (como no browser)
context.globalThis = context;
vm.createContext(context);

for (const f of ['js/eventbus.js', 'js/comum.js', 'tabela/dados.js', 'tabela/tabela.js',
                 'js/placar/core.js', 'js/placar/tabela.js']) {
    vm.runInContext(fs.readFileSync(B + f, 'utf8'), context, { filename: f });
}
const P = context.Placar;
console.log('carregado | Tabela?', !!context.Tabela, '| secoes tabela em MS:', context.MS.tabelaAtivo);

// ---- estado como o servidor devolveria ----
const cru = {
    placar: { golsA: '3', golsB: '0', tempo: '0', rodando: 'false', esporte: 'futebol', periodo: '' },
    times: { timeA: 'PEÑA PASION XENEIZE BARCELONA, ASSOC. A', timeB: 'OUSADIA FC B', siglaA: 'PAS', siglaB: 'OUS',
             escudoA: '', escudoB: '', timeACor: '#ff0000', timeBCor: '#0000ff', local: 'Camp Municipal Joan Baptista', hora: '18:00' },
    estilo: { tema: 'laliga' }, posicao: {}, midia: {}, penaltes: {}, notif: {}, basquete: {}, torneio: {},
    tabela: { tabelaAtivo: 'true', tabelaCena: 'table', tabelaTema: 'noturno', tabelaDuracao: '8',
              tabelaA: 'auto', tabelaB: 'auto', tabelaDestaque: 'auto', tabelaEscalacao: 'auto',
              tabelaTitulo: '', tabelaSub: '', tabelaZonas: 'true', tabelaZonaUp: '1', tabelaZonaDn: '14' },
    estadoVersao: 1
};
P.estadoCru = cru;
P.estado = context.buildFlat(cru);
P.ultimoEstadoCru = {};
P.aplicarEstado();

const cam = els['camadaTabela'], wrap = els['placarWrapper'];
console.log('plano 1 | placar saindo?', wrap.classList.contains('saindo'),
            '| overlay ainda fora?', !cam.classList.contains('ativa'));

// ---- passa o tempo da transição (380ms) e bombeia o loop ----
await new Promise(r => setTimeout(r, 420));
console.log('plano 2 | overlay ativo?', cam.classList.contains('ativa'), '| rAF agendado?', rafs.length > 0);

// roda alguns quadros
let t = 0;
function pump(ms) {
    const cbs = rafs.splice(0, rafs.length);
    for (const cb of cbs) cb(performance.now() + ms);
}
for (let i = 0; i < 40; i++) { t += 40; pump(t); }
function opacos() {
    const d = ctx.getImageData(0, 0, 1920, 1080).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
    return n;
}
const pintados = opacos();
console.log('desenhou pixels:', pintados, '(', (100 * pintados / (1920 * 1080)).toFixed(1), '% da tela )');
fs.writeFileSync('./frames/APP_table_noturno.png', canvas.toBuffer('image/png'));

// ---- troca de cena: deve recomeçar a animação ----
P.estado = context.buildFlat(Object.assign({}, cru, { tabela: Object.assign({}, cru.tabela, { tabelaCena: 'duel', tabelaTema: 'matchfacts' }) }));
P.aplicarEstado();
console.log('troca de cena | cfg do motor =', context.Tabela.cfg().scenes[0].k, '| tema=', context.Tabela.cfg().scenes[0].k && 'ok');
for (let i = 0; i < 40; i++) { t += 40; pump(t); }
fs.writeFileSync('./frames/APP_duel_matchfacts.png', canvas.toBuffer('image/png'));

// ---- times do duelo casados pelo nome do placar ----
const cfg = P.Tabela.cfg;
const times = context.Tabela.teams();
console.log('duelo | A =', times[cfg.a].short, '| B =', times[cfg.b].short, '| casou dos nomes do placar?',
            times[cfg.a].name.indexOf('PASION') >= 0 && times[cfg.b].name.indexOf('OUSADIA') >= 0);

// ---- desligar: overlay sai, placar volta ----
P.estado = context.buildFlat(Object.assign({}, cru, { tabela: Object.assign({}, cru.tabela, { tabelaAtivo: 'false' }) }));
P.aplicarEstado();
console.log('desligando | overlay ativo?', cam.classList.contains('ativa'), '| placar ainda escondido?', wrap.classList.contains('saindo'));
await new Promise(r => setTimeout(r, 500));
console.log('depois | placar voltou?', !wrap.classList.contains('saindo'), '| loop parado?', clears.length > 0);
console.log('OK');
