-- Deterministic generated wrapper. Do not edit manually.
-- Source block: uart_receiver_monitor
-- Configuration ID: UART_RECEIVER_MONITOR_CBE13EB0B2DF2BEB
-- Source: rtl/blocks/uart_spi_i2c/uart_receiver_monitor.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity uart_receiver_monitor_det_cfg is
  generic (
    CLOCK_HZ : positive := 50000000;
    BAUD_RATE : positive := 115200;
    DATA_BITS : positive := 8;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "UART_RECEIVER_MONITOR_CBE13EB0B2DF2BEB"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    uart_rx : in std_logic;
    rx_data : out std_logic_vector(DATA_BITS-1 downto 0);
    rx_valid : out std_logic;
    framing_error : out std_logic
  );
end entity;

architecture deterministic_wrapper of uart_receiver_monitor_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert CLOCK_HZ = 50000000 report "Locked deterministic configuration mismatch: CLOCK_HZ" severity failure;
  assert BAUD_RATE = 115200 report "Locked deterministic configuration mismatch: BAUD_RATE" severity failure;
  assert DATA_BITS = 8 report "Locked deterministic configuration mismatch: DATA_BITS" severity failure;

  u_block : entity work.uart_receiver_monitor
    generic map (
      CLOCK_HZ => CLOCK_HZ,
      BAUD_RATE => BAUD_RATE,
      DATA_BITS => DATA_BITS
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      uart_rx => uart_rx,
      rx_data => rx_data,
      rx_valid => rx_valid,
      framing_error => framing_error
    );
end architecture;
