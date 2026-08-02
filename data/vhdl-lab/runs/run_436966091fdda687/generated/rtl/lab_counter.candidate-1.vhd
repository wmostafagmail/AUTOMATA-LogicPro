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
begin

    process (clk, rst) is
        variable count_v : unsigned(WIDTH-1 downto 0);
    begin
        if rst = '1' then
            count_v := to_unsigned(0, WIDTH);
        elsif rising_edge(clk) then
            if enable_i = '1' then
                count_v := count_v + 1;
            end if;
        end if;
        count_o <= count_v;
    end process;

end architecture rtl;
