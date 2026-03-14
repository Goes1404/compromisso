
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * 🔒 MOTOR DE INTELIGÊNCIA AURORA IA - COMPROMISSO 360
 * Protocolo de Ativação Direta conforme documentação oficial do Gemini.
 */

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBSKWVh8V9HsDXUhLBuIAoSSBRPetzV-gM";

// Injeção global forçada para o SDK
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
