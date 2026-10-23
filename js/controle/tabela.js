// js/controle/tabela.js — painel do overlay de classificacao (sistema de tabelas)
// Cenas em linha do tempo (visibilidade + duracao + ordem), tema que espelha o
// placar, time destaque unico, clima, importacao de CSV (classificacao e
// escalacoes) e escudos baixados para o banco de imagens do app.
var Controle = window.Controle || {};

/* Tema único (La Liga) — o mesmo do placar. A lista fica só com ele. */
Controle.TABELA_TEMAS = [
    ['laliga', '🏆 La Liga (unificado)']
];

/* cena, rotulo, duracao padrao (s), visivel por padrao */
Controle.TABELA_CENAS_META = [
    ['intro', 'Abertura do confronto', 6, true],
    ['table', 'Tabela de classificação', 10, true],
    ['duel', 'Duelo (confronto)', 7, true],
    ['feature', 'Time destaque', 8, true],
    ['form2', 'Forma / últimos jogos', 8, true],
    ['lineups', 'Escalações', 9, true],
    ['lower', 'Faixa inferior (placar)', 8, false]
];

/* cenas que dependem da classificacao (CSV importado) */
Controle.TABELA_CENAS_CSV = { table: 1, duel: 1, feature: 1, form2: 1, lineups: 1 };

/* ha classificacao carregada? (sem CSV nao existem cenas de tabela) */
Controle.temClassificacao = function () {
    return Controle.timesTabela().length > 0;
};

Controle.cenasPadrao = function () {
    return Controle.TABELA_CENAS_META.map(function (m) { return { k: m[0], d: m[2], on: m[3] }; });
};

Controle.cenas = function () {
    var e = Controle.estado || {}, lista = null;
    try { lista = JSON.parse(e.tabelaCenas || '[]'); } catch (err) { lista = null; }
    if (!lista || !lista.length) return Controle.cenasPadrao();
    var porK = {};
    lista.forEach(function (c) { if (c && c.k) porK[c.k] = c; });
    var out = [];
    lista.forEach(function (c) {                       // ordem salva primeiro
        if (!c || !c.k) return;
        var d = parseFloat(c.d);
        out.push({ k: c.k, d: (isNaN(d) || d < 1) ? 8 : d, on: c.on !== false && c.on !== 'false' });
    });
    Controle.TABELA_CENAS_META.forEach(function (m) {  // cenas novas entram no fim
        if (!porK[m[0]]) out.push({ k: m[0], d: m[2], on: m[3] });
    });
    return out;
};

Controle.salvarCenas = function (lista) {
    Controle.setEstado({ tabelaCenas: JSON.stringify(lista) });
};

Controle.nomeCena = function (k) {
    for (var i = 0; i < Controle.TABELA_CENAS_META.length; i++)
        if (Controle.TABELA_CENAS_META[i][0] === k) return Controle.TABELA_CENAS_META[i][1];
    return k;
};

/* ---------- inicializacao ---------- */
Controle.initTabela = function () {
    var st = document.getElementById('tabelaTema');
    if (st) st.innerHTML = Controle.TABELA_TEMAS.map(function (t) {
        return '<option value="' + t[0] + '">' + t[1] + '</option>';
    }).join('');

    var sc = document.getElementById('tabelaCena');
    if (sc) Controle.renderSelectCena();

    Controle.renderSelectTimes();
    Controle.renderCenas();
    Controle.aplicarEstadoTabela();
};

/* seletor de cena fixa: sem CSV, as cenas de tabela ficam desabilitadas */
Controle.renderSelectCena = function () {
    var tem = Controle.temClassificacao();
    var html = Controle.TABELA_CENAS_META.map(function (m) {
        var off = !tem && Controle.TABELA_CENAS_CSV[m[0]];
        return '<option value="' + m[0] + '"' + (off ? ' disabled' : '') + '>'
            + m[1] + (off ? ' — precisa do CSV' : '') + '</option>';
    }).join('');
    var atual = (Controle.estado || {}).tabelaCena || 'table';
    if (!tem && Controle.TABELA_CENAS_CSV[atual]) atual = 'intro';
    ['tabelaCena', 'tabelaCenaTop'].forEach(function (id) {
        var sc = document.getElementById(id);
        if (!sc) return;
        sc.innerHTML = html;
        sc.value = atual;
    });
};

/* opcoes dos seletores de time (usa a classificacao do estado, se houver) */
Controle.timesTabela = function () {
    var e = Controle.estado || {};
    try {
        var o = JSON.parse(e.tabelaTimes || '[]');
        if (o && o.length) return o;
    } catch (err) { }
    return [];   // sem CSV nao ha classificacao padrao
};

Controle.renderSelectTimes = function () {
    var times = Controle.timesTabela();
    var ops = times.map(function (t, i) {
        return '<option value="' + i + '">' + (t.pos || (i + 1)) + 'º ' + (t.name || ('Time ' + (i + 1))) + '</option>';
    }).join('');
    /* A e B do confronto vem sempre do placar; o painel so escolhe o destaque */
    var sd = document.getElementById('tabelaDestaque');
    if (sd) sd.innerHTML = '<option value="auto">Automático (time do placar)</option>' + ops;
};

/* ---------- linha do tempo ---------- */
Controle.renderCenas = function () {
    Controle._renderCenasInto('pop');
};
Controle._renderCenasInto = function (pfx) {
    var box = document.getElementById(pfx + 'tabelaCenasLista');
    if (!box) return;
    var lista = Controle.cenas(), total = 0, html = '';
    lista.forEach(function (c, i) {
        if (c.on) total += c.d;
        var semCsv = !Controle.temClassificacao() && Controle.TABELA_CENAS_CSV[c.k];
        html += '<div class="cena-linha' + (c.on ? '' : ' off') + (semCsv ? ' sem-csv' : '') + '"'
            + (semCsv ? ' title="importe o CSV da classificação para usar esta cena"' : '') + '>'
            + '<input type="checkbox" ' + (c.on ? 'checked' : '') + (semCsv ? ' disabled' : '') + ' onchange="Controle.cenaLigada(' + i + ',this.checked)">'
            + '<span class="cena-nome">' + Controle.nomeCena(c.k) + '</span>'
            + '<input class="cena-knob" type="range" min="2" max="40" step="1" value="' + c.d + '"'
            + ' title="Dura&ccedil;&atilde;o desta cena"'
            + ' oninput="Controle.cenaDuracao(' + i + ',this.value,true)"'
            + ' onchange="Controle.cenaDuracao(' + i + ',this.value,false)">'
            + '<span class="cena-durval" id="' + pfx + 'cenaDur' + i + '">' + c.d + 's</span>'
            + '<button class="cena-mv" title="Subir" onclick="Controle.moverCena(' + i + ',-1)">↑</button>'
            + '<button class="cena-mv" title="Descer" onclick="Controle.moverCena(' + i + ',1)">↓</button>'
            + '</div>';
    });
    box.innerHTML = html;
    var tt = document.getElementById(pfx + 'tabelaTotal');
    if (tt) tt.textContent = 'total ' + total.toFixed(0) + ' s';
    var tc = document.getElementById(pfx + 'tabelaCenaCount');
    if (tc) tc.textContent = lista.filter(function (c) { return c.on; }).length + '/' + lista.length + ' cenas';
};

