// placar/patrocinio.js — cena de patrocinadores em HTML (o PHP monta, aqui so preenchemos)
var Placar = window.Placar || {};

Placar.Patrocinio = {
  _chave: '',

  /* nomes em sp1..sp30 (aba Torneio), na ordem */
  nomes: function () {
    var e = Placar.estado || {}, out = [];
    for (var i = 1; i <= 30; i++) { if (e['sp' + i]) out.push(String(e['sp' + i])); }
    return out;
  },

  /* escreve rotulo + ate 3 logos nos slots; guarda a chave para nao repetir trabalho */
  aplicar: function () {
    var e = Placar.estado || {};
    var nomes = this.nomes();
    var chave = nomes.join('|') + '|' + (e.spText || '');
    if (chave === this._chave) return;
    this._chave = chave;

    var lab = document.getElementById('spLabel');
    if (lab) lab.textContent = String(e.spText || 'PATROCINADORES').toUpperCase();

    var slots = document.querySelectorAll('#spGrade .sp-slot');
    for (var k = 0; k < slots.length; k++) {
      var slot = slots[k];
      var img = slot.querySelector('.sp-img');
      var nome = nomes[k] || '';
      if (slot.classList) slot.classList.toggle('com-logo', !!nome);
      if (!img) continue;
      if (nome) {
        var src = DADOS + 'torneios/' + encodeURIComponent(nome);
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        img.setAttribute('alt', nome);
      } else {
        img.removeAttribute('src');
        img.setAttribute('alt', '');
      }
    }

    var vazio = document.getElementById('spVazio');
    if (vazio) vazio.style.display = nomes.length ? 'none' : '';
    var grade = document.getElementById('spGrade');
    if (grade) grade.style.display = nomes.length ? '' : 'none';
  }
};

/* o estado pode chegar antes deste arquivo: tenta agora e depois nas trocas */
try { Placar.Patrocinio.aplicar(); } catch (e) { }
