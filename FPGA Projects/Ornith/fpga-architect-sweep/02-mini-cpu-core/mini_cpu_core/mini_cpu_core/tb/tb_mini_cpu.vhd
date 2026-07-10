library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.mini_cpu_pkg.all;
use std.env.all;

entity tb_mini_cpu is
end entity tb_mini_cpu;

architecture rtl of tb_mini_cpu is

  constant CLK_PERIOD : time := 10 ns;
  constant ADDR_WIDTH : integer := 12;
  constant DATA_WIDTH : integer := 8;

  signal clk              : std_logic := '0';
  signal reset_n          : std_logic := '0';

  -- Program memory interface
  signal prog_read_addr   : std_logic_vector(PC_WIDTH - 1 downto 0);
  signal prog_read_en     : std_logic;
  signal prog_data_in     : std_logic_vector(DATA_WIDTH - 1 downto 0);

  -- Data memory interface
  signal data_addr        : std_logic_vector(ADDR_WIDTH - 1 downto 0);
  signal data_write_en    : std_logic;
  signal data_read_en     : std_logic;
  signal data_write_data  : std_logic_vector(DATA_WIDTH - 1 downto 0);
  signal data_data_out    : std_logic_vector(DATA_WIDTH - 1 downto 0) := (others => 'Z');

  -- Debug outputs
  signal pc_out           : std_logic_vector(PC_WIDTH - 1 downto 0);
  signal current_opcode   : opcode_t;
  signal zero_flag_out    : std_logic;

