library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; use work.bb_util_pkg.all;
entity tb_alu is end entity;
architecture sim of tb_alu is
 signal clk:std_logic:='0'; signal rst_n,iv,ir,ov:std_logic:='0';
 signal op:std_logic_vector(3 downto 0):=(others=>'0');
 signal va,vb:std_logic_vector(7 downto 0):=(others=>'0'); signal vr:std_logic_vector(15 downto 0); signal flags:std_logic_vector(3 downto 0);
begin
 clk<=not clk after 5 ns;
 dut:entity work.alu generic map(DATA_WIDTH=>8,RESULT_WIDTH=>16) port map(clk=>clk,rst_n=>rst_n,op=>op,in_a=>va,in_b=>vb,in_valid=>iv,in_ready=>ir,result=>vr,flags=>flags,out_valid=>ov,out_ready=>'1');
 stim:process begin
  wait for 20 ns;rst_n<='1';op<=x"0";va<=x"07";vb<=x"09";iv<='1';wait for 10 ns;iv<='0';wait for 2 ns;
  assert vr=x"0010" report "ALU add mismatch" severity error; assert ov='1' severity error;
  op<=x"4";va<=x"F0";vb<=x"0F";iv<='1';wait for 10 ns;iv<='0';wait for 2 ns;
  assert vr=x"00FF" report "ALU xor mismatch" severity error;
  assert false report "PASS alu" severity note;wait;
 end process;
end architecture;
