// js/controle/navegacao.js — shell do wizard (10 telas, stepper, drawer, modais, resumo)
var Controle = window.Controle || {};

Controle.TELAS = [
  { n: 1, titulo: 'Instâncias' },
  { n: 2, titulo: 'Equipes' },
  { n: 3, titulo: 'Competição' },
  { n: 4, titulo: 'Patrocinadores' },
  { n: 5, titulo: 'Tabela' },
  { n: 6, titulo: 'Cenas' },
  { n: 7, titulo: 'Tema' },
  { n: 8, titulo: 'Repertório' },
  { n: 9, titulo: 'Resumo & Salvar' },
  { n: 10, titulo: 'Operar ao vivo' }
];
Controle.NUM_TELAS = Controle.TELAS.length;
Controle.telaAtual = 1;
Controle._instanciaNome = null;

/* ---------- stepper ---------- */
Controle.renderStepper = function () {
  var el = document.getElementById('stepper');
  if (!el) return;
  var h = '';
  for (var i = 0; i < Controle.TELAS.length; i++) {
    var cls = 'step';
    if (i + 1 === Controle.telaAtual) cls += ' ativo';
    else if (i + 1 < Controle.telaAtual) cls += ' feito';
    h += '<span class="' + cls + '" onclick="Controle.irPara(' + (i + 1) + ')" title="' + (i + 1) + ' · ' + Controle.TELAS[i].titulo + '">' + (i + 1) + '</span>';
  }
  el.innerHTML = h;
};

/* ---------- navegação ---------- */
Controle.mostrarTela = function (n) {
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
  Controle.renderStepper();
  Controle.fecharMenu();
  if (n === 9) Controle.gerarResumo();
  window.scrollTo(0, 0);
};

Controle.irPara = function (n) { Controle.mostrarTela(n); };
Controle.avancar = function () { if (Controle.telaAtual < Controle.NUM_TELAS) Controle.mostrarTela(Controle.telaAtual + 1); };
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
  h += Controle._linha('Clima', Controle._v('clima'));
  h += Controle._linha('Local', Controle._v('local'));
  var cenas = document.getElementById('tabelaCenaCount');
  h += Controle._linha('Cenas', cenas ? cenas.textContent : '—');
  h += Controle._linha('Tema do overlay', Controle._v('tabelaTema'));
  h += Controle._linha('Patrocinadores', Controle._v('spText') || 'PATROCINADORES');
  el.innerHTML = h;
};

/* ---------- init ---------- */
Controle.renderStepper();
Controle.mostrarTela(1);
Controle.atualizarInstanciaAtiva();
setTimeout(function () { Controle._resolverInstanciaNome(); }, 700);
