-- Auto-generated from FPGA Building Block Catalog BB-2666
-- Block: axi_stream_subset_converter_clock_crossing
-- Category: AMBA AXI Stream / AXI4-Stream transport
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: subset_contract; run official or commercial protocol VIP before release
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: recognized CDC structure with ASYNC_REG attributes; external CDC tool sign-off required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity axi_stream_subset_converter_clock_crossing is generic(DATA_WIDTH:positive:=1;STAGES:positive:=2);port(dst_clk,dst_rst_n:in std_logic;async_in:in std_logic_vector(DATA_WIDTH-1 downto 0);sync_out:out std_logic_vector(DATA_WIDTH-1 downto 0));end entity;
architecture rtl of axi_stream_subset_converter_clock_crossing is begin u_core:entity work.bb_cdc_sync_core generic map(DATA_WIDTH=>DATA_WIDTH,STAGES=>STAGES) port map(dst_clk=>dst_clk,dst_rst_n=>dst_rst_n,async_in=>async_in,sync_out=>sync_out);end architecture;
