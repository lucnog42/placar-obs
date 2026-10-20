// controle/elementos.js — times, escudos, gols, penaltes, notificações
var Controle=window.Controle||{};

Controle.definirTimes=function(){
    var d={};var ta=document.getElementById('timeA'),tb=document.getElementById('timeB');
    var sa=document.getElementById('siglaA'),sb=document.getElementById('siglaB');
    if(ta&&ta.value)d.timeA=ta.value;if(tb&&tb.value)d.timeB=tb.value;
    if(sa&&sa.value)d.siglaA=sa.value;if(sb&&sb.value)d.siglaB=sb.value;
    if(Object.keys(d).length){Controle._presetAtual=null;Controle.setEstado(d);Controle.atualizarNomePreset();}
};

Controle.definirTorneio=function(){
    var d={};
    var comp=document.getElementById('competicao').value;
    var cat=document.getElementById('categoria').value;
    var grp=document.getElementById('grupo').value;
    var fase=document.getElementById('fase').value;
    var data=document.getElementById('data').value;
    var hora=document.getElementById('hora').value;
    var local=document.getElementById('local').value;
    var cl=document.getElementById('clima'),ci=document.getElementById('climaIcone');
    if(comp)d.competicao=comp;if(cat)d.categoria=cat;if(grp)d.grupo=grp;if(fase)d.fase=fase;
    if(data)d.data=data;if(hora)d.hora=hora;if(local)d.local=local;
    if(cl)d.clima=cl.value;if(ci)d.climaIcone=ci.value;
    if(Object.keys(d).length)Controle.setEstado(d);
};

Controle.selecionarLogoTorneio=function(){
    var sel=document.getElementById('logoTorneio');
    var val=sel?sel.value:'';
    var prev=document.getElementById('logoTorneioPreview');
    if(val){
        Controle.setEstado({logoTorneio:val});
        if(prev){prev.src='torneios/'+val;prev.style.display='';}
    }else{
        Controle.setEstado({logoTorneio:''});
        if(prev)prev.style.display='none';
    }
};

Controle.recarregarLogos=async function(){
    try{
        var r=await fetch(API+API_AND+'acao=listar_logos');
        var data=await r.json();
        var sel=document.getElementById('logoTorneio');
        if(!sel)return;
        var val=sel.value;
        sel.innerHTML='<option value="">Nenhum</option>';
        (data.logos||[]).forEach(function(l){
            var opt=document.createElement('option');opt.value=l;opt.textContent=l;sel.appendChild(opt);
        });
        sel.value=val;
        if(Controle.sincronizarLogoTabela)Controle.sincronizarLogoTabela();
        Controle.status('ok','✅ Logos carregados');
    }catch(e){}
};

/* sobe um logo para torneios/ (mesmo esquema do banco de escudos) */
Controle.uploadLogo=function(){
    var inp=document.createElement('input');
    inp.type='file';inp.accept='image/*,.png,.jpg,.jpeg,.webp,.svg,.gif';inp.style.display='none';
    inp.onchange=function(e){
        var f=e.target.files[0];if(!f)return;
        Controle.status('sync','Enviando logo...');
        var r=new FileReader();
        r.onload=async function(){
            var nome=f.name.replace(/\.[^.]+$/,'');
            try{
                var resp=await fetch(API+API_AND+'acao=upload_logo',{method:'POST',headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({nome:nome,src:r.result})});
                var rj=await resp.json();
                if(!resp.ok||!rj.arquivo)throw new Error(rj.erro||('Erro '+resp.status));
                await Controle.recarregarLogos();
                var sel=document.getElementById('logoTorneio');
                if(sel){sel.value=rj.arquivo;}
                Controle.selecionarLogoTorneio();
                Controle.status('ok','✅ Logo '+rj.arquivo+' no banco de imagens');
            }catch(err){Controle.status('erro','❌ '+err.message);}
            inp.remove();
        };
        r.readAsDataURL(f);
    };
    document.body.appendChild(inp);
    inp.click();
};

// Helper: deriva logoTorneio do nome da competição
Controle._derivarLogoTorneio=function(competicao){
    if(!competicao)return '';
    var slug=competicao.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        .replace(/[^a-z0-9]/g,'')
        + '.png';
    return slug;
};

Controle.definirEscudo=function(idImg){
    var inp=document.createElement('input');inp.type='file';inp.accept='.png';inp.style.display='none';
    inp.onchange=function(e){
        var f=e.target.files[0];if(!f)return;
        var r=new FileReader();
        r.onload=async function(){
            var resp=await fetch(API+API_AND+'acao=upload_escudo',{method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({time:(idImg==='escudoA'?'A':'B'),src:r.result})});
            var data=await resp.json();
            if(data.ok){var d={};d[idImg]=data.src;Controle.setEstado(d);}
        };
        r.readAsDataURL(f);
    };
    document.body.appendChild(inp);inp.click();
    setTimeout(function(){if(inp.parentNode)inp.remove();},1000);
};

Controle._escudos=[];

Controle.listarEscudos=async function(){
    try{
        var r=await fetch(API+API_AND+'acao=listar_escudos');
        var data=await r.json();
        Controle._escudos=data.escudos||[];
        Controle.renderEscudos();
    }catch(e){Controle.status('erro','❌ Erro ao listar escudos');}
};

