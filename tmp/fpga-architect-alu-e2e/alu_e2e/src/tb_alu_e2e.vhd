library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env;

entity tb_alu_e2e is
end entity tb_alu_e2e;

architecture behavioral of tb_alu_e2e is

    -- Component declaration for the DUT
    component alu_e2e
        port (
            A          : in  std_logic_vector(7 downto 0);
            B          : in  std_logic_vector(7 downto 0);
            OpCode     : in  std_logic_vector(2 downto 0);
            CLK        : in  std_logic;
            RST        : in  std_logic;
            Result     : out std_logic_vector(7 downto 0);
            Carry_Out  : out std_logic;
            Zero_Flag  : out std_logic;
            Overflow_Flag : out std_logic
        );
    end component;

    -- Simulation Signals
    signal clk        : std_logic := '0';
    signal reset      : std_logic := '1';
    signal a          : std_logic_vector(7 downto 0) := (others => '0');
    signal b          : std_logic_vector(7 downto 0) := (others => '0');
    signal op_code    : std_logic_vector(2 downto 0);

    -- Expected Results for Verification
    subtype alu_result is std_logic_vector(7 downto 0);
    signal expected_res : alu_result := (others => '0');
    signal expected_c   : std_logic := '0';
    signal expected_z   : std_logic := '0';
    signal expected_v   : std_logic := '0';

