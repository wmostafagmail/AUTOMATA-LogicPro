-- Deterministic generated wrapper. Do not edit manually.
-- Source block: point_cloud_formatter_single_cycle
-- Configuration ID: POINT_CLOUD_FORMATTER_SINGLE_CYCLE_5F4245C74CEAEA6C
-- Source: rtl/blocks/radar_and_lidar/point_cloud_formatter_single_cycle.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity point_cloud_formatter_single_cycle_det_cfg is
  generic (
    DATA_WIDTH : positive := 32;
    XOR_MASK : natural := 118;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "POINT_CLOUD_FORMATTER_SINGLE_CYCLE_5F4245C74CEAEA6C"
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

architecture deterministic_wrapper of point_cloud_formatter_single_cycle_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert XOR_MASK = 118 report "Locked deterministic configuration mismatch: XOR_MASK" severity failure;

  u_block : entity work.point_cloud_formatter_single_cycle
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
