// controle/core.js — API, setEstado, aplicarEstado
var Controle=window.Controle||{};
Controle.estado={};Controle.estadoCru={};Controle.ultimaVersao=0;

Controle.status=function(t,m){var el=document.getElementById('status');el.className=t;el.textContent=m;};

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
    var ltp=document.getElementById('logoTorneioPreview'),lts=document.getElementById('logoTorneio');
    if(lts&&e.logoTorneio){lts.value=e.logoTorneio;if(ltp){ltp.src='torneios/'+e.logoTorneio;ltp.style.display='';}}
    else if(lts){lts.value='';if(ltp)ltp.style.display='none';}
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
    if(Controle.carregarPenalte)Controle.carregarPenalte();if(Controle.renderMidias)Controle.renderMidias();
    var dst=document.getElementById('debugStatusToggle');
    if(dst){var v=e.mostrarStatus!=='false';dst.checked=v;
        var dsl=document.getElementById('debugStatusLabel');
        if(dsl){dsl.textContent=v?'VISIVEL':'OCULTO';dsl.style.color=v?'#4CAF50':'#888';}}
};

Controle.carregarEstado=async function(){
    try{var r=await fetch(API);if(!r.ok)throw new Error(r.status);
        Controle.estadoCru=await r.json();Controle.estado=buildFlat(Controle.estadoCru);
        Controle.aplicarEstado();Controle.status('ok','✅ Conectado');}
    catch(e){Controle.status('erro','❌ Offline — '+e.message);}
};

Controle.setEstado=async function(novos){
    Object.assign(Controle.estado,novos);Controle.aplicarEstado();
    try{var post=paraSecoes(novos);var r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(post)});
        if(!r.ok)throw new Error(r.status);Controle.status('ok','✅ Salvo');}
    catch(e){Controle.status('erro','❌ Erro ao salvar — '+e.message);}
};

Controle.init=function(){
    Controle._listeners={};
    Controle.on=function(evento,fn){EventBus.on.call(Controle,evento,fn);};
    Controle.emit=function(evento,dados){EventBus.emit.call(Controle,evento,dados);};
    Controle.carregarEstado();
};
