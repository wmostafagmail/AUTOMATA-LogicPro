library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package cpu_pkg is
  constant OP_ADD  : unsigned(3 downto 0) := x"1";
  constant OP_SUB  : unsigned(3 downto 0) := x"2";
  constant OP_AND  : unsigned(3 downto 0) := x"3";
  constant OP_OR   : unsigned(3 downto 0) := x"4";
  constant OP_LOAD : unsigned(3 downto 0) := x"5";
  constant OP_JMP  : unsigned(3 downto 0) := x"6";
  constant OP_HALT : unsigned(3 downto 0) := x"7";
  
  subtype reg_idx_t is unsigned(1 downto 0);
  subtype addr_t is unsigned(7 downto 0);
  subtype data_t is unsigned(7 downto 0);
end package cpu_pkg;