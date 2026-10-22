/* ==========================================================================
   tabela/tabela.js — motor canvas das cenas restantes (duel/feature/form2)
   Extraido do overlay standalone: aqui e so desenho, sem painel e sem GIF.
   Uso:  Tabela.setTheme('noturno'); Tabela.setCfg({...});
         Tabela.render(ctx, t, {g:ctx, c:cfg, w:1920, h:1080});
   ========================================================================== */
var Tabela = (function(){
'use strict';
var D = { teams: [] };   // abastecido por setTeams() (CSV do painel)
var TEAMS = D.teams || [];
var SITE_CREST = {}; TEAMS.forEach(function(t){ if(t.crest) SITE_CREST[t.name] = t.crest; });
var overrides = {};        // nome do time -> Image (escudo forcado)
var ovLabel = {};          // nome do time -> origem do escudo forcado
var A_COL='#22d3ee', B_COL='#f472b6', C_COL='#ffc400';
var W = 1280, H = 720;
var FF = 'Inter,"Segoe UI",Roboto,Arial,sans-serif';
var MOSTRAR_ESCUDOS = true;   // escudos do site; false = monograma

const THEMES = {
  escuro: { g0:'#141414', g1:'#1a1a1a', g2:'#080808', glow:'255,215,0', grid:'rgba(255,255,255,.035)',
            fg:'255,255,255', dk:'10,10,10', panel:'rgba(10,10,10,.80)', acc:'#ffd700', red:'#e30613',
            lay:{table:'lista',duel:'cards',feature:'painel',lineups:'painel'},
            css:{bg:'#0a0a0a',panel:'#141414',line:'#2a2a2a',txt:'#f2f2f2',mut:'#a3a3a3',card:'#101010'} },
  claro:  { g0:'#f2f6fb', g1:'#e4ebf4', g2:'#d7e0ec', glow:'217,4,41', grid:'rgba(14,26,45,.06)',
            fg:'14,26,45', dk:'255,255,255', panel:'rgba(255,255,255,.86)', acc:'#d90429', red:'#d90429',
            lay:{table:'lista',duel:'cards',feature:'painel',lineups:'painel'},
            css:{bg:'#eef2f7',panel:'#ffffff',line:'#c9d6e6',txt:'#12233a',mut:'#5b6f88',card:'#e7edf6'} },
  neon:   { g0:'#1a0033', g1:'#12002b', g2:'#05001a', glow:'0,229,255', grid:'rgba(160,120,255,.08)',
            fg:'240,240,255', dk:'20,0,46', panel:'rgba(20,0,46,.82)', acc:'#00e5ff', red:'#ff2fb9',
            lay:{table:'lista',duel:'cards',feature:'painel',lineups:'painel'},
            css:{bg:'#0a0016',panel:'#170029',line:'#40206b',txt:'#f0eaff',mut:'#a48fd0',card:'#1d0038'} },
  broadcast: { g0:'#f7fafd', g1:'#e9eff7', g2:'#dbe4ef', glow:'18,74,140', grid:'rgba(12,32,58,.06)',
            fg:'12,32,58', dk:'255,255,255', panel:'rgba(255,255,255,.90)', acc:'#124a8c', red:'#d21f2c',
            lay:{duel:'pilula',feature:'painel',lineups:'grade'},
            css:{bg:'#f4f7fb',panel:'#ffffff',line:'#c3d2e4',txt:'#0c203a',mut:'#5a708c',card:'#eaf0f7'} },
  matchfacts:{ g0:'#171c24', g1:'#10141b', g2:'#070a0e', glow:'227,6,19', grid:'rgba(255,255,255,.035)',
            fg:'255,255,255', dk:'9,12,17', panel:'rgba(9,12,17,.82)', acc:'#e30613', red:'#e30613',
            lay:{duel:'pilula',feature:'painel',lineups:'painel'},
            css:{bg:'#090c11',panel:'#131922',line:'#2a323d',txt:'#eef1f6',mut:'#9aa5b4',card:'#0e131a'} },
  aco:      { g0:'#123a63', g1:'#0d2b4b', g2:'#061528', glow:'130,200,255', grid:'rgba(190,225,255,.06)',
            fg:'255,255,255', dk:'4,16,31', panel:'rgba(4,16,31,.78)', acc:'#8fd0ff', red:'#ff5f6d',
            lay:{table:'grade',duel:'cards',feature:'faixa',lineups:'painel'},
            css:{bg:'#061528',panel:'#0b2947',line:'#1d4a75',txt:'#eaf4ff',mut:'#9dbcd8',card:'#08203a'} },
  noturno:  { g0:'#04121f', g1:'#061a2b', g2:'#020a12', glow:'0,214,255', grid:'rgba(120,210,255,.05)',
            fg:'236,246,255', dk:'3,13,23', panel:'rgba(3,13,23,.82)', acc:'#22d3ee', red:'#ff4d6d',
            lay:{duel:'pilula',feature:'faixa',lineups:'grade'},
            css:{bg:'#020a12',panel:'#061a2b',line:'#12405c',txt:'#eaf6ff',mut:'#8fb2c8',card:'#04141f'} },
};
let TH = THEMES.escuro;
// alphas baixos = superfícies (painéis, linhas, chips) -> mais sólidas
// alphas altos  = texto -> intactos
const SOLID = 1.9;
const rw = a => 'rgba('+TH.fg+','+(a<0.25 ? Math.min(1,a*SOLID) : a)+')';
const rd = a => 'rgba('+TH.dk+','+(a<0.9 ? Math.min(1,a*1.1) : a)+')';
let ACC = TH.acc, RED = TH.red;
const GCOL = { G:'#22c55e', E:'#f59e0b', P:'#ef4444' };
const LETTER = { G:'V', E:'E', P:'D' };      // vitória/empate/derrota na inicial em português

const imgs = {};        // escudos carregados (index -> Image)
  let CREST_GEN = 0;      // trocar a lista de times invalida cargas de escudo em voo
  let LOGO_IM = null, LOGO_SRC = '';   // logo do torneio (torneios/<arquivo>)

/* ---------- utilidades ---------- */
const cl = (v,a,b) => Math.max(a, Math.min(b, v));
const lerp = (a,b,p) => a + (b-a)*p;
const easeOut = p => 1 - Math.pow(1-p, 3);
const easeIn = p => p*p*p;
const easeIO = p => p<.5 ? 4*p*p*p : 1-Math.pow(-2*p+2,3)/2;
const seg = (t, s, d) => cl((t - s)/d, 0, 1);            // 0..1 dentro de [s,s+d]
function rr(g,x,y,w,h,r){ r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2); g.beginPath();
  g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function txt(g,s,x,y,{f='500 20px '+FF,c='#fff',al='left',bl='alphabetic',max=0,ls=0,shrink=0}={}){
  g.fillStyle=c; g.textAlign=al; g.textBaseline=bl;
  const mm=/(\d+(?:\.\d+)?)px/.exec(f), base=mm?parseFloat(mm[1]):20;
  let fs=base;
  const apply=()=>{ g.font = mm ? f.replace(mm[1]+'px', (fs%1? fs.toFixed(1): String(fs))+'px') : f; };
  const wid=str=>{ let w=0; for(const ch of [...str]) w+=g.measureText(ch).width; return w+(ls?ls*Math.max(0,[...str].length-1):0); };
  const fits=()=> g.measureText(s).width<=max && (!ls || wid(s)<=max);
  apply();
  if(max>0){
    if(!fits()){                        // reduz a fonte antes de cortar o texto
      const floor = shrink>0 ? shrink : base;
      for(let k=base-0.5; k>=floor; k-=0.5){ fs=k; apply(); if(fits()) break; }
      if(!fits()){ fs=base; apply(); }
    }
    s = fit(g,s,max);
  }
  if(ls){ // espaçamento artificial (Canvas2D não suporta letterSpacing em todo browser)
    const chars=[...s]; g.textAlign='left';
    const wsum=wid(s);
    let cx = al==='center'? x-wsum/2 : al==='right'? x-wsum : x;
    for(const ch of chars){ g.fillText(ch,cx,y); cx+=g.measureText(ch).width+ls; }
    return;
  }
  g.fillText(s,x,y);
}
function fit(g,s,max){ if(g.measureText(s).width<=max) return s; let out=s;
  while(out.length>3 && g.measureText(out+'…').width>max) out=out.slice(0,-1); return out+'…'; }
function wrap(g,s,max,lines=2){ g.font=g.font; const words=s.split(' '); const out=[]; let cur='';
  for(const w of words){ const t=cur?cur+' '+w:w; if(g.measureText(t).width<=max||!cur) cur=t; else { out.push(cur); cur=w; } if(out.length===lines) break; }
  if(out.length<lines) out.push(cur); else out[lines-1]=fit(g,out[lines-1]+' '+cur,max);
  return out.slice(0,lines); }
const norm = s => (s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function initials(n){ const w=n.replace(/[^\p{L}\s.]/gu,' ').split(/\s+/).filter(x=>x.length>1&&!/^(CLUB|FUTBOL|FUTBOLSALA|ASSOC\.?|ESP\.?|CF|CD|CE|UD|FC|A|B)$/i.test(x)); return (w.slice(0,2).map(x=>x[0]).join('') || n[0]||'?').toUpperCase(); }
function badge(g,i,x,y,s){ // escudo: imagem crua (sem recorte/moldura) ou monograma
  const t=TEAMS[i];
  const im = overrides[t.name] || ((MOSTRAR_ESCUDOS && t.crest) ? imgs[i] : null);
  if(im){
    const iw=(im.naturalWidth||im.width||s), ih=(im.naturalHeight||im.height||s);
    const k=Math.min(s/iw, s/ih), dw=iw*k, dh=ih*k;   // encaixa mantendo a proporção
    g.drawImage(im,x-dw/2,y-dh/2,dw,dh);
  } else {
    g.beginPath(); g.arc(x,y,s/2-3,0,7); g.fillStyle=t.color; g.fill();
    txt(g,initials(t.name),x,y+1,{f:'800 '+(s*0.34)+'px '+FF,c:'#0a0f18',al:'center',bl:'middle'});
  }
}
function field(g,x,y,w,h,{bg=rw(.045),bd=rw(.10),r=14}={}){
  rr(g,x,y,w,h,r); g.fillStyle=bg; g.fill(); g.strokeStyle=bd; g.lineWidth=1; g.stroke(); }
function chips(g,form,x,y,{s=22,gap=5,alpha=1}={}){ let cx=x;
  if(!form||!form.length) return 0;
  for(const f of form){ g.globalAlpha=alpha; rr(g,cx,y,s,s,6); g.fillStyle=GCOL[f]||'#64748b'; g.fill();
    txt(g,LETTER[f]||f,cx+s/2,y+s/2+1,{f:'800 '+(s*0.6)+'px '+FF,c:'#0a0f18',al:'center',bl:'middle'});
    cx+=s+gap; }
  g.globalAlpha=1; return cx-x; }

function timeline(c){ let t=0; const segs=c.scenes.map(s=>{const o={k:s.k,d:s.d,t0:t}; t+=s.d; return o;}); return {segs, total:Math.max(t,0.1)}; }
function sceneAt(segs,t){ for(const s of segs){ if(t < s.t0+s.d) return {k:s.k, local:t-s.t0, p:cl((t-s.t0)/s.d,0,1), t0:s.t0, d:s.d}; }
  const l=segs[segs.length-1]; return {k:l.k, local:l.d, p:1, t0:l.t0, d:l.d}; }

/* ---------- fundo ---------- */
function paintBg(g,c,force){
  if(!force){
    if(c.bg==='transparent'){ g.clearRect(0,0,W,H); return; }
    if(c.bg==='green'){ g.fillStyle='#00b140'; g.fillRect(0,0,W,H); return; }
  }
  const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,TH.g0); gr.addColorStop(.55,TH.g1); gr.addColorStop(1,TH.g2);
  g.fillStyle=gr; g.fillRect(0,0,W,H);
  const rg=g.createRadialGradient(W*0.5,120,40,W*0.5,120,900);
  rg.addColorStop(0,'rgba('+TH.glow+',.12)'); rg.addColorStop(1,'rgba('+TH.glow+',0)');
  g.fillStyle=rg; g.fillRect(0,0,W,H);
  g.strokeStyle=TH.grid; g.lineWidth=1;
  for(let x=0;x<W;x+=64){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); }
  for(let y=0;y<H;y+=64){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
}
/* ---------- fundo (imagem opcional por cena) ---------- */
var FUNDOS = {};
function setFundo(o){
  FUNDOS = {};
  if(!o) return;
  Object.keys(o).forEach(function(k){
    var src = o[k];
    if(!src) return;
    FUNDOS[k] = { src: src, img: null };
    var im = new Image();
    im.onload = function(){ if(FUNDOS[k]) FUNDOS[k].img = im; };
    im.src = src;
  });
}
function paintFundo(g, k){
  var f = FUNDOS[k];
  if(f && f.img){
    var iw = f.img.width || W, ih = f.img.height || H;
    var sc = Math.max(W / iw, H / ih);
    var dw = iw * sc, dh = ih * sc;
    g.drawImage(f.img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }
}
/* ---------- cabeçalho persistente ---------- */
function drawHeader(g,t,c){
  field(g,40,28,1200,72,{bg:rd(.78),r:16});
  /* logo do torneio (o mesmo escolhido em Times & Competição) */
  const Logo = (c.logo && loadLogo(c.logo)) || LOGO_IM;
  let sh = 0;
  if(Logo){ logoAt(g,84,64,44); sh = 54; }
  const pulse=0.45+0.55*Math.abs(Math.sin(t*2.2));
  g.font='800 13px '+FF;
  const pw=Math.ceil(g.measureText('AO VIVO').width)+46;
  g.globalAlpha=pulse; rr(g,62+sh,47,pw,34,17); g.fillStyle=RED; g.fill(); g.globalAlpha=1;
  g.beginPath(); g.arc(78+sh,64,5,0,7); g.fillStyle='#fff'; g.fill();
  txt(g,'AO VIVO',96+sh,65,{f:'800 13px '+FF,c:'#fff',bl:'middle'});
  const tx=62+sh+pw+22, maxL=Math.max(160, 748-tx);
  txt(g,c.ttl,tx,58,{f:'800 23px '+FF,c:rw(.97),max:maxL,shrink:15});
  txt(g,c.sub,tx,82,{f:'600 14px '+FF,c:rw(.62),max:maxL,shrink:10});
  // campo · cidade · hora do jogo · previsão do tempo (onde ficava "CLASSIFICAÇÃO")
  const rx=1218;
  txt(g,[c.vName,c.vCity].filter(Boolean).join('  ·  ')||'',rx,56,
      {f:'800 18px '+FF,c:rw(.96),al:'right',max:430,shrink:11});
  const l2=[c.vTime||'', [[c.vIcon,c.vW].filter(Boolean).join(' ')].join('').trim()].filter(Boolean).join('   ·   ');
  txt(g,l2,rx,80,{f:'600 15px '+FF,c:rw(.78),al:'right',max:430,shrink:10});
  g.fillStyle='rgba('+TH.glow+',.85)'; g.fillRect(rx-120,90,120,2.5);
}

/* ---------- render principal ---------- */
function drawScene(g,t,c,kForca){
  const {segs}=timeline(c);
  const s=kForca?{k:kForca,local:t,p:0,t0:0,d:8}:sceneAt(segs,t);
  drawHeader(g,t,c);
  /* todas as cenas das faixas sao HTML: o canvas nao desenha mais nada */
  return s;
}

function renderFrame(t, opts){
  opts = opts || {};
  const g = opts.g, c = opts.c || CFG, w = opts.w || W, h = opts.h || H;
  if (!g) return;
  g.setTransform(w/W, 0, 0, h/H, 0, 0);
  g.clearRect(0, 0, W, H);
  paintBg(g, c);
  var sk = opts.cena || sceneAt(timeline(c).segs, t).k;
  paintFundo(g, sk);
  drawScene(g, t, c, opts.cena);
}


/* ---------- configuracao padrao (a que o painel do placar envia) ---------- */
function cfgPadrao(){
  var p = D.padrao || {};
  return { ttl:p.ttl || 'QUARTA CATALANA', sub:p.sub || 'GRUP 18',
    a:p.a||0, b:p.b||1, c:p.c||0, tl:p.tl||0,
    bg:'transparent', fps:10, scale:1, loop:true,
    dim:false, form:true, crest:true, scenes:[{k:'table', d:8}], logo:'',
    zUp:p.zUp||1, zDn:p.zDn||14, zcUp:p.zcUp||'#22c55e', zcDn:p.zcDn||'#ef4444', zone:true,
    lt:'', sp:'', spText:p.spText || 'PATROCINADORES',
    vName:'', vCity:'', vTime:'', vW:'', vIcon:'' };
}
var CFG = cfgPadrao();

function setCfg(o){ CFG = Object.assign({}, CFG, o || {}); return CFG; }
/* logo do torneio: carrega uma vez por arquivo e redesenha quando entrar */
function loadLogo(src, cb){
  src = src || '';
  if(src === LOGO_SRC) return LOGO_IM;      // nada mudou: nao chama o cb (evita redesenho no meio de outra rotina)
  LOGO_SRC = src; LOGO_IM = null;
  if(!src) return null;                     // sem logo: nada a carregar
  var im = new Image();
  im.onload = function(){ if(LOGO_SRC === src){ LOGO_IM = im; if(cb) cb(); } };
  im.onerror = function(){ if(LOGO_SRC === src){ LOGO_IM = null; if(cb) cb(); } };
  im.src = src;
  return null;
}
function logoAt(g,x,y,s){
  if(!LOGO_IM) return false;
  field(g,x-s/2,y-s/2,s,s,{bg:rw(.06),bd:rw(.10),r:10});
  const iw=LOGO_IM.naturalWidth||LOGO_IM.width||s, ih=LOGO_IM.naturalHeight||LOGO_IM.height||s;
  const k=Math.min((s-10)/iw,(s-10)/ih), dw=iw*k, dh=ih*k;
  g.drawImage(LOGO_IM,x-dw/2,y-dh/2,dw,dh);
  return true;
}
function setTheme(nome){ TH = THEMES[nome] || THEMES.escuro; ACC = TH.acc; RED = TH.red; return TH; }
function setTeams(lista){
  if(lista && lista.length && lista !== TEAMS){
    TEAMS = lista;
    CREST_GEN++;                              // invalida cargas da lista anterior
    for(var k in imgs) delete imgs[k];        // escudos indexados por posicao: recarrega
    for(var o in overrides) delete overrides[o];
    for(var l in ovLabel) delete ovLabel[l];
  }
  return TEAMS;
}
/* escudo vindo do banco do app (escudos/<nome>.png) para um time da tabela */
function setEscudoTime(i, src, label){
  var t = TEAMS[i]; if(!t) return;
  /* time com escudo na classificacao (CSV/banco): o escudo dele manda. O escudo
     do placar so entra quando a tabela nao trouxe escudo nenhum para esse time. */
  if(t.crest){ delete overrides[t.name]; delete ovLabel[t.name]; return; }
  if(!src){ delete overrides[t.name]; delete ovLabel[t.name]; return; }
  var im = new Image();
  im.onload = function(){ overrides[t.name] = im; ovLabel[t.name] = label || src; };
  im.src = src;
}
function setColors(a,b,c){ if(a) A_COL=a; if(b) B_COL=b; if(c) C_COL=c; }
function setEscudos(v){ MOSTRAR_ESCUDOS = !!v; }
/* Carrega os escudos; cada um que entra redesenha (onload) e avisa o chamador. */
function loadCrests(onload){
  var gen = CREST_GEN;                      // se a lista trocar no meio, esta carga e descartada
  TEAMS.forEach(function(t,i){
    if(!t.crest || imgs[i]) return;
    var im = new Image();
    // sem crossOrigin: o app nao le pixels do canvas (nao ha export), entao o
    // escudo carrega mesmo que o servidor de origem nao mande cabecalho CORS.
    im.onload = function(){ if(gen !== CREST_GEN) return; imgs[i] = im; if(onload) onload(i); };
    im.onerror = function(){};
    im.src = t.crest;
  });
}

return {
  W:W, H:H, THEMES:THEMES, DEFAULT_LAY:DEFAULT_LAY,
  render:renderFrame, cfg:function(){ return CFG; }, setCfg:setCfg,
  setTheme:setTheme, setTeams:setTeams, setColors:setColors, setEscudos:setEscudos,
  getColors:function(){return {a:A_COL,b:B_COL,c:C_COL};},
  setEscudoTime:setEscudoTime,
  loadCrests:loadCrests, loadLogo:loadLogo,
  setFundo:setFundo,
  timeline:timeline, sceneAt:sceneAt, teams:function(){ return TEAMS; },
  nomes:function(){ return TEAMS.map(function(t){ return t.name; }); },
  escudo:function(i){ return imgs[i] || null; }
};
})();
