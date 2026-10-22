# Arquitetura

Três páginas, um arquivo de estado. Nada de banco de dados, sessão, cookie ou
`localStorage` — é isso que faz qualquer sessão, em qualquer máquina, enxergar a
mesma configuração.

```
                 POST (merge)                 GET ?v=N (poll)
controle.php ───────────────► api.php ◄─────────────────── placar.php
   painel                dados/estado.json                 OBS / transmissão
                                  │
                                  └── dados/       (tudo o que o operador cria)
                                      ├── estado*.json, instancias.json, cores.json, grupos.json
                                      ├── escudos/  fundos/  midias/  torneios/  csvs/
                                      └── presets/<instância>/*.json
```

## O estado

`estado.json` é um objeto com seções fixas:

```jsonc
{
  "placar":  { "golsA":"0", "golsB":"0", "tempo":"0", "rodando":"false", "esporte":"futebol", "periodo":"" },
  "times":   { "timeA":"", "timeB":"", "siglaA":"", "siglaB":"", "escudoA":"", "escudoB":"",
               "timeACor":"", "timeBCor":"", "competicao":"", "categoria":"", "grupo":"",
               "fase":"", "data":"", "hora":"", "local":"", "logoTorneio":"", "clima":"", "climaIcone":"" },
  "estilo":  { "tema":"laliga", "fonte":"arial", "nomesExpandidos":"false", "notifAnimacao":"esquerda", "mostrarStatus":"false" },
  "penaltes":{ … }, "notif":{ … }, "posicao":{ … }, "midia":{ … }, "basquete":{ … },
  "tabela":  { /* overlay de classificação */ },
  "estadoVersao": 12
}
```

Valores são **strings** (mesmo números e booleanos) porque o placar os usa
diretamente em CSS/atributos.

### Como o painel salva: `MS` + `paraSecoes`

`js/comum.js` tem o mapa **`MS`** (chave → seção) e:

```js
function paraSecoes(flat){ /* agrupa as chaves do MS por seção */ }
```

`Controle.setEstado({…})` faz duas coisas:

1. `Object.assign(Controle.estado, novos)` — UI atualiza na hora (otimista);
2. `fetch(API, {method:'POST', body: JSON.stringify(paraSecoes(novos))})`.

**Chave que não está no `MS` é descartada em silêncio**: aparece no painel, mas
nunca chega ao servidor. Toda chave nova precisa ser adicionada ao `MS` — foi o
que causou “a configuração não salva de uma sessão para outra”.

### Como o `api.php` aplica

- `POST` sem `?acao=`: `deep_merge($estado, $body)` + `estadoVersao++` +
  `file_put_contents(ESTADO_FILE, …, LOCK_EX)`. Não há whitelist no servidor:
  o que chega é mesclado recursivamente.
- `GET` sem `?acao=`: devolve o estado. Com `?v=N`, se `N` for igual ao
  `estadoVersao` atual, devolve `{"_same":true,"v":N}` (polling barato).
- Respostas vão com `Cache-Control: no-store` — sem isso uma sessão nova podia
  ler um GET em cache e parecer que nada foi salvo.

### Polling

`js/placar/core.js` consulta o estado em intervalo curto e emite eventos no
`EventBus` interno (`js/eventbus.js`) quando algo muda: `placar:changed`,
`times:changed`, `tabela:changed`, `midia:changed`… Cada módulo do lado do
placar (`times`, `tema`, `gols`, `timer`, `midia`, `tabela`) escuta o que lhe
interessa e se redesenha. O painel tem o mesmo desenho (`Controle.on(...)`).

## Ordem de carregamento

`Placar.html` e `controle.php` carregam os scripts na ordem de dependência:
`comum.js` → `eventbus.js` → módulos. Em `js/controle/tabela.js` o
`Controle.initTabela()` é chamado **no fim do arquivo** — função declarada abaixo
de uma chamada cedo demais ficaria `undefined`.

## Overlay como camada

O overlay **não** é uma página separada: é uma `<div id="camadaTabela">` dentro
do `Placar.html`, com um `<canvas>` de 1920×1080 desenhado pelo motor em
`tabela/tabela.js`. Quando o painel liga o overlay:

1. o placar (a camada de baixo) recebe `opacity:0` + `blur` com transição de
   ~350 ms;
2. o canvas entra com fade;
3. ao desligar, o inverso.

`js/placar/tabela.js` é a ponte: lê o estado, monta o objeto `cfg` do motor,
espelha tema/cores/escudos/times e chama `Tabela.setCfg(cfg)`.

## Presets

`salvar_preset` grava um JSON em `dados/presets/<instancia>/` com os campos relevantes
(times, estilo, posição, clima, overlay completo, repertório). O payload é
escrito **à mão** em `js/controle/elementos.js` (`Controle.salvarPreset`) — ao
criar um campo novo que deva ir no preset, adicione lá também.

## Bancos de arquivos

Tudo abaixo vive dentro de `dados/` (ver `config.php`), fora do controle de versão.

| pasta | conteúdo | ações da API |
|---|---|---|
| `dados/escudos/` | escudos de time | `upload_escudos_batch`, `importar_escudos`, `atribuir_escudo`, `listar_escudos`, `remover_escudos` |
| `dados/torneios/` | logos de competição | `upload_logo`, `listar_logos` |
| `dados/midias/` | repertório (png/gif/webp/svg/mp4) | `upload_midia`, `editar_midia`, `remover_midia` |
| `dados/fundos/` | fundos das cenas | `upload_fundo` |
| `dados/csvs/` | CSVs enviados | `salvar_csv`, `carregar_csv` |
| `dados/presets/<instancia>/` | um JSON por preset (biblioteca isolada por instância) | `salvar_preset`, `carregar_preset`, `listar_presets`, `remover_preset` |

`proxy_imagem?url=…` baixa uma imagem externa pelo servidor (contorna CORS/HTTPS
mistos) e é o que o import de CSV usa para trazer os escudos da FCF.

## Convenções do código

- **`CRLF`** em todos os arquivos do app (o projeto nasceu assim; preserve ao
  editar).
- ES5 no lado do app: `function`, `var`, sem arrow/template/`let` — exceto no
  motor (`tabela/tabela.js`), que usa `const/let`, arrow e template literals.
- Nada de framework: manipulação direta de DOM e CSS.
- `api.php` compatível com **PHP 5.3** (`array()`, sem `??`, sem tipos).
