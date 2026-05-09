# 🌟 Artistic Oasis - Manual de Operações

Bem-vindo ao **Artistic Oasis**, o simulador definitivo de império musical e artístico integrado ao Telegram. Este documento serve como guia fixo para entender todas as engrenagens do aplicativo.

---

## 🛠️ Visão Geral do Sistema

O app é uma plataforma de RPG e gerenciamento onde você controla a carreira de artistas, lança projetos multimídia (música, cinema, tours) e gerencia um império financeiro através de ações e leilões.

### 🔗 Integrações Chave

- **Telegram WebApp**: O app identifica automaticamente seu `user_id` e `username` para carregar seus dados específicos.
- **Google Drive**: Todas as mídias (capas de álbuns, músicas em MP3, imagens de encarte) são puxadas diretamente de links públicos do Google Drive.
- **API Backend**: O app se comunica com um endpoint externo para persistir lançamentos, compras e rankings.

---

## 🗺️ Mapa de Funcionalidades (Onde está o quê?)

### 1. 🏠 Dashboard (Home) - `/`

A página inicial oferece uma visão rápida do seu progresso:

- **Saudação Dinâmica**: Muda conforme o horário (Bom dia, Boa tarde, Boa noite, Boa madrugada).
- **Acontecendo Agora**: Feed em tempo real das atividades dos artistas (compras, leilões, lançamentos).
- **Tutorial**: Guia para novos magnatas.
- **Navegação Rápida**: Shortcuts para todas as áreas do império.

### 2. 🎤 Gestão de Artistas - `/artistas`

- **Perfil do Artista (`/artistas/$nome`)**: Visão completa da carreira.
- **Patrimônio/Bens (`/artistas/$nome/bens`)**: Lista de itens de luxo e propriedades.
- **Rescisão (`/rescisao`)**: Saia de uma gravadora pagando multa contratual ou mude para um novo selo.

### 3. 🚀 Central de Lançamentos (Ações)

- **Lançar Álbum (`/acoes/album`)**: Sistema para criar discos com capas, faixas e encartes.
- **Editar Álbum (`/album/$id/editar`)**: **IMPORTANTE:** Apenas o usuário que lançou o álbum (vinculado ao seu Telegram ID) pode editar suas informações.
- **Central da Payola (`/payola`)**: Invista em rádios para garantir bônus de audiência e subir nos charts.

### 4. 📈 Economia e Mercado

- **Empire Market (`/market`)**: Compre boosts, itens de luxo e imóveis.
- **Incubadora de Empresas (`/incubadora`)**: Funde empresas em diferentes setores (Tech, Beleza, Alimento) para gerar lucro passivo com base na volatilidade.
- **Empire Bet (`/bet`)**: Aposte nas posições da Billboard Hot 100 da próxima semana.
- **Leilões (`/leiloes`)**: Disputas por itens raros.

### 5. 🎮 Diversão e Social

- **Duelo (`/duelo`)**: Mini-game de batalha entre artistas.
- **Playlists (`/playlists`)**: Qualquer jogador pode criar e compartilhar playlists com as músicas disponíveis na plataforma.
- **Charts & Rankings**: Acompanhe o prestígio mundial e a fortuna total dos impérios.

---

## 💡 Guia Rápido de Uso

### Como lançar um Álbum com Sucesso?

1. Vá em **Lançar Álbum**.
2. Preencha o título e gênero.
3. No campo **Capa**, cole o link de compartilhamento do Google Drive (o app converte automaticamente para exibição).
4. Adicione as faixas: coloque o nome e o link do arquivo MP3 no Drive.
5. Se quiser um impacto maior, adicione fotos no **Encarte**.

### Como aumentar seu Patrimônio?

- Monitore o **Mercado**. Compre ações de artistas em ascensão e venda no topo após um grande lançamento.
- Participe de **Leilões** para adquirir bens que valorizam o perfil do seu artista.

---

## ⚙️ Especificações Técnicas (Para o Desenvolvedor)

- **Framework**: React 19 com TypeScript.
- **Roteamento**: TanStack Router (Altamente performático e tipado).
- **Estilização**: Tailwind CSS 4.0.
- **Componentes**: Baseados em Radix UI (Acessibilidade).
- **Estado**: Hooks customizados para Usuário Telegram e chamadas de API com cache.

---

_Este manual deve ser atualizado sempre que uma nova rota ou mecânica for implementada._
