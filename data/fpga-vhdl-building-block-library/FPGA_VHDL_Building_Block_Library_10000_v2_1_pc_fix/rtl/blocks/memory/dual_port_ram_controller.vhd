-- Auto-generated from FPGA Building Block Catalog BB-0083
-- Block: dual_port_ram_controller
-- Category: Memory / Memory structures
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all; use work.bb_util_pkg.all;
entity dual_port_ram_controller is
  generic (DATA_WIDTH:positive:=32; DEPTH:positive:=256);
  port (clk,rst_n,wr_en:in std_logic; wr_addr:in std_logic_vector(clog2(DEPTH)-1 downto 0); wr_data:in std_logic_vector(DATA_WIDTH-1 downto 0);
        rd_en:in std_logic; rd_addr:in std_logic_vector(clog2(DEPTH)-1 downto 0); rd_data:out std_logic_vector(DATA_WIDTH-1 downto 0); rd_valid:out std_logic);
end entity;
architecture rtl of dual_port_ram_controller is begin
  u_core: entity work.bb_sync_ram_core generic map(DATA_WIDTH=>DATA_WIDTH,DEPTH=>DEPTH)
  port map(clk=>clk,rst_n=>rst_n,wr_en=>wr_en,wr_addr=>wr_addr,wr_data=>wr_data,rd_en=>rd_en,rd_addr=>rd_addr,rd_data=>rd_data,rd_valid=>rd_valid);
end architecture;
