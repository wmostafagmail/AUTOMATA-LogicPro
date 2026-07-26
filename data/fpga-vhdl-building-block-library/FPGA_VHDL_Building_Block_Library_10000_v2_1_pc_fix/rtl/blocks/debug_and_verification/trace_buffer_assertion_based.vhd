-- Auto-generated from FPGA Building Block Catalog BB-0598
-- Block: trace_buffer_assertion_based
-- Category: Debug and Verification / On-chip debug and reusable verification
-- Implementation tier: B
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity trace_buffer_assertion_based is generic(OBS_WIDTH:positive:=32;COUNT_WIDTH:positive:=32);port(clk,rst_n:in std_logic;observed,expected:in std_logic_vector(OBS_WIDTH-1 downto 0);sample_valid,clear:in std_logic;match:out std_logic;error_count:out std_logic_vector(COUNT_WIDTH-1 downto 0));end entity;
architecture rtl of trace_buffer_assertion_based is begin u_core:entity work.bb_monitor_core generic map(OBS_WIDTH=>OBS_WIDTH,COUNT_WIDTH=>COUNT_WIDTH) port map(clk=>clk,rst_n=>rst_n,observed=>observed,expected=>expected,sample_valid=>sample_valid,clear=>clear,match=>match,error_count=>error_count);end architecture;
