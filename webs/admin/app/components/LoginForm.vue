<script setup lang="ts">
import { toast } from 'vue-sonner';

const emit = defineEmits<{
  submit: [data: { uid: string; password: string }];
}>();

import { AdminLoginSchema } from '@shared/schema/admin';
import { FormFieldItem, useForm } from '@web/ui/components/ui/form';

const { handleSubmit, onSubmitSuccess } = useForm({
  schema: AdminLoginSchema,
  resetOnSuccess: false,
  initialValues: () => ({
    uid: '',
    password: '',
  }),
});

onSubmitSuccess(values => {
  emit('submit', values);
});

function handleNotImplemented(e: Event) {
  toast.error('Not implemented 🤣');
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card>
      <CardHeader class="text-center">
        <CardTitle class="text-xl"> Welcome back </CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit="handleSubmit">
          <FieldGroup>
            <Field>
              <Button variant="outline" type="button" @click="handleNotImplemented">
                <BilibiliIcon class="text-primary" />
                Login with Bilibili
              </Button>
            </Field>

            <FieldSeparator class="*:data-[slot=field-separator-content]:bg-card">
              OR
            </FieldSeparator>

            <FormFieldItem v-slot="{ componentField }" name="uid" label="UID" required>
              <Input v-bind="componentField" placeholder="90424564" autocomplete="off" />
            </FormFieldItem>

            <FormFieldItem v-slot="{ componentField }" name="password" label="Password" required>
              <Input
                v-bind="componentField"
                type="password"
                autocomplete="off"
                placeholder="密密麻麻"
              />
            </FormFieldItem>

            <Field>
              <Button type="submit"> Login </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
