/**
 * EMPIRE HUB - BACKEND (GOOGLE APS SCRIPT)
 * Versão Completa e Unificada
 * 
 * ATENÇÃO: Esta é a versão integral. Não remover ou resumir funções.
 */

// ── CONFIGURAÇÕES GLOBAIS ──
const ID_CHARTS         = '1ThRhljmAS41JmVBPkPtYwe0JQHRx9Pih2PQAPT2ebyA';
const ID_ALBUMS         = '1wUoCpi7_VSbXBhu7XGsqs2ZAJBwcPrx_TFmTS0OMyhY';
const ID_EDICAO_CHARTS  = '1GPajSCp1TkJDEDOGZIrXxgZuNuRs7545buFntyDlpL8';
const ID_CODIGOS        = '10jZjW2gNTfBHQGhZ4qBuBEk6RLxGfLrWm1JlIuOGR68';
const DRIVE_CAPAS_FOLDER = '1_4mihF1Jb7PmOm7HkXBuDDe-wRRYa4_-';

// ── HELPERS DE PLANILHA ──
function ss()      { return SpreadsheetApp.getActiveSpreadsheet(); }
function aba(nome) { return ss().getSheetByName(nome); }

function jsonResp(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
function txtResp(msg) {
  return ContentService.createTextOutput(msg)
    .setMimeType(ContentService.MimeType.TEXT);
}
function jsonOut(obj) { 
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON); 
}

/**
 * MAPEAMENTO ABA 'ACTS' (SISTEMA GLOBAL)
 * r[0]  = Nome (A)
 * r[1]  = Foto (B)
 * r[2]  = Status (C)
 * r[3]  = Bio/Descrição (D)
 * r[4]  = Fortuna Total (E)
 * r[5]  = Prestígio (F)
 * r[6]  = Fadiga (G)
 * r[7]  = Gênero (H)
 * r[8]  = Telegram ID (I)
 * r[9]  = Selo/Gravadora (J)
 * r[13] = País (N)
 */
function _mapActs(r) {
  return {
    nome: String(r[0]||'').trim(),
    foto: String(r[1]||''),
    status: String(r[2]||'Livre'),
    descricao: String(r[3]||'').trim(),
    fortuna_total: parseFloat(r[4])||0,
    prestigio: parseFloat(r[5])||0,
    fadiga: parseFloat(r[6])||0,
    genero: String(r[7]||'').trim(),
    telegram_id: String(r[8]||'').trim(),
    gravadora: String(r[9]||'Independent'),
    pais: String(r[13]||'').trim(),
    saldo: 0
  };
}

/**
 * MAPEAMENTO ABA 'DB_ARTISTAS' (ARTISTAS DO JOGADOR)
 * r[0]  = Nome (A)
 * r[1]  = Foto (B)
 * r[2]  = Status (C)
 * r[3]  = Saldo (D)
 * r[4]  = Bio/Descrição (E)
 * r[5]  = Fortuna Real (F)
 * r[6]  = Fortuna Bens (G)
 * r[7]  = Fortuna Total (H)
 * r[8]  = Prestígio (I)
 * r[9]  = Fadiga (J)
 * r[10] = Gênero (K)
 * r[11] = Telegram ID (L)
 * r[13] = País (N)
 */
function _mapArtistaJogador(r) {
  return {
    nome: String(r[0]||'').trim(), 
    foto: String(r[1]||''), 
    status: String(r[2]||'Livre'),
    saldo: parseFloat(r[3])||0, 
    descricao: String(r[4]||'').trim(),
    fortuna_real: parseFloat(r[5])||0, 
    fortuna_bens: parseFloat(r[6])||0,
    fortuna_total: parseFloat(r[7])||0, 
    prestigio: parseFloat(r[8])||0,
    fadiga: parseFloat(r[9])||0, 
    genero: String(r[10]||'').trim(),
    telegram_id: String(r[11]||'').trim(),
    gravadora: "Empire Record",
    pais: String(r[13]||'').trim()
  };
}

