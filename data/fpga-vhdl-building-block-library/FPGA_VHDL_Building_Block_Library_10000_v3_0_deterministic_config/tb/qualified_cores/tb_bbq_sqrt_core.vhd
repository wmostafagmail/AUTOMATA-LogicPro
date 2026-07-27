library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; library std; use std.env.all;
entity tb_bbq_sqrt_core is end; architecture sim of tb_bbq_sqrt_core is
 signal clk:std_logic:='0'; signal rst_n:std_logic:='0'; signal st,b,d:std_logic:='0';signal x,rem:std_logic_vector(15 downto 0):=(others=>'0');signal rt:std_logic_vector(7 downto 0);
begin clk<=not clk after 5 ns; dut:entity work.bbq_sqrt_core generic map(WIDTH=>16) port map(clk,rst_n,st,x,b,d,rt,rem);
 process begin rst_n<='0';wait for 20 ns;rst_n<='1';x<=std_logic_vector(to_unsigned(1000,16));st<='1';wait for 10 ns;st<='0';wait until d='1';wait for 1 ns;assert unsigned(rt)=31 and unsigned(rem)=39 severity failure; report "PASS" severity note;stop;wait;end process;
end;
