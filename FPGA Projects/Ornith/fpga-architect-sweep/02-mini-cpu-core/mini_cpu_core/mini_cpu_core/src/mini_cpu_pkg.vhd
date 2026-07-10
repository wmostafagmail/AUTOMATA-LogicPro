library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package mini_cpu_pkg is

  constant INSTRUCTION_WIDTH : integer := 16;
  constant REGISTER_COUNT    : integer := 4;
  constant REGISTER_WIDTH    : integer := 8;
  constant PC_WIDTH          : integer := 12;
  constant ADDR_WIDTH        : integer := 12;
  constant DATA_WIDTH        : integer := 8;

  subtype opcode_t is std_logic_vector(7 downto 0);
  constant OP_NOP    : opcode_t := "00000000";
  constant OP_LOAD   : opcode_t := "00000001";
  constant OP_STORE  : opcode_t := "00000010";
  constant OP_ADD    : opcode_t := "00000011";
  constant OP_SUB    : opcode_t := "00000100";
  constant OP_AND_OP : opcode_t := "00000101";
  constant OP_OR_OP  : opcode_t := "00000110";
  constant OP_XOR_OP : opcode_t := "00000111";
  constant OP_JMP    : opcode_t := "00001000";
  constant OP_BEQ    : opcode_t := "00001001";

  type instruction_t is record
    raw       : std_logic_vector(INSTRUCTION_WIDTH - 1 downto 0);
    opcode    : opcode_t;
    rs1       : std_logic_vector(1 downto 0);
    rs2       : std_logic_vector(1 downto 0);
    rd        : std_logic_vector(1 downto 0);
    immediate : unsigned(5 downto 0)
  end record;

  subtype alu_op_t is integer range 0 to 7;
  constant ALU_OP_ADD   : alu_op_t := 0;
  constant ALU_OP_SUB   : alu_op_t := 1;
  constant ALU_OP_AND   : alu_op_t := 2;
  constant ALU_OP_OR    : alu_op_t := 3;
  constant ALU_OP_XOR   : alu_op_t := 4;
  constant ALU_OP_SLL   : alu_op_t := 5;
  constant ALU_OP_SRL   : alu_op_t := 6;

  subtype cpu_state_t is integer range 0 to 3;
  constant STATE_FETCH    : cpu_state_t := 0;
  constant STATE_DECODE   : cpu_state_t := 1;
  constant STATE_EXECUTE  : cpu_state_t := 2;
  constant STATE_WRITEBACK: cpu_state_t := 3;

  function decode_instruction(raw : std_logic_vector(INSTRUCTION_WIDTH - 1 downto 0)) return instruction_t;
  function encode_instruction(ins : instruction_t) return std_logic_vector(INSTRUCTION_WIDTH - 1 downto 0);

end package mini_cpu_pkg;