Controle.init();
Controle.placarUrl = function(){ return 'placar.php' + ((typeof INSTANCIA !== 'undefined' && INSTANCIA) ? ('?i=' + encodeURIComponent(INSTANCIA)) : ''); };
var _pf = document.getElementById('previewFrame'); if (_pf) _pf.src = Controle.placarUrl();
setTimeout(function(){ Controle.listarInstancias(); }, 600);
setTimeout(function(){ Controle.resizePreview(); }, 500);
setTimeout(function(){ Controle.listarPresets(); }, 800);
setTimeout(function(){ Controle.listarEscudos(); }, 800);
setTimeout(function(){ Controle.listarCsvs('tabela'); Controle.listarCsvs('jogadores'); }, 800);
setTimeout(function(){ Controle.listarCores(); }, 800);
setTimeout(function(){ Controle.atualizarNomePreset(); }, 900);
setTimeout(function(){ Controle.recarregarLogos(); }, 1000);
setTimeout(function(){ Controle.listarLogos(); }, 1000);
setTimeout(function(){ Controle.syncSponsors(); }, 1000);
setTimeout(function(){ Controle.renderCustomizacoes(); Controle.renderMenuRapido(); Controle.renderTimesNotif(); }, 1000);
setTimeout(function(){ Controle.carregarGrupos('escudos'); Controle.carregarGrupos('logos'); Controle.carregarGrupos('cores'); Controle.carregarGrupos('csvs_tabela'); Controle.carregarGrupos('csvs_jogadores'); }, 1100);

/* Monkey-patch setEstado AFTER init (garantido que existe) */
var _origSetEstado = Controle.setEstado;
Controle.setEstado = function() {
  Controle.incrementarDebugContador();
  return _origSetEstado.apply(this, arguments);
};

/* Hook status() to capture polling log + ping */
var _origStatus = Controle.status;
Controle.status = function(t, m) {
  var now = new Date().toTimeString().slice(0,8);
  Controle.addDebugLog(now + ' [' + t + '] ' + (m || ''));
  return _origStatus.apply(this, arguments);
};

console.log('[DEBUG] Monkey-patches aplicados. setEstado=' + typeof Controle.setEstado);
