import { NextRequest, NextResponse } from 'next/server';
import { conceptExplanationAssistantFlow } from '@/ai/flows/concept-explanation-assistant';
import { financialAidDeterminationFlow } from '@/ai/flows/financial-aid-determination';
import { quizGeneratorFlow } from '@/ai/flows/quiz-generator';
import { bulkQuestionParserFlow } from '@/ai/flows/bulk-question-parser';
import { essayTopicGeneratorFlow } from '@/ai/flows/essay-topic-generator';
import { essayEvaluatorFlow } from '@/ai/flows/essay-evaluator';
import { trailStructureGeneratorFlow } from '@/ai/flows/trail-structure-generator';
import { createClient } from '@/utils/supabase/server';

/**
 * 🚀 GATEWAY DE INTELIGÊNCIA AURORA - COMPROMISSO 360
 * Versão 2.5: Resiliência Total para Next.js 15 e Autenticação Atômica.
 */

export const maxDuration = 60; 

export async function POST(req: NextRequest) {
  try {
    // 1. Validação de Segurança (Next.js 15 cookies() é assíncrono)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      // Permitir acesso para usuários mock em ambiente de desenvolvimento/estúdio
      const isMockUser = user?.id?.startsWith('00000000-');
      if (!isMockUser) {
        return NextResponse.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 });
      }
    }

    // 2. Extração de Payload
    const body = await req.json();
    const { flowId, input } = body;

    const flows: Record<string, any> = {
      conceptExplanationAssistant: conceptExplanationAssistantFlow,
      financialAidDetermination: financialAidDeterminationFlow,
      quizGenerator: quizGeneratorFlow,
      bulkQuestionParser: bulkQuestionParserFlow,
      essayTopicGenerator: essayTopicGeneratorFlow,
      essayEvaluator: essayEvaluatorFlow,
      trailStructureGenerator: trailStructureGeneratorFlow,
    };

    const targetFlow = flows[flowId];

    if (!targetFlow) {
      return NextResponse.json({ error: `Motor '${flowId}' não localizado.` }, { status: 404 });
    }

    console.log(`[AURORA]: Processando ${flowId} para ${user?.email || 'TEST_USER'}...`);
    
    // 3. Execução do Fluxo Genkit
    const result = await targetFlow(input);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro interno no motor de IA';
    console.error(`[AURORA CRITICAL]:`, errorMessage);

    return NextResponse.json(
      { 
        error: '⚠️ Falha no sinal da Aurora IA', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
