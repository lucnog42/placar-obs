var Controle=window.Controle||{};
Controle.thumbCache={};
Controle.getMidiasCtrl=function(){try{return JSON.parse(Controle.estado.midias||'[]');}catch(e){return[];}};
Controle.getAtivasCtrl=function(){try{return JSON.parse(Controle.estado.midiasAtivas||'[]');}catch(e){return[];}};

/* ------------------------------------------------------------------
   Repertorio unico: arquivos (imagem/gif/video) + notificacoes (texto)
   ------------------------------------------------------------------ */

/* adiciona arquivo: imagem, gif ou video (pfx='' tela 8, pfx='pop' no popup) */
Controle.adicionarMidia=function(pfx){
    pfx=pfx||'';
    var nome=document.getElementById(pfx+'midiaNome').value.trim();
    if(!nome){alert('Digite um nome');return;}
    var duracao=parseInt(document.getElementById(pfx+'midiaDuracao').value)||0;
    var intervalo=parseInt(document.getElementById(pfx+'midiaIntervalo').value)||0;
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
            var trans=document.getElementById(pfx+'midiaTransicaoSelect').value;
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
                document.getElementById(pfx+'midiaNome').value='';
                document.getElementById(pfx+'midiaDuracao').value='';
                document.getElementById(pfx+'midiaIntervalo').value='';
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
Controle.NOTIF_ROTULO={gol:'Gol',amarelo:'Cartão amarelo',vermelho:'Cartão vermelho',substituicao:'Substituição',info:'Aviso'};
Controle.NOTIF_PADRAO={gol:'GOOOOL!!!',amarelo:'CARTÃO AMARELO',vermelho:'CARTÃO VERMELHO',substituicao:'',info:''};
Controle._notifTipo='gol';
Controle.getNotifTextos=function(){try{return JSON.parse(Controle.estado.notifTextos||'{}');}catch(e){return{};}};
Controle.getNotifTexto=function(tipo){var t=Controle.getNotifTextos();if(t&&t[tipo])return t[tipo];return Controle.NOTIF_PADRAO[tipo]||'';};
Controle.abrirTextosNotif=function(){var t=Controle.getNotifTextos();var g=document.getElementById('cfgTextoGol');if(g)g.value=t.gol||Controle.NOTIF_PADRAO.gol;var a=document.getElementById('cfgTextoAmarelo');if(a)a.value=t.amarelo||Controle.NOTIF_PADRAO.amarelo;var v=document.getElementById('cfgTextoVermelho');if(v)v.value=t.vermelho||Controle.NOTIF_PADRAO.vermelho;Controle.abrirModal('modalTextosNotif');};
Controle.salvarNotifTextos=function(){var t={gol:(document.getElementById('cfgTextoGol')||{}).value||'',amarelo:(document.getElementById('cfgTextoAmarelo')||{}).value||'',vermelho:(document.getElementById('cfgTextoVermelho')||{}).value||''};Controle.setEstado({notifTextos:JSON.stringify(t)});Controle.fecharModal('modalTextosNotif');Controle.status('ok','Textos salvos');};

/* monta as opções de jogador a partir das escalações (CSV) */
Controle._opcoesJogadores=function(){
    var html='<option value="">— escolher jogador do CSV —</option>';
    try{
        var map=JSON.parse(Controle.estado.tabelaEscalacoes||'{}');
        var na=Controle._norm(Controle.estado.timeA), nb=Controle._norm(Controle.estado.timeB);
        Object.keys(map).forEach(function(k){
            var lista=map[k]||[];
            if(!lista.length)return;
            var rot=k;
            if(na&&Controle._norm(k)===na)rot=Controle.estado.timeA||'Time A';
            else if(nb&&Controle._norm(k)===nb)rot=Controle.estado.timeB||'Time B';
            html+='<optgroup label="'+String(rot).replace(/"/g,'&quot;')+'">';
            lista.forEach(function(p){
                var rotulo=p.num?((p.num+'. ')+p.player):p.player;
                html+='<option value="'+String(p.player).replace(/"/g,'&quot;')+'">'+String(rotulo).replace(/</g,'&lt;')+'</option>';
            });
            html+='</optgroup>';
        });
    }catch(e){}
    return html;
};
Controle.renderJogadores=function(){
    var html=Controle._opcoesJogadores();
    ['selJogadorEntra','selJogadorSai'].forEach(function(id){
        var sel=document.getElementById(id);
        if(!sel)return;
        var cur=sel.value;
        sel.innerHTML=html;
        if(cur)sel.value=cur;
    });
};

/* ---------- seletor de notificação: time -> jogador ---------- */
Controle._notifTime=null;
Controle._notifJogador=null;

Controle.renderTimesNotif=function(){
    var el=document.getElementById('listaTimesNotif');if(!el)return;
    var nomes=[];
    var a=Controle.estado.timeA,b=Controle.estado.timeB;
    if(a)nomes.push(a);
    if(b&&b!==a)nomes.push(b);
    if(!nomes.length){el.innerHTML='<span class="hint">sem times: preencha Time A/B na aba Equipes</span>';return;}
    var h='';
    nomes.forEach(function(n){
        var on=Controle._notifTime===n?' on':'';
        h+='<button class="time-notif-btn'+on+'" data-time="'+String(n).replace(/"/g,'&quot;')+'" onclick="Controle.escolherTimeNotif(this)">🏆 '+String(n).replace(/</g,'&lt;')+'</button>';
    });
    el.innerHTML=h;
};

Controle.escolherTimeNotif=function(btn){
    var n=btn.getAttribute('data-time');
    Controle._notifTime=n;Controle._notifJogador=null;
    var el=document.getElementById('listaTimesNotif');
    if(el){var bs=el.querySelectorAll('.time-notif-btn');for(var i=0;i<bs.length;i++)bs[i].classList.remove('on');}
    btn.classList.add('on');
    var tipo=Controle._notifTipo||'gol';
    if(tipo!=='substituicao')Controle.renderJogadoresNotif();
    Controle.status('ok','🏆 Time: '+n);
};

Controle.renderJogadoresNotif=function(){
    var el=document.getElementById('listaJogadoresNotif');
    if(!el)return;
    if(!Controle._notifTime){el.style.display='none';el.innerHTML='';return;}
    var jog=[];
    try{
        var map=JSON.parse(Controle.estado.tabelaEscalacoes||'{}');
        var alvo=Controle._norm(Controle._notifTime);
        Object.keys(map).forEach(function(k){if(Controle._norm(k)===alvo)jog=map[k]||[];});
    }catch(e){}
    if(!jog.length){el.style.display='';el.innerHTML='<span class="hint">sem jogadores para este time (importe o CSV de escalações)</span>';return;}
    var h='';
    jog.forEach(function(p){
        var nome=p.player;
        var on=Controle._notifJogador===nome?' on':'';
        h+='<button class="jogador-notif-btn'+on+'" data-jogador="'+String(nome).replace(/"/g,'&quot;')+'" onclick="Controle.escolherJogadorNotif(this)">👤 '+String(p.num?(p.num+'. '):'')+String(nome).replace(/</g,'&lt;')+'</button>';
    });
    el.style.display='';el.innerHTML=h;
};

Controle.escolherJogadorNotif=function(btn){
    Controle._notifJogador=btn.getAttribute('data-jogador');
    var el=document.getElementById('listaJogadoresNotif');
    if(el){var bs=el.querySelectorAll('.jogador-notif-btn');for(var i=0;i<bs.length;i++)bs[i].classList.remove('on');}
    btn.classList.add('on');
    Controle.status('ok','👤 Jogador: '+Controle._notifJogador);
};

/* monta o item de texto a partir do formulario */
Controle._itemNotif=function(){
    var tipo=Controle._notifTipo||'gol';
    if(tipo==='substituicao'){
        var ent=(document.getElementById('selJogadorEntra')||{}).value||'';
        var sai=(document.getElementById('selJogadorSai')||{}).value||'';
        if(!ent||!sai)return null;
        var txt='ENTRA '+ent+'  ·  SAI '+sai;
        return {id:'notif_sub_'+Controle._norm(ent)+'_'+Controle._norm(sai),
                tipo:'texto',notif:'substituicao',nome:'Substituição · '+ent+' ⇄ '+sai,
                texto:txt,duracao:5,intervalo:0,transicao:'fade'};
    }
    var nome=Controle._notifJogador||Controle._notifTime||'';
    if(!nome){alert('Escolha um time (ou um jogador)');return null;}
    var prefixo=Controle.getNotifTexto(tipo);
    var texto=nome+(prefixo?(' - '+prefixo):'');
    return {id:'notif_'+tipo+'_'+Controle._norm(nome).replace(/ /g,'-'),
            tipo:'texto',notif:tipo,nome:Controle.NOTIF_ROTULO[tipo]+' · '+nome,
            texto:texto,duracao:4,intervalo:0,transicao:'fade'};
};

Controle.salvarNotificacao=function(){Controle.enviarNotificacao(false);};
Controle._gateOverlay=function(prosseguir){
    // cena manual no ar? confirma antes de trocar o conteudo do overlay
    if(Controle.cenaManualAtiva && Controle.cenaManualAtiva()){Controle._overlayPendente=prosseguir;Controle.abrirModal('modalConfirmarOverlay');}
    else{prosseguir();}
};
Controle._confirmarDesligarOverlay=function(){
    var fn=Controle._overlayPendente;Controle._overlayPendente=null;
    Controle.fecharModal('modalConfirmarOverlay');
    if(Controle.voltarLoop)Controle.voltarLoop();
    if(fn)fn();
};
Controle.enviarNotificacao=function(agora){
    if(agora===undefined)agora=true;
    var it=Controle._itemNotif();
    if(!it){alert('Informe o jogador ou escolha o time');return;}
    var doIt=function(){
        var midias=Controle.getMidiasCtrl(),achou=false;
        for(var i=0;i<midias.length;i++){
            if(midias[i].id===it.id){                    // atualiza o texto
                midias[i].texto=it.texto;midias[i].nome=it.nome;
                if(midias[i].duracao===undefined)midias[i].duracao=it.duracao;
                achou=true;break;
            }
        }
        if(!achou)midias.push(it);
        var est={midias:JSON.stringify(midias)};
        if(agora){                                       // dispara uma vez no placar
            est.midiaDisparoId=it.id;
            est.midiaDisparoSeq=String(Date.now());
        }
        Controle.setEstado(est);
        Controle.renderMidias();
        Controle.status('ok',agora?('▶ Notificação enviada: '+it.nome):('➕ No repertório: '+it.nome));
    };
    if(agora)Controle._gateOverlay(doIt); else doIt();
};

// Toggle: adiciona/remove do array midiasAtivas
Controle.toggleMidia=function(id){
    var ativas=Controle.getAtivasCtrl();
    var idx=ativas.indexOf(id);
    if(idx>=0){
        ativas.splice(idx,1);
        Controle.estado.midiasAtivas=JSON.stringify(ativas);
        Controle.setEstado({midiasAtivas:JSON.stringify(ativas)});
        Controle.renderMidias();
    }else{
        Controle._gateOverlay(function(){
            var at=Controle.getAtivasCtrl();
            if(at.indexOf(id)<0)at.push(id);
            Controle.estado.midiasAtivas=JSON.stringify(at);
            Controle.setEstado({midiasAtivas:JSON.stringify(at)});
            Controle.renderMidias();
        });
    }
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
Controle.editarMidia=async function(id,pfx){
    pfx=pfx||'';
    var midias=Controle.getMidiasCtrl();
    var m=null;for(var i=0;i<midias.length;i++)if(midias[i].id===id)m=midias[i];
    if(!m)return;
    var durEl=document.getElementById(pfx+'editDur_'+id);
    var intEl=document.getElementById(pfx+'editInt_'+id);
    var trEl=document.getElementById(pfx+'editTrans_'+id);
    var txEl=document.getElementById(pfx+'editTxt_'+id);
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

Controle._renderItens=function(lista,ativas,pfx){
    pfx=pfx||'';
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
            thumbH='<img src="'+DADOS+'midias/'+m.id+'.'+m.ext+'" onerror="this.style.display=\'none\'">';
        }else{
            thumbH='<span style="display:inline-block;width:48px;height:27px;background:#555;border-radius:3px;flex-shrink:0"></span>';
        }
        var dur=parseInt(m.duracao)||0, intv=parseInt(m.intervalo)||0;
        var editH='<span class="midia-info">'+
            '⏱<input class="midia-edit" id="'+pfx+'editDur_'+m.id+'" type="number" value="'+dur+'" min="0" onchange="Controle.editarMidia(\''+m.id+'\',\''+pfx+'\')">'+
            '🔁<input class="midia-edit" id="'+pfx+'editInt_'+m.id+'" type="number" value="'+intv+'" min="0" onchange="Controle.editarMidia(\''+m.id+'\',\''+pfx+'\')">'+
            's</span>';
        var optH='';
        for(var j=0;j<trs.length;j++){var t=trs[j];var sel=m.transicao===t?' selected':'';optH+='<option value="'+t+'"'+sel+'>'+t+'</option>';}
        var nomeH=texto
            ? '<span class="midia-nome" title="'+m.nome+'">'+m.nome+'</span>'+
              '<input class="midia-texto" id="'+pfx+'editTxt_'+m.id+'" value="'+String(m.texto||'').replace(/"/g,'&quot;')+'" onchange="Controle.editarMidia(\''+m.id+'\',\''+pfx+'\')">'
            : '<span class="midia-nome">'+m.nome+'</span>';
        var botoes=(texto||m.tipo==='cena')
            ? '<button class="btn-enviar" onclick="Controle.dispararMidia(\''+m.id+'\')">▶ Enviar</button>'
            : '<button class="'+(isAtiva?'ativo':'')+'" onclick="Controle.toggleMidia(\''+m.id+'\')">'+(isAtiva?'Ativo':'Ativar')+'</button>';
        html+='<div class="midia-item'+(texto?' texto':'')+'">'+thumbH+nomeH+editH+
            '<select id="'+pfx+'editTrans_'+m.id+'" onchange="Controle.editarMidia(\''+m.id+'\',\''+pfx+'\')" style="font-size:10px;height:20px;padding:1px 3px;width:72px">'+optH+'</select>'+
            botoes+
            '<button class="btn-remover" onclick="Controle.removerMidia(\''+m.id+'\')">X</button></div>';
    }
    return html;
};

Controle.renderMidias=function(){
    var c=document.getElementById('listaMidias');
    var cp=document.getElementById('listaMidiasPop');
    var n=document.getElementById('listaNotificacoes');
    var midias=Controle.getMidiasCtrl();
    var ativas=Controle.getAtivasCtrl();
    var arquivos=[],textos=[];
    for(var i=0;i<midias.length;i++){ (midias[i].tipo==='texto'?textos:arquivos).push(midias[i]); }
    if(c) c.innerHTML = arquivos.length ? Controle._renderItens(arquivos,ativas,'') : '<span style="color:#888;font-size:11px;">Nenhuma mídia adicionada</span>';
    if(cp) cp.innerHTML = arquivos.length ? Controle._renderItens(arquivos,ativas,'pop') : '<span style="color:#888;font-size:11px;">Nenhuma mídia adicionada</span>';
    if(n) n.innerHTML = textos.length ? Controle._renderItens(textos,ativas,'') : '<span style="color:#888;font-size:11px;">Nenhuma notificação no histórico</span>';
};

/* dispara um item do repertorio uma unica vez (notificacoes) */
Controle.dispararMidia=function(id){
    Controle._gateOverlay(function(){
        Controle.setEstado({midiaDisparoId:id,midiaDisparoSeq:String(Date.now())});
        var m=null,lista=Controle.getMidiasCtrl();
        for(var i=0;i<lista.length;i++)if(lista[i].id===id)m=lista[i];
        Controle.status('ok','▶ '+(m?m.nome:id));
    });
};
