library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.cpu_pkg.all;

entity register_file is
  port (
    clk        : in  std_logic;
    reset      : in  std_logic;
    read_addr_a: in  reg_idx_t;
    read_addr_b: in  reg_idx_t;
    read_data_a: out byte_t;
    read_data_b: out byte_t;
    write_en   : in  std_logic;
    write_addr : in  reg_idx_t;
    write_data : in  byte_t
  );
end entity;

architecture rtl of register_file is
  type reg_array_t is array (0 to 7) of byte_t;
  signal regs : reg_array_t := (others => (others => '0'));
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        regs <= (others => (others => '0'));
      elsif write_en = '1' then
        regs(to_integer(unsigned(write_addr))) <= write_data;
      end if;
    end if;
  end process;

  read_data_a <= regs(to_integer(unsigned(read_addr_a)));
  read_data_b <= regs(to_integer(unsigned(read_addr_b)));
end architecture;
