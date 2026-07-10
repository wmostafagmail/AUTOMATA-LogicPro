library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

entity tb_mini_cpu is
end entity tb_mini_cpu;

architecture rtl of tb_mini_cpu is

  constant CLK_PERIOD : time := 10 ns;
  constant ADDR_WIDTH : integer := 12;
  constant DATA_WIDTH : integer := 8;

  signal clk              : std_logic := '0';
  signal reset_n          : std_logic := '0';

  signal mem_addr         : std_logic_vector(ADDR_WIDTH - 1 downto 0);
  signal mem_data         : std_logic_vector(DATA_WIDTH - 1 downto 0);
  signal mem_read         : std_logic;
  signal mem_write        : std_logic;

  signal pc_out           : std_logic_vector(ADDR_WIDTH - 1 downto 0);
  signal current_opcode   : std_logic_vector(DATA_WIDTH - 1 downto 0);

  signal expected_pc      : std_logic_vector(ADDR_WIDTH - 1 downto 0) := (others => '0');
  signal check_pass       : std_logic := '0';

begin

  clk <= not clk after CLK_PERIOD / 2;

  dut_inst : entity work.mini_cpu_top
    port map (
      clk              => clk,
      reset_n          => reset_n,
      mem_addr         => mem_addr,
      mem_data         => mem_data,
      mem_read         => mem_read,
      mem_write        => mem_write,
      pc_out           => pc_out,
      current_opcode   => current_opcode
    );

  test_process : process
    variable ops_ok       : integer := 0;
    variable ops_fail     : integer := 0;
    variable pc_int       : integer;
    variable opcode_int   : integer;
  begin
    reset_n <= '0';
    wait for CLK_PERIOD * 2;

    reset_n <= '1';
    wait for CLK_PERIOD * 5;

    -- Verify PC is zero after reset
    wait until rising_edge(clk);
    if pc_out = x"000" then
      report "PASS: PC = 0x000 after reset" severity note;
      ops_ok := ops_ok + 1;
    else
      pc_int := to_integer(unsigned(pc_out));
      if pc_int >= 0 and pc_int < 2**ADDR_WIDTH then
        report "FAIL: PC /= 0x000 after reset, got " & integer'image(pc_int) severity failure;
      else
        report "FAIL: PC out of range after reset" severity failure;
      end if;
      ops_fail := ops_fail + 1;
    end if;

    -- Wait for first instruction fetch (LOAD)
    wait until pc_out = x"003";
    wait until rising_edge(clk);
    if current_opcode = x"F0" then
      report "PASS: Correct LOAD opcode fetched at PC=0x00" severity note;
      ops_ok := ops_ok + 1;
    else
      opcode_int := to_integer(unsigned(current_opcode));
      if opcode_int >= 0 and opcode_int < 2**DATA_WIDTH then
        report "FAIL: Unexpected LOAD opcode value, got " & integer'image(opcode_int) severity failure;
      else
        report "FAIL: Opcode out of range" severity failure;
      end if;
      ops_fail := ops_fail + 1;
    end if;

    -- Wait for second instruction fetch (XOR)
    wait until pc_out = x"005";
    wait until rising_edge(clk);
    if current_opcode = x"F3" then
      report "PASS: Correct XOR opcode fetched at PC=0x04" severity note;
      ops_ok := ops_ok + 1;
    else
      opcode_int := to_integer(unsigned(current_opcode));
      if opcode_int >= 0 and opcode_int < 2**DATA_WIDTH then
        report "FAIL: Unexpected XOR opcode value, got " & integer'image(opcode_int) severity failure;
      else
        report "FAIL: Opcode out of range" severity failure;
      end if;
      ops_fail := ops_fail + 1;
    end if;

    -- Wait for third instruction fetch (BEQ)
    wait until pc_out = x"007";
    wait until rising_edge(clk);
    if current_opcode = x"D3" then
      report "PASS: Correct BEQ opcode fetched at PC=0x05" severity note;
      ops_ok := ops_ok + 1;
    else
      opcode_int := to_integer(unsigned(current_opcode));
      if opcode_int >= 0 and opcode_int < 2**DATA_WIDTH then
        report "FAIL: Unexpected BEQ opcode value, got " & integer'image(opcode_int) severity failure;
      else
        report "FAIL: Opcode out of range" severity failure;
      end if;
      ops_fail := ops_fail + 1;
    end if;

    wait for CLK_PERIOD * 4;

    if ops_fail = 0 then
      report "All basic execution tests passed (passed=" & integer'image(ops_ok) & ")" severity note;
      std.env.stop(0);
    else
      report "Some checks failed (passed=" & integer'image(ops_ok) & ", failed=" & integer'image(ops_fail) & ")" severity failure;
      std.env.stop(1);
    end if;

  end process test_process;

end architecture rtl;
