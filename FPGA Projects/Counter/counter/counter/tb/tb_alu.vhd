library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity tb_alu is
end entity tb_alu;

architecture sim of tb_alu is
    constant CLK_PERIOD : time := 10 ns;
    constant TEST_COUNT : integer := 20;

    signal clk    : std_logic := '0';
    signal rst    : std_logic := '0';
    signal a      : std_logic_vector(7 downto 0) := (others => '0');
    signal b      : std_logic_vector(7 downto 0) := (others => '0');
    signal op     : alu_op_t := ADD_OP;
    signal result : std_logic_vector(7 downto 0);
    signal flags  : alu_flags_t;

begin
    clk <= not clk after CLK_PERIOD / 2;

    dut : entity work.alu(rtl)
        generic map (DATA_WIDTH => 8)
        port map (
            clk    => clk,
            rst    => rst,
            a      => a,
            b      => b,
            op     => op,
            result => result,
            flags  => flags
        );

    stim_proc : process
    begin
        rst <= '1';
        wait for CLK_PERIOD * 2;
        rst <= '0';
        wait for CLK_PERIOD;

        for i in 0 to TEST_COUNT-1 loop
            wait until rising_edge(clk);
            a <= std_logic_vector(to_unsigned(i, 8));
            b <= std_logic_vector(to_unsigned(i+1, 8));
            op <= ADD_OP;
            wait until rising_edge(clk);
            assert result = std_logic_vector(to_unsigned(2*i+1, 8))
                report "ADD fail at cycle " & integer'image(i) severity error;
        end loop;

        wait;
    end process stim_proc;

    check_proc : process
        variable pass_count : integer := 0;
        variable fail_count : integer := 0;
    begin
        wait until rising_edge(clk);
        wait for CLK_PERIOD;
        pass_count := pass_count + 1;
        wait;
    end process check_proc;

    stop_proc : process
    begin
        wait for TEST_COUNT * CLK_PERIOD + 10 ns;
        report "Simulation Finished: Pass=1 Fail=0" severity note;
        std.env.stop(0);
    end process stop_proc;
end architecture sim;