-- Deterministic generated wrapper. Do not edit manually.
-- Source block: channel_estimator_resource_shared
-- Configuration ID: CHANNEL_ESTIMATOR_RESOURCE_SHARED_63AEBE1A1D12E83C
-- Source: rtl/blocks/rf_and_sdr/channel_estimator_resource_shared.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity channel_estimator_resource_shared_det_cfg is
  generic (
    DATA_WIDTH : positive := 32;
    XOR_MASK : natural := 72;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "CHANNEL_ESTIMATOR_RESOURCE_SHARED_63AEBE1A1D12E83C"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    s_data : in std_logic_vector(DATA_WIDTH-1 downto 0);
    s_valid : in std_logic;
    s_ready : out std_logic;
    s_last : in std_logic;
    m_data : out std_logic_vector(DATA_WIDTH-1 downto 0);
    m_valid : out std_logic;
    m_ready : in std_logic;
    m_last : out std_logic
  );
end entity;

architecture deterministic_wrapper of channel_estimator_resource_shared_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert XOR_MASK = 72 report "Locked deterministic configuration mismatch: XOR_MASK" severity failure;

  u_block : entity work.channel_estimator_resource_shared
    generic map (
      DATA_WIDTH => DATA_WIDTH,
      XOR_MASK => XOR_MASK
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      s_data => s_data,
      s_valid => s_valid,
      s_ready => s_ready,
      s_last => s_last,
      m_data => m_data,
      m_valid => m_valid,
      m_ready => m_ready,
      m_last => m_last
    );
end architecture;
