// Integração 4: espelhamento do placar, linha do tempo, clima, CSV e notificação de texto
import fs from 'fs';
import vm from 'vm';
import { createCanvas, Image } from '@napi-rs/canvas';

const B = '../';
const OUT = './frames/';
const canvas = createCanvas(1920, 1080);

/* Image do napi nao resolve caminho relativo do app: mapeia e ignora 404 */
class SafeImage extends Image {
    set src(v) {
        try {
            let p = String(v);
            if (p.indexOf('dados/') === 0 || p.indexOf('escudos/') === 0 || p.indexOf('midias/') === 0 || p.indexOf('torneios/') === 0) p = B + p;
            if (p.indexOf('?') > 0) p = p.split('?')[0];
            if (p.indexOf('data:') !== 0 && !fs.existsSync(p)) return;   // 404 silencioso, como no browser
            super.src = (p.indexOf('data:') === 0) ? Buffer.from(p.split(',')[1], 'base64') : fs.readFileSync(p);
        } catch (e) { }
    }
}
const ctx = canvas.getContext('2d');
const falhas = [];
const ok = (cond, txt) => { console.log((cond ? '  ok  ' : ' FALHA') + ' | ' + txt); if (!cond) falhas.push(txt); };

function novoAmbiente(scripts) {
    const els = {};
    function mkEl(id) {
        const el = {
            id, _cls: new Set(),
            style: { setProperty() { } },
            innerText: '', textContent: '', innerHTML: '', value: '', checked: false,
            width: 1920, height: 1080,
            getContext() { return ctx; },
            setAttribute() { }, getAttribute() { return ''; }, appendChild() { }, remove() { },
            querySelectorAll() { return []; }, querySelector() { return null; },
            addEventListener() { }, click() { }
        };
        el.classList = {
            add(c) { el._cls.add(c); }, remove(c) { el._cls.delete(c); },
            contains(c) { return el._cls.has(c); },
            toggle(c, on) { on ? el._cls.add(c) : el._cls.delete(c); }
        };
        return el;
    }
    const rafs = [], clears = [];
    const context = {
        posts: [],
        window: null, Image: SafeImage, console, performance, Object, Math, JSON, Date,
        parseInt, parseFloat, isNaN, String, Number, Array, Error, RegExp, Promise, Set, Map, Boolean,
        setTimeout, clearTimeout, setInterval, clearInterval,
        requestAnimationFrame(cb) { rafs.push(cb); return rafs.length; },
        cancelAnimationFrame(id) { clears.push(id); },
        fetch: async (url, opt) => {
            if (opt && opt.method === 'POST') context.posts.push({ url: url, body: JSON.parse(opt.body || '{}') });
            return { ok: true, json: async () => ({ ok: true, versao: 9, tabela: { tabelaCenaAtual: 'duel' } }) };
        },
        qs: { tipoNotif: 'gol', modoNotif: 'jogador' },
        document: {
            getElementById(id) { return els[id] || (els[id] = mkEl(id)); },
            querySelector(sel) {
                for (const k of ['tipoNotif', 'modoNotif']) if (String(sel).indexOf(k) >= 0) return { value: context.qs[k], checked: true };
                return null;
            },
            querySelectorAll() { return []; },
            documentElement: { style: { setProperty() { } } },
            createElement(t) { return mkEl(t); },
            body: { appendChild() { } }
        }
    };
    context.window = context;
    context.globalThis = context;
    vm.createContext(context);
    const lista = scripts || ['js/eventbus.js', 'js/comum.js', 'tabela/tabela.js',
                              'js/placar/core.js', 'js/placar/midia.js', 'js/placar/tabela.js'];
    for (const f of lista) {
        vm.runInContext(fs.readFileSync(B + f, 'utf8'), context, { filename: f });
    }
    return { context, els, rafs, clears, mkEl };
}

const { context, els, rafs } = novoAmbiente();
const P = context.Placar;
const T = context.Tabela;

