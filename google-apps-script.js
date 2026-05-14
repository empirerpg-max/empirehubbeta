/**
 * EMPIRE HUB - MOTOR BACKEND INTEGRAL (GOOGLE APPS SCRIPT)
 * Versão: 12.6.0 "Empire Games & Social Evolution"
 * 
 * SISTEMA UNIFICADO DE CONTROLE - GESTÃO DE CARREIRAS EM TEMPO REAL
 */

// -- CONFIGURAÇÕES DE IDs (MAPA DO APLICATIVO) --
const ID_PRINCIPAL      = '1tKO6qZcR1dS3VdF3mLZoVCnenV6N54-gu8HI_ZJILas';
const ID_CHARTS         = '1ThRhljmAS41JmVBPkPtYwe0JQHRx9Pih2PQAPT2ebyA';
const ID_ALBUMS         = '1wUoCpi7_VSbXBhu7XGsqs2ZAJBwcPrx_TFmTS0OMyhY';

function ss() { return SpreadsheetApp.openById(ID_PRINCIPAL); }
function aba(nome) { return ss().getSheetByName(nome) || ss().insertSheet(nome); }

function jsonOut(obj) { 
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); 
}

// ── MAPEAMENTOS (COLUNAS E ÍNDICES) ──

/**
 * Aba ACTS:
 * 0: Nome (string)
 * 1: Genero/Status (string)
 * 2: Foto/Status (string)
 * 4: Fortuna (number)
 * 5: Prestigio (number)
 * 10: Genero (string)
 * 13: Pais (string)
 */
function _mapActs(r) {
  return {
    nome: String(r[0]||'').trim(),
    foto: String(r[2]||r[1]||''), 
    status: String(r[2]||'Livre'),
    genero: String(r[10]||'').trim(),
    pais: String(r[13]||'').trim(),
    fortuna: parseFloat(r[4])||0,
    prestigio: parseFloat(r[5])||0
  };
}

/**
 * Aba DB_ARTISTAS:
 * 0: Nome (string)
 * 1: Foto (string - Drive URL)
 * 2: Status (string - Livre/Contratado)
 * 3: Saldo (number - E$C)
 * 4: Descricao (string)
 * 5: Fortuna Real (number)
 * 6: Fortuna Bens (number)
 * 7: Fortuna Total (number)
 * 8: Prestigio (number)
 * 9: Fadiga (number)
 * 10: Telegram ID (string)
 * 11: Genero (string)
 * 12: Gravadora (string)
 * 13: Tour Info (string - JSON)
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
    telegram_id: String(r[10]||'').trim(), 
    genero: String(r[11]||'').trim(), 
    gravadora: String(r[12]||'Independent'),
    tour_info: r[13] || null
  };
}

// ── ROTEADOR PRINCIPAL ──

// ── MÓDULO SOCIAL ──

/**
 * Converte links de compartilhamento do Google Drive para links diretos
 */
function driveUrl(url) {
  if (!url) return "";
  if (url.indexOf('drive.google.com') > -1) {
    var id = "";
    if (url.indexOf('id=') > -1) {
      id = url.split('id=')[1].split('&')[0];
    } else {
      var parts = url.split('/');
      for (var i = 0; i < parts.length; i++) {
        if (parts[i] === 'd') {
          id = parts[i+1];
          break;
        }
      }
    }
    if (id) return "https://lh3.googleusercontent.com/d/" + id;
  }
  return url;
}

function salvarPostSocial(payload, tgId) {
  try {
    const p = JSON.parse(payload);
    const ws = aba('SOCIAL_POSTS');
    if (ws.getLastRow() === 0) {
      ws.appendRow(['id', 'tipo', 'subtipo', 'autor', 'texto', 'media_url', 'analytics', 'data', 'telegram_id']);
    }
    const id = 'POST-' + Utilities.getUuid().slice(0, 8);
    ws.appendRow([
      id, p.tipo, p.subtipo || "", String(p.autor || "").trim(), p.texto || "",
      driveUrl(String(p.media_url || "").trim()),
      JSON.stringify(p.analytics || { likes: 0, comments: 0, shares: 0 }),
      new Date().toISOString(), String(tgId || p.telegram_id || "").trim()
    ]);
    return { ok: true, id };
  } catch(e) { return { ok: false, erro: e.message }; }
}

function listarPostsSocial() {
  try {
    const ws = aba('SOCIAL_POSTS');
    const data = ws.getDataRange().getValues();
    if (data.length <= 1) return [];
    const perfis = listarPerfisSocial();
    return data.slice(1).reverse().map(r => {
      const postId = r[0];
      const autor = String(r[3] || "").trim();
      const rede = String(r[1] || "").trim();
      const perfil = perfis.find(p => String(p.artista).trim().toLowerCase() === autor.toLowerCase() && String(p.rede).trim().toLowerCase() === rede.toLowerCase());
      return {
        id: postId, tipo: rede, subtipo: r[2], autor: autor,
        handle: perfil ? perfil.handle : `@${autor.replace(/\s+/g, '').toLowerCase()}`,
        avatar: perfil ? perfil.avatar_url : "",
        texto: r[4], media_url: String(r[5] || "").trim(),
        analytics: JSON.parse(r[6] || '{}'), data: r[7], telegram_id: String(r[8] || '').trim()
      };
    });
  } catch(e) { return []; }
}

