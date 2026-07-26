library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_golden_model_comparator_transaction_level is end entity;
architecture sim of tb_golden_model_comparator_transaction_level is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal sample,clear,match : std_logic := '0';
  signal obs,exp : std_logic_vector(31 downto 0) := (others=>'0');
  signal ec : std_logic_vector(31 downto 0);
begin
  clk <= not clk after 5 ns;
  dut : entity work.golden_model_comparator_transaction_level port map(clk=>clk,rst_n=>rst_n,observed=>obs,expected=>exp,sample_valid=>sample,clear=>clear,match=>match,error_count=>ec);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';obs<=x"00000001";exp<=x"00000002";sample<='1';wait for 10 ns;sample<='0';wait for 5 ns;assert unsigned(ec)=1 report "monitor count failed" severity error;
    assert false report "PASS golden_model_comparator_transaction_level" severity note;
    wait;
  end process;
end architecture;
