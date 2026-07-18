library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity rom is
  port (
    clk   : in  std_logic;
    addr  : in  addr_t;
    instr : out instr_t
  );
end entity rom;

architecture rtl of rom is
  constant INIT : prog_mem_t := (
    0 => (OP_ADD, to_unsigned(1, ADDR_WIDTH), to_unsigned(0, ADDR_WIDTH), to_unsigned(0, ADDR_WIDTH), (others => '0')),
    1 => (OP_ADD, to_unsigned(2, ADDR_WIDTH), to_unsigned(1, ADDR_WIDTH), to_unsigned(0, ADDR_WIDTH), (others => '0')),
    2 => (OP_AND, to_unsigned(3, ADDR_WIDTH), to_unsigned(1, ADDR_WIDTH), to_unsigned(0, ADDR_WIDTH), (others => '0')),
    3 => (OP_HALT, to_unsigned(0, ADDR_WIDTH), to_unsigned(0, ADDR_WIDTH), to_unsigned(0, ADDR_WIDTH), (others => '0')),
    others => (OP_HALT, (others => '0'), (others => '0'), (others => '0'), (others => '0'))
  );
begin
  process(clk)
    variable idx : integer;
  begin
    if rising_edge(clk) then
      idx := to_integer(addr);
      if idx >= 0 and idx < INIT'length then
        instr <= INIT(idx);
      end if;
    end if;
  end process;
end architecture rtl;
