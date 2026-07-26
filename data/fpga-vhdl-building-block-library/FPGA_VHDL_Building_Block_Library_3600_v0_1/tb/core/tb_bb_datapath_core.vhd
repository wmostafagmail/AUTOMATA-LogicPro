library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all;
entity tb_bb_datapath_core is end;
architecture sim of tb_bb_datapath_core is
 signal clk:std_logic:='0';signal rst_n,iv,ir,ov,err:std_logic:='0';signal a,b:std_logic_vector(7 downto 0):=(others=>'0');signal r:std_logic_vector(15 downto 0);
begin clk<=not clk after 5 ns;
 dut:entity work.bb_datapath_core generic map(DATA_WIDTH=>8,RESULT_WIDTH=>16,OP_CODE=>1,SIGNED_MODE=>false) port map(clk=>clk,rst_n=>rst_n,in_a=>a,in_b=>b,in_valid=>iv,in_ready=>ir,result=>r,out_valid=>ov,out_ready=>'1',error=>err);
 process begin wait for 20 ns;rst_n<='1';a<=x"07";b<=x"09";iv<='1';wait for 10 ns;iv<='0';wait for 1 ns;assert r=x"0010" report "adder mismatch" severity failure;assert ov='1' report "valid missing" severity failure;assert false report "PASS tb_bb_datapath_core" severity note;wait;end process;
end;
