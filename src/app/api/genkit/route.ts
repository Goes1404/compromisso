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
 * Este endpoint centraliza as chamadas para a IA e retorna erros detalhados para o front-end.
 */

export const maxDuration = 60; 

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Corpo da requisição vazio.' }, { status: 400 });
    }

    const { flowId, input } = JSON.parse(text);

    if (!flowId) {
      return NextResponse.json({ error: 'Identificador do motor (flowId) é obrigatório.' }, { status: 400 });
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
      return NextResponse.json(
        { error: `O motor '${flowId}' não está mapeado no servidor.` },
        { status: 404 }
      );
    }

    // Executa o fluxo no ambiente seguro do servidor
    const result = await targetFlow(input);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    // CAPTURAR O ERRO REAL PARA DIAGNÓSTICO DO USUÁRIO
    const errorMsg = error?.message || 'Erro desconhecido no servidor de IA.';
    
    console.error(`[AURORA ERROR LOG]:`, errorMsg);

    // Identificação de problemas específicos
    if (errorMsg.includes('API key expired') || errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('400')) {
      return NextResponse.json(
        { error: `⚠️ FALHA DE CREDENCIAL: A chave de API parece inválida ou foi bloqueada por estar em repositório público. Detalhe: ${errorMsg}` },
        { status: 401 }
      );
    }

    if (errorMsg.includes('quota') || errorMsg.includes('429')) {
      return NextResponse.json(
        { error: '⚠️ LIMITE DE COTA: A Aurora atingiu o limite de requisições do plano gratuito. Aguarde um minuto.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `⚠️ ERRO DE PROCESSAMENTO: ${errorMsg}` },
      { status: 500 }
    );
  }
}
