/* ==========================================================================
   tabela/tabela.js — motor canvas das cenas restantes (duel/feature/lineups/sponsors/lower)
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
var lineups = {};          // escalacoes: nome normalizado -> [{num,player,pos}]
var spImgs = [null,null,null];
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
function lineupOf(tm){
  if(!tm) return null;
  const k=norm(tm.name);
  if(lineups[k]) return lineups[k];
  const hit=Object.keys(lineups).find(x=>x.startsWith(k.slice(0,9))||k.startsWith(x.slice(0,9)));
  return hit? lineups[hit] : null;
}
const col = i => TEAMS[i].color;
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

/* ---------- layouts por tema ---------- */
const DEFAULT_LAY={duel:'cards',feature:'painel',lineups:'painel'};
function layOf(k){ const L=(TH&&TH.lay)||{}; return L[k]||DEFAULT_LAY[k]; }
function drawDuel(g,l,t,c){ return layOf('duel')==='pilula' ? duelPilula(g,l,t,c) : duelCards(g,l,t,c); }
function drawFeature(g,l,t,c){ return layOf('feature')==='faixa' ? featFaixa(g,l,t,c) : featPainel(g,l,t,c); }
function drawLineups(g,l,t,c){ return layOf('lineups')==='grade' ? lineupsGrade(g,l,t,c) : lineupsPainel(g,l,t,c); }
/* ---------- cena 3: duelo ---------- */
function duelCards(g,l,t,c){
  const A=TEAMS[c.a], B=TEAMS[c.b];
  const pA=easeOut(seg(l,.05,.75)), pB=easeOut(seg(l,.25,.75));
  // bloco (cartões + resumo) centralizado na área livre abaixo do cabeçalho fixo
  const CH=470, SH=64, gap=18, top=108, bottom=694;
  const y=Math.round(top+((bottom-top)-(CH+gap+SH))/2);
  card(g,c.a,80,y,470,CH,pA,c,l,true);
  card(g,c.b,730,y,470,CH,pB,c,l,false);
  // VS central
  const pv=easeOut(seg(l,.85,.6));
  g.save(); g.globalAlpha=pv;
  const cx=640, cy=y+CH/2, r=58+6*Math.sin(t*3);
  g.beginPath(); g.arc(cx,cy,r+16,0,7); g.strokeStyle='rgba(255,196,0,.25)'; g.lineWidth=2; g.stroke();
  g.beginPath(); g.arc(cx,cy,r,0,7); g.fillStyle=rd(.92); g.fill();
  g.strokeStyle=ACC; g.lineWidth=3; g.stroke();
  txt(g,'VS',cx,cy+2,{f:'900 40px '+FF,c:ACC,al:'center',bl:'middle'});
  g.restore();
  // resumo
  const ps=easeOut(seg(l,1.1,.7));
  g.save(); g.globalAlpha=ps;
  const sy=y+CH+gap, cyS=sy+SH/2;
  field(g,300,sy,680,SH,{bg:rw(.05),r:14});
  const d=A.pts-B.pts;
  txt(g,`${A.pos}º · ${A.pts} pts`,510,cyS,{f:'800 20px '+FF,c:ink(A_COL),al:'right',bl:'middle'});
  txt(g, d===0 ? 'empate na pontuação' : `diferença de ${Math.abs(d)} pt${Math.abs(d)>1?'s':''}`, 640,cyS,{f:'600 14px '+FF,c:rw(.66),al:'center',bl:'middle'});
  txt(g,`${B.pts} pts · ${B.pos}º`,770,cyS,{f:'800 20px '+FF,c:ink(B_COL),bl:'middle'});
  g.restore();
}

function card(g,i,x,y,w,h,p,c,l,left){
  const tm=TEAMS[i], acc = left?A_COL:B_COL;
  const maxF=Math.max(...TEAMS.map(t=>t.f)), maxC=Math.max(...TEAMS.map(t=>t.c));
  g.save(); g.globalAlpha=p; g.translate((1-p)*(left?-70:70),0);
  field(g,x,y,w,h,{bg:rw(.055),bd:rw(.14),r:20});
  // faixa superior
  const gr=g.createLinearGradient(x,0,x+w,0); gr.addColorStop(left?0:1,acc+'55'); gr.addColorStop(left?1:0,acc+'00');
  rr(g,x,y,w,h,20); g.fillStyle=gr; g.fill();
  badge(g,i,x+w/2,y+82,116);
  g.font='800 25px '+FF; g.fillStyle=rw(.97);
  const lines=wrap(g,tm.name.toUpperCase(),w-60,2);
  lines.forEach((ln,k)=>txt(g,ln,x+w/2,y+188+k*30,{f:'800 25px '+FF,c:rw(.97),al:'center',bl:'middle',shrink:14}));
  // posição — alinhada ao lado externo (esquerda no cartão da esquerda, direita no da direita)
  const bw=116, bh=32, bx = left ? x+18 : x+w-18-bw;
  rr(g,bx,y+14,bw,bh,16); g.fillStyle=rd(.35); g.fill();
  txt(g,tm.pos+'º lugar',bx+bw/2,y+14+bh/2+1,{f:'800 15px '+FF,c:rw(.96),al:'center',bl:'middle'});
  // pontos
  const cp=easeOut(seg(l,.35,.7)), v=Math.round(tm.pts*cp);
  txt(g,String(v),x+w/2-18,y+268,{f:'900 72px '+FF,c:ink(acc),al:'center',bl:'middle'});
  txt(g,'PONTOS',x+w/2+74,y+272,{f:'800 14px '+FF,c:rw(.6),bl:'middle',ls:2});
  // stats J G E P
  const stats=[['J',tm.j],['V',tm.g],['E',tm.e],['D',tm.p]], cw=(w-80)/4;
  const ps=easeOut(seg(l,.6,.6));
  stats.forEach(([k,vv],k2)=>{
    const sx=x+40+cw*k2+cw/2, sy=y+330;
    g.globalAlpha=p*ps; field(g,x+40+cw*k2+6,sy-26,cw-12,58,{bg:rw(.05),r:12});
    txt(g,String(Math.round(vv*ps)),sx,sy-2,{f:'800 22px '+FF,c:rw(.97),al:'center',bl:'middle'});
    txt(g,k,sx,sy+18,{f:'700 11px '+FF,c:rw(.55),al:'center',bl:'middle',ls:1});
    g.globalAlpha=p;
  });
  // barras F / C
  const pb=easeOut(seg(l,.8,.7));
  bar(g,x+40,y+390,w-80,10,'Gols a favor',tm.f,maxF,pb,acc);
  bar(g,x+40,y+425,w-80,10,'Gols contra',tm.c,maxC,pb,'#94a3b8');
  // forma
  if(c.form){ g.globalAlpha=p*easeOut(seg(l,.95,.6));
    txt(g,'ÚLTIMOS',x+40,y+452,{f:'800 11px '+FF,c:rw(.5),bl:'middle',ls:1});
    chips(g,tm.form,x+118,y+441,{s:22,gap:5}); g.globalAlpha=p; }
  g.restore();
}
function bar(g,x,y,w,h,label,val,max,p,color){
  txt(g,label,x,y-6,{f:'700 11px '+FF,c:rw(.6)});
  txt(g,String(val),x+w,y-6,{f:'800 12px '+FF,c:rw(.97),al:'right'});
  rr(g,x,y,w,h,h/2); g.fillStyle=rw(.10); g.fill();
  const wp=Math.max(0,w*(val/max))*easeOut(p);
  rr(g,x,y,Math.max(wp,h),h,h/2); g.fillStyle=color; g.fill();
}