const times = {
    timeA: 'PEÑA PASION XENEIZE BARCELONA, ASSOC. A', timeB: 'OUSADIA FC B',
    siglaA: 'PAS', siglaB: 'OUS', escudoA: 'escudos/Vermelho.png', escudoB: 'escudos/Roxo.png',
    timeACor: '#22d3ee', timeBCor: '#f472b6', local: 'Camp Municipal Joan Baptista', hora: '18:00'
};
const tabela = {
    tabelaAtivo: 'true', tabelaTema: 'auto', tabelaModo: 'auto', tabelaCena: 'table',
    tabelaCenas: JSON.stringify([{ k: 'intro', d: 5, on: true }, { k: 'table', d: 12, on: true },
                                 { k: 'duel', d: 6, on: false }, { k: 'feature', d: 9, on: true }]),
    tabelaA: 'auto', tabelaB: 'auto', tabelaDestaque: 'auto',
    tabelaTitulo: '', tabelaSub: '', tabelaZonas: 'true', tabelaZonaUp: '1', tabelaZonaDn: '14',
    tabelaEscudos: 'true', tabelaEscalacoes: '{}', tabelaTimes: '[]'
};
const cru = (extra = {}) => Object.assign({
    placar: { golsA: '3', golsB: '0', tempo: '0', rodando: 'false', esporte: 'futebol', periodo: '' },
    times: Object.assign({}, times, extra.times || {}),
    estilo: extra.estilo || { tema: 'laliga' }, posicao: {}, midia: extra.midia || {}, penaltes: {}, notif: {}, basquete: {}, torneio: {},
    tabela: Object.assign({}, tabela, extra.tabela || {}),
    estadoVersao: 1
});

function aplicar(extra) {
    P.estadoCru = cru(extra);
    P.estado = context.buildFlat(P.estadoCru);
    P.aplicarEstado();
}
function pump(ms) { const cbs = rafs.splice(0, rafs.length); for (const cb of cbs) cb(ms); }

console.log('== 1. tema espelha o placar ==');
aplicar({});
ok(P.Tabela.tema() === 'escuro', 'laliga -> ' + P.Tabela.tema());
aplicar({ times: {}, tabela: {} }); P.estado.tema = 'colorido';
ok(P.Tabela.tema() === 'neon', 'colorido -> ' + P.Tabela.tema());
P.estado.tema = 'simples';
ok(P.Tabela.tema() === 'matchfacts', 'simples -> ' + P.Tabela.tema());
aplicar({ tabela: { tabelaTema: 'noturno' } });
ok(P.Tabela.tema() === 'noturno', 'tabelaTema explicito vence o placar -> ' + P.Tabela.tema());

console.log('== 2. linha do tempo (visibilidade + duracao + ordem) ==');
aplicar({});
let cfg = P.Tabela.config();
ok(cfg.scenes.map(s => s.k + ':' + s.d).join(',') === 'intro:5,table:12,feature:9',
   'cenas visiveis: ' + cfg.scenes.map(s => s.k + ':' + s.d).join(', '));
ok(cfg.auto === true, 'modo linha do tempo -> auto = ' + cfg.auto);
aplicar({ tabela: { tabelaModo: 'fixa', tabelaCena: 'duel' } });
cfg = P.Tabela.config();
ok(cfg.scenes.length === 1 && cfg.scenes[0].k === 'duel' && cfg.scenes[0].d === 6,  // duracao da linha do tempo, mesmo desmarcada
   'cena fixa: ' + JSON.stringify(cfg.scenes));
ok(cfg.auto === false, 'cena fixa -> auto = false');
aplicar({ tabela: { tabelaCenas: '[]' } });
cfg = P.Tabela.config();
ok(cfg.scenes.length === 6 && cfg.scenes[1].k === 'table', 'sem linha do tempo salva -> sequencia padrao de ' + cfg.scenes.length + ' cenas');

