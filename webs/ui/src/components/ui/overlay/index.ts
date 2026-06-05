import type { Component } from 'vue';
import type { ComponentEmit, ComponentProps } from 'vue-component-type-helpers';

import { overlayState, pushOverlay, removeOverlay } from './context';

export { default as OverlayProvider } from './OverlayProvider.vue';

type ControlledProps = {
  open?: boolean;
  'onUpdate:open'?: (value: boolean) => any;
  onResolve?: (...args: any[]) => any;
  onReject?: (...args: any[]) => any;
};

type OverlayProps<T> = Omit<ComponentProps<T>, keyof ControlledProps>;

type FirstArg<TArgs extends unknown[]> = TArgs extends [] ? void : TArgs[0];

type HandlerResult<THandler> = THandler extends (...args: infer Args) => any
  ? FirstArg<Args>
  : unknown;

type EmitResult<TEmit> = TEmit extends (event: 'resolve', ...args: infer Args) => any
  ? FirstArg<Args>
  : TEmit extends { (event: 'resolve', ...args: infer Args): any }
    ? FirstArg<Args>
    : unknown;

type OverlayResult<T> = 'onResolve' extends keyof ComponentProps<T>
  ? HandlerResult<NonNullable<ComponentProps<T>['onResolve']>>
  : ComponentEmit<T> extends (event: 'resolve', ...args: infer Args) => any
    ? Args extends []
      ? void
      : Args[0]
    : EmitResult<ComponentEmit<T>>;

type OpenArgs<T> = keyof OverlayProps<T> extends never
  ? []
  : {} extends OverlayProps<T>
    ? [props?: OverlayProps<T>]
    : [props: OverlayProps<T>];

type OpenFn<TComponent, TResult> = (...args: OpenArgs<TComponent>) => Promise<TResult>;

type CloseFn<TResult> = (value?: TResult) => void;

type DismissFn = (reason?: unknown) => void;

export type UseOverlayReturn<TComponent, TResult> = [
  open: OpenFn<TComponent, TResult>,
  close: CloseFn<TResult>,
  dismiss: DismissFn,
] & {
  open: OpenFn<TComponent, TResult>;
  close: CloseFn<TResult>;
  dismiss: DismissFn;
};

export function useOverlay<TComponent extends Component, TResult = OverlayResult<TComponent>>(
  component: TComponent,
): UseOverlayReturn<TComponent, TResult | undefined> {
  function open(...args: OpenArgs<TComponent>) {
    const props = args[0];

    return new Promise<TResult | undefined>((resolve, reject) => {
      pushOverlay({
        id: Symbol('overlay'),
        component,
        props: props as Record<string, unknown> | undefined,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
    });
  }

  function close(value?: TResult) {
    const item = findLatestOverlayByComponent(component);

    if (!item) {
      return;
    }

    item.resolve(value);
    removeOverlay(item.id);
  }

  function dismiss(reason?: unknown) {
    const item = findLatestOverlayByComponent(component);

    if (!item) {
      return;
    }

    item.reject(reason);
    removeOverlay(item.id);
  }

  return Object.assign([open, close, dismiss], {
    open,
    close,
    dismiss,
  }) as UseOverlayReturn<TComponent, TResult | undefined>;
}

function findLatestOverlayByComponent(component: Component) {
  return [...overlayState.items].reverse().find(item => item.component === component);
}
