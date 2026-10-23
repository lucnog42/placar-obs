/* ====== DEBUG ====== */
Controle.debugContador = 0;
Controle.debugContadorAtivo = true;
Controle.debugLogLines = [];
Controle.debugPingMs = 0;

Controle.togglePreview = function() {
  var w = document.getElementById('previewWrapper');
  w.classList.toggle('preview-off');
  var btn = w.querySelector('#previewBar button');
  if (w.classList.contains('preview-off')) {
    btn.textContent = 'Mostrar';
    document.getElementById('previewFrame').src = '';
  } else {
    btn.textContent = 'Esconder';
    document.getElementById('previewFrame').src = Controle.placarUrl();
    setTimeout(function(){ Controle.resizePreview(); }, 300);
  }
};

Controle.resizePreview = function() {
  var c = document.getElementById('previewContainer');
  var f = document.getElementById('previewFrame');
  if (!c || !f) return;
  var wrapper = document.getElementById('previewWrapper');
  var bar = document.getElementById('previewBar');
  var zoom = Controle._zoom || 1;
  var deitado = !!(window.matchMedia && window.matchMedia('(min-width:1100px)').matches);
  var largura = Math.max(160, (wrapper ? wrapper.clientWidth : c.parentElement.clientWidth) - 2);
  var altura = 0;
  if (deitado) {
    var caixa = (wrapper ? wrapper.clientHeight : 0) - (bar ? (bar.offsetHeight || 30) : 30) - 6;
    if (caixa < 120) caixa = ((window.innerHeight || 800) - 60) * 0.5;
    altura = Math.max(160, caixa);
  }
  var w = largura, h = w * 9 / 16;
  if (altura && h > altura) { h = altura; w = h * 16 / 9; }
  w = Math.max(160, Math.floor(w * zoom));
  h = Math.round(w * 9 / 16);
  c.style.width = w + 'px';
  c.style.height = h + 'px';
  var scale = w / 1920;
  f.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
};
window.addEventListener('resize', Controle.resizePreview);

Controle.toggleDebugContador = function() {
  Controle.debugContadorAtivo = document.getElementById('debugContadorToggle').checked;
  var s = document.getElementById('debugContadorStatus');
  s.textContent = Controle.debugContadorAtivo ? 'LIGADO' : 'DESLIGADO';
  s.style.color = Controle.debugContadorAtivo ? '#4CAF50' : '#888';
};
Controle.zerarDebugContador = function() {
  Controle.debugContador = 0;
  document.getElementById('debugContador').textContent = '0';
};
Controle.limparDebugLog = function() {
  Controle.debugLogLines = [];
  document.getElementById('debugLog').textContent = 'Nenhum poll ainda...';
  document.getElementById('debugLogCount').textContent = '0 registros';
};
Controle.addDebugLog = function(entry) {
  Controle.debugLogLines.unshift(entry);
  if (Controle.debugLogLines.length > 5) Controle.debugLogLines.pop();
  document.getElementById('debugLog').textContent = Controle.debugLogLines.join('\n');
  document.getElementById('debugLogCount').textContent = Controle.debugLogLines.length + ' registros';
};
Controle.updateDebugPing = function(ms) {
  Controle.debugPingMs = ms;
  var el = document.getElementById('debugPing');
  var st = document.getElementById('debugPingStatus');
  el.textContent = ms + ' ms';
  el.className = 'debug-ping ' + (ms < 50 ? 'fast' : ms < 200 ? 'medium' : 'slow');
  st.textContent = ms < 50 ? 'Rapido' : ms < 200 ? 'Normal' : 'Lento';
  st.style.color = ms < 50 ? '#4CAF50' : ms < 200 ? '#ff9800' : '#f44336';
};
Controle.incrementarDebugContador = function() {
  if (Controle.debugContadorAtivo) {
    Controle.debugContador++;
    document.getElementById('debugContador').textContent = Controle.debugContador;
  }
};
Controle.toggleDebugStatus = function() {
  var on = document.getElementById('debugStatusToggle').checked;
  var label = document.getElementById('debugStatusLabel');
  if (on) {
    Controle.setEstado({mostrarStatus: 'true'});
    label.textContent = 'VISIVEL';
    label.style.color = '#4CAF50';
  } else {
    Controle.setEstado({mostrarStatus: 'false'});
    label.textContent = 'OCULTO';
    label.style.color = '#888';
  }
};
Controle.forcarEstado = function() {
  var raw = document.getElementById('debugJsonInput').value.trim();
  if (!raw) { alert('JSON vazio!'); return; }
  try {
    var obj = JSON.parse(raw);
    Controle.setEstado(obj);
    Controle.incrementarDebugContador();
  } catch(e) {
    alert('JSON invalido: ' + e.message);
  }
};

