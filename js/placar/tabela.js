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
    CENAS_VALIDAS: { intro: 1, table: 1, duel: 1, feature: 1, form2: 1, lineups: 1, sponsors: 1, lower: 1, intervalo: 1, encerramento: 1 },

    /* ---------- elementos ---------- */
    camada: function () { return document.getElementById('camadaTabela'); },
    _canvasVisivel: function (v) {
        var cv = this.canvas(); if (!cv) return;
        var d = v ? '' : 'none';
        if (cv.style.display !== d) cv.style.display = d;
    },
    canvas: function () { return document.getElementById('tabelaCanvas'); },
    ctx2d: function () {
        var cv = this.canvas();
        if (!cv) return null;
        if (!this._ctx) this._ctx = cv.getContext('2d');
        return this._ctx;
    },

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
            var lista = (window.Tabela ? window.Tabela.teams() : []) || [];
            if (n >= 0 && n < lista.length) return n;
        }
        var i = this.casar(nome);
        return i === null ? padrao : i;
    },

    casar: function (nome) {
        var alvo = this.norm(nome);
        if (!alvo || !window.Tabela) return null;
        var lista = window.Tabela.teams() || [];
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
        var d = (window.TABELA_DADOS || {}).padrao || {};
        var modo = e.tabelaModo || 'auto';
        var lista = this.cenas(e.tabelaCenas);
        var cenaFixa = e.tabelaCena || 'table';
        if (!this.CENAS_VALIDAS[cenaFixa]) cenaFixa = 'table';
        var scenes;
        if (modo === 'fixa') {
            scenes = [{ k: cenaFixa, d: this.duracaoCena(e.tabelaCenas, cenaFixa) }];
        } else if (lista) {
            scenes = lista;
        } else {
            scenes = CENAS_PADRAO.map(function (s) { return { k: s.k, d: s.d }; });   // sem linha do tempo salva
        }
        var dest = this.indice('tabelaDestaque', null, d.c || 0);
        var sub = [e.grupo, e.categoria, e.fase].filter(Boolean).join(' · ');
        var lt = e.tabelaLogo || e.logoTorneio || '';      // logo do torneio (sub-banco torneios/)
        return {
            ttl: e.tabelaTitulo || e.competicao || d.ttl || 'QUARTA CATALANA',
            sub: e.tabelaSub || sub || d.sub || '',
            a: this.indice('tabelaA', e.timeA || e.siglaA, d.a || 0),
            b: this.indice('tabelaB', e.timeB || e.siglaB, d.b || 1),
            c: dest,
            tl: dest,                       // um seletor so manda no destaque e na escalacao
            bg: 'transparent',
            scenes: scenes,
            auto: scenes.length > 1,
            dim: false,
            zone: e.tabelaZonas !== 'false',
            zUp: parseInt(e.tabelaZonaUp, 10) || d.zUp || 1,
            zDn: parseInt(e.tabelaZonaDn, 10) || d.zDn || 14,
            zcUp: e.tabelaZonaCorUp || d.zcUp || '#22c55e',
            zcDn: e.tabelaZonaCorDn || d.zcDn || '#ef4444',
            logo: lt ? ('torneios/' + lt) : '',
            vName: e.tabelaLocal || e.local || '',
            vCity: '',
            vTime: e.tabelaHora || e.hora || '',
            vW: e.clima ? (e.clima + '°C') : '',
            vIcon: e.climaIcone || '',
            spText: e.spText || d.spText || 'PATROCINADORES',
            golsA: e.golsA || '0',
            golsB: e.golsB || '0'
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

    /* ---------- layout por cena (tamanho + posicao, editado no painel) ---------- */
    layout: function (k) {
        var e = Placar.estado || {}, o = null;
        try { o = JSON.parse(e.tabelaLayout || '{}'); } catch (err) { o = null; }
        var it = (o && o[k]) || {};
        var esc = parseFloat(it.e), x = parseFloat(it.x), y = parseFloat(it.y);
        return {
            e: (isNaN(esc) || esc < 10) ? 100 : Math.min(400, esc),
            x: isNaN(x) ? 50 : x,
            y: isNaN(y) ? 50 : y
        };
    },

    aplicarLayout: function (k) {
        var cam = this.camada();
        if (!cam || !k) return;
        var L = this.layout(k);
        var sig = [k, L.e, L.x, L.y].join('|') + '|' + (Placar.estado && Placar.estado.tabelaLayout ? Placar.estado.tabelaLayout.length : 0);
        if (sig === this._layoutSig) return;
        this._layoutSig = sig;
        cam.style.transformOrigin = '50% 50%';
        cam.style.transform = 'translate(' + (L.x - 50) + '%,' + (L.y - 50) + '%) scale(' + (L.e / 100) + ')';
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
            cfg.ttl, cfg.sub, cfg.vName, cfg.vTime, cfg.vW, cfg.vIcon, cfg.logo].join('|');
    },

    /* ---------- patrocinadores (sp1..spN) ---------- */
    sponsorNomes: function () {
        var e = Placar.estado || {}, out = [];
        for (var i = 1; i <= 30; i++) { var v = e['sp' + i]; if (v) out.push(String(v)); }
        return out;
    },
    carregarPatrocinadores: function () {
        if (!window.Tabela) return;
        var self = this;
        var nomes = this.sponsorNomes();
        var chave = nomes.join('|');
        if (chave === this._sponsorChave) return;
        this._sponsorChave = chave;
        if (!nomes.length) { window.Tabela.setPatrocinadores([null, null, null]); return; }
        var imgs = [], pend = nomes.length;
        nomes.forEach(function (nome, i) {
            var im = new Image();
            im.onload = function () { imgs[i] = im; if (--pend === 0) fim(); };
            im.onerror = function () { imgs[i] = null; if (--pend === 0) fim(); };
            im.src = 'torneios/' + nome;
        });
        function fim() { window.Tabela.setPatrocinadores(imgs); if (self.ativo) self.desenhar(performance.now()); }
    },
    sponsorAtivo: function () { return String((Placar.estado || {}).sponsorsAtivo) === 'true'; },
    _sponsorIntervaloMs: function () { var v = parseInt((Placar.estado || {}).sponsorsIntervalo, 10); return (isNaN(v) || v < 5) ? 120000 : v * 1000; },
    _sponsorDuracaoMs: function () { var v = parseInt((Placar.estado || {}).sponsorsDuracao, 10); return (isNaN(v) || v < 1) ? 8000 : v * 1000; },
    /* notificação ou mídia manual no ar têm prioridade sobre a rotação */
    prioridadeManual: function () {
        if (window.Tabela && window.Tabela.temNotif && window.Tabela.temNotif()) return true;
        var cam = document.getElementById('camadaMidia');
        return !!(cam && cam.querySelector('.ativo'));
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
        if (!window.Tabela) return;
        var e = Placar.estado || {};
        // fundos das cenas HTML (tabela/abertura/intervalo/encerramento) — sempre, nao so com a tabela ligada
        if (window.TabelaDados && window.TabelaDados.setFundos) window.TabelaDados.setFundos(e.cenaFundos);
        var cc = e.cenaCancelar;
        if (cc && cc !== this._cenaCancelarSeq) {
            this._cenaCancelarSeq = cc;
            this.cancelarCena();
        }

        // classificacao pode ter sido trocada por importacao de CSV (ou limpa)
        var times = this.times();
        if (!times && this._timesChave) {
            this._timesChave = null;
            window.Tabela.setTeams(((window.TABELA_DADOS || {}).teams) || []);
            window.Tabela.loadCrests(function () { if (Placar.Tabela.ativo) Placar.Tabela.desenhar(); });
        } else if (times) {
            var chave = this.chaveTimes(times);
            if (chave !== this._timesChave) {
                this._timesChave = chave;
                window.Tabela.setTeams(times);
                window.Tabela.loadCrests(function () { if (Placar.Tabela.ativo) Placar.Tabela.desenhar(); });
            }
        }

        var ligado = String(e.tabelaAtivo) === 'true' || this._forcado;
        if (ligado) {
            var cfg = this.config();
            window.Tabela.setTheme(this.tema());
            window.Tabela.setEscudos(e.tabelaEscudos !== 'false');
            window.Tabela.setLineups(this.escalacoes(e.tabelaEscalacoes));
            window.Tabela.setFundo(this.fundos(e.cenaFundos));
            window.Tabela.setColors('#ffd700', '#ffd700', '#ffd700');   // cor fixa do tema (cor de time nao entra no design)
            window.Tabela.setEscudoTime(cfg.a, e.escudoA || '');
            window.Tabela.setEscudoTime(cfg.b, e.escudoB || '');
            this.carregarPatrocinadores();
            window.Tabela.setCfg(cfg);
            window.Tabela.loadLogo(cfg.logo, function () { if (Placar.Tabela.ativo) Placar.Tabela.desenhar(); });
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
        this._proxSponsor = 0;
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
        if (cam) cam.classList.remove('ativa');        // overlay sai primeiro
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

    /* ---------- desenho ---------- */
    desenhar: function (now) {
        var g = this.ctx2d();
        if (!g) return;
        var cfg = this.cfg || window.Tabela.cfg();
        var cv = this.canvas();
        var el = ((now || performance.now()) - this.t0) / 1000;
        var t, cena = null, forca = null;
        // cena manual forçada (prioridade máxima)
        if (this._interromper) {
            var iel = (now - this._interromper.t0) / 1000;
            if (iel < this._interromper.d) { cena = this._interromper.k; t = iel; forca = cena; }
            else { this._interromper = null; }
        }
        if (!forca) {
            if (cfg.auto) {
                var tl = window.Tabela.timeline(cfg);
                t = tl.total > 0 ? (el % tl.total) : 0;
                cena = window.Tabela.sceneAt(tl.segs, t).k;
            } else {
                var d = (cfg.scenes[0] && cfg.scenes[0].d) || 8;
                t = Math.min(el, d);                   // anima a entrada e segura
                cena = cfg.scenes[0] && cfg.scenes[0].k;
            }
            // rotacao de patrocinadores (prioridade abaixo de notif/midia manual)
            if (cfg.auto && this.sponsorAtivo()) {
                var iv = this._sponsorIntervaloMs(), du = this._sponsorDuracaoMs();
                if (!this._proxSponsor) this._proxSponsor = now + iv;
                var loc = now - this._proxSponsor;
                if (loc >= 0 && loc < du) { cena = 'sponsors'; t = loc / 1000; forca = 'sponsors'; }
                else if (loc >= du) { this._proxSponsor = this.prioridadeManual() ? (now + 1000) : (now + iv); }
                else if (this.prioridadeManual()) { this._proxSponsor = now + iv; }
            } else { this._proxSponsor = 0; }
        }
        this.aplicarLayout(cena);                      // tamanho + posicao da cena
        this.publicarCena(cena);
        // cenas HTML/CSS: o PHP montou o HTML; aqui so trocamos data-cena (CSS mostra/anima).
        // as demais cenas seguem no motor canvas.
        var cenaEl = document.querySelector('.cena[data-scene="' + cena + '"]');
        var cam = this.camada();
        if (cenaEl) {
            if (cam && cam.getAttribute('data-cena') !== cena) cam.setAttribute('data-cena', cena);
            this._canvasVisivel(false);
        } else {
            if (cam && cam.getAttribute('data-cena') !== '') cam.setAttribute('data-cena', '');
            this._canvasVisivel(true);
            window.Tabela.render(t, { g: g, c: cfg, w: cv.width, h: cv.height, cena: forca });
        }
    },

    iniciarLoop: function () {
        var self = this;
        this.pararLoop();
        var passo = function (now) {
            if (!self.ativo) { self.raf = null; return; }
            self.desenhar(now);
            self.raf = requestAnimationFrame(passo);
        };
        this.raf = requestAnimationFrame(passo);
    },

    pararLoop: function () {
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = null;
    },

    /* ---------- notificacao (Fase D: desenhada no mesmo canvas do motor) ---------- */
    dispararNotif: function (tipo, texto, dur) {
        if (!window.Tabela || !window.Tabela.setNotif) return;
        window.Tabela.setNotif({ tipo: tipo, texto: texto, dur: dur || 4 });
        if (this.ativo) return;
        var self = this, cam = this.camada();
        if (cam) cam.classList.add('ativa');
        var passo = function () {
            var g = self.ctx2d(), cv = self.canvas();
            if (g && cv && window.Tabela.renderNotif) window.Tabela.renderNotif({ g: g, w: cv.width, h: cv.height });
            if (!window.Tabela.temNotif()) {
                if (cam) cam.classList.remove('ativa');
                self._notifRaf = null;
                return;
            }
            self._notifRaf = requestAnimationFrame(passo);
        };
        if (this._notifRaf) cancelAnimationFrame(this._notifRaf);
        this._notifRaf = requestAnimationFrame(passo);
    },

    limparNotif: function () {
        if (window.Tabela && window.Tabela.clearNotif) window.Tabela.clearNotif();
    },

    /* ---------- entrada ---------- */
    init: function () {
        var self = this;
        if (window.Tabela) {
            var times = this.times();
            if (times) window.Tabela.setTeams(times);
            window.Tabela.loadCrests(function () {
                if (self.ativo) self.desenhar(performance.now());
            });
        }
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
