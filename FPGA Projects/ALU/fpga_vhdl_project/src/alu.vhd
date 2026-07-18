library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity alu is
  port (
    clk_i   : in std_logic;
    rst_i   : in std_logic;
    a_i     : in std_logic_vector(7 downto 0);
    b_i     : in std_logic_vector(7 downto 0);
    op_i    : in opcode_t;
    y_o     : out std_logic_vector(7 downto 0);
    flags_o : out alu_flags_t
  );
end entity;

architecture rtl of alu is
  signal y_reg : unsigned(7 downto 0);
  signal flags_reg : alu_flags_t;
begin
  y_o <= std_logic_vector(y_reg);
  flags_o <= flags_reg;

  datapath_comb : process(all)
    variable a_u : unsigned(7 downto 0);
    variable b_u : unsigned(7 downto 0);
    variable y_tmp : unsigned(7 downto 0);
    variable flags_tmp : alu_flags_t;
  begin
    a_u := unsigned(a_i);
    b_u := unsigned(b_i);
    y_tmp := (others => '0');
    flags_tmp.zero := '0';
    flags_tmp.carry := '0';
    flags_tmp.overflow := '0';

    case op_i is
      when OP_ADD =>
        y_tmp := a_u + b_u;
      when OP_SUB =>
        y_tmp := a_u - b_u;
      when OP_AND =>
        y_tmp := a_u and b_u;
      when OP_OR =>
        y_tmp := a_u or b_u;
      when OP_XOR =>
        y_tmp := a_u xor b_u;
      when OP_NOT =>
        y_tmp := not a_u;
      when OP_SLL =>
        y_tmp := shift_left(a_u, to_integer(b_u));
      when OP_SRL =>
        y_tmp := shift_right(a_u, to_integer(b_u));
      when others =>
        y_tmp := (others => '0');
    end case;

    if y_tmp = 0 then
      flags_tmp.zero := '1';
    else
      flags_tmp.zero := '0';
    end if;

    y_reg <= y_tmp;
    flags_reg <= flags_tmp;
  end process;

  datapath_reg : process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        y_reg <= (others => '0');
        flags_reg.zero <= '1';
        flags_reg.carry <= '0';
        flags_reg.overflow <= '0';
      end if;
    end if;
  end process;
end architecture;