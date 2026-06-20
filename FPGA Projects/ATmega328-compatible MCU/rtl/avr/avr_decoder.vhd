library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.avr_pkg.all;

entity avr_decoder is
  port (
    instr_word0_i       : in  word_t;
    instr_word1_i       : in  word_t;
    instr_word1_valid_i : in  std_logic;
    dec_o               : out avr_decode_t
  );
end entity;

architecture rtl of avr_decoder is
begin
  process(instr_word0_i, instr_word1_i, instr_word1_valid_i)
    variable dec_v : avr_decode_t;
  begin
    dec_v := avr_decode_init;

    if instr_word0_i = x"0000" then
      dec_v.instr_kind := I_NOP;
    elsif instr_word0_i(15 downto 11) = "10110" then
      dec_v.instr_kind := I_IN;
      dec_v.rd_idx     := instr_word0_i(8 downto 4);
      dec_v.io_addr    := instr_word0_i(10 downto 9) & instr_word0_i(3 downto 0);
    elsif instr_word0_i(15 downto 11) = "10111" then
      dec_v.instr_kind := I_OUT;
      dec_v.rr_idx     := instr_word0_i(8 downto 4);
      dec_v.io_addr    := instr_word0_i(10 downto 9) & instr_word0_i(3 downto 0);
    elsif instr_word0_i(15 downto 10) = "000011" then
      dec_v.instr_kind := I_ADD;
      dec_v.rd_idx     := instr_word0_i(8 downto 4);
      dec_v.rr_idx     := instr_word0_i(9) & instr_word0_i(3 downto 0);
    elsif instr_word0_i(15 downto 10) = "000110" then
      dec_v.instr_kind := I_SUB;
      dec_v.rd_idx     := instr_word0_i(8 downto 4);
      dec_v.rr_idx     := instr_word0_i(9) & instr_word0_i(3 downto 0);
    elsif instr_word0_i(15 downto 10) = "000101" then
      dec_v.instr_kind := I_CP;
      dec_v.rd_idx     := instr_word0_i(8 downto 4);
      dec_v.rr_idx     := instr_word0_i(9) & instr_word0_i(3 downto 0);
    elsif instr_word0_i(15 downto 12) = "1100" then
      dec_v.instr_kind := I_RJMP;
      dec_v.branch_cond := BC_ALWAYS;
      dec_v.imm16      := std_logic_vector(resize(signed(instr_word0_i(11 downto 0)), 16));
    elsif instr_word0_i(15 downto 9) = "1001001" and instr_word0_i(3 downto 0) = "1111" then
      dec_v.instr_kind := I_PUSH;
      dec_v.rr_idx     := instr_word0_i(8 downto 4);
    elsif instr_word0_i(15 downto 9) = "1001000" and instr_word0_i(3 downto 0) = "1111" then
      dec_v.instr_kind := I_POP;
      dec_v.rd_idx     := instr_word0_i(8 downto 4);
    elsif instr_word0_i(15 downto 12) = "1110" then
      dec_v.instr_kind := I_LDI;
      dec_v.rd_idx     := '1' & instr_word0_i(7 downto 4);
      dec_v.imm8       := instr_word0_i(11 downto 8) & instr_word0_i(3 downto 0);
    elsif instr_word0_i(15 downto 10) = "001011" then
      dec_v.instr_kind := I_MOV;
      dec_v.rd_idx     := instr_word0_i(8 downto 4);
      dec_v.rr_idx     := instr_word0_i(9) & instr_word0_i(3 downto 0);
    else
      -- Placeholder policy: unsupported encodings are marked illegal until the
      -- full decode table is implemented.
      dec_v.instr_kind     := I_ILLEGAL;
      dec_v.decode_illegal := '1';
    end if;

    if instr_word0_i(15 downto 9) = "1001000" and instr_word0_i(3 downto 0) = "0000" then
      dec_v.is_32bit := '1';
      if instr_word1_valid_i = '1' then
        dec_v.imm16 := instr_word1_i;
      end if;
    end if;

    dec_o <= dec_v;
  end process;
end architecture;
