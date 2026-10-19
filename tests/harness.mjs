// Harness: roda o JS do overlay fora do navegador (napi-rs canvas) para validar render + GIF
import fs from 'fs';
import vm from 'vm';
import { createCanvas, Image } from '@napi-rs/canvas';

const DIR = '/opt/data/fcf-grup18';
const CRESTS = '/opt/data/cache/scratch/crests';
const OUT = '/opt/data/cache/scratch/frames';
fs.mkdirSync(OUT, { recursive: true });

const html = fs.readFileSync(DIR + '/overlay_classificacao.html', 'utf8');
const mods = [...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
if (!mods.length) throw new Error('script module não encontrado');
let code = mods[mods.length - 1][1];

let dataJson = html.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/)[1]
  .replace(/<\\\//g, '</');

// aponta os escudos para arquivos locais (o stub Image lê via Buffer)
dataJson = dataJson.replace(/https:\/\/files\.fcf\.cat\/escudos\/clubes\/escudos\/([A-Za-z0-9_.]+)/g,
  (m, f) => 'local:' + CRESTS + '/' + f);

const cv = createCanvas(1280, 720);
const toDataURL = (t = 'image/png') => 'data:' + t + ';base64,' + cv.toBuffer('image/png').toString('base64');

const mkEl = (id) => ({
  id, value: '', checked: false, textContent: '', innerHTML: '', style: {},
  addEventListener() {}, click() {}, remove() {},
});

const vals = { ttl: 'QUARTA CATALANA', sub: 'GRUP 18 · Temporada 2026-27', bg: 'dark', fps: '15', scale: '0.75',
  d_intro: '2', d_table: '6.5', d_duel: '7', d_lower: '5', scrub: '0', ta: '', tb: '', tc: '', cc: '#ffc400',
  theme: 'escuro', zUp: '2', zDn: '14', zcUp: '#22c55e', zcDn: '#ef4444',
  d_feature: '6', d_form2: '6', d_lineups: '8', d_sponsors: '5',
  ltStyle: 'full', spStyle: 'row', spText: 'PATROCINADORES OFICIAIS',
  vName: 'Camp Municipal', vCity: 'Barcelona', vWeather: '18 °C', vIcon: '☀️', vTime: '18:00',
  tl: '0', spU1: '', spU2: '', spU3: '', urlC: '' };
const chk = { s_intro: 1, s_table: 1, s_duel: 1, s_feature: 1, s_form2: 1, s_lower: 1,
              o_dim: 1, o_form: 1, o_crest: 1, o_loop: 1, o_zone: 1 };

const elements = {};
const $ = (id) => {
  if (id === 'cv') return cv;
  if (!elements[id]) {
    const e = mkEl(id);
    if (id in vals) e.value = vals[id];
    if (id in chk) e.checked = true;
    elements[id] = e;
  }
  return elements[id];
};
$('cv').width = 1280; $('cv').height = 720;
const _gc = cv.getContext.bind(cv);
$('cv').getContext = (t) => _gc(t);
$('cv').toDataURL = toDataURL;
elements['data'] = Object.assign(mkEl('data'), { textContent: dataJson });

class HImage extends Image {
  set src(v) {
    try {
      if (typeof v === 'string' && v.startsWith('local:')) super.src = fs.readFileSync(v.slice(6));
      else if (typeof v === 'string' && v.startsWith('data:')) super.src = Buffer.from(v.split(',')[1], 'base64');
      else console.log('stub Image: src remoto ignorado ->', String(v).slice(0, 60));
    } catch (e) { console.log('stub Image erro', e.message); this.onerror && this.onerror(e); }
  }
  get src() { return ''; }
}

const sandbox = {
  console,
  Image: HImage,
  performance: { now: () => Date.now() },
  requestAnimationFrame: (f) => setTimeout(() => f(Date.now()), 16),
  cancelAnimationFrame: () => {},
  setTimeout, clearTimeout, queueMicrotask, Promise, Math, Date, JSON,
  Uint8Array, Int32Array, Uint32Array, Uint8ClampedArray, ArrayBuffer, Array, Object, String, Number, Boolean, Error, RegExp, isNaN, parseInt, parseFloat,
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
  Blob: class { constructor(a) { this.a = a; } },
  document: {
    getElementById: $,
    querySelectorAll: () => [],
    addEventListener() {},
    documentElement: { style: { setProperty() {}, removeProperty() {}, getPropertyValue: () => '' }, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } },
    body: { appendChild() {}, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } },
    head: { appendChild() {} },
    createElement: (t) => t === 'canvas' ? (() => { const c = createCanvas(1280, 720); c.toDataURL = () => 'data:image/png;base64,' + c.toBuffer('image/png').toString('base64'); return c; })() : mkEl('tmp'),
  },
};
const ctx = vm.createContext(sandbox);
vm.runInContext('window = globalThis;', ctx);
vm.runInContext(code, ctx, { filename: 'overlay.js' });

