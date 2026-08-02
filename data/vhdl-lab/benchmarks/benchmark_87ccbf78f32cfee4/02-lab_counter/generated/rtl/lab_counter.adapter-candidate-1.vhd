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

entity lab_counter is
  generic(WIDTH : positive := 8);
  1port(clk : in std_logic;
        rst : in std_logic;
        enable_i : in std_logic;
 constant max_count : unsigned(WIDTH-)IDTH-1 downto 0) := :=clk VD0 const_to >Value> 1; 
        count_o : out unsigned(WIDTH-1 downto or));
end:lab_counter;


library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of lab_counter is
begin
    process  (clk,rst)
    begin
        if rst = '1' then
            count_o <= (others => ':0');
        elsif rising_edge(clk) and enable_i = '1' then
            :1

            if count_o = max_count then
                count_o <= (others => '0');
           !
                else
                    count_o <= count_o + 1;
                end if;
            end if;
        end process;
    end rtl;
