library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_wishbone_master_monitor is end entity;
architecture sim of tb_wishbone_master_monitor is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal qv,qr,qw,rv : std_logic := '0';
  signal qa : std_logic_vector(31 downto 0) := (others=>'0');
  signal qd,rd : std_logic_vector(31 downto 0) := (others=>'0');
  signal err : std_logic;
begin
  clk <= not clk after 5 ns;
  dut : entity work.wishbone_master_monitor port map(clk=>clk,rst_n=>rst_n,req_valid=>qv,req_ready=>qr,req_write=>qw,req_addr=>qa,req_wdata=>qd,rsp_valid=>rv,rsp_ready=>'1',rsp_rdata=>rd,rsp_error=>err);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';qa<=x"0000000F";qd<=x"000000F0";qv<='1';wait for 10 ns;qv<='0';wait for 5 ns;assert rv='1' severity error;
    assert false report "PASS wishbone_master_monitor" severity note;
    wait;
  end process;
end architecture;
