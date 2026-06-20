library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.cpu_pkg.all;
use work.prog_rom_init.all;

entity prog_rom is
  port (
    addr      : in  byte_t;
    instr_out : out word_t
  );
end entity;

architecture rtl of prog_rom is
begin
  instr_out <= PROGRAM_ROM(to_integer(unsigned(addr)));
end architecture;
