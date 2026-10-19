// escalações: CSV -> estado -> cena de escalação desenhada
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
    style: { setProperty() { } }, value: '', checked: false, innerText: '', textContent: '', innerHTML: '',
    width: 1920, height: 1080, getContext() { return ctx; }, setAttribute() { }, querySelectorAll() { return []; }
}));
const rafs = [];
const context = {
    window: null, Image, console, performance, Object, Math, JSON, Date, parseInt, parseFloat, isNaN,
    String, Number, Array, Error, RegExp, Promise, Set, Map, setTimeout, clearTimeout, setInterval,
    clearInterval, FileReader: class { },
    requestAnimationFrame(cb) { rafs.push(cb); return rafs.length; }, cancelAnimationFrame() { },
    document: { getElementById(id) { return mkEl(id); }, querySelectorAll() { return []; },
                documentElement: { style: { setProperty() { } } }, createElement(t) { return mkEl(t); } }
};
context.window = context; context.globalThis = context;
vm.createContext(context);
context.Controle = { estado: {}, status() { } };
for (const f of ['js/eventbus.js', 'js/comum.js', 'tabela/dados.js', 'tabela/tabela.js',
                 'js/placar/core.js', 'js/placar/tabela.js', 'js/controle/tabela.js'])
    vm.runInContext(fs.readFileSync(B + f, 'utf8'), context, { filename: f });

const T = context.Tabela, P = context.Placar, C = context.Controle;
const times = T.teams();
const alvo = times.find(t => t.name.indexOf('PASION') >= 0);
console.log('time alvo:', alvo.name);

const csv = 'Equipe;Jogador;Numero;Posicao\n' +
    alvo.name + ';Marc Puig;1;Goleiro\n' +
    alvo.name + ';Oriol Mas;4;Defesa\n' +
    alvo.name + ';Aniol Serra;5;Defesa\n' +
    alvo.name + ';Biel Roca;8;Meio\n' +
    alvo.name + ';Nil Font;9;Ataque\n' +
    alvo.name + ';Pau Vila;10;Meio\n' +
    'OUTRO TIME QUALQUER;Ze Ninguem;7;Meio\n';
const mapa = C.parseEscalacoes(csv);
console.log('times reconhecidos:', Object.keys(mapa).length, '| jogadores no alvo:',
            (mapa[C._norm(alvo.name)] || []).length);
console.log('resumo do painel:', C.resumoEscalacoes(JSON.stringify(mapa)));

// estado com as escalações + cena de escalação apontando para o alvo
const cru = {
    placar: {}, times: { timeA: 'VERD', timeB: 'ROXO' }, estilo: {}, posicao: {}, midia: {},
    penaltes: {}, notif: {}, basquete: {}, torneio: {}, estadoVersao: 1,
    tabela: { tabelaAtivo: 'true', tabelaCena: 'lineups', tabelaTema: 'escuro', tabelaDuracao: '12',
              tabelaA: 'auto', tabelaB: 'auto', tabelaDestaque: 'auto',
              tabelaEscalacao: String(times.indexOf(alvo)), tabelaEscalacoes: JSON.stringify(mapa) }
};
P.estadoCru = cru; P.estado = context.buildFlat(cru); P.ultimoEstadoCru = {};
P.aplicarEstado();
P.Tabela.t0 = performance.now();
P.Tabela.desenhar(performance.now() + 3000);

const d = ctx.getImageData(0, 0, 1920, 1080).data;
let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
console.log('pixels desenhados:', n);
fs.writeFileSync('./frames/APP_lineups_dados.png', canvas.toBuffer('image/png'));

// sem dados: deve cair no aviso
const cru2 = JSON.parse(JSON.stringify(cru));
cru2.tabela.tabelaEscalacoes = '{}';
P.estadoCru = cru2; P.estado = context.buildFlat(cru2); P.aplicarEstado();
P.Tabela.t0 = performance.now(); P.Tabela.desenhar(performance.now() + 3000);
fs.writeFileSync('./frames/APP_lineups_vazio.png', canvas.toBuffer('image/png'));
console.log('OK');