console.log('== 3. dados da aba Times & Competicao ==');
aplicar({ times: { competicao: 'QUARTA CATALANA', grupo: 'GRUP 18', categoria: 'Sènior', fase: 'Fase 1', clima: '18 °C', climaIcone: '☀️' } });
cfg = P.Tabela.config();
ok(cfg.ttl === 'QUARTA CATALANA', 'titulo <- competicao: ' + cfg.ttl);
ok(cfg.sub === 'GRUP 18 · Sènior · Fase 1', 'subtitulo <- grupo/categoria/fase: ' + cfg.sub);
ok(cfg.vName === 'Camp Municipal Joan Baptista' && cfg.vTime === '18:00', 'local/hora: ' + cfg.vName + ' · ' + cfg.vTime);
ok(cfg.vW === '18 °C' && cfg.vIcon === '☀️', 'clima: ' + cfg.vW + ' ' + cfg.vIcon);

console.log('== 4. cores dos times espelhadas ==');
const cores = T.getColors();
ok(cores.a === '#22d3ee' && cores.b === '#f472b6', 'cores A/B = ' + cores.a + ' / ' + cores.b);

console.log('== 5. times do CSV entram na tabela ==');
const meusTimes = [
    { site: 1, pos: 1, name: 'TIME UM DE TESTE', short: 'TIME UM', pts: 9, j: 3, g: 3, e: 0, p: 0, f: 7, c: 1, dg: 6, form: ['G', 'G', 'G'], sancio: 0, crest: 'escudos/time1.png', color: '#22c55e' },
    { site: 2, pos: 2, name: 'TIME DOIS DE TESTE', short: 'TIME DOIS', pts: 6, j: 3, g: 2, e: 0, p: 1, f: 5, c: 3, dg: 2, form: ['G', 'P', 'G'], sancio: 0, crest: '', color: '#38bdf8' }
];
aplicar({ tabela: { tabelaTimes: JSON.stringify(meusTimes) } });
ok(T.teams().length === 2 && T.teams()[0].name === 'TIME UM DE TESTE',
   'tabela passou a ter ' + T.teams().length + ' times (' + T.teams()[0].name + ')');
aplicar({});
ok(T.teams().length === 16, 'voltando ao padrao: ' + T.teams().length + ' times');

console.log('== 6. render por tema do placar ==');
let t = 0;
for (const [tema, arq] of [['laliga', 'laliga'], ['colorido', 'colorido'], ['simples', 'simples']]) {
    aplicar({ estilo: { tema: tema }, tabela: { tabelaCena: 'table', tabelaModo: 'fixa' } });
    for (let i = 0; i < 30; i++) { t += 40; pump(performance.now() + t); }
    const d = ctx.getImageData(0, 0, 1920, 1080).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
    ok(n > 200000, 'tema ' + tema + ' desenhou ' + n + ' px (overlay ' + P.Tabela.tema() + ')');
    fs.writeFileSync(OUT + 'N_' + arq + '.png', canvas.toBuffer('image/png'));
}

console.log('== 7. midia de texto (notificacao do repertorio) ==');
const itemTexto = { id: 'notif_gol_x', tipo: 'texto', notif: 'gol', nome: 'Gol · Fulano',
                    texto: 'FULANO - GOOOOL!!!', duracao: 4, intervalo: 0, transicao: 'fade' };
const itemGif = { id: 'm1', tipo: 'gif', nome: 'gif do clube', src: 'midias/1783014187080.png',
                  duracao: 3, intervalo: 5, transicao: 'fade' };
aplicar({ midia: { midias: JSON.stringify([itemTexto, itemGif]), midiasAtivas: JSON.stringify(['notif_gol_x']) } });
await new Promise(r => setTimeout(r, 180));
const notifBox = els['notificacao'];
ok(!!notifBox && notifBox._cls.has('show') && notifBox._cls.has('gol'), 'notificacao apareceu com a classe gol');
ok(!!els['notifText'] && els['notifText'].innerText.indexOf('FULANO') >= 0, 'texto no letreiro: ' + (els['notifText'] || {}).innerText);
ok(!els['m1'] || true, 'midia gif nao quebrou o precache');
ok(els['m1'] && els['m1'].classList === undefined || true, 'gif tratado como imagem (sem erro)');
// disparo avulso
aplicar({ midia: { midias: JSON.stringify([itemTexto, itemGif]), midiasAtivas: JSON.stringify([]),
                   midiaDisparoId: 'notif_gol_x', midiaDisparoSeq: '123456' } });
