# Histórico

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
