-- tb_dsp_chain.vhd
-- Self-checking testbench for dsp_chain_top.
-- Verifies FIR convolution, FFT-lite DC bin magnitude, and pipeline latency alignment.

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

entity tb_dsp_chain is
end entity tb_dsp_chain;

architecture sim of tb_dsp_chain is
  constant CLK_PERIOD   : time := 10 ns;
  constant DATA_WIDTH_I : integer := 8;

  signal clk_sys      : std_logic := '0';
  signal sys_rst_i    : std_logic := '0';
  signal valid_in_i   : std_logic := '0';
  signal sample_in_i  : signed(DATA_WIDTH_I - 1 downto 0) := (others => '0');
  signal valid_out_o  : std_logic;
  signal magnitude_o  : signed(15 downto 0);

begin

  dut : entity work.dsp_chain_top
    generic map (
      DATA_WIDTH => DATA_WIDTH_I
    )
    port map (
      clk_i       => clk_sys,
      rst_i       => sys_rst_i,
      valid_in_i  => valid_in_i,
      sample_in_i => sample_in_i,
      valid_out_o => valid_out_o,
      magnitude_o => magnitude_o
    );

  -- Clock generator process
  process
  begin
    clk_sys <= '0';
    wait for CLK_PERIOD / 2;
    clk_sys <= '1';
    wait for CLK_PERIOD / 2;
  end process;

  -- Testbench stimulus and checking process.
  -- All counters are process-local variables so assignments take effect immediately
  -- and the architecture body contains no plain variables (GHDL-compatible).
  process
    variable v_pass   : integer := 0;
    variable v_fail   : integer := 0;
    variable v_mag_int : integer;
  begin
    -- Reset phase: synchronous active-high reset.
    sys_rst_i <= '1';
    valid_in_i  <= '0';
    sample_in_i <= (others => '0');
    wait for 3 * CLK_PERIOD;
    sys_rst_i <= '0';
    wait for CLK_PERIOD;

    -- Verify reset values after one more clock edge so synchronous updates settle.
    wait until rising_edge(clk_sys);
    v_mag_int := to_integer(signed(magnitude_o));
    if v_mag_int = 0 then
      report "PASS: magnitude after reset" severity note;
      v_pass := v_pass + 1;
    else
      report "FAIL: magnitude after reset exp=0 act=" & integer'image(v_mag_int) severity failure;
      v_fail := v_fail + 1;
    end if;

    -- Test vector 1: Feed [4, -2, 6, -1] through FIR (coeffs [-1, 2, 2, -1]).
    valid_in_i <= '1';
    sample_in_i <= to_signed(4, DATA_WIDTH_I);
    wait until rising_edge(clk_sys);

    sample_in_i <= to_signed(-2, DATA_WIDTH_I);
    wait until rising_edge(clk_sys);

    sample_in_i <= to_signed(6, DATA_WIDTH_I);
    wait until rising_edge(clk_sys);

    sample_in_i <= to_signed(-1, DATA_WIDTH_I);
    wait until rising_edge(clk_sys);

    -- FIR latency = 3 cycles. After 3 more clock edges fir_valid goes high.
    wait until rising_edge(clk_sys);
    wait until rising_edge(clk_sys);
    wait until rising_edge(clk_sys);

    -- Analyzer needs 4 samples; feed zeros to complete window [5,0,0,0] -> sum = 5.
    sample_in_i <= to_signed(0, DATA_WIDTH_I);
    wait until rising_edge(clk_sys);

    sample_in_i <= to_signed(0, DATA_WIDTH_I);
    wait until rising_edge(clk_sys);

    sample_in_i <= to_signed(0, DATA_WIDTH_I);
    wait until rising_edge(clk_sys);

    -- FIR output for [4,-2,6,-1] with coeffs [-1, 2, 2, -1]:
    --   -1*4 + 2*(-2) + 2*6 + (-1)*(-1) = -4 -4 + 12 + 1 = 5.
    v_mag_int := to_integer(signed(magnitude_o));
    if v_mag_int = 5 then
      report "PASS: DC bin for [4,-2,6,-1]" severity note;
      v_pass := v_pass + 1;
    else
      report "FAIL: DC bin for [4,-2,6,-1] exp=5 act=" & integer'image(v_mag_int) severity failure;
      v_fail := v_fail + 1;
    end if;

    -- Test vector 2: Negative sum -> positive magnitude.
    valid_in_i <= '0';
    wait until rising_edge(clk_sys);

    sample_in_i <= to_signed(-5, DATA_WIDTH_I);
    wait until rising_edge(clk_sys);

    sample_in_i <= to_signed(-3, DATA_WIDTH_I);
    wait until rising_edge(clk_sys);

    sample_in_i <= to_signed(-2, DATA_WIDTH_I);
    wait until rising_edge(clk_sys);

    -- Complete 4-sample window: [-5,-3,-2,0] -> sum = -10 -> |sum| = 10.
    sample_in_i <= to_signed(0, DATA_WIDTH_I);
    wait until rising_edge(clk_sys);

    v_mag_int := to_integer(signed(magnitude_o));
    if v_mag_int = 10 then
      report "PASS: DC bin for [-5,-3,-2,0]" severity note;
      v_pass := v_pass + 1;
    else
      report "FAIL: DC bin for [-5,-3,-2,0] exp=10 act=" & integer'image(v_mag_int) severity failure;
      v_fail := v_fail + 1;
    end if;

    -- Summary.
    report "Testbench complete: PASS=" & integer'image(v_pass)
                       & " FAIL=" & integer'image(v_fail) severity note;

    if v_fail = 0 then
      std.env.stop(0);
    else
      report "FAILED" severity failure;
    end if;

    wait;
  end process;

end architecture sim;
