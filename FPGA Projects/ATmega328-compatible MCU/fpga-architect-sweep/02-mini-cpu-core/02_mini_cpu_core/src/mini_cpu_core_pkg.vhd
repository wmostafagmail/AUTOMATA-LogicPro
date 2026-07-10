library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package mini_cpu_core_pkg is

    constant DATA_WIDTH_VAL : natural := 8;
    constant ADDR_WIDTH_VAL : natural := 16;

    subtype reg_idx_t is natural range 0 to 15;
    type instr_t is std_logic_vector(7 downto 0);
    subtype addr_t is unsigned(ADDR_WIDTH_VAL-1 downto 0);
    subtype data_signed_t is signed(DATA_WIDTH_VAL-1 downto 0);
    subtype data_unsigned_t is unsigned(DATA_WIDTH_VAL-1 downto 0);

    type opcode_t is (
        OP_NOP,
        OP_ADD,
        OP_SUB,
        OP_AND_OPC,
        OP_OR_OPC,
        OP_XNOR_OPC,
        OP_SLL_OPC,
        OP_SRL_OPC,
        OP_LW_OPC,
        OP_SW_OPC,
        OP_BEQ_OPC,
        OP_JAL_OPC
    );

end package mini_cpu_core_pkg;

package body mini_cpu_core_pkg is
end package body mini_cpu_core_pkg;