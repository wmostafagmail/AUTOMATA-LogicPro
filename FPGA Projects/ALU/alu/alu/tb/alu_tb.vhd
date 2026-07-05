library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;

entity alu_tb is
end entity alu_tb;

architecture sim of alu_tb is
  constant CLK_PERIOD : time := 10 ns; -- 100 MHz
  signal clk : std_logic := '0';
  signal rst : std_logic := '0';
  signal opcode : alu_op_t := OP_ADD;
  signal a : std_logic_vector(7 downto 0) := (others => '0');
  signal b : std_logic_vector(7 downto 0) := (others => '0');
  signal result : std_logic_vector(7 downto 0);
  signal flags : alu_flags_t;
  
  procedure check_result(expected : std_logic_vector; actual : std_logic_vector; msg : string) is
  begin
    assert actual = expected report msg severity error;
  end procedure;

begin
  -- Clock Generator
  clk <= not clk after CLK_PERIOD/2;

  -- DUT Instantiation
  dut : entity work.alu(rtl)
    generic map ( WIDTH => 8 )
    port map (
      clk => clk,
      rst => rst,
      opcode => opcode,
      a => a,
      b => b,
      result => result,
      flags => flags
    );

  -- Stimulus Process
  stim : process
  begin
    -- Initialization
    wait for 20 ns;
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    wait for CLK_PERIOD;

    -- Test ADD
    opcode <= OP_ADD;
    a <= "00000001";
    b <= "00000010";
    wait for CLK_PERIOD;
    check_result("00000011", result, "ADD: 1+2 failed");

    -- Test SUB
    opcode <= OP_SUB;
    a <= "00000010";
    b <= "00000001";
    wait for CLK_PERIOD;
    check_result("00000001", result, "SUB: 2-1 failed");

    -- Test AND
    opcode <= OP_AND;
    a <= "11110000";
    b <= "10101010";
    wait for CLK_PERIOD;
    check_result("10100000", result, "AND: failed");

    -- Test OR
    opcode <= OP_OR;
    a <= "11110000";
    b <= "00001111";
    wait for CLK_PERIOD;
    check_result("11111111", result, "OR: failed");

    -- Test XOR
    opcode <= OP_XOR;
    a <= "11110000";
    b <= "00001111";
    wait for CLK_PERIOD;
    check_result("11111111", result, "XOR: failed");

    -- Test NOT
    opcode <= OP_NOT;
    a <= "11110000";
    b <= "00000000"; -- Don't care
    wait for CLK_PERIOD;
    check_result("00001111", result, "NOT: failed");

    -- Test SLL
    opcode <= OP_SLL;
    a <= "00000001";
    b <= "00000001"; -- Shift by 1
    wait for CLK_PERIOD;
    check_result("00000010", result, "SLL: failed");

    -- Test SRL
    opcode <= OP_SRL;
    a <= "00000010";
    b <= "00000001"; -- Shift by 1
    wait for CLK_PERIOD;
    check_result("00000001", result, "SRL: failed");

    -- End Simulation
    wait for CLK_PERIOD;
    std.env.stop(0);
  end process;
end architecture sim;