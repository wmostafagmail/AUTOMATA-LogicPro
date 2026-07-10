import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RECURRING_VHDL_FAILURE_GUARDS,
  buildRecurringVhdlFailureGuardSection,
} from '../src/server/recurringVhdlFailureGuards';

test('recurring VHDL failure guards cover the phase 3 numeric/type discipline classes', () => {
  const guardCodes = new Set(RECURRING_VHDL_FAILURE_GUARDS.map((guard) => guard.code));

  for (const code of [
    'architecture_body_variable',
    'illegal_numeric_logical_hybrid',
    'resize_on_raw_std_logic_vector',
    'resize_with_range_attribute',
    'to_integer_on_raw_logic_type',
    'typed_bitwise_mismatch',
    'typed_unary_mismatch',
    'typed_helper_actual_mismatch',
    'typed_port_association_mismatch',
    'scalar_bit_string_assignment',
    'runtime_bound_check_risk',
  ]) {
    assert.ok(guardCodes.has(code), `missing recurring guard for ${code}`);
  }
});

test('recurring VHDL failure guards cover the phase 4 import/package/array/subtype classes', () => {
  const guardCodes = new Set(RECURRING_VHDL_FAILURE_GUARDS.map((guard) => guard.code));

  for (const code of [
    'missing_std_logic_1164_clause',
    'missing_numeric_std_clause',
    'illegal_multidimensional_logic_vector',
    'anonymous_array_object_declaration',
    'reconstrained_subtype_alias',
    'subprogram_body_inside_package_declaration',
    'undeclared_interface_dimension_reference',
    'illegal_scalar_type_alias',
    'executable_region_signal_declaration',
  ]) {
    assert.ok(guardCodes.has(code), `missing recurring guard for ${code}`);
  }
});

test('rendered recurring guard section includes high-signal numeric and package guidance', () => {
  const section = buildRecurringVhdlFailureGuardSection({
    heading: 'Always-on recurring failure guards',
    numbered: true,
  });

  assert.match(section, /Failure code: resize_on_raw_std_logic_vector/);
  assert.match(section, /Failure code: architecture_body_variable/);
  assert.match(section, /Failure code: typed_helper_actual_mismatch/);
  assert.match(section, /Failure code: typed_port_association_mismatch/);
  assert.match(section, /Failure code: illegal_multidimensional_logic_vector/);
  assert.match(section, /Failure code: anonymous_array_object_declaration/);
  assert.match(section, /Failure code: subprogram_body_inside_package_declaration/);
});
