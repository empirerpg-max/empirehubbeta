/**
 * EMPIRE HUB — MOTOR BACKEND INTEGRAL (GOOGLE APPS SCRIPT)
 * Versão: 12.0.0 "Legado Imperial Corrigido"
 *
 * CORREÇÕES v12 (em relação à v11):
 * - _mapActs: foto corrigida para r[2] (C=Foto), status removido (não existe em ACTS)
 * - acao=charts: agora retorna Billboard Hot 100 real (top 100 da semana mais recente)
 *   em vez de artistas ordenados por prestígio
 * - acao=ranking_prestigio: NOVO — ranking de prestígio separado
 * - getMural(): id agora é o índice da linha (i+2), não r[0] que é o vendedor
 * - comprarItemMural(): usa parseInt(p.id) como índice de linha
 * - getMusicasBet(): fallback normalizado para nome de aba com caracteres especiais
 * - getAgendaTour(): busca por nome da TOUR (coluna B=r[1]), fallback por artista (A=r[0])
 * - driveImg(): helper NOVO que normaliza todas as URLs do Google Drive
 * - Cache key atualizada para TOP_CHARTS_V12 (invalida cache anterior automaticamente)
 */

// ── IDs das Planilhas ──
const ID_PRINCIPAL     = '1tKO6qZcR1dS3VdF3mLZoVCnenV6N54-gu8HI_ZJILas';
const ID_CHARTS        = '1ThRhljmAS41JmVBPkPtYwe0JQHRx9Pih2PQAPT2ebyA';
const ID_ALBUMS        = '1wUoCpi7_VSbXBhu7XGsqs2ZAJBwcPrx_TFmTS0OMyhY';
const ID_EDICAO_CHARTS = '1GPajSCp1TkJDEDOGZIrXxgZuNuRs7545buFntyDlpL8';

