library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; library std; use std.env.all;
entity tb_bbq_dual_port_ram_core is end; architecture sim of tb_bbq_dual_port_ram_core is
 signal clk:std_logic:='0'; signal rst_n:std_logic:='0'; signal ae,aw,be,bw:std_logic:='0';signal aa,ba:std_logic_vector(3 downto 0):=(others=>'0');signal ad,bd,ar,br:std_logic_vector(7 downto 0):=(others=>'0');
begin clk<=not clk after 5 ns; dut:entity work.bbq_dual_port_ram_core generic map(DATA_WIDTH=>8,DEPTH=>16) port map(clk,ae,aw,aa,ad,ar,be,bw,ba,bd,br);
 process begin rst_n<='0';wait for 20 ns;rst_n<='1';ae<='1';aw<='1';aa<=x"3";ad<=x"5A";wait for 10 ns;aw<='0';wait for 10 ns;assert ar=x"5A" severity failure; report "PASS" severity note;stop;wait;end process;
end;
