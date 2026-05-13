/**
 * EMPIRE HUB - MOTOR BACKEND INTEGRAL (GOOGLE APPS SCRIPT)
 * Versão: 10.0.0 "Legado Imperial"
 * 
 * SISTEMA UNIFICADO DE CONTROLE - NÃO REDUZIR
 */

// -- CONFIGURAÇÕES DE IDs (MAPA DO APLICATIVO) --
const ID_PRINCIPAL      = '1tKO6qZcR1dS3VdF3mLZoVCnenV6N54-gu8HI_ZJILas';
const ID_CHARTS         = '1ThRhljmAS41JmVBPkPtYwe0JQHRx9Pih2PQAPT2ebyA';
const ID_ALBUMS         = '1wUoCpi7_VSbXBhu7XGsqs2ZAJBwcPrx_TFmTS0OMyhY';
const ID_EDICAO_CHARTS  = '1GPajSCp1TkJDEDOGZIrXxgZuNuRs7545buFntyDlpL8';

function ss() { return SpreadsheetApp.openById(ID_PRINCIPAL); }
function aba(nome) { return ss().getSheetByName(nome) || ss().insertSheet(nome); }

function jsonOut(obj) { 
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); 
}

// ── MAPEAMENTOS E DEFINIÇÕES DO MAPA ──

function _mapActs(r) {
  return {
    nome: String(r[0]||'').trim(),
    foto: String(r[2]||r[1]||''), // Mapa diz C=Foto
    status: String(r[2]||'Livre'),
    genero: String(r[10]||'').trim(),
    pais: String(r[13]||'').trim(),
    fortuna: parseFloat(r[4])||0,
    prestigio: parseFloat(r[5])||0
  };
}

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
    gravadora: String(r[12]||'Independent')
  };
}

// ── ROTEADOR PRINCIPAL ──

function doGet(e) {
  try {
    const p = e.parameter;
    const acao = p.acao || '';

    // DASHBOARD & BUSCA
    if (acao === 'listar_todos')         return jsonOut(aba('ACTS').getDataRange().getValues().slice(1).map(_mapActs));
    if (acao === 'artistas_sem_id')      return jsonOut(aba('DB_ARTISTAS').getDataRange().getValues().slice(1).filter(r => !r[10]).map(_mapArtistaJogador));
    if (acao === 'meus_artistas')        return meusArtistas(p.telegram_id);
    if (acao === 'radar')                return jsonOut(aba('RADAR_FEED').getDataRange().getValues().slice(1).slice(0, 30).map(r => ({ timestamp: r[0], nome: r[1], acao: r[2], foto: r[3] })));
    if (acao === 'top_charts')           return jsonOut(getTopChartsAll());
    if (acao === 'vincular_artista')     return jsonOut(vincularArtista(p.nome, p.telegram_id));

    // RANKINGS & HALL
    if (acao === 'ranking')              return jsonOut(aba('DB_ARTISTAS').getDataRange().getValues().slice(1).map(_mapArtistaJogador).sort((a,b) => b.fortuna_total - a.fortuna_total).slice(0, 50));
    if (acao === 'charts')               return jsonOut(aba('DB_ARTISTAS').getDataRange().getValues().slice(1).map(_mapArtistaJogador).sort((a,b) => b.prestigio - a.prestigio).slice(0, 50));
    if (acao === 'hall_da_fama')         return jsonOut(aba('HALL_DA_FAMA').getDataRange().getValues().slice(1).map(r => ({ artista: r[0], premio: r[1], cat: r[2], obra: r[3], ano: r[4] })).reverse());

    // ECONOMIA & MARKET
    if (acao === 'listar_market')        return jsonOut(aba('CONFIG_SISTEMA').getDataRange().getValues().slice(1).filter(r => r[0] === 'MARKET').map(r => ({ cat: r[0], item: r[1], preco: r[2], efeito: r[3] })));
    if (acao === 'mural')                return jsonOut(aba('MURAL_MARKET').getDataRange().getValues().slice(1).filter(r => r[4] === 'Disponível').map(r => ({ vendedor: r[0], titulo: r[1], teaser: r[2], preco: r[3] })));
    if (acao === 'comprar_market')        return jsonOut(comprarMarket(p));
    if (acao === 'vender_bem')            return jsonOut(venderBem(p));
    if (acao === 'meus_bens')            return jsonOut(aba('INVENTARIO').getDataRange().getValues().slice(1).filter(r => String(r[1]).toLowerCase() === String(p.nome).toLowerCase()).map(r => ({ id: r[0], cat: r[2], item: r[3], valor: r[4] })));

    // TOURS, CINEMA & ÁLBUNS
    if (acao === 'compra_unificada_tour') return jsonOut(comprarTour(p));
    if (acao === 'compra_cinema')         return jsonOut(comprarCinema(p));
    if (acao === 'projetos')             return jsonOut(getProjetosArtista(p.nome));
    if (acao === 'lancar_album')         return jsonOut(handleLancarAlbum(p.payload));
    if (acao === 'listar_albuns')         return jsonOut(aba('Albuns').getDataRange().getValues().slice(1).filter(r => !p.nome || String(r[1]).toLowerCase() === p.nome.toLowerCase()).map(r => ({ id: r[0], artista: r[1], titulo: r[2], capa_url: r[6] })));

    // DUELO
    if (acao === 'duelo')                return jsonOut(handleDuelo(p.artista1, p.artista2, p.ano));

    // ADM
    if (acao === 'bater_ponto')          return jsonOut(baterPonto(p));

    return jsonOut({ erro: 'Ação Imperial Inválida' });
  } catch(err) { return jsonOut({ erro: err.message }); }
}

