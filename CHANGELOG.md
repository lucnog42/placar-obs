# Histórico

## 2026-10-22 — Notificação fora do placar + patrocinador em lower third

- **Notificação como overlay animado**: saiu de dentro da camada da tabela e virou
  camada própria (`#camadaNotif`, `partials/notificacao-overlay.php`), posicionada
  **fora do placar**. Entra deslizando + fade, sai sozinha, e funciona com o overlay
  ligado ou desligado (`Placar.notificar()`; `limparNotificacao()`).
- **Patrocinador em lower third**: a cena deixou de ser grade de 3 logos e virou uma
  faixa inferior com **um patrocinador por vez** e transição entre eles
  (`js/placar/patrocinio.js`). A rotação só roda enquanto a cena está no ar
  (duração do bloco ÷ nº de logos, mínimo 2 s por logo).
- **Corrigido: patrocinador ligava o overlay sozinho**. "Adicionar Patrocinador"
  criava uma mídia `tipo:'cena', cena:'sponsors'`; ao ser tocada ela chamava
  `mostrarCena()`, que força `ligar()`. Agora o painel não cria mais essa mídia,
  o overlay ignora cena `sponsors` vinda de mídia e o estado antigo é limpo sozinho.
- `?v=20261105a`

## 2026-10-22 — Overlay 100% HTML/CSS (motor canvas removido)

- **Todas as cenas viraram HTML/CSS**: `sponsors`, `lower` (lower third),
  `lineups`, `feature`, `form2` e `duel` ganharam partial própria
  (`partials/cena-*.php`) e o CSS mostra/anima por `#camadaTabela[data-cena]`.
  Entraram junto as do ciclo anterior (tabela, abertura, intervalo, encerramento).
- **Motor canvas removido**: `tabela/tabela.js` (836 linhas) e o `<canvas>` saíram
  do `placar.php`. O JS do overlay só escolhe a cena (loop de 200 ms), publica a
  cena atual e cuida de mídia/patrocínio. `.cena-inner` escala 1280×720 por 1.5
  para usar as mesmas coordenadas do motor antigo.
- **Notificação em HTML**: `partials/notificacao-tabela.php` (`#notifTabela`) no
  lugar do desenho no canvas; `Placar.notifTabela()` / `limparNotifTabela()`.
- **Patrocínio em HTML**: `js/placar/patrocinio.js` preenche label e os 3 slots
  de logo; a rotação continua no overlay (só com Cenas Automáticas ligadas).
- **Sem posição/escala por cena**: `tabelaLayout` e o arrastar/soltar do preview
  (`#previewDrag`, botão ✥) foram removidos — cada cena ocupa 1920×1080 fixo.
- **Fundos** agora cobrem as 7 cenas que têm `.cena-bg` no painel.
- **`tests/` removido**: os snapshots em PNG dependiam do canvas e de
  `@napi-rs/canvas`; a verificação passou a ser por harness com DOM stubado.
- Docs (`README`, `ARQUITETURA`, `DESENVOLVIMENTO`, `OVERLAY-CLASSIFICACAO`,
  `PAINEL`, `DADOS`, `LEIA-ME_OVERLAY_TABELAS`, `TABELA_HTML`) atualizados.

## 2026-10-21 (revisões — Rodada 5: agrupar, CSV por time, toggle de cenas, fundos)

- **Menu mobile 2×**: fonte e botões do drawer aumentados no `@media(max-width:759px)`.
- **Agrupar por checkbox** em todas as bibliotecas (escudos, logos, cores, CSVs):
  um "Selecionar Todos" + um botão "🏷 Agrupar" por biblioteca (agrupa só os marcados),
  e "⇄ Desagrupar" aparece ao filtrar um grupo. Removeu o 🏷 individual por item.
- **CSV de escalação separado por time**: uploads Time A / Time B (`tabelaEscFileA/B`),
  modelo sem coluna `time` → `jogador;numero;posicao`; parse usa `player`/`num`/`pos`.
- **Cenas viram toggle**: botão "Voltar ao loop" removido; Abertura/Intervalo/Encerramento
  ligam e, clicando de novo, desligam (`_cenaForcada`).