// ── Utilitários ──
function ss()         { return SpreadsheetApp.openById(ID_PRINCIPAL); }
function aba(nome)    { return ss().getSheetByName(nome) || ss().insertSheet(nome); }
function jsonOut(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

/**
 * Normaliza URL do Google Drive para formato de visualização direta.
 * Aceita: links de compartilhamento, /file/d/ID, /uc?id=, drive.google.com/uc?export=view&id=
 */
function driveImg(url) {
  if (!url) return '';
  const s = String(url).trim();
  if (s.includes('drive.google.com/uc')) return s;
  const m = s.match(/[-\w]{25,}/);
  if (m) return 'https://drive.google.com/uc?export=view&id=' + m[0];
  return s;
}

// ── Mapeadores de linha ──

/**
 * ACTS: A=Nome(0), C=Foto(2), K=Gênero(10), N=País(13)
 * CORREÇÃO v12: foto=r[2] (C=Foto), sem campo 'status' (não existe no mapa de ACTS)
 */
function _mapActs(r) {
  return {
    nome:      String(r[0]  || '').trim(),
    foto:      driveImg(String(r[2]  || '')),
    genero:    String(r[10] || '').trim(),
    pais:      String(r[13] || '').trim(),
    fortuna:   parseFloat(r[4])  || 0,
    prestigio: parseFloat(r[5])  || 0,
    gravadora: String(r[14] || 'Independent').trim()
  };
}

/**
 * DB_ARTISTAS: A=Nome(0), B=Foto(1), C=Status(2), D=Saldo(3),
 *              H=Fortuna Total(7), I=Prestígio(8), J=Fadiga(9),
 *              K=telegram_id(10), L=Gênero(11), M=Gravadora(12)
 */
function _mapArtistaJogador(r) {
  return {
    nome:          String(r[0]  || '').trim(),
    foto:          driveImg(String(r[1]  || '')),
    status:        String(r[2]  || 'Livre'),
    saldo:         parseFloat(r[3])  || 0,
    descricao:     String(r[4]  || '').trim(),
    fortuna_real:  parseFloat(r[5])  || 0,
    fortuna_bens:  parseFloat(r[6])  || 0,
    fortuna_total: parseFloat(r[7])  || 0,
    prestigio:     parseFloat(r[8])  || 0,
    fadiga:        parseFloat(r[9])  || 0,
    telegram_id:   String(r[10] || '').trim(),
    genero:        String(r[11] || '').trim(),
    gravadora:     String(r[12] || 'Independent').trim()
  };
}

// ── ROTEADOR PRINCIPAL ──
function doGet(e) {
  try {
    const p    = e.parameter;
    const acao = p.acao || '';

    // Dashboard
    if (acao === 'meus_artistas')          return meusArtistas(p.telegram_id);
    if (acao === 'radar')                  return jsonOut(getRadar());
    if (acao === 'top_charts')             return jsonOut(getTopChartsAll());
    if (acao === 'vincular_artista')       return jsonOut(vincularArtista(p.nome, p.telegram_id));
    if (acao === 'artistas_sem_id')        return jsonOut(aba('DB_ARTISTAS').getDataRange().getValues().slice(1).filter(r => !r[10]).map(_mapArtistaJogador));

    // Artistas (global)
    if (acao === 'listar_todos')           return jsonOut(aba('ACTS').getDataRange().getValues().slice(1).map(_mapActs));

    // Rankings
    // acao=ranking          → fortuna total (Ranking de Fortuna)
    // acao=ranking_prestigio → prestígio (Ranking de Prestígio)
    // acao=charts           → Billboard Hot 100 real (Charts Billboard)
    if (acao === 'ranking')               return jsonOut(aba('DB_ARTISTAS').getDataRange().getValues().slice(1).map(_mapArtistaJogador).sort((a,b) => b.fortuna_total - a.fortuna_total).slice(0,50));
    if (acao === 'ranking_prestigio')     return jsonOut(aba('DB_ARTISTAS').getDataRange().getValues().slice(1).map(_mapArtistaJogador).sort((a,b) => b.prestigio - a.prestigio).slice(0,50));
    if (acao === 'charts')                return jsonOut(getChartsHot100());

    // Hall da Fama
    if (acao === 'hall_da_fama')          return jsonOut(aba('HALL_DA_FAMA').getDataRange().getValues().slice(1).map(r => ({ artista: r[0], premio: r[1], cat: r[2], obra: r[3], ano: r[4] })).reverse());

    // Gravadoras
    if (acao === 'gravadoras')            return jsonOut(getGravadoras());

    // Tours
    if (acao === 'listar_todas_tours')    return jsonOut(listarTodasTours());
    if (acao === 'agenda_tour')           return jsonOut(getAgendaTour(p.nome));
    if (acao === 'compra_unificada_tour') return jsonOut(comprarTour(p));

    // Álbuns
    if (acao === 'listar_albuns')         return jsonOut(listarAlbuns(p.nome));
    if (acao === 'get_album')             return jsonOut(getAlbum(p.id));
    if (acao === 'lancar_album')          return jsonOut(handleLancarAlbum(p.payload));
    if (acao === 'editar_album')          return jsonOut(handleEditarAlbum(p.payload));

    // Cinema
    if (acao === 'compra_cinema')         return jsonOut(comprarCinema(p));

    // Projetos (perfil)
    if (acao === 'projetos')              return jsonOut(getProjetosArtista(p.nome));

    // Market
    if (acao === 'listar_market')         return jsonOut(listarMarket());
    if (acao === 'mural')                 return jsonOut(getMural());
    if (acao === 'meus_bens')             return jsonOut(aba('INVENTARIO').getDataRange().getValues().slice(1).filter(r => String(r[1]).toLowerCase() === String(p.nome||'').toLowerCase()).map(r => ({ id: r[0], artista: r[1], cat: r[2], item: r[3], valor: parseFloat(r[4])||0 })));
    if (acao === 'comprar_market')        return jsonOut(comprarMarket(p));
    if (acao === 'comprar_item')          return jsonOut(comprarItemMural(p));
    if (acao === 'vender_bem')            return jsonOut(venderBem(p));
    if (acao === 'vender_composicao')     return jsonOut(venderComposicao(p));

    // Leilão
    if (acao === 'leilao')               return jsonOut(listarLeilao());
    if (acao === 'lance_leilao')         return jsonOut(darLance(p));
    if (acao === 'publicar_leilao')      return jsonOut(publicarLeilao(p));

    // Bets
    if (acao === 'musicas_bet')          return jsonOut(getMusicasBet());
    if (acao === 'bet')                  return jsonOut(registrarBet(p));
    if (acao === 'minhas_bets')          return jsonOut(minhasBets(p.nome));

    // Duelo
    if (acao === 'duelo')                return jsonOut(handleDuelo(p.artista1, p.artista2, p.ano));

    // Playlists
    if (acao === 'listar_playlists')     return jsonOut(listarPlaylists(p.telegram_id));
    if (acao === 'get_playlist')         return jsonOut(getPlaylist(p.id));
    if (acao === 'salvar_playlist')      return jsonOut(salvarPlaylist(p));
    if (acao === 'excluir_playlist')     return jsonOut(excluirPlaylist(p.id, p.telegram_id));

    // Rescisão
    if (acao === 'rescisao')             return jsonOut(handleRescisao(p));

    // Filantropia / Payola / Viral
    if (acao === 'filantropia')          return jsonOut(handleFilantropia(p));
    if (acao === 'payola')               return jsonOut(handlePayola(p));
    if (acao === 'viral')                return jsonOut(handleViral(p));

    // Busca músicas
    if (acao === 'buscar_musicas')       return jsonOut(buscarMusicas(p.q));

    return jsonOut({ erro: 'Ação Imperial Inválida: ' + acao });
  } catch(err) {
    return jsonOut({ erro: err.message, stack: err.stack });
  }
}

// ══════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════

function meusArtistas(tgId) {
  if (!tgId) return jsonOut([]);
  const ws    = ss().getSheetByName('DB_ARTISTAS');
  const data  = ws.getDataRange().getValues().slice(1);
  const idStr = String(tgId).trim();
  return jsonOut(
    data.filter(r => {
      const v = String(r[10] || '').trim();
      if (v === idStr) return true;
      if (v && !isNaN(v) && !isNaN(idStr)) return parseFloat(v) === parseFloat(idStr);
      return false;
    }).map(_mapArtistaJogador)
  );
}

function getRadar() {
  const rows = aba('RADAR_FEED').getDataRange().getValues().slice(1);
  return rows.slice(-30).map(r => ({
    timestamp: r[0],
    nome:      String(r[1] || '').trim(),
    acao:      String(r[2] || '').trim(),
    foto:      driveImg(String(r[3] || ''))
  }));
}

// ══════════════════════════════════════════════════════
//  TOP CHARTS (cache 60s)
//  Tracks (ID_CHARTS): B=Data(1), C=Posição(2), D=Música(3), H=Artista(7), P=Foto(15)
//  Billboard 200 (ID_ALBUMS / DADOS ÁLBUNS): B=Data(1), C=Posição(2), D=Álbum(3),
//                                             J=Foto(9), M=Artista(12)
// ══════════════════════════════════════════════════════

function getTopChartsAll() {
  const cache = CacheService.getScriptCache();
  const hit   = cache.get('TOP_CHARTS_V12');
  if (hit) return JSON.parse(hit);

  const cfgTracks = [
    { id: ID_CHARTS, sheet: 'BILLBOARD HOT 100', key: 'billboard_hot_100', iMusica: 3, iArtista: 7, iFoto: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=BILLBOARD%20HOT%20100' },
    { id: ID_CHARTS, sheet: 'SPOTIFY',            key: 'spotify',           iMusica: 3, iArtista: 7, iFoto: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=SPOTIFY' },
    { id: ID_CHARTS, sheet: 'APPLE MUSIC',         key: 'apple_music',       iMusica: 3, iArtista: 7, iFoto: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=APPLE%20MUSIC' },
    { id: ID_CHARTS, sheet: 'YOUTUBE',             key: 'youtube',           iMusica: 3, iArtista: 7, iFoto: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=YOUTUBE' },
    { id: ID_CHARTS, sheet: 'DIGITAL SALES',       key: 'digital_sales',     iMusica: 3, iArtista: 7, iFoto: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=DIGITAL%20SALES' },
  ];

  const results = {};

  cfgTracks.forEach(c => {
    try {
      const sh = SpreadsheetApp.openById(c.id).getSheetByName(c.sheet);
      if (!sh) { results[c.key + '_erro'] = 'Aba não encontrada: ' + c.sheet; return; }
      const data = sh.getDataRange().getValues();
      let topRow = null;
      for (let i = data.length - 1; i >= 1; i--) {
        if (parseInt(data[i][2]) === 1) { topRow = data[i]; break; }
      }
      if (topRow) {
        results[c.key] = {
          musica:  String(topRow[c.iMusica]  || '').trim(),
          artista: String(topRow[c.iArtista] || '').trim(),
          foto:    driveImg(String(topRow[c.iFoto] || '').trim()),
          data:    String(topRow[1]),
          url:     c.url
        };
      }
    } catch(err) { results[c.key + '_erro'] = err.message; }
  });

  // Billboard 200: planilha ID_ALBUMS, aba "DADOS ÁLBUNS"
  // J=Foto(índice 9), M=Artista(índice 12)
  try {
    const sh200 = SpreadsheetApp.openById(ID_ALBUMS).getSheetByName('DADOS ÁLBUNS');
    if (sh200) {
      const data = sh200.getDataRange().getValues();
      let topRow = null;
      for (let i = data.length - 1; i >= 1; i--) {
        if (parseInt(data[i][2]) === 1) { topRow = data[i]; break; }
      }
      if (topRow) {
        results['billboard_200'] = {
          musica:  String(topRow[3]  || '').trim(),
          artista: String(topRow[12] || '').trim(),
          foto:    driveImg(String(topRow[9] || '').trim()),
          data:    String(topRow[1]),
          url:     'https://empirerpg-max.github.io/central/charts.html?tab=DADOS%20%C3%81LBUNS'
        };
      }
    }
  } catch(err) { results['billboard_200_erro'] = err.message; }

  cache.put('TOP_CHARTS_V12', JSON.stringify(results), 60);
  return results;
}

// ══════════════════════════════════════════════════════
//  CHARTS HOT 100 REAL (acao=charts)
//  Retorna top 100 da semana mais recente da Billboard Hot 100
//  NOVO em v12 — v11 retornava artistas por prestígio (incorreto)
// ══════════════════════════════════════════════════════

function getChartsHot100() {
  try {
    const sh = SpreadsheetApp.openById(ID_CHARTS).getSheetByName('BILLBOARD HOT 100');
    if (!sh) return { erro: 'Aba BILLBOARD HOT 100 não encontrada' };
    const data = sh.getDataRange().getValues();

    let lastDate = '';
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][1]) { lastDate = String(data[i][1]); break; }
    }
    if (!lastDate) return [];

    return data.slice(1)
      .filter(r => String(r[1]) === lastDate && parseInt(r[2]) >= 1)
      .sort((a, b) => parseInt(a[2]) - parseInt(b[2]))
      .slice(0, 100)
      .map(r => ({
        posicao: parseInt(r[2]),
        musica:  String(r[3] || '').trim(),
        artista: String(r[7] || '').trim(),
        foto:    driveImg(String(r[15] || '').trim()),
        data:    String(r[1])
      }));
  } catch(err) { return { erro: err.message }; }
}

// ══════════════════════════════════════════════════════
//  TOURS
//  CONTROLE_TOURS: A=Artista(0), B=Nome Tour(1), C=Porte(2), D=Total Shows(3),
//                  E=?(4), F=Local atual(5), G=Arrecadação(6), H=Status(7), I=Datas JSON(8)
// ══════════════════════════════════════════════════════

function listarTodasTours() {
  return aba('CONTROLE_TOURS').getDataRange().getValues().slice(1)
    .filter(r => r[0])
    .map(r => ({
      artista:     String(r[0] || '').trim(),
      titulo:      String(r[1] || '').trim(),
      tipo:        String(r[2] || '').trim(),
      total_shows: parseInt(r[3]) || 0,
      local_atual: String(r[5] || '').trim(),
      arrecadacao: parseFloat(r[6]) || 0,
      status:      String(r[7] || '').trim(),
      agenda:      _parseJson(r[8])
    }));
}

/**
 * CORREÇÃO v12: busca por nome da TOUR (coluna B = r[1]) com fallback por artista (A = r[0]).
 * A v11 buscava apenas por artista, mas o parâmetro 'nome' no contexto de agenda_tour
 * é o nome da turnê.
 */
function getAgendaTour(nome) {
  if (!nome) return { erro: 'Nome não informado' };
  const nomeLower = nome.trim().toLowerCase();
  const data = aba('CONTROLE_TOURS').getDataRange().getValues().slice(1);

  let row = data.find(r => String(r[1]).trim().toLowerCase() === nomeLower);
  if (!row) row = data.find(r => String(r[0]).trim().toLowerCase() === nomeLower);
  if (!row) return { erro: 'Tour não encontrada para: ' + nome };

  return {
    artista:     String(row[0]).trim(),
    titulo:      String(row[1]).trim(),
    tipo:        String(row[2]).trim(),
    total_shows: parseInt(row[3]) || 0,
    local_atual: String(row[5]).trim(),
    arrecadacao: parseFloat(row[6]) || 0,
    status:      String(row[7]).trim(),
    agenda:      _parseJson(row[8])
  };
}

function _parseJson(val) {
  if (!val) return [];
  if (typeof val === 'object') return val;
  try { return JSON.parse(String(val)); } catch { return []; }
}

function comprarTour(p) {
  if (!p.nome || !p.titulo) return { ok: false, erro: 'Dados incompletos' };
  const CUSTO = { 'Arena': 2000, 'Estádio': 5000, 'Club': 500 };
  const custo = (CUSTO[p.tipo] || 1000) * (parseInt(p.qtd) || 10);
  const d = debitar(p.nome, custo);
  if (!d.ok) return d;
  aba('CONTROLE_TOURS').appendRow([p.nome, p.titulo, p.tipo||'Arena', parseInt(p.qtd)||10, p.continente||'', '', 0, 'Em andamento', '[]']);
  return { ok: true, custo };
}

// ══════════════════════════════════════════════════════
//  ÁLBUNS
//  Albuns: A=id(0), B=artista(1), C=titulo(2), D=genero(3), E=data(4),
//          F=descricao(5), G=capa_url(6), H=faixas_json(7), I=contracapa(8), J=encarte_json(9)
// ══════════════════════════════════════════════════════

function listarAlbuns(nome) {
  return aba('Albuns').getDataRange().getValues().slice(1)
    .filter(r => r[0] && (!nome || String(r[1]).toLowerCase() === String(nome).toLowerCase()))
    .map(r => ({
      id:        String(r[0]),
      artista:   String(r[1]).trim(),
      titulo:    String(r[2]).trim(),
      genero:    String(r[3]).trim(),
      data:      String(r[4]).trim(),
      descricao: String(r[5]).trim(),
      capa_url:  driveImg(String(r[6]).trim()),
      faixas:    _parseJson(r[7])
    }));
}

function getAlbum(id) {
  if (!id) return { erro: 'ID não informado' };
  const row = aba('Albuns').getDataRange().getValues().slice(1).find(r => String(r[0]) === String(id));
  if (!row) return { erro: 'Álbum não encontrado' };
  return {
    id:             row[0],
    artista:        row[1],
    titulo:         row[2],
    genero:         row[3],
    data:           row[4],
    descricao:      row[5],
    capa_url:       driveImg(String(row[6] || '')),
    faixas:         _parseJson(row[7]),
    contracapa_url: driveImg(String(row[8] || '')),
    encarte:        _parseJson(row[9])
  };
}

function handleLancarAlbum(payloadStr) {
  try {
    const p = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;
    if (!p || !p.artista || !p.titulo) return { ok: false, erro: 'Dados incompletos' };
    const id = 'ALB-' + Date.now();
    aba('Albuns').appendRow([
      id, p.artista, p.titulo, p.genero||'',
      p.data||new Date().toISOString().slice(0,10),
      p.descricao||'', p.capa_url||'',
      JSON.stringify(p.faixas||[]),
      p.contracapa_url||'',
      JSON.stringify(p.encarte||[])
    ]);
    return { ok: true, id };
  } catch(err) { return { ok: false, erro: err.message }; }
}

function handleEditarAlbum(payloadStr) {
  try {
    const p = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;
    if (!p || !p.id) return { ok: false, erro: 'ID não informado' };
    const ws   = aba('Albuns');
    const data = ws.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(p.id)) {
        const r = i + 1;
        ws.getRange(r, 2).setValue(p.artista          || data[i][1]);
        ws.getRange(r, 3).setValue(p.titulo           || data[i][2]);
        ws.getRange(r, 4).setValue(p.genero           || data[i][3]);
        ws.getRange(r, 5).setValue(p.data             || data[i][4]);
        ws.getRange(r, 6).setValue(p.descricao        || data[i][5]);
        ws.getRange(r, 7).setValue(p.capa_url         || data[i][6]);
        ws.getRange(r, 8).setValue(JSON.stringify(p.faixas || []));
        ws.getRange(r, 9).setValue(p.contracapa_url   || data[i][8] || '');
        ws.getRange(r,10).setValue(JSON.stringify(p.encarte || []));
        return { ok: true };
      }
    }
    return { ok: false, erro: 'Álbum não encontrado' };
  } catch(err) { return { ok: false, erro: err.message }; }
}

// ══════════════════════════════════════════════════════
//  PROJETOS DO ARTISTA (perfil)
// ══════════════════════════════════════════════════════

function getProjetosArtista(nome) {
  if (!nome) return { tours: [], cinema: [], albuns: [] };
  const n = nome.toLowerCase();

  const tours = aba('CONTROLE_TOURS').getDataRange().getValues().slice(1)
    .filter(r => String(r[0]).toLowerCase() === n)
    .map(r => ({ tipo: 'tour', artista: r[0], titulo: r[1], porte: r[2], local_atual: r[5], arrecadacao: parseFloat(r[6])||0, status: r[7] }));

  const cinema = aba('CONTROLE_CINEMA').getDataRange().getValues().slice(1)
    .filter(r => String(r[0]).toLowerCase() === n)
    .map(r => ({ tipo: 'cinema', artista: r[0], titulo: r[1], tipo_proj: r[2], genero: r[3], status: r[7], investimento: parseFloat(r[8])||0, arrecadacao: parseFloat(r[9])||0 }));

  const albuns = aba('Albuns').getDataRange().getValues().slice(1)
    .filter(r => String(r[1]).toLowerCase() === n)
    .map(r => ({ tipo: 'album', id: r[0], artista: r[1], titulo: r[2], genero: r[3], capa_url: driveImg(String(r[6] || '')) }));

  return { tours, cinema, albuns };
}

// ══════════════════════════════════════════════════════
//  MARKET
//  CONFIG_SISTEMA: A=Categoria(0), B=Item(1), C=Preco(2), D=Efeito(3), E=Descrição(4)
// ══════════════════════════════════════════════════════

function listarMarket() {
  return aba('CONFIG_SISTEMA').getDataRange().getValues().slice(1)
    .filter(r => r[1])
    .map(r => ({
      categoria: String(r[0] || '').trim(),
      item:      String(r[1] || '').trim(),
      preco:     parseFloat(r[2]) || 0,
      efeito:    String(r[3] || '').trim(),
      descricao: String(r[4] || '').trim()
    }));
}

/**
 * CORREÇÃO v12: id agora é o índice real da linha (i+2).
 * r[0] é o Vendedor, não o ID — estava causando lookup incorreto em comprarItemMural.
 * MURAL_MARKET: A=Vendedor(0), B=Titulo(1), C=Teaser(2), D=Preco(3), E=Status(4)
 */
function getMural() {
  return aba('MURAL_MARKET').getDataRange().getValues().slice(1)
    .map((r, i) => ({
      id:       i + 2,
      vendedor: String(r[0] || '').trim(),
      titulo:   String(r[1] || '').trim(),
      teaser:   String(r[2] || '').trim(),
      preco:    parseFloat(r[3]) || 0,
      status:   String(r[4] || '').trim()
    }))
    .filter(r => r.status === 'Disponível');
}

function comprarMarket(p) {
  const d = debitar(p.nome, parseFloat(p.preco) || 0);
  if (!d.ok) return d;
  aba('INVENTARIO').appendRow(['INV-'+Date.now(), p.nome, p.cat||p.categoria||'', p.item, p.preco, new Date(), 'Ativo']);
  return { ok: true };
}

function comprarItemMural(p) {
  const ws   = aba('MURAL_MARKET');
  const data = ws.getDataRange().getValues();
  const idx  = parseInt(p.id);
  if (!isNaN(idx) && idx >= 2 && idx <= data.length) {
    const row = data[idx - 1];
    if (String(row[4]).trim() !== 'Disponível') return { ok: false, erro: 'Item já vendido' };
    const preco = parseFloat(row[3]) || 0;
    const d = debitar(p.nome, preco);
    if (!d.ok) return d;
    ws.getRange(idx, 5).setValue('Vendido');
    ws.getRange(idx, 6).setValue(p.nome);
    creditarArtista(String(row[0]).trim(), preco);
    return { ok: true };
  }
  return { ok: false, erro: 'Item não encontrado (id: ' + p.id + ')' };
}

function venderComposicao(p) {
  if (!p.nome || !p.titulo || !p.preco) return { ok: false, erro: 'Dados incompletos' };
  aba('MURAL_MARKET').appendRow([p.nome, p.titulo, p.teaser||'', p.preco, 'Disponível', '', new Date()]);
  return { ok: true };
}

function venderBem(p) {
  const ws   = aba('INVENTARIO');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.id) && String(data[i][1]).toLowerCase() === String(p.nome).toLowerCase()) {
      const retorno = (parseFloat(data[i][4]) || 0) * 0.7;
      ws.getRange(i+1, 7).setValue('Vendido');
      creditarArtista(p.nome, retorno);
      return { ok: true, retorno };
    }
  }
  return { ok: false, erro: 'Bem não encontrado' };
}

