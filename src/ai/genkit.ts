import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuração central do Genkit para o Compromisso.
 * O sistema utiliza GEMINI_API_KEY ou GOOGLE_GENAI_API_KEY.
 * Obtenha uma nova chave em: https://aistudio.google.com/app/apikey
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("⚠️ [AVISO] Chave de API da Aurora (Gemini) não localizada nas variáveis de ambiente.");
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
});
