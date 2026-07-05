import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMacroSystemPrompt } from '../src/server/macroSystemPrompts';
import {
  buildCodeGeneratingMacroRuleList,
  GHDL_STRICT_VHDL_RULE_FAMILIES,
} from '../src/server/ghdlStrictVhdlRules';

test('all code-generating macro system prompts include the shared strict GHDL/VHDL rule section', () => {
  const macroIds = [
    'fpga_vhdl_architect',
    'generate_vhdl_tb',
    'generate_vhdl_assertions',
    'draft_rtl_skeleton',
  ] as const;

  for (const macroId of macroIds) {
    const prompt = buildMacroSystemPrompt({
      macroId,
      waveformText: '',
      protocolMarkdown: '',
      hazardMarkdown: '',
      exportPolicyText: '',
      projectText: '',
      customQueryMode: null,
    });

    assert.match(prompt, /## Strict GHDL \/ VHDL Rules/);
    assert.match(prompt, /Do not use any VHDL reserved word, operator token, or predefined language keyword as an identifier anywhere in generated code\./);
    assert.match(prompt, /Numeric_std functions such as `resize`, `shift_left`, and `shift_right` operate on `unsigned` or `signed`, not raw `std_logic_vector`\./);
    assert.match(prompt, /Do not place helper state such as `current_test`, `expected_count`, `pass_count`, `fail_count`, `res_int`/);
    assert.match(prompt, /Before returning the final answer, run a zero-tolerance self-audit across every generated VHDL file\./);
    assert.match(prompt, /Blocked constructs include declarations after any architecture\/process\/subprogram `begin`, helper procedures\/functions that mutate outer-scope state, output-port readback inside implementation logic, and signal\/variable assignment operator misuse\./);
  }
});

test('shared strict VHDL rules are grouped into explicit families and exposed to code-generating macros', () => {
  const rules = buildCodeGeneratingMacroRuleList('fpga_vhdl_architect');

  assert.ok(GHDL_STRICT_VHDL_RULE_FAMILIES.declarationScope.length > 0);
  assert.ok(GHDL_STRICT_VHDL_RULE_FAMILIES.identifierReservedWord.length > 0);
  assert.ok(GHDL_STRICT_VHDL_RULE_FAMILIES.numericStdTypeDiscipline.length > 0);
  assert.ok(GHDL_STRICT_VHDL_RULE_FAMILIES.packageTypeDefinition.length > 0);
  assert.ok(GHDL_STRICT_VHDL_RULE_FAMILIES.interfaceGenericPortSyntax.length > 0);
  assert.ok(GHDL_STRICT_VHDL_RULE_FAMILIES.simulationSuccess.length > 0);

  assert.ok(rules.some((rule) => rule.includes('No multidimensional `std_logic_vector(...) (...)` declarations')));
  assert.ok(rules.some((rule) => rule.includes('Do not re-constrain an already constrained subtype or alias')));
  assert.ok(rules.some((rule) => rule.includes('Use `<=` only for signals and `:=` only for variables/constants')));
  assert.ok(rules.some((rule) => rule.includes('Do not reference undeclared generics, constants, widths, or helper identifiers inside interface/type declarations')));
  assert.ok(rules.some((rule) => rule.includes('Do not declare helper procedures/functions inside a process body or after the architecture `begin`')));
  assert.ok(rules.some((rule) => rule.includes('compute through an internal mirror signal/variable first')));
});
