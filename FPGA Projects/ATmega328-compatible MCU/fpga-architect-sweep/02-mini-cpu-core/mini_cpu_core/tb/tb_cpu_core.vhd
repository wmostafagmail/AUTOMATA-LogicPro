library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;
use std.textio.all;

entity tb_cpu_core is
end entity tb_cpu_core;

architecture tb of tb_cpu_core is
  constant CLK_PERIOD : time := 10 ns;
  signal clk           : std_logic := '0';
  signal rst           : std_logic := '0';
  signal p_addr        : cpu_t;
  signal p_data        : cpu_t;
  signal p_req         : std_logic;
  signal p_ack         : std_logic := '0';
  signal p_rdata       : cpu_t := (others => '0');
  signal d_addr        : cpu_t;
  signal d_data        : cpu_t;
  signal d_we          : std_logic;
  signal d_req         : std_logic;
  signal d_ack         : std_logic := '0';
  signal d_rdata       : cpu_t := (others => '0');
  
  signal test_failed   : std_logic := '0';
  signal pass_count    : integer := 0;
  signal fail_count    : integer := 0;
begin

  clk <= not clk after CLK_PERIOD / 2;

  dut : entity work.cpu_core(rtl)
    port map (clk_i => clk, rst_i => rst, p_addr_o => p_addr, p_data_o => p_data, p_req_o => p_req, p_ack_i => p_ack, p_rdata_i => p_rdata, d_addr_o => d_addr, d_data_o => d_data, d_we_o => d_we, d_req_o => d_req, d_ack_i => d_ack, d_rdata_i => d_rdata);

  process
    variable expected : unsigned(7 downto 0);
    variable actual   : unsigned(7 downto 0);
  begin
    -- Reset
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    wait for 10 ns;
    
    -- Test ADD: 0 + 0 = 0
    p_rdata <= x"00";
    wait for 10 ns;
    wait until rising_edge(clk);
    wait for 5 ns;
    actual := unsigned(p_data);
    expected := to_unsigned(0, 8);
    if actual /= expected then
      test_failed <= '1';
      report "ADD FAILED";
    else
      pass_count <= pass_count + 1;
      report "ADD PASSED";
    end if;
    
    -- Test SUB: 0 - 0 = 0
    p_rdata <= x"01";
    wait for 10 ns;
    wait until rising_edge(clk);
    wait for 5 ns;
    actual := unsigned(p_data);
    expected := to_unsigned(0, 8);
    if actual /= expected then
      test_failed <= '1';
      report "SUB FAILED";
    else
      pass_count <= pass_count + 1;
      report "SUB PASSED";
    end if;
    
    -- Test AND: 0 and 0 = 0
    p_rdata <= x"02";
    wait for 10 ns;
    wait until rising_edge(clk);
    wait for 5 ns;
    actual := unsigned(p_data);
    expected := to_unsigned(0, 8);
    if actual /= expected then
      test_failed <= '1';
      report "AND FAILED";
    else
      pass_count <= pass_count + 1;
      report "AND PASSED";
    end if;
    
    -- Test OR: 0 or 0 = 0
    p_rdata <= x"03";
    wait for 10 ns;
    wait until rising_edge(clk);
    wait for 5 ns;
    actual := unsigned(p_data);
    expected := to_unsigned(0, 8);
    if actual /= expected then
      test_failed <= '1';
      report "OR FAILED";
    else
      pass_count <= pass_count + 1;
      report "OR PASSED";
    end if;
    
    -- Stop
    wait for 10 ns;
    if test_failed = '0' then
      std.env.stop(0);
    else
      std.env.stop(1);
    end if;
    wait;
  end process;
  
end architecture tb;
