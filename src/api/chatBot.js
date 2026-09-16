// src/api/chatBot.js
import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function POST(req) {
  const { messages, chartData, summary, dashboardContext } = await req.json();

  const hasChartData = Array.isArray(chartData) && chartData.length > 0;

  const systemPrompt = `You are InfoVision AI Data Agent, an expert generative UI assistant.
  You are processing data received from the backend analysis agent (/ws/agent).

  Instructions:
  1. ${hasChartData ? 'Chart data is provided. Call the renderChart tool to output the chart configuration and stream a concise, high-value executive narrative.' : 'Stream a clear, structured markdown narrative with key takeaways, metrics, and bullet points based on the backend summary.'}
  
  Backend Chart Data: ${JSON.stringify(chartData || [])}
  Backend Summary Narrative: ${summary || 'None'}`;

  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages,
    tools: {
      renderChart: tool({
        description: 'Generates an interactive chart widget inside the chat UI.',
        parameters: z.object({
          chart_id: z.string(),
          title: z.string(),
          description: z.string().optional(),
          chart_type: z.string(),
          data: z.array(z.record(z.any())),
        }),
        execute: async (params) => {
          return params;
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
