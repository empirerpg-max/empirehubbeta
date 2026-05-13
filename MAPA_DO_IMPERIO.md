# 🗺️ Mapa do Império: Guia Completo do Empire Hub

Este documento foi criado para ajudar você a entender como cada parte do seu aplicativo funciona, de onde vêm as informações e o que cada botão faz. Estamos usando uma estrutura de **Soberania Musical**, onde você é o magnata gerindo carreiras.

---

## 🏗️ Como o sistema funciona (O Motor)

Tudo o que você vê no aplicativo está conectado a uma **Planilha do Google (Google Sheets)**. 
- **Entrada (Inputs):** Quando você clica em "Lançar Álbum" ou "Apostar", o aplicativo envia esses dados para um script (Google Apps Script) que escreve na sua planilha.
- **Saída (Outputs):** Quando o aplicativo abre, ele lê essa planilha e transforma as linhas de dados nessas interfaces bonitas que você vê.
- **Cache:** Para o app ser rápido, ele "lembra" dos dados por 30 segundos. Se você mudou algo na planilha e não apareceu no app, use o botão de **Sincronizar (ícone de setas circulares)** na página inicial.

---

## 📱 Menu de Navegação (Rodapé)

O menu fixo na parte inferior permite navegar rapidamente pelas áreas principais:

1.  **Hub (Ícone Casinha):** Sua central de comando. Mostra seus artistas, notícias e atalhos para todas as ferramentas.
2.  **Artistas (Livro/Biblioteca):** Lista **todos** os artistas cadastrados no jogo (de todos os jogadores).
3.  **Álbuns (Disco):** Galeria de todos os discos lançados no Império. Aqui você pode ouvir as músicas.
4.  **Tours (Microfone):** Mostra quem está na estrada, o progresso dos shows e os lucros.
5.  **Market (Sacola):** Onde o dinheiro circula. Compras de imóveis, itens e influência.
6.  **Rankings (Estrela):** Ver quem é o mais rico (Fortuna) e o mais famoso (Prestígio).

---

## 🏠 O Hub (Página Inicial)

Dividido em 4 grandes categorias de gestão:

### 1. Empire Studio (Criação)
- **Empire Artists:** Gerencia apenas **os seus** artistas selecionados.
- **Empire Corp:** Onde você pode abrir e gerenciar suas empresas.
- **Empire Albums:** Atalho para ver e lançar novos discos.
- **Empire Playlists:** Onde você cria seleções de músicas utilizando obras que já foram enviadas/upadas no aplicativo.

### 2. Empire Market (Financeiro)
- **Empire Market:** Compre bens como Mansões, Jatinhos ou itens de influência.
- **Empire Auctions (Leilões):** Onde jogadores podem vender itens raros entre si.
- **Empire Payola:** Use seu capital para "impulsionar" músicas nas paradas.
- **Empire Philanthropy:** Doe dinheiro para causas e ganhe pontos de Prestígio.

### 3. Empire Coliseum (Combate/Rankings)
- **Empire Rankings:** Onde você acompanha as posições de Prestígio, Fortuna e Empire Coin (Saldo).
- **Empire Duels:** Batalha direta de métricas entre dois artistas.
- **Empire Hall:** Galeria dos imortais (lendários).

### 4. Empire Extras (Utilidades)
- **Empire Bet:** Onde você aposta quais músicas estarão no topo. Agora com opção de escolher músicas do seu próprio catálogo.
- **Empire Games:** Mini-games como o Popstar Quest.
- **Empire Radar:** Feed de notícias sobre lançamentos e ações no jogo.
- **Empire Guide:** Tutorial e dicas.

---

## 🎤 Perfil do Artista (O que posso fazer?)

Ao clicar em um artista seu, você tem 3 abas principais:
1.  **Início:** Visão geral de dinheiro, seguidores e status atual.
2.  **Bens:** Tudo o que ele comprou (casas, carros). Você pode vender para recuperar dinheiro.
3.  **Projetos:** Histórico de tudo o que ele já fez (Tours, Álbuns, Filmes).

**Botões de Ação no Perfil:**
- **Lançar Álbum:** Abre o formulário para criar um disco novo, enviar capa e links do Drive.
- **Nova Tour:** Planeja a rota, define o tipo (Arena/Estádio) e paga os custos iniciais.
- **Cinema:** Lança um projeto audiovisual (filme/documentário).

---

## ❓ Perguntas sobre Menus sem Ação

Durante a análise, identifiquei alguns pontos que podemos evoluir se você desejar:
1.  **Empire Incubator:** Atualmente é um atalho sem tela própria. O que você gostaria que acontecesse lá? (Criar artistas do zero? Treinar iniciantes?)
2.  **Empire Duels (Duelo):** A tela existe, mas os cálculos de quem vence "de verdade" dependem de regras que podemos refinar.
3.  **Empire Hall:** Está vazio. Quer que a gente defina critérios automáticos para entrar no Hall da Fama? (Ex: ter 10 Platinum Albums).

---

## 🛠️ Notas de Correção (Últimas Atualizações)
- **Tours Invisíveis:** Corrigi o código para ler dados da planilha mesmo que eles venham como texto puro. Se ainda não ver, clique no botão de **Sincronizar** no Hub.
- **Empire Bet:** Agora você pode selecionar músicas do seu próprio catálogo para apostar nela mesma, além das músicas que já estão no topo.
- **Botões:** Revisei os links e adicionei efeitos de "clique" (feedback visual) em quase todos para você saber que o app entendeu o comando.
