library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package cpu_pkg is
    -- Data and Address Widths
    constant DATA_WIDTH : integer := 8;
    constant ADDR_WIDTH : integer := 8;
    constant INST_WIDTH : integer := 16;

    -- Opcode definitions (Avoiding reserved keywords)
    subtype opcode_t is std_logic_vector(3 downto 0);
    constant OP_HALT      : opcode_t := x"0";
    constant OP_LOAD      : opcode_t := x"1"; -- Load Reg, Addr
    constant OP_STORE     : opcode_t := x"2"; -- Store Reg, Addr
    constant OP_ADD       : opcode_t := x"3"; -- RegD = RegA + Imm
    constant OP_SUB       : opcode_t := x"4"; -- RegD = RegA - Imm
    constant OP_LOGIC_AND : opcode_t := x"5"; 
    constant OP_LOGIC_OR  : opcode_t := x"6";
    constant OP_JUMP      : opcode_t := x"7"; -- PC = Addr

end package cpu_pkg;