function salvarPerfilSocial(payload, tgId) {
  try {
    const p = JSON.parse(payload);
    const ws = aba('SOCIAL_PERFIS');
    if (ws.getLastRow() === 0) ws.appendRow(['artista', 'rede', 'handle', 'bio', 'avatar_url', 'telegram_id', 'seguidores']);
    const data = ws.getDataRange().getValues();
    let rowIdx = -1;
    const targetArt = String(p.artista || "").trim().toLowerCase();
    const targetRede = String(p.rede || "").trim().toLowerCase();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === targetArt && String(data[i][1]).trim().toLowerCase() === targetRede) {
        rowIdx = i + 1; break;
      }
    }
    const rowData = [String(p.artista || "").trim(), String(p.rede || "").trim(), String(p.handle || "").trim(), p.bio || "", driveUrl(String(p.avatar_url || "").trim()), String(tgId || p.telegram_id || '').trim(), p.seguidores || 0];
    if (rowIdx !== -1) ws.getRange(rowIdx, 1, 1, 7).setValues([rowData]);
    else ws.appendRow(rowData);
    return { ok: true };
  } catch(e) { return { ok: false, erro: e.message }; }
}

function curtirPostSocial(postId, tgId) {
  try {
    const ws = aba('SOCIAL_POSTS');
    const data = ws.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === postId) {
        const analytics = JSON.parse(data[i][6] || '{}');
        analytics.likes = (analytics.likes || 0) + 1;
        ws.getRange(i + 1, 7).setValue(JSON.stringify(analytics));
        return { ok: true, likes: analytics.likes };
      }
    }
    return { ok: false, erro: 'Post não encontrado' };
  } catch(e) { return { ok: false, erro: e.message }; }
}

function comentarPostSocial(payload, tgId) {
  try {
    const p = JSON.parse(payload);
    const ws = aba('SOCIAL_COMMENTS');
    if (ws.getLastRow() === 0) ws.appendRow(['postId', 'autor', 'texto', 'data', 'telegram_id']);
    ws.appendRow([p.postId, p.autor, p.texto, new Date().toISOString(), tgId]);
    const wsPost = aba('SOCIAL_POSTS');
    const postData = wsPost.getDataRange().getValues();
    for (let i = 1; i < postData.length; i++) {
      if (postData[i][0] === p.postId) {
        const analytics = JSON.parse(postData[i][6] || '{}');
        analytics.comments = (analytics.comments || 0) + 1;
        wsPost.getRange(i + 1, 7).setValue(JSON.stringify(analytics));
        break;
      }
    }
    return { ok: true };
  } catch(e) { return { ok: false, erro: e.message }; }
}

function listarComentariosSocial(postId) {
  try {
    const ws = aba('SOCIAL_COMMENTS');
    const data = ws.getDataRange().getValues();
    if (data.length <= 1) return [];
    const perfis = listarPerfisSocial();
    return data.slice(1).filter(r => r[0] === postId).map(r => {
      const autor = String(r[1] || "").trim();
      const perfil = perfis.find(p => String(p.artista).trim().toLowerCase() === autor.toLowerCase());
      return { autor: autor, texto: r[2], data: r[3], avatar: perfil ? perfil.avatar_url : "" };
    });
  } catch(e) { return []; }
}

function listarPerfisSocial(tgId) {
  const ws = aba('SOCIAL_PERFIS');
  const data = ws.getDataRange().getValues();
  if (data.length <= 1) return [];
  const searchId = tgId ? String(tgId).trim() : null;
  return data.slice(1).filter(r => !searchId || String(r[5]).trim() === searchId).map(r => ({
    artista: r[0], rede: r[1], handle: r[2], bio: r[3], avatar_url: r[4], 
    telegram_id: String(r[5] || '').trim(), seguidores: parseFloat(r[6]) || 0
  }));
}

function salvarNewsSocial(payload, tgId) {
  try {
    const p = JSON.parse(payload);
    const ws = aba('SOCIAL_NEWS');
    if (ws.getLastRow() === 0) ws.appendRow(['id', 'titulo', 'conteudo', 'imagem', 'autor', 'data', 'telegram_id']);
    const id = 'NEWS-' + Utilities.getUuid().slice(0, 8);
    ws.appendRow([id, p.titulo, p.conteudo, driveUrl(p.imagem), p.autor, new Date().toISOString(), tgId]);
    return { ok: true, id };
  } catch(e) { return { ok: false, erro: e.message }; }
}