- **Notificação só com os 2 times** jogando (não o CSV inteiro da tabela).
- **Textos configuráveis** (gol/amarelo/vermelho) em pop-up separado "⚙️ Textos"
  (`modalTextosNotif`, estado `notifTextos`).
- **Proteção de sobreposição**: enviar mídia/notificação com cena forçada ativa pausa e
  pede confirmação (`modalConfirmarOverlay`) para desligar o overlay antes de iniciar.
- **Fundo de imagem opcional** por cena (abertura/intervalo/encerramento) + tabela:
  upload `upload_fundo` (`fundos/`), estado `cenaFundos`, motor desenha `paintFundo`.
- **Tela Cenas removida**; renumeração Tema→5, Patrocinadores→6, Repertório→7, Resumo→8,
  Operar ao vivo→9 (linha do tempo ficou só no `modalCenas`).

## 2026-10-21 (revisões — "ao vivo" como hub de pop-ups)

- **Notificação / mídias / cenas viraram pop-ups** na tela "Operar ao vivo": o menu
  rápido (Gol, Faltas, Expulsão, Substituições, Mídias, Fila) abre modais em vez de
  navegar. O seletor de notificação (tipo → time → jogador, com o time clicável)
  ficou no `modalNotificacao`; o repertório de mídias no `modalRepertorio`; a linha
  do tempo no `modalCenas` (aberto pelo botão "⚙️ Configuração").
- **Histórico de notificações** saiu da tela Repertório e virou submenu na tela ao vivo.
- **Customizações** removidas; **Intervalos & Cenários** subiram para perto do Overlay.
- **Importar preset** na primeira tela; **pop-up** ao navegar sem instância.
- **CSV de jogadores**: botão "📄 Modelo" (coluna `time`), biblioteca de CSVs separada
  (classificação × jogadores, pastas `csvs/tabela` e `csvs/jogadores`).
- **Fonte** (seletor de fonte) passou a ocupar a largura toda.

## 2026-10-20 (revisões — biblioteca de CSVs + escudo do time + notificações no ao vivo)

- **Biblioteca de CSVs**: backend `listar_csvs`/`salvar_csv`/`carregar_csv`/`remover_csv`
  (`csvs/`). No Controle, seção "📚 Biblioteca de CSVs" (Tela 4) salva o CSV importado
  com um nome, lista/carrega/remove; carregar aplica como classificação ou escalações.
- **Trocar escudo de um time**: seção "🎨 Escudos dos times" (Tela 4) lista os times da
  classificação e permite substituir a imagem de cada um (sobe via `importar_escudos`
  e regrava o `crest` no `tabelaTimes`).
- **Notificações só no "ao vivo"**: o formulário saiu da Tela 8 (repertório). Na Tela 10,
  fluxo tipo → time → jogador: lista de times (Time A/B + classificação) clicável — clicar
  no time notifica o time todo ou abre a lista de jogadores do CSV; clicar no jogador
  notifica o jogador. Substituição continua com entra/sai.

## 2026-10-20 (revisões — fila de reprodução real)

- **Fila de reprodução real**: as mídias ativas (imagem/GIF/vídeo) agora tocam em
  sequência — uma por vez, na ordem do repertório, repetindo no fim — em vez de
  ciclos simultâneos e independentes. `duracao` = tempo na tela (vídeo usa a duração
  natural se `0`); `intervalo` = pausa antes da próxima. Texto/cena seguem one-shot.
  Botão "▶ Fila" abre o repertório (Tela 8).

## 2026-10-20 (revisões — substituições)

- **Substituições**: tipo de notificação `substituicao` (🔁) no formulário (Tela 8) com
  seletores "entra"/"sai" populados pelas escalações; renderizada no motor (`SUBSTITUIÇÃO`,
  cor ciano) e no fallback DOM. Botão "🔁 Substituições" do menu rápido abre o formulário
  já na opção de substituição.

## 2026-10-20 (revisões — cenas de abertura/intervalo/encerramento)

- **Cenas manuais (menu Intervalos)**: novas cenas de tela cheia `intervalo` e
  `encerramento` no motor (com placar de gols), reuso da cena `intro` para "abertura".
  Tela 10 ganhou a seção "⏸ Intervalos & Cenários" (Abertura / Intervalo / Encerramento
  / Voltar ao loop). `mostrarCena` com `d<=0` segura indefinidamente; `cancelarCena()`
  via campo `cenaCancelar` (seção `estilo`) volta ao loop. `golsA`/`golsB` no cfg do overlay.

