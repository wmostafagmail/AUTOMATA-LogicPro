library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;
use work.alu_pkg.all;

entity tb_alu is
end entity tb_alu;

architecture sim of tb_alu is
  constant CLK_PERIOD : time := 10 ns;
  signal clk : std_logic := '0';
  signal rst : std_logic;
  signal a, b : std_logic_vector(ALU_W - 1 downto 0);
  signal opcode : op_code_t;
  signal result_vec : std_logic_vector(ALU_W - 1 downto 0);
  signal zero, carry, overflow : std_logic;

  procedure check_result(
    constant exp_vec : in std_logic_vector;
    constant exp_z   : in std_logic;
    constant exp_c   : in std_logic;
    constant exp_ov  : in std_logic;
    constant name    : in string
  ) is
  begin
    if result_vec = exp_vec and zero = exp_z and carry = exp_c and overflow = exp_ov then
      report "PASS: " & name severity note;
    else
      report "FAIL: " & name severity error;
    end if;
  end procedure;

begin
  clk <= not clk after CLK_PERIOD / 2;

  dut : entity work.alu
    port map (
      clk => clk, rst => rst,
      a => a, b => b, opcode => opcode,
      result_vec => result_vec,
      zero => zero, carry => carry, overflow => overflow
    );

  stim : process
  begin
    rst <= '1'; opcode <= OP_ADD; a <= (others => '0'); b <= (others => '0');
    wait for 20 ns;
    rst <= '0';
    wait for 20 ns;

    a <= "00000001"; b <= "00000010"; opcode <= OP_ADD;
    wait for 20 ns;
    check_result("00000011", '1', '0', '0', "ADD 1+2");

    a <= "00000101"; b <= "00000010"; opcode <= OP_SUB;
    wait for 20 ns;
    check_result("00000011", '1', '0', '0', "SUB 5-2");

    a <= "11110000"; b <= "10101010"; opcode <= OP_AND;
    wait for 20 ns;
    check_result("10100000", '0', '0', '0', "AND 0xF0 & 0xAA");

    wait for 50 ns;
    std.env.stop(0);
  end process;
end architecture sim;