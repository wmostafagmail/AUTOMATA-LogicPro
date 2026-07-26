library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_mipi_csi2_ecc_checker_security_filtered is end entity;
architecture sim of tb_mipi_csi2_ecc_checker_security_filtered is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal prx,ptx,poe,tv,tr,rv : std_logic := '0';
  signal td,rd : std_logic_vector(31 downto 0) := (others=>'0');
  signal st : std_logic_vector(15 downto 0);
begin
  clk <= not clk after 5 ns;
  dut : entity work.mipi_csi2_ecc_checker_security_filtered port map(clk=>clk,rst_n=>rst_n,phy_rx=>prx,phy_tx=>ptx,phy_oe=>poe,tx_data=>td,tx_valid=>tv,tx_ready=>tr,rx_data=>rd,rx_valid=>rv,status=>st);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';td<=x"CAFEBABE";tv<='1';prx<='1';wait for 5 ns;assert tr='1' and rd=x"CAFEBABE" and rv='1' report "protocol shell contract failed" severity error;
    assert false report "PASS mipi_csi2_ecc_checker_security_filtered" severity note;
    wait;
  end process;
end architecture;
