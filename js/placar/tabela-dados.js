// tabela-dados.js — preenche o DOM já montado pelo PHP (não cria HTML).
// Chamado por js/placar/tabela.js quando o estado muda.
var TabelaDados = (function () {

  function $(id) { return document.getElementById(id); }
  function txt(id, v) { var e = $(id); if (e) e.textContent = (v == null ? '' : String(v)); }

  function setLogo(id, src) {
    var e = $(id); if (!e) return;
    if (src) { if (e.getAttribute('src') !== src) e.setAttribute('src', src); e.style.visibility = ''; }
    else { e.removeAttribute('src'); e.style.visibility = 'hidden'; }
  }

  function inits(tm) {
    var s = (tm && (tm.short || tm.name)) || '';
    s = String(s).trim();
    var p = s.split(/\s+/);
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
    return s.slice(0, 3).toUpperCase();
  }

  // desenha escudo dentro de um .th-crestbox (img + fallback monograma)
  function setCrest(box, tm) {
    if (!box) return;
    var img = box.querySelector('img'), mono = box.querySelector('.mono');
    var src = tm && (tm.crest || tm.escudo || '');
    if (src) {
      if (img) { if (img.getAttribute('src') !== src) img.setAttribute('src', src); img.style.display = ''; }
      if (mono) mono.style.display = 'none';
    } else {
      if (img) { img.removeAttribute('src'); img.style.display = 'none'; }
      if (mono) { mono.textContent = inits(tm); mono.style.display = ''; }
    }
  }

  function zoneColor(pos, total) {
    if (pos <= 2) return '#2e9e56';
    if (pos <= 5) return '#3a7bd5';
    if (total && pos > total - 2) return '#c0392b';
    return 'transparent';
  }

  function num(v) { return (v == null || v === '') ? '-' : v; }

  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function pick(raw, key) {
    if (key == null || key === '') return null;
    if (typeof key === 'number' || /^\d+$/.test(String(key))) {
      var i = parseInt(key, 10);
      return (i >= 0 && i < raw.length) ? raw[i] : null;
    }
    for (var k = 0; k < raw.length; k++) if (matchTeam(raw[k], key)) return raw[k];
    return null;
  }

  function matchTeam(tm, key) {
    if (!tm) return false;
    var n = norm(key); if (!n) return false;
    var s = norm(tm.short), f = norm(tm.name);
    return s === n || f === n || (s && (s.indexOf(n) === 0 || n.indexOf(s) === 0)) ||
           (f && (f.indexOf(n) === 0 || n.indexOf(f) === 0));
  }

  function fillRow(row, tm, cfg, total, pos, isA, isB) {
    var q = function (s) { return row.querySelector(s); };
    var posEl = q('.th-pos'), nameEl = q('.th-name'), ptsEl = q('.th-pts');
    if (!tm) { row.style.display = 'none'; return; }
    row.style.display = '';

    if (posEl) { posEl.textContent = pos; row.style.setProperty('--zc', zoneColor(pos, total)); }
    setCrest(q('.th-crestbox'), tm);
    if (nameEl) nameEl.textContent = tm.short || tm.name || '';
    if (ptsEl) ptsEl.textContent = num(tm.pts);

    // dados FCF usam: j=jogos, g=vitórias, e=empates, p=derrotas, f=gols pró, c=contra
    var nums = row.querySelectorAll('.th-num');
    var vals = [tm.j, (tm.g != null ? tm.g : tm.v), tm.e, (tm.p != null ? tm.p : tm.d), tm.f, tm.c];
    for (var i = 0; i < nums.length; i++) nums[i].textContent = num(vals[i]);

    // form vem como G (ganhou) / P (perdeu) / E (empate) — catalão
    var CH_CLS = { G: 'v', P: 'd', E: 'e', V: 'v', D: 'd' };
    var CH_TXT = { G: 'V', P: 'D', E: 'E', V: 'V', D: 'D' };
    var chips = row.querySelectorAll('.th-form .th-chip');
    var form = (tm.form || []).slice(-chips.length);
    for (var c = 0; c < chips.length; c++) {
      var ch = chips[c], r = form[c];
      ch.className = 'th-chip';
      if (r) { var k = String(r).toUpperCase(); ch.textContent = CH_TXT[k] || r; ch.classList.add(CH_CLS[k] || 'e'); }
      else ch.textContent = '';
    }

    row.classList.toggle('foco', !!(isA || isB));
  }

  function fillTable(cfg, times, A, B) {
    var total = times.length;
    txt('thTtl', cfg.ttl);
    txt('thSub', cfg.sub);
    txt('thVname', cfg.vName);
    txt('thVmeta', [cfg.vDate, cfg.vTime, cfg.vW].filter(Boolean).join(' · '));
    setLogo('thLogo', cfg.logo);

    var rows = document.querySelectorAll('#thBody .th-row');
    for (var i = 0; i < rows.length; i++) {
      var tm = times[i];
      fillRow(rows[i], tm, cfg, total, i + 1, !!tm && tm === A, !!tm && tm === B);
    }
    ajustarScroll();
    observarAltura();
  }

  /* A cena nasce com display:none -> clientHeight 0 -> ajustarScroll desiste.
     Observa o #thBody e arma a rolagem assim que ele ganhar altura (cena no ar,
     fonte carregada, preview do painel redimensionado). */
  function observarAltura() {
    if (typeof ResizeObserver === 'undefined') return;
    var corpo = document.getElementById('thBody');
    if (!corpo || corpo._obsScroll) return;
    try {
      corpo._obsScroll = new ResizeObserver(function () { ajustarScroll(); });
      corpo._obsScroll.observe(corpo);
    } catch (e) { }
  }

  /* Rolagem automática da classificação.
     Os 24 slots fixos de #thBody não cabem quando há muitos times — em vez de
     encolher a fonte, cada linha tem altura fixa (60 px) e o corpo rola. Aqui
     só calculamos a distância e injetamos o @keyframes com os tempos exatos:
     40 px/s de rolagem, 1 s parado no topo e 3 s parado no fim. Se couber na
     tela, nada anima. (Não criamos HTML: o PHP continua montando a tabela.) */
  var VEL_SCROLL = 40, PAUSA_TOPO = 1, PAUSA_FIM = 3, VOLTA = 0.6;

  function ajustarScroll() {
    var corpo = document.getElementById('thBody');       // janela (clipa)
    var alvo = document.getElementById('thScroll');      // conteudo (rola)
    if (!corpo || !alvo) return;
    alvo.classList.remove('rolar');
    alvo.style.transform = '';
    var linhas = corpo.querySelectorAll('.th-row'), n = 0, alt = 0;
    for (var i = 0; i < linhas.length; i++) {
      if (linhas[i].style.display === 'none') continue;
      n++;
      if (!alt) alt = linhas[i].offsetHeight || 0;
    }
    var visivel = corpo.clientHeight || 0;
    var dist = n * alt - visivel;
    if (!n || !alt || !visivel || dist < 8) return;      // cabe: sem rolagem

    var rolagem = dist / VEL_SCROLL;
    var total = PAUSA_TOPO + rolagem + PAUSA_FIM + rolagem * VOLTA;
    var pc = function (s) { return Math.round((s / total) * 1000) / 10; };
    var st = document.getElementById('thAnim');
    if (!st) {
      if (!document.head) return;
      st = document.createElement('style');
      st.id = 'thAnim';
      document.head.appendChild(st);
    }
    st.textContent = '@keyframes thScroll{'
      + '0%,' + pc(PAUSA_TOPO) + '%{transform:translateY(0)}'
      + pc(PAUSA_TOPO + rolagem) + '%,' + pc(PAUSA_TOPO + rolagem + PAUSA_FIM) + '%{transform:translateY(-' + dist + 'px)}'
      + '100%{transform:translateY(0)}}';
    alvo.style.setProperty('--th-y', '-' + dist + 'px');
    alvo.style.setProperty('--th-dur', total.toFixed(1) + 's');
    alvo.classList.add('rolar');
  }

  function fillIntro(cfg, A, B) {
    txt('inTitulo', cfg.ttl);
    txt('inSub', cfg.sub);
    setLogo('inLogo', cfg.logo);
    txt('inNa', A ? (A.short || A.name) : '');
    txt('inNb', B ? (B.short || B.name) : '');
    txt('inVsub', [cfg.vDate, cfg.vTime, cfg.vW].filter(Boolean).join(' · '));
    setCrest(document.querySelector('#inBdA .th-crestbox'), A);
    setCrest(document.querySelector('#inBdB .th-crestbox'), B);
  }

  function fillFull(pfx, cfg, A, B) {
    txt(pfx + 'Ga', cfg.golsA != null ? cfg.golsA : '0');
    txt(pfx + 'Gb', cfg.golsB != null ? cfg.golsB : '0');
    txt(pfx + 'Na', A ? (A.short || A.name) : '');
    txt(pfx + 'Nb', B ? (B.short || B.name) : '');
    setCrest(document.querySelector('#' + pfx + 'BdA .th-crestbox'), A);
    setCrest(document.querySelector('#' + pfx + 'BdB .th-crestbox'), B);
  }

  /* --- cena RIVAL: top 3, o time logo acima do principal e os 3 abaixo --- */
  function fillRivalLinha(el, tm, ehPrincipal) {
    if (!el) return;
    if (!tm) { el.style.display = 'none'; return; }
    el.style.display = '';
    var q = function (s) { return el.querySelector(s); };
    var pos = q('.rv-pos'), nome = q('.rv-nome'), pts = q('.rv-pts');
    if (pos) pos.textContent = (tm.pos != null ? tm.pos : '') + 'º';
    if (nome) nome.textContent = tm.short || tm.name || '';
    if (pts) pts.textContent = num(tm.pts) + ' pts';
    setCrest(q('.rv-crest'), tm);
    if (el.classList) el.classList.toggle('on', !!ehPrincipal);
  }

  function fillRival(cfg, times) {
    txt('rvTitulo', cfg.ttl);
    txt('rvSub', cfg.sub);
    txt('rvTime', [cfg.vDate, cfg.vTime, cfg.vW].filter(Boolean).join(' · '));
    setLogo('rvLogo', cfg.logo);
    var lista = times || [];
    var i = parseInt(cfg.c, 10);
    if (isNaN(i) || i < 0 || i >= lista.length) i = 0;
    var eu = lista[i] || null;
    ['rvT1', 'rvT2', 'rvT3'].forEach(function (id, k) {
      fillRivalLinha(document.getElementById(id), lista[k], lista[k] === eu);
    });
    var rival = i > 0 ? lista[i - 1] : null;
    fillRivalLinha(document.getElementById('rvRiv'), rival, false);
    txt('rvLblRiv', rival ? ('RIVAL · ' + (rival.pos || i) + 'º') : 'LIDERA A TABELA');
    fillRivalLinha(document.getElementById('rvPrin'), eu, true);
    ['rvB1', 'rvB2', 'rvB3'].forEach(function (id, k) {
      fillRivalLinha(document.getElementById(id), lista[i + 1 + k], false);
    });
    var foot = '';
    if (eu && rival && eu.pts != null && rival.pts != null) {
      var dif = rival.pts - eu.pts;
      foot = dif > 0 ? ('Faltam ' + dif + ' pt' + (dif > 1 ? 's' : '') + ' para o rival')
                     : ('Empatado em pontos com o rival');
    }
    else if (eu && i === 0) foot = 'Líder da competição';
    txt('rvFoot', foot);
  }

  // fundo opcional por cena (intro/table/intervalo/encerramento), vindo do painel
  function setFundos(txt) {
    var map = {};
    if (txt) {
      try { map = (typeof txt === 'string') ? JSON.parse(txt) : txt; }
      catch (e) { return; }              // estado invalido: mantem o que esta na tela
    }
    if (!map || typeof map !== 'object') return;
    var cen = document.querySelectorAll('#camadaTabela .cena');
    for (var i = 0; i < cen.length; i++) {
      var c = cen[i], k = c.getAttribute('data-scene'), bg = c.querySelector('.cena-bg');
      if (!bg || !k) continue;
      var src = map[k] || '';
      if (src) {
        if (bg.getAttribute('data-src') !== src) {
          bg.style.backgroundImage = 'url("' + String(src).replace(/"/g, '%22') + '")';
          bg.setAttribute('data-src', src);
        }
        c.classList.add('com-fundo');
      } else if (bg.getAttribute('data-src')) {
        bg.style.backgroundImage = '';
        bg.removeAttribute('data-src');
        c.classList.remove('com-fundo');
      }
    }
  }

  /* ---------- lower third: faixa com os dois times ---------- */
  function metaTime(tm) {
    if (!tm) return '';
    var v = (tm.g != null ? tm.g : tm.v), e = tm.e, d = (tm.p != null ? tm.p : tm.d);
    return (tm.pos != null ? tm.pos + 'º lugar · ' : '') + num(tm.pts) + ' pts · ' + num(tm.j) + ' jogos' +
      (v != null || e != null || d != null ? ' (' + num(v) + 'V ' + num(e) + 'E ' + num(d) + 'D)' : '');
  }

  function golsTime(tm) {
    if (!tm) return '';
    return 'gols: ' + num(tm.f != null ? tm.f : tm.gp) + ' pró / ' + num(tm.c != null ? tm.c : tm.gc) + ' contra';
  }

  var CH_CLS = { G: 'v', P: 'd', E: 'e', V: 'v', D: 'd' };
  var CH_TXT = { G: 'V', P: 'D', E: 'E', V: 'V', D: 'D' };

  function pintarForm(container, tm, cfg) {
    if (!container) return;
    var chips = container.querySelectorAll('.th-chip');
    var form = (tm && tm.form) ? tm.form.slice(-chips.length) : [];
    for (var i = 0; i < chips.length; i++) {
      var ch = chips[i], r = (cfg.form === false) ? null : form[i];
      ch.className = 'th-chip';
      if (r) { var k = String(r).toUpperCase(); ch.textContent = CH_TXT[k] || r; ch.classList.add(CH_CLS[k] || 'e'); }
      else ch.textContent = '';
    }
  }

  function fillLower(cfg, A, B) {
    txt('lwNa', A ? (A.short || A.name) : '');
    txt('lwNb', B ? (B.short || B.name) : '');
    txt('lwMa', metaTime(A));
    txt('lwMb', metaTime(B));
    txt('lwGa', golsTime(A));
    txt('lwGb', golsTime(B));
    txt('lwSub', cfg.sub);
    setCrest(document.querySelector('.lw-a .th-crestbox'), A);
    setCrest(document.querySelector('.lw-b .th-crestbox'), B);
    pintarForm($('lwFa'), A, cfg);
    pintarForm($('lwFb'), B, cfg);
  }

  /* ---------- escalacao de um time ---------- */
  function lineupOf(cfg, tm) {
    var L = (cfg && cfg.lineups) || {};
    if (!tm) return null;
    var k = norm(tm.name) || norm(tm.short);
    if (!k) return null;
    if (L[k]) return L[k];
    var keys = Object.keys(L);
    for (var i = 0; i < keys.length; i++) {
      var x = norm(keys[i]);
      if (x.indexOf(k.slice(0, 9)) === 0 || k.indexOf(x.slice(0, 9)) === 0) return L[keys[i]];
    }
    return null;
  }

  function fillLineups(cfg, times) {
    var painel = document.querySelector('.lu-painel');
    if (!painel) return;
    var i = Math.max(0, Math.min(times.length - 1, parseInt(cfg.tl, 10) || 0));
    var tm = times[i] || null;
    var list = lineupOf(cfg, tm);

    txt('luNome', tm ? (tm.short || tm.name) : '');
    txt('luMeta', metaTime(tm));
    txt('luTime', tm ? tm.name : '');
    setCrest(document.querySelector('.lu-crest'), tm);

    painel.classList.toggle('sem-lista', !list);
    var linhas = document.querySelectorAll('#luLista .lu-linha');
    for (var r = 0; r < linhas.length; r++) {
      var ln = linhas[r], pl = list ? list[r] : null;
      ln.classList.toggle('oculta', !pl);
      if (!pl) continue;
      var q = function (s) { return ln.querySelector(s); };
      var nEl = q('.lu-num'), jEl = q('.lu-jog'), pEl = q('.lu-pos');
      if (nEl) nEl.textContent = pl.num || '–';
      if (jEl) jEl.textContent = pl.player || '';
      if (pEl) pEl.textContent = pl.pos || '';
    }
  }

  /* ---------- barras e maximos ---------- */
  function barra(id, val, max) {
    var e = $(id);
    if (!e || !e.style || typeof e.style.setProperty !== 'function') return;
    var v = (max > 0) ? Math.max(0, Math.min(1, (Number(val) || 0) / max)) : 0;
    e.style.setProperty('--p', v.toFixed(3));
  }

  function maxDe(campo, times) {
    var m = 0;
    for (var i = 0; i < times.length; i++) m = Math.max(m, Number(times[i][campo]) || 0);
    return m || 1;
  }

  function timePorIndice(cfg, times) {
    var i = Math.max(0, Math.min(times.length - 1, parseInt(cfg.c, 10) || 0));
    return times[i] || null;
  }

  /* ---------- time destaque ---------- */
  function fillFeature(cfg, times) {
    var tm = timePorIndice(cfg, times);
    if (!tm) return;
    var i = Math.max(0, Math.min(times.length - 1, parseInt(cfg.c, 10) || 0));
    txt('ftNome', String(tm.name || '').toUpperCase());
    txt('ftPos', tm.pos != null ? tm.pos + 'º lugar' : '');
    txt('ftPts', num(tm.pts));
    setCrest(document.querySelector('.ft-crest'), tm);
    barra('ftFBar', tm.f, maxDe('f', times));
    barra('ftCBar', tm.c, maxDe('c', times));
    txt('ftFB', num(tm.f));
    txt('ftCB', num(tm.c));
    pintarForm($('ftChips'), tm, cfg);

    var vals = [tm.j, tm.g, tm.e, tm.p, tm.f, tm.c, tm.dg], st = document.querySelectorAll('#ftStats .ft-stat b');
    for (var k = 0; k < st.length; k++) st[k].textContent = num(vals[k]);

    var linhas = document.querySelectorAll('#ftLista .ft-linha');
    for (var n = 0; n < linhas.length; n++) {
      var ii = i + n - 3, o = times[ii], ln = linhas[n];
      ln.classList.toggle('on', ii === i);
      ln.classList.toggle('oculta', !o);
      if (!o) continue;
      var q = function (s) { return ln.querySelector(s); };
      var pe = q('.fl-pos'), ne = q('.fl-nome'), pt = q('.fl-pts');
      if (pe) pe.textContent = o.pos != null ? o.pos : '';
      if (ne) ne.textContent = o.short || o.name || '';
      if (pt) pt.textContent = num(o.pts) + ' pts';
      setCrest(q('.fl-crest'), o);
    }
  }

  /* ---------- ultimos jogos ---------- */
  function fillForm2(cfg, times) {
    var tm = timePorIndice(cfg, times);
    if (!tm) return;
    var form = (tm.form || []).slice(-5);
    txt('f2Nome', String(tm.name || '').toUpperCase());
    txt('f2Pos', (tm.pos != null ? tm.pos + 'º lugar · ' : '') + num(tm.pts) + ' pts');
    setCrest(document.querySelector('.f2-crest'), tm);

    var box = document.querySelector('.f2-esq');
    if (box) box.classList.toggle('sem-form', !form.length);

    var pil = document.querySelectorAll('#f2Seq .f2-pilula');
    for (var k = 0; k < pil.length; k++) {
      var p = pil[k], f = form[k];
      p.className = 'f2-pilula';
      p.textContent = '';
      if (!f) { p.classList.add('oculta'); continue; }
      var u = String(f).toUpperCase();
      p.textContent = CH_TXT[u] || u;
      p.classList.add(CH_CLS[u] || 'e');
    }

    barra('f2FBar', tm.f, maxDe('f', times));
    barra('f2CBar', tm.c, maxDe('c', times));
    txt('f2FB', num(tm.f));
    txt('f2CB', num(tm.c));

    var v = 0, e = 0, d = 0;
    for (var g = 0; g < form.length; g++) {
      if (form[g] === 'G') v++; else if (form[g] === 'E') e++; else if (form[g] === 'P') d++;
    }
    var st = document.querySelectorAll('#f2Stats .f2-stat b');
    var vals = [v, e, d, tm.f, tm.c, (Number(tm.dg) > 0 ? '+' : '') + num(tm.dg)];
    for (var s = 0; s < st.length; s++) st[s].textContent = num(vals[s]);

    var j = Number(tm.j) || 0;
    txt('f2Media', (j ? (Number(tm.f) || 0) / j : 0).toFixed(2));
    txt('f2Ppg', (j ? (Number(tm.pts) || 0) / j : 0).toFixed(2));
    txt('f2Apr', (j ? Math.round((Number(tm.pts) || 0) / (3 * j) * 100) : 0) + '%');
  }

  /* ---------- duelo ---------- */
  var LADOS_DU = [
    { pos: 'duPa', nome: 'duNa', pts: 'duPtsA', j: 'duJA', v: 'duVA', e: 'duEA', d: 'duDA', f: 'duFA', c: 'duCA', fb: 'duFBarA', cb: 'duCBarA', crest: '.du-a .du-crest' },
    { pos: 'duPb', nome: 'duNb', pts: 'duPtsB', j: 'duJB', v: 'duVB', e: 'duEB', d: 'duDB', f: 'duFB', c: 'duCB', fb: 'duFBarB', cb: 'duCBarB', crest: '.du-b .du-crest' }
  ];

  function fillDuel(cfg, A, B, times) {
    var duplas = [[A, LADOS_DU[0]], [B, LADOS_DU[1]]];
    for (var i = 0; i < duplas.length; i++) {
      var tm = duplas[i][0], m = duplas[i][1];
      if (!tm) continue;
      txt(m.pos, tm.pos != null ? tm.pos + 'º lugar' : '');
      txt(m.nome, String(tm.name || '').toUpperCase());
      txt(m.pts, num(tm.pts));
      txt(m.j, num(tm.j));
      txt(m.v, num(tm.g));
      txt(m.e, num(tm.e));
      txt(m.d, num(tm.p));
      txt(m.f, num(tm.f));
      txt(m.c, num(tm.c));
      barra(m.fb, tm.f, maxDe('f', times));
      barra(m.cb, tm.c, maxDe('c', times));
      setCrest(document.querySelector(m.crest), tm);
    }
    if (A && B) {
      var dif = (Number(A.pts) || 0) - (Number(B.pts) || 0);
      txt('duResA', (A.pos != null ? A.pos + 'º · ' : '') + num(A.pts) + ' pts');
      txt('duResB', num(B.pts) + ' pts' + (B.pos != null ? ' · ' + B.pos + 'º' : ''));
      txt('duResC', dif === 0 ? 'empate na pontuação'
        : 'diferença de ' + Math.abs(dif) + ' pt' + (Math.abs(dif) > 1 ? 's' : ''));
    }
  }

  function fill(cfg, tema) {
    cfg = cfg || {};
    var cam = document.getElementById('camadaTabela');
    if (cam && tema) cam.setAttribute('data-tema', tema);
    var raw = (window.Placar && Placar.Tabela && Placar.Tabela.times) ? (Placar.Tabela.times() || []) : [];
    // cfg.a / cfg.b sao INDICES na lista original (indice()); aceita nome como fallback
    // sem CSV o confronto vem do placar (cfg.aTime/bTime), nao da classificacao
    var A = cfg.aTime || pick(raw, cfg.a), B = cfg.bTime || pick(raw, cfg.b);
    var times = raw.slice();
    if (cfg.sort !== false) {
      times.sort(function (x, y) { return (y.pts - x.pts) || ((y.f - y.c) - (x.f - x.c)) || ((x.pos || 0) - (y.pos || 0)); });
    }

    fillTable(cfg, times, A, B);
    fillIntro(cfg, A, B);
    fillFull('int', cfg, A, B);
    fillFull('enc', cfg, A, B);
    fillLower(cfg, A, B);
    fillLineups(cfg, times);
    fillFeature(cfg, times);
    fillForm2(cfg, times);
    fillDuel(cfg, A, B, times);
    fillRival(cfg, times);
  }

  return { fill: fill, setFundos: setFundos, ajustarScroll: ajustarScroll, observarAltura: observarAltura };
})();