/* ---------- cena: time destaque ---------- */
/* ---------- cena: destaque - últimos jogos (exclusiva do time destaque) ---------- */
function drawForm2(g,l,t,c){
  const i=cl(c.c,0,TEAMS.length-1), tm=TEAMS[i], acc=ink(C_COL);
  const form=(tm.form||[]).slice(-5);
  const p1=easeOut(seg(l,.05,.7));
  g.save(); g.globalAlpha=p1; g.translate((1-p1)*-60,0);
  field(g,56,124,700,520,{bg:rw(.055),bd:rw(.14),r:20});
  txt(g,'ÚLTIMOS JOGOS',86,174,{f:'800 13px '+FF,c:acc,ls:3});
  badge(g,i,196,290,170);
  const fn=tm.name.toUpperCase(), fsz=fn.length>28?30:36;
  g.font='800 '+fsz+'px '+FF;
  const lines=wrap(g,fn,430,3);
  lines.forEach((ln,k)=>txt(g,ln,300,236+k*(fsz+7),{f:'800 '+fsz+'px '+FF,c:rw(.98)}));
  rr(g,300,336,190,36,18); g.fillStyle=rw(.10); g.fill();
  txt(g,tm.pos+'º lugar · '+tm.pts+' pts',395,354,{f:'800 15px '+FF,c:zoneOf(tm,c)||rw(.9),al:'center',bl:'middle'});
  txt(g,'SEQUÊNCIA',86,420,{f:'800 11px '+FF,c:rw(.5),ls:2});
  if(!form.length){
    txt(g,'SEM JOGOS REGISTADOS AINDA',436,500,{f:'700 20px '+FF,c:rw(.5),al:'center',bl:'middle'});
  } else {
    const ps=76, gap=24, n=form.length, tot=n*ps+(n-1)*gap;
    let px=86+Math.max(0,(660-tot)/2);
    form.forEach((f,k)=>{
      const pp=easeOut(seg(l,.35+k*.14,.35)); if(pp<=0) return;
      const sz=ps*(.55+.45*pp), x=px+k*(ps+gap)+(ps-sz)/2, y=462+(ps-sz)/2;
      g.globalAlpha=p1*pp;
      rr(g,x,y,sz,sz,14); g.fillStyle=GCOL[f]||'#64748b'; g.fill();
      txt(g,f,px+k*(ps+gap)+ps/2,462+ps/2+2,{f:'900 34px '+FF,c:'#fff',al:'center',bl:'middle'});
      g.globalAlpha=p1;
    });
  }
  const v=form.filter(f=>f==='G').length, e=form.filter(f=>f==='E').length, d=form.filter(f=>f==='P').length;
  const st=[['VITÓRIAS',v,GCOL.G],['EMPATES',e,GCOL.E],['DERROTAS',d,GCOL.P],['GOLS F',tm.f,rw(.95)],['GOLS C',tm.c,rw(.95)],['SALDO',(tm.dg>0?'+':'')+tm.dg,rw(.95)]];
  st.forEach(([k2,val,col],idx)=>{ const x=86+idx*112;
    const sp=easeOut(seg(l,.6+idx*.06,.4)); if(sp<=0) return;
    g.globalAlpha=p1*sp;
    rr(g,x,548,100,72,12); g.fillStyle=rw(.07); g.fill();
    txt(g,String(val),x+50,578,{f:'900 27px '+FF,c:col,al:'center',bl:'middle'});
    txt(g,k2,x+50,604,{f:'700 10px '+FF,c:rw(.55),al:'center',bl:'middle',ls:1});
    g.globalAlpha=p1;
  });
  g.restore();
  /* painel direito: desempenho do time destaque */
  const p2=easeOut(seg(l,.4,.7));
  g.save(); g.globalAlpha=p2; g.translate((1-p2)*60,0);
  field(g,792,124,432,520,{bg:rw(.045),bd:rw(.12),r:20});
  txt(g,'DESEMPENHO',816,174,{f:'800 12px '+FF,c:rw(.6),ls:2});
  const pb=easeOut(seg(l,.55,.7));
  const maxF=Math.max(1,...TEAMS.map(x=>x.f)), maxC=Math.max(1,...TEAMS.map(x=>x.c));
  bar(g,816,240,360,12,'Gols a favor',tm.f,maxF,pb,acc);
  bar(g,816,304,360,12,'Gols contra',tm.c,maxC,pb,rw(.45));
  const gp=tm.j?(tm.f/tm.j):0, ppj=tm.j?(tm.pts/tm.j):0, ap=tm.j?Math.round(tm.pts/(3*tm.j)*100):0;
  [['MÉDIA GOLS/JOGO',gp.toFixed(2)],['PONTOS POR JOGO',ppj.toFixed(2)],['APROVEITAMENTO',ap+'%']].forEach(([k2,val],idx)=>{
    const y=378+idx*88, sp=easeOut(seg(l,.65+idx*.07,.4)); if(sp<=0) return;
    g.globalAlpha=p2*sp;
    rr(g,816,y,360,72,14); g.fillStyle=rw(.06); g.fill();
    txt(g,val,842,y+36,{f:'900 30px '+FF,c:acc,bl:'middle'});
    txt(g,k2,1152,y+36,{f:'700 12px '+FF,c:rw(.6),al:'right',bl:'middle',ls:1});
    g.globalAlpha=p2;
  });
  g.restore();
}
function hexToRgb(h){ const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)||[0,'ff','c4','00'];
  return parseInt(m[1],16)+','+parseInt(m[2],16)+','+parseInt(m[3],16); }
