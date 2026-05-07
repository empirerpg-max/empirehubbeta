# Empire Hub — Fase 1: Limpeza + Auditoria + Roadmap

## Como vamos trabalhar

Você fica no seu `index.html` único hospedado no GitHub Pages (sem migrar pra React, sem custo extra de Lovable). Eu edito o arquivo aqui, te devolvo o resultado, você sobe no repo. Plano free é mais que suficiente pra esse fluxo.

---

## Parte 1 — Remover o Painel Operacional

Vou apagar do `index.html`:

- O card "Painel Operacional" da home (linhas ~411–415).
- A tela `screen-ops` e todas as sub-telas: `screen-ops-ponto`, `screen-ops-pontos`, `screen-ops-ecoin`, `screen-ops-musica`, `screen-ops-album`, `screen-ops-retro`, `screen-sem-id`.
- Os handlers no `navigate()`: `initOpsPanel`, `initPontoForm`, `loadPontosPainel`, `loadEcoinForm`, `initMusicaForm`, `initAlbumForm`.
- Funções JS associadas e qualquer `fetch` para endpoints do Apps Script que servem só ao operacional.
- CSS órfão (classes usadas só pelas telas removidas).

Resultado: home enxuta com 9 cards (Artistas, Radar, Charts, Duelo, Ranking, News, Gravadoras, Hall, Tutorial) e arquivo bem mais leve.

---

## Parte 2 — Auditoria do que está funcionando + gaps

Vou ler tela por tela do que sobrou e te entregar um **relatório em markdown** com, pra cada tela:

- O que ela faz hoje (status: funciona / parcial / quebrada).
- Gaps de UX (navegação confusa, falta de feedback, loading, estados vazios).
- Gaps de dados (campos faltando, integração Sheets incompleta).
- Sugestões priorizadas (alta / média / baixa).

Telas auditadas: Home, Artistas, Artist Dashboard, Agenda, Finanças (Tours/Cinema/Imóveis), MyBets, Hub, Market, Projects, Charts, Duelo, Ranking, News, Gravadoras, Label Artists, Radar, Hall da Fama, Tutorial.

Esse relatório vira a base pra você decidir o que melhorar primeiro.

---

## Parte 3 — Roadmap escrito (sem implementar)

Três documentos curtos pra você aprovar antes da Fase 2:

### 3a. Automações no Google Sheets / Apps Script

- Triggers úteis (onEdit, time-based) pra atualizar charts, fadiga, fortuna sem ação manual.
- Cálculos automáticos: prestígio, ranking, decay de fadiga, atualização semanal de Billboard simulado.
- Web App endpoints (doGet/doPost) que o app pode chamar — padrão de resposta JSON, CORS, cache.
- Boas práticas pra não estourar quota (batch reads, PropertiesService como cache).

### 3b. Sugestões de novos jogos / mecânicas pro app

Lista de 6–8 ideias leves, cada uma com: o que é, como integra com Sheets, esforço estimado. Exemplos que tenho em mente: previsão semanal de #1 do chart, leilão de features, "qual álbum vendeu mais?", mini-quiz de prestígio, evento sazonal (Grammy/Oscar), aposta em duelos, descoberta de talento (rookie draft).

### 3c. Player de música via link do Drive

Fluxo escolhido: jogador cola link público do Drive, app toca embutido.

- Como converter `https://drive.google.com/file/d/{id}/view` no link de stream que toca em `<audio>`.
- Validação do link no envio (regex + checagem de permissão pública).
- Tela "Biblioteca do Artista": lista das músicas enviadas, player flutuante minimalista (play/pause/progress), próximas/anteriores.
- Onde guardar: nova aba `Musicas` no Sheets (artista, título, link, data, plays).
- Limites e fallback: se o Drive bloquear (link privado), mostrar erro claro pro jogador corrigir.

---

## Entregáveis desta fase

1. `index.html` novo, sem o operacional, pronto pra commit no GitHub.
2. `auditoria.md` com o estado e gaps de cada tela.
3. `roadmap-automacoes.md`, `roadmap-jogos.md`, `roadmap-player-musica.md`.

Depois você escolhe por onde seguir na Fase 2.

## Detalhes técnicos

- Edição direta no `index.html` (mantém arquitetura atual: HTML+CSS+JS inline + Telegram WebApp SDK + chamadas fetch ao Apps Script).
- Sem dependência nova, sem build, sem mudança no fluxo de deploy do GitHub Pages.
- Os arquivos `.md` ficam em `/mnt/documents/` pra você baixar.
