var Controle=window.Controle||{};
Controle.thumbCache={};
Controle.getMidiasCtrl=function(){try{return JSON.parse(Controle.estado.midias||'[]');}catch(e){return[];}};
Controle.getAtivasCtrl=function(){try{return JSON.parse(Controle.estado.midiasAtivas||'[]');}catch(e){return[];}};

/* ------------------------------------------------------------------
   Repertorio unico: arquivos (imagem/gif/video) + notificacoes (texto)
   ------------------------------------------------------------------ */

/* adiciona arquivo: imagem, gif ou video */
Controle.adicionarMidia=function(){
    var nome=document.getElementById('midiaNome').value.trim();
    if(!nome){alert('Digite um nome');return;}
    var duracao=parseInt(document.getElementById('midiaDuracao').value)||0;
    var intervalo=parseInt(document.getElementById('midiaIntervalo').value)||0;
    var inp=document.createElement('input');
    inp.type='file';inp.accept='image/*,video/*,.gif,.webp,.png,.jpg,.jpeg,.mp4,.webm';inp.style.display='none';
    inp.onchange=function(e){
        Controle.status('sync','Enviando...');
        var f=e.target.files[0];if(!f)return;
        var r=new FileReader();
        r.onload=async function(){
            var tipo='imagem';
            if(f.type.indexOf('video/')===0)tipo='video';
            else if(f.type==='image/gif'||/\.gif$/i.test(f.name))tipo='gif';   // gif animado
            var id=String(Date.now());var src=r.result;
            var trans=document.getElementById('midiaTransicaoSelect').value;
            Controle.thumbCache[id]=src;
            try{
                var resp=await fetch(API+API_AND+'acao=upload_midia',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id,tipo:tipo,src:src,nome:nome,transicao:trans,duracao:duracao,intervalo:intervalo})});
                if(!resp.ok)throw new Error((await resp.json()).erro||resp.status);
                var rj=await resp.json();
                var midias=Controle.getMidiasCtrl();
                midias.push({id:id,tipo:tipo,nome:nome,transicao:trans,duracao:duracao,intervalo:intervalo});
                Controle.estado.midias=JSON.stringify(midias);
                Controle.estado.estadoVersao=rj.versao;
                Controle.renderMidias();
                document.getElementById('midiaNome').value='';
                document.getElementById('midiaDuracao').value='';
                document.getElementById('midiaIntervalo').value='';
                Controle.status('ok','Midia '+nome+' salva');
            }catch(err){Controle.status('erro','Upload: '+err.message);delete Controle.thumbCache[id];}
            inp.remove();
        };
        r.readAsDataURL(f);
    };
    document.body.appendChild(inp);
    inp.click();
};

/* ---------- notificacoes (midia de texto) ---------- */
Controle.NOTIF_ROTULO={gol:'Gol',amarelo:'Cartão amarelo',vermelho:'Cartão vermelho',info:'Aviso'};
Controle.NOTIF_PADRAO={gol:'GOOOOL!!!',amarelo:'CARTÃO AMARELO',vermelho:'CARTÃO VERMELHO',info:''};

/* monta o item de texto a partir do formulario */
Controle._itemNotif=function(){
    var rt=document.querySelector('input[name="tipoNotif"]:checked');
    var rm=document.querySelector('input[name="modoNotif"]:checked');
    var tipo=rt?rt.value:'gol', modo=rm?rm.value:'jogador';
    var nome='';
    if(modo==='jogador'){
        var el=document.getElementById('nomeJogador');
        nome=el?el.value.trim():'';
        if(!nome)return null;
    }else{
        var te=document.getElementById('timeNotif');
        var v=te?te.value:'A';
        nome=Controle.estado['time'+v]||('TIME '+v);
    }
    var inp=document.getElementById('texto'+tipo.charAt(0).toUpperCase()+tipo.slice(1));
    var prefixo=(inp&&inp.value.trim())||Controle.NOTIF_PADRAO[tipo]||'';
    var texto=nome+(prefixo?(' - '+prefixo):'');
    return {id:'notif_'+tipo+'_'+Controle._norm(nome).replace(/ /g,'-'),
            tipo:'texto',notif:tipo,nome:Controle.NOTIF_ROTULO[tipo]+' · '+nome,
            texto:texto,duracao:4,intervalo:0,transicao:'fade'};
};

