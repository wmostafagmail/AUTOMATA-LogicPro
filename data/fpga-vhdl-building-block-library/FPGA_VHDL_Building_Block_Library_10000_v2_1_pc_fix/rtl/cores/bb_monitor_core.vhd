library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity bb_monitor_core is
  generic (OBS_WIDTH : positive := 32; COUNT_WIDTH : positive := 32);
  port (clk, rst_n : in std_logic; observed, expected : in std_logic_vector(OBS_WIDTH-1 downto 0); sample_valid, clear : in std_logic;
        match : out std_logic; error_count : out std_logic_vector(COUNT_WIDTH-1 downto 0));
end entity;
architecture rtl of bb_monitor_core is signal c:unsigned(COUNT_WIDTH-1 downto 0):=(others=>'0');
begin match<='1' when observed=expected else '0'; error_count<=std_logic_vector(c);
  process(clk) begin if rising_edge(clk) then if rst_n='0' or clear='1' then c<=(others=>'0'); elsif sample_valid='1' and observed/=expected then c<=c+1; end if; end if; end process;
end architecture;
