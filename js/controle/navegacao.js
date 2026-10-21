// js/controle/navegacao.js — shell do wizard (10 telas, drawer, modais, resumo, cores)
var Controle = window.Controle || {};

Controle.TELAS = [
  { n: 1, titulo: 'Instâncias' },
  { n: 2, titulo: 'Equipes' },
  { n: 3, titulo: 'Competição' },
  { n: 4, titulo: 'Tabela' },
  { n: 5, titulo: 'Cenas' },
  { n: 6, titulo: 'Tema' },
  { n: 7, titulo: 'Patrocinadores' },
  { n: 8, titulo: 'Repertório' },
  { n: 9, titulo: 'Resumo & Salvar' },
  { n: 10, titulo: 'Operar ao vivo' }
];
Controle.NUM_TELAS = Controle.TELAS.length;
Controle.telaAtual = 1;
Controle._instanciaNome = null;

/* ---------- navegação ---------- */
Controle.mostrarTela = function (n) {
  if (n > 1) {
    var id = (typeof INSTANCIA !== 'undefined') ? INSTANCIA : '';
    if (!id) {
      Controle.status('erro', '⚠ Selecione (ou crie) uma instância para continuar.');
      return;
    }
  }
  Controle.telaAtual = n;
  var telas = document.querySelectorAll('.tela');
  for (var i = 0; i < telas.length; i++) {
    telas[i].classList.toggle('ativa', telas[i].id === 'tela-' + n);
  }
  var btnVoltar = document.getElementById('btnVoltar');
  var btnAvancar = document.getElementById('btnAvancar');
  if (btnVoltar) btnVoltar.style.visibility = (n === 1) ? 'hidden' : 'visible';
  if (btnAvancar) btnAvancar.textContent = (n >= Controle.NUM_TELAS) ? '✓ Ao vivo' : 'Avançar →';
  var lbl = document.getElementById('stepperLabel');
  if (lbl) lbl.textContent = 'Etapa ' + n + ' de ' + Controle.NUM_TELAS;
  var items = document.querySelectorAll('.drawer-item');
  for (var j = 0; j < items.length; j++) items[j].classList.remove('ativo');
  if (items[n - 1]) items[n - 1].classList.add('ativo');
  Controle.fecharMenu();
  if (n === 9) Controle.gerarResumo();
  window.scrollTo(0, 0);
};

Controle.irPara = function (n) { Controle.mostrarTela(n); };
Controle.avancar = function () {
  if (Controle.telaAtual === 1) {
    var id = (typeof INSTANCIA !== 'undefined') ? INSTANCIA : '';
    if (!id) {
      Controle.status('erro', '⚠ Selecione (ou crie) uma instância para continuar.');
      return;
    }
  }
  if (Controle.telaAtual < Controle.NUM_TELAS) Controle.mostrarTela(Controle.telaAtual + 1);
};
Controle.voltar = function () { if (Controle.telaAtual > 1) Controle.mostrarTela(Controle.telaAtual - 1); };

/* ---------- drawer ---------- */
Controle.abrirMenu = function () {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
};
Controle.fecharMenu = function () {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
};

/* ---------- modais ---------- */
Controle.abrirModal = function (id) { document.getElementById(id).classList.add('open'); };
Controle.fecharModal = function (id) { document.getElementById(id).classList.remove('open'); };

/* ---------- notificação rápida (Tela 10) ---------- */
Controle.notifRapida = function (tipo) {
  var radios = document.getElementsByName('tipoNotif');
  for (var i = 0; i < radios.length; i++) { if (radios[i].value === tipo) radios[i].checked = true; }
  Controle.enviarNotificacao(true);
};

/* ---------- popup de categorias do overlay (Tela 10) ---------- */
Controle.toggleOverlayPop = function () {
  var el = document.getElementById('overlayPop');
  if (el) el.classList.toggle('aberto');
};

/* ---------- biblioteca de logos (torneios) ---------- */
Controle.listarLogos = function () {
  fetch(API + API_AND + 'acao=listar_logos')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var el = document.getElementById('listaLogos');
      if (!el) return;
      var lista = (d && d.logos) || [];
      if (!lista.length) { el.innerHTML = '<span style="color:#888;font-size:11px">Nenhum logo salvo. Suba o primeiro acima.</span>'; return; }
      var ts = Date.now();
      var h = '';
      for (var i = 0; i < lista.length; i++) {
        var nome = lista[i];
        var url = 'torneios/' + nome + '?v=' + ts;
        h += '<div class="escudo-item">';
        h += '<img src="' + url + '" onerror="this.style.opacity=0.2" alt="">';
        h += '<span class="escudo-nome">' + nome + '</span>';
        h += '<button style="background:#2196F3;color:#fff" onclick="Controle.usarLogo(\'' + nome + '\')">Usar</button>';
        h += '<button class="btn-remover" onclick="Controle.removerLogo(\'' + String(nome).replace(/'/g, "\\'") + '\')">✕</button>';
        h += '</div>';
      }
      el.innerHTML = h;
    }).catch(function () {});
};
Controle.usarLogo = function (nome) { Controle.setEstado({ logoTorneio: nome }); };
Controle.removerLogo = function (nome) {
  fetch(API + API_AND + 'acao=remover_logo', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: nome })
  })
  .then(function (r) { return r.json(); })
  .then(function () { Controle.listarLogos(); if (Controle.recarregarLogos) Controle.recarregarLogos(); });
};