## 2026-10-20 (revisões — CSV de jogadores ligado às notificações)

- **CSV de jogadores → notificações**: o formulário de notificação (Tela 8) ganhou o
  seletor `#selJogador`, populado pelas escalações importadas por CSV (`tabelaEscalacoes`),
  agrupado por time. Escolher um jogador preenche automaticamente o campo de nome.

## 2026-10-20 (revisões — repertório/histórico separados + cena de patrocinador)

- **Repertório separado do histórico**: a Tela 8 agora divide "🖼 Repertório de Mídias"
  (imagem · GIF · vídeo) de "🔔 Histórico de Notificações" (texto). `renderMidias`
  foi refatorado em `_renderItens` + split por `tipo`.
- **Patrocinador → cena no repertório**: adicionar um patrocinador cria automaticamente
  um item `tipo:'cena'` (🎬) no repertório. Disparar essa cena força `mostrarCena('sponsors', d)`
  no overlay via `_interromper` (prioridade máxima sobre a rotação automática).

## 2026-10-20 (revisões — preview fixo no mobile + toggles de customização)

- **Preview fixo no mobile**: `#previewWrapper` agora é `position:sticky;top:48px`,
  ficando visível enquanto rola pelas telas do wizard.
- **Toggles de customização (Tela 10)**: cada recurso da tela "Operar ao vivo"
  (Gol, Faltas/cartões, Mídias, Substituições, Fila, Intervalos) tem um toggle
  liga/desliga na seção "🎛 Customizações". Desligar remove a ação do menu rápido.
  Flags `feat_*` persistidas na seção `estilo` (MS + ms_section + defaults).

## 2026-10-20 (patrocinadores: rotação automática com prioridade)

- **Patrocinadores agora renderizam de verdade** (pendência antiga): os logos
  `sp1..spN` carregam e alimentam `setPatrocinadores` do motor (cena "sponsors").
- **Causa-raiz corrigida**: `spText`/`sp1..sp30`/`sponsorsAtivo`/`sponsorsIntervalo`/
  `sponsorsDuracao` não estavam no mapa `MS` (js/comum.js) nem no `ms_section`
  (api.php) — o upload ficava preso no Controle e nunca chegava ao estado
  compartilhado. Agora mapeados para a seção `torneio` (com defaults em `default_estado`).
- **Rotação**: a cada `sponsorsIntervalo` s (padrão 120) a cena "Patrocinadores"
  entra por `sponsorsDuracao` s (padrão 8). Toggle liga/desliga na Tela 7.
- **Prioridade**: notificações e mídias manuais no ar suspendem/adiram a rotação
  (o overlay e as cenas manuais têm prioridade sobre os patrocinadores).
- **Tela 7**: controles de rotação + "➕ Adicionar Patrocinador" (slots dinâmicos
  até 30, com Subir/✕ por logo).
- Motor (`tabela/tabela.js`): `drawScene`/`renderFrame` aceitam cena forçada
  (`opts.cena`) para injetar a cena de patrocinadores fora da linha do tempo.

## 2026-10-20 (refinos do Controle — preview, logos, CSV, Tela 10)

- Removido o slider de zoom do preview; preview agora carrega `Placar.html?i=<id>`
  (bug do placar errado por instância corrigido).
- **Biblioteca de logos de torneio** (igual escudos/cores): `listar_logos` +
  `remover_logo` (novo endpoint) + UI "Usar / ✕".
- **Botão "📄 Modelo CSV"** baixa um CSV de exemplo com o cabeçalho
  `Pos;Equip;Punts;J;G;E;P;GF;GC;DG;Ultims;Sancio;PosSite;Escut`.
- **Siglas voltaram pra junto do nome** (Tela 2); botão de alternar
  abreviação/completo (`toggleNomesBtn`) movido pra Tela 10.
- Removido o **toggle de modo de exibição** da tela Cenas; o modo (linha do
  tempo/cena fixa) agora vive no pop-up "⚙️ Configuração" da Tela 10.