Controle.renderEscudos=function(){
    var el=document.getElementById('listaEscudos');
    if(!el)return;
    if(Controle._escudos.length===0){
        el.innerHTML='<span style="color:#888;font-size:11px">Nenhum escudo na biblioteca. Use Upload acima.</span>';
        return;
    }
    var h='',ts=Date.now();
    Controle._escudos.forEach(function(n){
        h+='<div class="escudo-item">';
        h+='<img src="escudos/'+n+'.png?v='+ts+'" alt="" onerror="this.style.display=\'none\'">';
        h+='<input type="checkbox" class="cb-escudo" value="'+n+'" style="flex-shrink:0">';
        h+='<span class="escudo-nome" title="'+n+'">'+n+'</span>';
        h+='<button class="btn-A" onclick="Controle.atribuirEscudo(\''+n+'\',\'A\')">Time A</button>';
        h+='<button class="btn-B" onclick="Controle.atribuirEscudo(\''+n+'\',\'B\')">Time B</button>';
        h+='<button onclick="Controle.removerEscudo(\''+n+'\')" class="btn-remover">✕</button>';
        h+='</div>';
    });
    el.innerHTML=h;
    document.getElementById('selTodosEscudos').checked=false;
};

Controle.uploadEscudosBatch=function(){
    var inp=document.createElement('input');inp.type='file';
    inp.accept='.png';inp.setAttribute('multiple','');
    inp.style.display='none';
    inp.onchange=async function(e){
        var files=e.target.files;
        if(!files||files.length===0)return;
        var arquivos=[];
        for(var i=0;i<files.length;i++){
            var f=files[i];
            if(!f.name.toLowerCase().endsWith('.png'))continue;
            var nome=f.name.replace(/\.png$/i,'').replace(/[^a-zA-Z0-9_\-]/g,'_');
            var src=await new Promise(function(resolve){
                var r=new FileReader();
                r.onload=function(){resolve(r.result);};
                r.readAsDataURL(f);
            });
            arquivos.push({nome:nome,src:src});
        }
        if(arquivos.length===0)return;
        try{
            var r=await fetch(API+API_AND+'acao=upload_escudos_batch',{method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({arquivos:arquivos})});
            var data=await r.json();
            if(data.ok){
                Controle.status('ok','✅ '+data.count+' escudos enviados');
                Controle.listarEscudos();
            }
        }catch(e){Controle.status('erro','❌ Erro no upload');}
        inp.remove();
    };
    document.body.appendChild(inp);inp.click();
};

Controle.atribuirEscudo=async function(nome,time){
    try{
        var r=await fetch(API+API_AND+'acao=atribuir_escudo',{method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({nome:nome,time:time})});
        var data=await r.json();
        if(data.ok){
            var d={};d['escudo'+time]=data.src;Controle.setEstado(d);
            Controle.status('ok','✅ Escudo atribuido ao Time '+time);
        }
    }catch(e){Controle.status('erro','❌ Erro ao atribuir escudo');}
};

Controle.removerEscudo=async function(nome){
    if(!confirm('Remover escudo "'+nome+'" da biblioteca?'))return;
    try{
        var r=await fetch(API+API_AND+'acao=remover_escudos',{method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({nomes:[nome]})});
        var data=await r.json();
        if(data.ok)Controle.listarEscudos();
    }catch(e){Controle.status('erro','❌ Erro ao remover escudo');}
};

Controle.toggleTodosEscudos=function(){
    var on=document.getElementById('selTodosEscudos').checked;
    document.querySelectorAll('.cb-escudo').forEach(function(cb){cb.checked=on;});
};

Controle.removerEscudosMarcados=function(){
    var nomes=[];
    document.querySelectorAll('.cb-escudo:checked').forEach(function(cb){nomes.push(cb.value);});
    if(nomes.length===0)return;
    if(!confirm('Remover '+nomes.length+' escudo(s) da biblioteca?'))return;
    (async function(){
        try{
            var r=await fetch(API+API_AND+'acao=remover_escudos',{method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({nomes:nomes})});
            var data=await r.json();
            if(data.ok)Controle.listarEscudos();
        }catch(e){Controle.status('erro','❌ Erro ao remover escudos');}
    })();
};

Controle.definirCor=function(time){
    var inp=document.createElement('input');inp.type='color';inp.style.display='none';
    inp.onchange=function(e){var d={};d[time+'Cor']=e.target.value;Controle.setEstado(d);inp.remove();};
    document.body.appendChild(inp);inp.click();
};
Controle.resetarCor=function(){Controle.setEstado({timeACor:'#ff0000',timeBCor:'#0000ff'});};

Controle.adicionarGol=function(gol,time){
    var ch=time==='A'?'golsA':'golsB';var at=parseInt(Controle.estado[ch])||0;
    if(gol<0&&at===0)return;
    Controle.incrementar(ch,gol);
};
Controle.zerarGols=function(){Controle.setEstado({golsA:'0',golsB:'0'});};

Controle.definirTempo=function(){
    var m=parseInt(document.getElementById('minutos').value)||0;
    var s=parseInt(document.getElementById('segundos').value)||0;
    Controle.cronometro('set',m*60+s);
};

Controle.alternarPenalte=function(btn){
    if(btn.classList.contains('gol')){btn.classList.remove('gol');btn.classList.add('erro');}
    else if(btn.classList.contains('erro'))btn.classList.remove('erro');
    else btn.classList.add('gol');
};

Controle.salvarPenalte=function(){
    var d={};document.querySelectorAll('.btnPenaltes').forEach(function(b){
        if(b.classList.contains('gol'))d[b.id]='gol';else if(b.classList.contains('erro'))d[b.id]='erro';else d[b.id]='neutro';
    });Controle.setEstado(d);
};

