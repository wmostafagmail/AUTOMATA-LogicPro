export const REQUIRED_GHDL_INSTALL_CONFIRMATION = 'INSTALL GHDL';

function normalizeCommand(command: string[] | null | undefined) {
  if (!Array.isArray(command) || command.length === 0) {
    return '';
  }
  return command.map((part) => String(part || '').trim()).filter(Boolean).join(' ');
}

export function validateGhdlInstallRequest(params: {
  confirmInstall: unknown;
  confirmPhrase: unknown;
  requestedInstallCommand: unknown;
  expectedInstallCommand: string[] | null | undefined;
}) {
  const {
    confirmInstall,
    confirmPhrase,
    requestedInstallCommand,
    expectedInstallCommand,
  } = params;

  if (confirmInstall !== true) {
    return {
      ok: false,
      error: 'GHDL installation requires explicit confirmation from the UI before the installer can run.',
    };
  }

  if (typeof confirmPhrase !== 'string' || confirmPhrase.trim() !== REQUIRED_GHDL_INSTALL_CONFIRMATION) {
    return {
      ok: false,
      error: `Type "${REQUIRED_GHDL_INSTALL_CONFIRMATION}" to confirm GHDL installation.`,
    };
  }

  const expected = normalizeCommand(expectedInstallCommand);
  const requested = normalizeCommand(Array.isArray(requestedInstallCommand) ? requestedInstallCommand as string[] : null);
  if (!expected || !requested || expected !== requested) {
    return {
      ok: false,
      error: 'The requested GHDL install command did not match the current platform installer shown in the UI.',
    };
  }

  return { ok: true };
}