begin

    -- Instantiate the DUT
    DUT : alu_e2e port map (
        A          => a,
        B          => b,
        OpCode     => op_code,
        CLK        => clk,
        RST        => reset,
        Result     => open, -- Use dedicated wires if checking in synchronous process
        Carry_Out  => open,
        Zero_Flag  => open,
        Overflow_Flag => open
    );


    -- Clock Generation (10ns period)
    CLK_process : process
    begin
        clk <= '1';
        wait for 5 ns;
        clk <= '0';
        wait for 5 ns;
    end process CLK_process;

    -- Testbench Process
    TEST_PROCESS : process
    begin
        report "--- Starting ALU Core Verification Test ---" severity note;
        
        -- 1. Apply Reset Sequence (Synchronous reset assumed)
        reset <= '1';
        a     <= (others => '0');
        b     <= (others => '0');
        op_code <= (others => '0');
        wait for 20 ns;

        -- Deassert Reset
        report "Releasing Reset." severity note;
        reset <= '0';
        wait for clk / 2 + 10 ns; -- Wait for stable state after reset deassertion


        ----------------------------------------------------------
        -- TEST CASE 1: Addition (OP_ADD = "000") - Basic and Zero Flag Check
        ----------------------------------------------------------
        report "--- Running ADD Tests ---" severity note;

        -- Test 1.1: A=5, B=3. Expected Res=8, C=0, Z=0, V=0.
        a <= "00000101"; b <= "00000011"; op_code <= "000";
        expected_res <= "00001000"; expected_c   <= '0'; expected_z   <= '0'; expected_v   <= '0';
        wait for clk;
        -- Wait until the next clock cycle to sample output (synchronous checking)

        check_alu: begin
            if open.Result /= expected_res or 
               open.Carry_Out /= expected_c or 
               open.Zero_Flag /= expected_z or 
               open.Overflow_Flag /= expected_v then
                report "ERROR [ADD Basic]: Expected (" & two'h&expected_res & ", C=" & std_logic'image(expected_c) & ", Z=" & std_logic'image(expected_z) & ", V=" & std_logic'image(expected_v) & "). Got: " & open.Result & "," & std_logic'image(open.Carry_Out) & "," & std_logic'image(open.Zero_Flag) & "," & std_logic'image(open.Overflow_Flag);
            else
                report "ADD Basic PASS" severity note;
            end if;
        end check_alu;
        wait for clk / 2 + 10 ns;

        -- Test 1.2: Add Zero (A=5, B=0). Expected Res=5, C=0, Z=0, V=0.
        a <= "00000101"; b <= (others => '0'); op_code <= "000";
        expected_res <= "00000101"; expected_c   <= '0'; expected_z   <= '0'; expected_v   <= '0';
        wait for clk;

        check_alu: begin
            if open.Result /= expected_res or 
               open.Carry_Out /= expected_c or 
               open.Zero_Flag /= expected_z or 
               open.Overflow_Flag /= expected_v then
                report "ERROR [ADD Zero]: Failure." severity error;
            else
                report "ADD Zero PASS" severity note;
            end if;
        end check_alu;
        wait for clk / 2 + 10 ns;


        ----------------------------------------------------------
        -- TEST CASE 2: Addition Overflow (OP_ADD) - Check V Flag
        ----------------------------------------------------------
        report "--- Running ADD Overflow Tests ---" severity note;

        -- Test 2.1: Max Positive + Max Negative (e.g., 0x7F + 0x80). Expected Res=0xFF, C=0, Z=0, V=1 (signed overflow check needed)
        a <= "01111111"; -- +127 (Positive sign implied for testing signed arithmetic)
        b <= "10000000"; -- -128 (Negative sign implied)
        op_code <= "000";

        -- Note: Since the ALU processes unsigned, V=1 is determined by comparing signs of inputs/result using numeric_std.
        expected_res <= "11111111"; expected_c   <= '1'; expected_z   <= '0'; expected_v   <= '1'; 
        wait for clk;

        check_alu: begin
            if open.Result /= expected_res or 
               open.Carry_Out /= expected_c or 
               open.Zero_Flag /= expected_z or 
               open.Overflow_Flag /= expected_v then
                report "ERROR [ADD Overflow]: Failure (Should detect overflow)." severity error;
            else
                report "ADD Overflow PASS" severity note;
            end if;
        end check_alu;
        wait for clk / 2 + 10 ns;


        ----------------------------------------------------------
        -- TEST CASE 3: Logic Operations (AND/OR/XOR) and Zero Flag Check
        ----------------------------------------------------------
        report "--- Running Logic Tests ---" severity note;

        -- Test 3.1: AND Operation, resulting in Zero (A=0xAA, B=0x55). Expected Res=0, C=0, Z=1, V=0.
        a <= "10101010"; b <= "01010101"; op_code <= "010"; -- AND
        expected_res <= (others => '0'); expected_c   <= '0'; expected_z   <= '1'; expected_v   <= '0'; 
        wait for clk;

        check_alu: begin
            if open.Result /= expected_res or 
               open.Carry_Out /= expected_c or 
               open.Zero_Flag /= expected_z or 
               open.Overflow_Flag /= expected_v then
                report "ERROR [Logic Zero Check]: Failure." severity error;
            else
                report "Logic AND Zero PASS" severity note;
            end if;
        end check_alu;
        wait for clk / 2 + 10 ns;

        -- Test 3.2: XOR Operation, non-zero result.
        a <= "11111111"; b <= "00000000"; op_code <= "100"; -- XOR
        expected_res <= "11111111"; expected_c   <= '0'; expected_z   <= '0'; expected_v   <= '0'; 
        wait for clk;

        check_alu: begin
            if open.Result /= expected_res or 
               open.Carry_Out /= expected_c or 
               open.Zero_Flag /= expected_z or 
               open.Overflow_Flag /= expected_v then
                report "ERROR [Logic XOR]: Failure." severity error;
            else
                report "Logic XOR PASS" severity note;
            end if;
        end check_alu;
        wait for clk / 2 + 10 ns;


        ----------------------------------------------------------
        -- TEST CASE 4: Shift Operations (SLL/SRL)
        ----------------------------------------------------------
        report "--- Running Shift Tests ---" severity note;

        -- Test 4.1: Shift Left by 1 (A=0x80, B=any). Expected Res=0x00 (if bit falls off), C=0, Z=1, V=0.
        a <= "10000000"; b <= "00000000"; op_code <= "101"; -- SLL
        expected_res <= "00000000"; expected_c   <= '0'; expected_z   <= '1'; expected_v   <= '0'; 
        wait for clk;

        check_alu: begin
            if open.Result /= expected_res or 
               open.Carry_Out /= expected_c or 
               open.Zero_Flag /= expected_z or 
               open.Overflow_Flag /= expected_v then
                report "ERROR [Shift Left]: Failure." severity error;
            else
                report "Shift Left PASS" severity note;
            end if;
        end check_alu;
        wait for clk / 2 + 10 ns;


        ----------------------------------------------------------
        -- CLEANUP AND SUCCESS STOP
        ----------------------------------------------------------
        op_code <= (others => '0'); -- Set to a safe default op code
        a     <= (others => '0');
        b     <= (others => '0');

        wait for 20 ns;

        report "--- All ALU Tests Completed Successfully ---" severity note;
        std.env.stop(0); -- Clean stop signal for passing testbench execution

    end process TEST_PROCESS;

end architecture behavioral;