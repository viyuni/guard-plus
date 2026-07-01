import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { ToolLoopAgent } from 'ai';

import { searchProductTool } from '../tools';

const { $config } = useNuxtApp();

const openrouter = createOpenRouter({
  apiKey: $config.public.agentApiKey,
});

export const guardPlusAgent = new ToolLoopAgent({
  model: openrouter('openrouter/free'),
  instructions: `
你是 Guard Plus 的后台助手。
你可以通过工具查询舰长礼物商品列表。
当用户要求统计、查询、筛选商品时，优先调用 searchProductTool。
`.trim(),
  tools: {
    searchProductTool,
  },
});

export async function testAgent() {
  const result = await guardPlusAgent.generate({
    prompt: '帮我统计一下舰长礼物,按商品状态统计',
  });

  console.log('[text]', result.text);
  console.log('[steps]', result.steps);
  console.log('[toolCalls]', result.toolCalls);
  console.log('[toolResults]', result.toolResults);

  return result;
}
