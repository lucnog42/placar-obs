// controle/core.js — API, setEstado com fila/retry, incrementar, cronômetro, poll vivo
var Controle=window.Controle||{};
Controle.estado={};Controle.estadoCru={};Controle.ultimaVersao=0;
Controle._fila=[];Controle._enviando=false;Controle._flushTimer=null;Controle._retryTimer=null;
Controle._pollTimer=null;

Controle.status=function(t,m){var el=document.getElementById('status');if(el){el.className=t;el.textContent=m;}};

Controle.aplicarEstado=function(){
    var e=Controle.estado;
    var a=e.timeA||'Time A',b=e.timeB||'Time B';
    document.querySelectorAll('.nomeTimeA').forEach(function(el){el.innerText=a;});
    document.querySelectorAll('.nomeTimeB').forEach(function(el){el.innerText=b;});
    document.getElementById('timeA').value=e.timeA||'';document.getElementById('timeB').value=e.timeB||'';
    document.getElementById('siglaA').value=e.siglaA||'';document.getElementById('siglaB').value=e.siglaB||'';
    document.getElementById('competicao').value=e.competicao||'';document.getElementById('categoria').value=e.categoria||'';
    document.getElementById('grupo').value=e.grupo||'';document.getElementById('fase').value=e.fase||'';
    document.getElementById('data').value=e.data||'';document.getElementById('hora').value=e.hora||'';
    document.getElementById('local').value=e.local||'';
    var _cl=document.getElementById('clima');if(_cl)_cl.value=e.clima||'';
    var _ci=document.getElementById('climaIcone');if(_ci&&e.climaIcone)_ci.value=e.climaIcone;
    // Logo do torneio
    var ltp=document.getElementById('logoTorneioPreview'),ltn=document.getElementById('logoTorneioNome');
    if(e.logoTorneio){ if(ltp){ltp.src='torneios/'+e.logoTorneio;ltp.style.display='';} if(ltn)ltn.textContent=e.logoTorneio; }
    else { if(ltp)ltp.style.display='none'; if(ltn)ltn.textContent=''; }
    document.documentElement.style.setProperty('--corA',e.timeACor||'#ff0000');
    document.documentElement.style.setProperty('--corB',e.timeBCor||'#0000ff');
    document.querySelectorAll('.tema-btn').forEach(function(b){b.classList.remove('tema-ativo');});
    var tb=document.querySelector('.tema-btn[data-tema="'+(e.tema||'laliga')+'"]');if(tb)tb.classList.add('tema-ativo');
    document.querySelectorAll('.anim-btn').forEach(function(b){b.classList.remove('tema-ativo');});
    var ab=document.querySelector('.anim-btn[data-anim="'+(e.notifAnimacao||'esquerda')+'"]');if(ab)ab.classList.add('tema-ativo');
    document.querySelectorAll('.fonte-btn').forEach(function(b){b.classList.remove('tema-ativo');});
    var fb=document.querySelector('.fonte-btn[data-fonte="'+(e.fonte||'arial')+'"]');if(fb)fb.classList.add('tema-ativo');
    var exp=e.nomesExpandidos==='true';var tgb=document.getElementById('toggleNomesBtn');if(tgb)tgb.innerText=exp?'📝 Siglas':'📝 Expandir Nomes';
    var sc=parseFloat(e.placarScale)||0.65;
    document.getElementById('scaleSlider').value=sc;document.getElementById('scaleVal').textContent=sc.toFixed(2);
    document.getElementById('inputX').value=e.placarX||'50';document.getElementById('inputY').value=e.placarY||'50';
    if(Controle.carregarPenalte)Controle.carregarPenalte();if(Controle.renderMidias)Controle.renderMidias();if(Controle.renderMenuRapido)Controle.renderMenuRapido();if(Controle.renderCustomizacoes)Controle.renderCustomizacoes();if(Controle.renderJogadores)Controle.renderJogadores();if(Controle._aplicarCorButtons)Controle._aplicarCorButtons();
    var dst=document.getElementById('debugStatusToggle');
    if(dst){var v=e.mostrarStatus!=='false';dst.checked=v;
        var dsl=document.getElementById('debugStatusLabel');
        if(dsl){dsl.textContent=v?'VISIVEL':'OCULTO';dsl.style.color=v?'#4CAF50':'#888';}}
};

// ---- fila de gravação (otimista na UI, confiável na rede) ----

Controle._agendarFlush=function(ms){
    if(Controle._flushTimer)clearTimeout(Controle._flushTimer);
    Controle._flushTimer=setTimeout(Controle._flush,ms||120);
};

Controle.setEstado=function(novos){
    Object.assign(Controle.estado,novos);Controle.aplicarEstado();
    Controle._fila.push({tipo:'merge',dados:novos});
    Controle._agendarFlush();
};