- Tela 10: botão "Categorias" → "⚙️ Configuração"; **menu rápido** com Gol,
  Faltas, Expulsão, Mídias + (em breve) Substituições, Fila de reprodução,
  Intervalos (abertura/intervalo/encerramento automáticos).

## 2026-10-20 (ajustes de layout do Controle — desktop)

- **CSS desktop corrigido**: removido o `body{display:grid}` legado (do
  `css/controle.css` ≥1100px) e o `button{height:24px}` global que quebrava
  botões grandes (ligar overlay, notificação rápida); agora `button{height:auto}`.
- **Stepper numérico removido**: só o texto "Etapa X de 10" (sem os círculos 1–10).
- **Tela 1** agora exige seleção de instância (gate no Avançar) e mostra os
  **presets** da instância ativa (aplicar/remover) — botão "▶ Usar" por instância.
- **Equipes**: cores em fileira própria + **biblioteca de cores salvas**
  (adicionar/aplicar Casa/Visitante/remover) — novo backend `salvar_cor`/
  `listar_cores`/`remover_cor` (`cores.json`); siglas movidas para a Tela 10.
- **Removido** o formulário redundante "Cabeçalho do overlay" e a opção
  "Animação da notificação".
- **Reordenação**: Patrocinadores virou Tela 7 (Tabela→4, Cenas→5, Tema→6).
- **Tema unificado** (overlay + placar) numa tela só.
- **Tela 10**: botão de ligar overlay corrigido; pop-up de **categorias do
  overlay** (linha do tempo / cena fixa / reiniciar sequência); notificação
  rápida e pênaltis em fileira própria.

## 2026-10-20 (Fase E — diagramação do Controle em wizard)

- **Controle.html reestruturado em um wizard de 10 telas** (uma por vez), com
  navegação passo a passo automática:
  1 Instâncias → 2 Equipes → 3 Competição → 4 Patrocinadores → 5 Tabela →
  6 Cenas → 7 Tema → 8 Repertório → 9 Resumo & Salvar → 10 Operar ao vivo.
- **Shell global**: header fixo com **☰ menu** (drawer lateral deslizante, adaptado
  para mobile) + instância ativa + indicador de sync; **stepper** "Etapa X de 10";
  barra fixa **Voltar / Avançar**.
- **Tela 1 — Instâncias**: lista com **Editar** e **Excluir em pop-ups** (confirmação
  de exclusão), **+ Criar Instância** (pop-up com id/nome/perfil via
  `criar_instancia`/`renomear_instancia`/`remover_instancia`).
- **Tela 9 — Resumo & Salvar**: resumo dinâmico de tudo que foi personalizado
  (instância, equipes, competição, cenas, tema, patrocinadores) + salvar
  instância / salvar como perfil (reaproveita `salvarPreset`/presets).
- **Tela 10 — Operar ao vivo**: placar/tempo, cartões, overlay/cenas,
  notificações rápidas (⚽/🟨/🟥/ℹ) e mídias.
- **Tela 4 — Patrocinadores** (nova): título dos patrocinadores (`spText`) + 3
  slots de logo (upload via `upload_logo`). Imagens ainda não desenhadas no
  engine da tabela (pendência de wiring).
- Novo `js/controle/navegacao.js` (stepper/drawer/modais/resumo); Debug movido
  para painel recolhível no rodapé.

## 2026-10-19 (refatoração multi-instância)

**Fase A — Fundação multi-instância (servidor)**

- `api.php` agora roteia por instância via `?i=<id>` (ou `?instancia=`): cada
  sub-controle tem seu próprio `estado-<id>.json` (+ `.bak` + `.lock`).
- Sem `?i`, segue usando `estado.json` (retrocompatível — instância padrão).
- Novo registro `instancias.json` com CRUD: `criar_instancia`, `listar_instancias`,
  `renomear_instancia`, `remover_instancia`. `id` validado por
  `^[A-Za-z0-9_-]+$` (rejeita path traversal).
- Escudos/mídias/logos continuam compartilhados entre instâncias (só o estado é
  por instância).

**Fase B — Perfis**

- Novo `perfis/` com ações: `salvar_perfil`, `listar_perfis`, `carregar_perfil`,
  `remover_perfil` (escrita atômica, validação de nome).
