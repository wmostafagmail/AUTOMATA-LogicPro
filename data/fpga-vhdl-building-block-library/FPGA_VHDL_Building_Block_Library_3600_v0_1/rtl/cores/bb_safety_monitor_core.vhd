library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity bb_safety_monitor_core is
  generic (MON_WIDTH : positive := 16; COUNT_WIDTH : positive := 32);
  port (clk, rst_n : in std_logic; monitored_signals : in std_logic_vector(MON_WIDTH-1 downto 0); clear_faults : in std_logic;
        fault_detected : out std_logic_vector(MON_WIDTH-1 downto 0); safe_state_req, irq : out std_logic;
        error_count : out std_logic_vector(COUNT_WIDTH-1 downto 0));
end entity;
architecture rtl of bb_safety_monitor_core is signal f:std_logic_vector(MON_WIDTH-1 downto 0):=(others=>'0'); signal c:unsigned(COUNT_WIDTH-1 downto 0):=(others=>'0');
begin fault_detected<=f; safe_state_req<='1' when f/=(f'range=>'0') else '0'; irq<=safe_state_req; error_count<=std_logic_vector(c);
  process(clk) begin if rising_edge(clk) then if rst_n='0' or clear_faults='1' then f<=(others=>'0'); c<=(others=>'0');
  else f<=f or monitored_signals; if monitored_signals/=(monitored_signals'range=>'0') then c<=c+1; end if; end if; end if; end process;
end architecture;
