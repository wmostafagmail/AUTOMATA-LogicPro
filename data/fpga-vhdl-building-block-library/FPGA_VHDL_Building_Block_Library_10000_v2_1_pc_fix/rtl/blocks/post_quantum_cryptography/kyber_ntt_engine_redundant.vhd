-- Auto-generated from FPGA Building Block Catalog BB-8971
-- Block: kyber_ntt_engine_redundant
-- Category: Post-Quantum Cryptography / Lattice and hash-based primitives
-- Implementation tier: C
-- Verification status: interface-wrapper smoke-test scaffold; named algorithm/architecture not yet qualified.
-- Functional status: generated interface/reference wrapper; implement and verify the named block semantics before production use.
-- Protocol status: integration_shell_only; external compliant controller/PHY/VIP required
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: shared-core surrogate only; block-specific golden model and numerical qualification required.
library ieee; use ieee.std_logic_1164.all;
entity kyber_ntt_engine_redundant is generic(DATA_WIDTH:positive:=128;KEY_WIDTH:positive:=128);port(clk,rst_n:in std_logic;data_in:in std_logic_vector(DATA_WIDTH-1 downto 0);key_in:in std_logic_vector(KEY_WIDTH-1 downto 0);in_valid:in std_logic;in_ready:out std_logic;data_out:out std_logic_vector(DATA_WIDTH-1 downto 0);out_valid:out std_logic;out_ready:in std_logic;fault:out std_logic);end entity;
architecture rtl of kyber_ntt_engine_redundant is begin u_core:entity work.bb_crypto_shell_core generic map(DATA_WIDTH=>DATA_WIDTH,KEY_WIDTH=>KEY_WIDTH) port map(clk=>clk,rst_n=>rst_n,data_in=>data_in,key_in=>key_in,in_valid=>in_valid,in_ready=>in_ready,data_out=>data_out,out_valid=>out_valid,out_ready=>out_ready,fault=>fault);end architecture;