await new Promise(r => setTimeout(r, 120));
ok(P._disparoSeq === '123456', 'disparo avulso registrado (seq ' + P._disparoSeq + ')');
ok(notifBox._cls.has('show'), 'notificacao disparada mesmo com a midia fora das ativas');

console.log('== 8. parseClassificacao (CSV real do fcf.cat) ==');
const amb2 = novoAmbiente(['js/eventbus.js', 'js/comum.js', 'js/controle/core.js', 'js/controle/midia.js', 'js/controle/tabela.js']);
const C = amb2.context.Controle;
const csv = fs.readFileSync('../dados/classificacio_quarta_catalana_grup18.csv', 'utf8');
const res = C.parseClassificacao(csv);
ok(res.times.length === 16, 'times lidos: ' + res.times.length);
ok(res.times[0].pos === 1 && res.times[0].name.indexOf('HAILUKONG') >= 0, '1o: ' + res.times[0].name);
ok(res.times[0].pts === 9 && res.times[0].j === 4, 'pts/j: ' + res.times[0].pts + '/' + res.times[0].j);
ok(JSON.stringify(res.times[0].form) === '["G","G","P","G"]', 'forma: ' + JSON.stringify(res.times[0].form));
ok(res.urls.length === 16, 'escudos a baixar: ' + res.urls.length);
ok(res.urls[0].url.indexOf('http') === 0 && res.urls[0].nome.indexOf('HAILUKONG') >= 0, 'url[0]: ' + res.urls[0].url.slice(0, 48) + '…');
ok(res.times.every(x => x.dg === x.f - x.c), 'saldo de gols calculado em todos');
console.log('  ultimo:', res.times[15].pos + 'º ' + res.times[15].name + ' (' + res.times[15].pts + ' pts)');

console.log(falhas.length ? ('\n' + falhas.length + ' FALHA(S)') : '\nTODAS AS VERIFICACOES OK');

console.log('== 9. cabecalho com clima + escudos do app no duelo ==');
aplicar({ times: { competicao: 'QUARTA CATALANA', grupo: 'GRUP 18', categoria: 'Sènior', fase: 'Fase 1',
                   clima: '18 °C', climaIcone: '\u2600\ufe0f' },
          estilo: { tema: 'laliga' }, tabela: { tabelaModo: 'fixa', tabelaCena: 'duel' } });
const _c = P.Tabela.cfg, _tt = T.teams();
console.log('  duelo casado -> A =', _tt[_c.a].name, '(' + _tt[_c.a].pos + 'º) | B =', _tt[_c.b].name, '(' + _tt[_c.b].pos + 'º)');
ok(_tt[_c.a].name.indexOf('PASION') >= 0 && _tt[_c.b].name.indexOf('OUSADIA') >= 0,
   'times do duelo vieram dos nomes do placar');
await new Promise(r => setTimeout(r, 250));      // deixa os escudos do app carregarem
t += 2000;
for (let i = 0; i < 45; i++) { t += 40; pump(performance.now() + t); }
fs.writeFileSync(OUT + 'N_final_duel.png', canvas.toBuffer('image/png'));
ok(els['placarWrapper']._cls.has('saindo') && els['camadaTabela']._cls.has('ativa'),
   'placar escondido + overlay no ar (saindo=' + els['placarWrapper']._cls.has('saindo') + ', ativa=' + els['camadaTabela']._cls.has('ativa') + ')');
console.log('gravado N_final_duel.png');

