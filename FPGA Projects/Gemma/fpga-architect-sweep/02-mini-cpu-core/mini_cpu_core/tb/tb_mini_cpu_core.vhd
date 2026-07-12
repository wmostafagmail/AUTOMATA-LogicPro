library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;
use work.cpu_pkg.all;

entity tb_mini_cpu_core is
end entity tb_mini_cpu_core;

architecture sim of tb_mini_cpu_core is
    constant CLK_PERIOD : time := 10 ns;
    constant MEM_SIZE   : integer := 256;

    signal clk        : std_logic := '0';
    signal reset      : std_logic := '0';
    signal instr_addr : std_logic_vector(7 downto 0);
    signal instr_data : std_logic_vector(15 downto 0) := (others => '0');
    signal data_addr  : std_logic_vector(7 downto 0);
    signal data_din   : std_logic_vector(7 downto 0) := (others => '0');
    signal data_dout  : std_logic_vector(7 downto 0);
    signal data_we    : std_logic;

    -- Memory Models
    type mem_t is array (0 to MEM_SIZE-1) of std_logic_vector(15 downto 0);
    signal rom : mem_t := (others => (others => '0'));

    type dmem_t is array (0 to MEM_SIZE-1) of std_logic_vector(7 downto 0);
    signal ram : dmem_t := (others => (others => '0'));

    -- Helper Procedure: Check equality. 
    procedure check_eq(const_val : in std_logic_vector; 
                      actual_val : in std_logic_vector; 
                      msg        : in string; 
                      fail_flag  : out boolean) is
        variable v_exp : integer;
        variable v_act : integer;
    begin
        if const_val /= actual_val then
            -- Perform conversions into local variables to avoid raw nesting and satisfy bound-check rules
            v_exp := to_integer(unsigned(const_val));
            v_act := to_integer(unsigned(actual_val));

            -- Explicit range validation for reporting safety (bounds check)
            if (v_exp < 0 or v_exp > 65535) then 
                v_exp := -1; 
            end if;
            if (v_act < 0 or v_act > 65535) then 
                v_act := -1; 
            end if;

            report "FAIL: " & msg & " Expected " & integer'image(v_exp) & 
                   " got " & integer'image(v_act);
            fail_flag := true;
        end if;
    end procedure;

begin
    -- DUT instantiation
    uut: entity work.mini_cpu_core
        port map (
            clk        => clk,
            reset      => reset,
            instr_addr => instr_addr,
            instr_data => instr_data,
            data_addr  => data_addr,
            data_din   => data_din,
            data_dout  => data_dout,
            data_we    => data_we
        );

    -- Clock Generator
    clk_process : process
    begin
        while now < 1000 ns loop
            clk <= '0'; wait for CLK_PERIOD/2;
            clk <= '1'; wait for CLK_PERIOD/2;
        end loop;
        wait;
    end process;

    -- Simple Memory Logic with explicit bound guards
    instr_mem_logic : process(instr_addr)
        variable v_idx : integer;
    begin
        v_idx := to_integer(unsigned(instr_addr));
        if (v_idx >= 0 and v_idx < MEM_SIZE) then
            instr_data <= rom(v_idx);
        else
            instr_data <= (others => '0');
        end if;
    end process;

    data_mem_logic : process(clk, data_addr, data_we)
        variable v_idx : integer;
    begin
        v_idx := to_integer(unsigned(data_addr));
        if rising_edge(clk) then
            if data_we = '1' then
                if (v_idx >= 0 and v_idx < MEM_SIZE) then
                    ram(v_idx) <= data_dout;
                end if;
            end if;
        end if;
        
        if (v_idx >= 0 and v_idx < MEM_SIZE) then
            data_din <= ram(v_idx);
        else
            data_din <= (others => '0');
        end if;
    end process;

    -- Test Stimulus
    stim_process : process
        variable test_failed_local : boolean := false;
    begin
        -- Initialize Program Memory using signal assignments
        rom(0) <= "0001" & "0001" & "00010000"; -- LOAD R1 from Addr 0x10
        rom(1) <= "0001" & "0010" & "00010001"; -- LOAD R2 from Addr 0x11
        rom(2) <= "0011" & "0001" & "00100000"; -- ADD R1, R2 (Rs=2)
        rom(3) <= "0010" & "0001" & "00100000"; -- STORE R1 to Addr 0x20
        rom(4) <= "0000" & "0000" & "00000000"; -- NOP

        -- Setup Initial Data Memory using signal assignments
        ram(16) <= x"0A"; -- Value 10 at addr 0x10
        ram(17) <= x"14"; -- Value 20 at addr 0x11

        reset <= '1';
        wait for 20 ns;
        reset <= '0';
        wait for CLK_PERIOD * 6;

        -- Verification: Result of 10 + 20 should be 30 (x"1E") at RAM address 0x20
        check_eq(x"1E", ram(32), "Result in RAM address 0x20", test_failed_local);

        if not test_failed_local then
            report "Test Passed - CPU executed program correctly";
            std.env.stop(0);
        else
            report "Test Failed";
            std.env.stop(1);
        end if;
    end process;

end architecture sim;
