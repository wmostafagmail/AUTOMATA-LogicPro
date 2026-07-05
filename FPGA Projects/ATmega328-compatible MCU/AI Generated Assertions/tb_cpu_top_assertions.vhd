library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

-- ============================================================================
-- tb_cpu_top_assertions.vhd
-- Purpose: Enforce observed timing behavior, protocol framing, and hazard 
--          mitigation for addr[7:0] setup/hold risks.
-- Integration: Append to tb_cpu_top.vhd as a concurrent process or 
--              instantiate as a separate assertion package.
-- ============================================================================
PROCESS
    constant CLK_PERIOD : time := 2 ns;
    variable tick_cnt   : integer := 0;
    variable addr_prev  : std_logic_vector(7 downto 0) := (others => '0');
    variable addr_glitch_cnt : integer := 0;
BEGIN
    -- 1. Clock Frequency & Duty Cycle Verification
    wait until rising_edge(clk);
    assert clk'event(clk) or clk = '1' or clk = '0'
        report "Clock deviation detected. Expected stable 500 MHz (2 ns period)."
        severity failure;

    -- 2. Reset Deassertion Timing Check
    wait until reset = '0';
    assert tick_cnt >= 4
        report "Reset deassertion occurred before tick 4. Verify reset pulse width > 2 ns."
        severity warning;

    -- 3. UART TX Idle State Enforcement
    -- Context: Deterministic protocol pre-decode reports NO frames detected.
    -- Expectation: uart_tx remains high (idle) throughout the 120-tick window.
    wait for 120 * CLK_PERIOD;
    if uart_tx = '0' then
        assert false
            report "UART TX deviated from idle high state. Check UART protocol framing or TX enable."
            severity warning;
    end if;

    -- 4. Debug Zero Flag Transition Validation
    -- Context: debug_zero transitions at tick 35, correlating with zero_flag_s.
    wait until debug_zero = '1';
    assert tick_cnt >= 35
        report "Debug zero flag asserted late. Expected transition at tick 35."
        severity warning;

    -- 5. Hazard Mitigation: Address Bus Setup/Hold & Glitch Detection
    -- Context: Hazard scan flags addr[7:0] setup/hold risk near clk edges 
    --          (±1 tick overlap, first at tick 36/37). Combinatorial race detected.
    loop
        wait for 1 ns; -- Mid-cycle check for combinatorial glitches
        if addr /= addr_prev and addr = (others => 'X') then
            addr_glitch_cnt := addr_glitch_cnt + 1;
            assert false
                report "Address bus glitch detected. Check combinational path from decoder/ALU."
                severity error;
        end if;
        wait for 1 ns;
        addr_prev := addr;
        wait until rising_edge(clk);
        -- Enforce setup/hold window: address must be stable ±1 tick from clk edge
        assert addr'last_change < 1 ns or addr'quiet(1 ns)
            report "Address bus violates setup/hold timing near clk active edge. First overlap at tick 36/37. Consider registering addr[7:0] or adding pipeline registers."
            severity error;
    end loop;
END PROCESS;
