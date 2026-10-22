<section class="tela" id="tela-7" data-titulo="Repertório">
  <h2 class="titulo">📢 Repertório de Mídias</h2>
  <div class="grid-inner">
    <section class="full">
      <p>🖼 Repertório de Mídias <span class="hint">imagem · GIF animado · vídeo</span></p>
      <div style="display:flex;gap:4px;margin-bottom:6px;align-items:center;flex-wrap:wrap">
        <input type="text" id="midiaNome" placeholder="Nome da mídia" style="flex:1;min-width:100px;">
        <select id="midiaTransicaoSelect">
          <option value="fade">Fade</option>
          <option value="slide-left">Slide ←</option>
          <option value="slide-right">Slide →</option>
          <option value="zoom">Zoom</option>
          <option value="none">Instantâneo</option>
        </select>
        <input type="number" id="midiaDuracao" placeholder="Duração (s)" min="0" style="width:60px;" title="0 = manual">
        <input type="number" id="midiaIntervalo" placeholder="Intervalo (s)" min="0" style="width:60px;" title="0 = sem repetir">
        <button onclick="Controle.adicionarMidia()" style="background:#4CAF50;color:#fff;">+ Adicionar</button>
      </div>
      <div id="listaMidias" style="min-height:60px;"><span style="color:#888;font-size:11px;">Nenhuma mídia adicionada</span></div>
    </section>
  </div>
</section>
