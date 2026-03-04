
/**
 * GUIA DE CONFIGURAÇÃO DA AURORA IA
 * 
 * Você está vendo este arquivo porque perguntou sobre a chave do Gemini.
 * 
 * 1. Onde pegar a chave:
 *    Acesse https://aistudio.google.com/app/apikey
 * 
 * 2. Onde colocar a chave localmente:
 *    Crie um arquivo chamado .env na raiz do projeto e adicione:
 *    GEMINI_API_KEY=SUA_CHAVE_AQUI
 * 
 * 3. Onde colocar a chave no Netlify:
 *    Vá em Site Settings > Environment Variables e adicione GEMINI_API_KEY.
 * 
 * IMPORTANTE: Nunca compartilhe sua chave ou a coloque diretamente no código (hardcoded).
 * O sistema já está preparado para ler a chave automaticamente se ela estiver nas variáveis de ambiente.
 */

console.log("Para testar a conexão, use a rota /api/health no navegador após configurar a chave.");
