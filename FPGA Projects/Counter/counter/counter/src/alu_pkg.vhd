library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package alu_pkg is
    type alu_op_t is (
        ADD_OP, SUB_OP,
        AND_OP, OR_OP, XOR_OP,
        NOT_OP, SLT_OP,
        MOV_OP
    );

    type alu_flags_t is record
        zero     : std_logic;
        carry    : std_logic;
        overflow : std_logic;
        less     : std_logic;
    end record;

    function alu_calc(
        a      : std_logic_vector;
        b      : std_logic_vector;
        op     : alu_op_t
    ) return std_logic_vector;

    function alu_flags(
        a      : std_logic_vector;
        b      : std_logic_vector;
        op     : alu_op_t;
        result : std_logic_vector
    ) return alu_flags_t;
end package alu_pkg;

package body alu_pkg is
    function alu_calc(
        a      : std_logic_vector;
        b      : std_logic_vector;
        op     : alu_op_t
    ) return std_logic_vector is
        variable a_val : unsigned(a'range);
        variable b_val : unsigned(b'range);
        variable res   : unsigned(a'range);
        variable tmp   : unsigned(a'length + 1 downto 0);
    begin
        a_val := to_unsigned(to_integer(unsigned(a)), a'length);
        b_val := to_unsigned(to_integer(unsigned(b)), b'length);

        case op is
            when ADD_OP =>
                tmp := ('0' & a_val) + ('0' & b_val);
                res := tmp(tmp'high-1 downto tmp'low);
            when SUB_OP =>
                if a_val >= b_val then
                    res := a_val - b_val;
                else
                    res := (others => '0');
                end if;
            when AND_OP =>
                res := a and b;
            when OR_OP =>
                res := a or b;
            when XOR_OP =>
                res := a xor b;
            when NOT_OP =>
                res := not a;
            when SLT_OP =>
                if a_val < b_val then
                    res := (a'range => '1');
                else
                    res := (others => '0');
                end if;
            when MOV_OP =>
                res := a;
            when others =>
                res := (others => '0');
        end case;

        return std_logic_vector(res);
    end function alu_calc;

    function alu_flags(
        a      : std_logic_vector;
        b      : std_logic_vector;
        op     : alu_op_t;
        result : std_logic_vector
    ) return alu_flags_t is
        variable flags : alu_flags_t;
        variable a_val : unsigned(a'range);
        variable b_val : unsigned(b'range);
        variable tmp   : unsigned(a'length + 1 downto 0);
    begin
        a_val := to_unsigned(to_integer(unsigned(a)), a'length);
        b_val := to_unsigned(to_integer(unsigned(b)), b'length);

        flags.zero := '0';
        flags.carry := '0';
        flags.overflow := '0';
        flags.less := '0';

        case op is
            when ADD_OP =>
                tmp := ('0' & a_val) + ('0' & b_val);
                flags.carry := tmp(tmp'high);
                if a_val >= 0 and b_val >= 0 and tmp(tmp'high-1 downto tmp'low) < a_val then
                    flags.overflow := '1';
                elsif a_val < 0 and b_val < 0 and tmp(tmp'high-1 downto tmp'low) >= a_val then
                    flags.overflow := '1';
                end if;
            when SUB_OP =>
                tmp := ('0' & a_val) - ('0' & b_val);
                flags.carry := '1'; 
                if a_val >= 0 and b_val < 0 and tmp(tmp'high-1 downto tmp'low) >= a_val then
                    flags.overflow := '1';
                elsif a_val < 0 and b_val >= 0 and tmp(tmp'high-1 downto tmp'low) < a_val then
                    flags.overflow := '1';
                end if;
            when SLT_OP =>
                if a_val < b_val then
                    flags.less := '1';
                end if;
            when others =>
                null;
        end case;

        if to_integer(unsigned(result)) = 0 then
            flags.zero := '1';
        end if;

        return flags;
    end function alu_flags;
end package body alu_pkg;