Controle.cenaLigada = function (i, v) {
    var l = Controle.cenas(); if (!l[i]) return; l[i].on = !!v; Controle.salvarCenas(l);
};
/* duracao da cena: aoVivo = durante o arraste do knob (atualiza e nao
   re-renderiza a lista, senao o proprio knob seria recriado no meio do gesto) */
Controle.cenaDuracao = function (i, v, aoVivo) {
    var l = Controle.cenas(); if (!l[i]) return;
    var d = parseFloat(v); if (isNaN(d) || d < 1) d = 1; if (d > 180) d = 180;
    l[i].d = Math.round(d); l[i].k = l[i].k; l[i].on = l[i].on;
    Controle.estado.tabelaCenas = JSON.stringify(l);
    ['pop'].forEach(function (pfx) {
        var tx = document.getElementById(pfx + 'cenaDur' + i); if (tx) tx.textContent = l[i].d + 's';
        var tt = document.getElementById(pfx + 'tabelaTotal');
        if (tt) { var t = 0; l.forEach(function (c) { if (c.on) t += c.d; }); tt.textContent = 'total ' + t.toFixed(0) + ' s'; }
    });
    if (aoVivo) return;                 /* sem POST e sem re-render durante o arraste */
    Controle.salvarCenas(l);            /* ao soltar: grava no servidor e sincroniza a UI */
};
Controle.moverCena = function (i, dir) {
    var l = Controle.cenas(), j = i + dir;
    if (j < 0 || j >= l.length) return;
    var t = l[i]; l[i] = l[j]; l[j] = t; Controle.salvarCenas(l);
};
Controle.todasCenas = function (on) {
    var l = Controle.cenas();
    l.forEach(function (c) { c.on = !!on; });
    Controle.salvarCenas(l);
};
Controle.resetarCenas = function () { Controle.salvarCenas(Controle.cenasPadrao()); };

/* ---------- campos simples ---------- */
/* Cena manual (abertura/intervalo/encerramento) no ar agora.
   Lido do estado para sobreviver a um reload do painel: vale o ultimo disparo
   (midiaDisparoId = cena_x) se ele for mais novo que o ultimo cancelamento. */
Controle.cenaManualAtiva = function () {
    var e = Controle.estado || {};
    var id = String(e.midiaDisparoId || '');
    if (id.indexOf('cena_') !== 0) return null;
    var d = parseInt(e.midiaDisparoSeq || 0, 10);
    var c = parseInt(e.cenaCancelar || 0, 10);
    if (!d || d <= c) return null;
    return id.slice(5);
};

/* pinta os três toggles de cena manual */
Controle.renderCenasManuais = function () {
    var ativa = Controle.cenaManualAtiva();
    ['intro', 'intervalo', 'encerramento'].forEach(function (k) {
        var b = document.getElementById('cenaBtn-' + k); if (!b) return;
        var on = (ativa === k);
        if (b.classList) b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        var est = b.querySelector ? b.querySelector('.ct-estado') : null;
        if (est) est.textContent = on ? 'no ar' : 'off';
    });
    var box = document.getElementById('cenasManuais');
    if (box && box.classList) box.classList.toggle('com-cena', !!ativa);
};

Controle.alternarTabela = function () {
    var ligando = Controle.estado.tabelaAtivo !== 'true';
    if (ligando && !Controle.temClassificacao()) {
        Controle.status('erro', '❌ Importe o CSV da classificação para ligar as Cenas Automáticas '
            + '(abertura, intervalo e encerramento continuam funcionando aqui embaixo).');
        return;
    }
    if (!ligando) {
        // desligou tudo: encerra também a cena manual que estiver por cima
        Controle.setEstado({ tabelaAtivo: 'false', cenaCancelar: String(Date.now()) });
        Controle.status('ok', '⏹ Cenas Automáticas desligadas');
        return;
    }
    Controle.setEstado({ tabelaAtivo: 'true' });
    Controle.status('ok', '▶ Cenas Automáticas ligadas');
};
Controle.definirCenaTabela = function (v) { Controle.setEstado({ tabelaCena: v }); };
Controle.modoFixaAtual = function () { return (Controle.estado || {}).tabelaModo === 'fixa'; };
/* switch "Cena Fixa" da linha de cima (ao lado de Cenas Automaticas) */
Controle.alternarCenaFixa = function () {
    var fixa = !Controle.modoFixaAtual();
    Controle.alternarModoTabela(fixa);
    Controle.syncBotaoCenaFixa();
    Controle.status('ok', fixa ? '📌 Cena fixa ligada' : '▶ Linha do tempo ligada');
};
Controle.syncBotaoCenaFixa = function () {
    var e = Controle.estado || {}, fixa = e.tabelaModo === 'fixa';
    var b = document.getElementById('btnCenaFixa');
    if (b) { b.classList[fixa ? 'add' : 'remove']('on'); b.setAttribute('aria-pressed', fixa ? 'true' : 'false'); }
    var sub = document.getElementById('btnCenaFixaSub');
    if (sub) sub.textContent = fixa ? ('no ar: ' + Controle.nomeCena(e.tabelaCena || 'table')) : 'desligada · linha do tempo';
    var sel = document.getElementById('tabelaCenaTop');
    if (sel) { sel.disabled = !fixa; sel.className = 'sel-cena-top' + (fixa ? '' : ' off'); sel.value = e.tabelaCena || 'table'; }
};
Controle.definirDestaqueTabela = function (v) { Controle.setEstado({ tabelaDestaque: v }); };

/* mantem o seletor do overlay igual ao estado (chamado ao recarregar a lista) */
Controle.sincronizarLogoTabela = function () {
    var sel = document.getElementById('tabelaLogo'); if (!sel) return;
    var v = (Controle.estado || {}).logoTorneio || '';
    if (v) {
        var tem = false;
        for (var i = 0; i < sel.options.length; i++) if (sel.options[i].value === v) tem = true;
        if (!tem && document.createElement) { var o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o); }
    }
    sel.value = v;
    var prev = document.getElementById('tabelaLogoPrev');
    if (prev) { if (v) { prev.src = DADOS+'torneios/' + v; prev.style.display = ''; } else { prev.style.display = 'none'; } }
};

