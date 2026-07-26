library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; library std; use std.env.all;
entity tb_bbq_lfsr_core is end; architecture sim of tb_bbq_lfsr_core is
 signal clk:std_logic:='0'; signal rst_n:std_logic:='0'; signal en,ld,bo:std_logic:='0';signal si,val:std_logic_vector(7 downto 0):=(others=>'0');
begin clk<=not clk after 5 ns; dut:entity work.bbq_lfsr_core generic map(WIDTH=>8,POLY_MASK=>x"B8",SEED=>x"01") port map(clk,rst_n,en,ld,si,val,bo);
 process begin rst_n<='0';wait for 20 ns;rst_n<='1';en<='1';wait for 20 ns;assert val/=x"01" severity failure; report "PASS" severity note;stop;wait;end process;
end;
