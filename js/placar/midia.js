// placar/midia.js — multiplas midias ativas, timer individual por midia, ciclos independentes
// Inclui midias de TEXTO (notificacoes do repertorio): usam o mesmo elemento de
// notificacao do placar, com duracao/transicao proprias.
var Placar=window.Placar||{};
Placar._timers={};       // { id: { timer: timeoutId, intervalo: timeoutId } }
Placar._ativasAnterior=[];
Placar._notifAtual=null; // id da midia de texto em exibicao
Placar._disparoSeq=null;

Placar.getMidias=function(){try{return JSON.parse(Placar.estado.midias||'[]');}catch(e){return[];}};
Placar.getAtivas=function(){try{return JSON.parse(Placar.estado.midiasAtivas||'[]');}catch(e){return[];}};
Placar.getMidia=function(id){var l=Placar.getMidias();for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];return null;};

Placar.preCacheMidias=function(){
    var camada=document.getElementById('camadaMidia');
    if(!camada)return;
    var midias=Placar.getMidias();
    midias.forEach(function(m){
        if(m.tipo==='texto')return;                       // texto nao tem arquivo
        if(camada.querySelector('[data-midia-id="'+m.id+'"]'))return;
        var el;
        if(m.tipo==='video'){el=document.createElement('video');el.src=m.src;el.autoplay=false;el.loop=false;el.muted=true;el.playsInline=true;el.preload='auto';}
        else{el=document.createElement('img');el.src=m.src;}   // gif anima igual a imagem
        el.setAttribute('data-midia-id',m.id);el.classList.add('precache');camada.appendChild(el);
    });
    var ids=midias.map(function(m){return m.id;});
    camada.querySelectorAll('[data-midia-id]').forEach(function(el){if(!ids.includes(el.getAttribute('data-midia-id')))el.remove();});
};

// Cancelar timers de uma midia especifica
Placar._cancelar=function(id){
    var t=Placar._timers[id];
    if(!t)return;
    if(t.timer){clearTimeout(t.timer);}
    if(t.intervalo){clearTimeout(t.intervalo);}
    delete Placar._timers[id];
};

/* ---------- midias de texto (notificacoes) ---------- */
Placar._mostrarTexto=function(m){
    // Fase D: notificacao desenhada no motor/canvas da tabela (mesmo tema)
    if(window.Tabela && Placar.Tabela && Placar.Tabela.dispararNotif){
        Placar._notifAtual=m.id;
        Placar.Tabela.dispararNotif(m.notif||'gol', m.texto||'', parseInt(m.duracao)||4);
        return;
    }
    var box=document.getElementById('notificacao');
    if(!box)return;
    var tipo=m.notif||'gol';
    var c=tipo==='gol'?(m.texto||'GOL!'):
          tipo==='amarelo'?('\u{1F7E8} '+(m.texto||'')):
          tipo==='vermelho'?('\u{1F7E5} '+(m.texto||'')):
          tipo==='substituicao'?('\u{1F501} '+(m.texto||'')):(m.texto||'');
    ['notifText','notifText2','notifText3','notifText4'].forEach(function(i){
        var e=document.getElementById(i);if(e)e.innerText=c;
    });
    box.classList.remove('gol','amarelo','vermelho');box.classList.add(tipo);
    var track=document.getElementById('notifTrack');
    if(track){track.style.animation='none';void track.offsetWidth;track.style.animation='';}
    box.classList.add('show');box.classList.remove('hidden');
    Placar._notifAtual=m.id;
};

Placar._esconderTexto=function(id){
    if(Placar._notifAtual!==id)return;
    var box=document.getElementById('notificacao');
    Placar._notifAtual=null;
    if(Placar.Tabela && Placar.Tabela.limparNotif)Placar.Tabela.limparNotif();
    if(!box)return;
    box.classList.remove('show');
    setTimeout(function(){if(!Placar._notifAtual)box.classList.add('hidden');},400);
};

// Desligar uma midia com transicao de saida
Placar._desligar=function(id,cb){
    var camada=document.getElementById('camadaMidia');
    var el=camada?camada.querySelector('[data-midia-id="'+id+'"].ativo'):null;
    Placar._cancelar(id);
    if(Placar._notifAtual===id){Placar._esconderTexto(id);if(cb)cb();return;}
    if(!el){if(cb)cb();return;}
    var trans=camada.getAttribute('data-transicao')||'fade';
    el.classList.remove('entrando');el.classList.add('saindo');
    var dur=trans==='none'?0:350;
    setTimeout(function(){
        el.classList.remove('ativo','saindo');
        if(el.tagName==='VIDEO'){el.pause();el.currentTime=0;el.loop=false;}
        if(cb)cb();
    },dur);
};

