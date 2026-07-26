library ieee;
use ieee.std_logic_1164.all;
entity bb_memory_service_core is
  generic (ADDR_WIDTH : positive := 32; DATA_WIDTH : positive := 32);
  port (clk, rst_n : in std_logic; start : in std_logic; src_addr, dst_addr : in std_logic_vector(ADDR_WIDTH-1 downto 0);
        data_in : in std_logic_vector(DATA_WIDTH-1 downto 0); data_out : out std_logic_vector(DATA_WIDTH-1 downto 0);
        busy, done, error : out std_logic);
end entity;
architecture rtl of bb_memory_service_core is signal b,d:std_logic:='0'; signal q:std_logic_vector(DATA_WIDTH-1 downto 0):=(others=>'0');
begin busy<=b; done<=d; error<='0'; data_out<=q;
 process(clk) begin if rising_edge(clk) then d<='0'; if rst_n='0' then b<='0';q<=(others=>'0'); elsif start='1' and b='0' then b<='1';q<=data_in; elsif b='1' then b<='0';d<='1'; end if; end if; end process;
end architecture;
