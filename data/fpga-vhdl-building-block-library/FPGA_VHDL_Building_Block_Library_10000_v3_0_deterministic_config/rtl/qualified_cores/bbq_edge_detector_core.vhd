library ieee; use ieee.std_logic_1164.all;
entity bbq_edge_detector_core is port(clk,rst_n,signal_in:in std_logic; level_sync,rise_pulse,fall_pulse,change_pulse:out std_logic); end;
architecture rtl of bbq_edge_detector_core is signal s1,s2,prev:std_logic:='0'; attribute async_reg:string; attribute async_reg of s1,s2:signal is "true";
begin level_sync<=s2; rise_pulse<=s2 and not prev; fall_pulse<=prev and not s2; change_pulse<=s2 xor prev;
 process(clk) begin if rising_edge(clk) then if rst_n='0' then s1<='0';s2<='0';prev<='0'; else s1<=signal_in;s2<=s1;prev<=s2; end if; end if; end process;
end architecture;
