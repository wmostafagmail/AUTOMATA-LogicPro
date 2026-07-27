library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; library std; use std.env.all;
entity tb_bbq_gray_counter_core is end; architecture sim of tb_bbq_gray_counter_core is
 signal clk:std_logic:='0'; signal rst_n:std_logic:='0'; signal en,ld:std_logic:='0';signal lv,b,g:std_logic_vector(3 downto 0):=(others=>'0');
begin clk<=not clk after 5 ns; dut:entity work.bbq_gray_counter_core generic map(WIDTH=>4) port map(clk,rst_n,en,ld,lv,b,g);
 process begin rst_n<='0';wait for 20 ns;rst_n<='1';en<='1';wait for 10 ns;assert b="0001" and g="0001" severity failure;wait for 10 ns;assert b="0010" and g="0011" severity failure; report "PASS" severity note;stop;wait;end process;
end;
