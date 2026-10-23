# Rodar localmente (para mexer no CSS)

Nada de Apache/XAMPP: o PHP tem servidor embutido. Serve para iterar CSS rápido,
com o DevTools aberto, antes de mandar para o OBS.

## 1. Subir o app

```bash
# Windows (cmd, na pasta do repo)
servir.cmd            # ou: php -S 127.0.0.1:8080 -t .

# Linux/macOS
./servir.sh           # ou: php -S 127.0.0.1:8080 -t .
```

Depois abra:

| URL | o que é |
| --- | --- |
| `http://127.0.0.1:8080/controle.php` | painel (operar ao vivo, patrocinadores, cenas) |
| `http://127.0.0.1:8080/placar.php?dev=1` | overlay — `dev=1` pinta o fundo de escuro para você ver o que é branco/transparente |
| `http://127.0.0.1:8080/placar.php` | overlay como o OBS vê (fundo transparente) |

Só precisa de **PHP 7.4+** (8.x recomendado) no PATH e a pasta `dados/` com
permissão de escrita.

- Windows sem PHP: `winget install PHP.PHP` (ou baixe o zip "Thread Safe" em
  windows.php.net, descompacte e ponha a pasta no PATH).
- macOS: `brew install php`. Debian/Ubuntu: `sudo apt install php-cli`.

## 2. Ciclo de teste do CSS

1. Edite o arquivo (`css/tabela.css`, `css/base.css`, …).
2. No navegador: **Ctrl+Shift+R** (recarrega ignorando o cache) — ou, no DevTools
   (F12) → aba Network → marque **Disable cache** e deixe aberto: aí um F5 normal
   já pega a alteração.
3. Para ver o overlay em 1920×1080 na janela: F12 → ícone de celular → modo
   responsivo → digite **1920 × 1080** → zoom out (Ctrl+-) para caber.

Dica: para ajustar posição de faixa/lower third, altere no DevTools ao vivo
(edite a regra na aba Styles e vá setando `left`/`bottom` com as setas do
teclado) e só depois copie os valores finais para o CSS.

## 3. Onde fica cada coisa

| Arquivo | Cuida de |
| --- | --- |
| `css/tabela.css` | cenas do overlay (tabela, duelo, lower third, escalação…) + **notificação** (`#camadaNotif`) + **patrocinadores** (`#camadaSponsors`) |
| `css/base.css` | estrutura do placar (`#placar`, `.Placar`, timer, notificação antiga) |
| `css/laliga.css` | tema do placar (cores, tipografia) |
| `css/controle.css` | painel no desktop |
| `css/controle-mobile.css` | painel no celular |
| `css/midia-anim.css` | transições de mídia (`#camadaMidia`) |

Ordem de carregamento no `placar.php`: `base.css` → `laliga.css` →
`midia-anim.css` → `tabela.css` (o último vence em empate de especificidade).

## 4. Quando for para o OBS

O cache do browser source é agressivo. Depois de mexer no CSS:

1. No OBS, clique com o botão direito na fonte → **Propriedades** →
   **"Atualizar cache da página atual"** (Refresh cache) → OK.
2. Ou mude o `?v=` no topo do `placar.php` (`$v = 'AAAAAAMMDDx'`), que troca a URL
   de todos os CSS/JS de uma vez.

Ao editar CSS no repo não esqueça: `git add`/`commit`/`push` — o usuário espera
ver a mudança na branch.

## 5. Se algo não aparecer

- **Página em branco no navegador**: `placar.php` é transparente por design — use
  `?dev=1` para ver o fundo.
- **`dados/` sem escrita**: crie/aqueça a permissão (é onde o app grava estado,
  escudos, fundos e mídias).
- **Porta ocupada**: `servir.cmd 8090`.
- **CSS não muda**: é cache — Ctrl+Shift+R (o servidor do PHP não cacheia nada).