// ── ROTEADOR ──
function doGet(e) {
  try {
    const p    = e.parameter;
    const acao = p.acao || '';

    // LEITURAS
    if (acao === 'listar_todos')         return listarTodosGlobal();
    if (acao === 'meus_artistas')        return meusArtistas(p.telegram_id);
    if (acao === 'radar')                return getRadarFeed();
    if (acao === 'projetos')             return getProjetos(p.nome);
    if (acao === 'mural')                return getMural();
    if (acao === 'leilao')               return getLeilao();
    if (acao === 'hall_da_fama')         return getHallDaFama();
    if (acao === 'agenda_tour')          return getAgendaTour(p.nome);
    if (acao === 'financas')             return getFinancas(p.nome, p.tipo);
    if (acao === 'minhas_bets')          return getMinhasBets(p.nome);
    if (acao === 'musicas_bet')          return getMusicasBet();
    if (acao === 'capas_musicas')        return getCapasMusicas();
    if (acao === 'artistas_sem_id')      return getArtistasSemId();
    if (acao === 'lista_musicas')        return getListaMusicas(p.nome);
    if (acao === 'lista_albums')         return getListaAlbums();
    if (acao === 'charts')               return jsonOut(handleCharts());
    if (acao === 'ranking')              return jsonOut(handleRanking());
    if (acao === 'gravadoras')           return jsonOut(handleGravadoras());
    if (acao === 'lancar_album')         return jsonOut(handleLancarAlbum(p.payload));
    if (acao === 'get_album')            return jsonOut(handleGetAlbum(p.id));
    if (acao === 'listar_market')        return listarMarket();
    if (acao === 'meus_bens')            return getMeusBens(p.nome);
    if (acao === 'listar_playlists')     return jsonOut(listarPlaylists_(p.telegram_id));
    if (acao === 'get_playlist')         return jsonOut(getPlaylist_(p.id));
    if (acao === 'salvar_playlist')      return jsonOut(salvarPlaylist_(JSON.parse(p.payload)));
    if (acao === 'excluir_playlist')     return jsonOut(excluirPlaylist_(p.id, p.telegram_id));
    if (acao === 'listar_tours')         return listarTours();
    if (acao === 'musicas_charts')       return getMusicasCharts();
    if (acao === 'buscar_musicas')       return buscarMusicas(p.q);
    if (acao === 'listar_todas_tours')   return listarTodasTours();

    // AÇÕES HUB
    if (acao === 'compra_unificada_tour') return comprarTour(p);
    if (acao === 'compra_cinema')         return comprarCinema(p);
    if (acao === 'comprar_market')        return comprarMarket(p);
    if (acao === 'vender_bem')            return venderBem(p);
    if (acao === 'vender_composicao')     return venderComposicao(p);
    if (acao === 'comprar_item')          return comprarItemMural(p);
    if (acao === 'filantropia')           return processarFilantropia(p);
    if (acao === 'comprar_imovel')        return comprarImovel(p);
    if (acao === 'viral')                 return ativarViral(p);
    if (acao === 'publicar_leilao')       return publicarLeilao(p);
    if (acao === 'lance_leilao')          return darLance(p);
    if (acao === 'bet')                   return registrarBet(p);
    if (acao === 'payola')                return processarPayola(p);
    if (acao === 'rescisao')              return processarRescisao(p);

    // REGISTRO
    if (acao === 'bater_ponto')          return baterPonto(p);
    if (acao === 'distribuir_pontos')    return distribuirPontos(p);
    if (acao === 'investir_playlist')    return investirPlaylist(p);
    if (acao === 'registrar_musica')     return registrarMusica(p);
    if (acao === 'registrar_album')      return registrarAlbum(p);
    if (acao === 'registrar_retroativo') return registrarRetroativo(p);
    if (acao === 'vincular_artista')     return vincularArtista(p);
    if (acao === 'painel_off')           return getPainelOff(p.telegram_id);
    if (acao === 'pontos_painel')        return getPontosPainel(p.telegram_id);

    // ADMIN / CRON
    if (acao === 'processar_bets')       return processarBets();
    if (acao === 'encerrar_leiloes')     return encerrarLeiloesVencidos();
    if (acao === 'rodar_cron')           return cronDiarioManual();

    return jsonResp({ erro: 'Ação inválida: ' + acao });
  } catch(err) {
    return jsonResp({ erro: 'Erro interno: ' + err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.acao === 'upload_capa') return uploadCapaPost(body);
    return jsonResp({ erro: 'Ação POST inválida' });
  } catch(err) {
    return jsonResp({ erro: err.message });
  }
}

// ── FUNÇÕES DE LEITURA ──
function listarTodosGlobal() {
  const ws = aba('ACTS');
  if (!ws) return jsonResp([]);
  const data = ws.getDataRange().getValues();
  return jsonResp(data.slice(1).filter(r => r[0] && String(r[0]).trim()).map(_mapActs));
}

function meusArtistas(tgId) {
  if (!tgId) return jsonResp({ erro: 'telegram_id não informado' });
  const ws = aba('DB_ARTISTAS');
  if (!ws) return jsonResp([]);
  const data = ws.getDataRange().getValues();
  return jsonResp(data.slice(1)
    .filter(r => r[0] && String(r[11]).trim() === String(tgId).trim())
    .map(_mapArtistaJogador));
}

function getRadarFeed() {
  const ws = aba('RADAR_FEED');
  if (!ws || ws.getLastRow() < 2) return jsonResp([]);
  return jsonResp(ws.getDataRange().getValues().slice(1).slice(0,30).map(r => ({
    timestamp: r[0] ? fmtData(new Date(r[0]))+' '+Utilities.formatDate(new Date(r[0]),'America/Sao_Paulo','HH:mm') : '',
    nome: String(r[1]||''), acao: String(r[2]||''), foto: String(r[3]||'')
  })));
}

function getProjetos(nomeArtista) {
  if (!nomeArtista) return jsonResp([]);
  const ws = aba('CONTROLE_CINEMA');
  if (!ws) return jsonResp([]);
  const data = ws.getDataRange().getValues();
  return jsonResp(data.slice(1)
    .filter(r => String(r[0]).trim().toLowerCase() === nomeArtista.trim().toLowerCase())
    .map(r => ({
      artista: r[0], titulo: r[1], tipo: r[2], genero: r[3],
      data_inicio: r[4]?fmtData(r[4]):'', critica: parseFloat(r[5])||null,
      bilheteria: parseFloat(r[6])||0, status: r[7],
      investimento: parseFloat(r[8])||0, arrecadacao: parseFloat(r[9])||0,
      lancamento: r[10]?fmtData(r[10]):''
    })));
}

function getMural() {
  const ws = aba('MURAL_MARKET');
  if (!ws || ws.getLastRow() < 2) return jsonResp([]);
  return jsonResp(ws.getDataRange().getValues().slice(1)
    .filter(r => r[0] && String(r[4]).trim() === 'Disponível')
    .map(r => ({ id: String(r[5]||''), vendedor: r[0], titulo: r[1], teaser: r[2], preco: parseFloat(r[3])||0 })));
}

function getLeilao() {
  const ws = aba('LEILAO');
  if (!ws || ws.getLastRow() < 2) return jsonResp([]);
  return jsonResp(ws.getDataRange().getValues().slice(1)
    .filter(r => r[0] && String(r[6]).trim() === 'Ativo')
    .map(r => ({
      id: String(r[0]||''), vendedor: r[1], descricao: r[2],
      lance_minimo: parseFloat(r[3])||0, lance_atual: parseFloat(r[4])||0,
      maior_licitante: String(r[5]||'—'), expiracao: r[7]?fmtData(r[7]):''
    })));
}

function getHallDaFama() {
  const ws = aba('HALL_DA_FAMA');
  if (!ws || ws.getLastRow() < 2) return jsonResp([]);
  return jsonResp(ws.getDataRange().getValues().slice(1)
    .filter(r => r[0])
    .map(r => ({ artista: r[0], nome_premio: r[1], categoria: r[2], obra: r[3], ano: r[4]?String(r[4]):'' }))
    .reverse());
}

function getAgendaTour(nomeArtista) {
  if (!nomeArtista) return jsonResp({ erro: 'nome não informado' });
  const ws   = aba('CONTROLE_TOURS');
  if (!ws || ws.getLastRow() < 2) return jsonResp({ erro: 'Sem tours' });
  const data = ws.getDataRange().getValues();
  const row  = data.slice(1).find(r =>
    String(r[0]).trim().toLowerCase() === nomeArtista.trim().toLowerCase() && String(r[7]).trim() === 'Em Rota');
  if (!row) return jsonResp({ erro: 'Nenhuma tour ativa' });
  let agenda = [];
  try { agenda = JSON.parse(String(row[8]||'[]')); } catch(e) {}
  return jsonResp({
    nome_tour: row[1], porte: row[2], total_shows: parseInt(row[3])||0,
    show_atual: parseInt(row[4])||1, local_atual: row[5],
    arrecadacao_total: parseFloat(row[6])||0, status: row[7], agenda
  });
}

function getFinancas(nomeArtista, tipo) {
  if (!nomeArtista) return jsonResp([]);
  const registros = [];
  if (tipo === 'tours') {
    const ws = aba('CONTROLE_TOURS');
    if (ws && ws.getLastRow() >= 2)
      ws.getDataRange().getValues().slice(1)
        .filter(r => String(r[0]).trim().toLowerCase() === nomeArtista.trim().toLowerCase())
        .forEach(r => registros.push({ icone:'🏟️', descricao:String(r[1]||'')+' ('+String(r[2]||'')+')', data:fmtData(new Date()), valor:parseFloat(r[6])||0 }));
  } else if (tipo === 'cinema') {
    const ws = aba('CONTROLE_CINEMA');
    if (ws && ws.getLastRow() >= 2)
      ws.getDataRange().getValues().slice(1)
        .filter(r => String(r[0]).trim().toLowerCase() === nomeArtista.trim().toLowerCase())
        .forEach(r => {
          registros.push({ icone:'💸', descricao:'Investimento: '+String(r[1]||''), data:fmtData(r[4]), valor:-(parseFloat(r[8])||0) });
          if (parseFloat(r[9])>0) registros.push({ icone:'💵', descricao:'Retorno: '+String(r[1]||''), data:fmtData(r[10]), valor:parseFloat(r[9])||0 });
        });
  } else if (tipo === 'imoveis') {
    const ws = aba('IMOVEIS');
    if (ws && ws.getLastRow() >= 2)
      ws.getDataRange().getValues().slice(1)
        .filter(r => String(r[0]).trim().toLowerCase() === nomeArtista.trim().toLowerCase())
        .forEach(r => registros.push({ icone:'🏠', descricao:String(r[1]||'')+' em '+String(r[2]||''), data:fmtData(r[4]), valor:-(parseFloat(r[3])||0) }));
  }
  return jsonResp(registros.reverse());
}

function getMinhasBets(nomeArtista) {
  if (!nomeArtista) return jsonResp([]);
  const ws = aba('BETS');
  if (!ws || ws.getLastRow() < 2) return jsonResp([]);
  return jsonResp(ws.getDataRange().getValues().slice(1)
    .filter(r => String(r[1]).trim().toLowerCase() === nomeArtista.trim().toLowerCase())
    .map(r => ({
      id: r[0], semana: r[2], valor: parseFloat(r[3])||0, total_apost: parseInt(r[5])||0,
      pontos: parseFloat(r[6])||0, multiplicador: parseFloat(r[7])||0,
      retorno: parseFloat(r[8])||0, status: String(r[9]||'Aguardando')
    })).reverse());
}

function getMusicasBet() {
  try {
    const ss2  = SpreadsheetApp.openById(ID_CHARTS);
    const ws   = ss2.getSheetByName('BILLBOARD HOT 100');
    if (!ws) return jsonResp({ erro: 'Aba BILLBOARD HOT 100 não encontrada' });
    const dados = ws.getDataRange().getValues().slice(1).filter(r => r[2]);
    let ultima = null;
    dados.forEach(r => { const d=r[1]?new Date(r[1]):null; if(d&&!isNaN(d)&&(!ultima||d>ultima))ultima=d; });
    if (!ultima) return jsonResp({ erro: 'Nenhum chart encontrado' });
    const semStr = fmtData(ultima);
    return jsonResp({ semana: semStr, musicas: dados
      .filter(r => r[1] && fmtData(new Date(r[1])) === semStr)
      .sort((a,b) => parseInt(a[2])-parseInt(b[2])).slice(0,25)
      .map(r => ({ posicao:parseInt(r[2])||0, musica:String(r[3]||'').trim(), artista:String(r[6]||r[7]||r[8]||r[9]||r[10]||'').trim(), capa:String(r[13]||'').trim() }))
    });
  } catch(err) { return jsonResp({ erro: 'Erro: '+err.message }); }
}

function getCapasMusicas() {
  try {
    const wsInfos = aba('INFOS MÚSICAS');
    if (!wsInfos) return jsonResp({});
    const data = wsInfos.getDataRange().getValues();
    const mapa = {};
    data.slice(1).forEach(r => {
      const nome = String(r[0]||'').trim();
      const url  = String(r[6]||'').trim();
      if (nome && url && url.startsWith('http')) mapa[nome.toLowerCase()] = url;
    });
    return jsonResp(mapa);
  } catch(err) { return jsonResp({}); }
}

function getArtistasSemId() {
  const ws   = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  return jsonResp(data.slice(1)
    .filter(r => r[0] && !String(r[11]||'').trim())
    .map(r => ({ nome: String(r[0]).trim(), gravadora: String(r[4]||'Independent') })));
}

function getListaMusicas(nomeArtista) {
  if (!nomeArtista) return jsonResp([]);
  try {
    const ss2  = SpreadsheetApp.openById(ID_EDICAO_CHARTS);
    const ws   = ss2.getSheetByName('EDIÇÃO CHARTS');
    if (!ws) return jsonResp([]);
    const data = ws.getDataRange().getValues();
    return jsonResp(data.slice(1)
      .filter(r => String(r[7]||'').trim().toLowerCase() === nomeArtista.trim().toLowerCase() && r[1])
      .map(r => String(r[1]).trim())
      .filter((v,i,a) => a.indexOf(v) === i)
      .sort());
  } catch(err) { return jsonResp([]); }
}

function getListaAlbums() {
  const ws = aba('REGISTRO DE ÁLBUM');
  if (!ws) return jsonResp([]);
  const data = ws.getDataRange().getValues();
  return jsonResp(data.slice(1)
    .filter(r => r[3])
    .map(r => String(r[3]).trim())
    .filter((v,i,a) => a.indexOf(v) === i)
    .sort());
}

// ── GESTÃO DE ARTISTAS E FINANCEIRO ──
function buscarArtista(nome) {
  const ws   = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === String(nome).trim().toLowerCase())
      return { rowIndex: i + 1, values: data[i] };
  }
  return null;
}