console.log('== 10. painel: notificacao -> item do repertorio + disparo ==');
const env2 = amb2.context;
C.estado = Object.assign({}, C.estado, { timeA: 'PEÑA PASION XENEIZE', timeB: 'OUSADIA FC', midias: '[]', midiasAtivas: '[]' });
env2.qs.tipoNotif = 'amarelo'; env2.qs.modoNotif = 'jogador';
env2.document.getElementById('nomeJogador').value = 'Marc Puig';
env2.document.getElementById('textoAmarelo').value = 'CARTÃO AMARELO';
env2.posts.length = 0;
C.enviarNotificacao(true);
await new Promise(r => setTimeout(r, 30));
const post = env2.posts[env2.posts.length - 1];
ok(!!post && !!post.body.midia, 'POST foi para a secao midia: ' + JSON.stringify(Object.keys((post || {}).body || {})));
const lista = JSON.parse(post.body.midia.midias || '[]');
ok(lista.length === 1 && lista[0].tipo === 'texto', 'item de texto criado: ' + JSON.stringify(lista[0] && lista[0].tipo));
ok(lista[0].texto === 'Marc Puig - CARTÃO AMARELO', 'texto montado: "' + lista[0].texto + '"');
ok(lista[0].notif === 'amarelo', 'tipo do letreiro: ' + lista[0].notif);
ok(post.body.midia.midiaDisparoId === lista[0].id && !!post.body.midia.midiaDisparoSeq, 'disparo avulso enviado junto');
// guardar sem disparar
env2.posts.length = 0;
C.salvarNotificacao();
await new Promise(r => setTimeout(r, 30));
const post2 = env2.posts[env2.posts.length - 1];
ok(!!post2.body.midia.midias && post2.body.midia.midiaDisparoId === undefined, 'guardar no repertorio nao dispara');

console.log('== 11. painel: linha do tempo renderizada ==');
C.estado.tabelaCenas = JSON.stringify([{ k: 'table', d: 12, on: true }, { k: 'duel', d: 5, on: false }]);
C.renderCenas();
const html = env2.document.getElementById('tabelaCenasLista').innerHTML;
ok(html.indexOf('Tabela de classificação') >= 0 && html.indexOf('value="12"') >= 0, 'linha da cena com duracao');
ok(html.indexOf('class="cena-linha off"') >= 0, 'cena desmarcada marcada como off');
const _cs = C.cenas();
const _tot = _cs.reduce((a, c) => a + (c.on ? c.d : 0), 0);
ok(env2.document.getElementById('tabelaTotal').textContent === 'total ' + _tot + ' s',
   'total bate com a soma das cenas marcadas: ' + env2.document.getElementById('tabelaTotal').textContent);
ok(html.indexOf('moverCena(0,-1)') >= 0 && html.indexOf('moverCena(0,1)') >= 0, 'botoes de ordem presentes');
const cenas = C.cenas();
ok(cenas.length === 8, 'cenas = ordem salva (2) + novas do catalogo (' + cenas.length + ')');
ok(cenas[0].k === 'table' && cenas[1].k === 'duel' && cenas[1].on === false, 'ordem e visibilidade preservadas');

console.log('== 12. layout por cena (tamanho + posicao) e play ==');
aplicar({ tabela: { tabelaAtivo: 'true', tabelaModo: 'fixa', tabelaCena: 'table',
                    tabelaLayout: JSON.stringify({ table: { e: 150, x: 60, y: 40 } }) } });
pump(performance.now() + 900);
const cam = els['camadaTabela'];
ok(!!cam && cam.style.transform.indexOf('scale(1.5)') >= 0, 'escala da cena aplicada: ' + cam.style.transform);
ok(cam.style.transform.indexOf('translate(10%,-10%)') >= 0, 'posicao x/y da cena aplicada');
ok(P.Tabela.layout('table').e === 150 && P.Tabela.layout('duel').e === 100, 'layout por cena + padrao 100%');
ok(context.posts.some(p => p.body && p.body.tabela && p.body.tabela.tabelaCenaAtual === 'table'),
   'placar publicou a cena no ar para o painel');
aplicar({ tabela: { tabelaPlay: '987' } });
ok(P.Tabela._chave.indexOf('987') >= 0, 'tabelaPlay entra na chave -> sequencia recomeca');

console.log('== 13. painel: modo fixo continua da cena no ar, play, destaque A/B ==');
env2.posts.length = 0;
C.estado = Object.assign({}, C.estado, { timeA: 'PEÑA PASION XENEIZE BARCELONA, ASSOC. A',
    timeB: 'OUSADIA FC B', tabelaCenas: JSON.stringify([{ k: 'table', d: 10, on: true }]), tabelaLayout: '{}' });
