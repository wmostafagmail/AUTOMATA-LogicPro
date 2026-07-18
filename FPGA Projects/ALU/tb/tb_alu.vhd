library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.alu_pkg.all;
use std.env.all;

entity tb_alu is
end entity;

architecture sim of tb_alu is
  signal clk              : std_logic := '0';
  signal rst              : std_logic := '1';
  signal a_in_sig        : data_t := (others => '0');
  signal b_in_sig        : data_t := (others => '0');
  signal op_sel_sig       : alu_op_t := OP_DEFAULT;
  signal result          : data_t;
  signal zero             : std_logic;
  signal carry            : std_logic;
  signal overflow         : std_logic;

  procedure check_eq(constant label_text : in string; constant got            : in data_t; constant expected       : in data_t; variable failed_io : inout boolean) is
  begin
    if got /= expected then
      failed_io := true;
      report "FAIL " & label_text severity error;
    end if;
  end procedure;

  procedure check_eq_sl(
  constant label_text : in string;
  constant got : in std_logic;
  constant expected : in std_logic;
  variable failed_io : inout boolean
) is
begin
  if got /= expected then
    failed_io := true;
    report "FAIL " & label_text severity error;
  end if;
end procedure check_eq_sl;

begin
  clk <= not clk after 5 ns;

  dut : entity work.alu (rtl)
    port map (
      clk           => clk,
      rst           => rst,
      a_in_sig      => a_in_sig,
      b_in_sig      => b_in_sig,
      op_sel_sig    => op_sel_sig,
      result        => result,
      zero          => zero,
      carry         => carry,
      overflow      => overflow
     );

  stimulus : process
    variable failed : boolean := false;
    variable exp_res : data_t;
    variable exp_z    : std_logic;
    variable exp_c    : std_logic;
    variable exp_ov   : std_logic;
  begin
    wait until rising_edge(clk);
    rst <= '0';
    wait until rising_edge(clk);
    wait for 10 ns;

    check_eq("RESET_RESULT", result, (others => '0'), failed);
    check_eq_sl("RESET_ZERO", zero, '1', failed);
    check_eq_sl("RESET_CARRY", carry, '0', failed);
    check_eq_sl("RESET_OVERFLOW", overflow, '0', failed);

    op_sel_sig <= OP_ADD;
    a_in_sig <= to_unsigned(1, 8);
    b_in_sig <= to_unsigned(2, 8);
    wait until rising_edge(clk);
    wait for 2 ns;
    exp_res := to_unsigned(3, 8);
    exp_z := '0'; exp_c := '0'; exp_ov := '0';
    check_eq("ADD_RESULT", result, exp_res, failed);
    check_eq_sl("ADD_ZERO", zero, exp_z, failed);
    check_eq_sl("ADD_CARRY", carry, exp_c, failed);
    check_eq_sl("ADD_OVERFLOW", overflow, exp_ov, failed);

    op_sel_sig <= OP_SUB;
    a_in_sig <= to_unsigned(5, 8);
    b_in_sig <= to_unsigned(3, 8);
    wait until rising_edge(clk);
    wait for 2 ns;
    exp_res := to_unsigned(2, 8);
    exp_z := '0'; exp_c := '0'; exp_ov := '0';
    check_eq("SUB_RESULT", result, exp_res, failed);
    check_eq_sl("SUB_ZERO", zero, exp_z, failed);
    check_eq_sl("SUB_CARRY", carry, exp_c, failed);
    check_eq_sl("SUB_OVERFLOW", overflow, exp_ov, failed);

    op_sel_sig <= OP_AND;
    a_in_sig <= to_unsigned(16#FF#, 8);
    b_in_sig <= to_unsigned(16#0F#, 8);
    wait until rising_edge(clk);
    wait for 2 ns;
    exp_res := to_unsigned(16#0F#, 8);
    exp_z := '0'; exp_c := '0'; exp_ov := '0';
    check_eq("AND_RESULT", result, exp_res, failed);
    check_eq_sl("AND_ZERO", zero, exp_z, failed);
    check_eq_sl("AND_CARRY", carry, exp_c, failed);
    check_eq_sl("AND_OVERFLOW", overflow, exp_ov, failed);

    op_sel_sig <= OP_OR;
    a_in_sig <= to_unsigned(16#01#, 8);
    b_in_sig <= to_unsigned(16#02#, 8);
    wait until rising_edge(clk);
    wait for 2 ns;
    exp_res := to_unsigned(16#03#, 8);
    exp_z := '0'; exp_c := '0'; exp_ov := '0';
    check_eq("OR_RESULT", result, exp_res, failed);
    check_eq_sl("OR_ZERO", zero, exp_z, failed);
    check_eq_sl("OR_CARRY", carry, exp_c, failed);
    check_eq_sl("OR_OVERFLOW", overflow, exp_ov, failed);

    op_sel_sig <= OP_XOR;
    a_in_sig <= to_unsigned(16#AA#, 8);
    b_in_sig <= to_unsigned(16#55#, 8);
    wait until rising_edge(clk);
    wait for 2 ns;
    exp_res := to_unsigned(16#FF#, 8);
    exp_z := '0'; exp_c := '0'; exp_ov := '0';
    check_eq("XOR_RESULT", result, exp_res, failed);
    check_eq_sl("XOR_ZERO", zero, exp_z, failed);
    check_eq_sl("XOR_CARRY", carry, exp_c, failed);
    check_eq_sl("XOR_OVERFLOW", overflow, exp_ov, failed);

    op_sel_sig <= OP_NOT;
    a_in_sig <= to_unsigned(16#00#, 8);
    b_in_sig <= (others => '0');
    wait until rising_edge(clk);
    wait for 2 ns;
    exp_res := to_unsigned(16#FF#, 8);
    exp_z := '0'; exp_c := '0'; exp_ov := '0';
    check_eq("NOT_RESULT", result, exp_res, failed);
    check_eq_sl("NOT_ZERO", zero, exp_z, failed);
    check_eq_sl("NOT_CARRY", carry, exp_c, failed);
    check_eq_sl("NOT_OVERFLOW", overflow, exp_ov, failed);

    op_sel_sig <= OP_SLL;
    a_in_sig <= to_unsigned(1, 8);
    b_in_sig <= (others => '0');
    wait until rising_edge(clk);
    wait for 2 ns;
    exp_res := to_unsigned(2, 8);
    exp_z := '0'; exp_c := '0'; exp_ov := '0';
    check_eq("SLL_RESULT", result, exp_res, failed);
    check_eq_sl("SLL_ZERO", zero, exp_z, failed);
    check_eq_sl("SLL_CARRY", carry, exp_c, failed);
    check_eq_sl("SLL_OVERFLOW", overflow, exp_ov, failed);

    if failed then
      report "TEST FAILED" severity failure;
    else
      report "TEST PASSED" severity note;
      std.env.stop(0);
    end if;
  end process;
end architecture;