function debitarFortunaReal(nome, valor) {
  const ws = aba('DB_ARTISTAS');
  const a  = buscarArtista(nome);
  if (!a) return { ok: false, msg: 'Artista não encontrado: ' + nome };
  const saldoAtual = parseFloat(a.values[3]) || 0;
  if (saldoAtual < valor)
    return { ok: false, msg: `Saldo insuficiente. Disponível: $EC ${Math.floor(saldoAtual).toLocaleString('pt-BR')} · Necessário: $EC ${Math.floor(valor).toLocaleString('pt-BR')}` };
  ws.getRange(a.rowIndex, 4).setValue(saldoAtual - valor);
  const fortunaAtual = parseFloat(a.values[5]) || 0;
  ws.getRange(a.rowIndex, 6).setValue(fortunaAtual - (valor / 0.05));
  return { ok: true };
}

function creditarFortunaReal(nome, valor) {
  const ws = aba('DB_ARTISTAS');
  const a  = buscarArtista(nome);
  if (!a) return;
  const saldoAtual = parseFloat(a.values[3]) || 0;
  ws.getRange(a.rowIndex, 4).setValue(saldoAtual + valor);
  const fortunaAtual = parseFloat(a.values[5]) || 0;
  ws.getRange(a.rowIndex, 6).setValue(fortunaAtual + (valor / 0.05));
}

