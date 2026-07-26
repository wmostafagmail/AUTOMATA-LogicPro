library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; library std; use std.env.all;
entity tb_bbq_pulse_width_core is end; architecture sim of tb_bbq_pulse_width_core is
 signal clk:std_logic:='0'; signal rst_n:std_logic:='0'; signal x,v,o:std_logic:='0';signal wv:std_logic_vector(7 downto 0);
begin clk<=not clk after 5 ns; dut:entity work.bbq_pulse_width_core generic map(WIDTH=>8) port map(clk,rst_n,x,wv,v,o);
 process begin rst_n<='0';wait for 20 ns;rst_n<='1';x<='1';wait for 30 ns;x<='0';wait for 10 ns;assert v='1' and unsigned(wv)=3 severity failure; report "PASS" severity note;stop;wait;end process;
end;
