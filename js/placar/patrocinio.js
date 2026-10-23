// placar/patrocinio.js — patrocinadores como lower third INDEPENDENTE do overlay.
// A camada #camadaSponsors fica fora do #camadaTabela: roda sozinha, com o overlay
// ligado ou desligado. Aqui mora o loop (aparece / troca / esconde) e o nome exibido,
// que vem do campo de texto do painel (spNomes) — nunca do nome do arquivo.
var Placar = window.Placar || {};

Placar.Patrocinio = {
  _itens: [],        // [{arq, slot, nome}]
  _i: 0,
  _chave: '',
  _mostrando: false,
  _prox: 0,          // quando o proximo bloco comeca
  _fim: 0,           // quando o bloco atual termina
  _tRot: null,       // rotacao dos logos dentro do bloco
  _tTroca: null,
  _TROCA_MS: 420,    // tempo do card sair pela direita (casa com o CSS)

  /* nomes digitados no painel: {"1":"NG3 Midia"} (chave = numero do slot) */
  _mapa: function () {
    var s = (Placar.estado || {}).spNomes, o = null;
    if (typeof s === 'string' && s) { try { o = JSON.parse(s); } catch (e) { o = null; } }
    else if (s && typeof s === 'object') o = s;
    return (o && typeof o === 'object') ? o : {};
  },

  /* logos em sp1..sp30, na ordem dos slots */
  itens: function () {
    var e = Placar.estado || {}, mapa = this._mapa(), out = [];
    for (var i = 1; i <= 30; i++) {
      if (!e['sp' + i]) continue;
      out.push({ arq: String(e['sp' + i]), slot: i, nome: String(mapa[i] || '').trim() });
    }
    return out;
  },
  _chaveDe: function (itens) {
    return itens.map(function (x) { return x.slot + ':' + x.arq + ':' + x.nome; }).join('|')
      + '|' + String((Placar.estado || {}).spText || '');
  },

  /* ---------- tempos (painel) ---------- */
  _ativo: function () { return String((Placar.estado || {}).sponsorsAtivo) === 'true'; },
  _ivMs: function () {
    var v = parseInt((Placar.estado || {}).sponsorsIntervalo, 10);
    if (isNaN(v)) v = 60;
    if (v < 5) v = 5;
    return Math.round(v * 1000);
  },
  /* tempo de cada patrocinador = 4x a fracao do bloco (duracao / nº logos), minimo 8 s */
  _porLogoMs: function (n) {
    var dur = parseInt((Placar.estado || {}).sponsorsDuracao, 10);
    if (isNaN(dur) || dur < 1) dur = 8;
    var base = Math.round(dur / Math.max(1, n));
    return Math.max(8, base * 4) * 1000;
  },

  /* ---------- pintura ---------- */
  _pintar: function (idx) {
    var img = document.getElementById('spImg');
    var faixa = document.getElementById('spFaixa');
    var nomeEl = document.getElementById('spNome');
    var itens = this._itens;
    if (img) img.removeAttribute('src');
    if (nomeEl) nomeEl.textContent = '';
    if (!itens.length) return;

    var it = itens[idx] || itens[0];
    if (img) {
      img.setAttribute('src', DADOS + 'torneios/' + it.arq);
      img.setAttribute('alt', it.nome || 'patrocinador');
    }
    // sem nome digitado nao mostra texto nenhum (nada de nome de arquivo)
    if (faixa) faixa.classList[it.nome ? 'remove' : 'add']('sem-nome');
    if (nomeEl) nomeEl.textContent = it.nome || '';
    var lab = document.getElementById('spLabel');
    if (lab) lab.textContent = String((Placar.estado || {}).spText || 'PATROCINADORES').toUpperCase();
  },

  /* troca de patrocinador: o card inteiro sai pela direita e volta pela direita */
  _proximo: function () {
    var self = this;
    if (this._itens.length < 2) return;
    var faixa = document.getElementById('spFaixa');
    this._i = (this._i + 1) % this._itens.length;
    if (!faixa) { this._pintar(this._i); return; }
    clearTimeout(this._tTroca);
    faixa.classList.add('trocando');
    this._tTroca = setTimeout(function () {
      self._pintar(self._i);
      faixa.classList.remove('trocando');
    }, this._TROCA_MS);
  },

  /* ---------- bloco: aparece, gira, esconde ---------- */
  _mostrar: function (now, du) {
    var cam = document.getElementById('camadaSponsors');
    this._mostrando = true;
    this._fim = now + du;
    this._i = 0;
    this._pintar(0);
    if (cam) cam.classList.add('on');
    this._startRot();
  },
  _esconder: function () {
    var cam = document.getElementById('camadaSponsors');
    this._mostrando = false;
    this._stopRot();
    if (cam) cam.classList.remove('on');
  },
  _startRot: function () {
    this._stopRot();
    if (this._itens.length < 2) return;
    var self = this, passo = this._porLogoMs(this._itens.length);
    this._tRot = setInterval(function () { self._proximo(); }, passo);
  },
  _stopRot: function () {
    if (this._tRot) { clearInterval(this._tRot); this._tRot = null; }
    clearTimeout(this._tTroca);
    var faixa = document.getElementById('spFaixa');
    if (faixa) faixa.classList.remove('trocando');
  },

  /* ---------- loop (roda sempre, nao depende do overlay) ---------- */
  _tique: function () {
    var now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    var cam = document.getElementById('camadaSponsors');
    if (!cam) return;

    // estado mudou (logo, nome, texto) -> repinta sem esperar o proximo bloco
    var itens = this.itens(), chave = this._chaveDe(itens);
    if (chave !== this._chave) {
      this._chave = chave;
      this._itens = itens;
      if (this._i >= itens.length) this._i = 0;
      if (this._mostrando) this._pintar(this._i);
    }

    if (!this._ativo() || !this._itens.length) {
      if (this._mostrando) this._esconder();
      this._prox = 0;
      cam.classList.remove('on');
      return;
    }
    // primeiro bloco logo depois de ligar (no maximo 5 s), depois a cada intervalo
    if (!this._prox) this._prox = now + Math.min(this._ivMs(), 5000);
    var du = this._porLogoMs(this._itens.length) * this._itens.length;
    if (!this._mostrando) {
      if (now >= this._prox) this._mostrar(now, du);
    } else if (now >= this._fim) {
      this._esconder();
      this._prox = now + this._ivMs();
    }
  },

  /* compatibilidade: estado mudou -> repinta agora */
  aplicar: function () {
    var itens = this.itens(), chave = this._chaveDe(itens);
    if (chave === this._chave) return;
    this._chave = chave;
    this._itens = itens;
    if (this._i >= itens.length) this._i = 0;
    if (this._mostrando) this._pintar(this._i);
  },

  /* o overlay pode estar desligado; a camada roda por conta propria */
  iniciar: function () { this._tique(); }
};

/* loop fixo: 400 ms e barato e independe da cena do overlay */
setInterval(function () { try { Placar.Patrocinio._tique(); } catch (e) { } }, 400);
try { Placar.Patrocinio._tique(); } catch (e) { }