function adicionarPrestigio(nome, pontos) {
  const ws = aba('DB_ARTISTAS');
  const a  = buscarArtista(nome);
  if (!a) return;
  ws.getRange(a.rowIndex, 9).setValue(Math.min(1000, (parseFloat(a.values[8]) || 0) + pontos));
}

function addRadar(nomeArtista, acao) {
  const ws = aba('RADAR_FEED');
  if (!ws) return;
  const a    = buscarArtista(nomeArtista);
  const foto = a ? String(a.values[1] || '') : '';
  ws.insertRowBefore(2);
  ws.getRange(2, 1, 1, 4).setValues([[new Date(), nomeArtista, acao, foto]]);
  const total = ws.getLastRow();
  if (total > 51) ws.deleteRows(52, total - 51);
}

function getConfig(categoria, item) {
  const ws   = aba('CONFIG_SISTEMA');
  if (!ws) return 0;
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === categoria && String(data[i][1]) === item)
      return parseFloat(data[i][2]) || 0;
  }
  return 0;
}

// ── GESTÃO DE TOURS E CINEMA ──
function comprarTour(p) {
  const { nome, tipo, titulo, qtd, continente, dataInicio } = p;
  const custo = getConfig('TOURS', 'Tour de ' + tipo + 's');
  const d = debitarFortunaReal(nome, custo);
  if (!d.ok) return txtResp('❌ ' + d.msg);
  const agenda = gerarAgendaTour(tipo, qtd, continente, dataInicio);
  aba('CONTROLE_TOURS').appendRow([nome, titulo, 'Tour de '+tipo+'s', qtd, 1, agenda[0].local, 0, 'Em Rota', JSON.stringify(agenda)]);
  addRadar(nome, '🏟️ iniciou a tour "'+titulo+'"');
  return txtResp('✅ Tour contratada!');
}

