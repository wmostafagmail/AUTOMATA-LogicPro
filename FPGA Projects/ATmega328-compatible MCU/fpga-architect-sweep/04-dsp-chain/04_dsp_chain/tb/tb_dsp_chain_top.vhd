library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

library work;
use work.dsp_chain_pkg.all;

entity tb_dsp_chain_top is
end entity tb_dsp_chain_top;

architecture tb of tb_dsp_chain_top is

  constant CLK_PERIOD : time := 10 ns;

  signal clk_tb              : std_logic := '0';
  signal reset_tb            : std_logic := '0';
  signal sample_in_valid_sig : std_logic := '0';
  signal sample_in_data_sig  : std_logic_vector(SAMPLE_WIDTH - 1 downto 0) := (others => '0');
  signal chain_out_valid_sig : std_logic;
  signal chain_out_mag_sig   : std_logic_vector(37 downto 0);

  procedure send_sample(
    constant val_s    : in  signed(SAMPLE_WIDTH - 1 downto 0);
    signal data_ref   : inout std_logic_vector(SAMPLE_WIDTH - 1 downto 0);
    signal valid_ref  : inout std_logic
  ) is
  begin
    data_ref <= std_logic_vector(val_s);
    valid_ref <= '1';
    wait until rising_edge(clk_tb);
    valid_ref <= '0';
  end procedure send_sample;

  procedure check_result(
    constant msg_name     : in  string;
    constant expected_u   : in  unsigned(37 downto 0);
    variable fail_count   : inout integer
  ) is
    variable actual_u     : unsigned(37 downto 0);
    variable int_exp      : integer;
    variable int_act      : integer;
  begin
    actual_u := unsigned(chain_out_mag_sig);
    int_exp := to_integer(expected_u);
    int_act := to_integer(actual_u);
    if actual_u /= expected_u then
      report msg_name & " FAIL: Expected " & integer'image(int_exp) & " Got " & integer'image(int_act);
      fail_count := fail_count + 1;
    else
      report msg_name & " PASS";
    end if;
  end procedure check_result;

begin

  clk_proc : process
  begin
    clk_tb <= '0';
    wait for CLK_PERIOD / 2;
    clk_tb <= '1';
    wait for CLK_PERIOD / 2;
  end process clk_proc;

  u_dut : entity work.dsp_chain_top
    generic map (
      Sample_Width => SAMPLE_WIDTH,
      Prod_Width   => PROD_WIDTH,
      Mag_Width    => 38
    )
    port map (
      clk               => clk_tb,
      reset             => reset_tb,
      sample_in_valid   => sample_in_valid_sig,
      sample_in_data    => sample_in_data_sig,
      chain_out_valid   => chain_out_valid_sig,
      chain_out_mag     => chain_out_mag_sig
    );

  proc_stim : process
    variable fail_count_var : integer := 0;
  begin
    reset_tb <= '1';
    wait for CLK_PERIOD * 5;
    reset_tb <= '0';

    -- Wait for post-reset settle
    wait until rising_edge(clk_tb);

    -- Stimulus 1: Input 10
    send_sample(to_signed(10, SAMPLE_WIDTH), sample_in_data_sig, sample_in_valid_sig);
    
    -- Pipeline latency is 2 cycles (FIR + Analyzer)
    wait until rising_edge(clk_tb);
    wait until rising_edge(clk_tb);

    if chain_out_valid_sig = '1' then
      check_result("Test_10_MagSq", to_unsigned(100, 38), fail_count_var);
    else
      report "Test_10: Output valid flag not set";
      fail_count_var := fail_count_var + 1;
    end if;

    -- Stimulus 2: Input 0 (to verify state change)
    send_sample(to_signed(0, SAMPLE_WIDTH), sample_in_data_sig, sample_in_valid_sig);
    
    -- Wait for pipeline latency
    wait until rising_edge(clk_tb);
    wait until rising_edge(clk_tb);

    if chain_out_valid_sig = '1' then
      check_result("Test_Secondary", to_unsigned(0, 38), fail_count_var);
    else
      report "Test_Secondary: Output valid flag not set";
      fail_count_var := fail_count_var + 1;
    end if;

    wait for CLK_PERIOD * 5;

    if fail_count_var = 0 then
      report "ALL TESTS PASSED";
      std.env.stop(0);
    else
      report "TESTS FAILED";
      std.env.stop(1);
    end if;

    wait;
  end process proc_stim;

end architecture tb;