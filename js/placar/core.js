// placar/core.js — polling encadeado, diff, orquestração, relógio do servidor
var Placar=window.Placar||{};
Placar.estado={};Placar.estadoCru={};Placar.ultimoEstadoCru={};
Placar.ultimaVersao=0;Placar.segundos=0;
Placar.ultimaNotifId=null;
Placar.offsetMs=0;
Placar._syncEmAndamento=false;
Placar._syncTimer=null;
Placar._ultimoOk=0;

// Atachar EventBus
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
    if(Placar.secaoMudou('basquete')){Placar.emit('basquete:changed',Placar.estadoCru.basquete);}
};

Placar._setStatus=function(texto,classe){
    var el=document.getElementById('status');
    if(!el)return;
    el.textContent=texto;
    el.className=classe||'';
};

// sincroniza uma vez; agenda a próxima (loop encadeado — não acumula requisições)
Placar.sincronizar=function(){
    if(Placar._syncEmAndamento)return;
    Placar._syncEmAndamento=true;
    var ctl=(typeof AbortController!=='undefined')?new AbortController():null;
    var timer=ctl?setTimeout(function(){ctl.abort();},3000):null;
    fetch(API+API_AND+'v='+Placar.ultimaVersao,ctl?{signal:ctl.signal}:{})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
    .then(function(data){
        if(timer)clearTimeout(timer);
        Placar._ultimoOk=Date.now();
        if(data._same){Placar._setStatus('● v'+Placar.ultimaVersao);return;}
        var nv=parseInt(data.estadoVersao)||0;
        if(nv<Placar.ultimaVersao){return;} // resposta antiga/fora de ordem: descarta
        Placar.ultimaVersao=nv;
        if(typeof data._ts==='number'){Placar.offsetMs=data._ts-Date.now();}
        Placar.estadoCru=data;
        Placar.estado=buildFlat(data);
        Placar.aplicarEstado();
        Placar.ultimoEstadoCru=JSON.parse(JSON.stringify(data));
        Placar._setStatus('● v'+nv);
    })
    .catch(function(e){
        if(timer)clearTimeout(timer);
        var nome=(e&&e.name==='AbortError')?'timeout':(e&&e.message);
        Placar._setStatus('x '+nome);
    })
    .then(function(){
        if(Placar._ultimoOk && Date.now()-Placar._ultimoOk>10000){
            Placar._setStatus('⚠ sem conexão','congelado');
        }
        Placar._syncEmAndamento=false;
        var atraso=(Placar._ultimoOk&&Date.now()-Placar._ultimoOk>10000)?2000:500;
        Placar._syncTimer=setTimeout(Placar.sincronizar,atraso);
    });
};

Placar.init=function(){
    Placar._setStatus('⏳ carregando...');
    Placar.sincronizar();
};
