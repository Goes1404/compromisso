import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * 🔒 PROTEÇÃO DE SEGURANÇA INDUSTRIAL - COMPROMISSO SMART EDUCATION
 * 
 * Este arquivo configura o Genkit para rodar EXCLUSIVAMENTE no servidor.
 * Se este arquivo for importado em um componente 'use client', o Next.js
 * disparará um erro de compilação ou a trava abaixo será acionada.
 */

if (typeof window !== 'undefined') {
  throw new Error("⚠️ [SEGURANÇA] A configuração da Aurora IA não pode ser carregada no navegador.");
}

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.warn("⚠️ [AVISO] Chave de API da Aurora (Gemini) não configurada nas variáveis de ambiente.");
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
});