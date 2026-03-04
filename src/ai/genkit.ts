
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuração central do Genkit para o Compromisso.
 * Removida a chave hardcoded que foi reportada como vazada.
 * A chave agora é lida prioritariamente das variáveis de ambiente (GEMINI_API_KEY).
 */

export const ai = genkit({
  plugins: [
    googleAI({
      // O plugin googleAI procura automaticamente por GOOGLE_GENAI_API_KEY ou GEMINI_API_KEY.
      // Definimos explicitamente aqui para garantir compatibilidade com o ambiente Firebase/Netlify.
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});
