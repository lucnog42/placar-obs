// comum.js — compartilhado entre Placar e Controle
var API='api.php';
var CORES_DEFAULT={timeA:'#ff0000',timeB:'#0000ff'};
var MS={golsA:'placar',golsB:'placar',tempo:'placar',tempoInicio:'placar',rodando:'placar',esporte:'placar',periodo:'placar',
timeA:'times',timeB:'times',siglaA:'times',siglaB:'times',escudoA:'times',escudoB:'times',timeACor:'times',timeBCor:'times',
competicao:'times',categoria:'times',grupo:'times',fase:'times',data:'times',hora:'times',local:'times',logoTorneio:'times',
tema:'estilo',fonte:'estilo',nomesExpandidos:'estilo',notifAnimacao:'estilo',
penaltesAtivos:'penaltes',PA1:'penaltes',PA2:'penaltes',PA3:'penaltes',PA4:'penaltes',PA5:'penaltes',PB1:'penaltes',PB2:'penaltes',PB3:'penaltes',PB4:'penaltes',PB5:'penaltes',
notifTipo:'notif',notifTexto:'notif',notifId:'notif',
placarScale:'posicao',placarX:'posicao',placarY:'posicao',
midias:'midia',midiasAtivas:'midia',midiaAtiva:'midia',midiaTransicao:'midia',
midiaDisparoId:'midia',midiaDisparoSeq:'midia',
mostrarStatus:'estilo',
shotClock:'basquete',shotRodando:'basquete',faltasA:'basquete',faltasB:'basquete',posse:'basquete',bonusA:'basquete',bonusB:'basquete',timeoutsA:'basquete',timeoutsB:'basquete',
tabelaAtivo:'tabela',tabelaCena:'tabela',tabelaTema:'tabela',tabelaDuracao:'tabela',
tabelaA:'tabela',tabelaB:'tabela',tabelaDestaque:'tabela',tabelaEscalacao:'tabela',
tabelaTitulo:'tabela',tabelaSub:'tabela',tabelaZonas:'tabela',tabelaZonaUp:'tabela',
tabelaZonaDn:'tabela',tabelaEscudos:'tabela',tabelaEscalacoes:'tabela',
tabelaLocal:'tabela',tabelaHora:'tabela',tabelaLogo:'tabela',
tabelaZonaCorUp:'tabela',tabelaZonaCorDn:'tabela',previewZoom:'tabela',
tabelaModo:'tabela',tabelaLayout:'tabela',tabelaPlay:'tabela',tabelaCenaAtual:'tabela',tabelaCenas:'tabela',tabelaTimes:'tabela',
clima:'times',climaIcone:'times'};
var FONTES={arial:"'Arial',sans-serif",impact:"'Impact',sans-serif",georgia:"'Georgia',serif",courier:"'Courier New',monospace",trebuchet:"'Trebuchet MS',sans-serif",verdana:"'Verdana',sans-serif"};
function buildFlat(cru){return Object.assign({},cru.placar,cru.times,cru.estilo,cru.penaltes,cru.notif,cru.posicao,cru.midia,cru.basquete,cru.torneio,cru.tabela,{estadoVersao:cru.estadoVersao});}
function paraSecoes(flat){var s={};Object.keys(flat).forEach(function(k){var sec=MS[k];if(sec){if(!s[sec])s[sec]={};s[sec][k]=flat[k];}});return s;}
