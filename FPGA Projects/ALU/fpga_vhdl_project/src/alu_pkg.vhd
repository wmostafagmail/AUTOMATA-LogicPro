library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package alu_pkg is
  constant OP_ADD    : unsigned(2 downto 0) := to_unsigned(0, 3);
  constant OP_SUB    : unsigned(2 downto 0) := to_unsigned(1, 3);
  constant OP_AND    : unsigned(2 downto 0) := to_unsigned(2, 3);
  constant OP_OR     : unsigned(2 downto 0) := to_unsigned(3, 3);
  constant OP_XOR    : unsigned(2 downto 0) := to_unsigned(4, 3);
  constant OP_NOT    : unsigned(2 downto 0) := to_unsigned(5, 3);
  constant OP_SLL    : unsigned(2 downto 0) := to_unsigned(6, 3);
  constant OP_SRL    : unsigned(2 downto 0) := to_unsigned(7, 3);

  subtype opcode_t is unsigned(2 downto 0);

  type alu_flags_t is record
    zero     : std_logic;
    carry    : std_logic;
    overflow : std_logic;
  end record;
end package;

package body alu_pkg is
end package body;