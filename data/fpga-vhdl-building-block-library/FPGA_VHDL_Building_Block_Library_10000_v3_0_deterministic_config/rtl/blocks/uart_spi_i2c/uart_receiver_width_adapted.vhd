-- Auto-generated from FPGA Building Block Catalog BB-0810
-- Block: uart_receiver_width_adapted
-- Category: UART SPI I2C / Low-speed serial protocols
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: UART framing implemented; system-level electrical/tolerance validation required
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity uart_receiver_width_adapted is generic(CLOCK_HZ:positive:=50_000_000;BAUD_RATE:positive:=115_200;DATA_BITS:positive:=8);
 port(clk,rst_n,uart_rx:in std_logic;rx_data:out std_logic_vector(DATA_BITS-1 downto 0);rx_valid,framing_error:out std_logic);end entity;
architecture rtl of uart_receiver_width_adapted is begin u_core:entity work.bb_uart_rx_core generic map(CLOCK_HZ=>CLOCK_HZ,BAUD_RATE=>BAUD_RATE,DATA_BITS=>DATA_BITS) port map(clk=>clk,rst_n=>rst_n,uart_rx=>uart_rx,rx_data=>rx_data,rx_valid=>rx_valid,framing_error=>framing_error);end architecture;