Controle.carregarPenalte=function(){
    document.querySelectorAll('.btnPenaltes').forEach(function(b){
        var eb=Controle.estado[b.id]||'neutro';b.classList.remove('gol','erro');
        if(eb==='gol')b.classList.add('gol');else if(eb==='erro')b.classList.add('erro');
    });
    var ativo=Controle.estado.penaltesAtivos!=='false';
    var tgb=document.getElementById('togglePenaltesBtn');if(tgb)tgb.innerText=ativo?'Desativar':'Ativar';
    document.querySelectorAll('.btnPenaltes').forEach(function(d){d.style.opacity=ativo?'1':'0.5';});
};
Controle.desativarPenalte=function(){
    Controle.setEstado({penaltesAtivos:Controle.estado.penaltesAtivos==='false'?'true':'false'});
};

Controle.toggleModoNotif=function(){
    var m=document.querySelector('input[name="modoNotif"]:checked').value;
    document.getElementById('nomeJogador').style.display=m==='jogador'?'':'none';
    document.getElementById('seletorTimeNotif').style.display=m==='time'?'block':'none';
};

/* enviarNotificacao agora vive em js/controle/midia.js: a notificacao e um
   item de TEXTO do repertorio, com duracao/transicao proprias e disparo avulso. */

Controle._presets=[];

Controle.listarPresets=async function(){
    try{
        var fc=document.getElementById('filtroCompeticao'),fcat=document.getElementById('filtroCategoria'),fg=document.getElementById('filtroGrupo'),ff=document.getElementById('filtroFase'),fb=document.getElementById('buscaPresets');
        var params=[];
        if(fc&&fc.value)params.push('competicao='+encodeURIComponent(fc.value));
        if(fcat&&fcat.value)params.push('categoria='+encodeURIComponent(fcat.value));
        if(fg&&fg.value)params.push('grupo='+encodeURIComponent(fg.value));
        if(ff&&ff.value)params.push('fase='+encodeURIComponent(ff.value));
        var fd=document.getElementById('filtroData');if(fd&&fd.value)params.push('data='+encodeURIComponent(fd.value));
        var fh=document.getElementById('filtroHora');if(fh&&fh.value)params.push('hora='+encodeURIComponent(fh.value));
        var fl=document.getElementById('filtroLocal');if(fl&&fl.value)params.push('local='+encodeURIComponent(fl.value));
        if(fb&&fb.value.trim())params.push('busca='+encodeURIComponent(fb.value.trim()));
        var q=params.length?'&'+params.join('&'):'';
        var isFiltered=!!q;var r=await fetch(API+API_AND+'acao=listar_presets'+q);
        var data=await r.json();
        Controle._presets=data.presets||[];
        if(!isFiltered)Controle._presetsTodos=Controle._presets.length;
        Controle.renderPresets();
        if(isFiltered)Controle.atualizarFiltros();
        else Controle.carregarFiltros();
    }catch(e){Controle.status('erro','❌ Erro ao listar presets');}
};

Controle.renderPresets=function(){
    var el=document.getElementById('listaPresets');
    var counter=document.getElementById('contadorPresets');
    if(!el)return;
    var total=Controle._presetsTodos||Controle._presets.length;
    var visiveis=Controle._presets.length;
    if(counter){
        if(total===visiveis||!Controle._presetsTodos){
            counter.textContent=total+' presets';
        }else{
            counter.textContent=visiveis+' de '+total+' presets';
        }
    }
    if(Controle._presets.length===0){
        el.innerHTML='<span style="color:#888;font-size:11px">Nenhum preset salvo</span>';
        return;
    }
    var h='',ts=Date.now();
    Controle._presets.forEach(function(p){
        var nome=p.nome||p;
        var ea=p.escudoA||'',eb=p.escudoB||'';
        ea=ea.replace(/\?.*$/,'');eb=eb.replace(/\?.*$/,'');
        var ca=p.timeACor||'#ff0000',cb=p.timeBCor||'#0000ff';
        var sa=p.siglaA||'?',sb=p.siglaB||'?';
        var ta=p.timeA||'Time A',tb=p.timeB||'Time B';
        h+='<div class="preset-item">';
        h+='<input type="checkbox" class="cb-preset" value="'+nome+'" style="flex-shrink:0">';
        h+='<div class="preset-left">';
        if(ea)h+='<img class="preset-escudo" src="'+ea+'?v='+ts+'" alt="" onerror="this.outerHTML=\'<span class=preset-escudo style=background:'+ca+';border-radius:2px;display:inline-block></span>\'">';
        else h+='<span class="preset-escudo" style="background:'+ca+';border-radius:2px;display:inline-block"></span>';
        h+='<div class="preset-times">';
        h+='<div class="preset-siglas"><span style="color:'+ca+'">'+sa+'</span><span class="vs">×</span><span style="color:'+cb+'">'+sb+'</span></div>';
        h+='<div class="preset-nomes" title="'+ta+' × '+tb+'">'+ta+' × '+tb+'</div>';
        h+='<div class="preset-barras"><div class="preset-barra" style="background:'+ca+'"></div><div class="preset-barra" style="background:'+cb+'"></div></div>';
        h+='</div>';
        var comp=p.competicao||'',cat=p.categoria||'',grp=p.grupo||'',fase=p.fase||'',
            data=p.data||'',hora=p.hora||'',local=p.local||'';
        h+='<div class="preset-nome-file" title="'+nome+'">'+nome+'</div>';
        var metaParts=[];
        if(cat)metaParts.push(cat);
        if(grp)metaParts.push(grp);
        if(fase)metaParts.push(fase);
        var meta=metaParts.join(' · ');
        if(data){meta+=' · '+data;if(hora)meta+=' '+hora;}
        if(local)meta+=' · '+local;
        if(meta)h+='<div class="preset-meta">'+meta+'</div>';
        if(eb)h+='<img class="preset-escudo" src="'+eb+'?v='+ts+'" alt="" onerror="this.outerHTML=\'<span class=preset-escudo style=background:'+cb+';border-radius:2px;display:inline-block></span>\'">';
        else h+='<span class="preset-escudo" style="background:'+cb+';border-radius:2px;display:inline-block"></span>';
        h+='</div>';
        h+='<div class="preset-botoes">';
        h+='<button onclick="Controle.carregarPreset(\''+nome+'\')" style="background:#4CAF50;color:#fff">✅</button>';
        h+='<button onclick="Controle.baixarThumbnail(\''+nome+'\')" style="background:#2196F3;color:#fff;font-size:11px" title="Baixar thumbnail JPG">📷</button>';
        h+='<button onclick="Controle.adicionarThumbnailMidia(\''+nome+'\')" style="background:#9C27B0;color:#fff;font-size:11px" title="Adicionar ao menu de mídias">➕</button>';
        h+='<button onclick="Controle.removerPreset(\''+nome+'\')" class="btn-remover">✕</button>';
        h+='</div>';
        h+='</div>';
    });
    el.innerHTML=h;
    document.getElementById('selTodosPresets').checked=false;
};

