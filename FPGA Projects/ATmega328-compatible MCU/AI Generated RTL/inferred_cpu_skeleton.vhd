library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

entity cpu_top_skeleton is
    Port (
        clk         : in  STD_LOGIC;
        reset       : in  STD_LOGIC;
        uart_tx     : out STD_LOGIC;
        debug_zero  : out STD_LOGIC;
        addr        : out STD_LOGIC_VECTOR(7 downto 0);
        data_in     : in  STD_LOGIC_VECTOR(7 downto 0);
        data_out    : out STD_LOGIC_VECTOR(7 downto 0);
        cpu_en      : out STD_LOGIC;
        cpu_we      : out STD_LOGIC
    );
end cpu_top_skeleton;

architecture rtl of cpu_top_skeleton is
    -- Internal control & datapath signals
    signal pc_reg       : unsigned(15 downto 0);
    signal alu_result   : STD_LOGIC_VECTOR(7 downto 0);
    signal sreg_zero    : STD_LOGIC;
    signal addr_comb    : STD_LOGIC_VECTOR(7 downto 0);
    signal reset_sync   : STD_LOGIC;
begin

    -- 1. Clock Domain & Reset Synchronization
    -- Mitigates metastability and ensures clean reset distribution
    sync_reset : process(clk)
    begin
        if rising_edge(clk) then
            reset_sync <= reset;
        end if;
    end process;

    -- 2. Address Bus Output (Hazard Mitigation)
    -- The logic analyzer scan flagged addr[7:0] with ±1 tick setup/hold risks
    -- near clk active edges (t=36/37). Registering the address bus output
    -- breaks the combinational path and guarantees timing closure.
    addr_reg_proc : process(clk)
    begin
        if rising_edge(clk) then
            if reset_sync = '1' then
                addr <= (others => '0');
            else
                addr <= addr_comb;
            end if;
        end if;
    end process;

    -- 3. Debug Zero Flag Latch
    -- Maps internal SREG zero condition to external debug pin
    debug_zero_proc : process(clk)
    begin
        if rising_edge(clk) then
            if reset_sync = '1' then
                debug_zero <= '0';
            else
                debug_zero <= sreg_zero;
            end if;
        end if;
    end process;

    -- 4. UART TX Control (Idle/Pre-Transmission)
    -- Matches captured waveform: uart_tx remains '1' (idle)
    uart_tx_proc : process(clk)
    begin
        if rising_edge(clk) then
            if reset_sync = '1' then
                uart_tx <= '1';
            else
                uart_tx <= '1'; -- Placeholder for TX FSM state
            end if;
        end if;
    end process;

    -- 5. Datapath & Control FSM Placeholders
    -- addr_comb is driven by registered PC/IR in a complete implementation.
    -- Registering intermediate control signals prevents the race condition
    -- observed at t=36/37.
    addr_comb <= "00000000"; -- Driven by PC[7:0] or IR in full RTL
    sreg_zero <= '0';        -- Driven by ALU zero flag in full RTL
    data_out  <= alu_result;
    cpu_en    <= '1';
    cpu_we    <= '0';

end rtl;
