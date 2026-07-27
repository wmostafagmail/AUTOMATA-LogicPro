library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; library std; use std.env.all;
entity tb_bbq_crc16_core is end; architecture sim of tb_bbq_crc16_core is
 signal clk:std_logic:='0'; signal rst_n:std_logic:='0'; signal clr,dv,cv:std_logic:='0';signal di:std_logic_vector(7 downto 0):=(others=>'0');signal co:std_logic_vector(15 downto 0);
begin clk<=not clk after 5 ns; dut:entity work.bbq_crc16_core generic map(DATA_WIDTH=>8) port map(clk,rst_n,clr,dv,di,co,cv);
 process begin rst_n<='0';wait for 20 ns;rst_n<='1';di<=x"31";dv<='1';wait for 10 ns;dv<='0';wait for 1 ns;assert co=x"C782" severity failure; report "PASS" severity note;stop;wait;end process;
end;