// ══════════════════════════════════════════════════════
//  LEILÃO
//  LEILAO: A=id(0), B=Vendedor(1), C=Descricao(2), D=Lance Minimo(3),
//          E=Lance Atual(4), F=Maior Licitante(5), G=Status(6), H=Expiracao(7)
// ══════════════════════════════════════════════════════

function listarLeilao() {
  return aba('LEILAO').getDataRange().getValues().slice(1)
    .filter(r => String(r[6]).trim() === 'Ativo')
    .map(r => ({
      id:              String(r[0]),
      vendedor:        String(r[1]).trim(),
      descricao:       String(r[2]).trim(),
      lance_minimo:    parseFloat(r[3]) || 0,
      lance_atual:     parseFloat(r[4]) || 0,
      maior_licitante: String(r[5]).trim(),
      status:          String(r[6]).trim(),
      expiracao:       String(r[7] || '').trim()
    }));
}

function darLance(p) {
  const ws   = aba('LEILAO');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.itemId)) {
      const atual = parseFloat(data[i][4]) || parseFloat(data[i][3]) || 0;
      const novo  = parseFloat(p.valor) || 0;
      if (novo <= atual) return { ok: false, erro: 'Lance deve ser maior que ' + atual };
      ws.getRange(i+1, 5).setValue(novo);
      ws.getRange(i+1, 6).setValue(p.nome || '');
      return { ok: true, novo_lance: novo };
    }
  }
  return { ok: false, erro: 'Item não encontrado' };
}

