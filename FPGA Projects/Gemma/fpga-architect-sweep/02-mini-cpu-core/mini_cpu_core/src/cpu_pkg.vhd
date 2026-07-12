library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package cpu_pkg is
    -- Register count and width
    constant REG_COUNT : integer := 8;
    constant WORD_WIDTH : integer := 8;

    -- Opcode Definitions
    subtype opcode_t is std_logic_vector(3 downto 0);
    constant OP_NOP   : opcode_t := "0000"; -- No Operation
    constant OP_LOAD  : opcode_t := "0001"; -- LOAD R_dest, Addr (R[dest] = Mem[Addr])
    constant OP_STORE : opcode_t := "0010"; -- STORE R_src, Addr (Mem[Addr] = R[src])
    constant OP_ADD   : opcode_t := "0011"; -- ADD R_dest, R_src (R[dest] = R[dest] + R[src])
    constant OP_SUB   : opcode_t := "0100"; -- SUB R_dest, R_src (R[dest] = R[dest] - R[src])
    constant OP_AND   : opcode_t := "0101"; -- AND R_dest, R_src (R[dest] = R[dest] and R[src])
    constant OP_OR    : opcode_t := "0110"; -- OR R_dest, R_src (R[dest] = R[dest] or R[src])
    constant OP_JUMP  : opcode_t := "0111"; -- JUMP Addr (PC = Addr)
    constant OP_BZ    : opcode_t := "1000"; -- BZ R_src, Offset (If R[src]==0 PC = PC + Offset)

end package cpu_pkg;