/* a classificacao vai para o preset sem os base64 embutidos (escudos ficam em escudos/) */
Controle._timesParaPreset=function(){
    var e=Controle.estado||{};
    if(!e.tabelaTimes)return '';
    try{
        var t=JSON.parse(e.tabelaTimes);
        if(!t||!t.length)return '';
        t.forEach(function(x){ if(x&&x.crest&&x.crest.indexOf('data:')===0)x.crest=''; });
        return JSON.stringify(t);
    }catch(err){return '';}
};

Controle.salvarPreset=async function(){
    var e=Controle.estado;
    var ta=e.timeA||'',tb=e.timeB||'';
    if(!ta&&!tb){alert('Defina os times primeiro');return;}
    // Se tem preset carregado, sobrescreve; senao gera nome novo
    var nome;
    if(Controle._presetAtual){
        nome=Controle._presetAtual;
    }else{
        var sa=(e.siglaA||ta.replace(/[^a-zA-Z]/g,'').substring(0,4).toUpperCase()||'TA').substring(0,4);
        var sb=(e.siglaB||tb.replace(/[^a-zA-Z]/g,'').substring(0,4).toUpperCase()||'TB').substring(0,4);
        var cat=e.categoria||'',grp=e.grupo||'',fase=e.fase||'';
        var catAbbrev='',grpClean='';
        if(cat){var cp=cat.split(' ');catAbbrev=cp[0];for(var i=1;i<cp.length;i++)catAbbrev+=cp[i][0].toUpperCase();}
        if(grp)grpClean=grp.replace(/\s/g,'');
        else if(fase)grpClean=fase.replace(/\s/g,'');
        var prefix=catAbbrev?(catAbbrev+'_'+(grpClean||'')+'_'):'';
        nome=prefix+sa+'_x_'+sb;
        nome=nome.replace(/[^a-zA-Z0-9_]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'');
    }
    var dados={
        timeA:e.timeA||'',timeB:e.timeB||'',
        siglaA:e.siglaA||'',siglaB:e.siglaB||'',
        escudoA:e.escudoA||'',escudoB:e.escudoB||'',
        timeACor:e.timeACor||'#ff0000',timeBCor:e.timeBCor||'#0000ff',
        competicao:e.competicao||'',categoria:e.categoria||'',grupo:e.grupo||'',fase:e.fase||'',
        data:e.data||'',hora:e.hora||'',local:e.local||'',logoTorneio:e.logoTorneio||Controle._derivarLogoTorneio(e.competicao),
        tema:e.tema||'laliga',fonte:e.fonte||'arial',
        nomesExpandidos:e.nomesExpandidos||'false',
        notifAnimacao:e.notifAnimacao||'esquerda',
        placarScale:e.placarScale||'0.65',
        placarX:e.placarX||'50',placarY:e.placarY||'50',
        clima:e.clima||'',climaIcone:e.climaIcone||'',
        // overlay de classificacao
        tabelaAtivo:e.tabelaAtivo||'false',tabelaTema:e.tabelaTema||'auto',
        tabelaModo:e.tabelaModo||'auto',tabelaCena:e.tabelaCena||'table',
        tabelaCenas:e.tabelaCenas||'',tabelaDestaque:e.tabelaDestaque||'auto',
        tabelaTitulo:e.tabelaTitulo||'',tabelaSub:e.tabelaSub||'',
        tabelaZonas:e.tabelaZonas||'true',tabelaZonaUp:e.tabelaZonaUp||'1',
        tabelaZonaDn:e.tabelaZonaDn||'14',tabelaEscudos:e.tabelaEscudos||'true',
        tabelaEscalacoes:e.tabelaEscalacoes||'{}',
        tabelaTimes:Controle._timesParaPreset(),
        tabelaLayout:e.tabelaLayout||'{}',
        tabelaLocal:e.tabelaLocal||e.local||'',tabelaHora:e.tabelaHora||e.hora||'',
        tabelaLogo:e.tabelaLogo||e.logoTorneio||'',
        tabelaZonaCorUp:e.tabelaZonaCorUp||'#22c55e',tabelaZonaCorDn:e.tabelaZonaCorDn||'#ef4444',
        // repertorio de midias (arquivos + notificacoes de texto)
        midias:e.midias||'[]',midiasAtivas:e.midiasAtivas||'[]'
    };
    try{
        var r=await fetch(API+API_AND+'acao=salvar_preset',{method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({nome:nome,dados:dados})});
        var data=await r.json();
        if(data.ok){Controle.listarPresets();Controle.status('ok','✅ Preset "'+nome+'" salvo');}
        else{alert('Erro: '+data.erro);}
    }catch(e){Controle.status('erro','❌ Erro ao salvar preset');}
};

