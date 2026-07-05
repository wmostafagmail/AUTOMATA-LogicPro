library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity alu is
    generic (
        WIDTH : integer := 8
    );
    port (
        clk     : in  std_logic;
        rst     : in  std_logic;
        opcode  : in  alu_op_t;
        a       : in  std_logic_vector(WIDTH - 1 downto 0);
        b       : in  std_logic_vector(WIDTH - 1 downto 0);
        result  : out std_logic_vector(WIDTH - 1 downto 0);
        flags   : out alu_flags_t
    );
end entity alu;

architecture rtl of alu is
begin
    proc : process(clk)
        variable res_u     : unsigned(WIDTH - 1 downto 0);
        variable flags_var : alu_flags_t;
    begin
        if rising_edge(clk) then
            if rst = '1' then
                res_u      := (others => '0');
                flags_var.zero  := '1';
                flags_var.carry := '0';
            else
                res_u     := unsigned(calc_result(a, b, opcode));
                flags_var := calc_flags(a, b, std_logic_vector(res_u), opcode);
            end if;

            result <= std_logic_vector(res_u);
            flags  <= flags_var;
        end if;
    end process proc;
end architecture rtl;