function listarNewsSocial() {
  try {
    const ws = aba('SOCIAL_NEWS');
    const data = ws.getDataRange().getValues();
    if (data.length <= 1) return [];
    return data.slice(1).reverse().map(r => ({ id: r[0], titulo: r[1], conteudo: r[2], imagem: r[3], autor: r[4], data: r[5], telegram_id: r[6] }));
  } catch(e) { return []; }
}

// ── DO POST / DO GET ──

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return processAction(data);
  } catch(err) {
    return jsonOut({ ok: false, erro: 'Erro no POST: ' + err.message });
  }
}

function doGet(e) {
  try {
    return processAction(e.parameter);
  } catch(err) {
    return jsonOut({ ok: false, erro: 'Erro no GET: ' + err.message });
  }
}

function processAction(p) {
  const acao = p.acao || '';
  const tgId = String(p.telegram_id || p.tgId || p.tgid || '').trim();

  // DASHBOARD & BUSCA
  if (acao === 'listar_acts')          return jsonOut(aba('ACTS').getDataRange().getValues().slice(1).map(_mapActs));
  if (acao === 'listar_todos')         return jsonOut(aba('DB_ARTISTAS').getDataRange().getValues().slice(1).map(_mapArtistaJogador));
  if (acao === 'artistas_sem_id')      return jsonOut(aba('DB_ARTISTAS').getDataRange().getValues().slice(1).filter(r => !String(r[10]).trim()).map(_mapArtistaJogador));
  if (acao === 'meus_artistas')        return meusArtistas(tgId);
  if (acao === 'radar')                return jsonOut(aba('RADAR_FEED').getDataRange().getValues().slice(1).slice(0, 30).map(r => ({ timestamp: r[0], nome: r[1], acao: r[2], foto: r[3] })));
  if (acao === 'top_charts')           return jsonOut(getTopChartsAll());
  if (acao === 'vincular_artista')     return jsonOut(vincularArtista(p.nome, tgId));

  // RANKINGS
  if (acao === 'ranking')              return jsonOut(aba('DB_ARTISTAS').getDataRange().getValues().slice(1).map(_mapArtistaJogador).sort((a,b) => b.fortuna_total - a.fortuna_total).slice(0, 50));
  if (acao === 'charts')               return jsonOut(aba('DB_ARTISTAS').getDataRange().getValues().slice(1).map(_mapArtistaJogador).sort((a,b) => b.prestigio - a.prestigio).slice(0, 50));

  // SOCIAL
  if (acao === 'salvarPostSocial')      return jsonOut(salvarPostSocial(p.payload, tgId));
  if (acao === 'listarPostsSocial')      return jsonOut(listarPostsSocial());
  if (acao === 'listarPerfisSocial')    return jsonOut(listarPerfisSocial(tgId));
  if (acao === 'salvarPerfilSocial')    return jsonOut(salvarPerfilSocial(p.payload, tgId));
  if (acao === 'curtirPostSocial')      return jsonOut(curtirPostSocial(p.postId, tgId));
  if (acao === 'comentarPostSocial')    return jsonOut(comentarPostSocial(p.payload, tgId));
  if (acao === 'listarComentariosSocial') return jsonOut(listarComentariosSocial(p.postId));
  if (acao === 'salvarNewsSocial')      return jsonOut(salvarNewsSocial(p.payload, tgId));
  if (acao === 'listarNewsSocial')      return jsonOut(listarNewsSocial());

  // TOURS
  if (acao === 'listar_tours' || acao === 'tours') {
    const data = aba('CONTROLE_TOURS').getDataRange().getValues().slice(1);
    return jsonOut(data.map(r => ({
      artista: String(r[0]||'').trim(), titulo: String(r[1]||'').trim(), porte: String(r[2]||'').trim(),  
      total_shows: parseFloat(r[3])||0, show_atual: parseFloat(r[4])||0, local_atual: String(r[5]||'').trim(), 
      arrecadacao_total: parseFloat(r[6])||0, status: String(r[7]||'').trim(), agenda: String(r[8]||'[]'), foto: String(r[9]||'').trim() 
    })));
  }
  if (acao === 'vincular_imagem_tour') return jsonOut(handleVincularImagemTour(p));
  if (acao === 'compra_unificada_tour') return jsonOut(handleCompraTour(p));
  if (acao === 'agenda_tour')          return jsonOut(getAgendaTour(p.nome));

  // PROJETOS
  if (acao === 'projetos')             return jsonOut(getProjetosArtista(p.nome));

  // ECONOMIA & MARKET
  if (acao === 'listar_market')        return jsonOut(aba('CONFIG_SISTEMA').getDataRange().getValues().slice(1).filter(r => r[0] === 'MARKET').map(r => ({ categoria: r[0], item: r[1], preco: r[2], efeito: r[3] })));
  if (acao === 'comprar_market')        return jsonOut(comprarMarket(p));
  if (acao === 'vender_bem')            return jsonOut(venderBem(p));
  if (acao === 'meus_bens')            return jsonOut(aba('INVENTARIO').getDataRange().getValues().slice(1).filter(r => String(r[1]).toLowerCase() === String(p.nome).toLowerCase()).map(r => ({ id: r[0], categoria: r[2], item: r[3], valor: r[4], data: r[5] })));
  if (acao === 'comprar_imovel')        return jsonOut(handleComprarImovel(p));

  // ÁLBUNS & PLAYLISTS
  if (acao === 'lancar_album')         return jsonOut(handleLancarAlbum(p.payload));
  if (acao === 'listar_albuns')         return jsonOut(listarAlbuns(p.nome));
  if (acao === 'get_album')            return jsonOut(getAlbum(p.id));
  if (acao === 'editar_album')         return jsonOut(handleEditarAlbum(p.payload));
  if (acao === 'excluir_album')         return jsonOut(handleExcluirAlbum(p.id, tgId));
  if (acao === 'listar_playlists')     return jsonOut(listarPlaylists(tgId));
  if (acao === 'get_playlist')        return jsonOut(getPlaylist(p.id));
  if (acao === 'salvar_playlist')      return jsonOut(handleSalvarPlaylist(p.payload, tgId));
  if (acao === 'excluir_playlist')     return jsonOut(handleExcluirPlaylist(p.id, tgId));
  if (acao === 'listar_faixas_catalogo') return jsonOut(listarFaixasCatalogo());
  if (acao === 'buscar_musicas')       return jsonOut(buscarMusicas(p.q));

  // OUTRAS AÇÕES
  if (acao === 'compra_cinema')        return jsonOut(handleCompraCinema(p));
  if (acao === 'viral')                return jsonOut(handleViral(p.artista, p.musica));
  if (acao === 'payola')               return jsonOut(handlePayola(p));
  if (acao === 'filantropia')          return jsonOut(handleFilantropia(p.artista, p.causa, p.valor));
  if (acao === 'rescisao')             return jsonOut(handleRescisao(p));
  if (acao === 'publicar_leilao')      return jsonOut(handlePublicarLeilao(p));
  if (acao === 'lance_leilao')         return jsonOut(handleLanceLeilao(p));
  if (acao === 'vender_composicao')    return jsonOut(handleVenderComposicao(p));
  if (acao === 'comprar_item')         return jsonOut(handleComprarItemMural(p));
  if (acao === 'mural')                return jsonOut(aba('MURAL').getDataRange().getValues().slice(1).map(r => ({ id: r[0], vendedor: r[1], titulo: r[2], teaser: r[3], preco: r[4] })));

  // GAMES & ECONOMY
  if (acao === 'sync_game_coins')      return jsonOut(syncGameCoins(tgId, p.wager, p.won));
  if (acao === 'save_pet_state')       return jsonOut(savePetState(tgId, p.payload));
  if (acao === 'get_pet_state')        return jsonOut(getPetState(tgId));

  return jsonOut({ erro: 'Ação Inexistente: ' + acao });
}

