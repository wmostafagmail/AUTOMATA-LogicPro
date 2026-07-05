library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;
use work.dsp_chain_pkg.all;

entity tb_dsp_chain_top is
end entity tb_dsp_chain_top;

architecture sim of tb_dsp_chain_top is
  constant CLK_PERIOD : time := 10 ns;
  signal clk      : std_logic := '0';
  signal rst      : std_logic := '1';
  signal in_valid : std_logic := '0';
  signal in_data  : signed(DATA_W-1 downto 0) := (others => '0');
  signal out_valid: std_logic;
  signal out_mag  : unsigned(2*ACC_W-1 downto 0);
  
  constant TEST_COUNT : integer := 4;
  type test_vec_t is record
    v : std_logic;
    d : signed(DATA_W-1 downto 0);
  end record;
  constant TEST_VECTORS : test_vec_t(0 to TEST_COUNT-1) := (
    (v => '1', d => to_signed(100, DATA_W)),
    (v => '1', d => to_signed(-50, DATA_W)),
    (v => '1', d => to_signed(0, DATA_W)),
    (v => '1', d => to_signed(200, DATA_W))
  );
begin
  clk <= not clk after CLK_PERIOD/2;
  
  stim_proc : process
    variable pass_cnt : integer := 0;
    variable fail_cnt : integer := 0;
    variable expected_mag : unsigned(2*ACC_W-1 downto 0);
    variable observed_mag : unsigned(2*ACC_W-1 downto 0);
  begin
    wait for 50 ns;
    rst <= '0';
    wait for 10 ns;
    
    for i in 0 to TEST_COUNT-1 loop
      in_valid <= TEST_VECTORS(i).v;
      in_data  <= TEST_VECTORS(i).d;
      wait until rising_edge(clk);
    end loop;
    in_valid <= '0';
    wait until out_valid = '1';
    wait for 20 ns;
    
    observed_mag := out_mag;
    expected_mag := TEST_VECTORS(0).d * TEST_VECTORS(0).d;
    
    if observed_mag = expected_mag then
      pass_cnt := pass_cnt + 1;
    else
      fail_cnt := fail_cnt + 1;
    end if;
    
    wait for 50 ns;
    if fail_cnt = 0 then
      report "PASS: DSP chain verified successfully." severity note;
    else
      report "FAIL: Verification failed." severity error;
    end if;
    std.env.stop(0);
  end process;
end architecture sim;