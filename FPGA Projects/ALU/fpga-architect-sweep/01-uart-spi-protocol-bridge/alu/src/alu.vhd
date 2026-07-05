library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity alu is
    port (
        clk     : in  std_logic;
        rst     : in  std_logic;
        op_code : in  std_logic_vector(3 downto 0);
        a       : in  std_logic_vector(7 downto 0);
        b       : in  std_logic_vector(7 downto 0);
        result  : out std_logic_vector(7 downto 0);
        zero_f  : out std_logic;
        ovf_f   : out std_logic;
        busy    : out std_logic
    );
end entity alu;

architecture rtl of alu is
    signal a_int : unsigned(7 downto 0);
    signal b_int : unsigned(7 downto 0);
    signal res_int : unsigned(7 downto 0);
begin
    process(clk)
    begin
        if rising_edge(clk) then
            if rst = '1' then
                a_int <= to_unsigned(0, 8);
                b_int <= to_unsigned(0, 8);
                res_int <= to_unsigned(0, 8);
                busy <= '0';
            else
                a_int <= unsigned(a);
                b_int <= unsigned(b);
                busy <= '1';
                
                case op_code is
                    when OP_ADD =>
                        res_int <= resize(a_int + b_int, 8);
                    when OP_SUB =>
                        res_int <= resize(a_int - b_int, 8);
                    when OP_AND =>
                        res_int <= a_int and b_int;
                    when OP_OR =>
                        res_int <= a_int or b_int;
                    when OP_XOR =>
                        res_int <= a_int xor b_int;
                    when others =>
                        res_int <= to_unsigned(0, 8);
                end case;
            end if;
        end if;
    end process;

    result <= std_logic_vector(res_int);
    zero_f <= get_zero_flag(res_int);
    ovf_f  <= get_overflow_flag(a_int, b_int, op_code, res_int);
end architecture rtl;