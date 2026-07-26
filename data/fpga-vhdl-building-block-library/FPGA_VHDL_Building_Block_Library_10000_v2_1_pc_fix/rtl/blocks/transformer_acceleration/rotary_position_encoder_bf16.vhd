-- Auto-generated from FPGA Building Block Catalog BB-3590
-- Block: rotary_position_encoder_bf16
-- Category: Transformer Acceleration / Attention and sequence models
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: parameterized_integer/fixed-point reference behavior; quantify error against system model
library ieee; use ieee.std_logic_1164.all;
entity rotary_position_encoder_bf16 is generic(DATA_WIDTH:positive:=32;RESULT_WIDTH:positive:=32;SIGNED_MODE:boolean:=false);
 port(clk,rst_n:in std_logic;in_a,in_b:in std_logic_vector(DATA_WIDTH-1 downto 0);in_valid:in std_logic;in_ready:out std_logic;result:out std_logic_vector(RESULT_WIDTH-1 downto 0);out_valid:out std_logic;out_ready:in std_logic;error:out std_logic);end entity;
architecture rtl of rotary_position_encoder_bf16 is begin u_core:entity work.bb_datapath_core generic map(DATA_WIDTH=>DATA_WIDTH,RESULT_WIDTH=>RESULT_WIDTH,OP_CODE=>8,SIGNED_MODE=>SIGNED_MODE) port map(clk=>clk,rst_n=>rst_n,in_a=>in_a,in_b=>in_b,in_valid=>in_valid,in_ready=>in_ready,result=>result,out_valid=>out_valid,out_ready=>out_ready,error=>error);end architecture;