function darken(hex,a){ const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); if(!m) return hex;
  const f=v=>Math.max(0,Math.round(parseInt(v,16)*(1-a))).toString(16).padStart(2,'0');
  return '#'+f(m[1])+f(m[2])+f(m[3]); }
function isLightTheme(){ const p=TH.fg.split(',').map(Number); return (p[0]*0.299+p[1]*0.587+p[2]*0.114) < 128; }
function ink(hex){ return isLightTheme() ? darken(hex,0.42) : hex; }
function zoneOf(tm,c){ if(!c.zone) return null;
  if(c.zUp && tm.pos<=c.zUp) return c.zcUp;
  if(c.zDn && tm.pos>=c.zDn) return c.zcDn; return null; }
function featPainel(g,l,t,c){
  const i=Math.max(0,Math.min(TEAMS.length-1,c.c)), tm=TEAMS[i], acc=ink(C_COL);
  const X=56, Y=124, Wc=1168, Hc=520, DIV=784;
  const p1=easeOut(seg(l,.05,.7));
  g.save(); g.globalAlpha=p1; g.translate((1-p1)*-70,0);
  // um único quadrado: painel do time + tabela encaixada à direita
  field(g,X,Y,Wc,Hc,{bg:rw(.055),bd:rw(.14),r:20});
  g.save(); rr(g,X,Y,Wc,Hc,20); g.clip();
  const gr=g.createLinearGradient(X,0,DIV,0); gr.addColorStop(0,acc+'33'); gr.addColorStop(.6,acc+'00');
  g.fillStyle=gr; g.fillRect(X,Y,DIV-X,Hc);
  g.fillStyle=rw(.10); g.fillRect(DIV,Y,2,Hc);
  g.restore();
  badge(g,i,186,286,164);
  const fn=tm.name.toUpperCase(), fsz=fn.length>28?30:36;
  g.font='800 '+fsz+'px '+FF;
  wrap(g,fn,430,3).forEach((ln,k)=>txt(g,ln,300,232+k*(fsz+7),{f:'800 '+fsz+'px '+FF,c:rw(.98)}));
  const zc=zoneOf(tm,c);
  rr(g,300,318,170,36,18); g.fillStyle=rw(.10); g.fill();
  txt(g,tm.pos+'º lugar',385,337,{f:'800 16px '+FF,c:zc||rw(.9),al:'center',bl:'middle'});
  const cp=easeOut(seg(l,.35,.7));
  txt(g,String(Math.round(tm.pts*cp)),132,468,{f:'900 104px '+FF,c:acc,al:'center',bl:'middle'});
  txt(g,'PONTOS',196,446,{f:'800 16px '+FF,c:rw(.7),bl:'middle',ls:2});
  const pb=easeOut(seg(l,.55,.7));
  const maxF=Math.max(...TEAMS.map(x=>x.f)), maxC=Math.max(...TEAMS.map(x=>x.c));
  bar(g,86,516,300,10,'Gols a favor',tm.f,maxF,pb,acc);
  bar(g,430,516,300,10,'Gols contra',tm.c,maxC,pb,rw(.45));
  if(c.form){ txt(g,'ÚLTIMOS',86,562,{f:'800 11px '+FF,c:rw(.5),bl:'middle',ls:1}); chips(g,tm.form,166,551,{s:22,gap:5}); }
  [['J',tm.j],['V',tm.g],['E',tm.e],['D',tm.p],['F',tm.f],['C',tm.c],['DG',tm.dg]].forEach(([k,v],n)=>{
    const x=86+n*95;
    rr(g,x,592,86,44,10); g.fillStyle=rw(.06); g.fill();
    txt(g,String(v),x+43,610,{f:'800 18px '+FF,c:rw(.95),al:'center',bl:'middle'});
    txt(g,k,x+43,628,{f:'700 10px '+FF,c:rw(.55),al:'center',bl:'middle',ls:1});
  });
  // tabela encaixada (mesmo quadrado)
  const p2=easeOut(seg(l,.35,.7));
  g.globalAlpha=p1*p2;
  txt(g,'CONTEXTO NA TABELA',DIV+22,164,{f:'800 12px '+FF,c:rw(.6),ls:2});
  for(let k=0;k<7;k++){
    const ii=i+k-3; if(ii<0||ii>TEAMS.length-1) continue;
    const o=TEAMS[ii], on=(ii===i), yy=186+k*62;
    field(g,DIV+16,yy,414,54,{bg:on?rw(.13):rw(.04),bd:on?'rgba('+hexToRgb(acc)+',.55)':rw(.06),r:12});
    txt(g,String(o.pos),DIV+42,yy+27,{f:'800 16px '+FF,c:zoneOf(o,c)||rw(.8),al:'center',bl:'middle'});
    badge(g,ii,DIV+84,yy+27,30);
    txt(g,o.short,DIV+106,yy+27,{f:(on?'800':'600')+' 15px '+FF,c:rw(on?.98:.85),bl:'middle',max:232,shrink:9});
    txt(g,o.pts+' pts',DIV+416,yy+27,{f:'800 15px '+FF,c:on?acc:rw(.8),al:'right',bl:'middle'});
  }
  g.restore();
}
/* ---------- cena: escalações ---------- */
function lineupsPainel(g,l,t,c){
  const ti=Math.max(0,Math.min(TEAMS.length-1,c.tl)), tm=TEAMS[ti], list=lineupOf(tm);
  const acc = ink(ti===c.a?A_COL : (ti===c.b?B_COL : C_COL));
  const p=easeOut(seg(l,.05,.7));
  g.save(); g.globalAlpha=p; g.translate(0,(1-p)*40);
  field(g,56,124,1168,520,{bg:rw(.05),bd:rw(.13),r:20});
  badge(g,ti,152,214,104);
  txt(g,tm.short.toUpperCase(),222,196,{f:'800 28px '+FF,c:rw(.97),max:620,shrink:16});
  txt(g,tm.pos+'º lugar · '+tm.pts+' pts · '+tm.j+' jogos',222,228,{f:'600 15px '+FF,c:acc,max:620,shrink:10});
  txt(g,'ESCALAÇÃO',1180,196,{f:'800 12px '+FF,c:rw(.55),al:'right',ls:2});
  txt(g,tm.name,1180,224,{f:'600 14px '+FF,c:rw(.6),al:'right',max:400,shrink:10});
  g.fillStyle=rw(.10); g.fillRect(88,258,1120,2);
  if(!list){ txt(g,'Carregue o CSV das escalações',640,430,{f:'600 18px '+FF,c:rw(.5),al:'center',bl:'middle'}); g.restore(); return; }
  const n=list.length, perCol=Math.ceil(n/2), rowH=Math.min(46,(520-176)/Math.max(perCol,1));
  list.forEach((pl,k)=>{
    const col=Math.floor(k/perCol), row=k%perCol;
    const rp=easeOut(seg(l,.25+k*.045,.4)); if(rp<=0) return;
    g.globalAlpha=p*rp;
    const x=88+col*576, y=284+row*rowH, w=552;
    rr(g,x,y,w,rowH-6,9); g.fillStyle=(row%2?rw(.03):rw(.065)); g.fill();
    rr(g,x+10,y+3,38,rowH-12,8); g.fillStyle=rw(.13); g.fill();
    txt(g,pl.num||'–',x+29,y+(rowH-6)/2+1,{f:'800 15px '+FF,c:acc,al:'center',bl:'middle'});
    txt(g,pl.player,x+60,y+(rowH-6)/2+1,{f:'600 15px '+FF,c:rw(.95),bl:'middle',max:w-140,shrink:11});
    if(pl.pos) txt(g,pl.pos,x+w-12,y+(rowH-6)/2+1,{f:'700 11px '+FF,c:rw(.6),al:'right',bl:'middle',max:80});
    g.globalAlpha=p;
  });
  g.restore();
}

