library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_bcd_to_binary_converter_digit_serial is end entity;
architecture sim of tb_bcd_to_binary_converter_digit_serial is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal iv,ir,ov,err : std_logic := '0';
  signal va,vb : std_logic_vector(7 downto 0) := (others=>'0');
  signal vr : std_logic_vector(15 downto 0);
begin
  clk <= not clk after 5 ns;
  dut : entity work.bcd_to_binary_converter_digit_serial generic map(DATA_WIDTH=>8,RESULT_WIDTH=>16) port map(clk=>clk,rst_n=>rst_n,in_a=>va,in_b=>vb,in_valid=>iv,in_ready=>ir,result=>vr,out_valid=>ov,out_ready=>'1',error=>err);
  stim : process
  begin
    wait for 20 ns;rst_n<='1';va<=x"03";vb<=x"02";iv<='1';wait for 10 ns;iv<='0';wait for 5 ns;assert ov='1' report "datapath output valid missing" severity error;
    assert false report "PASS bcd_to_binary_converter_digit_serial" severity note;
    wait;
  end process;
end architecture;
