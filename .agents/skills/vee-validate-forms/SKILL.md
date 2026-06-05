---
name: vee-validate-forms
description: Project conventions for guard-plus forms built with vee-validate, Valibot schemas, and @web/ui form components. Use when creating, migrating, reviewing, or refactoring Vue/Nuxt form components, especially dialog/popover forms, Form/FormField usage, toTypedSchema validation, shared field groups, and replacing direct vee-validate component imports.
---

# Vee Validate Forms

## Core Rules

- Import form components from `@web/ui/components/ui/form`, not directly from `vee-validate`.
- Use `useForm` from `vee-validate` for form ownership and typed submit handling.
- Use `FormField` and `FormFieldArray` from the UI package exports for field rendering.
- Build validation from shared Valibot schemas with `toTypedSchema`.
- Keep each dialog/popover form responsible for its own `useForm`, schema, initial values, submit handler, loading state, and footer actions.
- Extract only truly shared field groups or single field components. Do not make one generic full form component controlled by many props like `showCredentials` or `submitLabel`.

## Preferred Component Shape

Use this shape for modal/popover forms:

```vue
<script setup lang="ts">
import { SomeSchema, type SomeBody } from '@internal/shared/somewhere';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { FormField } from '@web/ui/components/ui/form';
import { useForm } from 'vee-validate';

const formSchema = toTypedSchema(SomeSchema);

const { handleSubmit, meta, resetForm } = useForm<SomeBody>({
  validationSchema: formSchema,
  initialValues: createDefaultValues(),
});

const onSubmit = handleSubmit(async values => {
  // mutate with typed values, reset, close
});
</script>

<template>
  <form class="space-y-4" @submit="onSubmit">
    <FormField v-slot="{ field, errors, meta: fieldMeta }" name="name">
      <Field :data-invalid="fieldMeta.touched && errors.length > 0">
        <FieldLabel>名称</FieldLabel>
        <Input
          v-bind="field"
          :model-value="field.value ?? ''"
          :aria-invalid="fieldMeta.touched && errors.length > 0"
        />
        <FieldError :errors="errors" />
      </Field>
    </FormField>

    <DialogFooter>
      <DialogClose as-child>
        <Button variant="outline" type="button">取消</Button>
      </DialogClose>
      <Button type="submit" :disabled="isLoading || !meta.valid">保存</Button>
    </DialogFooter>
  </form>
</template>
```

## Composition API Notes

- Destructure `useForm()` results such as `handleSubmit`, `meta`, and `resetForm`; do not pass a whole composable object into the template.
- Use `handleSubmit(async values => ...)` so `values` is typed from the form generics.
- Do not put `validateOnBlur` in `useForm`; `useForm` does not accept that option. Blur validation is disabled globally through the Nuxt vee-validate plugin with `configure({ validateOnBlur: false })`.
- Use fixed string field names directly. If a reusable custom field component receives `name` as a prop, pass a reactive name to `useField` with a function, `toRef`, or `computed`.

## Field Extraction

- Extract shared field groups when two or more forms share the same fields with the same names and UI.
- Do not add `idPrefix` props or template-string `id`/`for` pairs just to make reused field groups unique. Prefer the UI form wrappers' built-in wiring unless an explicit id is needed for a specific control.
- Keep form ownership in the parent dialog/popover. Shared field groups should render `FormField` children only.
- Use project slot shorthand when a component only passes a default scoped slot.

## Initial Values and Reset

- Use a `createDefaultValues()` helper for create forms.
- Use a `createDefaultValues(entity)` helper for edit forms.
- Reset initial values when a dialog closes.
- For edit forms, watch the selected entity and refresh initial values when it changes.
- Convert nullable API fields to `undefined` for optional form fields unless the schema requires `null`.

## Naming

- Keep field names aligned with the request body schema.

## Migration Checklist

1. Replace `@tanstack/vue-form` or vee-validate `<Form>` component ownership with `useForm`.
2. Render the wrapper as native `<form @submit="onSubmit">`.
3. Use `FormField` from `@web/ui/components/ui/form` for fields.
4. Replace generic full-form components with form-local markup plus small shared field groups.
5. Run `vp fmt` on touched files.
6. Run the narrowest useful type/check command, then `vp check` when practical.