Controle.definirZonasTabela = function () {
    var on = document.getElementById('tabelaZonas');
    Controle.setEstado({
        tabelaZonas: (on && on.checked) ? 'true' : 'false',
        tabelaZonaUp: document.getElementById('tabelaZonaUp').value,
        tabelaZonaDn: document.getElementById('tabelaZonaDn').value
    });
};
Controle.definirEscudosTabela = function () {
    var on = document.getElementById('tabelaEscudos');
    Controle.setEstado({ tabelaEscudos: (on && on.checked) ? 'true' : 'false' });
};

/* ---------- sincronizacao com o estado ---------- */
Controle.aplicarEstadoTabela = function () {
    var e = Controle.estado || {};
    var fixa = e.tabelaModo === 'fixa';
    /* a cena fixa tambem poe o overlay no ar, sem depender de "Cenas Automaticas" */
    var ligado = e.tabelaAtivo === 'true' || fixa;
    var manual = Controle.cenaManualAtiva();
    var bt = document.getElementById('btnTabela');
    if (bt) {
        bt.setAttribute('aria-pressed', ligado ? 'true' : 'false');
        bt.className = 'sw-cenas' + (ligado ? ' on' : '') + (manual ? ' pausada' : '');
        var sub = document.getElementById('btnTabelaSub');
        if (sub) {
            var nomes = { intro: 'Abertura', intervalo: 'Intervalo', encerramento: 'Encerramento' };
            sub.textContent = manual ? ('pausadas · ' + (nomes[manual] || manual) + ' no ar')
                                     : (e.tabelaAtivo === 'true' ? 'ligadas · overlay no ar'
                                        : (fixa ? 'desligadas · cena fixa no ar' : 'desligadas · só o placar'));
        }
    }
    var bd = document.getElementById('tabelaBadge');
    if (bd) {
        var noAr = ligado || !!manual;
        bd.innerText = noAr ? 'NO AR' : 'fora do ar';
        bd.className = noAr ? 'badge no-ar' : 'badge';
    }
    /* sem classificacao o overlay de tabela nao liga: só abertura/intervalo/encerramento */
    var temCsv = Controle.temClassificacao();
    var aviso = document.getElementById('tabelaSemCsv');
    if (aviso) aviso.className = temCsv ? 'escondido' : '';
    if (bt) bt.disabled = (!temCsv && !ligado);
    var v;
    v = document.getElementById('tabelaTema'); if (v) v.value = e.tabelaTema || 'laliga';
    v = document.getElementById('tabelaModo'); if (v) v.value = e.tabelaModo || 'auto';
    var modoFixa = (e.tabelaModo === 'fixa');
    if (Controle.syncBotaoCenaFixa) Controle.syncBotaoCenaFixa();
    v = document.getElementById('secCenas'); if (v) v.className = modoFixa ? 'full escondido' : 'full';
    Controle.pintarDestaques();
    Controle.renderSelectCena();
    v = document.getElementById('tabelaDestaque'); if (v) v.value = (e.tabelaDestaque === undefined || e.tabelaDestaque === '') ? 'auto' : e.tabelaDestaque;
    v = document.getElementById('tabelaTitulo'); if (v) v.value = e.tabelaTitulo || '';
    v = document.getElementById('tabelaSub'); if (v) v.value = e.tabelaSub || '';
   v = document.getElementById('tabelaLocal'); if (v) v.value = e.tabelaLocal || e.local || '';
   v = document.getElementById('tabelaHora'); if (v) v.value = e.tabelaHora || e.hora || '';
   if (Controle.sincronizarLogoTabela) Controle.sincronizarLogoTabela();
    v = document.getElementById('tabelaZonas'); if (v) v.checked = (e.tabelaZonas !== 'false');
    v = document.getElementById('tabelaZonaUp'); if (v) v.value = e.tabelaZonaUp || '1';
    v = document.getElementById('tabelaZonaDn'); if (v) v.value = e.tabelaZonaDn || '14';
    v = document.getElementById('tabelaEscudos'); if (v) v.checked = (e.tabelaEscudos !== 'false');
    v = document.getElementById('tabelaEscInfo'); if (v) v.textContent = Controle.resumoEscalacoes(e.tabelaEscalacoes);
    var lt = Controle.timesTabela();
    var sig = lt.length + '|' + ((lt[0] || {}).name || '') + '|' + ((lt[lt.length - 1] || {}).name || '');
    if (sig !== Controle._timesSig) { Controle._timesSig = sig; Controle.renderSelectTimes(); Controle.renderSelectCena(); }
    Controle.atualizarResumoTabela();
    if (Controle.renderFundos) Controle.renderFundos();
    if (Controle.renderCenasManuais) Controle.renderCenasManuais();
    Controle.renderCenas();
    if (Controle.renderTimesCrest) Controle.renderTimesCrest();
};

/* o que o overlay esta puxando da aba Times & Competicao */
Controle.atualizarResumoTabela = function () {
    var el = document.getElementById('tabelaDadosInfo');
    if (!el) return;
    var e = Controle.estado || {};
    var partes = [];
    if (e.competicao) partes.push(e.competicao);
    if (e.grupo) partes.push(e.grupo);
    if (e.categoria) partes.push(e.categoria);
    if (e.fase) partes.push(e.fase);
    if (e.local) partes.push(e.local);
    if (e.hora) partes.push(e.hora);
    if (e.clima) partes.push(e.clima);
    if (!Controle.temClassificacao()) {
        el.innerHTML = '⚠ sem classificação: <b>importe o CSV</b> para as cenas de tabela';
        return;
    }
    el.innerHTML = partes.length
        ? '✔ puxando: <b>' + partes.join(' · ') + '</b>'
        : 'sem dados na aba Times &amp; Competição';
};

