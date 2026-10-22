// controle/estilo.js — tema, fonte, animação, posição, escala
var Controle=window.Controle||{};
Controle.definirFonte=function(f){Controle.setEstado({fonte:f});};
Controle.alternarNomes=function(){Controle.setEstado({nomesExpandidos:Controle.estado.nomesExpandidos==='true'?'false':'true'});};
Controle.onScaleSlider=function(v){document.getElementById('scaleVal').textContent=parseFloat(v).toFixed(2);Controle.setEstado({placarScale:v});};
Controle.ajustarScale=function(delta){
    var sc=parseFloat(Controle.estado.placarScale)||0.65;sc=Math.round((sc+delta)*100)/100;
    if(sc<0.3)sc=0.3;if(sc>1.5)sc=1.5;
    document.getElementById('scaleSlider').value=sc;document.getElementById('scaleVal').textContent=sc.toFixed(2);
    Controle.setEstado({placarScale:String(sc)});
};
Controle.setPosicao=function(){Controle.setEstado({placarX:document.getElementById('inputX').value,placarY:document.getElementById('inputY').value});};
Controle.resetPosicao=function(){
    document.getElementById('inputX').value='50';document.getElementById('inputY').value='50';
    document.getElementById('scaleSlider').value='0.65';document.getElementById('scaleVal').textContent='0.65';
    Controle.setEstado({placarX:'50',placarY:'50',placarScale:'0.65'});
};
