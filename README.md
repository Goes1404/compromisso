# Compromisso | Smart Education

*Tecnologia a serviço da aprovação.*

---

## ✨ Status Atual (Consolidação Master)

O projeto está **estável, sincronizado e compatível com Next.js 15 / React 19**. Todas as funcionalidades críticas (Banco de Questões, Simulados IA, Trilhas e Chat Real-time) foram validadas.

---

## 🎯 Configuração do Banco de Dados (Supabase)

Para garantir que todas as tabelas e funções RPC funcionem corretamente, **é obrigatório** executar o script SQL master:

1.  Acesse o seu painel do **Supabase**.
2.  Vá em **SQL Editor**.
3.  Abra o arquivo `docs/database.sql` do projeto.
4.  Copie o conteúdo e clique em **"Run"**.

Isso resolverá erros de "coluna não encontrada" ou "permissão negada" (RLS).

---

## 🛠️ Arquitetura e Padrões
- **Next.js 15**: Utilização de `React.use()` para rotas dinâmicas.
- **Supabase**: Auth, PostgreSQL e Realtime para mensagens.
- **Genkit**: Inteligência pedagógica da Aurora IA.
- **Shadcn UI**: Design de alta fidelidade com foco em pixels e UX industrial.

---

## 🚀 Funcionalidades Principais
- **Banco de Questões**: Cadastro manual e exemplo de teste automatizado.
- **Simulados Inteligentes**: Sorteio aleatório via RPC PostgreSQL.
- **Sala de Aula Digital**: Transmissão integrada e materiais de apoio.
- **Studio Master**: Controle de lives em tempo real para mentores.