/* ---------- importacao da classificacao (CSV) ---------- */
Controle._norm = function (x) {
    return (x || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
};
Controle._linhaCSV = function (linha, d) {
    var out = [], cur = '', q = false;
    for (var i = 0; i < linha.length; i++) {
        var ch = linha[i];
        if (q) { if (ch === '"') { if (linha[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
        else if (ch === '"') q = true;
        else if (ch === d) { out.push(cur); cur = ''; }
        else cur += ch;
    }
    out.push(cur);
    return out;
};

/* ---------- metadados de competição vindos do CSV ----------
   Três origens, nesta ordem de prioridade: colunas do cabeçalho, linhas
   "Chave: valor" acima do cabeçalho e o nome do arquivo. Só devolve o que
   encontrou — campo vazio nunca sobrescreve o que o operador digitou. */
Controle._META_CHAVES = {
    competicao: ['competicio', 'competicion', 'competicao', 'comp', 'torneo', 'torneio', 'liga', 'prova'],
    categoria: ['categoria', 'cat'],
    grupo: ['grup', 'grupo', 'group'],
    fase: ['fase', 'phase', 'jornada', 'ronda', 'eliminatoria'],
    data: ['data', 'fecha', 'date', 'dia'],
    hora: ['hora', 'horari', 'horario', 'hora inicio', 'inicio'],
    local: ['camp', 'campo', 'local', 'estadi', 'estadio', 'sede', 'instalacion']
};
Controle._metaChave = function (k) {
    k = Controle._norm(k);
    var out = null;
    Object.keys(Controle._META_CHAVES).forEach(function (campo) {
        if (Controle._META_CHAVES[campo].indexOf(k) >= 0) out = campo;
    });
    return out;
};
/* "Competició: QUARTA CATALANA" | "Competició=..." */
Controle._metaLinha = function (s) {
    var m = String(s || '').match(/^\s*"?([^:="]{2,26})"?\s*[:=]\s*"?(.+?)"?\s*$/);
    if (!m) return null;
    var campo = Controle._metaChave(m[1]);
    if (!campo || !m[2].trim()) return null;
    return { campo: campo, valor: m[2].trim() };
};
/* aceita tambem "Competició;QUARTA CATALANA" (duas celulas) */
Controle._metaDaRow = function (r) {
    if (!r || !r.length) return null;
    var m = Controle._metaLinha(r[0]);
    if (m) return m;
    if (r.length === 2) {
        var c = Controle._metaChave(r[0]);
        if (c && (r[1] || '').trim()) return { campo: c, valor: r[1].trim() };
    }
    return null;
};
/* nome do arquivo: ..._U16_Grupo18_... -> {categoria:'U16', grupo:'Grupo 18'} */
Controle._metaDoNome = function (nome) {
    var meta = {}, base = String(nome || '').replace(/\.[a-z0-9]+$/i, '');
    /* junta "grup-18"/"grupo 18"/"u 16" para o split nao separar numero e nome */
    base = base.replace(/(grup|grupo|group)[ _\-]+0*(\d{1,3})/ig, '$1$2')
               .replace(/\bu[ _\-]+(\d{1,2})\b/ig, 'u$1');
    base.split(/[_\-]+/).forEach(function (tk) {
        tk = tk.trim();
        var u = tk.match(/^u\s?(\d{1,2})$/i);
        if (u) { meta.categoria = meta.categoria || ('U' + u[1]); return; }
        var g = tk.match(/^(?:grup|grupo|group)\s?0*(\d{1,3})$/i);
        if (g) { meta.grupo = meta.grupo || ('Grupo ' + g[1]); }
    });
    return meta;
};

/* aceita o CSV do fcf.cat (Pos;Equip;Punts;J;G;E;P;GF;GC;DG;Ultims;Sancio;PosSite;Escut) */
Controle.parseClassificacao = function (texto) {
    texto = (texto || '').replace(/^\ufeff/, '');
    var linhas = texto.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (!linhas.length) throw new Error('arquivo vazio');
    var pri = linhas[0];
    var d = (pri.split(';').length >= pri.split(',').length) ? ';' : ',';
    var rows = linhas.map(function (l) { return Controle._linhaCSV(l, d); });
    /* linhas "Chave: valor" antes do cabecalho — sem descartar isso o cabecalho
       seria lido como um time e a tabela inteira sairia errada. */
    var meta = {};
    while (rows.length) {
        var mr = Controle._metaDaRow(rows[0]);
        if (!mr) break;
        meta[mr.campo] = mr.valor;
        rows.shift();
    }
    if (!rows.length) throw new Error('arquivo vazio');
    var H = rows[0].map(Controle._norm);
    var temCab = H.some(function (h) { return ['equip', 'punts', 'pts', 'equipe', 'time', 'nome'].indexOf(h) >= 0; });
    var idx = function (ks) { for (var i = 0; i < H.length; i++) if (ks.indexOf(H[i]) >= 0) return i; return -1; };
    var iPos = idx(['pos']), iNome = idx(['equip', 'equipe', 'time', 'nome']), iPts = idx(['punts', 'pts', 'pontos']),
        iJ = idx(['j']), iG = idx(['g']), iE = idx(['e']), iP = idx(['p']),
        iF = idx(['gf', 'f']), iC = idx(['gc', 'c']), iForm = idx(['ultims', 'ultimos']),
        iSanc = idx(['sancio']), iSite = idx(['possite']),
        iEsc = idx(['escut', 'escudo', 'esc', 'crest', 'imagem', 'logo']);
    var num = function (v, def) { var n = parseFloat((v || '').toString().replace(',', '.')); return isNaN(n) ? (def || 0) : n; };
    var antigos = {};
    Controle.timesTabela().forEach(function (t) { antigos[Controle._norm(t.name)] = t; });

    var corpo = temCab ? rows.slice(1) : rows;
    /* colunas com metadado (Competicio;Categoria;Grup;Fase;Data;Hora;Camp) */
    Object.keys(Controle._META_CHAVES).forEach(function (campo) {
        if (meta[campo]) return;
        var jm = -1;
        for (var im = 0; im < H.length; im++) if (Controle._META_CHAVES[campo].indexOf(H[im]) >= 0) { jm = im; break; }
        if (jm < 0) return;
        for (var km = 0; km < corpo.length; km++) {
            var vm = (corpo[km][jm] || '').replace(/^"|"$/g, '').trim();
            if (vm) { meta[campo] = vm; return; }
        }
    });
    var lista = [], urls = [];
    var PALETA = ['#f472b6', '#38bdf8', '#22c55e', '#facc15', '#a78bfa', '#fb923c', '#2dd4bf', '#f87171',
        '#60a5fa', '#34d399', '#fbbf24', '#c084fc', '#fb7185', '#4ade80', '#e879f9', '#94a3b8'];
    corpo.forEach(function (r, i) {
        var nm = ((iNome >= 0 ? r[iNome] : (temCab ? '' : r[1])) || '').replace(/^"|"$/g, '').trim();
        if (!nm) return;
        var f = iF >= 0 ? num(r[iF]) : 0, c = iC >= 0 ? num(r[iC]) : 0;
        var old = antigos[Controle._norm(nm)];
        var crest = (iEsc >= 0 && (r[iEsc] || '').replace(/^"|"$/g, '').trim()) || '';
        /* CSV sem aspas no Escut: 'data:image/png;base64,...' foi cortado no ';' */
        if (crest.indexOf('data:') === 0 && crest.indexOf(',') < 0 && r[iEsc + 1]) {
            crest = crest + ';' + r[iEsc + 1];
        }
        var t = {
            pos: iPos >= 0 ? num(r[iPos], i + 1) : i + 1,
            site: iSite >= 0 ? num(r[iSite], i + 1) : (old ? (old.site || old.pos) : i + 1),
            name: nm,
            short: old && old.short ? old.short : nm.split(',')[0].split(' ').slice(0, 3).join(' '),
            pts: iPts >= 0 ? num(r[iPts]) : 0, j: iJ >= 0 ? num(r[iJ]) : 0,
            g: iG >= 0 ? num(r[iG]) : 0, e: iE >= 0 ? num(r[iE]) : 0, p: iP >= 0 ? num(r[iP]) : 0,
            f: f, c: c, dg: f - c,
            form: (iForm >= 0 ? (r[iForm] || '') : '').replace(/"/g, '')
                .split(/[\s/]+/).filter(function (x) { return /^[GEP]$/i.test(x); }).map(function (x) { return x.toUpperCase(); }),
            sancio: iSanc >= 0 ? num(r[iSanc]) : 0,
            crest: (old && old.crest && !crest) ? old.crest : crest,
            color: (old && old.color) ? old.color : PALETA[i % PALETA.length]
        };
        if (crest) urls.push({ nome: nm, url: crest });
        lista.push(t);
    });
    if (!lista.length) throw new Error('nenhum time reconhecido');
    lista.sort(function (a, b) { return (a.pos || 0) - (b.pos || 0); });
    return { times: lista, urls: urls, meta: meta };
};

Controle.importarClassificacao = function (input) {
    var f = input && input.files && input.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
        try {
            var res = Controle.parseClassificacao(String(r.result));
            Controle._ultimoCsv = { texto: String(r.result), tipo: 'tabela' };
            /* competicao/categoria/grupo/fase/data/hora/local: o que o CSV (ou o
               nome do arquivo) trouxer entra no estado e o painel atualiza sozinho.
               O CSV vence o nome do arquivo; campo vazio nao apaga o que ja existe. */
            var meta = Controle._metaDoNome(f.name);
            Object.keys(res.meta || {}).forEach(function (k) {
                if (res.meta[k]) meta[k] = res.meta[k];
            });
            var nomesMeta = { competicao: 'Competição', categoria: 'Categoria', grupo: 'Grupo',
                fase: 'Fase', data: 'Data', hora: 'Hora', local: 'Local' };
            var patch = { tabelaTimes: JSON.stringify(res.times) }, postos = [];
            Object.keys(nomesMeta).forEach(function (k) {
                if (!meta[k]) return;
                patch[k] = meta[k];
                postos.push(nomesMeta[k] + ' ' + meta[k]);
            });
            Controle.setEstado(patch);
            Controle.renderSelectTimes();
            Controle.status('ok', '✅ Classificação: ' + res.times.length + ' times'
                + (postos.length ? ' · ' + postos.join(' · ') : ' · CSV sem dados de competição'));
            if (res.urls.length) Controle.baixarEscudos(res.urls);
        } catch (err) {
            Controle.status('erro', '❌ ' + err.message);
        }
        input.value = '';
    };
    r.readAsText(f, 'utf-8');
};

/* ============================================================
   BIBLIOTECA DE ESCUDOS (escudos/)
   Todos os escudos referenciados pelo CSV vao para a biblioteca do app.
   Se o escudo do time ja estiver la, nao baixa de novo: so aponta pra ele.
   ============================================================ */

/* nome de arquivo que o importar_escudos usa para este time (mesma regra) */
Controle.arquivoEscudo = function (nome) {
    var base = (nome || '').replace(/[^A-Za-z0-9_\-]/g, '_');
    if (!base || base === '.' || base === '..') base = 'escudo_' + Date.now();
    return base;
};

/* quais escudos do CSV ainda NAO estao na biblioteca
   (jaTinha = escudos que ja estao la, so apontar para eles) */
Controle.escudosFaltando = function (itens, biblioteca) {
    var na = {}, vistos = {}, jaTinha = [], fila = [];
    (biblioteca || []).forEach(function (n) { na[String(n).toLowerCase()] = true; });
    (itens || []).forEach(function (it) {
        if (!it || !it.nome) return;
        var base = Controle.arquivoEscudo(it.nome);
        if (vistos[base]) return;                       // time repetido no CSV
        vistos[base] = true;
        if (na[base.toLowerCase()]) jaTinha.push({ nome: it.nome, arquivo: DADOS+'escudos/' + base + '.png' });
        else fila.push(it);
    });
    return { novos: fila, jaTinha: jaTinha };
};

/* roda a sincronizacao a qualquer momento, a partir da classificacao atual */
Controle.sincronizarEscudos = function () {
    var itens = [];
    Controle.timesTabela().forEach(function (t) {
        var c = (t.crest || '').split('?')[0].trim();
        if (c) itens.push({ nome: t.name, url: c });
    });
    if (!itens.length) { alert('Nenhum escudo referenciado na classificação.'); return; }
    Controle.baixarEscudos(itens);
};

/* diz, sem baixar nada, quais times da classificação ainda estão SEM escudo na
   biblioteca (escudos/) — serve para achar o motivo de uma linha ficar sem escudo */
Controle.conferirEscudos = function (silencioso) {
    var el = document.getElementById('tabelaCsvInfo');
    var itens = [];
    Controle.timesTabela().forEach(function (t) {
        var c = (t.crest || '').split('?')[0].trim();
        if (c) itens.push({ nome: t.name, url: c });
    });
    if (!itens.length) { if (el && !silencioso) el.innerHTML += '<br>⚠ classificação sem escudos (importe o CSV)'; return; }
    fetch(API+API_AND+'acao=listar_escudos').then(function (r) { return r.json(); }).then(function (j) {
        var falta = Controle.escudosFaltando(itens, (j && j.escudos) || []);
        var sem = falta.novos.map(function (x) { return x.nome; });
        var curto = function (n) { return n.split(/[\s,]+/).slice(0, 2).join(' '); };
        var msg = sem.length
            ? '⚠ ' + sem.length + ' time(s) SEM escudo na biblioteca: <b>' + sem.slice(0, 5).map(curto).join(' · ') + '</b>' + (sem.length > 5 ? ' …' : '')
            : '✔ todos os ' + itens.length + ' escudos estão em escudos/';
        if (el) el.innerHTML = (silencioso ? el.innerHTML + '<br>' : '') + msg;
    }).catch(function () { if (el && !silencioso) el.innerHTML += '<br>não deu para conferir a biblioteca'; });
};

Controle.baixarEscudos = function (itens) {
    itens = itens || [];
    var el = document.getElementById('tabelaCsvInfo');
    var dizer = function (txt) { if (el) el.textContent = txt; };
    var salvos = [], jaTinha = [], falhas = [], lote = [], LOTE = 6;
    var naBiblioteca = {};          // base do arquivo -> true
    var pronto = false;

    var enviar = function (lista, cb) {
        fetch(API+API_AND+'acao=importar_escudos', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itens: lista })
        }).then(function (r) { return r.json(); }).then(function (j) {
            (j.salvos || []).forEach(function (s) { salvos.push(s); });
            cb();
        }).catch(function () { cb(); });
    };

    var fila = [];
    var montarFila = function () {
        var r = Controle.escudosFaltando(itens, Object.keys(naBiblioteca));
        fila = r.novos;
        jaTinha = r.jaTinha;
    };

    var proximo = function (i) {
        if (i >= fila.length) {
            if (lote.length) { var l = lote.slice(); lote = []; enviar(l, fim); } else fim();
            return;
        }
        var it = fila[i];
        dizer('⬇ biblioteca de escudos: ' + (i + 1) + '/' + fila.length + ' (novos)…');
        /* escudo ja vem embutido no proprio CSV (data uri): manda direto, sem proxy */
        if (it.url.indexOf('data:') === 0) {
            lote.push({ nome: it.nome, src: it.url });
            if (lote.length >= LOTE) { var l0 = lote.slice(); lote = []; enviar(l0, function () { proximo(i + 1); }); }
            else proximo(i + 1);
            return;
        }
        fetch(API+API_AND+'acao=proxy_imagem&url=' + encodeURIComponent(it.url))
            .then(function (r) { return r.ok ? r.blob() : null; })
            .then(function (b) {
                if (!b || b.size < 60) { falhas.push(it.nome); proximo(i + 1); return; }
                var fr = new FileReader();
                fr.onload = function () {
                    lote.push({ nome: it.nome, src: String(fr.result) });
                    if (lote.length >= LOTE) { var l = lote.slice(); lote = []; enviar(l, function () { proximo(i + 1); }); }
                    else proximo(i + 1);
                };
                fr.readAsDataURL(b);
            })
            .catch(function () { falhas.push(it.nome); proximo(i + 1); });
    };

    var fim = function () {
        var mapa = {};
        salvos.forEach(function (s) { mapa[Controle._norm(s.nome)] = s.arquivo; });
        jaTinha.forEach(function (s) { mapa[Controle._norm(s.nome)] = s.arquivo; });
        var times = Controle.timesTabela(), mudou = 0;
        times.forEach(function (t) {
            var p = mapa[Controle._norm(t.name)];
            if (p) { t.crest = p + '?v=' + Date.now(); mudou++; }
        });
        if (mudou) Controle.setEstado({ tabelaTimes: JSON.stringify(times) });
        if (Controle.renderEscudos) Controle.renderEscudos();
        var total = salvos.length + jaTinha.length;
        Controle.status('ok', '✅ Escudos na biblioteca: ' + total + '/' + itens.length
            + ' (' + salvos.length + ' baixados · ' + jaTinha.length + ' já estavam)'
            + (falhas.length ? (' · falhou: ' + falhas.length) : ''));
        if (el) el.textContent = '✔ ' + total + ' escudos em escudos/ ('
            + salvos.length + ' novos · ' + jaTinha.length + ' já estavam)'
            + (falhas.length ? (' · ' + falhas.length + ' sem imagem') : '');
        if (Controle.conferirEscudos) Controle.conferirEscudos(true);
    };

    dizer('🔎 conferindo a biblioteca de escudos…');
    fetch(API+API_AND+'acao=listar_escudos')
        .then(function (r) { return r.json(); })
        .then(function (j) {
            (j.escudos || []).forEach(function (n) { naBiblioteca[String(n).toLowerCase()] = true; });
            pronto = true; montarFila(); proximo(0);
        })
        .catch(function () { pronto = true; montarFila(); proximo(0); });
};

/* ---------- escalações: importar CSV do painel ---------- */
/* aceita time;jogador;numero;posicao (com ou sem cabecalho, ';' ou ',') */
Controle.parseEscalacoes = function (texto) {
    texto = (texto || '').replace(/^\ufeff/, '');
    var linhas = texto.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (!linhas.length) return {};
    var pri = linhas[0];
    var d = (pri.split(';').length >= pri.split(',').length) ? ';' : ',';
    var rows = linhas.map(function (l) { return Controle._linhaCSV(l, d); });
    var H = rows[0].map(Controle._norm);
    var temCab = H.some(function (h) {
        return ['equipe', 'equip', 'time', 'clube', 'team', 'jogador', 'atleta', 'numero', 'camisa', 'dorsal'].indexOf(h) >= 0;
    });
    var acha = function (ks) { for (var i = 0; i < H.length; i++) if (ks.indexOf(H[i]) >= 0) return i; return -1; };
    var iT = acha(['equip', 'equipe', 'time', 'clube', 'team']),
        iP = acha(['jogador', 'atleta', 'nome', 'player']),
        iN = acha(['numero', 'camisa', 'dorsal', 'num']),
        iPo = acha(['posicao', 'pos', 'funcao']);
    var corpo = temCab ? rows.slice(1) : rows, out = {};
    corpo.forEach(function (r) {
        var time = ((iT >= 0 ? r[iT] : (temCab ? '' : r[0])) || '').replace(/^"|"$/g, '').trim();
        var jog = ((iP >= 0 ? r[iP] : (r[2] || '')) || '').replace(/^"|"$/g, '').trim();
        if (!time || !jog) return;
        var k = Controle._norm(time);
        if (!out[k]) out[k] = [];
        out[k].push({ num: (iN >= 0 ? r[iN] : '') || '', player: jog, pos: (iPo >= 0 ? r[iPo] : '') || '' });
    });
    return out;
};

Controle.parseJogadoresUnico = function (texto) {
    texto = (texto || '').replace(/^\ufeff/, '');
    var linhas = texto.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (!linhas.length) return [];
    var pri = linhas[0];
    var d = (pri.split(';').length >= pri.split(',').length) ? ';' : ',';
    var rows = linhas.map(function (l) { return Controle._linhaCSV(l, d); });
    var H = rows[0].map(Controle._norm);
    var temCab = H.some(function (h) {
        return ['jogador', 'atleta', 'nome', 'player', 'numero', 'camisa', 'dorsal', 'num', 'posicao', 'pos'].indexOf(h) >= 0;
    });
    var acha = function (ks) { for (var i = 0; i < H.length; i++) if (ks.indexOf(H[i]) >= 0) return i; return -1; };
    var iP = acha(['jogador', 'atleta', 'nome', 'player']),
        iN = acha(['numero', 'camisa', 'dorsal', 'num']),
        iPo = acha(['posicao', 'pos', 'funcao']);
    var corpo = temCab ? rows.slice(1) : rows, out = [];
    corpo.forEach(function (r) {
        var jog = ((iP >= 0 ? r[iP] : (r[0] || '')) || '').replace(/^"|"$/g, '').trim();
        if (!jog) return;
        out.push({ num: (iN >= 0 ? r[iN] : '') || '', player: jog, pos: (iPo >= 0 ? r[iPo] : '') || '' });
    });
    return out;
};

Controle.importarEscalacoes = function (input, lado) {
    var f = input && input.files && input.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
        try {
            var jogadores = Controle.parseJogadoresUnico(String(r.result));
            if (!jogadores.length) throw new Error('nenhum jogador reconhecido no CSV');
            var nome = (lado === 'b') ? (Controle.estado.timeB || 'Time B') : (Controle.estado.timeA || 'Time A');
            var map = {}; try { map = JSON.parse(Controle.estado.tabelaEscalacoes || '{}'); } catch (e) { map = {}; }
            map[Controle._norm(nome)] = jogadores;
            Controle._ultimoCsv = { texto: String(r.result), tipo: 'jogadores' };
            Controle.setEstado({ tabelaEscalacoes: JSON.stringify(map) });
            Controle.status('ok', '✅ Escalações (' + nome + '): ' + jogadores.length + ' jogadores');
            if (Controle.renderTimesNotif) Controle.renderTimesNotif();
            if (Controle.renderJogadores) Controle.renderJogadores();
        } catch (err) {
            Controle.status('erro', '❌ ' + err.message);
        }
        input.value = '';
    };
    r.readAsText(f, 'utf-8');
};

