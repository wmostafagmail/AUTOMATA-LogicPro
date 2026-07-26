library ieee; use ieee.std_logic_1164.all;
entity tb_bb_async_fifo_core is end;
architecture sim of tb_bb_async_fifo_core is
 signal wc:std_logic:='0';signal rc:std_logic:='0';signal wrn,rrn,we,re,full,af,empty,ae:std_logic:='0';signal wd,rd:std_logic_vector(7 downto 0):=(others=>'0');
begin wc<=not wc after 4 ns;rc<=not rc after 7 ns;
 dut:entity work.bb_async_fifo_core generic map(DATA_WIDTH=>8,DEPTH=>8) port map(wr_clk=>wc,wr_rst_n=>wrn,wr_en=>we,wr_data=>wd,full=>full,almost_full=>af,rd_clk=>rc,rd_rst_n=>rrn,rd_en=>re,rd_data=>rd,empty=>empty,almost_empty=>ae);
 process begin wait for 20 ns;wrn<='1';rrn<='1';wait for 10 ns;wd<=x"D4";we<='1';wait for 8 ns;we<='0';wait for 70 ns;re<='1';wait for 14 ns;re<='0';wait for 20 ns;assert rd=x"D4" report "async FIFO mismatch" severity failure;assert false report "PASS tb_bb_async_fifo_core" severity note;wait;end process;
end;
