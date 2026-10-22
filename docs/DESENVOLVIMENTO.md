# Desenvolvimento

## Requisitos

- **Node 18+** (só para os testes; o app em si não precisa de Node).
- `npm i` dentro de `tests/` (instala `@napi-rs/canvas`, um canvas nativo com a
  mesma API do navegador).
- O app em si precisa só de **PHP 5.3+** e um servidor web.

## Testes

Os testes rodam o app **fora do navegador**: um contexto `vm` com `document`,
`fetch` e `Image` simulados, e um canvas real do `@napi-rs/canvas`. Isso permite
comparar **pixels de verdade** desenhados pelo motor do overlay.

```bash
cd tests
npm install

node test_app.mjs      # integração placar ↔ overlay (liga, desenha, desliga)
node test_app2.mjs     # temas do placar, mídias, notificações
node test_app3.mjs     # painel: campos, presets, uploads
node test_escudo.mjs   # escudo do banco entra no lugar do monograma
node test_app4.mjs     # o suite principal do overlay (19 seções)
```

`npm test` roda o conjunto todo. Os PNGs saem em `tests/frames/`.

### O que o `test_app4.mjs` cobre

1. tema espelha o placar · 2. linha do tempo (visibilidade/duração/ordem) ·
3. dados da aba Times & Competição no cabeçalho · 4. cores dos times ·
5. times do CSV entram na tabela · 6. render por tema · 7. mídia de texto ·
8. `parseClassificacao` com o CSV real · 9. clima + escudos do app no duelo ·
10. notificação → item do repertório · 11. linha do tempo renderizada no painel ·
12. layout por cena (tamanho + posição) e play · 13. modo fixo continuando da
cena no ar, play e destaque A/B · 14. CSV e escudos (data URI vs URL) ·
15. biblioteca de escudos (baixa só o que falta) · 16. escudo do banco na tabela
(diferença de pixels) · 17. folha de contato com os escudos do CSV ·
18/19. o escudo do placar não sobrescreve o da classificação.

### Técnica de verificação de pixel

Para provar que algo mudou na tela:

```js
const A = await render(estadoA);   // Uint8ClampedArray RGBA 1920×1080
const B = await render(estadoB);
// conta pixels diferentes e ONDE estão (linha/coluna)
```

Além de contar diferenças, vale olhar **onde** a diferença está: “955 px
diferentes” numa faixa de 45 px de largura na coluna do escudo é prova; 8.000 px
espalhados não é.

## Convenções

- **CRLF** em todos os arquivos do app (o projeto nasceu assim). Ao editar por
  script, preserve `\r\n` — e ao gerar arquivo novo, escreva com `newline=''` no
  Python.
- **Lado do app em ES5** (`function`, `var`): nada de arrow, `let`, template
  literal.
- **`Controle.init*()` no fim do arquivo**: função declarada depois de uma
  chamada cedo demais fica `undefined`.
- **Chave nova no estado = chave nova no `MS`** (`js/comum.js`), senão o valor
  nunca chega ao servidor. Veja [`DADOS.md`](DADOS.md).
- **Campo novo que deva ir no preset** também precisa entrar no payload escrito
  à mão em `Controle.salvarPreset` (`js/controle/elementos.js`).
- Ao mexer no CSS do painel, confira as chaves (`{`/`}`) — um `@media` sem
  fechar engole todo o resto do arquivo.

## Armadilhas conhecidas (todas já corrigidas — leia antes de mexer)

| Sintoma | Causa |
|---|---|
| Escudo do CSV não aparece na tabela | o placar comparava os times só por nome; trocar URL → arquivo local não mudava a assinatura. Usar `chaveTimes()`, que inclui o escudo |
| Escudo sumindo/trocado em linhas específicas | carga de imagem da lista antiga escrevendo na posição do time novo (`imgs` é indexado por posição). `setTeams` incrementa `CREST_GEN` e a carga antiga é descartada |
| Escudo do placar engolindo o do time | `overrides[nome]` tem prioridade no `badge()`. `setEscudoTime` só aplica quando o time **não** tem escudo na classificação |
| `;` do `data:image/png;base64,` partindo o CSV | campo com data URI precisa vir entre aspas; o parser rejunta, mas exporte entre aspas |
| Logo do torneio não aparecia | faltava ler `logoTorneio` no `config()` e um lugar para desenhar; ver `loadLogo`/`logoAt` |
| Callback do logo desenhando no meio de outra rotina | `loadLogo` chamava o callback de forma síncrona quando nada mudou. Agora só chama quando a imagem chega (`onload`/`onerror`) |
| “Configurei e não salvou” entre sessões | chave fora do mapa `MS` (descartada em silêncio) ou GET em cache. Ver `MS` e os headers `no-store` |
| Preview cortado / menu empurrado | `resizePreview` precisa caber **também na altura** (16:9 exato) e medir a caixa viva, não a janela |
| Acordeão abrindo cortado | `.acc-body` é `max-height` animado; se a seção for longa, use rolagem interna (`rolagem`) |

## Testando sem PHP e sem navegador

Dois limites do ambiente de desenvolvimento (não do app):

- **`api.php` não roda** sem PHP: as ações novas devem ser conferidas por leitura
  (e o arquivo checado com `php -l` quando houver PHP disponível).
- **Sem navegador headless** não se testa layout/CSS de verdade: o que dá para
  provar é o **desenho no canvas** (motor do overlay, placar, mídias). Mudanças
  de CSS/estrutura de painel ficam na leitura de código.