/* ====== SUB-CONTROLES (multi-instancia) ====== */
Controle._instanciaExcluir = null;

Controle.listarInstancias = function() {
  fetch(API+API_AND+'acao=listar_instancias')
  .then(function(r){ return r.json(); })
  .then(function(d){
    var el = document.getElementById('listaInstancias');
    var aviso = document.getElementById('instanciaAviso');
    if(!el) return;
    var lista = (d && d.instancias) || [];
    var ativa = (typeof INSTANCIA !== 'undefined') ? INSTANCIA : '';
    if(aviso){
      if(ativa){ aviso.innerHTML = '✓ Instância ativa: <b style="color:#4ade80">' + ativa + '</b>'; aviso.style.color = '#4ade80'; }
      else { aviso.innerHTML = '⚠ Nenhuma instância selecionada — escolha (ou crie) uma para continuar.'; aviso.style.color = '#f59e0b'; }
    }
    if(!lista.length){ el.innerHTML = '<span style="color:#888;font-size:11px">Nenhum sub-controle. Crie o primeiro acima.</span>'; return; }
    var h = '';
    for(var i=0;i<lista.length;i++){
      var it = lista[i];
      var url = 'placar.php?i=' + encodeURIComponent(it.id);
      var estaAtiva = (it.id === ativa);
      h += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px;border:1px solid ' + (estaAtiva ? '#4ade80' : '#333') + ';border-radius:6px;background:' + (estaAtiva ? '#0f1f18' : '#0b1420') + '">'
        + '<span style="font-weight:bold;color:#fff;min-width:110px">' + (it.nome || it.id) + '</span>'
        + '<code style="color:#9cf;font-size:11px">' + it.id + '</code>'
        + (estaAtiva
            ? '<span style="color:#4ade80;font-size:11px;font-weight:bold">✓ ativa</span>'
            : '<button onclick="location.href=\'controle.php?i=' + encodeURIComponent(it.id) + '\'" style="padding:4px 8px;border-radius:4px;border:none;background:#4CAF50;color:#fff;cursor:pointer">▶ Usar</button>')
        + '<button onclick="window.open(\'' + url + '\',\'_blank\')" style="padding:4px 8px;border-radius:4px;border:none;background:#2196F3;color:#fff;cursor:pointer">📺 OBS</button>'
        + '<button onclick="Controle.abrirEditarInstancia(\'' + it.id + '\',\'' + (it.nome || '').replace(/'/g,"\\'") + '\')" style="padding:4px 8px;border-radius:4px;border:none;background:#f59e0b;color:#fff;cursor:pointer">✏️</button>'
        + '<button onclick="Controle.pedirExcluirInstancia(\'' + it.id + '\')" style="padding:4px 8px;border-radius:4px;border:none;background:#f44336;color:#fff;cursor:pointer">✕</button>'
        + '</div>';
    }
    el.innerHTML = h;
  })
  .catch(function(e){ Controle.status('erro','❌ listar instancias: ' + e.message); });
};

Controle.abrirCriarInstancia = function() {
  document.getElementById('modalInstanciaTitulo').textContent = '➕ Criar Instância';
  var idEl = document.getElementById('subctrlId');
  idEl.disabled = false;
  idEl.value = '';
  document.getElementById('subctrlNome').value = '';
  Controle.abrirModal('modalInstancia');
};

Controle.salvarInstanciaModal = function() {
  var idEl = document.getElementById('subctrlId');
  var id = idEl.value.trim();
  var nome = document.getElementById('subctrlNome').value.trim();
  var editando = idEl.disabled;
  if(!id){ alert('Informe o id (ex.: equipeA)'); return; }
  if(editando) {
    fetch(API+API_AND+'acao=renomear_instancia', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id:id, nome:nome })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
      idEl.disabled = false;
      Controle.fecharModal('modalInstancia');
      Controle.listarInstancias();
      Controle.status('ok', '✅ Instância "' + id + '" atualizada');
    })
    .catch(function(e){ Controle.status('erro','❌ ' + e.message); });
    return;
  }
  fetch(API+API_AND+'acao=criar_instancia', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ id:id, nome:nome })
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    if(d && d.erro){ alert('Erro: ' + d.erro); return; }
    idEl.value = '';
    document.getElementById('subctrlNome').value = '';
    Controle.fecharModal('modalInstancia');
    Controle.status('ok', '✅ Sub-controle "' + id + '" criado — abrindo…');
    // já seleciona a instância nova (recarrega o painel apontando para ela)
    location.href = 'controle.php?i=' + encodeURIComponent(id);
  })
  .catch(function(e){ Controle.status('erro','❌ ' + e.message); });
};

