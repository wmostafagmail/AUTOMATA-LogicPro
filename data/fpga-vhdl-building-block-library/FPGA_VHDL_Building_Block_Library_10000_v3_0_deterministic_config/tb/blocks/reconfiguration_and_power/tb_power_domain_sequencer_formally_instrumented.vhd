library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_power_domain_sequencer_formally_instrumented is end entity;
architecture sim of tb_power_domain_sequencer_formally_instrumented is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal start,abort,busy,done,err : std_logic := '0';
  signal cmd : std_logic_vector(7 downto 0) := (others=>'0');
  signal cfg,status : std_logic_vector(31 downto 0) := (others=>'0');
begin
  clk <= not clk after 5 ns;
  dut : entity work.power_domain_sequencer_formally_instrumented generic map(LATENCY_CYCLES=>2) port map(clk=>clk,rst_n=>rst_n,start=>start,abort=>abort,command=>cmd,cfg=>cfg,busy=>busy,done=>done,error=>err,status=>status);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';cmd<=x"12";cfg<=x"00000034";start<='1';wait for 10 ns;start<='0';wait for 25 ns;assert done='1' or busy='0' report "control did not complete" severity error;
    assert false report "PASS power_domain_sequencer_formally_instrumented" severity note;
    wait;
  end process;
end architecture;
