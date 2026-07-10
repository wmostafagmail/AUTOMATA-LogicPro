library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.video_pattern_gen_pkg.all;
use std.env.all;

entity tb_video_pattern_gen is
end entity tb_video_pattern_gen;

architecture tb of tb_video_pattern_gen is

    constant PIXEL_CLK_PERIOD : time := 40 ns;
    constant C_ALL_ZEROS      : std_logic_vector(PIXEL_DATA_WIDTH - 1 downto 0) := (others => '0');
    constant C_ALL_ONES       : std_logic_vector(PIXEL_DATA_WIDTH - 1 downto 0) := (others => '1');

    signal tb_clk             : std_logic := '0';
    signal tb_rst             : std_logic := '0';
    signal h_sync_out         : std_logic;
    signal v_sync_out         : std_logic;
    signal pixel_data_out     : std_logic_vector(PIXEL_DATA_WIDTH - 1 downto 0);

    procedure report_fail_msg(msg_name : in string) is
    begin
        report "FAIL: " & msg_name severity warning;
    end procedure report_fail_msg;

begin

    dut_inst : entity work.video_pattern_gen_top
        generic map (
            G_H_TOTAL => H_TOTAL,
            G_V_TOTAL => V_TOTAL
            )
        port map (
            clk_i            => tb_clk,
            rst_i            => tb_rst,
            h_sync_o         => h_sync_out,
            v_sync_o         => v_sync_out,
            pixel_data_o     => pixel_data_out
            );

    clk_proc : process
    begin
        tb_clk <= '0';
        wait for PIXEL_CLK_PERIOD / 2;
        tb_clk <= '1';
        wait for PIXEL_CLK_PERIOD / 2;
    end process clk_proc;

    stim_proc : process
        variable pass_count_var : integer := 0;
        variable fail_count_var : integer := 0;
        variable p_val_safe     : integer;
    begin
        tb_rst <= '1';
        wait for 100 ns;

        wait for PIXEL_CLK_PERIOD * 2;

        if h_sync_out /= '1' then
            report_fail_msg("Reset Check: H_SYNC not high after reset");
            fail_count_var := fail_count_var + 1;
        end if;

        if v_sync_out /= '1' then
            report_fail_msg("Reset Check: V_SYNC not high after reset");
            fail_count_var := fail_count_var + 1;
        end if;

        tb_rst <= '0';

        wait for (H_TOTAL + 1) * PIXEL_CLK_PERIOD;

        if pixel_data_out = C_ALL_ONES then
            pass_count_var := pass_count_var + 1;
        else
            p_val_safe := to_integer(unsigned(pixel_data_out));
            report_fail_msg("Pixel Check: At start of active window, expected White, got value " & integer'image(p_val_safe));
            fail_count_var := fail_count_var + 1;
        end if;

        wait for (H_TOTAL + 1) * PIXEL_CLK_PERIOD;

        if pixel_data_out = C_ALL_ZEROS then
            pass_count_var := pass_count_var + 1;
        else
            p_val_safe := to_integer(unsigned(pixel_data_out));
            report_fail_msg("Pixel Check: At second line start, expected Black, got value " & integer'image(p_val_safe));
            fail_count_var := fail_count_var + 1;
        end if;

        wait for 1 us;

        assert fail_count_var = 0 report "TEST PASSED: All checks passed." severity note;

        if fail_count_var > 0 then
            report_fail_msg("TEST FAILED: Some checks failed.");
        else
            report "TEST PASSED successfully." severity note;
        end if;

        std.env.stop(0);

    end process stim_proc;

end architecture tb;
