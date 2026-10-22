<?php
/**
 * Basketball Scoreboard API - PHP 5.3 compatible
 * Persistence: estado.json with LOCK_EX atomic writes
 * Polling: GET ?v=N returns {_same:true,v:N} when unchanged
 * Mutations: POST merges state and increments estadoVersao
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // 200 OK (default)
    exit;
}

// ---------- helpers ----------

define('BASE_DIR', dirname(__FILE__));
define('ESTADO_FILE', BASE_DIR . '/estado.json');
define('PRESETS_DIR', BASE_DIR . '/presets');
define('ESCUDOS_DIR', BASE_DIR . '/escudos');
define('MIDIAS_DIR', BASE_DIR . '/midias');
define('CORES_FILE', BASE_DIR . '/cores.json');
define('GRUPOS_FILE', BASE_DIR . '/grupos.json');
define('CSVS_DIR', BASE_DIR . '/csvs');
define('FUNDOS_DIR', BASE_DIR . '/fundos');
define('LOCK_FILE', BASE_DIR . '/estado.lock');
define('ESTADO_BAK', BASE_DIR . '/estado.json.bak');

function ensure_dirs() {
    $dirs = array(PRESETS_DIR, ESCUDOS_DIR, MIDIAS_DIR, CSVS_DIR, FUNDOS_DIR);
    foreach ($dirs as $d) {
        if (!is_dir($d)) {
            mkdir($d, 0755, true);
        }
    }
}

/**
 * Pasta de presets da instancia atual.
 * Cada instancia tem a sua propria biblioteca: presets/<instancia>/<nome>.json
 * Sem instancia (chamada generica), mantem a raiz presets/.
 */
function presets_dir() {
    global $INSTANCIA;
    if ($INSTANCIA === '') { return PRESETS_DIR; }
    $slug = preg_replace('/[^A-Za-z0-9_-]+/', '_', $INSTANCIA);
    if ($slug === '') { $slug = 'instancia'; }
    return PRESETS_DIR . '/' . $slug;
}

/**
 * Migracao unica: a biblioteca antiga era compartilhada (presets na raiz).
 * Na primeira vez que uma instancia usa presets, copia os arquivos da raiz
 * para a pasta dela (sem apagar os originais).
 */
function presets_migrar_raiz($dir) {
    if ($dir === PRESETS_DIR || is_dir($dir) || !is_dir(PRESETS_DIR)) { return; }
    @mkdir($dir, 0755, true);
    $raiz = @glob(PRESETS_DIR . '/*.json');
    if (!is_array($raiz)) { return; }
    foreach ($raiz as $f) {
        @copy($f, $dir . '/' . basename($f));
    }
}
ensure_dirs();

// ---------- instancias (multi-placar) ----------

$INSTANCIA = '';
if (isset($_GET['i'])) {
    $INSTANCIA = preg_replace('/[^A-Za-z0-9_\- ]/', '', $_GET['i']);
} elseif (isset($_GET['instancia'])) {
    $INSTANCIA = preg_replace('/[^A-Za-z0-9_\- ]/', '', $_GET['instancia']);
}
if ($INSTANCIA === '.' || $INSTANCIA === '..') { $INSTANCIA = ''; }

function estado_path() {
    global $INSTANCIA;
    return ($INSTANCIA === '') ? (BASE_DIR . '/estado.json') : (BASE_DIR . '/estado-' . $INSTANCIA . '.json');
}

function estado_bak_path() {
    global $INSTANCIA;
    return ($INSTANCIA === '') ? (BASE_DIR . '/estado.json.bak') : (BASE_DIR . '/estado-' . $INSTANCIA . '.json.bak');
}

function estado_lock_path() {
    global $INSTANCIA;
    return ($INSTANCIA === '') ? (BASE_DIR . '/estado.lock') : (BASE_DIR . '/estado-' . $INSTANCIA . '.lock');
}

function instancias_path() {
    return BASE_DIR . '/instancias.json';
}

function cores_path() {
    return CORES_FILE;
}

function load_cores() {
    $raw = @file_get_contents(cores_path());
    $data = json_decode($raw, true);
    if (!is_array($data)) { $data = array(); }
    return $data;
}

function save_cores($lista) {
    $json = json_encode($lista);
    if ($json === false) { return false; }
    $tmp = cores_path() . '.tmp.' . getmypid();
    if (@file_put_contents($tmp, $json, LOCK_EX) === false) { @unlink($tmp); return false; }
    if (!@rename($tmp, cores_path())) { @unlink($tmp); return false; }
    return true;
}

function load_grupos() {
    $raw = @file_get_contents(GRUPOS_FILE);
    $data = json_decode($raw, true);
    if (!is_array($data)) { $data = array(); }
    return $data;
}

function save_grupos($lista) {
    $json = json_encode($lista);
    if ($json === false) { return false; }
    $tmp = GRUPOS_FILE . '.tmp.' . getmypid();
    if (@file_put_contents($tmp, $json, LOCK_EX) === false) { @unlink($tmp); return false; }
    if (!@rename($tmp, GRUPOS_FILE)) { @unlink($tmp); return false; }
    return true;
}

function load_instancias() {
    $raw = @file_get_contents(instancias_path());
    $data = json_decode($raw, true);
    if (!is_array($data)) { $data = array(); }
    return $data;
}

function save_instancias($lista) {
    $json = json_encode($lista);
    if ($json === false) { return false; }
    $tmp = instancias_path() . '.tmp.' . getmypid();
    if (@file_put_contents($tmp, $json, LOCK_EX) === false) { @unlink($tmp); return false; }
    if (!@rename($tmp, instancias_path())) { @unlink($tmp); return false; }
    return true;
}

function save_estado_for($id, $data) {
    global $INSTANCIA;
    $prev = $INSTANCIA;
    $INSTANCIA = $id;
    $ok = save_estado($data);
    $INSTANCIA = $prev;
    return $ok;
}

$MUTATE_LOCK = null;

function estado_lock($mode) {
    $fp = @fopen(estado_lock_path(), 'c');
    if (!$fp) return false;
    @flock($fp, $mode);
    return $fp;
}

// leitura sem lock: o chamador ja deve segurar o lock apropriado
function load_estado_raw() {
    $raw = @file_get_contents(estado_path());
    if ($raw === false) {
        $raw = @file_get_contents(estado_bak_path());
        if ($raw === false) return default_estado();
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        $raw = @file_get_contents(estado_bak_path());
        if ($raw !== false) { $data = json_decode($raw, true); }
    }
    if (!is_array($data)) return default_estado();
    return $data;
}

