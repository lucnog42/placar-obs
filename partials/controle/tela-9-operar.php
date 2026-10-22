<section class="tela" id="tela-9" data-titulo="Operar ao vivo">
  <h2 class="titulo">🎯 Operar ao vivo</h2>
  <div class="grid-inner">
    <section class="full">
      <p>Overlay <span class="hint">ligar/desligar + configuração</span></p>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <button id="btnTabela" class="btn-tabela" onclick="Controle.alternarTabela()" style="width:auto;min-width:170px">▶ Ligar overlay</button>
        <span class="badge" id="tabelaBadge">fora do ar</span>
        <button id="toggleNomesBtn" onclick="Controle.alternarNomes()" style="background:#2a3a55">📝 Nomes</button>
        <button onclick="Controle.toggleOverlayPop()" style="background:#2a3a55">⚙️ Configuração</button>
      </div>
      <div id="tabelaSemCsv" class="escondido aviso-csv">
        ⚠ <b>Nenhuma classificação carregada.</b> As cenas de <b>tabela, duelo, destaque, forma e escalações</b>
        ficam desativadas até você importar o CSV da classificação.
        Abertura, intervalo e encerramento continuam funcionando.
      </div>
      <div class="overlay-pop" id="overlayPop">
        <p style="font-size:11px;color:#93a4c0;margin:0 0 6px">Modo de exibição</p>
        <div class="modo-row">
          <label class="toggle-sw" title="Ligado = cena fixa · Desligado = linha do tempo">
            <input type="checkbox" id="tabelaFixa" onchange="Controle.alternarModoTabela(this.checked)"><span class="slider"></span>
          </label>
          <span class="modo-lbl auto" id="tabelaModoLabel">Linha do tempo</span>
          <button class="btn-play" id="btnTabelaPlay" onclick="Controle.tocarSequencia()" title="Recomeça a sequência agora">▶ Tocar</button>
        </div>
        <select id="tabelaModo" class="escondido">
          <option value="auto">Linha do tempo (sequência)</option>
          <option value="fixa">Cena fixa</option>
        </select>
        <div id="blocoCenaFixa" class="escondido">
          <p style="font-size:11px;color:#93a4c0;margin:6px 0 3px">Cena fixa <span class="hint">(entra na cena que estava no ar)</span></p>
          <select id="tabelaCena" onchange="Controle.definirCenaTabela(this.value)" style="width:100%"></select>
        </div>
        <div class="overlay-cat" onclick="Controle.abrirCenas()" style="margin-top:8px"><span>🎬 Ajustar cenas…</span><span style="color:#93a4c0;font-size:10px">linha do tempo</span></div>
        <p style="font-size:11px;color:#93a4c0;margin:12px 0 4px">🖼 Fundos das cenas <span class="hint">PNG · JPG · GIF</span></p>
        <div id="fundoCenas" class="fundo-cenas"></div>
        <div id="fundoPick" class="escondido">
          <p id="fundoPickAlvo" style="font-size:11px;color:#93a4c0;margin:8px 0 4px">Biblioteca de fundos</p>
          <div id="fundoBiblioteca" class="fundo-lib"></div>
        </div>
      </div>
      <p style="font-size:11px;color:#93a4c0;margin:12px 0 4px">Cenas manuais <span class="hint">abertura · intervalo · encerramento (clique de novo para desligar)</span></p>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button onclick="Controle.intervalo('intro')" style="background:#7c3aed;color:#fff;font-size:13px;padding:10px 14px">🔴 Abertura</button>
        <button onclick="Controle.intervalo('intervalo')" style="background:#b45309;color:#fff;font-size:13px;padding:10px 14px">⏸ Intervalo</button>
        <button onclick="Controle.intervalo('encerramento')" style="background:#0f172a;color:#fff;font-size:13px;padding:10px 14px">🏁 Encerramento</button>
      </div>
    </section>
    <section class="full">
      <p>⚡ Menu rápido</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap" id="menuRapido"></div>
    </section>
    <section class="full" id="secaoHistorico">
      <p>🔔 Histórico de Notificações <span class="hint">texto enviado/guardado</span></p>
      <div id="listaNotificacoes" style="min-height:60px;max-height:340px;overflow-y:auto"><span style="color:#888;font-size:11px;">Nenhuma notificação no histórico</span></div>
    </section>
    <section>
      <p>Pontos</p>
      <div class="futebol-ctrl">
        <button class="A" onclick="Controle.adicionarGol(1,'A')">+ <span class="nomeTimeA">Time A</span></button>
        <button class="A" onclick="Controle.adicionarGol(-1,'A')">- <span class="nomeTimeA">Time A</span></button><br>
        <button class="B" onclick="Controle.adicionarGol(1,'B')">+ <span class="nomeTimeB">Time B</span></button>
        <button class="B" onclick="Controle.adicionarGol(-1,'B')">- <span class="nomeTimeB">Time B</span></button>
      </div>
      <div class="basquete-ctrl basquete-pontos" style="display:none">
        <button class="A" onclick="Controle.adicionarGol(3,'A')">+3 <span class="nomeTimeA">Time A</span></button>
        <button class="A" onclick="Controle.adicionarGol(2,'A')">+2 <span class="nomeTimeA">Time A</span></button>
        <button class="A" onclick="Controle.adicionarGol(1,'A')">+1 <span class="nomeTimeA">Time A</span></button>
        <button class="A" onclick="Controle.adicionarGol(-1,'A')">-1</button><br>
        <button class="B" onclick="Controle.adicionarGol(3,'B')">+3 <span class="nomeTimeB">Time B</span></button>
        <button class="B" onclick="Controle.adicionarGol(2,'B')">+2 <span class="nomeTimeB">Time B</span></button>
        <button class="B" onclick="Controle.adicionarGol(1,'B')">+1 <span class="nomeTimeB">Time B</span></button>
        <button class="B" onclick="Controle.adicionarGol(-1,'B')">-1</button>
      </div>
      <button onclick="Controle.zerarGols()">Zerar</button>
    </section>
    <section class="basquete-ctrl" style="display:none">
      <p>Período</p>
      <select id="periodoSelect" onchange="Controle.definirPeriodo(this.value)" style="width:100%;margin-bottom:4px">
        <option value="1Q">1º Quarto</option>
        <option value="2Q">2º Quarto</option>
        <option value="3Q">3º Quarto</option>
        <option value="4Q">4º Quarto</option>
        <option value="OT">Prorrogação</option>
      </select>
      <div style="display:flex;gap:4px;align-items:center;font-size:11px">
        <span>Duração:</span>
        <button onclick="Controle.definirDuracaoQuarto(10)" style="font-size:11px">10 min</button>
        <button onclick="Controle.definirDuracaoQuarto(12)" style="font-size:11px">12 min</button>
      </div>
    </section>
    <section class="basquete-ctrl" style="display:none">
      <p>⏱ Shot Clock <span id="shotClockValor" style="color:#ffd700">24</span>s</p>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        <button onclick="Controle.shotClockStart()" style="background:#4CAF50;color:#fff">▶ Iniciar</button>
        <button onclick="Controle.shotClockPause()">⏸ Pausar</button>
        <button onclick="Controle.shotClockReset(24)">🔄 24s</button>
        <button onclick="Controle.shotClockReset(14)">🔄 14s</button>
      </div>
    </section>
    <section class="full">
      <p>Tempo</p>
      <div class="tempo-row">
        <button onclick="Controle.cronometro('start')">▶ Iniciar</button>
        <button onclick="Controle.cronometro('pause')">⏸ Pausar</button>
        <button onclick="Controle.cronometro('reset')">🔄 Resetar</button>
        <span>Definir:</span>
        <input type="number" id="minutos" placeholder="MM" style="width:50px;">
        <input type="number" id="segundos" placeholder="SS" style="width:50px;">
        <button onclick="Controle.definirTempo()">⏱ Set</button>
      </div>
    </section>
    <section class="basquete-ctrl" style="display:none">
      <p>⚠ Faltas</p>
      <div id="faltasACtrl" style="margin-bottom:4px;font-size:12px">Faltas Time A: 0</div>
      <div style="display:flex;gap:3px;margin-bottom:6px">
        <button onclick="Controle.adicionarFalta('A')" style="background:#ff6b35;color:#fff;font-size:11px;padding:2px 8px">+ Falta A</button>
        <button onclick="Controle.removerFalta('A')" style="font-size:11px;padding:2px 8px">- Falta A</button>
        <button onclick="Controle.toggleBonus('A')" style="font-size:11px;padding:2px 8px">Bonus A</button>
      </div>
      <div id="faltasBCtrl" style="margin-bottom:4px;font-size:12px">Faltas Time B: 0</div>
      <div style="display:flex;gap:3px;margin-bottom:6px">
        <button onclick="Controle.adicionarFalta('B')" style="background:#2196F3;color:#fff;font-size:11px;padding:2px 8px">+ Falta B</button>
        <button onclick="Controle.removerFalta('B')" style="font-size:11px;padding:2px 8px">- Falta B</button>
        <button onclick="Controle.toggleBonus('B')" style="font-size:11px;padding:2px 8px">Bonus B</button>
      </div>
      <button onclick="Controle.zerarFaltas()" style="font-size:11px">Zerar Faltas</button>
    </section>
    <section class="basquete-ctrl" style="display:none">
      <p>🏀 Posse de Bola</p>
      <button id="posseBtn" onclick="Controle.alternarPosse()" style="width:100%;font-size:12px">🏀 Posse: Time A</button>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button onclick="Controle.definirPosse('A')" style="flex:1;font-size:11px">◀ Time A</button>
        <button onclick="Controle.definirPosse('B')" style="flex:1;font-size:11px">Time B ▶</button>
      </div>
    </section>
    <section class="basquete-ctrl" style="display:none">
      <p>⏱ Timeouts</p>
      <div id="timeoutsACtrl" style="margin-bottom:4px;font-size:12px">⏱ Time A: 3</div>
      <div style="display:flex;gap:3px;margin-bottom:6px">
        <button onclick="Controle.pedirTimeout('A')" style="background:#ff6b35;color:#fff;font-size:11px;padding:2px 8px">Timeout A</button>
        <button onclick="Controle.resetarTimeouts('A')" style="font-size:11px;padding:2px 8px">↺ A</button>
      </div>
      <div id="timeoutsBCtrl" style="margin-bottom:4px;font-size:12px">⏱ Time B: 3</div>
      <div style="display:flex;gap:3px">
        <button onclick="Controle.pedirTimeout('B')" style="background:#2196F3;color:#fff;font-size:11px;padding:2px 8px">Timeout B</button>
        <button onclick="Controle.resetarTimeouts('B')" style="font-size:11px;padding:2px 8px">↺ B</button>
      </div>
    </section>
    <section class="futebol-ctrl full">
      <p>Pênaltis</p>
      <div class="SessaoPenaltes">
        <div><span class="nomeTimeA">Time A</span>
          <div><button id="PA1" class="btnPenaltes" onclick="Controle.alternarPenalte(this)">1</button>
          <button id="PA2" class="btnPenaltes" onclick="Controle.alternarPenalte(this)">2</button>
          <button id="PA3" class="btnPenaltes" onclick="Controle.alternarPenalte(this)">3</button>
          <button id="PA4" class="btnPenaltes" onclick="Controle.alternarPenalte(this)">4</button>
          <button id="PA5" class="btnPenaltes" onclick="Controle.alternarPenalte(this)">5</button></div>
        </div>
        <div><span class="nomeTimeB">Time B</span>
          <div><button id="PB1" class="btnPenaltes" onclick="Controle.alternarPenalte(this)">1</button>
          <button id="PB2" class="btnPenaltes" onclick="Controle.alternarPenalte(this)">2</button>
          <button id="PB3" class="btnPenaltes" onclick="Controle.alternarPenalte(this)">3</button>
          <button id="PB4" class="btnPenaltes" onclick="Controle.alternarPenalte(this)">4</button>
          <button id="PB5" class="btnPenaltes" onclick="Controle.alternarPenalte(this)">5</button></div>
        </div>
      </div>
      <button onclick="Controle.salvarPenalte()">Atualizar</button>
      <button id="togglePenaltesBtn" onclick="Controle.desativarPenalte()">Ativar</button>
    </section>
  </div>
</section>
