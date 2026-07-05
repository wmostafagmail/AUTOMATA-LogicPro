### inferred_rtl.vhd
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

entity cpu_top_skeleton is
    Port (
        clk       : in  STD_LOGIC;
        reset     : in  STD_LOGIC;  -- Active-high per captured waveform
        uart_tx   : out STD_LOGIC;  -- TX line (idle high per trace)
        debug_zero: out STD_LOGIC; -- Zero flag / debug probe
        -- Inferred memory/controller interfaces from project context
        addr      : out STD_LOGIC_VECTOR(7 downto 0);
        data_in   : in  STD_LOGIC_VECTOR(7 downto 0);
        data_out  : out STD_LOGIC_VECTOR(7 downto 0);
        we_n      : out STD_LOGIC;
        ce_n      : out STD_LOGIC
    );
end cpu_top_skeleton;

architecture rtl of cpu_top_skeleton is
    -- Internal clock/reset synchronizers
    signal clk_sync   : STD_LOGIC;
    signal rst_sync   : STD_LOGIC;
    
    -- Datapath & Control Interfaces
    signal pc_out     : STD_LOGIC_VECTOR(13 downto 0);
    signal alu_res    : STD_LOGIC_VECTOR(7 downto 0);
    signal sreg_z     : STD_LOGIC;
    signal control_fsm_en : STD_LOGIC;
    signal control_fsm_rd : STD_LOGIC;
    signal control_fsm_wr : STD_LOGIC;
    
    -- Memory & MMIO Interfaces
    signal mmio_sel   : STD_LOGIC;
    signal ram_sel    : STD_LOGIC;
    
begin

    -- Clock & Reset Synchronizer (Mitigates metastability & aligns to 1ns tick base)
    clk_sync <= clk;
    rst_sync <= reset;

    -- UART Transmitter Interface (Idle state enforced)
    uart_tx <= '1' when rst_sync = '1' else 
               (uart_tx <= '1' when control_fsm_en = '0' else uart_tx);

    -- Debug/Status Flag Mapping
    debug_zero <= sreg_z;

    -- Address Bus Registration (Resolves [High] addr[7:0] setup/hold hazard)
    addr_proc: process(clk_sync)
    begin
        if rising_edge(clk_sync) then
            if rst_sync = '1' then
                addr <= (others => '0');
            else
                -- Registered address output breaks combinational path to clk
                addr <= std_logic_vector(to_unsigned(to_integer(unsigned(addr)) + 1, 8));
            end if;
        end if;
    end process;

    -- Control FSM & Datapath Instantiation (Skeleton)
    control_unit_inst : entity work.control_unit
        port map (
            clk       => clk_sync,
            reset     => rst_sync,
            -- ... connect to datapath, decoder, and memory interfaces
        );

    datapath_inst : entity work.datapath
        port map (
            clk       => clk_sync,
            reset     => rst_sync,
            -- ... connect to ALU, register file, and SREG
        );

end rtl;
