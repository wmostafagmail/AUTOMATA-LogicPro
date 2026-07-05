library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

-- Standard library use must be qualified or fully specified per GHDL rules.
library std;
use std.env.all;

-- Use constants package for OpCodes
library work; 
use work.alu_constants.all;


entity testbench_alu is
end entity testbench_alu;

architecture rtl of testbench_alu is
    -- Component Declaration for the DUT
    component ALU_E2E
        port (
            A : in  std_logic_vector(7 downto 0);
            B : in  std_logic_vector(7 downto 0);
            OpCode : in std_logic_vector(2 downto 0);
            Clk : in  std_logic;
            RST_N : in  std_logic;

            Result       : out std_logic_vector(7 downto 0);
            Carry_Out    : out std_logic;
            Zero_Flag    : out std_logic;
            Overflow_Flag : out std_logic
        );
    end component;

    -- Testbench signals
    signal clk : std_logic := '0';
    signal rst_n : std_logic := '1'; -- Active low reset, initialized to high (de-asserted)
    signal a_in : std_logic_vector(7 downto 0);
    signal b_in : std_logic_vector(7 downto 0);
    signal opcode_in : std_logic_vector(2 downto 0);

    -- Outputs from DUT
    signal result_out       : std_logic_vector(7 downto 0);
    signal carry_out_sig    : std_logic;
    signal zero_flag_sig    : std_logic;
    signal overflow_flag_sig : std_logic;

    -- Testbench State/Variables
    constant C_PERIOD : time := 10 ns;
    constant CLK_DIV : integer := 2; -- For slower simulation, adjust if necessary
    type expected_result_t is record
        expected_u     : unsigned(7 downto 0);
        expected_carry : std_logic;
        expected_zero  : std_logic;
        expected_overflow : std_logic;
    end record;

    -- Test case struct array for structured testing
    subtype test_case_t is array (1 to 5) of record is
        a, b         : std_logic_vector(7 downto 0);
        opcode       : std_logic_vector(2 downto 0);
        description  : string;
        expected     : expected_result_t
    end record;

    -- Test vectors defined below (A, B are represented as unsigned for calculation clarity)
    type test_vector is array (1 to 5) of test_case_t;
    signal current_test : test_vector := (
        (a => "00000001", b => "00000001", opcode => OP_ADD, description => "Add: 1+1=2, C=0, Z=0, V=0", expected => {expected_u => to_unsigned(2, 8), expected_carry => '0', expected_zero => '0', expected_overflow => '0'}),
        (a => "11111111", b => "00000001", opcode => OP_ADD, description => "Add: MAX+1=0, C=1, Z=1, V=0 (Wrap)", expected => {expected_u => to_unsigned(0, 8), expected_carry => '1', expected_zero => '1', expected_overflow => '0'}),
        (a => "10000000", b => "10000000", opcode => OP_ADD, description => "Add: Negative + Negative (No Overflow)", expected => {expected_u => to_unsigned(200, 8), expected_carry => '0', expected_zero => '0', expected_overflow => '0'}),
        (a => "10000000", b => "01000000", opcode => OP_ADD, description => "Add: Negative + Positive (Overflow!)", expected => {expected_u => to_unsigned(264, 8), expected_carry => '0', expected_zero => '0', expected_overflow => '1'}),
        (a => "11111111", b => "11111111", opcode => OP_AND, description => "AND: MAX & MAX = MAX, C=0, Z=0, V=0", expected => {expected_u => to_unsigned(255, 8), expected_carry => '0', expected_zero => '0', expected_overflow => '0'})
    );

begin
    -- Instantiate the DUT
    UUT : component ALU_E2E
        port map (
            A => a_in,
            B => b_in,
            OpCode => opcode_in,
            Clk => clk,
            RST_N => rst_n,

            Result       => result_out,
            Carry_Out    => carry_out_sig,
            Zero_Flag    => zero_flag_sig,
            Overflow_Flag => overflow_flag_sig
        );
end architecture rtl;


-- Clock Generation Process
clk_process : process begin
    clk <= '0';
    wait for C_PERIOD / 2;
    clk <= '1';
    wait for C_PERIOD / 2;
end process clk_process;

-- Test Sequence/Stimulus Process
test_stim_process: process variable test_pass : boolean := true; begin
    report "Starting ALU E2E Testbench Simulation." severity note;
    
    -- Initial Reset Assertion (Active Low)
    rst_n <= '0';
    a_in <= (others => '0');
    b_in <= (others => '0');
    opcode_in <= OP_NOP;
    wait for C_PERIOD * 2;

    -- Release Reset
    report "Releasing reset." severity note;
    rst_n <= '1';
    wait until rising_edge(clk);
    wait for C_PERIOD * 2;


    -- Start Test Cases (Iterating through the defined test vectors)
    for i in 0 to test_vector'length - 1 loop

        report "--- Running Test Case [" & integer'image(i+1) & "/" & integer'image(test_vector'length) & "] ---" severity note;
        
        -- Apply Stimulus
        a_in <= unsigned(test_vector(i).a);
        b_in <= unsigned(test_vector(i).b);
        opcode_in <= test_vector(i).opcode;

        wait until rising_edge(clk);
        wait for C_PERIOD * 2; -- Wait twice the period to ensure stabilization of all combinational outputs (Result, Flags)

        -- Check Results (Post-Edge Observation)
        if check_test_case(test_vector(i)) then
            report "Test Case [" & integer'image(i+1) & "] PASSED." severity note;
        else
            report "!!! TEST FAILURE !!! Test Case [" & integer'image(i+1) & "] failed. Expected: U=" & stdlib.numeric_std.to_string(test_vector(i).expected.expected_u) 
                    & ", C=" & test_vector(i).expected.expected_carry 
                    & ", Z=" & test_vector(i).expected.expected_zero
                    & ", V=" & test_vector(i).expected.expected_overflow 
                    & ". Received: U=" & stdlib.numeric_std.to_string(unsigned(result_out))
                    & ", C=" & carry_out_sig
                    & ", Z=" & zero_flag_sig
                    & ", V=" & overflow_flag_sig;
            test_pass := false;
        end if;

    end loop;

    -- Finalization and Clean Stop
    if test_pass then
        report "All ALU E2E tests passed successfully." severity note;
        std.env.stop(0); -- Success stop signal (Non-zero exit code convention)
    else
        report "ALU E2E simulation finished with failures." severity failure;
        std.env.finish; -- Use finish for explicit non-success termination if needed, or just stop/quit.
    end if;

    wait; -- Wait indefinitely to keep the simulation running until std.env.stop executes
end process test_stim_process;


-- Helper function to compare results
function check_test_case (t : test_case_t) return boolean is
begin
    -- 1. Check Result
    if unsigned(result_out) /= t.expected.expected_u then
        return false;
    end if;

    -- 2. Check Carry Out
    if carry_out_sig /= t.expected.expected_carry then
        return false;
    end if;

    -- 3. Check Zero Flag
    if zero_flag_sig /= t.expected.expected_zero then
        return false;
    end if;

    -- 4. Check Overflow Flag
    if overflow_flag_sig /= t.expected.expected_overflow then
        return false;
    end if;
    
    return true;
end function check_test_case;