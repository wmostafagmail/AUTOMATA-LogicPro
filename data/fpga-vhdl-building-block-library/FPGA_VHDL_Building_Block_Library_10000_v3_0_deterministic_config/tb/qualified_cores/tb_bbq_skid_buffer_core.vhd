library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; library std; use std.env.all;
entity tb_bbq_skid_buffer_core is end; architecture sim of tb_bbq_skid_buffer_core is
 signal clk:std_logic:='0'; signal rst_n:std_logic:='0'; signal sv,sr,mv,mr:std_logic:='0';signal sd,md:std_logic_vector(7 downto 0):=(others=>'0');
begin clk<=not clk after 5 ns; dut:entity work.bbq_skid_buffer_core generic map(DATA_WIDTH=>8) port map(clk,rst_n,sd,sv,sr,md,mv,mr);
 process begin rst_n<='0';wait for 20 ns;rst_n<='1';mr<='0';sd<=x"A5";sv<='1';wait for 10 ns;sv<='0';wait for 10 ns;assert mv='1' and md=x"A5" severity failure;mr<='1';wait for 10 ns;assert mv='0' severity failure; report "PASS" severity note;stop;wait;end process;
end;
