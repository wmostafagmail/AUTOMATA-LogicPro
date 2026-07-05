library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;
use std.env.all;

entity tb_alu is
end entity tb_alu;

architecture sim of tb_alu is
  constant CLK_PERIOD : time := 10 ns;
  signal clk : std_logic := '0';
  signal rst : std_logic := '0';
  signal a : std_logic_vector(7 downto 0);
  signal b : std_logic_vector(7 downto 0);
  signal opcode : std_logic_vector(3 downto 0);
  signal result : std_logic_vector(7 downto 0);
  signal zero : std_logic;
  signal carry : std_logic;
  signal overflow : std_logic;
  
  signal test_failed : std_logic := '0';
  signal pass_count : integer := 0;
  signal fail_count : integer := 0;
begin
  clk <= not clk after CLK_PERIOD / 2;

  dut : entity work.alu(rtl)
    generic map (DATA_WIDTH => 8)
    port map (
      a => a, b => b, opcode => opcode, clk => clk, rst => rst,
      result => result, zero => zero, carry => carry, overflow => overflow
    );

  stim_proc : process
    variable exp_res : unsigned(7 downto 0);
    variable exp_zero : std_logic;
  begin
    rst <= '1';
    a <= (others => '0');
    b <= (others => '0');
    opcode <= OP_ADD;
    wait for 20 ns;
    rst <= '0';
    wait for 10 ns;

    -- Test 1: 1 + 2 = 3
    a <= "00000001";
    b <= "00000010";
    opcode <= OP_ADD;
    wait for 10 ns;
    exp_res := alu_golden(unsigned(a), unsigned(b), op_code_t'(opcode));
    exp_zero := '1' when exp_res = 0 else '0';
    if std_logic_vector(exp_res) = result and exp_zero = zero then
      pass_count <= pass_count + 1;
    else
      fail_count <= fail_count + 1;
      test_failed <= '1';
    end if;
    wait for 10 ns;

    -- Test 2: 5 - 3 = 2
    a <= "00000101";
    b <= "00000011";
    opcode <= OP_SUB;
    wait for 10 ns;
    exp_res := alu_golden(unsigned(a), unsigned(b), op_code_t'(opcode));
    exp_zero := '1' when exp_res = 0 else '0';
    if std_logic_vector(exp_res) = result and exp_zero = zero then
      pass_count <= pass_count + 1;
    else
      fail_count <= fail_count + 1;
      test_failed <= '1';
    end if;
    wait for 10 ns;

    -- Test 3: 0xFF AND 0x0F = 0x0F
    a <= "11111111";
    b <= "00001111";
    opcode <= OP_AND;
    wait for 10 ns;
    exp_res := alu_golden(unsigned(a), unsigned(b), op_code_t'(opcode));
    exp_zero := '1' when exp_res = 0 else '0';
    if std_logic_vector(exp_res) = result and exp_zero = zero then
      pass_count <= pass_count + 1;
    else
      fail_count <= fail_count + 1;
      test_failed <= '1';
    end if;
    wait for 10 ns;

    -- Test 4: 0x01 SHL 0x02 = 0x04
    a <= "00000001";
    b <= "00000010";
    opcode <= OP_SHL;
    wait for 10 ns;
    exp_res := alu_golden(unsigned(a), unsigned(b), op_code_t'(opcode));
    exp_zero := '1' when exp_res = 0 else '0';
    if std_logic_vector(exp_res) = result and exp_zero = zero then
      pass_count <= pass_count + 1;
    else
      fail_count <= fail_count + 1;
      test_failed <= '1';
    end if;
    wait for 10 ns;

    wait;
  end process stim_proc;

  monitor_proc : process
  begin
    wait until test_failed = '1';
    report "TEST FAILED" severity failure;
  end process monitor_proc;

  finish_proc : process
  begin
    wait until test_failed = '0' and pass_count > 0;
    wait for 10 ns;
    if fail_count = 0 then
      report "ALL TESTS PASSED" severity note;
      std.env.stop(0);
    else
      report "SOME TESTS FAILED" severity failure;
    end if;
  end process finish_proc;

end architecture sim;