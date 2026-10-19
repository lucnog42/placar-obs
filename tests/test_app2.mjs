// casos extras: modo automático, fallback de times, payload do POST, outras cenas
import fs from 'fs';
import vm from 'vm';
import { createCanvas, Image } from '@napi-rs/canvas';

const B = '../';
const canvas = createCanvas(1920, 1080);
const ctx = canvas.getContext('2d');
const els = {};
const mkEl = id => (els[id] = (els[id] || {
    id, _cls: new Set(),
    classList: { add(c) { els[id]._cls.add(c); }, remove(c) { els[id]._cls.delete(c); },
                 contains(c) { return els[id]._cls.has(c); }, toggle() { } },
    style: { setProperty() { } }, value: '', checked: false, innerText: '', textContent: '',
    width: 1920, height: 1080, getContext() { return ctx; }, setAttribute() { }, querySelectorAll() { return []; }
}));
const rafs = [];
const context = {
    window: null, Image, console, performance, Object, Math, JSON, Date, parseInt, parseFloat,
    isNaN, String, Number, Array, Error, RegExp, Promise, Set, Map, setTimeout, clearTimeout,
    setInterval, clearInterval,
    requestAnimationFrame(cb) { rafs.push(cb); return rafs.length; },
    cancelAnimationFrame() { },
    document: { getElementById(id) { return mkEl(id); }, querySelectorAll() { return []; },
                documentElement: { style: { setProperty() { } } }, createElement(t) { return mkEl(t); } }
};
context.window = context; context.globalThis = context;
vm.createContext(context);
for (const f of ['js/eventbus.js', 'js/comum.js', 'tabela/dados.js', 'tabela/tabela.js',
                 'js/placar/core.js', 'js/placar/tabela.js'])
    vm.runInContext(fs.readFileSync(B + f, 'utf8'), context, { filename: f });

const P = context.Placar;
// payload que o painel manda no POST
console.log('POST do painel =', JSON.stringify(context.paraSecoes({ tabelaAtivo: 'true', tabelaCena: 'duel' })));

const base = {
    placar: {}, times: { timeA: 'VERD', timeB: 'ROXO', local: 'Estadi Municipal', hora: '20:30' },
    estilo: {}, posicao: {}, midia: {}, penaltes: {}, notif: {}, basquete: {}, torneio: {}, estadoVersao: 1
};
function estado(tab) {
    P.estadoCru = Object.assign({}, base, { tabela: tab });
    P.estado = context.buildFlat(P.estadoCru);
}
// 1) times do placar nao estao na tabela -> cai no padrao (0 e 1)
estado({ tabelaAtivo: 'true', tabelaCena: 'duel', tabelaTema: 'broadcast', tabelaDuracao: '8',
         tabelaA: 'auto', tabelaB: 'auto', tabelaDestaque: 'auto', tabelaEscalacao: 'auto' });
P.aplicarEstado();
let cfg = P.Tabela.cfg;
const T = context.Tabela.teams();
console.log('fallback | A =', cfg.a, T[cfg.a].short, '| B =', cfg.b, T[cfg.b].short, '(esperado 0 e 1)');

// 2) escolha manual do painel
estado({ tabelaAtivo: 'true', tabelaCena: 'duel', tabelaTema: 'broadcast', tabelaDuracao: '8',
         tabelaA: '13', tabelaB: '15', tabelaDestaque: 'auto', tabelaEscalacao: 'auto' });
P.aplicarEstado();
cfg = P.Tabela.cfg;
console.log('manual   | A =', T[cfg.a].short, '| B =', T[cfg.b].short, '(esperado 14o e 16o)');

// 3) modo automatico: 5 cenas
estado({ tabelaAtivo: 'true', tabelaCena: 'auto', tabelaTema: 'aco', tabelaDuracao: '6',
         tabelaA: 'auto', tabelaB: 'auto', tabelaDestaque: '2', tabelaEscalacao: '3' });
P.aplicarEstado();
cfg = P.Tabela.cfg;
const tl = context.Tabela.timeline(cfg);
console.log('auto     | cenas =', cfg.scenes.map(s => s.k).join(','), '| total =', tl.total, 's');

// desenha em varios instantes do ciclo automatico
let t = 0;
const marcas = [];
for (const alvo of [1, 8, 14, 20, 26]) {
    P.Tabela.t0 = performance.now();
    P.Tabela.desenhar(performance.now() + alvo * 1000);
    const d = ctx.getImageData(0, 0, 1920, 1080).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
    marcas.push([alvo, n]);
    fs.writeFileSync('./frames/APP_auto_' + alvo + 's.png', canvas.toBuffer('image/png'));
}
// cada instante deve cair numa cena diferente (assinaturas distintas)
const sig = marcas.map(m => m[1]);
console.log('auto     | pixels por instante =', sig.join(' / '));
console.log('auto     | cenas distintas?', new Set(sig).size >= 4);

// 4) cena isolada do destaque
estado({ tabelaAtivo: 'true', tabelaCena: 'feature', tabelaTema: 'matchfacts', tabelaDuracao: '10',
         tabelaA: 'auto', tabelaB: 'auto', tabelaDestaque: '4', tabelaEscalacao: 'auto' });
P.aplicarEstado();
P.Tabela.t0 = performance.now();
P.Tabela.desenhar(performance.now() + 3500);
fs.writeFileSync('./frames/APP_feature.png', canvas.toBuffer('image/png'));
console.log('OK');
