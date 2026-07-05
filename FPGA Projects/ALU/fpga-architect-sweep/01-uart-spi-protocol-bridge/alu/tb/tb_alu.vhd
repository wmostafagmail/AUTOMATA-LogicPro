library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity tb_alu is
end entity tb_alu;

architecture sim of tb_alu is
    constant CLK_PERIOD : time := 10 ns;
    signal clk : std_logic := '0';
    signal rst : std_logic := '0';
    signal op_code : std_logic_vector(3 downto 0) := (others => '0');
    signal a : std_logic_vector(7 downto 0) := (others => '0');
    signal b : std_logic_vector(7 downto 0) := (others => '0');
    signal result : std_logic_vector(7 downto 0);
    signal zero_f : std_logic;
    signal ovf_f : std_logic;
    signal busy : std_logic;

begin
    clk <= not clk after CLK_PERIOD / 2;

    dut : entity work.alu(rtl)
        port map (clk => clk, rst => rst, op_code => op_code, a => a, b => b, result => result, zero_f => zero_f, ovf_f => ovf_f, busy => busy);

    stim_proc : process
    begin
        rst <= '1';
        wait for 20 ns;
        rst <= '0';
        
        -- Test Add
        op_code <= OP_ADD;
        a <= to_std_logic_vector(to_unsigned(1, 8));
        b <= to_std_logic_vector(to_unsigned(2, 8));
        wait until rising_edge(clk);
        wait for 5 ns;
        assert unsigned(result) = to_unsigned(3, 8) report "Add 1+2 failed" severity failure;
        
        -- Test Sub
        op_code <= OP_SUB;
        a <= to_std_logic_vector(to_unsigned(5, 8));
        b <= to_std_logic_vector(to_unsigned(1, 8));
        wait until rising_edge(clk);
        wait for 5 ns;
        assert unsigned(result) = to_unsigned(4, 8) report "Sub 5-1 failed" severity failure;
        
        -- Test And
        op_code <= OP_AND;
        a <= x"FF";
        b <= x"0F";
        wait until rising_edge(clk);
        wait for 5 ns;
        assert unsigned(result) = to_unsigned(15, 8) report "And failed" severity failure;
        
        wait for 20 ns;
        std.env.stop(0);
    end process;
end architecture sim;