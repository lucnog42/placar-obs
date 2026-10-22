# Dados: CSV, escalações e chaves do estado

## CSV da classificação (fcf.cat)

O painel aceita o CSV exportado do site da FCF
(`...&tab=classificacio`). Exemplo em
[`exemplos/classificacio_quarta_catalana_grup18.csv`](../exemplos/classificacio_quarta_catalana_grup18.csv).

```
Pos;Equip;Punts;J;G;E;P;GF;GC;DG;Ultims;Sancio;PosSite;Escut
1;HAILUKONG BARCELONA CLUB FUTBOL A;9;3;3;0;0;8;2;6;V V V;;1;https://files.fcf.cat/escudos/...
2;PEÑA PASION XENEIZE BARCELONA, ASSOC. A;7;3;2;1;0;...
```

### Como o parser funciona (`Controle.parseClassificacao`)

- **Separador**: `;` ou `,` (detectado pela primeira linha).
- **Cabeçalho**: opcional. Se houver, as colunas são reconhecidas **por nome**
  (`Pos`, `Equip`/`Equipe`, `Punts`/`PTS`, `J`, `G`/`V`, `E`, `P`/`D`,
  `GF`, `GC`, `DG`, `Ultims`, `Escut`/`Escudo`), em qualquer ordem e com acento
  ou sem. Sem cabeçalho, vale a ordem do exemplo.
- **BOM**: removido (`utf-8-sig`).
- **Campos com aspas**: o CSV do FCF tem `;` dentro do data URI
  (`data:image/png;base64,…`). O campo **precisa** vir entre aspas — sem elas o
  `;` parte o campo e o app lê só `data:image/png`. O parser rejunta o caso
  quebrado, mas o certo é exportar com aspas.
- Sai daqui um objeto `{times:[{name, short, pos, pts, j, e, p, gf, gc, dg, crest}], urls:[{nome,url}]}`.

### Colunas e destinos

| coluna do CSV | campo do time | onde aparece |
|---|---|---|
| `Equip` | `name` (nome completo) / `short` (curto) | tabela, duelo, escalações |
| `Pos` | `pos` | número da posição, colorido por zona |
| `Punts` | `pts` | coluna PTS (com contagem animada) |
| `J`, `G`, `E`, `P` | `j`, `e`, `p` | colunas J / V / E / D |
| `GF`, `GC`, `DG` | `gf`, `gc`, `dg` | colunas F / C / saldo |
| `Ultims` | `ult` | coluna ÚLTIMOS (V/E/D) |
| `Escut` | `crest` | escudo (URL da FCF, caminho local ou data URI) |

> Os cabeçalhos no painel usam **V** e **D** para vitórias e derrotas (o CSV traz
> `G` e `P`) e os círculos da coluna ÚLTIMOS também são V/E/D.

## Escudos

Ao importar, **todos** os escudos referenciados vão para `dados/escudos/`:

1. o painel chama `listar_escudos` e descobre o que já existe;
2. o que falta é baixado (`proxy_imagem` para URL; data URI é usado direto) e
   enviado em lotes para `importar_escudos`;
3. a API grava `dados/escudos/<nome do time normalizado>.<ext>` e devolve o caminho;
4. o painel troca o `crest` do time pelo caminho local.

Normalização do nome (`Controle.arquivoEscudo` = mesma regra do PHP):
`[^A-Za-z0-9_-] → _`, ou seja `POMAR, C.D. A` → `POMAR__C_D__A.png`.
Copiar um escudo na mão para `dados/escudos/` com esse nome faz o app reconhecê-lo como
"já na biblioteca".

Os botões **📥 Sincronizar escudos** (baixa o que falta) e **🔎 Conferir
biblioteca** (diz quais times estão sem escudo, sem baixar nada) rodam a mesma
conferência a qualquer momento.

## CSV de escalações

```
Equipe;Jogador;Numero;Posicao
POMAR, C.D. A;João Silva;1;goleiro
POMAR, C.D. A;Marc Pérez;4;defesa
```

`;` ou `,`, com ou sem cabeçalho. Vira `tabelaEscalacoes`:

```json
{"POMAR, C.D. A": {"João Silva": {"numero": "1", "posicao": "goleiro"}}}
```

## Chaves do estado e o mapa `MS`

Toda chave que o painel salva **precisa** estar no mapa `MS` de `js/comum.js`
(chave → seção). O `paraSecoes()` usa esse mapa para montar o POST; chave fora
dele é descartada em silêncio.

| `placar` | `golsA`, `golsB`, `tempo`, `rodando`, `esporte`, `periodo` |
| `times` | `timeA`, `timeB`, `siglaA`, `siglaB`, `escudoA`, `escudoB`, `timeACor`, `timeBCor`, `competicao`, `categoria`, `grupo`, `fase`, `data`, `hora`, `local`, `logoTorneio`, `clima`, `climaIcone` |
| `estilo` | `tema`, `fonte`, `nomesExpandidos`, `notifAnimacao`, `mostrarStatus` |
| `penaltes` | `penaltesAtivos`, `PA1`, `PA2`, `PA3`, `PA4`, `PA5`, `PB1`, `PB2`, `PB3`, `PB4`, `PB5` |
| `notif` | `notifTipo`, `notifTexto`, `notifId` |
| `posicao` | `placarScale`, `placarX`, `placarY` |
| `midia` | `midias`, `midiasAtivas`, `midiaAtiva`, `midiaTransicao`, `midiaDisparoId`, `midiaDisparoSeq` |
| `basquete` | `shotClock`, `shotRodando`, `faltasA`, `faltasB`, `posse`, `bonusA`, `bonusB`, `timeoutsA`, `timeoutsB` |
| `tabela` | `tabelaAtivo`, `tabelaCena`, `tabelaTema`, `tabelaDuracao`, `tabelaA`, `tabelaB`, `tabelaDestaque`, `tabelaEscalacao`, `tabelaTitulo`, `tabelaSub`, `tabelaZonas`, `tabelaZonaUp`, `tabelaZonaDn`, `tabelaEscudos`, `tabelaEscalacoes`, `tabelaLocal`, `tabelaHora`, `tabelaLogo`, `tabelaZonaCorUp`, `tabelaZonaCorDn`, `previewZoom`, `tabelaModo`, `tabelaLayout`, `tabelaPlay`, `tabelaCenaAtual`, `tabelaCenas`, `tabelaTimes` |

### Regras

- Valores são strings (`"true"`, `"0"`, `"12.5"`). O placar usa direto em CSS e
  atributos — não converta para número só por convertar.
- JSON dentro de string quando o valor é uma lista/objeto:
  `tabelaCenas`, `tabelaTimes`, `tabelaLayout`, `tabelaEscalacoes`, `midias`,
  `midiasAtivas`.
- `tabelaCenaAtual` é **publicado pelo placar** (qual cena está no ar), não é
  configuração.
- `estadoVersao` é incrementado pela API a cada POST e é o que o polling usa.
