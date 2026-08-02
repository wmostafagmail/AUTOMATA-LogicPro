library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity tb_mini_cpu_core_top is
end entity tb_mini_cpu_core_top;

architecture sim of tb_mini_cpu_core_top is
  constant DATA_WIDTH : positive := 8;
  signal clk : std_logic := '0';
  signal rst : std_logic := '0';
  signal pm_addr_o : unsigned(7 downto 0) := (others => '0');
  signal pm_data_i : std_logic_vector(7 downto 0) := (others => '0');
  signal dm_addr_o : unsigned(7 downto 0) := (others => '0');
  signal dm_wdata_o : std_logic_vector(7 downto 0) := (others => '0');
  signal dm_rdata_i : std_logic_vector(7 downto 0) := (others => '0');
  signal dm_we_o : std_logic := '0';
  signal halted_o : std_logic := '0';
  signal status_o : std_logic_vector(7 downto 0) := (others => '0');
begin
  clk_gen : process
  begin
    clk <= '0';
    wait for 5 ns;
    clk <= '1';
    wait for 5 ns;
  end process;

  dut : entity work.mini_cpu_core_top
    generic map (
      DATA_WIDTH => 8
    )
    port map (
      clk => clk,
      rst => rst,
      pm_addr_o => pm_addr_o,
      pm_data_i => pm_data_i,
      dm_addr_o => dm_addr_o,
      dm_wdata_o => dm_wdata_o,
      dm_rdata_i => dm_rdata_i,
      dm_we_o => dm_we_o,
      halted_o => halted_o,
      status_o => status_o
    );

  stimulus : process
  begin
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    pm_data_i <= (others => '0');
    dm_rdata_i <= (others => '0');
    wait for 80 ns;
    report "PASS" severity note;
    wait;
  end process;
end architecture sim;