/* ---------- variante: duelo em pílula + comparativo 3 colunas ---------- */
function duelPilula(g,l,t,c){
  const A=TEAMS[c.a], B=TEAMS[c.b];
  const X=190, Wp=900, Y=124, HP=132;
  const p1=easeOut(seg(l,.05,.7)), p2=easeOut(seg(l,.5,.7));
  g.save(); g.globalAlpha=p1; g.translate(0,(1-p1)*-30);
  field(g,X,Y,Wp,HP,{bg:rd(.9),bd:'rgba('+TH.glow+',.45)',r:26});
  g.save(); rr(g,X,Y,Wp,HP,26); g.clip();
  g.fillStyle='rgba('+hexToRgb(A_COL)+',.9)'; g.fillRect(X,Y,10,HP);
  g.fillStyle='rgba('+hexToRgb(B_COL)+',.9)'; g.fillRect(X+Wp-10,Y,10,HP);
  const gl=g.createLinearGradient(X,0,X+Wp,0);
  gl.addColorStop(0,'rgba('+hexToRgb(A_COL)+',.22)'); gl.addColorStop(.5,'rgba(0,0,0,0)');
  gl.addColorStop(1,'rgba('+hexToRgb(B_COL)+',.22)');
  g.fillStyle=gl; g.fillRect(X,Y,Wp,HP);
  g.restore();
  badge(g,c.a,X+86,Y+HP/2,78); badge(g,c.b,X+Wp-86,Y+HP/2,78);
  txt(g,A.short,X+140,Y+HP/2-16,{f:'800 26px '+FF,c:rw(.97),max:268,shrink:12});
  txt(g,B.short,X+Wp-140,Y+HP/2-16,{f:'800 26px '+FF,c:rw(.97),al:'right',max:268,shrink:12});
  txt(g,A.pos+'º · '+A.pts+' pts',X+140,Y+HP/2+20,{f:'700 15px '+FF,c:ink(A_COL),max:268,shrink:10});
  txt(g,B.pos+'º · '+B.pts+' pts',X+Wp-140,Y+HP/2+20,{f:'700 15px '+FF,c:ink(B_COL),al:'right',max:268,shrink:10});
  const cx=X+Wp/2, cy=Y+HP/2, r=34+3*Math.sin(t*3);
  g.beginPath(); g.arc(cx,cy,r,0,7); g.fillStyle=rd(.92); g.fill(); g.strokeStyle=ACC; g.lineWidth=3; g.stroke();
  txt(g,'VS',cx,cy+1,{f:'900 24px '+FF,c:ACC,al:'center',bl:'middle'});
  g.restore();
  const TY=Y+HP+22, ROW=44, ROWS=[['j','Jogos'],['g','Vitórias'],['e','Empates'],['p','Derrotas'],['f','Gols pró'],['c','Gols contra'],['dg','Saldo de gols']];
  const Ht=ROWS.length*ROW+10;
  g.save(); g.globalAlpha=p2;
  field(g,X,TY,Wp,Ht,{bg:rw(.05),bd:rw(.12),r:18});
  g.save(); rr(g,X,TY,Wp,Ht,18); g.clip();
  g.fillStyle='rgba('+hexToRgb(A_COL)+',.9)'; g.fillRect(X,TY,6,Ht);
  g.fillStyle='rgba('+hexToRgb(B_COL)+',.9)'; g.fillRect(X+Wp-6,TY,6,Ht);
  g.restore();
  ROWS.forEach(([k,lab],n)=>{
    const ry=TY+8+n*ROW, hm=(ROW-6)/2+1;
    if(n%2===0){ g.fillStyle=rw(.03); g.fillRect(X+8,ry,Wp-16,ROW-6); }
    txt(g,String(A[k]),X+Wp/2-70,ry+hm,{f:'900 19px '+FF,c:rw(.95),al:'right',bl:'middle'});
    txt(g,lab,X+Wp/2,ry+hm,{f:'700 13px '+FF,c:rw(.62),al:'center',bl:'middle'});
    txt(g,String(B[k]),X+Wp/2+70,ry+hm,{f:'900 19px '+FF,c:rw(.95),bl:'middle'});
  });
  g.restore();
  g.save(); g.globalAlpha=easeOut(seg(l,1.1,.7));
  const d=A.pts-B.pts;
  txt(g, d===0 ? 'mesma pontuação' : `${A.pts} pts  ×  ${B.pts} pts   ·   ${Math.abs(d)} pt${Math.abs(d)>1?'s':''} de diferença`,
       X+Wp/2, TY+Ht+28, {f:'700 15px '+FF,c:rw(.7),al:'center',bl:'middle'});
  g.restore();
}

