library ieee;
use ieee.std_logic_1164.all;
entity bb_bus_adapter_core is
  generic (ADDR_WIDTH : positive := 32; DATA_WIDTH : positive := 32);
  port (clk, rst_n : in std_logic; req_valid : in std_logic; req_ready : out std_logic; req_write : in std_logic;
        req_addr : in std_logic_vector(ADDR_WIDTH-1 downto 0); req_wdata : in std_logic_vector(DATA_WIDTH-1 downto 0);
        rsp_valid : out std_logic; rsp_ready : in std_logic; rsp_rdata : out std_logic_vector(DATA_WIDTH-1 downto 0); rsp_error : out std_logic);
end entity;
architecture rtl of bb_bus_adapter_core is signal v:std_logic:='0'; signal d:std_logic_vector(DATA_WIDTH-1 downto 0):=(others=>'0');
begin req_ready <= (not v) or rsp_ready; rsp_valid<=v; rsp_rdata<=d; rsp_error<='0';
 process(clk) begin if rising_edge(clk) then if rst_n='0' then v<='0'; d<=(others=>'0'); elsif ((not v) or rsp_ready)='1' then v<=req_valid; if req_valid='1' then d<=req_wdata xor req_addr(DATA_WIDTH-1 downto 0); end if; end if; end if; end process;
end architecture;