function publicarLeilao(p) {
  if (!p.nome || !p.descricao || !p.lanceMini) return { ok: false, erro: 'Dados incompletos' };
  const id = 'LEI-' + Date.now();
  aba('LEILAO').appendRow([id, p.nome, p.descricao, parseFloat(p.lanceMini)||0, 0, '', 'Ativo', p.expiracao||'']);
  return { ok: true, id };
}

// ══════════════════════════════════════════════════════
//  BETS
//  EDIÇÃO CHARTS (ID_EDICAO_CHARTS): coluna A=Semana, B=músicas
//  BETS: A=ID jogador(0), B=Jogador(1), C=Semana(2), D=Valor(3), E=Previsão(4), I=Resultado(8)
// ══════════════════════════════════════════════════════

/**
 * CORREÇÃO v12: fallback robusto para nome de aba com acentos/cedilha.
 * getSheetByName pode retornar null dependendo do encoding — busca normalizada como fallback.
 */
function getMusicasBet() {
  try {
    const ss2 = SpreadsheetApp.openById(ID_EDICAO_CHARTS);
    let sh = ss2.getSheetByName('EDIÇÃO CHARTS');

    if (!sh) {
      const sheets = ss2.getSheets();
      for (const s of sheets) {
        const nm = s.getName().trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (nm === 'EDICAO CHARTS' || nm.includes('EDICAO')) { sh = s; break; }
      }
    }

    if (!sh) return { semana: '', musicas: [], erro: 'Aba EDIÇÃO CHARTS não encontrada' };

    const data    = sh.getDataRange().getValues();
    const semana  = data[1] ? String(data[1][0] || '').trim() : '';
    const musicas = data.slice(1).map(r => String(r[1] || '').trim()).filter(Boolean);
    return { semana, musicas };
  } catch(err) {
    return { semana: '', musicas: [], erro: err.message };
  }
}