Controle.salvarNotificacao=function(){Controle.enviarNotificacao(false);};
Controle.enviarNotificacao=function(agora){
    if(agora===undefined)agora=true;
    var it=Controle._itemNotif();
    if(!it){alert('Informe o jogador ou escolha o time');return;}
    var midias=Controle.getMidiasCtrl(),achou=false;
    for(var i=0;i<midias.length;i++){
        if(midias[i].id===it.id){                       // atualiza o texto
            midias[i].texto=it.texto;midias[i].nome=it.nome;
            if(midias[i].duracao===undefined)midias[i].duracao=it.duracao;
            achou=true;break;
        }
    }
    if(!achou)midias.push(it);
    var est={midias:JSON.stringify(midias)};
    if(agora){                                          // dispara uma vez no placar
        est.midiaDisparoId=it.id;
        est.midiaDisparoSeq=String(Date.now());
    }
    Controle.setEstado(est);
    Controle.renderMidias();
    Controle.status('ok',agora?('▶ Notificação enviada: '+it.nome):('➕ No repertório: '+it.nome));
};

// Toggle: adiciona/remove do array midiasAtivas
Controle.toggleMidia=function(id){
    var ativas=Controle.getAtivasCtrl();
    var idx=ativas.indexOf(id);
    if(idx>=0){ativas.splice(idx,1);}
    else{ativas.push(id);}
    Controle.estado.midiasAtivas=JSON.stringify(ativas);
    Controle.setEstado({midiasAtivas:JSON.stringify(ativas)});
    Controle.renderMidias();
};

Controle.removerMidia=async function(id){
    if(!confirm('Remover este item do repertório?'))return;
    var midias=Controle.getMidiasCtrl();
    var m=null;for(var i=0;i<midias.length;i++)if(midias[i].id===id)m=midias[i];
    if(m&&m.tipo==='texto'){                            // texto: so sai do estado
        midias=midias.filter(function(x){return x.id!==id;});
        var at=Controle.getAtivasCtrl().filter(function(x){return x!==id;});
        Controle.setEstado({midias:JSON.stringify(midias),midiasAtivas:JSON.stringify(at)});
        Controle.renderMidias();Controle.status('ok','Item removido');return;
    }
    try{
        var resp=await fetch(API+API_AND+'acao=remover_midia',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id})});
        if(!resp.ok)throw new Error('Erro '+resp.status);
        var rj=await resp.json();
        midias=midias.filter(function(x){return x.id!==id;});
        Controle.estado.midias=JSON.stringify(midias);delete Controle.thumbCache[id];
        var ativas=Controle.getAtivasCtrl();ativas=ativas.filter(function(x){return x!==id;});
        Controle.estado.midiasAtivas=JSON.stringify(ativas);
        Controle.estado.estadoVersao=rj.versao;Controle.renderMidias();Controle.status('ok','Midia removida');
    }catch(err){Controle.status('erro','Erro: '+err.message);}
};

// Salvar edicao inline (duracao, intervalo, transicao, texto)
Controle.editarMidia=async function(id){
    var midias=Controle.getMidiasCtrl();
    var m=null;for(var i=0;i<midias.length;i++)if(midias[i].id===id)m=midias[i];
    if(!m)return;
    var durEl=document.getElementById('editDur_'+id);
    var intEl=document.getElementById('editInt_'+id);
    var trEl=document.getElementById('editTrans_'+id);
    var txEl=document.getElementById('editTxt_'+id);
    var duracao=durEl?(parseInt(durEl.value)||0):(parseInt(m.duracao)||0);
    var intervalo=intEl?(parseInt(intEl.value)||0):(parseInt(m.intervalo)||0);
    var transicao=trEl?trEl.value:(m.transicao||'fade');
    var texto=txEl?txEl.value:m.texto;
    m.duracao=duracao;m.intervalo=intervalo;m.transicao=transicao;m.texto=texto;
    if(m.tipo==='texto'){                               // texto: grava direto no estado
        Controle.setEstado({midias:JSON.stringify(midias)});
        Controle.status('ok','Notificação atualizada');return;
    }
    try{
        var resp=await fetch(API+API_AND+'acao=editar_midia',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id,duracao:duracao,intervalo:intervalo,transicao:transicao})});
        if(!resp.ok)throw new Error((await resp.json()).erro||resp.status);
        var rj=await resp.json();
        Controle.estado.midias=JSON.stringify(midias);
        Controle.estado.estadoVersao=rj.versao;
        Controle.status('ok','Midia atualizada');
    }catch(err){Controle.status('erro','Erro: '+err.message);}
};

