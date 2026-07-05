library ieee;
use ieee.std_logic_1164.all;

package alu_pkg is
  constant OP_ADD : std_logic_vector(2 downto 0) := "000";
  constant OP_SUB : std_logic_vector(2 downto 0) := "001";
  constant OP_AND : std_logic_vector(2 downto 0) := "010";
  constant OP_OR  : std_logic_vector(2 downto 0) := "011";
  constant OP_XOR : std_logic_vector(2 downto 0) := "100";
  constant OP_NOT : std_logic_vector(2 downto 0) := "101";
  constant OP_INC : std_logic_vector(2 downto 0) := "110";
  constant OP_SLL : std_logic_vector(2 downto 0) := "111";
end package alu_pkg;