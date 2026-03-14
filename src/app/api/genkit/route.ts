import { NextRequest, NextResponse } from 'next/server';
import { conceptExplanationAssistantFlow } from '@/ai/flows/concept-explanation-assistant';
import { financialAidDeterminationFlow } from '@/ai/flows/financial-aid-determination';
import { quizGeneratorFlow } from '@/ai/flows/quiz-generator';
import { bulkQuestionParserFlow } from '@/ai/flows/bulk-question-parser';
import { essayTopicGeneratorFlow } from '@/ai/flows/essay-topic-generator';
import { essayEvaluatorFlow } from '@/ai/flows/essay-evaluator';
import { trailStructureGeneratorFlow } from '@/ai/flows/trail-structure-generator';

/**
 * @fileOverview Gateway de API Blindado para a Aurora IA.
 * Inclui log de erro detalhado para diagnóstico industrial.
 */

export const maxDuration = 60; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { flowId, input } = body;

    if (!flowId) {
      return NextResponse.json({ error: 'flowId is required' }, { status: 400 });
    }

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
      return NextResponse.json({ error: `Flow ${flowId} not found` }, { status: 404 });
    }

    console.log(`[AURORA IA]: Executando ${flowId}...`);
    const result = await targetFlow(input);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    // Log detalhado para o desenvolvedor identificar a causa exata no terminal
    const errorDetail = error?.message || 'Erro desconhecido';
    const errorStack = error?.stack || '';
    
    console.error(`[AURORA CRITICAL]: ${errorDetail}`);
    console.error(errorStack);

    return NextResponse.json(
      { 
        error: '⚠️ Falha no processamento da IA.', 
        details: errorDetail,
        code: error?.code || 'INTERNAL_ERROR'
      }, 
      { status: 500 }
    );
  }
}
