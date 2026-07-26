library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_sample_trigger_engine_low_power is end entity;
architecture sim of tb_sample_trigger_engine_low_power is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal trigger,sv,irq : std_logic := '0';
  signal si : std_logic_vector(15 downto 0) := (others=>'0');
  signal so : std_logic_vector(31 downto 0);
begin
  clk <= not clk after 5 ns;
  dut : entity work.sample_trigger_engine_low_power port map(clk=>clk,rst_n=>rst_n,trigger=>trigger,sensor_in=>si,sample_out=>so,sample_valid=>sv,event_irq=>irq);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';si<=x"0065";trigger<='1';wait for 10 ns;trigger<='0';assert sv='1' report "sensor valid missing" severity error;
    assert false report "PASS sample_trigger_engine_low_power" severity note;
    wait;
  end process;
end architecture;
