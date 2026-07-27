-- Deterministic generated wrapper. Do not edit manually.
-- Source block: beamforming_engine_single_cycle
-- Configuration ID: BEAMFORMING_ENGINE_SINGLE_CYCLE_337B857FE67985B6
-- Source: rtl/blocks/rf_and_sdr/beamforming_engine_single_cycle.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity beamforming_engine_single_cycle_det_cfg is
  generic (
    DATA_WIDTH : positive := 32;
    XOR_MASK : natural := 6;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "BEAMFORMING_ENGINE_SINGLE_CYCLE_337B857FE67985B6"
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

architecture deterministic_wrapper of beamforming_engine_single_cycle_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert XOR_MASK = 6 report "Locked deterministic configuration mismatch: XOR_MASK" severity failure;

  u_block : entity work.beamforming_engine_single_cycle
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