/* ---------- variante: destaque em faixa (hero + KPIs) ---------- */
function featFaixa(g,l,t,c){
  const i=Math.max(0,Math.min(TEAMS.length-1,c.c)), tm=TEAMS[i], acc=ink(C_COL);
  const X=56, Y=124, Wc=1168;
  const p1=easeOut(seg(l,.05,.7));
  g.save(); g.globalAlpha=p1; g.translate(0,(1-p1)*40);
  field(g,X,Y,Wc,520,{bg:rw(.055),bd:rw(.14),r:20});
  g.save(); rr(g,X,Y,Wc,520,20); g.clip();
  const gl=g.createLinearGradient(X,0,X+Wc,0);
  gl.addColorStop(0,acc+'55'); gl.addColorStop(.5,acc+'14'); gl.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gl; g.fillRect(X,Y,Wc,200);
  g.fillStyle=acc; g.fillRect(X,Y,Wc,4);
  g.restore();
  badge(g,i,X+140,Y+108,152);
  const fn=tm.name.toUpperCase(), fsz=fn.length>30?34:44;
  g.font='800 '+fsz+'px '+FF;
  wrap(g,fn,830,2).forEach((ln,k)=>txt(g,ln,X+250,Y+84+k*(fsz+8),{f:'800 '+fsz+'px '+FF,c:rw(.98)}));
  rr(g,X+250,Y+150,190,36,18); g.fillStyle=rw(.12); g.fill();
  txt(g,tm.pos+'º lugar',X+345,Y+168,{f:'800 16px '+FF,c:zoneOf(tm,c)||rw(.9),al:'center',bl:'middle'});
  const KW=262, KG=18, KY=Y+234, KH=112, kp=easeOut(seg(l,.35,.7));
  g.globalAlpha=p1*kp;
  [['PONTOS',tm.pts,acc],['JOGOS',tm.j,rw(.95)],['GOLS PRÓ',tm.f,rw(.95)],['GOLS CONTRA',tm.c,rw(.95)]].forEach(([lab,v,col],k)=>{
    const x=X+32+k*(KW+KG);
    field(g,x,KY,KW,KH,{bg:rw(.06),bd:rw(.10),r:14});
    txt(g,lab,x+18,KY+30,{f:'800 12px '+FF,c:rw(.55),ls:2});
    txt(g,String(Math.round(v*easeOut(seg(l,.55,.55)))),x+18,KY+78,{f:'900 44px '+FF,c:col,bl:'middle'});
  });
  g.globalAlpha=p1;
  const by=Y+392;
  if(c.form){ txt(g,'ÚLTIMOS',X+32,by,{f:'800 11px '+FF,c:rw(.5),bl:'middle',ls:1}); chips(g,tm.form,X+112,by-13,{s:26,gap:6}); }
  g.fillStyle=rw(.09); g.fillRect(X+32,by+38,Wc-64,2);
  [['J',tm.j],['V',tm.g],['E',tm.e],['D',tm.p],['F',tm.f],['C',tm.c],['DG',tm.dg]].forEach(([k,v],n)=>{
    const x=X+32+n*((Wc-64)/7);
    txt(g,String(v),x+54,by+84,{f:'900 28px '+FF,c:rw(.95),al:'right',bl:'middle'});
    txt(g,k,x+64,by+84,{f:'700 12px '+FF,c:rw(.55),bl:'middle',ls:1});
  });
  g.restore();
}

