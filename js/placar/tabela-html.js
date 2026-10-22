// js/placar/tabela-html.js — cenas tabela/abertura/intervalo/encerramento em HTML/CSS
// Recebe (cena, t, cfg, tema) do Placar.Tabela.desenhar() e monta/atualiza o DOM.
// O resto das cenas continua no canvas (motor tabela/tabela.js).
var TabelaHtml = (function () {
  'use strict';

  var CENAS = { table: 1, intro: 1, intervalo: 1, encerramento: 1 };
  var LAY_TABLE = { escuro: 'lista', claro: 'lista', neon: 'lista', broadcast: 'lista', matchfacts: 'grade', aco: 'grade', noturno: 'lista' };

  var root = null, cenaAtual = null, upd = null, temaAtual = null, sigAtual = null;

  function getRoot() { if (!root) root = document.getElementById('tabelaHtml'); return root; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function seg(t, s, d) { return cl((t - s) / d, 0, 1); }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  function easeIO(p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function mk(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function initials(n) {
    var w = String(n || '').replace(/[^\p{L}\s.]/gu, ' ').split(/\s+/)
      .filter(function (x) { return x.length > 1 && !/^(CLUB|FUTBOL|FUTBOLSALA|ASSOC\.?|ESP\.?|CF|CD|CE|UD|FC|A|B)$/i.test(x); });
    return (w.slice(0, 2).map(function (x) { return x[0]; }).join('') || String(n || '?')[0] || '?').toUpperCase();
  }

  /* escudo do time: imagem ou monograma (fallback) */
  function crest(tm) {
    var box = mk('span', 'th-crestbox');
    if (tm.crest) {
      var im = mk('img'); im.src = tm.crest; im.alt = '';
      var mono = mk('span', 'mono', esc(initials(tm.short || tm.name))); mono.style.display = 'none';
      im.onerror = function () { im.style.display = 'none'; mono.style.display = 'flex'; };
      box.appendChild(im); box.appendChild(mono);
    } else {
      box.appendChild(mk('span', 'mono', esc(initials(tm.short || tm.name))));
    }
    return box;
  }

  function zoneColor(tm, cfg) {
    if (!cfg.zone || tm.pos == null) return '';
    if (tm.pos <= (cfg.zUp || 1)) return cfg.zcUp || '#22c55e';
    if (tm.pos >= (cfg.zDn || 14)) return cfg.zcDn || '#ef4444';
    return '';
  }

  function times() { return (window.Tabela && window.Tabela.teams && window.Tabela.teams()) || []; }
  /* assinatura do conteudo: se mudar (CSV novo, nomes, placar...), reconstroi o DOM */
  function signature(cfg) {
    var ts = times(), p = [cfg.a, cfg.b, cfg.ttl, cfg.sub, cfg.logo || '', cfg.golsA, cfg.golsB,
      cfg.vName, cfg.vTime, cfg.vW, cfg.vIcon, cfg.zone ? 1 : 0, cfg.zUp, cfg.zDn, ts.length];
    for (var i = 0; i < ts.length; i++) {
      var t = ts[i];
      p.push((t.pos) + '|' + (t.short || t.name) + '|' + t.pts + '|' + (t.crest || '') + '|' + (t.form || []).join(''));
    }
    return p.join('~');
  }
  function cores() { try { return (window.Tabela && window.Tabela.getColors && window.Tabela.getColors()) || {}; } catch (e) { return {}; } }

  /* ============================ CENA: TABELA ============================ */
  function buildTable(cfg) {
    var r = getRoot(); r.innerHTML = '';
    var wrap = mk('div', 'th-scene th-table');

    /* header */
    var hdr = mk('div', 'th-hdr');
    if (cfg.logo) { var lg = mk('img', 'th-logo'); lg.src = cfg.logo; lg.onerror = function () { this.style.display = 'none'; }; hdr.appendChild(lg); }
    hdr.appendChild(mk('div', 'th-live', '<span class="dot"></span>AO VIVO'));
    var main = mk('div', 'th-hdrmain');
    main.appendChild(mk('div', 'th-ttl', esc(cfg.ttl || '')));
    main.appendChild(mk('div', 'th-sub', esc(cfg.sub || '')));
    hdr.appendChild(main);
    var right = mk('div', 'th-right');
    right.appendChild(mk('div', 'th-vname', esc([cfg.vName, cfg.vCity].filter(Boolean).join('  ·  '))));
    right.appendChild(mk('div', 'th-vmeta', esc([cfg.vTime || '', [cfg.vIcon, cfg.vW].filter(Boolean).join(' ')].filter(Boolean).join('   ·   '))));
    right.appendChild(mk('div', 'th-vbar'));
    hdr.appendChild(right);
    wrap.appendChild(hdr);

    /* tabela */
    var lay = LAY_TABLE[temaAtual] || 'lista';
    var tbl = mk('div', 'th-tbl' + (lay === 'grade' ? ' grade' : ''));
    var thead = mk('div', 'th-thead th-grid');
    if (lay === 'grade') {
      thead.className = 'th-thead';
      thead.innerHTML = '<div class="th-colhdr"><span>Equipe</span><span style="margin-left:auto">Últimos</span><span>Pts</span></div>'
                      + '<div class="th-colhdr"><span>Equipe</span><span style="margin-left:auto">Últimos</span><span>Pts</span></div>';
    } else {
      thead.innerHTML = '<div class="th-pos"></div><div></div><div class="th-name">Equipe</div>'
        + '<div class="th-pts">Pts</div><div>J</div><div>V</div><div>E</div><div>D</div><div>F</div><div>C</div><div class="th-form">Últimos</div>';
    }
    tbl.appendChild(thead);

    var body = mk('div', 'th-body');
    var lista = times(), refs = [];
    for (var i = 0; i < lista.length; i++) {
      var tm = lista[i], focus = (i === cfg.a || i === cfg.b);
      var row = mk('div', 'th-row th-grid' + (focus ? ' focus' : ''));
      var pos = mk('div', 'th-pos', esc(tm.pos)); var zc = zoneColor(tm, cfg); if (zc) pos.style.color = zc;
      row.appendChild(pos);
      var cr = mk('div', 'th-crest'); var cb = crest(tm); cr.appendChild(cb); row.appendChild(cr);
      row.appendChild(mk('div', 'th-name', esc(tm.short || tm.name)));
      var pts = mk('div', 'th-pts', '0'); row.appendChild(pts);
      var ks = ['j', 'g', 'e', 'p', 'f', 'c'];
      for (var k = 0; k < ks.length; k++) row.appendChild(mk('div', 'th-num', esc(tm[ks[k]])));
      var form = mk('div', 'th-form');
      var fm = tm.form || [];
      for (var f = 0; f < fm.length; f++) {
        var g = String(fm[f] || '').toUpperCase();
        var ico = g === 'G' ? 'V' : (g === 'E' ? 'E' : (g === 'P' ? 'D' : g));
        form.appendChild(mk('span', 'th-chip ' + g, esc(ico)));
      }
      row.appendChild(form);
      body.appendChild(row);
      refs.push({ row: row, pts: pts, form: form, focus: focus, tm: tm });
    }
    tbl.appendChild(body);
    wrap.appendChild(tbl);
    var foot = mk('div', 'th-foot', 'Fonte: fcf.cat · PTS=pontos, J=jogos, V/E/D=vitórias/empates/derrotas, F/C=gols pró/contra · cor da posição = zona · ordem por pontos e saldo de gols');
    wrap.appendChild(foot);
    r.appendChild(wrap);

    return function (t) {
      var hIn = easeOut(seg(t, 0, .5));
      hdr.style.opacity = hIn; thead.style.opacity = hIn;
      for (var i = 0; i < refs.length; i++) {
        var R = refs[i];
        var e = easeOut(seg(t, 0.25 + i * 0.075, 0.5));
        R.row.style.opacity = (R.focus ? 1 : 0.92) * e;
        R.row.style.transform = 'translateX(' + ((1 - e) * -69) + 'px)';
        R.pts.textContent = String(Math.round((parseInt(R.tm.pts, 10) || 0) * easeOut(seg(t, 0.45 + i * 0.075, 0.55))));
        R.form.style.opacity = R.focus ? 1 : 0.8 * easeOut(seg(t, 0.5 + i * 0.075, 0.5));
      }
      foot.style.opacity = easeOut(seg(t, 1.6, .6));
    };
  }

  /* ============================ CENA: ABERTURA ============================ */
  function buildIntro(cfg) {
    var r = getRoot(); r.innerHTML = '';
    var wrap = mk('div', 'th-scene th-intro');
    var lista = times(), A = lista[cfg.a] || {}, B = lista[cfg.b] || {};

    var logo = null;
    if (cfg.logo) { logo = mk('img', 'logo'); logo.src = cfg.logo; logo.onerror = function () { this.style.display = 'none'; }; wrap.appendChild(logo); }
    var titulo = mk('div', 'titulo', esc(cfg.ttl || '')); wrap.appendChild(titulo);
    var hoje = mk('div', 'hoje', 'HOJE EM CAMPO'); wrap.appendChild(hoje);
    var linha = mk('div', 'linha'); wrap.appendChild(linha);
    var sub = mk('div', 'sub', esc(cfg.sub || '')); wrap.appendChild(sub);

    var vs = mk('div', 'vs');
    var bA = mk('div', 'bd'); bA.style.left = '96px'; bA.appendChild(crest(A)); vs.appendChild(bA);
    var bB = mk('div', 'bd'); bB.style.left = '1086px'; bB.appendChild(crest(B)); vs.appendChild(bB);
    vs.appendChild(mk('div', 'na', esc(A.short || A.name || '')));
    vs.appendChild(mk('div', 'nb', esc(B.short || B.name || '')));
    vs.appendChild(mk('div', 'vsx', 'VS'));
    var vinfo = [[cfg.vName, cfg.vCity].filter(Boolean).join(' · '), cfg.vTime, [cfg.vIcon, cfg.vW].filter(Boolean).join(' ')].filter(Boolean).join('   ·   ');
    vs.appendChild(mk('div', 'vsub', esc(vinfo || 'dados oficiais fcf.cat')));
    wrap.appendChild(vs);

    wrap.appendChild(mk('div', 'fcf', 'FCF · FEDERACIÓ CATALANA DE FUTBOL'));
    r.appendChild(wrap);

    return function (t) {
      var p1 = easeOut(seg(t, 0, .7));
      if (logo) { logo.style.opacity = p1; logo.style.transform = 'translateX(-50%) translateY(' + ((1 - p1) * -60) + 'px)'; }
      titulo.style.opacity = p1; titulo.style.transform = 'translateY(' + ((1 - p1) * -60) + 'px)';
      var sp = easeOut(seg(t, 1.05, .8)); hoje.style.opacity = sp;
      linha.style.width = (1190 * easeIO(seg(t, 1.2, .9))) + 'px';
      sub.style.opacity = easeOut(seg(t, .9, .7));
      var p2 = easeOut(seg(t, .45, .7)); vs.style.opacity = p2;
      wrap.querySelector('.fcf').style.opacity = p2;
    };
  }

  /* ==================== CENA: INTERVALO / ENCERRAMENTO ==================== */
  function buildFull(cfg, tituloTxt, rodapeTxt) {
    var r = getRoot(); r.innerHTML = '';
    var wrap = mk('div', 'th-scene th-full');
    var lista = times(), A = lista[cfg.a] || {}, B = lista[cfg.b] || {};
    var cs = cores(), cA = cs.a || '#22d3ee', cB = cs.b || '#f472b6';

    var titulo = mk('div', 'titulo', esc(tituloTxt)); wrap.appendChild(titulo);
    var painel = mk('div', 'painel');
    var bA = mk('div', 'bd'); bA.style.left = '110px'; bA.appendChild(crest(A)); painel.appendChild(bA);
    var bB = mk('div', 'bd'); bB.style.right = '110px'; bB.appendChild(crest(B)); painel.appendChild(bB);
    var ga = mk('div', 'ga', esc(cfg.golsA || '0')); ga.style.color = cA; painel.appendChild(ga);
    var gb = mk('div', 'gb', esc(cfg.golsB || '0')); gb.style.color = cB; painel.appendChild(gb);
    painel.appendChild(mk('div', 'sep', '-'));
    painel.appendChild(mk('div', 'na', esc(A.short || A.name || '')));
    painel.appendChild(mk('div', 'nb', esc(B.short || B.name || '')));
    wrap.appendChild(painel);

    var rodape = null;
    if (rodapeTxt) { rodape = mk('div', 'rodape', esc(rodapeTxt)); wrap.appendChild(rodape); }
    r.appendChild(wrap);

    return function (t) {
      var p = easeOut(seg(t, 0, .6));
      titulo.style.opacity = p; titulo.style.transform = 'translateY(' + ((1 - p) * -60) + 'px)';
      painel.style.opacity = easeOut(seg(t, .3, .7));
      if (rodape) rodape.style.opacity = easeOut(seg(t, .8, .7));
    };
  }

  /* ============================ DISPATCH ============================ */
  function render(cena, t, cfg, tema) {
    var r = getRoot(); if (!r) return;
    if (tema && tema !== temaAtual) { temaAtual = tema; r.setAttribute('data-tema', tema); cenaAtual = null; }
    var sg = signature(cfg);
    if (cena !== cenaAtual || sg !== sigAtual) {
      cenaAtual = cena; sigAtual = sg;
      if (cena === 'table') upd = buildTable(cfg);
      else if (cena === 'intro') upd = buildIntro(cfg);
      else if (cena === 'intervalo') upd = buildFull(cfg, 'INTERVALO', '');
      else if (cena === 'encerramento') upd = buildFull(cfg, 'FIM DE JOGO', 'OBRIGADO POR ASSISTIR');
      else { r.innerHTML = ''; upd = null; }
    }
    if (upd) upd(t);
  }

  function show() { var r = getRoot(); if (r) r.classList.add('ativa'); }
  function hide() { var r = getRoot(); if (r) r.classList.remove('ativa'); }
  function reset() { cenaAtual = null; sigAtual = null; upd = null; var r = getRoot(); if (r) r.innerHTML = ''; }

  return { CENAS: CENAS, render: render, show: show, hide: hide, reset: reset };
})();