console.log('local: no data =', (dataJson.match(/local:/g)||[]).length, '| o_crest =', vm.runInContext("document.getElementById('o_crest').checked", ctx));
await new Promise(r=>setTimeout(r,300));
console.log('escudos carregados:', vm.runInContext('Object.keys(imgs).length', ctx), vm.runInContext("Object.keys(imgs).map(k=>TEAMS[k].short+'='+imgs[k].width).join(', ')", ctx));
console.log('tot/nframes:', vm.runInContext("document.getElementById('tot').textContent + ' / ' + document.getElementById('nframes').textContent", ctx));

const shot = async (name, t, over) => {
  const url = await vm.runInContext(`__framePng(${t}, ${JSON.stringify(over || {})})`, ctx);
  fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
  console.log('png', name, fs.statSync(`${OUT}/${name}.png`).size);
};

await new Promise(r => setTimeout(r, 400));
await shot('01_intro', 1.0);
await shot('02_table', 4.0);

// liga as cenas novas e injeta conteúdo (escalações, foto do campo, logos)
vm.runInContext("document.getElementById('s_sponsors').checked=true", ctx);
vm.runInContext("document.getElementById('s_lineups').checked=true", ctx);
const linCsv = ['Equipe;Numero;Jogador;Posicao',
 ...['HAILUKONG BARCELONA CLUB FUTBOL A','PEÑA PASION XENEIZE BARCELONA, ASSOC. A'].flatMap(tm =>
   Array.from({length:11},(_,k)=>`${tm};${k+1};JOGADOR ${k+1} TESTE;${['GOL','DEF','DEF','DEF','MEI','MEI','MEI','ATA','ATA','ATA','ATA'][k]}`))].join('\n');
console.log('importLineups:', vm.runInContext(`(()=>{ try{ importLineups(${JSON.stringify(linCsv)},'teste'); return 'ok|'+Object.keys(lineups).length; }catch(e){ return 'erro: '+e.message; } })()`, ctx));
vm.runInContext("['local:/opt/data/cache/scratch/crests/00100_0001176360_1321_Pomar.png','local:/opt/data/cache/scratch/crests/00100_0000459003_hailukong.png','local:/opt/data/cache/scratch/crests/00100_0001188049_2926_ALEGRIA_C.png'].forEach((p,i)=>setSponsor(i,p,'t'+i))", ctx);
await new Promise(r => setTimeout(r, 300));
console.log('tot/nframes:', vm.runInContext("document.getElementById('tot').textContent + ' / ' + document.getElementById('nframes').textContent", ctx));

await shot('04_duel', 11.5);
await shot('07_feature', 18.5);
await shot('14_form2', 24.5);
await shot('08_lineups', 31.5);
await shot('10_sponsors', 43.0);
await shot('05_lower', 48.0);

// temas
vm.runInContext("document.getElementById('theme').value='claro'", ctx);
await shot('11_theme_claro_table', 4.0);
vm.runInContext("document.getElementById('theme').value='neon'", ctx);
await shot('12_theme_neon_duel', 11.5);
vm.runInContext("document.getElementById('theme').value='escuro'", ctx);

// estilos de lower third
for (const [st, tt] of [['compact', 48.0], ['score', 48.0]]) {
  vm.runInContext(`document.getElementById('ltStyle').value='${st}'`, ctx);
  await shot('13_lower_' + st, tt);
}
vm.runInContext("document.getElementById('ltStyle').value='full'", ctx);

// GIF opaco (loop) — cena duelo, 3s @ 10fps, 640x360
let b64 = await vm.runInContext(`__gifB64(${JSON.stringify({ scale: 0.5, fps: 10, bg: 'dark', scenes: [{ k: 'duel', d: 3 }] })})`, ctx);
fs.writeFileSync('./frames/test_duel.gif', Buffer.from(b64, 'base64'));
console.log('gif duelo', fs.statSync('./frames/test_duel.gif').size);

// GIF transparente (faixa inferior)
b64 = await vm.runInContext(`__gifB64(${JSON.stringify({ scale: 0.5, fps: 10, bg: 'transparent', scenes: [{ k: 'lower', d: 3 }] })})`, ctx);
fs.writeFileSync('./frames/test_lower_transp.gif', Buffer.from(b64, 'base64'));
console.log('gif transparente', fs.statSync('./frames/test_lower_transp.gif').size);

// GIF da tabela completa
b64 = await vm.runInContext(`__gifB64(${JSON.stringify({ scale: 0.5, fps: 8, bg: 'dark', scenes: [{ k: 'table', d: 4 }] })})`, ctx);
fs.writeFileSync('./frames/test_table.gif', Buffer.from(b64, 'base64'));
console.log('gif tabela', fs.statSync('./frames/test_table.gif').size);

// testa o importador de CSV da classificação
const csvReal = fs.readFileSync('../dados/classificacio_quarta_catalana_grup18.csv','utf8');
const imp = vm.runInContext(`(()=>{ try{ importCSV(${JSON.stringify(csvReal)},'teste');
  return 'ok|'+TEAMS.length+'|'+TEAMS[0].pos+'º '+TEAMS[0].name+'|comEscudo='+TEAMS.filter(t=>String(t.crest||'').startsWith('data:')).length; }catch(e){ return 'erro: '+e.message; } })()`, ctx);
console.log('importCSV:', imp, '| msg:', vm.runInContext("document.getElementById('msg').textContent", ctx));
await shot('06_table_import', 4.0);
console.log('OK');