Controle.atualizarNomePreset=function(){
    var el=document.getElementById('presetNomeAuto');
    if(!el)return;
    var e=Controle.estado;
    var ta=e.timeA||'',tb=e.timeB||'';
    if(!ta&&!tb){el.textContent='TimeA_x_TimeB';
        var extra=document.getElementById('presetInfoExtra');if(extra)extra.textContent='';
        return;}
    var sa=(e.siglaA||ta.replace(/[^a-zA-Z]/g,'').substring(0,4).toUpperCase()||'TA').substring(0,4);
    var sb=(e.siglaB||tb.replace(/[^a-zA-Z]/g,'').substring(0,4).toUpperCase()||'TB').substring(0,4);
    var cat=e.categoria||'',grp=e.grupo||'',fase=e.fase||'';
    var catAbbrev='',grpClean='';
    if(cat){var cp=cat.split(' ');catAbbrev=cp[0];for(var i=1;i<cp.length;i++)catAbbrev+=cp[i][0].toUpperCase();}
    if(grp)grpClean=grp.replace(/\s/g,'');
    else if(fase)grpClean=fase.replace(/\s/g,'');
    var prefix=catAbbrev?(catAbbrev+'_'+(grpClean||'')+'_'):'';
    var nome=prefix+sa+'_x_'+sb;
    nome=nome.replace(/[^a-zA-Z0-9_]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'');
    el.textContent=nome;
    var extra=document.getElementById('presetInfoExtra');
    if(extra){
        var parts=[];
        if(e.competicao)parts.push(e.competicao);
        if(e.data){var d=e.data;if(e.hora)d+=' '+e.hora;parts.push(d);}
        if(e.local)parts.push(e.local);
        extra.textContent=parts.join(' · ');
    }
};

Controle.carregarPreset=async function(nome){
    try{
        var r=await fetch(API+API_AND+'acao=carregar_preset&nome='+encodeURIComponent(nome));
        var dados=await r.json();
        if(dados.erro){Controle.status('erro','❌ '+dados.erro);return;}
        // Sanitiza tema e fonte pra valores validos do futebol
        var TEMAS_VALIDOS={laliga:1,colorido:1,simples:1};
        if(!TEMAS_VALIDOS[dados.tema])dados.tema='laliga';
        if(!FONTES[dados.fonte])dados.fonte='arial';
        // Evita sobrescrever escudos existentes com vazio do preset
        if(!dados.escudoA)delete dados.escudoA;
        if(!dados.escudoB)delete dados.escudoB;
        await Controle.setEstado(dados);
        Controle._presetAtual=nome;  // lembra qual preset foi carregado
        Controle.atualizarNomePreset();
        Controle.status('ok','✅ Preset "'+nome+'" carregado');
    }catch(e){Controle.status('erro','❌ Erro ao carregar preset: '+e.message);}
};

Controle.toggleTodosPresets=function(){
    var on=document.getElementById('selTodosPresets').checked;
    document.querySelectorAll('.cb-preset').forEach(function(cb){cb.checked=on;});
};

Controle.removerPresetsMarcados=function(){
    var nomes=[];
    document.querySelectorAll('.cb-preset:checked').forEach(function(cb){nomes.push(cb.value);});
    if(nomes.length===0)return;
    if(!confirm('Remover '+nomes.length+' preset(s)?'))return;
    (async function(){
        var ok=0;
        for(var i=0;i<nomes.length;i++){
            try{
                var r=await fetch(API+API_AND+'acao=remover_preset',{method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({nome:nomes[i]})});
                var data=await r.json();
                if(data.ok)ok++;
            }catch(e){}
        }
        if(ok>0)Controle.listarPresets();
        Controle.status('ok','✅ '+ok+' presets removidos');
    })();
};

Controle.removerPreset=async function(nome){
    if(!confirm('Remover preset "'+nome+'"?'))return;
    try{
        var r=await fetch(API+API_AND+'acao=remover_preset',{method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({nome:nome})});
        var data=await r.json();
        if(data.ok)Controle.listarPresets();
    }catch(e){Controle.status('erro','❌ Erro ao remover preset');}
};

