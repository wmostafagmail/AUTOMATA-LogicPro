library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity alu is
  port (
    clk        : in  std_logic;
    rst        : in  std_logic;
    op         : in  alu_op_t;
    a          : in  std_logic_vector(7 downto 0);
    b          : in  std_logic_vector(7 downto 0);
    result     : out std_logic_vector(7 downto 0);
    flags      : out alu_flags_t
  );
end entity alu;

architecture rtl of alu is
  signal result_reg : unsigned(7 downto 0);
  signal flags_reg  : alu_flags_t;
begin
  result <= std_logic_vector(result_reg);
  flags  <= flags_reg;

  process(clk)
    variable next_result : unsigned(7 downto 0);
    variable next_flags  : alu_flags_t;
    variable a_u         : unsigned(7 downto 0);
    variable b_u         : unsigned(7 downto 0);
  begin
    a_u := unsigned(a);
    b_u := unsigned(b);

    next_result := (others => '0');
    next_flags.zero      := '0';
    next_flags.carry_out := '0';
    next_flags.overflow  := '0';

    case op is
      when OP_ADD =>
        next_result := resize(a_u + b_u, next_result'length);
        next_flags.carry_out := '1' when (a_u + b_u) > to_unsigned(255, 9) else '0';
        next_flags.overflow  := '1' when (a_u(7) = b_u(7)) and (a_u(7) /= next_result(7)) else '0';
      when OP_SUB =>
        next_result := resize(a_u - b_u, next_result'length);
        next_flags.carry_out := '0' when a_u >= b_u else '1';
        next_flags.overflow  := '1' when (a_u(7) /= b_u(7)) and (a_u(7) = next_result(7)) else '0';
      when OP_AND =>
        next_result := a_u and b_u;
        next_flags.carry_out := '0';
        next_flags.overflow  := '0';
      when OP_OR =>
        next_result := a_u or b_u;
        next_flags.carry_out := '0';
        next_flags.overflow  := '0';
      when OP_XOR =>
        next_result := a_u xor b_u;
        next_flags.carry_out := '0';
        next_flags.overflow  := '0';
      when OP_NOT =>
        next_result := not a_u;
        next_flags.carry_out := '0';
        next_flags.overflow  := '0';
      when OP_SLL =>
        next_result := shift_left(a_u, to_integer(b_u(3 downto 0)));
        next_flags.carry_out := '0';
        next_flags.overflow  := '0';
      when OP_SRL =>
        next_result := shift_right(a_u, to_integer(b_u(3 downto 0)));
        next_flags.carry_out := '0';
        next_flags.overflow  := '0';
      when others =>
        next_result := (others => '0');
        next_flags.carry_out := '0';
        next_flags.overflow  := '0';
    end case;

    if rising_edge(clk) then
      if rst = '1' then
        result_reg <= (others => '0');
        flags_reg.zero      <= '0';
        flags_reg.carry_out <= '0';
        flags_reg.overflow  <= '0';
      else
        result_reg <= next_result;
        flags_reg  <= next_flags;
      end if;
    end if;
  end process;
end architecture rtl;