function load_estado() {
    global $MUTATE_LOCK;
    if ($MUTATE_LOCK) {
        return load_estado_raw(); // ja estamos em lock exclusivo (evita deadlock)
    }
    $fp = estado_lock(LOCK_SH);
    $data = load_estado_raw();
    if ($fp) { @flock($fp, LOCK_UN); fclose($fp); }
    return $data;
}

function mutate_begin() {
    global $MUTATE_LOCK;
    $MUTATE_LOCK = estado_lock(LOCK_EX);
}

function save_estado($data) {
    $json = json_encode($data);
    if ($json === false) return false;
    $tmp = estado_path() . '.tmp.' . getmypid();
    if (@file_put_contents($tmp, $json, LOCK_EX) === false) {
        @unlink($tmp);
        return false;
    }
    if (!@rename($tmp, estado_path())) {
        @unlink($tmp);
        return false;
    }
    // backup = ultimo estado bom (recuperacao sem perda)
    @copy(estado_path(), estado_bak_path());
    return true;
}

function default_estado() {
    return array(
        'placar' => array('golsA' => '0', 'golsB' => '0', 'tempo' => '0', 'tempoInicio' => '0', 'rodando' => 'false', 'esporte' => 'futebol', 'periodo' => ''),
        'times' => array(
            'timeA' => '', 'timeB' => '',
            'siglaA' => '', 'siglaB' => '',
            'escudoA' => '', 'escudoB' => '',
            'timeACor' => '#ff0000', 'timeBCor' => '#0000ff',
            'competicao' => '', 'categoria' => '', 'grupo' => '',
            'fase' => '', 'data' => '', 'hora' => '', 'local' => '', 'logoTorneio' => '',
            'clima' => '', 'climaIcone' => '☀️'
        ),
        'estilo' => array(
            'tema' => 'laliga', 'fonte' => 'arial',
            'nomesExpandidos' => 'false', 'notifAnimacao' => 'esquerda',
            'mostrarStatus' => 'false',
            'feat_gol' => 'true', 'feat_faltas' => 'true', 'feat_midias' => 'true',
            'feat_substituicoes' => 'true', 'feat_fila' => 'true', 'feat_intervalos' => 'true',
            'cenaCancelar' => ''
        ),
        'penaltes' => array(
            'penaltesAtivos' => 'false',
            'PA1' => 'neutro', 'PA2' => 'neutro', 'PA3' => 'neutro', 'PA4' => 'neutro', 'PA5' => 'neutro',
            'PB1' => 'neutro', 'PB2' => 'neutro', 'PB3' => 'neutro', 'PB4' => 'neutro', 'PB5' => 'neutro'
        ),
        'notif' => array('notifTipo' => '', 'notifTexto' => '', 'notifId' => ''),
        'posicao' => array('placarScale' => '0.65', 'placarX' => '50', 'placarY' => '50'),
        'midia' => array('midias' => '[]', 'midiasAtivas' => '[]', 'midiaTransicao' => 'fade'),
        'basquete' => array('shotClock' => '24', 'shotRodando' => 'false', 'faltasA' => '0', 'faltasB' => '0', 'posse' => 'A', 'bonusA' => 'false', 'bonusB' => 'false', 'timeoutsA' => '3', 'timeoutsB' => '3'),
        'torneio' => array('competicao' => '', 'categoria' => '', 'grupo' => '', 'fase' => '', 'data' => '', 'hora' => '', 'local' => '', 'spText' => 'PATROCINADORES', 'sponsorsAtivo' => 'false', 'sponsorsIntervalo' => '120', 'sponsorsDuracao' => '8', 'sp1' => '', 'sp2' => '', 'sp3' => ''),
        'tabela' => array(
            'tabelaAtivo' => 'false', 'tabelaCena' => 'table', 'tabelaTema' => 'laliga',
            'tabelaDuracao' => '8', 'tabelaA' => 'auto', 'tabelaB' => 'auto',
            'tabelaDestaque' => 'auto', 'tabelaEscalacao' => 'auto',
            'tabelaTitulo' => '', 'tabelaSub' => '',
            'tabelaZonas' => 'true', 'tabelaZonaUp' => '1', 'tabelaZonaDn' => '14',
            'tabelaZonaCorUp' => '#22c55e', 'tabelaZonaCorDn' => '#ef4444',
            'tabelaLocal' => '', 'tabelaHora' => '', 'tabelaLogo' => '', 'previewZoom' => '100',
            'tabelaEscudos' => 'true',
            'tabelaEscalacoes' => '{}',
            'tabelaModo' => 'auto', 'tabelaCenas' => '[]', 'tabelaTimes' => '[]'
        ),
        'estadoVersao' => 1
    );
}

function deep_merge($base, $overlay) {
    foreach ($overlay as $key => $value) {
        if (is_array($value) && isset($base[$key]) && is_array($base[$key])) {
            $base[$key] = deep_merge($base[$key], $value);
        } else {
            $base[$key] = $value;
        }
    }
    return $base;
}

// mapa flat -> secao (espelha o MS do js/comum.js)
function get_post_data() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!$data) {
        return array();
    }
    return $data;
}

function respond($data) {
    $json = json_encode($data);
    if ($json === false) {
        $json = json_encode(array('erro' => 'json_encode failed', 'raw' => print_r($data, true)));
    }
    echo $json;
    if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();
    exit;
}

function respond_error($msg, $code = 400) {
    $texts = array(400 => 'Bad Request', 404 => 'Not Found', 405 => 'Method Not Allowed', 500 => 'Internal Server Error');
    $text = isset($texts[$code]) ? $texts[$code] : 'Error';
    header('HTTP/1.1 ' . $code . ' ' . $text);
    respond(array('erro' => $msg));
}

function save_data_uri($dataUri, $filepath) {
    // data:image/png;base64,iVBOR...
    if (strpos($dataUri, 'data:') !== 0) {
        // assume it's raw base64
        $bin = base64_decode($dataUri);
    } else {
        $comma = strpos($dataUri, ',');
        if ($comma === false) {
            return false;
        }
        $b64 = substr($dataUri, $comma + 1);
        $bin = base64_decode($b64);
    }
    if ($bin === false) {
        return false;
    }
    return file_put_contents($filepath, $bin, LOCK_EX);
}

function list_escudo_files() {
    $files = array();
    if (!is_dir(ESCUDOS_DIR)) return $files;
    $dh = opendir(ESCUDOS_DIR);
    if (!$dh) return $files;
    while (($entry = readdir($dh)) !== false) {
        if ($entry === '.' || $entry === '..') continue;
        $ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
        if ($ext !== 'png') continue;
        $name = pathinfo($entry, PATHINFO_FILENAME);
        // Skip timeA.png and timeB.png
        if ($name === 'timeA' || $name === 'timeB') continue;
        $files[] = $name;
    }
    closedir($dh);
    sort($files);
    return $files;
}

