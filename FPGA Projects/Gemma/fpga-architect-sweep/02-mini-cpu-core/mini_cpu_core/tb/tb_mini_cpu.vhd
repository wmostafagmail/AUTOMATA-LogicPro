library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

use work.cpu_pkg.all;

entity tb_mini_cpu is
end entity tb_mini_cpu;

architecture sim of tb_mini_cpu is
    signal clk : std_logic := '0';
    signal reset : std_logic := '0';
    signal instr_mem_data : std_logic_vector(INST_WIDTH-1 downto 0) := (others => '0');
    signal instr_mem_addr : std_logic_vector(ADDR_WIDTH-1 downto 0);
    signal halt_o : std_logic;

    -- Program Memory: small array of instructions
    type mem_array is array (0 to 15) of std_logic_vector(INST_WIDTH-1 downto 0);
    signal program_mem : mem_array := (
        -- Instr 0: ADD R1, R0, 10  => Op=3, Rd=1, Rs=0, Imm=10 (x"340A")
        0 => x"340A", 
        -- Instr 1: JUMP to 3       => Op=7, Imm=3 (x"7003")
        1 => x"7003",
        -- Instr 2: (Skipped)
        2 => x"0000",
        -- Instr 3: HALT            => Op=0 (x"0000")
        3 => x"0000",
        others => x"0000"
    );

    constant CLK_PERIOD : time := 10 ns;

begin
    -- DUT Instance
    DUT: entity work.cpu_core
        port map (
            clk => clk, reset => reset,
            instr_mem_addr => instr_mem_addr,
            instr_mem_data => instr_mem_data,
            data_mem_addr  => open,
            data_mem_data  => open,
            data_mem_we    => open,
            halt_o         => halt_o
        );

    -- Memory simulation logic with bounds guarding
    process(instr_mem_addr)
        variable addr_int : integer;
    begin
        addr_int := to_integer(unsigned(instr_mem_addr));
        -- FIXED: Changed assignment operator ':=' to relational operator '<=' for range check
        if addr_int >= 0 and addr_int <= 15 then
            instr_mem_data <= program_mem(addr_int);
        else
            instr_mem_data <= (others => '0');
        end if;
    end process;

    -- Clock Generation
    clk <= not clk after CLK_PERIOD/2;

    -- Test Process
    process
    begin
        reset <= '1';
        wait for 25 ns;
        reset <= '0';

        -- Wait for the CPU to hit HALT state
        wait until halt_o = '1';
        
        report "CPU reached HALT state successfully" severity note;
        std.env.stop(0);
    end process;

end architecture sim;
