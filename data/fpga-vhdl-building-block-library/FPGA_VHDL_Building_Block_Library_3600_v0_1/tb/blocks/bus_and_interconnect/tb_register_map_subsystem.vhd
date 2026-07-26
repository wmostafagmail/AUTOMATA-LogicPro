library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_register_map_subsystem is end entity;
architecture sim of tb_register_map_subsystem is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal we,re,ready,err,irq : std_logic := '0';
  signal addr : std_logic_vector(7 downto 0) := (others=>'0');
  signal wd,rd : std_logic_vector(31 downto 0) := (others=>'0');
begin
  clk <= not clk after 5 ns;
  dut : entity work.register_map_subsystem port map(clk=>clk,rst_n=>rst_n,addr=>addr,write_en=>we,read_en=>re,wdata=>wd,wstrb=>"1111",rdata=>rd,ready=>ready,error=>err,irq=>irq);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';wd<=x"A5A55A5A";we<='1';wait for 10 ns;we<='0';re<='1';wait for 5 ns;assert rd=x"A5A55A5A" report "MMIO mismatch" severity error;
    assert false report "PASS register_map_subsystem" severity note;
    wait;
  end process;
end architecture;
