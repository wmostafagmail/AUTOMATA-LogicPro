-- Auto-generated from FPGA Building Block Catalog BB-0155
-- Block: debounce_filter
-- Category: Sensors and Instrumentation / Sensors and Instrumentation
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity debounce_filter is generic(STABLE_CYCLES:positive:=16); port(clk,rst_n,noisy_in:in std_logic;clean_out,rise_pulse,fall_pulse:out std_logic);end entity;
architecture rtl of debounce_filter is begin u_core:entity work.bb_debounce_core generic map(STABLE_CYCLES=>STABLE_CYCLES) port map(clk=>clk,rst_n=>rst_n,noisy_in=>noisy_in,clean_out=>clean_out,rise_pulse=>rise_pulse,fall_pulse=>fall_pulse);end architecture;
