# Overlay de classificação

Cenas ja migradas para HTML/CSS (PHP monta, CSS mostra, JS so preenche):
`table`, `intro` (abertura), `intervalo`, `encerramento`, `sponsors` (patrocinadores),
`lower` (lower third), `lineups` (escalacao), `feature` (time destaque), `form2` (ultimos jogos)
e `duel` (duelo). Todas as cenas das faixas ja sao HTML/CSS — o canvas nao desenha mais nenhuma.
A notificacao do overlay tambem e HTML (`#notifTabela`). As demais cenas seguem
no canvas do motor.

Motor de desenho em canvas 1920×1080 (`tabela/tabela.js`) + a camada que o liga
ao placar (`js/placar/tabela.js`) + o painel (`js/controle/tabela.js`).

O overlay **não exporta nada**: é uma camada dentro do `Placar.html`. Quando
liga, o placar sai de cena (fade + blur ~350 ms) e o canvas entra.

## Cenas

| chave | nome no painel | padrão |
|---|---|---|
| `intro` | Abertura do confronto | 6 s, ligada |
| `table` | Tabela de classificação | 10 s, ligada |
| `duel` | Duelo (confronto) | 7 s, ligada |
| `feature` | Time destaque | 8 s, ligada |
| `form2` | Forma / últimos jogos | 8 s, ligada |
| `lineups` | Escalações | 9 s, ligada |
| `sponsors` | Patrocinadores | 6 s, desligada |
| `lower` | Faixa inferior (placar) | 8 s, desligada |

Cada cena tem **duração própria** (`d`), **visibilidade** (`on`) e **ordem** na
lista. A sequência roda em ciclo; o painel mostra o tempo total.

## Linha do tempo e cena fixa

- **Linha do tempo** (`tabelaModo: "auto"`): toca as cenas marcadas, na ordem.
- **Cena fixa** (`tabelaModo: "fixa"`): toca só `tabelaCena`, com a duração dela.
  Ao ligar o modo fixo, o painel pede ao placar a cena que estava no ar
  (`tabelaCenaAtual`) e já entra nela — a transição é contínua.
- **▶ Tocar** grava `tabelaPlay`, que reinicia a sequência do começo.

Internamente o motor monta os segmentos (`timeline` / `sceneAt`) e cada cena se
desenha com progresso local `l` (segundos dentro da cena), com `seg()`/`easeOut`
para as animações de entrada (linhas que sobem, painéis que abrem etc.).

## Tema

Hoje existe **um tema só: La Liga** (`escuro` no motor), unificado entre o placar
e o overlay. A paleta fica em `css/tabela.css` (`#camadaTabela{--bg/--fg/--ac/--ac2}`)
e o motor usa `escuro` em `THEMES` (`g0/g1/g2` fundo quase preto, `acc` dourado).
`lay` (variante de layout por cena) continua existindo no motor, mas o painel não
expõe mais escolha de tema. Cor de time não entra no design.

## Layout por cena (arrastar/soltar)

`tabelaLayout` guarda, por cena, `{"e":escala%,"x":%,"y":%}`. No painel, o botão
**✥** arma uma caixa sobre o preview: arrastar o meio move a cena, arrastar o
canto azul redimensiona. A cena é desenhada com
`translate(x%, y%) scale(e/100)`; cena sem layout salvo = 100 %, centralizada.

## Zonas da tabela

`tabelaZonas` liga as faixas de cor; `tabelaZonaUp` (padrão 1) e `tabelaZonaDn`
(padrão 14) definem os limites, com as cores `tabelaZonaCorUp` (`#22c55e`) e
`tabelaZonaCorDn` (`#ef4444`). O número da posição é colorido por zona; o **nome
do time nunca é colorido**.

## Espelhamento do placar

| placar | overlay |
| --- | --- |
| `escudoA`, `escudoB` | escudo dos times do confronto (só quando a classificação não traz escudo para aquele time) |
| `competicao`, `grupo`, `categoria`, `fase` | título e subtítulo do cabeçalho |
| `local`/`hora` (ou `tabelaLocal`/`tabelaHora`) | campo e horário do cabeçalho |
| `clima`, `climaIcone` | clima do cabeçalho |
| `logoTorneio` | logo desenhado no cabeçalho (todas as cenas) e na abertura |
| `timeA`, `timeB` | os dois times destacados na classificação (casados por nome) |

O cabeçalho (`drawHeader`) é desenhado em todas as cenas menos `intro`. A `intro`
mostra o logo, o título, "**HOJE EM CAMPO**" e a linha de dados (campo · hora ·
clima).

## Escudos: como são resolvidos

`badge()` decide, na ordem:

1. `overrides[nome]` — escudo do placar (`escudoA`/`escudoB`) aplicado por
   `setEscudoTime()`. **Só entra se o time não tiver escudo na classificação**;
   com escudo vindo do CSV/banco, o da classificação manda.
2. `imgs[índice]` — escudo carregado de `t.crest` (`loadCrests`).

`setTeams()` troca a lista e **invalida cargas em voo** (`CREST_GEN`), para uma
imagem da lista anterior não cair na posição do time novo. `loadCrests` recarrega
e redesenha a cada imagem que chega; sem imagem, o motor cai no monograma do time.

## Import de CSV da classificação

1. O painel lê o arquivo com `Controle.parseClassificacao` (colunas por nome,
   tolerante a `;`/`,` e a aspas).
2. Grava os times em `tabelaTimes` — o overlay já passa a usar essa lista.
3. Chama `listar_escudos` e confere o que já existe no banco.
4. Baixa o que falta (`proxy_imagem` para URLs, data URI direto), envia em lotes
   para `importar_escudos` e **troca o `crest` de cada time pelo caminho local**
   (`dados/escudos/<time>.png`).
5. Publica a lista atualizada: como o escudo entrou na assinatura dos times
   (`chaveTimes`), o placar reconhece a mudança e o motor recarrega.

> Por que a assinatura importa: comparar só `nº|primeiro nome|último nome` fazia
> o placar ignorar a troca de URL por arquivo local (os nomes não mudam) e o
> overlay continuava com o escudo antigo.

## Escalações

`tabelaEscalacoes` guarda `{time: {jogador: {numero, posicao}}}`. O CSV é
`Equipe;Jogador;Numero;Posicao`. A cena *Escalações* mostra um time por vez — o
mesmo seletor de **Time destaque** manda nela.

## Repertório dentro do overlay

O repertório de mídias (imagem, GIF, vídeo) e as notificações de texto são
compartilhados com o placar: são itens do estado (`midia.midias`) com
`arquivo`/`texto`, duração, intervalo e ativação. O GIF anima normalmente no
canvas do placar; notificação disparada aparece com a animação configurada em
*Estilo & Posição*.

## Presets

O preset leva o overlay inteiro: tema, modo, cenas (com duração e visibilidade),
destaque, zonas, cabeçalho (título, subtítulo, local, hora, logo), classificação
importada, escalações, layout por cena, clima e repertório.
