-- Auto-generated from FPGA Building Block Catalog BB-5221
-- Block: fft_convolution_engine_iterative
-- Category: AI Convolution / Advanced convolution
-- Implementation tier: B
-- Verification status: interface-wrapper smoke-test scaffold; named algorithm/architecture not yet qualified.
-- Functional status: generated interface/reference wrapper; implement and verify the named block semantics before production use.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: shared-core surrogate only; block-specific golden model and numerical qualification required.
library ieee; use ieee.std_logic_1164.all;
entity fft_convolution_engine_iterative is generic(DATA_WIDTH:positive:=32;RESULT_WIDTH:positive:=32;SIGNED_MODE:boolean:=false);
 port(clk,rst_n:in std_logic;in_a,in_b:in std_logic_vector(DATA_WIDTH-1 downto 0);in_valid:in std_logic;in_ready:out std_logic;result:out std_logic_vector(RESULT_WIDTH-1 downto 0);out_valid:out std_logic;out_ready:in std_logic;error:out std_logic);end entity;
architecture rtl of fft_convolution_engine_iterative is begin u_core:entity work.bb_datapath_core generic map(DATA_WIDTH=>DATA_WIDTH,RESULT_WIDTH=>RESULT_WIDTH,OP_CODE=>3,SIGNED_MODE=>SIGNED_MODE) port map(clk=>clk,rst_n=>rst_n,in_a=>in_a,in_b=>in_b,in_valid=>in_valid,in_ready=>in_ready,result=>result,out_valid=>out_valid,out_ready=>out_ready,error=>error);end architecture;
