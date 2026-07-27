-- Deterministic generated wrapper. Do not edit manually.
-- Source block: apb_peripheral
-- Configuration ID: APB_PERIPHERAL_72F4324ED41F45DA
-- Source: rtl/blocks/bus_and_interconnect/apb_peripheral.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity apb_peripheral_det_cfg is
  generic (
    ADDR_WIDTH : positive := 8;
    DATA_WIDTH : positive := 32;
    REG_COUNT : positive := 16;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "APB_PERIPHERAL_72F4324ED41F45DA"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    addr : in std_logic_vector(ADDR_WIDTH-1 downto 0);
    write_en : in std_logic;
    read_en : in std_logic;
    wdata : in std_logic_vector(DATA_WIDTH-1 downto 0);
    wstrb : in std_logic_vector(DATA_WIDTH/8-1 downto 0);
    rdata : out std_logic_vector(DATA_WIDTH-1 downto 0);
    ready : out std_logic;
    error : out std_logic;
    irq : out std_logic
  );
end entity;

architecture deterministic_wrapper of apb_peripheral_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert ADDR_WIDTH = 8 report "Locked deterministic configuration mismatch: ADDR_WIDTH" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert REG_COUNT = 16 report "Locked deterministic configuration mismatch: REG_COUNT" severity failure;

  u_block : entity work.apb_peripheral
    generic map (
      ADDR_WIDTH => ADDR_WIDTH,
      DATA_WIDTH => DATA_WIDTH,
      REG_COUNT => REG_COUNT
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      addr => addr,
      write_en => write_en,
      read_en => read_en,
      wdata => wdata,
      wstrb => wstrb,
      rdata => rdata,
      ready => ready,
      error => error,
      irq => irq
    );
end architecture;