Controle.limparEscalacoes = function () { Controle.setEstado({ tabelaEscalacoes: '{}' }); };

Controle.serializarEscalacoes = function () {
    var map; try { map = JSON.parse(Controle.estado.tabelaEscalacoes || '{}'); } catch (e) { map = {}; }
    var linhas = ['time;jogador;numero;posicao'];
    var na = Controle.estado.timeA || 'Time A', nb = Controle.estado.timeB || 'Time B';
    var nna = Controle._norm(na), nnb = Controle._norm(nb);
    Object.keys(map).forEach(function (k) {
        var nome = (nna && Controle._norm(k) === nna) ? na : (nnb && Controle._norm(k) === nnb) ? nb : k;
        (map[k] || []).forEach(function (p) {
            linhas.push([nome, p.player || '', p.num || '', p.pos || ''].join(';'));
        });
    });
    return '\ufeff' + linhas.join('\n') + '\n';
};

/* ---------- biblioteca de CSVs (separada por tipo: tabela / jogadores) ---------- */
Controle.listarCsvs = function (tipo) {
  tipo = (tipo === 'jogadores') ? 'jogadores' : 'tabela';
  var lib = tipo === 'jogadores' ? 'csvs_jogadores' : 'csvs_tabela';
  var el = document.getElementById(tipo === 'jogadores' ? 'listaCsvsJogadores' : 'listaCsvsTabela');
  fetch(API + API_AND + 'acao=listar_csvs&tipo=' + encodeURIComponent(tipo))
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!el) return;
      var lista = (d && d.csvs) || [];
      if (!lista.length) { el.innerHTML = '<span style="color:#888;font-size:11px">Nenhum CSV salvo.</span>'; return; }
      var h = '';
      for (var i = 0; i < lista.length; i++) {
        var n = lista[i];
        var nm = String(n).replace(/'/g, "\\'");
        h += '<div class="csv-item" data-item="' + n + '">';
        h += '<input type="checkbox" class="cb-lib" data-tipo="' + lib + '" data-item="' + n + '" style="flex-shrink:0">';
        h += '<span class="csv-nome">📄 ' + n + '</span>';
        h += '<button onclick="Controle.carregarCsv(\'' + nm + '\',\'' + tipo + '\')" title="Aplicar">📥 Aplicar</button>';
        h += '<button class="btn-remover" onclick="Controle.removerCsv(\'' + nm + '\',\'' + tipo + '\')">✕</button>';
        h += '</div>';
      }
      el.innerHTML = h;
      if (Controle._aplicarFiltros) Controle._aplicarFiltros(lib);
    }).catch(function () {});
};

