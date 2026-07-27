-- Auto-generated from FPGA Building Block Catalog BB-1792
-- Block: forward_kinematics_engine_programmable
-- Category: Robotics / Motion, navigation and control
-- Implementation tier: B
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity forward_kinematics_engine_programmable is generic(CMD_WIDTH:positive:=8;CFG_WIDTH:positive:=32;STATUS_WIDTH:positive:=32;LATENCY_CYCLES:positive:=4);port(clk,rst_n,start,abort:in std_logic;command:in std_logic_vector(CMD_WIDTH-1 downto 0);cfg:in std_logic_vector(CFG_WIDTH-1 downto 0);busy,done,error:out std_logic;status:out std_logic_vector(STATUS_WIDTH-1 downto 0));end entity;
architecture rtl of forward_kinematics_engine_programmable is begin u_core:entity work.bb_control_core generic map(CMD_WIDTH=>CMD_WIDTH,CFG_WIDTH=>CFG_WIDTH,STATUS_WIDTH=>STATUS_WIDTH,LATENCY_CYCLES=>LATENCY_CYCLES) port map(clk=>clk,rst_n=>rst_n,start=>start,abort=>abort,command=>command,cfg=>cfg,busy=>busy,done=>done,error=>error,status=>status);end architecture;