begin

  clk <= not clk after CLK_PERIOD / 2;

  -- Program memory instance driven by the testbench
  prog_mem_inst : entity work.program_mem
    generic map (
      ADDR_WIDTH => ADDR_WIDTH,
      DATA_WIDTH => DATA_WIDTH
    )
    port map (
      clk        => clk,
      read_addr  => prog_read_addr,
      read_en    => prog_read_en,
      data_out   => prog_data_in
    );

  -- Data memory instance driven by the testbench
  data_mem_inst : entity work.data_mem
    generic map (
      ADDR_WIDTH => ADDR_WIDTH,
      DATA_WIDTH => DATA_WIDTH
    )
    port map (
      clk        => clk,
      addr       => data_addr,
      write_en   => data_write_en,
      read_en    => data_read_en,
      write_data => data_write_data,
      data_out   => data_data_out
    );

  dut_inst : entity work.mini_cpu_top
    port map (
      clk                => clk,
      reset_n            => reset_n,
      prog_read_addr     => prog_read_addr,
      prog_read_en       => prog_read_en,
      prog_data_in       => prog_data_in,
      data_addr          => data_addr,
      data_write_en      => data_write_en,
      data_read_en       => data_read_en,
      data_write_data    => data_write_data,
      data_data_out      => data_data_out,
      pc_out             => pc_out,
      current_opcode_out => current_opcode,
      zero_flag_out      => zero_flag_out
    );

  test_process : process
    variable pass_count : integer := 0;
    variable fail_count : integer := 0;
    variable check_pass : boolean;
    variable msg        : string(1 to 80);
  begin
    -- Reset the design.
    reset_n <= '0';
    wait for CLK_PERIOD * 2;

    reset_n <= '1';
    wait for CLK_PERIOD * 5;

    -- Check initial PC is 0 after reset.
    wait until pc_out = std_logic_vector(to_unsigned(0, ADDR_WIDTH));
    check_pass := (pc_out = std_logic_vector(to_unsigned(0, ADDR_WIDTH)));
    if check_pass then
      pass_count := pass_count + 1;
      msg := "PASS: PC=0x000 after reset";
      report msg severity note;
    else
      fail_count := fail_count + 1;
      msg := "FAIL: unexpected PC after reset";
      report msg severity failure;
    end if;

    -- Wait for first fetch cycle to complete (PC should advance past address 0).
    wait until unsigned(pc_out) > 0;
    wait until rising_edge(clk);

    -- Check that we are fetching an ADD instruction at PC=1.
    check_pass := current_opcode = OP_ADD;
    if check_pass then
      pass_count := pass_count + 1;
      msg := "PASS: PC=0x001 fetched ADD opcode";
      report msg severity note;
    else
      fail_count := fail_count + 1;
      msg := "FAIL: unexpected opcode at PC=0x001, got=" & integer'image(to_integer(unsigned(current_opcode)));
      report msg severity failure;
    end if;

    -- Wait for the LOAD instruction to be fetched (PC should reach address 2).
    wait until unsigned(pc_out) >= 2;
    wait until rising_edge(clk);

    -- Check that we are fetching a LOAD instruction at PC=2.
    check_pass := current_opcode = OP_LOAD;
    if check_pass then
      pass_count := pass_count + 1;
      msg := "PASS: PC=0x002 fetched LOAD opcode";
      report msg severity note;
    else
      fail_count := fail_count + 1;
      msg := "FAIL: unexpected opcode at PC=0x002, got=" & integer'image(to_integer(unsigned(current_opcode)));
      report msg severity failure;
    end if;

    -- Wait for the LOAD to complete (PC should advance past address 3).
    wait until unsigned(pc_out) > 3;
    wait until rising_edge(clk);

    -- Check that we are fetching an ADD instruction at PC=4.
    check_pass := current_opcode = OP_ADD;
    if check_pass then
      pass_count := pass_count + 1;
      msg := "PASS: PC=0x004 fetched ADD opcode";
      report msg severity note;
    else
      fail_count := fail_count + 1;
      msg := "FAIL: unexpected opcode at PC=0x004, got=" & integer'image(to_integer(unsigned(current_opcode)));
      report msg severity failure;
    end if;

    -- Wait for the XOR instruction to be fetched (PC should reach address 6).
    wait until unsigned(pc_out) >= 6;
    wait until rising_edge(clk);

    -- Check that we are fetching an XOR instruction at PC=6.
    check_pass := current_opcode = OP_XOR_OP;
    if check_pass then
      pass_count := pass_count + 1;
      msg := "PASS: PC=0x006 fetched XOR opcode";
      report msg severity note;
    else
      fail_count := fail_count + 1;
      msg := "FAIL: unexpected opcode at PC=0x006, got=" & integer'image(to_integer(unsigned(current_opcode)));
      report msg severity failure;
    end if;

    -- Wait for the XOR to complete (PC should advance past address 7).
    wait until unsigned(pc_out) > 7;
    wait until rising_edge(clk);

    -- Check that we are fetching a BEQ instruction at PC=8.
    check_pass := current_opcode = OP_BEQ;
    if check_pass then
      pass_count := pass_count + 1;
      msg := "PASS: PC=0x008 fetched BEQ opcode";
      report msg severity note;
    else
      fail_count := fail_count + 1;
      msg := "FAIL: unexpected opcode at PC=0x008, got=" & integer'image(to_integer(unsigned(current_opcode)));
      report msg severity failure;
    end if;

    -- Wait for a few more cycles to allow execution.
    wait for CLK_PERIOD * 4;

    -- Check that PC advanced past the initial fetch sequence (should be >= 10 due to branch).
    check_pass := unsigned(pc_out) >= 8;
    if check_pass then
      pass_count := pass_count + 1;
      msg := "PASS: PC advanced to address " & integer'image(to_integer(unsigned(pc_out)));
      report msg severity note;
    else
      fail_count := fail_count + 1;
      msg := "FAIL: PC did not advance from initial fetch";
      report msg severity failure;
    end if;

    -- Report final results.
    if fail_count = 0 then
      msg := "All checks passed (passed=" & integer'image(pass_count) & ", failed=0)";
      report msg severity note;
      std.env.stop(0);
    else
      msg := "Some checks failed (passed=" & integer'image(pass_count) & ", failed=" & integer'image(fail_count) & ")";
      report msg severity failure;
      std.env.stop(1);
    end if;

  end process test_process;

end architecture rtl;