function registrarBet(p) {
  if (!p.nome || !p.valor) return { ok: false, erro: 'Dados incompletos' };
  const d = debitar(p.nome, parseFloat(p.valor) || 0);
  if (!d.ok) return d;
  aba('BETS').appendRow([p.telegram_id||'', p.nome, p.semana||'', parseFloat(p.valor)||0, p.previsoes||'']);
  return { ok: true };
}

function minhasBets(nome) {
  if (!nome) return [];
  const n = nome.toLowerCase();
  return aba('BETS').getDataRange().getValues().slice(1)
    .filter(r => String(r[1]).toLowerCase() === n)
    .map(r => ({
      artista:   String(r[1]).trim(),
      semana:    String(r[2]).trim(),
      valor:     parseFloat(r[3]) || 0,
      previsao:  String(r[4]).trim(),
      resultado: String(r[8] || '').trim()
    }));
}

// ══════════════════════════════════════════════════════
//  GRAVADORAS
// ══════════════════════════════════════════════════════

function getGravadoras() {
  const data = aba('DB_ARTISTAS').getDataRange().getValues().slice(1);
  const map  = {};
  data.forEach(r => {
    const grav = String(r[12] || 'Independent').replace(/\s*#\d+$/, '').trim();
    if (!map[grav]) map[grav] = { nome: grav, artistas: [], total: 0 };
    map[grav].artistas.push({ nome: String(r[0]).trim(), foto: driveImg(String(r[1]).trim()) });
    map[grav].total += parseFloat(r[7]) || 0;
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
}

// ══════════════════════════════════════════════════════
//  DUELO
//  Peso por posição conforme MAPA:
//  1=30, 2=28, 3=26, 4=24, 5=22, 6=21, 7=20, 8=19, 9=18, 10=17
//  11-20=14, 21-30=10, 31-40=5, 41-50=1
// ══════════════════════════════════════════════════════

function _pesoPos(pos) {
  if (pos === 1)  return 30;
  if (pos === 2)  return 28;
  if (pos === 3)  return 26;
  if (pos === 4)  return 24;
  if (pos === 5)  return 22;
  if (pos >= 6  && pos <= 10) return 22 - (pos - 5);
  if (pos >= 11 && pos <= 20) return 14;
  if (pos >= 21 && pos <= 30) return 10;
  if (pos >= 31 && pos <= 40) return 5;
  if (pos >= 41 && pos <= 50) return 1;
  return 0;
}

function handleDuelo(a1, a2, ano) {
  const sh   = SpreadsheetApp.openById(ID_CHARTS).getSheetByName('BILLBOARD HOT 100');
  const data = sh.getDataRange().getValues();
  let score1 = 0, score2 = 0;
  const n1 = (a1 || '').toLowerCase();
  const n2 = (a2 || '').toLowerCase();

  data.slice(1).forEach(r => {
    if (!ano || String(r[1]).includes(String(ano))) {
      const pos = parseInt(r[2]);
      const art = String(r[7]).toLowerCase();
      const w   = _pesoPos(pos);
      if (w > 0) {
        if (art.includes(n1)) score1 += w;
        if (art.includes(n2)) score2 += w;
      }
    }
  });
  return { a1, a2, score1, score2, winner: score1 >= score2 ? a1 : a2 };
}

// ══════════════════════════════════════════════════════
//  PLAYLISTS
//  Playlists: A=id(0), B=titulo(1), C=descricao(2), D=capa_url(3),
//             E=nome jogador(4), F=data(5), G=tracks_json(6)
// ══════════════════════════════════════════════════════

function listarPlaylists(telegramId) {
  if (!telegramId) return [];
  const artistas = ss().getSheetByName('DB_ARTISTAS').getDataRange().getValues().slice(1);
  const artista  = artistas.find(r => String(r[10]).trim() === String(telegramId).trim());
  const nome     = artista ? String(artista[0]).trim().toLowerCase() : '';
  return aba('Playlists').getDataRange().getValues().slice(1)
    .filter(r => String(r[4]).trim().toLowerCase() === nome)
    .map(r => ({
      id:        r[0],
      titulo:    r[1],
      descricao: r[2],
      capa_url:  driveImg(String(r[3] || '')),
      nome:      r[4],
      data:      r[5],
      faixas:    _parseJson(r[6])
    }));
}

function getPlaylist(id) {
  if (!id) return { erro: 'ID não informado' };
  const row = aba('Playlists').getDataRange().getValues().slice(1).find(r => String(r[0]) === String(id));
  if (!row) return { erro: 'Playlist não encontrada' };
  return {
    id:        row[0],
    titulo:    row[1],
    descricao: row[2],
    capa_url:  driveImg(String(row[3] || '')),
    nome:      row[4],
    data:      row[5],
    faixas:    _parseJson(row[6])
  };
}

function salvarPlaylist(p) {
  if (!p.titulo) return { ok: false, erro: 'Dados incompletos' };
  const artistas = ss().getSheetByName('DB_ARTISTAS').getDataRange().getValues().slice(1);
  const artista  = p.telegram_id ? artistas.find(r => String(r[10]).trim() === String(p.telegram_id).trim()) : null;
  const nome     = artista ? String(artista[0]).trim() : (p.nome || '');
  const id       = 'PL-' + Date.now();
  aba('Playlists').appendRow([id, p.titulo, p.descricao||'', p.capa_url||'', nome, new Date().toISOString().slice(0,10), p.tracks_json||'[]']);
  return { ok: true, id };
}

function excluirPlaylist(id, telegramId) {
  const ws   = aba('Playlists');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      ws.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, erro: 'Playlist não encontrada' };
}

// ══════════════════════════════════════════════════════
//  RESCISÃO
// ══════════════════════════════════════════════════════

function handleRescisao(p) {
  if (!p.nome) return { ok: false, erro: 'Nome não informado' };
  const ws   = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  const MULTA = 500;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(p.nome).toLowerCase()) {
      const d = debitar(p.nome, MULTA);
      if (!d.ok) return d;
      ws.getRange(i+1, 13).setValue(p.destino || 'Independent');
      return { ok: true, nova_gravadora: p.destino || 'Independent', multa: MULTA };
    }
  }
  return { ok: false, erro: 'Artista não encontrado' };
}

