-- Auto-generated from FPGA Building Block Catalog BB-9465
-- Block: data_trace_compressor_stress_test
-- Category: Debug and Trace / On-chip observability
-- Implementation tier: B
-- Verification status: interface-wrapper smoke-test scaffold; named algorithm/architecture not yet qualified.
-- Functional status: generated interface/reference wrapper; implement and verify the named block semantics before production use.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: shared-core surrogate only; block-specific golden model and numerical qualification required.
library ieee; use ieee.std_logic_1164.all;
entity data_trace_compressor_stress_test is generic(OBS_WIDTH:positive:=32;COUNT_WIDTH:positive:=32);port(clk,rst_n:in std_logic;observed,expected:in std_logic_vector(OBS_WIDTH-1 downto 0);sample_valid,clear:in std_logic;match:out std_logic;error_count:out std_logic_vector(COUNT_WIDTH-1 downto 0));end entity;
architecture rtl of data_trace_compressor_stress_test is begin u_core:entity work.bb_monitor_core generic map(OBS_WIDTH=>OBS_WIDTH,COUNT_WIDTH=>COUNT_WIDTH) port map(clk=>clk,rst_n=>rst_n,observed=>observed,expected=>expected,sample_valid=>sample_valid,clear=>clear,match=>match,error_count=>error_count);end architecture;
