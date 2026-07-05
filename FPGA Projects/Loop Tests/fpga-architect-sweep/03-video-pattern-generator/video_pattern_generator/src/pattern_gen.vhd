library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity pattern_gen is
    generic (
        DATA_WIDTH_C : integer := 24
    );
    port (
        clk    : in  std_logic;
        rst    : in  std_logic;
        h_cnt  : in  integer range 0 to 799;
        v_cnt  : in  integer range 0 to 524;
        pixel  : out std_logic_vector(DATA_WIDTH_C-1 downto 0)
    );
end entity pattern_gen;

architecture rtl of pattern_gen is
begin
    process(clk)
        variable pattern: std_logic_vector(DATA_WIDTH_C-1 downto 0);
    begin
        if rising_edge(clk) then
            if rst = '1' then
                pattern := (others => '0');
            else
                pattern := std_logic_vector(to_unsigned(h_cnt + v_cnt, DATA_WIDTH_C));
            end if;
            pixel <= pattern;
        end if;
    end process;
end architecture rtl;