'use server';

/**
 * @fileOverview Aurora - Gerador de Temas de Redação.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const EssayTopicInputSchema = z.object({
  category: z.string().optional().describe('Eixo temático opcional.'),
});

const EssayTopicOutputSchema = z.object({
  title: z.string().describe('O título do tema da redação.'),
  background_text: z.string().describe('Breve texto motivador.'),
});

const prompt = ai.definePrompt({
  name: 'essayTopicGeneratorPrompt',
  model: googleAI.model('gemini-3-flash-preview'),
  input: { schema: EssayTopicInputSchema },
  output: { schema: EssayTopicOutputSchema },
  system: `Você é a Aurora, mentora de redação nota 1000. 
  Crie um tema de redação estilo ENEM sobre problemas sociais brasileiros.`,
  prompt: `Gere um tema desafiador{{#if category}} focado em {{{category}}}{{/if}}.`,
});

export const essayTopicGeneratorFlow = ai.defineFlow(
  {
    name: 'essayTopicGenerator',
    inputSchema: EssayTopicInputSchema,
    outputSchema: EssayTopicOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error("A IA falhou ao gerar o tema.");
    return output;
  }
);
