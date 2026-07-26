-- Auto-generated from FPGA Building Block Catalog BB-0125
-- Block: register_file_cpu
-- Category: CPU and SoC / CPU datapath
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all; use work.bb_util_pkg.all;
entity register_file_cpu is
  generic (XLEN:positive:=32; REG_COUNT:positive:=32; ZERO_REGISTER:boolean:=true);
  port (clk,rst_n:in std_logic; rs1_addr,rs2_addr,rd_addr:in std_logic_vector(clog2(REG_COUNT)-1 downto 0);
        rd_wdata:in std_logic_vector(XLEN-1 downto 0); rd_we:in std_logic; rs1_rdata,rs2_rdata:out std_logic_vector(XLEN-1 downto 0));
end entity;
architecture rtl of register_file_cpu is begin
  u_core: entity work.bb_register_file_core generic map(XLEN=>XLEN,REG_COUNT=>REG_COUNT,ZERO_REGISTER=>ZERO_REGISTER)
  port map(clk=>clk,rst_n=>rst_n,rs1_addr=>rs1_addr,rs2_addr=>rs2_addr,rd_addr=>rd_addr,rd_wdata=>rd_wdata,rd_we=>rd_we,rs1_rdata=>rs1_rdata,rs2_rdata=>rs2_rdata);
end architecture;