// ── LÓGICA DE NEGÓCIO ──

/**
 * Sincroniza ganhos/perdas de minigames
 */
function syncGameCoins(tgId, wager, won) {
  try {
    const ws = aba('DB_ARTISTAS');
    const data = ws.getDataRange().getValues();
    let userRow = -1;
    const cleanId = String(tgId).trim();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][10]).trim() === cleanId) {
        userRow = i + 1;
        break;
      }
    }
    
    if (userRow === -1) return { ok: false, erro: 'Jogador não encontrado' };
    
    const saldoAtual = parseFloat(data[userRow-1][3]) || 0;
    const novoSaldo = saldoAtual - parseFloat(wager || 0) + parseFloat(won || 0);
    
    ws.getRange(userRow, 4).setValue(novoSaldo);
    
    // Log no Radar se ganho for expressivo
    if (parseFloat(won) > parseFloat(wager) * 1.5) {
      aba('RADAR_FEED').insertRowBefore(2).getRange(2, 1, 1, 4).setValues([[
        new Date().toISOString(), 
        data[userRow-1][0], 
        'Faturou ' + Math.floor(parseFloat(won) - parseFloat(wager)) + ' EC nos Games!', 
        data[userRow-1][1]
      ]]);
    }
    
    return { ok: true, novoSaldo: novoSaldo };
  } catch(e) { return { ok: false, erro: e.message }; }
}

function savePetState(tgId, payload) {
  try {
    const ws = aba('PET_STATE');
    if (ws.getLastRow() === 0) ws.appendRow(['telegram_id', 'payload', 'last_update']);
    const data = ws.getDataRange().getValues();
    let rowIdx = -1;
    const cleanId = String(tgId).trim();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === cleanId) { rowIdx = i + 1; break; }
    }
    if (rowIdx !== -1) ws.getRange(rowIdx, 2, 1, 2).setValues([[payload, new Date().getTime()]]);
    else ws.appendRow([cleanId, payload, new Date().getTime()]);
    return { ok: true };
  } catch(e) { return { ok: false, erro: e.message }; }
}