Controle.salvarCsvAtual = function (tipo) {
  tipo = (tipo === 'jogadores') ? 'jogadores' : 'tabela';
  var conteudo;
  if (tipo === 'jogadores') {
    conteudo = Controle.serializarEscalacoes();
    if (!conteudo || conteudo.split('\n').length < 2) {
      alert('Importe as escalações (Time A e/ou Time B) antes de salvar.');
      return;
    }
  } else {
    if (!Controle._ultimoCsv || !Controle._ultimoCsv.texto) {
      alert('Importe um CSV antes de salvar na biblioteca.');
      return;
    }
    conteudo = Controle._ultimoCsv.texto;
  }
  var nome = prompt('Nome para este CSV na biblioteca:');
  if (!nome || !nome.trim()) return;
  fetch(API + API_AND + 'acao=salvar_csv', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: nome.trim(), conteudo: conteudo, tipo: tipo })
  }).then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.erro) alert(d.erro); Controle.listarCsvs(tipo); })
    .catch(function () {});
};

Controle.carregarCsv = function (nome, tipo) {
  tipo = (tipo === 'jogadores') ? 'jogadores' : 'tabela';
  fetch(API + API_AND + 'acao=carregar_csv', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: nome, tipo: tipo })
  }).then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d || !d.conteudo) { alert(d && d.erro ? d.erro : 'CSV vazio.'); return; }
      try {
        if (tipo === 'jogadores') {
          var map = Controle.parseEscalacoes(d.conteudo);
          Controle.setEstado({ tabelaEscalacoes: JSON.stringify(map) });
          Controle.status('ok', '✅ Escalações carregadas (' + Object.keys(map).length + ' times)');
        } else {
          var res = Controle.parseClassificacao(d.conteudo);
          Controle.setEstado({ tabelaTimes: JSON.stringify(res.times) });
          Controle.renderSelectTimes();
          Controle.status('ok', '✅ Classificação carregada (' + res.times.length + ' times)');
          if (res.urls.length) Controle.baixarEscudos(res.urls);
        }
      } catch (err) { Controle.status('erro', '❌ ' + err.message); }
    }).catch(function () {});
};

