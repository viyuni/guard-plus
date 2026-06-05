import { EdenFetchError } from '@elysia/eden';
import type { PiniaColadaOptions } from '@pinia/colada';
import { toast } from 'vue-sonner';

export default {
  queryOptions: {
    placeholderData(previousData, previousEntry) {
      return previousEntry ? previousData : undefined;
    },
  },
  mutationOptions: {
    async onError(error, _vars, context) {
      const { showToast, errorMessage } = context.entry.meta;

      if (!showToast) {
        return;
      }

      if (errorMessage) {
        toast.error(errorMessage);
        return;
      }

      if (error instanceof EdenFetchError && typeof error.value.data === 'string') {
        toast.error(error.value.data);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('请求失败了咕嘎😒');
      }
    },

    onSuccess(_data, _variables, context) {
      const { showToast, successMessage } = context.entry.meta;

      if (showToast) {
        toast.success(successMessage ?? '成功了咕嘎👌');
      }
    },
  },
} satisfies PiniaColadaOptions;
