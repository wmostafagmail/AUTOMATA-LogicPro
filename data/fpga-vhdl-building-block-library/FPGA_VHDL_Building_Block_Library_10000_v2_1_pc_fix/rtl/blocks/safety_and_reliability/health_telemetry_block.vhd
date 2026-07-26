-- Auto-generated from FPGA Building Block Catalog BB-0174
-- Block: health_telemetry_block
-- Category: Safety and Reliability / Safety and Reliability
-- Implementation tier: B
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity health_telemetry_block is generic(MON_WIDTH:positive:=16;COUNT_WIDTH:positive:=32);port(clk,rst_n:in std_logic;monitored_signals:in std_logic_vector(MON_WIDTH-1 downto 0);clear_faults:in std_logic;fault_detected:out std_logic_vector(MON_WIDTH-1 downto 0);safe_state_req,irq:out std_logic;error_count:out std_logic_vector(COUNT_WIDTH-1 downto 0));end entity;
architecture rtl of health_telemetry_block is begin u_core:entity work.bb_safety_monitor_core generic map(MON_WIDTH=>MON_WIDTH,COUNT_WIDTH=>COUNT_WIDTH) port map(clk=>clk,rst_n=>rst_n,monitored_signals=>monitored_signals,clear_faults=>clear_faults,fault_detected=>fault_detected,safe_state_req=>safe_state_req,irq=>irq,error_count=>error_count);end architecture;
