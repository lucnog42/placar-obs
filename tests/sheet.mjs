import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'fs';

const D = './frames/';
const itens = [
  ['N_laliga.png',   'placar: laliga  ->  overlay: escuro'],
  ['N_colorido.png', 'placar: colorido  ->  overlay: neon'],
  ['N_simples.png',  'placar: simples  ->  overlay: matchfacts'],
  ['F_header.png',   'cabecalho do overlay puxando dados da aba Times & Competicao + clima'],
  ['F_duel.png',     'duelo com os escudos do banco do app (nao monograma)'],
  ['N_final_duel.png','placar sai de cena e o overlay entra'],
];
const cols = 2, rows = 3, W = 700, H = 430, PAD = 12, TOP = 34;
const cv = createCanvas(cols * (W + PAD) + PAD, rows * (H + TOP + PAD) + PAD);
const c = cv.getContext('2d');
c.fillStyle = '#111417'; c.fillRect(0, 0, cv.width, cv.height);
c.font = 'bold 17px sans-serif';
for (let i = 0; i < itens.length; i++) {
  const [arq, leg] = itens[i];
  const col = i % cols, row = Math.floor(i / cols);
  const x = PAD + col * (W + PAD), y = PAD + row * (H + TOP + PAD);
  c.fillStyle = '#8ef0c0'; c.fillText(leg.slice(0, 96), x, y + 22);
  try {
    const im = await loadImage(fs.readFileSync(D + arq));
    const s = Math.min(W / im.width, H / im.height);
    c.drawImage(im, x, y + TOP, im.width * s, im.height * s);
    c.strokeStyle = '#2b3037'; c.lineWidth = 1;
    c.strokeRect(x + .5, y + TOP + .5, im.width * s, im.height * s);
  } catch (e) { c.fillStyle = '#f66'; c.fillText('faltou ' + arq, x, y + TOP + 40); }
}
fs.writeFileSync(D + 'M_espelho_temas.png', cv.toBuffer('image/png'));
console.log('folha:', D + 'M_espelho_temas.png', cv.width + 'x' + cv.height);
