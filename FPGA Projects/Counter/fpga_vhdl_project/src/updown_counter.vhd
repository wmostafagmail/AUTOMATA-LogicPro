library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

entity updown_counter is
    generic (
        WIDTH : integer := 8
    );
    port (
        clk     : in  std_logic;
        rst     : in  std_logic;
        en      : in  std_logic;
        dir     : in  std_logic;
        count_o : out std_logic_vector(WIDTH - 1 downto 0)
    );
end entity updown_counter;

architecture rtl of updown_counter is
    signal count_reg : unsigned(WIDTH - 1 downto 0) := (others => '0');
begin
    process(clk)
    begin
        if rising_edge(clk) then
            if rst = '1' then
                count_reg <= (others => '0');
            elsif en = '1' then
                if dir = '1' then
                    count_reg <= count_reg + 1;
                else
                    count_reg <= count_reg - 1;
                end if;
            end if;
        end if;
    end process;
    count_o <= std_logic_vector(count_reg);
end architecture rtl;