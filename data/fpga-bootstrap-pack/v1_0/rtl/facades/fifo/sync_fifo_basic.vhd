library ieee; use ieee.std_logic_1164.all; use work.bb_util_pkg.all;
entity sync_fifo_basic is generic(G_DATA_WIDTH:positive:=32;G_DEPTH:positive:=16);
 port(clk_i,rst_ni,write_i:in std_logic;write_data_i:in std_logic_vector(G_DATA_WIDTH-1 downto 0);full_o:out std_logic;
 read_i:in std_logic;read_data_o:out std_logic_vector(G_DATA_WIDTH-1 downto 0);empty_o:out std_logic;level_o:out std_logic_vector(clog2(G_DEPTH+1)-1 downto 0));end entity;
architecture rtl of sync_fifo_basic is signal af,ae:std_logic; begin
 assert G_DEPTH >= 2 report "FIFO depth must be >= 2" severity failure;
 u_core:entity work.sync_fifo generic map(DATA_WIDTH=>G_DATA_WIDTH,DEPTH=>G_DEPTH) port map(clk=>clk_i,rst_n=>rst_ni,wr_en=>write_i,wr_data=>write_data_i,full=>full_o,almost_full=>af,rd_en=>read_i,rd_data=>read_data_o,empty=>empty_o,almost_empty=>ae,level=>level_o);
end architecture;
