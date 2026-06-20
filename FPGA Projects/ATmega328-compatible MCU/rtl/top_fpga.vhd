library ieee;
use ieee.std_logic_1164.all;

use work.cpu_pkg.all;

entity top_fpga is
  generic (
    CLOCK_FREQ_HZ : positive := 50000000;
    BAUD_RATE     : positive := 115200
  );
  port (
    clk     : in  std_logic;
    reset   : in  std_logic;
    led     : out byte_t;
    uart_tx : out std_logic
  );
end entity;

architecture rtl of top_fpga is
  signal halted_s     : std_logic;
  signal debug_pc_s   : byte_t;
  signal debug_ir_s   : word_t;
  signal debug_state_s: cpu_state_t;
  signal debug_zero_s : std_logic;
begin
  cpu_inst: entity work.cpu_top
    generic map (
      CLOCK_FREQ_HZ => CLOCK_FREQ_HZ,
      BAUD_RATE     => BAUD_RATE
    )
    port map (
      clk         => clk,
      reset       => reset,
      led_out     => led,
      uart_tx     => uart_tx,
      halted      => halted_s,
      debug_pc    => debug_pc_s,
      debug_ir    => debug_ir_s,
      debug_state => debug_state_s,
      debug_zero  => debug_zero_s
    );
end architecture;
