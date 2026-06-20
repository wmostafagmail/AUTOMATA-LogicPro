library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package cpu_pkg is
  subtype byte_t is std_logic_vector(7 downto 0);
  subtype word_t is std_logic_vector(15 downto 0);
  subtype reg_idx_t is std_logic_vector(2 downto 0);
  subtype opcode_t is std_logic_vector(3 downto 0);

  type prog_mem_t is array (0 to 255) of word_t;

  type cpu_state_t is (
    CPU_S_RESET,
    CPU_S_FETCH,
    CPU_S_DECODE,
    CPU_S_EXEC_ALU,
    CPU_S_EXEC_IMM,
    CPU_S_MEM_READ,
    CPU_S_MEM_WRITEBACK,
    CPU_S_MEM_WRITE,
    CPU_S_BRANCH,
    CPU_S_HALT
  );

  type alu_op_t is (
    ALU_PASS_RS,
    ALU_ADD,
    ALU_SUB,
    ALU_AND,
    ALU_OR,
    ALU_XOR
  );

  constant OP_NOP  : opcode_t := x"0";
  constant OP_MOV  : opcode_t := x"1";
  constant OP_LDI  : opcode_t := x"2";
  constant OP_ADD  : opcode_t := x"3";
  constant OP_SUB  : opcode_t := x"4";
  constant OP_AND  : opcode_t := x"5";
  constant OP_OR   : opcode_t := x"6";
  constant OP_XOR  : opcode_t := x"7";
  constant OP_CMP  : opcode_t := x"8";
  constant OP_LD   : opcode_t := x"9";
  constant OP_ST   : opcode_t := x"A";
  constant OP_JMP  : opcode_t := x"B";
  constant OP_JZ   : opcode_t := x"C";
  constant OP_JNZ  : opcode_t := x"D";
  constant OP_OUT  : opcode_t := x"E";
  constant OP_HALT : opcode_t := x"F";

  constant RAM_LIMIT_ADDR   : byte_t := x"DF";
  constant MMIO_BASE_ADDR   : byte_t := x"F0";
  constant LED_ADDR         : byte_t := x"F0";
  constant UART_TX_ADDR     : byte_t := x"F1";
  constant UART_STATUS_ADDR : byte_t := x"F2";
end package;

package body cpu_pkg is
end package body;
