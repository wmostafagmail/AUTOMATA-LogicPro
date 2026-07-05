library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.alu_pkg.all;
use std.env.all;

entity alu_tb is
end entity alu_tb;

architecture tb of alu_tb is

  constant TB_CLK_PERIOD : time := 10 ns;

  signal clk_i    : std_logic := '0';
  signal rst_ni   : std_logic := '0';
  signal op_i     : std_logic_vector(opcode_index_t'range);
  signal a_i      : std_logic_vector(ALU_DATA_WIDTH - 1 downto 0);
  signal b_i      : std_logic_vector(ALU_DATA_WIDTH - 1 downto 0);
  signal result_o : std_logic_vector(ALU_DATA_WIDTH - 1 downto 0);
  signal zero_o   : std_logic;

  signal test_failed : boolean := false;
  signal pass_count  : integer := 0;
  signal fail_count  : integer := 0;

  procedure check_result(
    constant msg_name     : in string;
    constant actual_val   : in std_logic_vector(ALU_DATA_WIDTH - 1 downto 0);
    constant expected_val : in std_logic_vector(ALU_DATA_WIDTH - 1 downto 0);
    constant actual_zero  : in std_logic;
    constant expected_zero: in std_logic;
    variable out_test_failed : inout boolean
  ) is
  begin
    if actual_val = expected_val and actual_zero = expected_zero then
      report msg_name & " PASS" severity note;
      pass_count <= pass_count + 1;
    else
      report msg_name &
        " FAIL: got result=" & integer'image(to_integer(unsigned(actual_val))) &
        " zero=" & std_logic'image(actual_zero) &
        " expected result=" & integer'image(to_integer(unsigned(expected_val))) &
        " zero=" & std_logic'image(expected_zero) severity error;
      out_test_failed := true;
      fail_count <= fail_count + 1;
    end if;
  end procedure check_result;

begin

  clk_proc : process is
  begin
    clk_i <= '0';
    wait for TB_CLK_PERIOD / 2;
    clk_i <= '1';
    wait for TB_CLK_PERIOD / 2;
  end process clk_proc;

  stim_proc : process
    variable local_failed : boolean;
  begin
    -- Apply reset
    rst_ni <= '0';
    op_i   <= (others => '0');
    a_i    <= (others => '0');
    b_i    <= (others => '0');
    wait for TB_CLK_PERIOD * 3;

    local_failed := false;

    -- Release reset and observe zero flag on reset value
    rst_ni <= '1';
    wait until rising_edge(clk_i);
    check_result(
      msg_name     => "RESET",
      actual_val   => result_o,
      expected_val => x"00",
      actual_zero  => zero_o,
      expected_zero=> '1',
      out_test_failed => local_failed
    );

    -- ADD: 1 + 2 = 3
    op_i <= to_std_logic_vector(0, opcode_index_t'length);
    a_i  <= x"01";
    b_i  <= x"02";
    wait until rising_edge(clk_i);
    check_result(
      msg_name     => "ADD_1_2",
      actual_val   => result_o,
      expected_val => x"03",
      actual_zero  => zero_o,
      expected_zero=> '0',
      out_test_failed => local_failed
    );

    -- SUB: 5 - 3 = 2
    op_i <= to_std_logic_vector(1, opcode_index_t'length);
    a_i  <= x"05";
    b_i  <= x"03";
    wait until rising_edge(clk_i);
    check_result(
      msg_name     => "SUB_5_3",
      actual_val   => result_o,
      expected_val => x"02",
      actual_zero  => zero_o,
      expected_zero=> '0',
      out_test_failed => local_failed
    );

    -- AND: &HFF and &HF0 = &HF0
    op_i <= to_std_logic_vector(2, opcode_index_t'length);
    a_i  <= x"FF";
    b_i  <= x"F0";
    wait until rising_edge(clk_i);
    check_result(
      msg_name     => "AND_FF_F0",
      actual_val   => result_o,
      expected_val => x"F0",
      actual_zero  => zero_o,
      expected_zero=> '0',
      out_test_failed => local_failed
    );

    -- OR: &H0F or &HF0 = &HFf
    op_i <= to_std_logic_vector(3, opcode_index_t'length);
    a_i  <= x"0F";
    b_i  <= x"F0";
    wait until rising_edge(clk_i);
    check_result(
      msg_name     => "OR_0F_F0",
      actual_val   => result_o,
      expected_val => x"FF",
      actual_zero  => zero_o,
      expected_zero=> '0',
      out_test_failed => local_failed
    );

    -- XOR: &HA5 xor &H5A = &HFF
    op_i <= to_std_logic_vector(4, opcode_index_t'length);
    a_i  <= x"A5";
    b_i  <= x"5A";
    wait until rising_edge(clk_i);
    check_result(
      msg_name     => "XOR_A5_5A",
      actual_val   => result_o,
      expected_val => x"FF",
      actual_zero  => zero_o,
      expected_zero=> '0',
      out_test_failed => local_failed
    );

    -- NOT: not &HAA = &H55
    op_i <= to_std_logic_vector(5, opcode_index_t'length);
    a_i  <= x"AA";
    b_i  <= (others => '0');
    wait until rising_edge(clk_i);
    check_result(
      msg_name     => "NOT_AA",
      actual_val   => result_o,
      expected_val => x"55",
      actual_zero  => zero_o,
      expected_zero=> '0',
      out_test_failed => local_failed
    );

    -- SLA: &H01 << 3 = &H08
    op_i <= to_std_logic_vector(6, opcode_index_t'length);
    a_i  <= x"01";
    b_i  <= x"03";
    wait until rising_edge(clk_i);
    check_result(
      msg_name     => "SLA_01_3",
      actual_val   => result_o,
      expected_val => x"08",
      actual_zero  => zero_o,
      expected_zero=> '0',
      out_test_failed => local_failed
    );

    -- SRA: &H20 >> 2 = &H08
    op_i <= to_std_logic_vector(7, opcode_index_t'length);
    a_i  <= x"20";
    b_i  <= x"02";
    wait until rising_edge(clk_i);
    check_result(
      msg_name     => "SRA_20_2",
      actual_val   => result_o,
      expected_val => x"08",
      actual_zero  => zero_o,
      expected_zero=> '0',
      out_test_failed => local_failed
    );

    if not local_failed then
      report "Test bench passed successfully." severity note;
      std.env.stop(0);
    else
      report "Test bench FAILED with errors." severity failure;
      std.env.stop(1);
    end if;

  end process stim_proc;

end architecture tb;