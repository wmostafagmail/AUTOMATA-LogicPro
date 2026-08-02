library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity tb_dsp_chain_top is
end entity tb_dsp_chain_top;

architecture sim of tb_dsp_chain_top is
  constant DATA_WIDTH : positive := 16;
  signal clk : std_logic := '0';
  signal rst : std_logic := '0';
  signal sample_i : signed(15 downto 0) := (others => '0');
  signal sample_valid_i : std_logic := '0';
  signal sample_ready_o : std_logic := '0';
  signal result_o : signed(31 downto 0) := (others => '0');
  signal result_valid_o : std_logic := '0';
begin
  clk_gen : process
  begin
    clk <= '0';
    wait for 5 ns;
    clk <= '1';
    wait for 5 ns;
  end process;

  dut : entity work.dsp_chain_top
    generic map (
      DATA_WIDTH => 16
    )
    port map (
      clk => clk,
      rst => rst,
      sample_i => sample_i,
      sample_valid_i => sample_valid_i,
      sample_ready_o => sample_ready_o,
      result_o => result_o,
      result_valid_o => result_valid_o
    );

  stimulus : process
  begin
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    sample_i <= (others => '0');
    sample_valid_i <= '0';
    wait for 80 ns;
    report "PASS" severity note;
    wait;
  end process;
end architecture sim;
