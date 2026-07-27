-- Deterministic generated wrapper. Do not edit manually.
-- Source block: ethernet_crc_engine_resource_shared
-- Configuration ID: ETHERNET_CRC_ENGINE_RESOURCE_SHARED_0CABEBC02E49B8F4
-- Source: rtl/blocks/ethernet_mac/ethernet_crc_engine_resource_shared.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity ethernet_crc_engine_resource_shared_det_cfg is
  generic (
    DATA_WIDTH : positive := 8;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "ETHERNET_CRC_ENGINE_RESOURCE_SHARED_0CABEBC02E49B8F4"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    clear : in std_logic;
    data_in : in std_logic_vector(DATA_WIDTH-1 downto 0);
    data_valid : in std_logic;
    crc_out : out std_logic_vector(31 downto 0);
    crc_valid : out std_logic
  );
end entity;

architecture deterministic_wrapper of ethernet_crc_engine_resource_shared_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 8 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;

  u_block : entity work.ethernet_crc_engine_resource_shared
    generic map (
      DATA_WIDTH => DATA_WIDTH
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      clear => clear,
      data_in => data_in,
      data_valid => data_valid,
      crc_out => crc_out,
      crc_valid => crc_valid
    );
end architecture;
