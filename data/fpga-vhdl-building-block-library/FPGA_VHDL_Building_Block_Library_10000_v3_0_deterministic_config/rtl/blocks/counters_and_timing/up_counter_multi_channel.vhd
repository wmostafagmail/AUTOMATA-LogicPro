-- Auto-generated from FPGA Building Block Catalog BB-0488
-- Block: up_counter_multi_channel
-- Category: Counters and Timing / Counters, timers and event measurement
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: bit-accurate integer behavior for implemented operation subset
library ieee; use ieee.std_logic_1164.all; use work.bb_util_pkg.all;
entity up_counter_multi_channel is
  generic (COUNT_WIDTH:positive:=32; MODULUS:positive:=65536; STEP:positive:=1; SATURATING:boolean:=false; DOWN_COUNT:boolean:=false);
  port (clk,rst_n,enable,load,clear:in std_logic; load_value:in std_logic_vector(COUNT_WIDTH-1 downto 0);
        count:out std_logic_vector(COUNT_WIDTH-1 downto 0); terminal_count,overflow:out std_logic);
end entity;
architecture rtl of up_counter_multi_channel is begin
  u_core: entity work.bb_counter_core generic map(COUNT_WIDTH=>COUNT_WIDTH,MODULUS=>MODULUS,STEP=>STEP,SATURATING=>SATURATING,DOWN_COUNT=>DOWN_COUNT)
  port map(clk=>clk,rst_n=>rst_n,enable=>enable,load=>load,load_value=>load_value,clear=>clear,count=>count,terminal_count=>terminal_count,overflow=>overflow);
end architecture;
