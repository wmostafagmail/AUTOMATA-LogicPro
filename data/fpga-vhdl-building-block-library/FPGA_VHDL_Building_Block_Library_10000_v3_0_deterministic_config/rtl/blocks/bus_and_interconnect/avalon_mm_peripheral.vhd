-- Auto-generated from FPGA Building Block Catalog BB-0035
-- Block: avalon_mm_peripheral
-- Category: Bus and Interconnect / Avalon
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity avalon_mm_peripheral is generic(ADDR_WIDTH:positive:=8;DATA_WIDTH:positive:=32;REG_COUNT:positive:=16);port(clk,rst_n:in std_logic;addr:in std_logic_vector(ADDR_WIDTH-1 downto 0);write_en,read_en:in std_logic;wdata:in std_logic_vector(DATA_WIDTH-1 downto 0);wstrb:in std_logic_vector(DATA_WIDTH/8-1 downto 0);rdata:out std_logic_vector(DATA_WIDTH-1 downto 0);ready,error,irq:out std_logic);end entity;
architecture rtl of avalon_mm_peripheral is begin u_core:entity work.bb_mmio_core generic map(ADDR_WIDTH=>ADDR_WIDTH,DATA_WIDTH=>DATA_WIDTH,REG_COUNT=>REG_COUNT) port map(clk=>clk,rst_n=>rst_n,addr=>addr,write_en=>write_en,read_en=>read_en,wdata=>wdata,wstrb=>wstrb,rdata=>rdata,ready=>ready,error=>error,irq=>irq);end architecture;
