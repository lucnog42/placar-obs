// Prova que os escudos do app (banco escudos/) substituem o monograma no overlay
import fs from 'fs';
import vm from 'vm';
import { createCanvas, Image, loadImage } from '@napi-rs/canvas';

const B = '../';
const OUT = './frames/';

class SafeImage extends Image {
    set src(v) {
        try {
            let p = String(v);
            if (/^(escudos|midias|torneios)\//.test(p)) p = B + p;
            if (p.indexOf('?') > 0) p = p.split('?')[0];
            if (p.indexOf('data:') !== 0 && !fs.existsSync(p)) { console.log('   (404 ignorado:', v, ')'); return; }
            super.src = (p.indexOf('data:') === 0) ? Buffer.from(p.split(',')[1], 'base64') : fs.readFileSync(p);
        } catch (e) { console.log('   (erro de imagem:', e.message, ')'); }
    }
}

function env(preencher) {
    const els = {};
    const mkEl = id => {
        const el = { id, _cls: new Set(), style: {}, innerText: '', textContent: '', innerHTML: '', value: '', checked: false,
            width: 1920, height: 1080, getContext: () => ctx, setAttribute() { }, getAttribute: () => '', appendChild() { },
            remove() { }, querySelectorAll: () => [], querySelector: () => null, addEventListener() { }, click() { } };
        el.classList = { add: c => el._cls.add(c), remove: c => el._cls.delete(c), contains: c => el._cls.has(c), toggle() { } };
        if (preencher && preencher[id]) el.value = preencher[id];
        return el;
    };
    const rafs = [];
    const ctx2 = canvas.getContext('2d');
    const c = {
        window: null, Image: SafeImage, console, performance, Object, Math, JSON, Date, parseInt, parseFloat, isNaN,
        String, Number, Array, Error, RegExp, Promise, Set, Map, Boolean, setTimeout, clearTimeout,
        requestAnimationFrame(cb) { rafs.push(cb); return rafs.length; }, cancelAnimationFrame() { },
        document: { getElementById: id => els[id] || (els[id] = mkEl(id)), querySelectorAll: () => [], createElement: t => mkEl(t), body: { appendChild() { } } }
    };
    c.window = c; c.globalThis = c; vm.createContext(c);
    for (const f of ['js/eventbus.js', 'js/comum.js', 'tabela/tabela.js', 'js/placar/core.js', 'js/placar/tabela.js'])
        vm.runInContext(fs.readFileSync(B + f, 'utf8'), c, { filename: f });
    return { c, els, rafs };
}

const canvas = createCanvas(1920, 1080);
const ctx = canvas.getContext('2d');

function rodar(comEscudo) {
    const { c, els, rafs } = env({});
    const P = c.Placar;
    const times = { timeA: 'PEÑA PASION XENEIZE BARCELONA, ASSOC. A', timeB: 'OUSADIA FC B', siglaA: 'PAS', siglaB: 'OUS',
        escudoA: comEscudo ? 'escudos/Amarelo.png' : '', escudoB: comEscudo ? 'escudos/Roxo.png' : '',
        timeACor: '#22d3ee', timeBCor: '#f472b6', local: 'Campo', hora: '18:00' };
    P.estadoCru = {
        placar: {}, times, estilo: { tema: 'laliga' }, posicao: {}, midia: {}, penaltes: {}, notif: {}, basquete: {}, torneio: {},
        tabela: { tabelaAtivo: 'true', tabelaTema: 'escuro', tabelaModo: 'fixa', tabelaCena: 'duel', tabelaCenas: '[]',
            tabelaA: 'auto', tabelaB: 'auto', tabelaDestaque: 'auto', tabelaEscudos: 'true', tabelaEscalacoes: '{}', tabelaTimes: '[]', tabelaZonas: 'true' },
        estadoVersao: 1
    };
    P.estado = c.buildFlat(P.estadoCru);
    P.aplicarEstado();
    return { c, P, els, rafs };
}

const a = rodar(false);
const b = rodar(true);
await new Promise(r => setTimeout(r, 600));   // espera a transicao do placar (380ms) e os escudos

function pintar(amb, arquivo, t) {
    let ms = t;
    for (let i = 0; i < 40; i++) { ms += 40; const cbs = amb.rafs.splice(0, amb.rafs.length); for (const cb of cbs) cb(performance.now() + ms); }
    fs.writeFileSync(OUT + arquivo, canvas.toBuffer('image/png'));
}
pintar(a, 'D_sem_escudo.png', 3000);
pintar(b, 'D_com_escudo.png', 3000);

const imgA = await loadImage(OUT + 'D_sem_escudo.png');
const imgB = await loadImage(OUT + 'D_com_escudo.png');
const px = async im => { const cc = createCanvas(im.width, im.height); const g = cc.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, im.width, im.height).data; };
const dA = await px(imgA), dB = await px(imgB);
let dif = 0, x0 = 9999, x1 = 0, y0 = 9999, y1 = 0;
for (let y = 0; y < 1080; y++) for (let x = 0; x < 1920; x++) {
    const k = (y * 1920 + x) * 4;
    if (Math.abs(dA[k] - dB[k]) > 24 || Math.abs(dA[k + 1] - dB[k + 1]) > 24 || Math.abs(dA[k + 2] - dB[k + 2]) > 24) {
        dif++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
}
console.log('pixels diferentes entre sem/com escudo:', dif, dif ? ('| area x ' + x0 + '-' + x1 + ' y ' + y0 + '-' + y1) : '');

// cor do escudo Amarelo.png (para procurar no render)
const esq = await loadImage(B + 'escudos/Amarelo.png');
const cc = createCanvas(esq.width, esq.height); const g = cc.getContext('2d'); g.drawImage(esq, 0, 0);
const ed = g.getImageData(Math.floor(esq.width / 2), Math.floor(esq.height / 2), 1, 1).data;
console.log('escudos/Amarelo.png centro = rgb(' + ed[0] + ',' + ed[1] + ',' + ed[2] + ') tamanho ' + esq.width + 'x' + esq.height);
let achou = 0;
for (let i = 0; i < dB.length; i += 4) {
    if (ed[3] > 10 && Math.abs(dB[i] - ed[0]) < 12 && Math.abs(dB[i + 1] - ed[1]) < 12 && Math.abs(dB[i + 2] - ed[2]) < 12) achou++;
}
console.log('pixels do render COM escudo com a cor do Amarelo.png:', achou);
console.log(dif > 500 && achou > 500 ? 'OK: o escudo do app entrou no lugar do monograma' : 'ATENCAO: escudo do app nao apareceu');
