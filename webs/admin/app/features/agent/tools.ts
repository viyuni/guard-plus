import { valibotSchema } from '@ai-sdk/valibot';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { ProductDeliveryTypeSchema, ProductStatus } from '@shared/schema/product';
import { tool, generateText } from 'ai';
import { ToolLoopAgent } from 'ai';
import * as v from 'valibot';

const SearchProductAgentInputSchema = v.object({
  keyword: v.optional(
    v.pipe(
      v.string('请输入搜索关键词'),
      v.minLength(1, '搜索关键词不能为空'),
      v.maxLength(50, '搜索关键词不能超过 50 个字符'),
      v.description('搜索关键词，用于按商品名称或描述筛选商品'),
    ),
  ),

  status: v.optional(
    v.pipe(
      v.enum(ProductStatus, '请选择有效的商品状态'),
      v.description('商品状态，可选值：active / reviewing / disabled'),
    ),
  ),

  pointTypeId: v.optional(
    v.pipe(v.string('请输入积分类型 ID'), v.description('积分类型 ID，用于筛选指定积分类型的商品')),
  ),

  deliveryType: v.optional(ProductDeliveryTypeSchema),

  page: v.optional(
    v.pipe(
      v.number('请输入页码'),
      v.integer('页码必须是整数'),
      v.minValue(1, '页码不能小于 1'),
      v.description('页码，从 1 开始'),
    ),
  ),

  pageSize: v.optional(
    v.pipe(
      v.number('请输入每页数量'),
      v.integer('每页数量必须是整数'),
      v.minValue(1, '每页数量不能小于 1'),
      v.maxValue(50, '每页数量不能超过 50'),
      v.description('每页数量，最大 50'),
    ),
  ),
});

export const searchProductTool = tool({
  description: '舰长礼物搜索',
  inputSchema: valibotSchema(SearchProductAgentInputSchema),
  execute: async query => {
    console.log(query);

    return api.products.get({ query }).then(res => res.data);
  },
});
