-- Auto-generated from FPGA Building Block Catalog BB-1254
-- Block: sample_trigger_engine_low_power
-- Category: Sensors and DAQ / Acquisition and instrumentation
-- Implementation tier: B
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity sample_trigger_engine_low_power is generic(SENSOR_WIDTH:positive:=16;DATA_WIDTH:positive:=32;THRESHOLD:natural:=100);port(clk,rst_n,trigger:in std_logic;sensor_in:in std_logic_vector(SENSOR_WIDTH-1 downto 0);sample_out:out std_logic_vector(DATA_WIDTH-1 downto 0);sample_valid,event_irq:out std_logic);end entity;
architecture rtl of sample_trigger_engine_low_power is begin u_core:entity work.bb_sensor_core generic map(SENSOR_WIDTH=>SENSOR_WIDTH,DATA_WIDTH=>DATA_WIDTH,THRESHOLD=>THRESHOLD) port map(clk=>clk,rst_n=>rst_n,trigger=>trigger,sensor_in=>sensor_in,sample_out=>sample_out,sample_valid=>sample_valid,event_irq=>event_irq);end architecture;
