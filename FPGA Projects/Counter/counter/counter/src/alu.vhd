library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity alu is
    generic (
        DATA_WIDTH : integer := 8
    );
    port (
        clk    : in  std_logic;
        rst    : in  std_logic;
        a      : in  std_logic_vector(DATA_WIDTH-1 downto 0);
        b      : in  std_logic_vector(DATA_WIDTH-1 downto 0);
        op     : in  alu_op_t;
        result : out std_logic_vector(DATA_WIDTH-1 downto 0);
        flags  : out alu_flags_t
    );
end entity alu;

architecture rtl of alu is
    signal comb_result : std_logic_vector(DATA_WIDTH-1 downto 0);
    signal comb_flags  : alu_flags_t;
begin
    comb_proc : process(a, b, op)
    begin
        comb_result <= alu_calc(a, b, op);
        comb_flags  <= alu_flags(a, b, op, (others => '0'));
    end process comb_proc;

    reg_proc : process(clk)
    begin
        if rising_edge(clk) then
            if rst = '1' then
                result <= (others => '0');
                flags  <= (zero => '0', carry => '0', overflow => '0', less => '0');
            else
                result <= comb_result;
                flags  <= comb_flags;
            end if;
        end if;
    end process reg_proc;
end architecture rtl;