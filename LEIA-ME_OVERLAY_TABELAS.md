# Overlay · Tabelas — integração no Placar OBS

O sistema de tabelas (classificação, duelo, destaque, forma, escalações, faixa
inferior) é uma **camada do próprio app**, ligada pelo painel de controle.
Ao ligar, o placar sai de cena e o overlay entra no lugar dele; ao desligar, o
overlay sai e o placar volta.

## Como usar

1. Suba os arquivos no seu servidor (mesma pasta do `api.php`).
2. Abra o `Controle.html`.
3. Seção **📊 Overlay · Tabelas** → botão **▶ Ligar overlay**.

O `Placar.html` (fonte de navegador do OBS) recebe a camada automaticamente.

## O que o overlay espelha do placar

| no placar | no overlay |
|---|---|
| Tema (La Liga / Colorido / Simples) | tema do overlay (Escuro / Neon / Match Facts) — em **Automático (segue o placar)** |
| Cor do time A e do time B | cores das laterais, do duelo e da faixa inferior |
| Escudos enviados em *Upload de Escudos* | escudo dos dois times do confronto no duelo, no destaque e no cabeçalho |
| Competição · Grupo · Categoria · Fase | título e subtítulo do cabeçalho |
| Local · Hora · Clima (+ ícone) | campo/cidade, horário e clima do cabeçalho |
| Times A e B | os dois times destacados na classificação (casados pelo nome) |

## Cenas em linha do tempo

A lista de cenas tem **marcação de visibilidade**, **duração em segundos** e
**ordem** (↑ ↓). O overlay toca as cenas marcadas, na ordem, em sequência
(mostra o total em segundos). Modos:

- **Linha do tempo** — toca a sequência das cenas marcadas, em ciclo.
- **Cena fixa** — toca só a cena escolhida, com a duração definida na lista.

Cenas: Abertura do confronto · Tabela de classificação · Duelo (confronto) ·
Time destaque · Forma/últimos jogos · Escalações · Patrocinadores ·
Faixa inferior (placar).

## Time destaque

Um único seletor (**Time destaque**) manda na cena *Time destaque* e na cena
*Escalações*. Os dois times do confronto (A e B) vêm do placar
automaticamente — não há mais campos separados de "Times em destaque".

## Classificação por CSV (com download dos escudos)

Em *Classificação (CSV do fcf.cat)*: escolha o `.csv` da classificação. O
painel lê os times e **baixa todos os escudos do CSV** para o banco de imagens
do app (`escudos/`), gravando o caminho local no estado — os escudos passam a
ser servidos pelo seu próprio servidor, sem depender do site da FCF.
Colunas reconhecidas por nome (`Pos;Equip;Punts;J;G;E;P;GF;GC;DG;Ultims;Sancio;PosSite;Escut`),
com `;` ou `,`, com ou sem cabeçalho. A tabela do overlay passa a usar esses times.

## Escalações por CSV

`Equipe;Jogador;Numero;Posicao` (com `;` ou `,`, com ou sem cabeçalho).
As escalações ficam no `estado.json` (`tabelaEscalacoes`).

## Repertório · Notificações & Mídias

Um único repertório reúne **arquivos** e **notificações**:

- **Imagem, GIF animado e vídeo** — mesmo fluxo (Nome → Adicionar). O GIF anima
  no placar como qualquer imagem.
- **Notificações** (Gol / Cartão amarelo / Cartão vermelho / Aviso) viram itens
  de texto do repertório, com duração, transição e repetição próprias.
  - **▶ Enviar agora** dispara uma vez no placar.
  - **➕ Guardar no repertório** só guarda, para reusar depois.
  - O texto de cada item é editável na própria lista.

Arquivos têm **Ativar** (entra no ciclo, com duração e intervalo). Itens de
texto têm **▶ Enviar** (disparo avulso) — o letreiro aparece com a animação
configurada em *Estilo & Posição → Animação da Notificação*.

## Presets

O preset salva e restaura tudo do overlay: tema, modo, cenas (com durações e
visibilidade), time destaque, zonas, cabeçalho, classificação importada,
escalações, clima, repertório de mídias e as notificações.
Os escudos embutidos em base64 não vão para o preset (eles vivem em `escudos/`).

## Logo do torneio

O logo vem do banco `torneios/`, com **📤 Subir logo** para enviar mais a
qualquer momento (PNG, JPG, WEBP, SVG, GIF). Fica salvo junto do banco de
escudos, no mesmo esquema.

## Preview

- **Tela em pé (estreita)**: o preview fica em cima, ocupando toda a largura,
  com a barra de zoom (35 %–100 %).
- **Tela deitada (≥1100 px)**: o preview vira uma coluna ao lado do menu,
  fixa ao rolar.

## Arquivos novos

| arquivo | o que é |
|---|---|
| `tabela/tabela.js` | motor de desenho das cenas (canvas, 7 temas, 8 cenas) |
| `tabela/dados.js` | classificação do grupo (16 times, escudos e cores) |
| `js/placar/tabela.js` | camada do overlay no lado da transmissão |
| `js/controle/tabela.js` | painel do overlay (cenas, CSV, destaque) |
| `js/controle/midia.js` | repertório (imagem/GIF/vídeo/notificações) — reescrito |

