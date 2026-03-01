'use server';

/**
 * @fileOverview Aurora - Avaliador de Redação ENEM.
 * Analisa o texto seguindo rigorosamente as 5 competências.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const CompetencySchema = z.object({
  score: z.number().describe('Pontuação de 0 a 200.'),
  feedback: z.string().describe('Análise detalhada da competência.'),
});

const EssayEvaluatorInputSchema = z.object({
  theme: z.string().describe('O tema proposto.'),
  text: z.string().describe('O texto da redação escrito pelo aluno.'),
});

const EssayEvaluatorOutputSchema = z.object({
  total_score: z.number().describe('Nota final de 0 a 1000.'),
  competencies: z.object({
    c1: CompetencySchema.describe('Domínio da norma culta.'),
    c2: CompetencySchema.describe('Compreender a proposta e aplicar conceitos.'),
    c3: CompetencySchema.describe('Selecionar, relacionar e organizar informações.'),
    c4: CompetencySchema.describe('Conhecimento dos mecanismos linguísticos.'),
    c5: CompetencySchema.describe('Proposta de intervenção.'),
  }),
  general_feedback: z.string().describe('Visão geral do texto.'),
  suggestions: z.array(z.string()).describe('Lista de ações para melhorar a nota.'),
});

const prompt = ai.definePrompt({
  name: 'essayEvaluatorPrompt',
  model: googleAI.model('gemini-3-flash-preview'),
  input: { schema: EssayEvaluatorInputSchema },
  output: { schema: EssayEvaluatorOutputSchema },
  config: { temperature: 0.4 },
  system: `Você é a Aurora, corretora oficial de redações nota 1000. 
  Sua avaliação deve ser criteriosa, seguindo o padrão oficial do INEP/ENEM.
  REGRAS:
  1. Atribua notas em intervalos de 40 pontos (0, 40, 80, 120, 160, 200) por competência.
  2. Seja empática, mas tecnicamente rigorosa.
  3. SEMPRE retorne o JSON estruturado conforme o esquema solicitado.`,
  prompt: `Analise a seguinte redação:
  
  TEMA: {{{theme}}}
  TEXTO:
  {{{text}}}`,
});

export const essayEvaluatorFlow = ai.defineFlow(
  {
    name: 'essayEvaluator',
    inputSchema: EssayEvaluatorInputSchema,
    outputSchema: EssayEvaluatorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error("A Aurora não conseguiu processar a análise do texto.");
    return output;
  }
);
