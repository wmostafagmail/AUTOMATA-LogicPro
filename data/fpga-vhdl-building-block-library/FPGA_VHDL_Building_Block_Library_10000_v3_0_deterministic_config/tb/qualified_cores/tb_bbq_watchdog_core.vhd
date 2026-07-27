library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; library std; use std.env.all;
entity tb_bbq_watchdog_core is end; architecture sim of tb_bbq_watchdog_core is
 signal clk:std_logic:='0'; signal rst_n:std_logic:='0'; signal en,kick,clr,tp,fl:std_logic:='0';signal c:std_logic_vector(7 downto 0);
begin clk<=not clk after 5 ns; dut:entity work.bbq_watchdog_core generic map(COUNT_WIDTH=>8,TIMEOUT_TICKS=>3) port map(clk,rst_n,en,kick,clr,tp,fl,c);
 process begin rst_n<='0';wait for 20 ns;rst_n<='1';en<='1';wait for 30 ns;assert fl='1' severity failure;clr<='1';wait for 10 ns;clr<='0';assert fl='0' severity failure; report "PASS" severity note;stop;wait;end process;
end;
