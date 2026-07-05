library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package alu_pkg is
    constant ALU_ADD : std_logic_vector(2 downto 0) := "000";
    constant ALU_SUB : std_logic_vector(2 downto 0) := "001";
    constant ALU_AND : std_logic_vector(2 downto 0) := "010";
    constant ALU_OR  : std_logic_vector(2 downto 0) := "011";
    constant ALU_XOR : std_logic_vector(2 downto 0) := "100";
    constant ALU_NOT : std_logic_vector(2 downto 0) := "101";
    constant ALU_SHL : std_logic_vector(2 downto 0) := "110";
    constant ALU_SHR : std_logic_vector(2 downto 0) := "111";
end package alu_pkg;