// ── BLOCO: INTEGRAÇÃO E VÍNCULO ──

function meusArtistas(tgId) {
  if (!tgId) return jsonOut([]);
  const ws = ss().getSheetByName('DB_ARTISTAS');
  const data = ws.getDataRange().getValues().slice(1);
  const idStr = String(tgId).trim();

  const filtrados = data.filter(r => {
    const valPlanilha = String(r[10] || '').trim(); 
    if (valPlanilha === idStr) return true;
    if (valPlanilha && !isNaN(valPlanilha) && !isNaN(idStr)) {
      return parseFloat(valPlanilha) === parseFloat(idStr);
    }
    return false;
  }).map(_mapArtistaJogador);

  return jsonOut(filtrados);
}

function vincularArtista(nome, tgId) {
  const ws = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === String(nome).trim().toLowerCase()) {
      ws.getRange(i + 1, 11).setValue(String(tgId)); // SALVA NA COLUNA K
      return { ok: true };
    }
  }
  return { ok: false, erro: 'Artista não localizado na planilha principal.' };
}

// ── BLOCO: CHARTS & BILLBOARD (OTIMIZADO COM CACHE) ──

function getTopChartsAll() {
  const cache = CacheService.getScriptCache();
  const cachedData = cache.get("TOP_CHARTS_GLOBAL_V2");
  if (cachedData) return JSON.parse(cachedData);

  const configs = [
    { id: ID_CHARTS, sheet: 'BILLBOARD HOT 100', key: 'billboard_hot_100', map: { m: 3, a: 7, f: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=BILLBOARD%20HOT%20100' } },
    { id: ID_CHARTS, sheet: 'SPOTIFY', key: 'spotify', map: { m: 3, a: 7, f: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=SPOTIFY' } },
    { id: ID_CHARTS, sheet: 'APPLE MUSIC', key: 'apple_music', map: { m: 3, a: 7, f: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=APPLE%20MUSIC' } },
    { id: ID_CHARTS, sheet: 'YOUTUBE', key: 'youtube', map: { m: 3, a: 7, f: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=YOUTUBE' } },
    { id: ID_CHARTS, sheet: 'DIGITAL SALES', key: 'digital_sales', map: { m: 3, a: 7, f: 15, url: 'https://empirerpg-max.github.io/central/charts.html?tab=DIGITAL%20SALES' } },
    { id: ID_ALBUMS, sheet: 'DADOS ÁLBUNS', key: 'billboard_200', map: { m: 3, a: 12, f: 9, url: 'https://empirerpg-max.github.io/central/charts.html?tab=DADOS%20%C3%81LBUNS' } }
  ];
  
  const results = {};
  configs.forEach(c => {
    try {
      const sh = SpreadsheetApp.openById(c.id).getSheetByName(c.sheet);
      if (!sh) return;
      const data = sh.getDataRange().getValues();
      if (data.length < 2) return;
      
      let topRow = null;
      for (let i = data.length - 1; i >= 1; i--) {
        if (parseInt(data[i][2]) === 1) { 
          topRow = data[i]; 
          break; 
        }
      }
      
      if (topRow) {
         results[c.key] = {
           musica: String(topRow[c.map.m] || '').trim(),
           artista: String(topRow[c.map.a] || '').trim(),
           foto: String(topRow[c.map.f] || '').trim(),
           data: String(topRow[1]),
           url: c.url
         };
      }
    } catch(e) {
      results[c.key + '_error'] = e.message;
    }
  });

  cache.put("TOP_CHARTS_GLOBAL_V2", JSON.stringify(results), 60);
  return results;
}

// ── BLOCO: DUELO ──

function handleDuelo(a1, a2, ano) {
  const ws = SpreadsheetApp.openById(ID_CHARTS).getSheetByName('BILLBOARD HOT 100');
  const data = ws.getDataRange().getValues();
  let score1 = 0, score2 = 0;

  data.forEach(r => {
    const dStr = String(r[1]);
    if (dStr.includes(ano)) {
      const pos = parseInt(r[2]);
      const art = String(r[7]).toLowerCase();
      let weight = 0;
      if (pos === 1) weight = 30;
      else if (pos === 2) weight = 28;
      else if (pos === 3) weight = 26;
      else if (pos === 4) weight = 24;
      else if (pos === 5) weight = 22;
      else if (pos >= 6 && pos <= 10) weight = 22 - (pos - 5);
      else if (pos >= 11 && pos <= 20) weight = 14;
      else if (pos >= 21 && pos <= 30) weight = 10;
      else if (pos >= 31 && pos <= 40) weight = 5;
      else if (pos >= 41 && pos <= 50) weight = 1;

      if (art.includes(a1.toLowerCase())) score1 += weight;
      if (art.includes(a2.toLowerCase())) score2 += weight;
    }
  });
  return { a1, a2, score1, score2, winner: score1 > score2 ? a1 : a2 };
}

// ── FINANCEIRO E ESCRITA ──

function debitar(nome, valor) {
  const ws = aba('DB_ARTISTAS');
  const data = ws.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === nome.toLowerCase()) {
      const sObj = ws.getRange(i+1, 4);
      const s = parseFloat(sObj.getValue()) || 0;
      if (s < valor) return { ok: false, msg: 'Empire Coin insuficiente.' };
      sObj.setValue(s - valor);
      return { ok: true };
    }
  }
  return { ok: false, msg: 'Artista não encontrado.' };
}

function comprarMarket(p) {
  const d = debitar(p.nome, parseFloat(p.preco));
  if (!d.ok) return d;
  aba('INVENTARIO').appendRow(['INV-'+Date.now(), p.nome, p.cat, p.item, p.preco, new Date(), 'Ativo']);
  return { ok: true };
}

function comprarTour(p) {
  const d = debitar(p.nome, 50000); 
  if (!d.ok) return d;
  aba('CONTROLE_TOURS').appendRow([p.nome, p.titulo, p.tipo, p.qtd, 0, 'Preparação', 0, 'Em Rota', '[]']);
  return { ok: true };
}

function handleLancarAlbum(payload) {
  const p = JSON.parse(payload);
  const id = 'ALB-' + Utilities.getUuid().slice(0, 5);
  aba("Albuns").appendRow([id, p.artista, p.titulo, p.genero, '', p.descricao, p.capa_url]);
  return { ok: true, id };
}

function getProjetosArtista(nome) {
  const c = aba('CONTROLE_CINEMA').getDataRange().getValues().slice(1).filter(r => String(r[0]).toLowerCase() === nome.toLowerCase());
  const t = aba('CONTROLE_TOURS').getDataRange().getValues().slice(1).filter(r => String(r[0]).toLowerCase() === nome.toLowerCase());
  return { cinema: c.map(r => ({ t: r[1], s: r[7] })), tours: t.map(r => ({ t: r[1], s: r[7] })) };
}

function baterPonto(p) { aba('REGISTRO').appendRow([new Date(), p.nome_off, p.conteudo, p.tipo, '', p.codigo]); return { ok: true }; }

