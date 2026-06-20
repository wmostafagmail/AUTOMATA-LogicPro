library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.avr_pkg.all;

entity avr_alu is
  port (
    lhs_i        : in  byte_t;
    rhs_i        : in  byte_t;
    carry_in_i   : in  std_logic;
    bit_in_i     : in  std_logic;
    op_i         : in  alu_op_t;
    result_lo_o  : out byte_t;
    result_hi_o  : out byte_t;
    flags_next_o : out sreg_t
  );
end entity;

architecture rtl of avr_alu is
begin
  process(lhs_i, rhs_i, carry_in_i, bit_in_i, op_i)
    variable lhs_u    : unsigned(7 downto 0);
    variable rhs_u    : unsigned(7 downto 0);
    variable sum9_v   : unsigned(8 downto 0);
    variable diff9_v  : unsigned(8 downto 0);
    variable res_lo_v : byte_t;
    variable res_hi_v : byte_t;
    variable flags_v  : sreg_t;
    variable c_in_v   : unsigned(8 downto 0);
    variable res_u_v  : unsigned(7 downto 0);
  begin
    lhs_u    := unsigned(lhs_i);
    rhs_u    := unsigned(rhs_i);
    res_lo_v := (others => '0');
    res_hi_v := (others => '0');
    flags_v  := (others => '0');
    c_in_v   := (others => '0');

    if carry_in_i = '1' then
      c_in_v(0) := '1';
    end if;

    case op_i is
      when ALU_PASS_RR =>
        res_lo_v := rhs_i;
      when ALU_PASS_IMM =>
        res_lo_v := rhs_i;
      when ALU_ADD =>
        sum9_v := unsigned('0' & lhs_i) + unsigned('0' & rhs_i);
        res_lo_v := std_logic_vector(sum9_v(7 downto 0));
        flags_v(0) := sum9_v(8);
      when ALU_ADC =>
        sum9_v := unsigned('0' & lhs_i) + unsigned('0' & rhs_i) + c_in_v;
        res_lo_v := std_logic_vector(sum9_v(7 downto 0));
        flags_v(0) := sum9_v(8);
      when ALU_SUB =>
        diff9_v := unsigned('0' & lhs_i) - unsigned('0' & rhs_i);
        res_lo_v := std_logic_vector(diff9_v(7 downto 0));
        flags_v(0) := diff9_v(8);
      when ALU_SBC =>
        diff9_v := unsigned('0' & lhs_i) - unsigned('0' & rhs_i) - c_in_v;
        res_lo_v := std_logic_vector(diff9_v(7 downto 0));
        flags_v(0) := diff9_v(8);
      when ALU_AND =>
        res_lo_v := lhs_i and rhs_i;
      when ALU_OR =>
        res_lo_v := lhs_i or rhs_i;
      when ALU_EOR =>
        res_lo_v := lhs_i xor rhs_i;
      when ALU_COM =>
        res_lo_v := not lhs_i;
        flags_v(0) := '1';
      when ALU_NEG =>
        diff9_v := to_unsigned(0, diff9_v'length) - unsigned('0' & lhs_i);
        res_lo_v := std_logic_vector(diff9_v(7 downto 0));
        flags_v(0) := diff9_v(8);
      when ALU_INC =>
        res_lo_v := std_logic_vector(lhs_u + 1);
      when ALU_DEC =>
        res_lo_v := std_logic_vector(lhs_u - 1);
      when ALU_LSL =>
        res_lo_v := lhs_i(6 downto 0) & '0';
        flags_v(0) := lhs_i(7);
      when ALU_LSR =>
        res_lo_v := '0' & lhs_i(7 downto 1);
        flags_v(0) := lhs_i(0);
      when ALU_ROL =>
        res_lo_v := lhs_i(6 downto 0) & carry_in_i;
        flags_v(0) := lhs_i(7);
      when ALU_ROR =>
        res_lo_v := carry_in_i & lhs_i(7 downto 1);
        flags_v(0) := lhs_i(0);
      when ALU_ASR =>
        res_lo_v := lhs_i(7) & lhs_i(7 downto 1);
        flags_v(0) := lhs_i(0);
      when ALU_SWAP =>
        res_lo_v := lhs_i(3 downto 0) & lhs_i(7 downto 4);
      when ALU_BIT_BLEND =>
        res_lo_v := lhs_i;
        res_lo_v(to_integer(unsigned(rhs_i(2 downto 0)))) := bit_in_i;
      when ALU_ADIW =>
        res_u_v := lhs_u + rhs_u;
        res_lo_v := std_logic_vector(res_u_v);
        res_hi_v := (others => '0');
      when others =>
        null;
    end case;

    if op_i /= ALU_NOP then
      if res_lo_v = x"00" then
        flags_v(1) := '1';
      else
        flags_v(1) := '0';
      end if;
      flags_v(2) := res_lo_v(7);
      flags_v(4) := bit_in_i;
      flags_v(7) := carry_in_i;
    end if;

    result_lo_o  <= res_lo_v;
    result_hi_o  <= res_hi_v;
    flags_next_o <= flags_v;
  end process;
end architecture;
