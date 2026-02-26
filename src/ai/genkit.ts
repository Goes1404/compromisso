
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuração central do Genkit para o Compromisso.
 * Utiliza a chave fornecida pelo usuário como prioridade de teste.
 */

// Chave de teste prioritária fornecida pelo usuário
const TEST_KEY = "AIzaSyD1gSZdRe0bW5Y7aWTMBQk0nM8RoMnaE4A";

export const ai = genkit({
  plugins: [
    googleAI({
      // Prioriza a chave de teste explícita para resolver o erro de conexão
      apiKey: TEST_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY,
    }),
  ],
});
