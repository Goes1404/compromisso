import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuração central do Genkit para o Compromisso.
 * O sistema utiliza a variável de ambiente GEMINI_API_KEY para autenticação segura.
 * Obtenha sua chave em: https://aistudio.google.com/app/apikey
 */

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("⚠️ [AVISO] GEMINI_API_KEY não localizada. A Aurora IA não funcionará até que a variável de ambiente seja configurada.");
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
});
