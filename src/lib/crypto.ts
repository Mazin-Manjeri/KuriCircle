import type {
  AuditEvent,
  AuditEventType,
  AuditVerificationItem,
  AuditVerificationReport,
} from '@/src/types/kuri';

export const GENESIS_PREVIOUS_HASH =
  '0000000000000000000000000000000000000000000000000000000000000000';

export interface AuditHashPayload {
  sequenceNumber: number;
  groupId: string | null;
  transactionReference: string;
  eventType: AuditEventType;
  amount: number | null;
  details: string;
  actorId: string;
  timestamp: string;
  previousEventHash: string;
}

function canonicalizePayload(payload: AuditHashPayload): string {
  return JSON.stringify({
    sequenceNumber: payload.sequenceNumber,
    groupId: payload.groupId ?? null,
    transactionReference: payload.transactionReference,
    eventType: payload.eventType,
    amount: payload.amount === null ? null : Number(payload.amount),
    details: payload.details,
    actorId: payload.actorId,
    timestamp: payload.timestamp,
    previousEventHash: payload.previousEventHash,
  });
}

/**
 * Pure Web Crypto SHA-256 implementation with deterministic fallback
 * for any non-secure context. Runs cleanly in static browser environments.
 */
export async function sha256Hex(message: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(message);
    const digest = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback pure JS SHA-256 if crypto.subtle is unavailable
  return fallbackSha256(message);
}

export async function computeAuditEventHash(
  payload: AuditHashPayload
): Promise<string> {
  return sha256Hex(canonicalizePayload(payload));
}

export async function createLinkedAuditEvent(params: {
  id: string;
  previousEvent: AuditEvent | null;
  groupId: string | null;
  transactionReference: string;
  eventType: AuditEventType;
  amount: number | null;
  details: string;
  actorId: string;
  timestamp: string;
}): Promise<AuditEvent> {
  const sequenceNumber = params.previousEvent
    ? params.previousEvent.sequenceNumber + 1
    : 1;
  const previousEventHash = params.previousEvent
    ? params.previousEvent.currentEventHash
    : GENESIS_PREVIOUS_HASH;

  const currentEventHash = await computeAuditEventHash({
    sequenceNumber,
    groupId: params.groupId,
    transactionReference: params.transactionReference,
    eventType: params.eventType,
    amount: params.amount,
    details: params.details,
    actorId: params.actorId,
    timestamp: params.timestamp,
    previousEventHash,
  });

  return {
    id: params.id,
    sequenceNumber,
    groupId: params.groupId,
    transactionReference: params.transactionReference,
    eventType: params.eventType,
    amount: params.amount,
    details: params.details,
    actorId: params.actorId,
    timestamp: params.timestamp,
    previousEventHash,
    currentEventHash,
  };
}

export async function verifyAuditChain(
  events: AuditEvent[]
): Promise<AuditVerificationReport> {
  const ordered = [...events].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const items: AuditVerificationItem[] = [];
  let expectedPrev = GENESIS_PREVIOUS_HASH;
  let validEvents = 0;
  let firstBrokenEventId: string | null = null;

  for (const ev of ordered) {
    const isLinkValid = ev.previousEventHash === expectedPrev;
    const recalculatedHash = await computeAuditEventHash({
      sequenceNumber: ev.sequenceNumber,
      groupId: ev.groupId,
      transactionReference: ev.transactionReference,
      eventType: ev.eventType,
      amount: ev.amount,
      details: ev.details,
      actorId: ev.actorId,
      timestamp: ev.timestamp,
      previousEventHash: ev.previousEventHash,
    });
    const isHashValid = ev.currentEventHash === recalculatedHash;
    const isValid = isLinkValid && isHashValid;

    if (isValid) {
      validEvents += 1;
    } else if (!firstBrokenEventId) {
      firstBrokenEventId = ev.id;
    }

    items.push({
      eventId: ev.id,
      sequenceNumber: ev.sequenceNumber,
      transactionReference: ev.transactionReference,
      storedPreviousHash: ev.previousEventHash,
      expectedPreviousHash: expectedPrev,
      storedCurrentHash: ev.currentEventHash,
      recalculatedHash,
      isLinkValid,
      isHashValid,
      isValid,
    });

    expectedPrev = ev.currentEventHash;
  }

  return {
    verifiedAt: new Date().toISOString(),
    totalEvents: ordered.length,
    validEvents,
    brokenEvents: ordered.length - validEvents,
    isChainIntact: ordered.length > 0 && validEvents === ordered.length,
    firstBrokenEventId,
    items,
  };
}

// Compact pure-JS SHA-256 fallback for SSR / non-HTTPS contexts
function fallbackSha256(ascii: string): string {
  const rightRotate = (value: number, amount: number) =>
    (value >>> amount) | (value << (32 - amount));
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (let i = 0; i < ascii[lengthProperty]; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (let j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : '') + b.toString(16);
    }
  }
  return result;
}
