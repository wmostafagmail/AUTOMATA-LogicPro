library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity tb_cpu_core is
end entity tb_cpu_core;

architecture tb of tb_cpu_core is
  constant CLK_PERIOD : time := 10 ns;
  signal clk   : std_logic := '0';
  signal rst   : std_logic := '0';
  signal p_rdata : cpu_t := (others => '0');
  signal p_data  : cpu_t;
  
  signal test_failed : std_logic := '0';
begin

  clk <= not clk after CLK_PERIOD / 2;

  dut : entity work.cpu_core(rtl)
    port map (
      clk_i   => clk,
      rst_i   => rst,
      p_addr_o => open,
      p_data_o => p_data,
      p_req_o  => open,
      p_ack_i  => '0',
      p_rdata_i => p_rdata
    );

  process
  begin
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    wait for 10 ns;
    
    p_rdata <= x"00"; -- ADD 0,0
    wait until rising_edge(clk);
    wait for 5 ns;
    if unsigned(p_data) /= 0 then
      report "ADD FAILED";
      test_failed <= '1';
    else
      report "ADD PASSED";
    end if;
    
    p_rdata <= x"01"; -- SUB 0,0
    wait until rising_edge(clk);
    wait for 5 ns;
    if unsigned(p_data) /= 0 then
      report "SUB FAILED";
      test_failed <= '1';
    else
      report "SUB PASSED";
    end if;
    
    p_rdata <= x"02"; -- AND 0,0
    wait until rising_edge(clk);
    wait for 5 ns;
    if unsigned(p_data) /= 0 then
      report "AND FAILED";
      test_failed <= '1';
    else
      report "AND PASSED";
    end if;
    
    p_rdata <= x"03"; -- OR 0,0
    wait until rising_edge(clk);
    wait for 5 ns;
    if unsigned(p_data) /= 0 then
      report "OR FAILED";
      test_failed <= '1';
    else
      report "OR PASSED";
    end if;
    
    if test_failed = '0' then
      std.env.stop(0);
    else
      std.env.stop(1);
    end if;
    wait;
  end process;

end architecture tb;
