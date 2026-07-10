library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.cpu_pkg.all;

entity alu is
    port (
        opcode    : in  opcode_t;
        operand_a : in  std_logic_vector(7 downto 0);
        operand_b : in  std_logic_vector(7 downto 0);
        result_o  : out std_logic_vector(7 downto 0);
        zero_o    : out std_logic
    );
end entity alu;

architecture rtl of alu is
begin
    process(opcode, operand_a, operand_b)
        variable a_u : unsigned(7 downto 0);
        variable b_u : unsigned(7 downto 0);
        variable res_u : unsigned(7 downto 0);
        variable zero_internal : std_logic;
    begin
        -- Normalization of input ports to typed internal operands
        a_u := unsigned(operand_a);
        b_u := unsigned(operand_b);
        res_u := (others => '0');

        case opcode is
            when OP_ADD =>
                res_u := a_u + b_u;
            when OP_SUB =>
                res_u := a_u - b_u;
            when OP_LOGIC_AND =>
                res_u := a_u and b_u;
            when OP_LOGIC_OR  =>
                res_u := a_u or b_u;
            when others =>
                res_u := (others => '0');
        end case;

        -- Derive flags from typed result
        if res_u = 0 then
            zero_internal := '1';
        else
            zero_internal := '0';
        end if;

        result_o <= std_logic_vector(res_u);
        zero_o   <= zero_internal;
    end process;
end architecture rtl;