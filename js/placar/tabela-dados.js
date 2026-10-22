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
  function matchTeam(tm, key) {
    if (!tm) return false;
    var n = norm(key); if (!n) return false;
    var s = norm(tm.short), f = norm(tm.name);
    return s === n || f === n || (s && (s.indexOf(n) === 0 || n.indexOf(s) === 0)) ||
           (f && (f.indexOf(n) === 0 || n.indexOf(f) === 0));
  }

  function fillRow(row, tm, cfg, total, pos) {
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

    row.classList.toggle('foco', matchTeam(tm, cfg.a) || matchTeam(tm, cfg.b));
  }

  function fillTable(cfg, times) {
    var total = times.length;
    txt('thTtl', cfg.ttl);
    txt('thSub', cfg.sub);
    txt('thVname', cfg.vName);
    txt('thVmeta', [cfg.vTime, cfg.vW].filter(Boolean).join(' · '));
    setLogo('thLogo', cfg.logo);

    var rows = document.querySelectorAll('#thBody .th-row');
    for (var i = 0; i < rows.length; i++) fillRow(rows[i], times[i], cfg, total, i + 1);
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

  function fill(cfg) {
    var cam = document.getElementById('camadaTabela');
    if (cfg && cam) {
      if (cfg.tema) cam.setAttribute('data-tema', cfg.tema);
      if (cfg.layout) cam.setAttribute('data-layout', cfg.layout);
    }
    var T = window.Tabela;
    var times = (T && T.teams) ? T.teams() : ((window.TABELA_DADOS || {}).teams || []);
    times = times.slice();
    if (cfg && cfg.sort !== false) {
      times.sort(function (x, y) { return (y.pts - x.pts) || ((y.f - y.c) - (x.f - x.c)) || ((x.pos || 0) - (y.pos || 0)); });
    }
    var A = null, B = null;
    times.forEach(function (t) { if (matchTeam(t, cfg.a)) A = t; if (matchTeam(t, cfg.b)) B = t; });

    fillTable(cfg, times);
    fillIntro(cfg, A, B);
    fillFull('int', cfg, A, B);
    fillFull('enc', cfg, A, B);
  }

  return { fill: fill };
})();