// Ativar uma midia (sem delay — usado pelo ciclo); fila=true toca sem ciclo individual
Placar._ativar=function(id, fila){
    var midias=Placar.getMidias();var m=midias.find(function(x){return x.id===id;});
    if(!m)return;
    if(m.tipo==='cena'){ if(Placar.Tabela && Placar.Tabela.mostrarCena) Placar.Tabela.mostrarCena(m.cena, m.duracao); return; }
    var dur=parseInt(m.duracao)||0;
    if(m.tipo==='texto'){
        Placar._mostrarTexto(m);
        if(dur>0){
            if(!Placar._timers[id])Placar._timers[id]={};
            Placar._timers[id].timer=setTimeout(function(){Placar._desligarCiclo(id);},dur*1000);
        }
        return;
    }
    var camada=document.getElementById('camadaMidia');
    if(!camada)return;
    var el=camada.querySelector('[data-midia-id="'+id+'"]');
    if(!el)return;
    var trans=m.transicao||'fade';camada.setAttribute('data-transicao',trans);
    if(m.tipo==='video'){el.autoplay=true;el.loop=!fila;el.currentTime=0;el.play().catch(function(){});}
    if(trans==='none'){el.classList.add('ativo');}
    else{el.classList.add('ativo','entrando');setTimeout(function(){el.classList.remove('entrando');},400);}
    if(dur>0 && !fila){
        if(!Placar._timers[id])Placar._timers[id]={};
        Placar._timers[id].timer=setTimeout(function(){Placar._desligarCiclo(id);},dur*1000);
    }
};

// Desligar via ciclo e agendar reativacao
Placar._desligarCiclo=function(id){
    Placar._desligar(id,function(){
        var ativas=Placar.getAtivas();
        if(!ativas.includes(id))return;
        var midias=Placar.getMidias();var m=midias.find(function(x){return x.id===id;});
        if(!m)return;
        var intervalo=parseInt(m.intervalo)||0;
        if(intervalo>0){
            if(!Placar._timers[id])Placar._timers[id]={};
            Placar._timers[id].intervalo=setTimeout(function(){Placar._reativar(id);},intervalo*1000);
        }
    });
};

// Reativar apos intervalo
Placar._reativar=function(id){
    var ativas=Placar.getAtivas();
    if(!ativas.includes(id))return;
    Placar._ativar(id);
};

/* disparo avulso de uma midia (botao "Enviar" das notificacoes) */
Placar._checarDisparo=function(){
    var seq=Placar.estado.midiaDisparoSeq;
    if(!seq||seq===Placar._disparoSeq)return;
    Placar._disparoSeq=seq;
    var m=Placar.getMidia(Placar.estado.midiaDisparoId);
    if(!m)return;
    Placar._ativar(m.id);                       // mostra uma vez, pela duracao da midia
};

// Fila de reprodução real: as mídias ativas tocam em sequência (uma por vez), na ordem
// do repertório, repetindo no fim. Texto/cena não entram na fila (são one-shot).
Placar._filaIdx = -1;
Placar._filaTimer = null;
Placar._filaId = null;

Placar._filaLista=function(){
    var midias=Placar.getMidias(), ativas=Placar.getAtivas(), out=[];
    for(var i=0;i<midias.length;i++){
        var m=midias[i];
        if(ativas.indexOf(m.id)>=0 && m.tipo!=='texto' && m.tipo!=='cena') out.push(m);
    }
    return out;
};

Placar._filaDuracao=function(m){
    var d=parseInt(m.duracao)||0;
    if(d>0)return d;
    var cam=document.getElementById('camadaMidia');
    var el=cam?cam.querySelector('[data-midia-id="'+m.id+'"]'):null;
    if(el && el.tagName==='VIDEO' && el.duration && isFinite(el.duration)) return Math.max(1, el.duration);
    return 8;
};

Placar._filaTocar=function(i){
    var fila=Placar._filaLista();
    if(!fila.length){ Placar._filaParar(); return; }
    i=((i%fila.length)+fila.length)%fila.length;
    Placar._filaIdx=i;
    var m=fila[i];
    if(Placar._filaId && Placar._filaId!==m.id) Placar._desligar(Placar._filaId);
    Placar._filaId=m.id;
    Placar._ativar(m.id, true);                       // mostra sem ciclo individual
    var dur=Placar._filaDuracao(m), gap=parseInt(m.intervalo)||0;
    clearTimeout(Placar._filaTimer);
    Placar._filaTimer=setTimeout(function(){ Placar._filaTocar(i+1); }, (dur+gap)*1000);
};

Placar._filaParar=function(){
    clearTimeout(Placar._filaTimer); Placar._filaTimer=null;
    if(Placar._filaId){ Placar._desligar(Placar._filaId); Placar._filaId=null; }
    Placar._filaIdx=-1;
};

// Sincronizar estado da fila: recomeça do zero se a lista/ordem mudou
Placar.carregarMidias=function(){
    var fila=Placar._filaLista();
    if(!fila.length){ Placar._filaParar(); return; }
    var ok = Placar._filaIdx>=0 && Placar._filaIdx<fila.length && fila[Placar._filaIdx].id===Placar._filaId;
    if(!ok) Placar._filaTocar(0);
};

// --- Listeners ---
Placar.on('midia:changed',function(){Placar.preCacheMidias();Placar.carregarMidias();Placar._checarDisparo();});