Controle.removerCsv = function (nome, tipo) {
  tipo = (tipo === 'jogadores') ? 'jogadores' : 'tabela';
  fetch(API + API_AND + 'acao=remover_csv', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: nome, tipo: tipo })
  }).then(function (r) { return r.json(); })
    .then(function () { Controle.listarCsvs(tipo); })
    .catch(function () {});
};

/* ---------- trocar escudo de um time da classificação (CSV) ---------- */
Controle.renderTimesCrest = function () {
  var el = document.getElementById('tabelaTimesCrest'); if (!el) return;
  var times = Controle.timesTabela();
  if (!times.length) { el.innerHTML = '<span class="hint">importe a classificação (CSV) para listar os times</span>'; return; }
  var h = '';
  times.forEach(function (t, i) {
    var crest = (t.crest || '').split('?')[0];
    var img = crest
      ? '<img class="time-crest-img" src="' + crest + '" alt="" onerror="this.style.opacity=0.2">'
      : '<span class="time-crest-vazio">sem</span>';
    h += '<div class="time-crest-item">';
    h += img;
    h += '<span class="time-crest-nome">' + (t.pos || (i + 1)) + 'º ' + (t.name || 'Time ' + (i + 1)) + '</span>';
    h += '<button onclick="Controle.trocarCrest(' + i + ')">🖼 Trocar</button>';
    h += '</div>';
  });
  el.innerHTML = h;
};

