library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all;
entity generic_counter_basic is generic(G_WIDTH:positive:=32;G_RESET_VALUE:natural:=0;G_TERMINAL_VALUE:natural:=255);
 port(clk_i,rst_ni,enable_i,clear_i:in std_logic;count_o:out std_logic_vector(G_WIDTH-1 downto 0);terminal_o:out std_logic);end entity;
architecture rtl of generic_counter_basic is signal count_r:unsigned(G_WIDTH-1 downto 0);begin
 assert G_TERMINAL_VALUE < 2**G_WIDTH report "terminal value not representable" severity failure;
 process(clk_i) begin if rising_edge(clk_i) then if rst_ni='0' or clear_i='1' then count_r<=to_unsigned(G_RESET_VALUE,G_WIDTH); elsif enable_i='1' then if count_r=G_TERMINAL_VALUE then count_r<=(others=>'0'); else count_r<=count_r+1; end if; end if; end if; end process;
 count_o<=std_logic_vector(count_r);terminal_o<='1' when count_r=G_TERMINAL_VALUE else '0';end architecture;
