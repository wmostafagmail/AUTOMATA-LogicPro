-- Auto-generated from FPGA Building Block Catalog BB-9138
-- Block: dual_core_lockstep_monitor_dual_channel
-- Category: Advanced Functional Safety / Redundancy and diagnostics
-- Implementation tier: B
-- Verification status: interface-wrapper smoke-test scaffold; named algorithm/architecture not yet qualified.
-- Functional status: generated interface/reference wrapper; implement and verify the named block semantics before production use.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: shared-core surrogate only; block-specific golden model and numerical qualification required.
library ieee; use ieee.std_logic_1164.all;
entity dual_core_lockstep_monitor_dual_channel is generic(MON_WIDTH:positive:=16;COUNT_WIDTH:positive:=32);port(clk,rst_n:in std_logic;monitored_signals:in std_logic_vector(MON_WIDTH-1 downto 0);clear_faults:in std_logic;fault_detected:out std_logic_vector(MON_WIDTH-1 downto 0);safe_state_req,irq:out std_logic;error_count:out std_logic_vector(COUNT_WIDTH-1 downto 0));end entity;
architecture rtl of dual_core_lockstep_monitor_dual_channel is begin u_core:entity work.bb_safety_monitor_core generic map(MON_WIDTH=>MON_WIDTH,COUNT_WIDTH=>COUNT_WIDTH) port map(clk=>clk,rst_n=>rst_n,monitored_signals=>monitored_signals,clear_faults=>clear_faults,fault_detected=>fault_detected,safe_state_req=>safe_state_req,irq=>irq,error_count=>error_count);end architecture;
