library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_qspi_flash_controller_multi_channel is end entity;
architecture sim of tb_qspi_flash_controller_multi_channel is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal start,busy,done,err : std_logic := '0';
  signal src,dst : std_logic_vector(31 downto 0) := (others=>'0');
  signal di,data_o : std_logic_vector(31 downto 0) := (others=>'0');
begin
  clk <= not clk after 5 ns;
  dut : entity work.qspi_flash_controller_multi_channel port map(clk=>clk,rst_n=>rst_n,start=>start,src_addr=>src,dst_addr=>dst,data_in=>di,data_out=>data_o,busy=>busy,done=>done,error=>err);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';di<=x"DEADBEEF";start<='1';wait for 10 ns;start<='0';wait for 15 ns;assert done='1' or busy='0' severity error;assert data_o=x"DEADBEEF" severity error;
    assert false report "PASS qspi_flash_controller_multi_channel" severity note;
    wait;
  end process;
end architecture;
