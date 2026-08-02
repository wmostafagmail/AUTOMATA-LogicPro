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
  constant max_count : unsigned(WIDTH-1 downto 0) := (others => '1');
begin
    process(clk, rst)
    begin
        if rst = '1' then
            count_o <= (others => '0');
        elsif rising_edge(clk) and enable_i = '1' then
            if count_o = max_count then
                count_o <= (others => '0');
            else
                count_o <= count_o + 1;
            end if;
        end if;
    end process;
end architecture rtl;
