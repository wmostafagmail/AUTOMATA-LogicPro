library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; library std; use std.env.all;
entity tb_bbq_divider_core is end; architecture sim of tb_bbq_divider_core is
 signal clk:std_logic:='0'; signal rst_n:std_logic:='0'; signal st,b,d,z:std_logic:='0';signal a,di,q,r:std_logic_vector(7 downto 0):=(others=>'0');
begin clk<=not clk after 5 ns; dut:entity work.bbq_divider_core generic map(WIDTH=>8) port map(clk,rst_n,st,a,di,b,d,z,q,r);
 process begin rst_n<='0';wait for 20 ns;rst_n<='1';a<=std_logic_vector(to_unsigned(100,8));di<=std_logic_vector(to_unsigned(7,8));st<='1';wait for 10 ns;st<='0';wait until d='1';wait for 1 ns;assert unsigned(q)=14 and unsigned(r)=2 severity failure; report "PASS" severity note;stop;wait;end process;
end;
