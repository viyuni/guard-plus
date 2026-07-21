import { EventServiceStatusSchema } from '@shared/schema/event';
import {
  type BliveListener,
  type DanmuHeartbeatResult,
  LoginStatus,
  ReconnectListenerStatus,
} from '@viyuni/bevent-relay';
import Elysia from 'elysia';

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  if (error == null) return null;

  return {
    name: 'Error',
    message: String(error),
  };
}

function getHeartbeatStatus(heartbeat: DanmuHeartbeatResult | null) {
  if (!heartbeat) return null;

  return {
    id: heartbeat.id,
    message: heartbeat.message,
    success: heartbeat.success,
    startedAt: heartbeat.startedAt,
    completedAt: heartbeat.completedAt,
    durationMs: heartbeat.durationMs,
    error: serializeError(heartbeat.error),
  };
}

export function getEventServiceStatus(listener: Pick<BliveListener, 'state'>) {
  const state = listener.state;
  const healthy =
    state?.status === ReconnectListenerStatus.Connected &&
    state.loginState.status === LoginStatus.LoggedIn &&
    state.lastHeartbeat?.success !== false;

  return {
    service: 'event-server' as const,
    healthy,
    listener: state
      ? {
          instanceId: state.instanceId,
          roomId: state.roomId,
          status: state.status,
          retryCount: state.retryCount,
          createdAt: state.createdAt,
          updatedAt: state.updatedAt,
          lastStatusChangedAt: state.lastStatusChangedAt,
          connectedAt: state.connectedAt,
          stoppedAt: state.stoppedAt,
          login: {
            status: state.loginState.status,
            uid: state.loginState.uid,
            checkedAt: state.loginState.checkedAt,
            invalidSince: state.loginInvalidSince,
          },
          lastHeartbeat: getHeartbeatStatus(state.lastHeartbeat),
          lastError: state.lastError,
        }
      : null,
  };
}

export function createEventServer(listener: Pick<BliveListener, 'state'>, port: number) {
  return new Elysia({
    name: 'EventServer',
    serve: {
      port,
      reusePort: true,
    },
  })
    .get(
      '/health',
      ({ set }) => {
        const result = getEventServiceStatus(listener);
        set.status = result.healthy ? 200 : 503;
        return result;
      },
      {
        response: {
          200: EventServiceStatusSchema,
          503: EventServiceStatusSchema,
        },
        detail: {
          description: 'Event 服务、B站登录与弹幕监听状态',
          tags: ['Health'],
        },
      },
    )
    .head('/health', ({ set }) => {
      const result = getEventServiceStatus(listener);
      set.status = result.healthy ? 200 : 503;
    });
}
