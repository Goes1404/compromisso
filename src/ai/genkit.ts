import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuração central do Genkit 1.x para o Compromisso.
 * Prioriza a chave de teste fornecida pelo usuário para validação de ambiente.
 */

const TEST_KEY = "AIzaSyD1gSZdRe0bW5Y7aWTMBQk0nM8RoMnaE4A";

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || TEST_KEY,
    }),
  ],
});
