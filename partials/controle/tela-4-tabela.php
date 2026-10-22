<section class="tela" id="tela-4" data-titulo="Tabela">
  <h2 class="titulo">📊 Tabela (Classificação)</h2>
  <div class="grid-inner">
    <section>
      <p>Time destaque</p>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        <button id="btnDestA" onclick="Controle.destaquePlacar('a')">⭐ Casa (A)</button>
        <button id="btnDestB" onclick="Controle.destaquePlacar('b')">⭐ Fora (B)</button>
        <button id="btnDestAuto" onclick="Controle.definirDestaqueTabela('auto')">Automático</button>
      </div>
      <select id="tabelaDestaque" onchange="Controle.definirDestaqueTabela(this.value)" style="width:100%;margin-top:6px"></select>
      <span class="hint" id="tabelaDadosInfo"></span>
    </section>
    <section>
      <p>Zonas &amp; escudos</p>
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
        <label style="font-size:11px"><input type="checkbox" id="tabelaZonas" onchange="Controle.definirZonasTabela()"> Zonas</label>
        <label style="font-size:11px">1º–<input id="tabelaZonaUp" style="width:46px" onchange="Controle.definirZonasTabela()"></label>
        <label style="font-size:11px"><input id="tabelaZonaDn" style="width:46px" onchange="Controle.definirZonasTabela()">–16º</label>
        <label style="font-size:11px"><input type="checkbox" id="tabelaEscudos" onchange="Controle.definirEscudosTabela()"> Escudos</label>
      </div>
    </section>
    <section class="full">
      <p>Classificação (CSV do fcf.cat: Pos;Equip;Punts;...;Escut)</p>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <label style="font-size:11px;color:#ddd">📄 Importar CSV da classificação:</label>
        <input type="file" id="tabelaCsvFile" accept=".csv,text/csv" onchange="Controle.importarClassificacao(this)" style="font-size:11px">
        <button onclick="Controle.baixarModeloCsv()" style="font-size:10px;padding:3px 8px" title="Baixa um CSV de exemplo com o cabeçalho">📄 Modelo CSV</button>
        <button onclick="Controle.sincronizarEscudos()" style="font-size:10px;padding:3px 8px" title="Confere a biblioteca escudos/ e baixa só o que falta">📥 Sincronizar escudos</button>
        <button onclick="Controle.conferirEscudos()" style="font-size:10px;padding:3px 8px" title="Diz quais times estão sem escudo na biblioteca, sem baixar nada">🔍 Conferir biblioteca</button>
        <span class="hint">importa os times e leva todos os escudos do CSV para a biblioteca (escudos/), baixando só os que ainda não estão lá</span>
        <span id="tabelaCsvInfo" class="hint"></span>
      </div>
      <p style="margin-top:9px">Escalações (CSV: jogador; número; posição — um arquivo por time)</p>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <label style="font-size:11px;color:#ddd">📄 Time A:</label>
        <input type="file" id="tabelaEscFileA" accept=".csv,text/csv" onchange="Controle.importarEscalacoes(this,'a')" style="font-size:11px">
        <label style="font-size:11px;color:#ddd">📄 Time B:</label>
        <input type="file" id="tabelaEscFileB" accept=".csv,text/csv" onchange="Controle.importarEscalacoes(this,'b')" style="font-size:11px">
        <button onclick="Controle.baixarModeloCsvJogadores()" style="font-size:10px;padding:3px 8px" title="Baixa um CSV de exemplo (jogador;numero;posicao)">📄 Modelo</button>
        <button onclick="Controle.limparEscalacoes()" style="font-size:10px;padding:3px 7px">Limpar</button>
        <span id="tabelaEscInfo" style="font-size:10px;color:#8fb2c8">nenhuma escalação carregada</span>
      </div>
    </section>
    <section class="full">
      <p>🎨 Escudos dos times <span class="hint">(trocar imagem)</span></p>
      <div id="tabelaTimesCrest" class="times-crest-list"><span class="hint">importe a classificação para listar os times</span></div>
    </section>
    <section class="full">
      <p>📚 Biblioteca de CSVs — Classificação <span class="hint">(tabela)</span></p>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:4px">
        <button onclick="Controle.salvarCsvAtual('tabela')" style="background:#2196F3;color:#fff">💾 Salvar classificação atual</button>
        <label style="font-size:11px;cursor:pointer;display:flex;align-items:center;gap:3px"><input type="checkbox" id="selTodos-csvs_tabela" onchange="Controle.toggleTodosLib('csvs_tabela')"> Selecionar Todos</label>
        <button onclick="Controle.agruparSelecionados('csvs_tabela')" style="font-size:11px;padding:2px 8px" title="Agrupa os CSVs marcados">🏷 Agrupar</button>
        <span class="hint">importe o CSV da classificação, clique em salvar e dê um nome</span>
      </div>
      <div class="biblioteca-toolbar">
        <input id="buscaCsvsTabela" placeholder="🔍 Buscar CSVs" oninput="Controle._aplicarFiltros('csvs_tabela')">
        <div id="gruposBar-csvs_tabela" class="grupos-bar"></div>
      </div>
      <div id="listaCsvsTabela"><span style="color:#888;font-size:11px">Carregando...</span></div>
    </section>
    <section class="full">
      <p>📚 Biblioteca de CSVs — Jogadores <span class="hint">(escalações)</span></p>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:4px">
        <button onclick="Controle.salvarCsvAtual('jogadores')" style="background:#2196F3;color:#fff">💾 Salvar jogadores atual</button>
        <label style="font-size:11px;cursor:pointer;display:flex;align-items:center;gap:3px"><input type="checkbox" id="selTodos-csvs_jogadores" onchange="Controle.toggleTodosLib('csvs_jogadores')"> Selecionar Todos</label>
        <button onclick="Controle.agruparSelecionados('csvs_jogadores')" style="font-size:11px;padding:2px 8px" title="Agrupa os CSVs marcados">🏷 Agrupar</button>
        <span class="hint">importe o CSV de escalações, clique em salvar e dê um nome</span>
      </div>
      <div class="biblioteca-toolbar">
        <input id="buscaCsvsJogadores" placeholder="🔍 Buscar CSVs" oninput="Controle._aplicarFiltros('csvs_jogadores')">
        <div id="gruposBar-csvs_jogadores" class="grupos-bar"></div>
      </div>
      <div id="listaCsvsJogadores"><span style="color:#888;font-size:11px">Carregando...</span></div>
    </section>
  </div>
</section>
