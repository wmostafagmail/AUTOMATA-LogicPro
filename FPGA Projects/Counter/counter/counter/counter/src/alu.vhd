library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity alu is
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
end entity alu;

architecture rtl of alu is
    signal result_int : unsigned(7 downto 0);
    signal overflow_int : std_logic;
    signal zero_int : std_logic;
begin

    process(clk)
    begin
        if rising_edge(clk) then
            if reset_n = '1' then
                result_int <= (others => '0');
                overflow_int <= '0';
                zero_int <= '0';
            else
                case op is
                    when ALU_ADD =>
                        if (unsigned(a) + unsigned(b)) > 255 then
                            overflow_int <= '1';
                        else
                            overflow_int <= '0';
                        end if;
                        result_int <= resize(unsigned(a) + unsigned(b), 8);
                    when ALU_SUB =>
                        if unsigned(a) < unsigned(b) then
                            overflow_int <= '1';
                        else
                            overflow_int <= '0';
                        end if;
                        result_int <= resize(unsigned(a) - unsigned(b), 8);
                    when ALU_AND =>
                        overflow_int <= '0';
                        result_int <= resize(unsigned(a) and unsigned(b), 8);
                    when ALU_OR =>
                        overflow_int <= '0';
                        result_int <= resize(unsigned(a) or unsigned(b), 8);
                    when ALU_XOR =>
                        overflow_int <= '0';
                        result_int <= resize(unsigned(a) xor unsigned(b), 8);
                    when ALU_NOT =>
                        overflow_int <= '0';
                        result_int <= resize(not unsigned(a), 8);
                    when ALU_SHL =>
                        overflow_int <= '0';
                        result_int <= resize(unsigned(a) sll 1, 8);
                    when ALU_SHR =>
                        overflow_int <= '0';
                        result_int <= resize(unsigned(a) srl 1, 8);
                    when others =>
                        overflow_int <= '0';
                        result_int <= (others => '0');
                end case;
            end if;
        end if;
    end process;

    result <= std_logic_vector(result_int);
    overflow <= overflow_int;
    zero <= '1' when result_int = 0 else '0';

end architecture rtl;