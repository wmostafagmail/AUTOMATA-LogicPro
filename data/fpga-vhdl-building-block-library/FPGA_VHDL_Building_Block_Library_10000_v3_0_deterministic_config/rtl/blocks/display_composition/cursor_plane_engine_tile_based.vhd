-- Auto-generated from FPGA Building Block Catalog BB-5060
-- Block: cursor_plane_engine_tile_based
-- Category: Display Composition / Display planes and color
-- Implementation tier: B
-- Verification status: interface-wrapper smoke-test scaffold; named algorithm/architecture not yet qualified.
-- Functional status: generated interface/reference wrapper; implement and verify the named block semantics before production use.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: shared-core surrogate only; block-specific golden model and numerical qualification required.
library ieee; use ieee.std_logic_1164.all;
entity cursor_plane_engine_tile_based is generic(DATA_WIDTH:positive:=24;GAIN_SHIFT:natural:=0);port(clk,rst_n:in std_logic;sample_in:in std_logic_vector(DATA_WIDTH-1 downto 0);in_valid:in std_logic;in_ready:out std_logic;sample_out:out std_logic_vector(DATA_WIDTH-1 downto 0);out_valid:out std_logic;out_ready:in std_logic);end entity;
architecture rtl of cursor_plane_engine_tile_based is begin u_core:entity work.bb_media_pipe_core generic map(DATA_WIDTH=>DATA_WIDTH,GAIN_SHIFT=>GAIN_SHIFT) port map(clk=>clk,rst_n=>rst_n,sample_in=>sample_in,in_valid=>in_valid,in_ready=>in_ready,sample_out=>sample_out,out_valid=>out_valid,out_ready=>out_ready);end architecture;