/* ---------- variante: escalações em grade (4 colunas) ---------- */
function lineupsGrade(g,l,t,c){
  const ti=Math.max(0,Math.min(TEAMS.length-1,c.tl)), tm=TEAMS[ti], list=lineupOf(tm);
  const acc = ink(ti===c.a?A_COL : (ti===c.b?B_COL : C_COL));
  const p=easeOut(seg(l,.05,.7));
  g.save(); g.globalAlpha=p; g.translate(0,(1-p)*40);
  field(g,56,124,1168,520,{bg:rw(.05),bd:rw(.13),r:20});
  badge(g,ti,152,214,104);
  txt(g,tm.short.toUpperCase(),222,196,{f:'800 28px '+FF,c:rw(.97),max:620,shrink:16});
  txt(g,tm.pos+'º lugar · '+tm.pts+' pts · '+tm.j+' jogos',222,228,{f:'600 15px '+FF,c:acc,max:620,shrink:10});
  txt(g,'ESCALAÇÃO',1180,196,{f:'800 12px '+FF,c:rw(.55),al:'right',ls:2});
  txt(g,tm.name,1180,224,{f:'600 14px '+FF,c:rw(.6),al:'right',max:400,shrink:10});
  g.fillStyle=rw(.10); g.fillRect(88,258,1120,2);
  if(!list){ txt(g,'Carregue o CSV das escalações',640,430,{f:'600 18px '+FF,c:rw(.5),al:'center',bl:'middle'}); g.restore(); return; }
  const COLS=4, perCol=Math.ceil(list.length/COLS), cw=(1120-(COLS-1)*16)/COLS, rowH=Math.min(74,344/Math.max(perCol,1));
  list.forEach((pl,k)=>{
    const col=Math.floor(k/perCol), row=k%perCol;
    const rp=easeOut(seg(l,.25+k*.04,.4)); if(rp<=0) return;
    g.globalAlpha=p*rp;
    const x=88+col*(cw+16), y=284+row*rowH;
    rr(g,x,y,cw,rowH-8,9); g.fillStyle=(col%2?rw(.035):rw(.06)); g.fill();
    rr(g,x+10,y+6,30,rowH-20,7); g.fillStyle=rw(.13); g.fill();
    txt(g,pl.num||'–',x+25,y+6+(rowH-20)/2+1,{f:'800 14px '+FF,c:acc,al:'center',bl:'middle'});
    txt(g,pl.player,x+48,y+(rowH-8)/2-9,{f:'600 13px '+FF,c:rw(.95),max:cw-58,shrink:10});
    if(pl.pos) txt(g,pl.pos,x+48,y+(rowH-8)/2+9,{f:'700 10px '+FF,c:rw(.55),max:cw-58});
    g.globalAlpha=p;
  });
  g.restore();
}

/* ---------- cena: patrocinadores ---------- */
function drawSponsors(g,l,t,c){
  const list=spImgs.filter(Boolean), label=c.spText||'PATROCINADORES';
  const slots=(list.length?list.length:3);
  if(c.sp==='spot'){
    const im=list[0], p=easeOut(seg(l,.05,.8));
    g.save(); g.globalAlpha=p;
    field(g,240,190,800,340,{bg:rw(.05),bd:rw(.13),r:24});
    txt(g,label,640,158,{f:'800 14px '+FF,c:ACC,al:'center',ls:3});
    if(im){ const s=Math.min(420/im.width,230/im.height); g.drawImage(im,640-im.width*s/2,365-im.height*s/2,im.width*s,im.height*s); }
    else txt(g,'Carregue um logo',640,365,{f:'700 20px '+FF,c:rw(.45),al:'center',bl:'middle'});
    g.restore();
  } else if(c.sp==='cards'){
    for(let k=0;k<slots;k++){
      const im=list[k], p=easeOut(seg(l,.08+k*.16,.6)), x=140+k*380, y=300, w=340, h=250;
      g.save(); g.globalAlpha=p; g.translate(0,(1-p)*40);
      field(g,x,y,w,h,{bg:rw(.05),bd:rw(.13),r:20});
      if(im){ const s=Math.min((w-80)/im.width,(h-80)/im.height); g.drawImage(im,x+w/2-im.width*s/2,y+h/2-im.height*s/2,im.width*s,im.height*s); }
      else txt(g,'logo '+(k+1),x+w/2,y+h/2,{f:'700 18px '+FF,c:rw(.4),al:'center',bl:'middle'});
      g.restore();
    }
    txt(g,label,640,240,{f:'800 14px '+FF,c:ACC,al:'center',ls:3});
  } else {
    const p=easeOut(seg(l,.05,.7));
    g.save(); g.globalAlpha=p; g.translate(0,(1-p)*40);
    field(g,180,310,920,190,{bg:TH.panel,bd:rw(.14),r:20});
    txt(g,label,640,272,{f:'800 13px '+FF,c:ACC,al:'center',ls:3});
    const cw=920/slots;
    for(let k=0;k<slots;k++){
      const im=list[k], x=180+k*cw+cw/2, ip=easeOut(seg(l,.3+k*.15,.6));
      g.globalAlpha=p*ip;
      if(im){ const s=Math.min((cw-80)/im.width,110/im.height); g.drawImage(im,x-im.width*s/2,405-im.height*s/2,im.width*s,im.height*s); }
      else txt(g,'logo '+(k+1),x,405,{f:'700 16px '+FF,c:rw(.4),al:'center',bl:'middle'});
      g.globalAlpha=p;
      if(k<slots-1){ g.fillStyle=rw(.12); g.fillRect(180+(k+1)*cw-1,360,1,90); }
    }
    g.restore();
  }
}

