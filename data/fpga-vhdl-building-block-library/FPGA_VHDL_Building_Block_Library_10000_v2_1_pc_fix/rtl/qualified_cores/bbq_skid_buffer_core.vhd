library ieee; use ieee.std_logic_1164.all;
entity bbq_skid_buffer_core is generic(DATA_WIDTH:positive:=32); port(clk,rst_n:in std_logic; s_data:in std_logic_vector(DATA_WIDTH-1 downto 0);s_valid:in std_logic;s_ready:out std_logic;m_data:out std_logic_vector(DATA_WIDTH-1 downto 0);m_valid:out std_logic;m_ready:in std_logic);end;
architecture rtl of bbq_skid_buffer_core is signal d:std_logic_vector(DATA_WIDTH-1 downto 0):=(others=>'0');signal v:std_logic:='0';
begin s_ready<=(not v) or m_ready;m_data<=d;m_valid<=v;process(clk) begin if rising_edge(clk) then if rst_n='0' then v<='0';d<=(others=>'0');elsif ((not v) or m_ready)='1' then v<=s_valid;if s_valid='1' then d<=s_data;end if;end if;end if;end process;end architecture;
