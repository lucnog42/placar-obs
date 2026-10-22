# Painel (`controle.php`)

O painel é o navegador de quem opera a transmissão. Ele tem três blocos: barra de
status, preview do placar e as seções em acordeão.

```
┌──────────────────────────────┬─────────────────────────────┐
│  barra de status             │  PREVIEW do placar (iframe) │  ← 50% da altura
│  (conexão, ping, log)        ├─────────────────────────────┤
│                              │  MENU (seções em acordeão)  │  ← 50%, com scroll
│  abas do menu                │  Overlay · Tabelas …        │
└──────────────────────────────┴─────────────────────────────┘
      tela deitada (≥1100 px)                    ↕
     tela em pé: preview em cima com 100% da largura
```

## Barra de status

Indicador de conexão/erro das chamadas ao `api.php`, ping do polling e o
contador/log de depuração (ligado na seção **Debug**).

## Preview

`#previewWrapper` contém uma barra (`#previewBar`) com o **zoom** (35 %–100 %) e
o botão *Esconder/Mostrar*, e um `iframe` que carrega o `Placar.html` real.

- O iframe é montado em 1920×1080 e reduzido com `transform: scale()` calculado
  por `Controle.resizePreview()` — assim o preview é sempre **o mesmo desenho** do
  OBS, em 16:9 (nunca corta o frame).
- Tela de pé: preview em cima, largura total.
- Tela deitada: preview em cima da coluna direita (50 % da altura) e o menu
  abaixo (50 %), com rolagem interna no menu.
- O zoom fica salvo no estado (`previewZoom`), então qualquer sessão entra com o
  mesmo.

## Seções (acordeão)

### 📊 Overlay · Tabelas

O coração da integração. Abre já expandida.

| Campo | Chave no estado | O que faz |
|---|---|---|
| ⚙ Cenas Automáticas | `tabelaAtivo` | liga a automação; o placar sai e o overlay entra. Desligar também encerra cena manual |
| Tema | `tabelaTema` | Automático (segue o placar) / Escuro / Claro / Neon / Broadcast / Match Facts / Aço / Noturno |
| Linha do tempo ↔ Cena fixa | `tabelaModo` | toca a sequência ou só uma cena |
| ▶ Tocar | `tabelaPlay` | volta para a linha do tempo e reinicia a sequência |
| Casa (A) / Fora (B) / Automático | `tabelaDestaque` | time destaque (cena *Time destaque* e *Escalações*) |
| Cenas · linha do tempo | `tabelaCenas` | visibilidade + **duração** (slider com knob) + ordem (↑ ↓) |
| Cabeçalho: Título, Subtítulo | `tabelaTitulo`, `tabelaSub` | texto do cabeçalho do overlay |
| Cabeçalho: Local / campo, Hora | `tabelaLocal`, `tabelaHora` | campo e horário (vazio = usa o do placar) |
| Logo do torneio | `logoTorneio` | escolhe do banco `dados/torneios/` (📤 sobe, 🔄 recarrega) |
| Zonas + cores | `tabelaZonas`, `tabelaZonaUp`, `tabelaZonaDn`, `tabelaZonaCorUp`, `tabelaZonaCorDn` | faixas de acesso/queda |
| Escudos na tabela | `tabelaEscudos` | liga/desliga os escudos |
| 📄 Importar CSV da classificação | `tabelaTimes` | lê o CSV, **baixa os escudos** para `dados/escudos/` e usa os times |
| 📥 Sincronizar escudos | — | confere o banco e baixa só o que falta |
| 🔎 Conferir biblioteca | — | diz quais times estão **sem** escudo no banco (sem baixar nada) |
| 📄 Importar CSV (escalações) | `tabelaEscalacoes` | `Equipe;Jogador;Numero;Posicao` |

**Modo cena fixa**: ao ligar, entra já na cena que estava no ar (o placar publica
`tabelaCenaAtual`), então a transição é contínua em vez de cortar para outra cena.

**Patrocinadores**: a rotacao liga a faixa inferior (lower third) com **um logo por vez**;
`sponsorsDuracao` e a duracao do bloco inteiro, dividida entre os patrocinadores.
Clicar em "Adicionar Patrocinador" nao mexe no overlay — ele so entra na rotacao.

**Cenas em tamanho fixo**: cada cena ocupa a tela inteira do overlay (1920×1080).
Não existe mais posição/escala por cena — o overlay é uma sobreposição de
transmissão, sempre alinhada à tela.

### 👥 Times & Competição

Time A/B (nome, sigla, cor, escudo vindo do banco), competição, categoria,
grupo, fase, data, hora, local, clima (texto + ícone), logo do torneio e a
gestão de **presets** (salvar, carregar, listar com filtros por
competição/hora/local, importar/exportar JSON em lote).

É a fonte que o overlay espelha (times, cores, escudos, cabeçalho, clima).

### 🎨 Estilo & Posição

Tema único (`laliga`, o mesmo usado no overlay), fonte, nomes expandidos,
escala (tamanho) e posição X/Y do placar na tela, mostrar/ocultar a barra de
status.

### ⚽ Jogo

Gols A/B, cronômetro (iniciar/pausar/zerar), período, pênaltis e o disparo de
notificações rápidas.

### 🗂 Repertório · Notificações & Mídias

Um repertório único com duas naturezas de item:

- **Arquivo** (imagem, GIF animado, vídeo): nome → adicionar; cada item tem
  *Ativar* (entra no ciclo), duração, intervalo e transição.
- **Notificação de texto** (gol, cartão amarelo, cartão vermelho, aviso): vira
  item de texto com ▶ Enviar (disparo avulso) e ➕ Guardar no repertório. O texto
  é editado na própria lista; a animação vem de *Estilo & Posição*.

O disparo usa `midiaDisparoId`/`midiaDisparoSeq` no estado, ou seja, um clique no
painel aparece no placar de qualquer sessão.

### 🐞 Debug

Contador de requisições, ping do polling, log das chamadas e um editor do JSON do
estado (para inspeção/cola manual).
