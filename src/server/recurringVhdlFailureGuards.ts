type RecurringVhdlFailureGuard = {
  code: string;
  title: string;
  forbiddenConstruct: string;
  legalReplacementPattern: string;
};

const RECURRING_VHDL_FAILURE_GUARDS: RecurringVhdlFailureGuard[] = [
  {
    code: 'architecture_body_variable',
    title: 'No plain architecture-body variables',
    forbiddenConstruct: 'ordinary variables declared in the architecture declarative region',
    legalReplacementPattern: 'move temporary scratch state into a process/subprogram declarative region, or use a signal/shared variable only when architecture-level persistence or deliberate shared TB bookkeeping is truly required',
  },
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
    code: 'procedure_outer_scope_write',
    title: 'No hidden outer-scope mutation from procedures',
    forbiddenConstruct: 'procedure bodies assigning to signals or variables from outer scope without formal parameters',
    legalReplacementPattern: 'pass every mutated object explicitly as a formal parameter, or keep mutable state local to the caller process',
  },
  {
    code: 'variable_assigned_with_signal_operator',
    title: 'No variable assignment with signal operator',
    forbiddenConstruct: 'using <= on a variable',
    legalReplacementPattern: 'use := for variables, or convert the object into a signal only if true signal semantics are required',
  },
  {
    code: 'signal_assigned_with_variable_operator',
    title: 'No signal assignment with variable operator',
    forbiddenConstruct: 'using := on a signal',
    legalReplacementPattern: 'use <= for signals, or convert the object into a variable only if it is truly process-local temporary state',
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
    code: 'illegal_numeric_logical_hybrid',
    title: 'No pseudo-boolean arithmetic hybrids',
    forbiddenConstruct: 'numeric expressions combined with logical keywords as if they were booleans, such as a_int and b_int = 0',
    legalReplacementPattern: 'compare each numeric expression explicitly, or derive the condition from a final typed result signal/value',
  },
  {
    code: 'resize_on_raw_std_logic_vector',
    title: 'No resize on raw std_logic_vector',
    forbiddenConstruct: 'calling resize directly on std_logic_vector values',
    legalReplacementPattern: 'convert to unsigned/signed first, then call resize on the typed operand',
  },
  {
    code: 'resize_with_range_attribute',
    title: 'No range attribute as resize width',
    forbiddenConstruct: 'calling resize(..., target\'range)',
    legalReplacementPattern: 'pass a scalar width such as target\'length or an explicit integer',
  },
  {
    code: 'to_integer_on_raw_logic_type',
    title: 'No to_integer on raw logic types',
    forbiddenConstruct: 'calling to_integer on std_logic or std_logic_vector without typed conversion',
    legalReplacementPattern: 'wrap the operand with unsigned(...) or signed(...) before calling to_integer',
  },
  {
    code: 'typed_bitwise_mismatch',
    title: 'No raw-vector bitwise mismatch',
    forbiddenConstruct: 'assigning a raw std_logic_vector bitwise expression into unsigned/signed storage',
    legalReplacementPattern: 'convert both operands into the destination typed domain before applying the VHDL keyword operator',
  },
  {
    code: 'typed_unary_mismatch',
    title: 'No raw-vector unary mismatch',
    forbiddenConstruct: 'assigning not std_logic_vector into unsigned/signed storage without conversion',
    legalReplacementPattern: 'convert the operand into the destination typed domain before applying not',
  },
  {
    code: 'typed_helper_actual_mismatch',
    title: 'No raw helper actual mismatch',
    forbiddenConstruct: 'passing std_logic_vector actuals into unsigned/signed formal parameters',
    legalReplacementPattern: 'convert the actual at the call site or change the helper formal type so they match exactly',
  },
  {
    code: 'typed_port_association_mismatch',
    title: 'No typed port-map association mismatch',
    forbiddenConstruct: 'port-map associations that drive unsigned/signed formals with raw std_logic_vector actuals or other mismatched typed domains',
    legalReplacementPattern: 'convert the actual expression into the exact formal type at the port map boundary, or change the formal/actual interface so both sides use the same typed domain',
  },
  {
    code: 'typed_function_result_mismatch',
    title: 'No raw helper return mismatch',
    forbiddenConstruct: 'assigning a std_logic_vector helper/function result directly into unsigned/signed storage',
    legalReplacementPattern: 'make the helper return unsigned/signed directly, or convert the function result explicitly at the assignment site',
  },
  {
    code: 'scalar_bit_string_assignment',
    title: 'No bit strings into scalar numerics',
    forbiddenConstruct: 'assigning bit-string literals like "11" to integer, natural, or positive objects',
    legalReplacementPattern: 'use a numeric literal or an explicit typed conversion instead of a bit string',
  },
  {
    code: 'missing_std_logic_1164_clause',
    title: 'Every file must import std_logic_1164 locally',
    forbiddenConstruct: 'using std_logic/std_ulogic/std_logic_vector without a local ieee.std_logic_1164 use clause',
    legalReplacementPattern: 'add library ieee; and use ieee.std_logic_1164.all; in the same file',
  },
  {
    code: 'missing_numeric_std_clause',
    title: 'Every numeric_std user must import it locally',
    forbiddenConstruct: 'using unsigned, signed, resize, to_integer, to_unsigned, or to_signed without a local ieee.numeric_std use clause',
    legalReplacementPattern: 'add use ieee.numeric_std.all; in the same file that uses the numeric_std feature',
  },
  {
    code: 'illegal_multidimensional_logic_vector',
    title: 'No multidimensional packed vector declarations',
    forbiddenConstruct: 'forms like std_logic_vector(...)(...) or similar packed vector-of-vector declarations',
    legalReplacementPattern: 'declare a named array type for vectors-of-vectors, or flatten into one legal vector',
  },
  {
    code: 'anonymous_array_object_declaration',
    title: 'No anonymous array object declarations',
    forbiddenConstruct: 'declaring a signal, variable, or constant with inline array(...) of ... syntax',
    legalReplacementPattern: 'declare a named array type or subtype first, then declare the object using that named type',
  },
  {
    code: 'reconstrained_subtype_alias',
    title: 'No re-constraining constrained aliases',
    forbiddenConstruct: 'subtype declarations that re-constrain an already constrained subtype/type alias',
    legalReplacementPattern: 'reuse the existing subtype unchanged, or derive a new legal subtype from the true base type',
  },
  {
    code: 'subprogram_body_inside_package_declaration',
    title: 'No subprogram bodies inside package declarations',
    forbiddenConstruct: 'function/procedure bodies inside package declarations',
    legalReplacementPattern: 'keep only signatures in the package declaration and move executable bodies into the package body',
  },
  {
    code: 'undeclared_interface_dimension_reference',
    title: 'No undeclared dimensions in interfaces',
    forbiddenConstruct: 'port/generic dimensions that reference undeclared generics, constants, or widths',
    legalReplacementPattern: 'declare the controlling generic/constant before use, or replace it with a legal explicit dimension',
  },
  {
    code: 'illegal_scalar_type_alias',
    title: 'No type keyword for scalar range aliases',
    forbiddenConstruct: 'declaring constrained integer/natural/positive aliases with type ... is ... range',
    legalReplacementPattern: 'use subtype for constrained scalar aliases instead of type',
  },
  {
    code: 'executable_region_signal_declaration',
    title: 'No signal declarations in executable regions',
    forbiddenConstruct: 'signal declarations inside process bodies or other executable regions after begin',
    legalReplacementPattern: 'move the signal to a legal declarative region before begin, or use a process-local variable',
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
