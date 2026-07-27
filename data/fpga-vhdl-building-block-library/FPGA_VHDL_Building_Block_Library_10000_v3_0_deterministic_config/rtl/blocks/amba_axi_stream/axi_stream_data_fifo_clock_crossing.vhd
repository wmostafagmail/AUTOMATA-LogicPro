-- Auto-generated from FPGA Building Block Catalog BB-3026
-- Block: axi_stream_data_fifo_clock_crossing
-- Category: AMBA AXI Stream / AXI4-Stream transport
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: subset_contract; run official or commercial protocol VIP before release
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: recognized CDC structure with ASYNC_REG attributes; external CDC tool sign-off required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity axi_stream_data_fifo_clock_crossing is
  generic (DATA_WIDTH:positive:=32; DEPTH:positive:=16);
  port (wr_clk,wr_rst_n,wr_en:in std_logic; wr_data:in std_logic_vector(DATA_WIDTH-1 downto 0); full,almost_full:out std_logic;
        rd_clk,rd_rst_n,rd_en:in std_logic; rd_data:out std_logic_vector(DATA_WIDTH-1 downto 0); empty,almost_empty:out std_logic);
end entity;
architecture rtl of axi_stream_data_fifo_clock_crossing is begin
  u_core: entity work.bb_async_fifo_core generic map(DATA_WIDTH=>DATA_WIDTH,DEPTH=>DEPTH)
  port map(wr_clk=>wr_clk,wr_rst_n=>wr_rst_n,wr_en=>wr_en,wr_data=>wr_data,full=>full,almost_full=>almost_full,
           rd_clk=>rd_clk,rd_rst_n=>rd_rst_n,rd_en=>rd_en,rd_data=>rd_data,empty=>empty,almost_empty=>almost_empty);
end architecture;
