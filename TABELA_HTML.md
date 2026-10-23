# Cenas em HTML/CSS com PHP — migração concluída

Todas as cenas do overlay sao **HTML/CSS**: o PHP monta (`partials/cena-*.php`),
o CSS mostra/anima por `#camadaTabela[data-cena]` e o JS so preenche textos,
escudos e classes. O motor canvas (`tabela/tabela.js`, 836 linhas) foi removido.

| Cena | Partial |
|---|---|
| `table` | `partials/tabela.php` |
| `intro` | `partials/cena-abertura.php` |
| `intervalo` | `partials/cena-intervalo.php` |
| `encerramento` | `partials/cena-encerramento.php` |
| `sponsors` | `partials/cena-sponsors.php` |
| `lower` | `partials/cena-lower.php` |
| `lineups` | `partials/cena-lineups.php` |
| `feature` | `partials/cena-feature.php` |
| `form2` | `partials/cena-form2.php` |
| `duel` | `partials/cena-duel.php` |

Notificacao: `partials/notificacao-overlay.php` — camada propria (`#camadaNotif`),
**fora do placar** e fora da camada da tabela, com animacao de entrada/saida.
Patrocinadores: camada propria `partials/camada-sponsors.php` (`#camadaSponsors`) —
lower third (`#spFaixa`) com um logo por vez, independente do overlay; o nome vem do
painel (`spNomes`).

## Regras

- Estagio de cada cena: `.cena-inner` = 1280x720 escalado 1.5x (coordenadas do
  motor antigo); a cena em si ocupa 1920x1080.
- JS nao monta HTML: so `textContent`, `src` e classes (`js/placar/tabela-dados.js`).
- Troca de cena: `#camadaTabela[data-cena="..."]` (loop por `setInterval` de 200 ms).
- Pool de linhas: o PHP imprime `$MAX_LINHAS` (24); o JS esconde as que sobram.
- `j`=jogos, `g`=vitorias, `e`=empates, `p`=derrotas; `form` vem `G/P/E` (catalao)
  e aparece como V/D/E.
- Tema unico La Liga em CSS vars (`--bg/--fg/--ac`).
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
- `Placar.html` foi removido nesta branch: o overlay agora é só `placar.php`.

## Notas

- **Pool de linhas**: o PHP imprime `$MAX_LINHAS` (24) linhas; o JS esconde as não usadas. Se o grupo passar de 24 times, aumente a constante em `placar.php`.
- **Dados FCF**: `j`=jogos, `g`=vitórias, `e`=empates, `p`=derrotas, `f`/`c`=gols; `form` vem `G/P/E` (catalão) e é exibido como V/D/E.
- **Animações**: CSS puro (entrada escalonada). Não há count-up de pontos (era JS por frame); o número aparece direto.
- **Tema**: `#camadaTabela[data-tema]` (8 temas em CSS vars), definido pelo estado.
- **Motor canvas**: agora desenha só as 6 cenas restantes; o código das 4 cenas migradas foi removido de `tabela/tabela.js`.
- **Playlist**: posição persistida por instância no `localStorage` (commit `d60bdea`), retomada no reload; desligar zera.

## Validação (neste ambiente, sem PHP/browser reais)

- `php -l` em `placar.php` + 5 partials: OK.
- `node --check` em todo `js/placar/*.js`: OK.
- Tags HTML e chaves CSS balanceadas: OK.
- Teste com os **dados reais** (Node + DOM stub do HTML do PHP): 24 linhas, 16 visíveis, 1ª HAILUKONG (9 pts, 4/3/0/1/10/6), chips V/E/D, intro/intervalo/encerramento preenchidos: **OK**.
- ❗ **Visual/layout e execução do PHP**: só no seu servidor (aqui não roda PHP nem browser).

## Reverter

`git checkout multi-instancia`
