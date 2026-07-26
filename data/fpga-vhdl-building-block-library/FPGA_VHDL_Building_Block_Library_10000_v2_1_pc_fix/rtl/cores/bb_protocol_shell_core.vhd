library ieee;
use ieee.std_logic_1164.all;
entity bb_protocol_shell_core is
  generic (DATA_WIDTH : positive := 32; STATUS_WIDTH : positive := 16);
  port (clk, rst_n : in std_logic; phy_rx : in std_logic; phy_tx, phy_oe : out std_logic;
        tx_data : in std_logic_vector(DATA_WIDTH-1 downto 0); tx_valid : in std_logic; tx_ready : out std_logic;
        rx_data : out std_logic_vector(DATA_WIDTH-1 downto 0); rx_valid : out std_logic;
        status : out std_logic_vector(STATUS_WIDTH-1 downto 0));
end entity;
architecture rtl of bb_protocol_shell_core is
begin
  -- Deliberately an integration shell. It provides deterministic loopback-like behavior,
  -- but does not claim compliance with the named external protocol.
  phy_tx <= phy_rx; phy_oe <= tx_valid; tx_ready <= '1'; rx_data <= tx_data; rx_valid <= tx_valid;
  status <= (STATUS_WIDTH-1 downto 1 => '0') & rst_n;
end architecture;
