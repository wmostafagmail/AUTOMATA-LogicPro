-- Deterministic generated wrapper. Do not edit manually.
-- Source block: digital_up_converter_combinational
-- Configuration ID: DIGITAL_UP_CONVERTER_COMBINATIONAL_906E420A77726EC7
-- Source: rtl/blocks/rf_and_sdr/digital_up_converter_combinational.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity digital_up_converter_combinational_det_cfg is
  generic (
    DATA_WIDTH : positive := 32;
    XOR_MASK : natural := 27;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "DIGITAL_UP_CONVERTER_COMBINATIONAL_906E420A77726EC7"
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

architecture deterministic_wrapper of digital_up_converter_combinational_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert XOR_MASK = 27 report "Locked deterministic configuration mismatch: XOR_MASK" severity failure;

  u_block : entity work.digital_up_converter_combinational
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
