library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all;
entity timer_periodic is generic(G_CLOCK_HZ:positive:=100_000_000;G_PERIOD_US:positive:=1000);
 port(clk_i,rst_ni,enable_i:in std_logic;tick_o:out std_logic);end entity;
architecture rtl of timer_periodic is constant C_TICKS:positive:=(G_CLOCK_HZ/1_000_000)*G_PERIOD_US; signal c:natural range 0 to C_TICKS-1:=0;begin
 assert G_CLOCK_HZ mod 1_000_000=0 report "timer requires integer MHz clock in bootstrap implementation" severity failure;
 process(clk_i) begin if rising_edge(clk_i) then tick_o<='0'; if rst_ni='0' then c<=0; elsif enable_i='1' then if c=C_TICKS-1 then c<=0;tick_o<='1';else c<=c+1;end if;end if;end if;end process;end architecture;