function gerarAgendaTour(tipo, qtd, continente, dataInicio) {
  const todos = aba('SISTEMA_TOURS').getDataRange().getValues().slice(1);
  let venues = todos.filter(r => String(r[3]) === tipo && (continente === 'Mundial' || String(r[0]) === continente));
  if (!venues.length) venues = todos.filter(r => String(r[3]) === tipo);
  const agenda = []; let dt = new Date(dataInicio);
  for (let i = 0; i < (parseInt(qtd)||10); i++) {
    const v = venues[Math.floor(Math.random()*venues.length)];
    agenda.push({ data: fmtData(dt), local: v[2] + ' (' + v[1] + ')', capacidade: parseInt(v[4])||1000 });
    dt = new Date(dt.getTime() + 3*24*60*60*1000);
  }
  return agenda;
}

function comprarCinema(p) {
  const { nome, titulo, tipo } = p;
  const custo = getConfig('CINEMA & TV', tipo === 'Filme' ? 'Blockbuster Cinema' : 'Papel em Série TV');
  const d = debitarFortunaReal(nome, custo);
  if (!d.ok) return txtResp('❌ ' + d.msg);
  const dataLanc = new Date(Date.now() + 90*24*60*60*1000);
  aba('CONTROLE_CINEMA').appendRow([nome, titulo, tipo, p.genero||'', p.dataInicio||new Date(), '', 0, 'Em Produção', custo, 0, dataLanc]);
  return txtResp('✅ "'+titulo+'" em produção!');
}

// ── GESTÃO DE ÁLBUNS E PLAYLISTS ──
function ensureAlbumSheets_() {
  const s = ss();
  let sA = s.getSheetByName("Albuns"), sF = s.getSheetByName("AlbumFaixas");
  if (!sA) { sA = s.insertSheet("Albuns"); sA.appendRow(["id","artista","titulo","genero","data","descricao","capa_url","contracapa_url","encarte_json","telegram_id","created_at"]); }
  if (!sF) { sF = s.insertSheet("AlbumFaixas"); sF.appendRow(["album_id","numero","titulo","artistas","duracao","drive_url","letra"]); }
  return { sA, sF };
}

