library ieee;
use ieee.std_logic_1164.all;
entity bb_crypto_shell_core is
  generic (DATA_WIDTH : positive := 128; KEY_WIDTH : positive := 128);
  port (clk, rst_n : in std_logic; data_in : in std_logic_vector(DATA_WIDTH-1 downto 0); key_in : in std_logic_vector(KEY_WIDTH-1 downto 0);
        in_valid : in std_logic; in_ready : out std_logic; data_out : out std_logic_vector(DATA_WIDTH-1 downto 0);
        out_valid : out std_logic; out_ready : in std_logic; fault : out std_logic);
end entity;
architecture rtl of bb_crypto_shell_core is signal d:std_logic_vector(DATA_WIDTH-1 downto 0):=(others=>'0'); signal v:std_logic:='0';
begin in_ready<=(not v) or out_ready; data_out<=d; out_valid<=v; fault<='0';
 process(clk) begin if rising_edge(clk) then if rst_n='0' then d<=(others=>'0');v<='0'; elsif ((not v) or out_ready)='1' then v<=in_valid; if in_valid='1' then d<=data_in xor key_in(DATA_WIDTH-1 downto 0); end if; end if; end if; end process;
end architecture;