// ===== THUMBNAIL =====
Controle.resolveEscudo = function(url) {
    if (!url) return '';
    url = url.replace(/\?.*$/, '');
    if (url.match(/^https?:\/\//)) {
        return API+API_AND+'acao=proxy_imagem&url=' + encodeURIComponent(url);
    }
    return url;
};

Controle.baixarThumbnail = function(nome) {
    var p = Controle._presets.find(function(x) { return (x.nome || x) === nome; });
    if (!p) return;
    Controle.gerarThumbnail(p, function(dataURL) {
        var a = document.createElement('a');
        a.href = dataURL;
        a.download = (p.nome || 'thumbnail') + '.jpg';
        a.click();
        Controle.status('ok', '✅ Thumbnail baixada');
    });
};

Controle.adicionarThumbnailMidia = function(nome) {
    var p = Controle._presets.find(function(x) { return (x.nome || x) === nome; });
    if (!p) return;
    Controle.status('sync', '🎨 Gerando thumbnail...');
    Controle.gerarThumbnail(p, function(dataURL) {
        var id = 'thumb_' + Date.now();
        var nomeMidia = '📋 ' + (p.siglaA || 'A') + ' × ' + (p.siglaB || 'B');
        Controle.thumbCache[id] = dataURL;
        fetch(API+API_AND+'acao=upload_midia', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                id: id, tipo: 'imagem', src: dataURL,
                nome: nomeMidia, transicao: 'fade',
                duracao: 0, intervalo: 0
            })
        }).then(function(r) { return r.json(); }).then(function(data) {
            if (data.ok) {
                var midias = Controle.getMidiasCtrl ? Controle.getMidiasCtrl() : [];
                midias.push({
                    id: id,
                    tipo: 'imagem',
                    nome: nomeMidia,
                    transicao: 'fade',
                    duracao: 0,
                    intervalo: 0,
                    src: 'midias/' + id + '.jpg'
                });
                Controle.estado.midias = JSON.stringify(midias);
                Controle.setEstado({midias: JSON.stringify(midias)});
                if (Controle.renderMidias) Controle.renderMidias();
                Controle.status('ok', '✅ Adicionada às mídias: ' + nomeMidia);
            } else {
                Controle.status('erro', '❌ Erro do servidor: ' + (data.erro || 'desconhecido'));
            }
        }).catch(function(e) {
            Controle.status('erro', '❌ Erro ao salvar mídia');
        });
    });
};

Controle.importarPresets=function(){
    var inp=document.createElement('input');inp.type='file';
    inp.accept='.json';inp.setAttribute('multiple','');
    inp.style.display='none';
    inp.onchange=async function(e){
        var files=e.target.files;
        if(!files||files.length===0){inp.remove();return;}
        Controle.status('sync','🔄 Importando '+files.length+' arquivo(s)...');
        var count=0,erros=[];
        for(var i=0;i<files.length;i++){
            var f=files[i];
            if(!f.name.endsWith('.json'))continue;
            try{
                var txt=await f.text();
                var dados=JSON.parse(txt);
                var lista=dados.presets&&Array.isArray(dados.presets)?dados.presets:null;
                if(lista){
                    for(var j=0;j<lista.length;j++){
                        var p=lista[j];
                        // Auto-deriva logoTorneio da competicao
                        if(!p.logoTorneio&&p.competicao)p.logoTorneio=Controle._derivarLogoTorneio(p.competicao);
                        var nome=p.nome||(f.name.replace(/\.json$/,'').replace(/[^a-zA-Z0-9_\-]/g,'_')+'_'+j);
                        try{
                            var r=await fetch(API+API_AND+'acao=salvar_preset',{method:'POST',
                                headers:{'Content-Type':'application/json'},
                                body:JSON.stringify({nome:nome,dados:p})});
                            if(!r.ok){erros.push(nome+' (HTTP '+r.status+')');continue;}
                            var respData=await r.json();
                            if(respData.ok)count++;
                            else erros.push(nome+': '+(respData.erro||'desconhecido'));
                        }catch(ex){erros.push(nome+': '+ex.message);}
                    }
                }else{
                    var nome=f.name.replace(/\.json$/,'').replace(/[^a-zA-Z0-9_\-]/g,'_');
                    // Auto-deriva logoTorneio da competicao
                    if(!dados.logoTorneio&&dados.competicao)dados.logoTorneio=Controle._derivarLogoTorneio(dados.competicao);
                    try{
                        var r=await fetch(API+API_AND+'acao=salvar_preset',{method:'POST',
                            headers:{'Content-Type':'application/json'},
                            body:JSON.stringify({nome:nome,dados:dados})});
                        if(!r.ok){erros.push(nome+' (HTTP '+r.status+')');continue;}
                        var data=await r.json();
                        if(data.ok)count++;
                        else erros.push(nome+': '+(data.erro||'desconhecido'));
                    }catch(ex){erros.push(nome+': '+ex.message);}
                }
            }catch(ex){erros.push(f.name+': JSON invalido - '+ex.message);}
        }
        Controle.listarPresets();
        var msg='✅ '+count+' preset(s) importados';
        if(erros.length>0)msg+=' | ❌ '+erros.length+' erro(s): '+erros.slice(0,3).join(', ')+(erros.length>3?'...':'');
        Controle.status(erros.length>0?'erro':'ok',msg);
        inp.remove();
    };
    inp.addEventListener('cancel',function(){inp.remove();});
    document.body.appendChild(inp);
    inp.click();
};

Controle.exportarPresets=async function(){
    // Fetch all presets (sem filtro), build JSON, download
    try{
        var r=await fetch(API+API_AND+'acao=listar_presets');
        var data=await r.json();
        var presets=data.presets||[];
        if(presets.length===0){alert('Nenhum preset para exportar');return;}
        // Busca dados completos de cada preset
        var tudo=[];
        for(var i=0;i<presets.length;i++){
            var nome=presets[i].nome;
            try{
                var rr=await fetch(API+API_AND+'acao=carregar_preset&nome='+encodeURIComponent(nome));
                var dd=await rr.json();
                if(!dd.erro)tudo.push(dd);
            }catch(e){}
        }
        var blob=new Blob([JSON.stringify({presets:tudo},null,2)],{type:'application/json'});
        var a=document.createElement('a');
        a.href=URL.createObjectURL(blob);
        a.download='presets_export_'+new Date().toISOString().slice(0,10)+'.json';
        a.click();
        URL.revokeObjectURL(a.href);
        Controle.status('ok','✅ '+tudo.length+' presets exportados');
    }catch(e){Controle.status('erro','❌ Erro ao exportar presets');}
};




