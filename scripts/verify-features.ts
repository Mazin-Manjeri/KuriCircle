import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  loadDatabaseState,
  resetDatabaseState,
  saveDatabaseState,
} from '../src/db/neon.ts';
import { createLinkedAuditEvent, verifyAuditChain } from '../src/lib/crypto.ts';
import { buildInitialSeedData } from '../src/lib/seedData.ts';

async function runTests() {
  console.log('Running KuriCircle full feature & database verification tests...');

  // 1. Verify zero-data initial state & Mohyadden Mazin starter profile
  const seed = await buildInitialSeedData();
  assert.equal(seed.profiles.length, 1, 'Expected 1 starter profile');
  assert.equal(
    seed.profiles[0].fullName,
    'Mohyadden Mazin',
    'Starter name must be Mohyadden Mazin'
  );
  assert.equal(seed.groups.length, 0, 'Groups must start at 0');
  assert.equal(seed.contributions.length, 0, 'Contributions must start at 0');
  assert.equal(seed.auditEvents.length, 0, 'Audit events must start at 0');
  assert.equal(seed.disputes.length, 0, 'Disputes must start at 0');
  console.log('PASS 1/5: Zero-baseline state & Mohyadden Mazin profile verified.');

  // 2. Verify Neon PostgreSQL persistence & group/contribution creation
  const { state: initialLoaded, backend: loadBackend } = await loadDatabaseState();
  assert.equal(loadBackend, 'neon', 'Expected Neon PostgreSQL backend on load');
  assert.equal(initialLoaded.profiles[0].fullName, 'Mohyadden Mazin');

  const now = new Date().toISOString();
  const groupId = 'grp-test-01';
  const updatedState = {
    ...initialLoaded,
    groups: [
      {
        id: groupId,
        organizerId: initialLoaded.profiles[0].id,
        name: 'Manjeri Community Circle',
        description: 'Goal-based community pool',
        purpose: 'Community development' as const,
        imageUrl: '',
        arrangementType: 'goal_based_savings' as const,
        maxMembers: 10,
        targetAmount: 50000,
        frequency: 'monthly' as const,
        proposedContribution: 1000,
        startDate: '2026-11-01',
        endDate: '2027-08-31',
        rules: 'Simulated coordination rules',
        visibility: 'private_invite' as const,
        inviteCode: 'KURI-MNJ-1001',
        isFlagged: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
    contributions: [
      {
        id: 'contrib-test-01',
        transactionId: 'SIM-1001',
        groupId,
        memberId: initialLoaded.profiles[0].id,
        amount: 1000,
        transactionDate: '2026-11-17',
        contributionPeriod: '2026-11',
        paymentStatus: 'verified' as const,
        verificationStatus: 'verified' as const,
        recordedBy: initialLoaded.profiles[0].id,
        isSimulated: true as const,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };

  // 3. Verify SHA-256 chain linking across Group -> Contribution -> Dispute
  const ev1 = await createLinkedAuditEvent({
    id: 'test-aud-1',
    previousEvent: null,
    groupId,
    transactionReference: 'KURI-MNJ-1001',
    eventType: 'GROUP_CREATED',
    amount: 50000,
    details: 'Created Manjeri Community Circle',
    actorId: initialLoaded.profiles[0].id,
    timestamp: '2026-11-17T09:00:00Z',
  });

  const ev2 = await createLinkedAuditEvent({
    id: 'test-aud-2',
    previousEvent: ev1,
    groupId,
    transactionReference: 'SIM-1001',
    eventType: 'CONTRIBUTION_VERIFIED',
    amount: 1000,
    details: 'Mohyadden Mazin · Period 2026-11 (verified)',
    actorId: initialLoaded.profiles[0].id,
    timestamp: '2026-11-17T09:05:00Z',
  });

  const ev3 = await createLinkedAuditEvent({
    id: 'test-aud-3',
    previousEvent: ev2,
    groupId,
    transactionReference: 'DSP-1001',
    eventType: 'DISPUTE_RESOLVED',
    amount: null,
    details: 'Dispute checked and resolved',
    actorId: initialLoaded.profiles[0].id,
    timestamp: '2026-11-17T09:10:00Z',
  });

  updatedState.auditEvents = [ev1, ev2, ev3];
  const saveRes = await saveDatabaseState(updatedState);
  assert.equal(saveRes.ok, true, 'Save state must succeed');
  assert.equal(saveRes.backend, 'neon', 'Expected Neon PostgreSQL backend on save');
  const reloaded = await loadDatabaseState();
  assert.equal(reloaded.backend, 'neon', 'Expected Neon PostgreSQL backend on reload');
  assert.equal(reloaded.state.groups.length, 1, 'Saved group must persist');
  assert.equal(reloaded.state.contributions.length, 1, 'Saved contribution must persist');
  console.log('PASS 2/5: Neon PostgreSQL persistence round-trip verified.');

  const cleanReport = await verifyAuditChain(reloaded.state.auditEvents);
  assert.equal(cleanReport.isChainIntact, true, 'Clean chain must verify intact');
  assert.equal(cleanReport.validEvents, 3, 'All 3 events must verify');
  assert.equal(cleanReport.brokenEvents, 0, 'Zero broken events expected');
  console.log('PASS 3/5: SHA-256 chain linking & verification succeeded (3/3 intact).');

  // 4. Verify tamper detection catches unauthorized modification
  const tamperedEvents = [ev1, { ...ev2, amount: 99000 }, ev3];
  const tamperedReport = await verifyAuditChain(tamperedEvents);
  assert.equal(tamperedReport.isChainIntact, false, 'Tampered chain must fail');
  assert.equal(tamperedReport.firstBrokenEventId, 'test-aud-2', 'Must pinpoint tampered event');
  console.log('PASS 4/5: Tamper detection caught unauthorized edit at test-aud-2.');

  // 5. Verify reset returns Neon state cleanly to zero
  const resetRes = await resetDatabaseState();
  assert.equal(resetRes.backend, 'neon', 'Expected Neon PostgreSQL backend on reset');
  assert.equal(resetRes.state.groups.length, 0, 'Reset must zero groups');
  assert.equal(resetRes.state.contributions.length, 0, 'Reset must zero contributions');
  assert.equal(resetRes.state.auditEvents.length, 0, 'Reset must zero audit events');

  // Clean up test temp file if created locally
  const localFile = path.resolve(process.cwd(), '.kuricircle-data.json');
  if (fs.existsSync(localFile)) {
    fs.unlinkSync(localFile);
  }
  console.log('PASS 5/5: Reset to zero baseline verified.');
  console.log('ALL 5 KURICIRCLE VERIFICATION TESTS PASSED.');
}

runTests().catch((err) => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});
