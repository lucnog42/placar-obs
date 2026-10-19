# API (`api.php`)

API única, sem autenticação (proteja a pasta no servidor se precisar). Toda
resposta é JSON. `Content-Type: application/json`, CORS liberado e
`Cache-Control: no-store`.

- **GET sem `?acao=`** — devolve o estado inteiro. Com `?v=N`, devolve
  `{"_same":true,"v":N}` quando `N` é o `estadoVersao` atual.
- **POST sem `?acao=`** — corpo `{"secao":{"chave":"valor"}}`; mescla
  recursivamente (`deep_merge`), incrementa `estadoVersao` e grava com `LOCK_EX`.
- Erro → HTTP 4xx/5xx com `{"erro":"mensagem"}`.

## GET

| `?acao=` | Parâmetros | Resposta |
|---|---|---|
| *(nenhum)* | `v` (opcional) | estado completo, ou `{_same:true,v:N}` |
| `listar_presets` | `competicao`, `categoria`, `grupo`, `fase`, `data`, `hora`, `local`, `busca` (filtros opcionais) | `{presets:[{nome,competicao,…}]}` |
| `listar_filtros` | — | valores distintos para os seletores: `{competicao:[…],categoria:[…],grupo:[…],fase:[…],data:[…],hora:[…],local:[…]}` |
| `listar_logos` | — | `{logos:["pirineos.png", …]}` (banco `torneios/`) |
| `listar_escudos` | — | `{escudos:["POMAR__C_D__A", …]}` (nomes **sem** extensão; só `.png`) |
| `carregar_preset` | `nome` | o JSON do preset (`{nome,timeA,…,tabelaCenas,…}`) |
| `proxy_imagem` | `url` (http/https, codificada) | a imagem baixada, com CORS liberado |

## POST

### Estado

```http
POST api.php
{"tabela":{"tabelaAtivo":"true"},"clima":"18°C"}
```
→ devolve o estado já mesclado.

### Presets

| `?acao=` | Corpo | Resposta |
|---|---|---|
| `salvar_preset` | `{nome, dados}` | `{ok:true,nome}` (cria/sobrescreve `presets/<nome>.json`) |
| `remover_preset` | `{nome}` | `{ok:true}` |

### Escudos (`escudos/`)

| `?acao=` | Corpo | Resposta |
|---|---|---|
| `upload_escudo` | `{time:"A"\|"B", src}` (data URI base64) | `{ok:true, src:"escudos/A.png?v=…"}` |
| `upload_escudos_batch` | `{arquivos:[{nome,src}, …]}` | `{ok:true, count, resultados:[…]}` |
| `atribuir_escudo` | `{nome, time:"A"\|"B"}` | `{ok:true, src}` (usa um escudo já do banco) |
| `remover_escudos` | `{nomes:[…]}` | `{ok:true, removidos, resultados:[…]}` |
| `importar_escudos` | `{itens:[{nome,src}, …]}` | `{ok:true, salvos:[{nome, arquivo}, …]}` |

O nome do arquivo é o nome do time sem acento/espaço/pon­tuação
(`[^A-Za-z0-9_-] → _`) + a extensão detectada no data URI (padrão `.png`).
`importar_escudos` é o que o import de CSV usa: recebe os times e devolve o
caminho local de cada um para o painel gravar em `tabelaTimes`.

### Mídias (`midias/`)

| `?acao=` | Corpo | Resposta |
|---|---|---|
| `upload_midia` | `{id, src}` (data URI; PNG, **GIF**, WEBP, SVG, MP4) | `{ok:true, id}` |
| `editar_midia` | `{id}` — atualiza o item no estado | `{ok:true}` |
| `remover_midia` | `{id}` | `{ok:true}` |

O item de mídia vive no estado (`midia.midias`), com `arquivo`, `nome`, `tipo`,
`dur`, `intervalo`, `ativo` e o texto quando é notificação.

### Logo do torneio (`torneios/`)

| `?acao=` | Corpo | Resposta |
|---|---|---|
| `upload_logo` | `{nome?, src}` | `{ok:true, arquivo:"pirineos.png"}` |

## Detalhes de implementação

- `estado.json` é criado com os defaults na primeira leitura se não existir.
- Escrita atômica: `file_put_contents(…, LOCK_EX)`.
- Uploads usam `save_data_uri()` / `list_escudo_files()` (helpers no topo do
  arquivo) e aceitam `;base64,` com qualquer `mime:image/*`.
- `proxy_imagem` só aceita `http://` e `https://` (bloqueia `file://` e afins).
- O código é **PHP 5.3** compatível: `array()`, sem `??`, sem *type hints*, sem
  *short array* em retorno de função.