Controle.gerarThumbnail = function(p, callback) {
    var canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    var ctx = canvas.getContext('2d');
    
    var ta = p.timeA || 'TIME A', tb = p.timeB || 'TIME B';
    var sa = p.siglaA || ta.substring(0, 4).toUpperCase();
    var sb = p.siglaB || tb.substring(0, 4).toUpperCase();
    var ca = p.timeACor || '#ffffff';
    var cb = p.timeBCor || '#ffffff';
    var data = p.data || '', hora = p.hora || '', local = p.local || '';
    var comp = p.competicao || '', cat = p.categoria || '', fase = p.fase || '';
    
    function drawCalendar(x, y, s) {
        var k = 1.5;
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(x-8*k, y-9*k, 18*k, 5*k);
        ctx.fillRect(x-8*k, y-4*k, 18*k, 15*k);
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(x-8*k, y-9*k, 18*k, 18*k);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(x-4*k, y-6*k, 3*k, 3*k); ctx.fillRect(x+1*k, y-6*k, 3*k, 3*k);
    }
    function drawClock(x, y, s) {
        var k = 1.5;
        ctx.beginPath(); ctx.arc(x, y, 9*k, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2*k; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y-6*k); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+5*k, y); ctx.stroke();
    }
    function drawPin(x, y, s) {
        var k = 1.5;
        ctx.beginPath(); ctx.arc(x, y-3*k, 6*k, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(x-3*k, y+3*k); ctx.lineTo(x, y+12*k); ctx.lineTo(x+3*k, y+3*k);
        ctx.fill();
    }
    function drawTrophy(x, y, s) {
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(x-6, y-5, 12, 3);
        ctx.fillRect(x-3, y-5, 6, 10);
        ctx.beginPath(); ctx.arc(x-6, y-1, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+6, y-1, 4, 0, Math.PI*2); ctx.fill();
    }
    
    // Fundo azul texturizado
    var bgGrad = ctx.createRadialGradient(500, 200, 100, 960, 540, 1400);
    bgGrad.addColorStop(0, '#0d1b3e');
    bgGrad.addColorStop(0.4, '#06122b');
    bgGrad.addColorStop(1, '#020818');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (var i = 0; i < 3000; i++) {
        ctx.fillRect(Math.random() * 1920, Math.random() * 1080, 2, 2);
    }
    
    // Barras superior e inferior
    var topBar = ctx.createLinearGradient(0, 0, 1920, 0);
    topBar.addColorStop(0, ca); topBar.addColorStop(0.5, '#ffd700'); topBar.addColorStop(1, cb);
    ctx.fillStyle = topBar; ctx.fillRect(0, 0, 1920, 8);
    var botBar = ctx.createLinearGradient(0, 0, 1920, 0);
    botBar.addColorStop(0, cb); botBar.addColorStop(0.5, '#ffd700'); botBar.addColorStop(1, ca);
    ctx.fillStyle = botBar; ctx.fillRect(0, 1072, 1920, 8);
    
    // Título "LIVE"
    ctx.fillStyle = '#ffd700';
    ctx.font = '900 48px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LIVE', 960, 80);
    
    // Logo do torneio (192px)
    var lx = 960, ly = 220;
    function drawPlaceholderLogo() {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath(); ctx.roundRect(lx - 96, ly - 96, 192, 192, 20); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();
        drawTrophy(lx, ly);
    }
    
    // Escudos maiores: 240px
    var shieldSize = 240, leftX = 420, rightX = 1500, shieldY = 550;
    
    function drawAll() {
        function drawShield(x, y, cor, sigla) {
            var half = shieldSize / 2;
            var grad = ctx.createLinearGradient(x - half, y - half, x + half, y + half);
            grad.addColorStop(0, cor); grad.addColorStop(1, cor + '44');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.roundRect(x - half, y - half, shieldSize, shieldSize, 12); ctx.fill();
        }
        drawShield(leftX, shieldY, ca, sa);
        drawShield(rightX, shieldY, cb, sb);
        
        ctx.fillStyle = '#fff';
        ctx.font = '800 60px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sa, leftX, shieldY + 185);
        ctx.fillText(sb, rightX, shieldY + 185);
        
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '600 22px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(ta.toUpperCase(), leftX, shieldY + 222);
        ctx.fillText(tb.toUpperCase(), rightX, shieldY + 222);
        
        ctx.textAlign = 'center';
        var centerY = shieldY - 50;
        if (cat) {
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '300 34px "Segoe UI", system-ui, sans-serif';
            ctx.fillText(cat.toUpperCase(), 960, centerY);
            centerY += 40;
        }
        if (fase) {
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.font = '300 24px "Segoe UI", system-ui, sans-serif';
            ctx.fillText(fase.toUpperCase(), 960, centerY);
            centerY += 32;
        }
        
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.font = '300 48px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('X', 960, centerY + 16);
        
        var infoY = 850;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '300 31px "Segoe UI", system-ui, sans-serif';
        var infoParts = [];
        if (data) infoParts.push(data);
        if (hora) infoParts.push(hora);
        if (local) infoParts.push(local);
        var infoText = infoParts.join('    ');
        if (infoText) {
            var infoWidth = ctx.measureText(infoText).width;
            var startX = 960 - infoWidth / 2;
            var posX = startX;
            if (data) {
                drawCalendar(posX + 10, infoY - 12, 14);
                var dw = ctx.measureText(data).width;
                ctx.fillText(data, posX + dw/2 + 28, infoY);
                posX += dw + 80;
            }
            if (hora) {
                drawClock(posX + 10, infoY - 12, 14);
                var hw = ctx.measureText(hora).width;
                ctx.fillText(hora, posX + hw/2 + 28, infoY);
                posX += hw + 80;
            }
            if (local) {
                drawPin(posX + 10, infoY - 12, 14);
                var lw = ctx.measureText(local).width;
                ctx.fillText(local, posX + lw/2 + 28, infoY);
            }
        }
        
        var accentY = infoY + 40;
        var barG = ctx.createLinearGradient(0, 0, 200, 0);
        barG.addColorStop(0, ca); barG.addColorStop(0.5, '#ffd700'); barG.addColorStop(1, cb);
        ctx.fillStyle = barG;
        ctx.fillRect(860, accentY, 200, 4);
        
        var botY = 940;
        if (comp) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '300 28px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(comp.toUpperCase(), 960, botY);
        }
        
        var ea = Controle.resolveEscudo(p.escudoA || '');
        var eb = Controle.resolveEscudo(p.escudoB || '');
        var loaded = 0, need = 0, fired = false;
        
        // Timeout de segurança: 8s
        var safetyTimer = setTimeout(function() {
            if (!fired) { fired = true; callback(canvas.toDataURL('image/jpeg', 0.92)); }
        }, 8000);
        
        function tryLoad(url, x, y) {
            if (!url) return;
            need++;
            var img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                if (fired) return;
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(x - shieldSize/2, y - shieldSize/2, shieldSize, shieldSize, 12);
                ctx.clip();
                var iw = img.naturalWidth, ih = img.naturalHeight;
                var scale = Math.min(shieldSize / iw, shieldSize / ih);
                var dw = iw * scale, dh = ih * scale;
                ctx.drawImage(img, x - dw/2, y - dh/2, dw, dh);
                ctx.restore();
                loaded++;
                if (loaded === need) { fired = true; clearTimeout(safetyTimer); callback(canvas.toDataURL('image/jpeg', 0.92)); }
            };
            img.onerror = function() {
                if (fired) return;
                loaded++;
                if (loaded === need) { fired = true; clearTimeout(safetyTimer); callback(canvas.toDataURL('image/jpeg', 0.92)); }
            };
            img.src = url;
        }
        tryLoad(ea, leftX, shieldY);
        tryLoad(eb, rightX, shieldY);
        if (need === 0) { fired = true; clearTimeout(safetyTimer); callback(canvas.toDataURL('image/jpeg', 0.92)); }
    }
    
    // Logo do torneio
    var logoTorneio = p.logoTorneio || Controle._derivarLogoTorneio(p.competicao);
    if (logoTorneio) {
        var logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = function() {
            var maxW = 170, maxH = 170;
            var iw = logoImg.naturalWidth, ih = logoImg.naturalHeight;
            var scale = Math.min(maxW / iw, maxH / ih);
            var dw = iw * scale, dh = ih * scale;
            ctx.drawImage(logoImg, lx - dw/2, ly - dh/2, dw, dh);
            drawAll();
        };
        logoImg.onerror = function() { drawPlaceholderLogo(); drawAll(); };
        logoImg.src = 'torneios/' + logoTorneio;
    } else {
        drawPlaceholderLogo();
        drawAll();
    }
};