// ---------- routing ----------

$method = $_SERVER['REQUEST_METHOD'];
$acao = isset($_GET['acao']) ? $_GET['acao'] : '';

// ---------- GET ----------

if ($method === 'GET') {

    if ($acao === 'listar_presets') {
        $presets = array();
        $pdir = presets_dir();
        presets_migrar_raiz($pdir);
        if (is_dir($pdir)) {
            $dh = opendir($pdir);
            if ($dh) {
                while (($entry = readdir($dh)) !== false) {
                    if ($entry === '.' || $entry === '..') continue;
                    if (strtolower(pathinfo($entry, PATHINFO_EXTENSION)) !== 'json') continue;
                    $name = pathinfo($entry, PATHINFO_FILENAME);
                    $raw = file_get_contents($pdir . '/' . $entry);
                    $data = json_decode($raw, true);
                    if ($data) {
                        $item = array(
                            'nome' => $name,
                            'timeA' => isset($data['timeA']) ? $data['timeA'] : '',
                            'timeB' => isset($data['timeB']) ? $data['timeB'] : '',
                            'siglaA' => isset($data['siglaA']) ? $data['siglaA'] : '',
                            'siglaB' => isset($data['siglaB']) ? $data['siglaB'] : '',
                            'escudoA' => isset($data['escudoA']) ? $data['escudoA'] : '',
                            'escudoB' => isset($data['escudoB']) ? $data['escudoB'] : '',
                            'timeACor' => isset($data['timeACor']) ? $data['timeACor'] : '',
                            'timeBCor' => isset($data['timeBCor']) ? $data['timeBCor'] : '',
                            'competicao' => isset($data['competicao']) ? $data['competicao'] : '',
                            'categoria' => isset($data['categoria']) ? $data['categoria'] : '',
                            'grupo' => isset($data['grupo']) ? $data['grupo'] : '',
                            'fase' => isset($data['fase']) ? $data['fase'] : '',
                            'data' => isset($data['data']) ? $data['data'] : '',
                            'hora' => isset($data['hora']) ? $data['hora'] : '',
                            'local' => isset($data['local']) ? $data['local'] : '',
                            'logoTorneio' => isset($data['logoTorneio']) ? $data['logoTorneio'] : ''
                        );
                        // Apply filter if requested
                        $filtro = isset($_GET['filtro']) ? $_GET['filtro'] : '';
                        $match = true;
                        // Filtro por campos especificos + busca textual
                        $filtroComp = isset($_GET['competicao']) ? $_GET['competicao'] : '';
                        $filtroCat  = isset($_GET['categoria']) ? $_GET['categoria'] : '';
                        $filtroGrupo = isset($_GET['grupo']) ? $_GET['grupo'] : '';
                        $filtroFase = isset($_GET['fase']) ? $_GET['fase'] : '';
                        $filtroData = isset($_GET['data']) ? $_GET['data'] : '';
                        $filtroHora = isset($_GET['hora']) ? $_GET['hora'] : '';
                        $filtroLocal = isset($_GET['local']) ? $_GET['local'] : '';
                        $busca      = isset($_GET['busca']) ? $_GET['busca'] : '';
                        $match = true;
                        if ($filtroComp && stripos($item['competicao'], $filtroComp) === false) $match = false;
                        if ($filtroCat  && stripos($item['categoria'], $filtroCat)   === false) $match = false;
                        if ($filtroGrupo && stripos($item['grupo'], $filtroGrupo)     === false) $match = false;
                        if ($filtroFase && stripos($item['fase'], $filtroFase)        === false) $match = false;
                        if ($filtroData && stripos($item['data'], $filtroData)        === false) $match = false;
                        if ($filtroHora && stripos($item['hora'], $filtroHora)        === false) $match = false;
                        if ($filtroLocal) {
                            // Remove caracteres especiais (aspas, acentos) para comparacao
                            $localLimpo = preg_replace('/[^a-zA-Z0-9 ]/', '', $item['local']);
                            $filtroLimpo = preg_replace('/[^a-zA-Z0-9 ]/', '', $filtroLocal);
                            if (stripos($localLimpo, $filtroLimpo) === false) $match = false;
                        }
                        if ($busca) {
                            $tudo = $item['competicao'] . ' ' . $item['categoria'] . ' ' . $item['grupo'] . ' ' . $item['fase'] . ' ' . $item['timeA'] . ' ' . $item['timeB'] . ' ' . $item['nome'];
                            if (stripos($tudo, $busca) === false) $match = false;
                        }
                        if ($match) {
                            $presets[] = $item;
                        }
                    }
                }
                closedir($dh);
            }
        }
        // Ordenar por data+hora (mais recente primeiro, sem data vai pro fim)
        usort($presets, function($a, $b) {
            $da = !empty($a['data']) ? $a['data'] . ' ' . (isset($a['hora']) ? $a['hora'] : '00:00') : '9999';
            $db = !empty($b['data']) ? $b['data'] . ' ' . (isset($b['hora']) ? $b['hora'] : '00:00') : '9999';
            return strcmp($da, $db);
        });
        respond(array('presets' => $presets));
    }

    if ($acao === 'proxy_imagem') {
        // Proxy de imagem: baixa imagem externa e retorna com CORS permitido
        // Uso: api.php?acao=proxy_imagem&url=URL_CODIFICADA
        $url = isset($_GET['url']) ? $_GET['url'] : '';
        if (!$url) { respond_error('Parametro url obrigatorio.'); }
        // Seguranca: so permite URLs http/https
        if (!preg_match('#^https?://#i', $url)) {
            respond_error('URL invalida.');
        }
        // SSRF: rejeita IPs privados / loopback / reservados
        $host = parse_url($url, PHP_URL_HOST);
        if (!$host) { respond_error('URL invalida.'); }
        $ip = @gethostbyname($host);
        if ($ip === $host && !filter_var($ip, FILTER_VALIDATE_IP)) {
            respond_error('Host nao resolvivel.');
        }
        if (filter_var($ip, FILTER_VALIDATE_IP) === false ||
            filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            respond_error('Host nao permitido.');
        }
        // Timeout e limite de tamanho (~2MB)
        $ctx = stream_context_create(array(
            'http' => array('timeout' => 5, 'follow_location' => 1, 'max_redirects' => 3, 'ignore_errors' => true),
            'https' => array('timeout' => 5)
        ));
        $imgData = @file_get_contents($url, false, $ctx, 0, 2000000);
        if ($imgData === false) {
            // Retorna 1x1 pixel transparente como fallback
            header('Content-Type: image/png');
            header('Access-Control-Allow-Origin: *');
            echo base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
            exit;
        }
        // Detecta tipo
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->buffer($imgData);
        header('Content-Type: ' . $mime);
        header('Access-Control-Allow-Origin: *');
        header('Cache-Control: public, max-age=86400');
        echo $imgData;
        exit;
    }

    if ($acao === 'listar_filtros') {
        // Retorna valores unicos de competicao, categoria e fase para os dropdowns
        $comps = array(); $cats = array(); $grupos = array(); $fases = array(); $datas = array(); $horas = array(); $locais = array();
        $pdir = presets_dir();
        presets_migrar_raiz($pdir);
        if (is_dir($pdir)) {
            $dh = opendir($pdir);
            if ($dh) {
                while (($entry = readdir($dh)) !== false) {
                    if ($entry === '.' || $entry === '..') continue;
                    if (strtolower(pathinfo($entry, PATHINFO_EXTENSION)) !== 'json') continue;
                    $raw = file_get_contents($pdir . '/' . $entry);
                    $data = json_decode($raw, true);
                    if ($data) {
                        if (!empty($data['competicao']) && !in_array($data['competicao'], $comps)) $comps[] = $data['competicao'];
                        if (!empty($data['categoria'])   && !in_array($data['categoria'], $cats))   $cats[] = $data['categoria'];
                        if (!empty($data['grupo'])       && !in_array($data['grupo'], $grupos))     $grupos[] = $data['grupo'];
                        if (!empty($data['fase'])        && !in_array($data['fase'], $fases))       $fases[] = $data['fase'];
                        if (!empty($data['data'])        && !in_array($data['data'], $datas))       $datas[] = $data['data'];
                        if (!empty($data['hora'])        && !in_array($data['hora'], $horas))       $horas[] = $data['hora'];
                        if (!empty($data['local'])       && !in_array($data['local'], $locais))     $locais[] = $data['local'];
                    }
                }
                closedir($dh);
            }
        }
        sort($comps); sort($cats); sort($grupos); sort($fases); sort($datas); sort($horas); sort($locais);
        respond(array('competicao' => $comps, 'categoria' => $cats, 'grupo' => $grupos, 'fase' => $fases, 'data' => $datas, 'hora' => $horas, 'local' => $locais));
    }

    if ($acao === 'listar_logos') {
        $logos = array();
        $dir = 'torneios';
        if (is_dir($dir)) {
            $dh = opendir($dir);
            if ($dh) {
                while (($f = readdir($dh)) !== false) {
                    if ($f === '.' || $f === '..') continue;
                    $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
                    if (in_array($ext, array('png','jpg','jpeg','svg','webp','gif'))) {
                        $logos[] = $f;
                    }
                }
                closedir($dh);
            }
        }
        sort($logos);
        respond(array('logos' => $logos));
    }

    if ($acao === 'listar_escudos') {
        respond(array('escudos' => list_escudo_files()));
    }

    if ($acao === 'listar_csvs') {
        $tipo = isset($_GET['tipo']) ? $_GET['tipo'] : 'tabela';
        $tipo = ($tipo === 'jogadores') ? 'jogadores' : 'tabela';
        $dir = CSVS_DIR . '/' . $tipo;
        $files = array();
        if (is_dir($dir)) {
            $dh = opendir($dir);
            if ($dh) {
                while (($f = readdir($dh)) !== false) {
                    if ($f === '.' || $f === '..') continue;
                    if (strtolower(pathinfo($f, PATHINFO_EXTENSION)) !== 'csv') continue;
                    $files[] = pathinfo($f, PATHINFO_FILENAME);
                }
                closedir($dh);
            }
        }
        sort($files);
        respond(array('csvs' => $files));
    }

    if ($acao === 'salvar_csv') {
        $input = get_post_data();
        $nome = isset($input['nome']) ? trim($input['nome']) : '';
        $conteudo = isset($input['conteudo']) ? $input['conteudo'] : '';
        $tipo = isset($input['tipo']) ? $input['tipo'] : 'tabela';
        $tipo = ($tipo === 'jogadores') ? 'jogadores' : 'tabela';
        if ($nome === '') { respond_error('Parametro "nome" obrigatorio.'); }
        $base = preg_replace('/[^A-Za-z0-9_\- ]/', '_', $nome);
        if ($base === '' || $base === '.' || $base === '..') { $base = 'csv_' . time(); }
        $dir = CSVS_DIR . '/' . $tipo;
        if (!is_dir($dir)) { mkdir($dir, 0755, true); }
        if (@file_put_contents($dir . '/' . $base . '.csv', $conteudo, LOCK_EX) === false) {
            respond_error('Nao conseguiu gravar o CSV.');
        }
        respond(array('ok' => true, 'arquivo' => $base . '.csv'));
    }

    if ($acao === 'carregar_csv') {
        $input = get_post_data();
        $nome = isset($input['nome']) ? trim($input['nome']) : '';
        $tipo = isset($input['tipo']) ? $input['tipo'] : 'tabela';
        $tipo = ($tipo === 'jogadores') ? 'jogadores' : 'tabela';
        $base = preg_replace('/[^A-Za-z0-9_\- ]/', '_', $nome);
        $path = CSVS_DIR . '/' . $tipo . '/' . $base . '.csv';
        if (!is_file($path)) { respond_error('CSV nao encontrado.'); }
        respond(array('ok' => true, 'conteudo' => file_get_contents($path)));
    }

    if ($acao === 'remover_csv') {
        $input = get_post_data();
        $nome = isset($input['nome']) ? trim($input['nome']) : '';
        $tipo = isset($input['tipo']) ? $input['tipo'] : 'tabela';
        $tipo = ($tipo === 'jogadores') ? 'jogadores' : 'tabela';
        $base = preg_replace('/[^A-Za-z0-9_\- ]/', '_', $nome);
        $path = CSVS_DIR . '/' . $tipo . '/' . $base . '.csv';
        if (is_file($path)) { @unlink($path); }
        respond(array('ok' => true));
    }

    if ($acao === 'listar_instancias') {
        respond(array('instancias' => load_instancias()));
    }

    if ($acao === 'listar_cores') {
        respond(array('cores' => load_cores()));
    }

    if ($acao === 'listar_grupos') {
        $tipo = isset($_GET['tipo']) ? $_GET['tipo'] : '';
        $g = load_grupos();
        if ($tipo !== '') { respond(array('grupos' => isset($g[$tipo]) ? $g[$tipo] : array(), 'tipo' => $tipo)); }
        respond(array('grupos' => $g));
    }

    if ($acao === 'salvar_grupo') {
        $input = get_post_data();
        $tipo = isset($input['tipo']) ? $input['tipo'] : '';
        $nome = isset($input['nome']) ? trim($input['nome']) : '';
        if ($tipo === '' || $nome === '') { respond_error('Parametros "tipo" e "nome" obrigatorios.'); }
        $g = load_grupos();
        if (!isset($g[$tipo])) { $g[$tipo] = array(); }
        if (isset($g[$tipo][$nome])) { respond_error('Grupo "' . $nome . '" ja existe.'); }
        $g[$tipo][$nome] = array();
        save_grupos($g);
        respond(array('ok' => true));
    }

    if ($acao === 'carregar_preset') {
        $nome = isset($_GET['nome']) ? $_GET['nome'] : '';
        if (!$nome) {
            respond_error('Parametro "nome" obrigatorio.');
        }
        // Security: prevent path traversal
        if (strpos($nome, '/') !== false || strpos($nome, '\\') !== false || $nome === '.' || $nome === '..') {
            respond_error('Nome invalido.');
        }
        $path = presets_dir() . '/' . $nome . '.json';
        if (!file_exists($path)) {
            respond_error('Preset nao encontrado.', 404);
        }
        $raw = file_get_contents($path);
        $data = json_decode($raw, true);
        if (!$data) {
            respond_error('Preset corrompido.', 500);
        }
        respond($data);
    }

    // Default GET: return estado.json with polling optimization
    $clientVersion = isset($_GET['v']) ? intval($_GET['v']) : 0;
    $estado = load_estado();
    $serverVersion = intval($estado['estadoVersao']);
    $nowMs = round(microtime(true) * 1000);

    if ($clientVersion > 0 && $clientVersion === $serverVersion) {
        respond(array('_same' => true, 'v' => $serverVersion, '_ts' => $nowMs));
    }
    $estado['_ts'] = $nowMs;
    respond($estado);
}

