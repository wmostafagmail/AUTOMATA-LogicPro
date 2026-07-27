-- Deterministic generated wrapper. Do not edit manually.
-- Source block: uart_transmitter_bridge
-- Configuration ID: UART_TRANSMITTER_BRIDGE_B0B618432E1C97F6
-- Source: rtl/blocks/uart_spi_i2c/uart_transmitter_bridge.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity uart_transmitter_bridge_det_cfg is
  generic (
    CLOCK_HZ : positive := 50000000;
    BAUD_RATE : positive := 115200;
    DATA_BITS : positive := 8;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "UART_TRANSMITTER_BRIDGE_B0B618432E1C97F6"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    tx_data : in std_logic_vector(DATA_BITS-1 downto 0);
    tx_valid : in std_logic;
    tx_ready : out std_logic;
    uart_tx : out std_logic;
    busy : out std_logic
  );
end entity;

architecture deterministic_wrapper of uart_transmitter_bridge_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert CLOCK_HZ = 50000000 report "Locked deterministic configuration mismatch: CLOCK_HZ" severity failure;
  assert BAUD_RATE = 115200 report "Locked deterministic configuration mismatch: BAUD_RATE" severity failure;
  assert DATA_BITS = 8 report "Locked deterministic configuration mismatch: DATA_BITS" severity failure;

  u_block : entity work.uart_transmitter_bridge
    generic map (
      CLOCK_HZ => CLOCK_HZ,
      BAUD_RATE => BAUD_RATE,
      DATA_BITS => DATA_BITS
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      tx_data => tx_data,
      tx_valid => tx_valid,
      tx_ready => tx_ready,
      uart_tx => uart_tx,
      busy => busy
    );
end architecture;