Controle._renderItens=function(lista,ativas){
    var trs=['fade','slide-left','slide-right','zoom','none'];
    var html='';
    for(var i=0;i<lista.length;i++){
        var m=lista[i];var isAtiva=ativas.indexOf(m.id)>=0;
        var texto=(m.tipo==='texto');
        var thumbH='';
        if(texto){
            thumbH='<span class="midia-tipo">💬</span>';
        }else if(m.tipo==='cena'){
            thumbH='<span class="midia-tipo">🎬</span>';
        }else if(Controle.thumbCache[m.id]){
            thumbH='<img src="'+Controle.thumbCache[m.id]+'">';
        }else if(m.ext){
            thumbH='<img src="midias/'+m.id+'.'+m.ext+'" onerror="this.style.display=\'none\'">';
        }else{
            thumbH='<span style="display:inline-block;width:48px;height:27px;background:#555;border-radius:3px;flex-shrink:0"></span>';
        }
        var dur=parseInt(m.duracao)||0, intv=parseInt(m.intervalo)||0;
        var editH='<span class="midia-info">'+
            '⏱<input class="midia-edit" id="editDur_'+m.id+'" type="number" value="'+dur+'" min="0" onchange="Controle.editarMidia(\''+m.id+'\')">'+
            '🔁<input class="midia-edit" id="editInt_'+m.id+'" type="number" value="'+intv+'" min="0" onchange="Controle.editarMidia(\''+m.id+'\')">'+
            's</span>';
        var optH='';
        for(var j=0;j<trs.length;j++){var t=trs[j];var sel=m.transicao===t?' selected':'';optH+='<option value="'+t+'"'+sel+'>'+t+'</option>';}
        var nomeH=texto
            ? '<span class="midia-nome" title="'+m.nome+'">'+m.nome+'</span>'+
              '<input class="midia-texto" id="editTxt_'+m.id+'" value="'+String(m.texto||'').replace(/"/g,'&quot;')+'" onchange="Controle.editarMidia(\''+m.id+'\')">'
            : '<span class="midia-nome">'+m.nome+'</span>';
        var botoes=(texto||m.tipo==='cena')
            ? '<button class="btn-enviar" onclick="Controle.dispararMidia(\''+m.id+'\')">▶ Enviar</button>'
            : '<button class="'+(isAtiva?'ativo':'')+'" onclick="Controle.toggleMidia(\''+m.id+'\')">'+(isAtiva?'Ativo':'Ativar')+'</button>';
        html+='<div class="midia-item'+(texto?' texto':'')+'">'+thumbH+nomeH+editH+
            '<select id="editTrans_'+m.id+'" onchange="Controle.editarMidia(\''+m.id+'\')" style="font-size:10px;height:20px;padding:1px 3px;width:72px">'+optH+'</select>'+
            botoes+
            '<button class="btn-remover" onclick="Controle.removerMidia(\''+m.id+'\')">X</button></div>';
    }
    return html;
};

Controle.renderMidias=function(){
    var c=document.getElementById('listaMidias');
    var n=document.getElementById('listaNotificacoes');
    var midias=Controle.getMidiasCtrl();
    var ativas=Controle.getAtivasCtrl();
    var arquivos=[],textos=[];
    for(var i=0;i<midias.length;i++){ (midias[i].tipo==='texto'?textos:arquivos).push(midias[i]); }
    if(c) c.innerHTML = arquivos.length ? Controle._renderItens(arquivos,ativas) : '<span style="color:#888;font-size:11px;">Nenhuma mídia adicionada</span>';
    if(n) n.innerHTML = textos.length ? Controle._renderItens(textos,ativas) : '<span style="color:#888;font-size:11px;">Nenhuma notificação no histórico</span>';
};

/* dispara um item do repertorio uma unica vez (notificacoes) */
Controle.dispararMidia=function(id){
    Controle.setEstado({midiaDisparoId:id,midiaDisparoSeq:String(Date.now())});
    var m=null,lista=Controle.getMidiasCtrl();
    for(var i=0;i<lista.length;i++)if(lista[i].id===id)m=lista[i];
    Controle.status('ok','▶ '+(m?m.nome:id));
};