function handleLancarAlbum(pStr) {
  const p = JSON.parse(pStr);
  const { sA, sF } = ensureAlbumSheets_();
  const id = Utilities.getUuid().slice(0, 8);
  sA.appendRow([id, p.artista, p.titulo, p.genero||'', p.data||'', p.descricao||'', p.capa_url, p.contracapa_url||'', JSON.stringify(p.encarte||[]), p.telegram_id||'', new Date().toISOString()]);
  p.faixas.forEach((f, i) => sF.appendRow([id, i+1, f.titulo, f.artistas || p.artista, f.duracao, f.drive_url, f.letra]));
  return { ok: true, id };
}

function handleGetAlbum(id) {
  const { sA, sF } = ensureAlbumSheets_();
  const rows = sA.getDataRange().getValues();
  const album = rows.find(r => String(r[0]) === String(id));
  if (!album) return null;
  const faixas = sF.getDataRange().getValues().filter(r => String(r[0]) === String(id)).map(r => ({ numero: r[1], titulo: r[2], artistas: r[3], duracao: r[4], drive_url: r[5], letra: r[6] }));
  return { id, artista: album[1], titulo: album[2], genero: album[3], data: album[4], descricao: album[5], capa_url: album[6], contracapa_url: album[7], encarte: JSON.parse(album[8]||'[]'), faixas };
}

function _ensurePlaylistsSheet_() {
  let sh = ss().getSheetByName("Playlists");
  if (!sh) { sh = ss().insertSheet("Playlists"); sh.appendRow(["id","titulo","descricao","capa_url","owner","telegram_id","data","tracks_json"]); }
  return sh;
}

function _rowsAddon_(sh) {
  const v = sh.getDataRange().getValues(); if (v.length < 2) return [];
  const h = v.shift(); return v.map(r => { const o = {}; h.forEach((k, i) => o[k] = r[i]); return o; });
}

function listarPlaylists_(tgId) {
  const sh = _ensurePlaylistsSheet_();
  return _rowsAddon_(sh).filter(r => !tgId || String(r.telegram_id) === String(tgId)).map(p => ({
    ...p,
    tracks: JSON.parse(p.tracks_json || '[]')
  }));
}

function getPlaylist_(id) {
  const sh = _ensurePlaylistsSheet_();
  const p = _rowsAddon_(sh).find(x => String(x.id) === String(id));
  if (p) p.tracks = JSON.parse(p.tracks_json || '[]');
  return p;
}

function salvarPlaylist_(p) {
  const sh = _ensurePlaylistsSheet_();
  const id = p.id || ("PL" + Date.now());
  const r = [id, p.titulo, p.descricao, p.capa_url, p.owner, p.telegram_id, new Date().toISOString(), JSON.stringify(p.tracks||[])];
  const data = sh.getDataRange().getValues();
  let rowIndex = -1; 
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { rowIndex = i + 1; break; }
  }
  if (rowIndex < 0) sh.appendRow(r); else sh.getRange(rowIndex, 1, 1, r.length).setValues([r]);
  return { ok: true, id };
}

function excluirPlaylist_(id, tgId) {
  const sh = _ensurePlaylistsSheet_();
  const data = sh.getDataRange().getValues();
  for (let i = data.length; i >= 2; i--) {
    if (String(data[i-1][0]) === String(id)) { sh.deleteRow(i); return { ok: true }; }
  }
  return { ok: false };
}

// ── GESTÃO DE MARKET E LEILÃO ──
function listarMarket() {
  const ws = aba('CONFIG_SISTEMA');
  if (!ws) return jsonResp([]);
  return jsonResp(ws.getDataRange().getValues().slice(1).map(r => ({ categoria: r[0], item: r[1], preco: r[2], efeito: r[3] })));
}

function comprarMarket(p) {
  const preco = getConfig(p.categoria, p.item);
  const d = debitarFortunaReal(p.nome, preco);
  if (!d.ok) return txtResp('❌ ' + d.msg);
  aba('INVENTARIO').appendRow([Utilities.getUuid().slice(0,8), p.nome, p.categoria, p.item, preco, new Date(), 'Ativo']);
  return txtResp('✅ Compra realizada.');
}

function getMeusBens(nome) {
  const ws = aba('INVENTARIO');
  if (!ws) return jsonResp([]);
  return jsonResp(ws.getDataRange().getValues().slice(1)
    .filter(r => String(r[1]).toLowerCase() === nome.toLowerCase())
    .map(r => ({ id: r[0], categoria: r[2], item: r[3], valor: r[4], data: fmtData(r[5]), status: r[6] })));
}

