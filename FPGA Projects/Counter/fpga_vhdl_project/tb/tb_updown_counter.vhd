library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;
use std.env.all;

entity tb_updown_counter is
end entity tb_updown_counter;

architecture sim of tb_updown_counter is
    constant WIDTH : integer := 8;
    constant CLK_PERIOD : time := 10 ns;

    signal clk     : std_logic := '0';
    signal rst     : std_logic;
    signal en      : std_logic;
    signal dir     : std_logic;
    signal count_o : std_logic_vector(WIDTH - 1 downto 0);
begin
    clk <= not clk after CLK_PERIOD / 2;

    dut : entity work.updown_counter
        generic map (WIDTH => WIDTH)
        port map (
            clk     => clk,
            rst     => rst,
            en      => en,
            dir     => dir,
            count_o => count_o
        );

    stim_proc : process
        variable expected : unsigned(WIDTH - 1 downto 0);
        variable actual    : unsigned(WIDTH - 1 downto 0);
    begin
        -- Reset sequence
        rst <= '0'; en <= '0'; dir <= '1';
        wait for CLK_PERIOD * 2;
        rst <= '1';
        wait for CLK_PERIOD;
        rst <= '0';
        wait for CLK_PERIOD;

        expected := (others => '0');
        actual := unsigned(count_o);
        assert actual = expected report "Reset failed" severity failure;
        report "Reset OK" severity note;

        -- Up Count
        en <= '1'; dir <= '1';
        wait for CLK_PERIOD;
        expected := to_unsigned(1, WIDTH);
        actual := unsigned(count_o);
        assert actual = expected report "Up count 1 failed" severity failure;

        wait for CLK_PERIOD;
        expected := to_unsigned(2, WIDTH);
        actual := unsigned(count_o);
        assert actual = expected report "Up count 2 failed" severity failure;

        -- Down Count
        dir <= '0';
        wait for CLK_PERIOD;
        expected := to_unsigned(1, WIDTH);
        actual := unsigned(count_o);
        assert actual = expected report "Down count 1 failed" severity failure;

        wait for CLK_PERIOD;
        expected := to_unsigned(0, WIDTH);
        actual := unsigned(count_o);
        assert actual = expected report "Down count 2 failed" severity failure;

        -- Hold
        en <= '0';
        wait for CLK_PERIOD;
        expected := to_unsigned(0, WIDTH);
        actual := unsigned(count_o);
        assert actual = expected report "Hold failed" severity failure;

        -- Wrap around
        en <= '1'; dir <= '1';
        rst <= '1'; wait for CLK_PERIOD;
        rst <= '0'; wait for CLK_PERIOD;

        for i in 0 to 255 loop
            wait for CLK_PERIOD;
        end loop;
        expected := to_unsigned(0, WIDTH);
        actual := unsigned(count_o);
        assert actual = expected report "Wrap failed" severity failure;

        std.env.stop(0);
    end process;
end architecture sim;