import {
  createBiliEventEnvelope,
  isBiliGuardEventEnvelope,
  type BiliGuardEventEnvelope,
  type NormalizedBiliGuardEvent,
} from './events';

interface LegacyBiliGuardEvent {
  id: string;
  uid: number | string;
  uname: string;
  face?: string;
  message: string;
  guardType: number;
  guardName: string;
  total: number;
  totalNormalized: number;
  unit: string;
  isYearGuard: boolean;
  priceNormalized: number;
  roomId: number;
  timestamp: number;
  timestampNormalized: number;
  isManual?: boolean;
}

function isLegacyBiliGuardEvent(value: unknown): value is LegacyBiliGuardEvent {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<LegacyBiliGuardEvent>;
  return (
    typeof candidate.id === 'string' &&
    (typeof candidate.uid === 'number' || typeof candidate.uid === 'string') &&
    typeof candidate.uname === 'string' &&
    typeof candidate.guardType === 'number' &&
    typeof candidate.totalNormalized === 'number' &&
    typeof candidate.roomId === 'number'
  );
}

export function readBiliGuardEventSnapshot(snapshot: unknown): BiliGuardEventEnvelope {
  if (isBiliGuardEventEnvelope(snapshot)) return snapshot;

  if (!isLegacyBiliGuardEvent(snapshot)) {
    throw new TypeError('无法识别的 B 站大航海事件快照');
  }

  const occurredAt =
    snapshot.timestamp > 9_999_999_999 ? snapshot.timestamp : snapshot.timestampNormalized;
  const event: NormalizedBiliGuardEvent = {
    type: 'guard',
    id: snapshot.id,
    roomId: snapshot.roomId,
    occurredAt,
    user: {
      biliUid: String(snapshot.uid),
      username: snapshot.uname,
      avatarUrl: snapshot.face || null,
    },
    message: snapshot.message,
    guardType: snapshot.guardType,
    guardName: snapshot.guardName,
    quantity: snapshot.total,
    quantityNormalized: snapshot.totalNormalized,
    unit: snapshot.unit,
    isYear: snapshot.isYearGuard,
    price: snapshot.priceNormalized,
  };

  return createBiliEventEnvelope({
    source: {
      provider: snapshot.isManual ? 'manual' : 'bevent',
      channel: 'legacy',
      sourceEventId: snapshot.id,
      receivedAt: occurredAt,
      adapterVersion: 0,
    },
    event,
    raw: snapshot,
  });
}
