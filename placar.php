<?php
/**
 * placar.php — overlay do placar (browser source do OBS).
 *
 * Papel do PHP aqui: APENAS montar o HTML, com `include` por organização.
 * - CSS esconde/transiciona as cenas (atributo data-cena).
 * - JS controla timer/playlist/funções e preenche os textos/imagens variáveis
 *   (tabela/dados.js alimenta a classificação; tabela-dados.js pinta o DOM).
 */
$MAX_LINHAS = 24;          // pool de linhas da classificação (JS esconde as não usadas)
$v = '20261024a';          // cache-busting
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Placar OBS</title>
<link rel="stylesheet" href="css/base.css?v=20261024a">
<link id="tema" rel="stylesheet" href="css/laliga.css?v=20261024a">
<link rel="stylesheet" href="css/midia-anim.css?v=20261024a">
<link rel="stylesheet" href="css/tabela.css?v=<?= $v ?>">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1920px;height:1080px;background:transparent;font-family:'Arial',sans-serif;overflow:hidden;position:relative}
#placarWrapper{position:absolute;z-index:1;top:50px;left:50px;transform:scale(0.65);transform-origin:0 0}
#status{position:fixed;top:4px;right:8px;z-index:999;font-size:14px;color:#0f0;opacity:1;background:rgba(0,0,0,0.7);padding:2px 8px;border-radius:3px}
</style>
</head>
<body>
<div id="camadaMidia" data-transicao="fade"></div>
<div id="status"></div>

<?php include __DIR__ . '/partials/placar.php'; ?>

<div id="camadaTabela" data-cena="">
  <canvas id="tabelaCanvas" width="1920" height="1080"></canvas>
  <?php include __DIR__ . '/partials/tabela.php'; ?>
  <?php include __DIR__ . '/partials/cena-abertura.php'; ?>
  <?php include __DIR__ . '/partials/cena-intervalo.php'; ?>
  <?php include __DIR__ . '/partials/cena-encerramento.php'; ?>
</div>

<script src="js/eventbus.js?v=20261024a"></script>
<script src="js/comum.js?v=20261024a"></script>
<script src="js/placar/core.js?v=20261024a"></script>
<script src="js/placar/timer.js?v=20261024a"></script>
<script src="js/placar/gols.js?v=20261024a"></script>
<script src="js/placar/times.js?v=20261024a"></script>
<script src="js/placar/penaltes.js?v=20261024a"></script>
<script src="js/placar/notificacao.js?v=20261024a"></script>
<script src="js/placar/tema.js?v=20261024a"></script>
<script src="js/placar/midia.js?v=20261024a"></script>
<script src="tabela/dados.js?v=20261024a"></script>
<script src="tabela/tabela.js?v=20261024a"></script>
<script src="js/placar/tabela-dados.js?v=<?= $v ?>"></script>
<script src="js/placar/tabela.js?v=<?= $v ?>"></script>
<script>Placar.init();</script>
</body>
</html>
