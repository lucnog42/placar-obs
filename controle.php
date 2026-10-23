<?php
/**
 * controle.php — painel do operador.
 *
 * PHP só monta o HTML (includes por organização). CSS separado desktop/mobile;
 * JS separado em js/controle/*.js (app.js = UI, boot.js = init).
 */
$v = '20261113a';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Controle de Placar — Servidor</title>
<link rel="stylesheet" href="css/controle.css?v=<?= $v ?>">
<link rel="stylesheet" href="css/controle-desktop.css?v=<?= $v ?>">
<link rel="stylesheet" href="css/controle-mobile.css?v=<?= $v ?>">
</head>
<body>

<div id="status" class="sync">🔄 Conectando ao servidor...</div>

<?php include __DIR__ . '/partials/controle/topbar.php'; ?>
<?php include __DIR__ . '/partials/controle/drawer.php'; ?>
<?php include __DIR__ . '/partials/controle/preview.php'; ?>

<main id="telas">
<?php include __DIR__ . '/partials/controle/tela-1-instancias.php'; ?>
<?php include __DIR__ . '/partials/controle/tela-1-modais.php'; ?>
<?php include __DIR__ . '/partials/controle/tela-2-equipes.php'; ?>
<?php include __DIR__ . '/partials/controle/tela-3-competicao.php'; ?>
<?php include __DIR__ . '/partials/controle/tela-4-tabela.php'; ?>
<?php include __DIR__ . '/partials/controle/tela-5-tema.php'; ?>
<?php include __DIR__ . '/partials/controle/tela-6-patrocinadores.php'; ?>
<?php include __DIR__ . '/partials/controle/tela-7-repertorio.php'; ?>
<?php include __DIR__ . '/partials/controle/tela-8-resumo.php'; ?>
<?php include __DIR__ . '/partials/controle/tela-9-operar.php'; ?>
<?php include __DIR__ . '/partials/controle/tela-9-modais.php'; ?>
</main>

<?php include __DIR__ . '/partials/controle/bottombar.php'; ?>
<?php include __DIR__ . '/partials/controle/debug.php'; ?>

<script src="js/eventbus.js?v=20261113a"></script>
<script src="js/comum.js?v=20261113a"></script>
<script src="js/controle/core.js?v=20261113a"></script>
<script src="js/controle/elementos.js?v=20261113a"></script>
<script src="js/controle/estilo.js?v=20261113a"></script>
<script src="js/controle/midia.js?v=20261113a"></script>
<script src="js/controle/tabela.js?v=20261113a"></script>
<script src="js/controle/app.js?v=<?= $v ?>"></script>
<script src="js/controle/boot.js?v=<?= $v ?>"></script>
<script src="js/controle/navegacao.js?v=20261113a"></script>
</body>
</html>
