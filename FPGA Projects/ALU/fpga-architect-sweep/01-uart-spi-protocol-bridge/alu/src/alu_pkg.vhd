library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package alu_pkg is
    constant ALU_OP_ADD  : unsigned(2 downto 0) := "000";
    constant ALU_OP_SUB  : unsigned(2 downto 0) := "001";
    constant ALU_OP_AND  : unsigned(2 downto 0) := "010";
    constant ALU_OP_OR   : unsigned(2 downto 0) := "011";
    constant ALU_OP_XNOR : unsigned(2 downto 0) := "100";

    function alu_compute(a : unsigned; b : unsigned; op : unsigned) return unsigned;
end package alu_pkg;

package body alu_pkg is
    function alu_compute(a : unsigned; b : unsigned; op : unsigned) return unsigned is
        variable res : unsigned(a'length-1 downto 0);
    begin
        res := (others => '0');
        case op is
            when ALU_OP_ADD =>
                res := resize(a + b, a'length);
            when ALU_OP_SUB =>
                res := resize(a - b, a'length);
            when ALU_OP_AND =>
                res := a and b;
            when ALU_OP_OR =>
                res := a or b;
            when ALU_OP_XNOR =>
                res := a xnor b;
            when others =>
                res := a;
        end case;
        return res;
    end function alu_compute;
end package body alu_pkg;