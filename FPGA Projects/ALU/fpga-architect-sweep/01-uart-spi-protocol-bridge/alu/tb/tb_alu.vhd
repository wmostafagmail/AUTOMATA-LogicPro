library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity tb_alu is
end entity tb_alu;

architecture sim of tb_alu is
    constant CLK_PERIOD : time := 10 ns;
    constant DATA_WIDTH : integer := 8;

    signal clk      : std_logic := '0';
    signal rst_i    : std_logic := '0';
    signal op       : unsigned(2 downto 0) := (others => '0');
    signal a        : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
    signal b        : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
    signal valid    : std_logic := '0';
    signal result   : std_logic_vector(DATA_WIDTH-1 downto 0);
    signal zero     : std_logic;

    procedure check_result(
        constant expected_res : in unsigned;
        constant expected_zero : in std_logic;
        constant test_name : in string
    ) is
    begin
        wait until rising_edge(clk);
        wait until rising_edge(clk);

        if unsigned(result) = expected_res and zero = expected_zero then
            report "PASS: " & test_name severity note;
        else
            report "FAIL: " & test_name & " expected " & integer'image(to_integer(expected_res)) &
                   " got " & integer'image(to_integer(unsigned(result))) severity error;
        end if;
    end procedure check_result;

begin
    clk <= not clk after CLK_PERIOD/2;

    dut : entity work.alu(rtl)
        generic map (DATA_WIDTH => 8)
        port map (
            clk_i    => clk,
            rst_i    => rst_i,
            op_i     => op,
            a_i      => a,
            b_i      => b,
            valid_i  => valid,
            result_o => result,
            zero_o   => zero
        );

    stim_proc : process
    begin
        rst_i <= '1';
        op <= (others => '0');
        a <= (others => '0');
        b <= (others => '0');
        valid <= '0';
        wait for 50 ns;

        rst_i <= '0';
        wait until rising_edge(clk);

        a <= "00000001";
        b <= "00000010";
        op <= ALU_OP_ADD;
        valid <= '1';
        check_result(clk, result, zero, to_unsigned(3, 8), '0', "ADD_1_2");

        a <= "00000101";
        b <= "00000010";
        op <= ALU_OP_SUB;
        valid <= '1';
        check_result(clk, result, zero, to_unsigned(3, 8), '0', "SUB_5_2");

        a <= "00000001";
        b <= "00000010";
        op <= ALU_OP_AND;
        valid <= '1';
        check_result(clk, result, zero, to_unsigned(0, 8), '1', "AND_1_2");

        a <= "00000001";
        b <= "00000010";
        op <= ALU_OP_OR;
        valid <= '1';
        check_result(clk, result, zero, to_unsigned(3, 8), '0', "OR_1_2");

        a <= "00000001";
        b <= "00000010";
        op <= ALU_OP_XNOR;
        valid <= '1';
        check_result(clk, result, zero, to_unsigned(252, 8), '0', "XNOR_1_2");

        valid <= '0';
        wait for 50 ns;
        std.env.stop(0);
    end process stim_proc;
end architecture sim;