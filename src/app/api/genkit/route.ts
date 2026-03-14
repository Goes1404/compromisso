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
 * @fileOverview Gateway de API Aurora IA.
 * CORREÇÃO CRÍTICA NEXT.JS 15: Autenticação Assíncrona e Resiliência de Modelo.
 */

export const maxDuration = 60; 

export async function POST(req: NextRequest) {
  try {
    // 1. Inicializar Supabase com suporte a cookies assíncronos (Obrigatório no Next 15)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Lógica de Bypass para sessões de teste e suporte a login real
    const isMockUser = user?.id?.startsWith('00000000-');
    
    if (!user && !isMockUser) {
      return NextResponse.json({ error: 'Acesso Negado - Faça login novamente.' }, { status: 401 });
    }

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
      return NextResponse.json({ error: `Engine ${flowId} não localizada.` }, { status: 404 });
    }

    console.log(`[AURORA]: Executando ${flowId} para ${user?.email || 'TEST_USER'}...`);
    
    // Execução do fluxo Genkit
    const result = await targetFlow(input);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    const errorMsg = error?.message || 'Erro desconhecido na Engine de IA';
    console.error(`[AURORA CRITICAL ERROR]:`, errorMsg);

    // Retornar erro detalhado para facilitar o diagnóstico visual no console
    return NextResponse.json(
      { 
        error: '⚠️ Falha no Sinal Aurora', 
        details: errorMsg,
        type: error?.name || 'GENKIT_ERROR'
      }, 
      { status: 500 }
    );
  }
}