Controle.filtrarPresets=function(){
    Controle.listarPresets();
};

Controle.carregarFiltros=async function(){
    try{
        var r=await fetch(API+API_AND+'acao=listar_filtros');
        var data=await r.json();
        ['competicao','categoria','grupo','fase','data','hora','local'].forEach(function(t){
            var sel=document.getElementById('filtro'+t.charAt(0).toUpperCase()+t.slice(1));
            if(!sel)return;
            var val=sel.value;
            sel.innerHTML='<option value="">'+(t==='competicao'?'Todas competições':t==='categoria'?'Todas categorias':t==='grupo'?'Todos grupos':t==='fase'?'Todas fases':t==='data'?'Datas':t==='hora'?'Horários':'Locais')+'</option>';
            (data[t]||[]).forEach(function(v){
                var opt=document.createElement('option');opt.value=v;opt.textContent=v;sel.appendChild(opt);
            });
            sel.value=val;
        });
    }catch(e){}
};

Controle.atualizarFiltros=function(){
    var presets=Controle._presets;
    if(!presets||!presets.length)return;
    var campos=['competicao','categoria','grupo','fase','data','hora','local'];
    campos.forEach(function(campo){
        var sel=document.getElementById('filtro'+campo.charAt(0).toUpperCase()+campo.slice(1));
        if(!sel)return;
        var atual=sel.value;
        var vals={};
        presets.forEach(function(p){
            var v=(p[campo]||'').trim();
            if(v)vals[v]=true;
        });
        var opcoes=Object.keys(vals).sort();
        if(opcoes.length>0){
            sel.innerHTML='<option value="">'+(campo==='competicao'?'Todas':campo==='categoria'?'Todas':campo==='grupo'?'Todos':campo==='fase'?'Todas':campo==='data'?'Datas':campo==='hora'?'Horarios':'Locais')+'</option>';
            opcoes.forEach(function(v){
                var opt=document.createElement('option');opt.value=v;opt.textContent=v;sel.appendChild(opt);
            });
            if(atual&&opcoes.includes(atual))sel.value=atual;
        }
    });
};