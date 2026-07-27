-- Auto-generated from FPGA Building Block Catalog BB-1205
-- Block: configuration_crc_checker_fault_tolerant
-- Category: Reconfiguration and Management / Configuration, boot and telemetry
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: bit-accurate integer behavior for implemented operation subset
library ieee; use ieee.std_logic_1164.all;
entity configuration_crc_checker_fault_tolerant is generic(DATA_WIDTH:positive:=8);port(clk,rst_n,clear:in std_logic;data_in:in std_logic_vector(DATA_WIDTH-1 downto 0);data_valid:in std_logic;crc_out:out std_logic_vector(31 downto 0);crc_valid:out std_logic);end entity;
architecture rtl of configuration_crc_checker_fault_tolerant is begin u_core:entity work.bb_crc32_core generic map(DATA_WIDTH=>DATA_WIDTH) port map(clk=>clk,rst_n=>rst_n,clear=>clear,data_in=>data_in,data_valid=>data_valid,crc_out=>crc_out,crc_valid=>crc_valid);end architecture;
