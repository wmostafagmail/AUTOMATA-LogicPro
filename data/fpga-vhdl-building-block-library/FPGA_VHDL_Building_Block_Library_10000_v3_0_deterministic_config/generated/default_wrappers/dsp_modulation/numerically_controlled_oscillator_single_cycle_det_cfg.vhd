-- Deterministic generated wrapper. Do not edit manually.
-- Source block: numerically_controlled_oscillator_single_cycle
-- Configuration ID: NUMERICALLY_CONTROLLED_OSCILLATOR_SINGLE_CYCLE_EBFD381EE50D822C
-- Source: rtl/blocks/dsp_modulation/numerically_controlled_oscillator_single_cycle.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity numerically_controlled_oscillator_single_cycle_det_cfg is
  generic (
    DATA_WIDTH : positive := 32;
    XOR_MASK : natural := 229;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "NUMERICALLY_CONTROLLED_OSCILLATOR_SINGLE_CYCLE_EBFD381EE50D822C"
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

architecture deterministic_wrapper of numerically_controlled_oscillator_single_cycle_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert XOR_MASK = 229 report "Locked deterministic configuration mismatch: XOR_MASK" severity failure;

  u_block : entity work.numerically_controlled_oscillator_single_cycle
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
