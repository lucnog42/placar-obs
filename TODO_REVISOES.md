# Revisões pendentes (Placar OBS)

Lista de revisões. Branch: `multi-instancia`.

## ✅ Concluídas (rodada de 2026-10-20)

1. **Preview fixado no mobile** — `#previewWrapper` agora é `position:sticky;top:48px`.
2. **Toggle para desabilitar cada customização** — flags `feat_*` (seção `estilo`) com
   toggles em "🎛 Customizações" na Tela 10; desligado remove a ação do menu rápido.
5. **CSV de jogadores ligado às notificações** — seletor `#selJogador` (e `entra`/`sai`
   da substituição) populado pelas escalações CSV; preenche o nome ao notificar.
6. **Separar repertório de mídia do histórico de notificações** — Tela 8 com
   `#listaMidias` (arquivos) e `#listaNotificacoes` (texto) separados.
7. **Patrocinador → cena no repertório de mídias** — adicionar patrocinador cria item
   `tipo:'cena'`; disparar força `mostrarCena('sponsors', d)` via `_interromper`.
8. **Cenas automáticas de abertura/intervalo/encerramento** — cenas `intervalo` e
   `encerramento` no motor (com placar de gols), reuso de `intro` p/ abertura; menu
   "⏸ Intervalos & Cenários" na Tela 10; `mostrarCena`/`cancelarCena` (campo `cenaCancelar`).
9. **Substituições** — tipo de notificação `substituicao` (entra/sai pelas escalações),
   renderizada no motor e no fallback DOM; botão "🔁 Substituições" do menu rápido.
10. **Fila de reprodução real** — mídias ativas tocam em sequência (ordem do repertório,
    em loop), `duracao`/`intervalo` como tempo/pausa; fila em `js/placar/midia.js`.

## ⏳ Pendentes (aguardam especificação visual)

3. **Refazer as animações da Tabela** — revisar/refazer as animações de entrada/saída das cenas do overlay.
4. **Refazer o CSS das notificações** — revisar o estilo das notificações (gol/falta/expulsão).
