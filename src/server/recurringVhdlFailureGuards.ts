type RecurringVhdlFailureGuard = {
  code: string;
  title: string;
  forbiddenConstruct: string;
  legalReplacementPattern: string;
};

const RECURRING_VHDL_FAILURE_GUARDS: RecurringVhdlFailureGuard[] = [
  {
    code: 'declaration_after_begin',
    title: 'No declarations after begin',
    forbiddenConstruct: 'type, subtype, constant, signal, variable, procedure, or function declarations after an architecture/process begin',
    legalReplacementPattern: 'move every declaration into a legal declarative region before executable statements start',
  },
  {
    code: 'output_port_readback',
    title: 'No output-port readback',
    forbiddenConstruct: 'reading an out port inside internal RTL logic',
    legalReplacementPattern: 'compute with internal typed signals/variables first, then drive the out port from that internal object',
  },
  {
    code: 'reserved_identifier',
    title: 'No reserved identifiers',
    forbiddenConstruct: 'reserved VHDL keywords or operator names used as identifiers such as label, body, sll, srl, rol, ror, and, or, xor, not',
    legalReplacementPattern: 'rename every identifier to a safe descriptive non-keyword name such as op_label, package_body_i, shift_left_op, or logical_or_op',
  },
  {
    code: 'runtime_bound_check_risk',
    title: 'No unchecked index conversion',
    forbiddenConstruct: 'array indexing with unchecked to_integer(...) conversions or range math that can overflow bounds',
    legalReplacementPattern: 'bound-check, clamp, or otherwise prove the converted integer is safe before using it as an index',
  },
  {
    code: 'missing_waveform_generation_contract',
    title: 'Waveform output is mandatory',
    forbiddenConstruct: 'a GHDL run command without an explicit --vcd=..., --ghw=..., or --fst=... waveform output argument',
    legalReplacementPattern: 'include a waveform output flag in the runnable GHDL simulation command',
  },
];

export function buildRecurringVhdlFailureGuardSection(params?: {
  heading?: string;
  numbered?: boolean;
}) {
  const heading = params?.heading ?? 'Recurring Failure Guards';
  const numbered = params?.numbered ?? true;
  const lines = [heading];

  RECURRING_VHDL_FAILURE_GUARDS.forEach((guard, index) => {
    const prefix = numbered ? `${index + 1}.` : '-';
    lines.push(
      `${prefix} ${guard.title}`,
      `   Failure code: ${guard.code}`,
      `   Forbidden construct: ${guard.forbiddenConstruct}`,
      `   Legal replacement pattern: ${guard.legalReplacementPattern}`,
    );
  });

  return lines.join('\n');
}

export { RECURRING_VHDL_FAILURE_GUARDS };
