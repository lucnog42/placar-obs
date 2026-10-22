<?php
/**
 * config.php — onde ficam os DADOS DO USUÁRIO (uploads, estado, presets).
 *
 * Regra do projeto: o repositório é só código. Tudo que o operador cria em
 * runtime mora em DATA_DIR, que nunca é versionado e nunca é sobrescrito por
 * uma atualização (`git pull`, rsync etc.).
 *
 * DATA_DIR aponta para `dados/` dentro do projeto por padrão. Para mover os
 * dados para fora da webroot (recomendado em produção), defina a variável de
 * ambiente PLACAR_DATA_DIR — sem mexer em código.
 */

if (!defined('DATA_DIR')) {
    $placar_data = getenv('PLACAR_DATA_DIR');
    if (!$placar_data) { $placar_data = __DIR__ . '/dados'; }
    define('DATA_DIR', rtrim(str_replace('\\', '/', $placar_data), '/'));
}
