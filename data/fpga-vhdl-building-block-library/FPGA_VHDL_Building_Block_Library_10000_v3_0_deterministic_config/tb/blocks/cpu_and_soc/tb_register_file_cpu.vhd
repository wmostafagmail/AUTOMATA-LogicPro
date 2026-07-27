library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_register_file_cpu is end entity;
architecture sim of tb_register_file_cpu is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal rd_we : std_logic := '0';
  signal a1,a2,aw : std_logic_vector(4 downto 0) := (others=>'0');
  signal wd,r1,r2 : std_logic_vector(31 downto 0) := (others=>'0');
begin
  clk <= not clk after 5 ns;
  dut : entity work.register_file_cpu port map(clk=>clk,rst_n=>rst_n,rs1_addr=>a1,rs2_addr=>a2,rd_addr=>aw,rd_wdata=>wd,rd_we=>rd_we,rs1_rdata=>r1,rs2_rdata=>r2);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';aw<="00001";wd<=x"12345678";rd_we<='1';wait for 10 ns;rd_we<='0';a1<="00001";wait for 5 ns;assert r1=x"12345678" report "register-file mismatch" severity error;
    assert false report "PASS register_file_cpu" severity note;
    wait;
  end process;
end architecture;