/* ---------- cena 4: faixa inferior (3 estilos) ---------- */
function lowerCompact(g,l,t,c){
  const A=TEAMS[c.a], B=TEAMS[c.b];
  const p=easeOut(seg(l,.05,.6));
  const y=606,h=90;
  g.save(); g.globalAlpha=p; g.translate((1-p)*-80,0);
  txt(g,c.ttl+(c.sub?' · '+c.sub:''),756,y-10,{f:'800 12px '+FF,c:ACC,al:'right',ls:1,max:700});
  field(g,56,y,700,h,{bg:TH.panel,bd:rw(.14),r:14});
  g.fillStyle=rw(.12); g.fillRect(406,y+16,1,h-32);
  badge(g,c.a,110,y+h/2,60); badge(g,c.b,460,y+h/2,60);
  txt(g,A.short,148,y+h/2-11,{f:'800 18px '+FF,c:rw(.97),max:270,bl:'middle',shrink:11});
  txt(g,B.short,498,y+h/2-11,{f:'800 18px '+FF,c:rw(.97),max:270,bl:'middle',shrink:11});
  txt(g,A.pos+'º · '+A.pts+' pts',148,y+h/2+13,{f:'700 13px '+FF,c:rw(.65),max:270,bl:'middle'});
  txt(g,B.pos+'º · '+B.pts+' pts',498,y+h/2+13,{f:'700 13px '+FF,c:rw(.65),max:270,bl:'middle'});
  g.restore();
}
function lowerScore(g,l,t,c){
  const A=TEAMS[c.a], B=TEAMS[c.b];
  const p=easeOut(seg(l,.05,.6));
  const w=1010,h=112,x=(W-w)/2,y=604,cy=y+h/2;
  g.save(); g.globalAlpha=p; g.translate(0,(1-p)*50);
  field(g,x,y,w,h,{bg:TH.panel,bd:rw(.16),r:18});
  badge(g,c.a,x+70,cy,64); badge(g,c.b,x+w-70,cy,64);
  txt(g,A.short,x+112,cy-12,{f:'800 19px '+FF,c:rw(.97),max:330,shrink:12});
  txt(g,B.short,x+w-112,cy-12,{f:'800 19px '+FF,c:rw(.97),al:'right',max:330,shrink:12});
  txt(g,A.pos+'º · '+A.j+'J',x+112,cy+14,{f:'700 12px '+FF,c:rw(.6),max:330});
  txt(g,B.pos+'º · '+B.j+'J',x+w-112,cy+14,{f:'700 12px '+FF,c:rw(.6),al:'right',max:330});
  rr(g,x+w/2-62,y+22,124,68,14); g.fillStyle=rw(.08); g.fill();
  txt(g,String(A.pts),x+w/2-22,cy+1,{f:'900 38px '+FF,c:ink(A_COL),al:'center',bl:'middle'});
  txt(g,'·',x+w/2,cy,{f:'800 26px '+FF,c:rw(.5),al:'center',bl:'middle'});
  txt(g,String(B.pts),x+w/2+22,cy+1,{f:'900 38px '+FF,c:ink(B_COL),al:'center',bl:'middle'});
  txt(g,c.ttl+(c.sub?' · '+c.sub:''),x+w/2,y-14,{f:'800 13px '+FF,c:ACC,al:'center',ls:2,max:720});
  g.restore();
}

function drawLower(g,l,t,c){
  if(c.lt==='compact') return lowerCompact(g,l,t,c);
  if(c.lt==='score') return lowerScore(g,l,t,c);
  return lowerFull(g,l,t,c);
}
function lowerFull(g,l,t,c){
  const A=TEAMS[c.a], B=TEAMS[c.b];
  const pB=easeOut(seg(l,.05,.7));
  const y=468, h=192, x=52, w=1176;
  g.save(); g.globalAlpha=pB; g.translate(0,(1-pB)*90);
  field(g,x,y,w,h,{bg:rd(.9),bd:rw(.14),r:20});
  const gr=g.createLinearGradient(x,0,x+w,0); gr.addColorStop(0,A_COL+'55'); gr.addColorStop(.5,rd(0)); gr.addColorStop(1,B_COL+'55');
  rr(g,x,y,w,h,20); g.fillStyle=gr; g.fill();
  // varredura de luz
  const sw=340, sx=x-400+ (l/Math.max(l,1))*0, prog=easeIO(seg(l,.15,1.1));
  const lx=x-380+ (w+760)*prog;
  const lg=g.createLinearGradient(lx-170,0,lx+170,0); lg.addColorStop(0,rw(0)); lg.addColorStop(.5,rw(.10)); lg.addColorStop(1,rw(0));
  g.save(); rr(g,x,y,w,h,20); g.clip(); g.fillStyle=lg; g.fillRect(lx-200,y,400,h); g.restore();
  // esquerda
  const pl=easeOut(seg(l,.3,.7)), pr=easeOut(seg(l,.45,.7));
  g.save(); g.globalAlpha=pl; g.translate((1-pl)*-60,0);
  badge(g,c.a,x+96,y+h/2-6,104);
  txt(g,A.short.toUpperCase(),x+168,y+54,{f:'800 24px '+FF,c:rw(.97),max:372,shrink:15});
  txt(g,`${A.pos}º lugar · ${A.pts} pts · ${A.j} jogos (${A.g}V ${A.e}E ${A.p}D)`,x+168,y+84,{f:'600 15px '+FF,c:ink(A_COL)});
  txt(g,`gols: ${A.f} pró / ${A.c} contra`,x+168,y+108,{f:'600 14px '+FF,c:rw(.6)});
  if(c.form) chips(g,A.form,x+168,y+124,{s:24,gap:5});
  g.restore();
  g.save(); g.globalAlpha=pr; g.translate((1-pr)*60,0);
  badge(g,c.b,x+w-96,y+h/2-6,104);
  txt(g,B.short.toUpperCase(),x+w-168,y+54,{f:'800 24px '+FF,c:rw(.97),al:'right',max:372,shrink:15});
  txt(g,`${B.pos}º lugar · ${B.pts} pts · ${B.j} jogos (${B.g}V ${B.e}E ${B.p}D)`,x+w-168,y+84,{f:'600 15px '+FF,c:ink(B_COL),al:'right'});
  txt(g,`gols: ${B.f} pró / ${B.c} contra`,x+w-168,y+108,{f:'600 14px '+FF,c:rw(.6),al:'right'});
  if(c.form){ g.save(); g.globalAlpha=1; const n=B.form.length; chips(g,B.form,x+w-168-(n*29-5),y+124,{s:24,gap:5}); g.restore(); }
  g.restore();
  // centro
  const pc=easeOut(seg(l,.7,.6));
  g.save(); g.globalAlpha=pc;
  const cx=x+w/2, cy=y+h/2-16, r=34+4*Math.sin(t*3.2);
  g.beginPath(); g.arc(cx,cy,r,0,7); g.fillStyle='rgba(255,196,0,.14)'; g.fill();
  g.strokeStyle=ACC; g.lineWidth=2.5; g.stroke();
  txt(g,'VS',cx,cy+1,{f:'900 26px '+FF,c:ACC,al:'center',bl:'middle'});
  txt(g,c.sub,cx,cy+58,{f:'800 13px '+FF,c:rw(.72),al:'center',bl:'middle',ls:2,max:420});
  txt(g,'fcf.cat',cx,cy+80,{f:'600 12px '+FF,c:rw(.45),al:'center',bl:'middle'});
  g.restore();
  g.restore();
}

