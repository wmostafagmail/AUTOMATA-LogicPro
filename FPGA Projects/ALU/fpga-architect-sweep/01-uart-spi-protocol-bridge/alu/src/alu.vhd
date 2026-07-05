library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity alu is
    generic (
        DATA_WIDTH : integer := 8
    );
    port (
        clk_i    : in  std_logic;
        rst_i    : in  std_logic;
        op_i     : in  unsigned(2 downto 0);
        a_i      : in  std_logic_vector(DATA_WIDTH-1 downto 0);
        b_i      : in  std_logic_vector(DATA_WIDTH-1 downto 0);
        valid_i  : in  std_logic;
        result_o : out std_logic_vector(DATA_WIDTH-1 downto 0);
        zero_o   : out std_logic
    );
end entity alu;

architecture rtl of alu is
    signal a_reg   : unsigned(DATA_WIDTH-1 downto 0);
    signal b_reg   : unsigned(DATA_WIDTH-1 downto 0);
    signal op_reg  : unsigned(2 downto 0);
    signal res_int : unsigned(DATA_WIDTH-1 downto 0);
    signal zero_int: std_logic;
begin
    process(clk_i)
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                a_reg   <= (others => '0');
                b_reg   <= (others => '0');
                op_reg  <= (others => '0');
                res_int <= (others => '0');
                zero_int<= '0';
            else
                if valid_i = '1' then
                    a_reg   <= unsigned(a_i);
                    b_reg   <= unsigned(b_i);
                    op_reg  <= op_i;
                end if;
            end if;
        end if;
    end process;

    process(a_reg, b_reg, op_reg)
        variable res_tmp : unsigned(DATA_WIDTH-1 downto 0);
    begin
        res_tmp := alu_compute(a_reg, b_reg, op_reg);
        res_int <= res_tmp;
        if res_tmp = (others => '0') then
            zero_int <= '1';
        else
            zero_int <= '0';
        end if;
    end process;

    result_o <= std_logic_vector(res_int);
    zero_o   <= zero_int;
end architecture rtl;