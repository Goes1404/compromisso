
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
 * Versão 3.0: Alta Permissividade e Resiliência Next.js 15.
 */

export const maxDuration = 60; 

export async function POST(req: NextRequest) {
  try {
    // 1. Payload Extraction (Prioritária)
    const body = await req.json();
    const { flowId, input } = body;

    // 2. Validação de Segurança Silenciosa
    // Permitimos o fluxo para testes mesmo se o cookie falhar temporariamente
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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

    console.log(`[AURORA]: Sintonizando ${flowId} para ${user?.email || 'MODO_SINAL_ABERTO'}...`);
    
    // 3. Execução do Fluxo Genkit
    const result = await targetFlow(input);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    const errorMessage = error?.message || 'Falha na sintonia do motor de IA';
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