Controle.abrirEditarInstancia = function(id, nome) {
  document.getElementById('modalInstanciaTitulo').textContent = '✏️ Editar "' + id + '"';
  document.getElementById('subctrlId').value = id;
  document.getElementById('subctrlId').disabled = true;
  document.getElementById('subctrlNome').value = nome || '';
  Controle.abrirModal('modalInstancia');
};

Controle.pedirExcluirInstancia = function(id) {
  Controle._instanciaExcluir = id;
  document.getElementById('excluirNome').textContent = id;
  Controle.abrirModal('modalExcluir');
};

Controle.confirmarExcluirInstancia = function() {
  if(!Controle._instanciaExcluir) return;
  Controle.removerInstancia(Controle._instanciaExcluir);
  Controle._instanciaExcluir = null;
  Controle.fecharModal('modalExcluir');
};

Controle.removerInstancia = function(id) {
  fetch(API+API_AND+'acao=remover_instancia', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ id:id })
  })
  .then(function(r){ return r.json(); })
  .then(function(){ Controle.listarInstancias(); Controle.status('ok','Sub-controle removido'); })
  .catch(function(e){ Controle.status('erro','❌ ' + e.message); });
};

Controle.definirSpText = function(v) {
  Controle.setEstado({ spText: v });
};

Controle._sponsorsN = 3;
Controle.renderSponsors = function() {
  var el = document.getElementById('sponsorSlots');
  if(!el) return;
  var e = Controle.estado || {};
  var max = 0;
  for(var k in e){ var m = /^sp(\d+)$/.exec(k); if(m){ var n = parseInt(m[1],10); if(n > max) max = n; } }
  var N = Math.max(3, max, Controle._sponsorsN || 3);
  Controle._sponsorsN = N;
  var nomes = Controle.getSpNomes();
  var esc = function(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); };
  var h = '';
  for(var i = 1; i <= N; i++){
    var nome = e['sp'+i] || '';
    var img = nome ? ('<img src="'+DADOS+'torneios/'+nome+'" style="max-width:76px;max-height:76px;object-fit:contain" onerror="this.style.display=\'none\'">') : ('logo '+i);
    h += '<div style="text-align:center;width:104px">';
    h += '<div id="spPrev'+i+'" style="width:80px;height:80px;margin:0 auto;border:1px dashed #2a3a55;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#5b6f88">'+img+'</div>';
    h += '<div style="margin-top:4px;display:flex;gap:4px;justify-content:center">';
    h += '<button onclick="Controle.uploadSponsor('+i+')" style="font-size:10px;padding:2px 6px">Subir</button>';
    h += '<button onclick="Controle.removerPatrocinador('+i+')" style="font-size:10px;padding:2px 6px;color:#f87171" title="Remover logo">✕</button>';
    h += '</div>';
    // nome exibido no overlay (campo de texto por patrocinador)
    h += '<input type="text" id="spNome'+i+'" value="'+esc(nomes[i]||'')+'" placeholder="nome exibido" maxlength="60" style="width:100%;box-sizing:border-box;margin-top:4px;font-size:10px;padding:2px 4px" title="Nome que aparece na faixa, embaixo do logo" onchange="Controle.salvarNomePatrocinador('+i+', this.value)">';
    h += '</div>';
  }
  el.innerHTML = h;
};
/* nomes exibidos na faixa (por indice do slot) */
Controle.getSpNomes = function() {
  try { var o = JSON.parse((Controle.estado || {}).spNomes || '{}'); return (o && typeof o === 'object') ? o : {}; }
  catch(e){ return {}; }
};
Controle.salvarNomePatrocinador = function(n, valor) {
  var nomes = Controle.getSpNomes();
  var v = String(valor == null ? '' : valor).trim();
  if(v) nomes[n] = v; else delete nomes[n];
  Controle.setEstado({ spNomes: JSON.stringify(nomes) });
  Controle.status('ok', v ? ('Nome do patrocinador ' + n + ' salvo') : ('Patrocinador ' + n + ' sem nome exibido'));
};

