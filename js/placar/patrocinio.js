// placar/patrocinio.js — patrocinadores como lower third: um logo por vez, com transicao.
// O PHP monta a faixa; aqui so trocamos a imagem/nome e dizemos qual esta no ar.
var Placar = window.Placar || {};

Placar.Patrocinio = {
  _nomes: [],
  _i: 0,
  _timer: null,
  _tTroca: null,
  _chave: '',

  /* logos em sp1..sp30 (aba Patrocinadores), na ordem */
  nomes: function () {
    var e = Placar.estado || {}, out = [];
    for (var i = 1; i <= 30; i++) { if (e['sp' + i]) out.push(String(e['sp' + i])); }
    return out;
  },

  /* nome amigavel a partir do arquivo (estadio_do_grupo.png -> estadio do grupo) */
  _nomeAmigo: function (arq) {
    return String(arq || '').replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  },

  /* escreve o patrocinador da vez */
  _pintar: function (idx) {
    var faixa = document.getElementById('spFaixa');
    var img = document.getElementById('spImg');
    var cena = document.querySelector('.cena-sponsors');
    var nomeEl = document.getElementById('spNome');
    var nomes = this._nomes;

    if (!nomes.length) {
      if (faixa) faixa.classList.add('vazio');
      if (cena) cena.classList.add('sem-sponsor');
      if (img) img.removeAttribute('src');
      if (nomeEl) nomeEl.textContent = '';
      return;
    }
    if (faixa) faixa.classList.remove('vazio');
    if (cena) cena.classList.remove('sem-sponsor');

    var nome = nomes[idx] || nomes[0];
    if (img) {
      var src = DADOS + 'torneios/' + encodeURIComponent(nome);
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      img.setAttribute('alt', this._nomeAmigo(nome));
    }
    if (nomeEl) nomeEl.textContent = this._nomeAmigo(nome);

    var lab = document.getElementById('spLabel');
    if (lab) lab.textContent = String((Placar.estado || {}).spText || 'PATROCINADORES').toUpperCase();
  },

  /* troca para o proximo com a transicao do CSS (.trocando) */
  _proximo: function () {
    var self = this;
    if (this._nomes.length < 2) return;
    var faixa = document.getElementById('spFaixa');
    this._i = (this._i + 1) % this._nomes.length;
    if (!faixa) return;
    faixa.classList.add('trocando');
    clearTimeout(this._tTroca);
    this._tTroca = setTimeout(function () {
      self._pintar(self._i);
      faixa.classList.remove('trocando');
    }, 270);
  },

  /* chamado pelo overlay a cada troca de cena (a cada 200 ms) */
  cena: function (k) {
    if (k === 'sponsors') this.iniciar();
    else this.parar();
  },

  iniciar: function () {
    this._nomes = this.nomes();
    if (!this._nomes.length) { this._pintar(0); return; }
    var rodando = !!this._timer;
    if (!rodando) { this._i = 0; this._pintar(0); }
    if (rodando || this._nomes.length < 2) return;

    // a duracao do painel e do bloco inteiro: divide entre os patrocinadores
    var dur = parseInt((Placar.estado || {}).sponsorsDuracao, 10) || 8;
    var passo = Math.max(2, Math.round(dur / this._nomes.length));
    var self = this;
    this._timer = setInterval(function () { self._proximo(); }, passo * 1000);
  },

  parar: function () {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    clearTimeout(this._tTroca);
    var faixa = document.getElementById('spFaixa');
    if (faixa) faixa.classList.remove('trocando');
  },

  /* estado mudou (logo novo, texto, outra ordem) */
  aplicar: function () {
    var nomes = this.nomes();
    var chave = nomes.join('|') + '|' + String((Placar.estado || {}).spText || '');
    if (chave === this._chave) return;
    this._chave = chave;
    this._nomes = nomes;
    if (this._i >= nomes.length) this._i = 0;
    this._pintar(this._i);
    if (this._timer && nomes.length < 2) this.parar();
  }
};

/* o estado pode chegar antes deste arquivo: tenta agora e depois nas trocas */
try { Placar.Patrocinio.aplicar(); } catch (e) { }