// ══════════════════════════════════════════════════════
//  CINEMA
//  CONTROLE_CINEMA: A=Artista(0), B=Titulo(1), C=Tipo(2), D=Genero(3),
//                   H=Status(7), I=Investimento(8), J=Arrecadacao(9)
// ══════════════════════════════════════════════════════

function comprarCinema(p) {
  if (!p.nome || !p.titulo) return { ok: false, erro: 'Dados incompletos' };
  const CUSTO = { 'Filme': 1500, 'Série': 2000, 'Reality': 800 };
  const custo = CUSTO[p.tipo] || 1000;
  const d = debitar(p.nome, custo);
  if (!d.ok) return d;
  aba('CONTROLE_CINEMA').appendRow([p.nome, p.titulo, p.tipo||'', p.genero||'', new Date().toISOString().slice(0,10), '', '', 'Em Produção', custo, 0]);
  return { ok: true, custo };
}

// ══════════════════════════════════════════════════════
//  FILANTROPIA / PAYOLA / VIRAL
// ══════════════════════════════════════════════════════

function handleFilantropia(p) {
  const d = debitar(p.artista, parseFloat(p.valor) || 0);
  if (!d.ok) return d;
  try { aba('FILANTROPIA').appendRow([p.artista, p.causa, p.valor, new Date()]); } catch(e) {}
  return { ok: true };
}

