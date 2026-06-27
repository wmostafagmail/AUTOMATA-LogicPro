-- Minimal testbench to validate macro signals & timing
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity cpu_top_tb is
end entity cpu_top_tb;

architecture sim of cpu_top_tb is
  constant CLK_PERIOD : time := 2 ns;
  signal clk      : std_logic := '0';
  signal rst      : std_logic := '0';
  signal addr     : std_logic_vector(7 downto 0) := (others => '0');
  signal data_in  : std_logic_vector(7 downto 0) := (others => '0');
  signal data_out : std_logic_vector(7 downto 0);
  signal rw_n     : std_logic;
  signal cs_n     : std_logic;
  signal ready    : std_logic;
  signal uart_tx  : std_logic;
  signal debug_zero : std_logic;
  
  signal sim_done : boolean := false;
begin
  clk <= not clk after CLK_PERIOD/2 when not sim_done else '0';
  
  dut : entity work.cpu_top
    port map (
      clk => clk, rst => rst, addr => addr,
      data_in => data_in, data_out => data_out,
      rw_n => rw_n, cs_n => cs_n, ready => ready,
      uart_tx => uart_tx, debug_zero => debug_zero
    );
  
  stim_proc : process
  begin
    -- Reset deassertion matches trace (active-high, t=4 ns)
    rst <= '1';
    wait for CLK_PERIOD * 2;
    rst <= '0';
    wait for CLK_PERIOD * 2;
    
    -- Drive address with adequate setup time
    addr <= x"10";
    data_in <= x"00";
    cs_n <= '0'; rw_n <= '0';
    wait for CLK_PERIOD * 4;
    
    -- Verify UART idle
    assert uart_tx = '1'
      report "UART transmitter should remain IDLE"
      severity error;
      
    -- Verify debug_zero assertion
    assert debug_zero = '1'
      report "Debug/Zero flag should assert at t=35 ns"
      severity error;
      
    report "Macro signals validated successfully." severity note;
    sim_done <= true;
    wait;
  end process stim_proc;
end architecture sim;
