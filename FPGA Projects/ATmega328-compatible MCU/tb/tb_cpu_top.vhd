library ieee;
use ieee.std_logic_1164.all;

use work.cpu_pkg.all;

entity tb_cpu_top is
end entity;

architecture sim of tb_cpu_top is
  signal clk         : std_logic := '0';
  signal reset       : std_logic := '1';
  signal led_out     : byte_t;
  signal uart_tx     : std_logic;
  signal halted      : std_logic;
  signal debug_pc    : byte_t;
  signal debug_ir    : word_t;
  signal debug_state : cpu_state_t;
  signal debug_zero  : std_logic;
begin
  clk <= not clk after 5 ns;

  dut: entity work.cpu_top
    generic map (
      CLOCK_FREQ_HZ => 100,
      BAUD_RATE     => 10
    )
    port map (
      clk         => clk,
      reset       => reset,
      led_out     => led_out,
      uart_tx     => uart_tx,
      halted      => halted,
      debug_pc    => debug_pc,
      debug_ir    => debug_ir,
      debug_state => debug_state,
      debug_zero  => debug_zero
    );

  process
  begin
    wait for 20 ns;
    reset <= '0';

    wait for 2000 ns;
    assert halted = '1' report "CPU did not halt" severity failure;
    assert led_out = x"A5" report "Arithmetic self-check did not reach PASS pattern" severity failure;
    assert debug_state = CPU_S_HALT report "CPU did not remain in HALT state" severity failure;

    wait;
  end process;
end architecture;
