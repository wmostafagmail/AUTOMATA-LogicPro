library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_crc_checker_iterative is end entity;
architecture sim of tb_crc_checker_iterative is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal clear,dv,cv : std_logic := '0';
  signal co : std_logic_vector(31 downto 0);
begin
  clk <= not clk after 5 ns;
  dut : entity work.crc_checker_iterative port map(clk=>clk,rst_n=>rst_n,clear=>clear,data_in=>x"31",data_valid=>dv,crc_out=>co,crc_valid=>cv);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';dv<='1';wait for 10 ns;dv<='0';wait for 2 ns;assert cv='1' report "CRC valid missing" severity error;
    assert false report "PASS crc_checker_iterative" severity note;
    wait;
  end process;
end architecture;
