// placar/patrocinio.js — patrocinadores como lower third: um logo por vez, com transicao.
// O PHP monta a faixa; aqui so trocamos a imagem/nome e dizemos qual esta no ar.
// O nome exibido vem do campo de texto do painel (spNomes); NUNCA do nome do arquivo.
var Placar = window.Placar || {};

Placar.Patrocinio = {
  _itens: [],      // [{arq, slot, nome}]
  _i: 0,
  _timer: null,
  _tTroca: null,
  _chave: '',

  /* nomes digitados no painel: {"1":"NG3 Midia", "2":"..."} (chave = numero do slot) */
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

  /* escreve o patrocinador da vez (idx) */
  _pintar: function (idx) {
    var faixa = document.getElementById('spFaixa');
    var img = document.getElementById('spImg');
    var cena = document.querySelector('.cena-sponsors');
    var nomeEl = document.getElementById('spNome');
    var itens = this._itens;

    if (!itens.length) {
      if (faixa) { faixa.classList.add('vazio'); faixa.classList.remove('sem-nome'); }
      if (cena) cena.classList.add('sem-sponsor');
      if (img) img.removeAttribute('src');
      if (nomeEl) nomeEl.textContent = '';
      return;
    }
    if (faixa) faixa.classList.remove('vazio');
    if (cena) cena.classList.remove('sem-sponsor');

    var it = itens[idx] || itens[0];
    if (img) {
      var src = DADOS + 'torneios/' + it.arq;
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      img.setAttribute('alt', it.nome || 'patrocinador');
    }
    // sem nome digitado nao mostra texto nenhum (nada de nome de arquivo)
    if (faixa) faixa.classList[it.nome ? 'remove' : 'add']('sem-nome');
    if (nomeEl) nomeEl.textContent = it.nome || '';

    var lab = document.getElementById('spLabel');
    if (lab) lab.textContent = String((Placar.estado || {}).spText || 'PATROCINADORES').toUpperCase();
  },

  /* troca para o proximo: sai pela direita e volta pela direita com o novo */
  _proximo: function () {
    var self = this;
    if (this._itens.length < 2) return;
    var faixa = document.getElementById('spFaixa');
    this._i = (this._i + 1) % this._itens.length;
    if (!faixa) return;
    clearTimeout(this._tTroca);
    faixa.classList.add('trocando');            // CSS: desliza para a direita e some
    this._tTroca = setTimeout(function () {
      self._pintar(self._i);                    // troca o conteudo ainda invisivel
      faixa.classList.remove('trocando');       // volta entrando pela direita
    }, 300);
  },

  /* chamado pelo overlay a cada troca de cena (a cada 200 ms) */
  cena: function (k) {
    if (k === 'sponsors') this.iniciar();
    else this.parar();
  },

  iniciar: function () {
    this._itens = this.itens();
    if (!this._itens.length) { this._pintar(0); return; }
    var rodando = !!this._timer;
    if (!rodando) { this._i = 0; this._pintar(0); }
    if (rodando || this._itens.length < 2) return;

    // a duracao do painel e do bloco inteiro: divide entre os patrocinadores
    var dur = parseInt((Placar.estado || {}).sponsorsDuracao, 10) || 8;
    var passo = Math.max(2, Math.round(dur / this._itens.length));
    var self = this;
    this._timer = setInterval(function () { self._proximo(); }, passo * 1000);
  },

  parar: function () {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    clearTimeout(this._tTroca);
    var faixa = document.getElementById('spFaixa');
    if (faixa) faixa.classList.remove('trocando');
  },

  /* estado mudou (logo novo, nome digitado, outro texto) */
  aplicar: function () {
    var itens = this.itens();
    var chave = itens.map(function (x) { return x.slot + ':' + x.arq + ':' + x.nome; }).join('|')
      + '|' + String((Placar.estado || {}).spText || '');
    if (chave === this._chave) return;
    this._chave = chave;
    this._itens = itens;
    if (this._i >= itens.length) this._i = 0;
    this._pintar(this._i);
    if (this._timer && itens.length < 2) this.parar();
  }
};

/* o estado pode chegar antes deste arquivo: tenta agora e depois nas trocas */
try { Placar.Patrocinio.aplicar(); } catch (e) { }
