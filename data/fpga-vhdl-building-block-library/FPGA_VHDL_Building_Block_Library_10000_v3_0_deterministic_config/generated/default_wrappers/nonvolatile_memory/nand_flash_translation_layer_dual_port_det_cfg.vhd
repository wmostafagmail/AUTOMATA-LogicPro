-- Deterministic generated wrapper. Do not edit manually.
-- Source block: nand_flash_translation_layer_dual_port
-- Configuration ID: NAND_FLASH_TRANSLATION_LAYER_DUAL_PORT_D475E772B2DF75A6
-- Source: rtl/blocks/nonvolatile_memory/nand_flash_translation_layer_dual_port.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity nand_flash_translation_layer_dual_port_det_cfg is
  generic (
    ADDR_WIDTH : positive := 32;
    DATA_WIDTH : positive := 32;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "NAND_FLASH_TRANSLATION_LAYER_DUAL_PORT_D475E772B2DF75A6"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    start : in std_logic;
    src_addr : in std_logic_vector(ADDR_WIDTH-1 downto 0);
    dst_addr : in std_logic_vector(ADDR_WIDTH-1 downto 0);
    data_in : in std_logic_vector(DATA_WIDTH-1 downto 0);
    data_out : out std_logic_vector(DATA_WIDTH-1 downto 0);
    busy : out std_logic;
    done : out std_logic;
    error : out std_logic
  );
end entity;

architecture deterministic_wrapper of nand_flash_translation_layer_dual_port_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert ADDR_WIDTH = 32 report "Locked deterministic configuration mismatch: ADDR_WIDTH" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;

  u_block : entity work.nand_flash_translation_layer_dual_port
    generic map (
      ADDR_WIDTH => ADDR_WIDTH,
      DATA_WIDTH => DATA_WIDTH
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      start => start,
      src_addr => src_addr,
      dst_addr => dst_addr,
      data_in => data_in,
      data_out => data_out,
      busy => busy,
      done => done,
      error => error
    );
end architecture;
