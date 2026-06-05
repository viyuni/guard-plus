<script lang="ts">
const tabs = ['login', 'register'] as const;
type Tabs = (typeof tabs)[number];
</script>

<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@web/ui/components/ui/tabs';

import LoginForm from './LoginForm.vue';
import RegisterForm from './RegisterForm.vue';

const props = defineProps<{
  authMode: Tabs;
}>();

const open = defineModel<boolean>('open', { required: true });

const emit = defineEmits<{
  authenticated: [];
}>();

const loginForm = useTemplateRef<InstanceType<typeof LoginForm>>('loginForm');
const registerForm = useTemplateRef<InstanceType<typeof RegisterForm>>('registerForm');

const selectedAuthMode = ref<Tabs>(props.authMode);

watch(
  () => props.authMode,
  mode => {
    selectedAuthMode.value = mode;
  },
);

function handleAuthenticated() {
  open.value = false;
  emit('authenticated');
}

function handleRegistered() {
  selectedAuthMode.value = 'login';
}

watch(open, isOpen => {
  if (!isOpen) {
    loginForm.value?.resetForm();
    registerForm.value?.resetForm();
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <Tabs v-model="selectedAuthMode" class="grid gap-4">
        <DialogHeader>
          <DialogTitle>
            <TabsList variant="line" class="gap-2 p-0">
              <TabsTrigger
                class="after:bg-primary data-active:text-primary hover:text-primary h-5 px-0.5 py-1 text-base"
                value="login"
              >
                登录
              </TabsTrigger>
              <TabsTrigger
                class="after:bg-primary data-active:text-primary hover:text-primary h-5 px-0.5 py-1 text-base"
                value="register"
              >
                注册
              </TabsTrigger>
            </TabsList>
          </DialogTitle>
        </DialogHeader>

        <div class="grid">
          <TabsContent
            force-mount
            value="login"
            class="col-start-1 row-start-1 grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-200 ease-out data-[state=active]:grid-rows-[1fr] data-[state=active]:opacity-100 data-[state=inactive]:pointer-events-none"
          >
            <div class="min-h-0 overflow-hidden p-1">
              <LoginForm ref="loginForm" @authenticated="handleAuthenticated" />
            </div>
          </TabsContent>

          <TabsContent
            force-mount
            value="register"
            class="col-start-1 row-start-1 grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-200 ease-out data-[state=active]:grid-rows-[1fr] data-[state=active]:opacity-100 data-[state=inactive]:pointer-events-none"
          >
            <div class="min-h-0 overflow-hidden p-1">
              <RegisterForm ref="registerForm" @registered="handleRegistered" />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
