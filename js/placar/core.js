// placar/core.js — polling, diff, orquestração
var Placar=window.Placar||{};
Placar.estado={};Placar.estadoCru={};Placar.ultimoEstadoCru={};
Placar.ultimaVersao=0;Placar.segundos=0;Placar.ultimoTempoServidor=null;
Placar.ultimaNotifId=null;

// Atachar EventBus (Placar._listeners necessario: EventBus.on.call usa this=Placar)
Placar._listeners={};
Placar.on=function(evento,fn){EventBus.on.call(Placar,evento,fn);};
Placar.emit=function(evento,dados){EventBus.emit.call(Placar,evento,dados);};

Placar.secaoMudou=function(s){return JSON.stringify(Placar.estadoCru[s])!==JSON.stringify((Placar.ultimoEstadoCru||{})[s]||{});};

Placar.aplicarEstado=function(){
    if(Placar.secaoMudou('placar')){Placar.emit('placar:changed',Placar.estadoCru.placar);}
    if(Placar.secaoMudou('times')){Placar.emit('times:changed',Placar.estadoCru.times);}
    if(Placar.secaoMudou('estilo')){Placar.emit('estilo:changed',Placar.estadoCru.estilo);}
    if(Placar.secaoMudou('posicao')){Placar.emit('posicao:changed',Placar.estadoCru.posicao);}
    if(Placar.secaoMudou('midia')){Placar.emit('midia:changed',Placar.estadoCru.midia);}
    if(Placar.secaoMudou('penaltes')){Placar.emit('penaltes:changed',Placar.estadoCru.penaltes);}
    if(Placar.secaoMudou('notif')){Placar.emit('notif:changed',Placar.estadoCru.notif);}
    if(Placar.secaoMudou('tabela')){Placar.emit('tabela:changed',Placar.estadoCru.tabela);}
};

Placar.sincronizar=async function(forcar){
    try{
        var url=forcar?API:API+'?v='+Placar.ultimaVersao;
        var r=await fetch(url);
        if(!r.ok)throw new Error(r.status);
        var data=await r.json();
        if(data._same){document.getElementById('status').textContent='● v'+Placar.ultimaVersao;return;}
        Placar.estadoCru=data;
        Placar.estado=buildFlat(data);
        Placar.ultimaVersao=parseInt(data.estadoVersao)||0;
        Placar.aplicarEstado();
        Placar.ultimoEstadoCru=JSON.parse(JSON.stringify(data));
        document.getElementById('status').textContent='● v'+Placar.ultimaVersao;
    }catch(e){document.getElementById('status').textContent='x '+e.message}
};


Placar.init=function(){
    document.getElementById('status').textContent='⏳ carregando...';Placar.sincronizar(true);
    setInterval(function(){Placar.sincronizar(false);},500);
    // tick via setInterval em js/placar/timer.js (componente autocontido)
};
