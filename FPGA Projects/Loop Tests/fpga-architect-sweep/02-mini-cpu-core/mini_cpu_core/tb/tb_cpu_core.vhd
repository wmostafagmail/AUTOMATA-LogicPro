library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity tb_cpu_core is
end entity tb_cpu_core;

architecture sim of tb_cpu_core is
  constant CLK_PERIOD : time := 10 ns;
  signal clk : std_logic := '0';
  signal rst : std_logic := '0';
  signal pc_addr : addr_t;
  signal pc_data : data_t;
  signal mem_addr : addr_t;
  signal mem_wr_d : data_t;
  signal mem_rd_d : data_t;
  signal mem_wr_en : std_logic;
  signal mem_rd_en : std_logic;
  signal dbg_reg : data_t;
  signal pc_addr_int : integer range 0 to 255;

  type mem_t is array(0 to 255) of data_t;
  signal prog_mem : mem_t := (
     0 => x"00", 1 => x"01", 2 => x"00", 3 => x"02",
     4 => x"00", 5 => x"00", 6 => x"00", 7 => x"00",
     8 => x"00", 9 => x"01", 10 => x"00", 11 => x"00",
    12 => x"00", 13 => x"07", 14 => x"00", 15 => x"00",
    others => x"00"
   );
  signal data_mem : mem_t := (
     0 => x"0A", 1 => x"0B", others => (others => '0')
   );
begin
  clk <= not clk after CLK_PERIOD / 2;

  dut : entity work.cpu_core
    generic map (MEM_DEPTH => 256)
    port map (
      clk       => clk,
      rst       => rst,
      pc_addr   => pc_addr,
      pc_data   => pc_data,
      mem_addr  => mem_addr,
      mem_wr_d  => mem_wr_d,
      mem_rd_d  => mem_rd_d,
      mem_wr_en => mem_wr_en,
      mem_rd_en => mem_rd_en,
      dbg_reg   => dbg_reg
    );

  -- Safe program memory interface to avoid unchecked indexing
  proc_mem_if : process(pc_addr)
    variable idx : integer range 0 to 255;
  begin
    if unsigned(pc_addr) < 256 then
      idx := to_integer(unsigned(pc_addr));
      pc_data <= prog_mem(idx);
    else
      pc_data <= (others => '0');
    end if;
  end process proc_mem_if;

  -- Safe data memory interface to avoid unchecked indexing
  data_mem_if : process(mem_addr)
    variable idx : integer range 0 to 255;
  begin
    if unsigned(mem_addr) < 256 then
      idx := to_integer(unsigned(mem_addr));
      mem_rd_d <= data_mem(idx);
    else
      mem_rd_d <= (others => '0');
    end if;
  end process data_mem_if;

  -- Monitor pc_addr_int for assertions
  pc_addr_int <= to_integer(unsigned(pc_addr)) when unsigned(pc_addr) < 256 else 255;

  stim_proc : process
    variable pass_count : integer := 0;
    variable fail_count : integer := 0;
  begin
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    wait for 20 ns;

    wait until rising_edge(clk);
    assert (pc_addr_int = 0) report "PC not at 0 after reset" severity error;

    wait until rising_edge(clk);
    assert (pc_addr_int = 1) report "PC not incremented" severity error;

    wait for 200 ns;
    assert (dbg_reg = x"0B") report "Expected R1 to be 0Bh" severity error;

    pass_count := 1;
    report "Simulation passed: " & integer'image(pass_count) & " checks passed." severity note;
    std.env.stop(0);
    wait;
  end process stim_proc;
end architecture sim;
