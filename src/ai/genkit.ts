import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * 🔒 MOTOR DE INTELIGÊNCIA AURORA IA - COMPROMISSO 360
 * 
 * Configuração centralizada para alta disponibilidade.
 * A chave de API é injetada globalmente para garantir visibilidade pelo SDK.
 */

const OFFICIAL_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || "AIzaSyBSKWVh8V9HsDXUhLBuIAoSSBRPetzV-gM";

// Injeção redundante para máxima compatibilidade em ambientes Cloud
if (typeof process !== 'undefined') {
  process.env.GOOGLE_GENAI_API_KEY = OFFICIAL_KEY;
  process.env.GEMINI_API_KEY = OFFICIAL_KEY;
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: OFFICIAL_KEY,
    }),
  ],
});