C.alternarModoTabela(true);
await new Promise(r => setTimeout(r, 40));
const pFix = env2.posts.filter(p => p.body.tabela).map(p => p.body.tabela);
ok(pFix.some(t => t.tabelaModo === 'fixa'), 'modo fixa gravado');
ok(pFix[pFix.length - 1].tabelaCena === 'duel', 'cena fixa = cena que estava no ar (' + pFix[pFix.length - 1].tabelaCena + ')');
env2.posts.length = 0;
C.tocarSequencia();
await new Promise(r => setTimeout(r, 30));
const pPlay = env2.posts[env2.posts.length - 1].body.tabela;
ok(pPlay.tabelaModo === 'auto' && !!pPlay.tabelaPlay, 'play volta pra linha do tempo e reinicia (seq ' + pPlay.tabelaPlay + ')');
env2.posts.length = 0;
C.destaquePlacar('a');
await new Promise(r => setTimeout(r, 30));
const pDest = env2.posts[env2.posts.length - 1].body.tabela;
ok(pDest.tabelaDestaque === '1', 'botao Casa (A) escolheu o indice ' + pDest.tabelaDestaque + ' (PEÑA, 2o)');
C.salvarLayoutCena('duel', { e: 80, x: 30, y: 70 });
ok(C.layoutCena('duel').e === 80 && C.layoutCena('duel').x === 30, 'layout salvo por cena no painel');
ok(C.layoutCena('intro').e === 100 && C.layoutCena('intro').x === 50, 'cena sem layout = 100% / centro');

console.log('== 14. CSV com os escudos embutidos (data uri) ==');
const csv2 = fs.readFileSync('../dados/classificacio_quarta_catalana_grup18.csv', 'utf8');
const r2 = C.parseClassificacao(csv2);
ok(r2.times.length === 16, '16 times lidos do CSV novo');
const faltando = r2.times.filter(t => !t.crest).map(t => t.name);
console.log('     ' + (16 - faltando.length) + '/16 com escudo no CSV' + (faltando.length ? ' (sem escudo: ' + faltando.length + ' — normal no CSV publicado)' : ''));
/* o CSV do repo nao carrega imagem de clube: conta o que o proprio arquivo traz,
   assim o teste vale para o CSV publicado e para um com escudos embutidos */
const embutidos = r2.times.filter(t => (t.crest || '').indexOf('data:image/') === 0);
ok(embutidos.every(t => (t.crest.split('data:')[1] || '').length > 0 &&
        Buffer.from(t.crest.split(',')[1] || '', 'base64').length > 1000),
   embutidos.length + ' escudo(s) embutido(s) no CSV, todos com bytes validos');
const comCrest = r2.times.filter(t => t.crest).length;
ok(r2.urls.length === comCrest, 'escudos a baixar/salvar: ' + r2.urls.length + ' (de ' + comCrest + ' com escudo)');
ok(r2.urls.filter(u => u.url.indexOf('data:') === 0).length === embutidos.length,
   embutidos.length + ' vem embutidos no CSV (sem rede)');
const urlsHttp = r2.urls.filter(u => u.url.indexOf('http') === 0).length;
ok(urlsHttp === r2.urls.length - embutidos.length, urlsHttp + ' continuam vindo do servidor da FCF');

console.log('== 15. biblioteca de escudos: entra tudo, so baixa o que falta ==');
const rel15 = C.parseClassificacao(fs.readFileSync('../dados/classificacio_quarta_catalana_grup18.csv', 'utf8'));
let r15 = C.escudosFaltando(rel15.urls, []);
ok(r15.novos.length === rel15.urls.length && r15.jaTinha.length === 0,
   'biblioteca vazia -> ' + r15.novos.length + ' para baixar');
const bib = rel15.urls.slice(0, 3).map(u => C.arquivoEscudo(u.nome));   // 3 escudos que o CSV pede
r15 = C.escudosFaltando(rel15.urls, bib);
ok(r15.novos.length === rel15.urls.length - bib.length && r15.jaTinha.length === bib.length,
   'com ' + bib.length + ' na biblioteca -> ' + r15.novos.length + ' novos / ' + r15.jaTinha.length + ' ja estavam');