Controle.trocarCrest = function (index) {
  var times = Controle.timesTabela(); if (!times[index]) return;
  var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,.png,.jpg,.jpeg,.webp,.svg,.gif'; inp.style.display = 'none';
  inp.onchange = function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      Controle.status('sync', 'Enviando escudo...');
      fetch(API + API_AND + 'acao=importar_escudos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: [{ nome: times[index].name, src: String(r.result) }] })
      }).then(function (x) { return x.json(); }).then(function (j) {
        var arq = (j.salvos && j.salvos[0] && j.salvos[0].arquivo) || '';
        if (!arq) throw new Error('falha ao salvar imagem');
        var ts = Controle.timesTabela();
        ts[index].crest = arq + '?v=' + Date.now();
        Controle.setEstado({ tabelaTimes: JSON.stringify(ts) });
        Controle.renderTimesCrest();
        Controle.status('ok', '✅ Escudo do time atualizado');
      }).catch(function (err) { Controle.status('erro', '❌ ' + err.message); });
      inp.remove();
    };
    r.readAsDataURL(f);
  };
  document.body.appendChild(inp); inp.click();
};

Controle.resumoEscalacoes = function (txt) {
    try {
        var m = JSON.parse(txt || '{}'), t = Object.keys(m).length, j = 0;
        Object.keys(m).forEach(function (k) { j += (m[k] || []).length; });
        return t ? ('✔ ' + t + ' times · ' + j + ' jogadores') : 'nenhuma escalação carregada';
    } catch (e) { return 'nenhuma escalação carregada'; }
};

/* Chama o sync do painel de tabelas junto do aplicarEstado geral (sem mexer no core) */
(function () {
    var antigo = Controle.aplicarEstado;
    Controle.aplicarEstado = function () {
        if (antigo) antigo.apply(this, arguments);
        if (Controle.aplicarEstadoTabela) Controle.aplicarEstadoTabela();
    };
})();



/* ============================================================
   MODO: cena fixa <-> linha do tempo
   ============================================================ */

/* qual cena o placar esta mostrando agora (o placar publica isso no estado) */
Controle._cenaNoAr = function (cb) {
    var atual = (Controle.estado || {}).tabelaCenaAtual;
    if (atual) { cb(atual); return; }
    fetch(API).then(function (r) { return r.json(); })
        .then(function (cru) {
            var flat = (typeof buildFlat === 'function') ? buildFlat(cru) : (cru || {});
            cb(flat.tabelaCenaAtual || null);
        })
        .catch(function () { cb(null); });
};

/* liga/desliga o modo fixo; ao ligar, continua exatamente da cena que estava
   passando na linha do tempo (transicao automatica) */
Controle.alternarModoTabela = function (fixa) {
    if (!fixa) { Controle.setEstado({ tabelaModo: 'auto' }); return; }
    var proxima = Controle.estado.tabelaCena || 'table';
    Controle.setEstado({ tabelaModo: 'fixa', tabelaCena: proxima });
    Controle._cenaNoAr(function (k) {
        var e = Controle.estado || {};
        if (k && k !== e.tabelaCena) Controle.setEstado({ tabelaCena: k });
    });
};

/* ▶ toca a sequencia de novo, do comeco */
Controle.tocarSequencia = function () {
    Controle.setEstado({ tabelaModo: 'auto', tabelaPlay: String(Date.now()) });
    Controle.status('ok', '▶ sequência reiniciada');
};

/* ============================================================
   TIME DESTAQUE: botoes Casa (A) / Fora (B)
   ============================================================ */
Controle.indiceDoPlacar = function (lado) {
    var e = Controle.estado || {};
    var nome = (lado === 'a') ? (e.timeA || e.siglaA) : (e.timeB || e.siglaB);
    if (!nome) return -1;
    var alvo = Controle._norm(nome), lista = Controle.timesTabela();
    for (var i = 0; i < lista.length; i++) {
        var cands = [Controle._norm(lista[i].name), Controle._norm(lista[i].short)];
        for (var j = 0; j < cands.length; j++) {
            var c = cands[j];
            if (!c) continue;
            if (c === alvo || (alvo.length > 3 && c.indexOf(alvo) >= 0) || (c.length > 3 && alvo.indexOf(c) >= 0)) return i;
        }
    }
    return -1;
};

Controle.destaquePlacar = function (lado) {
    var i = Controle.indiceDoPlacar(lado), e = Controle.estado || {};
    if (i < 0) {
        alert('O time ' + (lado === 'a' ? 'A (Casa)' : 'B (Fora)') + ' do placar — "' +
            ((lado === 'a' ? e.timeA : e.timeB) || 'sem nome') + '" — não casou com nenhum time da classificação.');
        return;
    }
    Controle.definirDestaqueTabela(String(i));
};

/* marca qual botao esta ativo (o destaque e o valor salvo) */
Controle.pintarDestaques = function () {
    var e = Controle.estado || {}, d = e.tabelaDestaque;
    var iA = Controle.indiceDoPlacar('a'), iB = Controle.indiceDoPlacar('b');
    var auto = (d === undefined || d === '' || d === 'auto');
    var bA = document.getElementById('btnDestA');
    var bB = document.getElementById('btnDestB');
    var bA2 = document.getElementById('btnDestAuto');
    if (bA) bA.className = 'btn-destaque' + (!auto && iA >= 0 && String(d) === String(iA) ? ' on' : '');
    if (bB) bB.className = 'btn-destaque' + (!auto && iB >= 0 && String(d) === String(iB) ? ' on' : '');
    if (bA2) bA2.className = 'btn-destaque' + (auto ? ' on' : '');
};
