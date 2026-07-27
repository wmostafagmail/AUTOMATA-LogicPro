library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_safety_island_controller_self_testing is end entity;
architecture sim of tb_safety_island_controller_self_testing is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal mon,fault : std_logic_vector(15 downto 0) := (others=>'0');
  signal ss,irq : std_logic;
  signal ec : std_logic_vector(31 downto 0);
begin
  clk <= not clk after 5 ns;
  dut : entity work.safety_island_controller_self_testing port map(clk=>clk,rst_n=>rst_n,monitored_signals=>mon,clear_faults=>'0',fault_detected=>fault,safe_state_req=>ss,irq=>irq,error_count=>ec);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';mon(0)<='1';wait for 10 ns;mon(0)<='0';wait for 5 ns;assert fault(0)='1' and ss='1' report "safety latch failed" severity error;
    assert false report "PASS safety_island_controller_self_testing" severity note;
    wait;
  end process;
end architecture;
