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

  type check_result_t is record
    pass   : boolean;
    msg    : string(1 to 80);
  end record;

  procedure check_eq(
    constant expected_val : in integer;
    constant actual_val   : in integer;
    constant op_label     : in string;
    variable result_out   : out check_result_t
  ) is
  begin
    if expected_val = actual_val then
      result_out.pass := true;
      result_out.msg  := "PASS: " & op_label;
    else
      result_out.pass := false;
      result_out.msg  := "FAIL: " & op_label
                       & " exp=" & integer'image(expected_val)
                       & " act=" & integer'image(actual_val);
    end if;
  end procedure check_eq;

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

  process
  begin
    clk_sys <= '0';
    wait for CLK_PERIOD / 2;
    clk_sys <= '1';
    wait for CLK_PERIOD / 2;
  end process;

  process
    variable v_result : check_result_t;
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
    check_eq(0, v_mag_int, "magnitude after reset", v_result);
    if v_result.pass then
      v_pass := v_pass + 1;
    else
      v_fail := v_fail + 1;
    end if;
    report v_result.msg severity note;

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
    check_eq(5, v_mag_int, "DC bin for [4,-2,6,-1]", v_result);
    if v_result.pass then
      v_pass := v_pass + 1;
    else
      v_fail := v_fail + 1;
    end if;
    report v_result.msg severity note;

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
    check_eq(10, v_mag_int, "DC bin for [-5,-3,-2,0]", v_result);
    if v_result.pass then
      v_pass := v_pass + 1;
    else
      v_fail := v_fail + 1;
    end if;
    report v_result.msg severity note;

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
