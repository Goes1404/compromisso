import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * 🔒 MOTOR DE INTELIGÊNCIA AURORA IA - COMPROMISSO 360
 * Protocolo de Segurança Industrial e Injeção Atômica de Credenciais.
 */

// Chave de teste prioritária conforme documentação Google AI Studio
const TEST_KEY = "AIzaSyBSKWVh8V9HsDXUhLBuIAoSSBRPetzV-gM";
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || TEST_KEY;

// Forçar injeção nas variáveis de ambiente para o SDK do Google
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
