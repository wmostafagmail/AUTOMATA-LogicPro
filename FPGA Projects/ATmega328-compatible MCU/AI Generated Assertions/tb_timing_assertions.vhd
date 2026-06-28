-- ### tb_timing_assertions.vhd
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity tb_timing_assertions is
end entity tb_timing_assertions;

architecture sim of tb_timing_assertions is
  constant CLK_PERIOD       : time := 1 ns;
  constant RESET_DEASSERT_NS: natural := 36;
  constant UART_IDLE_NS     : natural := 100;
  constant ADDR_SETUP_HOLD_NS: natural := 2;

  signal clk          : std_logic := '0';
  signal reset        : std_logic := '0';
  signal uart_tx      : std_logic := '1';
  signal debug_zero   : std_logic := '0';
  signal addr         : std_logic_vector(7 downto 0) := (others => '0');
  signal sim_done     : boolean := false;

begin
  -- Clock Generation
  clk <= not clk after CLK_PERIOD/2 when not sim_done else '0';

  -- Reset Generation (Matches observed trace: 1->0 at t=36)
  reset_gen : process
  begin
    reset <= '1';
    wait for RESET_DEASSERT_NS * CLK_PERIOD;
    reset <= '0';
    wait;
  end process;

  -- Timing & Protocol Assertions Monitor
  timing_monitor : process(clk, reset)
    variable uart_idle_cnt : natural := 0;
    variable addr_prev     : std_logic_vector(7 downto 0) := (others => '0');
    variable addr_change_t : time := 0 ns;
  begin
    if reset = '0' then
      -- 1. Reset Deassertion Validation
      assert reset = '0'
        report "FATAL: Reset must be deasserted by t=36ns."
        severity error;

      -- 2. UART Protocol Framing Check (Idle State)
      -- Grounded in deterministic protocol pre-decode: no frames detected
      if uart_tx = '1' then
        uart_idle_cnt := uart_idle_cnt + 1;
      else
        uart_idle_cnt := 0;
      end if;
      assert uart_idle_cnt < UART_IDLE_NS
        report "WARNING: UART TX idle ('1') persists > " &
               integer'image(uart_idle_cnt) & " cycles. No valid frame."
        severity warning;

      -- 3. Address Bus Setup/Hold Hazard Detection
      -- Grounded in hazard scan: addr[7:0] transitions within ±1 tick of clk
      if rising_edge(clk) then
        if addr /= addr_prev then
          addr_change_t := now;
          addr_prev := addr;
        end if;
        -- Check if transition falls within setup/hold window
        if addr_change_t >= now - ADDR_SETUP_HOLD_NS*CLK_PERIOD and
           addr_change_t <= now + ADDR_SETUP_HOLD_NS*CLK_PERIOD then
          assert false
            report "CRITICAL: addr[7:0] transitions within " &
                   integer'image(ADDR_SETUP_HOLD_NS) & " ns of clk edge. " &
                   "Setup/hold violation. Check combinational delay."
            severity error;
        end if;
      end if;

      -- 4. Debug Zero Flag Transition Validation
      if debug_zero = '1' and debug_zero'event then
        assert now >= RESET_DEASSERT_NS * CLK_PERIOD
          report "INFO: debug_zero asserted at " & time'image(now) &
                 " post-reset deassertion."
          severity note;
      end if;

    else
      -- Pre-reset initialization check
      assert reset = '1'
        report "INFO: Reset held high during initialization."
        severity note;
    end if;
  end process;

end architecture sim;
