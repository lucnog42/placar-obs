<!-- modais da tela 1 (Instâncias) -->
<div class="modal" id="modalInstancia">
  <div class="modal-box">
    <h3 id="modalInstanciaTitulo">➕ Criar Instância</h3>
    <label style="font-size:11px;color:#aaa">id (ex.: equipeA)</label>
    <input type="text" id="subctrlId" placeholder="equipeA">
    <label style="font-size:11px;color:#aaa">nome (ex.: Equipe A)</label>
    <input type="text" id="subctrlNome" placeholder="Equipe A">
    <div class="modal-actions">
      <button class="cancel" onclick="Controle.fecharModal('modalInstancia')">Cancelar</button>
      <button class="ok" onclick="Controle.salvarInstanciaModal()">Salvar</button>
    </div>
  </div>
</div>

<div class="modal" id="modalExcluir">
  <div class="modal-box">
    <h3>Excluir instância</h3>
    <p style="font-size:13px;color:#e8eefc">Excluir a instância <b id="excluirNome" style="color:#f87171"></b> e todo o estado dela?</p>
    <div class="modal-actions">
      <button class="cancel" onclick="Controle.fecharModal('modalExcluir')">Cancelar</button>
      <button class="danger" onclick="Controle.confirmarExcluirInstancia()">Excluir</button>
    </div>
  </div>
</div>

<div class="modal" id="modalSemInstancia">
  <div class="modal-box">
    <h3>⚠ Instância necessária</h3>
    <p style="font-size:13px;color:#e8eefc">Selecione (ou crie) uma instância para continuar.</p>
    <div class="modal-actions">
      <button class="cancel" onclick="Controle.fecharModal('modalSemInstancia')">Fechar</button>
      <button class="ok" onclick="Controle.fecharModal('modalSemInstancia');Controle.abrirCriarInstancia()">➕ Criar instância</button>
    </div>
  </div>
</div>
