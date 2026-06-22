import { defineMutation, useMutation } from '@pinia/colada';
import type { UserConvertPointBody } from '@shared/schema/point-conversion';

export const useConvertPoint = defineMutation(() => {
  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分转换成功',
    },
    mutation(body: UserConvertPointBody) {
      return api.pointConversions.convert.post(body);
    },
  });
});