Controle.incrementar=function(campo,delta){
    var at=parseInt(Controle.estado[campo])||0;
    var novo=at+delta;if(novo<0)novo=0;
    var d={};d[campo]=String(novo);
    Object.assign(Controle.estado,d);Controle.aplicarEstado();
    Controle._fila.push({tipo:'incrementar',campo:campo,delta:delta});
    Controle._agendarFlush();
};

Controle._postMerge=function(flat){
    var post=paraSecoes(flat);
    return fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(post)})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
    .then(function(d){if(d&&d.erro)throw new Error(d.erro);if(d&&typeof d.estadoVersao!=='undefined')Controle.ultimaVersao=parseInt(d.estadoVersao)||0;});
};

Controle._postIncrementar=function(campo,delta){
    return fetch(API+API_AND+'acao=incrementar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({campo:campo,delta:delta})})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
    .then(function(d){if(d&&d.erro)throw new Error(d.erro);
        if(d&&d.campos){Object.assign(Controle.estado,d.campos);Controle.aplicarEstado();}
        if(d&&typeof d.estadoVersao!=='undefined')Controle.ultimaVersao=parseInt(d.estadoVersao)||0;});
};

Controle._flush=function(){
    if(Controle._enviando||!Controle._fila.length)return;
    Controle._enviando=true;
    Controle.status('sync','↻ salvando...');
    var passo=function(){
        if(!Controle._fila.length){
            Controle._enviando=false;
            if(Controle._retryTimer)clearTimeout(Controle._retryTimer);
            Controle.status('ok','✅ Salvo');
            return;
        }
        var op=Controle._fila[0];
        var p;
        if(op.tipo==='merge'){
            var merged={};var i=0;
            while(i<Controle._fila.length&&Controle._fila[i].tipo==='merge'){
                var m=Controle._fila[i].dados;
                for(var k in m)merged[k]=m[k];
                i++;
            }
            p=Controle._postMerge(merged).then(function(){Controle._fila.splice(0,i);});
        }else{
            p=Controle._postIncrementar(op.campo,op.delta).then(function(){Controle._fila.shift();});
        }
        p.then(passo).catch(function(e){
            Controle._enviando=false;
            Controle.status('erro','❌ pendente — '+e.message);
            if(Controle._retryTimer)clearTimeout(Controle._retryTimer);
            Controle._retryTimer=setTimeout(Controle._flush,2000);
        });
    };
    passo();
};

// cronômetro: imediato (sem fila) — replay atrasado erraria o tempo de start/pause
Controle.cronometro=function(op,valor){
    var body={op:op};
    if(typeof valor!=='undefined')body.valor=valor;
    fetch(API+API_AND+'acao=cronometro',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
    .then(function(d){
        if(d&&d.erro){Controle.status('erro','❌ '+d.erro);return;}
        if(d&&d.campos){Object.assign(Controle.estado,d.campos);}
        if(d&&typeof d.estadoVersao!=='undefined')Controle.ultimaVersao=parseInt(d.estadoVersao)||0;
        Controle.aplicarEstado();
        Controle.status('ok','✅ Salvo');
    })
    .catch(function(e){Controle.status('erro','❌ Cronômetro — '+e.message);});
};

// ---- poll vivo (?v=N): vê mudanças de outra sessão sem clobberar edição ----

Controle.sincronizar=function(){
    var ctl=(typeof AbortController!=='undefined')?new AbortController():null;
    var timer=ctl?setTimeout(function(){ctl.abort();},3000):null;
    var t0=Date.now();
    fetch(API+API_AND+'v='+Controle.ultimaVersao,ctl?{signal:ctl.signal}:{})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
    .then(function(data){
        if(timer)clearTimeout(timer);
        if(Controle.updateDebugPing)Controle.updateDebugPing(Date.now()-t0);
        if(data._same)return;
        var nv=parseInt(data.estadoVersao)||0;
        if(nv<=Controle.ultimaVersao)return;
        // mudou remotamente: só aplica se o operador não estiver digitando
        var ae=document.activeElement;
        if(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.tagName==='SELECT')){
            return; // tenta de novo no próximo ciclo
        }
        Controle.estadoCru=data;Controle.estado=buildFlat(data);
        Controle.ultimaVersao=nv;
        Controle.aplicarEstado();
        Controle.status('ok','✅ Atualizado');
    })
    .catch(function(e){if(timer)clearTimeout(timer);})
    .then(function(){
        Controle._pollTimer=setTimeout(Controle.sincronizar,1500);
    });
};

Controle.init=function(){
    Controle._listeners={};
    Controle.on=function(evento,fn){EventBus.on.call(Controle,evento,fn);};
    Controle.emit=function(evento,dados){EventBus.emit.call(Controle,evento,dados);};
    Controle.sincronizar();
};
