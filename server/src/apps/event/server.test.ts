import { describe, expect, test } from 'bun:test';

import type { EventServiceStatus } from '@shared/schema/event';
import {
  type ListenerStateSnapshot,
  LoginStatus,
  ReconnectListenerStatus,
} from '@viyuni/bevent-relay';

import { createEventServer, getEventServiceStatus } from './server';

function createState(overrides: Partial<ListenerStateSnapshot> = {}): ListenerStateSnapshot {
  return {
    instanceId: 'listener-1',
    roomId: 123,
    status: ReconnectListenerStatus.Connected,
    loginState: {
      status: LoginStatus.LoggedIn,
      uid: 456,
      checkedAt: 1_000,
    },
    loginInvalidSince: null,
    retryCount: 0,
    createdAt: 100,
    updatedAt: 1_000,
    lastStatusChangedAt: 500,
    connectedAt: 500,
    stoppedAt: null,
    lastHeartbeat: null,
    lastError: null,
    ...overrides,
  };
}

describe('event server health', () => {
  test('reports the listener, login, and heartbeat details', async () => {
    const state = createState({
      lastHeartbeat: {
        id: 'heartbeat-1',
        message: '故嘎嘎嘎heartbeat-1',
        success: true,
        startedAt: 800,
        completedAt: 900,
        durationMs: 100,
      },
    });
    const app = createEventServer({ state }, 3700);

    const response = await app.handle(new Request('http://localhost/health'));
    const body = (await response.json()) as EventServiceStatus;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      service: 'event-server',
      healthy: true,
      listener: {
        status: ReconnectListenerStatus.Connected,
        login: { status: LoginStatus.LoggedIn, uid: 456 },
        lastHeartbeat: { success: true, durationMs: 100 },
      },
    });
  });

  test('returns 503 when the automatic listener state is unhealthy', async () => {
    const state = createState({
      status: ReconnectListenerStatus.Reconnecting,
      loginState: {
        status: LoginStatus.LoggedOut,
        uid: 0,
        checkedAt: 1_000,
      },
      loginInvalidSince: 1_000,
    });
    const app = createEventServer({ state }, 3700);

    const response = await app.handle(new Request('http://localhost/health'));
    const body = (await response.json()) as EventServiceStatus;

    expect(response.status).toBe(503);
    expect(body.healthy).toBe(false);
    expect(body.listener?.login.invalidSince).toBe(1_000);
  });

  test('treats a failed automatic heartbeat as unhealthy', () => {
    const state = createState({
      lastHeartbeat: {
        id: 'heartbeat-2',
        message: '故嘎嘎嘎heartbeat-2',
        success: false,
        startedAt: 800,
        completedAt: 900,
        durationMs: 100,
        error: new Error('send failed'),
      },
    });

    expect(getEventServiceStatus({ state })).toMatchObject({
      healthy: false,
      listener: {
        lastHeartbeat: {
          success: false,
          error: { name: 'Error', message: 'send failed' },
        },
      },
    });
  });
});
