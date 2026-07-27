library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; library std; use std.env.all;
entity tb_bbq_edge_detector_core is end; architecture sim of tb_bbq_edge_detector_core is
 signal clk:std_logic:='0'; signal rst_n:std_logic:='0'; signal x,lev,rp,fp,cp:std_logic:='0';
begin clk<=not clk after 5 ns; dut:entity work.bbq_edge_detector_core port map(clk,rst_n,x,lev,rp,fp,cp);
 process begin rst_n<='0';wait for 20 ns;rst_n<='1';x<='1';wait for 35 ns;assert lev='1' severity failure;wait for 10 ns;assert rp='0' severity failure;x<='0';wait for 35 ns;assert lev='0' severity failure; report "PASS" severity note;stop;wait;end process;
end;
