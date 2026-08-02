library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity lab_counter is
  generic (
    WIDTH : positive := 8
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    enable_i : in std_logic;
    count_o : out unsigned(WIDTH-1 downto 0)
  );
end entity lab_counter;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of lab_counter is
    signal count_reg : unsigned(WIDTH-1 downto 0) := (others => '0');
begin
    process(clk, rst)
    begin
        if rst = '1' then
            count_reg <= (others => '0');
        elsif rising_edge(clk) then
            if enable_i = '1' then
                count_reg <= count_reg + 1;
            end if;
        end if;
    end process;

    count_o <= count_reg;
end architecture rtl;
