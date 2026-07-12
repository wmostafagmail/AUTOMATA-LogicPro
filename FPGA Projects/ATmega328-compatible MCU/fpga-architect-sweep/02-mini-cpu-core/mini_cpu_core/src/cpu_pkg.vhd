library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package cpu_pkg is
  constant CPU_W : integer := 8;
  subtype cpu_t is unsigned(CPU_W-1 downto 0);
  
  type op_code_t is (OP_ADD, OP_SUB, OP_AND, OP_OR, OP_LDI);
  
  type reg_file_t is array (0 to 7) of cpu_t;
  
  type instr_t is record
    opcode : op_code_t;
    dest   : integer range 0 to 7;
    src    : integer range 0 to 7;
    imm    : cpu_t;
    addr   : cpu_t;
  end record;
  
  type instr_rom_t is array (0 to 255) of instr_t;
  
end package cpu_pkg;
