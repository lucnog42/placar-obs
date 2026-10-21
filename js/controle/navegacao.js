// js/controle/navegacao.js — shell do wizard (10 telas, drawer, modais, resumo, cores)
var Controle = window.Controle || {};

Controle.TELAS = [
  { n: 1, titulo: 'Instâncias' },
  { n: 2, titulo: 'Equipes' },
  { n: 3, titulo: 'Competição' },
  { n: 4, titulo: 'Tabela' },
  { n: 5, titulo: 'Tema' },
  { n: 6, titulo: 'Patrocinadores' },
  { n: 7, titulo: 'Repertório' },
  { n: 8, titulo: 'Resumo & Salvar' },
  { n: 9, titulo: 'Operar ao vivo' }
];
Controle.NUM_TELAS = Controle.TELAS.length;
Controle.telaAtual = 1;
Controle._instanciaNome = null;

/* ---------- navegação ---------- */
Controle._bloquearSemInstancia = function () { Controle.abrirModal('modalSemInstancia'); };
Controle.mostrarTela = function (n) {
  if (n > 1) {
    var id = (typeof INSTANCIA !== 'undefined') ? INSTANCIA : '';
    if (!id) {
      Controle._bloquearSemInstancia();
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
  if (n === 8) Controle.gerarResumo();
  window.scrollTo(0, 0);
};

Controle.irPara = function (n) { Controle.mostrarTela(n); };
Controle.avancar = function () {
  if (Controle.telaAtual === 1) {
    var id = (typeof INSTANCIA !== 'undefined') ? INSTANCIA : '';
    if (!id) {
      Controle._bloquearSemInstancia();
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

/* abre repertório (mídias) e editor de cenas como pop-ups */
Controle.abrirRepertorio = function () { Controle.renderMidias(); Controle.abrirModal('modalRepertorio'); };
Controle.abrirCenas = function () { Controle.renderCenas(); Controle.abrirModal('modalCenas'); };

/* ---------- notificação rápida (abre o pop-up time→jogador) ---------- */
Controle.notifRapida = function (tipo) {
  Controle._notifTipo = tipo;
  Controle._notifTime = null; Controle._notifJogador = null;
  var ti = document.getElementById('notifTitulo');
  if (ti) ti.textContent = '🔔 ' + (Controle.NOTIF_ROTULO && Controle.NOTIF_ROTULO[tipo] ? Controle.NOTIF_ROTULO[tipo] : 'Notificação');
  Controle.toggleTipoNotif();
  if (Controle.renderTimesNotif) Controle.renderTimesNotif();
  if (tipo === 'substituicao' && Controle.renderJogadores) Controle.renderJogadores();
  Controle.abrirModal('modalNotificacao');
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
        var nm = String(nome).replace(/'/g, "\\'");
        h += '<div class="escudo-item" data-item="' + nome + '">';
        h += '<input type="checkbox" class="cb-lib" data-tipo="logos" data-item="' + nome + '" style="flex-shrink:0">';
        h += '<img src="' + url + '" onerror="this.style.opacity=0.2" alt="">';
        h += '<span class="escudo-nome">' + nome + '</span>';
        h += '<button style="background:#2196F3;color:#fff" onclick="Controle.usarLogo(\'' + nome + '\')">Usar</button>';
        h += '<button class="btn-remover" onclick="Controle.removerLogo(\'' + nm + '\')">✕</button>';
        h += '</div>';
      }
      el.innerHTML = h;
      if (Controle._aplicarFiltros) Controle._aplicarFiltros('logos');
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

Controle.baixarModeloCsvJogadores = function () {
  var header = 'jogador;numero;posicao';
  var exemplo = 'João Silva;10;Atacante\nPedro Santos;1;Goleiro\nLucas Alves;7;Meia\nCarlos Lima;9;Atacante\nMarcos Rocha;5;Zagueiro';
  var csv = '\ufeff' + header + '\n' + exemplo + '\n';
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'modelo_jogadores.csv';
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
        var nm = String(nome).replace(/'/g, "\\'");
        h += '<div class="cor-item" data-item="' + nome + '">';
        h += '<input type="checkbox" class="cb-lib" data-tipo="cores" data-item="' + nome + '" style="flex-shrink:0">';
        h += '<span class="swatch" style="background:' + hex + '"></span>';
        h += '<span class="cor-nome">' + nome + '</span>';
        h += '<button class="A" onclick="Controle.aplicarCor(\'timeA\',\'' + hex + '\')">Casa</button>';
        h += '<button class="B" onclick="Controle.aplicarCor(\'timeB\',\'' + hex + '\')">Visit.</button>';
        h += '<button class="btn-remover" onclick="Controle.removerCor(\'' + nm + '\')">✕</button>';
        h += '</div>';
      }
      el.innerHTML = h;
      if (Controle._aplicarFiltros) Controle._aplicarFiltros('cores');
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

/* ---------- bibliotecas: pesquisa + grupos ---------- */
Controle._gruposCache = {};
Controle._grupoFiltro = {};
Controle._bibliotecaIds = {
  escudos: { lista: 'listaEscudos', busca: 'buscaEscudos' },
  logos:   { lista: 'listaLogos',   busca: 'buscaLogos' },
  cores:   { lista: 'listaCores',   busca: 'buscaCores' },
  csvs_tabela:    { lista: 'listaCsvsTabela',    busca: 'buscaCsvsTabela' },
  csvs_jogadores: { lista: 'listaCsvsJogadores', busca: 'buscaCsvsJogadores' }
};

/* aplica filtro de busca + grupo juntos sobre os itens já renderizados */
Controle._aplicarFiltros = function (tipo) {
  var ids = Controle._bibliotecaIds[tipo]; if (!ids) return;
  var lista = document.getElementById(ids.lista); if (!lista) return;
  var q = (document.getElementById(ids.busca) || {}).value || ''; q = q.trim().toLowerCase();
  var nome = Controle._grupoFiltro[tipo] || '';
  var g = Controle._gruposCache[tipo] || {};
  var items = lista.children;
  for (var i = 0; i < items.length; i++) {
    var el = items[i];
    var t = (el.textContent || '').toLowerCase();
    var okBusca = (!q || t.indexOf(q) >= 0);
    var key = el.getAttribute('data-item') || '';
    var okGrupo = (!nome || (g[nome] && g[nome].indexOf(key) >= 0));
    el.style.display = (okBusca && okGrupo) ? '' : 'none';
  }
};

Controle.carregarGrupos = function (tipo, cb) {
  fetch(API + API_AND + 'acao=listar_grupos&tipo=' + encodeURIComponent(tipo))
    .then(function (r) { return r.json(); })
    .then(function (d) {
      Controle._gruposCache[tipo] = (d && d.grupos) || {};
      Controle.renderGruposBar(tipo);
      Controle._aplicarFiltros(tipo);
      if (cb) cb();
    }).catch(function () {});
};

Controle.renderGruposBar = function (tipo) {
  var el = document.getElementById('gruposBar-' + tipo); if (!el) return;
  var g = Controle._gruposCache[tipo] || {};
  var nomes = Object.keys(g).sort();
  var ativo = Controle._grupoFiltro[tipo] || '';
  var h = '<button class="grupo-chip' + (ativo === '' ? ' on' : '') + '" onclick="Controle.setGrupoFiltro(\'' + tipo + '\',\'\')">Todos</button>';
  for (var i = 0; i < nomes.length; i++) {
    var n = nomes[i];
    h += '<button class="grupo-chip' + (ativo === n ? ' on' : '') + '" onclick="Controle.setGrupoFiltro(\'' + tipo + '\',\'' + String(n).replace(/'/g, "\\'") + '\')">' + n + ' (' + (g[n] || []).length + ')</button>';
  }
  h += '<button class="grupo-chip grupo-add" onclick="Controle.novoGrupo(\'' + tipo + '\')" title="Novo grupo">＋</button>';
  if (ativo !== '') {
    h += '<button class="grupo-chip grupo-dsg" onclick="Controle.desagruparSelecionados(\'' + tipo + '\')" title="Remove os itens marcados do grupo filtrado">⇄ Desagrupar</button>';
  }
  el.innerHTML = h;
};

Controle.setGrupoFiltro = function (tipo, nome) {
  Controle._grupoFiltro[tipo] = nome || '';
  Controle.renderGruposBar(tipo);
  Controle._aplicarFiltros(tipo);
};

Controle.novoGrupo = function (tipo) {
  var nome = prompt('Nome do grupo:');
  if (!nome || !nome.trim()) return;
  fetch(API + API_AND + 'acao=salvar_grupo', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo: tipo, nome: nome.trim() })
  }).then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.erro) alert(d.erro); Controle.carregarGrupos(tipo); })
    .catch(function () {});
};

Controle.removerGrupo = function (tipo, nome) {
  if (!confirm('Remover o grupo "' + nome + '"? (os itens não são apagados)')) return;
  fetch(API + API_AND + 'acao=remover_grupo', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo: tipo, nome: nome })
  }).then(function (r) { return r.json(); })
    .then(function () { Controle.carregarGrupos(tipo); })
    .catch(function () {});
};

