library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity mini_cpu_core_top is
  generic (
    DATA_WIDTH : positive := 8
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    pm_addr_o : out unsigned(7 downto 0);
    pm_data_i : in std_logic_vector(7 downto 0);
    dm_addr_o : out unsigned(7 downto 0);
    dm_wdata_o : out std_logic_vector(7 downto 0);
    dm_rdata_i : in std_logic_vector(7 downto 0);
    dm_we_o : out std_logic;
    halted_o : out std_logic;
    status_o : out std_logic_vector(7 downto 0)
  );
end entity mini_cpu_core_top;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of mini_cpu_core_top is
begin
  pm_addr_o <= (others => '0');
  dm_addr_o <= (others => '0');
  dm_wdata_o <= (others => '0');
  dm_we_o <= '0';
  halted_o <= '0';
  status_o <= (others => '0');
end architecture rtl;
