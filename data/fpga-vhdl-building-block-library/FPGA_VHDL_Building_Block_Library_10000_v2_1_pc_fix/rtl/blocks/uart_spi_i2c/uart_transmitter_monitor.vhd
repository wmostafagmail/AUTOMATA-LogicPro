-- Auto-generated from FPGA Building Block Catalog BB-0390
-- Block: uart_transmitter_monitor
-- Category: UART SPI I2C / Low-speed serial protocols
-- Implementation tier: A
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: UART framing implemented; system-level electrical/tolerance validation required
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity uart_transmitter_monitor is generic(CLOCK_HZ:positive:=50_000_000;BAUD_RATE:positive:=115_200;DATA_BITS:positive:=8);
 port(clk,rst_n:in std_logic;tx_data:in std_logic_vector(DATA_BITS-1 downto 0);tx_valid:in std_logic;tx_ready,uart_tx,busy:out std_logic);end entity;
architecture rtl of uart_transmitter_monitor is begin u_core:entity work.bb_uart_tx_core generic map(CLOCK_HZ=>CLOCK_HZ,BAUD_RATE=>BAUD_RATE,DATA_BITS=>DATA_BITS) port map(clk=>clk,rst_n=>rst_n,tx_data=>tx_data,tx_valid=>tx_valid,tx_ready=>tx_ready,uart_tx=>uart_tx,busy=>busy);end architecture;
