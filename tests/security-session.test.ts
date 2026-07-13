import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiJobRegistry } from '../src/server/aiJobRegistry';
import { createSessionManager } from '../src/server/sessionManager';
import { REQUIRED_GHDL_INSTALL_CONFIRMATION, validateGhdlInstallRequest } from '../src/server/ghdlInstallPolicy';

test('session manager only allows paths within the active approved root', () => {
  const manager = createSessionManager({ cookieName: 'logicpro-test' });
  const session = manager.getOrCreateSession(undefined);

  manager.setApprovedRoot(session, '/Users/test/project');

  const allowedPath = manager.assertApprovedPath(
    session,
    '/Users/test/project/src/top.vhd',
    'Project file',
    (candidate, root) => candidate === root || candidate.startsWith(`${root}/`)
  );
  assert.equal(allowedPath, '/Users/test/project/src/top.vhd');

  assert.throws(() => manager.assertApprovedPath(
    session,
    '/Users/test/other/outside.vhd',
    'Project file',
    (candidate, root) => candidate === root || candidate.startsWith(`${root}/`)
  ), /needs to be selected again/i);
});

test('session manager remote export consents are server-owned and provider-specific', () => {
  const manager = createSessionManager({ cookieName: 'logicpro-test' });
  const session = manager.getOrCreateSession(undefined);

  assert.equal(manager.hasRemoteExportConsent(session, 'openai'), false);
  manager.setRemoteExportConsent(session, 'openai', true);
  assert.equal(manager.hasRemoteExportConsent(session, 'openai'), true);
  assert.equal(manager.hasRemoteExportConsent(session, 'ollama'), false);

  const consents = manager.getRemoteExportConsents(session);
  assert.deepEqual(consents, { openai: true });
});

test('session manager remote export approvals are provider-bound and single-use', () => {
  const manager = createSessionManager({ cookieName: 'logicpro-test' });
  const session = manager.getOrCreateSession(undefined);

  assert.equal(manager.registerRemoteExportApproval(session, 'openai', 'hash-1'), true);
  assert.equal(manager.consumeRemoteExportApproval(session, 'openai', 'hash-1'), true);
  assert.equal(manager.consumeRemoteExportApproval(session, 'openai', 'hash-1'), false);

  manager.registerRemoteExportApproval(session, 'openai', 'hash-2');
  assert.equal(manager.consumeRemoteExportApproval(session, 'anthropic', 'hash-2'), false);
});

test('GHDL install validation requires typed confirmation and exact command match', () => {
  assert.deepEqual(validateGhdlInstallRequest({
    confirmInstall: true,
    confirmPhrase: REQUIRED_GHDL_INSTALL_CONFIRMATION,
    requestedInstallCommand: ['brew', 'install', 'ghdl'],
    expectedInstallCommand: ['brew', 'install', 'ghdl'],
  }), { ok: true });

  assert.equal(validateGhdlInstallRequest({
    confirmInstall: true,
    confirmPhrase: 'INSTALL',
    requestedInstallCommand: ['brew', 'install', 'ghdl'],
    expectedInstallCommand: ['brew', 'install', 'ghdl'],
  }).ok, false);

  assert.equal(validateGhdlInstallRequest({
    confirmInstall: true,
    confirmPhrase: REQUIRED_GHDL_INSTALL_CONFIRMATION,
    requestedInstallCommand: ['apt-get', 'install', '-y', 'ghdl'],
    expectedInstallCommand: ['brew', 'install', 'ghdl'],
  }).ok, false);
});

test('AI job registry only allows the owning session to cancel a job', () => {
  const registry = createAiJobRegistry();
  const controller = new AbortController();
  registry.register('job-1', 'session-a', controller);

  const forbiddenResult = registry.cancel('job-1', 'session-b', 'cancel');
  assert.deepEqual(forbiddenResult, { ok: false, code: 'forbidden' });
  assert.equal(controller.signal.aborted, false);

  const allowedResult = registry.cancel('job-1', 'session-a', 'cancel');
  assert.deepEqual(allowedResult, { ok: true });
  assert.equal(controller.signal.aborted, true);
});

test('AI job registry reports not_found for unknown or already finished jobs', () => {
  const registry = createAiJobRegistry();
  assert.deepEqual(registry.cancel('missing-job', 'session-a', 'cancel'), {
    ok: false,
    code: 'not_found',
  });
});