Controle.adicionarPatrocinador = function() {
  var N = (Controle._sponsorsN || 3) + 1;
  if(N > 30){ Controle.status('erro','Máximo de 30 patrocinadores'); return; }
  Controle._sponsorsN = N;
  Controle.renderSponsors();
  // a rotacao mostra um logo por vez na faixa inferior; nao cria midia de cena
  Controle.status('ok','✅ Patrocinador '+N+' adicionado');
};

/* limpeza unica: estados antigos tinham uma midia "cena Patrocinadores" que,
   ao ser tocada, ligava o overlay sozinha. Remove do estado salvo. */
Controle._limpouCenaPatrocinador = false;
Controle.limparCenaPatrocinador = function() {
  if (Controle._limpouCenaPatrocinador) return;
  Controle._limpouCenaPatrocinador = true;
  var midias = Controle.getMidiasCtrl() || [], out = [], mudou = false;
  for(var i = 0; i < midias.length; i++){
    var m = midias[i];
    if(m && m.tipo === 'cena' && m.cena === 'sponsors'){ mudou = true; continue; }
    out.push(m);
  }
  if(!mudou) return;
  var ativas = [];
  try { ativas = JSON.parse(Controle.estado.midiasAtivas || '[]'); } catch(e){ ativas = []; }
  var ids = out.map(function(m){ return m.id; });
  ativas = ativas.filter(function(id){ return ids.indexOf(id) >= 0; });
  Controle.setEstado({ midias: JSON.stringify(out), midiasAtivas: JSON.stringify(ativas) });
  if(Controle.renderMidias) Controle.renderMidias();
};
Controle.removerPatrocinador = function(n) {
  var nomes = Controle.getSpNomes();
  if(nomes[n] !== undefined) delete nomes[n];
  var st = { spNomes: JSON.stringify(nomes) }; st['sp'+n] = '';
  Controle.setEstado(st);
  Controle.renderSponsors();
  Controle.status('ok','Patrocinador '+n+' removido');
};
Controle.definirSponsorRotacao = function(campo, val) {
  var d = {};
  if(campo === 'ativo') d.sponsorsAtivo = val ? 'true' : 'false';
  else if(campo === 'intervalo') d.sponsorsIntervalo = String(val);
  else if(campo === 'duracao') d.sponsorsDuracao = String(val);
  Controle.setEstado(d);
  Controle.syncSponsors();
};
/* switch da tela "Ao vivo" (mesmo estado da aba Patrocinadores) */
Controle.alternarPatrocinadores = function() {
  var ligado = (Controle.estado || {}).sponsorsAtivo === 'true';
  Controle.setEstado({ sponsorsAtivo: ligado ? 'false' : 'true' });
  Controle.syncSponsors();
  Controle.status('ok', ligado ? 'Patrocinadores desligados' : 'Patrocinadores ligados');
};
Controle.syncBotaoPatrocinadores = function() {
  var e = Controle.estado || {};
  var on = e.sponsorsAtivo === 'true';
  var btn = document.getElementById('btnPatrocinadores');
  if(btn) {
    btn.classList[on ? 'add' : 'remove']('on');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  var sub = document.getElementById('btnPatrocinadoresSub');
  if(sub) {
    var iv = parseInt(e.sponsorsIntervalo, 10); if(isNaN(iv) || iv < 5) iv = 60;
    sub.textContent = on ? ('ligados · a cada ' + iv + ' s') : 'desligados';
  }
};
Controle.syncSponsors = function() {
  var e = Controle.estado || {};
  if(Controle.limparCenaPatrocinador) Controle.limparCenaPatrocinador();
  var chk = document.getElementById('sponsorsAtivo');
  if(chk) chk.checked = e.sponsorsAtivo === 'true';
  var lbl = document.getElementById('sponsorsAtivoLabel');
  if(lbl) lbl.textContent = (e.sponsorsAtivo === 'true') ? 'ligada' : 'desligada';
  if(Controle.syncBotaoPatrocinadores) Controle.syncBotaoPatrocinadores();
  var iv = document.getElementById('sponsorsIntervalo');
  if(iv && !iv.value) iv.value = e.sponsorsIntervalo || '120';
  var du = document.getElementById('sponsorsDuracao');
  if(du && !du.value) du.value = e.sponsorsDuracao || '8';
  Controle.renderSponsors();
};

Controle.CUSTOMIZACOES = [
  { id:'feat_gol', rotulo:'⚽ Gol' },
  { id:'feat_faltas', rotulo:'🟨 Faltas (cartões)' },
  { id:'feat_midias', rotulo:'🖼 Mídias' },
  { id:'feat_substituicoes', rotulo:'🔁 Substituições' },
  { id:'feat_fila', rotulo:'▶ Fila de reprodução' },
  { id:'feat_intervalos', rotulo:'⏸ Intervalos' }
];
Controle.featAtiva = function(id){ return (Controle.estado || {})[id] !== 'false'; };
Controle.renderCustomizacoes = function(){
  var el = document.getElementById('listaCustomizacoes');
  if(!el) return;
  var h = '';
  for(var i = 0; i < Controle.CUSTOMIZACOES.length; i++){
    var f = Controle.CUSTOMIZACOES[i];
    var on = Controle.featAtiva(f.id);
    h += '<div class="cor-item" style="justify-content:space-between">';
    h += '<span class="cor-nome">' + f.rotulo + '</span>';
    h += '<label class="toggle-sw" title="liga/desliga"><input type="checkbox" data-feat="' + f.id + '" ' + (on ? 'checked' : '') + ' onchange="Controle.toggleCustomizacao(this)"><span class="slider"></span></label>';
    h += '</div>';
  }
  el.innerHTML = h;
  var sec = document.getElementById('secaoIntervalos');
  if(sec) sec.style.display = Controle.featAtiva('feat_intervalos') ? '' : 'none';
};
Controle.toggleCustomizacao = function(input){
  var id = input.getAttribute('data-feat');
  var d = {}; d[id] = input.checked ? 'true' : 'false';
  Controle.setEstado(d);
  Controle.renderMenuRapido();
};
Controle.renderMenuRapido = function(){
  var el = document.getElementById('menuRapido');
  if(!el) return;
  var nomesExp = ((Controle.estado || {}).nomesExpandidos === 'true');
  var itens = [
    { h:'<button id="toggleNomesBtn" onclick="Controle.alternarNomes()" style="background:#2a3a55;font-size:13px;padding:10px 14px">'
        + (nomesExp ? '📝 Siglas' : '📝 Expandir Nomes') + '</button>' },
    { feat:'feat_gol', h:'<button onclick="Controle.notifRapida(\'gol\')" style="background:#dc2626;color:#fff;font-size:13px;padding:10px 14px">⚽ Gol</button>' },
    { feat:'feat_faltas', h:'<button onclick="Controle.notifRapida(\'amarelo\')" style="background:#facc15;color:#000;font-size:13px;padding:10px 14px">🟨 Faltas</button><button onclick="Controle.notifRapida(\'vermelho\')" style="background:#7f1d1d;color:#fff;font-size:13px;padding:10px 14px">🟥 Expulsão</button>' },
    { feat:'feat_midias', h:'<button onclick="Controle.abrirRepertorio()" style="background:#2a3a55;font-size:13px;padding:10px 14px">🖼 Mídias</button>' },
    { feat:'feat_substituicoes', h:'<button onclick="Controle.novaSubstituicao()" style="background:#2a3a55;font-size:13px;padding:10px 14px">🔁 Substituições</button>' },
    { feat:'feat_fila', h:'<button onclick="Controle.abrirRepertorio()" style="background:#2a3a55;font-size:13px;padding:10px 14px">▶ Fila</button>' }
  ];
  var h = '';
  for(var i = 0; i < itens.length; i++){
    if(!itens[i].feat || Controle.featAtiva(itens[i].feat)) h += itens[i].h;
  }
  if(!h) h = '<span style="color:#5b6f88;font-size:11px">Nenhuma ação habilitada.</span>';
  el.innerHTML = h;
};

Controle.intervalo = function(k){
  var nomes = { intro:'Abertura', intervalo:'Intervalo', encerramento:'Encerramento' };
  // clicar de novo na cena que ja esta no ar = sair dela
  if(Controle.cenaManualAtiva && Controle.cenaManualAtiva() === k){ Controle.voltarLoop(); return; }
  var dur = 0;
  var midias = Controle.getMidiasCtrl();
  var id = 'cena_' + k;
  var m = null;
  for(var i = 0; i < midias.length; i++){ if(midias[i].id === id){ m = midias[i]; break; } }
  if(!m){ m = { id:id, tipo:'cena', cena:k, nome:nomes[k]||k, duracao:dur, intervalo:0, transicao:'fade' }; midias.push(m); }
  else { m.duracao = dur; }
  // sequencia sempre maior que o ultimo cancelamento (senao o toggle nao acende)
  var seq = Math.max(Date.now(), (parseInt(Controle.estado.cenaCancelar||0,10)||0) + 1);
  Controle.setEstado({ midias: JSON.stringify(midias), midiaDisparoId: id, midiaDisparoSeq: String(seq) });
  Controle.renderMidias();
  if(Controle.renderCenasManuais) Controle.renderCenasManuais();
  Controle.status('ok', '▶ ' + (nomes[k]||k) + ' no ar');
};
Controle.voltarLoop = function(){
  var seq = Math.max(Date.now(), (parseInt(Controle.estado.midiaDisparoSeq||0,10)||0) + 1);
  Controle.setEstado({ cenaCancelar: String(seq) });
  if(Controle.renderCenasManuais) Controle.renderCenasManuais();
  Controle.status('ok', '⏹ De volta à automação');
};
/* ============================================================
   FUNDOS DAS CENAS — biblioteca própria (PNG / JPG / GIF)
   O arquivo mora em dados/fundos/; a cena guarda só o caminho.
   ============================================================ */
Controle.FUNDO_CENAS = [['intro','Abertura'],['intervalo','Intervalo'],['encerramento','Encerramento'],['table','Tabela'],
                        ['lower','Lower third'],['lineups','Escalação']];
Controle._fundoAlvo = 'intro';

Controle._fundoMapa = function(){
  var f = {};
  try { f = JSON.parse(Controle.estado.cenaFundos || '{}') || {}; } catch(e){ f = {}; }
  return f;
};
Controle._fundoNomeCena = function(k){
  for (var i = 0; i < Controle.FUNDO_CENAS.length; i++) if (Controle.FUNDO_CENAS[i][0] === k) return Controle.FUNDO_CENAS[i][1];
  return k;
};

/* os 4 cartões, cada um com a miniatura do que está aplicado na cena */
Controle.renderFundos = function(){
  var el = document.getElementById('fundoCenas'); if (!el) return;
  var f = Controle._fundoMapa(), h = '';
  Controle.FUNDO_CENAS.forEach(function(c){
    var k = c[0], src = f[k] || '';
    var arq = src ? src.split('/').pop().split('?')[0] : '';
    h += '<div class="fundo-card' + (src ? ' on' : '') + (Controle._fundoAlvo === k ? ' alvo' : '') + '">'
      + '<div class="fundo-thumb" onclick="Controle.abrirBibliotecaFundo(\'' + k + '\')" title="Escolher da biblioteca">'
      +   (src ? '<img src="' + src + '" alt="">' : '<span>sem fundo</span>')
      + '</div>'
      + '<div class="fundo-info"><b>' + c[1] + '</b><small title="' + arq + '">' + (arq || '—') + '</small></div>'
      + '<div class="fundo-acoes">'
      +   '<button onclick="Controle.abrirBibliotecaFundo(\'' + k + '\')" title="Escolher da biblioteca">📚</button>'
      +   '<button onclick="Controle.enviarFundo(\'' + k + '\')" title="Enviar imagem (PNG, JPG ou GIF)">⬆</button>'
      +   (src ? '<button onclick="Controle.removerFundoCena(\'' + k + '\')" title="Tirar o fundo desta cena">✕</button>' : '')
      + '</div></div>';
  });
  el.innerHTML = h;
};

Controle.abrirBibliotecaFundo = function(k){
  Controle._fundoAlvo = k || 'intro';
  var box = document.getElementById('fundoPick');
  if (box) box.classList.remove('escondido');
  var lb = document.getElementById('fundoPickAlvo');
  if (lb) lb.textContent = '→ clique numa imagem para aplicar em ' + Controle._fundoNomeCena(Controle._fundoAlvo);
  Controle.renderFundos();
  Controle.listarFundos();
};

Controle.listarFundos = function(){
  var el = document.getElementById('fundoBiblioteca'); if (!el) return;
  el.innerHTML = '<span class="fundo-vazio">carregando…</span>';
  fetch(API + API_AND + 'acao=listar_fundos').then(function(r){ return r.json(); }).then(function(d){
    var lista = (d && d.fundos) || [];
    if (!lista.length) { el.innerHTML = '<span class="fundo-vazio">Biblioteca vazia — envie uma imagem (PNG, JPG ou GIF).</span>'; return; }
    var h = '';
    lista.forEach(function(n){
      var js = String(n).replace(/\\/g, '').replace(/'/g, "\\'");
      h += '<div class="fundo-item">'
        + '<img src="' + DADOS + 'fundos/' + encodeURIComponent(n) + '" alt="" title="Aplicar em '
        +   Controle._fundoNomeCena(Controle._fundoAlvo) + '" onclick="Controle.aplicarFundo(\'' + js + '\')">'
        + '<span title="' + n + '">' + n + '</span>'
        + '<button onclick="Controle.apagarFundo(\'' + js + '\')" title="Apagar da biblioteca">✕</button>'
        + '</div>';
    });
    el.innerHTML = h;
  }).catch(function(){ el.innerHTML = '<span class="fundo-vazio">não deu para ler a biblioteca</span>'; });
};

Controle.aplicarFundo = function(nome){
  var k = Controle._fundoAlvo || 'intro', f = Controle._fundoMapa();
  f[k] = DADOS + 'fundos/' + nome + '?v=' + Date.now();
  Controle.setEstado({ cenaFundos: JSON.stringify(f) });
  Controle.renderFundos();
  Controle.status('ok', '✅ ' + Controle._fundoNomeCena(k) + ' ← ' + nome);
};

Controle.removerFundoCena = function(k){
  var f = Controle._fundoMapa();
  delete f[k];
  Controle.setEstado({ cenaFundos: JSON.stringify(f) });
  Controle.renderFundos();
  Controle.status('ok', 'Fundo de ' + Controle._fundoNomeCena(k) + ' removido');
};

Controle.apagarFundo = function(nome){
  if (!confirm('Apagar "' + nome + '" da biblioteca de fundos?')) return;
  fetch(API + API_AND + 'acao=remover_fundo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: nome }) })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d && d.erro) { Controle.status('erro', '❌ ' + d.erro); return; }
      Controle.listarFundos();
      Controle.status('ok', '🗑 ' + nome + ' apagado');
    })
    .catch(function(e){ Controle.status('erro', '❌ ' + e.message); });
};

/* reduz a imagem antes de enviar (foto grande estoura o post_max_size).
   GIF vai original para não perder a animação; PNG continua PNG (transparência). */
Controle._fundoDataUri = function(f, cb){
  var tipo = (f.type || '').toLowerCase();
  var ler = function(){ var r = new FileReader(); r.onload = function(){ cb(String(r.result)); }; r.readAsDataURL(f); };
  if (tipo.indexOf('gif') >= 0) return ler();
  var png = tipo.indexOf('png') >= 0;
  var url = URL.createObjectURL(f), img = new Image();
  img.onload = function(){
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    var esc = Math.min(1, 1920 / w, 1080 / h);
    if (esc >= 1 && f.size < 4 * 1024 * 1024) { URL.revokeObjectURL(url); return ler(); }   // já cabe
    var cv = document.createElement('canvas');
    cv.width  = Math.max(1, Math.round(w * esc));
    cv.height = Math.max(1, Math.round(h * esc));
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(url);
    var out = png ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.9);
    if (!png && out.length > 6 * 1024 * 1024) out = cv.toDataURL('image/jpeg', 0.72);
    cb(out);
  };
  img.onerror = function(){ URL.revokeObjectURL(url); ler(); };
  img.src = url;
};

