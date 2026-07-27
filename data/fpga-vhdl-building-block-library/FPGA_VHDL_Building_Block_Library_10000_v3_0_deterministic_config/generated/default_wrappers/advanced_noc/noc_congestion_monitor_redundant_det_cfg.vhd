-- Deterministic generated wrapper. Do not edit manually.
-- Source block: noc_congestion_monitor_redundant
-- Configuration ID: NOC_CONGESTION_MONITOR_REDUNDANT_C60C51DF19C1C266
-- Source: rtl/blocks/advanced_noc/noc_congestion_monitor_redundant.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity noc_congestion_monitor_redundant_det_cfg is
  generic (
    DATA_WIDTH : positive := 32;
    STATUS_WIDTH : positive := 16;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "NOC_CONGESTION_MONITOR_REDUNDANT_C60C51DF19C1C266"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    phy_rx : in std_logic;
    phy_tx : out std_logic;
    phy_oe : out std_logic;
    tx_data : in std_logic_vector(DATA_WIDTH-1 downto 0);
    tx_valid : in std_logic;
    tx_ready : out std_logic;
    rx_data : out std_logic_vector(DATA_WIDTH-1 downto 0);
    rx_valid : out std_logic;
    status : out std_logic_vector(STATUS_WIDTH-1 downto 0)
  );
end entity;

architecture deterministic_wrapper of noc_congestion_monitor_redundant_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert STATUS_WIDTH = 16 report "Locked deterministic configuration mismatch: STATUS_WIDTH" severity failure;

  u_block : entity work.noc_congestion_monitor_redundant
    generic map (
      DATA_WIDTH => DATA_WIDTH,
      STATUS_WIDTH => STATUS_WIDTH
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      phy_rx => phy_rx,
      phy_tx => phy_tx,
      phy_oe => phy_oe,
      tx_data => tx_data,
      tx_valid => tx_valid,
      tx_ready => tx_ready,
      rx_data => rx_data,
      rx_valid => rx_valid,
      status => status
    );
end architecture;
