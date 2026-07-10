library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;
library work;
use work.dsp_chain_pkg.all;

entity tb_dsp_chain is
end entity tb_dsp_chain;

architecture sim of tb_dsp_chain is
  constant CLK_PERIOD : time := 10 ns;
  signal clk              : std_logic := '0';
  signal rst              : std_logic := '0';
  signal sample_i        : sample_t := (others => '0');
  signal valid_i          : std_logic := '0';
  signal ready_o          : std_logic;
  signal sample_o        : sample_t;
  signal valid_o          : std_logic;
  signal test_failed      : std_logic := '0';
  signal pass_count       : integer := 0;
  signal fail_count       : integer := 0;

  procedure check_result(
    act           : in  sample_t;
    exp           : in  sample_t;
    test_failed   : inout std_logic;
    pass_count    : inout integer;
    fail_count    : inout integer
  ) is
  begin
    if act = exp then
      pass_count := pass_count + 1;
    else
      fail_count := fail_count + 1;
      test_failed := '1';
    end if;
  end procedure check_result;

begin
  clk <= not clk after CLK_PERIOD / 2;

  dut : entity work.dsp_chain_top
    port map (
      clk         => clk,
      rst         => rst,
      sample_i    => sample_i,
      valid_i     => valid_i,
      ready_o     => ready_o,
      sample_o    => sample_o,
      valid_o     => valid_o
    );

  stimulus_proc : process
  begin
    rst <= '1';
    valid_i <= '0';
    sample_i <= (others => '0');
    wait for 20 ns;
    rst <= '0';

    sample_i <= to_signed(100, SAMPLE_WIDTH); valid_i <= '1';
    wait for 10 ns;
    sample_i <= to_signed(200, SAMPLE_WIDTH); valid_i <= '1';
    wait for 10 ns;
    sample_i <= to_signed(300, SAMPLE_WIDTH); valid_i <= '1';
    wait for 10 ns;
    sample_i <= to_signed(400, SAMPLE_WIDTH); valid_i <= '1';
    valid_i <= '0';

    wait for 100 ns;
    wait;
  end process stimulus_proc;

  check_proc : process(clk)
    variable expected_val : sample_t;
  begin
    if rising_edge(clk) then
      if rst = '1' then
        pass_count <= 0;
        fail_count <= 0;
        test_failed <= '0';
      elsif valid_o = '1' then
        expected_val := to_signed(15, SAMPLE_WIDTH);
        check_result(sample_o, expected_val, test_failed, pass_count, fail_count);
      end if;
    end if;
  end process check_proc;

  finish_proc : process
  begin
    wait for 100 ns;
    if test_failed = '0' then
      report "TEST PASSED" severity note;
      std.env.stop(0);
    else
      report "TEST FAILED" severity failure;
    end if;
  end process finish_proc;
end architecture sim;
