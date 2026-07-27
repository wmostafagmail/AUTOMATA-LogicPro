library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; library std; use std.env.all;
entity tb_bbq_moving_average_core is end; architecture sim of tb_bbq_moving_average_core is
 signal clk:std_logic:='0'; signal rst_n:std_logic:='0'; signal sv,av:std_logic:='0';signal si,ao:std_logic_vector(7 downto 0):=(others=>'0');
begin clk<=not clk after 5 ns; dut:entity work.bbq_moving_average_core generic map(SAMPLE_WIDTH=>8,WINDOW=>4,SIGNED_MODE=>false) port map(clk,rst_n,si,sv,ao,av);
 process begin rst_n<='0';wait for 20 ns;rst_n<='1';sv<='1';si<=x"04";wait for 10 ns;si<=x"08";wait for 10 ns;si<=x"0C";wait for 10 ns;si<=x"10";wait for 10 ns;sv<='0';wait for 1 ns;assert unsigned(ao)=10 severity failure; report "PASS" severity note;stop;wait;end process;
end;