// ---------- POST ----------

if ($method === 'POST') {
    mutate_begin();

    if ($acao === 'criar_instancia') {
        $input = get_post_data();
        $id = isset($input['id']) ? trim($input['id']) : '';
        if (!preg_match('/^[A-Za-z0-9_\- ]+$/', $id)) { respond_error('Parametro "id" invalido (letras, numeros, espaco, _ e -).'); }
        $nome = isset($input['nome']) ? $input['nome'] : '';
        if ($id === '' || $id === '.' || $id === '..') {
            respond_error('Parametro "id" obrigatorio (letras, numeros, espaco, _ e -).');
        }
        $instancias = load_instancias();
        foreach ($instancias as $it) {
            if (isset($it['id']) && $it['id'] === $id) {
                respond_error('Ja existe uma instancia com este id.');
            }
        }
        $instancias[] = array('id' => $id, 'nome' => $nome);
        save_instancias($instancias);
        $seed = default_estado();
        save_estado_for($id, $seed);
        respond(array('ok' => true, 'id' => $id, 'url' => 'placar.php?i=' . $id));
    }

    if ($acao === 'salvar_cor') {
        $input = get_post_data();
        $nome = isset($input['nome']) ? trim($input['nome']) : '';
        $hex = isset($input['hex']) ? trim($input['hex']) : '';
        if ($nome === '') { respond_error('Parametro "nome" obrigatorio.'); }
        if (!preg_match('/^#[0-9a-fA-F]{6}$/', $hex)) { respond_error('Cor invalida (use #RRGGBB).'); }
        $cores = load_cores();
        $achou = false;
        foreach ($cores as $i => $c) {
            if (isset($c['nome']) && $c['nome'] === $nome) { $cores[$i]['hex'] = $hex; $achou = true; break; }
        }
        if (!$achou) { $cores[] = array('nome' => $nome, 'hex' => $hex); }
        save_cores($cores);
        respond(array('ok' => true));
    }

    if ($acao === 'remover_cor') {
        $input = get_post_data();
        $nome = isset($input['nome']) ? trim($input['nome']) : '';
        $cores = load_cores();
        $novas = array();
        foreach ($cores as $c) {
            if (isset($c['nome']) && $c['nome'] === $nome) continue;
            $novas[] = $c;
        }
        save_cores($novas);
        respond(array('ok' => true));
    }

    if ($acao === 'remover_instancia') {
        $input = get_post_data();
        $id = isset($input['id']) ? $input['id'] : '';
        if (!preg_match('/^[A-Za-z0-9_\- ]+$/', $id)) { respond_error('Parametro "id" invalido (letras, numeros, espaco, _ e -).'); }
        if ($id === '' || $id === '.' || $id === '..') {
            respond_error('Parametro "id" obrigatorio.');
        }
        $instancias = load_instancias();
        $novas = array();
        foreach ($instancias as $it) {
            if (isset($it['id']) && $it['id'] === $id) { continue; }
            $novas[] = $it;
        }
        save_instancias($novas);
        foreach (array('estado-' . $id . '.json', 'estado-' . $id . '.json.bak', 'estado-' . $id . '.lock') as $f) {
            $p = BASE_DIR . '/' . $f;
            if (file_exists($p)) { @unlink($p); }
        }
        respond(array('ok' => true));
    }

    if ($acao === 'renomear_instancia') {
        $input = get_post_data();
        $id = isset($input['id']) ? $input['id'] : '';
        if (!preg_match('/^[A-Za-z0-9_\- ]+$/', $id)) { respond_error('Parametro "id" invalido (letras, numeros, espaco, _ e -).'); }
        $nome = isset($input['nome']) ? $input['nome'] : '';
        if ($id === '' || $id === '.' || $id === '..') {
            respond_error('Parametro "id" obrigatorio.');
        }
        $instancias = load_instancias();
        $achou = false;
        foreach ($instancias as $k => $it) {
            if (isset($it['id']) && $it['id'] === $id) {
                $instancias[$k]['nome'] = $nome;
                $achou = true;
                break;
            }
        }
        save_instancias($instancias);
        respond(array('ok' => true, 'achou' => $achou));
    }

    if ($acao === 'salvar_preset') {
        $input = get_post_data();
        $nome = isset($input['nome']) ? $input['nome'] : '';
        $dados = isset($input['dados']) ? $input['dados'] : array();

        if (!$nome) {
            respond_error('Parametro "nome" obrigatorio.');
        }
        if (strpos($nome, '/') !== false || strpos($nome, '\\') !== false || $nome === '.' || $nome === '..') {
            respond_error('Nome invalido.');
        }

        $pdir = presets_dir();
        if (!is_dir($pdir)) {
            mkdir($pdir, 0755, true);
        }

        $path = $pdir . '/' . $nome . '.json';
        $json = json_encode($dados);
        file_put_contents($path, $json, LOCK_EX);

        respond(array('ok' => true, 'nome' => $nome));
    }

    if ($acao === 'remover_preset') {
        $input = get_post_data();
        $nome = isset($input['nome']) ? $input['nome'] : '';

        if (!$nome) {
            respond_error('Parametro "nome" obrigatorio.');
        }
        if (strpos($nome, '/') !== false || strpos($nome, '\\') !== false || $nome === '.' || $nome === '..') {
            respond_error('Nome invalido.');
        }

        $path = presets_dir() . '/' . $nome . '.json';
        if (file_exists($path)) {
            unlink($path);
        }
        respond(array('ok' => true));
    }

    if ($acao === 'upload_escudos_batch') {
        $input = get_post_data();
        $arquivos = isset($input['arquivos']) ? $input['arquivos'] : array();

        if (!is_array($arquivos) || empty($arquivos)) {
            respond_error('Parametro "arquivos" deve ser um array nao vazio.');
        }

        if (!is_dir(ESCUDOS_DIR)) {
            mkdir(ESCUDOS_DIR, 0755, true);
        }

        $results = array();
        foreach ($arquivos as $arq) {
            $nome = isset($arq['nome']) ? $arq['nome'] : '';
            $src = isset($arq['src']) ? $arq['src'] : '';

            if (!$nome || !$src) {
                $results[] = array('nome' => $nome, 'ok' => false, 'erro' => 'nome e src obrigatorios');
                continue;
            }
            if (strpos($nome, '/') !== false || strpos($nome, '\\') !== false || $nome === '.' || $nome === '..') {
                $results[] = array('nome' => $nome, 'ok' => false, 'erro' => 'Nome invalido');
                continue;
            }

            $path = ESCUDOS_DIR . '/' . $nome . '.png';
            $result = save_data_uri($src, $path);
            $results[] = array(
                'nome' => $nome,
                'ok' => ($result !== false),
                'erro' => ($result !== false) ? null : 'Falha ao salvar'
            );
        }

        $ok_count = 0;
        foreach ($results as $r) { if ($r['ok']) $ok_count++; }
        respond(array('ok' => true, 'count' => $ok_count, 'resultados' => $results));
    }

    if ($acao === 'atribuir_escudo') {
        $input = get_post_data();
        $nome = isset($input['nome']) ? $input['nome'] : '';
        $time = isset($input['time']) ? $input['time'] : '';

        if (!$nome) {
            respond_error('Parametro "nome" obrigatorio.');
        }
        if (!$time) {
            respond_error('Parametro "time" obrigatorio.');
        }
        if ($time !== 'A' && $time !== 'B' && $time !== 'timeA' && $time !== 'timeB') {
            respond_error('Parametro "time" deve ser "A" ou "B".');
        }
        $time_short = ($time === 'timeA' || $time === 'A') ? 'A' : 'B';

        $src = 'escudos/' . $nome . '.png?v=' . time();

        $estado = load_estado();
        $field = ($time_short === 'A') ? 'escudoA' : 'escudoB';
        $estado['times'][$field] = $src;
        $estado['estadoVersao'] = intval($estado['estadoVersao']) + 1;
        save_estado($estado);

        respond(array('ok' => true, 'src' => $src));
    }

    if ($acao === 'remover_escudos') {
        $input = get_post_data();
        $nomes = isset($input['nomes']) ? $input['nomes'] : array();

        if (!is_array($nomes)) {
            respond_error('Parametro "nomes" deve ser um array.');
        }

        $results = array();
        foreach ($nomes as $nome) {
            if ($nome === 'timeA' || $nome === 'timeB') {
                $results[] = array('nome' => $nome, 'ok' => false, 'erro' => 'Protegido: nao pode remover timeA/timeB');
                continue;
            }
            if (strpos($nome, '/') !== false || strpos($nome, '\\') !== false || $nome === '.' || $nome === '..') {
                $results[] = array('nome' => $nome, 'ok' => false, 'erro' => 'Nome invalido');
                continue;
            }

            $path = ESCUDOS_DIR . '/' . $nome . '.png';
            if (file_exists($path)) {
                unlink($path);
                $results[] = array('nome' => $nome, 'ok' => true);
            } else {
                $results[] = array('nome' => $nome, 'ok' => false, 'erro' => 'Arquivo nao encontrado');
            }
        }

        $ok_count = 0;
        foreach ($results as $r) { if ($r['ok']) $ok_count++; }
        respond(array('ok' => true, 'removidos' => $ok_count, 'resultados' => $results));
    }

    if ($acao === 'upload_midia') {
        $input = get_post_data();
        $id = isset($input['id']) ? $input['id'] : '';
        $src = isset($input['src']) ? $input['src'] : '';
        $tipo = isset($input['tipo']) ? $input['tipo'] : '';
        $nome = isset($input['nome']) ? $input['nome'] : '';
        $transicao = isset($input['transicao']) ? $input['transicao'] : 'fade';
        $duracao = isset($input['duracao']) ? $input['duracao'] : '';
        $intervalo = isset($input['intervalo']) ? $input['intervalo'] : '';

        if (!$id) {
            respond_error('Parametro "id" obrigatorio.');
        }
        if (!$src && $tipo !== 'texto') {
            respond_error('Parametro "src" obrigatorio.');
        }
        if (strpos($id, '/') !== false || strpos($id, '\\') !== false || $id === '.' || $id === '..') {
            respond_error('ID invalido.');
        }

        if (!is_dir(MIDIAS_DIR)) {
            mkdir(MIDIAS_DIR, 0755, true);
        }

        // Determine extension from tipo and data URL
        $ext = 'png';
        if ($tipo === 'video') {
            $ext = 'mp4';
        } elseif ($tipo === 'imagem' || $tipo === 'gif') {
            if (strpos($src, 'data:image/gif') === 0) {
                $ext = 'gif';
            } elseif (strpos($src, 'data:image/webp') === 0) {
                $ext = 'webp';
            } elseif (strpos($src, 'data:image/svg') === 0) {
                $ext = 'svg';
            } elseif (strpos($src, 'data:image/jpeg') === 0 || strpos($src, 'data:image/jpg') === 0) {
                $ext = 'jpg';
            } else {
                $ext = 'png';
            }
        } else if ($tipo === 'texto') {
            $ext = '';   // notificacao em texto: fica so no estado
        } else {
            $ext = 'bin';
        }
        if ($tipo === 'texto') {
            $ext = '';
            $result = true;          // texto nao gera arquivo
        } else {
            $filepath = MIDIAS_DIR . '/' . $id . '.' . $ext;
            $result = save_data_uri($src, $filepath);
            if ($result === false) {
                respond_error('Falha ao salvar midia.', 500);
            }
        }

        // Read existing midias list from estado
        $estado = load_estado();
        $midiasList = json_decode($estado['midia']['midias'], true);
        if (!is_array($midiasList)) {
            $midiasList = array();
        }

        // Check if id already exists, update or add
        $found = false;
        foreach ($midiasList as &$m) {
            if (isset($m['id']) && $m['id'] === $id) {
                $m['tipo'] = $tipo;
                $m['nome'] = $nome;
                $m['transicao'] = $transicao;
                $m['duracao'] = $duracao;
                $m['intervalo'] = $intervalo;
                $m['src'] = ($tipo === 'texto') ? '' : ('midias/' . $id . '.' . $ext);
                if ($tipo === 'texto') {
                    $m['texto'] = isset($input['texto']) ? $input['texto'] : '';
                    $m['notif'] = isset($input['notif']) ? $input['notif'] : '';
                }
                $found = true;
                break;
            }
        }
        unset($m);

        if (!$found) {
            $midiasList[] = array(
                'id' => $id,
                'tipo' => $tipo,
                'nome' => $nome,
                'transicao' => $transicao,
                'duracao' => $duracao,
                'intervalo' => $intervalo,
                'src' => ($tipo === 'texto') ? '' : ('midias/' . $id . '.' . $ext)
            );
            if ($tipo === 'texto') {
                $ultimo = count($midiasList) - 1;
                $midiasList[$ultimo]['texto'] = isset($input['texto']) ? $input['texto'] : '';
                $midiasList[$ultimo]['notif'] = isset($input['notif']) ? $input['notif'] : '';
            }
        }

        $estado['midia']['midias'] = json_encode($midiasList);
        $estado['estadoVersao'] = intval($estado['estadoVersao']) + 1;
        save_estado($estado);

        respond(array('ok' => true, 'id' => $id));
    }

    if ($acao === 'remover_midia') {
        $input = get_post_data();
        $id = isset($input['id']) ? $input['id'] : '';

        if (!$id) {
            respond_error('Parametro "id" obrigatorio.');
        }
        if (strpos($id, '/') !== false || strpos($id, '\\') !== false || $id === '.' || $id === '..') {
            respond_error('ID invalido.');
        }

        // Remove file(s) - try both extensions
        foreach (array('mp4', 'png', 'gif', 'jpg', 'jpeg', 'webm', 'bin') as $ext) {
            $path = MIDIAS_DIR . '/' . $id . '.' . $ext;
            if (file_exists($path)) {
                unlink($path);
            }
        }

        // Remove from estado midias list
        $estado = load_estado();
        $midiasList = json_decode($estado['midia']['midias'], true);
        if (is_array($midiasList)) {
            $newList = array();
            foreach ($midiasList as $m) {
                if (isset($m['id']) && $m['id'] !== $id) {
                    $newList[] = $m;
                }
            }
            $estado['midia']['midias'] = json_encode($newList);
        }
        // Also remove from midiasAtivas
        $midiasAtivas = json_decode($estado['midia']['midiasAtivas'], true);
        if (is_array($midiasAtivas)) {
            $newAtivas = array();
            foreach ($midiasAtivas as $ma) {
                if ($ma !== $id) {
                    $newAtivas[] = $ma;
                }
            }
            $estado['midia']['midiasAtivas'] = json_encode($newAtivas);
        }

        $estado['estadoVersao'] = intval($estado['estadoVersao']) + 1;
        save_estado($estado);

        respond(array('ok' => true));
    }

    if ($acao === 'editar_midia') {
        $input = get_post_data();
        $id = isset($input['id']) ? $input['id'] : '';
        $duracao = isset($input['duracao']) ? $input['duracao'] : null;
        $intervalo = isset($input['intervalo']) ? $input['intervalo'] : null;
        $transicao = isset($input['transicao']) ? $input['transicao'] : null;

        if (!$id) {
            respond_error('Parametro "id" obrigatorio.');
        }

        $estado = load_estado();
        $midiasList = json_decode($estado['midia']['midias'], true);
        if (!is_array($midiasList)) {
            respond_error('Lista de midias vazia.', 404);
        }

        $found = false;
        foreach ($midiasList as &$m) {
            if (isset($m['id']) && $m['id'] === $id) {
                if ($duracao !== null) $m['duracao'] = $duracao;
                if ($intervalo !== null) $m['intervalo'] = $intervalo;
                if ($transicao !== null) $m['transicao'] = $transicao;
                $found = true;
                break;
            }
        }
        unset($m);

        if (!$found) {
            respond_error('Midia nao encontrada.', 404);
        }

        $estado['midia']['midias'] = json_encode($midiasList);
        $estado['estadoVersao'] = intval($estado['estadoVersao']) + 1;
        save_estado($estado);

        respond(array('ok' => true));
    }

    if ($acao === 'upload_logo') {
        $input = get_post_data();
        $nome = isset($input['nome']) ? $input['nome'] : '';
        $src = isset($input['src']) ? $input['src'] : '';
        if (!$src) {
            respond_error('Parametro "src" obrigatorio (base64 data-uri).');
        }
        if (!is_dir(BASE_DIR . '/torneios')) {
            mkdir(BASE_DIR . '/torneios', 0755, true);
        }
        $ext = 'png';
        if (strpos($src, 'data:image/jpeg') === 0 || strpos($src, 'data:image/jpg') === 0) $ext = 'jpg';
        elseif (strpos($src, 'data:image/gif') === 0) $ext = 'gif';
        elseif (strpos($src, 'data:image/webp') === 0) $ext = 'webp';
        elseif (strpos($src, 'data:image/svg') === 0) $ext = 'svg';

        $base = $nome !== '' ? $nome : ('logo_' . time());
        $base = preg_replace('/[^A-Za-z0-9_\-]/', '_', pathinfo($base, PATHINFO_FILENAME));
        if ($base === '' || $base === '.' || $base === '..') $base = 'logo_' . time();
        $arquivo = $base . '.' . $ext;
        if (save_data_uri($src, BASE_DIR . '/torneios/' . $arquivo) === false) {
            respond_error('Falha ao salvar logo.', 500);
        }
        respond(array('ok' => true, 'arquivo' => $arquivo));
    }

    if ($acao === 'upload_fundo') {
        $input = get_post_data();
        $chave = isset($input['chave']) ? $input['chave'] : '';
        $src = isset($input['src']) ? $input['src'] : '';
        if (!$src) {
            respond_error('Parametro "src" obrigatorio (base64 data-uri).');
        }
        if (!is_dir(FUNDOS_DIR)) {
            mkdir(FUNDOS_DIR, 0755, true);
        }
        $ext = 'png';
        if (strpos($src, 'data:image/jpeg') === 0 || strpos($src, 'data:image/jpg') === 0) $ext = 'jpg';
        elseif (strpos($src, 'data:image/gif') === 0) $ext = 'gif';
        elseif (strpos($src, 'data:image/webp') === 0) $ext = 'webp';
        elseif (strpos($src, 'data:image/svg') === 0) $ext = 'svg';
        $base = $chave !== '' ? $chave : ('fundo_' . time());
        $base = preg_replace('/[^A-Za-z0-9_\-]/', '_', $base);
        if ($base === '' || $base === '.' || $base === '..') $base = 'fundo_' . time();
        $arquivo = $base . '.' . $ext;
        if (save_data_uri($src, FUNDOS_DIR . '/' . $arquivo) === false) {
            respond_error('Falha ao salvar fundo.', 500);
        }
        respond(array('ok' => true, 'arquivo' => 'fundos/' . $arquivo));
    }

    if ($acao === 'remover_logo') {
        $input = get_post_data();
        $nome = isset($input['nome']) ? trim($input['nome']) : '';
        if ($nome === '' || strpos($nome, '/') !== false || strpos($nome, '\\') !== false || $nome === '.' || $nome === '..') {
            respond_error('Nome invalido.');
        }
        $path = BASE_DIR . '/torneios/' . $nome;
        if (file_exists($path)) { @unlink($path); }
        respond(array('ok' => true));
    }

    if ($acao === 'importar_escudos') {
        $input = get_post_data();
        $itens = isset($input['itens']) ? $input['itens'] : array();
        if (!is_array($itens) || !count($itens)) {
            respond_error('Envie {itens:[{nome,src}]}.');
        }
        if (!is_dir(ESCUDOS_DIR)) {
            mkdir(ESCUDOS_DIR, 0755, true);
        }
        $salvos = array();
        foreach ($itens as $it) {
            $nome = isset($it['nome']) ? $it['nome'] : '';
            $src = isset($it['src']) ? $it['src'] : '';
            if (!$src) continue;
            $base = preg_replace('/[^A-Za-z0-9_\-]/', '_', $nome);
            if ($base === '' || $base === '.' || $base === '..') $base = 'escudo_' . time();
            $ext = 'png';
            if (strpos($src, 'data:image/jpeg') === 0 || strpos($src, 'data:image/jpg') === 0) $ext = 'jpg';
            elseif (strpos($src, 'data:image/gif') === 0) $ext = 'gif';
            elseif (strpos($src, 'data:image/webp') === 0) $ext = 'webp';
            $arquivo = $base . '.' . $ext;
            if (save_data_uri($src, ESCUDOS_DIR . '/' . $arquivo) === false) continue;
            $salvos[] = array('nome' => $nome, 'arquivo' => 'escudos/' . $arquivo);
        }
        respond(array('ok' => true, 'salvos' => $salvos));
    }

    if ($acao === 'incrementar') {
        $input = get_post_data();
        $campo = isset($input['campo']) ? $input['campo'] : '';
        $delta = isset($input['delta']) ? intval($input['delta']) : 0;
        $map = array(
            'golsA' => array('placar', 'golsA'),
            'golsB' => array('placar', 'golsB'),
            'faltasA' => array('basquete', 'faltasA'),
            'faltasB' => array('basquete', 'faltasB'),
            'timeoutsA' => array('basquete', 'timeoutsA'),
            'timeoutsB' => array('basquete', 'timeoutsB')
        );
        if (!isset($map[$campo])) {
            respond_error('Campo invalido para incremento.');
        }
        $estado = load_estado();
        $sec = $map[$campo][0];
        $key = $map[$campo][1];
        $atual = isset($estado[$sec][$key]) ? intval($estado[$sec][$key]) : 0;
        $novo = $atual + $delta;
        if ($novo < 0) $novo = 0;
        $estado[$sec][$key] = (string)$novo;
        $estado['estadoVersao'] = intval($estado['estadoVersao']) + 1;
        save_estado($estado);
        respond(array('ok' => true, 'campos' => array($campo => (string)$novo), 'estadoVersao' => $estado['estadoVersao']));
    }

    if ($acao === 'cronometro') {
        $input = get_post_data();
        $op = isset($input['op']) ? $input['op'] : '';
        $valor = isset($input['valor']) ? intval($input['valor']) : 0;
        $estado = load_estado();
        $p = &$estado['placar'];
        $nowMs = round(microtime(true) * 1000);
        switch ($op) {
            case 'start':
                if (!isset($p['tempoInicio'])) $p['tempoInicio'] = '0';
                if ($p['rodando'] !== 'true') { $p['tempoInicio'] = (string)$nowMs; }
                $p['rodando'] = 'true';
                break;
            case 'pause':
                if ($p['rodando'] === 'true') {
                    $inicio = isset($p['tempoInicio']) ? intval($p['tempoInicio']) : 0;
                    $base = isset($p['tempo']) ? intval($p['tempo']) : 0;
                    $elapsed = ($inicio > 0) ? floor(($nowMs - $inicio) / 1000) : 0;
                    if ($elapsed < 0) $elapsed = 0;
                    $p['tempo'] = (string)($base + $elapsed);
                }
                $p['tempoInicio'] = '0';
                $p['rodando'] = 'false';
                break;
            case 'reset':
                $p['tempo'] = '0';
                $p['tempoInicio'] = '0';
                $p['rodando'] = 'false';
                break;
            case 'set':
                $p['tempo'] = (string)$valor;
                $p['tempoInicio'] = '0';
                $p['rodando'] = 'false';
                break;
            default:
                respond_error('Operacao invalida para cronometro.');
        }
        $estado['estadoVersao'] = intval($estado['estadoVersao']) + 1;
        save_estado($estado);
        respond(array(
            'ok' => true,
            'campos' => array('tempo' => $p['tempo'], 'tempoInicio' => $p['tempoInicio'], 'rodando' => $p['rodando']),
            'estadoVersao' => $estado['estadoVersao'],
            '_ts' => $nowMs
        ));
    }

    if ($acao === 'cena_atual') {
        $input = get_post_data();
        $k = isset($input['k']) ? $input['k'] : '';
        $estado = load_estado();
        $estado['tabela']['tabelaCenaAtual'] = $k;
        // nao incrementa estadoVersao: nao deve causar reload nos clientes
        save_estado($estado);
        respond(array('ok' => true));
    }

    // Default POST: merge state (flat or nested) into estado.json
    $input = get_post_data();
    if (empty($input)) {
        respond_error('Corpo da requisicao vazio ou JSON invalido.');
    }

    $estado = load_estado();
    $estado = deep_merge($estado, $input);
    $estado['estadoVersao'] = intval($estado['estadoVersao']) + 1;
    save_estado($estado);

    respond($estado);
}

// Any other method
respond_error('Metodo nao suportado.', 405);
