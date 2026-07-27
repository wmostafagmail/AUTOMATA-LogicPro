library ieee; use ieee.std_logic_1164.all;
entity async_fifo_basic is generic(G_DATA_WIDTH:positive:=32;G_DEPTH:positive:=16);
 port(wr_clk_i,wr_rst_ni,write_i:in std_logic;write_data_i:in std_logic_vector(G_DATA_WIDTH-1 downto 0);full_o:out std_logic;
 rd_clk_i,rd_rst_ni,read_i:in std_logic;read_data_o:out std_logic_vector(G_DATA_WIDTH-1 downto 0);empty_o:out std_logic);end entity;
architecture rtl of async_fifo_basic is signal af,ae:std_logic; begin
 assert G_DEPTH >= 4 report "Async FIFO depth must be >= 4" severity failure;
 u_core:entity work.async_fifo generic map(DATA_WIDTH=>G_DATA_WIDTH,DEPTH=>G_DEPTH) port map(wr_clk=>wr_clk_i,wr_rst_n=>wr_rst_ni,wr_en=>write_i,wr_data=>write_data_i,full=>full_o,almost_full=>af,rd_clk=>rd_clk_i,rd_rst_n=>rd_rst_ni,rd_en=>read_i,rd_data=>read_data_o,empty=>empty_o,almost_empty=>ae);
end architecture;
