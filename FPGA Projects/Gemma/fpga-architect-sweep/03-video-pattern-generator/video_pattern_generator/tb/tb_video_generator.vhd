library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;
use work.video_types_pkg.all;

entity tb_video_generator is
end entity tb_video_generator;

architecture sim of tb_video_generator is
    -- Timing and Clock Constants
    constant SYS_CLK_PERIOD : time := 10 ns; -- 100 MHz

    -- DUT Signals
    signal sys_clk     : std_logic := '0';
    signal reset       : std_logic := '0';
    signal hsync       : std_logic;
    signal vsync       : std_logic;
    signal video_on    : std_logic;
    signal r, g, b     : std_logic_vector(7 downto 0);

    -- Test State Bookkeeping
    signal test_failed : boolean := false;

    -- Helper Procedure for Verification
    -- Legal mutation pattern: Pass the failure flag as an 'inout' signal formal parameter.
    procedure check_sync_pulse(
        constant signal_val : in std_logic;
        constant expected   : in std_logic;
        signal   fail_flag   : inout boolean;
        constant msg        : in string) is
    begin
        if signal_val /= expected then
            report "FAIL: " & msg : severity warning;
            fail_flag <= true;
        end if;
    end procedure;

begin

    -- DUT Instance
    dut : entity work.video_top
        port map (
            sys_clk    => sys_clk,
            reset      => reset,
            hsync_o    => hsync,
            vsync_o    => vsync,
            video_on_o => video_on,
            rgb_r_o    => r,
            rgb_g_o    => g,
            rgb_b_o    => b
        );

    -- Clock Generation
    sys_clk <= not sys_clk after SYS_CLK_PERIOD / 2;

    -- Main Stimulus Process
    process
        variable hsync_width : integer := 0;
    begin
        -- Initial Reset Sequence
        reset <= '1';
        wait for 100 ns;
        reset <= '0';
        wait for 20 ns;

        -- Test 1: Verify HSYNC timing window (Wait for first falling edge)
        wait until hsync = '0';
        hsync_width := 0;
        while hsync = '0' loop
            hsync_width := hsync_width + 1;
            wait for SYS_CLK_PERIOD;
        end loop;
        
        -- HSYNC duration check (ensure it is not zero or trivial)
        if hsync_width < 2 then 
            report "FAIL: HSYNC pulse too short" : severity warning;
            test_failed <= true;
        end if;

        -- Test 2: Verify VSYNC occurrence
        wait until vsync = '0';
        report "INFO: VSYNC detected successfully" : severity note;

        -- Test 3: Check Video On and Color Output during active window
        wait until video_on = '1';
        
        -- Wait for synchronous signals to settle after the edge
        wait for 1 ns;
        
        -- Call helper with explicit target passing using a legal inout mapping
        check_sync_pulse(
            signal_val => video_on, 
            expected   => '1', 
            fail_flag  => test_failed, 
            msg        => "Video On signal failed"
        );
        
        -- Verify that pixel data is being driven (not all zeros) during active video
        if (r = x"00" and g = x"00" and b = x"00") then
            report "FAIL: No pixel data during active video window" : severity warning;
            test_failed <= true;
        end if;

        -- Final Verdict and Clean Stop
        wait for 1 us;
        if test_failed then
            report "SIMULATION FAILED" : severity error;
            std.env.stop(1);
        else
            report "SIMULATION PASSED SUCCESSFULLY" : severity note;
            std.env.stop(0);
        end if;
    end process;

end architecture sim;