- `aplicar_perfil` (`?i=<id>` + `{perfil}`) aplica um perfil à instância: mapeia o
  perfil "flat" para o estado aninhado (mapa `ms_section` espelhando o `MS` do
  `js/comum.js`) e preserva o placar/tempo em andamento.
- `criar_instancia {perfil}` agora semeia o estado da instância a partir do perfil.
- Perfil guarda o pacote completo: times, competição, tabela/classificação
  (`tabelaTimes`), tema/cores e cenas.

**Fase C — Placar parametrizado (`Placar.html?i=<id>`)**

- `comum.js` agora detecta `?i=` da URL e monta `API` com a instância, além de
  expor `API_AND` (separador `&`/`?`) — 32 pontos de `fetch` migrados para
  `API+API_AND+…`, preservando o merge POST (`fetch(API, …)`).
- Abrir `Placar.html?i=equipeA` faz o overlay ler/gravar só na instância
  `equipeA`; o mesmo vale para `Controle.html?i=equipeA`. Sem `?i`, comportamento
  antigo.
- Versão de cache-busting dos scripts alterados bumpada para `20261019g1`.

**Sub-controles no painel (parte da Fase E)**

- Nova seção "Sub-controles" no `Controle.html`: lista as instâncias, cria
  (`criarInstancia`), remove (`removerInstancia`) e expõe a URL de cada uma
  (`Placar.html?i=<id>`) com botões "📺 OBS" (abre o overlay) e "🎛 Editar"
  (abre o `Controle.html?i=<id>`).

**Fase D — Notificação no motor/canvas da tabela**

- Notificação agora é desenhada pelo motor (`tabela/tabela.js`) no mesmo canvas
  e no mesmo tema, em vez do elemento DOM `#notificacao` separado — elimina a
  sobreposição de overlays.
- Novo `Tabela.setNotif({tipo, texto, dur})` + `clearNotif`/`temNotif` e
  `renderNotif` (fundo transparente, só a notificação). Tipos: `gol` (vermelho),
  `amarelo`, `vermelho`, `info` (acento do tema), com entrada/saída animadas e
  auto-expiração.
- `js/placar/midia.js` (`_mostrarTexto`/`_esconderTexto`) e `js/placar/notificacao.js`
  agora disparam via `Placar.Tabela.dispararNotif(...)`; o DOM antigo fica só
  como fallback se o motor não carregar.
- Com a tabela desligada, `dispararNotif` mostra só a notificação (fundo
  transparente) por cima, sem mexer no placar.
- Cache-busting dos scripts alterados para `20261020a`.

## 2026-10-19

**Fase 1 (Blindagem) + Fase 3 (Rede robusta)**

- **Persistência segura.** `estado.json` agora é gravado de forma atômica
  (arquivo temporário + `rename()`), com `estado.json.bak` espelhando o último
  estado válido. Leitura com `flock(LOCK_SH)`, e mutações serializadas com
  `flock(LOCK_EX)` cobrindo o ciclo ler→alterar→gravar. Um estado corrompido
  recupera do `.bak` em vez de cair no padrão (fim do "placar zera sozinho").
- **Incremento no servidor.** Nova ação `?acao=incrementar` calcula gol/falta no
  servidor (atômico), em vez de gravar o valor absoluto calculado no painel —
  dois operadores ou dois cliques rápidos não se atropelam mais.
- **Cronômetro por epoch.** Nova ação `?acao=cronometro` (start/pause/reset/set)
  guarda `tempoInicio` (epoch) e `tempo` (acumulado); o relógio sobrevive a
  recarregar o Placar no OBS e a dois operadores. O servidor envia `_ts` para
  corrigir o relógio do cliente.
- **Poll encadeado no Placar** (sem `setInterval` empilhando requisições), com
  timeout de 3 s, descarte de resposta fora de ordem e watchdog de conexão.
- **Painel vivo.** O `Controle.html` agora também consulta `?v=N` e vê mudanças
  de outra aba/operador (sem sobrescrever um campo em edição).
- **Fila de gravação no painel** com retry/backoff: um gol não se perde mais
  quando a rede falha; ações rápidas são coalescidas num único POST.
- **`publicarCena` sem ruído.** A troca de cena do overlay usa `?acao=cena_atual`,
  que não incrementa `estadoVersao` (não dispara reload nos clientes).
