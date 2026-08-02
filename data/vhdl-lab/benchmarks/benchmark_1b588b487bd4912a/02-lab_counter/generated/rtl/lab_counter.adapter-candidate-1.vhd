library ieee; use ieee.std_logic_1164.all;


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

architecture rtl of lab_counter is begin u_core:entity work.core generic map(WIDTH) port map(clk,rst,enable_i,count_o);end architecture;
library ieee; use ieee.std_logic_1164.all;use ieee.numeric_std.all;
entity core is generic(WIDTH:positive:=8);port(clk,rst,enable_i:in std_logic;count_o:out unsigned(WIDTH-1 downto 0));end entity;


library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of core is begin p_core:process(clk,rst)begin if(rst='1')then count_o<=to_unsigned(0,WIDTH);elsif(clk'event and clk='1')then if(enable_i='1')then count_o<=count_o+1;end if;end if;end process;end architecture;
