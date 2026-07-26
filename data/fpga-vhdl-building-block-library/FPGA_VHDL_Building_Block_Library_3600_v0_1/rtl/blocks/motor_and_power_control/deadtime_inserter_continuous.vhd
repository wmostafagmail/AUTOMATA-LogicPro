-- Auto-generated from FPGA Building Block Catalog BB-0653
-- Block: deadtime_inserter_continuous
-- Category: Motor and Power Control / Motor drives and power electronics
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity deadtime_inserter_continuous is generic(WIDTH:positive:=16); port(clk,rst_n,enable:in std_logic; period,duty:in std_logic_vector(WIDTH-1 downto 0); pwm_out,period_tick:out std_logic); end entity;
architecture rtl of deadtime_inserter_continuous is begin u_core:entity work.bb_pwm_core generic map(WIDTH=>WIDTH) port map(clk=>clk,rst_n=>rst_n,enable=>enable,period=>period,duty=>duty,pwm_out=>pwm_out,period_tick=>period_tick); end architecture;
