-- Auto-generated from FPGA Building Block Catalog BB-2962
-- Block: skid_buffer_multi_queue
-- Category: Queues / FIFO, queue and buffering structures
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all; use work.bb_util_pkg.all;
entity skid_buffer_multi_queue is
  generic (DATA_WIDTH:positive:=32; DEPTH:positive:=16);
  port (clk,rst_n,wr_en:in std_logic; wr_data:in std_logic_vector(DATA_WIDTH-1 downto 0); full,almost_full:out std_logic;
        rd_en:in std_logic; rd_data:out std_logic_vector(DATA_WIDTH-1 downto 0); empty,almost_empty:out std_logic;
        level:out std_logic_vector(clog2(DEPTH+1)-1 downto 0));
end entity;
architecture rtl of skid_buffer_multi_queue is begin
  u_core: entity work.bb_sync_fifo_core generic map(DATA_WIDTH=>DATA_WIDTH,DEPTH=>DEPTH)
  port map(clk=>clk,rst_n=>rst_n,wr_en=>wr_en,wr_data=>wr_data,full=>full,almost_full=>almost_full,rd_en=>rd_en,rd_data=>rd_data,empty=>empty,almost_empty=>almost_empty,level=>level);
end architecture;
