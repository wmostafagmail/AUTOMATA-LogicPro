library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; library std; use std.env.all;
entity tb_bbq_round_robin_arbiter_core is end; architecture sim of tb_bbq_round_robin_arbiter_core is
 signal clk:std_logic:='0'; signal rst_n:std_logic:='0'; signal acc,gv:std_logic:='0';signal req,g:std_logic_vector(3 downto 0):=(others=>'0');signal gi:std_logic_vector(1 downto 0);
begin clk<=not clk after 5 ns; dut:entity work.bbq_round_robin_arbiter_core generic map(PORTS=>4) port map(clk,rst_n,acc,req,g,gv,gi);
 process begin rst_n<='0';wait for 20 ns;rst_n<='1';req<="1111";wait for 1 ns;assert gi="00" severity failure;acc<='1';wait for 10 ns;acc<='0';wait for 1 ns;assert gi="01" severity failure; report "PASS" severity note;stop;wait;end process;
end;
