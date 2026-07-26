-- Auto-generated from FPGA Building Block Catalog BB-0518
-- Block: program_counter_low_power
-- Category: CPU Frontend / Fetch, prediction and decode
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: bit-accurate integer behavior for implemented operation subset
library ieee; use ieee.std_logic_1164.all;
entity program_counter_low_power is
  generic (PC_WIDTH:positive:=32; RESET_VECTOR:natural:=0; INSTR_BYTES:positive:=4);
  port (clk,rst_n,stall,sequential_advance,redirect_valid:in std_logic;
        redirect_pc:in std_logic_vector(PC_WIDTH-1 downto 0);
        pc_current,pc_next:out std_logic_vector(PC_WIDTH-1 downto 0); pc_valid:out std_logic);
end entity;
architecture rtl of program_counter_low_power is begin
  u_core: entity work.bb_program_counter_core generic map(PC_WIDTH=>PC_WIDTH,RESET_VECTOR=>RESET_VECTOR,INSTR_BYTES=>INSTR_BYTES)
  port map(clk=>clk,rst_n=>rst_n,stall=>stall,sequential_advance=>sequential_advance,redirect_valid=>redirect_valid,
           redirect_pc=>redirect_pc,pc_current=>pc_current,pc_next=>pc_next,pc_valid=>pc_valid);
end architecture;
