import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/app/lib/supabase';
import { ai } from '@/ai/genkit';

/**
 * @fileOverview API de Diagnóstico Maestro - Compromisso 360.
 * Verifica a saúde da infraestrutura e testa a Aurora IA.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    supabase: { status: 'unknown', details: '' },
    genkit: { status: 'unknown', details: '' },
  };

  // 1. Testar Supabase
  if (!isSupabaseConfigured) {
    diagnostics.supabase = { status: 'error', details: 'Configuração do Supabase ausente.' };
  } else {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      diagnostics.supabase = { status: 'ok', details: 'Conexão ativa com Supabase.' };
    } catch (e: any) {
      diagnostics.supabase = { status: 'error', details: e.message || 'Erro ao consultar banco de dados.' };
    }
  }

  // 2. Testar Aurora IA (Gemini 1.5 Flash via String ID para máxima compatibilidade)
  try {
    // Tentamos o identificador mais resiliente
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: 'Responda apenas com a palavra: OK',
      config: { maxOutputTokens: 5 }
    });
    
    if (response.text) {
      diagnostics.genkit = { status: 'ok', details: 'Aurora IA sintonizada e respondendo (Gemini 1.5 Flash Latest).' };
    } else {
      throw new Error("Resposta vazia da IA.");
    }
  } catch (e: any) {
    const msg = e.message || '';
    console.error("[HEALTH CHECK FAIL]:", msg);
    
    // Tentativa de fallback automático no diagnóstico
    try {
        const fallbackRes = await ai.generate({
            model: 'googleai/gemini-1.5-pro-latest',
            prompt: 'OK',
            config: { maxOutputTokens: 2 }
        });
        if (fallbackRes.text) {
            diagnostics.genkit = { status: 'ok', details: 'Aurora IA sintonizada via Fallback (Gemini 1.5 Pro).' };
        } else {
            throw new Error("Falha no fallback.");
        }
    } catch (fErr) {
        diagnostics.genkit = { 
            status: 'error', 
            details: `Falha técnica: O modelo gemini-1.5-flash-latest não foi localizado no endpoint v1beta desta conta. Verifique se o Generative Language API está ativado no Google Cloud.` 
        };
    }
  }

  const allOk = diagnostics.supabase.status === 'ok' && diagnostics.genkit.status === 'ok';

  return NextResponse.json(diagnostics, { status: allOk ? 200 : 207 });
}
