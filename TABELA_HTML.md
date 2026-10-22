# Branch `tabela-html` — cenas em HTML/CSS

Branch de trabalho para reescrever em **HTML/CSS** as cenas do overlay que antes
eram desenhadas no canvas (`tabela/tabela.js`). A branch `multi-instancia`
(produção) **não** foi alterada.

## O que mudou

- **Cenas migradas**: `table` (classificação), `intro` (abertura),
  `intervalo` e `encerramento` → agora são DOM + CSS.
- **Cenas que continuam no canvas**: `duel`, `feature`, `form2`, `lineups`,
  `sponsors`, `lower` (e a notificação desenhada no canvas).
- Arquivos:
  - `css/tabela-html.css` — estilos das 4 cenas + temas por CSS variables.
  - `js/placar/tabela-html.js` — monta/atualiza o DOM das 4 cenas.
  - `Placar.html` — `#tabelaHtml` dentro de `#camadaTabela` + css/js.
  - `js/placar/tabela.js` — `desenhar()` despacha para HTML nas 4 cenas e
    alterna a visibilidade canvas/HTML; resto continua no canvas.
- **Playlist** (vem do commit `d60bdea`, também na `multi-instancia`):
  a posição da sequência é persistida por instância no `localStorage` e
  **retomada no reload**; desligar o overlay zera (recomeça do início).

## Como testar

1. Abra o overlay no OBS (browser source) ou no navegador:
   `Placar.html?i=<sua-instancia>`
2. Ligue o overlay pelo Controle. As cenas tabela/abertura/intervalo/encerramento
   aparecem em HTML/CSS; as demais seguem no canvas.
3. Para **comparar** com o motor antigo, use `Placar.html?i=<id>&tabelaCanvas=1`
   (força tudo no canvas).

## Como reverter

```bash
git checkout multi-instancia
```

O app volta a usar 100% o canvas. Nada da `multi-instancia` foi tocado.

## Limitações conhecidas (honestas)

- **Layouts "grade"** (temas `matchfacts` e `aço`) caem para o layout `lista`
  na versão HTML. O layout `grade` (2 colunas × 8) ainda não foi portado.
- **Aparência não verificada em browser real** neste ambiente (sem browser
  headless): validei a estrutura/DOM com os dados reais em Node (16 linhas,
  2 destaques, chips, rebuild ao mudar dados), mas o visual precisa ser
  conferido no OBS.
- Animações são dirigidas por JS a cada frame (como no canvas), o que garante
  que retomar a playlist no meio de uma cena mostre o estado correto (sem
  repetir a animação de entrada).
