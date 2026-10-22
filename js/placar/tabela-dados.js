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
    txt('thVmeta', [cfg.vTime, cfg.vW].filter(Boolean).join(' · '));
    setLogo('thLogo', cfg.logo);

    var rows = document.querySelectorAll('#thBody .th-row');
    for (var i = 0; i < rows.length; i++) {
      var tm = times[i];
      fillRow(rows[i], tm, cfg, total, i + 1, !!tm && tm === A, !!tm && tm === B);
    }
  }

  function fillIntro(cfg, A, B) {
    txt('inTitulo', cfg.ttl);
    txt('inSub', cfg.sub);
    setLogo('inLogo', cfg.logo);
    txt('inNa', A ? (A.short || A.name) : '');
    txt('inNb', B ? (B.short || B.name) : '');
    txt('inVsub', [cfg.vTime, cfg.vW].filter(Boolean).join(' · '));
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

  function fill(cfg, tema) {
    cfg = cfg || {};
    var cam = document.getElementById('camadaTabela');
    if (cam && tema) cam.setAttribute('data-tema', tema);
    var T = window.Tabela;
    var raw = (T && T.teams) ? (T.teams() || []) : [];
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
  }

  return { fill: fill, setFundos: setFundos };
})();
