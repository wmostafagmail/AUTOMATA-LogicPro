library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;
entity tb_program_counter_single_shot is end entity;
architecture sim of tb_program_counter_single_shot is
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal pc_current, pc_next : std_logic_vector(31 downto 0);
  signal pc_valid : std_logic;
  signal redirect_pc : std_logic_vector(31 downto 0) := (others => '0');
  signal redirect_valid : std_logic := '0';
begin
  clk <= not clk after 5 ns;
  dut : entity work.program_counter_single_shot port map(clk=>clk,rst_n=>rst_n,stall=>'0',sequential_advance=>'1',redirect_valid=>redirect_valid,redirect_pc=>redirect_pc,pc_current=>pc_current,pc_next=>pc_next,pc_valid=>pc_valid);
  stim : process
  begin
    -- Release reset away from a rising edge, then sample only after clocked
    -- state and concurrent outputs have settled. This avoids a delta-cycle
    -- race between the test process and the DUT clocked process.
    wait for 20 ns;
    rst_n <= '1';

    wait until rising_edge(clk);
    wait for 1 ns;
    assert pc_valid = '1'
      report "PC valid did not assert after reset release" severity error;
    assert pc_current = x"00000004"
      report "PC did not perform the first sequential advance" severity error;

    -- Redirect has priority over sequential advance on this edge.
    redirect_pc <= x"00000100";
    redirect_valid <= '1';
    wait until rising_edge(clk);
    wait for 1 ns;
    assert pc_current = x"00000100"
      report "PC redirect was not captured on the active edge" severity error;

    -- Remove redirect after the sampled edge. The next edge must advance
    -- sequentially from the redirected address.
    redirect_valid <= '0';
    wait until rising_edge(clk);
    wait for 1 ns;
    assert pc_current = x"00000104"
      report "PC redirect/sequential behavior mismatch" severity error;
    assert pc_next = x"00000108"
      report "PC next-address calculation mismatch" severity error;
    assert false report "PASS program_counter_single_shot" severity note;
    wait;
  end process;
end architecture;
