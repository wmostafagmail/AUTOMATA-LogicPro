library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity tb_cpu_core is
end entity tb_cpu_core;

architecture sim of tb_cpu_core is
  signal clk        : std_logic := '0';
  signal rst        : std_logic := '0';
  signal pc_out     : addr_t;
  signal mem_addr   : addr_t;
  signal mem_rd_en  : std_logic;
  signal mem_wr_en  : std_logic;
  signal mem_wr_data: data_t;
  signal mem_rd_data: data_t;
  signal halt_out   : std_logic;
  signal reg_out    : data_t(3 downto 0);
  
  constant CLK_PERIOD : time := 10 ns;
begin
  dut: entity work.cpu_core(rtl)
    port map (
      clk => clk, rst => rst,
      pc_out => pc_out, mem_addr => mem_addr,
      mem_rd_en => mem_rd_en, mem_wr_en => mem_wr_en,
      mem_wr_data => mem_wr_data, mem_rd_data => mem_rd_data,
      halt_out => halt_out, reg_out => reg_out
    );

  clk_proc: process
  begin
    wait for CLK_PERIOD / 2;
    clk <= not clk;
    wait for CLK_PERIOD / 2;
  end process;

  mem_proc: process
  begin
    mem_rd_data <= (others => '0');
    wait until rising_edge(clk);
    mem_rd_data <= x"50"; wait until rising_edge(clk);
    mem_rd_data <= x"01"; wait until rising_edge(clk);
    mem_rd_data <= x"51"; wait until rising_edge(clk);
    mem_rd_data <= x"02"; wait until rising_edge(clk);
    mem_rd_data <= x"12"; wait until rising_edge(clk);
    mem_rd_data <= x"13"; wait until rising_edge(clk);
    mem_rd_data <= x"14"; wait until rising_edge(clk);
    mem_rd_data <= x"15"; wait until rising_edge(clk);
    wait;
  end process;

  check_proc: process
  begin
    wait until rising_edge(clk);
    wait until pc_out = x"02";
    wait for 1 ns;
    assert reg_out(0) = x"01" report "LOAD R0 fail" severity error;
    assert reg_out(1) = x"02" report "LOAD R1 fail" severity error;
    
    wait until pc_out = x"03";
    wait for 1 ns;
    assert reg_out(2) = x"03" report "ADD fail: expected 1+2=3" severity error;
    
    wait until pc_out = x"04";
    wait for 1 ns;
    assert reg_out(3) = x"01" report "SUB fail: expected 3-2=1" severity error;
    
    wait until pc_out = x"05";
    wait for 1 ns;
    assert reg_out(0) = x"02" report "AND fail: expected 2&3=2" severity error;
    
    wait until pc_out = x"06";
    wait for 1 ns;
    assert reg_out(1) = x"03" report "OR fail: expected 2|1=3" severity error;
    
    std.env.stop(0);
  end process;
end architecture sim;