Controle.agruparItem = function (tipo, item) {
  var g = Controle._gruposCache[tipo] || {};
  var nomes = Object.keys(g).sort();
  var msg = 'Grupo para "' + item + '":\n';
  if (nomes.length) msg += 'Existentes: ' + nomes.join(', ') + '\n';
  msg += '\nDigite o nome (novo ou existente).';
  var nome = prompt(msg);
  if (!nome || !nome.trim()) return;
  fetch(API + API_AND + 'acao=agrupar_item', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo: tipo, grupo: nome.trim(), item: item })
  }).then(function (r) { return r.json(); })
    .then(function () { Controle.carregarGrupos(tipo); })
    .catch(function () {});
};

Controle.desagruparItem = function (tipo, item) {
  fetch(API + API_AND + 'acao=desagrupar_item', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo: tipo, item: item })
  }).then(function (r) { return r.json(); })
    .then(function () { Controle.carregarGrupos(tipo); })
    .catch(function () {});
};

/* ---------- agrupamento por checkbox (um botão por biblioteca) ---------- */
Controle.toggleTodosLib = function (tipo) {
  var on = document.getElementById('selTodos-' + tipo); if (!on) return;
  document.querySelectorAll('.cb-lib[data-tipo="' + tipo + '"]').forEach(function (cb) { cb.checked = on.checked; });
};
Controle.itensMarcadosLib = function (tipo) {
  var out = [];
  document.querySelectorAll('.cb-lib[data-tipo="' + tipo + '"]:checked').forEach(function (cb) { out.push(cb.getAttribute('data-item')); });
  return out;
};
Controle.agruparSelecionados = function (tipo) {
  var itens = Controle.itensMarcadosLib(tipo);
  if (!itens.length) { alert('Marque os itens para agrupar.'); return; }
  var g = Controle._gruposCache[tipo] || {};
  var nomes = Object.keys(g).sort();
  var msg = 'Agrupar ' + itens.length + ' item(ns):\n';
  if (nomes.length) msg += 'Existentes: ' + nomes.join(', ') + '\n';
  msg += '\nDigite o nome do grupo (novo ou existente).';
  var nome = prompt(msg);
  if (!nome || !nome.trim()) return;
  var pend = itens.length;
  itens.forEach(function (item) {
    fetch(API + API_AND + 'acao=agrupar_item', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: tipo, grupo: nome.trim(), item: item })
    }).then(function (r) { return r.json(); }).then(function () { if (--pend === 0) Controle.carregarGrupos(tipo); }).catch(function () { if (--pend === 0) Controle.carregarGrupos(tipo); });
  });
};
Controle.desagruparSelecionados = function (tipo) {
  var itens = Controle.itensMarcadosLib(tipo);
  if (!itens.length) { alert('Marque os itens para desagrupar.'); return; }
  if (!confirm('Desagrupar ' + itens.length + ' item(ns)?')) return;
  var pend = itens.length;
  itens.forEach(function (item) {
    fetch(API + API_AND + 'acao=desagrupar_item', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: tipo, item: item })
    }).then(function (r) { return r.json(); }).then(function () { if (--pend === 0) Controle.carregarGrupos(tipo); }).catch(function () { if (--pend === 0) Controle.carregarGrupos(tipo); });
  });
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
  var cenas = document.getElementById('poptabelaCenaCount');
  h += Controle._linha('Cenas', cenas ? cenas.textContent : '—');
  h += Controle._linha('Tema do overlay', Controle._v('tabelaTema'));
  h += Controle._linha('Patrocinadores', Controle._v('spText') || 'PATROCINADORES');
  el.innerHTML = h;
};

/* ---------- init ---------- */
Controle.mostrarTela(1);
Controle.atualizarInstanciaAtiva();
setTimeout(function () { Controle._resolverInstanciaNome(); }, 700);
