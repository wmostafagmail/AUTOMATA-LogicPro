library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package alu_pkg is

  constant ALU_DATA_WIDTH : integer := 8;

  subtype alu_data_t is unsigned(ALU_DATA_WIDTH - 1 downto 0);

  type alu_opcode_t is (
    OP_ADD,
    OP_SUB,
    OP_AND_OP,
    OP_OR_OP,
    OP_XOR_OP,
    OP_NOT_OP,
    OP_SLA_OP,
    OP_SRA_OP
  );

  subtype opcode_index_t is integer range 0 to 7;

  type alu_result_t is record
    result_val   : alu_data_t;
    zero_flag    : std_logic;
  end record;

end package alu_pkg;