function handlePayola(p) {
  const d = debitar(p.nome, parseFloat(p.valor) || 0);
  if (!d.ok) return d;
  return { ok: true };
}

function handleViral(p) {
  return { ok: true, msg: 'Viral registrado para ' + (p.artista || p.nome) };
}

// ══════════════════════════════════════════════════════
//  BUSCA DE MÚSICAS
// ══════════════════════════════════════════════════════

function buscarMusicas(q) {
  if (!q) return [];
  const q2   = q.toLowerCase();
  const sh   = SpreadsheetApp.openById(ID_CHARTS).getSheetByName('BILLBOARD HOT 100');
  const data = sh.getDataRange().getValues().slice(1);
  const visto  = new Set();
  const result = [];
  for (const r of data) {
    const musica = String(r[3] || '').trim();
    if (musica.toLowerCase().includes(q2) && !visto.has(musica)) {
      visto.add(musica);
      result.push({ musica, artista: String(r[7]).trim() });
      if (result.length >= 20) break;
    }
  }
  return result;
}

// ══════════════════════════════════════════════════════
//  FINANCEIRO (primitivos)
// ══════════════════════════════════════════════════════

function debitar(nome, valor) {
  const ws   = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === String(nome).trim().toLowerCase()) {
      const cel = ws.getRange(i+1, 4);
      const s   = parseFloat(cel.getValue()) || 0;
      if (s < valor) return { ok: false, msg: 'Empire Coin insuficiente. Saldo: ' + s + ', Necessário: ' + valor };
      cel.setValue(s - valor);
      return { ok: true };
    }
  }
  return { ok: false, msg: 'Artista não encontrado: ' + nome };
}

function creditarArtista(nome, valor) {
  const ws   = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === nome.toLowerCase()) {
      const cel = ws.getRange(i+1, 4);
      cel.setValue((parseFloat(cel.getValue()) || 0) + valor);
      return true;
    }
  }
  return false;
}

// ── VÍNCULO ──
function vincularArtista(nome, tgId) {
  const ws   = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === String(nome).trim().toLowerCase()) {
      ws.getRange(i+1, 11).setValue(String(tgId));
      return { ok: true };
    }
  }
  return { ok: false, erro: 'Artista não encontrado: ' + nome };
}
