-- Auto-generated from FPGA Building Block Catalog BB-7592
-- Block: storage_phy_oob_controller_dma_attached
-- Category: SATA and SAS / Storage serial protocols
-- Implementation tier: C
-- Verification status: interface-wrapper smoke-test scaffold; named algorithm/architecture not yet qualified.
-- Functional status: generated interface/reference wrapper; implement and verify the named block semantics before production use.
-- Protocol status: integration_shell_only; external compliant controller/PHY/VIP required
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: shared-core surrogate only; block-specific golden model and numerical qualification required.
library ieee; use ieee.std_logic_1164.all;
entity storage_phy_oob_controller_dma_attached is generic(DATA_WIDTH:positive:=32;STATUS_WIDTH:positive:=16);port(clk,rst_n,phy_rx:in std_logic;phy_tx,phy_oe:out std_logic;tx_data:in std_logic_vector(DATA_WIDTH-1 downto 0);tx_valid:in std_logic;tx_ready:out std_logic;rx_data:out std_logic_vector(DATA_WIDTH-1 downto 0);rx_valid:out std_logic;status:out std_logic_vector(STATUS_WIDTH-1 downto 0));end entity;
architecture rtl of storage_phy_oob_controller_dma_attached is begin u_core:entity work.bb_protocol_shell_core generic map(DATA_WIDTH=>DATA_WIDTH,STATUS_WIDTH=>STATUS_WIDTH) port map(clk=>clk,rst_n=>rst_n,phy_rx=>phy_rx,phy_tx=>phy_tx,phy_oe=>phy_oe,tx_data=>tx_data,tx_valid=>tx_valid,tx_ready=>tx_ready,rx_data=>rx_data,rx_valid=>rx_valid,status=>status);end architecture;
