import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * 🔒 MOTOR DE INTELIGÊNCIA AURORA IA - COMPROMISSO 360
 * RECONSTRUÇÃO TOTAL (BASEADA NA DOCUMENTAÇÃO GEMINI)
 */

// Chave de teste injetada para garantir funcionamento imediato
const TEST_KEY = "AIzaSyBSKWVh8V9HsDXUhLBuIAoSSBRPetzV-gM";
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || TEST_KEY;

// Conforme a documentação: Definir variáveis de ambiente para descoberta automática
if (typeof process !== 'undefined') {
  process.env.GOOGLE_GENAI_API_KEY = apiKey;
  process.env.GEMINI_API_KEY = apiKey;
  process.env.GOOGLE_API_KEY = apiKey;
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
});
