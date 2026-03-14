
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * 🔒 BLINDAGEM INDUSTRIAL AURORA IA - COMPROMISSO
 * 
 * Este arquivo centraliza a inteligência da plataforma.
 * A configuração é EXCLUSIVAMENTE servidora para proteger as credenciais de rede.
 */

if (typeof window !== 'undefined') {
  throw new Error("⚠️ [SEGURANÇA] A Aurora IA só pode ser operada no Gabinete de Gestão (Servidor).");
}

// Chave de API: Prioriza variável de ambiente para produção.
// Caso não encontrada, utiliza a chave de teste configurada no projeto Goes1404.
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBSKWVh8V9HsDXUhLBuIAoSSBRPetzV-gM";

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
});
