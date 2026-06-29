-- ### inferred_cpu_top.vhd
-- Generated from Macro: draft_rtl_skeleton
-- Context: ATmega328-compatible MCU, tb_cpu_top simulation
-- Hazard Note: addr[7:0] exhibits setup/hold risks near clk edges.

library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

entity cpu_top is
    Port (
        clk         : in  std_logic;
        reset       : in  std_logic;
        addr        : out std_logic_vector(7 downto 0);
        debug_zero  : out std_logic;
        uart_tx     : out std_logic
    );
end cpu_top;

architecture rtl of cpu_top is
    -- Internal Signals
    signal pc_reg       : std_logic_vector(7 downto 0);
    signal zero_flag_s  : std_logic;
    signal addr_comb    : std_logic_vector(7 downto 0);
    
    -- UART State
    signal uart_idle    : std_logic := '1';
    
begin

    -- Address Bus Output
    -- WARNING: Hazard scan detected setup/hold risks on addr.
    -- addr_comb likely drives addr directly, causing races.
    -- Recommendation: Register addr output to mitigate timing violations.
    addr <= addr_comb;

    -- UART TX Output
    -- Waveform shows constant '1' (idle). No frames decoded.
    uart_tx <= uart_idle;

    -- Debug Zero Flag
    -- debug_zero transitions to '1' at tick 35.
    -- Transition coincides with clk rising edge, suggesting combinational logic or race.
    debug_zero <= zero_flag_s;

    -- Clocking and Reset Process
    process(clk, reset)
    begin
        if reset = '1' then
            -- Active-high reset
            pc_reg      <= (others => '0');
            zero_flag_s <= '0';
            uart_idle   <= '1';
        elsif rising_edge(clk) then
            -- Core Logic Placeholder
            -- ATmega328 behavior simulation
            -- addr transitions and debug_zero timing need inspection.
            
            -- Example: PC increment or fetch logic
            -- pc_reg <= std_logic_vector(unsigned(pc_reg) + 1);
            
            -- Example: Zero flag update
            -- zero_flag_s <= '1' when some_condition else '0';
            
            -- UART logic
            -- uart_idle <= '1';
        end if;
    end process;

    -- Combinational Address Logic (Source of Hazard)
    -- addr_comb is likely driven here.
    -- Risk: addr transitions within ±1 tick of clk.
    -- Fix: Move addr logic into clocked process or add output register.
    addr_comb <= pc_reg;

end rtl;
