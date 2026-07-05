library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity alu_tb is
end entity alu_tb;

architecture sim of alu_tb is
  constant CLK_PERIOD : time := 10 ns;
  signal clk : std_logic := '0';
  signal rst : std_logic;
  signal op_code : std_logic_vector(2 downto 0);
  signal a : std_logic_vector(7 downto 0);
  signal b : std_logic_vector(7 downto 0);
  signal result : std_logic_vector(7 downto 0);
  signal zero_flag : std_logic;
  signal overflow_flag : std_logic;
begin
  clk <= not clk after CLK_PERIOD / 2;
  dut : entity work.alu(rtl)
    port map (clk => clk, rst => rst, op_code => op_code, a => a, b => b, result => result, zero_flag => zero_flag, overflow_flag => overflow_flag);

  process
    variable test_failed : std_logic := '0';
    variable pass_count : integer := 0;
    variable fail_count : integer := 0;
    variable expected_val : std_logic_vector(7 downto 0);
  begin
    rst <= '1';
    op_code <= (others => '0');
    a <= (others => '0');
    b <= (others => '0');
    wait for 100 ns;
    rst <= '0';
    wait for 20 ns;

    op_code <= OP_ADD; a <= "00000001"; b <= "00000010";
    wait for 20 ns;
    expected_val := "00000011";
    if result = expected_val then
      pass_count := pass_count + 1;
    else
      fail_count := fail_count + 1;
      test_failed := '1';
      report "FAIL: ADD" severity error;
    end if;

    op_code <= OP_SUB; a <= "00001010"; b <= "00000011";
    wait for 20 ns;
    expected_val := "00000111";
    if result = expected_val then
      pass_count := pass_count + 1;
    else
      fail_count := fail_count + 1;
      test_failed := '1';
      report "FAIL: SUB" severity error;
    end if;

    op_code <= OP_AND; a <= "11110000"; b <= "10101010";
    wait for 20 ns;
    expected_val := "10100000";
    if result = expected_val then
      pass_count := pass_count + 1;
    else
      fail_count := fail_count + 1;
      test_failed := '1';
      report "FAIL: AND" severity error;
    end if;

    op_code <= OP_OR; a <= "11110000"; b <= "00001111";
    wait for 20 ns;
    expected_val := "11111111";
    if result = expected_val then
      pass_count := pass_count + 1;
    else
      fail_count := fail_count + 1;
      test_failed := '1';
      report "FAIL: OR" severity error;
    end if;

    op_code <= OP_XOR; a <= "11110000"; b <= "00001111";
    wait for 20 ns;
    expected_val := "11111111";
    if result = expected_val then
      pass_count := pass_count + 1;
    else
      fail_count := fail_count + 1;
      test_failed := '1';
      report "FAIL: XOR" severity error;
    end if;

    op_code <= OP_NOT; a <= "11110000";
    wait for 20 ns;
    expected_val := "00001111";
    if result = expected_val then
      pass_count := pass_count + 1;
    else
      fail_count := fail_count + 1;
      test_failed := '1';
      report "FAIL: NOT" severity error;
    end if;

    op_code <= OP_INC; a <= "00000010";
    wait for 20 ns;
    expected_val := "00000011";
    if result = expected_val then
      pass_count := pass_count + 1;
    else
      fail_count := fail_count + 1;
      test_failed := '1';
      report "FAIL: INC" severity error;
    end if;

    op_code <= OP_SLL; a <= "00000010";
    wait for 20 ns;
    expected_val := "00000100";
    if result = expected_val then
      pass_count := pass_count + 1;
    else
      fail_count := fail_count + 1;
      test_failed := '1';
      report "FAIL: SLL" severity error;
    end if;

    wait for 50 ns;
    if test_failed = '0' then
      report "All tests passed." severity note;
      std.env.stop(0);
    else
      report "Some tests failed." severity error;
      std.env.stop(1);
    end if;
    wait;
  end process;
end architecture sim;