library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;
use work.mini_cpu_core_pkg.all;

entity tb_mini_cpu_core is
end entity tb_mini_cpu_core;

architecture test of tb_mini_cpu_core is

    signal sig_clk         : std_logic := '0';
    signal sig_reset_h     : std_logic := '1';
    signal sig_mem_addr    : std_logic_vector(15 downto 0);
    signal sig_mem_din     : std_logic_vector(7 downto 0);
    signal sig_mem_dout    : std_logic_vector(7 downto 0) := (others => '0');
    signal sig_mem_we      : std_logic;
    signal sig_mem_valid   : std_logic;

    u_dut : mini_cpu_core
        generic map (
            DATA_W => 8,
            ADDR_W => 16
        )
        port map (
            clk       => sig_clk,
            reset     => sig_reset_h,
            mem_addr  => sig_mem_addr,
            mem_din   => sig_mem_din,
            mem_dout  => sig_mem_dout,
            mem_we    => sig_mem_we,
            mem_valid => sig_mem_valid
        );

    procedure check_sig_eq(constant msg_name     : in string;
        constant exp_val      : in std_logic_vector;
        signal  act_sig       : inout std_logic_vector;
        shared variable err_flag_out : out std_logic; variable err_flag_out_io : inout out std_logic) is) is
      procedure check_sig_eq;
begin
        if act_sig = exp_val then
            report msg_name & " PASS"; severity note;
        else
            report msg_name & " FAIL: Expected " & std_logic_vector'IMAGE(exp_val) & ", Got " & std_logic_vector'IMAGE(act_sig); severity error;
            err_flag_out_io := '1';
        end if;
    end 

begin

    proc_clk_gen : process
    begin
        wait for 5 ns;
        sig_clk <= not sig_clk;
    end process proc_clk_gen;

    proc_test_seq : process
        variable var_fail     : std_logic := '0';
    begin
        sig_reset_h <= '1';
        wait for 20 ns;

        wait until rising_edge(sig_clk);
        wait for 1 ns;

        report "Cycle 1 Complete." severity note;

        wait for 10 ns;

        report "Simulation Running." severity note;

        for i in 0 to 10 loop
            wait until rising_edge(sig_clk);
            wait for 5 ns;
        end loop;

        check_sig_eq(
            msg_name     => "MemAddr Check",
            exp_val      => (others => '0'),
            act_sig       => sig_mem_addr,
            err_flag_out => var_fail
        );

        if var_fail = '0' then
            report "All Checks Passed."; severity note;
            std.env.stop(0);
        else
            report "Tests Failed."; severity error;
            std.env.finish(1);
        end if;

    end process proc_test_seq;

end architecture test;
