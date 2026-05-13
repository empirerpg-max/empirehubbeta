# Instruções do Agente Empire Hub

## Gerenciamento de Google Apps Script
Sempre que houver necessidade de alterações na lógica de backend (Google Apps Script), você deve:
1. Atualizar o arquivo `/google-apps-script.js` no projeto com o código completo e funcional.
2. Informar ao usuário que o arquivo foi atualizado e que ele deve copiar o conteúdo total e colar no editor do Google Apps Script.
3. Explicitar no arquivo as colunas e índices das abas (ex: ACTS, DB_ARTISTAS) para garantir consistência.

## Navegação e Filtros
- O botão "Empire Artists" na Home e no menu do Studio deve sempre usar o filtro `all` (`search: { filter: "all" }`).
- O menu de rodapé "Artistas" e o link "Ver tudo" na Home devem focar nos artistas do jogador (`filter: "mine"`), que é o comportamento padrão.
- A visualização de "Indústria" (Empire Industry) deve ser informativa e não permitir cliques para gerenciar artistas de terceiros.
