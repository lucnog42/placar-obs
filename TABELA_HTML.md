# Branch `tabela-html` — cenas em HTML/CSS com PHP

Reescreve em **HTML/CSS** as cenas `tabela`, `abertura`, `intervalo` e
`encerramento`, que antes eram desenhadas no canvas (`tabela/tabela.js`).
As demais cenas (duel, feature, form2, lineups, sponsors, lower) **continuam no
canvas**. A branch `multi-instancia` (produção) não é afetada.

## Divisão de responsabilidades

| Camada | Arquivo | Faz |
|---|---|---|
| **PHP** | `placar.php` + `partials/*.php` | monta o HTML (includes por organização); imprime as linhas da classificação |
| **CSS** | `css/tabela.css` | esconde/mostra por `#camadaTabela[data-cena]` e anima (keyframes/transitions, stagger via `--i`) |
| **JS** | `js/placar/tabela.js` | timer/playlist/cena → só troca `data-cena`; **não** monta HTML |
| **JS** | `js/placar/tabela-dados.js` | preenche textos/imagens (nome, PTS, J/V/E/D/F/C, chips V/E/D, escudos, placar) quando o CSV/estado muda |

## Arquivos

```
placar.php                 shell (head, includes, scripts)
partials/placar.php        scoreboard
partials/tabela.php        classificação (pool de 24 linhas; $MAX_LINHAS)
partials/cena-abertura.php
partials/cena-intervalo.php
partials/cena-encerramento.php
css/tabela.css
js/placar/tabela-dados.js
```

## Como testar

- OBS / browser: **`placar.php?i=<instancia>`** (a URL do overlay mudou de `Placar.html` para `placar.php`; o preview do Controle já aponta pra lá).
- Comparar com o motor antigo: `placar.php?i=<id>&tabelaCanvas=1`.
- `Placar.html` continua existindo como versão canvas (legado).

## Notas

- **Pool de linhas**: o PHP imprime `$MAX_LINHAS` (24) linhas; o JS esconde as não usadas. Se o grupo passar de 24 times, aumente a constante em `placar.php`.
- **Dados FCF**: `j`=jogos, `g`=vitórias, `e`=empates, `p`=derrotas, `f`/`c`=gols; `form` vem `G/P/E` (catalão) e é exibido como V/D/E.
- **Animações**: CSS puro (entrada escalonada). Não há count-up de pontos (era JS por frame); o número aparece direto.
- **Tema**: `#camadaTabela[data-tema]` (8 temas em CSS vars), definido pelo estado.
- **Playlist**: posição persistida por instância no `localStorage` (commit `d60bdea`), retomada no reload; desligar zera.

## Validação (neste ambiente, sem PHP/browser reais)

- `php -l` em `placar.php` + 5 partials: OK.
- `node --check` em todo `js/placar/*.js`: OK.
- Tags HTML e chaves CSS balanceadas: OK.
- Teste com os **dados reais** (Node + DOM stub do HTML do PHP): 24 linhas, 16 visíveis, 1ª HAILUKONG (9 pts, 4/3/0/1/10/6), chips V/E/D, intro/intervalo/encerramento preenchidos: **OK**.
- ❗ **Visual/layout e execução do PHP**: só no seu servidor (aqui não roda PHP nem browser).

## Reverter

`git checkout multi-instancia`