/* seletor restrito: só PNG, JPG e GIF aparecem */
Controle.enviarFundo = function(k){
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/gif';
  input.style.display = 'none';
  input.onchange = function(){
    var f = input.files && input.files[0];
    if (!f) { input.remove(); return; }
    if (!/^image\/(png|jpeg|gif)$/i.test(f.type)) {
      alert('Formato não permitido.\nUse PNG, JPG ou GIF.');
      input.remove(); return;
    }
    Controle.status('sync', 'Preparando fundo...');
    Controle._fundoDataUri(f, function(src){
      Controle.status('sync', 'Enviando fundo (' + Math.round(src.length / 1024) + ' KB)...');
      fetch(API + API_AND + 'acao=upload_fundo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src: src, nome: f.name })
      })
      .then(function(resp){
        // erro do servidor pode vir como HTML: lê texto e tenta JSON
        return resp.text().then(function(t){
          var d = {}; try { d = JSON.parse(t); } catch(e){ d = { erro: 'HTTP ' + resp.status }; }
          return d;
        });
      })
      .then(function(d){
        if (d && d.arquivo) {
          var map = Controle._fundoMapa();
          map[k] = d.arquivo + '?v=' + Date.now();
          Controle.setEstado({ cenaFundos: JSON.stringify(map) });
          Controle.renderFundos();
          Controle.listarFundos();
          Controle.status('ok', '✅ ' + Controle._fundoNomeCena(k) + ' ← ' + (d.nome || 'imagem'));
        } else {
          Controle.status('erro', '❌ ' + (d && d.erro ? d.erro : 'erro ao subir o fundo'));
        }
      }).catch(function(e){ Controle.status('erro', '❌ ' + e.message); });
      input.remove();
    });
  };
  document.body.appendChild(input); input.click();
};
Controle.novaSubstituicao = function(){ Controle.notifRapida('substituicao'); };

Controle.uploadSponsor = function(n) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,.png,.jpg,.jpeg,.webp,.gif,.svg';
  input.onchange = function() {
    var f = input.files && input.files[0];
    if(!f) return;
    var r = new FileReader();
    r.onload = function() {
      var nome = f.name.replace(/\.[^.]+$/, '');
      fetch(API+API_AND+'acao=upload_logo', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ nome:nome, src:r.result })
      })
      .then(function(resp){ return resp.json(); })
      .then(function(d){
        if(d && d.arquivo) {
          var st = {}; st['sp'+n] = d.arquivo;
          Controle.setEstado(st);
          if(Controle.renderSponsors) Controle.renderSponsors();
          Controle.status('ok', '✅ Logo do patrocinador ' + n + ' salvo');
        } else { Controle.status('erro', '❌ ' + (d && d.erro ? d.erro : 'erro ao subir logo')); }
      })
      .catch(function(e){ Controle.status('erro','❌ ' + e.message); });
      input.remove();
    };
    r.readAsDataURL(f);
  };
  document.body.appendChild(input);
  input.click();
};
