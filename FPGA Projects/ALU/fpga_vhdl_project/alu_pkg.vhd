library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package alu_pkg is
  constant DATA_WIDTH : positive := 8;

  type alu_op_t is (
    OP_ADD,
    OP_SUB,
    OP_AND,
    OP_OR,
    OP_XOR,
    OP_NOT_A,
    OP_SLL,
    OP_SRL
  );

  type alu_flags_t is record
    zero_flag      : std_logic;
    carry_flag     : std_logic;
    overflow_flag  : std_logic;
  end record;

  function compute_alu_op(
    a_in       : in  std_logic_vector(DATA_WIDTH - 1 downto 0);
    b_in       : in  std_logic_vector(DATA_WIDTH - 1 downto 0);
    op_code    : in  alu_op_t
  ) return std_logic_vector;

  function compute_flags(
    a_in       : in  std_logic_vector(DATA_WIDTH - 1 downto 0);
    b_in       : in  std_logic_vector(DATA_WIDTH - 1 downto 0);
    op_code    : in  alu_op_t;
    res        : in  std_logic_vector(DATA_WIDTH - 1 downto 0)
  ) return alu_flags_t;

end package alu_pkg;

package body alu_pkg is

  function compute_alu_op(
    a_in       : in  std_logic_vector(DATA_WIDTH - 1 downto 0);
    b_in       : in  std_logic_vector(DATA_WIDTH - 1 downto 0);
    op_code    : in  alu_op_t
  ) return std_logic_vector is
    variable a_u : unsigned(DATA_WIDTH - 1 downto 0);
    variable b_u : unsigned(DATA_WIDTH - 1 downto 0);
    variable a_s : signed(DATA_WIDTH - 1 downto 0);
    variable b_s : signed(DATA_WIDTH - 1 downto 0);
    variable res_u : unsigned(DATA_WIDTH - 1 downto 0);
    variable res_s : signed(DATA_WIDTH - 1 downto 0);
    variable res_slv : std_logic_vector(DATA_WIDTH - 1 downto 0);
  begin
    a_u := unsigned(a_in);
    b_u := unsigned(b_in);
    a_s := signed(a_in);
    b_s := signed(b_in);

    case op_code is
      when OP_ADD =>
        res_u := a_u + b_u;
        res_slv := std_logic_vector(res_u);
      when OP_SUB =>
        res_u := a_u - b_u;
        res_slv := std_logic_vector(res_u);
      when OP_AND =>
        res_slv := std_logic_vector(a_u and b_u);
      when OP_OR =>
        res_slv := std_logic_vector(a_u or b_u);
      when OP_XOR =>
        res_slv := std_logic_vector(a_u xor b_u);
      when OP_NOT_A =>
        res_slv := std_logic_vector(not a_u);
      when OP_SLL =>
        res_u := shift_left(a_u, to_integer(b_u(DATA_WIDTH - 1 downto 0)));
        res_slv := std_logic_vector(res_u);
      when OP_SRL =>
        res_u := shift_right(a_u, to_integer(b_u(DATA_WIDTH - 1 downto 0)));
        res_slv := std_logic_vector(res_u);
      when others =>
        res_slv := (others => '0');
    end case;

    return res_slv;
  end function compute_alu_op;

  function compute_flags(
    a_in       : in  std_logic_vector(DATA_WIDTH - 1 downto 0);
    b_in       : in  std_logic_vector(DATA_WIDTH - 1 downto 0);
    op_code    : in  alu_op_t;
    res        : in  std_logic_vector(DATA_WIDTH - 1 downto 0)
  ) return alu_flags_t is
    variable a_u : unsigned(DATA_WIDTH - 1 downto 0);
    variable b_u : unsigned(DATA_WIDTH - 1 downto 0);
    variable a_s : signed(DATA_WIDTH - 1 downto 0);
    variable b_s : signed(DATA_WIDTH - 1 downto 0);
    variable res_u : unsigned(DATA_WIDTH - 1 downto 0);
    variable res_s : signed(DATA_WIDTH - 1 downto 0);
    variable flags : alu_flags_t;
    variable add_raw : unsigned(DATA_WIDTH downto 0);
    variable sub_raw : unsigned(DATA_WIDTH downto 0);
  begin
    a_u := unsigned(a_in);
    b_u := unsigned(b_in);
    a_s := signed(a_in);
    b_s := signed(b_in);
    res_u := unsigned(res);
    res_s := signed(res);

    flags.zero_flag := '0';
    flags.carry_flag := '0';
    flags.overflow_flag := '0';

    case op_code is
      when OP_ADD =>
        add_raw := resize(a_u, DATA_WIDTH + 1) + resize(b_u, DATA_WIDTH + 1);
        flags.carry_flag := add_raw(DATA_WIDTH);
        if (a_s(DATA_WIDTH - 1) = b_s(DATA_WIDTH - 1)) and
           (a_s(DATA_WIDTH - 1) /= add_raw(DATA_WIDTH - 1)) then
          flags.overflow_flag := '1';
        end if;
      when OP_SUB =>
        sub_raw := resize(a_u, DATA_WIDTH + 1) - resize(b_u, DATA_WIDTH + 1);
        flags.carry_flag := not sub_raw(DATA_WIDTH);
        if (a_s(DATA_WIDTH - 1) /= b_s(DATA_WIDTH - 1)) and
           (a_s(DATA_WIDTH - 1) /= sub_raw(DATA_WIDTH - 1)) then
          flags.overflow_flag := '1';
        end if;
      when others =>
        null;
    end case;

    return flags;
  end function compute_flags;

end package body alu_pkg;