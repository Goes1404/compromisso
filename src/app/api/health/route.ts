import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/app/lib/supabase';
import { ai } from '@/ai/genkit';

/**
 * @fileOverview API de Diagnóstico de Infraestrutura.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    supabase: { status: 'unknown', details: '' },
    genkit: { status: 'unknown', details: '' },
  };

  if (!isSupabaseConfigured) {
    diagnostics.supabase = { status: 'error', details: 'Configuração NEXT_PUBLIC_SUPABASE_URL ou ANON_KEY ausente.' };
  } else {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      diagnostics.supabase = { status: 'ok', details: 'Sinal estável com o banco de dados.' };
    } catch (e: any) {
      diagnostics.supabase = { status: 'error', details: e.message || 'Erro ao consultar banco de dados.' };
    }
  }

  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: 'Responder apenas com OK',
      config: { maxOutputTokens: 5 }
    });
    
    if (response.text) {
      diagnostics.genkit = { status: 'ok', details: 'Aurora IA sintonizada e operacional.' };
    } else {
      throw new Error("Resposta nula do motor de IA.");
    }
  } catch (e: any) {
    diagnostics.genkit = { status: 'error', details: 'Falha na engine de IA: ' + e.message };
  }

  const allOk = diagnostics.supabase.status === 'ok' && diagnostics.genkit.status === 'ok';

  return NextResponse.json(diagnostics, { status: allOk ? 200 : 207 });
}