- **SSRF no `proxy_imagem`.** Timeout de 5 s, limite de ~2 MB e bloqueio de IPs
  privados/loopback/reservados.
- **Status HTTP real.** `respond_error` agora envia o código correto (400/404/500)
  em vez de 200.
- **Basquete removido.** As tags de `js/controle/basquete.js` e
  `js/placar/basquete.js` (que não existiam, 404) foram retiradas.
- `mostrarStatus` passa a vir `false` por padrão (o indicador não sai no ar).

## 2026-10-17

**Overlay de classificação — rodada de ajustes**

- **Escudo do CSV religado à tabela.** O placar comparava a classificação só por
  `nº|primeiro nome|último nome`; quando o import trocava a URL da FCF pelo
  arquivo do banco (`escudos/<time>.png`), a assinatura não mudava e o motor
  ficava com o escudo antigo. Agora `chaveTimes()` inclui os escudos e a troca
  reentra no motor.
- **Classificação manda no escudo.** `setEscudoTime` (escudo do placar para os
  times A/B) só sobrescreve quando o time não tem escudo próprio.
- **Blindagem de cargas de imagem** (`CREST_GEN`): imagem da lista anterior não
  escreve mais na posição do time novo.
- **Biblioteca de escudos**: ao importar o CSV, todos os escudos referenciados vão
  para `escudos/`; o painel confere a biblioteca antes e baixa só o que falta.
  Novos botões **📥 Sincronizar escudos** e **🔎 Conferir biblioteca**.
- **Logo do torneio no overlay**: lido do estado (`logoTorneio` → `torneios/…`),
  desenhado no cabeçalho de todas as cenas e na abertura, com seletor/upload na
  própria aba do overlay.
- **Local/campo e hora**: campos próprios na aba do overlay
  (`tabelaLocal`/`tabelaHora`), caindo para os do placar quando vazios; removido o
  nome falso “Camp Municipal” que aparecia com o campo vazio.
- **Abertura**: “PRÓXIMO CONFRONTO” → “**HOJE EM CAMPO**”.
- **Preview e menu 50/50** em tela deitada, com rolagem interna no menu e
  rolagem própria na aba do overlay; o preview mede a caixa viva e mantém 16:9.
- **Slider de tamanho de cena removido**; cada cena ganhou um **slider com knob de
  duração** (atualiza ao arrastar, grava ao soltar).
- **Persistência**: `tabelaLocal`, `tabelaHora`, `tabelaLogo`, `tabelaZonaCorUp`,
  `tabelaZonaCorDn` e `previewZoom` entraram no mapa `MS` (antes eram descartados
  no POST e não sobreviviam a outra sessão); `api.php` passou a responder com
  `Cache-Control: no-store`; o preset passou a levar as chaves novas.
- **Bug do logo**: `loadLogo` chamava o callback de forma síncrona quando nada
  mudou, desenhando no meio de outra rotina (achado pelos testes do repositório).

## 2026-10-16

- **Integração do overlay como camada** dentro do `Placar.html`: o placar sai de
  cena (fade + blur ~350 ms) e o canvas entra. Fim do export de GIF.
- **Espelhamento**: tema, cores dos times, escudos, competição/grupo/categoria/
  fase, local/hora/clima e times A/B do placar.
- **Linha do tempo de cenas** com visibilidade, duração e ordem; modo **cena
  fixa** (entra já na cena que estava no ar, via `tabelaCenaAtual`) e **▶ Tocar**.
- **7 temas** de overlay com layouts por cena (tema muda o layout, não só a cor).
- **Import de CSV da classificação** e de **escalações**, com download dos escudos.
- **Repertório unificado** de mídias + notificações, com suporte a **GIF**.
- **Presets** cobrindo o overlay inteiro.
- **Zonas** da tabela (acesso/queda), cabeçalho colorido por zona e cabeçalhos
  **V**/**D** (antes G/P); transparência dos painéis reduzida.
- **Painel**: preview com zoom, biblioteca de escudos, banco de logos de torneio
  com upload, destaque por time (Casa/Fora/Automático), layout por cena
  (arrastar/soltar no preview), remoção do toggle de Esporte (arquivos de basquete
  ausentes).
