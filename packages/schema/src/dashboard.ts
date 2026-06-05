import * as v from 'valibot';

export const DashboardOverviewQuerySchema = v.object({
  months: v.optional(
    v.pipe(
      v.string('请输入统计月份数'),
      v.toNumber('统计月份数必须是数字'),
      v.integer('统计月份数必须是整数'),
      v.minValue(1, '统计月份数不能小于 1'),
      v.maxValue(24, '统计月份数不能超过 24'),
      v.description('统计月份数'),
    ),
  ),
});

export type DashboardOverviewQuery = v.InferOutput<typeof DashboardOverviewQuerySchema>;
