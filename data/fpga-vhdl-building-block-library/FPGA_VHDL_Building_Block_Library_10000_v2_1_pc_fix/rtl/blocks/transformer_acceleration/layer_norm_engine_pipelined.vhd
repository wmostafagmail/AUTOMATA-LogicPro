-- Auto-generated from FPGA Building Block Catalog BB-2990
-- Block: layer_norm_engine_pipelined
-- Category: Transformer Acceleration / Attention and sequence models
-- Implementation tier: B
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: parameterized_integer/fixed-point reference behavior; quantify error against system model
library ieee; use ieee.std_logic_1164.all;
entity layer_norm_engine_pipelined is generic(ELEM_WIDTH:positive:=8;LANES:positive:=4;ACC_WIDTH:positive:=32);port(clk,rst_n:in std_logic;vector_a,vector_b:in std_logic_vector(LANES*ELEM_WIDTH-1 downto 0);in_valid:in std_logic;in_ready:out std_logic;result:out std_logic_vector(ACC_WIDTH-1 downto 0);out_valid:out std_logic;out_ready:in std_logic);end entity;
architecture rtl of layer_norm_engine_pipelined is begin u_core:entity work.bb_vector_mac_core generic map(ELEM_WIDTH=>ELEM_WIDTH,LANES=>LANES,ACC_WIDTH=>ACC_WIDTH) port map(clk=>clk,rst_n=>rst_n,vector_a=>vector_a,vector_b=>vector_b,in_valid=>in_valid,in_ready=>in_ready,result=>result,out_valid=>out_valid,out_ready=>out_ready);end architecture;
