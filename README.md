# Placar OBS — Placar de transmissão com overlay de classificação

Aplicação web para placar de transmissão ao vivo (OBS/vMix/qualquer coisa que
carregue uma página) com um **overlay de classificação em canvas** integrado:
tabela do campeonato, duelo, time destaque, últimos jogos, escalações,
patrocinadores e faixa inferior — em linha do tempo, com temas, CSV da FCF e
banco de escudos próprio.

Feito para o **Grup 18 da Quarta Catalana (FCF)**, mas serve para qualquer
campeonato: a classificação entra por CSV.

```
placar.php   →  o que entra no OBS (fonte de navegador, 1920×1080)
Controle.html →  o painel de quem opera a transmissão
api.php       →  estado compartilhado + uploads + presets (PHP, arquivo JSON)
estado.json   →  o estado salvo (todo mundo que abre a página vê o mesmo)
```

## Como funciona

Não há banco de dados nem sessão. Tudo vive num **arquivo JSON único**
(`estado.json`), escrito de forma atômica pelo `api.php`:

- o **painel** (`Controle.html`) escreve no estado (`POST`);
- o **placar** (`placar.php`) lê o estado em ciclo curto (`GET ?v=N`, que
  responde `{_same:true}` quando nada mudou);
- **qualquer sessão, em qualquer máquina, vê exatamente a mesma configuração** —
  não há nada guardado no navegador.

## Instalação

Requisitos: **PHP 5.3+** com escrita na pasta do app. Nada além disso.

1. Copie os arquivos para uma pasta do seu servidor (a mesma do `api.php`).
2. Garanta permissão de escrita na pasta (o app cria/atualiza `estado.json`,
   `escudos/`, `midias/`, `torneios/`, `presets/`).
3. Abra **`Controle.html`** no navegador de quem opera.
4. No OBS, adicione **`placar.php`** como *Fonte de Navegador*, 1920×1080,
   fundo transparente ligado.

```
http://SEU-SERVIDOR/placar/placar.php     → OBS
http://SEU-SERVIDOR/placar/Controle.html   → painel
```

## Recursos

**Placar (o que a câmera vê)**

- Times A/B com nome, sigla, cor e escudo; gols, cronômetro e período.
- Três temas de placar: **La Liga**, **Colorido**, **Simples** (`css/*.css`).
- Pênaltis, contador de gols, notificação de gol/cartão (curta e longa).
- **Repertório de mídias**: imagem, **GIF animado** e vídeo em ciclo, com
  duração/intervalo e transição; notificações de texto com disparo avulso.
- Posição/escala do placar na tela (`placarScale`, `placarX`, `placarY`).

**Overlay de classificação** (ligado pelo painel — o placar sai e o overlay entra)

- 8 cenas: abertura, tabela, duelo, time destaque, forma, escalações,
  patrocinadores e faixa inferior.
- Linha do tempo com visibilidade, **duração por cena (slider com knob)** e
  ordem; ou **cena fixa** (que entra já na cena que estava no ar).
- 7 temas de overlay; o **tema espelha o do placar** em modo automático.
- Times A/B, cores, escudos, competição, local/hora/clima e **logo do torneio**
  espelhados do placar.
- **Classificação por CSV** do `fcf.cat` — baixa todos os escudos para a
  biblioteca do app e usa esses times na tabela.
- **Escalações por CSV**.
- Presets que salvam/restauram tudo de uma vez.

**Painel**

- Preview do placar embutido (iframe) com zoom, em tela de pé (100% da largura,
  em cima) ou deitada (coluna ao lado, 50/50 com o menu).
- Bancos de imagens com upload: **escudos**, **logo do torneio** e **mídias**.
- Presets por partida, com filtros por competição/hora/local.

## Documentação

| Documento | Assunto |
|---|---|
| [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) | como as três páginas conversam, o estado e o mapa de chaves |
| [`docs/PAINEL.md`](docs/PAINEL.md) | cada seção do `Controle.html` e o que ela faz |
| [`docs/OVERLAY-CLASSIFICACAO.md`](docs/OVERLAY-CLASSIFICACAO.md) | motor do overlay: cenas, temas, timeline, layout por cena |
| [`docs/API.md`](docs/API.md) | todos os endpoints do `api.php` |
| [`docs/DADOS.md`](docs/DADOS.md) | formato do CSV da classificação, escalações e chaves do estado |
| [`docs/DESENVOLVIMENTO.md`](docs/DESENVOLVIMENTO.md) | harness de testes em Node, convenções e armadilhas |
| [`LEIA-ME_OVERLAY_TABELAS.md`](LEIA-ME_OVERLAY_TABELAS.md) | guia curto, em português, da integração do overlay |
| [`CHANGELOG.md`](CHANGELOG.md) | histórico das entregas |

## Estrutura

```
placar.php            página da fonte do OBS
Controle.html          painel (HTML + JS de UI específico)
api.php                API/estado em arquivo
estado.json            estado compartilhado (criado em execução, fora do git)
tabela/tabela.js       MOTOR do overlay: canvas 1920×1080, temas e cenas
tabela/dados.js        classificação padrão do grupo (16 times)
js/comum.js            constantes, mapa de chaves (MS) e helpers comuns
js/eventbus.js         barramento de eventos interno
js/placar/*.js         lado da transmissão (core, times, tema, gols, mídia…)
js/controle/*.js       lado do painel (core, elementos, tabela, mídia…)
css/*.css              temas do placar + CSS do painel
escudos/               banco de escudos (upload; clubes fora do repositório)
torneios/              banco de logos de torneio (upload)
midias/                imagens/GIFs/vídeos do repertório (upload)
presets/               presets salvos pelo painel
img/                   ícones do próprio app
dados/                 CSV de exemplo da classificação
```

## Desenvolvimento

Os testes são scripts Node que rodam o app em ambiente simulado (sem navegador),
inclusive verificando **pixels** desenhados pelo motor do overlay:

```bash
cd tests && node test_app4.mjs     # overlay: temas, cenas, CSV, escudos, painel
```

Veja [`docs/DESENVOLVIMENTO.md`](docs/DESENVOLVIMENTO.md).

## Escudos e logos

Este repositório **não inclui** escudos de clubes nem logos de competições —
são marcas de terceiros (clubes e FCF). A pasta `escudos/` traz apenas as
**cores genéricas** do app (`Vermelho.png`, `Roxo.png`, `Azul.png`…). Ao importar
o CSV da classificação, o painel baixa os escudos do `fcf.cat` para o **seu**
servidor; a partir daí o overlay serve as imagens localmente.

## Limitações conhecidas

- `js/placar/basquete.js` e `js/controle/basquete.js` não existem; o seletor de
  esporte foi removido do painel. Basquete precisa desses dois arquivos.
- Não há exportação de GIF: o overlay é uma camada dentro do próprio app.
- Sem PHP 8: o `api.php` é compatível com PHP 5.3 (nada de sintaxe moderna).

## Licença

Ainda não definida. O código original do placar veio de terceiros e o overlay foi
construído em cima; defina a licença antes de reutilizar comercialmente.

## Créditos

- Dados e escudos da classificação: [fcf.cat](https://www.fcf.cat) (Federació
  Catalana de Futbol).
- Overlay, repertório, CSV e integração com o placar: este projeto.
