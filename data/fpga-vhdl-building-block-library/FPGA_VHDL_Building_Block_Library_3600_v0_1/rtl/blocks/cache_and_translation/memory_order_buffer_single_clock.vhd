-- Auto-generated from FPGA Building Block Catalog BB-3443
-- Block: memory_order_buffer_single_clock
-- Category: Cache and Translation / Caches, TLBs and memory ordering
-- Implementation tier: B
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity memory_order_buffer_single_clock is generic(ADDR_WIDTH:positive:=32;DATA_WIDTH:positive:=32);port(clk,rst_n,start:in std_logic;src_addr,dst_addr:in std_logic_vector(ADDR_WIDTH-1 downto 0);data_in:in std_logic_vector(DATA_WIDTH-1 downto 0);data_out:out std_logic_vector(DATA_WIDTH-1 downto 0);busy,done,error:out std_logic);end entity;
architecture rtl of memory_order_buffer_single_clock is begin u_core:entity work.bb_memory_service_core generic map(ADDR_WIDTH=>ADDR_WIDTH,DATA_WIDTH=>DATA_WIDTH) port map(clk=>clk,rst_n=>rst_n,start=>start,src_addr=>src_addr,dst_addr=>dst_addr,data_in=>data_in,data_out=>data_out,busy=>busy,done=>done,error=>error);end architecture;
