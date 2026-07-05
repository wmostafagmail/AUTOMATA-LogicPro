library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package alu_pkg is

    constant DEFAULT_DATA_WIDTH : integer := 8;

    type alu_op_t is (
        ALU_OP_ADD,
        ALU_OP_SUB,
        ALU_OP_AND,
        ALU_OP_OR,
        ALU_OP_XOR,
        ALU_OP_NOT,
        ALU_OP_SLL,
        ALU_OP_SRL,
        ALU_OP_NOP
    );

    type alu_flags_t is record
        zero  : std_logic;
        carry : std_logic;
    end record;

    constant DEFAULT_FLAGS : alu_flags_t := (zero => '1', carry => '0');

    function calc_result(
        a      : in  std_logic_vector;
        b      : in  std_logic_vector;
        op     : in  alu_op_t
    ) return std_logic_vector;

    function calc_flags(
        a      : in  std_logic_vector;
        b      : in  std_logic_vector;
        res    : in  std_logic_vector;
        op     : in  alu_op_t
    ) return alu_flags_t;

end package alu_pkg;

package body alu_pkg is

    function calc_result(
        a      : in  std_logic_vector;
        b      : in  std_logic_vector;
        op     : in  alu_op_t
    ) return std_logic_vector is
        variable a_u       : unsigned(a'range);
        variable b_u       : unsigned(b'range);
        variable res_u     : unsigned(a'range);
        variable shift_cnt : integer;
    begin
        a_u := unsigned(a);
        b_u := unsigned(b);

        case op is
            when ALU_OP_ADD =>
                res_u := a_u + b_u;
            when ALU_OP_SUB =>
                res_u := a_u - b_u;
            when ALU_OP_AND =>
                res_u := a_u and b_u;
            when ALU_OP_OR  =>
                res_u := a_u or b_u;
            when ALU_OP_XOR =>
                res_u := a_u xor b_u;
            when ALU_OP_NOT =>
                res_u := not a_u;
            when ALU_OP_SLL =>
                shift_cnt := to_integer(b_u);
                res_u   := shift_left(a_u, shift_cnt);
            when ALU_OP_SRL =>
                shift_cnt := to_integer(b_u);
                res_u   := shift_right(a_u, shift_cnt);
            when others =>
                res_u := (others => '0');
        end case;

        return std_logic_vector(res_u);
    end function calc_result;

    function calc_flags(
        a      : in  std_logic_vector;
        b      : in  std_logic_vector;
        res    : in  std_logic_vector;
        op     : in  alu_op_t
    ) return alu_flags_t is
        variable a_u       : unsigned(a'range);
        variable b_u       : unsigned(b'range);
        variable res_u     : unsigned(res'range);
        variable flags     : alu_flags_t;
        variable sum_wide  : unsigned(res'length downto 0);
    begin
        a_u := unsigned(a);
        b_u := unsigned(b);
        res_u := unsigned(res);

        flags.zero  := '0';
        flags.carry := '0';

        if res_u = to_unsigned(0, res_u'length) then
            flags.zero := '1';
        end if;

        if op = ALU_OP_ADD or op = ALU_OP_SUB then
            sum_wide := resize(a_u, res_u'length + 1) + resize(b_u, res_u'length + 1);
            if op = ALU_OP_ADD then
                flags.carry := sum_wide(sum_wide'high);
            else
                flags.carry := not sum_wide(sum_wide'high);
            end if;
        end if;

        return flags;
    end function calc_flags;

end package body alu_pkg;