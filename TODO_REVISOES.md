# Revisões pendentes (Placar OBS)

Lista de revisões para uma próxima rodada. Branch: `multi-instancia`.

## ✅ Concluídas (rodada de 2026-10-20)

1. **Preview fixado no mobile** — `#previewWrapper` agora é `position:sticky;top:48px`.
2. **Toggle para desabilitar cada customização** — flags `feat_*` (seção `estilo`) com
   toggles em "🎛 Customizações" na Tela 10; desligado remove a ação do menu rápido.
6. **Separar repertório de mídia do histórico de notificações** — `renderMidias` refatorado
   em `_renderItens` + split; Tela 8 com `#listaMidias` (arquivos) e `#listaNotificacoes` (texto).
7. **Patrocinador → cena no repertório de mídias** — adicionar patrocinador cria item
   `tipo:'cena'`; disparar força `mostrarCena('sponsors', d)` via `_interromper`.

## ⏳ Pendentes

3. **Refazer as animações da Tabela** — revisar/refazer as animações de entrada/saída das cenas do overlay.
4. **Refazer o CSS das notificações** — revisar o estilo das notificações (gol/falta/expulsão).
5. **Integração do CSV de jogadores com o sistema de notificação** — importar jogadores por CSV
   e ligá-los às notificações (nome do jogador ao notificar).
8. **Cenas automáticas de abertura/intervalo/encerramento** — o overlay cria/aciona essas
   cenas (menu "Intervalos" da Tela 10); exige novas cenas no motor (intervalo e encerramento).
9. **Substituições** — cena/notificação de substituição de jogadores.
10. **Fila de reprodução real** — ordenação/agendamento da fila (não só o ciclo individual de mídia).
