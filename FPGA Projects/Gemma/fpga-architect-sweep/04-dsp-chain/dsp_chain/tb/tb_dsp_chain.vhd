library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;
use work.dsp_pkg.all;

entity tb_dsp_chain is
end entity tb_dsp_chain;

architecture sim of tb_dsp_chain is
    constant CLK_PERIOD : time := 10 ns;

    signal clk      : std_logic := '0';
    signal reset    : std_logic := '0';
    signal valid_i  : std_logic := '0';
    signal sample_i : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
    signal valid_o  : std_logic := '0';
    signal energy_o : std_logic_vector(63 downto 0) := (others => '0');

    -- Verification bookkeeping
    signal test_failed : boolean := false;

    -- Helper function for checking results.
    -- Returns true if the check fails, false otherwise.
    function check_result(
        expected_val : unsigned(63 downto 0);
        actual_vec   : std_logic_vector;
        msg          : string
    ) return boolean is
        variable v_exp_int : integer;
        variable v_act_int : integer;
    begin
        if unsigned(actual_vec) /= expected_val then
            -- Use 16-bit slices for integer conversion to prevent overflow of VHDL integer type.
            v_exp_int := to_integer(unsigned(expected_val(15 downto 0)));
            v_act_int := to_integer(unsigned(actual_vec(15 downto 0)));
            
            report "FAIL: " & msg & " | Exp (Low): " & integer'image(v_exp_int) & 
                   " Act (Low): " & integer'image(v_act_int);
            
            return true; -- Indicate failure
        end if;
        return false; -- Indicate success
    end function;

begin
    -- Clock generator
    clk <= not clk after CLK_PERIOD/2;

    -- DUT Instance
    dut : entity work.dsp_chain_top
        port map (
            clk      => clk,
            reset    => reset,
            valid_i  => valid_i,
            sample_i => sample_i,
            valid_o  => valid_o,
            energy_o => energy_o
        );

    -- Stimulus and Verification Process
    process
    begin
        -- Initialize signals
        reset <= '1';
        valid_i <= '0';
        sample_i <= (others => '0');
        wait for CLK_PERIOD * 5;
        
        -- Release reset
        reset <= '0';
        wait for CLK_PERIOD;

        -- Test Case 1: Impulse response check
        -- Verify that a single pulse flows through the pipeline and triggers valid_o.
        sample_i <= std_logic_vector(to_signed(10, DATA_WIDTH));
        valid_i  <= '1';
        wait for CLK_PERIOD;
        sample_i <= std_logic_vector(to_signed(0, DATA_WIDTH));
        valid_i  <= '0';

        -- Wait exactly the pipeline latency to observe valid output.
        for i in 1 to TOTAL_LATENCY loop
            wait for CLK_PERIOD;
        end loop;

        if valid_o = '0' then
            report "FAIL: Output not valid at expected latency cycle";
            test_failed <= true;
        end if;

        -- Test Case 2: Constant DC value check
        -- Verify that the spectral energy analyzer produces a non-zero result for constant input.
        valid_i <= '1';
        sample_i <= std_logic_vector(to_signed(1, DATA_WIDTH));
        wait for CLK_PERIOD * 20;

        -- Use the helper function to verify the energy result if a specific value was expected,
        -- or perform a simple zero-check as below.
        if unsigned(energy_o) = 0 then
            report "FAIL: Energy analyzer returned zero for DC input";
            test_failed <= true;
        end if;

        -- Final termination sequence
        valid_i <= '0';
        wait for CLK_PERIOD * 5;

        if not test_failed then
            report "DSP Chain Test Passed Successfully!";
            std.env.stop(0);
        else
            report "DSP Chain Test Failed!";
            std.env.stop(1);
        end if;
    end process;

end architecture sim;