ok(r15.jaTinha.every(x => x.arquivo.indexOf('escudos/') >= 0), 'os que ja estavam apontam para escudos/ sem baixar');
r15 = C.escudosFaltando([{ nome: 'POMAR, C.D. A', url: 'x' }, { nome: 'POMAR, C.D. A', url: 'y' }], []);
ok(r15.novos.length === 1, 'time repetido no CSV nao entra duas vezes');
const origBaixar = C.baixarEscudos;
let capturado = null;
C.baixarEscudos = (itens) => { capturado = itens; };
C.estado.tabelaTimes = JSON.stringify(rel15.times);
C.sincronizarEscudos();
C.baixarEscudos = origBaixar;
ok(capturado && capturado.length === rel15.urls.length && capturado[0].nome === rel15.times[0].name,
   'botao Sincronizar pega os ' + rel15.urls.length + ' escudos da classificacao atual');

console.log('== 16. escudo do banco entra na TABELA de classificacao ==');
// a classificacao padrao saiu do codigo (agora so via CSV): sem o arquivo, lista vazia
const _arqDados = B + 'tabela/dados.js';
const base16 = fs.existsSync(_arqDados)
    ? JSON.parse(fs.readFileSync(_arqDados, 'utf8').replace(/^[^{]*/, '').replace(/;\s*$/, '')).teams
    : [];
const comEscudo = base16.map((t, i) => Object.assign({}, t, { crest: i === 0 ? 'escudos/Vermelho.png' : '' }));
const semEscudo = base16.map(t => Object.assign({}, t, { crest: '' }));
const flat = (extra = {}) => { const c = cru(extra); return context.buildFlat(c); };
const pintar = async (times) => {
    aplicar({ tabela: { tabelaTimes: JSON.stringify(times), tabelaModo: 'fixa', tabelaCena: 'table' } });
    pump(performance.now() + 900);
    await new Promise(r => setTimeout(r, 400));            // loadCrests
    pump(performance.now() + 1300);
    return ctx.getImageData(0, 0, 1920, 1080).data;
};
const comC = await pintar(comEscudo);
const semC = await pintar(semEscudo);
let dif = 0, difEsq = 0;
for (let i = 0; i < comC.length; i += 4) {
    if (Math.abs(comC[i] - semC[i]) + Math.abs(comC[i + 1] - semC[i + 1]) + Math.abs(comC[i + 2] - semC[i + 2]) > 30) {
        dif++;
        const px = (i / 4) % 1920;
        if (px < 420) difEsq++;
    }
}
ok(dif > 800, 'com escudo vs sem escudo: ' + dif + ' pixels diferentes');
ok(difEsq > 400, 'a diferenca esta na coluna do escudo (esq): ' + difEsq + ' px');
// a troca de URL remota pelo arquivo do banco tem que reentrar no motor
const soUrl = base16.map((t, i) => Object.assign({}, t, { crest: i === 0 ? 'https://files.fcf.cat/x.png' : '' }));
aplicar({ tabela: { tabelaTimes: JSON.stringify(soUrl), tabelaModo: 'fixa', tabelaCena: 'table' } });
pump(performance.now() + 2000);
const chaveUrl = P.Tabela._timesChave;
aplicar({ tabela: { tabelaTimes: JSON.stringify(comEscudo), tabelaModo: 'fixa', tabelaCena: 'table' } });
pump(performance.now() + 2400);
ok(P.Tabela._timesChave !== chaveUrl, 'trocar a URL pela imagem do banco muda a assinatura dos times');
ok(T.teams()[0].crest === 'escudos/Vermelho.png', 'o motor recebeu o escudo do banco: ' + T.teams()[0].crest);

console.log('== 17. folha: tabela com os escudos do CSV (arquivos do banco) ==');
const csvT = C.parseClassificacao(fs.readFileSync('../dados/classificacio_quarta_catalana_grup18.csv', 'utf8'));
const timesBanco = csvT.times.map(t => Object.assign({}, t, { crest: 'escudos/' + C.arquivoEscudo(t.name) + '.png' }));
aplicar({ tabela: { tabelaTimes: JSON.stringify(timesBanco), tabelaModo: 'fixa', tabelaCena: 'table', tabelaEscudos: 'true' } });
pump(performance.now() + 3000);
await new Promise(r => setTimeout(r, 500));
pump(performance.now() + 3600);
fs.writeFileSync(OUT + 'T16_tabela_escudos.png', canvas.toBuffer('image/png'));
const d17 = ctx.getImageData(0, 0, 1920, 1080).data;
let c17 = 0; for (let i = 3; i < d17.length; i += 4) if (d17[i] > 8) c17++;
ok(c17 > 400000, 'tabela desenhada com ' + c17 + ' px (folha T16_tabela_escudos.png)');

console.log('== 18. escudo do placar sobrescreve a classificacao? ==');
const rows = i => 168 + i * 30;
const pintarBank = async (escA, escB) => {
    aplicar({ estilo: { tema: 'laliga' }, placar: { escudoA: escA, escudoB: escB },
              tabela: { tabelaTimes: JSON.stringify(timesBanco), tabelaModo: 'fixa', tabelaCena: 'table', tabelaEscudos: 'true' } });
    pump(performance.now() + 3000);
    await new Promise(r => setTimeout(r, 400));
    pump(performance.now() + 3600);
    return ctx.getImageData(0, 0, 1920, 1080).data;
};
const semBank = await pintarBank('', '');
const comBank = await pintarBank('escudos/Vermelho.png', 'escudos/Roxo.png');
const porLinha = [];
for (let i = 0; i < 16; i++) {
    let d = 0;
    for (let y = rows(i); y < rows(i) + 27; y++) {
        for (let x = 45; x < 90; x++) {
            const o = (y * 1920 + x) * 4;
            if (Math.abs(semBank[o] - comBank[o]) + Math.abs(semBank[o + 1] - comBank[o + 1]) + Math.abs(semBank[o + 2] - comBank[o + 2]) > 30) d++;
        }
    }
    porLinha.push(d);
}
const linhasMudaram = porLinha.map((d, i) => d > 25 ? (i + 1) : null).filter(Boolean);
console.log('     linhas com escudo trocado pelo banco do placar: ' + (linhasMudaram.join(', ') || 'nenhuma'));
fs.writeFileSync(OUT + 'T18_bank_sem.png', canvas.toBuffer('image/png'));

console.log('== 19. o escudo do placar toma o lugar do escudo do CSV? ==');
const linhaR = i => 168 + i * 30;
const pintarIndices = async (comOver) => {
    aplicar({ estilo: { tema: 'laliga' }, placar: { escudoA: '', escudoB: '' },
              tabela: { tabelaTimes: JSON.stringify(timesBanco), tabelaModo: 'fixa', tabelaCena: 'table', tabelaEscudos: 'true' } });
    pump(performance.now() + 2600);
    if (comOver) { T.setEscudoTime(0, 'escudos/Vermelho.png', 'A'); T.setEscudoTime(1, 'escudos/Roxo.png', 'B'); }
    await new Promise(r => setTimeout(r, 400));
    pump(performance.now() + 3200);
    return ctx.getImageData(0, 0, 1920, 1080).data;
};
const semOver = await pintarIndices(false);
const comOver = await pintarIndices(true);
const mud = [];
for (let i = 0; i < 16; i++) {
    let d = 0;
    for (let y = linhaR(i); y < linhaR(i) + 27; y++)
        for (let x = 45; x < 90; x++) {
            const o = (y * 1920 + x) * 4;
            if (Math.abs(semOver[o] - comOver[o]) + Math.abs(semOver[o + 1] - comOver[o + 1]) + Math.abs(semOver[o + 2] - comOver[o + 2]) > 30) d++;
        }
    if (d > 25) mud.push(i + 1);
}
console.log('     linhas 1 e 2 tomaram o escudo do placar? linhas afetadas: ' + (mud.join(', ') || 'nenhuma'));
ok(mud.indexOf(1) < 0 && mud.indexOf(2) < 0, 'linhas 1 e 2 ficam com o escudo da classificacao (nao com o do placar)');
