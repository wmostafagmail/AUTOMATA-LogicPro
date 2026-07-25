import assert from 'node:assert/strict';
import test from 'node:test';
import { parseVhdlSemanticModel, tokenizeVhdl } from '../src/server/vhdlSemanticFrontend';

test('token-aware VHDL frontend ignores comments and parses interfaces and direct instances', () => {
  const source = `
library ieee;
use ieee.std_logic_1164.all;
-- entity fake is
entity bridge_top is
  generic (DATA_WIDTH : positive := 8);
  port (
    clk_i : in std_logic;
    data_i : in std_logic_vector(DATA_WIDTH - 1 downto 0);
    data_o : out std_logic_vector(DATA_WIDTH - 1 downto 0)
  );
end entity;
architecture rtl of bridge_top is
begin
  u_leaf : entity work.bridge_leaf
    generic map (DATA_WIDTH => DATA_WIDTH)
    port map (clk_i => clk_i, data_i => data_i, data_o => data_o);
end architecture;
`;
  const model = parseVhdlSemanticModel(source);
  assert.equal(model.entities.length, 1);
  assert.equal(model.entities[0].name, 'bridge_top');
  assert.deepEqual(model.entities[0].generics[0].names, ['DATA_WIDTH']);
  assert.equal(model.entities[0].generics[0].defaultValue, '8');
  assert.equal(model.entities[0].ports[2].mode, 'out');
  assert.equal(model.architectures[0].instances[0].entityName, 'bridge_leaf');
  assert.equal(model.architectures[0].instances[0].portMap.data_o, 'data_o');
  assert.equal(tokenizeVhdl(source).some((token) => token.text === 'fake'), false);
});

test('token-aware VHDL frontend parses package declarations separately from package bodies', () => {
  const model = parseVhdlSemanticModel(`
package cpu_pkg is
  subtype data_t is std_logic_vector(7 downto 0);
  type state_t is (FETCH, EXECUTE);
  constant RESET_PC : natural := 0;
end package;
package body cpu_pkg is end package body;
`);
  assert.equal(model.packages.length, 2);
  assert.equal(model.packages[0].isBody, false);
  assert.deepEqual(model.packages[0].exportedIdentifiers, ['data_t', 'state_t', 'RESET_PC']);
  assert.equal(model.packages[1].isBody, true);
});