function getPetState(tgId) {
  try {
    const ws = aba('PET_STATE');
    const data = ws.getDataRange().getValues();
    const cleanId = String(tgId).trim();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === cleanId) return { ok: true, payload: data[i][1], lastUpdate: data[i][2] };
    }
    return { ok: false, erro: 'Pet não encontrado' };
  } catch(e) { return { ok: false, erro: e.message }; }
}

function meusArtistas(tgId) {
  if (!tgId) return jsonOut([]);
  const ws = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues().slice(1);
  const cleanId = String(tgId).trim();
  const filtered = data.filter(r => String(r[10]).trim() === cleanId);
  return jsonOut(filtered.map(_mapArtistaJogador));
}

function handleCompraTour(p) {
  const precos = { 'Indie': 1000000, 'Arena': 5000000, 'Estádio': 15000000 };
  const custo = precos[p.tipo] || 1000000;
  const ws = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  let artIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === p.nome.toLowerCase()) { artIdx = i + 1; break; }
  }
  if (artIdx === -1) return { ok: false, erro: 'Artista não encontrado' };
  const saldo = parseFloat(data[artIdx-1][3]) || 0;
  if (saldo < custo) return { ok: false, erro: 'Saldo insuficiente' };
  ws.getRange(artIdx, 4).setValue(saldo - custo);
  ws.getRange(artIdx, 3).setValue('Turnê: ' + p.titulo);
  const tourInfo = { titulo: p.titulo, tipo: p.tipo, qtd: p.qtd, continente: p.continente, shows_realizados: 0, status: "Em andamento" };
  ws.getRange(artIdx, 14).setValue(JSON.stringify(tourInfo));
  aba('CONTROLE_TOURS').appendRow([p.nome, p.titulo, p.tipo, p.qtd, 0, p.continente || 'Mundial', 0, 'Em andamento', '[]']);
  aba('RADAR_FEED').insertRowBefore(2).getRange(2, 1, 1, 4).setValues([[new Date().toISOString(), p.nome, 'Iniciou a turnê ' + p.titulo, data[artIdx-1][1]]]);
  return { ok: true, message: 'Turnê comprada com sucesso!' };
}

function getProjetosArtista(nome) {
  if (!nome) return [];
  const projects = [];
  try {
    const data = aba('CINEMA').getDataRange().getValues().slice(1);
    data.filter(r => String(r[1]).toLowerCase() === nome.toLowerCase()).forEach(r => {
      projects.push({ tipo: 'Cinema', titulo: r[2], status: r[3] || 'Lançado', data: r[4], detalhe: r[5] });
    });
  } catch(e) {}
  return projects;
}

function getAgendaTour(nome) {
  const data = aba('CONTROLE_TOURS').getDataRange().getValues().slice(1);
  const row = data.find(r => String(r[0]).toLowerCase() === nome.toLowerCase());
  return row ? JSON.parse(row[8] || '[]') : []; 
}

function handleComprarImovel(p) {
  const custos = { 'Casa': 500000, 'Apartamento': 1000000, 'Mansao': 5000000, 'Penthouse': 10000000 };
  const custo = custos[p.tipo] || 500000;
  const ws = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  let artIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === p.nome.toLowerCase()) { artIdx = i + 1; break; }
  }
  if (artIdx === -1) return { ok: false, erro: 'Artista não encontrado' };
  const saldo = parseFloat(data[artIdx-1][3]) || 0;
  if (saldo < custo) return { ok: false, erro: 'Saldo insuficiente' };
  ws.getRange(artIdx, 4).setValue(saldo - custo);
  aba('INVENTARIO').appendRow([Utilities.getUuid().slice(0, 5), p.nome, 'IMOVEL', p.tipo + ' em ' + p.cidade, custo, new Date().toISOString()]);
  return { ok: true };
}

function handleViral(artista, musica) {
  aba('RADAR_FEED').insertRowBefore(2).getRange(2, 1, 1, 4).setValues([[new Date().toISOString(), artista, 'A música "' + musica + '" está viralizando no TikTok!', '']]);
  return { ok: true };
}

function handleFilantropia(artista, causa, valor) {
  const v = parseFloat(valor);
  const ws = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  let artIdx = -1;
  for (let i = 1; i < data.length; i++) { if (String(data[i][0]).toLowerCase() === artista.toLowerCase()) { artIdx = i + 1; break; } }
  if (artIdx === -1) return { ok: false };
  const saldo = parseFloat(data[artIdx-1][3]) || 0;
  if (saldo < v) return { ok: false, erro: 'Saldo insuficiente' };
  ws.getRange(artIdx, 4).setValue(saldo - v);
  aba('RADAR_FEED').insertRowBefore(2).getRange(2, 1, 1, 4).setValues([[new Date().toISOString(), artista, 'Doou $' + v + ' para a causa: ' + causa, '']]);
  return { ok: true };
}

