library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity regfile is
  port (
    clk_i, rst_i : in std_logic;
    we_i         : in std_logic;
    addr_i       : in integer range 0 to 7;
    src_i        : in integer range 0 to 7;
    data_i       : in cpu_t;
    src_o        : out cpu_t
  );
end entity regfile;

architecture rtl of regfile is
  signal regs : reg_file_t := (others => (others => '0'));
begin
  process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        regs <= (others => (others => '0'));
      elsif we_i = '1' then
        regs(addr_i) <= data_i;
      end if;
    end if;
  end process;
  
  src_o <= regs(src_i);
end architecture rtl;