/* ---------- modelo CSV (download) ---------- */
Controle.baixarModeloCsv = function () {
  var header = 'Pos;Equip;Punts;J;G;E;P;GF;GC;DG;Ultims;Sancio;PosSite;Escut';
  var exemplo = '1;EXEMPLO FC;0;0;0;0;0;0;0;0;0;E;0;1;';
  var csv = '\ufeff' + header + '\n' + exemplo + '\n';
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'modelo_classificacao.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 300);
};

/* ---------- instância ativa (topbar + drawer) ---------- */
Controle.atualizarInstanciaAtiva = function () {
  var id = (typeof INSTANCIA !== 'undefined') ? INSTANCIA : '';
  var nome = Controle._instanciaNome || (id || 'padrão');
  var txt = id ? (nome + ' (' + id + ')') : nome;
  var elTop = document.getElementById('topInstancia');
  var elDraw = document.getElementById('drawerInstancia');
  if (elTop) elTop.textContent = 'instância: ' + txt;
  if (elDraw) elDraw.textContent = 'instância: ' + txt;
};
Controle._resolverInstanciaNome = function () {
  fetch(API + API_AND + 'acao=listar_instancias')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var id = (typeof INSTANCIA !== 'undefined') ? INSTANCIA : '';
      var lista = (d && d.instancias) || [];
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].id === id) { Controle._instanciaNome = lista[i].nome || id; break; }
      }
      Controle.atualizarInstanciaAtiva();
    }).catch(function () {});
};

/* ---------- biblioteca de cores ---------- */
Controle.listarCores = function () {
  fetch(API + API_AND + 'acao=listar_cores')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var el = document.getElementById('listaCores');
      if (!el) return;
      var lista = (d && d.cores) || [];
      if (!lista.length) { el.innerHTML = '<span style="color:#888;font-size:11px">Nenhuma cor salva. Adicione a primeira.</span>'; return; }
      var h = '';
      for (var i = 0; i < lista.length; i++) {
        var c = lista[i];
        var hex = c.hex || '#888';
        var nome = c.nome || hex;
        h += '<div class="cor-item">';
        h += '<span class="swatch" style="background:' + hex + '"></span>';
        h += '<span class="cor-nome">' + nome + '</span>';
        h += '<button class="A" onclick="Controle.aplicarCor(\'timeA\',\'' + hex + '\')">Casa</button>';
        h += '<button class="B" onclick="Controle.aplicarCor(\'timeB\',\'' + hex + '\')">Visit.</button>';
        h += '<button class="btn-remover" onclick="Controle.removerCor(\'' + String(nome).replace(/'/g, "\\'") + '\')">✕</button>';
        h += '</div>';
      }
      el.innerHTML = h;
    }).catch(function () {});
};
Controle.adicionarCor = function () {
  var inp = document.createElement('input');
  inp.type = 'color';
  inp.onchange = function () {
    var hex = inp.value;
    var nome = prompt('Nome da cor (ex.: Vermelho Time A):', hex);
    if (!nome) { inp.remove(); return; }
    fetch(API + API_AND + 'acao=salvar_cor', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome, hex: hex })
    })
    .then(function (r) { return r.json(); })
    .then(function () { inp.remove(); Controle.listarCores(); })
    .catch(function () { inp.remove(); });
    inp.remove();
  };
  document.body.appendChild(inp);
  inp.click();
};
Controle.aplicarCor = function (time, hex) { var d = {}; d[time + 'Cor'] = hex; Controle.setEstado(d); };
Controle.removerCor = function (nome) {
  fetch(API + API_AND + 'acao=remover_cor', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: nome })
  })
  .then(function (r) { return r.json(); })
  .then(function () { Controle.listarCores(); });
};

/* ---------- resumo (Tela 9) ---------- */
Controle._v = function (id) { var e = document.getElementById(id); return e ? (e.value || '').toString().trim() : ''; };
Controle._linha = function (k, v) {
  return '<div class="linha"><b>' + k + '</b><span>' + (v || '—') + '</span></div>';
};
Controle.gerarResumo = function () {
  var el = document.getElementById('resumoConteudo');
  if (!el) return;
  var id = (typeof INSTANCIA !== 'undefined') ? INSTANCIA : '';
  var nome = Controle._instanciaNome || (id || 'padrão');
  var cA = Controle._v('timeA') || 'Casa';
  var cB = Controle._v('timeB') || 'Visitante';
  var h = '';
  h += Controle._linha('Instância', id ? (nome + ' (' + id + ')') : nome);
  h += Controle._linha('Equipes', cA + ' × ' + cB);
  h += Controle._linha('Competição', Controle._v('competicao'));
  h += Controle._linha('Categoria / Grupo / Fase',
    (Controle._v('categoria') || '—') + ' / ' + (Controle._v('grupo') || '—') + ' / ' + (Controle._v('fase') || '—'));
  h += Controle._linha('Data / Hora', (Controle._v('data') || '—') + ' · ' + (Controle._v('hora') || '—'));
  h += Controle._linha('Clima', Controle._v('clima') ? (Controle._v('clima') + ' °C') : '');
  h += Controle._linha('Local', Controle._v('local'));
  var cenas = document.getElementById('tabelaCenaCount');
  h += Controle._linha('Cenas', cenas ? cenas.textContent : '—');
  h += Controle._linha('Tema do overlay', Controle._v('tabelaTema'));
  h += Controle._linha('Patrocinadores', Controle._v('spText') || 'PATROCINADORES');
  el.innerHTML = h;
};

/* ---------- init ---------- */
Controle.mostrarTela(1);
Controle.atualizarInstanciaAtiva();
setTimeout(function () { Controle._resolverInstanciaNome(); }, 700);
