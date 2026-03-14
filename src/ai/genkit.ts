import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * 🔒 MOTOR DE INTELIGÊNCIA AURORA IA - COMPROMISSO 360
 * PROTOCOLO DE ALTA DISPONIBILIDADE
 */

// Chave de teste injetada diretamente para garantir funcionamento imediato no ambiente de preview
const TEST_KEY = "AIzaSyBSKWVh8V9HsDXUhLBuIAoSSBRPetzV-gM";
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || TEST_KEY;

// Garantir que o SDK localize a chave no ambiente global do servidor
if (typeof process !== 'undefined') {
  process.env.GOOGLE_GENAI_API_KEY = apiKey;
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
});
