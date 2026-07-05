library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity tb_alu is
end entity tb_alu;

architecture sim of tb_alu is
    component alu is
        port (
            clk      : in  std_logic;
            reset_n  : in  std_logic;
            a        : in  std_logic_vector(7 downto 0);
            b        : in  std_logic_vector(7 downto 0);
            op       : in  std_logic_vector(2 downto 0);
            result   : out std_logic_vector(7 downto 0);
            overflow : out std_logic;
            zero     : out std_logic
        );
    end component;

    signal clk      : std_logic := '0';
    signal reset_n  : std_logic := '0';
    signal a        : std_logic_vector(7 downto 0);
    signal b        : std_logic_vector(7 downto 0);
    signal op       : std_logic_vector(2 downto 0);
    signal result   : std_logic_vector(7 downto 0);
    signal overflow : std_logic;
    signal zero     : std_logic;

    constant clk_period : time := 10 ns;

begin

    dut : alu
        port map (
            clk      => clk,
            reset_n  => reset_n,
            a        => a,
            b        => b,
            op       => op,
            result   => result,
            overflow => overflow,
            zero     => zero
        );

    clk_proc : process
    begin
        clk <= '0';
        wait for clk_period / 2;
        clk <= '1';
        wait for clk_period / 2;
    end process;

    stim_proc : process
    begin
        -- Reset
        reset_n <= '1';
        a <= (others => '0');
        b <= (others => '0');
        op <= (others => '0');
        wait for 20 ns;
        reset_n <= '0';
        wait for 20 ns;

        -- ADD tests
        a <= x"FF"; b <= x"01"; op <= ALU_ADD;
        wait for 20 ns;
        assert (result = x"00" and overflow = '1') report "ADD overflow failed" severity error;

        a <= x"01"; b <= x"01"; op <= ALU_ADD;
        wait for 20 ns;
        assert (result = x"02" and overflow = '0') report "ADD failed" severity error;

        -- SUB tests
        a <= x"02"; b <= x"01"; op <= ALU_SUB;
        wait for 20 ns;
        assert (result = x"01" and overflow = '0') report "SUB failed" severity error;

        a <= x"00"; b <= x"01"; op <= ALU_SUB;
        wait for 20 ns;
        assert (result = x"FF" and overflow = '1') report "SUB overflow failed" severity error;

        -- AND/OR/XOR tests
        a <= x"FF"; b <= x"0F"; op <= ALU_AND;
        wait for 20 ns;
        assert (result = x"0F" and overflow = '0') report "AND failed" severity error;

        a <= x"00"; b <= x"FF"; op <= ALU_OR;
        wait for 20 ns;
        assert (result = x"FF" and overflow = '0') report "OR failed" severity error;

        a <= x"FF"; b <= x"FF"; op <= ALU_XOR;
        wait for 20 ns;
        assert (result = x"00" and overflow = '0') report "XOR failed" severity error;

        -- NOT test
        a <= x"FF"; op <= ALU_NOT;
        wait for 20 ns;
        assert (result = x"00" and overflow = '0') report "NOT failed" severity error;

        -- SHL/SHR tests
        a <= x"01"; b <= x"00"; op <= ALU_SHL;
        wait for 20 ns;
        assert (result = x"02" and overflow = '0') report "SHL failed" severity error;

        a <= x"80"; b <= x"00"; op <= ALU_SHR;
        wait for 20 ns;
        assert (result = x"40" and overflow = '0') report "SHR failed" severity error;

        -- Reset test
        reset_n <= '1';
        wait for 20 ns;
        reset_n <= '0';
        wait for 20 ns;
        assert (result = x"00" and overflow = '0' and zero = '1') report "Reset failed" severity error;

        std.env.stop(0);
    end process;

end architecture sim;