function buscarMusicas(q) {
  try {
    const wsA = aba('Albuns');
    const albunsData = wsA.getDataRange().getValues().slice(1);
    const capas = {};
    albunsData.forEach(r => { capas[String(r[0])] = String(r[6] || ''); });
    const ws = aba('AlbumFaixas');
    const data = ws.getDataRange().getValues();
    if (data.length <= 1) return [];
    return data.slice(1).filter(r => String(r[2]).toLowerCase().includes(String(q||'').toLowerCase()) || String(r[3]).toLowerCase().includes(String(q||'').toLowerCase())).map(r => {
      const albumId = String(r[0]);
      return { album_id: albumId, numero: r[1], titulo: r[2], artistas: r[3], drive_url: r[5], capa_url: capas[albumId] || "" };
    });
  } catch(e) { return []; }
}

function getTopChartsAll() {
  const ID_CHARTS = '1ThRhljmAS41JmVBPkPtYwe0JQHRx9Pih2PQAPT2ebyA';
  const configs = [
    { id: ID_CHARTS, sheet: 'BILLBOARD HOT 100', key: 'billboard_hot_100', map: { m: 3, a: 7, f: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=BILLBOARD%20HOT%20100' } },
    { id: ID_CHARTS, sheet: 'SPOTIFY', key: 'spotify', map: { m: 3, a: 7, f: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=SPOTIFY' } },
    { id: ID_CHARTS, sheet: 'APPLE MUSIC', key: 'apple_music', map: { m: 3, a: 7, f: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=APPLE%20MUSIC' } },
    { id: ID_CHARTS, sheet: 'YOUTUBE', key: 'youtube', map: { m: 3, a: 7, f: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=YOUTUBE' } },
    { id: ID_CHARTS, sheet: 'DIGITAL SALES', key: 'digital_sales', map: { m: 3, a: 7, f: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=DIGITAL%20SALES' } },
    { id: ID_ALBUMS, sheet: 'DADOS ÁLBUNS', key: 'billboard_200', map: { m: 3, a: 12, f: 9, url: 'https://empirerpg-max.github.io/central/charts.html?tab=DADOS%20%C3%81LBUNS' } }
  ];
  const r = {};
  configs.forEach(c => {
    try {
      const sh = SpreadsheetApp.openById(c.id).getSheetByName(c.sheet);
      const data = sh.getDataRange().getValues();
      let topRow = null;
      for (let i = data.length - 1; i >= 1; i--) { if (parseInt(data[i][2]) === 1) { topRow = data[i]; break; } }
      if (topRow) r[c.key] = { musica: String(topRow[c.map.m]||'').trim(), artista: String(topRow[c.map.a]||'').trim(), foto: String(topRow[c.map.f]||'').trim(), data: String(topRow[1]), url: c.url };
      else r[c.key] = { musica: "", artista: "", foto: "", data: "", url: c.url };
    } catch(e) { r[c.key + '_error'] = e.message; }
  });
  return r;
}

function handleSalvarPlaylist(payload, tgId) {
  try {
    const p = JSON.parse(payload);
    const ws = aba('Playlists');
    const data = ws.getDataRange().getValues();
    if (data.length === 1 && data[0][0] === "") ws.getRange(1, 1, 1, 8).setValues([["ID", "Título", "Descrição", "Capa", "Owner", "TelegramID", "TracksJSON", "Data"]]);
    const id = p.id || ('PL-' + Utilities.getUuid().slice(0, 5));
    const tracksJson = JSON.stringify(p.tracks || []);
    let rowIdx = -1;
    if (p.id) { 
      const currentData = ws.getDataRange().getValues();
      for (let i = 1; i < currentData.length; i++) { if (String(currentData[i][0]) === String(p.id)) { rowIdx = i + 1; break; } } 
    }
    let finalTgId = String(tgId || p.telegram_id || '');
    if (!finalTgId && p.owner) {
      const artData = aba('DB_ARTISTAS').getDataRange().getValues().slice(1);
      const art = artData.find(r => String(r[0]).toLowerCase() === String(p.owner).toLowerCase());
      if (art) finalTgId = String(art[10] || '');
    }
    const rowData = [id, p.titulo, p.descricao || "", p.capa_url || "", p.owner, finalTgId, tracksJson, p.data || new Date().toISOString()];
    if (rowIdx !== -1) {
      const currentData = ws.getDataRange().getValues();
      const existingTgId = String(currentData[rowIdx-1][5]);
      if (tgId && tgId !== "810141686" && existingTgId && existingTgId !== String(tgId)) return { ok: false, erro: 'Não autorizado' };
      ws.getRange(rowIdx, 1, 1, 8).setValues([rowData]);
    } else ws.appendRow(rowData);
    return { ok: true, id };
  } catch(e) { return { ok: false, erro: e.message }; }
}

function listarPlaylists(tgId) {
  const data = aba('Playlists').getDataRange().getValues().slice(1);
  return data.filter(r => !tgId || tgId === "810141686" || String(r[5]) === String(tgId)).map(r => ({
    id: r[0], titulo: r[1], descricao: r[2], capa_url: r[3], owner: r[4], telegram_id: r[5], tracks: JSON.parse(r[6]||'[]'), data: r[7]
  }));
}

function getPlaylist(id) {
  const data = aba('Playlists').getDataRange().getValues();
  const row = data.find(r => String(r[0]) === String(id));
  if (!row) return null;
  return { id: row[0], titulo: row[1], descricao: row[2], capa_url: row[3], owner: row[4], telegram_id: row[5], tracks: JSON.parse(row[6]||'[]'), data: row[7] };
}

function handleExcluirPlaylist(id, tgId) {
  const ws = aba('Playlists');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) { 
    if (String(data[i][0]) === String(id)) { 
      if (tgId && tgId !== "810141686" && String(data[i][5]) !== String(tgId)) return { ok: false, erro: 'Não autorizado' };
      ws.deleteRow(i + 1); return { ok: true }; 
    } 
  }
  return { ok: false, erro: 'Não encontrada' };
}

function listarFaixasCatalogo() {
  try {
    const wsA = aba('Albuns');
    const albunsData = wsA.getDataRange().getValues().slice(1);
    const capas = {};
    albunsData.forEach(r => { capas[String(r[0])] = String(r[6] || ''); });
    const ws = aba('AlbumFaixas');
    const data = ws.getDataRange().getValues();
    if (data.length <= 1) return [];
    return data.slice(1).map(r => {
      const albumId = String(r[0]||'');
      return { album_id: albumId, numero: parseFloat(r[1])||0, titulo: String(r[2]||'').trim(), artistas: String(r[3]||'').trim(), duracao: String(r[4]||'').trim(), drive_url: String(r[5]||'').trim(), letra: String(r[6]||'').trim(), capa_url: capas[albumId] || "" };
    }).filter(f => f.titulo);
  } catch(e) { return []; }
}

function handleLancarAlbum(payload) {
  try {
    const p = JSON.parse(payload);
    const id = p.id || ('ALB-' + Utilities.getUuid().slice(0, 5));
    let finalTgId = String(p.telegram_id || '');
    if (!finalTgId && p.artista) {
      const artData = aba('DB_ARTISTAS').getDataRange().getValues().slice(1);
      const art = artData.find(r => String(r[0]).toLowerCase() === String(p.artista).toLowerCase());
      if (art) finalTgId = String(art[10] || '');
    }
    aba("Albuns").appendRow([id, p.artista, p.titulo, p.genero, p.data, p.descricao, p.capa_url, finalTgId, p.contracapa_url || '']);
    if (p.faixas && Array.isArray(p.faixas)) {
      const wsF = aba("AlbumFaixas");
      p.faixas.forEach(f => wsF.appendRow([id, f.numero, f.titulo, f.artistas, f.duracao || '', f.drive_url, f.letra || '']));
    }
    return { ok: true, id };
  } catch(e) { return { ok: false, erro: e.message }; }
}

function listarAlbuns(nome) {
  return aba('Albuns').getDataRange().getValues().slice(1).filter(r => !nome || String(r[1]).toLowerCase() === nome.toLowerCase()).map(r => ({ id: r[0], artista: r[1], titulo: r[2], genero: r[3], data: r[4], descricao: r[5], capa_url: r[6], telegram_id: r[7] }));
}

function getAlbum(id) {
  const albuns = aba('Albuns').getDataRange().getValues();
  const row = albuns.find(r => String(r[0]) === String(id));
  if (!row) return null;
  const faixas = aba('AlbumFaixas').getDataRange().getValues().slice(1).filter(f => String(f[0]) === String(id)).map(f => ({ numero: f[1], titulo: f[2], artistas: f[3], duracao: f[4], drive_url: f[5], letra: f[6] }));
  return { id: row[0], artista: row[1], titulo: row[2], genero: row[3], data: row[4], descricao: row[5], capa_url: row[6], telegram_id: row[7], faixas };
}

function handleEditarAlbum(payload) {
  try {
    const p = JSON.parse(payload);
    const ws = aba('Albuns');
    const data = ws.getDataRange().getValues();
    let rowIdx = -1;
    for (let i = 1; i < data.length; i++) { if (String(data[i][0]) === String(p.id)) { rowIdx = i + 1; break; } }
    if (rowIdx === -1) return { ok: false, erro: 'Álbum não encontrado' };
    ws.getRange(rowIdx, 1, 1, 9).setValues([[p.id, p.artista, p.titulo, p.genero, p.data, p.descricao, p.capa_url, p.telegram_id, p.contracapa_url || '']]);
    const wsF = aba('AlbumFaixas');
    const dataF = wsF.getDataRange().getValues();
    for (let i = dataF.length - 1; i >= 1; i--) { if (String(dataF[i][0]) === String(p.id)) wsF.deleteRow(i + 1); }
    if (p.faixas && Array.isArray(p.faixas)) { p.faixas.forEach(f => wsF.appendRow([p.id, f.numero, f.titulo, f.artistas, f.duracao || '', f.drive_url, f.letra || ''])); }
    return { ok: true };
  } catch(e) { return { ok: false, erro: e.message }; }
}

function handleExcluirAlbum(id, tgId) {
  const ws = aba('Albuns');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      if (tgId && tgId !== "810141686" && String(data[i][7]) !== String(tgId)) return { ok: false, erro: 'Não autorizado' };
      ws.deleteRow(i + 1);
      const wsF = aba('AlbumFaixas');
      const dataF = wsF.getDataRange().getValues();
      for (let j = dataF.length - 1; j >= 1; j--) { if (String(dataF[j][0]) === String(id)) wsF.deleteRow(j + 1); }
      return { ok: true };
    }
  }
  return { ok: false, erro: 'Álbum não encontrado' };
}

function handleVincularImagemTour(p) {
  const ws = aba('CONTROLE_TOURS');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === p.nome.toLowerCase()) {
      ws.getRange(i + 1, 10).setValue(p.url);
      return { ok: true };
    }
  }
  return { ok: false, erro: 'Não encontrada' };
}

function handleCompraCinema(p) {
  const ws = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  let artIdx = -1;
  for (let i = 1; i < data.length; i++) { if (String(data[i][0]).toLowerCase() === p.nome.toLowerCase()) { artIdx = i + 1; break; } }
  if (artIdx === -1) return { ok: false, erro: 'Artista não encontrado' };
  const saldo = parseFloat(data[artIdx-1][3]) || 0;
  if (saldo < 2000000) return { ok: false, erro: 'Saldo insuficiente' };
  ws.getRange(artIdx, 4).setValue(saldo - 2000000);
  aba('CINEMA').appendRow([Utilities.getUuid().slice(0, 5), p.nome, p.titulo, 'Em andamento', new Date().toISOString(), p.genero || 'Filme']);
  return { ok: true };
}

function handlePayola(p) {
  const v = parseFloat(p.valor);
  const ws = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  let artIdx = -1;
  for (let i = 1; i < data.length; i++) { if (String(data[i][0]).toLowerCase() === p.nome.toLowerCase()) { artIdx = i + 1; break; } }
  if (artIdx === -1) return { ok: false, erro: 'Não encontrado' };
  const saldo = parseFloat(data[artIdx-1][3]) || 0;
  if (saldo < v) return { ok: false, erro: 'Saldo insuficiente' };
  ws.getRange(artIdx, 4).setValue(saldo - v);
  return { ok: true };
}

function handleRescisao(p) {
  const ws = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  let artIdx = -1;
  for (let i = 1; i < data.length; i++) { if (String(data[i][0]).toLowerCase() === p.nome.toLowerCase()) { artIdx = i + 1; break; } }
  if (artIdx === -1) return { ok: false, erro: 'Não encontrado' };
  ws.getRange(artIdx, 13).setValue(p.destino || 'Independent');
  return { ok: true };
}

function handlePublicarLeilao(p) {
  aba('LEILAO').appendRow([Utilities.getUuid().slice(0, 5), p.nome, p.descricao, p.lanceMini, new Date().toISOString(), 'Ativo']);
  return { ok: true };
}

function handleLanceLeilao(p) {
  return { ok: true };
}

function handleVenderComposicao(p) {
  aba('MURAL').appendRow([Utilities.getUuid().slice(0, 5), p.nome, p.titulo, 'Composição autorada', p.preco]);
  return { ok: true };
}

function handleComprarItemMural(p) {
  return { ok: true };
}

function comprarMarket(p) {
  const v = parseFloat(p.preco || 0);
  const ws = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  let artIdx = -1;
  for (let i = 1; i < data.length; i++) { if (String(data[i][0]).toLowerCase() === p.nome.toLowerCase()) { artIdx = i + 1; break; } }
  if (artIdx === -1) return { ok: false, erro: 'Não encontrado' };
  const saldo = parseFloat(data[artIdx-1][3]) || 0;
  if (saldo < v) return { ok: false, erro: 'Saldo insuficiente' };
  ws.getRange(artIdx, 4).setValue(saldo - v);
  aba('INVENTARIO').appendRow([Utilities.getUuid().slice(0, 5), p.nome, p.categoria || 'MARKET', p.item, v, new Date().toISOString()]);
  return { ok: true };
}

function venderBem(p) {
  const ws = aba('INVENTARIO');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) { if (String(data[i][0]) === String(p.id)) { ws.deleteRow(i + 1); return { ok: true }; } }
  return { ok: false, erro: 'Não encontrado' };
}

function vincularArtista(nome, tgId) {
  const ws = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  const cleanId = String(tgId || '').trim();
  for (let i = 1; i < data.length; i++) { 
    if (String(data[i][0]).toLowerCase() === nome.toLowerCase()) { 
      ws.getRange(i+1, 11).setValue(cleanId); 
      return { ok: true }; 
    } 
  }
  return { ok: false, erro: 'Não encontrado' };
}