## Arquivos alterados

| arquivo | mudança |
|---|---|
| `Placar.html` | `<div id="camadaTabela">` + scripts |
| `Controle.html` | seção do overlay, repertório unificado, clima, zoom do preview, subir logo, sem o seletor de esporte |
| `js/comum.js` | chaves novas no mapa `MS` (`tabelaModo`, `tabelaCenas`, `tabelaTimes`, `clima`, `climaIcone`, `midiaDisparo*`) |
| `js/placar/core.js` | emite `tabela:changed` (já existia) |
| `js/placar/midia.js` | mídias de texto + disparo avulso + GIF |
| `js/controle/core.js` | sincroniza clima e ícone do clima |
| `js/controle/elementos.js` | upload de logo, clima no torneio, presets com as chaves novas |
| `css/controle.css` | preview (vertical/horizontal + zoom), lista de cenas, repertório |
| `api.php` | `upload_logo`, `importar_escudos`, GIF/WEBP/SVG na mídia, mídia de texto, `clima`/`climaIcone`, chaves novas em `tabela` |

O `estado.json` **não** foi incluído: o seu estado atual continua valendo; as
chaves novas são criadas no primeiro salvamento do painel.

## Observações

- O fundo do overlay é transparente: só os painéis aparecem sobre o vídeo.
- Escudos: sem internet o overlay cai no monograma do time. Depois de importar
  o CSV, os escudos são locais.
- A exportação de GIF não faz parte desta integração.
- No zip original faltam `js/placar/basquete.js` e `js/controle/basquete.js`
  (o seletor de Esporte foi removido do painel justamente por isso). Se você
  usa basquete, esses dois arquivos precisam existir no servidor.

## Controles do painel (rodada de ajustes)

**Time destaque.** Al&eacute;m do seletor, h&aacute; os bot&otilde;es **&#11088; Casa (A)** e
**&#11088; Fora (B)**: eles pegam o time que est&aacute; no placar, acham o time
correspondente na classifica&ccedil;&atilde;o e marcam como destaque (sirva para a cena
*Time destaque* e para as *Escala&ccedil;&otilde;es*). **Autom&aacute;tico** volta ao time do
placar. Quando a aba *Times &amp; Competi&ccedil;&atilde;o* est&aacute; vazia, o painel avisa
("sem dados na aba Times & Competi&ccedil;&atilde;o — o overlay usa os padr&otilde;es") e os
bot&otilde;es avisam se o nome do placar n&atilde;o casar com nenhum time da lista.

**Modo fixa &harr; linha do tempo.** Um toggle troca os dois modos. Ao ligar a
**cena fixa**, ela j&aacute; entra sendo *a cena que estava no ar* na linha do tempo
(o placar publica a cena atual no estado), ou seja, a transi&ccedil;&atilde;o &eacute;
autom&aacute;tica em vez de cair numa cena qualquer. O bot&atilde;o **&#9654; Tocar**
volta para a linha do tempo e reinicia a sequ&ecirc;ncia do come&ccedil;o na hora.

**Layout do painel.** Em tela deitada o menu fica com **40%** e a coluna da
direita com **60%**: preview em cima e o painel do overlay logo **abaixo do
preview**, na mesma coluna (o preview continua fixo ao rolar). Em tela em p&eacute;
o preview segue em cima, ocupando 100% da largura, com a barra de zoom.

**Tamanho e posi&ccedil;&atilde;o por cena.** Cada linha da linha do tempo tem:
- **%** (arraste para o lado para mudar o tamanho daquela cena, 20%&ndash;300%);
- **&#10021;** (arma a caixa de arrastar no preview).

Com a caixa armada, arrastar o meio move a cena (x/y) e arrastar o canto azul
muda o tamanho. Soltar grava em `tabelaLayout` (`{"cena":{"e":escala,"x":%,"y":%}}`),
que vai junto no preset. Cena sem layout salvo = 100% e centralizada.

Tamb&eacute;m foi corrigido um `@media` que ficou aberto no CSS e fazia todos os
estilos seguintes valerem s&oacute; em tela larga.
## Biblioteca de escudos (escudos/)

Ao importar o CSV da classifica&ccedil;&atilde;o, **todos** os escudos referenciados v&atilde;o para a
biblioteca do app (`escudos/`). Antes de baixar, o painel chama `listar_escudos` e
confere o que j&aacute; existe: o que est&aacute; l&aacute; n&atilde;o &eacute; baixado de novo, s&oacute; passa a
apontar para o arquivo local (o relat&oacute;rio mostra "N no banco (X baixados agora ·
Y j&aacute; estavam)"). O nome do arquivo segue a regra do `importar_escudos`
(nome do time sem acento/espa&ccedil;o + extens&atilde;o), ent&atilde;o copiar escudos na m&atilde;o
para `escudos/` tamb&eacute;m faz o app reconhecer como "j&aacute; est&aacute; na biblioteca".

O bot&atilde;o **&#128229; Sincronizar escudos** roda a mesma confer&ecirc;ncia a qualquer
momento, usando a classifica&ccedil;&atilde;o que est&aacute; no estado. Escudo embutido no CSV
(data URI base64) vai direto para a biblioteca, sem passar pelo proxy de imagem.