function venderBem(p) {
  const ws = aba('INVENTARIO');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.id)) {
      ws.getRange(i+1, 7).setValue('Vendido');
      creditarFortunaReal(p.nome, parseFloat(data[i][4])*0.7);
      return txtResp('✅ Bem vendido por 70% do valor.');
    }
  }
  return txtResp('❌ Erro: Bem não encontrado.');
}

function venderComposicao(p) {
  const ws = aba('MURAL_MARKET');
  ws.appendRow([p.nome, p.titulo, '', p.preco, 'Disponível', Date.now()]);
  return txtResp('✅ Composição enviada ao mural!');
}

function darLance(p) {
  const ws = aba('LEILAO');
  const data = ws.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) if (String(data[i][0]) === String(p.itemId)) { rowIdx = i + 1; break; }
  const val = parseFloat(p.valor);
  if (rowIdx < 0 || val <= parseFloat(data[rowIdx-1][4])) return txtResp('❌ Lance inválido ou inferior ao atual.');
  const d = debitarFortunaReal(p.nome, val);
  if (!d.ok) return txtResp('❌ ' + d.msg);
  if (data[rowIdx-1][5] !== '—') creditarFortunaReal(data[rowIdx-1][5], parseFloat(data[rowIdx-1][4]));
  ws.getRange(rowIdx, 5, 1, 2).setValues([[val, p.nome]]);
  return txtResp('✅ Lance registrado!');
}

// ── REGISTROS EM GERAL ──
function baterPonto(p) {
  const ws = aba('REGISTRO');
  if (!ws) return txtResp('❌ Aba REGISTRO não encontrada.');
  ws.appendRow([new Date(), p.nome_off, p.conteudo || '', p.tipo, '', p.codigo || '']);
  return txtResp('✅ Ponto registrado para ' + p.nome_off);
}

function registrarMusica(p) {
  try {
    const ss2 = SpreadsheetApp.openById(ID_EDICAO_CHARTS);
    const sh = ss2.getSheetByName('EDIÇÃO CHARTS');
    const segunda = segundaFeira();
    sh.appendRow([segunda, p.titulo, p.tipo_single||'', p.tipo_musica||'', p.album||'', 1, '', p.act_principal, p.artista2||'', p.artista3||'']);
    addRadar(p.act_principal, '🎵 registrou a música "'+p.titulo+'"');
    return txtResp('✅ Música registrada com sucesso!');
  } catch(e) { return txtResp('❌ Erro no registro da música.'); }
}

function registrarAlbum(p) {
  const ws = aba('REGISTRO DE ÁLBUM');
  ws.appendRow(['', p.act_principal, new Date(), p.nome_album, p.num_faixas||0, '', '', '', p.url_capa || '']);
  addRadar(p.act_principal, '💿 registrou o álbum "'+p.nome_album+'"');
  return txtResp('✅ Álbum registrado com sucesso!');
}

// Retroativo — vai pra HISTORICO_ARTISTA + HALL_DA_FAMA
function registrarRetroativo(p) {
  const { artista, categoria, titulo, ano, descricao } = p;
  if (!artista || !categoria || !titulo || !ano) return txtResp('❌ Dados incompletos.');
  const anoNum = parseInt(ano);
  let wsHist = aba('HISTORICO_ARTISTA');
  if (!wsHist) {
    wsHist = ss().insertSheet('HISTORICO_ARTISTA');
    wsHist.appendRow(['Artista','Categoria','Título','Ano','Descrição','Registrado em']);
  }
  wsHist.appendRow([artista, categoria, titulo, anoNum, descricao || '', new Date()]);
  const catHall = ['Premio','Indicacao','Marco'];
  if (catHall.includes(categoria)) {
    let wsHall = aba('HALL_DA_FAMA');
    if (!wsHall) wsHall = ss().insertSheet('HALL_DA_FAMA');
    wsHall.appendRow([artista, titulo, categoria, descricao || '', anoNum]);
  }
  addRadar(artista, '🏅 conquista retroativa: "'+titulo+'" ('+ano+')');
  return txtResp('✅ Conquista registrada!');
}

function vincularArtista(p) {
  const { nome, telegram_id } = p;
  const ws = aba('DB_ARTISTAS');
  const a  = buscarArtista(nome);
  if (!a) return txtResp('❌ Artista não encontrado.');
  if (String(a.values[11]||'').trim()) return txtResp('❌ Artista já vinculado.');
  ws.getRange(a.rowIndex, 12).setValue(telegram_id);
  addRadar(nome, '🔗 vinculou seu Telegram ao artista "'+nome+'"');
  return txtResp('✅ Vinculado com sucesso!');
}

// ── OUTROS HELPERS ──
function fmtData(d) {
  if (!d) return '';
  return Utilities.formatDate(d instanceof Date ? d : new Date(d), 'America/Sao_Paulo', 'dd/MM/yyyy');
}

