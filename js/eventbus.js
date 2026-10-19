// eventbus.js — pub/sub minimo, compartilhado Placar + Controle
var EventBus = {
    _listeners: {},

    // Registrar listener para um evento
    on: function(evento, fn) {
        if (!this._listeners[evento]) this._listeners[evento] = [];
        this._listeners[evento].push(fn);
    },

    // Remover listener especifico
    off: function(evento, fn) {
        var arr = this._listeners[evento];
        if (arr) this._listeners[evento] = arr.filter(function(f) { return f !== fn; });
    },

    // Emitir evento para todos os listeners registrados
    emit: function(evento, dados) {
        var arr = this._listeners[evento];
        if (arr) {
            for (var i = 0; i < arr.length; i++) {
                arr[i](dados);
            }
        }
    }
};
