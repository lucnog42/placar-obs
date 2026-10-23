// js/placar/tabela.js — camada do overlay de classificacao (sistema de tabelas)
// Liga/desliga o overlay sobre a transmissao. O placar sai de cena ANTES de o
// overlay entrar, e volta depois que ele sai.
// Espelha o placar: tema, cores dos times, escudos e os dados da aba
// "Times & Competicao" (competicao, grupo, categoria, fase, local, hora, clima).
var Placar = window.Placar || {};

Placar.Tabela = {
    ativo: false,
    cfg: null,
    raf: null,
    t0: 0,
    _t1: null,
    _ctx: null,
    _chave: null,          // cenas|tema|times|auto — para saber quando recomecar
    _timesChave: null,
    _notifRaf: null,
    _proxSponsor: 0,
    _sponsorChave: '',
    _interromper: null,
    _cenaCancelarSeq: null,
    _forcado: false,

    /* cenas que o motor conhece (usado para validar o painel/estado) */
    CENAS_VALIDAS: { intro: 1, table: 1, duel: 1, feature: 1, form2: 1, lineups: 1, lower: 1, intervalo: 1, encerramento: 1 },
    /* cenas que só existem se houver classificacao (CSV importado) */
    CENAS_CSV: { table: 1, duel: 1, feature: 1, form2: 1, lineups: 1 },

    /* ---------- elementos ---------- */
    camada: function () { return document.getElementById('camadaTabela'); },
    /* ---------- utilidades ---------- */
    norm: function (s) {
        return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    },

    /* indice do time: usa o valor explicito do painel; se for 'auto'/vazio,
       casa pelo nome/sigla do time que esta no placar. */
    indice: function (chave, nome, padrao) {
        var e = Placar.estado || {};
        var v = e[chave];
        if (v !== undefined && v !== '' && v !== 'auto' && !isNaN(parseInt(v))) {
            var n = parseInt(v);
            var lista = this.times() || [];
            if (n >= 0 && n < lista.length) return n;
        }
        var i = this.casar(nome);
        return i === null ? padrao : i;
    },

    casar: function (nome) {
        var alvo = this.norm(nome);
        if (!alvo) return null;
        var lista = this.times() || [];
        var melhor = null, peso = -1;
        for (var i = 0; i < lista.length; i++) {
            var t = lista[i];
            var cands = [this.norm(t.name), this.norm(t.short)];
            for (var k = 0; k < cands.length; k++) {
                var c = cands[k];
                if (!c) continue;
                var p = -1;
                if (c === alvo) p = 1000 + c.length;
                else if (alvo.length > 3 && c.indexOf(alvo) === 0) p = 500 + alvo.length;
                else if (alvo.length > 3 && c.indexOf(alvo) >= 0) p = 300 + alvo.length;
                else if (c.length > 3 && alvo.indexOf(c) >= 0) p = 200 + c.length;
                if (p > peso) { peso = p; melhor = i; }
            }
        }
        return peso > 0 ? melhor : null;
    },

    /* ---------- tema / times ---------- */
    tema: function () {
        return 'escuro';   // tema único (La Liga) — sem espelhar cor de time
    },

    /* classificacao vinda do estado (importacao de CSV) */
    times: function () {
        var e = Placar.estado || {};
        if (!e.tabelaTimes) return null;
        try {
            var o = (typeof e.tabelaTimes === 'string') ? JSON.parse(e.tabelaTimes) : e.tabelaTimes;
            return (o && o.length) ? o : null;
        } catch (err) { return null; }
    },

    /* sem CSV: a abertura/intervalo/encerramento mostram o confronto que está no
       placar (nao ha classificacao para casar os indices). */
    timeDoPlacar: function (lado) {
        var e = Placar.estado || {};
        var nome = (lado === 'A') ? (e.timeA || '') : (e.timeB || '');
        var sigla = (lado === 'A') ? (e.siglaA || '') : (e.siglaB || '');
        var esc = (lado === 'A') ? (e.escudoA || '') : (e.escudoB || '');
        if (!nome && !sigla && !esc) return null;
        return { name: nome, short: sigla || nome, crest: esc, escudo: esc };
    },

    /* linha do tempo: [{k,d}] apenas das cenas visiveis, na ordem do painel */
    cenas: function (txt) {
        var lista = null;
        try { lista = (typeof txt === 'string') ? JSON.parse(txt || '[]') : txt; } catch (e) { lista = null; }
        if (!lista || !lista.length) return null;
        var out = [];
        for (var i = 0; i < lista.length; i++) {
            var c = lista[i];
            if (!c || c.on === false || c.on === 'false') continue;
            var d = parseFloat(c.d);
            out.push({ k: c.k, d: (isNaN(d) || d < 1) ? 8 : d });
        }
        return out.length ? out : null;
    },

    /* duracao configurada para uma cena (mesmo que ela esteja desmarcada) */
    duracaoCena: function (txt, k) {
        var lista = null;
        try { lista = (typeof txt === 'string') ? JSON.parse(txt || '[]') : txt; } catch (e) { lista = null; }
        if (lista) for (var i = 0; i < lista.length; i++) {
            if (lista[i] && lista[i].k === k) {
                var d = parseFloat(lista[i].d);
                return (isNaN(d) || d < 1) ? 8 : d;
            }
        }
        return 8;
    },

    /* ---------- configuracao enviada ao motor ---------- */
    config: function () {
        var e = Placar.estado || {};
        var d = {};
        var tem = !!this.times();              // sem CSV importado nao ha classificacao
        var modo = e.tabelaModo || 'auto';
        var lista = this.cenas(e.tabelaCenas);
        var cenaFixa = e.tabelaCena || 'table';
        if (!this.CENAS_VALIDAS[cenaFixa]) cenaFixa = 'table';
        if (!tem && this.CENAS_CSV[cenaFixa]) cenaFixa = 'intro';
        var scenes;
        if (modo === 'fixa') {
            scenes = [{ k: cenaFixa, d: this.duracaoCena(e.tabelaCenas, cenaFixa) }];
        } else if (lista) {
            scenes = lista;
        } else {
            scenes = CENAS_PADRAO.map(function (s) { return { k: s.k, d: s.d }; });   // sem linha do tempo salva
        }
        if (!tem) {                            // sem CSV: sobram só as cenas que nao precisam dele
            var semCsv = this.CENAS_CSV;
            scenes = scenes.filter(function (s) { return !semCsv[s.k]; });
            if (!scenes.length) scenes = [{ k: 'intro', d: this.duracaoCena(e.tabelaCenas, 'intro') }];
        }
        var A = tem ? null : this.timeDoPlacar('A');
        var B = tem ? null : this.timeDoPlacar('B');
        var dest = this.indice('tabelaDestaque', null, d.c || 0);
        var sub = [e.grupo, e.categoria, e.fase].filter(Boolean).join(' · ');
        var lt = e.tabelaLogo || e.logoTorneio || '';      // logo do torneio (sub-banco torneios/)
        return {
            ttl: e.tabelaTitulo || e.competicao || d.ttl || '',   // sem texto fixo: vazio = vazio
            sub: e.tabelaSub || sub || d.sub || '',
            a: this.indice('tabelaA', e.timeA || e.siglaA, d.a || 0),
            b: this.indice('tabelaB', e.timeB || e.siglaB, d.b || 1),
            c: dest,
            tl: dest,                       // um seletor so manda no destaque e na escalacao
            bg: 'transparent',
            aTime: A, bTime: B,             // sem CSV: confronto vem do placar, nao da tabela
            scenes: scenes,
            auto: scenes.length > 1,
            dim: false,
            zone: e.tabelaZonas !== 'false',
            zUp: parseInt(e.tabelaZonaUp, 10) || d.zUp || 1,
            zDn: parseInt(e.tabelaZonaDn, 10) || d.zDn || 14,
            zcUp: e.tabelaZonaCorUp || d.zcUp || '#22c55e',
            zcDn: e.tabelaZonaCorDn || d.zcDn || '#ef4444',
            logo: lt ? (DADOS + 'torneios/' + lt) : '',
            vName: e.tabelaLocal || e.local || '',
            vDate: e.data || '',                      // data do jogo (aba Competicao / CSV)
            vCity: '',
            vTime: e.tabelaHora || e.hora || '',
            vW: e.clima ? (e.clima + '°C') : '',
            vIcon: e.climaIcone || '',
            spText: e.spText || d.spText || 'PATROCINADORES',
            golsA: e.golsA || '0',
            golsB: e.golsB || '0',
            lineups: this.escalacoes(e.tabelaEscalacoes),   // { timeNormalizado: [jogadores] }
            form: e.tabelaForm !== 'false'
        };
    },

    /* escalações vindas do painel (JSON em texto dentro do estado) */
    escalacoes: function (txt) {
        if (!txt) return {};
        try { var o = (typeof txt === 'string') ? JSON.parse(txt) : txt; return (o && typeof o === 'object') ? o : {}; }
        catch (err) { return {}; }
    },

    /* imagens de fundo por cena (intro/intervalo/encerramento/table) */
    fundos: function (txt) {
        if (!txt) return {};
        try { var o = (typeof txt === 'string') ? JSON.parse(txt) : txt; return (o && typeof o === 'object') ? o : {}; }
        catch (err) { return {}; }
    },

    /* ---------- linha do tempo (o motor canvas nao existe mais) ---------- */
    _segs: function (cfg) {
        var t = 0, out = [];
        for (var i = 0; i < cfg.scenes.length; i++) {
            var s = cfg.scenes[i], d = Number(s.d) || 0;
            out.push({ k: s.k, d: d, t0: t }); t += d;
        }
        return { segs: out, total: Math.max(t, 0.1) };
    },
    _cenaEm: function (segs, t) {
        for (var i = 0; i < segs.length; i++) { var s = segs[i]; if (t < s.t0 + s.d) return s.k; }
        return segs.length ? segs[segs.length - 1].k : null;
    },

    /* conta ao painel qual cena esta no ar (para o botao de cena fixa
       continuar exatamente do que estava passando) */
    publicarCena: function (k) {
        if (!k || k === this._pubCena) return;
        var agora = Date.now();
        if (this._pubT && (agora - this._pubT) < 700) return;
        this._pubCena = k; this._pubT = agora;
        try {
            fetch(API+API_AND+'acao=cena_atual', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ k: k })
            });
        } catch (err) { }
    },

    /* assinatura dos times: precisa mudar tambem quando o ESCUDO muda
       (o painel importa o CSV com a URL e, depois de baixar, troca pela
       imagem do banco em escudos/ — mesma lista de nomes, escudo diferente) */
    chaveTimes: function (times) {
        var partes = [];
        for (var i = 0; i < times.length; i++) {
            var t = times[i] || {}, c = String(t.crest || '');
            partes.push(t.name + '#' + c.length + '#' + c.slice(0, 32) + '#' + c.slice(-10));
        }
        return times.length + '|' + partes.join('~');
    },

    chaveDe: function (cfg) {
        return [cfg.scenes.map(function (s) { return s.k + ':' + s.d; }).join(','),
            String((Placar.estado || {}).tabelaPlay || ''),
            cfg.auto ? 'auto' : 'fixa', this.tema(), cfg.a, cfg.b, cfg.c,
            cfg.ttl, cfg.sub, cfg.vName, cfg.vDate, cfg.vTime, cfg.vW, cfg.vIcon, cfg.logo].join('|');
    },

    /* notificação ou mídia manual no ar têm prioridade sobre a rotação */
    prioridadeManual: function () {
        var nt = document.getElementById('notifOv');
        if (nt && nt.classList.contains('show')) return true;
        var cam = document.getElementById('camadaMidia');
        return !!(cam && cam.querySelector('.ativo'));
    },

    /* o overlay esta no ar? (cenas automaticas, cena fixa ou cena manual segura) */
    noAr: function () {
        var e = Placar.estado || {};
        return this.ativo === true
            || String(e.tabelaAtivo) === 'true'
            || String(e.tabelaModo) === 'fixa'
            || !!this._interromper;
    },

    /* forca uma cena manualmente (repertório tipo "cena"); d<=0 segura indefinidamente */
    mostrarCena: function (k, d) {
        var dd = parseInt(d, 10);
        this._interromper = { k: k, d: dd > 0 ? dd : Infinity, t0: performance.now() };
        if (!this.ativo) { this._forcado = true; this.ligar(); }   // liga o overlay se estiver desligado
    },
    /* volta ao loop (encerra a cena segura) */
    cancelarCena: function () {
        this._interromper = null;
        if (this._forcado) { this._forcado = false; this.desligar(); }
    },

    /* ---------- persistencia da posicao da sequencia (playlist) ----------
       Salva um timestamp absoluto por instancia no localStorage do browser
       source. Um reload do overlay retoma de onde parou; desligar zera. */
    _plKey: function () { return 'placar.playlistT0' + (typeof INSTANCIA !== 'undefined' && INSTANCIA ? '.' + INSTANCIA : ''); },
    _savePlaylistT0: function (ms) {
        try {
            var k = this._plKey();
            if (ms > 0) localStorage.setItem(k, String(ms));
            else localStorage.removeItem(k);
        } catch (e) { }
    },
    _loadPlaylistT0: function () {
        try { return parseInt(localStorage.getItem(this._plKey()), 10) || 0; } catch (e) { return 0; }
    },

    /* ---------- ciclo de vida ---------- */
    aplicar: function () {
        var e = Placar.estado || {};
        // fundos das cenas HTML (tabela/abertura/intervalo/encerramento) — sempre, nao so com a tabela ligada
        if (window.TabelaDados && window.TabelaDados.setFundos) window.TabelaDados.setFundos(e.cenaFundos);
        var cc = e.cenaCancelar;
        if (cc && this._cenaCancelarSeq === undefined) {
            this._cenaCancelarSeq = cc;      // reload: nao age, so memoriza
        } else if (cc && cc !== this._cenaCancelarSeq) {
            this._cenaCancelarSeq = cc;
            this.cancelarCena();
        }

        // classificacao pode ter sido trocada por importacao de CSV (ou limpa)
        var times = this.times();
        this._timesChave = times ? this.chaveTimes(times) : null;

        /* cena fixa funciona sozinha: nao depende de "Cenas Automaticas" */
        var ligado = String(e.tabelaAtivo) === 'true'
            || String(e.tabelaModo) === 'fixa'
            || this._forcado;
        if (ligado) {
            var cfg = this.config();
            this.cfg = cfg;
            if (window.TabelaDados) { try { window.TabelaDados.fill(cfg, this.tema()); } catch (e) {} }
            var c = this.chaveDe(cfg);
            if (!this.ativo) {
                this._chave = c;
                this.ligar();
            } else if (c !== this._chave) {
                this._chave = c;
                this.reiniciar();          // trocou cena/tema/time/clima: entra de novo
            }
        } else if (this.ativo) {
            this.desligar();
        }
    },

    ligar: function () {
        var self = this;
        var cam = this.camada(), wrap = document.getElementById('placarWrapper');
        if (!cam) return;
        this.ativo = true;
        if (wrap) wrap.classList.add('saindo');        // 1) o placar sai
        clearTimeout(this._t1);
        this._t1 = setTimeout(function () {            // 2) so entao o overlay entra
            if (!self.ativo) return;
            cam.classList.add('ativa');
            var nowE = Date.now(), saved = self._loadPlaylistT0();
            if (saved > 0 && nowE >= saved && (nowE - saved) < 6 * 3600 * 1000) {
                self.t0 = performance.now() - (nowE - saved);   // retoma a sequencia
            } else {
                self.t0 = performance.now();
                self._savePlaylistT0(nowE);                     // comeca do inicio
            }
            self.desenhar(performance.now());
            self.iniciarLoop();
        }, 380);
    },

    desligar: function () {
        var self = this;
        var cam = this.camada(), wrap = document.getElementById('placarWrapper');
        this.ativo = false;
        this._interromper = null;
        this._forcado = false;
        this._savePlaylistT0(0);          // desligou: proxima vez comeca do inicio
        this.pararLoop();
        clearTimeout(this._t1);
        if (cam) { cam.classList.remove('ativa'); cam.removeAttribute('data-cena'); }  // overlay sai
        this._t1 = setTimeout(function () {
            if (!self.ativo && wrap) wrap.classList.remove('saindo');
        }, 420);
    },

    reiniciar: function () {
        this.t0 = performance.now();
        this._savePlaylistT0(Date.now());     // reinicio explicito: nova posicao inicial
        if (this.ativo) {
            this.desenhar(this.t0);
            this.iniciarLoop();
        }
    },

    /* ---------- escolha da cena (o CSS mostra e anima) ---------- */
    desenhar: function (now) {
        var cfg = this.cfg;
        if (!cfg) return;
        now = now || performance.now();
        var el = (now - this.t0) / 1000;
        var cena = null;

        // cena manual (prioridade maxima)
        if (this._interromper) {
            var iel = (now - this._interromper.t0) / 1000;
            if (iel < this._interromper.d) cena = this._interromper.k;
            else this._interromper = null;
        }

        if (!cena) {
            if (cfg.auto) {
                var tl = this._segs(cfg);
                var t = tl.total > 0 ? (el % tl.total) : 0;
                cena = this._cenaEm(tl.segs, t);
            } else {
                cena = cfg.scenes[0] && cfg.scenes[0].k;
            }
        }

        this.publicarCena(cena);
        var cam = this.camada();
        if (cam && cena && cam.getAttribute('data-cena') !== cena) cam.setAttribute('data-cena', cena);    },

    iniciarLoop: function () {
        var self = this;
        this.pararLoop();
        this.raf = setInterval(function () {
            if (!self.ativo) return;
            self.desenhar(performance.now());
        }, 200);           // 5x por segundo basta: so troca de cena, sem desenho
    },

    pararLoop: function () {
        if (this.raf) clearInterval(this.raf);
        this.raf = null;
    },

    /* notificacao: camada propria fora do placar (js/placar/notificacao.js -> #camadaNotif) */
    /* ---------- entrada ---------- */
    init: function () {
        // estado ja carregado antes deste arquivo? aplica agora
        if (Placar.estado && Placar.estado.tabelaAtivo !== undefined) this.aplicar();
    }
};

/* linha do tempo padrao quando o painel nunca salvou uma */
var CENAS_PADRAO = [{ k: 'intro', d: 6 }, { k: 'table', d: 10 }, { k: 'duel', d: 7 },
                    { k: 'feature', d: 8 }, { k: 'form2', d: 8 }, { k: 'lineups', d: 9 }];

// reage a mudancas de estado
Placar.on('tabela:changed', function () { Placar.Tabela.aplicar(); });
// times/estilo do placar mudaram: re-casa times, cores, escudos e tema
Placar.on('times:changed', function () { Placar.Tabela.aplicar(); });
Placar.on('estilo:changed', function () { Placar.Tabela.aplicar(); });