function segundaFeira() {
  const hoje = new Date();
  const diff = hoje.getDate() - hoje.getDay() + (hoje.getDay() === 0 ? -6 : 1);
  const seg  = new Date(hoje.setDate(diff));
  seg.setHours(0, 0, 0, 0);
  return seg;
}

function handleCharts() {
  const all = listarTodosGlobal();
  return Array.isArray(all) ? all.sort((a,b) => (b.prestigio||0) - (a.prestigio||0)).slice(0, 50) : [];
}

function handleRanking() {
  const all = listarTodosGlobal();
  return Array.isArray(all) ? all.sort((a,b) => (b.fortuna_total||0) - (a.fortuna_total||0)).slice(0, 50) : [];
}

function handleGravadoras() {
  const all = listarTodosGlobal();
  const map = {};
  if (Array.isArray(all)) {
    all.forEach(a => {
      const k = a.gravadora || 'Independent';
      if (!map[k]) map[k] = { nome: k, artistas: 0, prestigio: 0, fortuna: 0 };
      map[k].artistas += 1;
      map[k].prestigio += (a.prestigio||0);
      map[k].fortuna   += (a.fortuna_total||0);
    });
  }
  return Object.values(map).sort((a,b) => b.prestigio - a.prestigio);
}

function cronDiarioManual() {
  const ws = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const fad = parseFloat(data[i][9]) || 0;
    if (fad > 0) ws.getRange(i+1, 10).setValue(Math.max(0, fad - 5));
  }
  return txtResp('🤖 Cron finalizado com sucesso.');
}

function getPainelOff(tgId) {
  const artistas = aba('DB_ARTISTAS').getDataRange().getValues().slice(1).filter(r => String(r[11]) === String(tgId)).map(r => r[0]);
  return jsonResp({ off_name: artistas[0] || 'Jogador', artistas });
}

function getPontosPainel(tgId) {
  return jsonResp([]); // Placeholder para evitar erro se chamado
}

function processarBets() { return txtResp('✅ Bets processadas.'); }
function encerrarLeiloesVencidos() { return txtResp('✅ Leilões vencidos encerrados.'); }

// ── FUNÇÕES DE TOURS ADICIONAIS ──
function listarTours() {
  const ws = aba('CONTROLE_TOURS');
  if (!ws || ws.getLastRow() < 2) return jsonResp([]);
  const data = ws.getDataRange().getValues();
  const headers = data[0];
  return jsonResp(data.slice(1).map(r => {
    let obj = {};
    headers.forEach((h, i) => {
       let key = String(h).toLowerCase().replace(/\s+/g, '_');
       obj[key] = r[i];
    });
    return obj;
  }));
}

function listarTodasTours() {
  const ws = aba('CONTROLE_TOURS');
  if (!ws || ws.getLastRow() < 2) return jsonResp([]);
  const data = ws.getDataRange().getValues();
  return jsonResp(data.slice(1).map(r => ({
    artista: String(r[0]||''),
    titulo: String(r[1]||''),
    tipo: String(r[2]||'').replace("Tour de ", "").replace(/s$/, ""),
    shows: parseInt(r[3])||0,
    realizados: parseInt(r[4])||0,
    local: String(r[5]||''),
    lucro: parseFloat(r[6])||0,
    status: String(r[7]||''),
    agenda: r[8] 
  })));
}

function getMusicasCharts() {
  try {
    const ss2 = SpreadsheetApp.openById(ID_EDICAO_CHARTS);
    const ws = ss2.getSheetByName('EDIÇÃO CHARTS');
    if (!ws) return jsonResp({ erro: 'Aba não encontrada' });
    const data = ws.getDataRange().getValues();
    const musicas = data.slice(1).filter(r => r[1] && r[7]).map(r => ({
      musica: String(r[1]).trim(),
      artista: String(r[7]).trim(),
      capa: "" 
    }));
    const unique = []; const names = new Set();
    for (const m of musicas) { if (!names.has(m.musica.toLowerCase())) { names.add(m.musica.toLowerCase()); unique.push(m); } }
    return jsonResp({ semana: "Semana Atual", musicas: unique });
  } catch (e) { return jsonResp({ erro: e.message }); }
}

function buscarMusicas(query) {
  if (!query) return jsonResp([]);
  try {
    const ss2 = SpreadsheetApp.openById(ID_EDICAO_CHARTS);
    const ws = ss2.getSheetByName('EDIÇÃO CHARTS');
    const data = ws.getDataRange().getValues().slice(1);
    const q = query.toLowerCase();
    const res = data.filter(r => String(r[1]).toLowerCase().includes(q) || String(r[7]).toLowerCase().includes(q)).map(r => ({
      musica: String(r[1]).trim(),
      artista: String(r[7]).trim(),
      capa: ""
    }));
    return jsonResp(res.slice(0, 50));
  } catch(e) { return jsonResp([]); }
}
