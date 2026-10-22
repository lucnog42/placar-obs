<!-- modais da tela 9 (Operar ao vivo) -->
<div class="modal" id="modalNotificacao">
  <div class="modal-box" style="max-width:540px">
    <h3 id="notifTitulo">🔔 Notificação</h3>
    <p style="font-size:11px;color:#93a4c0;margin:0 0 6px">escolha o time e o jogador (o time também é uma opção) · <a href="#" onclick="Controle.abrirTextosNotif();return false" style="color:#8fb2c8">⚙️ textos</a></p>
    <p style="font-size:11px;color:#93a4c0;margin:8px 0 4px">👥 Time</p>
    <div id="listaTimesNotif" class="times-notif-list"></div>
    <div id="listaJogadoresNotif" class="jogadores-notif-list" style="display:none"></div>
    <div id="substituicaoCampos" style="display:none">
      <div class="row" style="gap:6px;margin-top:6px">
        <div style="flex:1"><span class="hint">Entra</span><select id="selJogadorEntra" style="width:100%"><option value="">— entra —</option></select></div>
        <div style="flex:1"><span class="hint">Sai</span><select id="selJogadorSai" style="width:100%"><option value="">— sai —</option></select></div>
      </div>
    </div>
    <div class="modal-actions" style="justify-content:space-between;flex-wrap:wrap">
      <button class="cancel" onclick="Controle.fecharModal('modalNotificacao')">Fechar</button>
      <div style="display:flex;gap:8px">
        <button class="ok" onclick="Controle.salvarNotificacao()" style="background:#2a3a55">➕ Guardar</button>
        <button class="ok" onclick="Controle.enviarNotificacao(true);Controle.fecharModal('modalNotificacao')" style="background:#4CAF50">▶ Enviar agora</button>
      </div>
    </div>
  </div>
</div>

<div class="modal" id="modalTextosNotif">
  <div class="modal-box" style="max-width:440px">
    <h3>⚙️ Textos da notificação</h3>
    <p style="font-size:11px;color:#93a4c0;margin:0 0 6px">texto padrão que acompanha o nome do jogador/time</p>
    <div style="display:flex;flex-direction:column;gap:6px">
      <label style="font-size:12px">⚽ Gol <input type="text" id="cfgTextoGol" placeholder="GOOOLLL!!!"></label>
      <label style="font-size:12px">🟨 Amarelo <input type="text" id="cfgTextoAmarelo" placeholder="CARTÃO AMARELO"></label>
      <label style="font-size:12px">🟥 Vermelho <input type="text" id="cfgTextoVermelho" placeholder="CARTÃO VERMELHO"></label>
    </div>
    <div class="modal-actions" style="justify-content:space-between">
      <button class="cancel" onclick="Controle.fecharModal('modalTextosNotif')">Cancelar</button>
      <button class="ok" onclick="Controle.salvarNotifTextos()">💾 Salvar</button>
    </div>
  </div>
</div>

<div class="modal" id="modalConfirmarOverlay">
  <div class="modal-box" style="max-width:420px">
    <h3>⚠ Cena manual no ar</h3>
    <p style="font-size:13px;color:#e8eefc;margin:0 0 6px">Há uma cena de abertura/intervalo/encerramento no ar. Sair da cena e continuar?</p>
    <div class="modal-actions" style="justify-content:space-between">
      <button class="cancel" onclick="Controle.fecharModal('modalConfirmarOverlay')">Cancelar</button>
      <button class="ok" onclick="Controle._confirmarDesligarOverlay()" style="background:#b45309">Sair da cena e continuar</button>
    </div>
  </div>
</div>

<div class="modal" id="modalRepertorio">
  <div class="modal-box" style="max-width:680px">
    <h3>🖼 Repertório de Mídias</h3>
    <div style="display:flex;gap:4px;margin-bottom:8px;align-items:center;flex-wrap:wrap">
      <input type="text" id="popmidiaNome" placeholder="Nome da mídia" style="flex:1;min-width:100px;">
      <select id="popmidiaTransicaoSelect">
        <option value="fade">Fade</option>
        <option value="slide-left">Slide ←</option>
        <option value="slide-right">Slide →</option>
        <option value="zoom">Zoom</option>
        <option value="none">Instantâneo</option>
      </select>
      <input type="number" id="popmidiaDuracao" placeholder="Duração (s)" min="0" style="width:64px;" title="0 = manual">
      <input type="number" id="popmidiaIntervalo" placeholder="Intervalo (s)" min="0" style="width:64px;" title="0 = sem repetir">
      <button onclick="Controle.adicionarMidia('pop')" style="background:#4CAF50;color:#fff;">+ Adicionar</button>
    </div>
    <div id="listaMidiasPop" style="min-height:60px;max-height:50vh;overflow-y:auto"><span style="color:#888;font-size:11px;">Nenhuma mídia adicionada</span></div>
    <div class="modal-actions">
      <button class="cancel" onclick="Controle.fecharModal('modalRepertorio')">Fechar</button>
    </div>
  </div>
</div>

<div class="modal" id="modalCenas">
  <div class="modal-box" style="max-width:680px">
    <h3>🎬 Cenas · linha do tempo</h3>
    <div id="poptabelaCenasLista"></div>
    <div class="row" style="margin-top:5px">
      <button onclick="Controle.todasCenas(true)" style="font-size:10px;padding:3px 8px">Todas</button>
      <button onclick="Controle.todasCenas(false)" style="font-size:10px;padding:3px 8px">Nenhuma</button>
      <button onclick="Controle.resetarCenas()" style="font-size:10px;padding:3px 8px">Padrão</button>
      <span class="hint" id="poptabelaCenaCount"></span>
      <span class="hint" id="poptabelaTotal"></span>
    </div>
    <div class="modal-actions">
      <button class="cancel" onclick="Controle.fecharModal('modalCenas')">Fechar</button>
    </div>
  </div>
</div>
