library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package alu_pkg is
    subtype op_code_t is std_logic_vector(3 downto 0);
    constant OP_ADD : op_code_t := "0000";
    constant OP_SUB : op_code_t := "0001";
    constant OP_AND : op_code_t := "0010";
    constant OP_OR  : op_code_t := "0011";
    constant OP_XOR : op_code_t := "0100";
    
    function get_zero_flag(result_val : unsigned) return std_logic;
    function get_overflow_flag(a_val : unsigned; b_val : unsigned; op : op_code_t; res_val : unsigned) return std_logic;
end package alu_pkg;

package body alu_pkg is
    function get_zero_flag(result_val : unsigned) return std_logic is
    begin
        if result_val = to_unsigned(0, result_val'length) then
            return '1';
        else
            return '0';
        end if;
    end function;

    function get_overflow_flag(a_val : unsigned; b_val : unsigned; op : op_code_t; res_val : unsigned) return std_logic is
        variable a_s : signed(a_val'range);
        variable b_s : signed(b_val'range);
        variable res_s : signed(res_val'range);
    begin
        a_s := to_signed(to_integer(a_val), a_s'length);
        b_s := to_signed(to_integer(b_val), b_s'length);
        res_s := to_signed(to_integer(res_val), res_s'length);
        
        if op = OP_ADD or op = OP_SUB then
            return (a_s(7) xor b_s(7)) and res_s(7);
        else
            return '0';
        end if;
    end function;
end package body alu_pkg;