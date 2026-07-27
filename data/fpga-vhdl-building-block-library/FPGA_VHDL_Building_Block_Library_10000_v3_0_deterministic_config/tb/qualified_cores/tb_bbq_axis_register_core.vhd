library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; library std; use std.env.all;
entity tb_bbq_axis_register_core is end; architecture sim of tb_bbq_axis_register_core is
 signal clk:std_logic:='0'; signal rst_n:std_logic:='0'; signal sv,sr,sl,mv,mr,ml:std_logic:='0';signal sd,md:std_logic_vector(7 downto 0):=(others=>'0');signal sk,mk:std_logic_vector(0 downto 0):=(others=>'0');signal su,mu:std_logic_vector(0 downto 0):=(others=>'0');
begin clk<=not clk after 5 ns; dut:entity work.bbq_axis_register_core generic map(DATA_WIDTH=>8,KEEP_WIDTH=>1,USER_WIDTH=>1) port map(clk,rst_n,sd,sk,su,sl,sv,sr,md,mk,mu,ml,mv,mr);
 process begin rst_n<='0';wait for 20 ns;rst_n<='1';mr<='0';sd<=x"C3";sk<="1";su<="1";sl<='1';sv<='1';wait for 10 ns;sv<='0';wait for 10 ns;assert mv='1' and md=x"C3" and ml='1' severity failure;mr<='1';wait for 10 ns; report "PASS" severity note;stop;wait;end process;
end;
