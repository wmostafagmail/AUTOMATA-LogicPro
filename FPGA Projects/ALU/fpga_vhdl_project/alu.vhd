library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity alu is
  generic (
    WIDTH : positive := 8
  );
  port (
    clk           : in  std_logic;
    rst           : in  std_logic;
    a             : in  std_logic_vector(WIDTH - 1 downto 0);
    b             : in  std_logic_vector(WIDTH - 1 downto 0);
    op_code       : in  alu_pkg.alu_op_t;
    result        : out std_logic_vector(WIDTH - 1 downto 0);
    zero_flag     : out std_logic;
    carry_flag    : out std_logic;
    overflow_flag : out std_logic
  );
end entity alu;

architecture rtl of alu is
  signal comb_result      : std_logic_vector(WIDTH - 1 downto 0);
  signal comb_flags       : alu_pkg.alu_flags_t;
begin
  comb_process : process(a, b, op_code) is
  begin
    comb_result <= alu_pkg.compute_alu_op(a, b, op_code);
    comb_flags  <= alu_pkg.compute_flags(a, b, op_code, comb_result);
  end process comb_process;

  reg_process : process(clk) is
  begin
    if rising_edge(clk) then
      if rst = '1' then
        result        <= (others => '0');
        zero_flag     <= '1';
        carry_flag    <= '0';
        overflow_flag <= '0';
      else
        result        <= comb_result;
        zero_flag     <= comb_flags.zero_flag;
        carry_flag    <= comb_flags.carry_flag;
        overflow_flag <= comb_flags.overflow_flag;
      end if;
    end if;
  end process reg_process;
end architecture rtl;