/* ---------- render principal ---------- */
function drawScene(g,t,c,kForca){
  const {segs}=timeline(c);
  const s=kForca?{k:kForca,local:t,p:0,t0:0,d:8}:sceneAt(segs,t);
  drawHeader(g,t,c);
  if(s.k==='duel') drawDuel(g,s.local,t,c);
  else if(s.k==='feature') drawFeature(g,s.local,t,c);
  else if(s.k==='form2') drawForm2(g,s.local,t,c);
  else if(s.k==='lineups') drawLineups(g,s.local,t,c);
  else if(s.k==='sponsors') drawSponsors(g,s.local,t,c);
  else if(s.k==='lower') drawLower(g,s.local,t,c);
  return s;
}

/* ---------- notificacao (overlay temporaria no mesmo canvas/motor) ---------- */
var NOTIF = null;
function setNotif(o){
  if(!o || !o.texto){ NOTIF = null; return; }
  NOTIF = { tipo: o.tipo || 'info', texto: o.texto, born: Date.now(), dur: Math.max(1, (o.dur || 4)) * 1000 };
}
function clearNotif(){ NOTIF = null; }
function temNotif(){ return !!NOTIF; }
function drawNotif(g){
  if(!NOTIF) return;
  var age = Date.now() - NOTIF.born;
  if(age >= NOTIF.dur){ NOTIF = null; return; }
  var enter = cl(age / 350, 0, 1);
  var exit  = cl((NOTIF.dur - age) / 350, 0, 1);
  var a = Math.min(enter, exit);
  var col = NOTIF.tipo === 'gol' ? RED :
            NOTIF.tipo === 'amarelo' ? '#facc15' :
            NOTIF.tipo === 'vermelho' ? RED :
            NOTIF.tipo === 'substituicao' ? '#22d3ee' : ACC;
  var titulo = NOTIF.tipo === 'gol' ? 'GOOOOL!' :
               NOTIF.tipo === 'amarelo' ? 'CARTÃO AMARELO' :
               NOTIF.tipo === 'vermelho' ? 'CARTÃO VERMELHO' :
               NOTIF.tipo === 'substituicao' ? 'SUBSTITUIÇÃO' : 'AVISO';
  var y = H * 0.44 - (1 - easeOut(enter)) * 80 + (1 - easeOut(exit)) * 60;
  var bw = W * 0.84, bh = 150, bx = (W - bw) / 2, by = y - bh / 2;
  g.save();
  g.globalAlpha = a;
  field(g, bx, by, bw, bh, { bg: rd(.90), bd: 'rgba(' + TH.glow + ',.45)', r: 20 });
  rr(g, bx, by, 12, bh, 6); g.fillStyle = col; g.fill();
  g.beginPath(); g.arc(bx + 76, y, 30, 0, 7); g.fillStyle = col; g.fill();
  g.beginPath(); g.arc(bx + 76, y, 30, 0, 7); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.stroke();
  txt(g, titulo, bx + 128, y - 26, { f: '900 28px ' + FF, c: col, al: 'left', bl: 'middle', ls: 3, max: bw - 158 });
  txt(g, NOTIF.texto, bx + 128, y + 30, { f: '700 36px ' + FF, c: rw(.97), al: 'left', bl: 'middle', max: bw - 158, shrink: 22 });
  g.restore();
  g.globalAlpha = 1;
}
function renderNotif(opts){
  opts = opts || {};
  var g = opts.g, w = opts.w || W, h = opts.h || H;
  if(!g) return;
  g.setTransform(w / W, 0, 0, h / H, 0, 0);
  g.clearRect(0, 0, W, H);
  drawNotif(g);
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
  drawNotif(g);
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
function setLineups(o){ lineups = o || {}; }
function setPatrocinadores(imgs3){ spImgs = imgs3 || [null,null,null]; }

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
  setLineups:setLineups, setPatrocinadores:setPatrocinadores, loadCrests:loadCrests, loadLogo:loadLogo,
  setFundo:setFundo, setNotif:setNotif, clearNotif:clearNotif, temNotif:temNotif, renderNotif:renderNotif,
  timeline:timeline, sceneAt:sceneAt, teams:function(){ return TEAMS; },
  nomes:function(){ return TEAMS.map(function(t){ return t.name; }); },
  escudo:function(i){ return imgs[i] || null; }
};
})();
