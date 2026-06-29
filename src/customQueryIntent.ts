export type CustomQueryMode = 'waveform_debug' | 'general_design';

const WAVEFORM_DEBUG_PATTERNS: RegExp[] = [
  /\bwaveform\b/i,
  /\bwaveforms\b/i,
  /\bsignal\b/i,
  /\bsignals\b/i,
  /\bvcd\b/i,
  /\btrace\b/i,
  /\btraces\b/i,
  /\bcapture\b/i,
  /\bcaptured\b/i,
  /\blogic analyzer\b/i,
  /\btiming diagram\b/i,
  /\bdecode\b/i,
  /\bprotocol\b/i,
  /\bhazard\b/i,
  /\bglitch\b/i,
  /\bsetup\b/i,
  /\bhold\b/i,
  /\bmetastab/i,
  /\bdebug\b/i,
  /\binspect\b/i,
  /\banaly[sz]e\b/i,
  /\bloaded waveform\b/i,
  /\bvisible signals\b/i,
];

const GENERAL_DESIGN_PATTERNS: RegExp[] = [
  /\bdesign\b/i,
  /\bbuild\b/i,
  /\bcreate\b/i,
  /\bimplement\b/i,
  /\bwrite\b/i,
  /\bgenerate\b/i,
  /\bdraft\b/i,
  /\bmodule\b/i,
  /\bentity\b/i,
  /\barchitecture\b/i,
  /\brtl\b/i,
  /\btestbench\b/i,
  /\bdigital clock\b/i,
  /\bcounter\b/i,
  /\btimer\b/i,
  /\buart\b/i,
  /\bspi\b/i,
  /\bi2c\b/i,
  /\bfifo\b/i,
  /\bpwm\b/i,
  /\bstate machine\b/i,
  /\bfsm\b/i,
];

export function detectCustomQueryMode(query: string): CustomQueryMode {
  const normalized = typeof query === 'string' ? query.trim() : '';
  if (!normalized) {
    return 'waveform_debug';
  }

  const mentionsWaveformDebug = WAVEFORM_DEBUG_PATTERNS.some((pattern) => pattern.test(normalized));
  if (mentionsWaveformDebug) {
    return 'waveform_debug';
  }

  const mentionsGeneralDesign = GENERAL_DESIGN_PATTERNS.some((pattern) => pattern.test(normalized));
  if (mentionsGeneralDesign) {
    return 'general_design';
  }

  return 'waveform_debug';
}
