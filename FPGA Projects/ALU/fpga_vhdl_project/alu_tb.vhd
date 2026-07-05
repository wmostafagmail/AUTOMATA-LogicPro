library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity alu_tb is
end entity alu_tb;

architecture sim of alu_tb is
  constant CLK_PERIOD : time := 10 ns;
  signal clk : std_logic := '0';
  signal rst : std_logic := '0';
  signal a : std_logic_vector(7 downto 0) := (others => '0');
  signal b : std_logic_vector(7 downto 0) := (others => '0');
  signal op_code : alu_pkg.alu_op_t := alu_pkg.OP_ADD;
  signal result : std_logic_vector(7 downto 0);
  signal zero_flag : std_logic;
  signal carry_flag : std_logic;
  signal overflow_flag : std_logic;

  procedure check_result(
    expected_res   : in std_logic_vector;
    expected_zero  : in std_logic;
    expected_carry : in std_logic;
    expected_overflow : in std_logic;
    actual_res     : in std_logic_vector;
    actual_zero    : in std_logic;
    actual_carry   : in std_logic;
    actual_overflow : in std_logic;
    msg            : in string
  ) is
  begin
    if actual_res = expected_res and
       actual_zero = expected_zero and
       actual_carry = expected_carry and
       actual_overflow = expected_overflow then
      report msg & " PASS" severity note;
    else
      report msg & " FAIL" severity error;
      std.env.stop(1);
    end if;
  end procedure check_result;

begin
  clk_gen : process
  begin
    clk <= '0';
    wait for CLK_PERIOD / 2;
    clk <= '1';
    wait for CLK_PERIOD / 2;
  end process clk_gen;

  rst_gen : process
  begin
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    wait;
  end process rst_gen;

  stim : process
  begin
    wait until rising_edge(clk);
    wait until rst = '0';

    -- ADD 1 + 2 = 3
    a <= "00000001"; b <= "00000010";
    op_code <= alu_pkg.OP_ADD;
    wait until rising_edge(clk);
    check_result("00000011", '0', '0', '0', result, zero_flag, carry_flag, overflow_flag, "ADD 1+2");

    -- SUB 2 - 1 = 1
    a <= "00000010"; b <= "00000001";
    op_code <= alu_pkg.OP_SUB;
    wait until rising_edge(clk);
    check_result("00000001", '0', '0', '0', result, zero_flag, carry_flag, overflow_flag, "SUB 2-1");

    -- AND F0 & 0F = 00
    a <= "11110000"; b <= "00001111";
    op_code <= alu_pkg.OP_AND;
    wait until rising_edge(clk);
    check_result("00000000", '1', '0', '0', result, zero_flag, carry_flag, overflow_flag, "AND F0&0F");

    -- OR 0F | F0 = FF
    a <= "00001111"; b <= "11110000";
    op_code <= alu_pkg.OP_OR;
    wait until rising_edge(clk);
    check_result("11111111", '0', '0', '0', result, zero_flag, carry_flag, overflow_flag, "OR 0F|F0");

    -- XOR FF ^ 00 = FF
    a <= "11111111"; b <= "00000000";
    op_code <= alu_pkg.OP_XOR;
    wait until rising_edge(clk);
    check_result("11111111", '0', '0', '0', result, zero_flag, carry_flag, overflow_flag, "XOR FF^00");

    -- NOT AA = 55
    a <= "10101010"; b <= "00000000";
    op_code <= alu_pkg.OP_NOT_A;
    wait until rising_edge(clk);
    check_result("01010101", '0', '0', '0', result, zero_flag, carry_flag, overflow_flag, "NOT AA");

    -- SLL 01 << 1 = 02
    a <= "00000001"; b <= "00000001";
    op_code <= alu_pkg.OP_SLL;
    wait until rising_edge(clk);
    check_result("00000010", '0', '0', '0', result, zero_flag, carry_flag, overflow_flag, "SLL 01<<1");

    -- SRL 80 >> 1 = 40
    a <= "10000000"; b <= "00000001";
    op_code <= alu_pkg.OP_SRL;
    wait until rising_edge(clk);
    check_result("01000000", '0', '0', '0', result, zero_flag, carry_flag, overflow_flag, "SRL 80>>1");

    report "All tests completed successfully." severity note;
    std.env.stop(0);
  end process stim;

end architecture sim;